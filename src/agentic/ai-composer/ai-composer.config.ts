export const AI_COMPOSER_CONFIG = {
  enabled: true,
  
  // Processing rules
  processing: {
    minConfidenceForSkip: 0.95, // Skip if manual extraction was perfect (removed - not used)
    batchSize: 10,
    requiresRawData: false, // AI Composer works with or without scraped_raw_data
  },
  
  // HTML formatting
  html: {
    wrapInParagraphs: true,
    preserveFormatting: true,
  },
  
  // Description preferences
  description: {
    minLength: 150,
    maxLength: 300,
    targetParagraphs: 2, // 2-3 paragraphs
  },
  
  // Infrastructure description preferences
  infraDescription: {
    minLength: 50,
    maxLength: 150,
  },
  
  // Note: Model, temperature, max_tokens, API credentials 
  // are handled by GrokService (grok-3-mini, temp 0.7, 1500 tokens)
};
