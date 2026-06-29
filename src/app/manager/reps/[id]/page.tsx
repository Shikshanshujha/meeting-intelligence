import { notFound, redirect } from "next/navigation";
import { LogOutButton } from "@/components/auth/log-out-button";
import { RepDetail } from "@/components/manager/rep-detail";
import { AppShell } from "@/components/shared/app-shell";
import { getSessionProfile } from "@/lib/auth/session";
import { getManagerRepDetail } from "@/lib/data/manager-rep";

export const revalidate = 30;

interface RepPageProps {
  params: Promise<{ id: string }>;
}

export default async function ManagerRepPage({ params }: RepPageProps) {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/");
  }

  if (profile.role !== "manager") {
    redirect("/rep");
  }

  const { id } = await params;
  const rep = await getManagerRepDetail(id);

  if (!rep) {
    notFound();
  }

  return (
    <AppShell
      role="manager"
      title={rep.full_name}
      subtitle={`${rep.stats.prospect_count} prospects · ${rep.stats.converted} converted · ${rep.stats.rejected} lost`}
      backHref="/manager"
      backLabel="Team overview"
      actions={<LogOutButton />}
    >
      <RepDetail rep={rep} />
    </AppShell>
  );
}
