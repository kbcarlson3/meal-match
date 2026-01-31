import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import type { ErrorLogEntry } from './errorLogger';

const MAX_ERRORS = 1000;
const STORAGE_KEY = 'error-logs';

/**
 * Platform-specific error storage
 * - Web: Uses localStorage
 * - Mobile: Uses Expo FileSystem
 */
class ErrorStorage {
  /**
   * Append an error to storage
   */
  async append(entry: ErrorLogEntry): Promise<void> {
    try {
      const errors = await this.getAll();
      errors.push(entry);

      // Rotate if needed
      if (errors.length > MAX_ERRORS) {
        errors.shift();
      }

      await this.saveAll(errors);
    } catch (error) {
      // Silently fail - don't log to console.error to avoid infinite loop
      // Error storage is best-effort
    }
  }

  /**
   * Get all stored errors
   */
  async getAll(): Promise<ErrorLogEntry[]> {
    try {
      if (Platform.OS === 'web') {
        return this.getAllWeb();
      } else {
        return this.getAllMobile();
      }
    } catch (error) {
      // Silently return empty array on error
      return [];
    }
  }

  /**
   * Save all errors
   */
  private async saveAll(errors: ErrorLogEntry[]): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await this.saveAllWeb(errors);
      } else {
        await this.saveAllMobile(errors);
      }
    } catch (error) {
      // Silently fail - storage is best-effort
    }
  }

  /**
   * Clear all errors
   */
  async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await this.clearWeb();
      } else {
        await this.clearMobile();
      }
    } catch (error) {
      // Silently fail
    }
  }

  /**
   * Export errors as JSON string
   */
  async export(): Promise<string> {
    try {
      const errors = await this.getAll();
      return JSON.stringify(errors, null, 2);
    } catch (error) {
      return JSON.stringify({ error: 'Failed to export errors' });
    }
  }

  // ========== Web Implementation ==========

  private async getAllWeb(): Promise<ErrorLogEntry[]> {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      // Silently return empty array
      return [];
    }
  }

  private async saveAllWeb(errors: ErrorLogEntry[]): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(errors));
    } catch (error) {
      // Silently fail
    }
  }

  private async clearWeb(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      // Silently fail
    }
  }

  // ========== Mobile Implementation ==========

  private getFilePath(): string {
    return `${FileSystem.documentDirectory}error-logs.json`;
  }

  private async getAllMobile(): Promise<ErrorLogEntry[]> {
    try {
      const filePath = this.getFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (!fileInfo.exists) {
        // File doesn't exist yet - this is normal on first run
        return [];
      }

      const data = await FileSystem.readAsStringAsync(filePath);
      if (!data || data.trim() === '') {
        return [];
      }

      return JSON.parse(data);
    } catch (error) {
      // Don't log to console.error here to avoid infinite loop
      // Just return empty array silently
      return [];
    }
  }

  private async saveAllMobile(errors: ErrorLogEntry[]): Promise<void> {
    try {
      const filePath = this.getFilePath();
      await FileSystem.writeAsStringAsync(filePath, JSON.stringify(errors));
    } catch (error) {
      // Don't log to console.error to avoid infinite loop
      // Just throw the error silently
      throw error;
    }
  }

  private async clearMobile(): Promise<void> {
    try {
      const filePath = this.getFilePath();
      const fileInfo = await FileSystem.getInfoAsync(filePath);

      if (fileInfo.exists) {
        await FileSystem.deleteAsync(filePath);
      }
    } catch (error) {
      // Silently fail
    }
  }
}

// Export singleton instance
export const errorStorage = new ErrorStorage();
