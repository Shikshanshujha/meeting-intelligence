import { config } from "dotenv";
import { resolve } from "path";
import { createServiceClient, getDemoUser } from "../src/lib/auth/demo-users";
import {
  buildBriefs,
  buildJordanMilestones,
  buildManagerInsights,
  buildMeetings,
  buildNotes,
  buildProspects,
} from "./seed-data/fixtures";
import {
  buildExtraManagerInsights,
  buildExtraMeetings,
  buildExtraNotes,
  buildExtraProspects,
  buildLearningLeaps,
  buildPipelineMilestones,
  buildRepDevelopmentAreas,
  EXTRA_PROSPECT_IDS,
  EXTRA_REP_EMAILS,
} from "./seed-data/extended-team";
import { JORDAN_PROSPECT_IDS } from "./seed-data/ids";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function getProfileId(email: string): Promise<string> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (error || !data) {
    throw new Error(`Profile not found for ${email}. Run npm run seed:users first.`);
  }

  return data.id;
}

async function resetRepMeetings(
  supabase: ReturnType<typeof createServiceClient>,
  repId: string
) {
  const { error } = await supabase.from("meetings").delete().eq("rep_id", repId);
  if (error) {
    throw new Error(`Could not reset rep meetings: ${error.message}`);
  }
}

async function removeOrphanProspects(
  supabase: ReturnType<typeof createServiceClient>,
  ownerId: string,
  keepIds: string[]
) {
  const { data: owned, error } = await supabase
    .from("prospects")
    .select("id")
    .eq("owner_id", ownerId);

  if (error) {
    throw new Error(`Could not list prospects: ${error.message}`);
  }

  const orphans = (owned ?? []).filter((row) => !keepIds.includes(row.id));
  if (orphans.length === 0) return;

  for (const row of orphans) {
    await supabase.from("prospects").delete().eq("id", row.id);
  }
}

async function resetMilestones(
  supabase: ReturnType<typeof createServiceClient>,
  prospectIds: string[]
) {
  await supabase.from("pipeline_milestones").delete().in("prospect_id", prospectIds);
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  const supabase = createServiceClient();
  const repId = await getProfileId(getDemoUser("rep").email);
  const samId = await getProfileId(EXTRA_REP_EMAILS.sam);
  const rileyId = await getProfileId(EXTRA_REP_EMAILS.riley);

  const prospects = [
    ...buildProspects(repId),
    ...buildExtraProspects(samId, rileyId),
  ];
  const meetings = [...buildMeetings(repId), ...buildExtraMeetings(samId, rileyId)];
  const briefs = buildBriefs();
  const notes = [...buildNotes(), ...buildExtraNotes()];
  const insights = [
    ...buildManagerInsights(),
    ...buildExtraManagerInsights(),
  ];
  const milestones = [...buildJordanMilestones(), ...buildPipelineMilestones()];
  const learning = buildLearningLeaps();
  const allProspectIds = [...JORDAN_PROSPECT_IDS, ...EXTRA_PROSPECT_IDS];

  console.log("Resetting demo pipeline data…");
  console.log(`  Jordan Lee (${repId.slice(0, 8)}…): wipe meetings, restore ${JORDAN_PROSPECT_IDS.length} prospects`);
  await resetRepMeetings(supabase, repId);
  await resetRepMeetings(supabase, samId);
  await resetRepMeetings(supabase, rileyId);
  await removeOrphanProspects(supabase, repId, JORDAN_PROSPECT_IDS);
  await resetMilestones(supabase, allProspectIds);

  await supabase.from("prospects").upsert(prospects, { onConflict: "id" });
  await supabase.from("meetings").upsert(meetings, { onConflict: "id" });
  await supabase.from("briefs").upsert(briefs, { onConflict: "id" });
  await supabase.from("meeting_notes").upsert(notes, { onConflict: "id" });

  for (const insight of insights) {
    await supabase.from("manager_insights").upsert(insight, {
      onConflict: "prospect_id",
    });
  }

  await supabase.from("pipeline_milestones").insert(milestones);
  await supabase.from("learning_leaps").upsert(learning, { onConflict: "id" });

  for (const rep of buildRepDevelopmentAreas()) {
    await supabase
      .from("profiles")
      .update({ development_areas: rep.development_areas })
      .eq("email", rep.email);
  }

  console.log("Seeded pipeline:");
  console.log(`  • ${prospects.length} prospects (Jordan + Sam + Riley)`);
  console.log(`  • ${meetings.length} meetings (Jordan + Sam + Riley)`);
  console.log(`  • ${milestones.length} pipeline milestones`);
  console.log(`  • ${insights.length} manager insights`);
  console.log(`  • Learning leaps + rep development areas`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
