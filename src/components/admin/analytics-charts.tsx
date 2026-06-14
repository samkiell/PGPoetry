import type { AnalyticsDay } from "@/lib/data/admin";

/* These are pure presentational SVG/CSS charts — no client JS, no deps. */

const LIKE_COLOR = "var(--primary)";
const COMMENT_COLOR = "#6b8afd"; // soft indigo, readable in both themes

/**
 * A 30-day stacked area/line trend of likes and comments. Built as an SVG
 * polyline + filled area; scales to the busiest day so quiet sites still read.
 */
export function TrendChart({ series }: { series: AnalyticsDay[] }) {
  const W = 720;
  const H = 200;
  const PAD = 8;
  const max = Math.max(
    1,
    ...series.map((d) => Math.max(d.likes, d.comments)),
  );
  const n = series.length;
  const x = (i: number) => PAD + (i * (W - PAD * 2)) / Math.max(1, n - 1);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);

  function path(key: "likes" | "comments"): string {
    return series
      .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`)
      .join(" ");
  }
  function area(key: "likes" | "comments"): string {
    const line = path(key);
    return `${line} L ${x(n - 1).toFixed(1)} ${H - PAD} L ${x(0).toFixed(1)} ${H - PAD} Z`;
  }

  const firstLabel = formatLabel(series[0]?.date);
  const midLabel = formatLabel(series[Math.floor(n / 2)]?.date);
  const lastLabel = formatLabel(series[n - 1]?.date);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4 text-xs">
        <Legend color={LIKE_COLOR} label="Likes" />
        <Legend color={COMMENT_COLOR} label="Comments" />
        <span className="text-muted-foreground ml-auto">Last 30 days</span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="h-44 w-full"
        preserveAspectRatio="none"
        role="img"
        aria-label="Likes and comments over the last 30 days"
      >
        <defs>
          <linearGradient id="likeFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={LIKE_COLOR} stopOpacity="0.25" />
            <stop offset="100%" stopColor={LIKE_COLOR} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area("likes")} fill="url(#likeFill)" />
        <path
          d={path("likes")}
          fill="none"
          stroke={LIKE_COLOR}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path("comments")}
          fill="none"
          stroke={COMMENT_COLOR}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <div className="text-muted-foreground flex justify-between text-[10px]">
        <span>{firstLabel}</span>
        <span>{midLabel}</span>
        <span>{lastLabel}</span>
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="text-muted-foreground inline-flex items-center gap-1.5">
      <span
        className="inline-block size-2.5 rounded-full"
        style={{ background: color }}
      />
      {label}
    </span>
  );
}

function formatLabel(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Horizontal bar list — a label, a proportional bar, and a value. Used for top
 * poems and top tags.
 */
export function BarList({
  items,
}: {
  items: { label: string; value: number; href?: string; sub?: string }[];
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ol className="flex flex-col gap-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            {item.href ? (
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 truncate hover:text-primary"
              >
                {item.label}
              </a>
            ) : (
              <span className="min-w-0 truncate">{item.label}</span>
            )}
            <span className="text-muted-foreground shrink-0 tabular-nums">
              {item.value.toLocaleString()}
              {item.sub ? (
                <span className="ml-1 text-[10px] opacity-70">{item.sub}</span>
              ) : null}
            </span>
          </div>
          <div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary/70 h-full rounded-full"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}
