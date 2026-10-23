import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { LotYieldChart } from "@/components/charts/lot-yield-chart";
import { ReliabilityDayChart } from "@/components/charts/reliability-day-chart";
import { DataNotes } from "@/components/overview/data-notes";
import { IonPassDotPlot } from "@/components/overview/ion-pass-dot-plot";
import { LotsToReview, lowestYieldLots } from "@/components/overview/lots-to-review";
import { FixtureDataNotice, SetupNotice } from "@/components/overview/notices";
import { OverviewSkeleton } from "@/components/overview/overview-skeleton";
import { Section } from "@/components/overview/section";
import { YieldCascade } from "@/components/overview/yield-cascade";
import { db } from "@/lib/db/client";
import { rate } from "@/lib/domain/metrics";
import { ConfigError, getDataSource } from "@/lib/env";
import { formatInt } from "@/lib/format";
import { toLotYieldPoints, toReliabilityDayPoints } from "@/lib/overview-view";
import { getExecutiveOverview, type ExecutiveOverview } from "@/lib/queries/overview";

export const metadata: Metadata = {
  title: "Executive overview · Sensor Reliability Analytics",
};

export default function ExecutiveOverviewPage() {
  return (
    <>
      <header>
        <h1 className="text-[1.75rem] leading-tight font-semibold tracking-tight">
          Executive overview
        </h1>
        <p className="mt-2 max-w-[68ch] text-ink-secondary">
          Where devices drop out across characterization, reliability and environmental testing.
        </p>
      </header>
      <Suspense fallback={<OverviewSkeleton />}>
        <OverviewContent />
      </Suspense>
    </>
  );
}

async function OverviewContent() {
  // Wait for a real request: the database is never queried at build time.
  await connection();

  let overview: ExecutiveOverview;
  try {
    overview = await getExecutiveOverview(db);
  } catch (error) {
    if (error instanceof ConfigError) return <SetupNotice detail={error.message} />;
    throw error; // Handled by error.tsx.
  }

  const { counts, throughput } = overview;
  const totalRecords =
    counts.records.characterization + counts.records.reliability + counts.records.environmental;
  const lotPoints = toLotYieldPoints(overview.lotYields);
  const overallYield = rate(throughput.devicesPassingAllStages, throughput.devicesTestedAllStages);

  return (
    <>
      {getDataSource() === "fixture" ? <FixtureDataNotice /> : null}

      <p className="mt-6 max-w-[72ch] text-sm leading-relaxed text-ink-secondary">
        {formatInt(counts.devices)} devices from {formatInt(counts.lots)} production lots, with{" "}
        {formatInt(totalRecords)} test records from {formatInt(counts.stations)} test stations.
      </p>

      <YieldCascade stages={overview.stagePassRates} throughput={throughput} />

      <div className="mt-12 grid gap-x-12 gap-y-12 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Section
          id="lot-yield"
          title="Rolled throughput yield by lot"
          description="Share of each lot's devices that passed all three test stages."
        >
          <LotYieldChart data={lotPoints} overallYield={overallYield} />
        </Section>

        <Section
          id="lots-to-review"
          title="Lots to review"
          description="The five lots with the lowest rolled throughput yield."
        >
          <LotsToReview lots={lowestYieldLots(overview.lotYields, 5)} />
        </Section>

        <Section
          id="ion-pass"
          title="Device pass rate by ion"
          description="Share of devices whose records for each ion all passed, per stage."
        >
          <IonPassDotPlot rates={overview.ionPassRates} />
        </Section>

        <Section
          id="reliability-days"
          title="Reliability pass rate by test day"
          description="Share of reliability records that passed on each test day, per ion."
        >
          <ReliabilityDayChart data={toReliabilityDayPoints(overview.reliabilityByDay)} />
        </Section>
      </div>

      <DataNotes />
    </>
  );
}
