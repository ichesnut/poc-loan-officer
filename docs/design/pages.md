# Loan Officer - Page Design Specifications

Tech stack: Next.js 16 (App Router) + Tailwind CSS 4 + shadcn/ui (base-nova, neutral) + Lucide icons.
Auth: NextAuth with 5 roles (admin, branch_manager, loan_officer, processor, underwriter).
All designs are mobile-first, WCAG 2.1 AA compliant.
Max content width: `max-w-7xl`. Base radius: `0.625rem`.

**Existing scaffold:** Login, basic dashboard, application list table, application detail with tabs (borrowers, income, expenses, collateral), admin pages (users, groups, permissions, config). This spec covers new pages and enhancements to existing ones.

---

## 1. Navigation Shell & Layout (Enhancement)

**File:** `src/components/nav.tsx` (existing — enhance)

### Current State
Top bar with role-filtered icon links, user name, and logout button. No "Applications" link. No mobile menu.

### Enhanced Design

```
┌──────────────────────────────────────────────────────────┐
│  [Loan Officer]   Applications  Dashboard  Admin▾  [AV]  │
│                                                          │
│  (mobile: ☰ hamburger → Sheet with stacked links)        │
└──────────────────────────────────────────────────────────┘
```

**Changes:**

1. **Add "Applications" nav link** — visible to all roles with `loans.list` permission. Should be the primary/first nav item since it's the core workflow.

2. **Group admin links under dropdown** — "Users", "Groups", "Permissions", "Settings" collapse into an "Admin" dropdown menu on desktop (visible to admin/branch_manager). Reduces nav clutter.

3. **User avatar dropdown** — Replace plain text name + logout button with an `Avatar` (initials) that opens a `DropdownMenu`:
   - Header: name + email + role badge
   - Separator
   - "Profile" link
   - "Sign out" action

4. **Mobile hamburger** — On `<md`, replace nav links with `<Menu />` icon → `Sheet` (side="right"):
   - Stacked nav links with icons
   - User info section at bottom
   - Sign out button

5. **Active state** — Current: `variant="secondary"`. Keep this — it's clear.

6. **Notification bell** (future-ready) — Space for a `<Bell />` icon next to avatar, with unread count badge. Not required for v1.

**shadcn components to add:** `Sheet`, `DropdownMenu`, `Avatar` (already installed)

### Footer

Not required for internal tools. The nav bar is sufficient.

---

## 2. Login Page (Existing — Minor Enhancement)

**File:** `src/app/login/login-form.tsx` (existing)

### Current State
Functional login form with Card, email/password fields, error display. Works well.

### Enhancements

```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│              [Logo: "Loan Officer"]                      │
│              Internal Portal                             │
│                                                          │
│         ┌─────────────────────────────┐                  │
│         │   Sign In                   │                  │
│         │   Enter your credentials    │                  │
│         │                             │                  │
│         │   ┌── Error alert ────────┐ │                  │
│         │   │ ⚠ Invalid email or pw │ │                  │
│         │   └───────────────────────┘ │                  │
│         │                             │                  │
│         │   Email                     │                  │
│         │   ┌───────────────────────┐ │                  │
│         │   │                       │ │                  │
│         │   └───────────────────────┘ │                  │
│         │                             │                  │
│         │   Password                  │                  │
│         │   ┌───────────────────────┐ │                  │
│         │   │             [Eye 👁]  │ │                  │
│         │   └───────────────────────┘ │                  │
│         │                             │                  │
│         │   [      Sign In        ]   │                  │
│         └─────────────────────────────┘                  │
│                                                          │
│         Contact your administrator for access.           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Changes from current:**
1. Add logo/branding above the card with "Internal Portal" subtitle
2. Move error from plain `<p>` to a destructive `Alert` component with `<AlertCircle />` icon
3. Add password visibility toggle (eye icon button inside the input)
4. Add a `<Loader2 className="animate-spin" />` spinner in button during loading
5. Add help text below card: "Contact your administrator for access."
6. Use `min-h-screen` instead of `min-h-[60vh]` to fully center

No registration page needed — this is an internal tool with admin-created accounts.

**shadcn components to add:** `Alert`

---

## 3. Dashboard (Existing — Redesign)

**File:** `src/app/dashboard/page.tsx` (existing — rewrite)

### Current State
Shows admin shortcut cards only. No application-related content for loan officers, processors, or underwriters.

### Redesigned Dashboard

The dashboard should be the operational hub. Different roles see different content.

```
┌──────────────────────────────────────────────────────────┐
│  [Nav bar]                                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Dashboard                          Welcome, Jane Smith  │
│                                     Loan Officer         │
│                                                          │
│  ┌─ KPI Cards ────────────────────────────────────────┐  │
│  │ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──┐ │  │
│  │ │ My Active  │ │ Pending    │ │ Approved   │ │..│ │  │
│  │ │    12      │ │ Review     │ │ This Month │ │  │ │  │
│  │ │ ↑ 3 new    │ │    5       │ │    8       │ │  │ │  │
│  │ └────────────┘ └────────────┘ └────────────┘ └──┘ │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Recent Applications ─────────── [View All →] ─────┐  │
│  │                                                    │  │
│  │  ┌── App Row ──────────────────────────────────┐   │  │
│  │  │ John Doe · Purchase · $250,000  [Submitted] │   │  │
│  │  │ LN-A3F2 · 2 hours ago                    → │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                    │  │
│  │  ┌── App Row ──────────────────────────────────┐   │  │
│  │  │ Jane Roe · Refinance · $180,000 [In Review] │   │  │
│  │  │ LN-B7C1 · Yesterday                      → │   │  │
│  │  └─────────────────────────────────────────────┘   │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Quick Actions ────────────────────────────────────┐  │
│  │                                                    │  │
│  │  [+ New Application]  [View Applications]          │  │
│  │  [Manage Users]  [Reports]                         │  │
│  │  (role-filtered)                                   │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### KPI Cards (role-dependent)

| Card | Roles | Data |
|---|---|---|
| My Active Applications | loan_officer, processor | Count of in_progress apps assigned to me |
| Pending Review | underwriter, branch_manager, admin | Count of `submitted` + `in_review` apps |
| Approved This Month | all | Count of `approved` apps this month |
| Total Pipeline Value | branch_manager, admin | Sum of requestedAmount for active apps |
| Avg Processing Time | branch_manager, admin | Avg days from submitted → approved/denied |
| My Queue | underwriter | Count of apps awaiting underwriting decision |

**Layout:** `grid gap-4 sm:grid-cols-2 lg:grid-cols-4`

Each card:
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    <Icon className="size-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <p className="text-2xl font-bold">{value}</p>
    <p className="text-xs text-muted-foreground">{subtitle}</p>
  </CardContent>
</Card>
```

### Recent Applications Section

- Shows the 5 most recent applications relevant to the user's role
- Each row: borrower name, purpose, amount, status badge, loan number, relative time, chevron-right
- Clickable → navigates to `/applications/[id]`
- "View All" link → `/applications`
- Uses a clean list layout (not a table) for scannability

### Quick Actions

Role-filtered action buttons in a flex-wrap row:
- `+ New Application` — roles with `loans.create`
- `View Applications` — roles with `loans.list`
- `Manage Users` — admin, branch_manager
- `Reports` — admin, branch_manager

**shadcn components needed:** Already installed (`Card`, `Badge`, `Button`)

---

## 4. Application List (Existing — Enhancement)

**File:** `src/app/applications/application-list.tsx` (existing — enhance)

### Current State
Basic table with columns. No filters, no search, no pagination.

### Enhanced Design

```
┌──────────────────────────────────────────────────────────┐
│  [Nav bar]                                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Loan Applications                  [+ New Application]  │
│  Manage loan applications and borrower information.      │
│                                                          │
│  ┌── Filters ─────────────────────────────────────────┐  │
│  │                                                    │  │
│  │  ┌──────────────┐  ┌──────────┐  ┌──────────────┐ │  │
│  │  │ 🔍 Search... │  │ Status ▾ │  │ Purpose ▾    │ │  │
│  │  └──────────────┘  └──────────┘  └──────────────┘ │  │
│  │                                                    │  │
│  │  Filter tabs:                                      │  │
│  │  All (24)  Submitted (8)  In Review (5)  Draft (3) │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌── Table ───────────────────────────────────────────┐  │
│  │ Loan #  Borrower  Purpose  Amount  Term Status Off │  │
│  │ ─────── ──────── ──────── ─────── ──── ────── ─── │  │
│  │ A3F2... John Doe Purchase $250K   360  [Sub]  JS  │  │
│  │ B7C1... Jane Roe Refi     $180K   240  [Rev]  MK  │  │
│  │ ...                                               │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ← Previous  Page 1 of 5  Next →                        │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Enhancements

1. **Search bar** — Text input with `<Search />` icon. Searches across loan number, borrower name. Debounced (300ms).

2. **Status filter tabs** — `Tabs` component above the table showing counts per status. "All" is default.

3. **Purpose filter** — `Select` dropdown to filter by loan purpose.

4. **Sortable columns** — Click column headers to sort. Show `<ArrowUpDown />` icon. Active sort shows `<ArrowUp />` or `<ArrowDown />`.

5. **Pagination** — Below table. Show "Showing 1-20 of 87 applications". Previous/Next buttons. Page size selector (20/50/100).

6. **Row click** — Entire row is clickable (navigates to detail). Remove separate "View" icon column. Add `cursor-pointer hover:bg-muted/50` to rows.

7. **Bulk actions** (future-ready) — Checkbox column for selecting multiple apps. Action bar appears when items selected: "Assign to officer", "Change status". Not required for v1.

8. **Empty state** — When no results match filters: "No applications match your filters. Try adjusting your search or filters."

### Mobile Layout

On `<768px`, switch from table to card list:

```
┌── Application Card ─────────────────┐
│ John Doe                 [Submitted]│
│ Purchase · $250,000 · 360mo        │
│ LN-A3F2 · Officer: Jane Smith      │
│ 2 hours ago                      → │
└─────────────────────────────────────┘
```

Use a `useMediaQuery` hook or CSS to toggle between table and card views.

**shadcn components to add:** `Select` (for filters)

---

## 5. Application Review Page (Existing — Major Enhancement)

**File:** `src/app/applications/[id]/application-detail.tsx` (existing — enhance)

### Current State
Header with summary cards + tabbed sections for borrowers/income/expenses/collateral. No decision actions, no documents, no timeline, no notes.

### Enhanced Design

```
┌──────────────────────────────────────────────────────────┐
│  [Nav bar]                                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ← Back to Applications                                 │
│                                                          │
│  Application LN-A3F2B7C1            [In Review]          │
│  Officer: Jane Smith · Created Mar 10, 2026              │
│                                                          │
│  ┌── Summary Cards (existing, keep) ──────────────────┐  │
│  │ Purpose: Purchase │ Amount: $250K │ Term: 360 │ Rate│  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────── ┬ ──────────────────┐  │
│  │  Main Content (tabs)           │  Sidebar           │  │
│  │                                │                    │  │
│  │  [Borrowers] [Income] [Exp]    │  ┌─ Actions ────┐  │  │
│  │  [Collateral] [Documents]      │  │              │  │  │
│  │  [Notes]                       │  │ [Approve ✓]  │  │  │
│  │                                │  │ [Deny ✗]     │  │  │
│  │  ┌─ Tab Content ────────────┐  │  │ [Request     │  │  │
│  │  │                          │  │  │  More Info]  │  │  │
│  │  │  (borrower/income/etc    │  │  │              │  │  │
│  │  │   tables - existing)     │  │  └──────────────┘  │  │
│  │  │                          │  │                    │  │
│  │  └──────────────────────────┘  │  ┌─ Timeline ──┐  │  │
│  │                                │  │ ● Submitted │  │  │
│  │                                │  │   Mar 10    │  │  │
│  │                                │  │ ● Assigned  │  │  │
│  │                                │  │   Mar 11    │  │  │
│  │                                │  │ ● In Review │  │  │
│  │                                │  │   Mar 12    │  │  │
│  │                                │  └─────────────┘  │  │
│  └────────────────────────────────┴──────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### New Layout: Two-Column with Sidebar

Replace the current single-column layout with a two-column grid:
```tsx
<div className="grid gap-6 lg:grid-cols-[1fr_320px]">
  {/* Left: main content */}
  <div className="space-y-6">
    {/* Summary cards (existing) */}
    {/* Tabs (enhanced) */}
  </div>

  {/* Right: sidebar */}
  <div className="space-y-4">
    <DecisionPanel />
    <TimelinePanel />
    <AssignmentPanel />
  </div>
</div>
```

### New Tabs to Add

**Documents Tab:**
```
┌────────────────────────────────────────────────────┐
│  Documents                          [+ Upload]     │
│                                                    │
│  ┌── Document Row ─────────────────────────────┐   │
│  │ 📄 pay_stub_jan_2026.pdf                    │   │
│  │ Uploaded Mar 10 · 2.1 MB                    │   │
│  │ [View] [Download]                           │   │
│  └─────────────────────────────────────────────┘   │
│                                                    │
│  ┌── Document Row ─────────────────────────────┐   │
│  │ 🖼️ drivers_license.jpg                      │   │
│  │ Uploaded Mar 10 · 845 KB                    │   │
│  │ [View] [Download]                           │   │
│  └─────────────────────────────────────────────┘   │
│                                                    │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   │
│  │  Drag & drop files to upload               │   │
│  │  PDF, JPG, PNG up to 10MB                   │   │
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   │
└────────────────────────────────────────────────────┘
```

**Notes Tab:**
```
┌────────────────────────────────────────────────────┐
│  Internal Notes                    [+ Add Note]    │
│                                                    │
│  ┌── Note ─────────────────────────────────────┐   │
│  │ Jane Smith · Loan Officer · Mar 12, 2:30 PM │   │
│  │                                             │   │
│  │ Verified employment with Acme Corp HR.      │   │
│  │ Income confirmed at $8,500/mo.              │   │
│  └─────────────────────────────────────────────┘   │
│                                                    │
│  ┌── Note ─────────────────────────────────────┐   │
│  │ Mark Kim · Underwriter · Mar 13, 9:15 AM    │   │
│  │                                             │   │
│  │ DTI ratio is 38%. Within guidelines.        │   │
│  │ Collateral valuation needed.                │   │
│  └─────────────────────────────────────────────┘   │
│                                                    │
│  ┌── New Note Input ───────────────────────────┐   │
│  │                                             │   │
│  │  Type your note...                          │   │
│  │                                             │   │
│  │                          [Post Note]        │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

### Sidebar Components

**Decision Panel** (visible to roles with `loans.approve`):
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base">Decision</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <Button className="w-full" variant="default">
      <CheckCircle2 className="size-4" /> Approve
    </Button>
    <Button className="w-full" variant="destructive">
      <XCircle className="size-4" /> Deny
    </Button>
    <Button className="w-full" variant="outline">
      <MessageSquare className="size-4" /> Request More Info
    </Button>
  </CardContent>
</Card>
```

Each button opens a `Dialog` — see Section 6 (Decision Workflow).

**Timeline Panel:**
```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base">Activity</CardTitle>
  </CardHeader>
  <CardContent>
    <ol className="relative border-l border-border ml-3 space-y-4">
      {events.map(event => (
        <li className="ml-4">
          <span className="absolute -left-1.5 size-3 rounded-full bg-primary ring-2 ring-background" />
          <p className="text-sm font-medium">{event.title}</p>
          <p className="text-xs text-muted-foreground">{event.actor} · {event.date}</p>
        </li>
      ))}
    </ol>
  </CardContent>
</Card>
```

**Assignment Panel** (visible to admin/branch_manager):
```tsx
<Card>
  <CardHeader className="flex-row items-center justify-between">
    <CardTitle className="text-base">Assignment</CardTitle>
    <Button variant="ghost" size="sm">Reassign</Button>
  </CardHeader>
  <CardContent className="flex items-center gap-3">
    <Avatar className="size-8">
      <AvatarFallback>JS</AvatarFallback>
    </Avatar>
    <div>
      <p className="text-sm font-medium">Jane Smith</p>
      <p className="text-xs text-muted-foreground">Loan Officer</p>
    </div>
  </CardContent>
</Card>
```

"Reassign" opens a dialog with a searchable user list (filtered to appropriate roles).

### Responsive

On `<1024px`, sidebar moves below the main content (single column stack). Decision panel moves to a sticky bottom bar on mobile:

```
┌──────────────────────────────────────┐
│ [Approve] [Deny] [Request Info]      │
└──────────────────────────────────────┘
```

Sticky to bottom of viewport, `bg-background border-t`, visible only when user has `loans.approve` permission.

**shadcn components to add:** `Textarea`, `AlertDialog`

---

## 6. Decision Workflow

**Not a separate page** — implemented as dialogs triggered from the Application Review sidebar.

### Approve Dialog

```
┌──────────────────────────────────────────┐
│  Approve Application                     │
│                                          │
│  LN-A3F2 · John Doe · $250,000          │
│                                          │
│  Conditions (optional)                   │
│  ┌──────────────────────────────────┐    │
│  │ e.g., Subject to appraisal ≥    │    │
│  │ $275,000                         │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Approved interest rate (%)              │
│  ┌──────────────────────────────────┐    │
│  │ 6.25                             │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Internal notes                          │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ⚠ This will notify the applicant.       │
│                                          │
│  [Cancel]              [Confirm Approve] │
└──────────────────────────────────────────┘
```

### Deny Dialog

```
┌──────────────────────────────────────────┐
│  Deny Application                        │
│                                          │
│  LN-A3F2 · John Doe · $250,000          │
│                                          │
│  Reason for denial *                     │
│  ┌──────────────────────────────────┐    │
│  │ Select reason...              ▾  │    │
│  └──────────────────────────────────┘    │
│  Options: Insufficient income,           │
│  Poor credit history, Incomplete docs,   │
│  High DTI ratio, Insufficient collateral,│
│  Other                                   │
│                                          │
│  Additional explanation *                │
│  ┌──────────────────────────────────┐    │
│  │                                  │    │
│  └──────────────────────────────────┘    │
│                                          │
│  ⚠ This will notify the applicant.       │
│                                          │
│  [Cancel]                [Confirm Deny]  │
└──────────────────────────────────────────┘
```

- "Confirm Deny" button uses `variant="destructive"`
- Both reason and explanation are required

### Request More Info Dialog

```
┌──────────────────────────────────────────┐
│  Request More Information                │
│                                          │
│  LN-A3F2 · John Doe · $250,000          │
│                                          │
│  What do you need from the applicant? *  │
│  ┌──────────────────────────────────┐    │
│  │ ☐ Updated pay stubs             │    │
│  │ ☐ Bank statements (last 3 mo)   │    │
│  │ ☐ Tax returns                   │    │
│  │ ☐ Proof of assets               │    │
│  │ ☐ Employment verification       │    │
│  │ ☐ Other (specify below)         │    │
│  └──────────────────────────────────┘    │
│                                          │
│  Message to applicant                    │
│  ┌──────────────────────────────────┐    │
│  │ Please provide the documents    │    │
│  │ checked above to continue...    │    │
│  └──────────────────────────────────┘    │
│                                          │
│  [Cancel]              [Send Request]    │
└──────────────────────────────────────────┘
```

- Checkboxes for common document types, plus free-text message
- On submit: status changes to `more_info_needed` (maps to Applicant app's `more_info_needed` status)
- Adds a timeline event and sends notification to applicant

**All decision dialogs:**
- Use `AlertDialog` for destructive actions (deny), `Dialog` for others
- Show loading spinner on confirm button during submission
- On success: close dialog, refresh page data, show toast
- On error: show error in dialog

**shadcn components needed:** `Dialog` (installed), `AlertDialog`, `Checkbox`, `Select` (to add), `Textarea` (to add)

---

## 7. Document Viewer

**Route:** Opens as a full-screen overlay from the Documents tab or a separate route `/applications/[id]/documents/[docId]`

### Design

```
┌──────────────────────────────────────────────────────────┐
│  ┌─ Toolbar ──────────────────────────────────────────┐  │
│  │ [← Back]  pay_stub_jan.pdf  [Zoom -] 100% [Zoom +]│  │
│  │                          [Download] [Print] [Close]│  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Document Content ─────────────────────────────────┐  │
│  │                                                    │  │
│  │                                                    │  │
│  │           (PDF rendered inline via                  │  │
│  │            <iframe> or PDF.js)                     │  │
│  │                                                    │  │
│  │           (Images rendered as                       │  │
│  │            <img> with zoom/pan)                    │  │
│  │                                                    │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌─ Document Sidebar (optional) ──────────────────────┐  │
│  │ Thumbnails of all docs in this application         │  │
│  │ Click to switch between docs without going back    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Component Structure

```tsx
// Full-screen overlay approach
<div className="fixed inset-0 z-50 bg-background flex flex-col">
  {/* Toolbar */}
  <div className="flex items-center justify-between border-b px-4 h-14">
    <div className="flex items-center gap-3">
      <Button variant="ghost" size="sm" onClick={onClose}>
        <ArrowLeft className="size-4" /> Back
      </Button>
      <Separator orientation="vertical" className="h-6" />
      <p className="text-sm font-medium truncate max-w-[200px]">{doc.name}</p>
    </div>
    <div className="flex items-center gap-1">
      <Button variant="ghost" size="icon-sm" onClick={zoomOut}><ZoomOut /></Button>
      <span className="text-sm w-12 text-center">{zoom}%</span>
      <Button variant="ghost" size="icon-sm" onClick={zoomIn}><ZoomIn /></Button>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button variant="ghost" size="icon-sm"><Download /></Button>
      <Button variant="ghost" size="icon-sm"><Printer /></Button>
      <Button variant="ghost" size="icon-sm" onClick={onClose}><X /></Button>
    </div>
  </div>

  {/* Content */}
  <div className="flex-1 overflow-auto flex items-center justify-center bg-muted/30 p-4">
    {isPdf ? <iframe src={url} className="w-full h-full" /> : <img src={url} style={{transform: `scale(${zoom/100})`}} />}
  </div>
</div>
```

### Interaction Notes

- **PDF files:** Render in an `<iframe>` with the file URL. Browser's built-in PDF viewer handles rendering.
- **Images:** Display with zoom controls (25%–400%). Support scroll-to-zoom and drag-to-pan.
- **Keyboard:** `Escape` closes the viewer. `+`/`-` for zoom. Left/right arrows navigate between documents.
- **Navigation:** Document sidebar (collapsed by default) shows thumbnails of all application documents. Click to switch.
- On `<768px`, sidebar is hidden. Navigation via swipe left/right.

---

## 8. Applicant Communication

**Not a separate page** — integrated into the Application Review page as a "Messages" tab.

### Messages Tab

```
┌────────────────────────────────────────────────────┐
│  Messages                                          │
│                                                    │
│  ┌── System Message ───────────────────────────┐   │
│  │ 🔔 Additional documents requested           │   │
│  │ Mar 13, 2026 · 2:30 PM                      │   │
│  │                                              │   │
│  │ Please provide updated pay stubs and bank    │   │
│  │ statements for the last 3 months.            │   │
│  │                                 — Jane Smith │   │
│  └──────────────────────────────────────────────┘   │
│                                                    │
│  ┌── Applicant Response ───────────────────────┐   │
│  │ 👤 John Doe · Applicant                      │   │
│  │ Mar 14, 2026 · 10:15 AM                      │   │
│  │                                              │   │
│  │ I've uploaded the requested documents.       │   │
│  │ Please let me know if you need anything else.│   │
│  │                                              │   │
│  │ 📎 paystub_feb.pdf · bank_statement_q1.pdf  │   │
│  └──────────────────────────────────────────────┘   │
│                                                    │
│  ┌── Compose ──────────────────────────────────┐   │
│  │                                             │   │
│  │ Type a message to the applicant...          │   │
│  │                                             │   │
│  │                           [📎] [Send →]     │   │
│  └─────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

### Component Structure

```tsx
<div className="flex flex-col h-[500px]">
  {/* Message list (scrollable) */}
  <div className="flex-1 overflow-y-auto space-y-4 pr-2">
    {messages.map(msg => (
      <div key={msg.id} className={cn(
        "rounded-lg p-4 max-w-[85%]",
        msg.isOfficer ? "bg-primary/5 ml-auto" : "bg-muted"
      )}>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium">{msg.author}</p>
          <Badge variant="outline" className="text-xs">{msg.role}</Badge>
        </div>
        <time className="text-xs text-muted-foreground">{msg.date}</time>
        <p className="text-sm mt-2">{msg.body}</p>
        {msg.attachments?.length > 0 && (
          <div className="flex gap-2 mt-2">
            {msg.attachments.map(att => <AttachmentChip key={att.id} file={att} />)}
          </div>
        )}
      </div>
    ))}
  </div>

  {/* Compose bar */}
  <div className="border-t pt-3 mt-3">
    <div className="flex gap-2">
      <Textarea placeholder="Type a message..." className="min-h-[60px] flex-1" />
      <div className="flex flex-col gap-1">
        <Button variant="ghost" size="icon"><Paperclip /></Button>
        <Button size="icon"><Send /></Button>
      </div>
    </div>
  </div>
</div>
```

### Interaction Notes

- Messages display in chronological order (oldest first, scroll to bottom)
- Officer messages align right with a tinted background (`bg-primary/5`)
- Applicant messages align left with `bg-muted`
- System messages (status changes, auto-notifications) are centered and styled differently (`text-muted-foreground italic`)
- Attachments show as clickable chips that open the document viewer
- "Send" disabled when textarea is empty
- New messages auto-scroll to bottom

**shadcn components needed:** `Textarea` (to add), `Badge` (installed)

---

## 9. Reports & Analytics

**Route:** `/reports`
**File:** `src/app/(app)/reports/page.tsx` (new)

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  [Nav bar]                                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Reports & Analytics                                     │
│                                                          │
│  ┌── Date Range ──────────────────────────────────────┐  │
│  │ [Last 30 days ▾]  [Mar 1] → [Mar 15]  [Apply]     │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌── KPI Summary ─────────────────────────────────────┐  │
│  │ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──┐ │  │
│  │ │ Total Apps │ │ Approval   │ │ Avg Days   │ │$ │ │  │
│  │ │    142     │ │ Rate       │ │ to Close   │ │  │ │  │
│  │ │ ↑12% MoM  │ │   72%      │ │   8.5      │ │  │ │  │
│  │ └────────────┘ └────────────┘ └────────────┘ └──┘ │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌── Pipeline by Status ──────────────────────────────┐  │
│  │                                                    │  │
│  │   Draft      ████░░░░░░░░░░░░░░░░░  18             │  │
│  │   Submitted  ████████░░░░░░░░░░░░░  35             │  │
│  │   In Review  ██████░░░░░░░░░░░░░░░  28             │  │
│  │   Approved   ████████████░░░░░░░░░  52             │  │
│  │   Denied     ██░░░░░░░░░░░░░░░░░░░   9             │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌── Applications Over Time ──────────────────────────┐  │
│  │                                                    │  │
│  │   (Line chart or bar chart showing                 │  │
│  │    submissions per week/month)                     │  │
│  │                                                    │  │
│  │   ▁▂▃▅▇█▇▅▆▇█▅▃▂▃▄▆▇█▇▅▃▂                       │  │
│  │   Jan  Feb  Mar  Apr  May                          │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌── Top Officers ────────────── ┬ ── By Purpose ─────┐  │
│  │                               │                    │  │
│  │  1. Jane Smith    42 apps     │  Purchase   45%    │  │
│  │  2. Mark Kim      38 apps     │  Refinance  28%    │  │
│  │  3. Alex Chen     32 apps     │  Business   12%    │  │
│  │  4. Sara Lee      30 apps     │  Auto        8%    │  │
│  │                               │  Other       7%    │  │
│  │                               │                    │  │
│  └───────────────────────────────┴────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Component Structure

```tsx
<div className="space-y-6">
  <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
    <DateRangePicker />
  </div>

  {/* KPI cards */}
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    <KPICard title="Total Applications" value="142" change="+12%" />
    <KPICard title="Approval Rate" value="72%" />
    <KPICard title="Avg Days to Close" value="8.5" />
    <KPICard title="Pipeline Value" value="$12.4M" />
  </div>

  {/* Pipeline chart */}
  <Card>
    <CardHeader><CardTitle>Pipeline by Status</CardTitle></CardHeader>
    <CardContent>
      <PipelineChart data={statusCounts} />
    </CardContent>
  </Card>

  {/* Two-column: officer leaderboard + purpose breakdown */}
  <div className="grid gap-4 lg:grid-cols-2">
    <Card>
      <CardHeader><CardTitle>Top Officers</CardTitle></CardHeader>
      <CardContent>
        <OfficerLeaderboard data={officerStats} />
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle>By Purpose</CardTitle></CardHeader>
      <CardContent>
        <PurposeBreakdown data={purposeStats} />
      </CardContent>
    </Card>
  </div>
</div>
```

### Chart Implementation

For v1, use simple CSS-based charts (horizontal bars with Tailwind width classes). No chart library needed.

**Pipeline bar:**
```tsx
<div className="space-y-3">
  {data.map(item => (
    <div key={item.status} className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{item.label}</span>
        <span className="font-medium">{item.count}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(item.count / maxCount) * 100}%` }}
        />
      </div>
    </div>
  ))}
</div>
```

**Purpose breakdown:** Use the chart CSS variables (`--chart-1` through `--chart-5`) already defined in `globals.css`.

### Access Control

Only visible to roles with `reports.view` permission (admin, branch_manager). Add "Reports" to the nav (with `<BarChart3 />` icon) filtered by this permission.

**shadcn components needed:** `Card` (installed), `Popover` + `Calendar` (for date range picker — to add)

---

## 10. Settings / Profile Page

**Route:** `/profile`
**File:** `src/app/(app)/profile/page.tsx` (new)

### Layout

```
┌──────────────────────────────────────────────────────────┐
│  [Nav bar]                                               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  My Profile                                              │
│                                                          │
│  ┌── Account Information ─────────────────────────────┐  │
│  │                                                    │  │
│  │  [Avatar: JS]                                      │  │
│  │  Jane Smith                                        │  │
│  │  jane@example.com                                  │  │
│  │  [Loan Officer]    Member since Mar 2026           │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌── Personal Details ───────────── [Edit] ───────────┐  │
│  │                                                    │  │
│  │  Full name         Jane Smith                      │  │
│  │  Email             jane@example.com                │  │
│  │  Phone             (555) 123-4567                  │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌── Security ──────────────────────────────────────┐    │
│  │                                                    │  │
│  │  Password          ••••••••     [Change password]  │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌── Preferences ─────────────────────────────────────┐  │
│  │                                                    │  │
│  │  Email notifications     [Toggle ●○]               │  │
│  │  Application updates, status changes               │  │
│  │                                                    │  │
│  │  Default dashboard view  [Cards ▾]                 │  │
│  │                                                    │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### Component Structure

```tsx
<div className="max-w-2xl space-y-6">
  <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>

  {/* Account card */}
  <Card>
    <CardContent className="flex items-center gap-4 pt-6">
      <Avatar className="size-16">
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-lg font-semibold">{user.name}</p>
        <p className="text-sm text-muted-foreground">{user.email}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary">{roleLabel}</Badge>
          <span className="text-xs text-muted-foreground">Member since {user.joinDate}</span>
        </div>
      </div>
    </CardContent>
  </Card>

  {/* Personal details */}
  <Card>
    <CardHeader className="flex-row items-center justify-between">
      <CardTitle>Personal Details</CardTitle>
      <Button variant="ghost" size="sm">Edit</Button>
    </CardHeader>
    <CardContent>
      <dl className="grid grid-cols-[120px_1fr] gap-y-3 text-sm">
        <dt className="text-muted-foreground">Full name</dt><dd>{user.name}</dd>
        <dt className="text-muted-foreground">Email</dt><dd>{user.email}</dd>
        <dt className="text-muted-foreground">Phone</dt><dd>{user.phone || "Not set"}</dd>
      </dl>
    </CardContent>
  </Card>

  {/* Security */}
  <Card>
    <CardHeader><CardTitle>Security</CardTitle></CardHeader>
    <CardContent>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm">Password</p>
          <p className="text-xs text-muted-foreground">Last changed 30 days ago</p>
        </div>
        <Button variant="outline" size="sm">Change password</Button>
      </div>
    </CardContent>
  </Card>

  {/* Preferences */}
  <Card>
    <CardHeader><CardTitle>Preferences</CardTitle></CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">Email notifications</p>
          <p className="text-xs text-muted-foreground">Application updates, status changes</p>
        </div>
        <Switch />
      </div>
    </CardContent>
  </Card>
</div>
```

### Interaction Notes

- "Edit" toggles fields to inline inputs with Save/Cancel
- "Change password" opens a `Dialog` with current password, new password, confirm
- No "Delete Account" — admin manages user lifecycle
- Role is read-only (badge only, not editable by the user)

**shadcn components to add:** `Switch`

---

## shadcn/ui Components Summary

**Already installed (11):** `button`, `card`, `input`, `label`, `badge`, `avatar`, `table`, `dialog`, `dropdown-menu`, `tabs`, `separator`

**To install (9):**
```bash
npx shadcn@latest add sheet alert alert-dialog select textarea checkbox \
  switch popover calendar
```

---

## Global Patterns

### Page Container
All authenticated pages use:
```tsx
<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
  {children}
</div>
```

### Form Fields
```tsx
<div className="space-y-2">
  <Label htmlFor={id}>{label} {required && <span className="text-destructive">*</span>}</Label>
  <Input id={id} {...props} aria-describedby={`${id}-error`} aria-invalid={!!error} />
  {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
  {error && <p id={`${id}-error`} className="text-sm text-destructive" role="alert">{error}</p>}
</div>
```

### Status Badge Mapping

| Status | Badge Style | Color Intent |
|---|---|---|
| `draft` | `variant="outline"` | Neutral/dim |
| `submitted` | `variant="secondary"` | Neutral |
| `in_review` | `bg-chart-1/10 text-chart-1` | Blue info |
| `approved` | `bg-green-500/10 text-green-600` | Green success |
| `denied` | `variant="destructive"` | Red error |
| `funded` | `bg-green-500/10 text-green-600` | Green success |
| `closed` | `variant="outline"` | Neutral/dim |
| `more_info_needed` | `bg-amber-500/10 text-amber-600` | Amber warning |

### Loading States
- Page loads: skeleton cards/rows
- Button submits: `<Loader2 className="animate-spin" />` + disabled
- Table data: skeleton rows matching column structure

### Error States
- Form errors: inline below fields
- API errors: destructive `Alert` at top
- 404: "Application not found" with back button
- 403: existing `/unauthorized` page

### Accessibility
- All inputs have `<Label>` elements
- Error messages linked via `aria-describedby`
- Invalid fields marked with `aria-invalid`
- Focus management: first field auto-focused, first error on validation
- Color contrast: 4.5:1 minimum
- Touch targets: 44x44px minimum on mobile
- `<nav aria-label="...">` on all navigation regions
- Decision dialogs use `role="alertdialog"` with focus trap

### Role-Based Visibility Pattern
```tsx
// Server component check
if (!hasPermission(session.user.role, "action")) redirect("/unauthorized");

// Client component conditional rendering
{hasPermission(role, "loans.approve") && <DecisionPanel />}
```
