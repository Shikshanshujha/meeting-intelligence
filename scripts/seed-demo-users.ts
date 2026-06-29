import { config } from "dotenv";
import { resolve } from "path";
import { createServiceClient, getDemoUser } from "../src/lib/auth/demo-users";
import { EXTRA_REP_EMAILS } from "./seed-data/extended-team";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

interface SeedUser {
  email: string;
  password: string;
  fullName: string;
  role: "rep" | "manager";
}

const EXTRA_REPS: SeedUser[] = [
  {
    email: EXTRA_REP_EMAILS.sam,
    password: "demo-rep-2026",
    fullName: "Sam Patel",
    role: "rep",
  },
  {
    email: EXTRA_REP_EMAILS.riley,
    password: "demo-rep-2026",
    fullName: "Riley Chen",
    role: "rep",
  },
];

async function upsertUser(user: SeedUser) {
  const supabase = createServiceClient();
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  const existing = existingUsers.users.find((u) => u.email === user.email);

  if (existing) {
    await supabase.auth.admin.updateUserById(existing.id, {
      password: user.password,
      email_confirm: true,
      user_metadata: { full_name: user.fullName, role: user.role },
    });
    await supabase.from("profiles").upsert({
      id: existing.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
    });
    console.log(`Updated: ${user.email}`);
    return;
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { full_name: user.fullName, role: user.role },
  });

  if (error) throw error;

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
    });
  }

  console.log(`Created: ${user.email}`);
}

async function upsertDemoUser(role: "rep" | "manager") {
  const demo = getDemoUser(role);
  await upsertUser({
    email: demo.email,
    password: demo.password,
    fullName: demo.fullName,
    role: demo.role,
  });
}

async function main() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }

  await upsertDemoUser("rep");
  await upsertDemoUser("manager");
  for (const rep of EXTRA_REPS) {
    await upsertUser(rep);
  }
  console.log("Demo users ready (1 manager + 3 reps).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
