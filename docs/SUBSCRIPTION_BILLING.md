# Subscription and Billing Module

This module provides comprehensive subscription management, payment processing with Razorpay, automated invoicing, usage tracking, and grace period handling.

## Features

- **Multi-tier Subscription Plans**: Starter, Growth, Professional, Enterprise
- **Flexible Billing Cycles**: Monthly, Quarterly, Yearly
- **Payment Gateway Integration**: Razorpay payment processing
- **Automated Invoice Generation**: Generate invoices with tax calculation
- **Renewal Reminders**: Automated reminders for upcoming renewals
- **Usage Tracking**: Track and monitor subscription usage metrics
- **Grace Period Handling**: Configurable grace periods for failed payments
- **Prorated Billing**: Calculate prorated charges for plan upgrades
- **Webhook Support**: Handle Razorpay payment webhooks

## Subscription Plans

### Starter Plan
- **Price**: ₹999/month, ₹2,699/quarter, ₹9,999/year
- **Users**: Up to 10 users
- **Storage**: 50 GB
- **Features**: Basic support, Email notifications, API access

### Growth Plan
- **Price**: ₹2,999/month, ₹8,099/quarter, ₹29,999/year
- **Users**: Up to 50 users
- **Storage**: 250 GB
- **Features**: Priority support, Advanced analytics, Custom integrations, API access, SSO integration

### Professional Plan
- **Price**: ₹7,999/month, ₹21,599/quarter, ₹79,999/year
- **Users**: Up to 200 users
- **Storage**: 1 TB
- **Features**: 24/7 premium support, Advanced security, Custom workflows, Dedicated account manager, API access, SSO integration, Audit logs

### Enterprise Plan
- **Price**: ₹19,999/month, ₹53,999/quarter, ₹199,999/year
- **Users**: Unlimited
- **Storage**: Unlimited
- **Features**: All Professional features plus Custom SLA, On-premise deployment option, Custom integrations, Advanced audit logs, Custom training

## API Endpoints

### Subscription Management

#### Get All Plans
```
GET /api/v1/subscriptions/plans
```

#### Get Plan Details
```
GET /api/v1/subscriptions/plans/{plan_name}
```

#### Create Subscription
```
POST /api/v1/subscriptions/
```
Body:
```json
{
  "institution_id": 1,
  "plan_name": "Growth",
  "billing_cycle": "monthly",
  "auto_renew": true
}
```

Query Parameters:
- `trial_days`: Number of trial days (default: 14, min: 0, max: 90)

#### List Subscriptions
```
GET /api/v1/subscriptions/
```

Query Parameters:
- `institution_id`: Filter by institution
- `status`: Filter by status (active, trialing, past_due, grace_period, canceled, expired, paused)
- `skip`: Pagination offset (default: 0)
- `limit`: Results per page (default: 100, max: 1000)

#### Get Subscription
```
GET /api/v1/subscriptions/{subscription_id}
```

#### Get Institution Subscription
```
GET /api/v1/subscriptions/institution/{institution_id}
```

#### Update Subscription
```
PATCH /api/v1/subscriptions/{subscription_id}
```
Body:
```json
{
  "plan_name": "Professional",
  "billing_cycle": "yearly",
  "auto_renew": false
}
```

#### Upgrade Subscription
```
POST /api/v1/subscriptions/{subscription_id}/upgrade
```
Body:
```json
{
  "new_plan_name": "Professional"
}
```

Response includes prorated amount to charge immediately.

#### Downgrade Subscription
```
POST /api/v1/subscriptions/{subscription_id}/downgrade
```
Body:
```json
{
  "new_plan_name": "Starter"
}
```

Downgrade takes effect at the end of the current billing period.

#### Cancel Subscription
```
POST /api/v1/subscriptions/{subscription_id}/cancel
```
Body:
```json
{
  "immediate": false,
  "reason": "Optional cancellation reason"
}
```

- `immediate=false`: Cancel at end of billing period
- `immediate=true`: Cancel immediately

#### Renew Subscription
```
POST /api/v1/subscriptions/{subscription_id}/renew
```

### Invoice Management

#### Generate Invoice
```
POST /api/v1/subscriptions/{subscription_id}/invoices
```

#### List Invoices
```
GET /api/v1/subscriptions/invoices/
```

Query Parameters:
- `subscription_id`: Filter by subscription
- `institution_id`: Filter by institution
- `status`: Filter by status (draft, open, paid, void, overdue)
- `skip`: Pagination offset
- `limit`: Results per page

#### Get Invoice
```
GET /api/v1/subscriptions/invoices/{invoice_id}
```

#### Mark Invoice as Paid
```
POST /api/v1/subscriptions/invoices/{invoice_id}/mark-paid
```

### Payment Management

#### Create Razorpay Order
```
POST /api/v1/subscriptions/{subscription_id}/payments/create-order
```

Returns Razorpay order details to initiate payment.

#### Create Payment
```
POST /api/v1/subscriptions/{subscription_id}/payments
```

Query Parameters:
- `payment_method`: Optional payment method

#### Verify Razorpay Payment
```
POST /api/v1/subscriptions/payments/{payment_id}/verify
```
Body:
```json
{
  "razorpay_order_id": "order_xxx",
  "razorpay_payment_id": "pay_xxx",
  "razorpay_signature": "signature_xxx"
}
```

#### List Payments
```
GET /api/v1/subscriptions/payments/
```

Query Parameters:
- `subscription_id`: Filter by subscription
- `institution_id`: Filter by institution
- `status`: Filter by status (pending, authorized, captured, failed, refunded)
- `skip`: Pagination offset
- `limit`: Results per page

### Usage Tracking

#### Record Usage
```
POST /api/v1/subscriptions/{subscription_id}/usage
```
Body:
```json
{
  "subscription_id": 1,
  "institution_id": 1,
  "metric_name": "api_calls",
  "metric_value": 1000,
  "period_start": "2024-01-01T00:00:00Z",
  "period_end": "2024-01-31T23:59:59Z"
}
```

#### Get Usage Records
```
GET /api/v1/subscriptions/usage/
```

Query Parameters:
- `subscription_id`: Filter by subscription
- `institution_id`: Filter by institution
- `metric_name`: Filter by metric (e.g., "api_calls", "storage_gb", "active_users")
- `period_start`: Filter by period start
- `period_end`: Filter by period end
- `skip`: Pagination offset
- `limit`: Results per page

### Admin Endpoints

#### Check Subscriptions for Renewal
```
GET /api/v1/subscriptions/admin/check-renewals
```

Returns subscriptions due for renewal in the next 3 days.

#### Check Expired Trials
```
GET /api/v1/subscriptions/admin/check-expired-trials
```

Returns subscriptions with expired trial periods.

#### Check Expired Grace Periods
```
GET /api/v1/subscriptions/admin/check-expired-grace-periods
```

Returns subscriptions with expired grace periods.

### Webhooks

#### Razorpay Webhook
```
POST /api/v1/webhooks/razorpay
```

Handles Razorpay webhook events:
- `payment.captured`: Payment successfully captured
- `payment.failed`: Payment failed
- `subscription.charged`: Subscription successfully charged
- `subscription.cancelled`: Subscription cancelled
- `subscription.paused`: Subscription paused
- `subscription.resumed`: Subscription resumed

## Subscription Lifecycle

### 1. Trial Period
- New subscriptions start with a trial period (default: 14 days)
- Full access to plan features during trial
- No payment required during trial

### 2. Active Subscription
- Subscription is active and billable
- Auto-renewal charges on `next_billing_date`
- Full access to plan features

### 3. Payment Failure
- If payment fails, subscription enters `past_due` status
- Grace period starts (default: 7 days)
- Access may be limited during grace period

### 4. Grace Period
- Institution has time to update payment method
- Subscription remains partially functional
- After grace period expires, subscription becomes `expired`

### 5. Cancellation
- Immediate cancellation: Access ends immediately
- End-of-period cancellation: Access until `end_date`

### 6. Expiration
- Subscription expires after failed payment and grace period
- Access to features is revoked
- Can be reactivated by renewing

## Configuration

Add to `.env` file:

```env
# Razorpay Payment Gateway
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

## Database Migration

Run the migration to create subscription tables:

```bash
alembic upgrade head
```

This creates the following tables:
- `subscriptions`: Main subscription records
- `payments`: Payment transactions
- `invoices`: Generated invoices
- `usage_records`: Usage tracking metrics

## Background Tasks

### Subscription Scheduler

Run the scheduler script to process subscription tasks:

```bash
python scripts/subscription_scheduler.py
```

The scheduler performs:
- Renewal reminders (3 days before renewal)
- Trial expiration processing
- Grace period expiration processing
- Upcoming renewal processing
- Overdue invoice marking

### Cron Job Setup

Add to crontab to run every 6 hours:

```bash
0 */6 * * * cd /path/to/project && python scripts/subscription_scheduler.py
```

Or for hourly execution:

```bash
0 * * * * cd /path/to/project && python scripts/subscription_scheduler.py
```

## Tax Calculation

- Default tax rate: 18% (GST for India)
- Tax is automatically calculated on invoices
- `amount`: Base subscription price
- `tax_amount`: Calculated tax (amount × 0.18)
- `total_amount`: Amount including tax

## Prorated Billing

When upgrading a subscription:

1. Calculate unused amount from current plan
2. Calculate prorated amount for new plan
3. Charge the difference immediately
4. Update plan and features

Formula:
```
unused_amount = (old_price × remaining_days) / total_period_days
new_period_amount = (new_price × remaining_days) / total_period_days
prorated_amount = new_period_amount - unused_amount
```

## Error Handling

### Payment Failures
- Subscription moves to `past_due` status
- Grace period starts automatically
- Institution receives notification

### Grace Period Expiration
- Subscription moves to `expired` status
- Access to features is revoked
- `end_date` is set to current time

### Webhook Failures
- Webhook signature verification prevents unauthorized requests
- Failed webhook events are logged
- Idempotent processing prevents duplicate actions

## Testing Razorpay Integration

Use Razorpay test mode:

1. Use test API keys (prefix: `rzp_test_`)
2. Use test payment methods provided by Razorpay
3. Trigger webhook events from Razorpay dashboard

Test card numbers:
- Success: 4111 1111 1111 1111
- Failure: 4111 1111 1111 1112

## Security Considerations

- Webhook signature verification is mandatory in production
- API keys should be kept secure in environment variables
- Payment information is never stored, only Razorpay IDs
- HTTPS required for production webhooks

## Monitoring and Logging

Monitor these metrics:
- Failed payments requiring attention
- Subscriptions in grace period
- Trial expirations
- Successful renewals
- Revenue metrics

Log files:
- `logs/subscription_scheduler.log`: Scheduled task execution logs
