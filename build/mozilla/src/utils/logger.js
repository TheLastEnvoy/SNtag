/**
 * Logger utility for Standard Notes Tag Addon
 * Provides consistent logging across all modules
 */
class Logger {
    constructor(prefix = '[SN Tag Addon]') {
        this.prefix = prefix;
        this.isDebugMode = true; // Set to false for production
    }

    log(message, ...args) {
        if (this.isDebugMode) {
            console.log(`${this.prefix} ${message}`, ...args);
        }
    }

    error(message, error) {
        console.error(`${this.prefix} ERROR: ${message}`, error);
    }

    warn(message, ...args) {
        console.warn(`${this.prefix} WARNING: ${message}`, ...args);
    }

    debug(message, ...args) {
        if (this.isDebugMode) {
            console.debug(`${this.prefix} DEBUG: ${message}`, ...args);
        }
    }
}

// Export singleton instance
window.SNLogger = window.SNLogger || new Logger();
