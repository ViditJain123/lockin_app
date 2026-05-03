import { supabase } from './supabase';

type DiscordEventType = 'signup' | 'trial_started' | 'subscription_purchased';

/**
 * Fire-and-forget Discord notification via Supabase Edge Function.
 * Never blocks UI — failures are silently logged.
 */
export function notifyDiscord(
  eventType: DiscordEventType,
  email: string,
  productId?: string,
  name?: string | null
): void {
  supabase.functions
    .invoke('discord-notify', {
      body: { event_type: eventType, email, product_id: productId, name },
    })
    .catch((err) => console.warn('[Discord] Notification failed:', err));
}
