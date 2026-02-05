import type { Source, Sentiment, Urgency } from "@/types";

interface FiltersProps {
  search: string;
  setSearch: (value: string) => void;
  source: Source;
  setSource: (value: Source) => void;
  sentiment: Sentiment;
  setSentiment: (value: Sentiment) => void;
  days: string;
  setDays: (value: string) => void;
  urgency: Urgency | "";
  setUrgency: (value: Urgency | "") => void;
  selectedCount: number;
  onAnalyzeSelected: () => void;
  analyzing: boolean;
}

export function Filters({
  search,
  setSearch,
  source,
  setSource,
  sentiment,
  setSentiment,
  days,
  setDays,
  urgency,
  setUrgency,
  selectedCount,
  onAnalyzeSelected,
  analyzing,
}: FiltersProps) {
  return (
    <div className="filters">
      {/* Urgency Filter */}
      <div className="filter-group">
        <label>Urgency</label>
        <select value={urgency} onChange={(e) => setUrgency(e.target.value as Urgency | "")}>
          <option value="">All Urgency</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Time Filter */}
      <div className="filter-group">
        <label>Time Period</label>
        <select value={days} onChange={(e) => setDays(e.target.value)}>
          <option value="">All time</option>
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
        </select>
      </div>

      {/* Source Filter */}
      <div className="filter-group">
        <label>Source</label>
        <select value={source} onChange={(e) => setSource(e.target.value as Source)}>
          <option value="">All Sources</option>
          <option value="discord">Discord</option>
          <option value="github">GitHub</option>
          <option value="twitter">Twitter</option>
          <option value="support">Support</option>
          <option value="email">Email</option>
          <option value="forum">Forum</option>
        </select>
      </div>

      {/* Sentiment Filter */}
      <div className="filter-group">
        <label>Sentiment</label>
        <select value={sentiment} onChange={(e) => setSentiment(e.target.value as Sentiment)}>
          <option value="">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
      </div>

      {/* Search */}
      <div className="filter-group search">
        <label>Search</label>
        <input
          type="text"
          placeholder="Search feedback..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Analyze Selected Button */}
      <button
        className="analyze-selected-btn"
        onClick={onAnalyzeSelected}
        disabled={selectedCount === 0 || analyzing}
      >
        {analyzing ? 'Analyzing...' : `Analyze Selected (${selectedCount})`}
      </button>
    </div>
  );
}
