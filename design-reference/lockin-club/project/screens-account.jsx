// Lockin Club — Account screens
// Profile / Settings

// ═══════════════════════════════════════════════════════════
// PROFILE — recordings gallery
// ═══════════════════════════════════════════════════════════
function LCProfile() {
  // fake thumbnails — each is a gradient "desk snapshot"
  const thumbs = [
    { g: 'linear-gradient(135deg, #3a2818, #0d0906)', d: '00:42', tag: 'CALC' },
    { g: 'linear-gradient(135deg, #1a2030, #060a14)', d: '01:15', tag: 'CS161' },
    { g: 'linear-gradient(135deg, #2a1a1a, #0a0606)', d: '00:28', tag: 'READ' },
    { g: 'linear-gradient(135deg, #1a2a1a, #06120a)', d: '02:04', tag: 'ESSAY' },
    { g: 'linear-gradient(135deg, #30201a, #0d0806)', d: '00:51', tag: 'CALC' },
    { g: 'linear-gradient(135deg, #1a1a2a, #060612)', d: '01:32', tag: 'STUDY' },
    { g: 'linear-gradient(135deg, #2a2a1a, #12120a)', d: '00:19', tag: 'FLASH' },
    { g: 'linear-gradient(135deg, #2a1a2a, '+ '#120a12)', d: '03:12', tag: 'DEEP' },
    { g: 'linear-gradient(135deg, #1a2a2a, #0a1212)', d: '00:36', tag: 'CS161' },
  ];

  return (
    <LCPhone>
      <div style={{ paddingTop: 58, paddingBottom: 110, height: '100%', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute }}>MEMBER · SINCE MAR 2026</div>
          <button style={{
            width: 32, height: 32, borderRadius: 16, background: LC.bgCard, border: `1px solid ${LC.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={LC.text} strokeWidth="2"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={LC.text} strokeWidth="1.6"/></svg>
          </button>
        </div>

        {/* Avatar + name */}
        <div style={{ padding: '14px 20px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 32,
            background: `linear-gradient(135deg, ${LC.red}, ${LC.redDeep})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: LC.display, fontSize: 30, color: '#fff',
            boxShadow: `0 8px 24px ${LC.redGlow}, inset 0 0 0 2px rgba(255,255,255,0.15)`,
          }}>K</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: LC.display, fontSize: 28, color: LC.text, letterSpacing: 0.5 }}>KAI · @kai</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <LCChip tone="red">🔥 23 DAY STREAK</LCChip>
              <LCChip tone="mute">#412 GLOBAL</LCChip>
            </div>
          </div>
        </div>

        {/* Counters */}
        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, marginBottom: 18 }}>
          {[
            { v: '41', k: 'SESSIONS' },
            { v: '23:12', k: 'TOTAL HRS' },
            { v: '07', k: 'MEDALS' },
          ].map((s,i) => (
            <div key={s.k} style={{
              padding: '10px 0', textAlign: 'center',
              borderRight: i<2 ? `1px solid ${LC.border}` : 'none',
            }}>
              <div style={{ fontFamily: LC.display, fontSize: 22, color: LC.text }}>{s.v}</div>
              <div style={{ fontFamily: LC.mono, fontSize: 9, color: LC.textMute, letterSpacing: 1.5, marginTop: 2 }}>{s.k}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 20px', display: 'flex', gap: 18, borderBottom: `1px solid ${LC.border}`, marginBottom: 12 }}>
          {['TIMELAPSES', 'MEDALS', 'TAGGED'].map((t,i) => (
            <div key={t} style={{
              paddingBottom: 10, position: 'relative',
              fontFamily: LC.mono, fontSize: 11, letterSpacing: 1.5,
              color: i===0 ? LC.text : LC.textMute, fontWeight: 600,
            }}>
              {t}
              {i===0 && <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: LC.red }}/>}
            </div>
          ))}
        </div>

        {/* Grid of timelapses */}
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
          {thumbs.map((th,i) => (
            <div key={i} style={{
              aspectRatio: '9/16', borderRadius: 4, overflow: 'hidden',
              background: th.g, position: 'relative',
              border: `1px solid ${LC.border}`,
            }}>
              {/* faint grain */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse at 30% 40%, rgba(255,255,255,0.08), transparent 60%)`,
              }}/>
              {/* play icon */}
              <div style={{ position: 'absolute', top: 6, right: 6 }}>
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 1l8 4-8 4V1z" fill="#fff" opacity="0.7"/></svg>
              </div>
              {/* duration */}
              <div style={{
                position: 'absolute', bottom: 4, left: 4, right: 4,
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
              }}>
                <span style={{
                  fontFamily: LC.mono, fontSize: 8, color: '#fff', letterSpacing: 1,
                  background: 'rgba(0,0,0,0.5)', padding: '1px 4px', borderRadius: 2,
                }}>{th.tag}</span>
                <span style={{
                  fontFamily: LC.mono, fontSize: 9, color: '#fff', letterSpacing: 0.5,
                  textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                }}>{th.d}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <LCTabBar active="profile"/>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// SETTINGS
// ═══════════════════════════════════════════════════════════
function LCSettings() {
  const Row = ({ label, value, danger, last, toggle, on }) => (
    <div style={{
      display: 'flex', alignItems: 'center', padding: '14px 16px',
      borderBottom: last ? 'none' : `1px solid ${LC.border}`,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{
          fontFamily: LC.body, fontSize: 14,
          color: danger ? LC.red : LC.text, fontWeight: danger ? 600 : 400,
        }}>{label}</div>
      </div>
      {toggle !== undefined ? (
        <div style={{
          width: 40, height: 22, borderRadius: 11, padding: 2,
          background: on ? LC.red : 'rgba(255,255,255,0.15)',
          display: 'flex', justifyContent: on ? 'flex-end' : 'flex-start',
          transition: '0.15s',
        }}>
          <div style={{ width: 18, height: 18, borderRadius: 9, background: '#fff' }}/>
        </div>
      ) : value !== undefined ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: LC.mono, fontSize: 12, color: LC.textDim, letterSpacing: 0.5 }}>{value}</span>
          <svg width="6" height="10" viewBox="0 0 6 10"><path d="M1 1l4 4-4 4" stroke={LC.textMute} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
        </div>
      ) : !danger && (
        <svg width="6" height="10" viewBox="0 0 6 10"><path d="M1 1l4 4-4 4" stroke={LC.textMute} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
      )}
    </div>
  );

  const Group = ({ title, children }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ padding: '0 20px 8px', fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute }}>{title}</div>
      <div style={{ margin: '0 16px', background: LC.bgCard, borderRadius: 14, border: `1px solid ${LC.border}`, overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );

  return (
    <LCPhone>
      <div style={{ paddingTop: 58, paddingBottom: 40, height: '100%', overflowY: 'auto' }}>
        <div style={{ padding: '0 20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={{
            width: 36, height: 36, borderRadius: 18, background: LC.bgCard, border: `1px solid ${LC.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={LC.text} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <div style={{ fontFamily: LC.display, fontSize: 34, color: LC.text, letterSpacing: 0.5 }}>SETTINGS</div>
        </div>

        <Group title="LOCK CONFIG">
          <Row label="Daily target" value="4h 00m"/>
          <Row label="Apps to lock" value="12 apps"/>
          <Row label="Emergency passes" value="2 / week"/>
          <Row label="Auto-extend lock" toggle on={true} last/>
        </Group>

        <Group title="RECORDING">
          <Row label="Timelapse speed" value="120×"/>
          <Row label="Save originals" toggle on={false}/>
          <Row label="Face blur" toggle on={true} last/>
        </Group>

        <Group title="NOTIFICATIONS">
          <Row label="Streak reminders" toggle on={true}/>
          <Row label="Leaderboard updates" toggle on={true}/>
          <Row label="Club mentions" toggle on={false} last/>
        </Group>

        <Group title="ACCOUNT">
          <Row label="@kai"/>
          <Row label="Connected to Apple" value="kai@icloud"/>
          <Row label="Subscription" value="FREE"/>
          <Row label="Export my data" last/>
        </Group>

        <Group title="SUPPORT">
          <Row label="Help & FAQ"/>
          <Row label="Privacy policy"/>
          <Row label="Terms" last/>
        </Group>

        <Group title="DANGER ZONE">
          <Row label="Log out" danger/>
          <Row label="Delete account" danger last/>
        </Group>

        <div style={{ textAlign: 'center', padding: '12px 20px 20px', fontFamily: LC.mono, fontSize: 9, color: LC.textMute, letterSpacing: 2 }}>
          LOCKIN CLUB · v1.0.4 (build 221)
        </div>
      </div>
    </LCPhone>
  );
}

Object.assign(window, { LCProfile, LCSettings });
