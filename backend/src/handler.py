"""Lockin Club stories API (AWS Lambda, Python, no third-party dependencies).

The Lambda is deliberately tiny. Supabase stays the database and the login
system; this function only does the two things that need AWS credentials:

  POST   /stories/upload-url   -> a presigned S3 PUT URL for one story video
  DELETE /stories/{story_id}   -> remove the S3 object and the Supabase row

Everything else (feed, view counts, friends) is read straight from Supabase by
the app under row level security, so those calls never touch Lambda.

Auth: the caller sends their Supabase access token. We never hold a Supabase
service key; the token is checked by Supabase itself and every database call is
made *as that user*, so row level security still applies.
"""

from __future__ import annotations

import base64
import hashlib
import json
import os
import re
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone

import boto3
from botocore.config import Config

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").rstrip("/")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
BUCKET = os.environ.get("STORIES_BUCKET", "")
MAX_BYTES = int(os.environ.get("MAX_UPLOAD_BYTES", str(40 * 1024 * 1024)))
MAX_ACTIVE_STORIES = int(os.environ.get("MAX_ACTIVE_STORIES", "20"))
UPLOAD_URL_TTL_SECONDS = 15 * 60
CONTENT_TYPE = "video/mp4"
KEY_PREFIX = "v"

UUID_RE = re.compile(r"^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$")

# SigV4 + virtual-hosted addressing so presigned URLs hit the regional endpoint
s3 = boto3.client("s3", config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}))

# token hash -> (user_id, cached_until). Saves a Supabase round trip on warm calls.
_auth_cache: dict[str, tuple[str, float]] = {}
AUTH_CACHE_SECONDS = 60


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


# ─── Supabase ────────────────────────────────────────────────────────────────


def _supabase(method: str, path: str, token: str, body: dict | None = None, headers: dict | None = None):
    """Call Supabase as the signed-in user. Returns (status, parsed_json_or_None)."""
    req = urllib.request.Request(
        f"{SUPABASE_URL}{path}",
        method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
            **(headers or {}),
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=6) as res:
            raw = res.read()
            return res.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        return e.code, None
    except (urllib.error.URLError, TimeoutError) as e:
        raise ApiError(502, f"Supabase unreachable: {e}") from e


def authenticate(event: dict) -> tuple[str, str]:
    """Returns (user_id, token) or raises 401."""
    header = (event.get("headers") or {}).get("authorization", "")
    if not header.lower().startswith("bearer "):
        raise ApiError(401, "Missing bearer token")
    token = header[7:].strip()
    if not token:
        raise ApiError(401, "Missing bearer token")

    cache_key = hashlib.sha256(token.encode()).hexdigest()
    cached = _auth_cache.get(cache_key)
    now = time.time()
    if cached and cached[1] > now:
        return cached[0], token

    status, user = _supabase("GET", "/auth/v1/user", token)
    user_id = (user or {}).get("id") if status == 200 else None
    if not user_id or not UUID_RE.match(user_id):
        raise ApiError(401, "Invalid or expired session")

    if len(_auth_cache) > 500:
        _auth_cache.clear()
    _auth_cache[cache_key] = (user_id, now + AUTH_CACHE_SECONDS)
    return user_id, token


# ─── Routes ──────────────────────────────────────────────────────────────────


def create_upload_url(event: dict) -> dict:
    user_id, token = authenticate(event)
    body = _json_body(event)

    size = body.get("sizeBytes")
    if not isinstance(size, int) or isinstance(size, bool) or size <= 0:
        raise ApiError(400, "sizeBytes must be a positive integer")
    if size > MAX_BYTES:
        raise ApiError(413, f"Video is too large (max {MAX_BYTES // (1024 * 1024)} MB)")

    # Cap how many live stories one account can hold, so a buggy or hostile
    # client cannot run up storage and bandwidth.
    now_iso = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    query = urllib.parse.urlencode(
        {"select": "id", "user_id": f"eq.{user_id}", "expires_at": f"gt.{now_iso}", "limit": str(MAX_ACTIVE_STORIES)}
    )
    status, rows = _supabase("GET", f"/rest/v1/stories?{query}", token)
    if status != 200:
        raise ApiError(502, "Could not read stories")
    if len(rows or []) >= MAX_ACTIVE_STORIES:
        raise ApiError(429, "Story limit reached. Remove one or wait for it to expire.")

    story_id = str(uuid.uuid4())
    # The random suffix makes the public CDN URL unguessable; only friends ever
    # receive the path (Supabase row level security guards it).
    key = f"{KEY_PREFIX}/{user_id}/{story_id}.{secrets.token_urlsafe(16)}.mp4"
    upload_url = s3.generate_presigned_url(
        "put_object",
        # ContentLength is part of the signature: S3 rejects a body of any other size.
        Params={"Bucket": BUCKET, "Key": key, "ContentType": CONTENT_TYPE, "ContentLength": size},
        ExpiresIn=UPLOAD_URL_TTL_SECONDS,
    )
    return _response(
        200,
        {
            "storyId": story_id,
            "videoPath": key,
            "uploadUrl": upload_url,
            "uploadHeaders": {"Content-Type": CONTENT_TYPE},
        },
    )


def delete_story(event: dict, story_id: str) -> dict:
    user_id, token = authenticate(event)
    if not UUID_RE.match(story_id):
        raise ApiError(400, "Bad story id")

    filt = urllib.parse.urlencode({"id": f"eq.{story_id}", "user_id": f"eq.{user_id}"})
    status, rows = _supabase("GET", f"/rest/v1/stories?select=video_path&{filt}", token)
    if status != 200:
        raise ApiError(502, "Could not read story")

    # Delete every object under this user's prefix for the story. This also
    # covers an upload whose database row was never written.
    prefix = f"{KEY_PREFIX}/{user_id}/{story_id}."
    listed = s3.list_objects_v2(Bucket=BUCKET, Prefix=prefix, MaxKeys=10)
    for obj in listed.get("Contents", []):
        s3.delete_object(Bucket=BUCKET, Key=obj["Key"])

    if rows:
        status, _ = _supabase("DELETE", f"/rest/v1/stories?{filt}", token)
        if status not in (200, 204):
            raise ApiError(502, "Could not delete story")
    return _response(200, {"deleted": True})


# ─── Plumbing ────────────────────────────────────────────────────────────────


def _json_body(event: dict) -> dict:
    raw = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        raw = base64.b64decode(raw).decode()
    try:
        body = json.loads(raw)
    except ValueError as e:
        raise ApiError(400, "Body must be JSON") from e
    if not isinstance(body, dict):
        raise ApiError(400, "Body must be a JSON object")
    return body


def _response(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": {"Content-Type": "application/json"}, "body": json.dumps(body)}


def lambda_handler(event: dict, _context=None) -> dict:
    http = (event.get("requestContext") or {}).get("http") or {}
    method = http.get("method", "")
    path = (event.get("rawPath") or "").rstrip("/")
    try:
        if method == "POST" and path == "/stories/upload-url":
            return create_upload_url(event)
        if method == "DELETE" and path.startswith("/stories/"):
            return delete_story(event, path[len("/stories/"):])
        if method == "GET" and path == "/health":
            return _response(200, {"ok": True})
        raise ApiError(404, "Not found")
    except ApiError as e:
        return _response(e.status, {"error": e.message})
    except Exception as e:  # noqa: BLE001 - never leak a stack trace to the client
        print(f"[stories] unhandled {type(e).__name__}: {e}")
        return _response(500, {"error": "Internal error"})
