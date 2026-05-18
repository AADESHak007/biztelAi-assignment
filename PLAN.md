# BiztelAI — Full-Stack Architecture Plan

## Overview

A proper full-stack implementation of the AI-Powered Workflow Automation System.
Frontend and backend are separated within a single Next.js 16.2.6 (App Router) monorepo.
Next.js Route Handlers (`app/api/...`) serve as the real backend.
Data persists in a Postgres database (Neon). Files are stored in Supabase Storage.
The Gemini API key lives server-side only — never exposed to the browser.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | Next.js 16.2.6 (App Router, Turbopack) | API routes + frontend in one repo |
| Language | TypeScript 5 | Type safety end-to-end |
| Database | Neon PostgreSQL + Prisma ORM | Free-tier serverless Postgres |
| File Storage | Supabase Storage | Free 1GB, public file URLs |
| AI / OCR | Google Gemini 1.5 Flash (server-side) | Multimodal, free 1500 req/day |
| Styling | Tailwind CSS v4 + custom CSS animations | Already configured |
| Deployment | Vercel (frontend + API) | Free tier, zero config |

---

## Database Schema (3 Tables)

```
uploads
  id             String   @id @default(cuid())
  fileName       String
  fileUrl        String   (Supabase Storage public URL)
  mimeType       String
  fileSize       String
  uploadedAt     DateTime @default(now())
  status         String   (processing | done | failed)

records
  id             String   @id @default(cuid())
  uploadId       String   @relation(uploads)
  date           String
  shift          String
  employeeNum    String
  opCode         String
  machineNum     String
  workOrderNum   String
  quantity       Float?
  timeTaken      Float?
  conf_date      Float    (confidence 0.0 – 1.0)
  conf_shift     Float
  conf_employeeNum Float
  conf_opCode    Float
  conf_machineNum Float
  conf_workOrderNum Float
  conf_quantity  Float
  conf_timeTaken Float
  status         String   (valid | exception | reviewed)
  manualNotes    String?
  reviewedAt     DateTime?
  createdAt      DateTime @default(now())

validation_errors
  id             String   @id @default(cuid())
  recordId       String   @relation(records)
  field          String   (which field caused the error)
  errorType      String   (MISSING_FIELD | INVALID_SHIFT | DUPLICATE_WO | etc.)
  errorMessage   String   (human-readable description)
  createdAt      DateTime @default(now())
```

---

## API Routes (Backend Endpoints)

```
POST   /api/uploads                 Accept multipart/form-data
                                    → Upload file to Supabase Storage
                                    → Create uploads row in DB
                                    → Trigger extraction pipeline
                                    → Return { uploadId, fileUrl }

GET    /api/uploads                 List all uploads (paginated)
                                    → Returns [ { id, fileName, fileUrl, status, uploadedAt } ]

POST   /api/records/extract         Body: { uploadId }
                                    → Server fetches file URL
                                    → Calls Gemini 1.5 Flash multimodal API (server-side)
                                    → Saves extracted fields + confidence scores to DB
                                    → Runs initial validation
                                    → Returns full record object

GET    /api/records                 Query params: ?search=&status=&shift=&from=&to=&page=
                                    → Server-side filtered + paginated SQL
                                    → Returns { records[], total, page }

GET    /api/records/:id             Single record with all fields, confidence, errors
                                    → Includes fileUrl so frontend can display the image

PATCH  /api/records/:id             Body: { field corrections + manualNotes }
                                    → Updates record fields in DB
                                    → Re-runs validation automatically
                                    → Updates status (reviewed | exception)
                                    → Returns updated record

POST   /api/records/:id/validate    Re-run all validation rules on a specific record
                                    → Clears old validation_errors for this record
                                    → Re-checks all business rules
                                    → Writes fresh validation_errors rows
                                    → Returns { errors[], status }

GET    /api/records/export          Query params: ?status=&shift=&from=&to=
                                    → Runs filtered query
                                    → Streams CSV response (Content-Type: text/csv)

GET    /api/dashboard/stats         Returns aggregated analytics:
                                    → total uploads
                                    → counts by status (valid, exception, reviewed)
                                    → SUM(quantity) GROUP BY shift
                                    → COUNT(*) GROUP BY machineNum ORDER BY qty DESC LIMIT 5
                                    → exception error type breakdown
                                    → AVG of all confidence columns
                                    → total quantity produced (overall)
```

---

## Frontend Pages

```
/                       Dashboard page
                        → Fetches GET /api/dashboard/stats
                        → KPI cards, shift chart, machine chart, error breakdown
                        → Exception Action Hub (links to /records/[id])

/upload                 Document upload page
                        → Drag-and-drop zone
                        → On drop: POST /api/uploads → then POST /api/records/extract
                        → Live 5-stage processing pipeline animation
                        → Simulation shortcuts panel (for demo without API key)
                        → Upload history sidebar (fetched from GET /api/uploads)

/records                Records database table page
                        → Search bar, status filter, shift filter, date range filter
                        → Fetches GET /api/records with query params
                        → Server-paginated results table
                        → Export CSV button → GET /api/records/export
                        → Each row links to /records/[id]

/records/[id]           Full record review page (replaces the modal)
                        → Left panel: actual uploaded image or PDF embed (from fileUrl)
                        → Right panel: editable form with all 8 fields
                        → Per-field confidence badge (color-coded)
                        → Live validation errors below the form
                        → PATCH /api/records/:id on save
                        → Shareable URL (can be sent to supervisor)
```

---

## Data Flow (End-to-End)

```
1. User drops file on /upload
       ↓
2. POST /api/uploads
   → File streamed to Supabase Storage
   → uploads row created (status: processing)
   → Returns { uploadId, fileUrl }
       ↓
3. POST /api/records/extract  { uploadId }
   → Server fetches file from fileUrl
   → Gemini 1.5 Flash multimodal called (server-side, key never in browser)
   → Structured JSON parsed
   → records row created with all fields + confidence scores
   → POST /api/records/:id/validate called internally
   → validation_errors rows created
   → uploads.status → done
   → Returns full record
       ↓
4. Frontend shows extracted data + validation errors
   → User navigates to /records/[id]
   → Sees real document image on the left
   → Corrects fields on the right
       ↓
5. PATCH /api/records/:id  { corrected fields, manualNotes }
   → DB updated
   → Validation re-runs automatically
   → status → reviewed (if no errors) or exception (if errors remain)
       ↓
6. GET /api/dashboard/stats
   → All charts and KPIs update from live DB aggregations
       ↓
7. GET /api/records/export  (optional)
   → Filtered records streamed as CSV
```

---

## Key Upgrades Over Current Client-Only Implementation

| Issue in Current Version | Fix in Full-Stack Version |
|---|---|
| Gemini API key exposed in browser | Key in `.env` server-side, never sent to client |
| Data lives in localStorage (per device) | Data in Postgres — persists across devices and sessions |
| Validation hardcoded in client JS | Validation runs server-side via `/api/records/:id/validate` |
| Settings panel doesn't affect validation | Thresholds can be stored in DB or env, used in server validation |
| No real file preview in review panel | `fileUrl` stored in DB, rendered in `/records/[id]` left panel |
| Duplicate WO check in client memory | Real `SELECT COUNT(*) WHERE workOrderNum = ? AND id != ?` SQL |
| No export | `GET /api/records/export` returns proper CSV stream |
| Dashboard computed client-side from memory | Dashboard from real SQL `GROUP BY` aggregations |
| No pagination | Server-side paginated queries with `LIMIT` / `OFFSET` |
| No shareable record links | `/records/[id]` is a real URL — shareable with supervisors |

---

## Deployment Plan (All Free Tier)

| Service | Purpose | Free Limit |
|---|---|---|
| **Vercel** | Host Next.js app + API routes | Unlimited hobby projects |
| **Neon** | Serverless PostgreSQL database | 0.5 GB storage |
| **Supabase** | File storage for uploads | 1 GB storage |
| **Google AI Studio** | Gemini 1.5 Flash API calls | 1,500 requests/day |

---

## Build Order

1. Set up Prisma schema + Neon database connection
2. Set up Supabase Storage bucket + client
3. Build API routes (backend) — uploads, records, dashboard, export
4. Rewire frontend to consume APIs (remove localStorage)
5. Build `/records/[id]` review page with real image display
6. Build `/records` table page with server-side filtering + CSV export
7. Build `/upload` page wired to real API pipeline
8. Rebuild Dashboard (`/`) consuming `GET /api/dashboard/stats`
9. Deploy to Vercel, wire env vars
10. Record demo video

---

## Assumptions & Tradeoffs

- **No auth layer** — no login/user accounts for prototype simplicity. All records are global.
- **Sync extraction** — Gemini extraction happens synchronously in the API route (no background jobs). Acceptable for prototype; would use a queue (BullMQ / Inngest) in production.
- **Client-side confidence display** — confidence values stored in DB, rendered client-side (no server rendering needed for cosmetic badges).
- **PDF preview** — PDFs embedded via `<iframe>` pointing to the Supabase public URL. No canvas rendering needed.
- **Validation thresholds** — hardcoded server-side constants for prototype. Could be moved to a `settings` DB table in future.
