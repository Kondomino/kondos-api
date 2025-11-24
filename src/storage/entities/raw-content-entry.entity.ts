import { 
  Table, 
  Column, 
  Model, 
  DataType, 
  PrimaryKey, 
  AutoIncrement, 
  CreatedAt, 
  UpdatedAt, 
  ForeignKey, 
  BelongsTo 
} from 'sequelize-typescript';
import { RealEstateAgency } from '../../whatsapp/entities/real-estate-agency.entity';

@Table({
  tableName: 'RawContentEntries',
  timestamps: true,
})
export class RawContentEntry extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => RealEstateAgency)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    comment: 'Reference to the real estate agency'
  })
  agency_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'WhatsApp message ID that contained the media'
  })
  message_id: string;

  @Column({
    type: DataType.ENUM('pdf', 'image', 'video'),
    allowNull: false,
    comment: 'Type of content stored'
  })
  content_type: 'pdf' | 'image' | 'video';

  @Column({
    type: DataType.STRING,
    allowNull: false,
    comment: 'Path to the original file in storage'
  })
  storage_path: string;

  @Column({
    type: DataType.ENUM('pending', 'processed', 'failed'),
    defaultValue: 'pending',
    allowNull: false,
    comment: 'Current processing status of the raw content'
  })
  processing_status: 'pending' | 'processed' | 'failed';

  @Column({
    type: DataType.JSON,
    allowNull: true,
    comment: 'Additional metadata about the stored content'
  })
  metadata: {
    originalFilename: string;
    fileSize: number;
    contentType: string;
    extractedFiles?: string[];
    processingTime?: number;
    error?: string;
    [key: string]: any;
  };

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  // Relationships
  @BelongsTo(() => RealEstateAgency)
  real_estate_agency: RealEstateAgency;

  /**
   * Helper method to check if content is successfully processed
   */
  isProcessed(): boolean {
    return this.processing_status === 'processed';
  }

  /**
   * Helper method to check if content processing failed
   */
  hasFailed(): boolean {
    return this.processing_status === 'failed';
  }

  /**
   * Helper method to get extracted files count
   */
  getExtractedFilesCount(): number {
    return this.metadata?.extractedFiles?.length || 0;
  }

  /**
   * Helper method to get processing time in milliseconds
   */
  getProcessingTime(): number | null {
    return this.metadata?.processingTime || null;
  }

  /**
   * Helper method to get file size in bytes
   */
  getFileSize(): number {
    return this.metadata?.fileSize || 0;
  }

  /**
   * Helper method to get error message if processing failed
   */
  getErrorMessage(): string | null {
    return this.metadata?.error || null;
  }
}
