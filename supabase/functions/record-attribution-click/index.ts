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

    const {
      utm_source,
      utm_medium,
      utm_campaign,
      utm_content,
      utm_term,
      timezone,
      locale,
      user_agent,
      referrer,
      landing_url,
    } = body

    // Extract IP from x-forwarded-for header
    const forwarded = req.headers.get('x-forwarded-for')
    const ip_address = forwarded ? forwarded.split(',')[0].trim() : '0.0.0.0'

    const { error } = await supabaseAdmin
      .from('attribution_clicks')
      .insert({
        ip_address,
        user_agent: user_agent || req.headers.get('user-agent'),
        timezone,
        locale,
        utm_source,
        utm_medium,
        utm_campaign,
        utm_content,
        utm_term,
        referrer,
        landing_url,
      })

    if (error) {
      console.error('Error inserting attribution click:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to record click' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error in record-attribution-click:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
