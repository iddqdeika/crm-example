# Data Model: Dashboard Role-Based Counts (016)

**Feature**: 016-dashboard-role-counts  
**Status**: No new entities.

## Summary

This feature does not introduce new database tables or entities. It consumes existing models to compute counts only.

## Entities used (existing)

| Entity | Source | Use |
|--------|--------|-----|
| **Campaign** | `backend/src/models/campaign.py` | Count for buyer (own) and admin (all). Filter by `owner_id` when not admin. |
| **BlogPost** | `backend/src/models/blog_post.py` | Count by `status`: `draft` and `published`. Content manager and admin see all posts. |
| **User** | `backend/src/models/user.py` | Count for admin (total user accounts). No new fields. |
| **Role** | `User.role` (UserRole enum) | Determines which counts are returned: buyer → campaigns; content_manager → drafts, published; admin → campaigns, drafts, published, users. |

## Validation and constraints

- Counts are read-only aggregates; no writes.
- Permission rules are those already enforced by `campaign_service.list_campaigns`, blog listing (content_manager/admin see all posts), and admin user list (admin only).
- Single role per user (per spec clarification); no combined-role logic.

## State / lifecycle

Not applicable; no new state or lifecycle. Counts are computed on each request.
