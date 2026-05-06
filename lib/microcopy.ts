/**
 * FutureValidate microcopy — Founder Reflection Infrastructure voice.
 *
 * Rules:
 *   - Quieter than the feed. Observant, not performative.
 *   - Mirrors how founders actually think — pattern, tension, doubt.
 *   - Never “AI assistant,” hustle culture, or therapy cosplay.
 *   - Specifics over hype; room to breathe between heavy lines.
 */

export const microcopy = {
  brand: {
    name: "FutureValidate",
    promise: "A private cognitive workspace for founders who want their thinking challenged on the record.",
    manifesto: [
      "The internet rewards noise. Here, you get distance — then pressure.",
      "One strategic read per filing. Contrasting viewpoints. Nothing gamified.",
      "If the wedge collapses under scrutiny here, reality would have punished it harder.",
    ],
  },
  nav: {
    counter: "memos on file today",
    cta: "Begin a memo",
    alphaShort: "Private alpha",
    secondary: "How it thinks",
    mobileMenuOpen: "Index",
    mobileMenuClose: "Close",
  },
  hero: {
    eyebrow: "Private alpha",
    headlineLines: [
      "The idea won\u2019t stop.",
      "The doubt won\u2019t stop.",
      "Start here.",
    ],
    subhead:
      "A private room for founders \u2014 file what you\u2019re thinking, receive a structured read with tensions and a single decision frame. No audience. No performance.",
    ctaPrimary: "Begin a memo",
    ctaSecondary: "See a sample read",
    triptychLabels: ["BUILD", "PIVOT", "KILL"],
    triptychSubs: ["wedge survives contact with reality", "right pain, brittle shape", "structural friction, not tweaks"],
  },
  tape: {
    eyebrow: "Recent decisions on file",
  },
  proof: {
    eyebrow: "Why this exists",
    quote:
      "Ambition fragments in the timeline. FutureValidate collapses scatter into something you can sit with.",
    attribution: "FutureValidate",
    stats: [
      { value: "7", label: "contrasting reads" },
      { value: "1", label: "decision frame" },
      { value: "48h", label: "pressure horizon" },
      { value: "∞", label: "private rework" },
    ],
  },
  system: {
    eyebrow: "How a memo is composed",
    stages: [
      {
        n: "01",
        title: "Decode",
        body: "What you claim vs what quietly has to be true for this to matter.",
      },
      {
        n: "02",
        title: "Context",
        body: "Market and buyer realism — specificity over vibe.",
      },
      {
        n: "03",
        title: "Contrast",
        body: "Disagreement on record so you cannot smooth it into false consensus.",
      },
      {
        n: "04",
        title: "Frame",
        body: "One ruling with pressures, tensions, and a near-term falsification horizon.",
      },
    ],
  },
  preview: {
    eyebrow: "What lands in your inbox",
    title: "A strategic memo, not chat exhaust.",
    body:
      "Decision frame, tensions, contradiction map, pressures to respect, and a short arc for testing what you believe — before you overbuild.",
  },
  hook: {
    line: "Clarity hurts less when you invite it sooner.",
    cta: "Begin",
  },
  footer: {
    manifesto: "A private room for your thinking — not another AI-score toy.",
    columns: {
      product: ["Memo", "Sample read", "Decision trail", "Private alpha"],
      method: ["How it works", "The reads", "48h horizon"],
      house: ["Principles", "Pricing", "Contact"],
    },
    legal: "FutureValidate · reflection on record",
  },
  validate: {
    eyebrow: "Briefing room",
    title: "Say the quiet part plainly.",
    lead: "Treat this like notes to yourself six months from now — concrete, blunt, searchable.",
    placeholder: {
      title: "One line — what are you proposing?",
      problem: "Pain, who owns it today, workaround cost, urgency.",
      idea: "Wedge motion — what changes first, why now.",
      market: "Who pays, geography, substitutes, procurement reality.",
    },
    submit: "Compose memo",
    submitting: "Drafting…",
    counter: (used: number, max: number) => `${used}/${max} memos today`,
    errors: {
      tooShort: "Add more detail — specifics help the read contradict something real.",
      rateLimit:
        "Today\u2019s window is full. Midnight UTC resets — tighten the thesis while you wait.",
      generic: "That pass did not complete. Nothing was discarded — adjust and retry.",
      network: "Connection dropped mid-flight. Your draft is intact — retry when steady.",
      timeout: "The compose pass timed out. Shorter drafts often land; retry when ready.",
      server: "The compose backend is unreachable. Pause, breathe, retry shortly.",
      inviteInvalid: "That invite code does not unlock this alpha.",
    },
  },
  alpha: {
    eyebrow: "Private founder alpha",
    title: "Request access",
    body:
      "A small-room alpha for internet-native founders who want reflective infrastructure, not leaderboard dopamine. We read every note — zero growth spam.",
    inviteLabel: "Invite code (if you have one)",
    inviteHelp: "Optional unless this server requires a gate code.",
    emailLabel: "Email",
    noteLabel: "One line on what you are building now (optional)",
    submit: "Join the waitlist",
    submitting: "Sending…",
    successTitle: "Recorded",
    successBody:
      "We will reply when seats open. The public shell still outlines how reflection works.",
    signInCta: "Already in? Sign in",
    errorGeneric: "Could not store that note. Retry or ping the operators directly.",
    inviteEmailSuggestion: {
      subject: "FutureValidate — private alpha seating",
      body: `You've got a calm seat reserved.

FutureValidate is a founder reflection workspace: file briefs, read structured tension, archive rulings you can revisit later — not another hypey AI scorer.

Begin here when ready: [your app URL]/auth`,
    },
  },
  loading: {
    phases: [
      { label: "Brief", line: "Isolating the claim that has to survive." },
      { label: "Context", line: "Pulling grounding on buyers and substitutes." },
      { label: "Contrast", line: "Letting contradictory reads coexist." },
      { label: "Frame", line: "Locking a decision language and horizon." },
    ],
    cancel: "Pause · edit brief",
  },
  results: {
    degradedLead:
      "Reduced compose path (key missing, fallback, or timeout). Read as provisional sketch — rerun when infra is steady.",
    atAGlanceEyebrow: "Opening tension",
    atAGlanceLead: "The line worth sitting with before the full read pulls you under.",
    resonanceEyebrow: "Resonance line",
    resonanceHint: "Worth clipping — mirrors the sharpest contradiction in your brief.",
    finalVerdictLabel: "Decision frame",
    confidenceLabel: "Read confidence",
    scoreLabel: "Opportunity compression",
    whyVerdictTitle: "Why this frame landed",
    whyVerdictSubtitle:
      "Heuristic transparency — lighter claims sit beside heavier ones instead of pretending equal weight.",
    works: "If this survives, it survives because",
    fails: "If this collapses, it collapses because",
    agents: "Contrasting reads · detail",
    agentsLead: "Open when you crave the argumentative texture — skim-friendly summary lives above.",
    risks: "Pressures worth respecting",
    plan: "48-hour pressure horizon",
    iterate: "Rewrite the wedge",
    submitNew: "New memo · same honesty",
    partnerEyebrow: "Partner-through read",
    decisionSystemEyebrow: "Operator surface",
    decisionSystemTitle: "What happens next stays legible.",
    headerConfidential: "Private synthesis · not for distribution",
    stanceLine: "Framed plainly — change it when new receipts land.",
    pressuresInlineEyebrow: "Pressure fragments",
    judgeEyebrow: "Contradiction trace",
    judgeTitle: "Lines that forced the decision frame",
    decodedEyebrow: "Decoded brief",
    decodedTitle: "What you actually put on the page",
    researchEyebrow: "Context layer",
    researchTitle: "Geography / segment cues",
    riskSectionTitle: "If these stay true, upside stays thin",
    planSectionTitle: "What to falsify before you overbuild",
    contrastingDetailTitle: "Contrasting reads · full texture",
    executionEyebrow: "Execution thread",
    executionTitle: "Operator moves tied to this memo",
    executionLead:
      "Synthesized from tensions in this pass. While signed in, receipts stay in your reflection archive — no performance metrics.",
    archiveLink: "Open reflection archive →",
  },
  operator: {
    planLabel: "48h pressure map",
    planTitle: "Falsify calmly or walk away.",
    planCaption: "Each move names what would change your mind.",
    trackerLabel: "Field receipts",
    trackerTitle: "What actually happened counts more than intent.",
    trackerCaption: "Feeds the next tightening of the wedge.",
    iterateLabel: "Iteration lane",
    iterateTitle: "Sharpen the memo, not your ego.",
    iterateCaption: "Drafts consume this memo + your receipts.",
  },
  dashboard: {
    loading: "settling workspace\u2026",
    statusEyebrow: "Live",
    homeEmptyLead:
      "Nothing on file yet. Start when the idea won\u2019t leave.",
    homeActiveLead:
      (count: number) =>
        `${count} memo${count === 1 ? "" : "s"} on file. Open the latest, or start fresh.`,
    docketEyebrow: "Today",
    docketLimitCopy: {
      exhausted: "Window full. Let the clock reset overnight.",
      open: "Use the openings deliberately — sloppy drafts steal future you's attention.",
      oneLeft: "One pass left — make it substantive.",
      mid: "Slots still open.",
    },
    quickBriefEyebrow: "Fast capture",
    quickBriefLead: "Rough idea lands here → you refine in the briefing room.",
    quickBriefPlaceholder: "That niche tool you wish existed for…",
    quickBriefPlaceholderDisabled: "Come back once the window resets.",
    quickBriefSubmit: "Open briefing room",
    perspectiveStackEyebrow: "Perspective stack",
    perspectiveStackSub: "background reads — no chat, just pressure",
    trajectoryLabel: "Memos filed",
    weekLabel: "This cycle",
    scoreLabel: "Avg compression",
    lastFrameLabel: "Last frame",
    ledgerEyebrow: "Decision trail",
    ledgerTitle: "Recent reflections",
    emptyLedgerEyebrow: "Still quiet",
    emptyLedgerAside: "The first memo is the hardest keystroke.",
    archivedMore: "older memos in your archive.",
    sessionEyebrow: "Session fingerprint",
    marketingSite: "Landing page",
    nav: {
      home: "Home",
      workspace: "Archive",
      memo: "New memo",
    },
    spine: {
      eyebrow: "Continuity layer",
      title: "Signals your archive already carries",
      openFull: "Open full archive →",
      continuityEyebrow: "Trajectory",
      executionEyebrow: "Execution threads",
      executionEmpty: "File while signed in — operator tasks bind to memos without fuss.",
      assumptionsEyebrow: "Assumptions still open",
      assumptionsSub: "From the latest memo snapshots — not a leaderboard score.",
      experimentsEyebrow: "Experiment residue on file",
      shiftsEyebrow: "Memo deltas you already lived",
      blindEyebrow: "Quiet pattern flags",
    },
  },
  founder: {
    eyebrow: "Reflection archive · private",
    title: "How your thinking drifts across filings",
    lead:
      "Lineages stitch re-filed ideas, deltas between memo snapshots, and experiments your hands actually ran — patterned from receipts, not personality quizzes.",
    backHome: "Back home",
    fileMemo: "New memo",
    lineagesTitle: "Trajectory threads",
    lineagesSubtitle: "Stable fingerprints across iterations — rework deepens automatically.",
    backToLedger: "Back home",
  },
  onboarding: {
    eyebrow: "Two-minute orientation",
    title: "Frame how you operate",
    lead:
      "Not personalization theatre — anchors your archive so reflections read contextual: stage, market shape, traction, crew size.",
    save: "Save · continue",
    saving: "Saving…",
    skip: "Skip — keep sane defaults",
  },
  empty: {
    decisions: "Your archive starts with one honest brief.",
    attempts: "No experiments logged yet \u2014 they\u2019ll live here quietly when you run them.",
  },
}
