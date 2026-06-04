# Frontend Challenge — Reliability Index Explorer

# SOLUTION

## Used packages

- @tanstack/react-query: Hooks for fetching, caching and updating asynchronous data in React
- @tanstack/react-virtual: Headless UI for virtualizing scrollable elements in React
- date-fns: Date utility library
- recharts: React charts

## SSE transport fallback

The OpenAPI document describes `/api/users/{userId}/transaction-events` as a
standard `text/event-stream` endpoint. In practice, the endpoint returns a JSON
wrapper containing the SSE payload as a string, while the actual HTTP response
uses `Content-Type: application/octet-stream`. Because the browser `EventSource`
API requires a real `text/event-stream` response, native SSE cannot be used.

As a workaround, transaction updates are refreshed with periodic polling. The
response wrapper is parsed, the embedded SSE-formatted payload is extracted, and
the resulting transaction events are passed through the same update pipeline.

## Possible Improvements

- use CSS variables for repeated values like colors, spacing, typography, etc.;
- test real SSE behavior;
- split TransactionExplorer into smaller components: filters, toolbar, table header, virtualized rows;
- move transaction formatting/sorting helpers from component body into shared utils and actually reuse them;
- improve loading/empty/error states per dashboard section with consistent UI;
- add request/error observability;
- add tests;

# TASK

## Context

Your team is building a thin-file credit decision tool. Many users have limited or no traditional credit history. To evaluate them, our backend computes a **Reliability Index (0–100)** using bank transaction data.

This internal tool is used by risk analysts and product teams to:
- understand how a score was computed
- inspect underlying transaction patterns
- identify anomalies in financial behavior
- validate that the scoring system behaves correctly

The tool must handle large transaction datasets and complex scoring signals while remaining clear, explainable, and easy to inspect.

Your task is to design and implement a frontend application that visualizes and explains the Reliability Index.

**Timebox:** 4 hours. We care more about engineering decisions and structure than UI polish. If you cannot complete everything, focus on core functionality and architecture.

**Tech stack:**
- Preferred: React + TypeScript
- Allowed: React Native, Vite, any state management or charting libraries

Please document the libraries you choose and why.

---

## API

```bash
API_BASE_URL==https://wydokyegph.execute-api.eu-central-1.amazonaws.com/
```

```bash
SSE_BASE_URL==https://vpjjdvoeej5izlqy3nnpllmyua0idsrp.lambda-url.eu-central-1.on.aws/
```

The service is split across two hosts:

| Purpose | Base URL |
| --- | --- |
| REST (reliability score, transactions, discovery) | `{{API_BASE_URL}}` |
| Server-Sent Events (live transaction updates) | `{{SSE_BASE_URL}}` |

### Discovering the API

Use the discovery endpoint on the REST host to explore available users and endpoints:

```bash
curl "{{API_BASE_URL}}/"
```

The full API specification is available as an OpenAPI 3.0 document:

`{{API_BASE_URL}}/openapi.yaml`

---

## What to Build

### A) Reliability Overview

Fetch and display the reliability score for a user. The dashboard should display:
- Reliability score
- Score band
- Scoring window
- Key metrics
- Score drivers

### B) Score Breakdown Visualization

Visualize the four scoring signals:
- Income Regularity
- Income Coverage Ratio
- Essential Payments Consistency
- Resilience Adjustments

The UI should make it clear how the score was derived.

### C) Transaction Explorer

Analysts need to inspect the transactions used in scoring. Build a Transaction Explorer that supports:
- Sorting
- Filtering by category
- Filtering by positive / negative transactions
- Search by merchant
- Pagination or virtualization

Transaction responses may contain out-of-order records. The UI should remain usable even with thousands of transactions.

### D) Cashflow Timeline

Display a monthly cashflow view for the scoring window. You can choose a suitable visual representation — the goal is to help analysts understand financial stability trends.

### E) Score Explanation Panel

Provide a clear explanation of the score drivers — positive signals and risk signals. The explanation should be easy to understand for non-technical users.

### F) Data States

Your application should correctly handle:
- Loading states
- Empty states
- API errors

### G) Large Datasets

Transaction datasets may contain thousands of records. The transaction explorer should remain responsive, usable, and performant. Your solution should demonstrate how the UI scales when working with large collections of data.

### H) Streaming Transaction Updates

The system emits transaction events over Server-Sent Events at:

```
GET {{SSE_BASE_URL}}/api/users/{userId}/transaction-events
```

The event names (`TRANSACTION_ADDED`, `TRANSACTION_UPDATED`, `TRANSACTION_DELETED`) and payload shapes are in the OpenAPI document under that path. Your solution should update:
- Transaction lists
- Filters
- Charts
- Derived views

without breaking UI state.

---

## Deliverables

1. **Working frontend application**
2. **README** — setup instructions, assumptions, trade-offs, limitations
3. **Architecture notes** — how you structured the frontend, state management decisions, data fetching strategy, component design approach
4. **At least one diagram** — component architecture, data flow, or state management
5. **AI usage disclosure** — if AI tools were used, explain where

---

## Discussion Topics

The following topics are **not required to be implemented** as part of the assignment. Please include your thoughts in the README.

We will explore them during the **discussion interview** to understand your thinking, trade-offs, and system design approach.

- **API Design & Evolution** — How would your frontend handle evolving or breaking API contracts? How would you support adding new scoring signals over time?
- **Data Ownership & Boundaries** — What responsibilities belong in the frontend vs backend? What would you compute on each side?
- **Data Consistency & Correctness** — How would you ensure correctness when transactions arrive out of order, partial data is loaded, or updates happen frequently?
- **Scalability** — How would your solution evolve for 100K+ transactions or high-frequency updates?
- **Real-Time Updates** — How would you design for continuous streaming updates while maintaining UI consistency?
- **Caching & Performance** — What caching strategy would you use? How would you handle cache invalidation?
- **Incident Thinking** — If the UI becomes slow or incorrect in production, how would you debug it?

---

## What We Value

- Clean, well-structured frontend architecture
- Thoughtful component design and data handling
- Performance awareness with large datasets
- Clear documentation of decisions and trade-offs

Use of AI is explicitly permitted. Please document where and how you used it.
