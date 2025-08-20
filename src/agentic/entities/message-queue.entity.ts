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
})
export class MessageQueue extends Model<MessageQueue> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column({ type: DataType.STRING, allowNull: false })
  phoneNumber: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  messageContent: string;

  @Column({ type: DataType.STRING, allowNull: false })
  whatsappMessageId: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  conversationId: number;

  @Column({ type: DataType.INTEGER, allowNull: false })
  agencyId: number;

  @Column({ type: DataType.JSONB, allowNull: false })
  messageData: {
    messageType: string;
    mediaData?: any;
    contactContext?: any;
  };

  @Column({ type: DataType.JSONB, allowNull: false })
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

  @Column({ type: DataType.INTEGER, defaultValue: 0 })
  retryCount: number;

  @Column({ type: DataType.INTEGER, defaultValue: 3 })
  maxRetries: number;

  @Column({ type: DataType.DATE, allowNull: true })
  processedAt: Date;

  @Column({ type: DataType.TEXT, allowNull: true })
  errorMessage: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  grokResponse: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;
}
