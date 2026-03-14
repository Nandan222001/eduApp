from typing import List, Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc, or_
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import os
import json

from src.models.institution_health import (
    InstitutionHealthScore,
    InstitutionHealthAlert,
    InstitutionHealthHistory,
    ChurnPredictionModel
)
from src.models.institution import Institution
from src.models.subscription import Subscription, Payment
from src.models.user import User
from src.models.student import Student
from src.models.teacher import Teacher
from src.models.assignment import Assignment, Submission
from src.models.doubt import DoubtPost
from src.models.attendance import Attendance
from src.schemas.institution_health import (
    RiskFactorItem,
    RecommendedAction
)


class InstitutionHealthService:
    def __init__(self, db: Session):
        self.db = db
        self.models_dir = "ml_models/churn_prediction"
        os.makedirs(self.models_dir, exist_ok=True)
    
    def calculate_payment_health_score(self, institution_id: int) -> Tuple[float, Dict[str, Any]]:
        """Calculate payment health based on payment history and subscription status."""
        today = datetime.utcnow()
        thirty_days_ago = today - timedelta(days=30)
        ninety_days_ago = today - timedelta(days=90)
        
        subscription = self.db.query(Subscription).filter(
            Subscription.institution_id == institution_id
        ).order_by(desc(Subscription.created_at)).first()
        
        metrics = {}
        score = 100.0
        
        if not subscription:
            return 0.0, {"reason": "No active subscription"}
        
        metrics["subscription_status"] = subscription.status
        metrics["billing_cycle"] = subscription.billing_cycle
        
        if subscription.status == "cancelled":
            score -= 80
        elif subscription.status == "expired":
            score -= 70
        elif subscription.status == "trial":
            if subscription.trial_end_date and subscription.trial_end_date < today:
                score -= 50
        
        failed_payments = self.db.query(func.count(Payment.id)).filter(
            and_(
                Payment.institution_id == institution_id,
                Payment.status == "failed",
                Payment.created_at >= ninety_days_ago
            )
        ).scalar() or 0
        
        metrics["failed_payments_90d"] = failed_payments
        score -= min(failed_payments * 15, 60)
        
        successful_payments = self.db.query(func.count(Payment.id)).filter(
            and_(
                Payment.institution_id == institution_id,
                Payment.status == "paid",
                Payment.paid_at >= ninety_days_ago
            )
        ).scalar() or 0
        
        metrics["successful_payments_90d"] = successful_payments
        
        if subscription.grace_period_end:
            days_until_grace_end = (subscription.grace_period_end - today).days
            if days_until_grace_end < 0:
                score -= 40
            elif days_until_grace_end < 3:
                score -= 30
            elif days_until_grace_end < 7:
                score -= 20
            metrics["days_until_grace_period_end"] = days_until_grace_end
        
        if subscription.next_billing_date:
            days_until_billing = (subscription.next_billing_date - today).days
            metrics["days_until_next_billing"] = days_until_billing
        
        return max(0, min(100, score)), metrics
    
    def calculate_user_activity_score(self, institution_id: int) -> Tuple[float, Dict[str, Any]]:
        """Calculate user activity based on login patterns and engagement."""
        today = datetime.utcnow()
        seven_days_ago = today - timedelta(days=7)
        thirty_days_ago = today - timedelta(days=30)
        
        metrics = {}
        score = 100.0
        
        total_users = self.db.query(func.count(User.id)).filter(
            User.institution_id == institution_id,
            User.is_active == True
        ).scalar() or 0
        
        metrics["total_active_users"] = total_users
        
        if total_users == 0:
            return 0.0, {"reason": "No active users"}
        
        dau = self.db.query(func.count(func.distinct(User.id))).filter(
            User.institution_id == institution_id,
            User.last_login >= today - timedelta(days=1)
        ).scalar() or 0
        
        wau = self.db.query(func.count(func.distinct(User.id))).filter(
            User.institution_id == institution_id,
            User.last_login >= seven_days_ago
        ).scalar() or 0
        
        mau = self.db.query(func.count(func.distinct(User.id))).filter(
            User.institution_id == institution_id,
            User.last_login >= thirty_days_ago
        ).scalar() or 0
        
        metrics["daily_active_users"] = dau
        metrics["weekly_active_users"] = wau
        metrics["monthly_active_users"] = mau
        
        dau_ratio = (dau / total_users * 100) if total_users > 0 else 0
        wau_ratio = (wau / total_users * 100) if total_users > 0 else 0
        mau_ratio = (mau / total_users * 100) if total_users > 0 else 0
        
        metrics["dau_ratio"] = dau_ratio
        metrics["wau_ratio"] = wau_ratio
        metrics["mau_ratio"] = mau_ratio
        
        if mau_ratio < 10:
            score -= 60
        elif mau_ratio < 25:
            score -= 40
        elif mau_ratio < 50:
            score -= 20
        
        if wau_ratio < 15:
            score -= 30
        elif wau_ratio < 30:
            score -= 15
        
        inactive_users = total_users - mau
        metrics["inactive_users_30d"] = inactive_users
        
        if total_users > 0:
            inactive_ratio = (inactive_users / total_users * 100)
            if inactive_ratio > 75:
                score -= 20
        
        return max(0, min(100, score)), metrics
    
    def calculate_support_ticket_score(self, institution_id: int) -> Tuple[float, Dict[str, Any]]:
        """Calculate support health based on doubt posts and resolution patterns."""
        today = datetime.utcnow()
        thirty_days_ago = today - timedelta(days=30)
        
        metrics = {}
        score = 100.0
        
        total_doubts = self.db.query(func.count(DoubtPost.id)).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.created_at >= thirty_days_ago
        ).scalar() or 0
        
        metrics["total_doubts_30d"] = total_doubts
        
        unanswered_doubts = self.db.query(func.count(DoubtPost.id)).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.status == "unanswered",
            DoubtPost.created_at >= thirty_days_ago
        ).scalar() or 0
        
        metrics["unanswered_doubts_30d"] = unanswered_doubts
        
        if total_doubts > 0:
            unanswered_ratio = (unanswered_doubts / total_doubts * 100)
            metrics["unanswered_ratio"] = unanswered_ratio
            
            if unanswered_ratio > 50:
                score -= 40
            elif unanswered_ratio > 30:
                score -= 25
            elif unanswered_ratio > 15:
                score -= 10
        
        urgent_unresolved = self.db.query(func.count(DoubtPost.id)).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.priority == "urgent",
            DoubtPost.status.in_(["unanswered", "answered"]),
            DoubtPost.created_at >= thirty_days_ago
        ).scalar() or 0
        
        metrics["urgent_unresolved_30d"] = urgent_unresolved
        score -= min(urgent_unresolved * 5, 30)
        
        avg_doubts_per_day = total_doubts / 30 if total_doubts > 0 else 0
        metrics["avg_doubts_per_day"] = round(avg_doubts_per_day, 2)
        
        if avg_doubts_per_day > 50:
            score -= 15
        
        return max(0, min(100, score)), metrics
    
    def calculate_feature_adoption_score(self, institution_id: int) -> Tuple[float, Dict[str, Any]]:
        """Calculate feature adoption based on usage of key platform features."""
        today = datetime.utcnow()
        thirty_days_ago = today - timedelta(days=30)
        
        metrics = {}
        score = 0.0
        max_features = 6
        
        assignments_count = self.db.query(func.count(Assignment.id)).filter(
            Assignment.institution_id == institution_id,
            Assignment.created_at >= thirty_days_ago
        ).scalar() or 0
        
        if assignments_count > 0:
            score += 100 / max_features
            metrics["assignments_created_30d"] = assignments_count
        
        submissions_count = self.db.query(func.count(Submission.id)).filter(
            Submission.assignment.has(Assignment.institution_id == institution_id),
            Submission.created_at >= thirty_days_ago
        ).scalar() or 0
        
        if submissions_count > 0:
            score += 100 / max_features
            metrics["submissions_30d"] = submissions_count
        
        attendance_records = self.db.query(func.count(Attendance.id)).filter(
            Attendance.institution_id == institution_id,
            Attendance.created_at >= thirty_days_ago
        ).scalar() or 0
        
        if attendance_records > 0:
            score += 100 / max_features
            metrics["attendance_records_30d"] = attendance_records
        
        doubts_posted = self.db.query(func.count(DoubtPost.id)).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.created_at >= thirty_days_ago
        ).scalar() or 0
        
        if doubts_posted > 0:
            score += 100 / max_features
            metrics["doubts_posted_30d"] = doubts_posted
        
        active_teachers = self.db.query(func.count(func.distinct(Teacher.id))).filter(
            Teacher.institution_id == institution_id,
            Teacher.is_active == True
        ).scalar() or 0
        
        if active_teachers > 0:
            score += 100 / max_features
            metrics["active_teachers"] = active_teachers
        
        active_students = self.db.query(func.count(func.distinct(Student.id))).filter(
            Student.institution_id == institution_id,
            Student.is_active == True
        ).scalar() or 0
        
        if active_students > 0:
            score += 100 / max_features
            metrics["active_students"] = active_students
        
        metrics["features_adopted"] = int((score / 100) * max_features)
        
        return max(0, min(100, score)), metrics
    
    def calculate_data_quality_score(self, institution_id: int) -> Tuple[float, Dict[str, Any]]:
        """Calculate data quality based on completeness and accuracy of institution data."""
        metrics = {}
        score = 100.0
        
        institution = self.db.query(Institution).filter(
            Institution.id == institution_id
        ).first()
        
        if not institution:
            return 0.0, {"reason": "Institution not found"}
        
        total_users = self.db.query(func.count(User.id)).filter(
            User.institution_id == institution_id
        ).scalar() or 0
        
        metrics["total_users"] = total_users
        
        if total_users == 0:
            score -= 40
        
        users_with_complete_profile = self.db.query(func.count(User.id)).filter(
            User.institution_id == institution_id,
            User.first_name.isnot(None),
            User.last_name.isnot(None),
            User.email.isnot(None)
        ).scalar() or 0
        
        if total_users > 0:
            profile_completion_rate = (users_with_complete_profile / total_users * 100)
            metrics["profile_completion_rate"] = round(profile_completion_rate, 2)
            
            if profile_completion_rate < 50:
                score -= 30
            elif profile_completion_rate < 75:
                score -= 15
        
        students_count = self.db.query(func.count(Student.id)).filter(
            Student.institution_id == institution_id
        ).scalar() or 0
        
        teachers_count = self.db.query(func.count(Teacher.id)).filter(
            Teacher.institution_id == institution_id
        ).scalar() or 0
        
        metrics["students_count"] = students_count
        metrics["teachers_count"] = teachers_count
        
        if students_count == 0:
            score -= 20
        if teachers_count == 0:
            score -= 20
        
        if not institution.description:
            score -= 5
        if not institution.logo_url:
            score -= 5
        
        return max(0, min(100, score)), metrics
    
    def calculate_overall_health_score(
        self,
        payment_score: float,
        activity_score: float,
        support_score: float,
        adoption_score: float,
        quality_score: float
    ) -> float:
        """Calculate weighted overall health score."""
        weights = {
            "payment": 0.30,
            "activity": 0.25,
            "support": 0.15,
            "adoption": 0.20,
            "quality": 0.10
        }
        
        overall = (
            payment_score * weights["payment"] +
            activity_score * weights["activity"] +
            support_score * weights["support"] +
            adoption_score * weights["adoption"] +
            quality_score * weights["quality"]
        )
        
        return round(overall, 2)
    
    def identify_risk_factors(
        self,
        payment_metrics: Dict,
        activity_metrics: Dict,
        support_metrics: Dict,
        adoption_metrics: Dict,
        quality_metrics: Dict
    ) -> List[Dict[str, Any]]:
        """Identify key risk factors from metrics."""
        risk_factors = []
        
        if payment_metrics.get("failed_payments_90d", 0) > 2:
            risk_factors.append({
                "factor": "Payment Failures",
                "severity": "high",
                "description": f"{payment_metrics['failed_payments_90d']} failed payments in last 90 days",
                "impact_score": 0.8
            })
        
        if activity_metrics.get("mau_ratio", 0) < 20:
            risk_factors.append({
                "factor": "Low User Engagement",
                "severity": "critical",
                "description": f"Only {activity_metrics.get('mau_ratio', 0):.1f}% users active monthly",
                "impact_score": 0.9
            })
        
        if support_metrics.get("unanswered_ratio", 0) > 40:
            risk_factors.append({
                "factor": "High Unanswered Support Tickets",
                "severity": "high",
                "description": f"{support_metrics.get('unanswered_ratio', 0):.1f}% doubts unanswered",
                "impact_score": 0.7
            })
        
        if adoption_metrics.get("features_adopted", 0) < 3:
            risk_factors.append({
                "factor": "Low Feature Adoption",
                "severity": "medium",
                "description": f"Only {adoption_metrics.get('features_adopted', 0)} features being used",
                "impact_score": 0.6
            })
        
        if quality_metrics.get("profile_completion_rate", 0) < 50:
            risk_factors.append({
                "factor": "Poor Data Quality",
                "severity": "medium",
                "description": f"Only {quality_metrics.get('profile_completion_rate', 0):.1f}% profiles complete",
                "impact_score": 0.5
            })
        
        return sorted(risk_factors, key=lambda x: x["impact_score"], reverse=True)
    
    def generate_recommended_actions(
        self,
        risk_factors: List[Dict],
        overall_score: float
    ) -> List[Dict[str, Any]]:
        """Generate recommended interventions based on risk factors."""
        actions = []
        
        for risk in risk_factors:
            if risk["factor"] == "Payment Failures":
                actions.append({
                    "action": "Contact institution about payment issues",
                    "priority": "urgent",
                    "category": "billing",
                    "description": "Reach out to understand payment challenges and offer flexible options",
                    "expected_impact": "Reduce churn risk by 30%"
                })
            
            elif risk["factor"] == "Low User Engagement":
                actions.append({
                    "action": "Schedule engagement campaign",
                    "priority": "high",
                    "category": "engagement",
                    "description": "Launch targeted communication and training for inactive users",
                    "expected_impact": "Increase MAU by 15-25%"
                })
            
            elif risk["factor"] == "High Unanswered Support Tickets":
                actions.append({
                    "action": "Provide support escalation",
                    "priority": "high",
                    "category": "support",
                    "description": "Assign dedicated support to resolve pending doubts",
                    "expected_impact": "Improve satisfaction by 20%"
                })
            
            elif risk["factor"] == "Low Feature Adoption":
                actions.append({
                    "action": "Conduct feature training session",
                    "priority": "medium",
                    "category": "training",
                    "description": "Schedule webinar to demonstrate unused features",
                    "expected_impact": "Increase feature usage by 40%"
                })
            
            elif risk["factor"] == "Poor Data Quality":
                actions.append({
                    "action": "Data cleanup initiative",
                    "priority": "medium",
                    "category": "data",
                    "description": "Guide institution to complete user profiles",
                    "expected_impact": "Improve platform value by 15%"
                })
        
        if overall_score < 40:
            actions.insert(0, {
                "action": "Executive intervention required",
                "priority": "urgent",
                "category": "escalation",
                "description": "Critical health score - schedule immediate executive call",
                "expected_impact": "Prevent imminent churn"
            })
        
        return actions[:5]
    
    def predict_churn_ml(self, institution_id: int) -> Tuple[float, str, List[Dict]]:
        """Predict churn probability using ML model."""
        active_model = self.db.query(ChurnPredictionModel).filter(
            ChurnPredictionModel.is_active == True
        ).order_by(desc(ChurnPredictionModel.created_at)).first()
        
        if not active_model:
            return self._predict_churn_rule_based(institution_id)
        
        try:
            model = joblib.load(active_model.model_path)
            if active_model.scaler_path:
                scaler = joblib.load(active_model.scaler_path)
            else:
                scaler = None
            
            features = self._extract_features_for_prediction(institution_id)
            
            if scaler:
                features_scaled = scaler.transform([features])
            else:
                features_scaled = [features]
            
            churn_prob = model.predict_proba(features_scaled)[0][1]
            
            feature_names = active_model.feature_names or []
            feature_importances = active_model.feature_importances or {}
            
            key_factors = []
            for i, (name, value) in enumerate(zip(feature_names, features)):
                if name in feature_importances:
                    key_factors.append({
                        "feature": name,
                        "value": value,
                        "importance": feature_importances[name]
                    })
            
            key_factors = sorted(key_factors, key=lambda x: x["importance"], reverse=True)[:5]
            
            if churn_prob > 0.7:
                risk_level = "critical"
            elif churn_prob > 0.5:
                risk_level = "high"
            elif churn_prob > 0.3:
                risk_level = "medium"
            else:
                risk_level = "low"
            
            return churn_prob, risk_level, key_factors
        
        except Exception as e:
            print(f"ML prediction failed: {str(e)}")
            return self._predict_churn_rule_based(institution_id)
    
    def _predict_churn_rule_based(self, institution_id: int) -> Tuple[float, str, List[Dict]]:
        """Fallback rule-based churn prediction."""
        health_score = self.db.query(InstitutionHealthScore).filter(
            InstitutionHealthScore.institution_id == institution_id
        ).first()
        
        if not health_score:
            return 0.5, "medium", []
        
        overall = health_score.overall_health_score
        payment = health_score.payment_health_score
        activity = health_score.user_activity_score
        
        churn_prob = 0.0
        
        churn_prob += (100 - overall) / 200
        
        if payment < 40:
            churn_prob += 0.3
        elif payment < 60:
            churn_prob += 0.15
        
        if activity < 30:
            churn_prob += 0.25
        elif activity < 50:
            churn_prob += 0.1
        
        churn_prob = min(1.0, churn_prob)
        
        if churn_prob > 0.7:
            risk_level = "critical"
        elif churn_prob > 0.5:
            risk_level = "high"
        elif churn_prob > 0.3:
            risk_level = "medium"
        else:
            risk_level = "low"
        
        key_factors = [
            {"feature": "overall_health_score", "value": overall, "importance": 0.4},
            {"feature": "payment_health_score", "value": payment, "importance": 0.3},
            {"feature": "user_activity_score", "value": activity, "importance": 0.3}
        ]
        
        return churn_prob, risk_level, key_factors
    
    def _extract_features_for_prediction(self, institution_id: int) -> List[float]:
        """Extract features for ML prediction."""
        today = datetime.utcnow()
        thirty_days_ago = today - timedelta(days=30)
        ninety_days_ago = today - timedelta(days=90)
        
        features = []
        
        subscription = self.db.query(Subscription).filter(
            Subscription.institution_id == institution_id
        ).order_by(desc(Subscription.created_at)).first()
        
        features.append(1 if subscription and subscription.status == "active" else 0)
        features.append(1 if subscription and subscription.status == "trial" else 0)
        features.append(subscription.price if subscription else 0)
        
        failed_payments = self.db.query(func.count(Payment.id)).filter(
            and_(
                Payment.institution_id == institution_id,
                Payment.status == "failed",
                Payment.created_at >= ninety_days_ago
            )
        ).scalar() or 0
        features.append(failed_payments)
        
        successful_payments = self.db.query(func.count(Payment.id)).filter(
            and_(
                Payment.institution_id == institution_id,
                Payment.status == "paid",
                Payment.paid_at >= ninety_days_ago
            )
        ).scalar() or 0
        features.append(successful_payments)
        
        total_users = self.db.query(func.count(User.id)).filter(
            User.institution_id == institution_id
        ).scalar() or 0
        features.append(total_users)
        
        mau = self.db.query(func.count(func.distinct(User.id))).filter(
            User.institution_id == institution_id,
            User.last_login >= thirty_days_ago
        ).scalar() or 0
        features.append(mau)
        features.append((mau / total_users * 100) if total_users > 0 else 0)
        
        doubts_count = self.db.query(func.count(DoubtPost.id)).filter(
            DoubtPost.institution_id == institution_id,
            DoubtPost.created_at >= thirty_days_ago
        ).scalar() or 0
        features.append(doubts_count)
        
        assignments_count = self.db.query(func.count(Assignment.id)).filter(
            Assignment.institution_id == institution_id,
            Assignment.created_at >= thirty_days_ago
        ).scalar() or 0
        features.append(assignments_count)
        
        return features
    
    def calculate_health_score(self, institution_id: int) -> InstitutionHealthScore:
        """Calculate and update health score for an institution."""
        payment_score, payment_metrics = self.calculate_payment_health_score(institution_id)
        activity_score, activity_metrics = self.calculate_user_activity_score(institution_id)
        support_score, support_metrics = self.calculate_support_ticket_score(institution_id)
        adoption_score, adoption_metrics = self.calculate_feature_adoption_score(institution_id)
        quality_score, quality_metrics = self.calculate_data_quality_score(institution_id)
        
        overall_score = self.calculate_overall_health_score(
            payment_score, activity_score, support_score, adoption_score, quality_score
        )
        
        all_metrics = {
            "payment": payment_metrics,
            "activity": activity_metrics,
            "support": support_metrics,
            "adoption": adoption_metrics,
            "quality": quality_metrics
        }
        
        risk_factors = self.identify_risk_factors(
            payment_metrics, activity_metrics, support_metrics,
            adoption_metrics, quality_metrics
        )
        
        recommended_actions = self.generate_recommended_actions(risk_factors, overall_score)
        
        churn_prob, risk_level, key_factors = self.predict_churn_ml(institution_id)
        churn_risk_score = churn_prob * 100
        
        existing_score = self.db.query(InstitutionHealthScore).filter(
            InstitutionHealthScore.institution_id == institution_id
        ).first()
        
        if existing_score:
            previous_score = existing_score.overall_health_score
            score_change = overall_score - previous_score
            score_change_pct = (score_change / previous_score * 100) if previous_score > 0 else 0
            
            if score_change_pct > 5:
                trend = "improving"
            elif score_change_pct < -5:
                trend = "declining"
            else:
                trend = "stable"
            
            self._save_to_history(existing_score)
            
            existing_score.overall_health_score = overall_score
            existing_score.payment_health_score = payment_score
            existing_score.user_activity_score = activity_score
            existing_score.support_ticket_score = support_score
            existing_score.feature_adoption_score = adoption_score
            existing_score.data_quality_score = quality_score
            existing_score.churn_risk_score = churn_risk_score
            existing_score.churn_probability = churn_prob
            existing_score.risk_level = risk_level
            existing_score.health_trend = trend
            existing_score.previous_score = previous_score
            existing_score.score_change_percentage = round(score_change_pct, 2)
            existing_score.metrics_data = all_metrics
            existing_score.risk_factors = risk_factors
            existing_score.recommended_actions = recommended_actions
            existing_score.last_calculated_at = datetime.utcnow()
            
            health_score = existing_score
        else:
            health_score = InstitutionHealthScore(
                institution_id=institution_id,
                overall_health_score=overall_score,
                payment_health_score=payment_score,
                user_activity_score=activity_score,
                support_ticket_score=support_score,
                feature_adoption_score=adoption_score,
                data_quality_score=quality_score,
                churn_risk_score=churn_risk_score,
                churn_probability=churn_prob,
                risk_level=risk_level,
                health_trend="stable",
                metrics_data=all_metrics,
                risk_factors=risk_factors,
                recommended_actions=recommended_actions,
                last_calculated_at=datetime.utcnow()
            )
            self.db.add(health_score)
        
        self.db.commit()
        self.db.refresh(health_score)
        
        self._create_alerts_if_needed(health_score)
        
        return health_score
    
    def _save_to_history(self, health_score: InstitutionHealthScore) -> None:
        """Save current health score to history."""
        history = InstitutionHealthHistory(
            health_score_id=health_score.id,
            institution_id=health_score.institution_id,
            overall_health_score=health_score.overall_health_score,
            payment_health_score=health_score.payment_health_score,
            user_activity_score=health_score.user_activity_score,
            support_ticket_score=health_score.support_ticket_score,
            feature_adoption_score=health_score.feature_adoption_score,
            data_quality_score=health_score.data_quality_score,
            churn_risk_score=health_score.churn_risk_score,
            churn_probability=health_score.churn_probability,
            risk_level=health_score.risk_level,
            metrics_snapshot=health_score.metrics_data,
            recorded_at=datetime.utcnow()
        )
        self.db.add(history)
    
    def _create_alerts_if_needed(self, health_score: InstitutionHealthScore) -> None:
        """Create alerts for critical issues."""
        alerts_to_create = []
        
        if health_score.overall_health_score < 40:
            alerts_to_create.append({
                "alert_type": "critical_health",
                "severity": "critical",
                "title": "Critical Institution Health",
                "description": f"Overall health score dropped to {health_score.overall_health_score:.1f}",
                "metric_name": "overall_health_score",
                "current_value": health_score.overall_health_score,
                "threshold_value": 40
            })
        
        if health_score.payment_health_score < 30:
            alerts_to_create.append({
                "alert_type": "payment_issues",
                "severity": "urgent",
                "title": "Payment Health Critical",
                "description": "Multiple payment failures or expired subscription",
                "metric_name": "payment_health_score",
                "current_value": health_score.payment_health_score,
                "threshold_value": 30
            })
        
        if health_score.user_activity_score < 25:
            alerts_to_create.append({
                "alert_type": "low_engagement",
                "severity": "high",
                "title": "Low User Engagement",
                "description": "User activity has fallen below acceptable threshold",
                "metric_name": "user_activity_score",
                "current_value": health_score.user_activity_score,
                "threshold_value": 25
            })
        
        if health_score.churn_probability > 0.7:
            alerts_to_create.append({
                "alert_type": "high_churn_risk",
                "severity": "critical",
                "title": "High Churn Risk Detected",
                "description": f"Churn probability: {health_score.churn_probability*100:.1f}%",
                "metric_name": "churn_probability",
                "current_value": health_score.churn_probability,
                "threshold_value": 0.7
            })
        
        for alert_data in alerts_to_create:
            existing_alert = self.db.query(InstitutionHealthAlert).filter(
                and_(
                    InstitutionHealthAlert.institution_id == health_score.institution_id,
                    InstitutionHealthAlert.alert_type == alert_data["alert_type"],
                    InstitutionHealthAlert.is_resolved == False
                )
            ).first()
            
            if not existing_alert:
                alert = InstitutionHealthAlert(
                    health_score_id=health_score.id,
                    institution_id=health_score.institution_id,
                    **alert_data
                )
                self.db.add(alert)
        
        self.db.commit()
    
    def get_all_health_scores(
        self,
        risk_level: Optional[str] = None,
        min_churn_prob: Optional[float] = None,
        sort_by: str = "churn_risk_score",
        limit: int = 100
    ) -> List[InstitutionHealthScore]:
        """Get health scores for all institutions with filters."""
        query = self.db.query(InstitutionHealthScore)
        
        if risk_level:
            query = query.filter(InstitutionHealthScore.risk_level == risk_level)
        
        if min_churn_prob is not None:
            query = query.filter(InstitutionHealthScore.churn_probability >= min_churn_prob)
        
        if sort_by == "churn_risk_score":
            query = query.order_by(desc(InstitutionHealthScore.churn_risk_score))
        elif sort_by == "overall_health_score":
            query = query.order_by(InstitutionHealthScore.overall_health_score)
        else:
            query = query.order_by(desc(InstitutionHealthScore.last_calculated_at))
        
        return query.limit(limit).all()
    
    def train_churn_prediction_model(
        self,
        validation_split: float = 0.2,
        hyperparameters: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Train ML model for churn prediction."""
        institutions = self.db.query(Institution).filter(
            Institution.is_active == True
        ).all()
        
        X = []
        y = []
        
        for inst in institutions:
            features = self._extract_features_for_prediction(inst.id)
            
            subscription = self.db.query(Subscription).filter(
                Subscription.institution_id == inst.id
            ).order_by(desc(Subscription.created_at)).first()
            
            churned = 1 if subscription and subscription.status in ["cancelled", "expired"] else 0
            
            X.append(features)
            y.append(churned)
        
        if len(X) < 10:
            return {"error": "Not enough data to train model"}
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=validation_split, random_state=42
        )
        
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        if hyperparameters:
            model = GradientBoostingClassifier(**hyperparameters)
        else:
            model = GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=5,
                random_state=42
            )
        
        model.fit(X_train_scaled, y_train)
        
        y_pred = model.predict(X_test_scaled)
        
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        feature_names = [
            "subscription_active", "subscription_trial", "subscription_price",
            "failed_payments_90d", "successful_payments_90d",
            "total_users", "monthly_active_users", "mau_ratio",
            "doubts_30d", "assignments_30d"
        ]
        
        feature_importances = dict(zip(feature_names, model.feature_importances_.tolist()))
        
        version = f"v{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        model_path = os.path.join(self.models_dir, f"churn_model_{version}.pkl")
        scaler_path = os.path.join(self.models_dir, f"scaler_{version}.pkl")
        
        joblib.dump(model, model_path)
        joblib.dump(scaler, scaler_path)
        
        existing_active = self.db.query(ChurnPredictionModel).filter(
            ChurnPredictionModel.is_active == True
        ).all()
        for old_model in existing_active:
            old_model.is_active = False
        
        model_record = ChurnPredictionModel(
            model_version=version,
            model_type="GradientBoosting",
            model_path=model_path,
            scaler_path=scaler_path,
            accuracy=accuracy,
            precision=precision,
            recall=recall,
            f1_score=f1,
            feature_importances=feature_importances,
            feature_names=feature_names,
            training_metrics={
                "train_size": len(X_train),
                "test_size": len(X_test),
                "validation_split": validation_split
            },
            hyperparameters=hyperparameters or {},
            is_active=True,
            trained_at=datetime.utcnow()
        )
        
        self.db.add(model_record)
        self.db.commit()
        
        return {
            "model_version": version,
            "accuracy": accuracy,
            "precision": precision,
            "recall": recall,
            "f1_score": f1,
            "feature_importances": feature_importances
        }
