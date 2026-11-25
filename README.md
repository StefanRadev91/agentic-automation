# agentic-automation

[![Playwright Tests](https://github.com/StefanRadev91/agentic-automation/actions/workflows/playwright.yml/badge.svg)](https://github.com/StefanRadev91/agentic-automation/actions/workflows/playwright.yml)
[![Lint](https://github.com/StefanRadev91/agentic-automation/actions/workflows/lint.yml/badge.svg)](https://github.com/StefanRadev91/agentic-automation/actions/workflows/lint.yml)
![Playwright](https://img.shields.io/badge/Playwright-TypeScript-45ba4b)
![Node](https://img.shields.io/badge/node-%3E%3D22-green)

End-to-end and API test automation for **EventHub**, the public practice app from
[Rahul Shetty Academy](https://rahulshettyacademy.com/practice), built with
**Playwright + TypeScript**.

- App under test: <https://eventhub.rahulshettyacademy.com>
- API under test: <https://api.eventhub.rahulshettyacademy.com/api/docs> (Swagger / OpenAPI)
- Latest test report: <https://stefanradev91.github.io/agentic-automation/>

## What is covered

| Layer | Area                                          | Tests |
| ----- | --------------------------------------------- | ----: |
| API   | Auth: register, login, `/auth/me`             |    30 |
| API   | Events: list, pagination, filters, CRUD       |    34 |
| API   | Bookings: create, read, list, cancel          |    21 |
| API   | Health and feature flags                      |     2 |
| UI    | Login, validation, logout                     |    13 |
| UI    | Registration                                  |     2 |
| UI    | Events list: search, category and city filter |     5 |
| UI    | My Bookings: list, cancel, clear all          |     3 |
| UI    | Booking details and refund eligibility        |     3 |
| UI    | Accessibility (axe-core, WCAG 2.x A/AA)       |     4 |
| E2E   | Book through the UI, verify through the API   |     1 |

UI and E2E tests run on **Chromium and WebKit** in CI (`npm run test:chromium`,
`test:webkit`). A Firefox project is configured too (`npm run test:firefox`).

Tests are tagged `@smoke`, `@regression`, `@api` or `@e2e` (exactly one per test), so a
subset runs with `npm run test:smoke`, `test:regression`, `test:api` or `test:e2e`.

### Bugs found in the application

The API contract (OpenAPI) is the source of truth. Where the live API disagrees,
the test is kept and marked `test.skip` with a `// FIXME` instead of loosening the schema:

| Endpoint                            | Contract says      | Live API does                                |
| ----------------------------------- | ------------------ | -------------------------------------------- |
| `POST /auth/login` (bad creds)      | `404`              | `400 Invalid email or password`              |
| `POST /auth/register`               | `400` on bad input | `500` when `password` is a number or boolean |
| `GET /events/{id}` (id = `abc`)     | `404`/`4xx`        | `500 Internal server error`                  |
| `Event.price`, `Booking.totalPrice` | number             | numeric string (`"300"`)                     |

Accessibility (axe-core): the sign-in, events and My Bookings pages fail the WCAG AA
`color-contrast` rule, and the two filters on the events page fail `select-name` (no
accessible name). The active tests ignore exactly these known rules, so any _new_ serious or
critical violation still fails; one skipped test documents the strict version.

Also undocumented: `/events` and `/bookings` require a token (`401` without one), and
responses carry extra fields (`isStatic`, `userId`, `details`).

## How it works

- **No shared credentials.** Each run registers a fresh throwaway account through the API
  (`tests/app/auth-api.setup.ts`), stores its token, and signs the same account in through the
  browser once (`tests/app/auth.setup.ts`). UI tests then start already authenticated.
- **Isolated test data.** Tests that need an event get one from the `createdEvent` fixture,
  which creates it through the API and deletes it afterwards. Deleting an event also deletes
  its bookings, so nothing is left behind.
- **Typed contracts.** Every API response is validated against a strict Zod schema built from
  the OpenAPI document (`fixtures/api/schemas/`).
- **Page Object Model with dependency injection.** Page objects are Playwright fixtures; specs
  never call `new Page(...)`.
- **Locator priority:** role, label, placeholder, text, then `data-testid`.
- **Data:** Faker factories for happy paths, curated static sets for negative tests.
- **Rules enforced in code.** ESLint rules and a commit-time scan reject XPath, hard waits,
  `any`, loose schemas and hardcoded test content.

```
tests/app/{api,functional,e2e}   specs
pages/                           page objects and components
fixtures/                        DI for pages, API client, setup/teardown helpers; Zod schemas
test-data/                       Faker factories and static negative data
enums/  config/  helpers/        routes, endpoints, messages, env config, auth bootstrap
```

## Run it

Requires Node 22 or newer.

```bash
npm install
npx playwright install chromium
cp env/.env.example env/.env.dev

npm test                 # everything (UI + API)
npm run test:api         # API only, no browser
npm run test:smoke       # smoke tests
npm run test:ui          # Playwright UI mode
npm run test:webkit      # UI suite on WebKit
npm run report           # open the last HTML report
npm run lint
```

## CI

GitHub Actions runs the suite on every push and pull request, uploads the HTML report as an
artifact, and publishes it to GitHub Pages from `main` (Chromium, WebKit and API projects). A separate workflow lints and
type-checks the project.

## Working with an AI coding assistant

The repository is set up for AI-assisted development, and this project was built that way.
The rules live in [AGENTS.md](AGENTS.md) (with [CLAUDE.md](CLAUDE.md) for Claude Code) and the
detailed skills in `.claude/skills/` and `.agents/skills/`.

- The assistant explores the live app with `playwright-cli` before it writes any page object or
  selector, and builds API schemas from the OpenAPI document, not from guessed responses.
- It proposes a plan, then writes code under the rules (no XPath, no hard waits, no `any`,
  strict Zod schemas, one tag per test).
- Nothing counts as done until ESLint, Prettier, the type-check and the affected tests pass. The
  same checks run in the pre-commit hook and in CI, so they apply to every contributor.
- Where the live API contradicts its documentation, the test is skipped with a `FIXME` instead
  of weakening the schema (see "Bugs found in the application").

## Credits

Built on the open-source [Agentic Playwright](https://github.com/idavidov13/agentic-playwright)
scaffold by Ivan Davidov (MIT License): project structure, fixture layout and the rule/skill
files for AI coding assistants. See [LICENSE](LICENSE) and [NOTICE.md](NOTICE.md). The test
suite, page objects, schemas, data and CI configuration for EventHub are original to this repository.
