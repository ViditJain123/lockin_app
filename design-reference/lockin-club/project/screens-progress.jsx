// Lockin Club — Progress screens
// Analytics / Leaderboard / Medals

// ═══════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════
function LCAnalytics() {
  const weekBars = [2.1, 3.4, 4.2, 1.8, 3.9, 5.1, 2.7]; // hrs per day
  const days = ['M','T','W','T','F','S','S'];
  const max = 6;

  // Heatmap — 16 weeks × 7 days
  const heat = Array.from({length: 16*7}).map((_,i) => {
    const v = (Math.sin(i*0.5) + Math.cos(i*0.31) + 1.6) / 3.2;
    return Math.max(0, Math.min(1, v + (i%11===0 ? 0.4 : 0)));
  });

  return (
    <LCPhone>
      <div style={{ paddingTop: 58, paddingBottom: 110, height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute }}>PROGRESS</div>
          <div style={{ fontFamily: LC.display, fontSize: 42, color: LC.text, letterSpacing: 0.5, marginTop: 2 }}>THE TAPE.</div>
        </div>

        {/* Range switcher */}
        <div style={{ padding: '0 20px', display: 'flex', gap: 4, marginBottom: 14 }}>
          {['WEEK','MONTH','YEAR','ALL'].map((r,i) => (
            <div key={r} style={{
              flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8,
              background: i===0 ? LC.bgCard : 'transparent',
              border: i===0 ? `1px solid ${LC.borderStrong}` : `1px solid transparent`,
              fontFamily: LC.mono, fontSize: 10, letterSpacing: 1.5,
              color: i===0 ? LC.text : LC.textMute, fontWeight: 600,
            }}>{r}</div>
          ))}
        </div>

        {/* KPI strip */}
        <div style={{ padding: '0 20px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { k: 'TOTAL', v: '23:12', u: 'HRS' },
            { k: 'AVG/DAY', v: '3:18', u: 'HRS' },
            { k: 'SESSIONS', v: '41', u: '' },
          ].map(s => (
            <div key={s.k} style={{ padding: 12, borderRadius: 12, background: LC.bgCard, border: `1px solid ${LC.border}` }}>
              <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.textMute }}>{s.k}</div>
              <div style={{ fontFamily: LC.display, fontSize: 22, color: LC.text, marginTop: 3 }}>{s.v}</div>
              <div style={{ fontFamily: LC.mono, fontSize: 9, color: LC.textDim, letterSpacing: 1 }}>{s.u}</div>
            </div>
          ))}
        </div>

        {/* Weekly bar chart */}
        <div style={{ margin: '0 16px', padding: 16, borderRadius: 14, background: LC.bgCard, border: `1px solid ${LC.border}`, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <div>
              <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.textMute }}>HOURS LOCKED · THIS WEEK</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
                <div style={{ fontFamily: LC.display, fontSize: 28, color: LC.text }}>23:12</div>
                <LCChip tone="green" style={{ padding: '2px 6px' }}>↑ 18%</LCChip>
              </div>
            </div>
          </div>
          <div style={{ height: 130, display: 'flex', alignItems: 'flex-end', gap: 6, paddingBottom: 18, position: 'relative', borderBottom: `1px solid ${LC.border}` }}>
            {/* y-grid */}
            {[0.33, 0.66, 1].map(p => <div key={p} style={{ position: 'absolute', left: 0, right: 0, bottom: 18 + (100*p), height: 1, background: LC.border, opacity: 0.5 }}/>)}
            {weekBars.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative', zIndex: 1 }}>
                <div style={{
                  width: '100%', height: `${(v/max)*100}px`,
                  background: i===5 ? LC.red : 'rgba(244,241,234,0.6)',
                  borderRadius: '3px 3px 0 0',
                  boxShadow: i===5 ? `0 0 16px ${LC.redGlow}` : 'none',
                  position: 'relative',
                }}>
                  {i===5 && <div style={{ position: 'absolute', top: -18, left: '50%', transform: 'translateX(-50%)', fontFamily: LC.mono, fontSize: 9, color: LC.red, fontWeight: 600, whiteSpace: 'nowrap' }}>★ {v}h</div>}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            {days.map((d,i) => (
              <div key={i} style={{ flex: 1, textAlign: 'center', fontFamily: LC.mono, fontSize: 10, color: i===5 ? LC.red : LC.textMute, letterSpacing: 0.5, fontWeight: i===5 ? 700 : 400 }}>{d}</div>
            ))}
          </div>
        </div>

        {/* Heatmap */}
        <div style={{ margin: '0 16px', padding: 16, borderRadius: 14, background: LC.bgCard, border: `1px solid ${LC.border}`, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.textMute }}>16-WEEK HEATMAP</div>
            <div style={{ fontFamily: LC.mono, fontSize: 9, color: LC.textDim, letterSpacing: 1 }}>112 DAYS</div>
          </div>
          <div style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gridAutoColumns: '1fr', gap: 3 }}>
            {heat.map((v,i) => (
              <div key={i} style={{
                aspectRatio: '1 / 1',
                background: v < 0.1 ? 'rgba(255,255,255,0.04)' : `rgba(255,59,48,${0.15 + v*0.8})`,
                borderRadius: 2,
              }}/>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
            <span style={{ fontFamily: LC.mono, fontSize: 9, color: LC.textMute, letterSpacing: 1 }}>LESS</span>
            <div style={{ display: 'flex', gap: 3 }}>
              {[0.1, 0.3, 0.5, 0.8, 1].map(v => (
                <div key={v} style={{ width: 10, height: 10, borderRadius: 2, background: v < 0.1 ? 'rgba(255,255,255,0.04)' : `rgba(255,59,48,${0.15 + v*0.8})` }}/>
              ))}
            </div>
            <span style={{ fontFamily: LC.mono, fontSize: 9, color: LC.textMute, letterSpacing: 1 }}>MORE</span>
          </div>
        </div>

        {/* Tag breakdown */}
        <div style={{ margin: '0 16px', padding: 16, borderRadius: 14, background: LC.bgCard, border: `1px solid ${LC.border}` }}>
          <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.textMute, marginBottom: 12 }}>WHAT YOU GRINDED ON</div>
          {[
            { t: 'SCHOOL', v: '14:32', p: 62, c: LC.red },
            { t: 'READING', v: '4:12', p: 18, c: 'rgba(244,241,234,0.7)' },
            { t: 'APPS', v: '3:08', p: 13, c: 'rgba(244,241,234,0.4)' },
            { t: 'HEALTH', v: '1:20', p: 7, c: 'rgba(244,241,234,0.2)' },
          ].map(r => (
            <div key={r.t} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: LC.mono, fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: LC.text, letterSpacing: 1 }}>{r.t}</span>
                <span style={{ color: LC.textDim }}>{r.v} · {r.p}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${r.p}%`, height: '100%', background: r.c }}/>
              </div>
            </div>
          ))}
        </div>
      </div>
      <LCTabBar active="stats"/>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// LEADERBOARD
// ═══════════════════════════════════════════════════════════
function LCLeaderboard() {
  const top = [
    { r: 1, n: 'mira.k', h: '142:08', you: false, hrs: 142, tag: 'STANFORD' },
    { r: 2, n: 'dev_ops', h: '128:44', you: false, hrs: 128, tag: 'IIT-B' },
    { r: 3, n: 'zara.w', h: '119:12', you: false, hrs: 119, tag: 'MIT' },
  ];
  const rest = [
    { r: 4, n: 'hans.m', h: '108:22' },
    { r: 5, n: 'tomo.24', h: '101:40' },
    { r: 6, n: 'luciana', h: '97:18' },
    { r: 412, n: 'kai · YOU', h: '23:12', you: true },
    { r: 413, n: 'finn.c', h: '22:48' },
  ];
  return (
    <LCPhone>
      <div style={{ paddingTop: 58, paddingBottom: 110, height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '0 20px', marginBottom: 16 }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute }}>APRIL · 412 OF 18.4K</div>
          <div style={{ fontFamily: LC.display, fontSize: 42, color: LC.text, letterSpacing: 0.5, marginTop: 2 }}>THE RANKS.</div>
        </div>

        {/* Tabs */}
        <div style={{ padding: '0 20px', display: 'flex', gap: 4, marginBottom: 14 }}>
          {['GLOBAL','FRIENDS','CLUB'].map((r,i) => (
            <div key={r} style={{
              flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 8,
              background: i===0 ? LC.text : 'transparent',
              fontFamily: LC.mono, fontSize: 10, letterSpacing: 1.5,
              color: i===0 ? '#0a0a0a' : LC.textMute, fontWeight: 600,
            }}>{r}</div>
          ))}
        </div>

        {/* Podium */}
        <div style={{ padding: '0 16px', marginBottom: 14 }}>
          <div style={{
            position: 'relative', padding: '18px 14px 14px',
            borderRadius: 16, background: `linear-gradient(180deg, rgba(255,59,48,0.1), transparent 80%), ${LC.bgCard}`,
            border: `1px solid rgba(255,59,48,0.2)`, overflow: 'hidden',
          }}>
            {/* faint #1 giant number */}
            <div style={{ position: 'absolute', right: -10, top: -30, fontFamily: LC.display, fontSize: 180, color: 'rgba(255,59,48,0.05)', lineHeight: 1, pointerEvents: 'none' }}>01</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
              <div style={{ fontFamily: LC.display, fontSize: 56, color: LC.red, lineHeight: 0.9, letterSpacing: -2 }}>01</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: LC.display, fontSize: 20, color: LC.text, letterSpacing: 0.5 }}>MIRA.K</div>
                <div style={{ fontFamily: LC.mono, fontSize: 10, color: LC.textDim, letterSpacing: 1, marginTop: 2 }}>STANFORD · 42-DAY STREAK</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: LC.display, fontSize: 22, color: LC.text }}>142:08</div>
                <div style={{ fontFamily: LC.mono, fontSize: 9, color: LC.textMute, letterSpacing: 1 }}>HOURS</div>
              </div>
            </div>
          </div>
        </div>

        {/* Rows 2-3 */}
        <div style={{ padding: '0 16px' }}>
          {top.slice(1).map(p => (
            <div key={p.r} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', marginBottom: 6, borderRadius: 12,
              background: LC.bgCard, border: `1px solid ${LC.border}`,
            }}>
              <div style={{ fontFamily: LC.display, fontSize: 26, color: LC.text, width: 32, textAlign: 'center' }}>{String(p.r).padStart(2,'0')}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: LC.body, fontSize: 14, color: LC.text, fontWeight: 500 }}>{p.n}</div>
                <div style={{ fontFamily: LC.mono, fontSize: 9, color: LC.textDim, letterSpacing: 1, marginTop: 1 }}>{p.tag}</div>
              </div>
              <div style={{ fontFamily: LC.mono, fontSize: 13, color: LC.text, letterSpacing: 0.5 }}>{p.h}</div>
            </div>
          ))}

          {rest.slice(0,3).map(p => (
            <div key={p.r} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', marginBottom: 4, borderRadius: 10,
              background: 'transparent',
            }}>
              <div style={{ fontFamily: LC.mono, fontSize: 12, color: LC.textDim, width: 32, textAlign: 'center' }}>{p.r}</div>
              <div style={{ flex: 1, fontFamily: LC.body, fontSize: 13, color: LC.textDim }}>{p.n}</div>
              <div style={{ fontFamily: LC.mono, fontSize: 11, color: LC.textDim }}>{p.h}</div>
            </div>
          ))}

          {/* Ellipsis */}
          <div style={{ textAlign: 'center', fontFamily: LC.mono, fontSize: 14, color: LC.textMute, padding: '8px 0', letterSpacing: 4 }}>···</div>

          {/* YOU row — sticky style */}
          {rest.slice(3).map(p => (
            <div key={p.r} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '14px 14px', marginBottom: 4, borderRadius: 12,
              background: p.you ? 'rgba(255,59,48,0.1)' : 'transparent',
              border: p.you ? `1px solid rgba(255,59,48,0.4)` : '1px solid transparent',
            }}>
              <div style={{
                fontFamily: LC.mono, fontSize: 12, color: p.you ? LC.red : LC.textDim,
                width: 40, textAlign: 'center', fontWeight: p.you ? 700 : 400,
              }}>#{p.r}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: LC.body, fontSize: 14, color: p.you ? LC.text : LC.textDim, fontWeight: p.you ? 700 : 400 }}>{p.n}</div>
                {p.you && <div style={{ fontFamily: LC.mono, fontSize: 9, color: LC.red, letterSpacing: 1, marginTop: 1 }}>↑ 31 RANKS THIS WEEK</div>}
              </div>
              <div style={{ fontFamily: LC.mono, fontSize: 13, color: p.you ? LC.text : LC.textDim }}>{p.h}</div>
            </div>
          ))}
        </div>
      </div>
      <LCTabBar active="stats"/>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// MEDALS — engraved seals, red hot-stamp
// ═══════════════════════════════════════════════════════════
function LCMedals() {
  // A medal seal: engraved circle + label + numeral
  const Seal = ({ n, label, sub, locked = false, big = false }) => {
    const size = big ? 140 : 90;
    return (
      <div style={{
        position: 'relative', width: size, height: size,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: locked ? 0.3 : 1,
      }}>
        <svg width={size} height={size} viewBox="0 0 140 140" style={{ position: 'absolute' }}>
          <defs>
            <radialGradient id={`g${n}${big?'b':'s'}`} cx="50%" cy="30%">
              <stop offset="0%" stopColor="#2a2a2a"/>
              <stop offset="100%" stopColor="#0f0f0f"/>
            </radialGradient>
          </defs>
          {/* outer ring */}
          <circle cx="70" cy="70" r="68" fill={`url(#g${n}${big?'b':'s'})`} stroke={LC.borderStrong} strokeWidth="1"/>
          {/* inner engraving */}
          <circle cx="70" cy="70" r="58" fill="none" stroke={LC.border} strokeWidth="0.8"/>
          <circle cx="70" cy="70" r="48" fill="none" stroke={LC.border} strokeWidth="0.5"/>
          {/* rays */}
          {Array.from({length: 24}).map((_,i) => {
            const a = (i * 15) * Math.PI / 180;
            const x1 = 70 + Math.cos(a) * 60;
            const y1 = 70 + Math.sin(a) * 60;
            const x2 = 70 + Math.cos(a) * 66;
            const y2 = 70 + Math.sin(a) * 66;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={LC.textMute} strokeWidth="0.6"/>;
          })}
          {/* red hot stamp */}
          <circle cx="70" cy="70" r="30" fill={locked ? 'transparent' : 'rgba(255,59,48,0.15)'} stroke={locked ? LC.border : LC.red} strokeWidth={locked ? '0.5' : '1'}/>
        </svg>
        <div style={{ position: 'relative', textAlign: 'center' }}>
          {locked ? (
            <svg width="18" height="22" viewBox="0 0 18 22"><path d="M4 9V6a5 5 0 0110 0v3" stroke={LC.textMute} strokeWidth="1.5" fill="none"/><rect x="2" y="9" width="14" height="11" rx="1.5" fill="none" stroke={LC.textMute} strokeWidth="1.5"/></svg>
          ) : (
            <div style={{ fontFamily: LC.display, fontSize: big ? 36 : 24, color: LC.red, letterSpacing: 0.5 }}>{n}</div>
          )}
        </div>
      </div>
    );
  };

  const medals = [
    { n: '01', label: 'FIRST BLOOD', sub: '1 HR LOCKED' },
    { n: '10', label: 'TEN DEEP', sub: '10 HR LOCKED' },
    { n: '07', label: 'WEEK ONE', sub: '7-DAY STREAK' },
    { n: '50', label: 'HALF-CENT', sub: '50 HR LOCKED' },
    { n: 'AM', label: 'EARLY BIRD', sub: '5AM SESSION' },
    { n: '?', label: 'LOCKED', sub: '30-DAY STREAK', locked: true },
    { n: '?', label: 'LOCKED', sub: '100 HR', locked: true },
    { n: '?', label: 'LOCKED', sub: 'NIGHT OWL', locked: true },
  ];

  return (
    <LCPhone>
      <div style={{ paddingTop: 58, paddingBottom: 110, height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '0 20px', marginBottom: 18 }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute }}>UNLOCKED · 7 OF 24</div>
          <div style={{ fontFamily: LC.display, fontSize: 42, color: LC.text, letterSpacing: 0.5, marginTop: 2 }}>THE VAULT.</div>
        </div>

        {/* Featured recent */}
        <div style={{
          margin: '0 16px 16px', padding: '18px 20px', borderRadius: 16,
          background: `radial-gradient(ellipse at center, rgba(255,59,48,0.15), transparent 70%), ${LC.bgCard}`,
          border: `1px solid rgba(255,59,48,0.3)`,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <Seal n="23" label="" sub="" big/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 2, color: LC.red, fontWeight: 600 }}>◆ LATEST ◆</div>
            <div style={{ fontFamily: LC.display, fontSize: 24, color: LC.text, marginTop: 4, letterSpacing: 0.5 }}>THE STREAK</div>
            <div style={{ fontFamily: LC.body, fontSize: 12, color: LC.textDim, marginTop: 3, lineHeight: 1.4 }}>23 days straight. Do not break the chain.</div>
            <div style={{ marginTop: 8, fontFamily: LC.mono, fontSize: 10, color: LC.textMute, letterSpacing: 1 }}>APR 2 · 14:02</div>
          </div>
        </div>

        {/* Grid */}
        <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {medals.map((m,i) => (
            <div key={i} style={{
              padding: '14px 8px', borderRadius: 14,
              background: LC.bgCard, border: `1px solid ${LC.border}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              <Seal n={m.n} label={m.label} sub={m.sub} locked={m.locked}/>
              <div style={{ fontFamily: LC.mono, fontSize: 10, fontWeight: 700, letterSpacing: 1, color: m.locked ? LC.textMute : LC.text, marginTop: 8, textAlign: 'center' }}>{m.label}</div>
              <div style={{ fontFamily: LC.mono, fontSize: 8, letterSpacing: 1, color: LC.textMute, marginTop: 2, textAlign: 'center' }}>{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
      <LCTabBar active="profile"/>
    </LCPhone>
  );
}

Object.assign(window, { LCAnalytics, LCLeaderboard, LCMedals });
