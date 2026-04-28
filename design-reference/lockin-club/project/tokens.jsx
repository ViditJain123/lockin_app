// Lockin Club — design tokens & primitives
// Gritty hardcore aesthetic: true black + red accent + editorial type

const LC = {
  // palette
  bg: '#0a0a0a',
  bgElev: '#141414',
  bgCard: '#1a1a1a',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.15)',
  text: '#f4f1ea',
  textDim: 'rgba(244,241,234,0.6)',
  textMute: 'rgba(244,241,234,0.35)',
  red: '#ff3b30',
  redDeep: '#c72a1f',
  redGlow: 'rgba(255,59,48,0.25)',
  green: '#4ade80',
  amber: '#fbbf24',
  paper: '#e9e4d8', // receipt

  // type
  display: '"Bebas Neue", "Archivo Black", Impact, sans-serif',
  body: 'Inter, -apple-system, system-ui, sans-serif',
  mono: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
};

// Tiny primitives used across screens
function LCChip({ children, tone = 'default', style = {} }) {
  const tones = {
    default: { bg: 'rgba(255,255,255,0.08)', color: LC.text, border: 'rgba(255,255,255,0.08)' },
    red: { bg: 'rgba(255,59,48,0.14)', color: LC.red, border: 'rgba(255,59,48,0.3)' },
    green: { bg: 'rgba(74,222,128,0.12)', color: LC.green, border: 'rgba(74,222,128,0.3)' },
    mute: { bg: 'transparent', color: LC.textDim, border: 'rgba(255,255,255,0.12)' },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 8px', borderRadius: 6,
      fontFamily: LC.mono, fontSize: 10, fontWeight: 500,
      letterSpacing: 0.8, textTransform: 'uppercase',
      background: t.bg, color: t.color, border: `1px solid ${t.border}`,
      ...style,
    }}>{children}</span>
  );
}

function LCTabBar({ active = 'home' }) {
  const items = [
    { id: 'home', label: 'HOME', icon: 'home' },
    { id: 'tasks', label: 'TASKS', icon: 'task' },
    { id: 'record', label: 'LOCK IN', icon: 'record' },
    { id: 'stats', label: 'STATS', icon: 'chart' },
    { id: 'profile', label: 'ME', icon: 'user' },
  ];
  const icon = (k, active) => {
    const c = active ? LC.text : LC.textMute;
    const sw = 1.8;
    if (k === 'home') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M3 10.5L12 3l9 7.5V20a1 1 0 01-1 1h-5v-7h-6v7H4a1 1 0 01-1-1v-9.5z" stroke={c} strokeWidth={sw} strokeLinejoin="round"/></svg>;
    if (k === 'task') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" stroke={c} strokeWidth={sw}/><path d="M8 12l3 3 5-6" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"/></svg>;
    if (k === 'chart') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    if (k === 'user') return <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke={c} strokeWidth={sw}/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8" stroke={c} strokeWidth={sw} strokeLinecap="round"/></svg>;
    return null;
  };
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 40,
      paddingBottom: 30, paddingTop: 10,
      background: 'linear-gradient(to top, #0a0a0a 60%, rgba(10,10,10,0.0))',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
        padding: '0 12px',
      }}>
        {items.map(it => {
          const isActive = it.id === active;
          if (it.id === 'record') {
            return (
              <div key={it.id} style={{ marginTop: -28, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 32,
                  background: LC.red,
                  boxShadow: `0 8px 24px ${LC.redGlow}, inset 0 0 0 4px #0a0a0a, inset 0 0 0 5px ${LC.red}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 3, background: '#fff',
                  }}/>
                </div>
                <span style={{
                  fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.2,
                  color: LC.text, fontWeight: 600,
                }}>{it.label}</span>
              </div>
            );
          }
          return (
            <div key={it.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              padding: '6px 10px', flex: 1,
            }}>
              {icon(it.icon, isActive)}
              <span style={{
                fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.2,
                color: isActive ? LC.text : LC.textMute, fontWeight: 600,
              }}>{it.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LCStatusBar({ time = '9:41' }) {
  return (
    <div style={{
      height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '18px 32px 0', position: 'relative', zIndex: 20,
    }}>
      <span style={{ fontFamily: LC.body, fontWeight: 600, fontSize: 15, color: LC.text }}>{time}</span>
      <div style={{ width: 120, height: 30 }}/>{/* dynamic island spacer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="6" width="3" height="4" rx="0.5" fill={LC.text}/><rect x="4.5" y="4" width="3" height="6" rx="0.5" fill={LC.text}/><rect x="9" y="2" width="3" height="8" rx="0.5" fill={LC.text}/><rect x="13.5" y="0" width="3" height="10" rx="0.5" fill={LC.text}/></svg>
        <svg width="24" height="11" viewBox="0 0 24 11"><rect x="0.5" y="0.5" width="21" height="10" rx="3" stroke={LC.text} strokeOpacity="0.4" fill="none"/><rect x="2" y="2" width="18" height="7" rx="1.5" fill={LC.text}/></svg>
      </div>
    </div>
  );
}

// Reusable Phone shell — keeps everything consistent
function LCPhone({ children, bg = LC.bg }) {
  return (
    <div style={{
      width: 390, height: 844, position: 'relative', overflow: 'hidden',
      background: bg, color: LC.text,
      fontFamily: LC.body,
      borderRadius: 0,
    }}>
      {/* status bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 30 }}>
        <LCStatusBar/>
      </div>
      {/* dynamic island */}
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 120, height: 34, borderRadius: 24, background: '#000', zIndex: 50,
      }}/>
      {children}
      {/* home indicator */}
      <div style={{
        position: 'absolute', bottom: 8, left: 0, right: 0, zIndex: 60,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none',
      }}>
        <div style={{ width: 134, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.5)' }}/>
      </div>
    </div>
  );
}

// Title block — small eyebrow + big display title
function LCTitle({ eyebrow, title, style = {} }) {
  return (
    <div style={{ ...style }}>
      {eyebrow && <div style={{
        fontFamily: LC.mono, fontSize: 10, letterSpacing: 2,
        color: LC.textMute, textTransform: 'uppercase', marginBottom: 8,
      }}>{eyebrow}</div>}
      <div style={{
        fontFamily: LC.display, fontSize: 42, lineHeight: 0.92,
        letterSpacing: 0.5, color: LC.text,
      }}>{title}</div>
    </div>
  );
}

// Placeholder image (monospace explainer)
function LCPlaceholder({ label = 'image', w = '100%', h = 120, style = {} }) {
  return (
    <div style={{
      width: w, height: h,
      background: `repeating-linear-gradient(-45deg, #1a1a1a, #1a1a1a 6px, #141414 6px, #141414 12px)`,
      border: `1px dashed ${LC.borderStrong}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: LC.mono, fontSize: 10, color: LC.textMute, letterSpacing: 1,
      ...style,
    }}>{label}</div>
  );
}

Object.assign(window, { LC, LCChip, LCTabBar, LCStatusBar, LCPhone, LCTitle, LCPlaceholder });
