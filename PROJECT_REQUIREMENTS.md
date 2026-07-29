# PROJECT_REQUIREMENTS.md

## Insurance Management Platform

### Developer Reference for Claude Code

> This document is the authoritative project guide. It complements the
> internship documentation and defines the expected workflow.

# 1. Project Goal

Build a production-quality Insurance Management Platform using a modern
full-stack architecture. The project must be completed over **14
independent development days**, with **one Git commit per day**.

------------------------------------------------------------------------

# 2. Tech Stack

## Frontend

-   React
-   TypeScript
-   Vite
-   Tailwind CSS

## Backend

-   Node.js
-   Express.js
-   TypeScript

## Database

-   PostgreSQL
-   Prisma ORM

## Authentication

-   JWT
-   bcrypt

## Other

-   Multer
-   Chart.js
-   Zod
-   PDFKit

------------------------------------------------------------------------

# 3. Architecture

Controller → Service → Repository → Prisma

Rules: - Controllers contain no business logic. - Services contain
business logic. - Repositories contain database access only.

------------------------------------------------------------------------

# 4. User Roles

## Administrator

-   Manage users
-   Manage customers
-   Manage policies
-   Generate reports
-   Manage system settings

## Insurance Agent

-   Register customers
-   Create policies
-   Verify documents
-   Review claims
-   Approve / Reject claims

## Customer

-   View policies
-   Pay premiums
-   Submit claims
-   Upload documents
-   Track claim status

------------------------------------------------------------------------

# 5. Functional Modules

1.  Customer Management
2.  Policy Management
3.  Premium Tracking
4.  Claim Management
5.  Document Management
6.  Reports Dashboard
7.  Search & Filtering
8.  Role Based Authorization
9.  Validation & Error Handling
10. Testing
11. Deployment

------------------------------------------------------------------------

# 6. Day-wise Development Workflow

## Day 1

-   Requirement analysis
-   Project setup
-   Git repository
-   Folder structure
-   UI planning

Deliverable: - Working project scaffold

------------------------------------------------------------------------

## Day 2

-   Database design
-   Prisma schema
-   Authentication
-   JWT
-   Login/Register
-   RBAC

Deliverable: - Secure authentication

------------------------------------------------------------------------

## Day 3

Customer Management - CRUD - Search - Pagination - Soft delete

------------------------------------------------------------------------

## Day 4

Policy Management - CRUD - Renew - Cancel - Lifecycle - Readable policy
numbers

------------------------------------------------------------------------

## Day 5

Premium Tracking - Payments - Due dates - History - Overdue alerts

------------------------------------------------------------------------

## Day 6

Claim Management - Submit - Review - Approve - Reject - Close - Workflow

------------------------------------------------------------------------

## Day 7

Document Management - Upload - Download - View - Delete - Search - Local
storage - Storage abstraction

------------------------------------------------------------------------

## Day 8

Reports Dashboard - KPI cards - Dashboard summary - Customer growth -
Premium collection - Claim statistics - Policy statistics - Chart.js -
Read-only reports - Aggregate queries only - No new tables

------------------------------------------------------------------------

## Day 9

Search & Filters - Global search - Advanced filters - Sorting -
Pagination improvements

------------------------------------------------------------------------

## Day 10

Role-Based Authorization - Permission matrix - Route protection -
Resource ownership - Admin controls

------------------------------------------------------------------------

## Day 11

Validation & Error Handling - Zod validation - Express validation - API
consistency - Error pages - Logging improvements

------------------------------------------------------------------------

## Day 12

Testing & Bug Fixes - Unit testing - Integration testing - Manual QA -
Fix defects

------------------------------------------------------------------------

## Day 13

UI Improvements - Responsive design - Accessibility - Loading states -
Empty states - Polish

------------------------------------------------------------------------

## Day 14

Deployment - Production configuration - Environment validation -
Documentation - Final testing - Final ZIP

------------------------------------------------------------------------

# 7. End of Every Development Day

Claude must:

1.  Implement ONLY today's scope.
2.  Build backend.
3.  Build frontend.
4.  Ensure no TypeScript errors.
5.  Ensure lint passes.
6.  Test new functionality.
7.  Stop immediately.

Print:

DAY XX COMPLETE

WAITING FOR DAY XX+1 INSTRUCTIONS

Do not continue automatically.

------------------------------------------------------------------------

# 8. Hard Rules

-   One development day = One Git commit.
-   Never merge multiple days.
-   Never implement future functionality.
-   Never redesign completed modules without approval.
-   Reuse existing architecture and components.
-   Never run git add, git commit, or git push.
-   Recommend commit messages only.

------------------------------------------------------------------------

# 9. Definition of Done

A day is complete only if:

-   Backend builds
-   Frontend builds
-   No TypeScript errors
-   No lint errors
-   Core functionality works
-   Existing features are not broken
-   ZIP generated
-   Summary generated
-   Claude stops and waits
