# Minister Portal MVP (`/myportal`)

A self-service portal for ministers, separate from the admin app. Login via Minister ID + Phone OTP, with profile/QR ID card, announcements, document upload requests, and annual dues paid through Moolre Mobile Money.

## Routes

- `/myportal` — Login (Minister ID + Phone → OTP)
- `/myportal/dashboard` — Overview (dues status, latest announcements, pending doc requests)
- `/myportal/profile` — Read-only profile + downloadable QR ID card
- `/myportal/announcements` — List of announcements
- `/myportal/documents` — Document requests assigned to the minister; upload & track status
- `/myportal/dues` — Current year dues, pay with MoMo, view payment history
- `/verify/:ministerId` — Public verify page (QR target): photo, name, status, church, association

Admin additions (under `/dashboard` for super_admin/admin):
- `/announcements` — Create/edit announcements
- `/document-requests` — Create requests targeted at one or many ministers; review uploads
- `/dues` — Set annual dues amount; view all payments (also surfaced in FinancePortal)

## Database

New tables (all RLS-protected; ministers identified by `ministers.id`):

- **announcements** — title, body, audience (`all` / role-based later), published_at, created_by
- **document_requests** — minister_id, title, description, status (`pending`, `submitted`, `approved`, `rejected`), reviewer_notes, due_date, created_by
- **document_request_uploads** — request_id, file_url, file_name, mime_type, uploaded_at
- **dues_settings** — singleton row: year, amount, currency (GHS)
- **dues_payments** — minister_id, year, amount, status (`pending`, `paid`, `failed`), provider (`moolre`), provider_reference, paid_at, raw_payload

Storage: reuse private `application-documents` bucket with subfolder `minister-uploads/{minister_id}/`.

RLS: ministers can read/write only rows tied to their `minister_id` (resolved via a session token, see Auth). Admins have full access via `has_role`.

## Authentication

OTP login independent of Supabase auth (mirrors the existing applicant flow):

1. Minister submits **Minister ID** + **Phone**.
2. Edge function `minister-portal-otp-generate` validates the pair against `ministers` table; if match, sends OTP via Moolre and stores in `otp_codes`.
3. Minister enters OTP.
4. Edge function `minister-portal-otp-verify` verifies and returns a signed session JWT (HS256, 7-day exp, payload `{ minister_id, ministers_row_id }`) using a new `MINISTER_PORTAL_JWT_SECRET`.
5. Frontend stores the JWT in `localStorage` (`minister_portal_token`) and attaches it as `Authorization: Bearer …` to every portal edge function call.
6. All portal data access goes through edge functions that verify the JWT and use the service role to read/write only that minister's rows. (Avoids fighting Supabase auth and keeps the portal isolated.)

## Edge functions

- `minister-portal-otp-generate`
- `minister-portal-otp-verify`
- `minister-portal-me` — returns profile, qualifications, latest dues, pending doc requests
- `minister-portal-announcements` — list
- `minister-portal-document-requests` — list / upload / mark submitted
- `minister-portal-dues-pay` — initiate Moolre MoMo charge, returns payment status / reference
- `minister-portal-dues-history` — list payments for this minister
- `moolre-payment-callback` — webhook to update `dues_payments` on Moolre status updates
- `verify-minister` (public, no auth) — minimal public profile for QR page

## QR ID card

- `/myportal/profile` shows a printable card: photo, full name, Minister ID, role, church, status, QR.
- QR encodes `https://<host>/verify/{minister_id}`.
- Use `qrcode` library (already common). Card downloadable as PNG via `html-to-image` or PDF via existing jsPDF utility.

## Moolre MoMo

Reuse existing Moolre integration. New endpoint pattern for collections (charge a customer's MoMo wallet). Flow:

```text
Pay button → minister-portal-dues-pay
   → call Moolre charge API (amount = dues_settings.amount, channel = MoMo, msisdn = minister.phone)
   → insert dues_payments row (status=pending, provider_reference)
   → return reference + USSD prompt info to UI
UI polls dues-history every 5s for ~2min OR
moolre-payment-callback updates row to paid/failed
```

If Moolre charge endpoint isn't yet wired, I'll add it in a new `moolre-charge` edge function using the same `MOOLRE_API_VASKEY` secret. May need a `MOOLRE_ACCOUNT_NUMBER` secret — I'll prompt if missing.

## Frontend structure

- `src/pages/portal/PortalLogin.tsx`
- `src/pages/portal/PortalLayout.tsx` (sidebar/topbar; reuses design tokens)
- `src/pages/portal/PortalDashboard.tsx`
- `src/pages/portal/PortalProfile.tsx` (+ `IdCard.tsx` component with QR)
- `src/pages/portal/PortalAnnouncements.tsx`
- `src/pages/portal/PortalDocuments.tsx`
- `src/pages/portal/PortalDues.tsx`
- `src/pages/VerifyMinister.tsx` (public)
- `src/contexts/PortalAuthContext.tsx` — manages JWT, current minister
- `src/lib/portalApi.ts` — fetch wrapper that adds `Authorization` header

Admin pieces (`/announcements`, `/document-requests`, `/dues`) added to `AppSidebar` for super_admin/admin.

FinancePortal: add a "Minister Dues" tab listing `dues_payments` with totals/exports.

## Out of scope for MVP

- Editing profile from portal (read-only; corrections still go via intake flow)
- Push/email notifications (SMS only on doc-request creation + payment success)
- Multi-year dues / arrears UI (only current year shown; history lists all)
- Role-based announcement audiences (only `all`)

## Open items I'll handle as they come up

- If `MOOLRE_ACCOUNT_NUMBER` (or equivalent) isn't already a secret for collections, I'll request it before wiring `dues-pay`.
- Public verify page styling — minimal card, GBCC branding.

---

After approval I'll implement in this order: DB migration → portal auth (OTP + JWT) → portal shell + login → profile/QR + verify → announcements → document requests → dues + Moolre charge + webhook → admin management screens → FinancePortal tab.