// Feedback data types

export interface Feedback {
  id: number;
  source: string;
  author: string | null;
  content: string;
  created_at: string;
  sentiment: string | null;
  sentiment_score: number | null;
  themes: string | null;
  urgency: string | null;
  analyzed_at: string | null;
}

export interface Stats {
  total: number;
  bySource: { source: string; count: number }[];
  bySentiment: { sentiment: string; count: number }[];
  byUrgency: { urgency: string; count: number }[];
  recentCount: number;
  topThemes: { theme: string; count: number }[];
}

export interface FeedbackResponse {
  data: Feedback[];
  meta: {
    total: number;
    limit: number;
    offset: number;
    pages: number;
    currentPage: number;
  };
}

export type Source = 'discord' | 'github' | 'twitter' | 'support' | 'email' | 'forum' | '';
export type Sentiment = 'positive' | 'neutral' | 'negative' | '';
export type Urgency = 'high' | 'medium' | 'low';
