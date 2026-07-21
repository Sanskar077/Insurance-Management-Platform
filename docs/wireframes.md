# Wireframe Planning (Low-Fidelity)

No high-fidelity design in this phase — this describes structural layout only, applicable
across Admin, Agent, and Customer screens unless noted.

## Global Shell

- **Header:** logo/app name (left), global search (center, list screens only), notifications
  bell + profile avatar/menu (right).
- **Sidebar:** role-based nav items with icons + labels; active item highlighted; collapsible.
- **Main Content:** page title + breadcrumb at top, primary action button (e.g. "+ New Policy")
  aligned right of the title row.

## Dashboard Screens (Admin / Agent / Customer)

- Row of summary **cards** (3–4 across on desktop, stacked on mobile) showing key metrics.
- Below cards: a chart section (e.g. claims-over-time, premium collection trend).
- Below chart: a compact **table** of recent activity (recent claims, recent payments).

## List Screens (Customers, Policies, Claims, Payments, Documents)

- **Search** bar + **filter** controls (status, date range, role-dependent filters) above the table.
- **Table** with sortable column headers, row actions (view/edit/delete) in the last column.
- **Pagination** control at the bottom (page size selector + page navigation).
- Empty state message when no records match.

## Detail Screens (Customer Profile, Policy Detail, Claim Detail)

- Header block with key identifying info (name, policy number, status badge).
- Tabbed or sectioned layout: Overview / Documents / History / Related Records.
- Action buttons contextual to role (e.g. Agent sees Approve/Reject on Claim Detail).

## Forms (Register Customer, Create Policy, Submit Claim, Upload Document)

- Single-column form on mobile, two-column grid on desktop for related fields.
- Inline validation messages under each field.
- Sticky footer with Cancel / Submit buttons on long forms.
- File upload fields show a drag-and-drop zone with a file list and progress indicator.

## Responsive Behavior

- Breakpoints: mobile (<640px), tablet (640–1024px), desktop (>1024px).
- Sidebar → hamburger drawer below tablet width.
- Tables → horizontally scrollable or convert to stacked cards below tablet width.
- Forms → single column below tablet width.

## Dark Mode Readiness

- All colors defined via Tailwind design tokens / CSS variables (no hardcoded hex in components)
  so a `dark:` variant class strategy can be layered in later without refactoring markup.
- Card, table, and sidebar backgrounds use semantic tokens (`bg-surface`, `bg-surface-muted`,
  etc.) rather than fixed grays, decided when the design system is implemented.
