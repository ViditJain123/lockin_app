# Stories backend (AWS)

Story videos live in S3 and play straight from the bucket (CloudFront is optional). Supabase remains the
database and the login system. One small Python Lambda issues upload links.

```
post:   app -> Lambda (upload link) -> app uploads straight to S3 -> app inserts row in Supabase
watch:  app reads rows from Supabase (friends only, via RLS) -> plays video from S3
delete: app -> Lambda -> removes the S3 file and the Supabase row
```

## Cleanup (nothing to run)

- **Video files**: an S3 lifecycle rule deletes everything under `v/` once it is a day old.
- **Rows**: a `pg_cron` job in Supabase deletes expired stories every hour (migration 009);
  their view rows go with them.
- **Archive**: the original timelapse never leaves the phone's gallery. The cloud only ever
  holds the last 24 hours.

## Deploy

```
aws login                 # or however you authenticate the AWS CLI
./deploy.sh               # AWS_REGION defaults to ap-south-1
```

Paste the two printed URLs into `STORIES_API_URL` and `STORIES_CDN_URL` in `lib/config.ts`.

Every push to `Tiya_master` re-runs this via `.github/workflows/deploy.yml` (tests, then
deploy). `ENABLE_CLOUDFRONT=true ./deploy.sh` adds edge caching; that needs an AWS account
CloudFront-verified by AWS Support, and changes `STORIES_CDN_URL`.

## Supabase migrations (by hand, never from CI)

`001_reset_and_create_tables.sql` drops every table. Never run a bare `supabase db push`
against a database whose history is missing 001. Check first, then push only what is new:

```
supabase migration list --remote          # every applied version shows in the remote column
supabase db push --remote --dry-run       # must list only the new files
supabase db push --remote
```

As of 2026-11-16, production has 001-009 recorded as applied.

## Tests

```
uv run --with boto3 --with pytest pytest backend/tests -q
```

## Privacy model

Playback URLs are not signed: the bucket allows public `GetObject` on `v/*` only (no
listing, HTTPS only). Each file name carries a random 128-bit token, the path is only
handed to the poster's friends (Supabase RLS), and the file is deleted within a day.
Someone who is handed a URL by a friend can watch it until then.
