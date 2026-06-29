/**
 * Gushwork demo pipeline seed data.
 * Fixed UUIDs keep re-runs idempotent via upsert.
 */
export const SEED_IDS = {
  prospects: {
    velocityHr: "11111111-1111-4111-8111-111111111101",
    nomadCommerce: "11111111-1111-4111-8111-111111111102",
    searchForge: "11111111-1111-4111-8111-111111111103",
    metricPulse: "11111111-1111-4111-8111-111111111104",
    relayCommerce: "11111111-1111-4111-8111-111111111105",
    stackline: "11111111-1111-4111-8111-111111111106",
  },
  meetings: {
    metricPulseDiscovery: "22222222-2222-4222-8222-222222222301",
    nomadDiscovery: "22222222-2222-4222-8222-222222222211",
    nomadDemo: "22222222-2222-4222-8222-222222222212",
    nomadClosing: "22222222-2222-4222-8222-222222222213",
    stacklineDiscovery: "22222222-2222-4222-8222-222222222321",
    stacklineFollowUp1: "22222222-2222-4222-8222-222222222322",
    stacklineFollowUp2: "22222222-2222-4222-8222-222222222323",
    stacklinePilotCheckIn: "22222222-2222-4222-8222-222222222324",
    velocityDiscovery: "22222222-2222-4222-8222-222222222201",
    velocityDemo: "22222222-2222-4222-8222-222222222202",
    velocityFollowUpDemo: "22222222-2222-4222-8222-222222222203",
    relayDiscovery: "22222222-2222-4222-8222-222222222401",
    relayDemo: "22222222-2222-4222-8222-222222222402",
    relayClosing: "22222222-2222-4222-8222-222222222403",
    searchForgeDiscovery: "22222222-2222-4222-8222-222222222221",
  },
  briefs: {
    velocityFollowUpDemo: "33333333-3333-4333-8333-333333333301",
    nomadClosing: "33333333-3333-4333-8333-333333333302",
  },
  notes: {
    metricPulseDiscovery: "44444444-4444-4444-8444-444444444301",
    nomadDiscovery: "44444444-4444-4444-8444-444444444411",
    nomadDemo: "44444444-4444-4444-8444-444444444412",
    stacklineDiscovery: "44444444-4444-4444-8444-444444444321",
    stacklineFollowUp1: "44444444-4444-4444-8444-444444444322",
    stacklineFollowUp2: "44444444-4444-4444-8444-444444444323",
    velocityDiscovery: "44444444-4444-4444-8444-444444444401",
    velocityDemo: "44444444-4444-4444-8444-444444444402",
    relayDiscovery: "44444444-4444-4444-8444-444444444501",
    relayDemo: "44444444-4444-4444-8444-444444444502",
    relayClosing: "44444444-4444-4444-8444-444444444503",
    searchForgeDiscovery: "44444444-4444-4444-8444-444444444421",
  },
  insights: {
    velocityHr: "55555555-5555-4555-8555-555555555501",
    nomadCommerce: "55555555-5555-4555-8555-555555555502",
    searchForge: "55555555-5555-4555-8555-555555555503",
    metricPulse: "55555555-5555-4555-8555-555555555504",
    relayCommerce: "55555555-5555-4555-8555-555555555505",
    stackline: "55555555-5555-4555-8555-555555555506",
  },
} as const;

export const JORDAN_PROSPECT_IDS = Object.values(SEED_IDS.prospects);

export function daysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export function daysAgo(days: number): string {
  return daysFromNow(-days);
}
