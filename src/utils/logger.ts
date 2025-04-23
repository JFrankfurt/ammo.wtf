// Basic logger utility wrapping console
// This can be expanded later with more sophisticated logging logic
// (e.g., logging levels, sending logs to a server, etc.)

export const logger = {
    debug: (...args: any[]) => {
        // In development or when explicitly enabled, log debug messages
        if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG_LOGGING === 'true') {
             console.debug('[DEBUG]', ...args);
        }
    },
    info: (...args: any[]) => {
        console.info('[INFO]', ...args);
    },
    warn: (...args: any[]) => {
        console.warn('[WARN]', ...args);
    },
    error: (...args: any[]) => {
        console.error('[ERROR]', ...args);
        // Potentially send errors to a tracking service like Sentry here
    },
}; 