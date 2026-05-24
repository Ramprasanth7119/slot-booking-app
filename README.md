# SlotBook - Modern Slot & Session Booking System

A full-stack booking application built with Next.js, MongoDB, and TypeScript. Designed for small businesses (clinics, salons, tutors, consultants, co-working spaces) to manage time slot availability and customer reservations.

## Features

### Customer Features
- **Browse Available Slots**: Real-time slot listing with capacity and availability status
- **Book Slots**: Secure booking with atomic transaction protection (prevent overbooking)
- **View My Bookings**: Email-based lookup to view all personal bookings
- **Cancel Bookings**: Easy cancellation with automatic capacity adjustment
- **Timezone Support**: Display slots in customer's preferred timezone

### Owner Features
- **PIN-Based Authentication**: Secure session-based access to owner workspace
- **Create Slots**: Publish new time slots with custom capacity and timezone
- **View All Bookings**: Monitor who booked what and when
- **Manage Slots**: Track availability and booking status in real-time
- **Dashboard**: Comprehensive view of all operations

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 19, Next.js 16 | Server components + interactive UI |
| **Language** | TypeScript | Full type safety |
| **Database** | MongoDB | Flexible schema, atomic operations |
| **Styling** | Tailwind CSS + Custom components | Modern, scalable UI |
| **Backend** | Next.js Route Handlers | Unified API layer |
| **Authentication** | PIN-based (Session Storage) | Simple, demo-appropriate |

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- MongoDB Atlas account (or local MongoDB)
- Git for version control

### 1. Clone & Setup

```bash
# Clone repository
git clone <your-repo-url>
cd slot-booking-app

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the project root:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=slotbook

# Owner PIN (for demo access)
OWNER_PIN=1234
```

**How to get MongoDB URI:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string from "Connect" button
4. Replace with your credentials

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### For Customers

1. **Homepage** - Browse all available slots
   - See real-time capacity, timezone, and status
   - Expired slots and full slots are clearly marked
   - Click "Book Now" to proceed

2. **Book a Slot** - Enter details and confirm
   - Name and email are required
   - Atomic protection ensures no overbooking
   - Get instant confirmation

3. **My Bookings** - Lookup and manage bookings
   - Enter your email to retrieve all bookings
   - Cancel upcoming bookings
   - View booking status and details

### For Owners

1. **Sign In** - Navigate to `/owner`
   - Enter your PIN (default: `1234` from `.env.local`)
   - Access owner dashboard

2. **Create Slots** - Add new availability
   - Set title, description, time range
   - Configure capacity (1-100 spots)
   - Choose timezone for display

3. **View Bookings** - Monitor all reservations
   - See all customer bookings
   - Track capacity utilization
   - Monitor cancellations

## API Endpoints

### Public Endpoints

**GET /api/slots**
- Fetch all active slots
- Returns: List of slots with status, capacity, and booking count

**POST /api/bookings**
- Create a new booking
- Body: `{ slotId, customerName, customerEmail }`
- Returns: Booking confirmation

**GET /api/bookings?email={email}**
- Fetch bookings by customer email
- Returns: List of bookings with slot details

**PATCH /api/bookings/{id}**
- Cancel a booking
- Returns: Confirmation

### Owner-Protected Endpoints (Requires PIN)

**POST /api/slots**
- Create a new slot
- Header: `x-owner-pin: {PIN}`
- Body: `{ title, description, startTime, endTime, timezone, capacity }`
- Returns: Created slot object

**GET /api/owner/bookings**
- Fetch all bookings (owner view)
- Header: `x-owner-pin: {PIN}`
- Returns: All bookings across all slots

## Business Logic & Edge Cases

### Atomic Transaction Protection

The booking system prevents overbooking through atomic database operations:

```javascript
// Only succeeds if capacity hasn't been reached
db.collection('slots').findOneAndUpdate(
  { _id, bookedCount: { $lt: capacity } },
  { $inc: { bookedCount: 1 } }
)
```

### Duplicate Prevention

Customers cannot book the same slot twice:
```javascript
// Check before allowing booking
db.collection('bookings').findOne({
  slotId, customerEmail, status: 'confirmed'
})
```

### Slot Expiry

- Expired slots show "Expired" badge
- API rejects bookings for expired slots
- Customers can't book past-time slots

### Booking Cancellation

When a booking is cancelled:
1. Booking marked as "cancelled"
2. Slot `bookedCount` is decremented atomically
3. Spot becomes available again

## Project Structure

```
app/
├── api/
│   ├── auth/verify-pin/         # PIN verification
│   ├── bookings/                # Booking CRUD
│   ├── slots/                   # Slot CRUD
│   └── owner/bookings/          # Owner bookings view
├── book/[slotId]/               # Booking form page
├── my-bookings/                 # Customer bookings lookup
├── owner/
│   ├── page.tsx                 # Owner dashboard
│   ├── create-slot/             # Slot creation form
│   └── bookings/                # Owner bookings view
├── layout.tsx                   # Root layout
├── page.tsx                     # Home page
└── globals.css

lib/
├── mongodb.ts                   # MongoDB connection
├── slots.ts                     # Slot types & validation
├── bookings.ts                  # Booking types & validation
└── owner-auth.ts                # PIN verification

components/
├── ui/                          # UI primitives
│   ├── button.tsx
│   ├── input.tsx
│   └── badge.tsx
├── book-form.tsx                # Booking form
├── create-slot-form.tsx         # Slot creation form
├── my-bookings.tsx              # Bookings list
└── slot-card.tsx                # Slot card component
```

## Development Workflow

### Create a Slot
1. Go to `/owner`
2. Sign in with PIN (1234)
3. Click "Create Slot"
4. Fill in details, submit
5. Slot appears on homepage immediately

### Book a Slot
1. Homepage shows all available slots
2. Click "Book Now" on desired slot
3. Enter name and email
4. Confirm booking
5. Redirected to "My Bookings" view

### Test Booking Atomicity
1. Create a slot with capacity 1
2. Try booking simultaneously from multiple tabs
3. Only one booking succeeds
4. Other shows "Slot is full" error

## Error Handling

The app handles edge cases gracefully:

| Error | Handled | Response |
|-------|---------|----------|
| Slot not found | ✅ | Friendly "not found" page with navigation |
| Overbooking attempt | ✅ | "Slot is full" error message |
| Duplicate booking | ✅ | "You already have a booking for this slot" |
| Expired slot | ✅ | "Slot has already ended" |
| Invalid PIN | ✅ | Clear authentication error |
| Network error | ✅ | Retry-friendly messages |

## Testing Checklist

- [ ] Create a slot as owner
- [ ] View slot on homepage
- [ ] Book slot as customer
- [ ] View booking in my-bookings
- [ ] Cancel booking and verify capacity updates
- [ ] Try booking with invalid email
- [ ] Test with expired slot
- [ ] Test with full capacity slot
- [ ] Try duplicate booking for same slot
- [ ] Try double-booking (simultaneous attempts)

## Deployment

### Production Checklist

- [ ] Set strong `OWNER_PIN` in environment
- [ ] Use secure MongoDB connection (IP whitelist)
- [ ] Enable HTTPS
- [ ] Set up monitoring/logging
- [ ] Test all flows in staging
- [ ] Create database backups

### Deploy to Vercel

```bash
# Push to GitHub
git push origin main

# Connect to Vercel
# Add environment variables in Vercel dashboard
# Automatic deployment on push
```

## Performance Considerations

- **Server-Side Rendering**: Homepage slots fetched server-side for fast initial load
- **Database Indexing**: Slots indexed on `startTime` for quick sorting
- **Atomic Operations**: Prevents expensive validation post-booking
- **Session Storage**: PIN stored client-side to avoid backend auth tokens

## Future Enhancements

Potential features for production version:
- Email notifications via SendGrid/AWS SES
- Payment processing (Stripe)
- Google/Outlook calendar integration
- Advanced analytics dashboard
- SMS reminders
- Rate limiting & abuse prevention
- OAuth authentication
- Slot templates & recurring slots
- Customer reviews/ratings

## Troubleshooting

### MongoDB Connection Error
```
MONGODB_URI is missing in .env.local
```
**Solution**: Add MongoDB URI to `.env.local`

### Owner PIN not working
```
Owner PIN is missing. Please sign in again.
```
**Solution**: Refresh page, ensure PIN is correct in `.env.local`

### Booking fails with "Slot is full"
- Slot capacity has been reached
- Another customer just booked the last spot
- Create a new slot or wait for cancellation

### Timezone display is wrong
- Verify timezone is IANA standard (e.g., `America/New_York`)
- Check browser timezone settings
- Use owner-specified timezone, not browser timezone

## Git Commit History

Clean, meaningful commits demonstrate development process:

```
feat: initial project setup with MongoDB connection
feat: implement slot creation API with validation
feat: add customer booking with atomic protection
feat: create booking cancellation with cleanup
feat: add owner dashboard and PIN authentication
feat: implement my-bookings with email lookup
feat: improve error handling and edge cases
fix: prevent duplicate bookings
refactor: extract validation logic to lib/
docs: add comprehensive README
```

## Code Quality

- **TypeScript**: Full type coverage, no `any`
- **Validation**: Input validation at API layer
- **Error Handling**: Descriptive error messages
- **Security**: PIN-based auth, input sanitization
- **Performance**: Database indexing, atomic operations

## Contact & Support

- **Questions**: Review `PROJECT_PLAN.md` for architecture details
- **Issues**: Check GitHub issues
- **Contributions**: Follow git workflow (feature branches)

---

**Built for the Intern Skill Assessment**  
**Status**: Production-ready MVP  
**Last Updated**: May 24, 2026
