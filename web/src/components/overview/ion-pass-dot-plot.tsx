import { ION_COLORS, ION_SYMBOLS, IONS, rate, type Ion } from "@/lib/domain/metrics";
import { formatFraction, formatPercent } from "@/lib/format";
import type { IonPassRate } from "@/lib/queries/overview";

interface IonPassDotPlotProps {
  rates: IonPassRate[];
}

interface IonRow {
  ion: Ion;
  characterization: { rate: number | null; passing: number; devices: number } | null;
  reliability: { rate: number | null; passing: number; devices: number } | null;
}

/**
 * Device pass rate per ion, characterization (filled dot) vs. reliability
 * (ring). A dot plot rather than bars: the rates sit within a few points of
 * each other, and dots can use a zoomed axis honestly where bars cannot.
 * Values are printed beside each row, so color and position are never the
 * only way to read them.
 */
export function IonPassDotPlot({ rates }: IonPassDotPlotProps) {
  const rows: IonRow[] = IONS.map((ion) => {
    const pick = (stage: IonPassRate["stage"]) => {
      const row = rates.find((r) => r.stage === stage && r.ion === ion);
      return row
        ? { rate: rate(row.passingDevices, row.devices), passing: row.passingDevices, devices: row.devices }
        : null;
    };
    return { ion, characterization: pick("characterization"), reliability: pick("reliability") };
  });

  const values = rows
    .flatMap((r) => [r.characterization?.rate, r.reliability?.rate])
    .filter((v): v is number => typeof v === "number");

  if (values.length === 0) {
    return <p className="text-sm text-ink-muted">No characterization or reliability records yet.</p>;
  }

  // Axis: from a round 5% step at least 2 points below the lowest value, to 100%.
  const axisMin = Math.max(0, Math.floor((Math.min(...values) - 0.02) * 20) / 20);
  const ticks = [];
  for (let t = axisMin; t <= 1.0001; t += 0.05) ticks.push(Math.round(t * 100) / 100);
  const position = (value: number) => ((value - axisMin) / (1 - axisMin)) * 100;

  return (
    <figure>
      <div className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-ink-secondary">
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-full bg-ink-secondary" />
          Characterization
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2.5 rounded-full border-2 border-ink-secondary" />
          Reliability
        </span>
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">Device pass rate by ion and stage</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Ion</th>
            <th scope="col">Position</th>
            <th scope="col">Characterization</th>
            <th scope="col">Reliability</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.ion} className="h-11">
              <th scope="row" className="w-28 pr-3 text-left font-normal whitespace-nowrap">
                {row.ion} <span className="text-ink-muted">{ION_SYMBOLS[row.ion]}</span>
              </th>
              <td className="relative" aria-hidden="true">
                <div className="absolute inset-x-0 top-1/2 h-px bg-rule" />
                {row.characterization?.rate != null && row.reliability?.rate != null ? (
                  <div
                    className="absolute top-1/2 h-0.5 -translate-y-1/2"
                    style={{
                      left: `${position(Math.min(row.characterization.rate, row.reliability.rate))}%`,
                      width: `${Math.abs(position(row.characterization.rate) - position(row.reliability.rate))}%`,
                      background: ION_COLORS[row.ion],
                      opacity: 0.45,
                    }}
                  />
                ) : null}
                {row.characterization?.rate != null ? (
                  <Dot
                    left={position(row.characterization.rate)}
                    color={ION_COLORS[row.ion]}
                    filled
                    title={`${row.ion} characterization: ${formatFraction(row.characterization.passing, row.characterization.devices)} devices`}
                  />
                ) : null}
                {row.reliability?.rate != null ? (
                  <Dot
                    left={position(row.reliability.rate)}
                    color={ION_COLORS[row.ion]}
                    filled={false}
                    title={`${row.ion} reliability: ${formatFraction(row.reliability.passing, row.reliability.devices)} devices`}
                  />
                ) : null}
              </td>
              <td className="w-16 pl-3 text-right text-ink-secondary">
                {formatPercent(row.characterization?.rate ?? null)}
              </td>
              <td className="w-16 pl-2 text-right text-ink-secondary">
                {formatPercent(row.reliability?.rate ?? null)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot aria-hidden="true">
          <tr>
            <td />
            <td className="relative h-6">
              {ticks.map((tick) => (
                <span
                  key={tick}
                  className="absolute -translate-x-1/2 text-[11px] text-ink-muted"
                  style={{ left: `${position(tick)}%` }}
                >
                  {Math.round(tick * 100)}%
                </span>
              ))}
            </td>
            <td className="pl-3 text-right text-[11px] text-ink-muted">Char.</td>
            <td className="pl-2 text-right text-[11px] text-ink-muted">Rel.</td>
          </tr>
        </tfoot>
      </table>
      <figcaption className="mt-2 text-xs text-ink-muted">
        Axis starts at {Math.round(axisMin * 100)}% to separate close values.
      </figcaption>
    </figure>
  );
}

function Dot({ left, color, filled, title }: { left: number; color: string; filled: boolean; title: string }) {
  return (
    <span
      title={title}
      className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface"
      style={{
        left: `${left}%`,
        background: filled ? color : "var(--surface)",
        border: `2.5px solid ${color}`,
      }}
    />
  );
}
