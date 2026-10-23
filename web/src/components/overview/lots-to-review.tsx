import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { rate } from "@/lib/domain/metrics";
import { formatFraction, formatPercent } from "@/lib/format";
import type { LotYield } from "@/lib/queries/overview";

/** The lots with the lowest rolled throughput yield, ties broken by lot ID. */
export function lowestYieldLots(lots: LotYield[], count: number): LotYield[] {
  return lots
    .filter((lot) => lot.devicesTestedAllStages > 0)
    .map((lot) => ({ lot, value: rate(lot.devicesPassingAllStages, lot.devicesTestedAllStages) ?? 0 }))
    .sort((a, b) => a.value - b.value || a.lot.lotId.localeCompare(b.lot.lotId))
    .slice(0, count)
    .map(({ lot }) => lot);
}

export function LotsToReview({ lots }: { lots: LotYield[] }) {
  if (lots.length === 0) {
    return <p className="text-sm text-ink-muted">No lot has devices tested in all three stages yet.</p>;
  }
  return (
    <Table>
      <TableCaption>
        Material and sensor are batch IDs. Attributes are listed for comparison, not as evidence of
        a cause.
      </TableCaption>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Lot</TableHead>
          <TableHead className="text-right">Yield</TableHead>
          <TableHead>Line</TableHead>
          <TableHead>Shift</TableHead>
          <TableHead>Material</TableHead>
          <TableHead>Sensor</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lots.map((lot) => (
          <TableRow key={lot.lotId}>
            <TableCell className="font-medium">{lot.lotId}</TableCell>
            <TableCell className="text-right">
              {formatPercent(rate(lot.devicesPassingAllStages, lot.devicesTestedAllStages))}
              <span className="block text-xs text-ink-muted">
                {formatFraction(lot.devicesPassingAllStages, lot.devicesTestedAllStages)}
              </span>
            </TableCell>
            <TableCell className="text-ink-secondary">{lot.assemblyLine}</TableCell>
            <TableCell className="text-ink-secondary">{lot.shift}</TableCell>
            <TableCell className="text-ink-secondary">{lot.materialBatch}</TableCell>
            <TableCell className="text-ink-secondary">{lot.sensorBatch}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
