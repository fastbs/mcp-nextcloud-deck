/**
 * Simple logger utility for MCP operations
 */

export class Logger {
  constructor(private context: string) {}

  info(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.context}] INFO: ${message}`, data || '');
  }

  debug(message: string, data?: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.context}] DEBUG: ${message}`, data || '');
  }

  success(message: string) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.context}] ${message}`);
  }

  error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [${this.context}] ERROR: ${message}`, error || '');
  }

  time(operation: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`${operation} completed in ${duration}ms`);
    };
  }

  data(operation: 'read' | 'write' | 'delete' | 'list', target: string) {
    const emoji = {
      read: '[READ]',
      write: '[WRITE]',
      delete: '[DELETE]',
      list: '[LIST]'
    };
    this.info(`${emoji[operation]} ${operation.toUpperCase()}: ${target}`);
  }
}

export function createLogger(context: string): Logger {
  return new Logger(context);
}
