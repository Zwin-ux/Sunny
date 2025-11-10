# Data Persistence and Analytics Infrastructure

## Overview

This module implements comprehensive data persistence and real-time analytics processing for the Agentic Learning Engine. It provides:

- **Enhanced Database Schema**: Comprehensive student profiling, learning analytics, and interaction tracking
- **Data Persistence Layer**: TypeScript interfaces for database operations
- **Real-Time Analytics**: Streaming analytics for live learning assessment
- **ML Predictions**: Machine learning integration for predictive insights
- **Dashboard & Alerts**: Real-time monitoring and automated alert system

## Requirements Addressed

- **Requirement 5.1**: Contextual memory and continuity across sessions
- **Requirement 8.1**: Intelligent learning analytics with behavior data collection
- **Requirement 8.2**: Learning effectiveness identification
- **Requirement 8.3**: Performance trend prediction
- **Requirement 8.4**: Learning obstacle insights
- **Requirement 8.5**: Detailed learning profile creation

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Analytics Integration API                   │
│                 (analytics-integration.ts)                   │
└────────────┬────────────────────────────────┬────────────────┘
             │                                │
    ┌────────▼────────┐              ┌───────▼────────┐
    │ Data Persistence │              │  Real-Time     │
    │    Manager       │              │  Analytics     │
    │                  │              │  Processor     │
    └────────┬─────────┘              └───────┬────────┘
             │                                │
    ┌────────▼─────────┐             ┌───────▼────────┐
    │   Database       │             │  ML Prediction │
    │   (Supabase)     │             │    Service     │
    └──────────────────┘             └────────────────┘
```

## Database Schema

### Core Tables

#### 1. student_profiles_enhanced
Stores comprehensive cognitive and behavioral profiles:
- Cognitive metrics (processing speed, working memory, attention control)
- Motivation factors (intrinsic/extrinsic motivation, preferences)
- Learning velocity (acquisition rate, retention, transfer)
- Attention span data

#### 2. response_patterns
Tracks behavioral patterns in student responses:
- Pattern types (quick, thoughtful, impulsive, hesitant)
- Frequency and effectiveness
- Contextual information

#### 3. engagement_patterns
Records what triggers and sustains engagement:
- Trigger events
- Duration and intensity
- Recovery time

#### 4. activity_preferences
Tracks effectiveness and preference for activity types:
- Preference and effectiveness scores
- Optimal duration
- Usage statistics

#### 5. concepts & concept_mastery
Knowledge graph and mastery tracking:
- Concept definitions and relationships
- Student mastery levels per concept
- Assessment evidence

#### 6. knowledge_gaps
Identified gaps with recommendations:
- Severity levels
- Suggested actions
- Status tracking

#### 7. interaction_history
Detailed interaction tracking:
- All student interactions
- Response times
- Comprehension and engagement levels
- Emotional state

#### 8. learning_analytics
Aggregated analytics for reporting:
- Performance metrics
- Engagement metrics
- Risk factors and recommendations

#### 9. performance_metrics & engagement_metrics
Real-time metric tracking per session

## Usage Examples

### Initialize Analytics for a Session

```typescript
import { analyticsIntegration } from '@/lib/agents/analytics-integration';

// Initialize session
await analyticsIntegration.initializeSession(
  userId,
  sessionId,
  studentProfile
);
```

### Track Student Interactions

```typescript
// Track a message interaction
await analyticsIntegration.trackInteraction(
  userId,
  sessionId,
  {
    type: 'message',
    content: 'Student response text',
    responseTime: 5.2,
    comprehensionLevel: 0.75,
    engagementLevel: 0.8,
    emotionalState: 'positive'
  }
);
```

### Track Performance

```typescript
const performanceMetrics: PerformanceMetrics = {
  studentId: userId,
  sessionId: sessionId,
  correctResponses: 8,
  totalResponses: 10,
  accuracyRate: 0.8,
  averageResponseTime: 6.5,
  responseTimeVariance: 2.1,
  conceptsMastered: 2,
  skillsAcquired: 3,
  objectivesCompleted: 1,
  responseQuality: 0.75,
  explanationDepth: 0.7,
  criticalThinking: 0.65
};

await analyticsIntegration.trackPerformance(
  userId,
  sessionId,
  performanceMetrics
);
```

### Get Real-Time Dashboard Metrics

```typescript
const dashboard = analyticsIntegration.getDashboardMetrics(userId, sessionId);

console.log('Current Engagement:', dashboard.currentEngagement);
console.log('Current Comprehension:', dashboard.currentComprehension);
console.log('Active Alerts:', dashboard.activeAlerts);
console.log('Recommendations:', dashboard.recommendations);
```

### Check for Alerts

```typescript
// Automatically check alert conditions
await analyticsIntegration.checkAlerts(
  userId,
  sessionId,
  learningState,
  studentProfile
);

// Get active alerts
const alerts = analyticsIntegration.getActiveAlerts(userId);

// Acknowledge an alert
analyticsIntegration.acknowledgeAlert(alertId);
```

### ML Predictions

```typescript
// Predict learning outcome for a concept
const outcome = await analyticsIntegration.predictLearningOutcome(
  studentProfile,
  learningState,
  'fractions_addition'
);

console.log('Predicted Mastery:', outcome.predictedMasteryLevel);
console.log('Time to Mastery:', outcome.timeToMastery, 'minutes');
console.log('Recommended Activities:', outcome.recommendedActivities);

// Predict engagement for next activity
const engagement = await analyticsIntegration.predictEngagement(
  studentProfile,
  learningState,
  'quiz'
);

console.log('Predicted Engagement:', engagement.nextActivityEngagement);
console.log('Optimal Activity:', engagement.optimalActivityType);

// Predict risks
const risks = await analyticsIntegration.predictRisks(
  studentProfile,
  learningState
);

for (const risk of risks) {
  console.log(`Risk: ${risk.riskType}`);
  console.log(`Probability: ${risk.probability}`);
  console.log(`Actions:`, risk.preventiveActions);
}
```

### Real-Time Event Streaming

```typescript
// Register handler for real-time events
analyticsIntegration.onAnalyticsEvent('engagement', (event) => {
  console.log('Engagement event:', event);
  
  // Update UI, trigger interventions, etc.
  if (event.data.metrics.frustrationLevel > 0.7) {
    // Trigger intervention
  }
});
```

### Data Retrieval

```typescript
// Get student profile
const profile = await analyticsIntegration.getStudentProfile(userId);

// Get concept mastery
const mastery = await analyticsIntegration.getConceptMastery(userId);

// Get knowledge gaps
const gaps = await analyticsIntegration.getActiveKnowledgeGaps(userId);

// Get interaction history
const interactions = await analyticsIntegration.getInteractionHistory(
  userId,
  sessionId,
  50 // limit
);

// Get progress timeline
const progress = await analyticsIntegration.getProgressTimeline(userId);

// Get recent analytics
const analytics = await analyticsIntegration.getRecentAnalytics(userId, 30);
```

## Alert System

### Default Alert Configurations

1. **High Frustration**: Triggers when frustration level > 0.7
2. **Low Engagement**: Triggers when engagement < 0.3
3. **Multiple Knowledge Gaps**: Triggers when gaps > 3
4. **Slow Progress**: Triggers when progress < 0.2

### Alert Structure

```typescript
interface AlertEvent {
  id: string;
  alertConfigId: string;
  userId: string;
  sessionId: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actions: string[];
  timestamp: number;
  acknowledged: boolean;
}
```

## Dashboard Metrics

Real-time dashboard provides:

- **Current State**: Engagement, comprehension, frustration levels
- **Session Summary**: Duration, activities completed, concepts covered
- **Performance**: Accuracy rate, response times
- **Trends**: Engagement and performance trends
- **Alerts**: Active alerts requiring attention
- **Recommendations**: AI-generated recommendations

## ML Prediction Models

### Current Models

1. **Engagement Prediction**: Predicts engagement for activities
2. **Performance Prediction**: Predicts learning outcomes
3. **Risk Prediction**: Identifies potential issues

### Model Features

- Simple linear models for demonstration
- Extensible architecture for advanced ML models
- Confidence scores for all predictions
- Factor analysis for interpretability

## Database Setup

### Running Migrations

```bash
# Apply the agentic learning schema
psql -U postgres -d sunny_db -f supabase/agentic-learning-schema.sql
```

### Environment Configuration

Ensure your database client is configured in the DataPersistenceManager:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const persistenceManager = new DataPersistenceManager(supabase);
```

## Performance Considerations

### Caching
- Dashboard metrics are cached in memory
- Event buffers maintain recent history (last 100 events)
- Alert states are cached per user

### Optimization
- Batch database writes where possible
- Use database indexes for common queries
- Limit historical data retention (configurable)

### Scalability
- Event-driven architecture supports horizontal scaling
- Database schema optimized with indexes
- Real-time processing uses in-memory buffers

## Testing

```typescript
// Example test
import { analyticsIntegration } from '@/lib/agents/analytics-integration';

describe('Analytics Integration', () => {
  it('should track interactions', async () => {
    await analyticsIntegration.trackInteraction(
      'user-123',
      'session-456',
      {
        type: 'message',
        content: 'Test message',
        engagementLevel: 0.8
      }
    );
    
    const dashboard = analyticsIntegration.getDashboardMetrics(
      'user-123',
      'session-456'
    );
    
    expect(dashboard).toBeDefined();
    expect(dashboard.currentEngagement).toBeGreaterThan(0);
  });
});
```

## Future Enhancements

1. **Advanced ML Models**: Integration with TensorFlow.js or external ML services
2. **Real-Time Streaming**: WebSocket support for live dashboard updates
3. **Data Visualization**: Built-in charting and visualization components
4. **Export Capabilities**: PDF reports, CSV exports
5. **Parent/Teacher Dashboards**: Role-based analytics views
6. **A/B Testing Framework**: Experiment tracking and analysis
7. **Anomaly Detection**: Automated detection of unusual patterns
8. **Recommendation Engine**: More sophisticated recommendation algorithms

## API Reference

See individual module documentation:
- `data-persistence.ts` - Database operations
- `real-time-analytics.ts` - Streaming analytics
- `ml-predictions.ts` - ML model integration
- `analytics-integration.ts` - Unified API

## Support

For questions or issues, refer to the main Agentic Learning Engine documentation or contact the development team.
