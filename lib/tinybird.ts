const TINYBIRD_HOST = 'https://api.us-east.tinybird.co';
const TINYBIRD_TOKEN = 'p.eyJ1IjogIjg0MzFhOWZlLTI2Y2EtNDg2Mi1iZTY4LTIxYzE0ZGZkM2Q2NiIsICJpZCI6ICJmZTNkZWFlZi04MzQxLTQ3YjgtODRiOS0zMjMyMDM4YWJiYTEiLCAiaG9zdCI6ICJ1c19lYXN0In0.u_4rg_c1HUOvtsqAdAxTYvmeCCKq65ImDAKerPKrVms';
const DATASOURCE_NAME = 'lockin_sessions';

export interface SessionEvent {
  session_id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  time_started: string; // ISO datetime
  time_ended: string; // ISO datetime
  distraction_count: number;
  total_locked_in_seconds: number;
  total_distracted_seconds: number;
  timestamp: string; // ISO datetime
}

function toClickHouseDateTime(iso: string): string {
  return iso.replace('T', ' ').replace(/\.\d{3}Z$/, '');
}

export interface ProfileStats {
  total_hours: number;
  grinds: number;
  streak: number;
}

export async function fetchProfileStats(userId: string): Promise<ProfileStats> {
  console.log('[Tinybird] fetchProfileStats for user:', userId);
  try {
    const response = await fetch(
      `${TINYBIRD_HOST}/v0/pipes/profile_stats.json?user_id=${encodeURIComponent(userId)}`,
      {
        headers: {
          Authorization: `Bearer ${TINYBIRD_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      console.warn('[Tinybird] Failed to fetch profile stats:', response.status);
      return { total_hours: 0, grinds: 0, streak: 0 };
    }

    const json = await response.json();
    console.log('[Tinybird] Profile stats raw response:', JSON.stringify(json));
    const row = json.data?.[0];
    if (!row) return { total_hours: 0, grinds: 0, streak: 0 };

    return {
      total_hours: row['h.total_hours'] ?? 0,
      grinds: row['g.grinds'] ?? 0,
      streak: row['s.streak'] ?? 0,
    };
  } catch (error) {
    console.warn('[Tinybird] Error fetching profile stats:', error);
    return { total_hours: 0, grinds: 0, streak: 0 };
  }
}

export interface TaskEvent {
  event_type: 'task_create' | 'task_complete' | 'task_uncomplete' | 'task_delete';
  task_id: string;
  user_id: string;
  title: string;
  is_daily: boolean;
  timestamp: string; // ISO datetime
}

export async function sendTaskEvent(event: TaskEvent): Promise<void> {
  try {
    const payload = {
      ...event,
      timestamp: toClickHouseDateTime(event.timestamp),
    };

    const response = await fetch(
      `${TINYBIRD_HOST}/v0/events?name=lockin_tasks&format=ndjson`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TINYBIRD_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.warn('[Tinybird] Failed to send task event:', response.status, text);
    }
  } catch (error) {
    console.warn('[Tinybird] Error sending task event:', error);
  }
}

export async function sendSessionEvent(event: SessionEvent): Promise<void> {
  try {
    const payload = {
      ...event,
      time_started: toClickHouseDateTime(event.time_started),
      time_ended: toClickHouseDateTime(event.time_ended),
      timestamp: toClickHouseDateTime(event.timestamp),
    };
    console.log('[Tinybird] sendSessionEvent payload:', JSON.stringify(payload));

    const response = await fetch(
      `${TINYBIRD_HOST}/v0/events?name=${DATASOURCE_NAME}&format=ndjson`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TINYBIRD_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.warn('[Tinybird] Failed to send session event:', response.status, text);
    } else {
      const body = await response.json();
      console.log('[Tinybird] Session event sent successfully:', JSON.stringify(body));
    }
  } catch (error) {
    console.warn('[Tinybird] Error sending session event:', error);
  }
}
