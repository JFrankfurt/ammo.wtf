// Basic logger utility wrapping console
// This can be expanded later with more sophisticated logging logic
// (e.g., logging levels, sending logs to a server, etc.)

export const logger = {
    debug: (fileName: string, ...args: any[]) => {
        // In development or when explicitly enabled, log debug messages
        if (process.env.NODE_ENV === 'development' || process.env.REACT_APP_DEBUG_LOGGING === 'true') {
             console.debug('[DEBUG]', fileName, ...args);
        }
    },
    info: (fileName: string, ...args: any[]) => {
        console.info('[INFO]', fileName, ...args);
    },
    warn: (fileName: string, ...args: any[]) => {
        console.warn('[WARN]', fileName, ...args);
    },
    error: (fileName: string, ...args: any[]) => {
        console.error('[ERROR]', fileName, ...args);
        // Potentially send errors to a tracking service like Sentry here
    },
}; 