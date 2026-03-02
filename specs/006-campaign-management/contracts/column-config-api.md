# API Contract: Column Configuration

**Feature**: 006-campaign-management  
**Service**: Backend (FastAPI)

---

## Column configuration (per user, per context)

**GET /me/column-config?context=campaigns**

- **Response 200**: `{ "context": "campaigns", "column_ids": [ "id", "name", "budget", "status", "owner", ... ] }`. Order of `column_ids` is display order. At least one column.
- **Response 200** (no saved config): Return default column set (e.g. all columns in a default order).

**PUT /me/column-config**

- **Body**: `{ "context": "campaigns", "column_ids": [ ... ] }`. **Validation**: `column_ids` must contain at least one valid column identifier (enforce at least one).
- **Response 200**: Saved. Next GET returns this order.
- **Response 400**: Empty `column_ids` or invalid column id.

---

## Column identifiers (campaigns context)

- Defined in implementation (e.g. `id`, `name`, `budget`, `status`, `owner`, `created_at`, `updated_at`). Frontend and backend share the same list; unknown ids can be ignored or rejected.
