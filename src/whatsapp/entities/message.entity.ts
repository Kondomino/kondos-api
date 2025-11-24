import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Conversation } from './conversation.entity';

@Table({
  tableName: 'Messages',
  timestamps: true,
})
export class Message extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => Conversation)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  conversation_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  whatsapp_message_id: string;

  @Column({
    type: DataType.ENUM('incoming', 'outgoing'),
    allowNull: false,
  })
  direction: 'incoming' | 'outgoing';

  @Column({
    type: DataType.ENUM('text', 'image', 'document', 'audio', 'video', 'location', 'contact', 'sticker'),
    allowNull: false,
  })
  message_type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location' | 'contact' | 'sticker';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  text_content: string;

  // Media references (not the actual files)
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  media_id: string; // WhatsApp media ID

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  media_url: string; // Cloud storage URL (when uploaded)

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  media_filename: string; // Original filename

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  media_mime_type: string; // MIME type

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  media_size: number; // File size in bytes

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  media_sha256: string; // SHA256 hash for verification

  // Location data (if message_type is 'location')
  @Column({
    type: DataType.DECIMAL(10, 8),
    allowNull: true,
  })
  latitude: number;

  @Column({
    type: DataType.DECIMAL(11, 8),
    allowNull: true,
  })
  longitude: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  location_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  location_address: string;

  // Contact data (if message_type is 'contact')
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  contact_name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  contact_phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  contact_email: string;

  // Message metadata
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  timestamp: Date;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_read: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_delivered: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  is_sent: boolean;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  metadata: any; // Additional WhatsApp message metadata

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  // Relationships
  @BelongsTo(() => Conversation)
  conversation: Conversation;
}
