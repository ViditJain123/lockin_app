#!/usr/bin/env bash
# Deploys the stories backend with nothing but the AWS CLI.
#
#   ./deploy.sh                      # region defaults to ap-south-1 (Mumbai)
#   AWS_REGION=ap-southeast-2 ./deploy.sh
#
# Safe to re-run: it updates the existing stack in place.
set -euo pipefail
cd "$(dirname "$0")"

REGION="${AWS_REGION:-ap-south-1}"
STACK="${STACK_NAME:-lockin-stories}"
SUPABASE_URL="${SUPABASE_URL:-https://tsojozycisspcfmabtku.supabase.co}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY:-sb_publishable_eeLx2IUTUl1J4AvA5R7I1w_TQv5BHvG}"

ACCOUNT="$(aws sts get-caller-identity --query Account --output text)"
ARTIFACTS="lockin-stories-deploy-${ACCOUNT}-${REGION}"

# Bucket that holds the zipped Lambda code between package and deploy
if ! aws s3api head-bucket --bucket "$ARTIFACTS" --region "$REGION" 2>/dev/null; then
  aws s3 mb "s3://${ARTIFACTS}" --region "$REGION"
fi

aws cloudformation package \
  --region "$REGION" \
  --template-file template.yaml \
  --s3-bucket "$ARTIFACTS" \
  --output-template-file .packaged.yaml >/dev/null

aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK" \
  --template-file .packaged.yaml \
  --capabilities CAPABILITY_IAM \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
    "SupabaseUrl=${SUPABASE_URL}" \
    "SupabaseAnonKey=${SUPABASE_ANON_KEY}"

rm -f .packaged.yaml

echo
echo "Deployed. Paste these into lib/config.ts:"
aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='ApiUrl' || OutputKey=='CdnUrl'].[OutputKey,OutputValue]" \
  --output text
