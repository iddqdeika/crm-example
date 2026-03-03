# Contract: POST /api/campaigns

## Change Summary

The `POST /api/campaigns` endpoint is extended to accept an optional `ad_groups` array in the request body. All other request/response fields are unchanged.

## Before (current)

```json
// Request body
{
  "name": "Summer Campaign",
  "budget": "500.00",
  "status": "active"
}

// Response body (201 Created) — always returns empty ad_groups
{
  "id": "uuid",
  "name": "Summer Campaign",
  "budget": "500.00",
  "status": "active",
  "owner_id": "uuid",
  "version": 1,
  "created_at": "2026-03-02T12:00:00Z",
  "updated_at": "2026-03-02T12:00:00Z",
  "ad_groups": []
}
```

## After (this feature)

```json
// Request body — ad_groups is optional, omitting it preserves existing behavior
{
  "name": "Summer Campaign",
  "budget": "500.00",
  "status": "active",
  "ad_groups": [
    {
      "country_targets": "US,CA",
      "platform_targets": null,
      "browser_targets": null,
      "timezone_targets": null,
      "ssp_id_whitelist": null,
      "ssp_id_blacklist": null,
      "source_id_whitelist": null,
      "source_id_blacklist": null,
      "sort_order": 0,
      "creatives": [
        {
          "name": "Banner 300x250",
          "ad_type": "banner",
          "click_url": "https://example.com",
          "sort_order": 0
        }
      ]
    }
  ]
}

// Response body (201 Created) — ad_groups populated when supplied
{
  "id": "uuid",
  "name": "Summer Campaign",
  "budget": "500.00",
  "status": "active",
  "owner_id": "uuid",
  "version": 1,
  "created_at": "2026-03-02T12:00:00Z",
  "updated_at": "2026-03-02T12:00:00Z",
  "ad_groups": [
    {
      "id": "uuid",
      "campaign_id": "uuid",
      "country_targets": "US,CA",
      "platform_targets": null,
      "browser_targets": null,
      "timezone_targets": null,
      "ssp_id_whitelist": null,
      "ssp_id_blacklist": null,
      "source_id_whitelist": null,
      "source_id_blacklist": null,
      "sort_order": 0,
      "created_at": "2026-03-02T12:00:00Z",
      "updated_at": "2026-03-02T12:00:00Z",
      "creatives": [
        {
          "id": "uuid",
          "ad_group_id": "uuid",
          "name": "Banner 300x250",
          "ad_type": "banner",
          "click_url": "https://example.com",
          "icon_storage_path": null,
          "image_storage_path": null,
          "sort_order": 0,
          "created_at": "2026-03-02T12:00:00Z",
          "updated_at": "2026-03-02T12:00:00Z"
        }
      ]
    }
  ]
}
```

## Validation Rules

| Condition | HTTP Status | Detail |
|-----------|-------------|--------|
| `ad_groups` omitted | 201 | Existing behavior, `ad_groups: []` in response |
| `ad_groups: []` (empty list) | 201 | Campaign created with no ad groups |
| Ad group item has `id` set (non-null) | 422 | IDs are not accepted on creation — server assigns them |
| Creative `name` is empty or missing | 422 | Validation error: creative name required |
| Any campaign-level validation fails (empty name, negative budget) | 422 | Existing behavior unchanged |
| Unauthenticated | 401 | Existing behavior unchanged |

## Backward Compatibility

This change is **fully backward-compatible**. Existing clients that do not send `ad_groups` continue to receive `"ad_groups": []` in the response, identical to the current behavior.
