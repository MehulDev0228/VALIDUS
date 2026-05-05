/**
 * FutureValidate microcopy library.
 *
 * Voice rules:
 *   - Direct. Sharp. No hedging.
 *   - Speak like a senior partner who reads memos at 6am.
 *   - Reject "AI assistant" stock phrasing.
 *   - Specifics over adjectives.
 */

export const microcopy = {
  brand: {
    name: "FutureValidate",
    promise: "A decision system that argues with founders.",
    manifesto: [
      "We don't validate ideas. We argue with them.",
      "Seven agents. One judge. One verdict. Sixty seconds.",
      "If the idea survives us, it might survive the market.",
    ],
  },
  nav: {
    counter: "ideas judged today",
    cta: "Validate an idea",
    secondary: "The system",
    mobileMenuOpen: "Index",
    mobileMenuClose: "Close",
  },
  hero: {
    eyebrow: "Founder decision system, v2",
    headlineLines: [
      "Most ideas",
      "die in silence.",
      "Yours dies on record.",
    ],
    subhead:
      "Seven specialised agents debate your idea on the record. A Final Judge issues a BUILD, PIVOT, or KILL with reasoning sharp enough to quote.",
    ctaPrimary: "Submit an idea",
    ctaSecondary: "Read a sample memo",
    triptychLabels: ["BUILD", "PIVOT", "KILL"],
    triptychSubs: [
      "rare, defensible, fast to test",
      "right problem, wrong shape",
      "structural, not fixable in code",
    ],
  },
  tape: {
    eyebrow: "Recent verdicts on file",
  },
  proof: {
    eyebrow: "House view",
    quote:
      "Founders bring optimism. Markets bring physics. We sit between the two and refuse to flinch.",
    attribution: "FutureValidate, Office of the Final Judge",
    stats: [
      { value: "7", label: "specialised agents" },
      { value: "1", label: "final judge" },
      { value: "48h", label: "falsification window" },
      { value: "0", label: "rounds of hedging" },
    ],
  },
  system: {
    eyebrow: "How a verdict is made",
    stages: [
      {
        n: "01",
        title: "Decode",
        body:
          "We extract the real problem, the real user, and the real market — not the pitch deck version.",
      },
      {
        n: "02",
        title: "Research",
        body:
          "Country-specific signals, competitive saturation, willingness-to-pay reality. No vague trend lines.",
      },
      {
        n: "03",
        title: "Debate",
        body:
          "Seven agents argue. One is paid to kill the idea. Contradictions are surfaced, not smoothed.",
      },
      {
        n: "04",
        title: "Rule",
        body:
          "The Final Judge issues BUILD, PIVOT, or KILL with top reasons, fatal risks, and a 48-hour test.",
      },
    ],
  },
  preview: {
    eyebrow: "What you receive",
    title: "A consulting-grade memo, not a chat reply.",
    body:
      "Verdict, opportunity score, agent insights, fatal risks, and a day-by-day plan to falsify the idea before you write a line of code.",
  },
  hook: {
    line: "If your idea is going to fail, fail before Friday — not after a year.",
    cta: "Submit an idea",
  },
  footer: {
    manifesto: "We don't validate ideas. We argue with them.",
    columns: {
      product: ["Validate", "Sample memo", "Decision history"],
      method: ["The system", "The agents", "Falsification 48h"],
      house: ["Manifesto", "Pricing", "Contact"],
    },
    legal: "FutureValidate. Decisions on the record.",
  },
  validate: {
    eyebrow: "Memo intake",
    placeholder: {
      title: "Title — short, declarative, no buzzwords.",
      problem:
        "What is the painful, expensive problem? Who has it? How is it solved today, and why is that bad?",
      idea:
        "What are you proposing? Be specific about the wedge, not the eventual platform.",
      market:
        "Who pays? What country, what segment, what budget line, what existing alternatives?",
    },
    submit: "Submit for judgment",
    submitting: "Routing to the agents",
    counter: (used: number, max: number) =>
      `${used}/${max} memos filed today`,
    errors: {
      tooShort:
        "Not enough on the page. Give the agents something to argue with.",
      rateLimit:
        "Daily limit reached (2 memos/day). Sleep on it. Come back sharper.",
      generic: "The system refused this submission. Try again with more detail.",
    },
  },
  loading: {
    phases: [
      { label: "Decoding", line: "Stripping pitch from substance." },
      { label: "Researching", line: "Pulling country, segment, and competitor signal." },
      { label: "Debating", line: "Seven agents on record. Conflicts surfacing." },
      { label: "Ruling", line: "Final Judge composing the verdict." },
    ],
    cancel: "Cancel and edit",
  },
  results: {
    finalVerdictLabel: "Final verdict",
    confidenceLabel: "Judge confidence",
    scoreLabel: "Opportunity score",
    works: "If this works, it works because",
    fails: "If this fails, it fails because",
    agents: "Agent panels",
    risks: "Fatal risks",
    plan: "48-hour falsification plan",
    iterate: "Sharpen the idea",
    submitNew: "File another memo",
  },
  empty: {
    decisions: "No decisions on file yet. The first memo opens the ledger.",
    attempts: "No falsification attempts logged. The clock is ticking.",
  },
}
