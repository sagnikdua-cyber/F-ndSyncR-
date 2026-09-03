# F!ndSyncR: Term-I Final Architecture Documentation

## Project Overview
F!ndSyncR is an AI-powered intelligent lost & found system designed to automate ownership verification and item matching on college campuses. 

## Problem Statement
Campus lost and found systems rely on manual effort, creating bottlenecks and exposing items to fraudulent claims. There is a critical need for an automated system that securely matches lost items to their rightful owners without exposing private item details to the public.

## Objectives
- **Automate Matching:** Use AI to cross-reference found items against lost reports.
- **Secure Verification:** Ensure items are claimed only by the true owner using zero-knowledge private characteristic verification.
- **Hardware-Ready API:** Build the software infrastructure necessary to support an automated IoT hardware locker (Term-II).

## Complete User Journey

### 1. The Lost Person (Student Flow)
- Navigates to `/report-lost`.
- Submits general details, **public characteristics** (color, brand, visible marks), and **private characteristics** (hidden marks, exact contents).
- Receives dashboard updates and potential matches as AI processes new found items.

### 2. The Finder / Intake (Hardware/Admin Flow)
- Uses the restricted `/found-item` route (or the future hardware camera).
- Uploads an image of the found item.
- The system automatically extracts public characteristics via Gemini AI.
- The `MatchingService` compares these public traits against all active lost-item records, ranking candidates.
- *Crucially, `/found-item` is NOT the standard student reporting route. It is strictly for intake of physically recovered items.*

### 3. The Claim & Verification Flow
- The highest-ranked candidate is notified via email.
- The candidate clicks the secure, single-use claim link in their email.
- **Decision:** They select YES (this is mine) or NO (not mine). If NO, the next candidate is automatically contacted.
- **Verification:** If YES, the candidate is challenged to answer a question based on their originally submitted private characteristics.
- Gemini AI evaluates the answer.
- **OTP:** If passed, a 6-digit OTP is sent to their registered college email.
- Upon entering the OTP, ownership is **Confirmed**.

### 4. Collection Workflow
- The item enters the `ready_for_collection` state.
- The student is instructed to visit the F!ndSyncR Box within 48 hours.
- (In Term-II, the student will scan an authorization QR code at the hardware box to unlock it).
- If 48 hours pass without collection, the item reverts and the next candidate is contacted.

## System Architecture

### Frontend Architecture
- **Framework:** Next.js 14 App Router.
- **Styling:** Tailwind CSS + shadcn/ui components.
- **State:** React Context (`AuthProvider`) for global auth and RBAC state.

### Firebase & Backend Architecture
- **Authentication:** Firebase Client SDK for JWT generation; Firebase Admin SDK for server-side cookie verification (`auth-server.ts`).
- **Database:** Firestore. Client-side reads/writes are disabled (`allow read, write: if false;`); all data access routes through secure Next.js API Routes.
- **Image Storage:** Supabase Storage. Images are uploaded securely server-side using `SUPABASE_SECRET_KEY` to prevent client exposure.

### AI Pipeline (Gemini)
- **Found Intake:** Gemini 1.5 Flash processes the found item image and extracts structured JSON (color, brand, category, visible design).
- **Verification:** Gemini 1.5 Flash evaluates the student's plain-text answer against the true private characteristics stored in Firestore, returning a boolean pass/fail.

### Security Model
- **RBAC:** Users are strictly partitioned into `student` and `admin` roles using Firebase Custom Claims.
- **Private Data Protection:** Private characteristics, OTP hashes, and claim tokens are never returned to the client in dashboard or match APIs.
- **Idempotency:** Found item intakes utilize idempotency keys to prevent double-processing.
- **Race Condition Protection:** Firestore transactions ensure verification attempt limits cannot be bypassed by concurrent requests.

---

## Term-I vs Term-II

### TERM I — COMPLETED SOFTWARE
Term-I encompasses the entire digital workflow:
- Web application (Frontend + Backend APIs)
- Authentication & Authorization
- Firestore Database & Supabase Storage
- Gemini AI Matching & Verification logic
- Resend Email & OTP pipeline
- The complete sequential candidate claim lifecycle
- 48-hour collection window management
- Admin Dashboard

### TERM II — FUTURE HARDWARE
Term-II will focus entirely on integrating physical IoT hardware:
- **Raspberry Pi:** Controls the lock mechanism, camera, and QR scanner.
- **Intake:** The Pi camera will POST images directly to the existing `/api/found-items` route (`sourceType=hardware`).
- **Collection:** The student scans their authorization QR code; the Pi verifies it and triggers the electronic lock relay.

## Future Hardware API Contract
The software architecture is already designed to support the Term-II hardware seamlessly:
- **Found Item Intake:** Hardware POSTs to `/api/found-items` with an image and `sourceType="hardware"`.
- **Collection Authorization:** The hardware will verify the `foundItemId` and `studentId` against the existing `matches` database where status is `ownership_confirmed`.
- No new databases or fundamental logic rewrites will be required; the Pi simply acts as an automated intake and release client.
