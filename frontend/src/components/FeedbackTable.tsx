import { useState } from "react";
import type { Feedback } from "@/types";

interface FeedbackTableProps {
  feedback: Feedback[];
  loading: boolean;
  selectedIds: number[];
  onSelectionChange: (ids: number[]) => void;
  onAnalyze: (id: number) => void;
  analyzingId: number | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

export function FeedbackTable({
  feedback,
  loading,
  selectedIds,
  onSelectionChange,
  onAnalyze,
  analyzingId,
  currentPage,
  totalPages,
  totalItems,
  onPageChange,
}: FeedbackTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const allSelected = feedback.length > 0 && feedback.every((f) => selectedIds.includes(f.id));
  const someSelected = feedback.some((f) => selectedIds.includes(f.id)) && !allSelected;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange(selectedIds.filter((id) => !feedback.find((f) => f.id === id)));
    } else {
      const newIds = [...new Set([...selectedIds, ...feedback.map((f) => f.id)])];
      onSelectionChange(newIds);
    }
  };

  const handleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (loading) {
    return (
      <div className="feedback-table">
        <div className="loading">Loading feedback...</div>
      </div>
    );
  }

  if (feedback.length === 0) {
    return (
      <div className="feedback-table">
        <div className="loading">No feedback found</div>
      </div>
    );
  }

  return (
    <div className="feedback-table">
      {/* Header */}
      <div className="feedback-header">
        <div>
          <input
            type="checkbox"
            checked={allSelected}
            ref={(el) => {
              if (el) el.indeterminate = someSelected;
            }}
            onChange={handleSelectAll}
          />
        </div>
        <div>Source</div>
        <div>Author</div>
        <div>Content</div>
        <div>Created</div>
        <div>Sentiment</div>
        <div>Themes</div>
        <div>Urgency</div>
        <div>Action</div>
      </div>

      {/* Rows */}
      {feedback.map((item) => (
        <div
          key={item.id}
          className="feedback-row"
        >
          <div>
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={() => handleSelectOne(item.id)}
            />
          </div>
          <div>
            <span className={`source-badge source-${item.source}`}>
              {item.source}
            </span>
          </div>
          <div className="author-cell" title={item.author || "Anonymous"}>
            {item.author || "Anonymous"}
          </div>
          <div
            className={`content-cell ${expandedId === item.id ? "expanded" : ""}`}
            onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            title={expandedId === item.id ? "Click to collapse" : "Click to expand"}
          >
            {item.content}
          </div>
          <div className="date-cell">
            {item.created_at ? formatDate(item.created_at) : "-"}
          </div>
          <div>
            {item.sentiment ? (
              <span className={`sentiment-badge sentiment-${item.sentiment}`}>
                {item.sentiment}
                {item.sentiment_score !== null && (
                  <span className="score">({item.sentiment_score})</span>
                )}
              </span>
            ) : (
              <span className="empty-cell">-</span>
            )}
          </div>
          <div className="themes">
            {item.themes ? (
              <>
                {item.themes.split(",").slice(0, 2).map((theme) => (
                  <span key={theme} className="theme-tag">
                    {theme.trim()}
                  </span>
                ))}
                {item.themes.split(",").length > 2 && (
                  <span className="theme-tag">+{item.themes.split(",").length - 2}</span>
                )}
              </>
            ) : (
              <span className="empty-cell">-</span>
            )}
          </div>
          <div>
            {item.urgency ? (
              <span className={`urgency-badge urgency-${item.urgency}`}>
                {item.urgency}
              </span>
            ) : (
              <span className="empty-cell">-</span>
            )}
          </div>
          <div>
            <button
              className="analyze-btn"
              onClick={() => onAnalyze(item.id)}
              disabled={analyzingId === item.id}
            >
              {analyzingId === item.id ? "..." : "Analyze"}
            </button>
          </div>
        </div>
      ))}

      {/* Pagination */}
      <div className="pagination">
        <span className="page-info">
          {((currentPage - 1) * 20) + 1}-{Math.min(currentPage * 20, totalItems)} of {totalItems} items
        </span>
        <div className="page-controls">
          <button
            className="page-btn"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
          >
            Prev
          </button>
          <div className="page-input-group">
            <input
              type="number"
              className="page-input"
              defaultValue={currentPage}
              key={currentPage}
              min={1}
              max={totalPages}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const page = parseInt((e.target as HTMLInputElement).value);
                  if (page >= 1 && page <= totalPages) {
                    onPageChange(page);
                  }
                }
              }}
              onBlur={(e) => {
                const page = parseInt(e.target.value);
                if (page >= 1 && page <= totalPages && page !== currentPage) {
                  onPageChange(page);
                }
              }}
            />
            <span className="page-total">of {totalPages}</span>
          </div>
          <button
            className="page-btn"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
