export interface CompanyProfile {
  name: string;
  domain: string;
  locations: string[];
  goals: string[];
  focus?: string;
}

export interface DataRow {
  [key: string]: string | number | null;
}

export interface ChannelRoi {
  channel: string;
  roi: number;
}

export interface MarketingRoute {
  channel: string;
  priority: number;
  reasoning: string;
  budgetPct: number;
  timing: string;
  hashtags: string[];
  contentIdeas: string[];
}

export interface Predictions {
  trend: string;
  trendPct: number;
  demand: string;
  channelRoi: ChannelRoi[];
  influencerImpact: string;
}

export interface AnalysisResult {
  insights: string[];
  predictions: Predictions;
  routes: MarketingRoute[];
  campaignHashtags: string[];
  campaignContentIdeas: string[];
  surprise?: string;
}

export const DOMAINS = [
  "IT / Software",
  "Logistics / Supply Chain",
  "E-commerce / Retail",
  "Healthcare",
  "Education / EdTech",
  "Manufacturing",
  "Finance / FinTech",
  "Hospitality",
  "Real Estate",
  "Automotive",
  "Agriculture",
  "Energy / GreenTech",
  "Media / Entertainment",
  "Other",
];

export const GOAL_OPTIONS = [
  "Increase brand awareness",
  "Boost sales / revenue",
  "Enter new market",
  "Launch new product",
  "Reduce customer acquisition cost",
  "Improve customer retention",
  "Build influencer partnerships",
  "Dominate SEO / search rankings",
  "Increase social media engagement",
  "Generate leads / B2B clients",
];
