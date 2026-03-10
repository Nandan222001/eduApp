#!/usr/bin/env python3
"""
Subscription Service Usage Examples

This script demonstrates how to use the Subscription Service programmatically.
"""

import sys
import os
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from datetime import datetime, timedelta
from decimal import Decimal

from src.database import SessionLocal
from src.services.subscription_service import SubscriptionService, SubscriptionPlans
from src.schemas.subscription import SubscriptionCreate, SubscriptionUpdate, BillingCycle
from src.config import settings


def example_create_subscription(service: SubscriptionService, institution_id: int) -> None:
    print("\n=== Creating a new subscription ===")
    
    subscription_data = SubscriptionCreate(
        institution_id=institution_id,
        plan_name="Growth",
        billing_cycle=BillingCycle.MONTHLY,
        auto_renew=True,
    )
    
    subscription = service.create_subscription(subscription_data, trial_days=14)
    
    print(f"Subscription created:")
    print(f"  ID: {subscription.id}")
    print(f"  Plan: {subscription.plan_name}")
    print(f"  Status: {subscription.status}")
    print(f"  Price: {subscription.currency} {subscription.price}")
    print(f"  Trial ends: {subscription.trial_end_date}")
    print(f"  Next billing: {subscription.next_billing_date}")


def example_list_plans(service: SubscriptionService) -> None:
    print("\n=== Available Subscription Plans ===")
    
    plans = SubscriptionPlans.get_all_plans()
    
    for plan_name, plan_data in plans.items():
        print(f"\n{plan_data['display_name']} Plan:")
        print(f"  Description: {plan_data['description']}")
        print(f"  Monthly: ₹{plan_data['monthly_price']}")
        print(f"  Quarterly: ₹{plan_data['quarterly_price']}")
        print(f"  Yearly: ₹{plan_data['yearly_price']}")
        print(f"  Max Users: {plan_data['max_users'] or 'Unlimited'}")
        print(f"  Storage: {plan_data['max_storage_gb'] or 'Unlimited'} GB")
        print(f"  Features: {', '.join(plan_data['features'][:3])}...")


def example_upgrade_subscription(service: SubscriptionService, subscription_id: int) -> None:
    print("\n=== Upgrading subscription ===")
    
    result = service.upgrade_subscription(subscription_id, "Professional")
    
    subscription = result["subscription"]
    prorated_amount = result["prorated_amount"]
    
    print(f"Subscription upgraded:")
    print(f"  New Plan: {subscription.plan_name}")
    print(f"  New Price: {subscription.currency} {subscription.price}")
    print(f"  Prorated charge: {subscription.currency} {prorated_amount}")
    print(f"  Immediate charge required: {result['immediate_charge']}")


def example_generate_invoice(service: SubscriptionService, subscription_id: int) -> None:
    print("\n=== Generating invoice ===")
    
    invoice = service.generate_invoice(subscription_id)
    
    print(f"Invoice generated:")
    print(f"  Invoice Number: {invoice.invoice_number}")
    print(f"  Amount: {invoice.currency} {invoice.amount}")
    print(f"  Tax: {invoice.currency} {invoice.tax_amount}")
    print(f"  Total: {invoice.currency} {invoice.total_amount}")
    print(f"  Due Date: {invoice.due_date}")
    print(f"  Status: {invoice.status}")


def example_record_usage(service: SubscriptionService, subscription_id: int) -> None:
    print("\n=== Recording usage metrics ===")
    
    now = datetime.utcnow()
    period_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    period_end = now
    
    usage_record = service.record_usage(
        subscription_id=subscription_id,
        metric_name="api_calls",
        metric_value=Decimal("15000"),
        period_start=period_start,
        period_end=period_end,
    )
    
    print(f"Usage recorded:")
    print(f"  Metric: {usage_record.metric_name}")
    print(f"  Value: {usage_record.metric_value}")
    print(f"  Period: {usage_record.period_start} to {usage_record.period_end}")


def example_cancel_subscription(service: SubscriptionService, subscription_id: int) -> None:
    print("\n=== Canceling subscription ===")
    
    subscription = service.cancel_subscription(
        subscription_id,
        immediate=False,
        reason="Testing cancellation"
    )
    
    print(f"Subscription canceled:")
    print(f"  Status: {subscription.status}")
    print(f"  Canceled at: {subscription.canceled_at}")
    print(f"  End date: {subscription.end_date}")
    print(f"  Auto-renew: {subscription.auto_renew}")


def example_list_subscriptions(service: SubscriptionService, institution_id: int) -> None:
    print("\n=== Listing subscriptions ===")
    
    subscriptions, total = service.list_subscriptions(institution_id=institution_id)
    
    print(f"Total subscriptions: {total}")
    for sub in subscriptions:
        print(f"\n  Subscription #{sub.id}:")
        print(f"    Plan: {sub.plan_name}")
        print(f"    Status: {sub.status}")
        print(f"    Price: {sub.currency} {sub.price}/{sub.billing_cycle}")
        print(f"    Next billing: {sub.next_billing_date}")


def example_payment_creation(service: SubscriptionService, subscription_id: int) -> None:
    print("\n=== Creating payment order ===")
    
    order_data = service.create_razorpay_order(subscription_id)
    
    print(f"Razorpay order created:")
    print(f"  Order ID: {order_data['order_id']}")
    print(f"  Amount (paise): {order_data['amount']}")
    print(f"  Currency: {order_data['currency']}")
    print(f"  Status: {order_data['status']}")
    
    subscription = service.get_subscription(subscription_id)
    payment = service.create_payment(subscription_id, subscription.price, "razorpay")
    
    print(f"\nPayment record created:")
    print(f"  Payment ID: {payment.id}")
    print(f"  Amount: {payment.currency} {payment.amount}")
    print(f"  Status: {payment.status}")


def main() -> None:
    print("=" * 60)
    print("Subscription Service Examples")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        service = SubscriptionService(
            db,
            settings.razorpay_key_id,
            settings.razorpay_key_secret,
        )
        
        example_list_plans(service)
        
        print("\n\nNote: To run other examples, you need to:")
        print("1. Create an institution in the database")
        print("2. Uncomment the example function calls below")
        print("3. Replace institution_id and subscription_id with actual values")
        
    finally:
        db.close()


if __name__ == "__main__":
    main()
