# Implementation Plan

- [ ] 1. Set up Docker containerization for Google Cloud Run
  - Create multi-stage Dockerfile with Node.js 20 Alpine base
  - Configure standalone Next.js output mode for optimal deployment
  - Optimize image size to under 150MB
  - Add .dockerignore file excluding node_modules, .git, and build artifacts
  - _Requirements: 3.1, 3.2, 3.3_

- [ ] 2. Implement comprehensive health endpoint
  - Create src/app/api/health/route.ts with GET handler
  - Add Firestore connectivity check with 5-second timeout
  - Add Gemini API availability check
  - Add Cloud Storage connectivity check
  - Return structured JSON with status, checks, version, and timestamp
  - Return HTTP 503 when any critical service is unhealthy
  - _Requirements: 3.5, 8.2_

- [ ] 3. Build behavioral analytics engine
- [ ] 3.1 Implement frustration detection
  - Create src/lib/behavioral-analytics.ts module
  - Implement detectFrustration function analyzing attempts, delay, and score
  - Define frustration levels: low, medium, high
  - Add unit tests for frustration detection logic
  - _Requirements: 7.1, 7.2, 7.5_

- [ ] 3.2 Implement adaptive difficulty calculation
  - Create calculateDifficulty function using student history
  - Adjust difficulty down when frustration is high
  - Adjust difficulty up when student shows consistent mastery
  - Add confidence scoring (0-1 scale)
  - _Requirements: 1.3, 7.2_

- [ ] 3.3 Implement learning mode selection
  - Create selectLearningMode function based on topic and preferences
  - Support visual, textual, and interactive modes
  - Prefer visual mode for spatial/geometric topics
  - Use student preference history when available
  - _Requirements: 1.4, 2.1_


- [ ] 4. Implement Gemini API integration
- [ ] 4.1 Create Gemini client library
  - Install @google/generative-ai package
  - Create src/lib/gemini-client.ts with configuration interface
  - Implement generateLesson function with gemini-1.5-flash model
  - Add timeout handling (10 seconds max)
  - _Requirements: 1.1, 10.2_

- [ ] 4.2 Build prompt engineering system
  - Create buildPrompt function for structured lesson generation
  - Include topic, grade, difficulty, and learning mode in prompts
  - Request JSON-formatted responses with content, steps, visualAids, and quiz
  - Add examples for consistent output formatting
  - _Requirements: 1.1, 1.4_

- [ ] 4.3 Implement caching layer
  - Create LRU cache for lesson content (500 item max, 1 hour TTL)
  - Generate cache keys from topic, grade, and difficulty
  - Implement getCachedLesson wrapper function
  - Add cache hit/miss metrics
  - _Requirements: 12.2_

- [ ] 4.4 Add error handling and fallback
  - Implement generateLessonWithFallback function
  - Catch rate limit and timeout errors
  - Fallback to demo mode on API failures
  - Log errors with structured context for monitoring
  - _Requirements: 4.3, 10.2_

- [ ] 5. Implement demo mode system
- [ ] 5.1 Create demo lesson templates
  - Create src/lib/demo-mode.ts module
  - Define DEMO_LESSONS object with pre-built lessons
  - Include templates for fractions (grade 3), photosynthesis (grade 5), and 5+ other topics
  - Each template includes content, steps, visualAids, and quiz
  - _Requirements: 4.1, 4.2_

- [ ] 5.2 Implement demo mode detection and retrieval
  - Create isDemoMode function checking DEMO_MODE env var
  - Create getDemoLesson function with topic/grade lookup
  - Implement generateGenericDemoLesson for missing templates
  - Add demo mode indicator in response metadata
  - _Requirements: 4.3, 4.4, 4.5_


- [ ] 6. Build teach endpoint with adaptive logic
- [ ] 6.1 Create teach API route structure
  - Create src/app/api/teach/route.ts with POST handler
  - Define request/response TypeScript interfaces
  - Add Zod schema for input validation
  - Implement authentication check using next-auth
  - _Requirements: 1.1, 3.1_

- [ ] 6.2 Integrate behavioral analytics
  - Extract student context from request body
  - Call detectFrustration with previous attempts and response delay
  - Call calculateDifficulty with student history and frustration level
  - Call selectLearningMode with preferences and topic type
  - _Requirements: 1.2, 1.3, 7.1, 7.2_

- [ ] 6.3 Implement lesson generation flow
  - Build LessonPrompt from validated input and analytics
  - Call generateLessonWithFallback (Gemini or demo mode)
  - Add explainability rationale to response metadata
  - Include behavioral signals in response for educator dashboard
  - Return structured JSON with lesson content and metadata
  - _Requirements: 1.1, 1.5, 2.1, 2.2_

- [ ] 6.4 Add response time optimization
  - Implement streaming response for large lesson content
  - Add optimistic caching headers
  - Ensure P95 response time under 2 seconds
  - _Requirements: 10.2_

- [ ] 7. Set up Firestore data layer
- [ ] 7.1 Define Firestore data models
  - Create src/types/firestore.ts with TypeScript interfaces
  - Define Student, LearningSession, TopicProgress, and CohortAnalytics models
  - Add Timestamp types for date fields
  - Document collection structure in comments
  - _Requirements: 5.3_

- [ ] 7.2 Implement Firestore client
  - Create src/lib/firestore-client.ts module
  - Initialize Firestore with service account credentials
  - Implement CRUD operations for students and sessions
  - Add error handling for connection failures
  - _Requirements: 5.3, 8.2_

- [ ] 7.3 Configure Firestore security rules
  - Create firestore.rules file
  - Students can only read/write their own data
  - Educators can read aggregated analytics
  - Server-side operations use service account
  - _Requirements: 5.1, 5.2_

- [ ] 7.4 Create Firestore indexes
  - Create firestore.indexes.json file
  - Add composite index for student sessions by timestamp
  - Add index for topic progress queries
  - Add index for cohort analytics aggregation
  - _Requirements: 6.2_


- [ ] 8. Implement Google Classroom integration
- [ ] 8.1 Configure Google OAuth with Classroom scopes
  - Update next-auth configuration with GoogleProvider
  - Add Classroom API scopes (courses, rosters, coursework)
  - Configure OAuth consent screen in Google Cloud Console
  - Store access tokens securely in session
  - _Requirements: 9.1_

- [ ] 8.2 Create Classroom client library
  - Create src/lib/google-classroom.ts module
  - Install googleapis package
  - Implement createClassroomClient function with OAuth2 client
  - Add TypeScript interfaces for Course and Student
  - _Requirements: 9.1, 9.2_

- [ ] 8.3 Implement roster sync
  - Create syncRoster function querying Classroom API
  - Map Classroom students to Sunny Student model
  - Store synced students in Firestore with merge strategy
  - Handle pagination for large rosters (100+ students)
  - Add error handling for API failures
  - _Requirements: 9.2_

- [ ] 8.4 Implement grade posting
  - Create postGrade function submitting to Classroom API
  - Map Sunny completion scores to Classroom grades
  - Handle assignment creation if not exists
  - Add retry logic for transient failures
  - _Requirements: 9.3_

- [ ] 8.5 Build Classroom integration UI
  - Create course selection page for educators
  - Add roster sync button with loading state
  - Display sync status and last sync timestamp
  - Show grade posting confirmation
  - _Requirements: 9.4, 9.5_

- [ ] 9. Build learning analytics system
- [ ] 9.1 Implement session tracking
  - Create src/lib/analytics/session-tracker.ts
  - Track interactions (questions, hints, feedback) with timestamps
  - Calculate session outcomes (time to mastery, error recovery)
  - Store sessions in Firestore under /students/{id}/sessions
  - _Requirements: 6.1, 7.5_

- [ ] 9.2 Implement metrics aggregation
  - Create src/lib/analytics/aggregator.ts
  - Aggregate anonymized outcomes by cohort and time period
  - Calculate averages for time to mastery and error recovery rate
  - Generate topic breakdown with completion rates
  - Store aggregated metrics in /analytics/aggregated collection
  - _Requirements: 6.1, 6.2_

- [ ] 9.3 Build Data Studio export
  - Create src/app/api/analytics/export/route.ts
  - Generate CSV format compatible with Google Data Studio
  - Include cohort metrics and topic breakdowns
  - Add date range filtering
  - Implement educator-only access control
  - _Requirements: 6.3_

- [ ] 9.4 Create analytics dashboard UI
  - Build educator dashboard page showing cohort metrics
  - Display charts for time to mastery trends
  - Show topic completion rates with visual indicators
  - Add filtering by grade level and time period
  - Implement real-time updates (5-minute refresh)
  - _Requirements: 6.3, 6.4_


- [ ] 10. Implement feedback and intervention system
- [ ] 10.1 Create feedback API endpoint
  - Create src/app/api/feedback/route.ts with POST handler
  - Accept student response and correctness
  - Analyze response patterns for intervention triggers
  - Generate adaptive feedback based on frustration level
  - _Requirements: 7.2, 7.3_

- [ ] 10.2 Build encouragement system
  - Create src/lib/encouragement.ts module
  - Define age-appropriate encouragement messages
  - Calibrate messages based on student grade and context
  - Trigger encouragement after frustration detection
  - _Requirements: 7.3_

- [ ] 10.3 Implement hint system
  - Create progressive hint levels (nudge, guidance, reveal)
  - Trigger hints when response delay exceeds 30 seconds
  - Track hint usage in session outcomes
  - _Requirements: 7.4_

- [ ] 10.4 Add break suggestions
  - Detect extended session duration (30+ minutes)
  - Suggest breaks after high frustration events
  - Track break acceptance and impact on performance
  - _Requirements: 7.4_

- [ ] 11. Build explainability features
- [ ] 11.1 Create rationale generation system
  - Create src/lib/explainability.ts module
  - Generate plain-language rationales for difficulty adjustments
  - Include detected behavioral signals in rationales
  - Format rationales for educator dashboard display
  - _Requirements: 2.1, 2.2, 2.4_

- [ ] 11.2 Build educator dashboard for AI decisions
  - Create educator view showing recent AI decisions
  - Display rationales with student context (anonymized)
  - Show confidence scores and behavioral signals
  - Add manual override capability for educators
  - _Requirements: 2.3, 2.5_

- [ ] 12. Implement cost optimization
- [ ] 12.1 Add request-level cost tracking
  - Create src/lib/cost-tracker.ts module
  - Track Gemini API token usage per request
  - Calculate cost per student per month
  - Store cost metrics in Firestore
  - _Requirements: 12.1_

- [ ] 12.2 Implement intelligent caching
  - Cache frequently requested lessons (1 hour TTL)
  - Implement cache warming for popular topics
  - Add cache hit rate monitoring
  - _Requirements: 12.2_

- [ ] 12.3 Build cost monitoring dashboard
  - Create admin dashboard showing cost metrics
  - Display cost per student and per cohort
  - Add spending threshold alerts
  - Show cache hit rates and savings
  - _Requirements: 12.3, 12.4_

- [ ] 12.4 Optimize Cloud Run instance sizing
  - Configure CPU and memory based on load testing results
  - Set appropriate concurrency limits (80 requests/instance)
  - Configure min instances (1 for prod, 0 for dev)
  - Implement auto-scaling policies
  - _Requirements: 12.5_


- [ ] 13. Set up infrastructure-as-code
- [ ] 13.1 Create Terraform configuration
  - Create terraform/ directory with main.tf, variables.tf, outputs.tf
  - Define Google Cloud provider configuration
  - Create Cloud Run service resource with auto-scaling
  - Define Firestore database resource
  - Create Cloud Storage buckets for static assets
  - _Requirements: 11.1, 11.2_

- [ ] 13.2 Configure IAM and service accounts
  - Create service account for Cloud Run application
  - Grant Firestore read/write permissions
  - Grant Cloud Storage read permissions
  - Grant Gemini API access
  - Configure least-privilege access policies
  - _Requirements: 11.4_

- [ ] 13.3 Set up multi-environment support
  - Create separate Terraform workspaces for dev, staging, prod
  - Define environment-specific variables
  - Configure environment-specific resource naming
  - Add environment tags for cost tracking
  - _Requirements: 11.3_

- [ ] 13.4 Create deployment scripts
  - Create deploy.sh script for automated deployment
  - Add environment validation checks
  - Implement rollback capability
  - Add deployment verification tests
  - Document deployment process in README
  - _Requirements: 11.5_

- [ ] 14. Implement monitoring and observability
- [ ] 14.1 Set up structured logging
  - Configure Google Cloud Logging integration
  - Implement structured JSON logging format
  - Add correlation IDs for request tracing
  - Log errors with full context and stack traces
  - _Requirements: 8.3_

- [ ] 14.2 Add Prometheus metrics
  - Install prom-client package
  - Expose /metrics endpoint for Prometheus scraping
  - Add custom metrics for lesson generation time
  - Add metrics for cache hit rates
  - Add metrics for Gemini API latency
  - _Requirements: 8.4_

- [ ] 14.3 Implement request tracing
  - Add correlation ID generation middleware
  - Propagate correlation IDs through all service calls
  - Include correlation IDs in all log entries
  - Add trace context to error responses
  - _Requirements: 8.5_

- [ ] 14.4 Create monitoring dashboards
  - Set up Google Cloud Monitoring dashboards
  - Add charts for request rate, latency, and errors
  - Add charts for Gemini API usage and costs
  - Add alerts for error rate thresholds
  - Add alerts for high latency (P95 > 3s)
  - _Requirements: 8.2_


- [ ] 15. Implement security measures
- [ ] 15.1 Configure authentication
  - Set up next-auth with Google OAuth provider
  - Configure session management with secure cookies
  - Implement role-based access (student, educator, admin)
  - Add JWT token validation for API routes
  - _Requirements: 5.4, 9.1_

- [ ] 15.2 Add API route protection
  - Create authentication middleware for protected routes
  - Implement authorization checks (students access own data only)
  - Add educator role verification for analytics endpoints
  - Return proper 401/403 error responses
  - _Requirements: 5.1, 5.2_

- [ ] 15.3 Implement rate limiting
  - Install @upstash/ratelimit package
  - Configure Redis for rate limit storage
  - Set rate limits (10 requests/minute per IP)
  - Add rate limit headers to responses
  - Return 429 error when limit exceeded
  - _Requirements: 8.3_

- [ ] 15.4 Add input validation
  - Create Zod schemas for all API request bodies
  - Validate studentId, topic, grade formats
  - Sanitize user input to prevent injection
  - Return detailed validation errors
  - _Requirements: 8.1_

- [ ] 15.5 Implement data privacy controls
  - Ensure no PII in logs or analytics
  - Use anonymized IDs for aggregated metrics
  - Implement data export API for GDPR compliance
  - Implement data deletion API
  - Add privacy policy acceptance tracking
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 16. Build content management system
- [ ] 16.1 Create lesson template editor
  - Build UI for educators to create lesson templates
  - Add rich text editor for lesson content
  - Support adding steps, visual aids, and quiz questions
  - Implement template preview functionality
  - _Requirements: 14.1_

- [ ] 16.2 Implement standards alignment
  - Create standards database (Common Core, NGSS)
  - Add UI for mapping lessons to standards
  - Support state-specific standards
  - Display standards alignment in lesson metadata
  - _Requirements: 14.2_

- [ ] 16.3 Add difficulty progression customization
  - Create UI for configuring difficulty parameters
  - Allow customization of pacing rules
  - Support topic-specific progression paths
  - Validate custom configurations
  - _Requirements: 14.3_

- [ ] 16.4 Implement content versioning
  - Add version control for lesson templates
  - Track changes with timestamps and author
  - Implement rollback to previous versions
  - Show version history in UI
  - _Requirements: 14.5_

- [ ] 16.5 Add content quality validation
  - Create validation rules for educational content
  - Check reading level appropriateness
  - Validate quiz question quality
  - Provide feedback on content improvements
  - _Requirements: 14.4_


- [ ] 17. Optimize performance
- [ ] 17.1 Implement multi-layer caching
  - Set up LRU cache for lesson content (in-memory)
  - Configure Cloud CDN for static assets
  - Add cache headers for API responses
  - Implement cache invalidation strategy
  - _Requirements: 10.1, 10.2_

- [ ] 17.2 Optimize database queries
  - Create Firestore composite indexes
  - Implement query result caching
  - Use batch operations for bulk writes
  - Optimize collection structure for common queries
  - _Requirements: 6.2_

- [ ] 17.3 Implement code splitting
  - Configure Next.js dynamic imports for large components
  - Split vendor bundles for better caching
  - Lazy load non-critical features
  - Measure and optimize bundle sizes
  - _Requirements: 10.1_

- [ ] 17.4 Add progressive enhancement
  - Implement optimistic UI updates
  - Add loading skeletons for async content
  - Support offline mode with service worker
  - Gracefully degrade on slow connections
  - _Requirements: 10.3, 10.4_

- [ ] 18. Create comprehensive documentation
- [ ] 18.1 Write API documentation
  - Create OpenAPI specification for all endpoints
  - Document request/response schemas
  - Add example requests and responses
  - Include authentication requirements
  - _Requirements: 8.1_

- [ ] 18.2 Create deployment guide
  - Document Google Cloud project setup
  - Provide step-by-step deployment instructions
  - Include environment variable configuration
  - Add troubleshooting section
  - _Requirements: 11.5_

- [ ] 18.3 Write developer documentation
  - Document project structure and architecture
  - Explain behavioral analytics algorithms
  - Document Gemini prompt engineering approach
  - Add code examples for common tasks
  - _Requirements: 2.4_

- [ ] 18.4 Create educator guide
  - Document how to use the educator dashboard
  - Explain AI decision rationales
  - Provide guidance on manual overrides
  - Include best practices for content creation
  - _Requirements: 2.3, 2.5_

- [ ] 18.5 Write privacy and compliance documentation
  - Document data handling practices
  - Explain GDPR compliance measures
  - Provide data export/deletion procedures
  - Include privacy policy template
  - _Requirements: 5.5_


- [ ] 19. Write comprehensive test suite
- [ ] 19.1 Create unit tests
  - Write tests for behavioral analytics functions
  - Write tests for Gemini client and caching
  - Write tests for demo mode logic
  - Write tests for cost tracking
  - Achieve 80% code coverage for core logic
  - _Requirements: 13.4_

- [ ] 19.2 Create integration tests
  - Write tests for health endpoint with service checks
  - Write tests for teach endpoint with Gemini integration
  - Write tests for feedback endpoint
  - Write tests for Google Classroom sync
  - Write tests for Firestore operations
  - _Requirements: 13.1_

- [ ] 19.3 Create end-to-end tests
  - Write tests for student authentication flow
  - Write tests for lesson generation and completion
  - Write tests for educator dashboard access
  - Write tests for analytics export
  - _Requirements: 13.2_

- [ ] 19.4 Implement load testing
  - Create k6 or Artillery test scripts
  - Test baseline load (100 concurrent users)
  - Test spike load (0 to 500 users in 30s)
  - Test stress load (gradually to 1000 users)
  - Test soak load (200 users for 1 hour)
  - Validate P95 response time < 2 seconds
  - _Requirements: 13.5_

- [ ] 19.5 Set up CI/CD pipeline
  - Configure GitHub Actions workflow
  - Run tests on every pull request
  - Build and push Docker image on merge
  - Deploy to staging environment automatically
  - Require manual approval for production
  - _Requirements: 13.3_

- [ ] 20. Deploy to Google Cloud Run
- [ ] 20.1 Build and test Docker image locally
  - Run docker build and verify image size < 200MB
  - Test container locally with docker run
  - Verify health endpoint responds correctly
  - Test teach endpoint with demo mode
  - _Requirements: 3.2, 3.4_

- [ ] 20.2 Deploy to development environment
  - Push Docker image to Google Container Registry
  - Deploy to Cloud Run in development project
  - Configure environment variables
  - Verify deployment with smoke tests
  - _Requirements: 3.1_

- [ ] 20.3 Deploy to production environment
  - Deploy to Cloud Run in production project
  - Configure auto-scaling and resource limits
  - Set up custom domain and SSL
  - Configure Cloud CDN
  - Run full test suite against production
  - _Requirements: 3.1, 3.3_

- [ ] 20.4 Verify production deployment
  - Test cold start time (should be < 3 seconds)
  - Verify health checks pass
  - Test lesson generation with real students
  - Monitor error rates and latency
  - Verify cost tracking is working
  - _Requirements: 3.4, 10.2_

- [ ] 21. Final quality assurance
  - Verify all requirements are met
  - Run full test suite (unit, integration, e2e)
  - Perform security audit
  - Review performance metrics
  - Validate cost optimization measures
  - Test GDPR compliance features
  - Verify documentation completeness
  - _Requirements: All requirements_
