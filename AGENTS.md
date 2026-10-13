# C'Floral — Codex instructions

Single-operator finance app; design for future multi-user support without implementing authentication or roles unless requested.

## Repository map
- `app/`: Next.js App Router; shared CSS and color tokens in `app/global.css`.
- `components/`: business UI.
- `lib/data.ts`: Supabase queries and demo data.
- `lib/supabase.ts`: Supabase client.
- `supabase/schema.sql`: database schema, triggers, RLS.
- `.env.example`: public environment variable names.

## Business invariants
- Receivable = flower price + shipping charged to customer.
- `order_payments` stores payments; DB trigger maintains `orders.amount_paid` and status.
- Dashboard difference = actual receipts − flower purchases − other expenses.
- `courier_cost` is informational and must not be deducted twice if recorded as an expense.
- Flower purchases and other expenses remain distinct.

## Workflow (minimize context and tokens)
1. Identify the task and read ONLY the relevant role file below; do not load all role files by default.
2. Inspect targeted files, then expand search only if necessary. Prefer narrow `rg` and bounded file reads; never dump entire repo or generated files.
3. For simple tasks, use the main agent alone. Delegate only independent work where parallelism is worthwhile; never spawn all four by default.
4. Before editing, state the intended file scope briefly. Preserve existing architecture and business rules.
5. Never print secrets, `.env.local` values, or real customer data. Do not run migrations or modify production data without explicit approval.
6. Run targeted verification. Never claim a test passed unless actually executed.
7. Final response: concise outcome, files changed, tests/results, risks, and token usage only if reliably available. Never fabricate token counts. Ask user to inspect `/status` or usage dashboard when exact per-task usage is unavailable.

## Role routing
- Architecture/design decisions: `.agents/architecture.md`
- Feature implementation and bug fixes: `.agents/coder.md`
- Independent code review: `.agents/reviewer.md`
- Tests and verification: `.agents/tester.md`

Role files are instructions for delegated responsibilities, not proof of automatically registered custom agent types. Explicitly delegate using Codex multi-agent facilities when available; otherwise apply the relevant role within the main session.
