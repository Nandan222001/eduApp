# Subscription Module Integration Guide

This guide helps you integrate the Subscription and Billing module into your application.

## Quick Start

### 1. Configuration

Add Razorpay credentials to your `.env` file:

```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Database Migration

Run the migration to create subscription tables:

```bash
alembic upgrade head
```

This creates:
- `subscriptions` table
- `payments` table
- `invoices` table
- `usage_records` table

### 3. Start the Application

```bash
uvicorn src.main:app --reload
```

The subscription endpoints will be available at `/api/v1/subscriptions/*`

## Frontend Integration

### Step 1: Display Available Plans

```javascript
async function fetchPlans() {
  const response = await fetch('/api/v1/subscriptions/plans', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });
  const plans = await response.json();
  return plans;
}
```

### Step 2: Create Subscription

```javascript
async function createSubscription(institutionId, planName, billingCycle) {
  const response = await fetch('/api/v1/subscriptions/?trial_days=14', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      institution_id: institutionId,
      plan_name: planName,
      billing_cycle: billingCycle,
      auto_renew: true,
    }),
  });
  return await response.json();
}
```

### Step 3: Handle Payment (Razorpay)

```javascript
async function initiatePayment(subscriptionId) {
  // Create Razorpay order
  const orderResponse = await fetch(
    `/api/v1/subscriptions/${subscriptionId}/payments/create-order`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  const orderData = await orderResponse.json();

  // Initialize Razorpay checkout
  const options = {
    key: 'rzp_test_your_key_id', // Use your Razorpay key
    amount: orderData.amount * 100,
    currency: orderData.currency,
    name: 'Your Company',
    description: 'Subscription Payment',
    order_id: orderData.order_id,
    handler: async function (response) {
      // Verify payment on backend
      await verifyPayment(paymentId, response);
    },
    prefill: {
      name: userName,
      email: userEmail,
    },
    theme: {
      color: '#3399cc',
    },
  };

  const razorpay = new Razorpay(options);
  razorpay.open();
}

async function verifyPayment(paymentId, razorpayResponse) {
  const response = await fetch(
    `/api/v1/subscriptions/payments/${paymentId}/verify`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayResponse.razorpay_order_id,
        razorpay_payment_id: razorpayResponse.razorpay_payment_id,
        razorpay_signature: razorpayResponse.razorpay_signature,
      }),
    }
  );
  return await response.json();
}
```

### Step 4: Display Subscription Status

```javascript
async function getSubscriptionStatus(institutionId) {
  const response = await fetch(
    `/api/v1/subscriptions/institution/${institutionId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );
  return await response.json();
}
```

## Backend Integration

### Using the Subscription Service

```python
from sqlalchemy.orm import Session
from src.services.subscription_service import SubscriptionService
from src.schemas.subscription import SubscriptionCreate
from src.config import settings

def create_subscription_for_institution(db: Session, institution_id: int):
    service = SubscriptionService(
        db,
        settings.razorpay_key_id,
        settings.razorpay_key_secret,
    )
    
    subscription_data = SubscriptionCreate(
        institution_id=institution_id,
        plan_name="Growth",
        billing_cycle="monthly",
        auto_renew=True,
    )
    
    subscription = service.create_subscription(subscription_data, trial_days=14)
    return subscription
```

### Recording Usage Metrics

```python
from datetime import datetime
from decimal import Decimal

def track_api_usage(db: Session, subscription_id: int, api_calls: int):
    service = SubscriptionService(
        db,
        settings.razorpay_key_id,
        settings.razorpay_key_secret,
    )
    
    now = datetime.utcnow()
    period_start = now.replace(day=1, hour=0, minute=0, second=0)
    
    usage_record = service.record_usage(
        subscription_id=subscription_id,
        metric_name="api_calls",
        metric_value=Decimal(str(api_calls)),
        period_start=period_start,
        period_end=now,
    )
    return usage_record
```

### Checking Subscription Limits

```python
from src.models.subscription import Subscription

def check_user_limit(db: Session, institution_id: int, current_users: int) -> bool:
    subscription = (
        db.query(Subscription)
        .filter(
            Subscription.institution_id == institution_id,
            Subscription.status.in_(["active", "trialing"]),
        )
        .first()
    )
    
    if not subscription:
        return False
    
    if subscription.max_users is None:  # Unlimited (Enterprise)
        return True
    
    return current_users < subscription.max_users
```

### Middleware for Subscription Enforcement

```python
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

class SubscriptionMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Extract institution_id from request/token
        institution_id = request.state.institution_id
        
        # Check if institution has active subscription
        db = request.state.db
        subscription = get_active_subscription(db, institution_id)
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="No active subscription",
            )
        
        # Check if subscription is in grace period
        if subscription.status == "grace_period":
            # Allow limited access or redirect to payment
            pass
        
        response = await call_next(request)
        return response
```

## Scheduled Tasks Setup

### Using Cron (Linux/Mac)

Edit crontab:
```bash
crontab -e
```

Add entry to run every 6 hours:
```
0 */6 * * * cd /path/to/project && python scripts/subscription_scheduler.py >> logs/cron.log 2>&1
```

### Using Task Scheduler (Windows)

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger: Daily, repeat every 6 hours
4. Set action: Start a program
5. Program: `python`
6. Arguments: `scripts/subscription_scheduler.py`
7. Start in: `C:\path\to\project`

### Using Celery (Recommended for Production)

```python
from celery import Celery
from src.utils.subscription_tasks import run_subscription_tasks

celery = Celery('tasks', broker='redis://localhost:6379/0')

@celery.task
def process_subscriptions():
    return run_subscription_tasks()

# Schedule task
celery.conf.beat_schedule = {
    'process-subscriptions-every-6-hours': {
        'task': 'tasks.process_subscriptions',
        'schedule': 3600.0 * 6,  # Every 6 hours
    },
}
```

## Webhook Configuration

### Razorpay Dashboard Setup

1. Log in to Razorpay Dashboard
2. Go to Settings → Webhooks
3. Add webhook URL: `https://yourdomain.com/api/v1/webhooks/razorpay`
4. Select events:
   - `payment.captured`
   - `payment.failed`
   - `subscription.charged`
   - `subscription.cancelled`
   - `subscription.paused`
   - `subscription.resumed`
5. Copy webhook secret to `.env`

### Testing Webhooks Locally

Use ngrok to expose local server:

```bash
ngrok http 8000
```

Use the ngrok URL in Razorpay webhook configuration.

## UI Components Examples

### Subscription Plan Cards

```html
<div class="plan-card">
  <h3>Growth Plan</h3>
  <p class="price">₹2,999<span>/month</span></p>
  <ul class="features">
    <li>Up to 50 users</li>
    <li>250 GB storage</li>
    <li>Priority support</li>
    <li>Advanced analytics</li>
  </ul>
  <button onclick="selectPlan('Growth', 'monthly')">
    Start 14-day trial
  </button>
</div>
```

### Subscription Status Badge

```html
<div class="subscription-status">
  <span class="badge badge-success">Active</span>
  <p>Next billing: Jan 29, 2024</p>
  <p>Amount: ₹2,999</p>
</div>
```

### Usage Dashboard

```html
<div class="usage-metrics">
  <div class="metric">
    <h4>API Calls</h4>
    <div class="progress-bar">
      <div class="progress" style="width: 60%"></div>
    </div>
    <p>15,000 / 25,000</p>
  </div>
  <div class="metric">
    <h4>Storage</h4>
    <div class="progress-bar">
      <div class="progress" style="width: 40%"></div>
    </div>
    <p>100 GB / 250 GB</p>
  </div>
</div>
```

## Notifications and Emails

### Send Renewal Reminder

```python
def send_renewal_reminder(subscription: Subscription):
    days_until_renewal = (subscription.next_billing_date - datetime.utcnow()).days
    
    email_data = {
        "to": subscription.institution.admin_email,
        "subject": f"Subscription renewal in {days_until_renewal} days",
        "body": f"""
            Your {subscription.plan_name} subscription will renew on 
            {subscription.next_billing_date.strftime('%B %d, %Y')}.
            
            Amount to be charged: {subscription.currency} {subscription.price}
            
            Update your payment method: https://yourapp.com/billing
        """,
    }
    
    # Send email using your email service
    send_email(email_data)
```

### Failed Payment Notification

```python
def send_payment_failed_notification(subscription: Subscription):
    email_data = {
        "to": subscription.institution.admin_email,
        "subject": "Payment failed - Action required",
        "body": f"""
            Your recent payment for {subscription.plan_name} subscription failed.
            
            Grace period: {subscription.grace_period_end.strftime('%B %d, %Y')}
            Amount due: {subscription.currency} {subscription.price}
            
            Update payment method: https://yourapp.com/billing
            
            Your subscription will be suspended if payment is not received 
            by the grace period end date.
        """,
    }
    
    send_email(email_data)
```

## Testing

### Run Tests

```bash
poetry run pytest tests/test_subscription_service.py -v
```

### Test Coverage

```bash
poetry run pytest tests/test_subscription_service.py --cov=src/services/subscription_service
```

## Monitoring

### Key Metrics to Monitor

1. **Monthly Recurring Revenue (MRR)**
   ```sql
   SELECT SUM(price) FROM subscriptions WHERE status = 'active' AND billing_cycle = 'monthly';
   ```

2. **Churn Rate**
   ```sql
   SELECT COUNT(*) FROM subscriptions 
   WHERE status = 'canceled' 
   AND canceled_at >= NOW() - INTERVAL '30 days';
   ```

3. **Failed Payments**
   ```sql
   SELECT COUNT(*) FROM payments 
   WHERE status = 'failed' 
   AND created_at >= NOW() - INTERVAL '7 days';
   ```

4. **Active Trials**
   ```sql
   SELECT COUNT(*) FROM subscriptions WHERE status = 'trialing';
   ```

## Troubleshooting

### Issue: Payment Verification Fails

**Solution**: Check that webhook secret is correctly configured and signature verification is working.

### Issue: Subscription Not Renewing

**Solution**: Check that auto_renew is enabled and subscription_scheduler is running.

### Issue: Grace Period Not Starting

**Solution**: Verify that handle_failed_payment is called when payment fails.

### Issue: Prorated Amount Incorrect

**Solution**: Check that start_date and next_billing_date are set correctly.

## Security Best Practices

1. ✅ Always verify Razorpay webhook signatures
2. ✅ Store API keys in environment variables, never in code
3. ✅ Use HTTPS for all webhook endpoints
4. ✅ Implement rate limiting on public endpoints
5. ✅ Validate all input data with Pydantic schemas
6. ✅ Log all payment transactions for audit
7. ✅ Encrypt sensitive data in database
8. ✅ Implement proper access controls

## Next Steps

1. Customize subscription plans for your business
2. Implement email notifications
3. Add analytics dashboard
4. Set up monitoring and alerts
5. Configure production webhooks
6. Test payment flows thoroughly
7. Document custom integrations

## Support

- Documentation: `docs/SUBSCRIPTION_BILLING.md`
- API Examples: `docs/SUBSCRIPTION_API_EXAMPLES.md`
- Code Examples: `scripts/subscription_example.py`
