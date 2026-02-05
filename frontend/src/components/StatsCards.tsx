import type { Stats } from "@/types";

interface StatsCardsProps {
  stats: Stats | null;
  loading: boolean;
}

// Blue shades from darkest to lightest (for ranked data)
const blueShades = [
  "#1E3A5F",  // darkest
  "#1D4ED8",
  "#2563EB",
  "#3B82F6",
  "#60A5FA",
  "#93C5FD",  // lightest
];

// Pie Chart Component
function PieChart({ data }: { data: { source: string; count: number }[] }) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return <div className="chart-empty">No data</div>;

  // Sort by count descending (highest proportion first)
  const sortedData = [...data].sort((a, b) => b.count - a.count);

  const size = 120;
  const radius = 50;
  const centerX = size / 2;
  const centerY = size / 2;

  let currentAngle = -90; // Start from top

  const slices = sortedData.map((item, index) => {
    const percentage = item.count / total;
    const angle = percentage * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate arc points
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);

    // Large arc flag
    const largeArc = angle > 180 ? 1 : 0;

    const pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    // Assign color based on rank (darkest for highest, lightest for lowest)
    const color = blueShades[Math.min(index, blueShades.length - 1)];

    return {
      path: pathD,
      color,
      source: item.source,
      count: item.count,
      percentage: Math.round(percentage * 100),
    };
  });

  return (
    <div className="pie-chart-container">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((slice, i) => (
          <path
            key={i}
            d={slice.path}
            fill={slice.color}
            stroke="white"
            strokeWidth="1"
          >
            <title>{slice.source}: {slice.count} ({slice.percentage}%)</title>
          </path>
        ))}
      </svg>
      <div className="pie-legend">
        {slices.map((slice) => (
          <div key={slice.source} className="legend-item">
            <span
              className="legend-color"
              style={{ background: slice.color }}
            />
            <span className="legend-label">{slice.source}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Horizontal Bar Chart Component
function BarChart({ data }: { data: { theme: string; count: number }[] }) {
  if (data.length === 0) return <div className="chart-empty">No data</div>;

  const maxCount = Math.max(...data.map((d) => d.count));
  const displayData = data.slice(0, 5);

  return (
    <div className="bar-chart">
      {displayData.map((item) => (
        <div key={item.theme} className="bar-row">
          <span className="bar-label" title={item.theme}>{item.theme}</span>
          <div className="bar-track">
            <div
              className="bar-fill"
              style={{ width: `${(item.count / maxCount) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Diverging Bar Chart for Sentiment
function SentimentBar({
  positive,
  neutral,
  negative,
}: {
  positive: number;
  neutral: number;
  negative: number;
}) {
  const total = positive + neutral + negative;
  if (total === 0) return <div className="chart-empty">No data</div>;

  const negativePercent = (negative / total) * 100;
  const neutralPercent = (neutral / total) * 100;
  const positivePercent = (positive / total) * 100;

  return (
    <div className="sentiment-bar-container">
      <div className="sentiment-bar">
        <div
          className="sentiment-segment negative"
          style={{ width: `${negativePercent}%` }}
          title={`Negative: ${negative} (${Math.round(negativePercent)}%)`}
        />
        <div
          className="sentiment-segment neutral"
          style={{ width: `${neutralPercent}%` }}
          title={`Neutral: ${neutral} (${Math.round(neutralPercent)}%)`}
        />
        <div
          className="sentiment-segment positive"
          style={{ width: `${positivePercent}%` }}
          title={`Positive: ${positive} (${Math.round(positivePercent)}%)`}
        />
      </div>
      <div className="sentiment-labels">
        <span className="sentiment-label negative">
          <span className="dot" /> {negative} negative
        </span>
        <span className="sentiment-label neutral">
          <span className="dot" /> {neutral} neutral
        </span>
        <span className="sentiment-label positive">
          <span className="dot" /> {positive} positive
        </span>
      </div>
    </div>
  );
}

export function StatsCards({ stats, loading }: StatsCardsProps) {
  if (loading) {
    return (
      <div className="stats-grid">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat-card">
            <h3>Loading...</h3>
            <div className="value">-</div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  const positive = stats.bySentiment.find((s) => s.sentiment === "positive")?.count || 0;
  const neutral = stats.bySentiment.find((s) => s.sentiment === "neutral")?.count || 0;
  const negative = stats.bySentiment.find((s) => s.sentiment === "negative")?.count || 0;

  return (
    <div className="stats-grid">
      {/* Total Feedback */}
      <div className="stat-card">
        <h3>Total Feedback</h3>
        <div className="value">{stats.total}</div>
        <div className="breakdown">
          <div className="breakdown-item">
            <span>All time ({stats.recentCount} in last 7 days)</span>
          </div>
        </div>
      </div>

      {/* Sentiment - Diverging Bar */}
      <div className="stat-card">
        <h3>Sentiment</h3>
        <SentimentBar positive={positive} neutral={neutral} negative={negative} />
      </div>

      {/* By Source - Pie Chart */}
      <div className="stat-card">
        <h3>By Source</h3>
        <PieChart data={stats.bySource} />
      </div>

      {/* Top Themes - Bar Chart */}
      <div className="stat-card">
        <h3>Top Themes</h3>
        <BarChart data={stats.topThemes} />
      </div>
    </div>
  );
}
