# Subscription Module - Quick Reference

## Plans & Pricing (INR)

| Plan | Monthly | Quarterly | Yearly | Users | Storage |
|------|---------|-----------|--------|-------|---------|
| Starter | ₹999 | ₹2,699 | ₹9,999 | 10 | 50 GB |
| Growth | ₹2,999 | ₹8,099 | ₹29,999 | 50 | 250 GB |
| Professional | ₹7,999 | ₹21,599 | ₹79,999 | 200 | 1 TB |
| Enterprise | ₹19,999 | ₹53,999 | ₹199,999 | ∞ | ∞ |

## Subscription Statuses

| Status | Description |
|--------|-------------|
| `trialing` | In trial period (14 days) |
| `active` | Active and billable |
| `past_due` | Payment failed, in grace period |
| `grace_period` | Grace period active (7 days) |
| `canceled` | Subscription canceled |
| `expired` | Grace period expired |
| `paused` | Temporarily paused |

## Common API Calls

### Create Subscription
```bash
POST /api/v1/subscriptions/?trial_days=14
{
  "institution_id": 1,
  "plan_name": "Growth",
  "billing_cycle": "monthly",
  "auto_renew": true
}
```

### Get Active Subscription
```bash
GET /api/v1/subscriptions/institution/{institution_id}
```

### Upgrade Plan
```bash
POST /api/v1/subscriptions/{id}/upgrade
{
  "new_plan_name": "Professional"
}
```

### Cancel Subscription
```bash
POST /api/v1/subscriptions/{id}/cancel
{
  "immediate": false,
  "reason": "Optional reason"
}
```

### Create Payment Order
```bash
POST /api/v1/subscriptions/{id}/payments/create-order
```

### Record Usage
```bash
POST /api/v1/subscriptions/{id}/usage
{
  "subscription_id": 1,
  "institution_id": 1,
  "metric_name": "api_calls",
  "metric_value": 15000,
  "period_start": "2024-01-01T00:00:00Z",
  "period_end": "2024-01-31T23:59:59Z"
}
```

## Service Usage (Python)

### Initialize Service
```python
from src.services.subscription_service import SubscriptionService
from src.config import settings

service = SubscriptionService(
    db,
    settings.razorpay_key_id,
    settings.razorpay_key_secret,
)
```

### Create Subscription
```python
from src.schemas.subscription import SubscriptionCreate

subscription_data = SubscriptionCreate(
    institution_id=1,
    plan_name="Growth",
    billing_cycle="monthly",
    auto_renew=True,
)
subscription = service.create_subscription(subscription_data, trial_days=14)
```

### Check Subscription Limit
```python
subscription = service.get_institution_subscription(institution_id)
if subscription.max_users and current_users >= subscription.max_users:
    raise HTTPException(status_code=402, detail="User limit reached")
```

### Record Usage
```python
service.record_usage(
    subscription_id=1,
    metric_name="api_calls",
    metric_value=Decimal("1000"),
    period_start=datetime.utcnow().replace(day=1),
    period_end=datetime.utcnow(),
)
```

## Database Queries

### Active Subscriptions
```sql
SELECT * FROM subscriptions 
WHERE status = 'active' 
AND institution_id = 1;
```

### MRR Calculation
```sql
SELECT SUM(price) as mrr 
FROM subscriptions 
WHERE status = 'active' 
AND billing_cycle = 'monthly';
```

### Overdue Invoices
```sql
SELECT * FROM invoices 
WHERE status = 'open' 
AND due_date < NOW();
```

### Usage Summary
```sql
SELECT metric_name, SUM(metric_value) as total
FROM usage_records
WHERE subscription_id = 1
AND period_start >= '2024-01-01'
GROUP BY metric_name;
```

## Razorpay Integration

### Frontend (JavaScript)
```javascript
const options = {
  key: 'rzp_test_key',
  amount: orderData.amount * 100,
  currency: 'INR',
  order_id: orderData.order_id,
  handler: function (response) {
    verifyPayment(response);
  },
};
const razorpay = new Razorpay(options);
razorpay.open();
```

### Verify Payment
```javascript
fetch(`/api/v1/subscriptions/payments/${paymentId}/verify`, {
  method: 'POST',
  body: JSON.stringify({
    razorpay_order_id: response.razorpay_order_id,
    razorpay_payment_id: response.razorpay_payment_id,
    razorpay_signature: response.razorpay_signature,
  }),
});
```

## Webhook Events

| Event | Action |
|-------|--------|
| `payment.captured` | Mark payment as captured, invoice as paid |
| `payment.failed` | Start grace period |
| `subscription.charged` | Process renewal |
| `subscription.cancelled` | Cancel subscription |
| `subscription.paused` | Pause subscription |
| `subscription.resumed` | Resume subscription |

## Scheduled Tasks

### Run Scheduler
```bash
python scripts/subscription_scheduler.py
```

### Cron Setup (Every 6 hours)
```
0 */6 * * * cd /path/to/project && python scripts/subscription_scheduler.py
```

### Tasks Performed
- Send renewal reminders (3 days before)
- Process expired trials
- Process expired grace periods
- Initiate renewals
- Mark overdue invoices

## Configuration

### .env File
```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret
RAZORPAY_WEBHOOK_SECRET=webhook_secret
```

### Settings Access
```python
from src.config import settings
key_id = settings.razorpay_key_id
```

## Database Migration

```bash
# Run migration
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

## Constants

### Grace Period
```python
GRACE_PERIOD_DAYS = 7
```

### Tax Rate
```python
TAX_RATE = Decimal("0.18")  # 18% GST
```

### Trial Period
```python
DEFAULT_TRIAL_DAYS = 14
```

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Invalid plan/billing cycle |
| 401 | Invalid webhook signature |
| 402 | Payment required |
| 404 | Subscription/invoice/payment not found |

## Testing

### Run Tests
```bash
poetry run pytest tests/test_subscription_service.py -v
```

### Test Plan
```python
from src.services.subscription_service import SubscriptionPlans

plan = SubscriptionPlans.get_plan("Growth")
price = SubscriptionPlans.get_plan_price("Growth", "monthly")
```

## Monitoring Queries

### Failed Payments (Last 7 days)
```sql
SELECT COUNT(*) FROM payments 
WHERE status = 'failed' 
AND created_at >= NOW() - INTERVAL '7 days';
```

### Trial Conversions
```sql
SELECT COUNT(*) FROM subscriptions 
WHERE status = 'active' 
AND trial_end_date IS NOT NULL;
```

### Grace Period Count
```sql
SELECT COUNT(*) FROM subscriptions 
WHERE status IN ('past_due', 'grace_period');
```

## Common Patterns

### Check Access
```python
def has_feature_access(db: Session, institution_id: int, feature: str) -> bool:
    subscription = get_active_subscription(db, institution_id)
    if not subscription:
        return False
    features = json.loads(subscription.features)
    return feature in features
```

### Enforce Limits
```python
def check_storage_limit(db: Session, institution_id: int, used_gb: int) -> bool:
    subscription = get_active_subscription(db, institution_id)
    if not subscription or not subscription.max_storage_gb:
        return True  # Unlimited
    return used_gb < subscription.max_storage_gb
```

## Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Payment fails | Check Razorpay credentials |
| Webhook not working | Verify signature, check URL |
| Renewal not happening | Check auto_renew flag, scheduler |
| Prorated amount wrong | Verify billing dates |

## Links

- Full Documentation: `docs/SUBSCRIPTION_BILLING.md`
- API Examples: `docs/SUBSCRIPTION_API_EXAMPLES.md`
- Integration Guide: `docs/SUBSCRIPTION_INTEGRATION_GUIDE.md`
