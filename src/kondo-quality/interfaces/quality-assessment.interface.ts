export interface ContentQualityBreakdown {
  basicInfo: number;    // Name, type, location info
  pricing: number;      // Lot prices, condo rent, finance options
  conveniences: number; // Infrastructure and amenities
  details: number;      // Description, contact info, additional details
}

export interface MediaQualityBreakdown {
  images: number;       // Presence and count of images
  quality: number;      // Image quality assessment
  videos: number;       // Presence and quality of videos
  recency: number;      // How recent the media is
}

export interface QualityScores {
  contentQuality: number;
  mediaQuality: number;
  overallQuality: number;
}

export interface QualityAssessment extends QualityScores {
  kondoId: number;
  meetsThreshold: boolean;
  lastUpdated: Date;
  breakdown: {
    content: ContentQualityBreakdown;
    media: MediaQualityBreakdown;
  };
}

export interface QualityUpdateResult {
  success: boolean;
  kondoId: number;
  previousScores?: QualityScores;
  newScores: QualityScores;
  updated: boolean; // Whether scores actually changed
  error?: string;
}
