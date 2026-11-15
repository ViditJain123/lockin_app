# Stories backend (AWS)

Story videos live in S3 and play through CloudFront. Supabase remains the
database and the login system. One small Python Lambda issues upload links.

```
post:   app -> Lambda (upload link) -> app uploads straight to S3 -> app inserts row in Supabase
watch:  app reads rows from Supabase (friends only, via RLS) -> plays video from CloudFront
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
Apply `supabase/migrations/009_stories_on_aws.sql` (after 007 and 008).

## Tests

```
uv run --with boto3 --with pytest pytest backend/tests -q
```

## Privacy model

Playback URLs are not signed. Each file name carries a random 128-bit token, the path is
only readable by the poster's friends (Supabase RLS), and the file is deleted within a day.
Someone who is handed a URL by a friend can watch it until then.
