/**
 * Structured logging utility for Sunny application
 * Provides consistent logging format with metadata for better debugging and monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogMetadata {
  [key: string]: any;
}

class Logger {
  private env: string;

  constructor() {
    this.env = process.env.NODE_ENV || 'development';
  }

  /**
   * Format log message with timestamp, level, and metadata
   */
  private formatLog(level: LogLevel, message: string, metadata?: LogMetadata): string {
    const timestamp = new Date().toISOString();
    const metadataStr = metadata ? JSON.stringify(metadata) : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message} ${metadataStr}`;
  }

  /**
   * Log debug message
   */
  debug(message: string, metadata?: LogMetadata): void {
    if (this.env === 'development') {
      console.debug(this.formatLog('debug', message, metadata));
    }
  }

  /**
   * Log info message
   */
  info(message: string, metadata?: LogMetadata): void {
    console.info(this.formatLog('info', message, metadata));
  }

  /**
   * Log warning message
   */
  warn(message: string, metadata?: LogMetadata): void {
    console.warn(this.formatLog('warn', message, metadata));
  }

  /**
   * Log error message
   */
  error(message: string, metadata?: LogMetadata): void {
    console.error(this.formatLog('error', message, metadata));
    
    // In production, you might want to send this to a monitoring service
    if (this.env === 'production' && process.env.MONITORING_ENDPOINT) {
      // Example: send to monitoring service
      // this.sendToMonitoring(level, message, metadata);
    }
  }

  /**
   * Send log to external monitoring service (placeholder for future implementation)
   */
  private async sendToMonitoring(level: LogLevel, message: string, metadata?: LogMetadata): Promise<void> {
    // Implementation for sending logs to external monitoring service
    // e.g., Sentry, LogRocket, etc.
  }
}

// Export singleton instance
export const logger = new Logger();
