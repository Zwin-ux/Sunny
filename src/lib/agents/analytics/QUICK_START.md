# Analytics Quick Start Guide

## Installation

The analytics infrastructure is already integrated into the Agentic Learning Engine. No additional installation required.

## Basic Setup

### 1. Import the Analytics Integration

```typescript
import { analyticsIntegration } from '@/lib/agents/analytics';
```

### 2. Initialize a Learning Session

```typescript
const userId = 'student-123';
const sessionId = 'session-456';

// Initialize session with student profile
await analyticsIntegration.initializeSession(
  userId,
  sessionId,
  studentProfile
);
```

### 3. Track Student Activity

```typescript
// Track a message interaction
await analyticsIntegration.trackInteraction(userId, sessionId, {
  type: 'message',
  content: 'Student response',
  responseTime: 5.2,
  comprehensionLevel: 0.75,
  engagementLevel: 0.8,
  emotionalState: 'positive'
});
```

### 4. Get Real-Time Insights

```typescript
// Get dashboard metrics
const dashboard = analyticsIntegration.getDashboardMetrics(userId, sessionId);

console.log('Engagement:', dashboard.currentEngagement);
console.log('Comprehension:', dashboard.currentComprehension);
console.log('Recommendations:', dashboard.recommendations);
```

## Common Use Cases

### Monitor Student Engagement

```typescript
// Track engagement metrics
await analyticsIntegration.trackEngagement(userId, sessionId, {
  studentId: userId,
  sessionId: sessionId,
  messageCount: 15,
  averageMessageLength: 45.5,
  questionAsked: 3,
  focusDuration: 1200,
  distractionEvents: 1,
  reengagementTime: 30,
  positiveIndicators: 8,
  negativeIndicators: 1,
  frustrationLevel: 0.2,
  enthusiasmLevel: 0.8
});

// Check for alerts
const alerts = analyticsIntegration.getActiveAlerts(userId);
if (alerts.length > 0) {
  console.log('Active alerts:', alerts);
}
```

### Predict Learning Outcomes

```typescript
// Predict how long it will take to master a concept
const prediction = await analyticsIntegration.predictLearningOutcome(
  studentProfile,
  learningState,
  'fractions_addition'
);

console.log('Time to mastery:', prediction.timeToMastery, 'minutes');
console.log('Recommended activities:', prediction.recommendedActivities);
```

### Detect Risks Early

```typescript
// Predict potential issues
const risks = await analyticsIntegration.predictRisks(
  studentProfile,
  learningState
);

for (const risk of risks) {
  if (risk.probability > 0.7) {
    console.log(`High risk of ${risk.riskType}`);
    console.log('Preventive actions:', risk.preventiveActions);
  }
}
```

### Real-Time Event Handling

```typescript
// Listen for engagement drops
analyticsIntegration.onAnalyticsEvent('engagement', (event) => {
  if (event.data.metrics.frustrationLevel > 0.7) {
    // Trigger intervention
    console.log('High frustration detected!');
    // Reduce difficulty, provide support, etc.
  }
});
```

## Database Setup

### Apply Schema

```bash
# Connect to your database and run:
psql -U postgres -d your_database -f supabase/agentic-learning-schema.sql
```

### Configure Database Client

```typescript
import { createClient } from '@supabase/supabase-js';
import { DataPersistenceManager } from '@/lib/agents/data-persistence';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Initialize with database client
const persistenceManager = new DataPersistenceManager(supabase);
```

## Key Concepts

### Dashboard Metrics
Real-time view of student state including:
- Current engagement, comprehension, frustration
- Session duration and activities completed
- Performance trends
- Active alerts and recommendations

### Alerts
Automated notifications when:
- Frustration level is high (>0.7)
- Engagement drops (<0.3)
- Multiple knowledge gaps detected (>3)
- Progress is slow (<0.2)

### ML Predictions
AI-powered insights for:
- Learning outcome predictions
- Engagement predictions
- Risk predictions
- Optimal activity recommendations

### Event Streaming
Real-time processing of:
- Interaction events (messages, responses)
- Performance events (accuracy, speed)
- Engagement events (focus, emotions)
- Assessment events (mastery, gaps)

## Best Practices

1. **Initialize Early**: Call `initializeSession()` at the start of each learning session
2. **Track Consistently**: Track all interactions for accurate analytics
3. **Check Alerts**: Regularly check for alerts and respond to them
4. **Use Predictions**: Leverage ML predictions for proactive interventions
5. **Monitor Trends**: Watch engagement and performance trends over time

## Troubleshooting

### No Dashboard Metrics
- Ensure session is initialized
- Verify events are being tracked
- Check that userId and sessionId match

### Alerts Not Triggering
- Verify alert conditions are met
- Check that engagement/performance metrics are being tracked
- Ensure `checkAlerts()` is called periodically

### Predictions Seem Off
- Ensure sufficient historical data exists
- Verify student profile is up to date
- Check that learning state is accurate

## Next Steps

- Read the full [DATA_PERSISTENCE_README.md](./DATA_PERSISTENCE_README.md)
- Review [analytics-usage-example.ts](./analytics-usage-example.ts)
- Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

## Support

For detailed API documentation, see the inline TypeScript documentation in:
- `analytics-integration.ts` - Main API
- `data-persistence.ts` - Database operations
- `real-time-analytics.ts` - Analytics processing
- `ml-predictions.ts` - ML predictions
