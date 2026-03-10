from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, date
from sqlalchemy.orm import Session
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.model_selection import cross_val_score, KFold
from sklearn.preprocessing import StandardScaler
from scipy import stats
import joblib
import os
import json

from src.ml.ml_service import MLService
from src.ml.model_storage import ModelStorageService
from src.ml.advanced_features import AdvancedFeatureEngineering
from src.models.ml_prediction import (
    MLModel, MLModelVersion, PerformancePrediction, PredictionScenario,
    ModelType, ModelStatus, PredictionType
)


class PerformancePredictionService:
    
    MODELS_DIR = "ml_models"
    SUPPORTED_ALGORITHMS = {
        'random_forest': RandomForestRegressor,
        'gradient_boosting': GradientBoostingRegressor,
        'linear_regression': LinearRegression,
        'ridge': Ridge,
        'lasso': Lasso,
    }
    
    def __init__(self, db: Session):
        self.db = db
        self.ml_service = MLService(db)
        self.storage_service = ModelStorageService()
        self.feature_engineer = AdvancedFeatureEngineering()
        os.makedirs(self.MODELS_DIR, exist_ok=True)
    
    def train_model(
        self,
        institution_id: int,
        model_name: str,
        algorithm: str = 'random_forest',
        hyperparameters: Optional[Dict[str, Any]] = None,
        target_column: str = 'exam_percentage',
        prediction_type: str = 'overall_percentage',
        start_date: Optional[date] = None,
        end_date: Optional[date] = None,
        test_size: float = 0.2,
        cv_folds: int = 5,
        random_state: int = 42
    ) -> Tuple[MLModel, MLModelVersion]:
        if algorithm not in self.SUPPORTED_ALGORITHMS:
            raise ValueError(f"Unsupported algorithm: {algorithm}")
        
        dataset = self.ml_service.prepare_training_dataset(
            institution_id=institution_id,
            target_column=target_column,
            start_date=start_date,
            end_date=end_date,
            test_size=test_size,
            normalize=True,
            random_state=random_state
        )
        
        X_train = dataset['X_train']
        X_test = dataset['X_test']
        y_train = dataset['y_train']
        y_test = dataset['y_test']
        feature_names = dataset['feature_names']
        scaler = dataset['data_prep'].scaler
        
        if hyperparameters is None:
            hyperparameters = self._get_default_hyperparameters(algorithm)
        
        model_class = self.SUPPORTED_ALGORITHMS[algorithm]
        model = model_class(**hyperparameters, random_state=random_state)
        
        model.fit(X_train, y_train)
        
        train_score = model.score(X_train, y_train)
        test_score = model.score(X_test, y_test)
        
        train_predictions = model.predict(X_train)
        test_predictions = model.predict(X_test)
        
        train_mae = np.mean(np.abs(y_train - train_predictions))
        train_rmse = np.sqrt(np.mean((y_train - train_predictions) ** 2))
        test_mae = np.mean(np.abs(y_test - test_predictions))
        test_rmse = np.sqrt(np.mean((y_test - test_predictions) ** 2))
        
        kfold = KFold(n_splits=cv_folds, shuffle=True, random_state=random_state)
        cv_scores = cross_val_score(model, X_train, y_train, cv=kfold, scoring='r2')
        
        feature_importance = {}
        if hasattr(model, 'feature_importances_'):
            for feature, importance in zip(feature_names, model.feature_importances_):
                feature_importance[feature] = float(importance)
        elif hasattr(model, 'coef_'):
            for feature, coef in zip(feature_names, model.coef_):
                feature_importance[feature] = float(abs(coef))
        
        ml_model = MLModel(
            institution_id=institution_id,
            name=model_name,
            model_type=ModelType.REGRESSION,
            prediction_type=PredictionType[prediction_type.upper()],
            algorithm=algorithm,
            hyperparameters=hyperparameters,
            feature_names=feature_names,
            target_column=target_column,
            status=ModelStatus.ACTIVE,
            is_active=True
        )
        self.db.add(ml_model)
        self.db.flush()
        
        version = f"v1.0.{datetime.utcnow().strftime('%Y%m%d%H%M%S')}"
        model_filename = f"model_{ml_model.id}_{version}.pkl"
        scaler_filename = f"scaler_{ml_model.id}_{version}.pkl"
        model_path = os.path.join(self.MODELS_DIR, model_filename)
        scaler_path = os.path.join(self.MODELS_DIR, scaler_filename)
        
        joblib.dump(model, model_path)
        joblib.dump(scaler, scaler_path)
        
        model_version = MLModelVersion(
            model_id=ml_model.id,
            version=version,
            model_path=model_path,
            scaler_path=scaler_path,
            training_metrics={
                'r2_score': float(train_score),
                'mae': float(train_mae),
                'rmse': float(train_rmse),
                'samples': len(X_train)
            },
            test_metrics={
                'r2_score': float(test_score),
                'mae': float(test_mae),
                'rmse': float(test_rmse),
                'samples': len(X_test)
            },
            cross_validation_scores={
                'mean_cv_score': float(cv_scores.mean()),
                'std_cv_score': float(cv_scores.std()),
                'cv_scores': [float(s) for s in cv_scores]
            },
            feature_importance=feature_importance,
            training_samples=len(X_train),
            training_date=datetime.utcnow(),
            is_deployed=True,
            deployed_at=datetime.utcnow()
        )
        self.db.add(model_version)
        self.db.commit()
        self.db.refresh(ml_model)
        self.db.refresh(model_version)
        
        return ml_model, model_version
    
    def predict_performance(
        self,
        model_id: int,
        student_id: int,
        input_features: Dict[str, float],
        confidence_level: float = 0.95,
        calculate_contributions: bool = True
    ) -> PerformancePrediction:
        ml_model = self.db.query(MLModel).filter(MLModel.id == model_id).first()
        if not ml_model:
            raise ValueError(f"Model {model_id} not found")
        
        model_version = self.db.query(MLModelVersion).filter(
            MLModelVersion.model_id == model_id,
            MLModelVersion.is_deployed == True
        ).order_by(MLModelVersion.training_date.desc()).first()
        
        if not model_version:
            raise ValueError(f"No deployed version found for model {model_id}")
        
        model = joblib.load(model_version.model_path)
        scaler = joblib.load(model_version.scaler_path)
        
        feature_vector = []
        for feature_name in ml_model.feature_names:
            feature_vector.append(input_features.get(feature_name, 0.0))
        
        X = np.array(feature_vector).reshape(1, -1)
        X_scaled = scaler.transform(X)
        
        prediction = model.predict(X_scaled)[0]
        
        confidence_lower, confidence_upper = self._calculate_confidence_interval(
            model, X_scaled, prediction, confidence_level
        )
        
        feature_contributions = {}
        if calculate_contributions and hasattr(model, 'feature_importances_'):
            importances = model.feature_importances_
            for feature_name, value, importance in zip(ml_model.feature_names, feature_vector, importances):
                feature_contributions[feature_name] = {
                    'value': float(value),
                    'importance': float(importance),
                    'contribution': float(value * importance)
                }
        
        performance_prediction = PerformancePrediction(
            institution_id=ml_model.institution_id,
            model_id=model_id,
            model_version_id=model_version.id,
            student_id=student_id,
            predicted_value=float(prediction),
            confidence_lower=float(confidence_lower),
            confidence_upper=float(confidence_upper),
            confidence_level=float(confidence_level),
            input_features=input_features,
            feature_contributions=feature_contributions,
            is_scenario=False
        )
        
        self.db.add(performance_prediction)
        self.db.commit()
        self.db.refresh(performance_prediction)
        
        return performance_prediction
    
    def analyze_what_if_scenarios(
        self,
        base_prediction_id: int,
        scenarios: List[Dict[str, Any]]
    ) -> List[PredictionScenario]:
        base_prediction = self.db.query(PerformancePrediction).filter(
            PerformancePrediction.id == base_prediction_id
        ).first()
        
        if not base_prediction:
            raise ValueError(f"Base prediction {base_prediction_id} not found")
        
        ml_model = base_prediction.model
        model_version = base_prediction.model_version
        
        model = joblib.load(model_version.model_path)
        scaler = joblib.load(model_version.scaler_path)
        
        scenario_predictions = []
        
        for scenario in scenarios:
            scenario_name = scenario['name']
            scenario_description = scenario.get('description', '')
            modified_features = scenario['modified_features']
            
            new_features = base_prediction.input_features.copy()
            new_features.update(modified_features)
            
            feature_vector = []
            for feature_name in ml_model.feature_names:
                feature_vector.append(new_features.get(feature_name, 0.0))
            
            X = np.array(feature_vector).reshape(1, -1)
            X_scaled = scaler.transform(X)
            
            prediction = model.predict(X_scaled)[0]
            
            confidence_lower, confidence_upper = self._calculate_confidence_interval(
                model, X_scaled, prediction, base_prediction.confidence_level
            )
            
            value_change = prediction - base_prediction.predicted_value
            percentage_change = (value_change / base_prediction.predicted_value * 100) if base_prediction.predicted_value != 0 else 0
            
            recommendations = self._generate_recommendations(
                modified_features, value_change, percentage_change
            )
            
            scenario_prediction = PredictionScenario(
                base_prediction_id=base_prediction_id,
                scenario_name=scenario_name,
                scenario_description=scenario_description,
                modified_features=modified_features,
                predicted_value=float(prediction),
                confidence_lower=float(confidence_lower),
                confidence_upper=float(confidence_upper),
                value_change=float(value_change),
                percentage_change=float(percentage_change),
                recommendations=recommendations
            )
            
            self.db.add(scenario_prediction)
            scenario_predictions.append(scenario_prediction)
        
        self.db.commit()
        
        for scenario in scenario_predictions:
            self.db.refresh(scenario)
        
        return scenario_predictions
    
    def _calculate_confidence_interval(
        self,
        model: Any,
        X: np.ndarray,
        prediction: float,
        confidence_level: float
    ) -> Tuple[float, float]:
        if hasattr(model, 'estimators_'):
            predictions = np.array([estimator.predict(X)[0] for estimator in model.estimators_])
            std_dev = np.std(predictions)
            z_score = stats.norm.ppf((1 + confidence_level) / 2)
            margin = z_score * std_dev
            return prediction - margin, prediction + margin
        else:
            margin = 5.0
            return prediction - margin, prediction + margin
    
    def _generate_recommendations(
        self,
        modified_features: Dict[str, float],
        value_change: float,
        percentage_change: float
    ) -> List[Dict[str, str]]:
        recommendations = []
        
        if value_change > 0:
            recommendations.append({
                'type': 'positive_impact',
                'message': f"This change could improve performance by {abs(percentage_change):.2f}%"
            })
        elif value_change < 0:
            recommendations.append({
                'type': 'negative_impact',
                'message': f"This change could decrease performance by {abs(percentage_change):.2f}%"
            })
        
        for feature, value in modified_features.items():
            if 'attendance' in feature.lower():
                if value > 90:
                    recommendations.append({
                        'type': 'attendance',
                        'message': f"Maintaining high attendance (>{value}%) is excellent for performance"
                    })
                elif value < 75:
                    recommendations.append({
                        'type': 'attendance',
                        'message': f"Low attendance (<{value}%) may negatively impact performance"
                    })
            
            if 'assignment' in feature.lower():
                if value > 85:
                    recommendations.append({
                        'type': 'assignment',
                        'message': f"High assignment scores (>{value}%) indicate strong understanding"
                    })
                elif value < 60:
                    recommendations.append({
                        'type': 'assignment',
                        'message': f"Low assignment scores (<{value}%) suggest need for additional support"
                    })
        
        return recommendations
    
    def _get_default_hyperparameters(self, algorithm: str) -> Dict[str, Any]:
        defaults = {
            'random_forest': {
                'n_estimators': 100,
                'max_depth': 10,
                'min_samples_split': 5,
                'min_samples_leaf': 2
            },
            'gradient_boosting': {
                'n_estimators': 100,
                'learning_rate': 0.1,
                'max_depth': 5,
                'min_samples_split': 5
            },
            'linear_regression': {},
            'ridge': {'alpha': 1.0},
            'lasso': {'alpha': 1.0}
        }
        return defaults.get(algorithm, {})
    
    def get_model_metrics(self, model_id: int) -> Dict[str, Any]:
        model_version = self.db.query(MLModelVersion).filter(
            MLModelVersion.model_id == model_id,
            MLModelVersion.is_deployed == True
        ).order_by(MLModelVersion.training_date.desc()).first()
        
        if not model_version:
            raise ValueError(f"No deployed version found for model {model_id}")
        
        return {
            'version': model_version.version,
            'training_metrics': model_version.training_metrics,
            'test_metrics': model_version.test_metrics,
            'cross_validation_scores': model_version.cross_validation_scores,
            'feature_importance': model_version.feature_importance,
            'training_samples': model_version.training_samples,
            'training_date': model_version.training_date.isoformat()
        }
    
    def list_models(
        self,
        institution_id: int,
        status: Optional[str] = None,
        prediction_type: Optional[str] = None
    ) -> List[MLModel]:
        query = self.db.query(MLModel).filter(MLModel.institution_id == institution_id)
        
        if status:
            query = query.filter(MLModel.status == ModelStatus[status.upper()])
        
        if prediction_type:
            query = query.filter(MLModel.prediction_type == PredictionType[prediction_type.upper()])
        
        return query.order_by(MLModel.created_at.desc()).all()
    
    def get_student_predictions_history(
        self,
        student_id: int,
        limit: int = 10
    ) -> List[PerformancePrediction]:
        return self.db.query(PerformancePrediction).filter(
            PerformancePrediction.student_id == student_id,
            PerformancePrediction.is_scenario == False
        ).order_by(PerformancePrediction.predicted_at.desc()).limit(limit).all()
