import { Platform } from 'react-native';
import { errorStorage } from './errorStorage';

export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  sessionId: string;
  severity: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context: {
    component?: string;
    action?: string;
    userId?: string;
    coupleId?: string;
    route?: string;
    platform: 'web' | 'ios' | 'android';
  };
  breadcrumbs: string[];
}

class ErrorLogger {
  private sessionId: string;
  private breadcrumbs: string[] = [];
  private maxBreadcrumbs = 20;

  constructor() {
    // Generate unique session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    console.log('[ErrorLogger] Initialized with session:', this.sessionId);
  }

  /**
   * Generate a unique error ID
   */
  private generateId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Get current platform
   */
  private getPlatform(): 'web' | 'ios' | 'android' {
    if (Platform.OS === 'web') return 'web';
    if (Platform.OS === 'ios') return 'ios';
    if (Platform.OS === 'android') return 'android';
    return 'web'; // fallback
  }

  /**
   * Add a breadcrumb to track user actions
   */
  addBreadcrumb(action: string): void {
    const timestamp = new Date().toISOString();
    this.breadcrumbs.push(`[${timestamp}] ${action}`);

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs.shift();
    }
  }

  /**
   * Get current breadcrumbs
   */
  getBreadcrumbs(): string[] {
    return [...this.breadcrumbs];
  }

  /**
   * Log an error with full context
   */
  async error(error: Error, context?: Partial<ErrorLogEntry['context']>): Promise<void> {
    const entry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      severity: 'error',
      message: error.message,
      stack: error.stack,
      context: {
        platform: this.getPlatform(),
        ...context,
      },
      breadcrumbs: this.getBreadcrumbs(),
    };

    // Log to console with prefix (only in dev mode to reduce noise)
    if (__DEV__) {
      console.error('[ErrorLogger]', entry.message);
    }

    // Store error (best-effort, ignore failures)
    try {
      await errorStorage.append(entry);
    } catch (storageError) {
      // Silently fail - storage is optional
    }
  }

  /**
   * Log a warning
   */
  async warn(message: string, context?: Partial<ErrorLogEntry['context']>): Promise<void> {
    const entry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      severity: 'warn',
      message,
      context: {
        platform: this.getPlatform(),
        ...context,
      },
      breadcrumbs: this.getBreadcrumbs(),
    };

    if (__DEV__) {
      console.warn('[ErrorLogger]', message);
    }

    try {
      await errorStorage.append(entry);
    } catch (storageError) {
      // Silently fail
    }
  }

  /**
   * Log an info message
   */
  async info(message: string, context?: Partial<ErrorLogEntry['context']>): Promise<void> {
    const entry: ErrorLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      severity: 'info',
      message,
      context: {
        platform: this.getPlatform(),
        ...context,
      },
      breadcrumbs: this.getBreadcrumbs(),
    };

    if (__DEV__) {
      console.log('[ErrorLogger]', message);
    }

    try {
      await errorStorage.append(entry);
    } catch (storageError) {
      // Silently fail
    }
  }

  /**
   * Get recent errors from storage
   */
  async getRecentErrors(limit: number = 50): Promise<ErrorLogEntry[]> {
    try {
      const allErrors = await errorStorage.getAll();
      return allErrors.slice(-limit);
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear all stored errors
   */
  async clearErrors(): Promise<void> {
    try {
      await errorStorage.clear();
      if (__DEV__) {
        console.log('[ErrorLogger] Cleared all errors');
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Export errors as JSON string
   */
  async exportErrors(): Promise<string> {
    try {
      return await errorStorage.export();
    } catch (error) {
      return JSON.stringify({ error: 'Failed to export errors' });
    }
  }

  /**
   * Get session ID
   */
  getSessionId(): string {
    return this.sessionId;
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();
