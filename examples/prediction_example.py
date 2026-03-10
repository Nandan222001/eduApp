"""
Example usage of the Student Performance Prediction ML System

This example demonstrates:
1. Training a prediction model
2. Making predictions with confidence intervals
3. Analyzing what-if scenarios
4. Batch predictions
5. Retrieving model metrics and history
"""

from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from src.database import SessionLocal
from src.ml.prediction_service import PerformancePredictionService


def example_train_model(db: Session):
    """Example: Train a new prediction model"""
    print("\n=== Training a New Model ===")
    
    service = PerformancePredictionService(db)
    
    try:
        ml_model, model_version = service.train_model(
            institution_id=1,
            model_name="Student Performance Predictor v1.0",
            algorithm='random_forest',
            hyperparameters={
                'n_estimators': 100,
                'max_depth': 10,
                'min_samples_split': 5,
                'min_samples_leaf': 2
            },
            target_column='exam_percentage',
            prediction_type='overall_percentage',
            start_date=datetime.now().date() - timedelta(days=365),
            end_date=datetime.now().date(),
            test_size=0.2,
            cv_folds=5,
            random_state=42
        )
        
        print(f"✓ Model trained successfully!")
        print(f"  Model ID: {ml_model.id}")
        print(f"  Version: {model_version.version}")
        print(f"  Algorithm: {ml_model.algorithm}")
        print(f"\nTraining Metrics:")
        print(f"  R² Score: {model_version.training_metrics['r2_score']:.4f}")
        print(f"  MAE: {model_version.training_metrics['mae']:.2f}")
        print(f"  RMSE: {model_version.training_metrics['rmse']:.2f}")
        print(f"\nTest Metrics:")
        print(f"  R² Score: {model_version.test_metrics['r2_score']:.4f}")
        print(f"  MAE: {model_version.test_metrics['mae']:.2f}")
        print(f"  RMSE: {model_version.test_metrics['rmse']:.2f}")
        print(f"\nCross-Validation:")
        print(f"  Mean CV Score: {model_version.cross_validation_scores['mean_cv_score']:.4f}")
        print(f"  Std CV Score: {model_version.cross_validation_scores['std_cv_score']:.4f}")
        
        return ml_model.id
        
    except Exception as e:
        print(f"✗ Error training model: {str(e)}")
        return None


def example_make_prediction(db: Session, model_id: int):
    """Example: Make a performance prediction"""
    print("\n=== Making a Prediction ===")
    
    service = PerformancePredictionService(db)
    
    input_features = {
        'attendance_percentage': 85.5,
        'avg_assignment_score': 78.2,
        'avg_exam_score': 82.0,
        'total_assignments': 20,
        'completed_assignments': 18,
        'exam_count': 5
    }
    
    try:
        prediction = service.predict_performance(
            model_id=model_id,
            student_id=100,
            input_features=input_features,
            confidence_level=0.95,
            calculate_contributions=True
        )
        
        print(f"✓ Prediction made successfully!")
        print(f"  Prediction ID: {prediction.id}")
        print(f"  Student ID: {prediction.student_id}")
        print(f"  Predicted Value: {prediction.predicted_value:.2f}%")
        print(f"  Confidence Interval (95%): [{prediction.confidence_lower:.2f}%, {prediction.confidence_upper:.2f}%]")
        print(f"\nFeature Contributions:")
        
        if prediction.feature_contributions:
            sorted_contributions = sorted(
                prediction.feature_contributions.items(),
                key=lambda x: x[1]['importance'],
                reverse=True
            )
            for feature, contribution in sorted_contributions[:5]:
                print(f"  {feature}:")
                print(f"    Value: {contribution['value']:.2f}")
                print(f"    Importance: {contribution['importance']:.4f}")
        
        return prediction.id
        
    except Exception as e:
        print(f"✗ Error making prediction: {str(e)}")
        return None


def example_what_if_scenarios(db: Session, base_prediction_id: int):
    """Example: Analyze what-if scenarios"""
    print("\n=== Analyzing What-If Scenarios ===")
    
    service = PerformancePredictionService(db)
    
    scenarios = [
        {
            'name': 'Improved Attendance',
            'description': 'If student improves attendance to 95%',
            'modified_features': {
                'attendance_percentage': 95.0
            }
        },
        {
            'name': 'Complete All Assignments',
            'description': 'If student completes all pending assignments',
            'modified_features': {
                'completed_assignments': 20
            }
        },
        {
            'name': 'Better Study Habits',
            'description': 'If student improves both attendance and assignments',
            'modified_features': {
                'attendance_percentage': 95.0,
                'completed_assignments': 20,
                'avg_assignment_score': 85.0
            }
        }
    ]
    
    try:
        scenario_predictions = service.analyze_what_if_scenarios(
            base_prediction_id=base_prediction_id,
            scenarios=scenarios
        )
        
        print(f"✓ Analyzed {len(scenario_predictions)} scenarios!")
        
        for scenario in scenario_predictions:
            print(f"\n{scenario.scenario_name}:")
            print(f"  Description: {scenario.scenario_description}")
            print(f"  Predicted Value: {scenario.predicted_value:.2f}%")
            print(f"  Value Change: {scenario.value_change:+.2f}%")
            print(f"  Percentage Change: {scenario.percentage_change:+.2f}%")
            print(f"  Recommendations:")
            for rec in scenario.recommendations:
                print(f"    - [{rec['type']}] {rec['message']}")
        
    except Exception as e:
        print(f"✗ Error analyzing scenarios: {str(e)}")


def example_get_model_metrics(db: Session, model_id: int):
    """Example: Retrieve model metrics"""
    print("\n=== Retrieving Model Metrics ===")
    
    service = PerformancePredictionService(db)
    
    try:
        metrics = service.get_model_metrics(model_id)
        
        print(f"✓ Model metrics retrieved!")
        print(f"  Version: {metrics['version']}")
        print(f"  Training Date: {metrics['training_date']}")
        print(f"  Training Samples: {metrics['training_samples']}")
        print(f"\nTop 5 Important Features:")
        
        feature_importance = sorted(
            metrics['feature_importance'].items(),
            key=lambda x: x[1],
            reverse=True
        )
        for i, (feature, importance) in enumerate(feature_importance[:5], 1):
            print(f"  {i}. {feature}: {importance:.4f}")
        
    except Exception as e:
        print(f"✗ Error retrieving metrics: {str(e)}")


def example_list_models(db: Session, institution_id: int):
    """Example: List all models"""
    print("\n=== Listing All Models ===")
    
    service = PerformancePredictionService(db)
    
    try:
        models = service.list_models(
            institution_id=institution_id,
            status='active'
        )
        
        print(f"✓ Found {len(models)} active models")
        
        for model in models:
            print(f"\n  Model ID: {model.id}")
            print(f"  Name: {model.name}")
            print(f"  Algorithm: {model.algorithm}")
            print(f"  Prediction Type: {model.prediction_type.value}")
            print(f"  Status: {model.status.value}")
            print(f"  Created: {model.created_at}")
        
    except Exception as e:
        print(f"✗ Error listing models: {str(e)}")


def example_prediction_history(db: Session, student_id: int):
    """Example: Get student prediction history"""
    print("\n=== Student Prediction History ===")
    
    service = PerformancePredictionService(db)
    
    try:
        predictions = service.get_student_predictions_history(
            student_id=student_id,
            limit=10
        )
        
        print(f"✓ Found {len(predictions)} predictions for student {student_id}")
        
        for i, pred in enumerate(predictions, 1):
            print(f"\n  {i}. Prediction made at {pred.predicted_at}")
            print(f"     Predicted Value: {pred.predicted_value:.2f}%")
            print(f"     Confidence: [{pred.confidence_lower:.2f}%, {pred.confidence_upper:.2f}%]")
        
    except Exception as e:
        print(f"✗ Error retrieving history: {str(e)}")


def run_all_examples():
    """Run all examples"""
    print("=" * 60)
    print("Student Performance Prediction ML System - Examples")
    print("=" * 60)
    
    db = SessionLocal()
    
    try:
        # Example 1: Train a model
        model_id = example_train_model(db)
        
        if model_id:
            # Example 2: Make a prediction
            prediction_id = example_make_prediction(db, model_id)
            
            if prediction_id:
                # Example 3: What-if scenarios
                example_what_if_scenarios(db, prediction_id)
                
                # Example 4: Get model metrics
                example_get_model_metrics(db, model_id)
                
                # Example 5: List models
                example_list_models(db, institution_id=1)
                
                # Example 6: Prediction history
                example_prediction_history(db, student_id=100)
        
        print("\n" + "=" * 60)
        print("All examples completed!")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n✗ Fatal error: {str(e)}")
        import traceback
        traceback.print_exc()
    
    finally:
        db.close()


if __name__ == "__main__":
    run_all_examples()
