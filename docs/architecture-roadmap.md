# SlotBook Architecture Roadmap

## Target Structure

- Public users stay on a customer-facing site for browsing, booking, and managing their own reservations.
- Admin users get a separate management surface for slot creation, editing, deletion, and booking oversight.
- Shared APIs remain centralized under `app/api/*`.

## Step 1 - Surface Split

- Add a dedicated `/admin` area and keep `/owner` as a legacy alias for now.
- Separate the public navigation from the admin navigation so the current UI stops feeling mixed.
- Keep the customer booking flow in public routes only.

## Step 2 - Admin Slot CRUD

- Add slot update, archive, and delete operations.
- Add a slot management list with actions.
- Keep customer pages read-only.

## Step 3 - Booking Oversight

- Improve the admin bookings view with filters and status labels.
- Keep duplicate prevention and cancellation logic atomic.

## Step 4 - Cleanup

- Remove legacy owner naming once the admin surface fully replaces it.
- Consolidate shared UI patterns into reusable components.