# Optional Modules Implementation

This document provides a comprehensive overview of the optional module implementations for the educational SaaS platform.

## Modules Implemented

### 1. Fee Management Module
**Location**: `/fees`

#### Backend Components:
- **Models** (`src/models/fee.py`):
  - `FeeStructure`: Fee configuration with categories, amounts, due dates, late fees
  - `FeePayment`: Payment recording with receipt generation
  - `FeeWaiver`: Fee waivers and scholarships

- **Schemas** (`src/schemas/fee.py`):
  - Request/Response schemas for all operations
  - `FeeReceiptData`: Receipt generation data
  - `StudentOutstandingDues`: Outstanding dues report schema

- **API Routes** (`src/api/v1/fees.py`):
  - `POST /api/v1/fees/structures` - Create fee structure
  - `GET /api/v1/fees/structures` - List fee structures
  - `POST /api/v1/fees/payments` - Record payment
  - `GET /api/v1/fees/receipts/{number}` - Get receipt
  - `GET /api/v1/fees/outstanding-dues` - Outstanding dues report

#### Frontend Components:
- **Page** (`frontend/src/pages/FeeManagement.tsx`)
- **Components**:
  - `FeeStructureConfig`: Configure fee structures with categories
  - `PaymentRecording`: Record payments with receipt generation
  - `OutstandingDuesReport`: View and filter outstanding dues

#### Features:
- ✅ Fee structure configuration by grade and category
- ✅ Payment recording with multiple methods (cash, card, UPI, etc.)
- ✅ Automatic receipt generation with unique numbers
- ✅ Outstanding dues report with filters
- ✅ Late fee calculation
- ✅ Discount and waiver support

### 2. Library Management Module
**Location**: `/library`

#### Backend Components:
- **Models** (`src/models/library.py`):
  - `Book`: Book catalog with ISBN, categories, copies
  - `BookCategory`: Book categorization
  - `BookIssue`: Issue/return tracking with fines
  - `LibrarySettings`: Institution-wide settings

- **Schemas** (`src/schemas/library.py`):
  - Book and issue management schemas
  - `OverdueBookReport`: Overdue tracking schema

- **API Routes** (`src/api/v1/library.py`):
  - `POST /api/v1/library/books` - Add book
  - `POST /api/v1/library/issues` - Issue book
  - `POST /api/v1/library/issues/{id}/return` - Return book
  - `GET /api/v1/library/overdue` - Overdue books report

#### Frontend Components:
- **Page** (`frontend/src/pages/LibraryManagement.tsx`)
- **Components**:
  - `BookCatalog`: Browse and manage books
  - `IssueReturnWorkflow`: Issue/return operations
  - `OverdueTracking`: Track overdue books with fine calculation

#### Features:
- ✅ Complete book catalog with ISBN, author, publisher
- ✅ Copy management (total vs available)
- ✅ Issue/return workflow with due dates
- ✅ Automatic fine calculation for overdue books
- ✅ Book availability tracking
- ✅ Student borrowing limits
- ✅ Renewal support

### 3. Transport Management Module
**Location**: `/transport`

#### Backend Components:
- **Models** (`src/models/transport.py`):
  - `TransportRoute`: Routes with vehicle details, driver info
  - `RouteStop`: Bus stops with pickup/drop times
  - `StudentTransport`: Student-route assignments

- **Schemas** (`src/schemas/transport.py`):
  - Route and stop management schemas
  - Student assignment with emergency contacts

- **API Routes** (`src/api/v1/transport.py`):
  - `POST /api/v1/transport/routes` - Create route
  - `POST /api/v1/transport/stops` - Add stop
  - `POST /api/v1/transport/student-assignments` - Assign student

#### Frontend Components:
- **Page** (`frontend/src/pages/TransportManagement.tsx`)
- **Components**:
  - `RouteConfiguration`: Manage routes, vehicles, drivers
  - `StudentAssignment`: Assign students to routes/stops

#### Features:
- ✅ Route configuration with vehicle details
- ✅ Driver and conductor information
- ✅ Sequential stops with pickup/drop times
- ✅ Student-route assignment
- ✅ Emergency contact management
- ✅ Route capacity tracking
- ✅ Monthly fee management

### 4. Event Management Module
**Location**: `/events`

#### Backend Components:
- **Models** (`src/models/event.py`):
  - `Event`: Events with types, venues, registration
  - `EventRSVP`: RSVP tracking with guest counts
  - `EventPhoto`: Photo gallery with ordering

- **Schemas** (`src/schemas/event.py`):
  - Event CRUD schemas
  - `EventCalendarItem`: Calendar view schema
  - RSVP and photo management schemas

- **API Routes** (`src/api/v1/events.py`):
  - `POST /api/v1/events` - Create event
  - `GET /api/v1/events/calendar` - Calendar view
  - `POST /api/v1/events/{id}/rsvp` - RSVP to event
  - `POST /api/v1/events/{id}/photos` - Add photos

#### Frontend Components:
- **Page** (`frontend/src/pages/EventManagement.tsx`)
- **Components**:
  - `EventCalendar`: Calendar view of events
  - `RSVPTracking`: Track attendees and responses
  - `PhotoGallery`: Manage event photos

#### Features:
- ✅ Multiple event types (academic, sports, cultural, etc.)
- ✅ Calendar view with date filtering
- ✅ RSVP system with guest counts
- ✅ Registration deadlines and capacity limits
- ✅ Photo gallery with upload and ordering
- ✅ Event status workflow (draft → published → completed)
- ✅ Contact person and venue management

### 5. Timetable Builder Module
**Location**: `/timetable`

#### Backend Components:
- **Models** (`src/models/timetable.py`):
  - `TimetableTemplate`: Reusable templates with period slots
  - `Timetable`: Grade/section specific timetables
  - `TimetableEntry`: Individual period assignments
  - `PeriodSlot`: Time slot definitions

- **Schemas** (`src/schemas/timetable.py`):
  - Template and entry management
  - `ConflictCheck`: Real-time conflict detection schema

- **API Routes** (`src/api/v1/timetable.py`):
  - `POST /api/v1/timetable/templates` - Create template
  - `POST /api/v1/timetable/entries` - Add entry
  - `GET /api/v1/timetable/entries/check-conflict` - Check conflicts

#### Frontend Components:
- **Page** (`frontend/src/pages/TimetableBuilder.tsx`)
- **Components**:
  - `TimetableGrid`: Drag-drop interface for scheduling
  - `TimetableControls`: Grade/section selection
  - `ConflictDetection`: Real-time conflict visualization

#### Features:
- ✅ Template-based timetable creation
- ✅ Period slot configuration (lectures, breaks, lunch)
- ✅ Drag-drop interface for easy scheduling
- ✅ Real-time conflict detection:
  - Teacher double-booking prevention
  - Period overlap detection
  - Time slot conflicts
- ✅ Substitution support with reason tracking
- ✅ Room assignment
- ✅ Working days configuration

## Database Schema

### New Tables Created:
1. `fee_structures` - Fee configuration
2. `fee_payments` - Payment records
3. `fee_waivers` - Fee waivers
4. `book_categories` - Library categories
5. `books` - Book catalog
6. `book_issues` - Issue/return records
7. `library_settings` - Library configuration
8. `transport_routes` - Transport routes
9. `route_stops` - Bus stops
10. `student_transport` - Student assignments
11. `events` - Event management
12. `event_rsvps` - RSVP tracking
13. `event_photos` - Photo gallery
14. `timetable_templates` - Timetable templates
15. `period_slots` - Time slots
16. `timetables` - Grade/section timetables
17. `timetable_entries` - Individual periods

## API Endpoints Summary

### Fee Management
- `/api/v1/fees/structures` - CRUD for fee structures
- `/api/v1/fees/payments` - Payment recording
- `/api/v1/fees/receipts/{number}` - Receipt generation
- `/api/v1/fees/outstanding-dues` - Dues reporting
- `/api/v1/fees/waivers` - Waiver management

### Library Management
- `/api/v1/library/books` - Book catalog CRUD
- `/api/v1/library/categories` - Category management
- `/api/v1/library/issues` - Issue/return operations
- `/api/v1/library/overdue` - Overdue tracking
- `/api/v1/library/settings` - Library settings

### Transport Management
- `/api/v1/transport/routes` - Route CRUD
- `/api/v1/transport/stops` - Stop management
- `/api/v1/transport/student-assignments` - Student assignments

### Event Management
- `/api/v1/events` - Event CRUD
- `/api/v1/events/calendar` - Calendar view
- `/api/v1/events/{id}/rsvp` - RSVP operations
- `/api/v1/events/{id}/photos` - Photo gallery

### Timetable Builder
- `/api/v1/timetable/templates` - Template management
- `/api/v1/timetable` - Timetable CRUD
- `/api/v1/timetable/entries` - Period entries
- `/api/v1/timetable/entries/check-conflict` - Conflict detection

## Frontend Structure

```
frontend/src/
├── pages/
│   ├── FeeManagement.tsx
│   ├── LibraryManagement.tsx
│   ├── TransportManagement.tsx
│   ├── EventManagement.tsx
│   └── TimetableBuilder.tsx
├── components/
│   ├── fees/
│   │   ├── FeeStructureConfig.tsx
│   │   ├── PaymentRecording.tsx
│   │   └── OutstandingDuesReport.tsx
│   ├── library/
│   │   ├── BookCatalog.tsx
│   │   ├── IssueReturnWorkflow.tsx
│   │   └── OverdueTracking.tsx
│   ├── transport/
│   │   ├── RouteConfiguration.tsx
│   │   └── StudentAssignment.tsx
│   ├── events/
│   │   ├── EventCalendar.tsx
│   │   ├── RSVPTracking.tsx
│   │   └── PhotoGallery.tsx
│   └── timetable/
│       ├── TimetableGrid.tsx
│       ├── TimetableControls.tsx
│       └── ConflictDetection.tsx
├── api/
│   └── fees.ts
└── types/
    ├── fee.ts
    ├── library.ts
    ├── transport.ts
    ├── event.ts
    └── timetable.ts
```

## Key Features Implemented

### Drag & Drop (Timetable)
- React DnD integration for period scheduling
- Visual feedback during drag operations
- Drop validation with conflict checking

### Conflict Detection (Timetable)
- Real-time teacher availability checking
- Period overlap detection
- Visual conflict indicators
- Automatic conflict resolution suggestions

### Receipt Generation (Fees)
- Unique receipt numbering
- PDF generation capability
- Print-friendly format
- Comprehensive payment details

### Fine Calculation (Library)
- Automatic fine calculation based on overdue days
- Configurable fine rates per day
- Maximum fine limits
- Working days consideration

### Calendar View (Events)
- Month/week/day views
- Color-coded event types
- Drag-to-reschedule support
- Quick event creation

## Integration Points

### Navigation
Add to `frontend/src/config/navigation.tsx`:
```typescript
{
  id: 'optional-modules',
  title: 'Optional Modules',
  icon: <ExtensionIcon />,
  roles: ['admin'],
  children: [
    { id: 'fees', title: 'Fee Management', path: '/admin/fees' },
    { id: 'library', title: 'Library', path: '/admin/library' },
    { id: 'transport', title: 'Transport', path: '/admin/transport' },
    { id: 'events', title: 'Events', path: '/admin/events' },
    { id: 'timetable', title: 'Timetable', path: '/admin/timetable' },
  ],
}
```

### Router Configuration
Add routes to `frontend/src/App.tsx`:
```typescript
<Route path="/admin/fees" element={<FeeManagement />} />
<Route path="/admin/library" element={<LibraryManagement />} />
<Route path="/admin/transport" element={<TransportManagement />} />
<Route path="/admin/events" element={<EventManagement />} />
<Route path="/admin/timetable" element={<TimetableBuilder />} />
```

### API Registration
Add to `src/main.py`:
```python
from src.api.v1 import fees, library, transport, events, timetable

app.include_router(fees.router, prefix="/api/v1/fees", tags=["fees"])
app.include_router(library.router, prefix="/api/v1/library", tags=["library"])
app.include_router(transport.router, prefix="/api/v1/transport", tags=["transport"])
app.include_router(events.router, prefix="/api/v1/events", tags=["events"])
app.include_router(timetable.router, prefix="/api/v1/timetable", tags=["timetable"])
```

## Database Migration

Run migration to create tables:
```bash
alembic revision --autogenerate -m "Add optional modules: fees, library, transport, events, timetable"
alembic upgrade head
```

## Next Steps

1. **Complete Component Implementation**: Implement remaining UI components
2. **Add Tests**: Unit and integration tests for all modules
3. **Documentation**: API documentation and user guides
4. **Permissions**: Role-based access control
5. **Reports**: PDF export for receipts, timetables, etc.
6. **Notifications**: Email/SMS for overdue books, event reminders, etc.
7. **Mobile Optimization**: Responsive design improvements
8. **Search & Filters**: Advanced search capabilities
9. **Bulk Operations**: Bulk import/export functionality
10. **Analytics**: Dashboard widgets for each module

## Technology Stack

- **Backend**: FastAPI, SQLAlchemy, PostgreSQL
- **Frontend**: React, TypeScript, Material-UI
- **State Management**: React Query (TanStack Query)
- **Forms**: React Hook Form
- **Drag & Drop**: React DnD
- **Calendar**: FullCalendar or similar
- **Date Handling**: date-fns or dayjs
