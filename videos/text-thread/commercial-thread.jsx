const { CompositionStage, useComposition, Captions, Easing, clamp, useTweaks, TweaksPanel, TweakSection, TweakToggle } = window;

const C = { bg: '#2B2A26', cream: '#FBF8F2', paper: '#F1ECE2', ink: '#2B2A26', muted: '#6B665C', green: '#2F4A3A', amber: '#D9B384', rule: '#E2DBCD', dim: '#B9B2A5' };
const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = 'Arial, Helvetica, sans-serif';
const MOTION = {
  enter: (T, s, d = 0.8) => Easing.easeOutCubic(clamp((T - s) / d, 0, 1)),
  exit: (T, s, d = 0.6) => Easing.easeInCubic(clamp((T - s) / d, 0, 1)),
  drift: (T, s, e) => clamp((T - s) / (e - s), 0, 1),
};
const abs = { position: 'absolute' };

function Dots({ T }) {
  return (
    <div style={{ display: 'flex', gap: 8, padding: '22px 24px', background: C.rule, borderRadius: 26, alignSelf: 'flex-start' }}>
      {[0, 1, 2].map(i => <div key={i} style={{ width: 12, height: 12, borderRadius: 6, background: C.muted, opacity: 0.35 + 0.65 * Math.max(0, Math.sin(T * 6 - i * 0.9)) }}></div>)}
    </div>
  );
}

function Bubble({ T, m, until }) {
  const a = MOTION.enter(T, m.at, 0.45);
  const gone = until != null ? MOTION.exit(T, until, 0.4) : 0;
  const me = m.from === 'me';
  if (T < m.at) return null;
  return (
    <div style={{ maxHeight: 200 * a * (1 - gone), opacity: a * (1 - gone), overflow: 'hidden', display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', flex: 'none' }}>
      {m.dots
        ? (T < m.end ? <Dots T={T} /> : null)
        : <div style={{ maxWidth: 430, padding: '19px 27px', borderRadius: 24, background: me ? C.green : C.rule, color: me ? C.cream : C.ink,
            fontFamily: SANS, fontSize: 35, fontWeight: 'bold', lineHeight: 1.35, transform: `scale(${0.9 + 0.1 * a})`, transformOrigin: me ? '100% 100%' : '0% 100%' }}>{m.t}</div>}
    </div>
  );
}

function Phone() {
  const { T, CUES } = useComposition();
  const O = CUES.Opening, H = CUES.Thread, P = CUES.Plan, K = CUES.Close;
  const a = MOTION.enter(T, O + 0.2, 1.1), x = MOTION.exit(T, K - 0.2, 0.6);
  const push = 1 + 0.05 * MOTION.drift(T, O, P);
  const first = [
    { from: 'me', t: 'Do you know which bank Dad used?', at: H + 0.28 },
    { from: 'sam', dots: true, at: H + 1.38, end: H + 2.22 },
    { from: 'sam', t: 'No. Do you?', at: H + 2.22 },
    { from: 'me', t: 'The funeral home needs his insurance details', at: H + 3.69 },
    { from: 'me', t: 'I’ve been through every drawer', at: H + 5.17 },
    { from: 'sam', dots: true, at: H + 6.28, end: H + 7.20 },
    { from: 'sam', t: 'Did he even have a will?', at: H + 7.20 },
    { from: 'me', t: 'I think so?? Somewhere', at: H + 8.68 },
    { from: 'sam', t: 'What’s his phone passcode', at: H + 9.97 },
    { from: 'me', dots: true, at: H + 10.89, end: P - 0.2 },
  ];
  const second = [
    { from: 'me', t: 'Do you know which bank Dad used?', at: P + 1.8 },
    { from: 'sam', t: 'It’s all in his Just In Case plan. He shared it with us.', at: P + 3.0 },
    { from: 'me', t: 'Oh thank god', at: P + 4.8 },
  ];
  return (
    <div style={{ ...abs, left: 260, top: 60, width: 520, height: 960, opacity: a * (1 - x), transform: `translateY(${(1 - a) * 120}px) scale(${push})` }}>
      <div style={{ ...abs, inset: 0, borderRadius: 64, background: '#111', padding: 16, boxShadow: '0 40px 90px rgba(0,0,0,0.5)' }}>
        <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: 50, background: C.cream, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 'none', paddingTop: 58, paddingBottom: 18, textAlign: 'center', borderBottom: `1px solid ${C.rule}`, background: C.paper }}>
            <div style={{ width: 60, height: 60, borderRadius: 30, background: C.dim, margin: '0 auto 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontSize: 26, color: C.cream, fontWeight: 'bold' }}>S</div>
            <div style={{ fontFamily: SANS, fontSize: 22, color: C.ink }}>Sam</div>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 12, padding: '20px 22px 30px', overflow: 'hidden' }}>
            {first.map((m, i) => <Bubble key={'a' + i} T={T} m={m} until={P - 0.1} />)}
            {second.map((m, i) => <Bubble key={'b' + i} T={T} m={m} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Side() {
  const { T, CUES } = useComposition();
  const isMobile = window.matchMedia('(max-width: 640px)').matches;
  const O = CUES.Opening, H = CUES.Thread, S = CUES.Silence, P = CUES.Plan, K = CUES.Close;
  const lab = MOTION.enter(T, O + 1.0, 0.8) * (1 - MOTION.exit(T, S - 0.3, 0.5));
  const s1 = MOTION.enter(T, S + 0.3, 1.0) * (1 - MOTION.exit(T, P - 0.4, 0.5));
  const p1 = MOTION.enter(T, P + 0.2, 0.8) * (1 - MOTION.exit(T, K - 0.3, 0.5));
  const p2 = MOTION.enter(T, P + 5.6, 0.9) * (1 - MOTION.exit(T, K - 0.3, 0.5));
  const col = { ...abs, left: 920, width: 820 };
  const label = { ...col, left: isMobile ? 820 : col.left, width: isMobile ? 860 : col.width, top: isMobile ? 220 : 420, fontFamily: SANS, fontSize: isMobile ? 180 : 84, lineHeight: 1.1, letterSpacing: 3, textTransform: 'uppercase', color: C.amber, opacity: lab };
  return (
    <>
      <div style={label}>{isMobile ? <>Three<br />days<br />after the<br />funeral</> : <>Three days after<br />the funeral</>}</div>
      <div style={{ ...col, top: 400, fontFamily: SERIF, fontSize: 88, lineHeight: 1.15, color: C.cream, opacity: s1, transform: `translateY(${(1 - s1) * 24}px)` }}>No one could tell them where anything was.</div>
      <div style={{ ...col, top: 280, fontFamily: SERIF, fontStyle: 'italic', fontSize: 72, lineHeight: 1.15, color: C.amber, opacity: p1, transform: `translateY(${(1 - p1) * 24}px)` }}>What if Dad had<br />written it all down?</div>
      <div style={{ ...col, top: 480, fontFamily: SERIF, fontSize: 52, lineHeight: 1.3, color: C.cream, opacity: p2, transform: `translateY(${(1 - p2) * 20}px)` }}>Show your family where everything is. It only takes a few minutes a week.</div>
    </>
  );
}

function Close() {
  const { T, CUES } = useComposition();
  const K = CUES.Close;
  const a = MOTION.enter(T, K + 0.3, 0.9), b = MOTION.enter(T, K + 0.9, 0.9), c = MOTION.enter(T, K + 1.8, 0.8);
  const push = 1 + 0.03 * MOTION.drift(T, K, K + 5);
  return (
    <div style={{ ...abs, inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: 124, lineHeight: 1.1, color: C.cream, opacity: a, transform: a < 1 ? `translateY(${(1 - a) * 30}px)` : 'none' }}>Leave them with a plan,</div>
      <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 84, lineHeight: 1.2, textAlign: 'center', marginTop: 16, color: C.amber, opacity: b, transform: b < 1 ? `translateY(${(1 - b) * 30}px)` : 'none' }}>so you can take care of them,<br />one last time.</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26, marginTop: 70, opacity: c, transform: `translateY(${(1 - c) * 20}px)` }}>
        <div style={{ fontFamily: SERIF, fontSize: 44, color: C.cream }}>Just In Case</div>
        <div style={{ padding: '22px 44px', background: C.amber, borderRadius: 6, fontFamily: SANS, fontSize: 32, fontWeight: 'bold', color: C.ink, boxShadow: '0 10px 30px rgba(217,179,132,0.25)' }}>Start your plan at justincaseimdead.com</div>
      </div>
    </div>
  );
}

function Piece({ showCaptions }) {
  const { T, CUES } = useComposition();
  const S = CUES.Silence, P = CUES.Plan, K = CUES.Close;
  const lines = [
    { at: S + 0.3, until: P - 0.2, text: 'No one could tell them where anything was.' },
    { at: P + 5.6, until: K - 0.2, text: 'Just In Case helps you show your family where everything is. It only takes a few minutes a week.' },
    { at: K + 0.3, text: 'Leave them with a plan, so you can take care of them, one last time. Start yours at justincaseimdead.com.' },
  ];
  return (
    <div data-screen-label={`t=${Math.floor(T)}s`} style={{ ...abs, inset: 0, background: C.bg, overflow: 'hidden' }}>
      <Phone /><Side /><Close />
      {showCaptions && <Captions items={lines} style={{ bottom: '4.5%', font: `28px ${SANS}`, color: C.cream, textShadow: 'none', ...(T >= K ? { left: '14%', right: '14%', textAlign: 'center' } : { left: '47.9%', right: '6%', textAlign: 'left' }) }} />}
    </div>
  );
}

function JICThread() {
  const [t, setTweak] = useTweaks(window.TWEAK_DEFAULTS);
  return (
    <>
      <CompositionStage width={1920} height={1080} bg={C.bg} scenes={window.OM_SCENES} playback={window.OM_PLAYBACK}>
        <Piece showCaptions={t.captions} />
      </CompositionStage>
      <TweaksPanel>
        <TweakSection label="Video" />
        <TweakToggle label="Voiceover captions" value={t.captions} onChange={(v) => setTweak('captions', v)} />
        <TweakToggle label="Motion editor" value={t.motionEditor} onChange={(v) => setTweak('motionEditor', v)} />
      </TweaksPanel>
    </>
  );
}
window.JICThread = JICThread;
