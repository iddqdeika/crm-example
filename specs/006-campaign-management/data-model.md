# Data Model: Advertising Campaign Management

**Feature**: 006-campaign-management  
**Date**: 2026-02-27

---

## Modified DB Entity: `User`

**Table**: `users` (existing)

| Column / aspect | Change |
|-----------------|--------|
| `role` | Extend enum: add **buyer**. Allowed values: `standard`, `admin`, **`buyer`**. |

Migration: `ALTER TYPE userrole ADD VALUE 'buyer'` (PostgreSQL). Default for new signups: configurable; spec says buyer is default for new self-registered users.

---

## New DB Entity: `Campaign`

**Table**: `campaigns`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID PK | NO | |
| `name` | VARCHAR(255) | NO | |
| `budget` | DECIMAL(15,2) | NO | Non-negative; zero allowed |
| `status` | ENUM | NO | `active`, `pause`, `archive` |
| `owner_id` | UUID FK → users.id | NO | On user delete → reassign to designated system owner |
| `version` | INTEGER | NO | Incremented on every update; used for optimistic locking |
| `created_at` | TIMESTAMP | NO | |
| `updated_at` | TIMESTAMP | NO | |

**Optimistic locking**: On update (PATCH), client sends `version` it received from GET. Backend checks `WHERE id = ? AND version = ?`; if no row updated, return 409. On successful update, set `version = version + 1`, `updated_at = now()`.

**State transitions**: active ↔ pause; active/pause → archive (one-way). Archived campaigns are view-only (enforced in API).

---

## New DB Entity: `AdGroup`

**Table**: `ad_groups`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID PK | NO | |
| `campaign_id` | UUID FK → campaigns.id | NO | CASCADE delete with campaign |
| `country_targets` | TEXT / JSON | YES | e.g. list of country codes |
| `platform_targets` | TEXT / JSON | YES | |
| `browser_targets` | TEXT / JSON | YES | |
| `timezone_targets` | TEXT / JSON | YES | |
| `ssp_id_whitelist` | TEXT | YES | Comma or newline separated |
| `ssp_id_blacklist` | TEXT | YES | |
| `source_id_whitelist` | TEXT | YES | |
| `source_id_blacklist` | TEXT | YES | |
| `sort_order` | INTEGER | NO | Order within campaign (for "one after another") |
| `created_at` | TIMESTAMP | NO | |
| `updated_at` | TIMESTAMP | NO | |

---

## New DB Entity: `Creative`

**Table**: `creatives`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID PK | NO | |
| `ad_group_id` | UUID FK → ad_groups.id | NO | CASCADE delete with ad group |
| `name` | VARCHAR(255) | NO | |
| `ad_type` | VARCHAR(64) | NO | Constrained set (e.g. banner, native, video) |
| `click_url` | VARCHAR(2048) | YES | |
| `icon_media_id` | UUID FK | YES | Reference to media/store (e.g. existing avatar-style or new media table) |
| `image_media_id` | UUID FK | YES | |
| `sort_order` | INTEGER | NO | Order within ad group |
| `created_at` | TIMESTAMP | NO | |
| `updated_at` | TIMESTAMP | NO | |

Icon/image: reuse existing storage (MinIO) and either existing media entity or a small `media_assets` table keyed by storage path; creatives store FK to that.

---

## New DB Entity: `ColumnConfiguration`

**Table**: `column_configurations`

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | UUID PK | NO | |
| `user_id` | UUID FK → users.id | NO | |
| `context` | VARCHAR(64) | NO | e.g. `"campaigns"` |
| `column_ids` | JSONB | NO | Array of column identifiers in display order |
| `updated_at` | TIMESTAMP | NO | |

Unique on (user_id, context). At least one column ID required in `column_ids` (enforced in service/API).

---

## Designated system owner

Not a new table. Configuration (e.g. `DESIGNATED_SYSTEM_OWNER_ID` in settings) pointing to an existing user ID. When a user is deleted, all `campaigns.owner_id` pointing to that user are set to this ID. That user may be a dedicated "system" account or an admin.

---

## Alembic migrations

1. **User role**: Add `buyer` to `userrole` enum.
2. **Campaigns**: Create `campaigns` table (version column included).
3. **Ad groups**: Create `ad_groups` table.
4. **Creatives**: Create `creatives` table (and media reference if new).
5. **Column config**: Create `column_configurations` table.

Order: 1 → 2 → 3 → 4 → 5 (each depends on previous). Follow existing migration chain (e.g. down_revision = current head).
