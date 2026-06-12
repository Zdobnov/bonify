# Frontend Challenge - Reliability Index Explorer

## Setup

```bash
npm install
npm run dev
```

The Vite dev server runs on:

```bash
http://localhost:3001
```

Quality checks:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Used Packages

- `@tanstack/react-query`: fetching, caching, and updating server state.
- `@tanstack/react-virtual`: virtualized transaction rows for large datasets.
- `date-fns`: date parsing, formatting, and scoring-window calculations.
- `recharts`: cashflow timeline chart.
- `vitest`: unit tests for critical data transformation logic.
- `eslint`: static analysis for TypeScript and React hook correctness.

## Architecture Overview

The application is structured around feature components and shared data utilities:

- `App` owns API discovery, global date inputs, and selected user state.
- `UsersList` renders users from the discovery endpoint.
- `UserDashboard` orchestrates the selected user's dashboard sections.
- `ReliabilityOverview` and `ScoreBreakdown` render score details and explanations.
- `CashflowTimeline` fetches scoring-window transactions and renders monthly cashflow.
- `TransactionExplorer` lazy-loads transactions and provides search, category filtering, amount filtering, sorting, and virtualization.
- `shared/api` contains typed API functions and lightweight response normalization.
- `shared/hooks` contains live-update polling and transaction-event cache handling.
- `shared/utils` contains pure, tested transformation logic for dates, cashflow aggregation, and transaction event application.

## Data Fetching and Caching

React Query is used for server-state ownership:

- API discovery is cached because available users and data range are stable during a session.
- Reliability data is keyed by `userId` and `from`.
- Cashflow transactions are keyed by `userId` and the computed 6-month scoring window.
- Transaction Explorer data is keyed by `userId`, `from`, and `to`.

Transaction event updates are applied directly to the relevant React Query caches. This avoids unnecessary refetches when an update can be applied deterministically.

## Scoring Window Assumption

The OpenAPI document defines the reliability scoring window as 6 calendar months ending at the `from` date.

Example from the API documentation:

```txt
from=2026-02-20 -> 2025-09-01 to 2026-02-20
```

The application uses a single `getScoringWindow` helper for Reliability Overview, Cashflow Timeline, and transaction event date checks. This avoids having different sections interpret the scoring window differently.

## SSE Transport Fallback

The OpenAPI document describes `/api/users/{userId}/transaction-events` as a standard `text/event-stream` endpoint. In practice, the endpoint returns a JSON wrapper containing the SSE payload as a string, while the actual HTTP response uses `Content-Type: application/octet-stream`. Because the browser `EventSource` API requires a real `text/event-stream` response, native SSE cannot be used.

As a workaround, transaction updates are fetched with a polling-based fallback. The response wrapper is parsed, the embedded SSE-formatted payload is extracted, and the resulting transaction events are passed through the same update pipeline.

The parser reads:

- `id`
- `event`
- `data`

The OpenAPI document says `Last-Event-ID` is accepted but not used for replay, so the frontend does not rely on backend replay. Instead, event handling is designed to be idempotent.

## Correctness Strategy

Live transaction updates are applied through a pure reducer:

- `TRANSACTION_ADDED` performs an upsert and does not duplicate an existing transaction id.
- `TRANSACTION_UPDATED` updates an existing transaction, or upserts a missing one as an update.
- `TRANSACTION_DELETED` removes an existing transaction and is a no-op if the id is missing.
- `total` changes only when the transaction list actually changes.
- Events for another user are ignored.
- Events outside the active date window are ignored for that cache.
- Repeated events are deduplicated by SSE `id` when available, with a transaction-based fallback key.

This is important because the stream may reconnect, replay scripted events, or return the same transaction more than once.

## Transaction Explorer Decisions

The Transaction Explorer fetches the full transaction set for the selected date range and uses virtualization to keep DOM size small.

The API documentation states:

- transaction records are returned in arbitrary order;
- server-side category filtering is not available;
- unpaginated responses can contain 10,000+ records.

Given that, the UI performs client-side sorting and filtering, while `@tanstack/react-virtual` limits rendered rows.

Filters follow the API schema:

- category filtering uses `merchant_category_code`;
- positive/negative filtering uses the sign of `amount`;
- `type` remains visible as a column, but is treated as redundant with amount sign as documented by the API.

Merchant search uses `useDeferredValue` so typing remains responsive while large lists are filtered and sorted.

## Cashflow Timeline Performance

The initial timeline implementation calculated each month by repeatedly filtering the full transaction list. That creates unnecessary repeated work.

The current implementation aggregates transactions in one pass:

```txt
transactions -> Map<month, balance> -> chart points
```

Missing months are kept as zero-balance points so the chart always represents the full scoring window.

## Edge Case Handling

The API layer performs lightweight normalization instead of assuming perfect payloads:

- invalid transaction records are dropped;
- missing merchant names fall back to `Unknown merchant`;
- missing currencies fall back to `EUR`;
- invalid dates are ignored by date-range and cashflow helpers;
- unknown reliability score bands map to `UNKNOWN`;
- malformed embedded SSE chunks are ignored instead of crashing the update loop.

This keeps the UI resilient while avoiding a large schema-validation dependency for this assignment.

## Tests and Tooling

Automated tests currently cover:

- scoring window calculation;
- invalid and inverted date ranges;
- idempotent transaction event reducer behavior;
- event deduplication keys;
- cashflow monthly aggregation;
- zero-balance months;
- invalid transaction dates in cashflow aggregation.

Tooling:

- `npm run lint` runs ESLint with TypeScript and React hooks rules.
- `npm run typecheck` checks app and test TypeScript.
- `npm test` runs Vitest.
- `npm run build` validates production bundling.

## Known Limitations and Trade-offs

- Native `EventSource` cannot be used with the current live-update endpoint because the actual HTTP response content type is not `text/event-stream`.
- Backend replay cannot be relied on because `Last-Event-ID` is documented as accepted but not used for replay.
- Fetching all transactions plus virtualization is acceptable for this assignment and 10,000+ rows, but 100,000+ records would need backend pagination/search/filtering or an indexed client-side worker strategy.
- Client-side category filtering is required because the API does not provide category filtering.
- Runtime validation is intentionally lightweight. A production system could use a schema library such as Zod for stricter API boundary validation.
- The chart currently assumes display currency formatting in EUR.
- The production bundle still emits a Vite large-chunk warning, mainly due to charting and data libraries. A production iteration should add route/component-level code splitting or manual chunks.
- `npm install` currently reports dependency audit findings. These should be triaged separately because automatic forced fixes may introduce breaking dependency changes.

## Possible Improvements

- Split `TransactionExplorer` into smaller components: filters, toolbar, table header, virtualized rows.
- Move remaining formatting/sorting helpers from component body into shared utilities.
- Add request/error observability and structured logging.
- Add stricter runtime API validation.
- Add code splitting to reduce the main JavaScript chunk size.
- Add component tests for Transaction Explorer UI behavior.
- Add an explicit data anomaly indicator when `type` and `amount` sign disagree.
