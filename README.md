# SlotBook

SlotBook is a modern slot booking application built with Next.js, React, TypeScript, MongoDB, Zustand, and TanStack Query. It is designed for demos and small real-world booking flows such as consultations, workshops, sessions, appointments, and private events.

The app includes a public booking site, an owner/admin workspace, live availability previews, booking management, dark and light theme support, and demo-safe fallback data so the UI can still be shown even if local MongoDB is unavailable.

## What You Can Do

- Browse available slots on the public homepage.
- Open a slot and book it from the public booking page.
- See live availability updates and slot details such as venue, conductor, timezone, audience, and highlights.
- Switch between dark and light themes using the top-right toggle.
- View your bookings by email on the My Bookings page.
- Sign in as an owner to create and manage slots.
- Inspect owner booking activity.
- Seed rich sample slot data into MongoDB for a better demo.

## Main Features

### Public Experience
- Home page with featured live capability panels.
- Slot cards showing title, description, venue, conductor, time, capacity, and status.
- Slot booking page with a live availability panel.
- Booking form validation for name and email.
- Booking success redirects back to the public site.
- Theme toggle with persistent light and dark mode.

### Live and Demo Behavior
- Public slot lists refresh automatically with TanStack Query.
- Live availability panels update without a page reload.
- Requests fail fast instead of waiting for long Mongo connection timeouts.
- When MongoDB is unavailable, the app falls back to in-memory demo data so the demo can still run.
- Demo slots include richer sample content for a more polished presentation.

### Owner and Admin Experience
- Owner workspace under `/owner`.
- Admin workspace under `/admin`.
- Slot creation forms for publishing new availability.
- Slot management and booking oversight views.
- PIN-based access control for owner/admin actions.

### Shared State and Data Fetching
- Zustand powers shared client state for the theme toggle.
- TanStack Query handles live slot refreshes and booking availability updates.
- The app uses React Query provider wiring at the root layout.

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- MongoDB
- Zustand
- TanStack Query
- Tailwind CSS
- Custom UI components

## Project Structure

- `app/` - Routes, pages, layouts, and API route handlers.
- `components/` - Reusable UI and feature components.
- `lib/` - MongoDB helpers, domain validation, demo data, and auth helpers.
- `scripts/` - Utility scripts such as the slot seeder.
- `docs/` - Architecture notes and roadmap.
- `public/` - Static assets.

## Key Routes

### Public Pages
- `/` - Homepage with slot listings and live feature showcase.
- `/book/[slotId]` - Book a specific slot.
- `/my-bookings` - Look up bookings by email.

### Owner and Admin Pages
- `/owner` - Owner dashboard.
- `/owner/create-slot` - Create a new slot.
- `/owner/bookings` - Owner booking overview.
- `/admin` - Admin landing page.
- `/admin/create-slot` - Admin slot creation.
- `/admin/bookings` - Admin bookings view.
- `/admin/slots` - Admin slot list.

## API Routes

### Public APIs
- `GET /api/slots` - List active slots.
- `GET /api/slots/[id]` - Read one slot.
- `POST /api/bookings` - Create a booking.
- `GET /api/bookings?email=you@example.com` - Look up bookings by email.
- `PATCH /api/bookings/[id]` - Cancel or reschedule a booking.

### Owner and Admin APIs
- `POST /api/slots` - Create a slot.
- `PATCH /api/slots/[id]` - Update a slot.
- `DELETE /api/slots/[id]` - Archive a slot.
- `GET /api/owner/bookings` - Fetch owner booking overview.
- `POST /api/admin/setup-indexes` - Create indexes and apply the collection validator.

## Requirements

- Node.js 18 or newer.
- npm.
- MongoDB Atlas or a local MongoDB instance if you want persistence.

## Setup

### 1. Install Dependencies

```bash
npm install
```

This installs the full stack used by the app, including `zustand` and `@tanstack/react-query`.

### 2. Create Environment Variables

Create a `.env.local` file in the project root.

```env
MONGODB_URI=mongodb://localhost:27017/slotbook
MONGODB_DB=slotbook
OWNER_PIN=1234
```

If you are using MongoDB Atlas, replace `MONGODB_URI` with your Atlas connection string.

### 3. Run the App

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

### 4. Optional Checks

```bash
npm run lint
npm run seed:slots
```

- `npm run lint` checks the codebase for issues.
- `npm run seed:slots` loads richer sample slots into MongoDB for a better demo.

## Seed Sample Data

The repo includes a seed script that loads richer demo slots into MongoDB.

```bash
npm run seed:slots
```

Use this when you want the homepage and booking pages to show more realistic sample data.

## How the App Works

### Booking Flow
1. A visitor opens the homepage.
2. The page shows available slots and live availability information.
3. The visitor opens a slot and fills in name and email.
4. The booking is submitted through the API.
5. On success, the user is sent back to the public homepage.

### Owner Flow
1. An owner opens `/owner` or `/admin`.
2. The owner enters the PIN.
3. The owner creates or manages slots.
4. Booking activity and slot state update through the shared API layer.

### Theme Flow
1. The app loads in the saved theme if one exists.
2. The theme toggle updates the page instantly.
3. The selection is stored locally so it persists across refreshes.

### Data Flow
1. The public homepage reads the initial slots on the server.
2. TanStack Query keeps the live slot data fresh in the browser.
3. Booking availability is rechecked on the booking page before submit.
4. Zustand stores the current theme mode in the browser.

## Demo and Fallback Behavior

This project is demo-friendly.

- If MongoDB is available, the app uses the database normally.
- If MongoDB is slow or unavailable, the app falls back to demo data for key read paths so the site can still be shown.
- The booking and live refresh requests use short timeouts so the UI does not sit on a long network wait during a demo.
- The fallback mode keeps the homepage, slot page, booking form, and major lookup flows usable during a demo.

That means a new person can still open the app, browse slots, and understand the product even if their local MongoDB service is not ready.

## Troubleshooting

### MongoDB does not connect
- Check `MONGODB_URI` in `.env.local`.
- Make sure the local MongoDB service is running.
- If you only need a demo, the app will still show fallback data for many screens.

### Booking is slow
- The app now uses short connection timeouts and request aborts.
- If MongoDB is still slow, switch to demo mode or seed a local database.

### Theme toggle does not appear right
- Make sure the root layout is loading the theme toggle.
- Clear browser storage and refresh if an old theme setting is stuck.

### Booking form shows a network error
- Confirm the slot is still available.
- If MongoDB is unavailable, the app may fall back to demo data instead of persisting the booking.

## Development Notes

- Server components read MongoDB directly instead of fetching their own API routes.
- Client components use TanStack Query for live refresh and booking actions.
- Zustand stores theme state instead of a custom external-store implementation.
- Slot and booking data are validated in shared library code.
- The live feature showcase on the homepage polls at a slower interval to reduce unnecessary traffic during demos.

## Testing Checklist

- Open the homepage and confirm slots render.
- Switch theme between dark and light.
- Open a slot page and confirm the booking panel loads.
- Submit a booking with valid name and email.
- View the My Bookings page.
- Sign in as owner and create a slot.
- Run the seed script and verify the homepage updates.

## Deployment

Before deploying:
- Set a strong `OWNER_PIN`.
- Configure production MongoDB credentials.
- Verify the app in staging.
- Make sure indexes are set up with the admin setup route if needed.

A simple production flow is:

```bash
git push origin main
```

Then connect the repo to your hosting platform and add the environment variables there.

## Need a Quick Mental Model?

- `app/` contains the pages and route handlers.
- `components/` contains the UI building blocks.
- `lib/` contains the actual booking, slot, auth, and demo logic.
- MongoDB is the source of truth when available.
- Demo fallback keeps the app usable when the database is not cooperating.

## Libraries Used

- `zustand` - shared client state, currently used for theme mode.
- `@tanstack/react-query` - client-side data fetching, caching, and background refresh for live slots and booking availability.

These two libraries replace hand-rolled state and polling code where that made the code simpler and more reliable.

## Last Updated

May 27, 2026
