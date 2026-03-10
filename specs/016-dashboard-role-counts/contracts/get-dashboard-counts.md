# Contract: GET /api/dashboard/counts

**Feature**: 016-dashboard-role-counts  
**Method**: GET  
**Path**: `/api/dashboard/counts`  
**Auth**: Required (session or bearer). Response shape depends on current user role.

## Request

- **Headers**: Same as other protected API calls (e.g. Cookie or Authorization).
- **Query**: None.
- **Body**: None.

## Response

**Success**: 200 OK  
**Body**: JSON object with optional integer fields. Only keys relevant to the current user’s role are present.

| Field | Type | Present for | Description |
|-------|------|-------------|-------------|
| `campaigns` | integer | buyer, admin | Count of campaigns (buyer: own; admin: all). |
| `drafts` | integer | content_manager, admin | Count of blog posts with status draft. |
| `published` | integer | content_manager, admin | Count of blog posts with status published. |
| `users` | integer | admin | Count of user accounts (e.g. total users). |

**Examples**:

- Buyer: `{ "campaigns": 5 }`
- Content manager: `{ "drafts": 2, "published": 10 }`
- Admin: `{ "campaigns": 12, "drafts": 3, "published": 15, "users": 7 }`

**Error**: 401 Unauthorized if not authenticated. 403 not required; unauthenticated requests are 401.

## Test requirements

- **Contract test**: For each role (buyer, content_manager, admin), authenticate and call GET /api/dashboard/counts; assert status 200 and that the response contains exactly the keys specified above for that role; assert each value is a non-negative integer.
- **Count accuracy**: For at least one role, seed known data and assert returned counts match (e.g. create N campaigns as buyer, expect `campaigns === N`).
