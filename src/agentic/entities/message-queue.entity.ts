import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'MessageQueue',
  timestamps: true,
  underscored: true,
})
export class MessageQueue extends Model<MessageQueue> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ field: 'phone_number', type: DataType.STRING, allowNull: false })
  phoneNumber: string;

  @Column({ field: 'message_content', type: DataType.TEXT, allowNull: false })
  messageContent: string;

  @Column({ field: 'whatsapp_message_id', type: DataType.STRING, allowNull: false })
  whatsappMessageId: string;

  @Column({ field: 'conversation_id', type: DataType.INTEGER, allowNull: false })
  conversationId: number;

  @Column({ field: 'agency_id', type: DataType.INTEGER, allowNull: false })
  agencyId: number;

  @Column({ field: 'message_data', type: DataType.JSONB, allowNull: false })
  messageData: {
    messageType: string;
    mediaData?: any;
    contactContext?: any;
  };

  @Column({ field: 'verification_metadata', type: DataType.JSONB, allowNull: false })
  verificationMetadata: {
    confidence: number;
    reasoning: string;
    agentName: string;
  };

  @Column({ 
    type: DataType.ENUM('pending', 'processing', 'completed', 'failed'), 
    defaultValue: 'pending' 
  })
  status: 'pending' | 'processing' | 'completed' | 'failed';

  @Column({ field: 'retry_count', type: DataType.INTEGER, defaultValue: 0 })
  retryCount: number;

  @Column({ field: 'max_retries', type: DataType.INTEGER, defaultValue: 3 })
  maxRetries: number;

  @Column({ field: 'processed_at', type: DataType.DATE, allowNull: true })
  processedAt: Date;

  @Column({ field: 'error_message', type: DataType.TEXT, allowNull: true })
  errorMessage: string;

  @Column({ field: 'grok_response', type: DataType.TEXT, allowNull: true })
  grokResponse: string;

  @CreatedAt
  @Column({ field: 'created_at' })
  createdAt: Date;

  @UpdatedAt
  @Column({ field: 'updated_at' })
  updatedAt: Date;
}
