

export interface PDFExtractionConfig {
  inputFolder: string;
}

export const getPDFExtractionConfig = (): PDFExtractionConfig => ({
  inputFolder: '/references/pdf'
});