# Changelog

All notable changes to agentic-automation are documented here.

---

## v1.0.0 -- EventHub test suite -- 2026-11-25

- API tests for auth, events (CRUD, filters, pagination), bookings and health, validated against strict Zod schemas built from the OpenAPI contract.
- UI tests for login, registration, events list (search, category and city filters), My Bookings (list, cancel, clear all) and booking details with refund eligibility.
- E2E booking flow (UI booking verified through the API).
- Accessibility scans with axe-core (WCAG 2.x A/AA).
- Chromium and WebKit in CI; Firefox project configured.
- HTML report published to GitHub Pages.

## v0.1.0 -- Project scaffolded -- 2026-11-25

Scaffolded with [create-agentic-playwright](https://github.com/idavidov13/agentic-playwright).
