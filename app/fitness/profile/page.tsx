import Link from "next/link";
import { LogOut, Scale, Tags, ChevronRight } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import FitnessNav from "@/components/fitness/FitnessNav";
import { prisma } from "@/lib/fitness/prisma";
import { getSettings } from "@/lib/fitness/settings-service";
import { logBodyWeight, logout } from "@/lib/fitness/profile-actions";
import { Card, SectionTitle } from "@/components/ui/profit-ui";
import { SettingsForm } from "@/components/fitness/profit/profile/SettingsForm";
import { fmtDate, fmtWeight } from "@/lib/fitness/format";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const [settings, weights, totalWorkouts] = await Promise.all([
    getSettings(),
    prisma.bodyMetric.findMany({
      where: { weightKg: { not: null } },
      orderBy: { measuredAt: "desc" },
      take: 8,
    }),
    prisma.workout.count(),
  ]);

  const latest = weights[0]?.weightKg ?? null;

  return (
    <AppLayout>
      <FitnessNav />
      <div className="flex flex-col gap-5 py-1">
        <h1 className="text-2xl font-extrabold tracking-tight">Profile</h1>

        <Card className="flex items-stretch gap-4">
          <div className="flex-1">
            <div className="font-mono text-[26px] font-medium leading-none">{totalWorkouts}</div>
            <div className="mt-1.5 text-[11px] text-muted">Lifetime workouts</div>
          </div>
          {latest && (
            <>
              <div className="w-px bg-border" />
              <div className="flex-1">
                <div className="font-mono text-[26px] font-medium leading-none">
                  {fmtWeight(latest, settings.units)}
                </div>
                <div className="mt-1.5 text-[11px] text-muted">Current bodyweight</div>
              </div>
            </>
          )}
        </Card>

        <section className="flex flex-col gap-2">
          <SectionTitle>Preferences</SectionTitle>
          <Card>
            <SettingsForm settings={settings} />
          </Card>
        </section>

        <section className="flex flex-col gap-2">
          <SectionTitle>Manage</SectionTitle>
          <Link href="/fitness/exercises">
            <Card className="flex items-center gap-3 active:bg-surface-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2">
                <Tags size={20} className="text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Tag exercises</p>
                <p className="text-xs text-muted">Add muscle tags to imported exercises</p>
              </div>
              <ChevronRight size={20} className="text-muted" />
            </Card>
          </Link>
        </section>

        <section className="flex flex-col gap-2">
          <SectionTitle>Bodyweight</SectionTitle>
          <Card className="flex flex-col gap-3">
            <form action={logBodyWeight} className="flex gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3">
                <Scale size={18} className="text-muted" />
                <input
                  name="weightKg"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  placeholder={`Log today's weight (${settings.units})`}
                  className="w-full bg-transparent py-2.5 outline-none"
                />
              </div>
              <button className="rounded-[11px] bg-accent px-5 font-semibold text-accent-foreground active:bg-accent-press">
                Log
              </button>
            </form>
            {weights.length > 0 && (
              <div className="flex flex-col divide-y divide-[#15181d]">
                {weights.map((w) => (
                  <div key={w.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-[#9aa3ad]">{fmtDate(w.measuredAt)}</span>
                    <span className="font-mono">{fmtWeight(w.weightKg!, settings.units)}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </section>

        <form action={logout}>
          <button className="flex w-full items-center justify-center gap-2 rounded-[13px] border border-[#2a2024] py-3.5 font-semibold text-danger active:bg-surface-2">
            <LogOut size={18} /> Log out
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
