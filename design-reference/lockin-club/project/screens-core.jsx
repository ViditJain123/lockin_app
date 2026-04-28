// Lockin Club — Core Loop screens
// Home / Timer / Time-lapse record / Preview / Reward receipt

// ═══════════════════════════════════════════════════════════
// HOME — today dashboard
// ═══════════════════════════════════════════════════════════
function LCHome() {
  const pct = 0.68; // 2:43 / 4:00
  return (
    <LCPhone>
      <div style={{ paddingTop: 58, paddingBottom: 130, overflow: 'hidden', height: '100%' }}>
        {/* Top greeting */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Thu · Apr 23</div>
            <div style={{ fontFamily: LC.display, fontSize: 26, lineHeight: 1.05, color: LC.text, marginTop: 2, whiteSpace: 'nowrap' }}>WYD, KAI?</div>
          </div>
          <div style={{
            width: 40, height: 40, borderRadius: 20, background: '#1a1a1a',
            border: `1px solid ${LC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: LC.display, fontSize: 16, color: LC.text,
          }}>K</div>
        </div>

        {/* Hero: today's grind card */}
        <div style={{
          margin: '0 16px', padding: 20, borderRadius: 20,
          background: `linear-gradient(180deg, #161616, #0d0d0d)`,
          border: `1px solid ${LC.border}`,
          position: 'relative', overflow: 'hidden',
        }}>
          {/* faint grid bg */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.4,
            backgroundImage: `linear-gradient(${LC.border} 1px, transparent 1px), linear-gradient(90deg, ${LC.border} 1px, transparent 1px)`,
            backgroundSize: '24px 24px', pointerEvents: 'none',
          }}/>
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <LCChip tone="red">● LIVE TARGET</LCChip>
              <div style={{ fontFamily: LC.mono, fontSize: 10, color: LC.textMute, letterSpacing: 1, whiteSpace: 'nowrap' }}>GOAL · 4H 00M</div>
            </div>

            <div style={{ marginTop: 18, display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontFamily: LC.display, fontSize: 72, lineHeight: 0.85, color: LC.text, letterSpacing: -1 }}>2:43</div>
              <div style={{ fontFamily: LC.mono, fontSize: 12, color: LC.textDim }}>/ 4:00 LOCKED</div>
            </div>

            {/* progress bar */}
            <div style={{ marginTop: 18, height: 8, borderRadius: 4, background: '#0a0a0a', border: `1px solid ${LC.border}`, overflow: 'hidden', position: 'relative' }}>
              <div style={{ width: `${pct*100}%`, height: '100%', background: LC.red, boxShadow: `0 0 12px ${LC.redGlow}` }}/>
              {/* tick marks */}
              {[0.25,0.5,0.75].map(p => <div key={p} style={{ position:'absolute', left:`${p*100}%`, top:0, width:1, height:'100%', background:'rgba(10,10,10,0.8)' }}/>)}
            </div>
            <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', fontFamily: LC.mono, fontSize: 10, color: LC.textMute, letterSpacing: 1 }}>
              <span>1H</span><span>2H</span><span>3H</span><span style={{ color: LC.red }}>4H ★</span>
            </div>

            {/* earned pill */}
            <div style={{
              marginTop: 20, padding: '12px 14px', borderRadius: 12,
              background: 'rgba(255,59,48,0.08)', border: `1px solid rgba(255,59,48,0.2)`,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.red, textTransform: 'uppercase' }}>Screen time earned</div>
                <div style={{ fontFamily: LC.display, fontSize: 24, color: LC.text, marginTop: 2 }}>2H 43M</div>
              </div>
              <button style={{
                padding: '10px 14px', background: LC.red, color: '#fff',
                border: 'none', borderRadius: 8,
                fontFamily: LC.mono, fontSize: 11, fontWeight: 700, letterSpacing: 1.2,
              }}>CLAIM →</button>
            </div>
          </div>
        </div>

        {/* 4-up stat grid */}
        <div style={{ margin: '14px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { k: 'STREAK', v: '23', u: 'DAYS', hot: true },
            { k: 'THIS WEEK', v: '18:42', u: 'HRS LOCKED' },
            { k: 'RANK', v: '#412', u: 'APR · GLOBAL' },
            { k: 'MEDALS', v: '07', u: 'UNLOCKED' },
          ].map(s => (
            <div key={s.k} style={{
              padding: 14, borderRadius: 14, background: LC.bgCard,
              border: `1px solid ${LC.border}`,
            }}>
              <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.textMute }}>{s.k}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                <div style={{ fontFamily: LC.display, fontSize: 28, color: s.hot ? LC.red : LC.text }}>{s.v}</div>
                {s.hot && <span style={{ fontSize: 14 }}>🔥</span>}
              </div>
              <div style={{ fontFamily: LC.mono, fontSize: 9, color: LC.textDim, letterSpacing: 1, marginTop: 2 }}>{s.u}</div>
            </div>
          ))}
        </div>

        {/* Today's tasks preview */}
        <div style={{ margin: '16px 16px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', marginBottom: 10 }}>
            <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute, whiteSpace: 'nowrap' }}>ON DECK · 3</div>
            <div style={{ fontFamily: LC.mono, fontSize: 10, color: LC.red, letterSpacing: 1, whiteSpace: 'nowrap' }}>SEE ALL →</div>
          </div>
          {[
            { t: 'Finish Calc 2 p-set', d: '1h 30m' },
            { t: 'CS161 — B-tree writeup', d: '2h' },
          ].map((x,i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', marginBottom: 6, borderRadius: 12,
              background: LC.bgCard, border: `1px solid ${LC.border}`,
            }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${LC.borderStrong}` }}/>
              <div style={{ flex: 1, fontFamily: LC.body, fontSize: 14, color: LC.text }}>{x.t}</div>
              <div style={{ fontFamily: LC.mono, fontSize: 11, color: LC.textDim, letterSpacing: 0.5 }}>{x.d}</div>
            </div>
          ))}
        </div>
      </div>
      <LCTabBar active="home"/>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// TIMER — normal stopwatch grind (minimal, camera-less)
// ═══════════════════════════════════════════════════════════
function LCTimer() {
  return (
    <LCPhone>
      <div style={{ paddingTop: 54, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px' }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute }}>
            <span style={{ color: LC.red }}>●</span> LOCKED IN · STOPWATCH
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 6, background: 'rgba(255,59,48,0.1)',
            border: `1px solid rgba(255,59,48,0.25)`,
            fontFamily: LC.mono, fontSize: 10, color: LC.red, letterSpacing: 1,
          }}>REC</div>
        </div>

        {/* Task pill */}
        <div style={{ padding: '0 20px', marginTop: 4 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 10,
            background: LC.bgCard, border: `1px solid ${LC.border}`,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: LC.red }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.textMute }}>CURRENT TASK</div>
              <div style={{ fontFamily: LC.body, fontSize: 14, color: LC.text, fontWeight: 500 }}>Finish Calc 2 p-set</div>
            </div>
            <div style={{ fontFamily: LC.mono, fontSize: 11, color: LC.textDim }}>1:30 EST</div>
          </div>
        </div>

        {/* Giant timer */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
          {/* concentric rings */}
          <svg width="320" height="320" style={{ position: 'absolute' }}>
            <circle cx="160" cy="160" r="140" stroke={LC.border} strokeWidth="1" fill="none"/>
            <circle cx="160" cy="160" r="120" stroke={LC.border} strokeWidth="1" fill="none"/>
            <circle cx="160" cy="160" r="100" stroke={LC.border} strokeWidth="1" fill="none"/>
            {/* progress arc */}
            <circle cx="160" cy="160" r="140" stroke={LC.red} strokeWidth="2" fill="none"
              strokeDasharray="879" strokeDashoffset={879 - 879*0.42}
              transform="rotate(-90 160 160)" strokeLinecap="round"/>
            {/* tick marks */}
            {Array.from({length: 60}).map((_,i) => {
              const a = (i * 6) * Math.PI / 180;
              const x1 = 160 + Math.cos(a) * 152;
              const y1 = 160 + Math.sin(a) * 152;
              const x2 = 160 + Math.cos(a) * (i%5===0 ? 146 : 149);
              const y2 = 160 + Math.sin(a) * (i%5===0 ? 146 : 149);
              return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i%5===0 ? LC.textDim : LC.textMute} strokeWidth={i%5===0 ? 1.5 : 0.8}/>;
            })}
          </svg>
          <div style={{ position: 'relative', textAlign: 'center' }}>
            <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2.5, color: LC.textMute, marginBottom: 12 }}>ELAPSED</div>
            <div style={{ fontFamily: LC.display, fontSize: 82, lineHeight: 0.9, color: LC.text, letterSpacing: -1 }}>00:42:18</div>
            <div style={{ fontFamily: LC.mono, fontSize: 11, color: LC.red, marginTop: 10, letterSpacing: 1.5 }}>
              +42 MIN UNLOCKED
            </div>
          </div>
        </div>

        {/* Bottom controls */}
        <div style={{ padding: '0 32px 60px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          <button style={{
            width: 56, height: 56, borderRadius: 28, background: LC.bgCard,
            border: `1px solid ${LC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={LC.textDim} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <button style={{
            width: 88, height: 88, borderRadius: 44, background: LC.red,
            border: `4px solid #0a0a0a`, boxShadow: `0 0 0 2px ${LC.red}, 0 0 40px ${LC.redGlow}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <div style={{ width: 7, height: 26, background: '#fff', borderRadius: 1 }}/>
              <div style={{ width: 7, height: 26, background: '#fff', borderRadius: 1 }}/>
            </div>
          </button>
          <button style={{
            width: 56, height: 56, borderRadius: 28, background: LC.bgCard,
            border: `1px solid ${LC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: LC.mono, fontSize: 10, color: LC.textDim, letterSpacing: 1,
          }}>END</button>
        </div>
      </div>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// TIME-LAPSE RECORDING — minimal, camera feed
// ═══════════════════════════════════════════════════════════
function LCTimelapse() {
  return (
    <LCPhone bg="#000">
      {/* Simulated camera feed — dim workspace */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `
          radial-gradient(ellipse at 30% 40%, rgba(80,70,60,0.4), transparent 60%),
          radial-gradient(ellipse at 70% 70%, rgba(40,30,20,0.5), transparent 50%),
          linear-gradient(180deg, #1a1612 0%, #0a0806 100%)
        `,
      }}>
        {/* subtle grain */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.15, mixBlendMode: 'overlay',
          backgroundImage: `repeating-conic-gradient(from 0deg, #fff 0deg 1deg, #000 1deg 2deg)`,
          backgroundSize: '3px 3px',
        }}/>
        {/* desk silhouette */}
        <div style={{ position:'absolute', inset: 0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{
            width: 280, height: 200, opacity: 0.6,
            background: 'linear-gradient(180deg, rgba(60,40,20,0.4), rgba(20,15,10,0.8))',
            borderRadius: 4, border: '1px solid rgba(255,200,150,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: LC.mono, fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: 2,
          }}>CAMERA FEED · DESK</div>
        </div>
      </div>

      {/* Rule-of-thirds crop marks */}
      {[0.33, 0.66].map(p => <div key={'h'+p} style={{ position: 'absolute', left: 0, right: 0, top: `${p*100}%`, height: 1, background: 'rgba(255,255,255,0.08)', zIndex: 5 }}/>)}
      {[0.33, 0.66].map(p => <div key={'v'+p} style={{ position: 'absolute', top: 0, bottom: 0, left: `${p*100}%`, width: 1, background: 'rgba(255,255,255,0.08)', zIndex: 5 }}/>)}
      {/* corner brackets */}
      {[[20,80,'tl'],[null,80,'tr'],[20,null,'bl'],[null,null,'br']].map(([l,t,k]) => {
        const pos = { position:'absolute', width:20, height:20, zIndex:6 };
        if(k==='tl') return <div key={k} style={{...pos, top:70, left:20, borderTop:'2px solid #fff', borderLeft:'2px solid #fff'}}/>;
        if(k==='tr') return <div key={k} style={{...pos, top:70, right:20, borderTop:'2px solid #fff', borderRight:'2px solid #fff'}}/>;
        if(k==='bl') return <div key={k} style={{...pos, bottom:160, left:20, borderBottom:'2px solid #fff', borderLeft:'2px solid #fff'}}/>;
        return <div key={k} style={{...pos, bottom:160, right:20, borderBottom:'2px solid #fff', borderRight:'2px solid #fff'}}/>;
      })}

      {/* Top chrome */}
      <div style={{ position: 'absolute', top: 54, left: 0, right: 0, zIndex: 10, padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px', borderRadius: 999,
          background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: LC.red, boxShadow: `0 0 8px ${LC.red}` }}/>
          <span style={{ fontFamily: LC.mono, fontSize: 11, color: '#fff', letterSpacing: 1 }}>REC · 00:42:18</span>
        </div>
        <div style={{
          padding: '6px 10px', borderRadius: 999,
          background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.12)',
          backdropFilter: 'blur(10px)',
          fontFamily: LC.mono, fontSize: 11, color: '#fff', letterSpacing: 1,
        }}>TIMELAPSE · 120×</div>
      </div>

      {/* Task pill */}
      <div style={{ position: 'absolute', top: 120, left: 0, right: 0, zIndex: 10, display: 'flex', justifyContent: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 999,
          background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ width: 6, height: 6, borderRadius: 3, background: LC.red }}/>
          <span style={{ fontFamily: LC.body, fontSize: 13, color: '#fff', fontWeight: 500 }}>Calc 2 p-set</span>
        </div>
      </div>

      {/* Earned ticker */}
      <div style={{ position: 'absolute', bottom: 200, left: 0, right: 0, zIndex: 10, textAlign: 'center' }}>
        <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.5)' }}>SCREEN TIME EARNED</div>
        <div style={{ fontFamily: LC.display, fontSize: 32, color: '#fff', marginTop: 2, letterSpacing: 0.5 }}>+42<span style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }}>MIN</span></div>
      </div>

      {/* Bottom controls */}
      <div style={{ position: 'absolute', bottom: 54, left: 0, right: 0, zIndex: 10, padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* spacer */}
        <div style={{ width: 56 }}/>
        {/* big record button — square = stop */}
        <button style={{
          width: 80, height: 80, borderRadius: 40, background: 'rgba(0,0,0,0.3)',
          border: `4px solid #fff`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 30, height: 30, borderRadius: 4, background: LC.red }}/>
        </button>
        {/* flip */}
        <button style={{
          width: 56, height: 56, borderRadius: 28, background: 'rgba(0,0,0,0.5)',
          border: '1px solid rgba(255,255,255,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(10px)',
        }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M4 9a5 5 0 015-5h6M20 15a5 5 0 01-5 5H9" stroke="#fff" strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M15 1l3 3-3 3M9 23l-3-3 3-3" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// TIME-LAPSE PREVIEW — post-record
// ═══════════════════════════════════════════════════════════
function LCPreview() {
  return (
    <LCPhone>
      <div style={{ paddingTop: 54, paddingBottom: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px' }}>
          <button style={{
            width: 36, height: 36, borderRadius: 18, background: LC.bgCard,
            border: `1px solid ${LC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={LC.text} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <div style={{ fontFamily: LC.mono, fontSize: 11, letterSpacing: 2, color: LC.textMute }}>PREVIEW</div>
          <div style={{ width: 36 }}/>
        </div>

        {/* Video preview */}
        <div style={{ margin: '12px 16px 0', borderRadius: 16, overflow: 'hidden', position: 'relative', height: 480,
          background: `linear-gradient(180deg, #2a2018, #0d0906)`,
          border: `1px solid ${LC.border}`,
        }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: `radial-gradient(ellipse at 50% 50%, rgba(100,80,60,0.3), transparent 70%)`,
          }}/>
          <LCPlaceholder label="TIMELAPSE · 00:42 @ 120×" w="100%" h="100%" style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)' }}/>

          {/* play button */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            width: 72, height: 72, borderRadius: 36, background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.3)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="24" height="28" viewBox="0 0 24 28"><path d="M2 2l20 12L2 26V2z" fill="#fff"/></svg>
          </div>

          {/* bottom meta overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14,
            background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontFamily: LC.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5 }}>SESSION · APR 23</div>
                <div style={{ fontFamily: LC.display, fontSize: 20, color: '#fff', marginTop: 2 }}>CALC 2 P-SET</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: LC.mono, fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: 1.5 }}>DURATION</div>
                <div style={{ fontFamily: LC.display, fontSize: 20, color: '#fff', marginTop: 2 }}>00:42:18</div>
              </div>
            </div>
            {/* scrubber */}
            <div style={{ marginTop: 10, height: 3, background: 'rgba(255,255,255,0.2)', borderRadius: 2, position: 'relative' }}>
              <div style={{ width: '0%', height: '100%', background: '#fff', borderRadius: 2 }}/>
              <div style={{ position: 'absolute', top: -4, left: 0, width: 11, height: 11, borderRadius: 6, background: '#fff' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: LC.mono, fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>
              <span>0:00</span><span>0:21</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ padding: '18px 16px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <button style={{
            padding: '16px 0', borderRadius: 14, background: LC.bgCard, border: `1px solid ${LC.border}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={LC.text} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 1.5, color: LC.text }}>SAVE TO PHOTOS</span>
          </button>
          <button style={{
            padding: '16px 0', borderRadius: 14, background: LC.red, border: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 1.5, color: '#fff' }}>SHARE FLEX</span>
          </button>
        </div>

        <button style={{
          margin: '8px 16px 0', padding: '14px 0', borderRadius: 14,
          background: 'transparent', border: `1px solid ${LC.border}`,
          fontFamily: LC.mono, fontSize: 11, letterSpacing: 1.5, color: LC.textDim,
        }}>CONTINUE → CLAIM 42 MIN</button>
      </div>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// REWARD — screen time receipt
// ═══════════════════════════════════════════════════════════
function LCReward() {
  // receipt edge
  const ReceiptEdge = ({ flip }) => (
    <svg width="100%" height="14" viewBox="0 0 300 14" preserveAspectRatio="none" style={{ display: 'block', transform: flip ? 'scaleY(-1)' : 'none' }}>
      <path d="M0 0 L300 0 L300 14 L292 4 L284 14 L276 4 L268 14 L260 4 L252 14 L244 4 L236 14 L228 4 L220 14 L212 4 L204 14 L196 4 L188 14 L180 4 L172 14 L164 4 L156 14 L148 4 L140 14 L132 4 L124 14 L116 4 L108 14 L100 4 L92 14 L84 4 L76 14 L68 4 L60 14 L52 4 L44 14 L36 4 L28 14 L20 4 L12 14 L4 4 L0 14 Z" fill={LC.paper}/>
    </svg>
  );

  return (
    <LCPhone>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 30%, rgba(255,59,48,0.15), transparent 60%), #0a0a0a`,
      }}/>

      {/* "COOKING" banner */}
      <div style={{ position: 'absolute', top: 70, left: 0, right: 0, textAlign: 'center', zIndex: 5 }}>
        <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 3, color: LC.red, fontWeight: 600 }}>◆ SESSION COMPLETE ◆</div>
        <div style={{ fontFamily: LC.display, fontSize: 36, color: LC.text, marginTop: 6, letterSpacing: 1 }}>YOU'RE COOKING.</div>
      </div>

      {/* Receipt */}
      <div style={{
        position: 'absolute', top: 180, left: '50%', transform: 'translateX(-50%) rotate(-2deg)',
        width: 280, zIndex: 10,
        filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.6))',
      }}>
        <ReceiptEdge/>
        <div style={{
          background: LC.paper, color: '#1a1510',
          padding: '20px 22px', fontFamily: LC.mono, fontSize: 11, lineHeight: 1.5,
          position: 'relative',
        }}>
          {/* header */}
          <div style={{ textAlign: 'center', borderBottom: '1px dashed #1a1510', paddingBottom: 12, marginBottom: 12 }}>
            <div style={{ fontFamily: LC.display, fontSize: 20, letterSpacing: 3 }}>LOCKIN CLUB</div>
            <div style={{ fontSize: 9, letterSpacing: 1.5, marginTop: 3, opacity: 0.7 }}>— SCREEN TIME RECEIPT —</div>
            <div style={{ fontSize: 9, marginTop: 4, opacity: 0.7 }}>APR 23 2026 · 14:28</div>
          </div>

          {/* line items */}
          {[
            ['SESSION', '00:42:18'],
            ['MODE', 'TIMELAPSE'],
            ['TASK', 'CALC 2 P-SET'],
            ['STREAK BONUS', '+5 MIN'],
            ['MEDAL BONUS', '+0 MIN'],
          ].map(([k,v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, lineHeight: 1.7, gap: 12 }}>
              <span style={{ whiteSpace: 'nowrap' }}>{k}</span><span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{v}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px dashed #1a1510', margin: '12px 0', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
              <span style={{ fontSize: 10, letterSpacing: 1, whiteSpace: 'nowrap' }}>TOTAL EARNED</span>
              <span style={{ fontFamily: LC.display, fontSize: 28, lineHeight: 1, color: LC.redDeep, whiteSpace: 'nowrap' }}>47 MIN</span>
            </div>
          </div>

          {/* barcode */}
          <div style={{ marginTop: 12, display: 'flex', gap: 1, justifyContent: 'center', alignItems: 'flex-end', height: 36 }}>
            {Array.from({length: 46}).map((_,i) => (
              <div key={i} style={{
                width: 1 + (i%4 === 0 ? 2 : 0),
                height: 28 + (i%3) * 4,
                background: '#1a1510',
              }}/>
            ))}
          </div>
          <div style={{ textAlign: 'center', fontSize: 9, marginTop: 4, letterSpacing: 2 }}>#00042318-KAI</div>

          <div style={{ textAlign: 'center', marginTop: 10, fontSize: 9, opacity: 0.65, letterSpacing: 1 }}>
            KEEP GRINDING · NO REFUNDS
          </div>
        </div>
        <ReceiptEdge flip/>
      </div>

      {/* Claim CTA */}
      <div style={{ position: 'absolute', bottom: 60, left: 20, right: 20, zIndex: 15 }}>
        <button style={{
          width: '100%', padding: '18px 0', borderRadius: 14,
          background: LC.red, border: 'none',
          fontFamily: LC.display, fontSize: 18, letterSpacing: 2, color: '#fff',
          boxShadow: `0 10px 30px ${LC.redGlow}`,
        }}>CLAIM 47 MIN ✓</button>
        <div style={{ textAlign: 'center', marginTop: 10, fontFamily: LC.mono, fontSize: 10, color: LC.textMute, letterSpacing: 1 }}>
          APPS UNLOCK UNTIL 15:15
        </div>
      </div>
    </LCPhone>
  );
}

Object.assign(window, { LCHome, LCTimer, LCTimelapse, LCPreview, LCReward });
