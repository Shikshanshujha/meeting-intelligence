import { notFound, redirect } from "next/navigation";
import { LogOutButton } from "@/components/auth/log-out-button";
import { ProspectDetail } from "@/components/manager/prospect-detail";
import { AppShell } from "@/components/shared/app-shell";
import { getSessionProfile } from "@/lib/auth/session";
import { getManagerProspectDetail } from "@/lib/data/manager-prospect";

export const revalidate = 30;

interface ProspectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ManagerProspectPage({ params }: ProspectPageProps) {
  const profile = await getSessionProfile();

  if (!profile) {
    redirect("/");
  }

  if (profile.role !== "manager") {
    redirect("/rep");
  }

  const { id } = await params;
  const prospect = await getManagerProspectDetail(id);

  if (!prospect) {
    notFound();
  }

  return (
    <AppShell
      role="manager"
      title={prospect.company}
      subtitle={`${prospect.owner_name} · ${prospect.meetings.filter((m) => m.notes).length} meetings with notes`}
      backHref="/manager"
      backLabel="Pipeline"
      actions={<LogOutButton />}
    >
      <ProspectDetail prospect={prospect} />
    </AppShell>
  );
}
