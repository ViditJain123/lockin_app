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

    const body = await req.json()
    const { user_id, timezone, locale } = body

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Idempotent: skip if user already has attribution
    const { data: existing } = await supabaseAdmin
      .from('user_attribution')
      .select('user_id')
      .eq('user_id', user_id)
      .single()

    if (existing) {
      return new Response(
        JSON.stringify({ success: true, attribution_type: 'existing' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract requester IP for fingerprint matching
    const forwarded = req.headers.get('x-forwarded-for')
    const ip_address = forwarded ? forwarded.split(',')[0].trim() : null

    let matchedClick = null

    if (ip_address) {
      // Find most recent unmatched click with same IP + timezone within 7 days
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

      let query = supabaseAdmin
        .from('attribution_clicks')
        .select('*')
        .eq('ip_address', ip_address)
        .is('matched_user_id', null)
        .gte('created_at', sevenDaysAgo)
        .order('created_at', { ascending: false })
        .limit(1)

      // Add timezone match if provided
      if (timezone) {
        query = query.eq('timezone', timezone)
      }

      const { data: clicks } = await query

      if (clicks && clicks.length > 0) {
        matchedClick = clicks[0]
      }
    }

    if (matchedClick) {
      // Mark the click as matched
      await supabaseAdmin
        .from('attribution_clicks')
        .update({ matched_user_id: user_id, matched_at: new Date().toISOString() })
        .eq('id', matchedClick.id)

      // Create user attribution record
      await supabaseAdmin
        .from('user_attribution')
        .insert({
          user_id,
          attribution_type: 'deferred',
          utm_source: matchedClick.utm_source,
          utm_medium: matchedClick.utm_medium,
          utm_campaign: matchedClick.utm_campaign,
          utm_content: matchedClick.utm_content,
          utm_term: matchedClick.utm_term,
          click_id: matchedClick.id,
        })

      return new Response(
        JSON.stringify({
          success: true,
          attribution_type: 'deferred',
          utm_source: matchedClick.utm_source,
          utm_medium: matchedClick.utm_medium,
          utm_campaign: matchedClick.utm_campaign,
          utm_content: matchedClick.utm_content,
          utm_term: matchedClick.utm_term,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // No match found — mark as organic
    await supabaseAdmin
      .from('user_attribution')
      .insert({
        user_id,
        attribution_type: 'organic',
      })

    return new Response(
      JSON.stringify({ success: true, attribution_type: 'organic' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in match-attribution:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
