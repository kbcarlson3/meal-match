import { Platform } from 'react-native';
import { errorLogger } from './errorLogger';

/**
 * Initialize global error handlers to catch errors that escape React ErrorBoundary
 */
export function initializeGlobalErrorHandlers(): void {
  console.log('[GlobalErrorHandlers] Initializing...');

  // 1. React Native ErrorUtils (only available on mobile)
  if (typeof ErrorUtils !== 'undefined') {
    const originalHandler = ErrorUtils.getGlobalHandler();

    ErrorUtils.setGlobalHandler((error, isFatal) => {
      errorLogger.error(error, {
        component: 'GlobalErrorHandler',
        action: isFatal ? 'fatal_error' : 'error',
      });

      // Call original handler to maintain default behavior
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    console.log('[GlobalErrorHandlers] React Native ErrorUtils handler set');
  }

  // 2. Unhandled Promise Rejections
  if (typeof window !== 'undefined' && window.addEventListener) {
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      errorLogger.error(error, {
        component: 'PromiseRejectionHandler',
        action: 'unhandled_rejection',
      });

      console.error('[GlobalErrorHandlers] Unhandled promise rejection:', error);
    });

    console.log('[GlobalErrorHandlers] Promise rejection handler set');
  }

  // 3. Override console.error to capture all console errors
  const originalConsoleError = console.error;
  console.error = (...args: any[]) => {
    // Create error from arguments
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');

    // Only log if it's not already from ErrorLogger or ErrorStorage (avoid infinite loop)
    if (!message.includes('[ErrorLogger]') && !message.includes('[ErrorStorage]')) {
      errorLogger.error(new Error(message), {
        component: 'ConsoleErrorHandler',
        action: 'console_error',
      });
    }

    // Call original console.error
    originalConsoleError(...args);
  };

  console.log('[GlobalErrorHandlers] Console.error override set');

  // 4. Web-specific: window.onerror
  if (typeof window !== 'undefined') {
    window.onerror = (message, source, lineno, colno, error) => {
      const errorObj = error || new Error(String(message));

      errorLogger.error(errorObj, {
        component: 'WindowErrorHandler',
        action: 'window_error',
      });

      // Return false to allow default error handling
      return false;
    };

    console.log('[GlobalErrorHandlers] Window.onerror handler set');
  }

  console.log('[GlobalErrorHandlers] Initialization complete');
}

/**
 * Get error report for debugging
 */
export async function getErrorReport(): Promise<string> {
  try {
    const errors = await errorLogger.getRecentErrors(100);
    const sessionId = errorLogger.getSessionId();

    return `
=== ERROR REPORT ===
Session ID: ${sessionId}
Platform: ${Platform.OS}
Total Errors: ${errors.length}

Recent Errors:
${errors.map(error => `
[${error.timestamp}] ${error.severity.toUpperCase()}: ${error.message}
Component: ${error.context.component || 'Unknown'}
Stack: ${error.stack || 'No stack trace'}
Breadcrumbs: ${error.breadcrumbs.join('\n  ')}
---
`).join('\n')}
    `.trim();
  } catch (error) {
    return `Failed to generate error report: ${error}`;
  }
}
