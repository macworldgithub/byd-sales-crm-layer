# Harmony CRM further updates

Implements the sales-side requirements in `Harmony_CRM_Delivery_Centre_Further_Updates.md` with the matching shared Node API and Delivery Centre release.

- The To Delivery form searches the full permitted inventory by VIN, stock number or model, with server pagination and an explicit **TBA — VIN to be advised** choice. Both the main Sold modal and inline Delivery-tab handoff use the same picker. Stale/unavailable stock and missing VINs are validated on the server.
- Day-3 post-delivery call reminders appear in the CRM for the assigned salesperson. Staff can call the customer, open the profile, record call notes/outcome and a text action, optionally send a manual customer text, and complete the task. Notes and actions remain in customer history.
- Reminders refresh in-app and follow the selected dealership. Delivery managers configure the sequence and its four templates in Delivery Centre settings.

Deploy the two APIs first. Verification covers automated regressions, production compilation/type checking, and synthetic desktop/mobile browser interactions. The temporary browser verification route is excluded from the release.
