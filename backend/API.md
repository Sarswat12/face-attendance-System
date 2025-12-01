API contract - Face endpoints
=============================

This document describes the `/api/face/enroll` and `/api/attendance/mark` endpoints used by the frontend.

POST /api/face/enroll
- Accepts multipart/form-data with one or multiple files under `images` or a single file under `image`.
- Requires authentication (JWT) or `user_id` form field.
- For each image:
  - saves under `uploads/faces/user_<id>/` with a UUID filename
  - extracts 128-d embedding via `face_recognition.face_encodings`
  - stores per-face embedding in `faces.embedding` as native JSON array
- After processing all images, computes averaged embedding across the user's images and stores as native JSON in `users.encoding`.
- Response (200): { "success": true, "face_ids": ["<uuid>", ...], "image_paths": ["/uploads/..."] }
- Errors:
  - 400: invalid/missing image, no face detected in an image, file too large, multi-face (if configured to reject)
  - 401: missing authentication when required

POST /api/attendance/mark
- Accepts either:
  - JSON { "face_id": "..." } — marks attendance by known face id
  - multipart/form-data with `image` — backend computes embedding and matches against stored `faces.embedding`
  - Bearer token (Authorization) to mark current user present
- On image-based recognition, the backend:
  - extracts single embedding from the uploaded image (rejects if zero faces or multiple faces)
  - compares against all stored `faces.embedding` using Euclidean distance (`face_recognition.face_distance`) with tolerance 0.6
  - on match returns 200 with { "marked": true, "user_id": "...", "name": "...", "face_id": "..." }
  - on no match returns 404 with { "error": "face not recognized" }

General notes
- Embeddings are stored as JSON arrays (either TEXT or JSON column type depending on DB); code reads both string and native types.
- Tests should mock `face_recognition.face_encodings` to avoid native dlib dependencies.
