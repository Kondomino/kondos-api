export interface StorageFile {
  path: string;
  url: string;
  size: number;
  contentType: string;
}

export interface RawContentStorageResult {
  success: boolean;
  agencyId: number;
  messageId: string;
  contentType: 'pdf' | 'image' | 'video';
  originalFile: StorageFile;
  extractedContent?: {
    textFile?: StorageFile;
    tablesFile?: StorageFile;
    images?: StorageFile[];
  };
  metadata: {
    processingTime: number;
    timestamp: Date;
    originalFilename: string;
  };
  error?: string;
}

export interface BatchUploadResult {
  success: boolean;
  results: Array<{
    success: boolean;
    file: StorageFile;
    error?: string;
  }>;
  metadata: {
    totalFiles: number;
    successfulUploads: number;
    failedUploads: number;
    processingTime: number;
  };
}

export interface RawContentEntry {
  id?: number;
  agency_id: number;
  message_id: string;
  content_type: 'pdf' | 'image' | 'video';
  storage_path: string;
  processing_status: 'pending' | 'processed' | 'failed';
  metadata: {
    originalFilename: string;
    fileSize: number;
    contentType: string;
    extractedFiles?: string[];
    processingTime?: number;
    error?: string;
  };
  created_at?: Date;
  updated_at?: Date;
}
