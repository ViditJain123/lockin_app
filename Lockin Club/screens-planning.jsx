// Lockin Club — Planning screens
// Tasks / App-lock overlay

// ═══════════════════════════════════════════════════════════
// TASKS — simple checklist with "grind this" actions
// ═══════════════════════════════════════════════════════════
function LCTasks() {
  const tasks = [
    { t: 'Finish Calc 2 p-set', tag: 'SCHOOL', est: '1h 30m', done: false, active: true },
    { t: 'CS161 — B-tree writeup', tag: 'SCHOOL', est: '2h', done: false },
    { t: 'Read 40 pages — Hist 101', tag: 'READING', est: '45m', done: false },
    { t: 'Draft scholarship essay', tag: 'APPS', est: '1h', done: false },
    { t: 'Gym — upper day', tag: 'HEALTH', est: '1h', done: true },
    { t: 'Org chem flashcards', tag: 'SCHOOL', est: '30m', done: true },
  ];
  return (
    <LCPhone>
      <div style={{ paddingTop: 58, paddingBottom: 110, height: '100%', overflow: 'hidden' }}>
        <div style={{ padding: '0 20px', marginBottom: 18 }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute, textTransform: 'uppercase' }}>TODAY · 4 LEFT</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
            <div style={{ fontFamily: LC.display, fontSize: 42, color: LC.text, letterSpacing: 0.5 }}>THE HIT LIST</div>
            <button style={{
              width: 38, height: 38, borderRadius: 19, background: LC.red, border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/></svg>
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ padding: '0 20px', display: 'flex', gap: 6, marginBottom: 14, overflowX: 'hidden' }}>
          {['ALL · 6', 'SCHOOL · 3', 'APPS · 1', 'HEALTH · 1', 'READING · 1'].map((c,i) => (
            <div key={c} style={{
              padding: '6px 10px', borderRadius: 999,
              background: i===0 ? LC.text : 'transparent',
              border: i===0 ? 'none' : `1px solid ${LC.border}`,
              fontFamily: LC.mono, fontSize: 10, letterSpacing: 1,
              color: i===0 ? '#0a0a0a' : LC.textDim, fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>{c}</div>
          ))}
        </div>

        {/* Task list */}
        <div style={{ padding: '0 16px' }}>
          {tasks.filter(t => !t.done).map((x,i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'stretch', gap: 0,
              marginBottom: 8, borderRadius: 14, overflow: 'hidden',
              background: x.active ? 'rgba(255,59,48,0.06)' : LC.bgCard,
              border: `1px solid ${x.active ? 'rgba(255,59,48,0.3)' : LC.border}`,
              position: 'relative',
            }}>
              {x.active && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, background: LC.red }}/>}
              <div style={{ flex: 1, padding: '14px 14px 14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 4,
                  border: `1.5px solid ${x.active ? LC.red : LC.borderStrong}`,
                  background: 'transparent',
                }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: LC.body, fontSize: 14, fontWeight: 500, color: LC.text }}>{x.t}</div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 3, alignItems: 'center' }}>
                    <span style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.2, color: LC.textMute }}>{x.tag}</span>
                    <span style={{ width: 2, height: 2, borderRadius: 1, background: LC.textMute }}/>
                    <span style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 0.5, color: LC.textDim }}>{x.est}</span>
                    {x.active && <span style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.2, color: LC.red, fontWeight: 600 }}>● GRINDING · 00:42</span>}
                  </div>
                </div>
              </div>
              <button style={{
                width: 52, background: x.active ? LC.red : 'rgba(255,255,255,0.04)',
                border: 'none', borderLeft: `1px solid ${x.active ? 'rgba(0,0,0,0.1)' : LC.border}`,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              }}>
                {x.active ? (
                  <>
                    <div style={{ display: 'flex', gap: 2 }}>
                      <div style={{ width: 3, height: 12, background: '#fff' }}/>
                      <div style={{ width: 3, height: 12, background: '#fff' }}/>
                    </div>
                    <span style={{ fontFamily: LC.mono, fontSize: 8, letterSpacing: 1, color: '#fff' }}>PAUSE</span>
                  </>
                ) : (
                  <>
                    <div style={{ width: 0, height: 0, borderLeft: '10px solid ' + LC.text, borderTop: '6px solid transparent', borderBottom: '6px solid transparent' }}/>
                    <span style={{ fontFamily: LC.mono, fontSize: 8, letterSpacing: 1, color: LC.textDim }}>GRIND</span>
                  </>
                )}
              </button>
            </div>
          ))}

          {/* Completed section */}
          <div style={{ marginTop: 18, padding: '0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute }}>CLEARED · 2</div>
            <div style={{ flex: 1, height: 1, background: LC.border }}/>
          </div>
          {tasks.filter(t => t.done).map((x,i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 14px', marginTop: 6, borderRadius: 12,
              background: 'transparent', border: `1px solid ${LC.border}`,
              opacity: 0.55,
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: 4, background: LC.green,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-6" stroke="#0a0a0a" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ flex: 1, fontFamily: LC.body, fontSize: 14, color: LC.textDim, textDecoration: 'line-through' }}>{x.t}</div>
              <div style={{ fontFamily: LC.mono, fontSize: 10, color: LC.textMute, letterSpacing: 0.5 }}>{x.est}</div>
            </div>
          ))}
        </div>
      </div>
      <LCTabBar active="tasks"/>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// APP-LOCK OVERLAY — what user sees when opening a locked app
// ═══════════════════════════════════════════════════════════
function LCAppLock() {
  return (
    <LCPhone bg="#000">
      {/* Frosted "blurred app" peek */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(circle at 30% 20%, rgba(255,59,48,0.2), transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(255,59,48,0.1), transparent 50%),
          #050505
        `,
      }}/>

      {/* Fake app preview - TikTok-like card, heavily blurred */}
      <div style={{
        position: 'absolute', top: 90, left: 40, right: 40, height: 320,
        borderRadius: 20, overflow: 'hidden',
        filter: 'blur(18px) brightness(0.5)',
        background: 'linear-gradient(135deg, #ff0050, #00f2ea)',
        opacity: 0.4,
      }}/>

      {/* Dark veil */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)' }}/>

      {/* Center content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 30px', zIndex: 10 }}>
        {/* Lock hex */}
        <div style={{
          width: 110, height: 110, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <svg width="110" height="110" viewBox="0 0 110 110" style={{ position: 'absolute' }}>
            <polygon points="55,5 100,30 100,80 55,105 10,80 10,30" fill="none" stroke={LC.red} strokeWidth="1.5"/>
            <polygon points="55,12 93,33 93,77 55,98 17,77 17,33" fill="none" stroke={LC.red} strokeWidth="0.6" opacity="0.5"/>
          </svg>
          <svg width="42" height="50" viewBox="0 0 42 50">
            <path d="M10 22V14a11 11 0 0122 0v8" stroke={LC.red} strokeWidth="3" fill="none" strokeLinecap="round"/>
            <rect x="5" y="22" width="32" height="26" rx="3" fill={LC.red}/>
            <circle cx="21" cy="33" r="3" fill="#0a0a0a"/>
            <rect x="19.5" y="33" width="3" height="7" fill="#0a0a0a"/>
          </svg>
        </div>

        <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 3, color: LC.red, marginBottom: 10, fontWeight: 600 }}>◆ APP LOCKED ◆</div>
        <div style={{ fontFamily: LC.display, fontSize: 52, color: LC.text, letterSpacing: 1, textAlign: 'center', lineHeight: 0.9 }}>LOCK<br/>IN.</div>
        <div style={{ fontFamily: LC.body, fontSize: 14, color: LC.textDim, textAlign: 'center', marginTop: 14, lineHeight: 1.5, maxWidth: 280 }}>
          TikTok is gated. Grind for <span style={{ color: LC.red, fontWeight: 600 }}>17 more min</span> to unlock it.
        </div>

        {/* Target progress */}
        <div style={{ marginTop: 28, width: '100%', maxWidth: 280 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: LC.mono, fontSize: 10, color: LC.textMute, letterSpacing: 1.5, marginBottom: 6 }}>
            <span>TODAY</span><span>2:43 / 3:00</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
            <div style={{ width: '90%', height: '100%', background: LC.red, boxShadow: `0 0 12px ${LC.redGlow}` }}/>
          </div>
        </div>

        {/* CTAs */}
        <button style={{
          marginTop: 32, width: '100%', maxWidth: 280, padding: '16px 0',
          background: LC.red, border: 'none', borderRadius: 12,
          fontFamily: LC.display, fontSize: 18, color: '#fff', letterSpacing: 2,
          boxShadow: `0 10px 30px ${LC.redGlow}`,
        }}>START GRIND →</button>
        <button style={{
          marginTop: 10, padding: '10px 0',
          background: 'transparent', border: 'none',
          fontFamily: LC.mono, fontSize: 10, color: LC.textMute, letterSpacing: 2,
        }}>USE 1 EMERGENCY PASS (2 LEFT)</button>
      </div>

      {/* Bottom mini-lockup */}
      <div style={{ position: 'absolute', bottom: 34, left: 0, right: 0, textAlign: 'center', zIndex: 10 }}>
        <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 3, color: LC.textMute }}>LOCKIN CLUB</div>
      </div>
    </LCPhone>
  );
}

Object.assign(window, { LCTasks, LCAppLock });
