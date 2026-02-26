-- ============================================================
-- Seed realistic test data for tiyajain4124@gmail.com
-- Run this in Supabase SQL Editor (runs as postgres, bypasses RLS)
--
-- No prerequisites — works with the existing production schema
-- ============================================================

DO $$
DECLARE
  uid UUID;
BEGIN
  -- ── Look up user ID ──────────────────────────────────────
  SELECT id INTO uid
  FROM auth.users
  WHERE email = 'tiyajain4124@gmail.com';

  IF uid IS NULL THEN
    RAISE EXCEPTION 'User tiyajain4124@gmail.com not found in auth.users. Sign in with that account first.';
  END IF;

  -- ── Clean existing data (idempotent) ─────────────────────
  DELETE FROM user_profiles WHERE user_id = uid;
  DELETE FROM user_stats    WHERE user_id = uid;
  DELETE FROM user_tasks    WHERE user_id = uid;
  DELETE FROM user_badges   WHERE user_id = uid;
  DELETE FROM grinds        WHERE user_id = uid;

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 1. PROFILE (onboarding answers)
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  INSERT INTO user_profiles (
    user_id, name, goals,
    screen_time_hours, desired_screen_time_hours,
    problematic_apps, age, sleep_time,
    family_activity_selection, target_hours,
    has_completed_onboarding
  ) VALUES (
    uid,
    'Tiya',
    ARRAY['Study more', 'Build better habits', 'Reduce screen time'],
    5.0, 2.0,
    ARRAY['Instagram', 'TikTok', 'YouTube'],
    '18-24',
    '{"hour": 11, "minute": 0, "period": "PM"}'::jsonb,
    NULL,
    4.0,
    true
  );

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 2. GRINDS — 20 sessions over 14 days
  --    All ≥ 1 hour so every one counts as a "grind".
  --    Last 5 days each have ≥ 1 h → 5-day streak.
  --    Total ≈ 28.9 hours.
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  INSERT INTO grinds (user_id, video_path, video_url, duration_ms, created_at) VALUES
    -- Day -14  (1 session, 1.5 h)
    (uid, 'local', 'local', 5400000,  now() - interval '14 days' + interval '10 hours'),
    -- Day -13  (2 sessions, 1.3 h + 1.0 h)
    (uid, 'local', 'local', 4680000,  now() - interval '13 days' + interval '9 hours'),
    (uid, 'local', 'local', 3600000,  now() - interval '13 days' + interval '14 hours'),
    -- Day -12  (1 session, 2.0 h)
    (uid, 'local', 'local', 7200000,  now() - interval '12 days' + interval '11 hours'),
    -- Day -11  (1 session, 1.1 h)
    (uid, 'local', 'local', 3960000,  now() - interval '11 days' + interval '10 hours'),
    -- Day -10  (2 sessions, 1.7 h + 1.2 h)
    (uid, 'local', 'local', 6120000,  now() - interval '10 days' + interval '9 hours'),
    (uid, 'local', 'local', 4320000,  now() - interval '10 days' + interval '15 hours'),
    -- Day -9   (skip — no session)
    -- Day -8   (2 sessions, 1.4 h + 1.2 h)
    (uid, 'local', 'local', 5040000,  now() - interval '8 days'  + interval '11 hours'),
    (uid, 'local', 'local', 4320000,  now() - interval '8 days'  + interval '16 hours'),
    -- Day -7   (2 sessions, 1.8 h + 1.0 h)
    (uid, 'local', 'local', 6480000,  now() - interval '7 days'  + interval '10 hours'),
    (uid, 'local', 'local', 3600000,  now() - interval '7 days'  + interval '15 hours'),
    -- Day -6   (skip — streak break)
    -- Day -5   (skip)
    -- ── Streak starts here (5 consecutive days) ──
    -- Day -4   (2 sessions, 1.6 h + 1.3 h)
    (uid, 'local', 'local', 5760000,  now() - interval '4 days'  + interval '9 hours'),
    (uid, 'local', 'local', 4680000,  now() - interval '4 days'  + interval '14 hours'),
    -- Day -3   (2 sessions, 2.2 h + 1.3 h)
    (uid, 'local', 'local', 7920000,  now() - interval '3 days'  + interval '10 hours'),
    (uid, 'local', 'local', 4680000,  now() - interval '3 days'  + interval '16 hours'),
    -- Day -2   (2 sessions, 1.5 h + 1.1 h)
    (uid, 'local', 'local', 5400000,  now() - interval '2 days'  + interval '11 hours'),
    (uid, 'local', 'local', 3960000,  now() - interval '2 days'  + interval '15 hours'),
    -- Day -1   (2 sessions, 1.4 h + 1.8 h)
    (uid, 'local', 'local', 5040000,  now() - interval '1 day'   + interval '9 hours'),
    (uid, 'local', 'local', 6480000,  now() - interval '1 day'   + interval '14 hours'),
    -- Today    (1 session, 1.5 h)
    (uid, 'local', 'local', 5400000,  now() - interval '2 hours');

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 3. USER STATS (must be consistent with grinds above)
  --    total_hours  = 28.90  (sum of all grinds / 3600000)
  --    total_grinds = 20     (all sessions ≥ 1 h)
  --    streak       = 5      (days -4 through 0)
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  INSERT INTO user_stats (
    user_id, total_hours, total_grinds, current_streak,
    last_grind_at, updated_at
  ) VALUES (
    uid,
    28.90,
    20,
    5,
    now() - interval '2 hours',
    now()
  );

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 4. TASKS (3 daily + 3 one-time, mix of completed/incomplete)
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  INSERT INTO user_tasks (
    id, user_id, title, description,
    is_daily, is_completed, created_at, completed_at
  ) VALUES
    -- Daily tasks
    ('1740500000000a1b2c3d4e', uid, 'Study for 2 hours',
     'Focus on math and physics chapters',
     true, false, now() - interval '7 days', NULL),

    ('1740500000001f5g6h7i8', uid, 'Read 30 pages',
     'Continue reading Atomic Habits',
     true, true, now() - interval '7 days', now() - interval '3 hours'),

    ('1740500000002j9k0l1m2', uid, 'Meditate 10 minutes',
     'Morning mindfulness session',
     true, false, now() - interval '5 days', NULL),

    -- One-time tasks
    ('1740500000003n3o4p5q6', uid, 'Finish project report',
     'Submit the final draft by Friday',
     false, false, now() - interval '3 days', NULL),

    ('1740500000004r7s8t9u0', uid, 'Practice LeetCode',
     'Solve 2 medium problems on arrays',
     false, true, now() - interval '10 days', now() - interval '5 hours'),

    ('1740500000005v1w2x3y4', uid, 'Go for a run',
     '30 min jog in the evening',
     false, false, now() - interval '4 days', NULL);

  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  -- 5. BADGES (consistent with 28.9 h, 20 grinds, 5 streak)
  --    earned_at = epoch milliseconds (BIGINT)
  -- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  INSERT INTO user_badges (user_id, badge_id, earned_at) VALUES
    -- Hours badges (thresholds: 3, 5, 10, 25)
    (uid, 'hours-3',   (EXTRACT(EPOCH FROM now() - interval '12 days') * 1000)::bigint),
    (uid, 'hours-5',   (EXTRACT(EPOCH FROM now() - interval '11 days') * 1000)::bigint),
    (uid, 'hours-10',  (EXTRACT(EPOCH FROM now() - interval '8 days')  * 1000)::bigint),
    (uid, 'hours-25',  (EXTRACT(EPOCH FROM now() - interval '2 days')  * 1000)::bigint),
    -- Grinds badges (thresholds: 1, 5, 10, 20)
    (uid, 'grinds-1',  (EXTRACT(EPOCH FROM now() - interval '14 days') * 1000)::bigint),
    (uid, 'grinds-5',  (EXTRACT(EPOCH FROM now() - interval '10 days') * 1000)::bigint),
    (uid, 'grinds-10', (EXTRACT(EPOCH FROM now() - interval '7 days')  * 1000)::bigint),
    (uid, 'grinds-20', (EXTRACT(EPOCH FROM now() - interval '2 hours') * 1000)::bigint),
    -- Streak badges (thresholds: 3, 5)
    (uid, 'streak-3',  (EXTRACT(EPOCH FROM now() - interval '2 days')  * 1000)::bigint),
    (uid, 'streak-5',  (EXTRACT(EPOCH FROM now() - interval '2 hours') * 1000)::bigint);

  RAISE NOTICE '✅ Seeded all data for user % (tiyajain4124@gmail.com)', uid;
END $$;
