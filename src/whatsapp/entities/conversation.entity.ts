import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, CreatedAt, UpdatedAt, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { RealEstateAgency } from './real-estate-agency.entity';
import { Message } from './message.entity';

@Table({
  tableName: 'Conversations',
  timestamps: true,
})
export class Conversation extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => RealEstateAgency)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  real_estate_agency_id: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  whatsapp_number: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  agent_name: string;

  @Column({
    type: DataType.ENUM('active', 'paused', 'closed', 'archived'),
    defaultValue: 'active',
  })
  status: 'active' | 'paused' | 'closed' | 'archived';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  metadata: any;

  @CreatedAt
  created_at: Date;

  @UpdatedAt
  updated_at: Date;

  // Relationships
  @BelongsTo(() => RealEstateAgency)
  real_estate_agency: RealEstateAgency;

  @HasMany(() => Message)
  messages: Message[];
}
