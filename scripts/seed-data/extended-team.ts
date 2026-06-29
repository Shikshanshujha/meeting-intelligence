import { daysAgo, SEED_IDS } from "./ids";

export const EXTRA_REP_EMAILS = {
  sam: "sam.patel@gushwork.demo",
  riley: "riley.chen@gushwork.demo",
} as const;

export const EXTRA_IDS = {
  prospects: {
    cloudLedger: "11111111-1111-4111-8111-111111111201",
    finStack: "11111111-1111-4111-8111-111111111202",
    payRoute: "11111111-1111-4111-8111-111111111203",
    greenCart: "11111111-1111-4111-8111-111111111211",
    loomWear: "11111111-1111-4111-8111-111111111212",
    petNova: "11111111-1111-4111-8111-111111111213",
    brightDental: "11111111-1111-4111-8111-111111111214",
    apexLegal: "11111111-1111-4111-8111-111111111221",
    harborOps: "11111111-1111-4111-8111-111111111222",
    metricFlow: "11111111-1111-4111-8111-111111111223",
    signalHR: "11111111-1111-4111-8111-111111111224",
  },
  learning: "66666666-6666-4666-8666-666666666601",
} as const;

export const EXTRA_PROSPECT_IDS = Object.values(EXTRA_IDS.prospects);

export function buildExtraProspects(samId: string, rileyId: string) {
  return [
    {
      id: EXTRA_IDS.prospects.cloudLedger,
      company: "CloudLedger",
      website: "https://cloudledger.io",
      industry: "Fintech",
      employee_range: "85",
      gtm_maturity: "Series A — compliance-heavy content needs",
      buying_intent: "High — budget approved for Q2 content program",
      owner_id: samId,
      qualification_score: 71,
      stage: "demo_scheduled" as const,
      memory_json: {
        concerns: ["SOC2 content gaps", "Legal review on fintech claims"],
        buying_signals: ["Budget approved", "Demo scheduled"],
        stakeholders: ["Head of Marketing", "Compliance lead"],
        urgency: "high",
      },
    },
    {
      id: EXTRA_IDS.prospects.finStack,
      company: "FinStack",
      website: "https://finstack.com",
      industry: "B2B SaaS",
      employee_range: "200",
      gtm_maturity: "Series C — scaling enterprise pipeline",
      buying_intent: "Medium — stalled after pricing discussion",
      owner_id: samId,
      qualification_score: 64,
      stage: "follow_up" as const,
      memory_json: {
        concerns: ["Pricing pushback from CFO"],
        objections: ["Needs CFO on call", "ROI case not yet built"],
        stakeholders: ["VP Sales", "RevOps director"],
        next_actions: ["Send ROI deck", "Book CFO follow-up"],
        urgency: "medium",
      },
    },
    {
      id: EXTRA_IDS.prospects.payRoute,
      company: "PayRoute",
      website: "https://payroute.co",
      industry: "Payments",
      employee_range: "150",
      gtm_maturity: "Growth — expanding into EU markets",
      buying_intent: "High — pilot converted to annual",
      owner_id: samId,
      qualification_score: 82,
      stage: "won" as const,
      memory_json: {
        buying_signals: ["Signed annual after pilot", "EU launch content live"],
        stakeholders: ["CMO", "Localization lead"],
        sentiment: "positive",
      },
    },
    {
      id: EXTRA_IDS.prospects.greenCart,
      company: "GreenCart",
      website: "https://greencart.shop",
      industry: "D2C",
      employee_range: "60",
      gtm_maturity: "Early growth — testing organic channels",
      buying_intent: "Low-medium — slow decision process",
      owner_id: rileyId,
      qualification_score: 45,
      stage: "follow_up" as const,
      memory_json: {
        objections: ["Comparing two vendors", "Low urgency until Q4"],
        stakeholders: ["Founder", "Growth manager"],
        urgency: "low",
      },
    },
    {
      id: EXTRA_IDS.prospects.loomWear,
      company: "LoomWear",
      website: "https://loomwear.com",
      industry: "D2C",
      employee_range: "90",
      gtm_maturity: "Seasonal D2C — spring collection launch",
      buying_intent: "Medium-high — creative team bought in",
      owner_id: rileyId,
      qualification_score: 58,
      stage: "demo_scheduled" as const,
      memory_json: {
        buying_signals: ["Creative liked sample posts", "Launch in 6 weeks"],
        concerns: ["Seasonal timing", "Brand voice consistency"],
        stakeholders: ["Creative director", "Head of E-commerce"],
        urgency: "high",
      },
    },
    {
      id: EXTRA_IDS.prospects.petNova,
      company: "PetNova",
      website: "https://petnova.co",
      industry: "D2C",
      employee_range: "45",
      gtm_maturity: "Bootstrap — lean marketing team",
      buying_intent: "Low — budget frozen",
      owner_id: rileyId,
      qualification_score: 22,
      stage: "rejected" as const,
      memory_json: {
        objections: ["No budget this year", "Paused all agency spend"],
        sentiment: "negative",
        next_actions: ["Nurture for Q4 budget cycle"],
      },
    },
    {
      id: EXTRA_IDS.prospects.brightDental,
      company: "BrightDental Group",
      website: "https://brightdental.com",
      industry: "Healthcare",
      employee_range: "320",
      gtm_maturity: "Multi-location healthcare — local SEO focus",
      buying_intent: "Medium — evaluating content for patient acquisition",
      owner_id: rileyId,
      qualification_score: 67,
      stage: "discovery" as const,
      memory_json: {
        pain_points: ["Local SEO weak in new markets", "Compliance on medical content"],
        stakeholders: ["Marketing director", "Practice ops lead"],
        urgency: "medium",
      },
    },
    {
      id: EXTRA_IDS.prospects.apexLegal,
      company: "Apex Legal",
      website: "https://apexlegal.com",
      industry: "Professional services",
      employee_range: "110",
      gtm_maturity: "Regional law firm — thought leadership push",
      buying_intent: "Low — prefers in-house hire",
      owner_id: samId,
      qualification_score: 38,
      stage: "rejected" as const,
      memory_json: {
        objections: ["Wants in-house content hire", "Skeptical of outsourced legal content"],
        sentiment: "negative",
      },
    },
    {
      id: EXTRA_IDS.prospects.harborOps,
      company: "HarborOps",
      website: "https://harborops.io",
      industry: "Logistics SaaS",
      employee_range: "75",
      gtm_maturity: "Series A — first dedicated marketing hire",
      buying_intent: "High — legal review on MSA",
      owner_id: rileyId,
      qualification_score: 74,
      stage: "closing" as const,
      memory_json: {
        buying_signals: ["Legal review started", "Champion wants signature this month"],
        stakeholders: ["CEO", "Head of Marketing"],
        urgency: "high",
      },
    },
    {
      id: EXTRA_IDS.prospects.metricFlow,
      company: "MetricFlow",
      website: "https://metricflow.ai",
      industry: "B2B SaaS",
      employee_range: "55",
      gtm_maturity: "Seed — early GTM experiments",
      buying_intent: "Low — unclear pain on first call",
      owner_id: samId,
      qualification_score: 49,
      stage: "discovery" as const,
      memory_json: {
        concerns: ["Early stage — unclear pain", "Founder-led marketing"],
        urgency: "low",
      },
    },
    {
      id: EXTRA_IDS.prospects.signalHR,
      company: "SignalHR",
      website: "https://signalhr.com",
      industry: "HR Tech",
      employee_range: "130",
      gtm_maturity: "Series B — enterprise content motion",
      buying_intent: "Medium — security review gating deal",
      owner_id: rileyId,
      qualification_score: 61,
      stage: "follow_up" as const,
      memory_json: {
        objections: ["Needs security review", "Procurement involved"],
        buying_signals: ["Champion engaged", "Shared RFP timeline"],
        stakeholders: ["VP Marketing", "InfoSec"],
        urgency: "medium",
      },
    },
  ];
}

export function buildExtraManagerInsights() {
  return [
    { prospect_id: EXTRA_IDS.prospects.cloudLedger, health: "green", risk: "Security review in progress — on track", coaching: "Bring compliance lead into next demo.", pipeline_signal: "Demo scheduled — budget approved", patterns: ["Enterprise security", "Fintech compliance"] },
    { prospect_id: EXTRA_IDS.prospects.finStack, health: "yellow", risk: "CFO not engaged — pricing stall", coaching: "Stop sending collateral; book CFO with ROI model.", pipeline_signal: "Follow-up stalled on pricing", patterns: ["Pricing friction", "Missing economic buyer"] },
    { prospect_id: EXTRA_IDS.prospects.payRoute, health: "green", risk: "None — customer live", coaching: "Document EU launch win for fintech vertical.", pipeline_signal: "Converted — annual contract", patterns: ["Pilot conversion", "International expansion"] },
    { prospect_id: EXTRA_IDS.prospects.greenCart, health: "yellow", risk: "Low urgency until Q4", coaching: "Qualify hard timeline or deprioritize.", pipeline_signal: "Follow-up — slow D2C eval", patterns: ["Slow D2C", "Vendor comparison"] },
    { prospect_id: EXTRA_IDS.prospects.loomWear, health: "green", risk: "Seasonal deadline — must launch on time", coaching: "Anchor demo to spring collection dates.", pipeline_signal: "Demo scheduled — seasonal urgency", patterns: ["Creative buy-in", "Seasonal launch"] },
    { prospect_id: EXTRA_IDS.prospects.petNova, health: "red", risk: "Budget frozen — no path this year", coaching: "Move to nurture; don't invest prep time.", pipeline_signal: "Rejected — budget freeze", patterns: ["Budget freeze", "Bootstrap"] },
    { prospect_id: EXTRA_IDS.prospects.brightDental, health: "yellow", risk: "Healthcare compliance adds cycle time", coaching: "Lead with compliant content examples on first call.", pipeline_signal: "First call — local SEO pain", patterns: ["Healthcare compliance", "Multi-location"] },
    { prospect_id: EXTRA_IDS.prospects.apexLegal, health: "red", risk: "Build vs buy — prefers in-house hire", coaching: "Close lost; don't re-engage unless hiring fails.", pipeline_signal: "Rejected — in-house preference", patterns: ["Build vs buy", "Professional services"] },
    { prospect_id: EXTRA_IDS.prospects.harborOps, health: "green", risk: "Legal redlines — normal for closing stage", coaching: "Push for signature date before month end.", pipeline_signal: "Closing — legal review", patterns: ["Strong champion", "Closing motion"] },
    { prospect_id: EXTRA_IDS.prospects.metricFlow, health: "yellow", risk: "Unclear pain — may be too early", coaching: "Tight qualification on next call or disqualify.", pipeline_signal: "First call — early stage", patterns: ["Early stage", "Founder-led"] },
    { prospect_id: EXTRA_IDS.prospects.signalHR, health: "yellow", risk: "Security queue could slip quarter", coaching: "Offer to join infosec call; multi-thread to procurement.", pipeline_signal: "Follow-up — security review", patterns: ["Security gate", "Enterprise procurement"] },
  ];
}

export function buildPipelineMilestones() {
  return [
    { id: "77777777-7777-4777-8777-777777777201", prospect_id: EXTRA_IDS.prospects.cloudLedger, occurred_at: daysAgo(12), label: "Security review started", next_step: "Send SOC2 content pack", tone: "positive" },
    { id: "77777777-7777-4777-8777-777777777202", prospect_id: EXTRA_IDS.prospects.finStack, occurred_at: daysAgo(8), label: "Pricing objection raised", next_step: "ROI deck to CFO", tone: "warning" },
    { id: "77777777-7777-4777-8777-777777777203", prospect_id: EXTRA_IDS.prospects.payRoute, occurred_at: daysAgo(30), label: "Pilot signed → annual", next_step: "EU content kickoff", tone: "positive" },
    { id: "77777777-7777-4777-8777-777777777211", prospect_id: EXTRA_IDS.prospects.greenCart, occurred_at: daysAgo(15), label: "Weak urgency signal", next_step: "Qualify Q4 timeline", tone: "warning" },
    { id: "77777777-7777-4777-8777-777777777212", prospect_id: EXTRA_IDS.prospects.loomWear, occurred_at: daysAgo(5), label: "Creative approved samples", next_step: "Demo editorial workflow", tone: "positive" },
    { id: "77777777-7777-4777-8777-777777777213", prospect_id: EXTRA_IDS.prospects.petNova, occurred_at: daysAgo(20), label: "Budget freeze confirmed", next_step: "Nurture Q4", tone: "negative" },
    { id: "77777777-7777-4777-8777-777777777214", prospect_id: EXTRA_IDS.prospects.brightDental, occurred_at: daysAgo(7), label: "Local SEO gaps identified", next_step: "Discovery follow-up", tone: "neutral" },
    { id: "77777777-7777-4777-8777-777777777221", prospect_id: EXTRA_IDS.prospects.apexLegal, occurred_at: daysAgo(11), label: "In-house hire preferred", next_step: "Close lost", tone: "negative" },
    { id: "77777777-7777-4777-8777-777777777222", prospect_id: EXTRA_IDS.prospects.harborOps, occurred_at: daysAgo(3), label: "Legal redlines sent", next_step: "Close by month end", tone: "positive" },
    { id: "77777777-7777-4777-8777-777777777223", prospect_id: EXTRA_IDS.prospects.metricFlow, occurred_at: daysAgo(6), label: "First call — pain unclear", next_step: "Qualify or disqualify", tone: "warning" },
    { id: "77777777-7777-4777-8777-777777777224", prospect_id: EXTRA_IDS.prospects.signalHR, occurred_at: daysAgo(6), label: "Security questionnaire sent", next_step: "Schedule security call", tone: "neutral" },
  ];
}

export function buildLearningLeaps() {
  return {
    id: EXTRA_IDS.learning,
    worked_well: [
      "Leading with customer proof in SaaS demos",
      "Asking for economic buyer early on follow-ups",
      "Pilot offers unblock quality objections",
      "Industry-specific case studies increase reply rates",
    ],
    didnt_work: [
      "Deep pricing talk before value established",
      "Generic discovery questions on competitive deals",
      "Sending collateral without a meeting commitment",
      "Technical deep-dives when champion isn't technical",
    ],
  };
}

export function buildRepDevelopmentAreas() {
  return [
    {
      email: "rep@gushwork.demo",
      development_areas: [
        "Strong discovery — tighten executive storytelling",
        "Good objection handling on quality concerns",
      ],
    },
    {
      email: EXTRA_REP_EMAILS.sam,
      development_areas: [
        "Insufficient technical knowledge about product",
        "Pitch structure jumps to pricing too early",
        "Needs stronger multi-threading on enterprise deals",
      ],
    },
    {
      email: EXTRA_REP_EMAILS.riley,
      development_areas: [
        "Unable to negotiate on pricing confidently",
        "Discovery questions too generic for D2C",
        "Weak close — rarely asks for commitment",
      ],
    },
  ];
}
