/**
 * logger.ts — Centralized logging utility.
 * Only outputs in development mode (__DEV__).
 * In production builds, all logs are silenced to prevent
 * information leaks and console noise.
 */

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export const logger = {
    /** Informational messages — only in dev */
    info: (...args: unknown[]) => {
        if (isDev) console.log('[INFO]', ...args);
    },

    /** Warning messages — only in dev */
    warn: (...args: unknown[]) => {
        if (isDev) console.warn('[WARN]', ...args);
    },

    /** Error messages — only in dev */
    error: (...args: unknown[]) => {
        if (isDev) console.error('[ERROR]', ...args);
    },

    /** Debug messages — only in dev, more verbose */
    debug: (...args: unknown[]) => {
        if (isDev) console.debug('[DEBUG]', ...args);
    },
};
