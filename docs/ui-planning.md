# UI Planning

This document lists every planned screen and how users navigate between them.
No UI is implemented yet — this is planning only, for reference in future sessions.

## 1. Authentication (public)

| Screen          | Purpose                              |
| --------------- | ------------------------------------ |
| Login           | Email + password login for all roles |
| Register        | Customer self-registration           |
| Forgot Password | Request a password reset link        |
| Reset Password  | Set a new password from a reset link |

**Navigation:** Login ⇄ Register ⇄ Forgot Password → Reset Password → Login.
On successful login, the user is redirected based on role (Admin / Agent / Customer dashboard).

## 2. Administrator

| Screen              | Purpose                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------- |
| Dashboard           | KPI overview: active policies, claims pending, premium collected, customer growth       |
| Customer Management | List, search, view, edit customers                                                      |
| Policy Management   | List, create, renew, cancel policies                                                    |
| Claims              | List all claims, assign to agents, view claim detail                                    |
| Premium Tracking    | Payment status, overdue alerts, payment history                                         |
| Reports             | Active/expired policies, claim statistics, premium collection, monthly business reports |
| Users               | Manage employee (admin/agent) accounts                                                  |
| Settings            | System-level configuration                                                              |

**Navigation:** Persistent sidebar with the sections above; top bar has profile menu and logout.
Dashboard is the landing page after login and links out to each section's summary cards.

## 3. Insurance Agent

| Screen    | Purpose                                                                         |
| --------- | ------------------------------------------------------------------------------- |
| Dashboard | Agent-scoped summary: assigned claims, customers handled, pending verifications |
| Customers | Register new customers, view/edit assigned customers                            |
| Policies  | Create policies, view active policies for their customers                       |
| Claims    | Review submitted claims, verify documents, approve/reject                       |
| Documents | View/download documents uploaded by customers                                   |

**Navigation:** Same sidebar pattern as Admin but scoped to agent-owned records only.

## 4. Customer

| Screen           | Purpose                                                                |
| ---------------- | ---------------------------------------------------------------------- |
| Dashboard        | Summary of active policies, upcoming premium dues, recent claim status |
| My Policies      | List of the customer's policies with detail view                       |
| Premium Payments | Pay premiums, view payment history                                     |
| Claims           | Submit a new claim, track status of existing claims                    |
| Documents        | Upload identity/policy documents, view uploaded files                  |
| Profile          | Edit personal information, change password                             |

**Navigation:** Simplified sidebar (fewer items than Admin/Agent). Dashboard links directly into
"Pay Premium" and "Submit Claim" as primary calls to action.

## Shared Navigation Rules

- Sidebar collapses to icon-only on tablet widths, hides behind a hamburger menu on mobile.
- Breadcrumbs shown on all list → detail flows (e.g. Customers → John Doe → Policy #1234).
- Role-based route guarding: users cannot see or reach routes outside their role.
