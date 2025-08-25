/**
 * Standard Notes Tag Location Addon - Main Entry Point
 * 
 * This is the main content script that initializes and coordinates all modules
 * for the Standard Notes Tag Location addon.
 * 
 * @version 2.2.0
 * @author Standard Notes Tag Addon Team
 */

(function() {
    'use strict';

    // Prevent multiple initializations
    if (window.SNTagAddonInitialized) {
        console.log('[SN Tag Addon] Already initialized, skipping...');
        return;
    }

    window.SNTagAddonInitialized = true;

    // Global addon instance
    let addonInstance = null;

    /**
     * Initialize the addon
     */
    async function initializeAddon() {
        try {
            console.log('[SN Tag Addon] Starting initialization...');

            // Wait for all modules to be loaded
            await waitForModules();

            // Create main application instance
            addonInstance = new StandardNotesTagAddon();

            // Initialize the application
            await addonInstance.initialize();

            // Expose instance for debugging (development only)
            if (window.SNLogger && window.SNLogger.isDebugMode) {
                window.SNTagAddonInstance = addonInstance;
            }

            console.log('[SN Tag Addon] Initialization completed successfully');

        } catch (error) {
            console.error('[SN Tag Addon] Failed to initialize:', error);
        }
    }

    /**
     * Wait for all required modules to be loaded
     * @returns {Promise<void>}
     */
    function waitForModules() {
        return new Promise((resolve, reject) => {
            const requiredModules = [
                'SNLogger',
                'DOMUtils', 
                'TagDetector',
                'ContentInserter',
                'UIButton',
                'PageObserver',
                'StandardNotesTagAddon'
            ];

            let attempts = 0;
            const maxAttempts = 50; // 5 seconds timeout
            
            const checkModules = () => {
                attempts++;
                
                // Check if all modules are loaded
                const allLoaded = requiredModules.every(moduleName => {
                    return window[moduleName] !== undefined;
                });

                if (allLoaded) {
                    console.log('[SN Tag Addon] All modules loaded successfully');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    const missingModules = requiredModules.filter(moduleName => 
                        window[moduleName] === undefined
                    );
                    reject(new Error(`Failed to load modules: ${missingModules.join(', ')}`));
                } else {
                    // Wait and try again
                    setTimeout(checkModules, 100);
                }
            };

            checkModules();
        });
    }

    /**
     * Cleanup function for page unload
     */
    function cleanup() {
        if (addonInstance) {
            addonInstance.cleanup();
            addonInstance = null;
        }
        
        window.SNTagAddonInitialized = false;
        
        // Clean up global references
        if (window.SNTagAddonInstance) {
            delete window.SNTagAddonInstance;
        }
    }

    /**
     * Setup cleanup event listeners
     */
    function setupCleanupListeners() {
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('unload', cleanup);
    }

    /**
     * Main initialization flow
     */
    function main() {
        console.log('[SN Tag Addon] Content script loaded');

        // Check if we're on the correct domain
        if (window.location.hostname !== 'app.standardnotes.com') {
            console.log('[SN Tag Addon] Not on Standard Notes domain, exiting');
            return;
        }

        // Setup cleanup listeners
        setupCleanupListeners();

        // Start initialization when DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initializeAddon);
        } else {
            // DOM is already ready, start immediately
            initializeAddon();
        }
    }

    // Start the application
    main();

})();
