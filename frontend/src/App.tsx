import { useState, useEffect, useCallback } from "react";
import { StatsCards } from "@/components/StatsCards";
import { Filters } from "@/components/Filters";
import { FeedbackTable } from "@/components/FeedbackTable";
import type { Stats, Feedback, FeedbackResponse, Source, Sentiment, Urgency } from "@/types";
import "./App.css";

// API base URL - localhost for development, empty for production (same-origin)
const API_BASE = import.meta.env.DEV ? "http://localhost:8787" : "";

function App() {
  // Stats state
  const [stats, setStats] = useState<Stats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Feedback state
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const [paginationLoading, setPaginationLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Filter state
  const [search, setSearch] = useState("");
  const [source, setSource] = useState<Source>("");
  const [sentiment, setSentiment] = useState<Sentiment>("");
  const [days, setDays] = useState("");  // Changed from "7" to "" (All time)
  const [urgency, setUrgency] = useState<Urgency | "">("");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Analysis state
  const [analyzingId, setAnalyzingId] = useState<number | null>(null);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stats`);
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch feedback
  const fetchFeedback = useCallback(async (page: number = 1, isPagination: boolean = false) => {
    // Only show loading for initial load or filter changes, not pagination
    if (!isPagination) {
      setFeedbackLoading(true);
    } else {
      setPaginationLoading(true);
    }

    try {
      const params = new URLSearchParams();
      params.set("limit", "20");
      params.set("offset", String((page - 1) * 20));

      if (source) params.set("source", source);
      if (sentiment) params.set("sentiment", sentiment);
      if (days) params.set("days", days);
      if (search) params.set("search", search);
      if (urgency) params.set("urgency", urgency);

      const res = await fetch(`${API_BASE}/api/feedback?${params}`);
      const data: FeedbackResponse = await res.json();

      setFeedback(data.data);
      setTotalPages(data.meta.pages);
      setTotalItems(data.meta.total);
      setCurrentPage(data.meta.currentPage);
    } catch (err) {
      console.error("Failed to fetch feedback:", err);
    } finally {
      setFeedbackLoading(false);
      setPaginationLoading(false);
    }
  }, [source, sentiment, days, search, urgency]);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Fetch feedback when filters change
  useEffect(() => {
    fetchFeedback(1);
    setSelectedIds([]); // Clear selection on filter change
  }, [source, sentiment, days, search, urgency, fetchFeedback]);

  // Handle page change
  const handlePageChange = (page: number) => {
    fetchFeedback(page, true); // true = isPagination
  };

  // Analyze single feedback
  const handleAnalyze = async (id: number) => {
    setAnalyzingId(id);
    try {
      const res = await fetch(`${API_BASE}/api/analyze/${id}`, { method: "POST" });
      const result = await res.json();

      if (result.error) {
        alert(`Analysis failed: ${result.error}`);
      } else {
        // Refresh data
        await fetchFeedback(currentPage);
        await fetchStats();
      }
    } catch (err) {
      console.error("Analysis failed:", err);
      alert("Analysis failed");
    } finally {
      setAnalyzingId(null);
    }
  };

  // Analyze selected feedback
  const handleAnalyzeSelected = async () => {
    if (selectedIds.length === 0) return;

    setBulkAnalyzing(true);
    setAnalyzeProgress({ current: 0, total: selectedIds.length });

    try {
      // Process in batches of 3 for controlled parallelism
      const batchSize = 3;
      let completed = 0;

      for (let i = 0; i < selectedIds.length; i += batchSize) {
        const batch = selectedIds.slice(i, i + batchSize);

        // Process current batch in parallel
        const promises = batch.map(id =>
          fetch(`${API_BASE}/api/analyze/${id}`, { method: "POST" })
            .then(res => res.json())
            .catch(err => {
              console.error(`Failed to analyze ID ${id}:`, err);
              return { error: true, id };
            })
        );

        await Promise.all(promises);

        // Update progress
        completed += batch.length;
        setAnalyzeProgress({ current: completed, total: selectedIds.length });
      }

      // Refresh data
      await fetchFeedback(currentPage);
      await fetchStats();
      setSelectedIds([]);
    } catch (err) {
      console.error("Bulk analysis failed:", err);
      alert("Some analyses may have failed");
    } finally {
      setBulkAnalyzing(false);
      setAnalyzeProgress({ current: 0, total: 0 });
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== "") {
        fetchFeedback(1);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="container">
      <h1>Feedback Dashboard</h1>

      <StatsCards stats={stats} loading={statsLoading} />

      <Filters
        search={search}
        setSearch={setSearch}
        source={source}
        setSource={setSource}
        sentiment={sentiment}
        setSentiment={setSentiment}
        days={days}
        setDays={setDays}
        urgency={urgency}
        setUrgency={setUrgency}
        selectedCount={selectedIds.length}
        onAnalyzeSelected={handleAnalyzeSelected}
        analyzing={bulkAnalyzing}
        analyzeProgress={analyzeProgress}
      />

      <FeedbackTable
        feedback={feedback}
        loading={feedbackLoading}
        paginationLoading={paginationLoading}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onAnalyze={handleAnalyze}
        analyzingId={analyzingId}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default App;
