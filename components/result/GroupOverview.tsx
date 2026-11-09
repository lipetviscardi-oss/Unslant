"use client";

/**
 * Notas por grupo: gráfico de radar + lista com barras.
 * Grupos que não se aplicam ao texto ficam fora do radar.
 */

import type { GroupResult } from "@/lib/analysis/types";
import { TAXONOMY } from "@/lib/taxonomy";
import { formatScore, severity, SEVERITY_BG } from "@/lib/client/format";

function Radar({ groups }: { groups: (GroupResult & { score: number })[] }) {
  const n = groups.length;
  if (n < 3) return null;
  const cx = 220;
  const cy = 150;
  const r = 100;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, v: number) => {
    const a = angle(i);
    return [cx + Math.cos(a) * r * (v / 10), cy + Math.sin(a) * r * (v / 10)] as const;
  };
  const polygon = groups.map((g, i) => point(i, g.score).join(",")).join(" ");

  return (
    <svg viewBox="0 0 440 300" className="mx-auto w-full max-w-[460px]" role="img" aria-label="Gráfico de radar com a nota de cada aspecto">
      {[2.5, 5, 7.5, 10].map((ring) => (
        <polygon
          key={ring}
          points={groups.map((_, i) => point(i, ring).join(",")).join(" ")}
          fill="none"
          stroke="var(--color-line)"
          strokeWidth={ring === 10 ? 1.5 : 1}
        />
      ))}
      {groups.map((_, i) => {
        const [x, y] = point(i, 10);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--color-line)" />;
      })}
      <polygon points={polygon} fill="var(--color-teal)" fillOpacity="0.18" stroke="var(--color-teal)" strokeWidth="2" strokeLinejoin="round" />
      {groups.map((g, i) => {
        const [x, y] = point(i, g.score);
        return <circle key={g.id} cx={x} cy={y} r="3.5" fill="var(--color-teal-deep)" />;
      })}
      {groups.map((g, i) => {
        const [x, y] = point(i, 12.2);
        const cos = Math.cos(angle(i));
        const anchor = Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end";
        const name = TAXONOMY.find((t) => t.id === g.id)?.shortName.pt ?? g.id;
        return (
          <text key={g.id} x={x} y={y + 4} textAnchor={anchor} fontSize="12" fill="var(--color-muted)" fontFamily="var(--font-sans)">
            {name}
          </text>
        );
      })}
      <text x={cx + 3} y={cy - r * 0.5 - 3} fontSize="9" fill="var(--color-muted)" opacity="0.8">5</text>
      <text x={cx + 3} y={cy - r - 3} fontSize="9" fill="var(--color-muted)" opacity="0.8">10</text>
    </svg>
  );
}

export function GroupOverview({ groups, onSelectGroup }: { groups: GroupResult[]; onSelectGroup: (id: string) => void }) {
  const scored = groups.filter((g): g is GroupResult & { score: number } => g.score !== null);
  const sorted = [...groups].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));

  return (
    <section aria-labelledby="groups-title" className="grid gap-6">
      <div>
        <h2 id="groups-title" className="text-2xl font-medium">
          Onde o texto pesa
        </h2>
        <p className="mt-1 text-muted">Nota de cada aspecto, de 0 (sem problema) a 10. Clique num aspecto para ver os detalhes.</p>
      </div>
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Radar groups={scored} />
        <ul className="grid gap-2.5">
          {sorted.map((g) => {
            const group = TAXONOMY.find((t) => t.id === g.id);
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => onSelectGroup(g.id)}
                  className="grid w-full grid-cols-[minmax(0,13rem)_minmax(0,1fr)_2.5rem] items-center gap-3 rounded-lg px-2 py-1.5 text-left hover:bg-paper"
                >
                  <span className="truncate text-[15px]">{group?.name.pt ?? g.id}</span>
                  {g.score === null ? (
                    <span className="col-span-2 text-sm text-muted">não se aplica</span>
                  ) : (
                    <>
                      <span className="h-2.5 overflow-hidden rounded-full bg-mist-deep">
                        <span
                          className={`block h-full rounded-full ${SEVERITY_BG[severity(g.score)]}`}
                          style={{ width: `${Math.max(2, g.score * 10)}%` }}
                        />
                      </span>
                      <span className="text-right font-display text-[15px] tabular-nums">{formatScore(g.score)}</span>
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
