from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional
import json
from datetime import datetime, timedelta

from src.database import get_db
from src.redis_client import get_redis
from src.ml.training_pipeline import MLTrainingPipeline
from src.models.ml_prediction import MLModel, MLModelVersion, ModelStatus
from src.models.institution import Institution
from src.tasks.ml_training_tasks import (
    train_model_task,
    compare_and_promote_task,
    cleanup_old_model_versions
)
from src.schemas.ml_training import (
    ManualTrainingRequest,
    ManualTrainingResponse,
    TrainingHistoryResponse,
    TrainingHistoryItem,
    ModelVersionDetail,
    ModelComparisonRequest,
    ModelComparisonResponse,
    PromoteModelRequest,
    PromoteModelResponse,
    ABTestConfig,
    ABTestStatus,
    TaskStatusResponse,
    TrainingMetricsSummary,
    UpdateTrainingScheduleRequest,
    InstitutionMLSettings
)

router = APIRouter(prefix="/ml-training", tags=["ML Training"])


@router.post("/train", response_model=ManualTrainingResponse)
async def trigger_manual_training(
    institution_id: int,
    request: ManualTrainingRequest,
    db: Session = Depends(get_db)
) -> ManualTrainingResponse:
    try:
        institution = db.query(Institution).filter(
            Institution.id == institution_id
        ).first()
        
        if not institution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Institution {institution_id} not found"
            )
        
        task = train_model_task.delay(
            institution_id=institution_id,
            model_name=request.model_name,
            prediction_type=request.prediction_type,
            algorithm=request.algorithm,
            hyperparameters=request.hyperparameters,
            target_column=request.target_column,
            start_date=request.start_date.isoformat() if request.start_date else None,
            end_date=request.end_date.isoformat() if request.end_date else None,
            test_size=request.test_size,
            val_size=request.val_size,
            cv_folds=request.cv_folds,
            random_state=request.random_state,
            auto_promote=request.auto_promote,
            promotion_threshold=request.promotion_threshold,
            notify_admins=request.notify_admins
        )
        
        return ManualTrainingResponse(
            task_id=task.id,
            message=f"Training task initiated for model '{request.model_name}'",
            status="pending"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error triggering training: {str(e)}"
        )


@router.get("/task/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    task_id: str,
) -> TaskStatusResponse:
    try:
        from celery.result import AsyncResult
        
        task_result = AsyncResult(task_id)
        
        return TaskStatusResponse(
            task_id=task_id,
            status=task_result.status,
            result=task_result.result if task_result.ready() and task_result.successful() else None,
            error=str(task_result.result) if task_result.ready() and task_result.failed() else None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting task status: {str(e)}"
        )


@router.get("/history/{model_id}", response_model=TrainingHistoryResponse)
async def get_training_history(
    model_id: int,
    limit: int = 20,
    db: Session = Depends(get_db)
) -> TrainingHistoryResponse:
    try:
        model = db.query(MLModel).filter(MLModel.id == model_id).first()
        
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Model {model_id} not found"
            )
        
        versions = db.query(MLModelVersion).filter(
            MLModelVersion.model_id == model_id
        ).order_by(desc(MLModelVersion.training_date)).limit(limit).all()
        
        history_items = [
            TrainingHistoryItem(
                version_id=v.id,
                version=v.version,
                training_date=v.training_date,
                training_samples=v.training_samples,
                test_metrics=v.test_metrics,
                validation_metrics=v.validation_metrics,
                cross_validation_scores=v.cross_validation_scores,
                is_deployed=v.is_deployed,
                deployed_at=v.deployed_at
            )
            for v in versions
        ]
        
        return TrainingHistoryResponse(
            model_id=model_id,
            model_name=model.name,
            history=history_items,
            total_count=len(history_items)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving training history: {str(e)}"
        )


@router.get("/history", response_model=List[TrainingHistoryResponse])
async def get_all_training_history(
    institution_id: int,
    limit: int = 10,
    db: Session = Depends(get_db)
) -> List[TrainingHistoryResponse]:
    try:
        models = db.query(MLModel).filter(
            MLModel.institution_id == institution_id
        ).all()
        
        response = []
        
        for model in models:
            versions = db.query(MLModelVersion).filter(
                MLModelVersion.model_id == model.id
            ).order_by(desc(MLModelVersion.training_date)).limit(limit).all()
            
            history_items = [
                TrainingHistoryItem(
                    version_id=v.id,
                    version=v.version,
                    training_date=v.training_date,
                    training_samples=v.training_samples,
                    test_metrics=v.test_metrics,
                    validation_metrics=v.validation_metrics,
                    cross_validation_scores=v.cross_validation_scores,
                    is_deployed=v.is_deployed,
                    deployed_at=v.deployed_at
                )
                for v in versions
            ]
            
            response.append(TrainingHistoryResponse(
                model_id=model.id,
                model_name=model.name,
                history=history_items,
                total_count=len(history_items)
            ))
        
        return response
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving training history: {str(e)}"
        )


@router.get("/version/{version_id}", response_model=ModelVersionDetail)
async def get_model_version_detail(
    version_id: int,
    db: Session = Depends(get_db)
) -> ModelVersionDetail:
    try:
        version = db.query(MLModelVersion).filter(
            MLModelVersion.id == version_id
        ).first()
        
        if not version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Model version {version_id} not found"
            )
        
        return ModelVersionDetail(
            version_id=version.id,
            version=version.version,
            model_path=version.model_path,
            training_date=version.training_date,
            training_samples=version.training_samples,
            training_metrics=version.training_metrics,
            validation_metrics=version.validation_metrics,
            test_metrics=version.test_metrics,
            cross_validation_scores=version.cross_validation_scores,
            feature_importance=version.feature_importance,
            is_deployed=version.is_deployed,
            deployed_at=version.deployed_at,
            deployed_by=version.deployed_by,
            notes=version.notes
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving version detail: {str(e)}"
        )


@router.post("/compare", response_model=ModelComparisonResponse)
async def compare_model_versions(
    request: ModelComparisonRequest,
    db: Session = Depends(get_db)
) -> ModelComparisonResponse:
    try:
        pipeline = MLTrainingPipeline(db)
        
        comparison = pipeline.compare_model_versions(
            champion_version_id=request.champion_version_id,
            challenger_version_id=request.challenger_version_id
        )
        
        return ModelComparisonResponse(**comparison)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error comparing models: {str(e)}"
        )


@router.post("/promote", response_model=PromoteModelResponse)
async def promote_model_version(
    request: PromoteModelRequest,
    deployed_by: int,
    db: Session = Depends(get_db)
) -> PromoteModelResponse:
    try:
        pipeline = MLTrainingPipeline(db)
        
        result = pipeline.promote_model_version(
            model_version_id=request.model_version_id,
            deployed_by=deployed_by
        )
        
        return PromoteModelResponse(
            **result,
            message=f"Model version {result['promoted_version']} promoted to champion"
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error promoting model: {str(e)}"
        )


@router.post("/compare-and-promote")
async def compare_and_promote(
    model_id: int,
    champion_version_id: int,
    challenger_version_id: int,
    promotion_threshold: float = 0.02,
    deployed_by: int = None,
    notify_admins: bool = True
) -> ManualTrainingResponse:
    try:
        task = compare_and_promote_task.delay(
            model_id=model_id,
            champion_version_id=champion_version_id,
            challenger_version_id=challenger_version_id,
            promotion_threshold=promotion_threshold,
            deployed_by=deployed_by,
            notify_admins=notify_admins
        )
        
        return ManualTrainingResponse(
            task_id=task.id,
            message="Model comparison and promotion task initiated",
            status="pending"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initiating comparison: {str(e)}"
        )


@router.get("/ab-test/{model_id}", response_model=ABTestStatus)
async def get_ab_test_status(
    model_id: int,
    db: Session = Depends(get_db)
) -> ABTestStatus:
    try:
        pipeline = MLTrainingPipeline(db)
        
        versions = pipeline.get_model_versions_for_ab_test(model_id)
        
        model = db.query(MLModel).filter(MLModel.id == model_id).first()
        
        if not model:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Model {model_id} not found"
            )
        
        settings = {}
        if model.institution.settings:
            settings = json.loads(model.institution.settings) if isinstance(model.institution.settings, str) else model.institution.settings
        
        ml_settings = settings.get('ml_training', {})
        traffic_split = ml_settings.get('ab_test_traffic_split', 0.2)
        
        return ABTestStatus(
            model_id=model_id,
            champion=versions['champion'],
            challenger=versions['challenger'],
            ab_test_enabled=versions['ab_test_enabled'],
            traffic_split=traffic_split
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving A/B test status: {str(e)}"
        )


@router.get("/metrics/summary", response_model=TrainingMetricsSummary)
async def get_training_metrics_summary(
    institution_id: int,
    days: int = 30,
    db: Session = Depends(get_db)
) -> TrainingMetricsSummary:
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        total_models = db.query(func.count(MLModel.id)).filter(
            MLModel.institution_id == institution_id
        ).scalar()
        
        total_versions = db.query(func.count(MLModelVersion.id)).join(MLModel).filter(
            MLModel.institution_id == institution_id
        ).scalar()
        
        active_models = db.query(func.count(MLModel.id)).filter(
            MLModel.institution_id == institution_id,
            MLModel.status == ModelStatus.ACTIVE
        ).scalar()
        
        recent_trainings = db.query(func.count(MLModelVersion.id)).join(MLModel).filter(
            MLModel.institution_id == institution_id,
            MLModelVersion.training_date >= cutoff_date
        ).scalar()
        
        versions_with_metrics = db.query(MLModelVersion).join(MLModel).filter(
            MLModel.institution_id == institution_id,
            MLModelVersion.test_metrics.isnot(None)
        ).all()
        
        r2_scores = [
            v.test_metrics.get('r2_score', 0) 
            for v in versions_with_metrics 
            if v.test_metrics
        ]
        
        avg_r2 = sum(r2_scores) / len(r2_scores) if r2_scores else 0
        best_r2 = max(r2_scores) if r2_scores else 0
        
        return TrainingMetricsSummary(
            total_models=total_models or 0,
            total_versions=total_versions or 0,
            active_models=active_models or 0,
            recent_trainings=recent_trainings or 0,
            average_r2_score=avg_r2,
            best_r2_score=best_r2
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error calculating metrics summary: {str(e)}"
        )


@router.get("/schedule/{institution_id}", response_model=InstitutionMLSettings)
async def get_training_schedule(
    institution_id: int,
    db: Session = Depends(get_db)
) -> InstitutionMLSettings:
    try:
        institution = db.query(Institution).filter(
            Institution.id == institution_id
        ).first()
        
        if not institution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Institution {institution_id} not found"
            )
        
        settings = {}
        if institution.settings:
            settings = json.loads(institution.settings) if isinstance(institution.settings, str) else institution.settings
        
        from src.schemas.ml_training import TrainingScheduleConfig
        
        ml_settings = settings.get('ml_training', {})
        config = TrainingScheduleConfig(**ml_settings) if ml_settings else TrainingScheduleConfig()
        
        return InstitutionMLSettings(ml_training=config)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving training schedule: {str(e)}"
        )


@router.put("/schedule/{institution_id}", response_model=InstitutionMLSettings)
async def update_training_schedule(
    institution_id: int,
    request: UpdateTrainingScheduleRequest,
    db: Session = Depends(get_db)
) -> InstitutionMLSettings:
    try:
        institution = db.query(Institution).filter(
            Institution.id == institution_id
        ).first()
        
        if not institution:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Institution {institution_id} not found"
            )
        
        settings = {}
        if institution.settings:
            settings = json.loads(institution.settings) if isinstance(institution.settings, str) else institution.settings
        
        settings['ml_training'] = request.config.model_dump()
        
        institution.settings = json.dumps(settings)
        institution.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(institution)
        
        return InstitutionMLSettings(ml_training=request.config)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error updating training schedule: {str(e)}"
        )


@router.post("/cleanup/old-versions")
async def cleanup_old_versions(
    keep_latest: int = 5,
    days_to_keep: int = 90
) -> ManualTrainingResponse:
    try:
        task = cleanup_old_model_versions.delay(
            keep_latest=keep_latest,
            days_to_keep=days_to_keep
        )
        
        return ManualTrainingResponse(
            task_id=task.id,
            message="Cleanup task initiated",
            status="pending"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error initiating cleanup: {str(e)}"
        )
