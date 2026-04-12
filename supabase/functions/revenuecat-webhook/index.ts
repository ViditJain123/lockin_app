import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    })
  }

  try {
    // Verify RevenueCat authorization header
    const authHeader = req.headers.get('Authorization')
    const expectedAuth = Deno.env.get('REVENUECAT_WEBHOOK_SECRET')
    if (!expectedAuth || authHeader !== `Bearer ${expectedAuth}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const payload = await req.json()
    const event = payload.event

    if (!event) {
      return new Response(
        JSON.stringify({ error: 'Missing event' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Skip sandbox events in production (but allow TEST events through)
    if (event.environment === 'SANDBOX' && event.type !== 'TEST') {
      console.log('[RevenueCat] Skipping sandbox event:', event.type)
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const userId = event.app_user_id ?? event.original_app_user_id ?? 'unknown'
    const productId = event.product_id ?? ''
    const price = event.price != null ? `$${event.price.toFixed(2)}` : ''
    const store = event.store ?? ''

    // Build Discord message based on event type
    let message: string | null = null

    switch (event.type) {
      case 'INITIAL_PURCHASE':
        if (event.period_type === 'TRIAL') {
          message = `🆓 ${userId} has started a free trial (${productId})`
        } else {
          message = `💰 ${userId} has started a subscription (${productId}) — ${price}`
        }
        break

      case 'RENEWAL':
        if (event.is_trial_conversion) {
          message = `🎉 ${userId} converted from trial to paid! (${productId}) — ${price}`
        } else {
          message = `🔄 ${userId} renewed subscription (${productId}) — ${price}`
        }
        break

      case 'CANCELLATION':
        message = `❌ ${userId} cancelled subscription (${productId})`
        break

      case 'EXPIRATION':
        message = `⏰ ${userId} subscription expired (${productId})`
        break

      case 'BILLING_ISSUE':
        message = `⚠️ ${userId} has a billing issue (${productId})`
        break

      case 'UNCANCELLATION':
        message = `🔙 ${userId} re-enabled auto-renew (${productId})`
        break

      case 'PRODUCT_CHANGE':
        message = `🔀 ${userId} changed plan (${productId})`
        break

      case 'TEST':
        message = `🧪 Test event received from RevenueCat`
        break

      default:
        // Ignore other event types (TRANSFER, SUBSCRIPTION_PAUSED, etc.)
        console.log('[RevenueCat] Ignoring event type:', event.type)
        break
    }

    // Only post to Discord if we have a message
    if (message) {
      const webhookUrl = Deno.env.get('DISCORD_WEBHOOK_URL')
      if (!webhookUrl) {
        console.error('DISCORD_WEBHOOK_URL not configured')
        return new Response(
          JSON.stringify({ success: true }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
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
    }

    // Always return 200 so RevenueCat doesn't retry
    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in revenuecat-webhook:', error)
    // Return 200 to prevent infinite retries
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
