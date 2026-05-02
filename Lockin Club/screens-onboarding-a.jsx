// Lockin Club — Onboarding screens (part A)
// 01 Splash/Hook · 02 Social proof · 03 Your bad receipt · 04 The deal

// Shared: progress dots
function LCOnbProgress({ step, total = 8, style = {} }) {
  return (
    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', ...style }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 20 : 5, height: 5, borderRadius: 3,
          background: i === step ? LC.red : (i < step ? 'rgba(244,241,234,0.4)' : 'rgba(244,241,234,0.12)'),
          transition: 'all 0.2s',
        }}/>
      ))}
    </div>
  );
}

// Shared: big CTA + skip
function LCOnbCTA({ label = 'CONTINUE', skip = null, onPress, solid = true }) {
  return (
    <div style={{ position: 'absolute', bottom: 30, left: 20, right: 20, zIndex: 20 }}>
      <button style={{
        width: '100%', padding: '18px 0', borderRadius: 14,
        background: solid ? LC.red : 'transparent',
        border: solid ? 'none' : `1px solid ${LC.borderStrong}`,
        fontFamily: LC.display, fontSize: 18, letterSpacing: 2, color: '#fff',
        boxShadow: solid ? `0 10px 30px ${LC.redGlow}` : 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        {label}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {skip && (
        <div style={{ textAlign: 'center', marginTop: 14, fontFamily: LC.mono, fontSize: 10, color: LC.textMute, letterSpacing: 1.5 }}>
          {skip}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// 01 · SPLASH — the hook
// ═══════════════════════════════════════════════════════════
function LCOnb01Splash() {
  return (
    <LCPhone>
      {/* ambient glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 40%, rgba(255,59,48,0.22), transparent 55%)`,
      }}/>
      {/* subtle grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.5,
        backgroundImage: `linear-gradient(${LC.border} 1px, transparent 1px), linear-gradient(90deg, ${LC.border} 1px, transparent 1px)`,
        backgroundSize: '32px 32px',
        maskImage: 'radial-gradient(ellipse at 50% 50%, #000 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, #000 30%, transparent 75%)',
      }}/>

      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', paddingTop: 72 }}>
        {/* Brand badge */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.3)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: 3, background: LC.red, boxShadow: `0 0 8px ${LC.red}` }}/>
            <span style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2.5, color: LC.red, fontWeight: 700 }}>LOCKIN CLUB</span>
          </div>
        </div>

        {/* BIG HEADLINE */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 28px', marginTop: -40 }}>
          <div style={{
            fontFamily: LC.display, fontSize: 104, lineHeight: 0.82,
            letterSpacing: 1, color: LC.text, textAlign: 'center',
          }}>
            LOCK<br/>
            <span style={{ color: LC.red, textShadow: `0 0 40px ${LC.redGlow}` }}>IN</span><br/>
            OR LOSE.
          </div>
          <div style={{
            fontFamily: LC.body, fontSize: 15, color: LC.textDim,
            textAlign: 'center', marginTop: 22, lineHeight: 1.4, padding: '0 20px',
          }}>
            The only app that pays you in screen time — but only if you <span style={{ color: LC.text, fontWeight: 600 }}>actually grind</span>.
          </div>

          {/* Mini receipt flex — rotated */}
          <div style={{
            marginTop: 28, alignSelf: 'center',
            transform: 'rotate(-3deg)',
            filter: 'drop-shadow(0 12px 28px rgba(0,0,0,0.5))',
            width: 210,
          }}>
            <div style={{
              background: LC.paper, color: '#1a1510',
              padding: '10px 14px', fontFamily: LC.mono, fontSize: 10, lineHeight: 1.5,
            }}>
              <div style={{ textAlign: 'center', fontFamily: LC.display, fontSize: 14, letterSpacing: 2 }}>LOCKIN RECEIPT</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 9 }}>
                <span>SESSION</span><span>02:43:00</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4, paddingTop: 6, borderTop: '1px dashed #1a1510' }}>
                <span style={{ fontSize: 9 }}>EARNED</span>
                <span style={{ fontFamily: LC.display, fontSize: 18, color: LC.redDeep }}>2H 43M</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div style={{ padding: '0 20px 40px' }}>
          <button style={{
            width: '100%', padding: '18px 0', borderRadius: 14,
            background: LC.red, border: 'none',
            fontFamily: LC.display, fontSize: 20, letterSpacing: 2.5, color: '#fff',
            boxShadow: `0 12px 32px ${LC.redGlow}`,
          }}>I'M LOCKING IN →</button>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: LC.mono, fontSize: 10, color: LC.textMute, letterSpacing: 1.2 }}>ALREADY A MEMBER?</span>
            <span style={{ fontFamily: LC.mono, fontSize: 10, color: LC.red, letterSpacing: 1.5, fontWeight: 700 }}>SIGN IN</span>
          </div>
        </div>
      </div>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// 02 · SOCIAL PROOF — big numbers + faces
// ═══════════════════════════════════════════════════════════
function LCOnb02Proof() {
  const testimonials = [
    { n: 'tyler.k', h: '4.2H', q: 'pulled a 4.2 my first day. mid no more.' },
    { n: 'mayajpg', h: '3.1H', q: 'dean\'s list. this app is a cheat code.' },
    { n: 'kai', h: '23D', q: 'broke my tiktok scroll with this. lmao never.' },
  ];

  return (
    <LCPhone>
      <div style={{ paddingTop: 54, paddingBottom: 120, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Top nav */}
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{
            width: 34, height: 34, borderRadius: 17, background: LC.bgCard,
            border: `1px solid ${LC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={LC.text} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <LCOnbProgress step={1}/>
          <div style={{ width: 34 }}/>
        </div>

        {/* eyebrow */}
        <div style={{ padding: '18px 24px 0' }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2.5, color: LC.red, fontWeight: 700 }}>◆ YOU'RE NOT ALONE</div>
          <div style={{ fontFamily: LC.display, fontSize: 46, lineHeight: 0.92, color: LC.text, letterSpacing: 0.5, marginTop: 10 }}>
            THE CLUB IS<br/><span style={{ color: LC.red }}>COOKING.</span>
          </div>
        </div>

        {/* Hero number */}
        <div style={{ padding: '22px 24px 0' }}>
          <div style={{
            padding: 18, borderRadius: 16,
            background: `linear-gradient(180deg, #161616, #0d0d0d)`,
            border: `1px solid ${LC.border}`, position: 'relative', overflow: 'hidden',
          }}>
            {/* faint grid bg */}
            <div style={{
              position: 'absolute', inset: 0, opacity: 0.4,
              backgroundImage: `linear-gradient(${LC.border} 1px, transparent 1px), linear-gradient(90deg, ${LC.border} 1px, transparent 1px)`,
              backgroundSize: '20px 20px',
            }}/>
            <div style={{ position: 'relative' }}>
              <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute }}>HOURS LOCKED · ALL-TIME</div>
              <div style={{ fontFamily: LC.display, fontSize: 72, lineHeight: 0.88, color: LC.text, letterSpacing: -1, marginTop: 6 }}>
                23.4<span style={{ color: LC.red }}>M</span>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                <div style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: `1px solid ${LC.border}` }}>
                  <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.2, color: LC.textMute }}>MEMBERS</div>
                  <div style={{ fontFamily: LC.display, fontSize: 20, color: LC.text, marginTop: 2 }}>412K</div>
                </div>
                <div style={{ flex: 1, padding: 10, borderRadius: 8, background: 'rgba(0,0,0,0.4)', border: `1px solid ${LC.border}` }}>
                  <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.2, color: LC.textMute }}>LIVE NOW</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                    <div style={{ fontFamily: LC.display, fontSize: 20, color: LC.text, marginTop: 2 }}>8,422</div>
                    <div style={{ width: 5, height: 5, borderRadius: 3, background: LC.red, boxShadow: `0 0 6px ${LC.red}` }}/>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial list */}
        <div style={{ padding: '16px 24px 0', overflow: 'hidden', flex: 1 }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2, color: LC.textMute, marginBottom: 10 }}>◆ IN THEIR WORDS</div>
          {testimonials.map((t, i) => (
            <div key={i} style={{
              display: 'flex', gap: 10, alignItems: 'flex-start',
              padding: '12px 14px', marginBottom: 8, borderRadius: 12,
              background: LC.bgCard, border: `1px solid ${LC.border}`,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 18, flexShrink: 0,
                background: `linear-gradient(135deg, ${['#ff3b30','#fbbf24','#4ade80'][i]}, #1a1a1a)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: LC.display, fontSize: 16, color: '#fff',
              }}>{t.n[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'baseline' }}>
                  <span style={{ fontFamily: LC.body, fontSize: 13, fontWeight: 600, color: LC.text }}>@{t.n}</span>
                  <LCChip tone="red" style={{ padding: '2px 6px', fontSize: 9 }}>🔥 {t.h}</LCChip>
                </div>
                <div style={{ fontFamily: LC.body, fontSize: 13, color: LC.textDim, marginTop: 2, lineHeight: 1.3 }}>"{t.q}"</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <LCOnbCTA label="KEEP GOING" skip="4.9 ★ · 82K REVIEWS"/>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// 03 · AGITATION — your bad receipt (last 24h screen time shame)
// ═══════════════════════════════════════════════════════════
function LCOnb03Shame() {
  const apps = [
    { n: 'TikTok', h: '3H 14M', w: '88%', c: '#ff3b7f' },
    { n: 'Instagram', h: '2H 02M', w: '56%', c: '#c13584' },
    { n: 'Snapchat', h: '1H 18M', w: '36%', c: '#fffc00' },
    { n: 'YouTube', h: '1H 01M', w: '28%', c: '#ff3b30' },
    { n: 'Messages', h: '0H 42M', w: '19%', c: '#4ade80' },
  ];
  return (
    <LCPhone>
      <div style={{ paddingTop: 54, paddingBottom: 120, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Top nav */}
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{
            width: 34, height: 34, borderRadius: 17, background: LC.bgCard,
            border: `1px solid ${LC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={LC.text} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <LCOnbProgress step={2}/>
          <div style={{ width: 34 }}/>
        </div>

        {/* Title */}
        <div style={{ padding: '18px 24px 0' }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2.5, color: LC.red, fontWeight: 700 }}>◆ LAST 24 HOURS · BE HONEST</div>
          <div style={{ fontFamily: LC.display, fontSize: 44, lineHeight: 0.9, color: LC.text, letterSpacing: 0.5, marginTop: 10 }}>
            YOUR PHONE<br/><span style={{ color: LC.red }}>ATE 8H 17M.</span>
          </div>
          <div style={{ fontFamily: LC.body, fontSize: 13, color: LC.textDim, marginTop: 10, lineHeight: 1.4 }}>
            That's <span style={{ color: LC.text, fontWeight: 600 }}>2,486 hours a year</span>. A full-time job. Worth of scroll. Gone.
          </div>
        </div>

        {/* Pie + legend */}
        <div style={{ padding: '20px 24px 0', flex: 1 }}>
          <div style={{
            padding: 18, borderRadius: 16, background: LC.bgCard, border: `1px solid ${LC.border}`,
          }}>
            {/* Giant hours */}
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.textMute }}>TOTAL DAMAGE</div>
                <div style={{ fontFamily: LC.display, fontSize: 54, lineHeight: 0.9, color: LC.red, letterSpacing: -1, textShadow: `0 0 24px ${LC.redGlow}` }}>8:17</div>
              </div>
              <div style={{ fontFamily: LC.mono, fontSize: 9, color: LC.textMute, letterSpacing: 1.5, textAlign: 'right' }}>
                <div>↑ 12% WOW</div>
                <div style={{ color: LC.red, marginTop: 2 }}>WORSE THAN 82%</div>
              </div>
            </div>

            {/* App bars */}
            <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {apps.map(a => (
                <div key={a.n}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: LC.mono, fontSize: 10, color: LC.textDim, letterSpacing: 0.8, marginBottom: 3 }}>
                    <span>{a.n.toUpperCase()}</span><span style={{ color: LC.text }}>{a.h}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', overflow: 'hidden' }}>
                    <div style={{ width: a.w, height: '100%', background: a.c, opacity: 0.85 }}/>
                  </div>
                </div>
              ))}
            </div>

            {/* Receipt stamp */}
            <div style={{
              marginTop: 14, padding: '10px 12px', borderRadius: 8,
              background: 'rgba(255,59,48,0.08)', border: '1px dashed rgba(255,59,48,0.3)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <div style={{ fontSize: 18 }}>💀</div>
              <div style={{ fontFamily: LC.body, fontSize: 12, color: LC.text, lineHeight: 1.3 }}>
                We're about to flip this. <span style={{ color: LC.red, fontWeight: 600 }}>Every minute you earn, you own.</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <LCOnbCTA label="OK I'M IN TROUBLE"/>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// 04 · THE DEAL — how the 1:1 swap works
// ═══════════════════════════════════════════════════════════
function LCOnb04Deal() {
  return (
    <LCPhone>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 20%, rgba(255,59,48,0.15), transparent 55%)`,
      }}/>

      <div style={{ position: 'relative', paddingTop: 54, paddingBottom: 120, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {/* Top nav */}
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{
            width: 34, height: 34, borderRadius: 17, background: LC.bgCard,
            border: `1px solid ${LC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={LC.text} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <LCOnbProgress step={3}/>
          <div style={{ width: 34 }}/>
        </div>

        <div style={{ padding: '16px 24px 0' }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2.5, color: LC.red, fontWeight: 700 }}>◆ THE DEAL</div>
          <div style={{ fontFamily: LC.display, fontSize: 42, lineHeight: 0.9, color: LC.text, letterSpacing: 0.5, marginTop: 10 }}>
            GRIND 1 MIN,<br/>EARN <span style={{ color: LC.red }}>1 MIN</span>.
          </div>
        </div>

        {/* Big swap visual */}
        <div style={{ padding: '20px 20px 0', flex: 1 }}>
          <div style={{
            padding: '20px 18px', borderRadius: 20,
            background: LC.bgCard, border: `1px solid ${LC.border}`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* top: you grind */}
            <div style={{
              padding: 16, borderRadius: 14, background: '#0a0a0a',
              border: `1px solid ${LC.border}`,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 26,
                background: `radial-gradient(circle, #1a1a1a, #0a0a0a)`,
                border: `2px solid ${LC.red}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 0 18px ${LC.redGlow}`,
              }}>
                <div style={{ fontFamily: LC.display, fontSize: 14, color: LC.red }}>60:00</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.textMute }}>STEP 01</div>
                <div style={{ fontFamily: LC.display, fontSize: 22, color: LC.text, letterSpacing: 0.5, marginTop: 2 }}>YOU LOCK IN</div>
                <div style={{ fontFamily: LC.body, fontSize: 12, color: LC.textDim, marginTop: 2 }}>Camera rolls · apps freeze</div>
              </div>
            </div>

            {/* arrow */}
            <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 20,
                background: LC.red, display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 4px 16px ${LC.redGlow}`,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12l7 7 7-7" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>

            {/* bottom: receipt */}
            <div style={{
              padding: 16, borderRadius: 14, background: LC.paper,
              color: '#1a1510', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 52, height: 52, borderRadius: 26,
                background: '#0a0a0a', color: LC.red,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: LC.display, fontSize: 18, letterSpacing: 0.5,
              }}>+60</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, opacity: 0.7 }}>STEP 02</div>
                <div style={{ fontFamily: LC.display, fontSize: 22, letterSpacing: 0.5, marginTop: 2 }}>YOU EARN 60 MIN</div>
                <div style={{ fontFamily: LC.body, fontSize: 12, opacity: 0.7, marginTop: 2 }}>Banked · yours to spend</div>
              </div>
            </div>

            {/* faint tick pattern right */}
            <div style={{
              position: 'absolute', right: -30, top: 0, bottom: 0, width: 60, opacity: 0.12,
              backgroundImage: `repeating-linear-gradient(45deg, ${LC.red} 0, ${LC.red} 1px, transparent 1px, transparent 8px)`,
            }}/>
          </div>

          {/* proof row */}
          <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { k: 'APPS LOCKED', v: 'TT, IG, SNAP' },
              { k: 'STREAK BONUS', v: '+5 MIN/DAY' },
              { k: 'NO GRIND', v: 'NO SCROLL' },
            ].map(s => (
              <div key={s.k} style={{ padding: 10, borderRadius: 10, background: LC.bgCard, border: `1px solid ${LC.border}` }}>
                <div style={{ fontFamily: LC.mono, fontSize: 8, letterSpacing: 1.2, color: LC.textMute }}>{s.k}</div>
                <div style={{ fontFamily: LC.display, fontSize: 13, color: LC.text, marginTop: 3, letterSpacing: 0.5 }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <LCOnbCTA label="I GET IT. NEXT."/>
    </LCPhone>
  );
}

Object.assign(window, {
  LCOnbProgress, LCOnbCTA,
  LCOnb01Splash, LCOnb02Proof, LCOnb03Shame, LCOnb04Deal,
});
