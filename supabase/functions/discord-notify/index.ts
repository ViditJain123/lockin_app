import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
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

    // Verify the user's JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { event_type, email, product_id } = await req.json()

    if (!event_type || !email) {
      return new Response(
        JSON.stringify({ error: 'Missing event_type or email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build Discord message based on event type
    let message: string
    switch (event_type) {
      case 'signup':
        message = `✅ [email] ${email} has just signed up`
        break
      case 'trial_started':
        message = `🆓 ${email} has started a free trial${product_id ? ` (${product_id})` : ''}`
        break
      case 'subscription_purchased':
        message = `💰 ${email} has started a subscription${product_id ? ` (${product_id})` : ''}`
        break
      default:
        message = `📢 ${email} triggered event: ${event_type}`
    }

    // Post to Discord webhook
    const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL')
    if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL not configured')
      return new Response(
        JSON.stringify({ success: false, error: 'Webhook not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const discordRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'Lockin Club Notif',
        content: message,
      }),
    })

    if (!discordRes.ok) {
      console.error('Discord webhook failed:', discordRes.status, await discordRes.text())
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in discord-notify:', error)
    // Always return 200 — never block the client due to notification failures
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
