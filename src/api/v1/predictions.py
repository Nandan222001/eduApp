from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
import hashlib

from src.database import get_db
from src.redis_client import get_redis
from src.dependencies.auth import get_current_user
from src.models.user import User
from src.models.ml_prediction import MLModel, PerformancePrediction
from src.ml.prediction_service import PerformancePredictionService
from src.ml.ml_service import MLService
from src.schemas.prediction_schemas import (
    TrainModelRequest, TrainModelResponse,
    PredictPerformanceRequest, PredictPerformanceResponse,
    WhatIfAnalysisRequest, WhatIfAnalysisResponse, WhatIfScenario, ScenarioResult,
    ModelMetricsResponse, ListModelsResponse, ModelListItem,
    PredictionHistoryResponse, PredictionHistoryItem,
    BatchPredictionRequest, BatchPredictionResponse, BatchPredictionResult
)

router = APIRouter(prefix="/predictions", tags=["Performance Predictions"])

CACHE_TTL_PREDICTION = 3600
CACHE_TTL_METRICS = 1800
CACHE_TTL_LIST = 600


def generate_cache_key(prefix: str, **kwargs) -> str:
    key_data = json.dumps(kwargs, sort_keys=True)
    key_hash = hashlib.md5(key_data.encode()).hexdigest()
    return f"{prefix}:{key_hash}"


@router.post("/train", response_model=TrainModelResponse)
async def train_prediction_model(
    request: TrainModelRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> TrainModelResponse:
    if request.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to train a model for this institution"
        )
    try:
        prediction_service = PerformancePredictionService(db)

        ml_model, model_version = prediction_service.train_model(
            institution_id=request.institution_id,
            model_name=request.model_name,
            algorithm=request.algorithm,
            hyperparameters=request.hyperparameters,
            target_column=request.target_column,
            prediction_type=request.prediction_type,
            start_date=request.start_date,
            end_date=request.end_date,
            test_size=request.test_size,
            cv_folds=request.cv_folds,
            random_state=request.random_state
        )
        
        return TrainModelResponse(
            model_id=ml_model.id,
            version=model_version.version,
            training_metrics=model_version.training_metrics,
            test_metrics=model_version.test_metrics,
            cross_validation_scores=model_version.cross_validation_scores,
            feature_importance=model_version.feature_importance,
            training_samples=model_version.training_samples,
            message=f"Model trained successfully with R² score: {model_version.test_metrics['r2_score']:.4f}"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error training model: {str(e)}"
        )


@router.post("/predict", response_model=PredictPerformanceResponse)
async def predict_student_performance(
    request: PredictPerformanceRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PredictPerformanceResponse:
    ml_model = db.query(MLModel).filter(MLModel.id == request.model_id).first()
    if not ml_model or ml_model.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model {request.model_id} not found"
        )
    try:
        redis = await get_redis()

        cache_key = generate_cache_key(
            "prediction",
            model_id=request.model_id,
            student_id=request.student_id,
            features=request.input_features
        )

        cached_result = await redis.get(cache_key)
        if cached_result:
            cached_data = json.loads(cached_result)
            return PredictPerformanceResponse(**cached_data)

        prediction_service = PerformancePredictionService(db)

        prediction = prediction_service.predict_performance(
            model_id=request.model_id,
            student_id=request.student_id,
            input_features=request.input_features,
            confidence_level=request.confidence_level,
            calculate_contributions=request.calculate_contributions
        )
        
        response = PredictPerformanceResponse(
            prediction_id=prediction.id,
            student_id=prediction.student_id,
            predicted_value=prediction.predicted_value,
            confidence_lower=prediction.confidence_lower,
            confidence_upper=prediction.confidence_upper,
            confidence_level=prediction.confidence_level,
            feature_contributions=prediction.feature_contributions,
            predicted_at=prediction.predicted_at
        )
        
        await redis.setex(
            cache_key,
            CACHE_TTL_PREDICTION,
            json.dumps(response.model_dump(), default=str)
        )
        
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error making prediction: {str(e)}"
        )


@router.post("/batch-predict", response_model=BatchPredictionResponse)
async def batch_predict_performance(
    request: BatchPredictionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> BatchPredictionResponse:
    # `ml_model` used to be looked up with
    # `db.query(prediction_service.db.query(prediction_service.db.query.__self__.__class__))`,
    # which is not a valid SQLAlchemy query at all (it wraps a bound method's
    # `__self__.__class__` -- the `Query` class itself -- as if it were a
    # mapped entity) and raised a `TypeError`/`ArgumentError` on every single
    # call, 100% breaking this endpoint regardless of input. Replaced with a
    # real lookup of the model the request actually names.
    ml_model = db.query(MLModel).filter(MLModel.id == request.model_id).first()
    if not ml_model or ml_model.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model {request.model_id} not found"
        )
    try:
        prediction_service = PerformancePredictionService(db)
        ml_service = MLService(db)

        predictions = []
        
        for student_id in request.student_ids:
            feature_matrix = ml_service.extract_and_prepare_features(
                institution_id=ml_model.institution_id,
                student_ids=[student_id]
            )
            
            if not feature_matrix.empty:
                input_features = feature_matrix.iloc[0].to_dict()
                input_features.pop('student_id', None)
                
                try:
                    prediction = prediction_service.predict_performance(
                        model_id=request.model_id,
                        student_id=student_id,
                        input_features=input_features,
                        confidence_level=request.confidence_level,
                        calculate_contributions=False
                    )
                    
                    predictions.append(BatchPredictionResult(
                        student_id=student_id,
                        predicted_value=prediction.predicted_value,
                        confidence_lower=prediction.confidence_lower,
                        confidence_upper=prediction.confidence_upper
                    ))
                except Exception:
                    continue
        
        return BatchPredictionResponse(
            predictions=predictions,
            total_count=len(predictions)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error in batch prediction: {str(e)}"
        )


@router.post("/what-if", response_model=WhatIfAnalysisResponse)
async def analyze_what_if_scenarios(
    request: WhatIfAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> WhatIfAnalysisResponse:
    try:
        redis = await get_redis()

        cache_key = generate_cache_key(
            "what_if",
            base_prediction_id=request.base_prediction_id,
            scenarios=[s.model_dump() for s in request.scenarios]
        )

        cached_result = await redis.get(cache_key)
        if cached_result:
            cached_data = json.loads(cached_result)
            return WhatIfAnalysisResponse(**cached_data)

        prediction_service = PerformancePredictionService(db)

        # Same broken self-referential query pattern as batch-predict above
        # (`db.query(prediction_service.db.query(...))`), which raised
        # unconditionally rather than ever reaching the `not base_prediction`
        # 404 branch below -- replaced with a real lookup, also scoped to the
        # caller's own institution so a guessed prediction id from another
        # institution can't be used as the base of a what-if analysis.
        base_prediction = db.query(PerformancePrediction).filter(
            PerformancePrediction.id == request.base_prediction_id
        ).first()

        if not base_prediction or base_prediction.institution_id != current_user.institution_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Base prediction {request.base_prediction_id} not found"
            )
        
        scenarios_data = [s.model_dump() for s in request.scenarios]
        scenario_predictions = prediction_service.analyze_what_if_scenarios(
            base_prediction_id=request.base_prediction_id,
            scenarios=scenarios_data
        )
        
        base_response = PredictPerformanceResponse(
            prediction_id=base_prediction.id,
            student_id=base_prediction.student_id,
            predicted_value=base_prediction.predicted_value,
            confidence_lower=base_prediction.confidence_lower,
            confidence_upper=base_prediction.confidence_upper,
            confidence_level=base_prediction.confidence_level,
            feature_contributions=base_prediction.feature_contributions,
            predicted_at=base_prediction.predicted_at
        )
        
        scenario_results = []
        for scenario in scenario_predictions:
            scenario_results.append(ScenarioResult(
                scenario_id=scenario.id,
                scenario_name=scenario.scenario_name,
                scenario_description=scenario.scenario_description,
                predicted_value=scenario.predicted_value,
                confidence_lower=scenario.confidence_lower,
                confidence_upper=scenario.confidence_upper,
                value_change=scenario.value_change,
                percentage_change=scenario.percentage_change,
                recommendations=scenario.recommendations
            ))
        
        response = WhatIfAnalysisResponse(
            base_prediction=base_response,
            scenarios=scenario_results,
            total_scenarios=len(scenario_results)
        )
        
        await redis.setex(
            cache_key,
            CACHE_TTL_PREDICTION,
            json.dumps(response.model_dump(), default=str)
        )
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error analyzing scenarios: {str(e)}"
        )


@router.get("/models/{model_id}/metrics", response_model=ModelMetricsResponse)
async def get_model_metrics(
    model_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ModelMetricsResponse:
    ml_model = db.query(MLModel).filter(MLModel.id == model_id).first()
    if not ml_model or ml_model.institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Model {model_id} not found"
        )
    try:
        redis = await get_redis()

        cache_key = f"model_metrics:{model_id}"
        cached_result = await redis.get(cache_key)
        if cached_result:
            cached_data = json.loads(cached_result)
            return ModelMetricsResponse(**cached_data)
        
        prediction_service = PerformancePredictionService(db)
        
        metrics = prediction_service.get_model_metrics(model_id)
        
        response = ModelMetricsResponse(**metrics)
        
        await redis.setex(
            cache_key,
            CACHE_TTL_METRICS,
            json.dumps(response.model_dump(), default=str)
        )
        
        return response
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving model metrics: {str(e)}"
        )


@router.get("/models", response_model=ListModelsResponse)
async def list_models(
    institution_id: int,
    # Renamed from `status` (the query param's original name): it shadowed
    # the module-level `from fastapi import ... status` import for this
    # entire function body, so every `except` block below that referenced
    # `status.HTTP_...` was actually attribute-accessing the *local string
    # parameter* (or `None`) instead of the fastapi module, raising an
    # unhandled `AttributeError` in place of the intended HTTPException any
    # time this endpoint's try block actually failed -- masking the real
    # error behind a generic, undiagnosable 500. `status=model_status` below
    # keeps the same keyword the service method expects.
    model_status: Optional[str] = Query(None, alias="status"),
    prediction_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> ListModelsResponse:
    if institution_id != current_user.institution_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to list models for this institution"
        )
    try:
        redis = await get_redis()

        cache_key = generate_cache_key(
            "models_list",
            institution_id=institution_id,
            status=model_status,
            prediction_type=prediction_type
        )

        cached_result = await redis.get(cache_key)
        if cached_result:
            cached_data = json.loads(cached_result)
            return ListModelsResponse(**cached_data)

        prediction_service = PerformancePredictionService(db)

        models = prediction_service.list_models(
            institution_id=institution_id,
            status=model_status,
            prediction_type=prediction_type
        )
        
        model_items = [ModelListItem(
            id=m.id,
            name=m.name,
            algorithm=m.algorithm,
            model_type=m.model_type.value,
            prediction_type=m.prediction_type.value,
            status=m.status.value,
            is_active=m.is_active,
            created_at=m.created_at
        ) for m in models]
        
        response = ListModelsResponse(
            models=model_items,
            total_count=len(model_items)
        )
        
        await redis.setex(
            cache_key,
            CACHE_TTL_LIST,
            json.dumps(response.model_dump(), default=str)
        )
        
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing models: {str(e)}"
        )


@router.get("/students/{student_id}/history", response_model=PredictionHistoryResponse)
async def get_prediction_history(
    student_id: int,
    limit: int = 10,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PredictionHistoryResponse:
    try:
        redis = await get_redis()

        cache_key = f"prediction_history:{current_user.institution_id}:{student_id}:{limit}"
        cached_result = await redis.get(cache_key)
        if cached_result:
            cached_data = json.loads(cached_result)
            return PredictionHistoryResponse(**cached_data)

        prediction_service = PerformancePredictionService(db)

        predictions = prediction_service.get_student_predictions_history(
            student_id=student_id,
            institution_id=current_user.institution_id,
            limit=limit
        )
        
        prediction_items = [PredictionHistoryItem(
            id=p.id,
            predicted_value=p.predicted_value,
            confidence_lower=p.confidence_lower,
            confidence_upper=p.confidence_upper,
            predicted_at=p.predicted_at
        ) for p in predictions]
        
        response = PredictionHistoryResponse(
            student_id=student_id,
            predictions=prediction_items,
            total_count=len(prediction_items)
        )
        
        await redis.setex(
            cache_key,
            CACHE_TTL_PREDICTION,
            json.dumps(response.model_dump(), default=str)
        )
        
        return response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving prediction history: {str(e)}"
        )
