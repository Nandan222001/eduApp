# Subscription API Examples

This document provides detailed examples of using the Subscription and Billing API endpoints.

## Authentication

All API requests require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

## Base URL

```
http://localhost:8000/api/v1
```

## Plan Management

### Get All Available Plans

```bash
curl -X GET "http://localhost:8000/api/v1/subscriptions/plans" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
[
  {
    "name": "Starter",
    "display_name": "Starter",
    "description": "Perfect for small teams getting started",
    "monthly_price": "999.00",
    "quarterly_price": "2699.00",
    "yearly_price": "9999.00",
    "max_users": 10,
    "max_storage_gb": 50,
    "features": [
      "Up to 10 users",
      "50 GB storage",
      "Basic support",
      "Email notifications",
      "API access"
    ]
  }
]
```

### Get Specific Plan Details

```bash
curl -X GET "http://localhost:8000/api/v1/subscriptions/plans/Growth" \
  -H "Authorization: Bearer <token>"
```

## Subscription Management

### Create New Subscription

```bash
curl -X POST "http://localhost:8000/api/v1/subscriptions/?trial_days=14" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "plan_name": "Growth",
    "billing_cycle": "monthly",
    "auto_renew": true
  }'
```

Response:
```json
{
  "id": 1,
  "institution_id": 1,
  "plan_name": "Growth",
  "status": "trialing",
  "billing_cycle": "monthly",
  "price": "2999.00",
  "currency": "INR",
  "max_users": 50,
  "max_storage_gb": 250,
  "features": "[\"Up to 50 users\", \"250 GB storage\", ...]",
  "start_date": "2024-01-15T10:00:00Z",
  "trial_end_date": "2024-01-29T10:00:00Z",
  "next_billing_date": "2024-01-29T10:00:00Z",
  "auto_renew": true,
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### Get Institution's Active Subscription

```bash
curl -X GET "http://localhost:8000/api/v1/subscriptions/institution/1" \
  -H "Authorization: Bearer <token>"
```

### List All Subscriptions

```bash
curl -X GET "http://localhost:8000/api/v1/subscriptions/?institution_id=1&status=active&skip=0&limit=10" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "total": 1,
  "subscriptions": [
    {
      "id": 1,
      "institution_id": 1,
      "plan_name": "Growth",
      "status": "active",
      "..."
    }
  ]
}
```

### Update Subscription

```bash
curl -X PATCH "http://localhost:8000/api/v1/subscriptions/1" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "auto_renew": false
  }'
```

### Upgrade Subscription

```bash
curl -X POST "http://localhost:8000/api/v1/subscriptions/1/upgrade" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "new_plan_name": "Professional"
  }'
```

Response:
```json
{
  "subscription": {
    "id": 1,
    "plan_name": "Professional",
    "price": "7999.00",
    "..."
  },
  "prorated_amount": 1500.00,
  "immediate_charge": true
}
```

### Downgrade Subscription

```bash
curl -X POST "http://localhost:8000/api/v1/subscriptions/1/downgrade" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "new_plan_name": "Starter"
  }'
```

### Cancel Subscription

Cancel at end of billing period:
```bash
curl -X POST "http://localhost:8000/api/v1/subscriptions/1/cancel" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "immediate": false,
    "reason": "Moving to competitor"
  }'
```

Cancel immediately:
```bash
curl -X POST "http://localhost:8000/api/v1/subscriptions/1/cancel" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "immediate": true,
    "reason": "Service issues"
  }'
```

### Renew Subscription

```bash
curl -X POST "http://localhost:8000/api/v1/subscriptions/1/renew" \
  -H "Authorization: Bearer <token>"
```

## Invoice Management

### Generate Invoice

```bash
curl -X POST "http://localhost:8000/api/v1/subscriptions/1/invoices" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "id": 1,
  "subscription_id": 1,
  "institution_id": 1,
  "invoice_number": "INV-1-1705315200",
  "status": "open",
  "amount": "2999.00",
  "tax_amount": "539.82",
  "total_amount": "3538.82",
  "currency": "INR",
  "billing_period_start": "2024-01-15T00:00:00Z",
  "billing_period_end": "2024-02-15T00:00:00Z",
  "due_date": "2024-01-22T00:00:00Z",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

### List Invoices

```bash
curl -X GET "http://localhost:8000/api/v1/subscriptions/invoices/?subscription_id=1&status=open" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "total": 2,
  "invoices": [
    {
      "id": 1,
      "invoice_number": "INV-1-1705315200",
      "status": "open",
      "total_amount": "3538.82",
      "..."
    }
  ]
}
```

### Get Invoice Details

```bash
curl -X GET "http://localhost:8000/api/v1/subscriptions/invoices/1" \
  -H "Authorization: Bearer <token>"
```

### Mark Invoice as Paid

```bash
curl -X POST "http://localhost:8000/api/v1/subscriptions/invoices/1/mark-paid" \
  -H "Authorization: Bearer <token>"
```

## Payment Processing

### Create Razorpay Order

```bash
curl -X POST "http://localhost:8000/api/v1/subscriptions/1/payments/create-order" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "order_id": "order_1_1705315200",
  "amount": "2999.00",
  "currency": "INR",
  "status": "created"
}
```

### Frontend Integration (JavaScript)

```javascript
// 1. Create order from backend
const response = await fetch('/api/v1/subscriptions/1/payments/create-order', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
  }
});
const orderData = await response.json();

// 2. Initialize Razorpay
const options = {
  key: 'rzp_test_your_key_id',
  amount: orderData.amount * 100, // Amount in paise
  currency: orderData.currency,
  name: 'Your Company Name',
  description: 'Subscription Payment',
  order_id: orderData.order_id,
  handler: async function (response) {
    // 3. Verify payment on backend
    await fetch(`/api/v1/subscriptions/payments/${paymentId}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      }),
    });
  },
  prefill: {
    name: 'Customer Name',
    email: 'customer@example.com',
  },
};

const razorpay = new Razorpay(options);
razorpay.open();
```

### Verify Payment

```bash
curl -X POST "http://localhost:8000/api/v1/subscriptions/payments/1/verify" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_xxx",
    "razorpay_payment_id": "pay_xxx",
    "razorpay_signature": "signature_xxx"
  }'
```

### List Payments

```bash
curl -X GET "http://localhost:8000/api/v1/subscriptions/payments/?subscription_id=1&status=captured" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "total": 3,
  "payments": [
    {
      "id": 1,
      "subscription_id": 1,
      "amount": "2999.00",
      "currency": "INR",
      "status": "captured",
      "razorpay_payment_id": "pay_xxx",
      "paid_at": "2024-01-15T10:05:00Z",
      "..."
    }
  ]
}
```

## Usage Tracking

### Record Usage Metric

```bash
curl -X POST "http://localhost:8000/api/v1/subscriptions/1/usage" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subscription_id": 1,
    "institution_id": 1,
    "metric_name": "api_calls",
    "metric_value": 15000,
    "period_start": "2024-01-01T00:00:00Z",
    "period_end": "2024-01-31T23:59:59Z"
  }'
```

### Get Usage Records

```bash
curl -X GET "http://localhost:8000/api/v1/subscriptions/usage/?subscription_id=1&metric_name=api_calls" \
  -H "Authorization: Bearer <token>"
```

Response:
```json
{
  "total": 12,
  "usage_records": [
    {
      "id": 1,
      "subscription_id": 1,
      "metric_name": "api_calls",
      "metric_value": "15000.00",
      "recorded_at": "2024-01-31T23:59:59Z",
      "period_start": "2024-01-01T00:00:00Z",
      "period_end": "2024-01-31T23:59:59Z",
      "..."
    }
  ]
}
```

### Common Usage Metrics

- `api_calls`: Number of API calls made
- `storage_gb`: Storage used in gigabytes
- `active_users`: Number of active users
- `bandwidth_gb`: Bandwidth consumed in gigabytes
- `documents_processed`: Number of documents processed

## Admin Endpoints

### Check Subscriptions Due for Renewal

```bash
curl -X GET "http://localhost:8000/api/v1/subscriptions/admin/check-renewals" \
  -H "Authorization: Bearer <admin_token>"
```

### Check Expired Trials

```bash
curl -X GET "http://localhost:8000/api/v1/subscriptions/admin/check-expired-trials" \
  -H "Authorization: Bearer <admin_token>"
```

### Check Expired Grace Periods

```bash
curl -X GET "http://localhost:8000/api/v1/subscriptions/admin/check-expired-grace-periods" \
  -H "Authorization: Bearer <admin_token>"
```

## Webhook Endpoint

### Razorpay Webhook

Configure this URL in Razorpay Dashboard:
```
https://your-domain.com/api/v1/webhooks/razorpay
```

The webhook handler processes these events automatically:
- `payment.captured`: Updates payment status and marks invoice as paid
- `payment.failed`: Updates subscription to grace period
- `subscription.charged`: Processes automatic renewal
- `subscription.cancelled`: Cancels the subscription
- `subscription.paused`: Pauses the subscription
- `subscription.resumed`: Resumes the subscription

## Error Responses

### 400 Bad Request

```json
{
  "detail": "Invalid plan name: InvalidPlan"
}
```

### 404 Not Found

```json
{
  "detail": "Subscription not found"
}
```

### 401 Unauthorized

```json
{
  "detail": "Invalid webhook signature"
}
```

## Rate Limiting

API endpoints are subject to rate limiting:
- Standard endpoints: 100 requests per minute
- Webhook endpoints: No rate limit
- Admin endpoints: 1000 requests per minute

## Best Practices

1. **Trial Period**: Always offer a trial period (14 days recommended)
2. **Prorated Charges**: Handle prorated amounts when upgrading
3. **Grace Period**: Give users 7 days grace period for failed payments
4. **Invoice Generation**: Generate invoices before charging
5. **Usage Tracking**: Record usage metrics regularly for analytics
6. **Webhook Verification**: Always verify webhook signatures in production
7. **Error Handling**: Implement proper error handling for payment failures
8. **User Communication**: Send notifications for subscription events

## Testing

Use Razorpay test mode for development:
- Test Key ID: `rzp_test_xxx`
- Test Secret: `test_secret_xxx`
- Test card numbers provided by Razorpay

## Support

For issues or questions:
- Check the main documentation: `docs/SUBSCRIPTION_BILLING.md`
- Review error logs: `logs/subscription_scheduler.log`
- Contact support: support@yourcompany.com
