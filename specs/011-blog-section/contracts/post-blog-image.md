# Contract: POST /api/blog/images

**Auth**: Required — role must be `content_manager` or `admin`  
**Handler**: `blog.upload_image`  
**Purpose**: Upload an image for embedding in a blog post body via TipTap Image extension

---

## Request

### Headers

```
Content-Type: multipart/form-data
Cookie: session=<session_token>
```

### Form fields

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `file` | file upload | yes | JPEG, PNG, GIF, or WebP; max 5 MB |

### Example (multipart)

```
POST /api/blog/images
Content-Type: multipart/form-data; boundary=----FormBoundary

------FormBoundary
Content-Disposition: form-data; name="file"; filename="photo.png"
Content-Type: image/png

<binary file data>
------FormBoundary--
```

---

## Response

### 201 Created

```json
{
  "url": "http://localhost:9000/qualityboard-media/blog-images/550e8400-e29b-41d4-a716-446655440000.png"
}
```

The returned URL is the publicly accessible URL of the uploaded image. TipTap's upload handler receives this value and inserts `<img src="{url}">` into the editor HTML.

### 400 Bad Request — unsupported file type

```json
{"detail": "Unsupported file type. Allowed: jpeg, png, gif, webp"}
```

### 400 Bad Request — file too large

```json
{"detail": "File exceeds maximum size of 5 MB"}
```

### 401 Unauthorized

```json
{"detail": "Not authenticated"}
```

### 403 Forbidden

```json
{"detail": "Insufficient permissions"}
```

---

## Storage

- **Bucket**: `qualityboard-media` (existing MinIO bucket, also used for avatars)
- **Key prefix**: `blog-images/`
- **Key format**: `blog-images/{uuid}.{ext}` (UUID v4 generated server-side)
- **Implementation**: Reuses `core/storage.py` upload utility (identical pattern to avatar upload)
