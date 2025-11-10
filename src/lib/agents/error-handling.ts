// Main export file for error handling and recovery systems
export {
  AgentFailureRecoverySystem,
  type FailureRecoveryConfig,
  type AgentHealthStatus,
  type FailureEvent
} from './error-recovery';

export {
  DataConsistencyManager,
  type DataConsistencyConfig,
  type ValidationResult,
  type ValidationError,
  type ValidationWarning,
  type DataConflict,
  type DataSource,
  type BackupEntry,
  type CorruptionReport
} from './data-consistency';

export {
  ErrorHandlingSystem,
  globalErrorHandlingSystem
} from './error-handling-integration';
