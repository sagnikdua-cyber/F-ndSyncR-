# F!ndSyncR Found Item Intake API Contract

## Overview
This document defines the integration boundary for submitting newly found items into the F!ndSyncR backend system. This API is explicitly designed to support two distinct clients:

1. **TERM I CLIENT**: The F!ndSyncR web application (`/found-item` upload page)
2. **TERM II CLIENT**: The future F!ndSyncR hardware box (Raspberry Pi + Camera)

Both clients communicate with the exact same endpoint. The backend abstracts away all complexities regarding AI processing, Firestore schema, matching algorithms, and storage implementation.

## Endpoint Details

- **Path**: `/api/found-items`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`

## Authentication & Idempotency Requirement
The endpoint is protected and requires a valid Firebase Authentication JWT passed in the Authorization header.

**Headers**:
- `Authorization: Bearer <Firebase_ID_Token>`
- `Idempotency-Key: <UUID_or_Unique_String>`

*Note: For the Raspberry Pi (Term II), a dedicated service account token or designated "device" user token must be utilized. The Idempotency-Key protects against duplicate processing on network retries.*

## Request Payload Structure (FormData)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `image` | `File` (Binary) | **Yes** | The photograph of the found item. |
| `sourceType` | `string` | No | Identifier for the client type. Defaults to `web-upload`. Raspberry Pi should send `hardware`. |
| `captureDeviceId` | `string` | No | Unique identifier for the capturing device/box. |

### Validation Constraints
- **Allowed MIME Types**: `image/jpeg`, `image/png`, `image/webp`
- **Maximum File Size**: 5 MB

## Response Structure

### Success Response (200 OK)
The API will return immediately after successfully receiving the item, verifying it, storing it, and kicking off the AI analysis + matching lifecycle.

```json
{
  "success": true,
  "id": "abc123xyz...", 
  "status": "analyzed",
  "message": "Item received, analyzed, and stored successfully"
}
```

### Error Responses

**400 Bad Request**
Returned for malformed payloads, missing images, unsupported MIME types, or oversized files.
```json
{
  "error": "File size exceeds the 5MB limit"
}
```

**401 Unauthorized**
Returned if the `Authorization` header is missing, invalid, or expired.
```json
{
  "error": "Unauthorized"
}
```

**500 Internal Server Error**
Returned for backend processing failures (e.g., Gemini unavailability). The error message is sanitized and does not leak stack traces or keys.
```json
{
  "error": "Failed to analyze item image"
}
```

## Security & Implementation Notes for Hardware Client
1. **Secrets are strictly Server-Side**: The Raspberry Pi NEVER needs access to Supabase API keys, Gemini API keys, or Firebase Admin credentials. 
2. **Stateless**: The Raspberry Pi does not need to poll or maintain connection after a 200 OK response.
3. **Idempotency**: Standard HTTP retries should be avoided unless a 5xx error occurs to prevent duplicate entries.
4. **Data Privacy**: The API intentionally does not return any extracted private or public characteristics in the payload to ensure zero client-side leakage of security factors.
