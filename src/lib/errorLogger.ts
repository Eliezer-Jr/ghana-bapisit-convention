import { supabase } from "@/integrations/supabase/client";

type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

interface ErrorLogPayload {
  source: 'client' | 'server';
  error_message: string;
  stack_trace?: string;
  metadata?: Record<string, unknown>;
  user_id?: string;
  url?: string;
  function_name?: string;
  severity?: ErrorSeverity;
}

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_FUNCTIONS_URL || 
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

class ErrorLogger {
  private static instance: ErrorLogger;
  private queue: ErrorLogPayload[] = [];
  private isProcessing = false;
  private userId: string | null = null;

  private constructor() {
    // Set up global error handlers
    this.setupGlobalHandlers();
    // Get user ID when available
    this.initializeUser();
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  private async initializeUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      this.userId = user?.id || null;
      
      // Listen for auth changes
      supabase.auth.onAuthStateChange((_, session) => {
        this.userId = session?.user?.id || null;
      });
    } catch {
      // Ignore auth errors during initialization
    }
  }

  private setupGlobalHandlers() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.logError({
        source: 'client',
        error_message: event.message,
        stack_trace: event.error?.stack,
        url: window.location.href,
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        severity: 'error',
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const error = event.reason;
      this.logError({
        source: 'client',
        error_message: error?.message || String(error),
        stack_trace: error?.stack,
        url: window.location.href,
        severity: 'error',
      });
    });
  }

  async logError(payload: Omit<ErrorLogPayload, 'user_id'> & { user_id?: string }) {
    const fullPayload: ErrorLogPayload = {
      ...payload,
      user_id: payload.user_id || this.userId || undefined,
      url: payload.url || (typeof window !== 'undefined' ? window.location.href : undefined),
    };

    this.queue.push(fullPayload);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    
    this.isProcessing = true;
    
    while (this.queue.length > 0) {
      const payload = this.queue.shift();
      if (!payload) continue;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        await fetch(`${FUNCTIONS_URL}/log-error`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token && {
              'Authorization': `Bearer ${session.access_token}`,
            }),
          },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        // Log to console as fallback, don't re-queue to avoid infinite loops
        console.error('[ErrorLogger] Failed to send error:', err, payload);
      }
    }
    
    this.isProcessing = false;
  }

  // Convenience methods
  info(message: string, metadata?: Record<string, unknown>) {
    this.logError({ source: 'client', error_message: message, metadata, severity: 'info' });
  }

  warn(message: string, metadata?: Record<string, unknown>) {
    this.logError({ source: 'client', error_message: message, metadata, severity: 'warning' });
  }

  error(error: Error | string, metadata?: Record<string, unknown>) {
    const isError = error instanceof Error;
    this.logError({
      source: 'client',
      error_message: isError ? error.message : error,
      stack_trace: isError ? error.stack : undefined,
      metadata,
      severity: 'error',
    });
  }

  critical(error: Error | string, metadata?: Record<string, unknown>) {
    const isError = error instanceof Error;
    this.logError({
      source: 'client',
      error_message: isError ? error.message : error,
      stack_trace: isError ? error.stack : undefined,
      metadata,
      severity: 'critical',
    });
  }
}

// Export singleton instance
export const errorLogger = ErrorLogger.getInstance();
