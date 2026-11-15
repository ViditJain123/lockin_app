"""Run with:  uv run --with boto3 --with pytest pytest backend/tests -q"""

import json
import os
import sys
from pathlib import Path
from urllib.parse import parse_qs, urlparse

os.environ.update(
    AWS_DEFAULT_REGION="ap-south-1",
    AWS_ACCESS_KEY_ID="test",
    AWS_SECRET_ACCESS_KEY="test",
    SUPABASE_URL="https://example.supabase.co",
    SUPABASE_ANON_KEY="anon",
    STORIES_BUCKET="stories-bucket",
    MAX_UPLOAD_BYTES="40000000",
    MAX_ACTIVE_STORIES="3",
)
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import pytest  # noqa: E402

import handler  # noqa: E402

USER = "11111111-1111-4111-8111-111111111111"
OTHER = "22222222-2222-4222-8222-222222222222"
STORY = "33333333-3333-4333-8333-333333333333"


class FakeS3:
    def __init__(self, keys=()):
        self.keys = list(keys)
        self.deleted = []

    def list_objects_v2(self, Bucket, Prefix, MaxKeys):
        return {"Contents": [{"Key": k} for k in self.keys if k.startswith(Prefix)]}

    def delete_object(self, Bucket, Key):
        self.deleted.append(Key)


class FakeSupabase:
    """Stands in for handler._supabase; records calls and plays back rows."""

    def __init__(self, user_id=USER, stories=None):
        self.user_id = user_id
        self.stories = stories if stories is not None else []
        self.calls = []

    def __call__(self, method, path, token, body=None, headers=None):
        self.calls.append((method, path))
        if path == "/auth/v1/user":
            return (200, {"id": self.user_id}) if token == "good" else (401, None)
        if path.startswith("/rest/v1/stories"):
            if method == "GET":
                return 200, self.stories
            if method == "DELETE":
                return 204, None
        return 404, None


@pytest.fixture(autouse=True)
def fresh(monkeypatch):
    handler._auth_cache.clear()
    supa = FakeSupabase()
    monkeypatch.setattr(handler, "_supabase", supa)
    return supa


def call(method, path, body=None, token="good"):
    event = {
        "requestContext": {"http": {"method": method}},
        "rawPath": path,
        "headers": {"authorization": f"Bearer {token}"} if token else {},
        "body": json.dumps(body) if body is not None else None,
    }
    res = handler.lambda_handler(event)
    return res["statusCode"], json.loads(res["body"])


def test_upload_url_is_scoped_to_the_caller_and_signs_the_size():
    status, body = call("POST", "/stories/upload-url", {"sizeBytes": 5_000_000})
    assert status == 200
    assert body["videoPath"].startswith(f"v/{USER}/{body['storyId']}.")
    assert body["videoPath"].endswith(".mp4")

    url = urlparse(body["uploadUrl"])
    assert url.netloc == "stories-bucket.s3.ap-south-1.amazonaws.com"
    assert url.path == "/" + body["videoPath"]
    signed = parse_qs(url.query)["X-Amz-SignedHeaders"][0].split(";")
    # S3 will refuse a body whose size or type differs from what was declared
    assert "content-length" in signed and "content-type" in signed


def test_two_uploads_never_share_a_path():
    a = call("POST", "/stories/upload-url", {"sizeBytes": 1})[1]
    b = call("POST", "/stories/upload-url", {"sizeBytes": 1})[1]
    assert a["videoPath"] != b["videoPath"] and a["storyId"] != b["storyId"]


@pytest.mark.parametrize("size", [0, -1, "5", None, 1.5, True])
def test_bad_size_is_rejected(size):
    assert call("POST", "/stories/upload-url", {"sizeBytes": size})[0] == 400


def test_oversized_video_is_rejected():
    assert call("POST", "/stories/upload-url", {"sizeBytes": 40_000_001})[0] == 413


def test_story_limit(fresh):
    fresh.stories = [{"id": "a"}, {"id": "b"}, {"id": "c"}]
    assert call("POST", "/stories/upload-url", {"sizeBytes": 1})[0] == 429


@pytest.mark.parametrize("token", [None, "bad"])
def test_auth_required(token):
    assert call("POST", "/stories/upload-url", {"sizeBytes": 1}, token=token)[0] == 401
    assert call("DELETE", f"/stories/{STORY}", token=token)[0] == 401


def test_auth_is_cached_between_calls(fresh):
    call("POST", "/stories/upload-url", {"sizeBytes": 1})
    call("POST", "/stories/upload-url", {"sizeBytes": 1})
    assert [c for c in fresh.calls if c[1] == "/auth/v1/user"] == [("GET", "/auth/v1/user")]


def test_delete_removes_only_the_callers_objects(fresh, monkeypatch):
    mine = f"v/{USER}/{STORY}.tok.mp4"
    s3 = FakeS3([mine, f"v/{OTHER}/{STORY}.tok.mp4", f"v/{USER}/other.tok.mp4"])
    monkeypatch.setattr(handler, "s3", s3)
    fresh.stories = [{"video_path": mine}]

    assert call("DELETE", f"/stories/{STORY}") == (200, {"deleted": True})
    assert s3.deleted == [mine]
    deletes = [p for m, p in fresh.calls if m == "DELETE"]
    assert len(deletes) == 1 and f"user_id=eq.{USER}" in deletes[0] and f"id=eq.{STORY}" in deletes[0]


def test_delete_without_a_row_still_cleans_up_the_upload(fresh, monkeypatch):
    orphan = f"v/{USER}/{STORY}.tok.mp4"
    s3 = FakeS3([orphan])
    monkeypatch.setattr(handler, "s3", s3)

    assert call("DELETE", f"/stories/{STORY}")[0] == 200
    assert s3.deleted == [orphan]
    assert not [m for m, _ in fresh.calls if m == "DELETE"]


def test_delete_rejects_ids_that_are_not_uuids(monkeypatch):
    s3 = FakeS3([f"v/{USER}/anything.mp4"])
    monkeypatch.setattr(handler, "s3", s3)
    assert call("DELETE", "/stories/..%2F")[0] == 400
    assert call("DELETE", "/stories/")[0] in (400, 404)
    assert s3.deleted == []


def test_unknown_route():
    assert call("GET", "/nope")[0] == 404
    assert call("GET", "/health", token=None) == (200, {"ok": True})
