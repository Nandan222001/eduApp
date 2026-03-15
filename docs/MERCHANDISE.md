# Merchandise Store Integration

## Overview

The merchandise store integration allows institutions to offer branded merchandise to students, parents, and staff. The system integrates with Printful for on-demand printing and fulfillment, supports custom branding with institution logos, and includes a commission-based revenue system for administrators.

## Features

### 1. Merchandise Item Management
- Create and manage merchandise items (apparel, accessories, school supplies, tech)
- Configure product options (sizes, colors)
- Set base pricing
- Track inventory (optional)
- Integrate with Printful product templates

### 2. Branded Mockup Generation
- Generate custom mockups with institution branding
- Apply institution logo and colors to product previews
- Support multiple mockup views
- Automatic mockup caching

### 3. Order Management
- Complete order workflow (pending → confirmed → production → shipped → delivered)
- Customer information capture
- Shipping address management
- Order customization (student name, graduation year, etc.)
- Order tracking with status updates

### 4. Payment Processing
- Razorpay integration for secure payment processing
- Support for multiple payment methods
- Payment verification and signature validation
- Automatic order confirmation on successful payment

### 5. Printful Integration
- Automatic order submission to Printful for fulfillment
- Real-time product catalog sync
- Shipping cost calculation
- Tax rate calculation
- Order status synchronization via webhooks

### 6. Commission System
- Configurable commission percentage per sale
- Automatic commission calculation
- Commission tracking and reporting
- Payment status management

## API Endpoints

### Merchandise Items

#### Create Merchandise Item
```http
POST /api/v1/merchandise/items
```
**Request Body:**
```json
{
  "institution_id": 1,
  "item_name": "University T-Shirt",
  "category": "apparel",
  "description": "Premium quality cotton t-shirt with university logo",
  "base_price": 599.00,
  "size_options": ["S", "M", "L", "XL", "XXL"],
  "color_options": ["Navy", "White", "Grey"],
  "print_provider": "Printful",
  "product_template_id": "71",
  "inventory_tracking": false,
  "stock_quantity": 0
}
```

#### List Merchandise Items
```http
GET /api/v1/merchandise/items?category=apparel&is_active=true
```

#### Get Merchandise Item
```http
GET /api/v1/merchandise/items/{item_id}
```

#### Update Merchandise Item
```http
PUT /api/v1/merchandise/items/{item_id}
```

#### Delete Merchandise Item
```http
DELETE /api/v1/merchandise/items/{item_id}
```

### Mockup Generation

#### Generate Custom Mockup
```http
POST /api/v1/merchandise/mockups/generate
```
**Request Body:**
```json
{
  "merchandise_item_id": 1,
  "logo_url": "https://institution.com/logo.png",
  "primary_color": "#1976d2",
  "secondary_color": "#dc004e",
  "text_overlay": "Class of 2024"
}
```

### Orders

#### Create Order
```http
POST /api/v1/merchandise/orders
```
**Request Body:**
```json
{
  "buyer_name": "John Doe",
  "buyer_email": "john@example.com",
  "buyer_phone": "+919876543210",
  "shipping_address": {
    "shipping_name": "John Doe",
    "shipping_address_line1": "123 Main Street",
    "shipping_address_line2": "Apt 4B",
    "shipping_city": "Mumbai",
    "shipping_state": "Maharashtra",
    "shipping_postal_code": "400001",
    "shipping_country": "India"
  },
  "items": [
    {
      "merchandise_item_id": 1,
      "size": "L",
      "color": "Navy",
      "quantity": 2,
      "personalization": {
        "student_name": "John Doe",
        "graduation_year": "2024"
      }
    }
  ],
  "customization": {
    "graduation_year": "2024"
  },
  "notes": "Please deliver before graduation ceremony"
}
```

#### List Orders
```http
GET /api/v1/merchandise/orders?order_status=pending&payment_status=captured
```

#### Get Order
```http
GET /api/v1/merchandise/orders/{order_id}
```

#### Update Order (Admin)
```http
PUT /api/v1/merchandise/orders/{order_id}
```

### Payment

#### Initiate Payment
```http
POST /api/v1/merchandise/orders/{order_id}/payment/initiate
```

**Response:**
```json
{
  "order_id": "MERCH-20240115-123456",
  "razorpay_order_id": "order_NaN123456789",
  "amount": 1298.00,
  "currency": "INR",
  "razorpay_key_id": "rzp_test_xxxx"
}
```

#### Verify Payment
```http
POST /api/v1/merchandise/orders/payment/verify
```
**Request Body:**
```json
{
  "order_id": 1,
  "razorpay_order_id": "order_NaN123456789",
  "razorpay_payment_id": "pay_NaN987654321",
  "razorpay_signature": "signature_hash"
}
```

### Order Tracking

#### Track Order
```http
GET /api/v1/merchandise/orders/{order_number}/track
```

**Response:**
```json
{
  "order_number": "MERCH-20240115-123456",
  "order_status": "shipped",
  "payment_status": "captured",
  "tracking_number": "1Z999AA10123456784",
  "fulfillment_status": "fulfilled",
  "estimated_delivery": "2024-01-20T00:00:00Z",
  "tracking_events": []
}
```

### Printful Integration

#### Submit Order to Printful
```http
POST /api/v1/merchandise/orders/{order_id}/submit-fulfillment
```

#### Printful Webhook Handler
```http
POST /api/v1/merchandise/webhooks/printful
```

### Admin Endpoints

#### List All Orders (Admin)
```http
GET /api/v1/merchandise/admin/orders
```

#### Commission Report (Admin)
```http
GET /api/v1/merchandise/admin/commission-report?days=30
```

**Response:**
```json
{
  "institution_id": 1,
  "total_orders": 50,
  "total_sales": 50000.00,
  "total_commission": 5000.00,
  "pending_commission": 2000.00,
  "paid_commission": 3000.00,
  "currency": "INR",
  "period_start": "2023-12-16T00:00:00Z",
  "period_end": "2024-01-15T00:00:00Z"
}
```

## Database Models

### MerchandiseItem
- `id`: Primary key
- `institution_id`: Institution reference
- `item_name`: Product name
- `category`: Product category (apparel, accessories, school_supplies, tech)
- `description`: Product description
- `base_price`: Base price in institution currency
- `size_options`: Array of available sizes
- `color_options`: Array of available colors
- `mockup_images`: JSON object with mockup image URLs
- `print_provider`: Print provider (Printful, CustomCat)
- `product_template_id`: External provider product template ID
- `inventory_tracking`: Whether to track inventory
- `stock_quantity`: Current stock quantity
- `is_active`: Active status

### MerchandiseOrder
- `id`: Primary key
- `institution_id`: Institution reference
- `user_id`: User who placed order
- `order_number`: Unique order number
- `buyer_name`, `buyer_email`, `buyer_phone`: Buyer details
- `shipping_*`: Shipping address fields
- `subtotal`, `tax_amount`, `shipping_cost`, `total_amount`: Pricing
- `currency`: Currency code
- `customization`: JSON object with custom details
- `order_status`: Order status (pending, confirmed, production, shipped, delivered, canceled)
- `tracking_number`: Shipment tracking number
- `payment_status`: Payment status (pending, authorized, captured, failed, refunded)
- `razorpay_*`: Razorpay payment details
- `commission_percentage`, `commission_amount`: Commission details
- `printful_order_id`: Printful order reference
- `fulfillment_status`: Fulfillment status from Printful
- Various timestamps for status changes

### MerchandiseOrderItem
- `id`: Primary key
- `order_id`: Order reference
- `merchandise_item_id`: Item reference
- `item_name`, `category`: Item details (denormalized)
- `size`, `color`: Selected options
- `quantity`: Quantity ordered
- `unit_price`, `total_price`: Pricing
- `personalization`: JSON object with custom details
- `printful_item_id`: Printful item reference

### MerchandiseCommission
- `id`: Primary key
- `institution_id`: Institution reference
- `order_id`: Order reference
- `order_total`: Total order amount
- `commission_percentage`: Commission percentage
- `commission_amount`: Commission amount
- `currency`: Currency code
- `status`: Commission status (pending, paid)
- `paid_at`: Payment timestamp
- `payment_reference`: Payment reference

## Configuration

### Environment Variables

Add the following to your `.env` file:

```bash
# Printful Integration
PRINTFUL_API_KEY=your_printful_api_key

# Razorpay Integration (already configured)
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### Institution Branding

The system automatically uses institution branding settings from the `InstitutionBranding` model:
- `logo_url`: Institution logo for merchandise
- `primary_color`: Primary brand color
- `secondary_color`: Secondary brand color
- `merchandise_store_enabled`: Feature flag to enable/disable the store

## Commission Configuration

Default commission percentage: **10%**

This can be configured per institution or per order. The commission is calculated on the subtotal (before tax and shipping).

## Order Workflow

1. **Order Creation**: Customer creates order with items and shipping details
2. **Payment**: Customer completes payment via Razorpay
3. **Payment Verification**: System verifies payment signature
4. **Order Confirmation**: Order status updates to "confirmed"
5. **Printful Submission**: Order automatically submitted to Printful for fulfillment
6. **Production**: Printful begins production
7. **Shipping**: Printful ships the order and provides tracking
8. **Delivery**: Order marked as delivered
9. **Commission**: Commission recorded and tracked for institution

## Webhook Events

### Printful Webhooks

Configure Printful webhooks to point to:
```
POST https://your-domain.com/api/v1/merchandise/webhooks/printful
```

Supported events:
- `package_shipped`: Updates order status and tracking information
- `package_returned`: Handles returns and cancellations

## Security Considerations

1. **Payment Verification**: All payments are verified using Razorpay signature validation
2. **Access Control**: Users can only access their own orders (admins can access all)
3. **Institution Isolation**: All queries are scoped to the user's institution
4. **Webhook Validation**: Implement webhook signature validation for Printful events

## Testing

### Test Mode

Use Razorpay test keys for testing:
- Test cards: https://razorpay.com/docs/payments/payments/test-card-details/
- Printful sandbox: Use Printful sandbox API for testing

### Example Test Scenarios

1. Create merchandise item
2. Generate mockup with branding
3. Create order with multiple items
4. Process test payment
5. Verify order status updates
6. Check commission calculation
7. Submit to Printful (sandbox)
8. Track order status

## Future Enhancements

- Support for CustomCat as alternative print provider
- Bulk order discounts
- Gift wrapping options
- Student ID verification for discounts
- Multi-currency support
- Advanced analytics and reporting
- Product reviews and ratings
- Wishlist functionality
- Email notifications for order updates
