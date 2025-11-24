# ADR 002: Kondo Data Quality Scoring and Agent Conversation Flow

## Status

Accepted

## Context

Our agentic system engages with real estate agents via WhatsApp to gather information about condominiums (Kondos). Currently, the system processes all incoming messages from verified real estate agents without considering whether we already have sufficient information about a particular Kondo. This leads to:

1. **Resource Waste**: Processing conversations for Kondos we already have comprehensive data about
2. **Inefficient Agent Interactions**: Continuing conversations that may not yield valuable new information
3. **Lack of Data Quality Metrics**: No systematic way to assess the completeness and quality of our Kondo data
4. **Suboptimal Conversation Management**: No mechanism to gracefully exit conversations when data quality goals are met

We need a system to evaluate the quality and completeness of our existing Kondo data and use this information to make intelligent decisions about conversation continuation.

## Decision

**Implement a Kondo Data Quality Scoring System with intelligent conversation flow control.**

### 1. New Kondo Entity Properties

Add three new properties to the `Kondo` entity:

```typescript
@Column({
  type: DataType.DATE,
  allowNull: true,
})
kondo_data_updated: Date;

@Column({
  type: DataType.DECIMAL(3, 2), // Allows values from 0.00 to 1.00
  allowNull: true,
  defaultValue: 0.00,
  validate: {
    min: 0.00,
    max: 1.00
  }
})
kondo_data_content_quality: number;

@Column({
  type: DataType.DECIMAL(3, 2), // Allows values from 0.00 to 1.00
  allowNull: true,
  defaultValue: 0.00,
  validate: {
    min: 0.00,
    max: 1.00
  }
})
kondo_data_media_quality: number;
```

### 2. New Conversation Entity Property

Add an archived status to the `Conversation` entity:

```typescript
@Column({
  type: DataType.ENUM('active', 'paused', 'closed', 'archived'),
  defaultValue: 'active',
})
status: 'active' | 'paused' | 'closed' | 'archived';
```

### 3. Quality Assessment Function

Implement a new service method `assessKondoDataQuality()` that:
- Evaluates content completeness (prices, location, conveniences, details)
- Evaluates media completeness (images, videos, quality)
- Returns boolean indicating if quality threshold is met

### 4. Configuration Parameter

Add a new configuration parameter `KONDO_QUALITY_THRESHOLD` (default: 0.7) that defines the minimum combined quality score to consider a Kondo as "sufficiently documented".

### 5. Enhanced Agent Flow

Modify the `AgentOrchestrator.processMessage()` workflow:

```
1. Verify real estate agent (existing)
2. Get or create conversation (existing)
3. → NEW: Check if conversation relates to a specific Kondo
4. → NEW: If Kondo identified, assess data quality using assessKondoDataQuality()
5. → NEW: If quality score > KONDO_QUALITY_THRESHOLD:
   - Mark conversation as 'archived'
   - Send polite disengagement message
   - Return without further processing
6. → NEW: If quality score ≤ KONDO_QUALITY_THRESHOLD:
   - Continue with normal conversation flow
   - Process message through ChattyAgent
7. Process message through ChattyAgent (existing, for low-quality Kondos)
```

## Rationale

### 1. **Resource Optimization**
- Prevents unnecessary processing of conversations about well-documented Kondos
- Reduces API costs and computational overhead
- Allows focus on gathering data for under-documented properties

### 2. **Data Quality Metrics**
- Provides quantitative assessment of our Kondo database completeness
- Enables data-driven decisions about information gathering priorities
- Supports analytics and reporting on data quality trends

### 3. **Improved User Experience (for Agents)**
- Avoids wasting agents' time on properties we're no longer interested in
- Provides clear, polite communication when ending conversations
- Maintains professional relationships for future interactions

### 4. **Scalability**
- System becomes more intelligent as database grows
- Prevents exponential growth in conversation processing load
- Enables prioritization of high-value data collection opportunities

### 5. **Flexibility**
- Separate scoring for content and media allows nuanced decision-making
- Configurable threshold enables easy adjustment based on business needs
- Archived status preserves conversation history while indicating completion

## Implementation Details

### Quality Scoring Algorithm

**Content Quality (0.0 - 1.0):**
- **Core Attributes (0.1 points each)**: name, status, type, description
  - Maximum: 0.4 points (4 × 0.1)
- **Secondary Attributes (0.05 points each)**: minutes_from_bh, cep, address_street_and_numbers, neighborhood, city
  - Maximum: 0.25 points (5 × 0.05)
- **Other Attributes (0.01 points each)**: All other Kondo attributes not mentioned above
  - Variable maximum based on filled attributes
- **Media with 'final' status (0.09 points each)**: Each image or video in 'final' status
  - Theoretical maximum: Variable based on media count
  - Practical maximum: ~0.35 points (capped at 1.0 total)

**Total Maximum Score**: 1.0 (capped)

**Media Entity Enhancement:**
- Add `status` property with values: 'final' | 'draft'
- Only media with 'final' status contributes to quality score

### Conversation Archival Message Examples

```
"Obrigado pelas informações, Victor! No momento já tenho bastante material sobre esse empreendimento. Qualquer novidade ou outros projetos, pode me chamar. Valeu!"

"Perfeito, já consegui as informações que precisava sobre esse condomínio. Se tiver outros lançamentos interessantes, me avisa. Obrigado!"
```

### Configuration

```typescript
// New environment variable
KONDO_QUALITY_THRESHOLD=0.7

// Usage in code
const qualityThreshold = process.env.KONDO_QUALITY_THRESHOLD || 0.7;
```

## Consequences

### Positive
- **Reduced Processing Costs**: Fewer unnecessary conversations processed
- **Improved Data Quality Focus**: Resources directed toward incomplete Kondos
- **Better Agent Relations**: Professional conversation management
- **Enhanced System Intelligence**: Data-driven conversation decisions
- **Scalable Architecture**: System efficiency improves with database growth

### Negative
- **Implementation Complexity**: Additional logic in conversation flow
- **Potential for False Positives**: High-quality scores might miss important updates
- **Database Schema Changes**: Migration required for existing data
- **Initial Calibration**: Quality scoring algorithm may need tuning

### Neutral
- **Conversation History**: Archived conversations preserved for analysis
- **Threshold Adjustability**: Business can fine-tune quality requirements
- **Gradual Rollout**: Can be implemented with conservative thresholds initially

## Migration Strategy

1. **Database Migration**: Add new columns with default values
2. **Backfill Quality Scores**: Run assessment on existing Kondos
3. **Feature Flag**: Implement with disabled-by-default configuration
4. **Gradual Rollout**: Enable for subset of conversations initially
5. **Monitoring**: Track conversation archival rates and agent feedback

## Success Metrics

- **Processing Efficiency**: Reduction in unnecessary conversation processing
- **Data Quality**: Improvement in average Kondo completeness scores
- **Agent Satisfaction**: Feedback from real estate agents on interaction quality
- **Cost Reduction**: Decreased API and processing costs
- **Database Growth**: Rate of new high-quality Kondo additions

## Future Enhancements

- **Dynamic Thresholds**: Different quality requirements for different Kondo types
- **Temporal Decay**: Reduce quality scores over time to encourage data freshness
- **Agent-Specific Scoring**: Adjust thresholds based on agent reliability
- **Machine Learning**: Use conversation outcomes to improve quality assessment

## Related Decisions

- **ADR 001**: Tests within modules - Quality assessment functions will include comprehensive unit tests
- **Future ADR**: Configuration management for quality thresholds and scoring weights
