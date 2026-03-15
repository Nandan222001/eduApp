# School Merchandise Store Implementation

## Overview

A comprehensive merchandise store system for schools to sell branded items (apparel, accessories, stationery, sports equipment) to students and parents with customization options, secure payment processing via Stripe, order tracking, and revenue analytics.

## Features Implemented

### 1. **School Merchandise Store UI** (`/pages/SchoolMerchandiseStore.tsx`)

- **Product Grid Display**
  - Categorized product browsing (Apparel, Accessories, Stationery, Sports)
  - Search functionality
  - Product cards with images, pricing, and availability status
  - Size and color options display
  - Customization badges

- **Product Customization Interface**
  - Live preview of customizations
  - Student name personalization (configurable character limits)
  - Graduation year selection
  - Jersey number input for sports items (with range validation)
  - Size and color selectors
  - Quantity selection

- **Shopping Cart**
  - Drawer-style cart with item list
  - Quantity adjustment controls
  - Item details display (size, color, customizations)
  - Real-time price calculations
  - Subtotal, tax, and shipping breakdown
  - Free shipping threshold alerts
  - Remove item functionality

- **Checkout Flow**
  - Shipping address form
  - Order summary review
  - Stripe payment integration placeholder
  - Order confirmation with success animation

- **Bestsellers Section**
  - Dedicated tab for popular items
  - Star badges on bestseller products

### 2. **Order Tracking Page** (`/pages/MerchandiseOrderTracking.tsx`)

- **Order List**
  - All orders for the current user
  - Order number, date, status, and total
  - Search by order number
  - Status-based color coding

- **Production Status Timeline**
  - Step-by-step progress visualization
  - Order Placed → Processing → Production → Shipped → Delivered
  - Detailed production updates with timestamps
  - Status descriptions for each stage

- **Shipping Information**
  - Tracking carrier and number
  - Direct link to carrier tracking website
  - Estimated delivery date
  - Real-time shipping status

- **Order Details**
  - Itemized list with customizations
  - Price breakdown
  - Shipping address display
  - Payment status

### 3. **Admin Merchandise Manager** (`/pages/AdminMerchandiseManager.tsx`)

- **Store Settings Tab**
  - Enable/disable store toggle
  - Commission rate configuration
  - Tax rate settings
  - Shipping fee and free shipping threshold
  - Custom store message
  - Contact email
  - Return policy editor

- **Product Catalog Management**
  - Product list table with inline actions
  - Add/Edit/Delete products
  - Toggle product availability
  - Product details: name, description, category, price
  - Size and color variant management
  - Customization options configuration
  - Stock level tracking
  - Bestseller flag

- **Order Fulfillment Monitoring**
  - Pending orders counter
  - In-production orders counter
  - Shipped orders this week
  - Order status overview

- **Revenue Analytics Dashboard**
  - Total revenue, orders, and average order value
  - Commission earned calculation
  - Revenue over time line chart
  - Revenue by category doughnut chart
  - Top-selling products table with units sold and revenue

### 4. **Integration with School Branding**

Added merchandise store configuration to `InstitutionBrandingAdvanced.tsx`:

- Enable/disable merchandise store
- Store welcome message customization
- Commission rate settings
- Store logo upload
- Integration links (Store URL, Admin Panel)
- Feature checklist display

### 5. **Navigation Integration**

- **Header Component** (`/components/Header.tsx`)
  - Store link in main navigation for authenticated users
  - Role-based URL routing (admin → /admin/merchandise, student → /student/merchandise/store, etc.)
  - Shopping cart icon

- **Admin Sidebar** (`/config/navigation.tsx`)
  - "Merchandise Store" menu item for admins
  - Store icon
  - Access control based on roles

### 6. **Routing Configuration** (`/App.tsx`)

Routes added for all user roles:

- **Admin/Institution Admin**: `/admin/merchandise` → AdminMerchandiseManager
- **Teachers**: `/teacher/merchandise/store` → SchoolMerchandiseStore, `/teacher/merchandise/orders` → MerchandiseOrderTracking
- **Students**: `/student/merchandise/store` → SchoolMerchandiseStore, `/student/merchandise/orders` → MerchandiseOrderTracking
- **Parents**: `/parent/merchandise/store` → SchoolMerchandiseStore, `/parent/merchandise/orders` → MerchandiseOrderTracking

### 7. **Type Definitions** (`/types/merchandise.ts`)

Comprehensive TypeScript interfaces:

- `MerchandiseProduct` - Product catalog items
- `CartItem` - Shopping cart entries
- `MerchandiseOrder` - Order records
- `ShippingAddress` - Delivery information
- `ProductionUpdate` - Manufacturing status
- `StoreSettings` - Store configuration
- `RevenueAnalytics` - Sales analytics data

### 8. **API Integration** (`/api/merchandise.ts`)

Complete API client with endpoints for:

- Product CRUD operations
- Store settings management
- Order creation and tracking
- Production status updates
- Shipping information updates
- Revenue analytics retrieval
- Stripe payment confirmation
- Product image uploads

## Technical Stack

- **Frontend**: React 18, TypeScript, Material-UI (MUI) v5
- **State Management**: React Hooks (useState, useEffect)
- **Routing**: React Router v6
- **Charts**: Chart.js with react-chartjs-2
- **Forms**: Material-UI form components
- **Payment**: Stripe (integration placeholder)
- **HTTP Client**: Axios

## File Structure

```
frontend/src/
├── pages/
│   ├── SchoolMerchandiseStore.tsx          # Main store UI
│   ├── MerchandiseOrderTracking.tsx        # Order tracking
│   ├── AdminMerchandiseManager.tsx         # Admin panel
│   └── InstitutionBrandingAdvanced.tsx     # Updated with store config
├── types/
│   └── merchandise.ts                       # Type definitions
├── api/
│   └── merchandise.ts                       # API client
├── components/
│   ├── Header.tsx                          # Updated with store link
│   └── admin/
│       └── AdminSidebar.tsx                # Uses navigation config
├── config/
│   └── navigation.tsx                      # Updated with store menu item
└── App.tsx                                 # Updated with routes
```

## Mock Data

The implementation includes comprehensive mock data for demonstration:

- 6 sample products (t-shirts, jerseys, hoodies, backpacks, notebooks, water bottles)
- 2 sample orders with complete tracking information
- Revenue analytics with charts and metrics
- Store settings with realistic defaults

## Key Features by User Role

### Students/Parents

- Browse and purchase merchandise
- Customize products with names, years, numbers
- Track order status and shipping
- View production updates
- Access shipping tracking

### Teachers

- Browse and purchase merchandise (same as students)
- Track personal orders

### Admins/Institution Admins

- Full product catalog management
- Store configuration and settings
- Order fulfillment monitoring
- Revenue analytics and reporting
- Commission tracking
- Enable/disable store functionality

## Customization Options

Products can be customized with:

- **Student Name**: For personalized items (e.g., t-shirts, water bottles)
- **Graduation Year**: For class-specific items
- **Jersey Number**: For sports jerseys (0-99 range)
- Each option can be individually enabled/disabled per product
- Character limits and validation rules configurable

## Payment Integration

- Stripe payment processing (placeholder implementation)
- Secure checkout flow
- Payment confirmation
- Order creation with payment intent

## Order Lifecycle

1. **Pending**: Order placed, payment pending
2. **Processing**: Payment confirmed, order being prepared
3. **Production**: Items being manufactured/printed
4. **Shipped**: Package handed to carrier
5. **Delivered**: Order received by customer
6. **Cancelled**: Order cancelled (optional)

## Revenue Analytics

- Total revenue tracking
- Total orders count
- Average order value calculation
- Commission earned (based on configurable rate)
- Top-selling products ranking
- Revenue by category breakdown
- Time-series revenue visualization

## Next Steps for Production

1. **Backend Integration**
   - Implement API endpoints in backend
   - Database schema for products, orders, settings
   - Stripe payment gateway integration
   - File upload handling for product images

2. **Image Management**
   - Product image upload functionality
   - Image optimization and CDN integration
   - Multiple images per product

3. **Enhanced Features**
   - Product reviews and ratings
   - Wishlist functionality
   - Email notifications for order updates
   - PDF invoice generation
   - Bulk order discounts

4. **Testing**
   - Unit tests for components
   - Integration tests for checkout flow
   - E2E tests for complete purchase journey

5. **Production Deployment**
   - Environment-specific Stripe keys
   - Secure payment handling
   - HTTPS enforcement
   - Performance optimization
