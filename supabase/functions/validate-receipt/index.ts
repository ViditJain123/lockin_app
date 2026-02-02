import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Apple verification endpoints
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt'
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'

// Apple status codes
const STATUS_SANDBOX_RECEIPT = 21007

interface AppleReceiptInfo {
  original_transaction_id: string
  transaction_id: string
  product_id: string
  purchase_date_ms: string
  expires_date_ms?: string
  is_trial_period?: string
  auto_renew_status?: number
}

interface AppleVerifyResponse {
  status: number
  environment?: string
  latest_receipt_info?: AppleReceiptInfo[]
  latest_receipt?: string
  pending_renewal_info?: Array<{
    auto_renew_status: string
    product_id: string
    original_transaction_id: string
  }>
}

async function verifyWithApple(
  receiptData: string,
  password: string,
  useSandbox = false
): Promise<AppleVerifyResponse> {
  const url = useSandbox ? APPLE_SANDBOX_URL : APPLE_PRODUCTION_URL

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      'receipt-data': receiptData,
      'password': password,
      'exclude-old-transactions': true,
    }),
  })

  return response.json()
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // Get the user's JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Verify the user's token and get user info
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get receipt data from request body
    const { receiptData } = await req.json()

    if (!receiptData) {
      return new Response(
        JSON.stringify({ error: 'Missing receipt data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get shared secret from environment
    const sharedSecret = Deno.env.get('APP_STORE_SHARED_SECRET')
    if (!sharedSecret) {
      console.error('APP_STORE_SHARED_SECRET not configured')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // First try production endpoint
    let appleResponse = await verifyWithApple(receiptData, sharedSecret, false)

    // If status 21007, retry with sandbox
    if (appleResponse.status === STATUS_SANDBOX_RECEIPT) {
      console.log('Received sandbox receipt, retrying with sandbox endpoint')
      appleResponse = await verifyWithApple(receiptData, sharedSecret, true)
    }

    // Check for errors
    if (appleResponse.status !== 0) {
      console.error('Apple verification failed with status:', appleResponse.status)
      return new Response(
        JSON.stringify({
          error: 'Receipt validation failed',
          appleStatus: appleResponse.status
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get the latest receipt info
    const receiptInfoArray = appleResponse.latest_receipt_info
    if (!receiptInfoArray || receiptInfoArray.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No subscription info found in receipt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find the latest subscription (most recent expiry date)
    const latestReceipt = receiptInfoArray.reduce((latest, current) => {
      const latestExpiry = parseInt(latest.expires_date_ms || '0')
      const currentExpiry = parseInt(current.expires_date_ms || '0')
      return currentExpiry > latestExpiry ? current : latest
    })

    // Get auto-renew status from pending_renewal_info
    let autoRenewStatus = true
    if (appleResponse.pending_renewal_info) {
      const renewalInfo = appleResponse.pending_renewal_info.find(
        info => info.original_transaction_id === latestReceipt.original_transaction_id
      )
      if (renewalInfo) {
        autoRenewStatus = renewalInfo.auto_renew_status === '1'
      }
    }

    // Calculate if subscription is active
    const expiresDate = latestReceipt.expires_date_ms
      ? new Date(parseInt(latestReceipt.expires_date_ms))
      : null
    const isActive = expiresDate ? expiresDate > new Date() : false

    // Upsert subscription record
    const subscriptionData = {
      user_id: user.id,
      product_id: latestReceipt.product_id,
      original_transaction_id: latestReceipt.original_transaction_id,
      latest_transaction_id: latestReceipt.transaction_id,
      purchase_date: new Date(parseInt(latestReceipt.purchase_date_ms)).toISOString(),
      expires_date: expiresDate?.toISOString() || null,
      is_active: isActive,
      environment: appleResponse.environment?.toLowerCase() || 'production',
      auto_renew_status: autoRenewStatus,
      updated_at: new Date().toISOString(),
    }

    const { error: upsertError } = await supabaseAdmin
      .from('subscriptions')
      .upsert(subscriptionData, {
        onConflict: 'original_transaction_id',
      })

    if (upsertError) {
      console.error('Error upserting subscription:', upsertError)
      return new Response(
        JSON.stringify({ error: 'Failed to save subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Return subscription status
    return new Response(
      JSON.stringify({
        success: true,
        subscription: {
          productId: latestReceipt.product_id,
          isActive,
          expiresDate: expiresDate?.toISOString(),
          autoRenewStatus,
          environment: appleResponse.environment,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in validate-receipt:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
