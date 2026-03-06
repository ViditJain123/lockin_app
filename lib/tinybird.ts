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

export async function sendSessionEvent(event: SessionEvent): Promise<void> {
  try {
    const payload = {
      ...event,
      time_started: toClickHouseDateTime(event.time_started),
      time_ended: toClickHouseDateTime(event.time_ended),
      timestamp: toClickHouseDateTime(event.timestamp),
    };

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
