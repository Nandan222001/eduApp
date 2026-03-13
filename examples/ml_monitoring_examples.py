"""
Examples demonstrating ML model monitoring and observability features

This file shows practical examples of using the ML monitoring system
for drift detection, performance monitoring, and automatic retraining.
"""

from datetime import datetime, timedelta
from src.database import SessionLocal
from src.ml.model_monitoring import ModelMonitoringService, MonitoringDashboardService
from src.services.ml_analytics_integration_service import MLAnalyticsIntegrationService


def example_1_basic_monitoring():
    """
    Example 1: Basic model health monitoring
    """
    print("=" * 80)
    print("Example 1: Basic Model Health Monitoring")
    print("=" * 80)
    
    db = SessionLocal()
    monitoring_service = ModelMonitoringService(db)
    
    model_id = 1
    
    # Generate comprehensive monitoring report
    report = monitoring_service.comprehensive_monitoring_report(
        model_id=model_id,
        recent_days=7
    )
    
    print(f"\nModel: {report['model_name']} (ID: {report['model_id']})")
    print(f"Health Score: {report['model_health_score']:.1f}/100")
    print(f"Health Status: {report['health_status']}")
    print(f"Retraining Recommended: {report['retraining_recommended']}")
    
    if report['retraining_recommended']:
        print("\nRetraining Reasons:")
        for reason in report['retraining_reasons']:
            print(f"  - {reason}")
    
    # Check specific metrics
    print("\n--- Drift Detection ---")
    if report['prediction_drift']['drift_detected']:
        print(f"Prediction Drift: YES (score: {report['prediction_drift']['drift_score']:.3f})")
    else:
        print("Prediction Drift: No")
    
    if report['feature_drift']['drift_detected']:
        print(f"Feature Drift: YES ({report['feature_drift']['num_drifted_features']} features)")
        print(f"Drifted features: {', '.join(report['feature_drift']['drifted_features'][:5])}")
    else:
        print("Feature Drift: No")
    
    print("\n--- Performance Monitoring ---")
    if report['performance_monitoring']['degradation_detected']:
        print("Performance Degradation: YES")
        for metric, change in report['performance_monitoring']['performance_changes'].items():
            print(f"  {metric}: {change['change_percentage']:.1f}% change")
    else:
        print("Performance Degradation: No")
    
    db.close()
    print("\n" + "=" * 80 + "\n")


def example_2_drift_detection():
    """
    Example 2: Detailed drift detection analysis
    """
    print("=" * 80)
    print("Example 2: Detailed Drift Detection")
    print("=" * 80)
    
    db = SessionLocal()
    monitoring_service = ModelMonitoringService(db)
    
    model_id = 1
    
    # Check prediction drift
    prediction_drift = monitoring_service.detect_prediction_drift(
        model_id=model_id,
        recent_days=7,
        use_baseline=True
    )
    
    print("\n--- Prediction Drift Analysis ---")
    print(f"Drift Detected: {prediction_drift['drift_detected']}")
    if prediction_drift.get('drift_score'):
        print(f"Drift Score: {prediction_drift['drift_score']:.3f}")
        print(f"KS Statistic: {prediction_drift['ks_statistic']:.3f}")
        print(f"JS Divergence: {prediction_drift['js_divergence']:.3f}")
        print(f"PSI Score: {prediction_drift['psi_score']:.3f}")
        print(f"Severity: {prediction_drift['severity']}")
        
        print("\nRecent Distribution:")
        print(f"  Mean: {prediction_drift['recent_stats']['mean']:.2f}")
        print(f"  Std: {prediction_drift['recent_stats']['std']:.2f}")
        print(f"  Range: [{prediction_drift['recent_stats']['min']:.2f}, {prediction_drift['recent_stats']['max']:.2f}]")
        
        print("\nBaseline Distribution:")
        print(f"  Mean: {prediction_drift['baseline_stats']['mean']:.2f}")
        print(f"  Std: {prediction_drift['baseline_stats']['std']:.2f}")
        print(f"  Range: [{prediction_drift['baseline_stats']['min']:.2f}, {prediction_drift['baseline_stats']['max']:.2f}]")
    
    # Check feature drift
    feature_drift = monitoring_service.detect_feature_drift(
        model_id=model_id,
        recent_days=7
    )
    
    print("\n--- Feature Drift Analysis ---")
    print(f"Drift Detected: {feature_drift['drift_detected']}")
    if feature_drift.get('overall_drift_score'):
        print(f"Overall Drift Score: {feature_drift['overall_drift_score']:.3f}")
        print(f"Features Checked: {feature_drift['num_features_checked']}")
        print(f"Drifted Features: {feature_drift['num_drifted_features']}")
        
        if feature_drift['drifted_features']:
            print("\nTop Drifted Features:")
            for feature in feature_drift['drifted_features'][:5]:
                scores = feature_drift['feature_drift_scores'][feature]
                print(f"  {feature}:")
                print(f"    Drift Score: {scores['drift_score']:.3f}")
                print(f"    Mean Shift: {scores['mean_shift']:.2f}")
                print(f"    Recent Mean: {scores['recent_mean']:.2f}")
                print(f"    Baseline Mean: {scores['baseline_mean']:.2f}")
    
    db.close()
    print("\n" + "=" * 80 + "\n")


def example_3_confidence_trends():
    """
    Example 3: Analyzing confidence trends
    """
    print("=" * 80)
    print("Example 3: Confidence Trend Analysis")
    print("=" * 80)
    
    db = SessionLocal()
    monitoring_service = ModelMonitoringService(db)
    
    model_id = 1
    
    confidence_trends = monitoring_service.analyze_confidence_trends(
        model_id=model_id,
        days=30
    )
    
    print("\n--- Confidence Analysis ---")
    print(f"Trend Detected: {confidence_trends['trend_detected']}")
    
    if confidence_trends.get('trend_direction'):
        print(f"Trend Direction: {confidence_trends['trend_direction']}")
        print(f"Trend Slope: {confidence_trends['trend_slope']:.4f}")
        print(f"Trend Strength: {confidence_trends['trend_strength']:.4f}")
        
        print(f"\nConfidence Change: {confidence_trends['confidence_change_percentage']:.1f}%")
        print(f"Recent Avg Width: {confidence_trends['recent_avg_width']:.2f}")
        print(f"Baseline Avg Width: {confidence_trends['baseline_avg_width']:.2f}")
        
        print("\nOverall Statistics:")
        stats = confidence_trends['overall_stats']
        print(f"  Mean Width: {stats['mean_width']:.2f}")
        print(f"  Std Width: {stats['std_width']:.2f}")
        print(f"  Range: [{stats['min_width']:.2f}, {stats['max_width']:.2f}]")
        
        if confidence_trends.get('confidence_drop_detected'):
            print("\n⚠️  Confidence drop detected! Model may be becoming less certain.")
    
    db.close()
    print("\n" + "=" * 80 + "\n")


def example_4_automatic_retraining():
    """
    Example 4: Triggering automatic retraining
    """
    print("=" * 80)
    print("Example 4: Automatic Model Retraining")
    print("=" * 80)
    
    db = SessionLocal()
    monitoring_service = ModelMonitoringService(db)
    
    model_id = 1
    
    # Check if retraining is needed
    report = monitoring_service.comprehensive_monitoring_report(
        model_id=model_id,
        recent_days=7
    )
    
    print(f"\nModel Health Score: {report['model_health_score']:.1f}/100")
    print(f"Retraining Recommended: {report['retraining_recommended']}")
    
    if report['retraining_recommended']:
        print("\nReasons for retraining:")
        for reason in report['retraining_reasons']:
            print(f"  - {reason}")
        
        # Trigger automatic retraining (uncomment to actually run)
        # result = monitoring_service.trigger_automatic_retraining(
        #     model_id=model_id,
        #     deployed_by=1,  # User ID
        #     auto_promote=True
        # )
        # 
        # print(f"\nRetraining Status: {result['retraining_status']}")
        # if result['retraining_status'] == 'success':
        #     print(f"New Version: {result['training_result']['version']}")
        #     print(f"R² Score: {result['training_result']['test_metrics']['r2_score']:.4f}")
        #     
        #     if result['promotion_result'].get('auto_promoted'):
        #         print("✓ New version auto-promoted to champion")
        #     else:
        #         print("✗ New version not promoted (below threshold)")
        
        print("\n(Retraining commented out in example - uncomment to run)")
    
    db.close()
    print("\n" + "=" * 80 + "\n")


def example_5_institution_overview():
    """
    Example 5: Institution-wide monitoring overview
    """
    print("=" * 80)
    print("Example 5: Institution-Wide Monitoring Overview")
    print("=" * 80)
    
    db = SessionLocal()
    dashboard_service = MonitoringDashboardService(db)
    
    institution_id = 1
    
    overview = dashboard_service.get_model_monitoring_overview(
        institution_id=institution_id,
        days=7
    )
    
    print(f"\nInstitution ID: {overview['institution_id']}")
    print(f"Total Models: {overview['total_models']}")
    print(f"Overall Health Score: {overview['overall_health_score']:.1f}/100")
    print(f"Models Needing Retraining: {overview['models_needing_retraining']}")
    print(f"Models with Critical Alerts: {overview['models_with_critical_alerts']}")
    
    print("\n--- Individual Model Status ---")
    for model in overview['model_summaries']:
        status_icon = "✓" if model['health_status'] in ['excellent', 'good'] else "⚠️" if model['health_status'] == 'fair' else "✗"
        print(f"{status_icon} {model['model_name']}: {model['health_score']:.1f}/100 ({model['health_status']})")
        if model.get('retraining_recommended'):
            print(f"   → Retraining recommended")
    
    db.close()
    print("\n" + "=" * 80 + "\n")


def example_6_unified_analytics():
    """
    Example 6: Unified analytics dashboard (ML + Traditional)
    """
    print("=" * 80)
    print("Example 6: Unified Analytics Dashboard")
    print("=" * 80)
    
    db = SessionLocal()
    integration_service = MLAnalyticsIntegrationService(db)
    
    institution_id = 1
    
    dashboard = integration_service.get_unified_institution_dashboard(
        institution_id=institution_id,
        days=7
    )
    
    print(f"\nInstitution ID: {dashboard['institution_id']}")
    
    if dashboard['traditional_analytics']:
        print("\n--- Traditional Analytics ---")
        ta = dashboard['traditional_analytics']
        print(f"Total Students: {ta['total_students']}")
        print(f"Active Students: {ta['active_students']}")
        print(f"Average Percentage: {ta['overall_average_percentage']:.1f}%")
        print(f"Attendance: {ta['overall_attendance_percentage']:.1f}%")
        print(f"Exams Conducted: {ta['total_exams_conducted']}")
    
    if dashboard['ml_monitoring']:
        print("\n--- ML Monitoring ---")
        ml = dashboard['ml_monitoring']
        print(f"Total ML Models: {ml['total_ml_models']}")
        print(f"Overall Model Health: {ml['overall_model_health']:.1f}/100")
        print(f"Models Needing Retraining: {ml['models_needing_retraining']}")
        print(f"Models with Alerts: {ml['models_with_alerts']}")
        print(f"Total Predictions (period): {ml['total_predictions_period']}")
    
    print("\n--- ML Models Summary ---")
    for model in dashboard['ml_models_summary']:
        status = "Active" if model['is_active'] else "Inactive"
        print(f"{model['name']} ({model['algorithm']}): {status}")
    
    db.close()
    print("\n" + "=" * 80 + "\n")


def example_7_student_insights():
    """
    Example 7: Student-specific ML insights
    """
    print("=" * 80)
    print("Example 7: Student ML Insights")
    print("=" * 80)
    
    db = SessionLocal()
    integration_service = MLAnalyticsIntegrationService(db)
    
    institution_id = 1
    student_id = 1  # Replace with actual student ID
    
    insights = integration_service.get_student_ml_insights(
        institution_id=institution_id,
        student_id=student_id,
        days=30
    )
    
    print(f"\nStudent ID: {insights['student_id']}")
    print(f"Has Predictions: {insights['has_predictions']}")
    
    if insights['has_predictions']:
        print("\n--- Latest Prediction ---")
        latest = insights['latest_prediction']
        print(f"Predicted Value: {latest['predicted_value']:.2f}")
        print(f"Confidence Interval: [{latest['confidence_lower']:.2f}, {latest['confidence_upper']:.2f}]")
        print(f"Model: {latest['model_name']}")
        print(f"Predicted At: {latest['predicted_at']}")
        
        print("\n--- Prediction Trend ---")
        trend = insights['prediction_trend']
        print(f"Direction: {trend['direction']}")
        print(f"Change: {trend['change']:.2f} ({trend['change_percentage']:.1f}%)")
        
        print(f"\nTotal Predictions: {insights['total_predictions']}")
    else:
        print(f"\nMessage: {insights.get('message', 'No predictions available')}")
    
    db.close()
    print("\n" + "=" * 80 + "\n")


def example_8_prediction_accuracy():
    """
    Example 8: Analyzing prediction accuracy with actual results
    """
    print("=" * 80)
    print("Example 8: Prediction Accuracy Analysis")
    print("=" * 80)
    
    db = SessionLocal()
    integration_service = MLAnalyticsIntegrationService(db)
    
    model_id = 1
    
    # Example actual results (student_id: actual_score)
    actual_results = {
        1: 85.5,
        2: 78.2,
        3: 92.1,
        4: 68.9,
        5: 75.4
    }
    
    analysis = integration_service.get_prediction_accuracy_analysis(
        model_id=model_id,
        actual_results=actual_results,
        days=30
    )
    
    print(f"\nModel ID: {analysis['model_id']}")
    print(f"Analysis Available: {analysis['analysis_available']}")
    
    if analysis['analysis_available']:
        metrics = analysis['accuracy_metrics']
        print("\n--- Accuracy Metrics ---")
        print(f"Mean Absolute Error: {metrics['mae']:.2f}")
        print(f"Root Mean Squared Error: {metrics['rmse']:.2f}")
        print(f"Mean Absolute Percentage Error: {metrics['mean_absolute_percentage_error']:.1f}%")
        print(f"Confidence Coverage: {metrics['confidence_coverage_percentage']:.1f}%")
        
        print(f"\nSample Size: {analysis['sample_size']}")
        
        print("\n--- Sample Predictions ---")
        for pred in analysis['predictions_analyzed'][:5]:
            print(f"Student {pred['student_id']}: Predicted={pred['predicted']:.2f}, "
                  f"Actual={pred['actual']:.2f}, Error={pred['error']:.2f}")
    else:
        print(f"\nMessage: {analysis.get('message', 'No matching results')}")
    
    db.close()
    print("\n" + "=" * 80 + "\n")


def example_9_prediction_timeline():
    """
    Example 9: Visualizing prediction timeline
    """
    print("=" * 80)
    print("Example 9: Prediction Timeline Visualization")
    print("=" * 80)
    
    db = SessionLocal()
    dashboard_service = MonitoringDashboardService(db)
    
    model_id = 1
    
    timeline = dashboard_service.get_model_prediction_timeline(
        model_id=model_id,
        days=30
    )
    
    print(f"\nModel ID: {timeline['model_id']}")
    print(f"Days Analyzed: {timeline['days_analyzed']}")
    print(f"Total Predictions: {timeline['total_predictions']}")
    
    print("\n--- Daily Statistics ---")
    print(f"{'Date':<12} {'Count':<8} {'Mean':<10} {'Std':<10} {'Range':<20}")
    print("-" * 70)
    
    for day_stat in timeline['timeline'][-7:]:  # Last 7 days
        date = day_stat['date']
        count = day_stat['count']
        mean = day_stat['mean_prediction']
        std = day_stat['std_prediction']
        min_val = day_stat['min_prediction']
        max_val = day_stat['max_prediction']
        
        print(f"{date:<12} {count:<8} {mean:<10.2f} {std:<10.2f} [{min_val:.1f}, {max_val:.1f}]")
    
    db.close()
    print("\n" + "=" * 80 + "\n")


def example_10_scheduled_monitoring():
    """
    Example 10: Using Celery tasks for scheduled monitoring
    """
    print("=" * 80)
    print("Example 10: Scheduled Monitoring with Celery")
    print("=" * 80)
    
    print("\n--- Celery Task Examples ---\n")
    
    print("1. Check specific model health:")
    print("   from src.tasks.ml_monitoring_tasks import check_model_health_task")
    print("   result = check_model_health_task.delay(model_id=1)")
    print("   print(result.get())")
    
    print("\n2. Check all models in institution:")
    print("   from src.tasks.ml_monitoring_tasks import check_institution_models_task")
    print("   result = check_institution_models_task.delay(institution_id=1)")
    print("   print(result.get())")
    
    print("\n3. Trigger automatic retraining:")
    print("   from src.tasks.ml_monitoring_tasks import auto_retrain_model_task")
    print("   result = auto_retrain_model_task.delay(model_id=1, auto_promote=True)")
    print("   print(result.get())")
    
    print("\n4. Run scheduled monitoring check:")
    print("   from src.tasks.ml_monitoring_tasks import scheduled_monitoring_check_task")
    print("   result = scheduled_monitoring_check_task.delay()")
    print("   print(result.get())")
    
    print("\n5. Configure in Celery Beat schedule:")
    print("""
    from celery.schedules import crontab
    
    app.conf.beat_schedule = {
        'daily-model-monitoring': {
            'task': 'ml_monitoring.scheduled_monitoring_check',
            'schedule': crontab(hour=2, minute=0),  # Run at 2 AM daily
        },
    }
    """)
    
    print("\n" + "=" * 80 + "\n")


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print(" ML MODEL MONITORING EXAMPLES ")
    print("=" * 80 + "\n")
    
    try:
        example_1_basic_monitoring()
        example_2_drift_detection()
        example_3_confidence_trends()
        example_4_automatic_retraining()
        example_5_institution_overview()
        example_6_unified_analytics()
        example_7_student_insights()
        example_8_prediction_accuracy()
        example_9_prediction_timeline()
        example_10_scheduled_monitoring()
        
        print("\n✓ All examples completed successfully!")
        
    except Exception as e:
        print(f"\n✗ Error running examples: {str(e)}")
        import traceback
        traceback.print_exc()
