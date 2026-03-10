from datetime import datetime, timedelta
from typing import List
from sqlalchemy.orm import Session

from src.models.subscription import Subscription
from src.services.subscription_service import SubscriptionService
from src.schemas.subscription import SubscriptionStatus
from src.database import SessionLocal


class SubscriptionTaskManager:
    def __init__(self, db: Session, subscription_service: SubscriptionService):
        self.db = db
        self.subscription_service = subscription_service

    def process_renewal_reminders(self) -> List[dict]:
        subscriptions_due = self.subscription_service.check_subscriptions_for_renewal()
        
        reminders_sent = []
        for subscription in subscriptions_due:
            days_until_renewal = (subscription.next_billing_date - datetime.utcnow()).days
            
            reminder_info = {
                "subscription_id": subscription.id,
                "institution_id": subscription.institution_id,
                "plan_name": subscription.plan_name,
                "next_billing_date": subscription.next_billing_date,
                "days_until_renewal": days_until_renewal,
                "amount": float(subscription.price),
                "currency": subscription.currency,
            }
            
            reminders_sent.append(reminder_info)
        
        return reminders_sent

    def process_expired_trials(self) -> List[dict]:
        expired_trials = self.subscription_service.check_expired_trials()
        
        processed = []
        for subscription in expired_trials:
            if subscription.auto_renew:
                try:
                    self.subscription_service.renew_subscription(subscription.id)
                    processed.append({
                        "subscription_id": subscription.id,
                        "institution_id": subscription.institution_id,
                        "action": "renewed",
                        "status": "success",
                    })
                except Exception as e:
                    self.subscription_service.handle_failed_payment(subscription.id)
                    processed.append({
                        "subscription_id": subscription.id,
                        "institution_id": subscription.institution_id,
                        "action": "renewal_failed",
                        "status": "grace_period",
                        "error": str(e),
                    })
            else:
                subscription.status = SubscriptionStatus.EXPIRED
                subscription.end_date = datetime.utcnow()
                self.db.commit()
                
                processed.append({
                    "subscription_id": subscription.id,
                    "institution_id": subscription.institution_id,
                    "action": "expired",
                    "status": "expired",
                })
        
        return processed

    def process_expired_grace_periods(self) -> List[dict]:
        expired_grace = self.subscription_service.check_expired_grace_periods()
        
        processed = []
        for subscription in expired_grace:
            self.subscription_service.handle_expired_grace_period(subscription.id)
            
            processed.append({
                "subscription_id": subscription.id,
                "institution_id": subscription.institution_id,
                "action": "grace_period_expired",
                "status": "expired",
            })
        
        return processed

    def process_upcoming_renewals(self) -> List[dict]:
        now = datetime.utcnow()
        upcoming_renewals = (
            self.db.query(Subscription)
            .filter(
                Subscription.status == SubscriptionStatus.ACTIVE,
                Subscription.auto_renew == True,
                Subscription.next_billing_date <= now,
            )
            .all()
        )
        
        processed = []
        for subscription in upcoming_renewals:
            try:
                invoice = self.subscription_service.generate_invoice(subscription.id)
                
                payment = self.subscription_service.create_payment(
                    subscription.id,
                    subscription.price,
                )
                
                subscription.next_billing_date = self.subscription_service._calculate_next_billing_date(
                    now, subscription.billing_cycle
                )
                self.db.commit()
                
                processed.append({
                    "subscription_id": subscription.id,
                    "institution_id": subscription.institution_id,
                    "action": "renewal_initiated",
                    "invoice_id": invoice.id,
                    "payment_id": payment.id,
                    "status": "success",
                })
            except Exception as e:
                self.subscription_service.handle_failed_payment(subscription.id)
                processed.append({
                    "subscription_id": subscription.id,
                    "institution_id": subscription.institution_id,
                    "action": "renewal_failed",
                    "status": "grace_period",
                    "error": str(e),
                })
        
        return processed

    def check_overdue_invoices(self) -> List[dict]:
        from src.models.subscription import Invoice
        from src.schemas.subscription import InvoiceStatus
        
        now = datetime.utcnow()
        overdue_invoices = (
            self.db.query(Invoice)
            .filter(
                Invoice.status == InvoiceStatus.OPEN,
                Invoice.due_date < now,
            )
            .all()
        )
        
        updated = []
        for invoice in overdue_invoices:
            invoice.status = InvoiceStatus.OVERDUE
            
            subscription = self.subscription_service.get_subscription(invoice.subscription_id)
            if subscription and subscription.status == SubscriptionStatus.ACTIVE:
                self.subscription_service.handle_failed_payment(subscription.id)
            
            updated.append({
                "invoice_id": invoice.id,
                "subscription_id": invoice.subscription_id,
                "institution_id": invoice.institution_id,
                "status": "overdue",
            })
        
        self.db.commit()
        return updated


def run_subscription_tasks() -> dict:
    db = SessionLocal()
    try:
        from src.config import settings
        
        subscription_service = SubscriptionService(
            db,
            settings.razorpay_key_id,
            settings.razorpay_key_secret,
        )
        
        task_manager = SubscriptionTaskManager(db, subscription_service)
        
        results = {
            "timestamp": datetime.utcnow().isoformat(),
            "renewal_reminders": task_manager.process_renewal_reminders(),
            "expired_trials": task_manager.process_expired_trials(),
            "expired_grace_periods": task_manager.process_expired_grace_periods(),
            "upcoming_renewals": task_manager.process_upcoming_renewals(),
            "overdue_invoices": task_manager.check_overdue_invoices(),
        }
        
        return results
    finally:
        db.close()
