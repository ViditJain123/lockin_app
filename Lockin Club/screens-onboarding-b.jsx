// Lockin Club — Onboarding screens (part B)
// 05 Pick your grind · 06 Set target · 07 Apps to lock · 08 Permissions · 09 First grind

// ═══════════════════════════════════════════════════════════
// 05 · PICK YOUR GRIND — what are you locking in for?
// ═══════════════════════════════════════════════════════════
function LCOnb05Grind() {
  const options = [
    { k: 'SCHOOL', v: 'Studying · p-sets · papers', icon: '📚', sel: true },
    { k: 'WORK', v: 'Deep focus · shipping', icon: '💼' },
    { k: 'GYM', v: 'Lifts · runs · conditioning', icon: '🏋️' },
    { k: 'CREATING', v: 'Writing · design · code', icon: '✍️' },
    { k: 'READING', v: 'Books · long-form', icon: '📖' },
    { k: 'OTHER', v: 'Whatever YOU grind on', icon: '◆' },
  ];
  return (
    <LCPhone>
      <div style={{ paddingTop: 54, paddingBottom: 120, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{ width: 34, height: 34, borderRadius: 17, background: LC.bgCard, border: `1px solid ${LC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={LC.text} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <LCOnbProgress step={4}/>
          <div style={{ width: 34 }}/>
        </div>

        <div style={{ padding: '18px 24px 0' }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2.5, color: LC.red, fontWeight: 700 }}>◆ PERSONALIZE · STEP 01/03</div>
          <div style={{ fontFamily: LC.display, fontSize: 42, lineHeight: 0.9, color: LC.text, letterSpacing: 0.5, marginTop: 10 }}>
            WHAT'S YOUR<br/><span style={{ color: LC.red }}>POISON?</span>
          </div>
          <div style={{ fontFamily: LC.body, fontSize: 13, color: LC.textDim, marginTop: 8, lineHeight: 1.4 }}>
            Pick one. We'll tune the receipts, medals, and leaderboards to your thing.
          </div>
        </div>

        <div style={{ padding: '18px 20px 0', flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {options.map(o => (
              <div key={o.k} style={{
                padding: '14px 12px', borderRadius: 14,
                background: o.sel ? 'rgba(255,59,48,0.1)' : LC.bgCard,
                border: `1px solid ${o.sel ? 'rgba(255,59,48,0.5)' : LC.border}`,
                position: 'relative', minHeight: 104,
                boxShadow: o.sel ? `0 6px 20px ${LC.redGlow}` : 'none',
              }}>
                {o.sel && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 18, height: 18, borderRadius: 9, background: LC.red,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                )}
                <div style={{ fontSize: 24 }}>{o.icon}</div>
                <div style={{ fontFamily: LC.display, fontSize: 22, color: LC.text, letterSpacing: 0.5, marginTop: 8, lineHeight: 1 }}>{o.k}</div>
                <div style={{ fontFamily: LC.body, fontSize: 11, color: LC.textDim, marginTop: 4, lineHeight: 1.3 }}>{o.v}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 14, textAlign: 'center', fontFamily: LC.mono, fontSize: 9, color: LC.textMute, letterSpacing: 1.2 }}>
            YOU CAN ADD MORE LATER
          </div>
        </div>
      </div>
      <LCOnbCTA label="LOCK IT IN"/>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// 06 · SET TARGET — daily goal commit
// ═══════════════════════════════════════════════════════════
function LCOnb06Target() {
  const picked = 4; // hours
  const opts = [1, 2, 3, 4, 5, 6];
  return (
    <LCPhone>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 30%, rgba(255,59,48,0.12), transparent 55%)`,
      }}/>
      <div style={{ position: 'relative', paddingTop: 54, paddingBottom: 120, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{ width: 34, height: 34, borderRadius: 17, background: LC.bgCard, border: `1px solid ${LC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={LC.text} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <LCOnbProgress step={5}/>
          <div style={{ width: 34 }}/>
        </div>

        <div style={{ padding: '18px 24px 0' }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2.5, color: LC.red, fontWeight: 700 }}>◆ PERSONALIZE · STEP 02/03</div>
          <div style={{ fontFamily: LC.display, fontSize: 40, lineHeight: 0.9, color: LC.text, letterSpacing: 0.5, marginTop: 10 }}>
            SET YOUR<br/>DAILY <span style={{ color: LC.red }}>TARGET.</span>
          </div>
        </div>

        {/* Big target card */}
        <div style={{ padding: '20px 20px 0' }}>
          <div style={{
            padding: 22, borderRadius: 20,
            background: `linear-gradient(180deg, #161616, #0d0d0d)`,
            border: `1px solid rgba(255,59,48,0.3)`,
            boxShadow: `0 12px 30px ${LC.redGlow}`,
            textAlign: 'center', position: 'relative', overflow: 'hidden',
          }}>
            {/* radial tick bg */}
            <svg width="260" height="130" viewBox="0 0 260 130" style={{ position: 'absolute', left: '50%', top: 12, transform: 'translateX(-50%)', opacity: 0.4 }}>
              {Array.from({length: 37}).map((_,i) => {
                const a = (180 + (i * 5)) * Math.PI / 180;
                const isMajor = i % 6 === 0;
                const r1 = 110;
                const r2 = isMajor ? 96 : 102;
                const x1 = 130 + Math.cos(a) * r1;
                const y1 = 120 + Math.sin(a) * r1;
                const x2 = 130 + Math.cos(a) * r2;
                const y2 = 120 + Math.sin(a) * r2;
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={isMajor ? LC.textDim : LC.textMute} strokeWidth={isMajor ? 1.5 : 0.8}/>;
              })}
            </svg>

            <div style={{ position: 'relative' }}>
              <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2.5, color: LC.textMute }}>DAILY LOCK-IN</div>
              <div style={{ fontFamily: LC.display, fontSize: 120, lineHeight: 0.85, color: LC.text, letterSpacing: -2, marginTop: 4 }}>
                {picked}<span style={{ color: LC.red }}>H</span>
              </div>
              <div style={{ fontFamily: LC.mono, fontSize: 10, color: LC.textDim, letterSpacing: 1.5, marginTop: -2 }}>= {picked*60} MIN · SCREEN TIME EARNED</div>
            </div>

            {/* hour pills */}
            <div style={{ display: 'flex', gap: 6, marginTop: 18, justifyContent: 'center', flexWrap: 'wrap' }}>
              {opts.map(h => {
                const sel = h === picked;
                return (
                  <div key={h} style={{
                    padding: '8px 12px', borderRadius: 8,
                    background: sel ? LC.red : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${sel ? LC.red : LC.border}`,
                    fontFamily: LC.display, fontSize: 16, letterSpacing: 0.5,
                    color: sel ? '#fff' : LC.textDim,
                    minWidth: 40, textAlign: 'center',
                  }}>{h}H</div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Commit card */}
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{
            padding: 14, borderRadius: 12, background: LC.bgCard, border: `1px solid ${LC.border}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 4, border: `1.5px solid ${LC.red}`,
                background: 'rgba(255,59,48,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2.5 6l2.5 2.5 4.5-5" stroke={LC.red} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: LC.body, fontSize: 13, color: LC.text, lineHeight: 1.35, fontWeight: 500 }}>
                  I'm committing to <span style={{ color: LC.red }}>4 hours / day</span>. No excuses.
                </div>
                <div style={{ fontFamily: LC.mono, fontSize: 10, color: LC.textMute, letterSpacing: 1.2, marginTop: 4 }}>
                  MISS A DAY · STREAK DIES
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LCOnbCTA label="I COMMIT"/>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// 07 · APPS TO LOCK — pick poison
// ═══════════════════════════════════════════════════════════
function LCOnb07Apps() {
  const apps = [
    { n: 'TikTok', h: '3H 14M', c: '#ff3b7f', sel: true, glyph: 'TT' },
    { n: 'Instagram', h: '2H 02M', c: '#c13584', sel: true, glyph: 'IG' },
    { n: 'Snapchat', h: '1H 18M', c: '#fbbf24', sel: true, glyph: 'SN' },
    { n: 'YouTube', h: '1H 01M', c: '#ff3b30', sel: false, glyph: 'YT' },
    { n: 'Twitter/X', h: '0H 48M', c: '#1a1a1a', sel: false, glyph: 'X' },
    { n: 'Reddit', h: '0H 32M', c: '#ff4500', sel: false, glyph: 'RD' },
    { n: 'Discord', h: '0H 28M', c: '#5865f2', sel: false, glyph: 'DC' },
    { n: 'BeReal', h: '0H 14M', c: '#0a0a0a', sel: false, glyph: 'BR' },
  ];
  return (
    <LCPhone>
      <div style={{ paddingTop: 54, paddingBottom: 120, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{ width: 34, height: 34, borderRadius: 17, background: LC.bgCard, border: `1px solid ${LC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={LC.text} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <LCOnbProgress step={6}/>
          <div style={{ width: 34 }}/>
        </div>

        <div style={{ padding: '18px 24px 0' }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2.5, color: LC.red, fontWeight: 700 }}>◆ PERSONALIZE · STEP 03/03</div>
          <div style={{ fontFamily: LC.display, fontSize: 40, lineHeight: 0.9, color: LC.text, letterSpacing: 0.5, marginTop: 10 }}>
            WHAT GETS<br/><span style={{ color: LC.red }}>FROZEN?</span>
          </div>
          <div style={{ fontFamily: LC.body, fontSize: 13, color: LC.textDim, marginTop: 8, lineHeight: 1.4 }}>
            These apps lock until you earn them. Tap to arm.
          </div>
        </div>

        {/* Selection summary */}
        <div style={{ padding: '14px 20px 0' }}>
          <div style={{
            padding: '10px 12px', borderRadius: 10,
            background: 'rgba(255,59,48,0.08)', border: '1px solid rgba(255,59,48,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.red }}>ARMED · 3 APPS</div>
              <div style={{ fontFamily: LC.display, fontSize: 18, color: LC.text, letterSpacing: 0.5, marginTop: 2 }}>6H 34M TO RECLAIM / DAY</div>
            </div>
            <div style={{ fontSize: 22 }}>🔒</div>
          </div>
        </div>

        <div style={{ padding: '12px 20px 0', flex: 1, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {apps.map(a => (
              <div key={a.n} style={{
                padding: '10px 12px', borderRadius: 12,
                background: a.sel ? 'rgba(255,59,48,0.08)' : LC.bgCard,
                border: `1px solid ${a.sel ? 'rgba(255,59,48,0.4)' : LC.border}`,
                display: 'flex', alignItems: 'center', gap: 10,
                position: 'relative',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: a.c,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: LC.display, fontSize: 12, color: '#fff',
                  border: `1px solid rgba(255,255,255,0.1)`,
                  letterSpacing: 0.5,
                }}>{a.glyph}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: LC.body, fontSize: 12, color: LC.text, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.n}</div>
                  <div style={{ fontFamily: LC.mono, fontSize: 9, color: LC.textMute, letterSpacing: 0.8 }}>{a.h}</div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: 10,
                  border: `1.5px solid ${a.sel ? LC.red : LC.borderStrong}`,
                  background: a.sel ? LC.red : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {a.sel && <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <LCOnbCTA label="ARM THE LOCKS" skip="YOU CAN CHANGE THESE ANYTIME"/>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// 08 · PERMISSIONS primer
// ═══════════════════════════════════════════════════════════
function LCOnb08Perms() {
  const perms = [
    { n: 'Screen Time', v: 'To freeze apps during grinds', icon: '🔒', req: true },
    { n: 'Camera', v: 'For timelapse receipts', icon: '🎥', req: true },
    { n: 'Notifications', v: 'Streak reminders · only when they matter', icon: '🔔', req: false },
  ];
  return (
    <LCPhone>
      <div style={{ paddingTop: 54, paddingBottom: 120, height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button style={{ width: 34, height: 34, borderRadius: 17, background: LC.bgCard, border: `1px solid ${LC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke={LC.text} strokeWidth="2" strokeLinecap="round"/></svg>
          </button>
          <LCOnbProgress step={7}/>
          <div style={{ width: 34 }}/>
        </div>

        <div style={{ padding: '18px 24px 0' }}>
          <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2.5, color: LC.red, fontWeight: 700 }}>◆ ONE LAST THING</div>
          <div style={{ fontFamily: LC.display, fontSize: 44, lineHeight: 0.9, color: LC.text, letterSpacing: 0.5, marginTop: 10 }}>
            ARM THE<br/>TRAPS.
          </div>
          <div style={{ fontFamily: LC.body, fontSize: 13, color: LC.textDim, marginTop: 8, lineHeight: 1.4 }}>
            Lockin Club can't enforce without these. iOS will ask next — say yes.
          </div>
        </div>

        <div style={{ padding: '22px 20px 0', flex: 1 }}>
          {perms.map((p, i) => (
            <div key={p.n} style={{
              padding: 14, borderRadius: 14, marginBottom: 8,
              background: LC.bgCard, border: `1px solid ${LC.border}`,
              display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, flexShrink: 0,
                background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22,
              }}>{p.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontFamily: LC.display, fontSize: 20, color: LC.text, letterSpacing: 0.5 }}>{p.n.toUpperCase()}</span>
                  {p.req && <LCChip tone="red" style={{ padding: '2px 5px', fontSize: 8 }}>REQ'D</LCChip>}
                </div>
                <div style={{ fontFamily: LC.body, fontSize: 12, color: LC.textDim, marginTop: 2, lineHeight: 1.3 }}>{p.v}</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: 10,
                border: `1.5px solid ${LC.textMute}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: LC.textMute }}/>
              </div>
            </div>
          ))}

          {/* Privacy note */}
          <div style={{
            marginTop: 14, padding: '12px 14px', borderRadius: 12,
            border: `1px dashed ${LC.borderStrong}`, background: 'transparent',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ fontSize: 16, marginTop: -2 }}>🛡</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: LC.mono, fontSize: 9, letterSpacing: 1.5, color: LC.textMute }}>PRIVACY</div>
                <div style={{ fontFamily: LC.body, fontSize: 11, color: LC.textDim, marginTop: 2, lineHeight: 1.35 }}>
                  Timelapses stay on your phone unless YOU share. We never sell your data. Full stop.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <LCOnbCTA label="GRANT ACCESS"/>
    </LCPhone>
  );
}

// ═══════════════════════════════════════════════════════════
// 09 · FIRST GRIND — aha moment
// ═══════════════════════════════════════════════════════════
function LCOnb09First() {
  return (
    <LCPhone>
      {/* ambient glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at 50% 45%, rgba(255,59,48,0.2), transparent 55%)`,
      }}/>
      {/* grid */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.4,
        backgroundImage: `linear-gradient(${LC.border} 1px, transparent 1px), linear-gradient(90deg, ${LC.border} 1px, transparent 1px)`,
        backgroundSize: '28px 28px',
        maskImage: 'radial-gradient(ellipse at 50% 50%, #000 25%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 50%, #000 25%, transparent 75%)',
      }}/>

      <div style={{ position: 'relative', paddingTop: 72, paddingBottom: 120, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* top stamp */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '6px 12px', borderRadius: 999,
            background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2 2 4-4" stroke={LC.green} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
            <span style={{ fontFamily: LC.mono, fontSize: 10, color: LC.green, letterSpacing: 2, fontWeight: 700 }}>YOU'RE IN THE CLUB</span>
          </div>
        </div>

        {/* card */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 20px' }}>
          <div style={{
            width: '100%', padding: 22, borderRadius: 20,
            background: `linear-gradient(180deg, #161616, #0a0a0a)`,
            border: `1px solid rgba(255,59,48,0.3)`,
            boxShadow: `0 16px 40px ${LC.redGlow}`,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* 01 watermark */}
            <div style={{
              position: 'absolute', right: -8, top: -20,
              fontFamily: LC.display, fontSize: 180, lineHeight: 0.85,
              color: 'rgba(255,59,48,0.06)', letterSpacing: -6, pointerEvents: 'none',
            }}>01</div>

            <div style={{ position: 'relative' }}>
              <div style={{ fontFamily: LC.mono, fontSize: 10, letterSpacing: 2.5, color: LC.red }}>◆ SESSION 01</div>
              <div style={{ fontFamily: LC.display, fontSize: 54, lineHeight: 0.88, color: LC.text, letterSpacing: 0.5, marginTop: 10 }}>
                YOUR FIRST<br/><span style={{ color: LC.red }}>GRIND.</span>
              </div>
              <div style={{ fontFamily: LC.body, fontSize: 13, color: LC.textDim, marginTop: 12, lineHeight: 1.4 }}>
                We'll start small. 25 minutes. Camera rolls, apps freeze, receipt prints. That's the loop.
              </div>

              {/* summary card */}
              <div style={{
                marginTop: 18, padding: '14px 14px', borderRadius: 12,
                background: '#0a0a0a', border: `1px solid ${LC.border}`,
              }}>
                {[
                  ['TARGET', '25 MIN'],
                  ['MODE', 'TIMELAPSE'],
                  ['LOCKS', 'TT · IG · SNAP'],
                  ['REWARD', '+25 MIN'],
                ].map(([k,v], i) => (
                  <div key={k} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '7px 0',
                    borderTop: i === 0 ? 'none' : `1px dashed rgba(255,255,255,0.06)`,
                    fontFamily: LC.mono, fontSize: 10, letterSpacing: 1,
                  }}>
                    <span style={{ color: LC.textMute }}>{k}</span>
                    <span style={{ color: LC.text, fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA block */}
        <div style={{ padding: '0 20px' }}>
          <button style={{
            width: '100%', padding: '20px 0', borderRadius: 16,
            background: LC.red, border: 'none',
            fontFamily: LC.display, fontSize: 22, letterSpacing: 2.5, color: '#fff',
            boxShadow: `0 12px 36px ${LC.redGlow}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <div style={{ width: 14, height: 14, borderRadius: 7, background: '#fff' }}/>
            START RECORDING
          </button>
          <div style={{ textAlign: 'center', marginTop: 12, fontFamily: LC.mono, fontSize: 10, color: LC.textMute, letterSpacing: 1.5 }}>
            I'LL DO IT LATER
          </div>
        </div>
      </div>
    </LCPhone>
  );
}

Object.assign(window, {
  LCOnb05Grind, LCOnb06Target, LCOnb07Apps, LCOnb08Perms, LCOnb09First,
});
