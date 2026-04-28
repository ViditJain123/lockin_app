// Lockin Club — Lockin (mode select) landing screen

function LCLockin() {
  return (
    <LCPhone>
      {/* Ambient red glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 20%, rgba(255,59,48,0.22), transparent 55%)`,
        pointerEvents: 'none',
      }}/>

      <div style={{ paddingTop: 58, paddingBottom: 28, height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {/* Top — greeting + streak pill */}
        <div style={{ padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute, whiteSpace: 'nowrap' }}>THU · 14:28</div>
            <div style={{ fontFamily: LC.display, fontSize: 22, lineHeight: 1.05, color: LC.text, marginTop: 2, whiteSpace: 'nowrap' }}>READY, KAI?</div>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 10px', borderRadius: 999,
            background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.3)',
          }}>
            <span style={{ fontSize: 12 }}>🔥</span>
            <span style={{ fontFamily: LC.mono, fontSize: 10, color: LC.red, letterSpacing: 1, fontWeight: 700 }}>23 DAY</span>
          </div>
        </div>

        {/* Big banner headline */}
        <div style={{ padding: '16px 20px 12px', position: 'relative' }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 3, color: LC.red, fontWeight: 600 }}>◆ PICK YOUR WEAPON</div>
          <div style={{ fontFamily: LC.display, fontSize: 48, lineHeight: 0.88, color: LC.text, letterSpacing: 0.5, marginTop: 6 }}>
            HOW WILL<br/>YOU <span style={{ color: LC.red }}>LOCK IN?</span>
          </div>
        </div>

        {/* Target mini-status */}
        <div style={{ padding: '0 20px', marginBottom: 14 }}>
          <div style={{
            padding: '10px 12px', borderRadius: 10,
            background: LC.bgCard, border: `1px solid ${LC.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.textMute, whiteSpace: 'nowrap' }}>TODAY · TARGET 4:00</div>
              <div style={{ fontFamily: LC.mono, fontSize: 10, color: LC.textDim, whiteSpace: 'nowrap' }}>1:17 LEFT</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
              <div style={{ fontFamily: LC.display, fontSize: 20, color: LC.text, lineHeight: 1, whiteSpace: 'nowrap' }}>2:43</div>
              <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{ width: '68%', height: '100%', background: LC.red }}/>
              </div>
            </div>
          </div>
        </div>

        {/* HERO — TIMELAPSE option */}
        <div style={{ padding: '0 16px' }}>
          <button style={{
            width: '100%', textAlign: 'left', padding: 0,
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'block',
          }}>
            <div style={{
              position: 'relative', borderRadius: 20, overflow: 'hidden',
              border: `1px solid rgba(255,59,48,0.35)`,
              background: `linear-gradient(180deg, #1a1210 0%, #0a0806 100%)`,
              boxShadow: `0 16px 40px rgba(255,59,48,0.15), 0 0 0 1px rgba(255,59,48,0.1)`,
            }}>
              {/* warm lit room bg */}
              <div style={{
                position: 'absolute', inset: 0,
                background: `
                  radial-gradient(ellipse at 25% 30%, rgba(180,110,60,0.35), transparent 55%),
                  radial-gradient(ellipse at 80% 80%, rgba(255,59,48,0.18), transparent 50%)
                `,
              }}/>
              {/* faint rule-of-thirds */}
              {[0.33, 0.66].map(p => <div key={'h'+p} style={{ position: 'absolute', left: 0, right: 0, top: `${p*100}%`, height: 1, background: 'rgba(255,255,255,0.05)' }}/>)}
              {[0.33, 0.66].map(p => <div key={'v'+p} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p*100}%`, width: 1, background: 'rgba(255,255,255,0.05)' }}/>)}

              {/* grain */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.08,
                backgroundImage: 'repeating-conic-gradient(from 0deg, #fff 0deg 1deg, #000 1deg 2deg)',
                backgroundSize: '3px 3px', mixBlendMode: 'overlay',
              }}/>

              {/* red REC dot top-right */}
              <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 6, padding: '5px 9px', borderRadius: 999, background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,59,48,0.4)' }}>
                <div style={{ width: 7, height: 7, borderRadius: 4, background: LC.red, boxShadow: `0 0 8px ${LC.red}` }}/>
                <span style={{ fontFamily: LC.mono, fontSize: 9, color: LC.red, letterSpacing: 1.5, fontWeight: 700, whiteSpace: 'nowrap' }}>120×</span>
              </div>

              {/* RECOMMENDED flag */}
              <div style={{
                position: 'absolute', top: 14, left: 14,
                padding: '4px 8px', borderRadius: 4,
                background: LC.red, color: '#fff',
                fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, fontWeight: 700,
                whiteSpace: 'nowrap',
              }}>★ RECOMMENDED</div>

              {/* Content */}
              <div style={{ position: 'relative', padding: '46px 20px 18px' }}>
                {/* Giant 01 watermark */}
                <div style={{
                  position: 'absolute', right: 16, top: 36,
                  fontFamily: LC.display, fontSize: 140, lineHeight: 0.85,
                  color: 'rgba(255,59,48,0.08)', letterSpacing: -4, pointerEvents: 'none',
                }}>01</div>

                <div style={{ position: 'relative' }}>
                  <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute, whiteSpace: 'nowrap' }}>MODE 01</div>
                  <div style={{ fontFamily: LC.display, fontSize: 44, lineHeight: 0.88, color: LC.text, letterSpacing: 0.5, marginTop: 4 }}>TIMELAPSE<br/><span style={{ color: LC.red }}>GRIND</span></div>
                  <div style={{ fontFamily: LC.body, fontSize: 12, color: LC.textDim, marginTop: 8, lineHeight: 1.4, maxWidth: 260 }}>
                    Camera rolls. 120× speed. Share-ready timelapses you can flex on the leaderboard.
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    {[
                      { k: 'SPEED', v: '120×' },
                      { k: 'RATIO', v: '1:1 MIN' },
                      { k: 'SHAREABLE', v: 'YES' },
                    ].map(s => (
                      <div key={s.k} style={{
                        flex: 1, padding: '8px 8px', borderRadius: 8,
                        background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.08)',
                      }}>
                        <div style={{ fontFamily: LC.mono, fontSize: 8, letterSpacing: 1.2, color: LC.textMute, whiteSpace: 'nowrap' }}>{s.k}</div>
                        <div style={{ fontFamily: LC.display, fontSize: 15, color: LC.text, marginTop: 2, letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{s.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div style={{
                    marginTop: 12, padding: '12px 16px', borderRadius: 12,
                    background: LC.red, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    boxShadow: `0 8px 20px ${LC.redGlow}`,
                  }}>
                    <span style={{ fontFamily: LC.display, fontSize: 18, letterSpacing: 2, color: '#fff', whiteSpace: 'nowrap' }}>START RECORDING</span>
                    <div style={{
                      width: 30, height: 30, borderRadius: 15, background: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <div style={{ width: 0, height: 0, borderLeft: '9px solid ' + LC.red, borderTop: '6px solid transparent', borderBottom: '6px solid transparent', marginLeft: 2 }}/>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Divider */}
        <div style={{ padding: '12px 20px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: LC.border }}/>
          <span style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 2.5, color: LC.textMute, whiteSpace: 'nowrap' }}>OR KEEP IT LOWKEY</span>
          <div style={{ flex: 1, height: 1, background: LC.border }}/>
        </div>

        {/* SECONDARY — TIMER option */}
        <div style={{ padding: '0 16px' }}>
          <button style={{
            width: '100%', textAlign: 'left', padding: '16px 16px',
            background: LC.bgCard, border: `1px solid ${LC.border}`, borderRadius: 16,
            display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer',
          }}>
            {/* Mini clock icon */}
            <div style={{
              width: 54, height: 54, borderRadius: 27, flexShrink: 0,
              background: `radial-gradient(circle at 50% 50%, #1a1a1a, #0a0a0a)`,
              border: `1px solid ${LC.borderStrong}`, position: 'relative',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="54" height="54" viewBox="0 0 54 54" style={{ position: 'absolute', inset: 0 }}>
                <circle cx="27" cy="27" r="21" fill="none" stroke="rgba(244,241,234,0.12)" strokeWidth="1"/>
                <circle cx="27" cy="27" r="21" fill="none" stroke={LC.red} strokeWidth="2" strokeDasharray="132" strokeDashoffset="50" transform="rotate(-90 27 27)" strokeLinecap="round"/>
                {Array.from({length: 12}).map((_,i) => {
                  const a = (i * 30) * Math.PI / 180;
                  const x1 = 27 + Math.cos(a) * 23;
                  const y1 = 27 + Math.sin(a) * 23;
                  const x2 = 27 + Math.cos(a) * 25;
                  const y2 = 27 + Math.sin(a) * 25;
                  return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={LC.textDim} strokeWidth="1"/>;
                })}
              </svg>
              <div style={{ fontFamily: LC.display, fontSize: 14, color: LC.text, position: 'relative', zIndex: 1 }}>00:42</div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.textMute, whiteSpace: 'nowrap' }}>MODE 02</span>
                <span style={{ width: 2, height: 2, borderRadius: 1, background: LC.textMute }}/>
                <span style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.textMute, whiteSpace: 'nowrap' }}>NO CAMERA</span>
              </div>
              <div style={{ fontFamily: LC.display, fontSize: 22, color: LC.text, letterSpacing: 0.5, marginTop: 2, lineHeight: 1, whiteSpace: 'nowrap' }}>STOPWATCH GRIND</div>
              <div style={{ fontFamily: LC.body, fontSize: 12, color: LC.textDim, marginTop: 4, lineHeight: 1.35 }}>
                Just a timer. Same 1:1 screen-time. No video.
              </div>
            </div>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}><path d="M9 6l6 6-6 6" stroke={LC.textDim} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Next task pill */}
        <div style={{ padding: '10px 16px 0' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 10, border: `1px dashed ${LC.borderStrong}`, background: 'transparent',
          }}>
            <div style={{
              width: 26, height: 26, borderRadius: 6,
              background: 'rgba(255,59,48,0.12)', border: '1px solid rgba(255,59,48,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" rx="1.5" stroke={LC.red} strokeWidth="1.5" fill="none"/><path d="M3 6l2 2 4-4" stroke={LC.red} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.2, color: LC.textMute, whiteSpace: 'nowrap' }}>NEXT UP · TAP TO CHANGE</div>
              <div style={{ fontFamily: LC.body, fontSize: 13, color: LC.text, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Finish Calc 2 p-set · 1h 30m</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }}/>
      </div>
    </LCPhone>
  );
}

Object.assign(window, { LCLockin });
