# SlotBook - Comprehensive Project Plan

**Intern Skill Assessment Build Task** | Industry-Level Implementation

---

## Executive Summary

SlotBook is a modern, scalable slot & session booking system for small businesses (clinics, salons, tutors, consultants, co-working spaces). The application enables **business owners** to publish available time slots and **customers** to reserve them with atomic transaction protection.

---

## 1. User Personas & Core Flows

### User Types
| Role | Needs | Key Actions |
|------|-------|------------|
| **Owner** | Manage availability, view bookings, control slot capacity | Create slots, view bookings, cancel slots, set PIN auth |
| **Customer** | Find slots, book time, manage bookings | Browse slots, book, view my bookings, cancel booking |

### Core User Flows

#### Customer Booking Flow
```
1. Browse Home → See available slots (real-time status)
2. Select Slot → View details, capacity, timezone
3. Enter Details → Name, email
4. Confirm Booking → Atomic capacity increment
5. View My Bookings → Email lookup, cancel option
```

#### Owner Management Flow
```
1. Authenticate → Owner PIN (session-based)
2. Create Slots → Title, description, time, capacity, timezone
3. View Bookings → See who booked what
4. Manage Slots → Archive, edit capacity
```

---

## 2. Data Model & MongoDB Schema

### Collections

#### **slots**
```typescript
{
  _id: ObjectId,
  title: string,              // Max 120 chars
  description: string,        // Slot purpose/context
  startTime: Date,           // ISO 8601
  endTime: Date,             // Must be > startTime
  timezone: string,          // IANA (UTC, America/New_York, etc.)
  capacity: number,          // 1-100
  bookedCount: number,       // Incremented atomically
  isArchived: boolean,       // Soft delete
  createdAt: Date
}
```

**Indexes**:
- `{ isArchived: 1, startTime: 1 }` → Speed up queries
- `{ startTime: 1 }` → Sort by upcoming

#### **bookings**
```typescript
{
  _id: ObjectId,
  slotId: ObjectId,          // FK to slots._id
  customerName: string,
  customerEmail: string,     // Lowercase, indexed for lookups
  status: "confirmed" | "cancelled",
  bookedAt: Date
}
```

**Indexes**:
- `{ customerEmail: 1 }` → Fast email lookups
- `{ slotId: 1 }` → Query by slot

---

## 3. Feature Scope

### MVP (In Scope)
- ✅ Slot creation (owner, with PIN)
- ✅ Slot listing (customers)
- ✅ Booking creation (customers)
- ✅ My bookings view (email lookup)
- ✅ Booking cancellation (customers)
- ✅ Atomic transaction protection (prevent overbooking)
- ✅ Timezone support
- ✅ Slot status management (Available/Full/Expired)
- ✅ Owner authentication (PIN-based, session)

### Out of Scope (Demo)
- ❌ Email notifications
- ❌ Advanced analytics/reporting
- ❌ Payment integration
- ❌ Multi-timezone edit/display conversions
- ❌ Admin dashboard
- ❌ Social auth/JWT
- ❌ Rate limiting
- ❌ Search/filter (stub only)

---

## 4. API Specification

### Public Endpoints

#### `GET /api/slots`
Fetch all active (non-archived) slots, sorted by time.

**Response** (200):
```json
{
  "slots": [
    {
      "id": "507f1f77bcf86cd799439011",
      "title": "Consultation",
      "description": "30-min session",
      "startTime": "2026-05-25T10:00:00Z",
      "endTime": "2026-05-25T10:30:00Z",
      "timeRange": "Sun, May 25, 10:00 AM - 10:30 AM",
      "timezone": "America/New_York",
      "capacity": 5,
      "bookedCount": 2,
      "status": "Available",
      "isArchived": false,
      "createdAt": "2026-05-24T10:00:00Z"
    }
  ]
}
```

#### `POST /api/bookings`
Create a new booking (customer).

**Request**:
```json
{
  "slotId": "507f1f77bcf86cd799439011",
  "customerName": "John Doe",
  "customerEmail": "john@example.com"
}
```

**Response** (201):
```json
{
  "booking": {
    "id": "507f1f77bcf86cd799439012",
    "slotId": "507f1f77bcf86cd799439011",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "status": "confirmed",
    "bookedAt": "2026-05-24T10:30:00Z"
  }
}
```

**Error Cases**:
- 404: Slot not found
- 400: Slot archived or ended
- 409: Slot full, duplicate booking, or race condition

#### `GET /api/bookings?email={email}`
Fetch bookings for a customer (by email).

**Response** (200):
```json
{
  "bookings": [
    {
      "id": "507f1f77bcf86cd799439012",
      "slotId": "507f1f77bcf86cd799439011",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "status": "confirmed",
      "bookedAt": "2026-05-24T10:30:00Z",
      "slot": {
        "id": "507f1f77bcf86cd799439011",
        "title": "Consultation",
        "startTime": "2026-05-25T10:00:00Z",
        "endTime": "2026-05-25T10:30:00Z",
        "timezone": "America/New_York",
        "capacity": 5,
        "bookedCount": 2,
        "isArchived": false
      }
    }
  ]
}
```

#### `PATCH /api/bookings/{id}`
Cancel a booking (customer).

**Response** (200):
```json
{ "success": true }
```

**Error Cases**:
- 404/409: Booking not found or already cancelled

### Owner-Protected Endpoints

#### `POST /api/slots` (Owner)
Create a new slot.

**Headers**: `x-owner-pin: {PIN}`

**Request**:
```json
{
  "title": "Consultation",
  "description": "30-min session",
  "startTime": "2026-05-25T10:00:00Z",
  "endTime": "2026-05-25T10:30:00Z",
  "timezone": "America/New_York",
  "capacity": 5
}
```

**Response** (201): Slot object

**Error Cases**:
- 401: Missing or invalid PIN
- 400: Validation error (see lib/slots.ts)

---

## 5. Technology Stack & Rationale

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend** | Next.js App Router, React 19 | Server components + client interactivity |
| **Language** | TypeScript | Type safety, better DX |
| **Database** | MongoDB | Flexible schema, atomic transactions for bookings |
| **Styling** | Tailwind CSS | Utility-first, minimal + modern aesthetics |
| **UI Primitives** | Custom shadcn-style components | Lightweight, on-brand |
| **State** | React hooks + form state | Simple, no need for Zustand for MVP |
| **Data Fetching** | Native `fetch` + async components | Leverage Next.js server capabilities |
| **Auth** | PIN-based (session storage) | Demo-appropriate, no complex JWT overhead |

---

## 6. Implementation Phases

### Phase 1: Foundation (Done ✅)
- Project setup, type definitions, validation
- Basic API routes, database models
- UI component library

### Phase 2: Customer Flow (Current)
- ✅ Home page → Slot listing
- ✅ Book page → Booking form
- ✅ My bookings → Email lookup, cancel
- ✅ Atomic booking logic (prevent overbooking)

### Phase 3: Owner Flow (In Progress)
- ✅ Owner authentication (PIN-based)
- ✅ Create slot form
- [ ] Owner bookings view (see who booked)
- [ ] Owner slot management (archive, edit)
- [ ] Owner dashboard

### Phase 4: Polish & Edge Cases
- [ ] Proper error boundaries
- [ ] Loading states (skeleton loaders)
- [ ] Empty state messages
- [ ] Race condition handling
- [ ] Better form validation
- [ ] Timezone display fixes

### Phase 5: Production Ready
- [ ] Environment setup (.env.example)
- [ ] Comprehensive README
- [ ] Git history (meaningful commits)
- [ ] Error logging/monitoring hooks

---

## 7. Edge Cases & Business Logic

### Booking Atomicity
**Problem**: Multiple customers booking same slot → overbooking

**Solution**:
```javascript
// Atomic increment with capacity check
db.collection('slots').findOneAndUpdate(
  { _id, bookedCount: { $lt: capacity } },
  { $inc: { bookedCount: 1 } }
)
```
Only succeeds if bookedCount < capacity.

### Duplicate Bookings
**Problem**: Same customer books same slot twice

**Solution**: 
```javascript
// Check for existing confirmed booking before creating
db.collection('bookings').findOne({
  slotId, customerEmail, status: 'confirmed'
})
```

### Slot Expiry
**Problem**: Customer books expired slot

**Solution**:
- Check `endTime > now` in validation
- Frontend shows "Expired" badge
- API rejects booking attempts

### Cascade on Cancellation
**Problem**: Booking cancelled, slot bookedCount not decremented

**Solution**: Atomic transaction in cancel endpoint
```javascript
// Mark booking cancelled
db.collection('bookings').findOneAndUpdate(
  { _id, status: 'confirmed' },
  { $set: { status: 'cancelled' } }
)
// Then decrement slot
db.collection('slots').findOneAndUpdate(
  { _id: booking.slotId },
  { $inc: { bookedCount: -1 } }
)
```

---

## 8. Code Architecture & Patterns

### File Structure
```
app/
├── api/
│   ├── bookings/
│   │   ├── route.ts          (GET, POST)
│   │   └── [id]/route.ts     (PATCH - cancel)
│   └── slots/
│       └── route.ts          (GET, POST)
├── book/[slotId]/page.tsx    (Booking form)
├── my-bookings/page.tsx      (Customer view)
├── owner/
│   ├── page.tsx              (Owner dashboard)
│   └── create-slot/page.tsx  (Slot form)
├── layout.tsx
├── page.tsx                  (Home - slot listing)
└── globals.css

lib/
├── mongodb.ts                (Client cache + connection)
├── slots.ts                  (Types, validation, serialization)
├── bookings.ts               (Types, validation, serialization)
└── owner-auth.ts             (PIN verification)

components/
├── ui/
│   ├── button.tsx
│   ├── input.tsx
│   └── badge.tsx
├── book-form.tsx             (Booking form)
├── create-slot-form.tsx      (Slot creation)
├── my-bookings.tsx           (Bookings list)
└── slot-card.tsx             (Slot preview)
```

### Patterns
1. **Validation Layer**: `lib/slots.ts` and `lib/bookings.ts` handle all input validation
2. **Serialization**: Convert MongoDB documents to safe JSON (ObjectId → string)
3. **Error Handling**: Descriptive messages, proper HTTP status codes
4. **Type Safety**: Full TypeScript coverage, no `any`

---

## 9. Development Workflow

### Setup
```bash
npm install
cp .env.example .env.local
# Set MONGODB_URI, MONGODB_DB, OWNER_PIN
npm run dev
```

### Testing Flow
1. Create slot as owner (PIN in session storage)
2. View on home page
3. Book as customer (email lookup)
4. View in my bookings
5. Cancel booking → Verify slot count decrements

### Git Hygiene
- Commit per feature (not all at once)
- Meaningful messages: `feat: add booking atomicity check`

---

## 10. Success Criteria

- ✅ Core flow works end-to-end (create → book → view → cancel)
- ✅ No overbooking (atomic protection)
- ✅ No race conditions (proper error handling)
- ✅ Proper error messages (user-facing validation)
- ✅ Clean code (types, validation, patterns)
- ✅ README with setup + usage
- ✅ Git history tells the story

---

## 11. Notes for Tech Lead Presentation

- **Why MongoDB**: Atomic operations on bookedCount prevent race conditions
- **Why Session PIN**: Simple, suitable for internal demo; JWT/OAuth for production
- **Why Next.js**: Unified API + frontend, Server Components for performance
- **Why Tailwind**: Rapid iteration, consistent design system
- **Why No External State Manager**: Hooks sufficient for current scope; Zustand if more client-side state needed
- **Trade-offs Made**: Focused on booking atomicity over advanced filtering/search

---

**Status**: Phase 2-3 Implementation → Ready for Phase 4 Polish
**Last Updated**: May 24, 2026
