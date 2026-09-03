# F!ndSyncR: Collection & Hardware Architecture

## Overview
This document defines the lifecycle states and architectural boundaries between the F!ndSyncR Term-I Software and the Term-II Hardware. It details how the web application securely communicates state to the physical F!ndSyncR Box without embedding device-specific drivers into the core backend logic.

## State Transitions (OTP to Recovery)

### Term I (Software Only)
1. **`OTP_PENDING`**: Candidate is prompted to enter an OTP.
2. **`OWNERSHIP_CONFIRMED`**: OTP is successfully validated against the secure token hash via Firestore transaction.
3. **`READY_FOR_COLLECTION`**: Item is marked as ready. A `CollectionSession` is created with a 48-hour `expiresAt` window.
4. **Term I End**: Success message displayed. Gate opening simulated.

### Term II (Hardware Integration)
The state transitions above remain identical. The difference occurs during physical collection:
5. **Hardware Command**: The `CollectionSession` is verified at the box (via student action). The backend issues an `UnlockCommand`.
6. **`COLLECTION_IN_PROGRESS`**: The box processes the command and unlocks the relay.
7. **`RECOVERED`**: The box transmits a `DeviceEvent` indicating the door was successfully opened and closed.

---

## Data Models

### 1. `CollectionSession`
Tracks the 48-hour authorization window.
- `collectionSessionId`: Unique ID
- `studentId`: UID of verified owner
- `foundItemId`: Associated item
- `claimId`: Originating claim
- `status`: `ACTIVE`, `USED`, `EXPIRED`, `CANCELLED`
- `createdAt`: ISO Timestamp
- `expiresAt`: ISO Timestamp (createdAt + 48h)

### 2. `UnlockCommand` (Future)
An atomic, single-use instruction meant for the Raspberry Pi.
- `commandId`: Unique ID
- `boxId`: Hardware target identifier
- `foundItemId`: Target item
- `type`: `STUDENT_COLLECTION` | `AUTHORITY_OVERRIDE`
- `status`: `PENDING`, `DELIVERED`, `ACKNOWLEDGED`, `EXECUTED`, `FAILED`, `EXPIRED`
- `createdAt`: ISO Timestamp

### 3. `DeviceEvent` (Future)
Hardware telemetry and event logs dispatched from the Pi back to the F!ndSyncR Cloud.
- `eventId`: Unique ID
- `boxId`: Source identifier
- `eventType`: `ONLINE`, `HEARTBEAT`, `DOOR_OPENED`, `DOOR_CLOSED`, `COLLECTION_COMPLETED`, `UNLOCK_FAILED`
- `timestamp`: ISO Timestamp

---

## Future Raspberry Pi API Contract
The hardware integration should be decoupled and utilize standard API conventions. 

**Authentication**: 
The device will utilize a Firebase Custom Auth Token or a service account identity. It will NOT use a student token.

**Future Endpoints**:
- `POST /api/devices/heartbeat`: Liveness tracking.
- `GET /api/devices/{deviceId}/commands`: Poll for `PENDING` commands.
- `POST /api/devices/{deviceId}/commands/{commandId}/ack`: Acknowledge and update command status (`EXECUTED`, `FAILED`).
- `POST /api/devices/{deviceId}/events`: Dispatch asynchronous sensor events (e.g., `DOOR_OPENED`).

**App Check Readiness**:
Custom backend APIs managing hardware commands must validate `X-Firebase-AppCheck` headers to prevent malicious command polling or event injection from unauthorized bots.

## Idempotency & Security Constraints
- **Race Condition Protection**: `verify-otp` operates on a strict `adminDb.runTransaction`. The OTP verification, `CollectionSession` creation, and candidate invalidation occur atomically.
- **Backend Authority**: The Raspberry Pi **never** decides who owns an item or if 48 hours have passed. It acts strictly as a "dumb" actuator that blindly trusts authorized `UnlockCommand` instructions dispatched by the backend.
