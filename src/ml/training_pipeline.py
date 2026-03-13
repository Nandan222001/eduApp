from typing import Dict, List, Optional, Any
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
import pandas as pd
import numpy as np
import joblib
import json
import logging
from enum import Enum

from src.ml.data_pipeline import StudentPerformanceDataPipeline
from src.ml.feature_engineering import StudentFeatureEngineering
from src.ml.data_preparation import DataValidator, TrainingDataPreparation
from src.models.ml_prediction import (
    MLModel, MLModelVersion, ModelType, ModelStatus, PredictionType
)
from src.models.institution import Institution
from src.database import SessionLocal

logger = logging.getLogger(__name__)


class TrainingStatus(str, Enum):
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ModelRole(str, Enum):
    CHAMPION = "champion"
    CHALLENGER = "challenger"
    RETIRED = "retired"


class TrainingJobConfig:
    def __init__(
        self,
        institution_id: int,
        model_name: str,
        prediction_type: PredictionType,
        algorithm: str = 'random_forest',
        hyperparameters: Optional[Dict[str, Any]] = None,
        target_column: str = 'exam_percentage',
        training_frequency_days: int = 7,
        auto_promote: bool = True,
        promotion_threshold: float = 0.02,
        ab_test_traffic_split: float = 0.2,
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        test_size: float = 0.2,
        val_size: float = 0.1,
        cv_folds: int = 5,
        random_state: int = 42
    ):
        self.institution_id = institution_id
        self.model_name = model_name
        self.prediction_type = prediction_type
        self.algorithm = algorithm
        self.hyperparameters = hyperparameters or {}
        self.target_column = target_column
        self.training_frequency_days = training_frequency_days
        self.auto_promote = auto_promote
        self.promotion_threshold = promotion_threshold
        self.ab_test_traffic_split = ab_test_traffic_split
        self.start_date = start_date
        self.end_date = end_date
        self.test_size = test_size
        self.val_size = val_size
        self.cv_folds = cv_folds
        self.random_state = random_state


class MLTrainingPipeline:
    
    def __init__(self, db: Session):
        self.db = db
        self.data_pipeline = StudentPerformanceDataPipeline(db)
        self.feature_engineer = StudentFeatureEngineering()
        self.data_validator = DataValidator()
        self.logger = logging.getLogger(__name__)
    
    def train_new_model(
        self,
        config: TrainingJobConfig
    ) -> Dict[str, Any]:
        training_start = datetime.utcnow()
        
        try:
            self.logger.info(
                f"Starting training for institution {config.institution_id}, "
                f"model: {config.model_name}"
            )
            
            raw_data = self.data_pipeline.extract_all_data(
                institution_id=config.institution_id,
                start_date=config.start_date,
                end_date=config.end_date
            )
            
            if raw_data['students'].empty:
                raise ValueError("No student data available for training")
            
            feature_matrix = self.feature_engineer.build_feature_matrix(raw_data)
            
            if feature_matrix.empty:
                raise ValueError("Feature matrix is empty")
            
            quality_report = self.data_validator.check_data_quality(feature_matrix)
            
            data_prep = TrainingDataPreparation(random_state=config.random_state)
            
            splits = data_prep.prepare_training_data(
                feature_df=feature_matrix,
                target_column=config.target_column,
                test_size=config.test_size,
                val_size=config.val_size,
                normalize=True,
                normalization_method='standard',
                handle_missing=True,
                missing_strategy='mean',
                exclude_columns=['student_id']
            )
            
            model = self._build_model(config.algorithm, config.hyperparameters)
            
            model.fit(splits['X_train'], splits['y_train'])
            
            training_metrics = self._calculate_metrics(
                model, splits['X_train'], splits['y_train']
            )
            
            validation_metrics = self._calculate_metrics(
                model, splits['X_val'], splits['y_val']
            )
            
            test_metrics = self._calculate_metrics(
                model, splits['X_test'], splits['y_test']
            )
            
            cv_scores = self._cross_validate_model(
                model, splits['X_train'], splits['y_train'], cv=config.cv_folds
            )
            
            feature_importance = self._get_feature_importance(
                model, splits['feature_names']
            )
            
            ml_model = self._get_or_create_model(
                institution_id=config.institution_id,
                model_name=config.model_name,
                algorithm=config.algorithm,
                prediction_type=config.prediction_type,
                hyperparameters=config.hyperparameters,
                feature_names=splits['feature_names'],
                target_column=config.target_column
            )
            
            version = self._generate_version_string()
            model_path = f"models/{config.institution_id}/{ml_model.id}/model_{version}.joblib"
            scaler_path = f"models/{config.institution_id}/{ml_model.id}/scaler_{version}.joblib"
            
            joblib.dump(model, model_path)
            joblib.dump(splits['data_prep'].scaler, scaler_path)
            
            model_version = MLModelVersion(
                model_id=ml_model.id,
                version=version,
                model_path=model_path,
                scaler_path=scaler_path,
                training_metrics=training_metrics,
                validation_metrics=validation_metrics,
                test_metrics=test_metrics,
                cross_validation_scores=cv_scores,
                feature_importance=feature_importance,
                training_samples=len(splits['X_train']),
                training_date=training_start,
                is_deployed=False,
                notes=f"Auto-trained model. Quality score: {quality_report.get('overall_quality_score', 0):.2f}"
            )
            
            self.db.add(model_version)
            self.db.commit()
            self.db.refresh(model_version)
            
            training_duration = (datetime.utcnow() - training_start).total_seconds()
            
            result = {
                'status': TrainingStatus.COMPLETED.value,
                'model_id': ml_model.id,
                'model_version_id': model_version.id,
                'version': version,
                'training_metrics': training_metrics,
                'validation_metrics': validation_metrics,
                'test_metrics': test_metrics,
                'cross_validation_scores': cv_scores,
                'feature_importance': feature_importance,
                'training_samples': len(splits['X_train']),
                'training_duration_seconds': training_duration,
                'quality_report': quality_report,
                'message': f"Model trained successfully with R² score: {test_metrics['r2_score']:.4f}"
            }
            
            self.logger.info(
                f"Training completed for model {ml_model.id}, version {version}. "
                f"R² score: {test_metrics['r2_score']:.4f}"
            )
            
            return result
            
        except Exception as e:
            self.logger.error(f"Training failed: {str(e)}")
            raise
    
    def _build_model(self, algorithm: str, hyperparameters: Dict[str, Any]):
        from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
        from sklearn.linear_model import Ridge, Lasso
        from sklearn.tree import DecisionTreeRegressor
        
        if algorithm == 'random_forest':
            return RandomForestRegressor(
                n_estimators=hyperparameters.get('n_estimators', 100),
                max_depth=hyperparameters.get('max_depth', None),
                min_samples_split=hyperparameters.get('min_samples_split', 2),
                min_samples_leaf=hyperparameters.get('min_samples_leaf', 1),
                random_state=hyperparameters.get('random_state', 42)
            )
        elif algorithm == 'gradient_boosting':
            return GradientBoostingRegressor(
                n_estimators=hyperparameters.get('n_estimators', 100),
                learning_rate=hyperparameters.get('learning_rate', 0.1),
                max_depth=hyperparameters.get('max_depth', 3),
                random_state=hyperparameters.get('random_state', 42)
            )
        elif algorithm == 'ridge':
            return Ridge(
                alpha=hyperparameters.get('alpha', 1.0),
                random_state=hyperparameters.get('random_state', 42)
            )
        elif algorithm == 'lasso':
            return Lasso(
                alpha=hyperparameters.get('alpha', 1.0),
                random_state=hyperparameters.get('random_state', 42)
            )
        elif algorithm == 'decision_tree':
            return DecisionTreeRegressor(
                max_depth=hyperparameters.get('max_depth', None),
                min_samples_split=hyperparameters.get('min_samples_split', 2),
                random_state=hyperparameters.get('random_state', 42)
            )
        else:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
    
    def _calculate_metrics(self, model, X, y) -> Dict[str, float]:
        from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
        
        predictions = model.predict(X)
        
        return {
            'mse': float(mean_squared_error(y, predictions)),
            'rmse': float(np.sqrt(mean_squared_error(y, predictions))),
            'mae': float(mean_absolute_error(y, predictions)),
            'r2_score': float(r2_score(y, predictions))
        }
    
    def _cross_validate_model(
        self, model, X, y, cv: int = 5
    ) -> Dict[str, Any]:
        from sklearn.model_selection import cross_val_score
        
        cv_scores = cross_val_score(
            model, X, y, cv=cv, scoring='r2', n_jobs=-1
        )
        
        return {
            'scores': cv_scores.tolist(),
            'mean': float(cv_scores.mean()),
            'std': float(cv_scores.std()),
            'min': float(cv_scores.min()),
            'max': float(cv_scores.max())
        }
    
    def _get_feature_importance(
        self, model, feature_names: List[str]
    ) -> Dict[str, float]:
        if hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            return dict(zip(feature_names, [float(x) for x in importances]))
        elif hasattr(model, 'coef_'):
            coefficients = np.abs(model.coef_)
            return dict(zip(feature_names, [float(x) for x in coefficients]))
        else:
            return {}
    
    def _get_or_create_model(
        self,
        institution_id: int,
        model_name: str,
        algorithm: str,
        prediction_type: PredictionType,
        hyperparameters: Dict[str, Any],
        feature_names: List[str],
        target_column: str
    ) -> MLModel:
        ml_model = self.db.query(MLModel).filter(
            MLModel.institution_id == institution_id,
            MLModel.name == model_name
        ).first()
        
        if ml_model:
            ml_model.algorithm = algorithm
            ml_model.hyperparameters = hyperparameters
            ml_model.feature_names = feature_names
            ml_model.target_column = target_column
            ml_model.updated_at = datetime.utcnow()
            self.db.commit()
        else:
            ml_model = MLModel(
                institution_id=institution_id,
                name=model_name,
                description=f"Auto-trained {model_name} model",
                model_type=ModelType.REGRESSION,
                prediction_type=prediction_type,
                algorithm=algorithm,
                hyperparameters=hyperparameters,
                feature_names=feature_names,
                target_column=target_column,
                status=ModelStatus.TRAINING
            )
            self.db.add(ml_model)
            self.db.commit()
            self.db.refresh(ml_model)
        
        return ml_model
    
    def _generate_version_string(self) -> str:
        now = datetime.utcnow()
        return f"v{now.strftime('%Y%m%d_%H%M%S')}"
    
    def compare_model_versions(
        self,
        champion_version_id: int,
        challenger_version_id: int
    ) -> Dict[str, Any]:
        champion = self.db.query(MLModelVersion).filter(
            MLModelVersion.id == champion_version_id
        ).first()
        
        challenger = self.db.query(MLModelVersion).filter(
            MLModelVersion.id == challenger_version_id
        ).first()
        
        if not champion or not challenger:
            raise ValueError("One or both model versions not found")
        
        metrics_comparison = {
            'champion': {
                'version': champion.version,
                'test_metrics': champion.test_metrics,
                'validation_metrics': champion.validation_metrics,
                'cv_scores': champion.cross_validation_scores
            },
            'challenger': {
                'version': challenger.version,
                'test_metrics': challenger.test_metrics,
                'validation_metrics': challenger.validation_metrics,
                'cv_scores': challenger.cross_validation_scores
            }
        }
        
        champion_r2 = champion.test_metrics.get('r2_score', 0)
        challenger_r2 = challenger.test_metrics.get('r2_score', 0)
        
        improvement = challenger_r2 - champion_r2
        improvement_pct = (improvement / champion_r2 * 100) if champion_r2 > 0 else 0
        
        recommendation = "promote" if improvement > 0 else "retain_champion"
        
        return {
            'comparison': metrics_comparison,
            'improvement': {
                'r2_improvement': float(improvement),
                'r2_improvement_percentage': float(improvement_pct)
            },
            'recommendation': recommendation,
            'promote_challenger': improvement > 0
        }
    
    def promote_model_version(
        self,
        model_version_id: int,
        deployed_by: int
    ) -> Dict[str, Any]:
        model_version = self.db.query(MLModelVersion).filter(
            MLModelVersion.id == model_version_id
        ).first()
        
        if not model_version:
            raise ValueError(f"Model version {model_version_id} not found")
        
        ml_model = model_version.model
        
        current_champion = self.db.query(MLModelVersion).filter(
            MLModelVersion.model_id == ml_model.id,
            MLModelVersion.is_deployed == True
        ).first()
        
        if current_champion:
            current_champion.is_deployed = False
            self.logger.info(f"Demoting previous champion version {current_champion.version}")
        
        model_version.is_deployed = True
        model_version.deployed_at = datetime.utcnow()
        model_version.deployed_by = deployed_by
        
        ml_model.status = ModelStatus.ACTIVE
        ml_model.is_active = True
        ml_model.updated_at = datetime.utcnow()
        
        self.db.commit()
        
        self.logger.info(
            f"Promoted model version {model_version.version} to champion for model {ml_model.id}"
        )
        
        return {
            'promoted_version': model_version.version,
            'model_id': ml_model.id,
            'previous_champion': current_champion.version if current_champion else None,
            'promoted_at': model_version.deployed_at.isoformat(),
            'test_r2_score': model_version.test_metrics.get('r2_score', 0)
        }
    
    def auto_promote_if_better(
        self,
        model_id: int,
        new_version_id: int,
        threshold: float = 0.02,
        deployed_by: int = None
    ) -> Dict[str, Any]:
        ml_model = self.db.query(MLModel).filter(MLModel.id == model_id).first()
        
        if not ml_model:
            raise ValueError(f"Model {model_id} not found")
        
        current_champion = self.db.query(MLModelVersion).filter(
            MLModelVersion.model_id == model_id,
            MLModelVersion.is_deployed == True
        ).first()
        
        new_version = self.db.query(MLModelVersion).filter(
            MLModelVersion.id == new_version_id
        ).first()
        
        if not new_version:
            raise ValueError(f"New version {new_version_id} not found")
        
        if not current_champion:
            self.logger.info(f"No champion exists, promoting version {new_version.version}")
            return self.promote_model_version(new_version_id, deployed_by)
        
        comparison = self.compare_model_versions(
            champion_version_id=current_champion.id,
            challenger_version_id=new_version_id
        )
        
        improvement = comparison['improvement']['r2_improvement']
        
        if improvement > threshold:
            self.logger.info(
                f"New version {new_version.version} shows improvement of {improvement:.4f}, "
                f"promoting to champion"
            )
            promotion_result = self.promote_model_version(new_version_id, deployed_by)
            promotion_result['auto_promoted'] = True
            promotion_result['improvement'] = improvement
            return promotion_result
        else:
            self.logger.info(
                f"New version {new_version.version} improvement {improvement:.4f} "
                f"below threshold {threshold}, keeping current champion"
            )
            return {
                'auto_promoted': False,
                'reason': f"Improvement {improvement:.4f} below threshold {threshold}",
                'champion_version': current_champion.version,
                'challenger_version': new_version.version,
                'comparison': comparison
            }
    
    def get_model_versions_for_ab_test(
        self,
        model_id: int
    ) -> Dict[str, Any]:
        champion = self.db.query(MLModelVersion).filter(
            MLModelVersion.model_id == model_id,
            MLModelVersion.is_deployed == True
        ).first()
        
        if not champion:
            return {
                'champion': None,
                'challenger': None,
                'ab_test_enabled': False
            }
        
        challenger = self.db.query(MLModelVersion).filter(
            MLModelVersion.model_id == model_id,
            MLModelVersion.is_deployed == False,
            MLModelVersion.id != champion.id
        ).order_by(MLModelVersion.training_date.desc()).first()
        
        return {
            'champion': {
                'version_id': champion.id,
                'version': champion.version,
                'model_path': champion.model_path,
                'scaler_path': champion.scaler_path,
                'test_metrics': champion.test_metrics
            } if champion else None,
            'challenger': {
                'version_id': challenger.id,
                'version': challenger.version,
                'model_path': challenger.model_path,
                'scaler_path': challenger.scaler_path,
                'test_metrics': challenger.test_metrics
            } if challenger else None,
            'ab_test_enabled': champion is not None and challenger is not None
        }
