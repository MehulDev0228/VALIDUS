/**
 * VERDIKT microcopy — plain language, no theatre.
 */

export const microcopy = {
  brand: {
    name: "VERDIKT",
    tagline: "The memo before the build.",
    promise:
      "You describe an idea in your own words. We return a structured read: tradeoffs, a verdict, and what to try next.",
    manifesto: [
      "Built for founders who want an honest skim before committing months of build.",
      "Not a magic engine — a checklist-style analysis with disagreement left visible.",
      "If something is fuzzy in your brief, the memo says so plainly.",
    ],
  },
  home: {
    story:
      "Free to start after sign-in: two memo runs per day (UTC midnight reset). Same output whether you joined via waitlist or open signup — limits keep quality legible.",
  },
  preLaunch: {
    ribbonEyebrow: "Pre-launch",
    ribbonTitle: "Opening in waves — no public pricing sheet yet.",
    ribbonBody:
      "We're prioritizing founders who'll stress-test the memo format. Join the waitlist; we'll invite you as capacity opens.",
    ribbonCta: "Request early access",
  },
  productMore: {
    title: "History, patterns, and worked examples",
    lead:
      "Skip this until you've seen the memo on the homepage. These sections show how archives and flags look over time — illustrative, not a promise of analytics depth.",
  },
  nav: {
    counter: "ideas on file",
    cta: "Try it",
    alphaShort: "Waitlist",
    earlyAccess: "Early access",
    examplesDeep: "Examples",
    pricing: "Pricing",
    secondary: "How it works",
    mobileMenuOpen: "Menu",
    mobileMenuClose: "Close",
  },
  hero: {
    eyebrow: "The memo before the build.",
    trust: {
      ideasCount: 2400,
      avgMinutes: 3.2,
      privateLabel: "Private history when signed in",
    },
    headlineLines: ["Check the idea,", "before the build."],
    subhead:
      "Write a short brief. Receive a memo with contrasting takes, tensions, one verdict-style summary, and a 48-hour test plan. Keeps history when you\u2019re signed in.",
    ctaPrimary: "Validate an idea",
    ctaSecondary: "Sample memo",
    triptychLabels: ["BUILD", "PIVOT", "KILL"],
    triptychSubs: [
      "looks worth testing next",
      "right problem, reshape the wedge",
      "pause or drop as stated",
    ],
  },
  tape: {
    eyebrow: "Recent memos",
  },
  proof: {
    eyebrow: "Why we built this",
    quote:
      "Most idea notes live in Slack threads. We wanted something you could file once and revisit with context.",
    attribution: "VERDIKT",
    stats: [
      { value: "7", label: "angles in the memo" },
      { value: "1", label: "verdict summary" },
      { value: "48h", label: "suggested test window" },
      { value: "\u221E", label: "private rewrites" },
    ],
  },
  system: {
    eyebrow: "Pipeline",
    stages: [
      {
        n: "01",
        title: "You write",
        body: "Problem, wedge, buyer, price. Ordinary sentences \u2014 not a pitch deck.",
      },
      {
        n: "02",
        title: "Angles run",
        body: "Seven fixed lenses read the same text (market, competition, economics, scope, buyer, risks, tests).",
      },
      {
        n: "03",
        title: "Tradeoffs surface",
        body: "Where lenses disagree, the memo shows both sides instead of smoothing them.",
      },
      {
        n: "04",
        title: "Memo + tests",
        body: "A short verdict, score-style compression, and a two-day checklist to disprove the idea cheaply.",
      },
    ],
  },
  preview: {
    eyebrow: "Deliverable",
    title: "A memo layout, not a chat thread.",
    body:
      "Same sections every time: verdict, contrasting notes, tensions, pressures, near-term experiments. Easier to compare runs.",
  },
  hook: {
    line: "Cheap to run the memo. Expensive to build the wrong thing.",
    cta: "Validate an idea",
  },
  footer: {
    manifesto: "Straightforward validation for startup ideas — private notes, structured output.",
    taglineShort: "Memo before build.",
    columns: {
      product: ["New run", "Sample memo", "Examples"],
      method: ["How it works", "FAQ"],
      house: ["Early access", "Changelog"],
    },
    legal: "VERDIKT",
  },
  whoItsFor: {
    eyebrow: "Fit",
    title: "Built for founders who file ideas before they fund them.",
    lead:
      "If you already talk to customers and want a second read that disagrees on purpose — not another chat wrapper — this is for you.",
    bullets: [
      "Small teams shipping weekly, comparing runs on the same template.",
      "People who want tensions left visible instead of averaged away.",
      "Founders who'll run cheap tests before touching the repo.",
    ],
    honesty:
      "Private beta — we're not polishing quote cards yet. Use the sample memo on this page as the proof.",
  },
  validate: {
    eyebrow: "Workspace",
    title: "Paste the honest version.",
    lead: "Write like you'd explain it to a sharp friend — concrete beats buzzwords.",
    placeholder: {
      title: "One line: what are you proposing?",
      problem: "Pain, who has it today, what they pay now.",
      idea: "What changes first, why it should exist now.",
      market: "Who pays, geography, obvious substitutes.",
    },
    submit: "Run memo",
    submitting: "Running\u2026",
    counter: (used: number, max: number) => `${used}/${max} runs today`,
    errors: {
      tooShort: "Add a bit more detail so the memo has something concrete to disagree with.",
      rateLimit:
        "Daily limit hit. Resets midnight UTC — tighten the hypothesis while you wait.",
      generic: "That run didn't finish. Your draft stays put — retry.",
      network: "Lost connection mid-run. Retry when you're back online.",
      timeout: "Timed out — shorter briefs sometimes land quicker.",
      server: "Service unreachable. Try again shortly.",
      inviteInvalid: "That invite code isn't valid.",
    },
  },
  auth: {
    socialProof: "Structured memos — private when you sign in.",
    configBanner: "Authentication requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    oauthError: "OAuth did not complete — try Google again or use email.",
  },
  alpha: {
    eyebrow: "Waitlist",
    title: "Request access",
    body:
      "Small beta. We'll email when there's capacity. No growth spam.",
    inviteLabel: "Invite code (if you have one)",
    inviteHelp: "Optional.",
    emailLabel: "Email",
    noteLabel: "What you're exploring (optional, one line)",
    submit: "Join waitlist",
    submitting: "Sending\u2026",
    successTitle: "Recorded",
    successBody:
      "We'll reply when seats open. The marketing page describes the product plainly.",
    signInCta: "Already invited? Sign in",
    errorGeneric: "Couldn't save that. Retry or email us.",
    inviteEmailSuggestion: {
      subject: "VERDIKT invite",
      body: `You've got access.

VERDIKT reads your startup brief and returns a structured memo (tradeoffs + verdict + short tests).

Open: [your app URL]/auth`,
    },
  },
  pricingPage: {
    eyebrow: "Plans",
    title: "Pricing",
    lead: "Start free. Upgrade when your archive becomes the product.",
  },
  pricing: {
    free: {
      name: "Free",
      price: "$0",
      period: "/mo",
      highlight: "Get addicted to the memo format.",
      bullets: ["2 memos per day (UTC reset)", "7-angle analysis", "BUILD / PIVOT / KILL verdict + score", "48-hour test plan", "Session history while signed in"],
      cta: "Start free",
      href: "/auth?next=/dashboard",
    },
    pro: {
      name: "Pro",
      badge: "Best for solo founders",
      price: "$29",
      period: "/mo",
      annualNote: "$228/yr billed annually ($19/mo)",
      highlight: "When patterns and lineage matter.",
      bullets: [
        "Unlimited memos",
        "PDF export",
        "Priority AI routing",
        "Full archive + search",
        "Lineage + blind-spot signals across runs",
        "Execution task tracking",
        "Email delivery of memos",
      ],
      cta: "Upgrade to Pro",
      href: "/auth?next=/dashboard/settings",
    },
    team: {
      name: "Team",
      price: "$79",
      period: "/mo",
      highlight: "Shared workspace for startup teams.",
      bullets: ["Everything in Pro", "Up to 5 seats", "Shared workspace", "API access", "Custom branding on exports", "Priority support"],
      cta: "Talk to us",
      href: "/auth?next=/dashboard/settings",
    },
  },
  loading: {
    phases: [
      { label: "Read", line: "Pulling apart the core claim." },
      { label: "Context", line: "Grounding buyer and substitutes." },
      { label: "Tension", line: "Keeping disagreement visible." },
      { label: "Frame", line: "Locking verdict language + tests." },
    ],
    cancel: "Stop · edit draft",
  },
  results: {
    degradedLead:
      "Partial run (network or timeout). Treat this as a sketch — rerun when stable.",
    atAGlanceEyebrow: "Lead tension",
    atAGlanceLead: "The line worth reading slowly before scrolling.",
    resonanceEyebrow: "Echo line",
    resonanceHint: "Mirrors the sharpest friction in what you filed.",
    finalVerdictLabel: "Verdict",
    confidenceLabel: "Read confidence",
    scoreLabel: "Opportunity compression",
    whyVerdictTitle: "Why this verdict",
    whyVerdictSubtitle: "Heavy claims outweigh light ones.",
    works: "Holds up if",
    fails: "Breaks if",
    agents: "Angle notes · detail",
    agentsLead: "Expand when you want the thread — summary stays above.",
    risks: "Risks to respect",
    plan: "48-hour checks",
    iterate: "Tighten the brief",
    submitNew: "New run · same template",
    partnerEyebrow: "Companion read",
    decisionSystemEyebrow: "After this",
    decisionSystemTitle: "What you do next is yours.",
    headerConfidential: "Private memo · don't forward",
    stanceLine: "Plain language — update when you have new facts.",
    pressuresInlineEyebrow: "Pressure notes",
    judgeEyebrow: "Signals that tilted the verdict",
    judgeTitle: "Lines that weighed heaviest",
    decodedEyebrow: "Decoded brief",
    decodedTitle: "What we inferred from your text",
    researchEyebrow: "Market cues",
    researchTitle: "Segment / geography notes",
    riskSectionTitle: "Upside stays thin if these stay true",
    planSectionTitle: "Cheap tests before deeper build",
    contrastingDetailTitle: "Full angle ledger",
    executionEyebrow: "Follow-ups",
    executionTitle: "Actions tied to this run",
    executionLead:
      "Derived from tensions in this pass. Saved when you're signed in — not a leaderboard.",
    archiveLink: "Open history \u2192",
  },
  operator: {
    planLabel: "48h map",
    planTitle: "Test or walk.",
    planCaption: "Each line is something that could change your mind.",
    trackerLabel: "Log",
    trackerTitle: "Outcomes beat intentions.",
    trackerCaption: "Feeds the next brief.",
    iterateLabel: "Next draft",
    iterateTitle: "Sharpen the idea.",
    iterateCaption: "Reuse this memo plus what you learned.",
  },
  dashboard: {
    loading: "Loading\u2026",
    statusEyebrow: "Now",
    homeEmptyLead:
      "Nothing filed yet — start when you have a wedge worth testing.",
    homeActiveLead:
      (count: number) =>
        `${count} memo${count === 1 ? "" : "s"} on file. Open the latest or start a fresh run.`,
    docketEyebrow: "Today",
    docketLimitCopy: {
      exhausted: "Daily limit reached. Resets overnight.",
      open: "Use runs on ideas you're serious about reviewing.",
      oneLeft: "One run left today — worth a sharper brief.",
      mid: "Runs still available.",
    },
    quickBriefEyebrow: "Draft",
    quickBriefLead: "Rough sketch here \u2192 refine in Validate.",
    quickBriefPlaceholder: "The idea on your mind\u2026",
    quickBriefPlaceholderDisabled: "Come back after the reset.",
    quickBriefSubmit: "Continue",
    perspectiveStackEyebrow: "Angles",
    perspectiveStackSub: "same memo template every time",
    trajectoryLabel: "On file",
    weekLabel: "This week",
    scoreLabel: "Avg depth",
    lastFrameLabel: "Last verdict",
    ledgerEyebrow: "Your runs",
    ledgerTitle: "Recent memos",
    emptyLedgerEyebrow: "Empty",
    emptyLedgerAside: "First brief is always the hardest.",
    archivedMore: "older entries in archive.",
    sessionEyebrow: "Session",
    marketingSite: "Home",
    nav: {
      home: "Home",
      workspace: "Archive",
      memo: "New run",
      settings: "Settings",
    },
    spine: {
      eyebrow: "Continuity",
      title: "Patterns across your filings",
      openFull: "Full archive \u2192",
      continuityEyebrow: "Trajectory",
      executionEyebrow: "Tasks",
      executionEmpty: "Sign in — follow-ups attach to runs automatically.",
      assumptionsEyebrow: "Open assumptions",
      assumptionsSub: "From recent memos.",
      experimentsEyebrow: "Experiments logged",
      shiftsEyebrow: "How framing shifted",
      blindEyebrow: "Repeated gaps",
    },
  },
  founder: {
    eyebrow: "Private archive",
    title: "How your briefs drift over time",
    lead:
      "Timeline of reruns and notes — grouped by evidence, not personality labels.",
    backHome: "Back",
    fileMemo: "New run",
    lineagesTitle: "Threads",
    lineagesSubtitle: "Same wedge, evolving detail.",
    backToLedger: "Back",
  },
  onboarding: {
    eyebrow: "Setup",
    title: "A few anchors (optional)",
    lead:
      "Stage, stack, traction — keeps future memos in context.",
    save: "Save · continue",
    saving: "Saving\u2026",
    skip: "Skip · defaults",
  },
  empty: {
    decisions: "Archive starts after the first memo.",
    attempts: "No experiments logged yet.",
  },
}
