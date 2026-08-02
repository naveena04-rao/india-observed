# Event discovery orchestrator

This optional Edge Function is an authenticated scheduler bridge. It does not contain scanner
credentials, parse sources, or publish data. Deploying it does not schedule it.

The intended schedules are `30 23 * * *` for the 05:00 IST scan and `30 2 * * *` for the 08:00
IST digest. Both remain disabled. Activation requires the database compliance gate, reviewed
secrets, a separately approved scheduler configuration, and explicit owner approval.
