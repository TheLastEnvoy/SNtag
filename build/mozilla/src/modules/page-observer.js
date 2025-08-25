/**
 * Page Observer Module for Standard Notes Tag Addon
 * Handles DOM observation and navigation detection
 */
class PageObserver {
    constructor() {
        this.logger = window.SNLogger;
        this.mainObserver = null;
        this.navigationCheckInterval = null;
        this.onEditorChangeCallback = null;
        
        // Track state to avoid unnecessary checks
        this.lastUrl = window.location.href;
        this.lastNoteId = null;
        
        // Store original history methods
        this.originalPushState = history.pushState;
        this.originalReplaceState = history.replaceState;
    }

    /**
     * Initialize page observation
     * @param {Function} onEditorChangeCallback - Callback when editor changes
     */
    initialize(onEditorChangeCallback) {
        this.onEditorChangeCallback = onEditorChangeCallback;
        
        this.logger.log('Inicializando observação da página...');
        
        // Setup DOM observer
        this._setupDOMObserver();
        
        // Setup navigation detection
        this._setupNavigationDetection();
        
        // Setup periodic check as fallback
        this._setupPeriodicCheck();
        
        this.logger.log('Observer melhorado inicializado');
    }

    /**
     * Cleanup observers and listeners
     */
    cleanup() {
        if (this.mainObserver) {
            this.mainObserver.disconnect();
            this.mainObserver = null;
        }
        
        if (this.navigationCheckInterval) {
            clearInterval(this.navigationCheckInterval);
            this.navigationCheckInterval = null;
        }
        
        // Restore original history methods
        if (this.originalPushState) {
            history.pushState = this.originalPushState;
        }
        if (this.originalReplaceState) {
            history.replaceState = this.originalReplaceState;
        }
        
        // Remove event listeners
        window.removeEventListener('popstate', this._handlePopState);
        window.removeEventListener('beforeunload', this._handleBeforeUnload);
        window.removeEventListener('unload', this._handleUnload);
        
        this.logger.log('Observer cleanup completo');
    }

    /**
     * Setup DOM mutation observer
     * @private
     */
    _setupDOMObserver() {
        this.mainObserver = new MutationObserver(DOMUtils.debounce((mutations) => {
            let shouldCheck = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    // Check if relevant elements were added/removed
                    const relevantChanges = Array.from(mutation.addedNodes)
                        .concat(Array.from(mutation.removedNodes))
                        .some(node => this._isRelevantNode(node));
                    
                    if (relevantChanges) {
                        shouldCheck = true;
                    }
                }
                
                // Check attribute changes that may indicate navigation
                if (mutation.type === 'attributes' && 
                    this._isRelevantAttribute(mutation.attributeName)) {
                    shouldCheck = true;
                }
            });
            
            if (shouldCheck) {
                this._handleDOMChange();
            }
        }, 100));

        this.mainObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-note-uuid', 'data-note-id', 'data-id', 'class']
        });
    }

    /**
     * Check if node is relevant for our observation
     * @private
     * @param {Node} node - DOM node to check
     * @returns {boolean} True if relevant
     */
    _isRelevantNode(node) {
        if (node.nodeType !== Node.ELEMENT_NODE) return false;
        if (!node.matches) return false;
        
        return node.matches('.note-view') ||
               node.matches('.editor-content') ||
               node.matches('#super-editor-content') ||
               node.matches('.note-view-options-buttons') ||
               (node.className && typeof node.className === 'string' && node.className.includes('note')) ||
               (node.className && typeof node.className === 'string' && node.className.includes('editor'));
    }

    /**
     * Check if attribute is relevant for our observation
     * @private
     * @param {string} attributeName - Attribute name
     * @returns {boolean} True if relevant
     */
    _isRelevantAttribute(attributeName) {
        return ['data-note-uuid', 'data-note-id', 'data-id', 'class'].includes(attributeName);
    }

    /**
     * Handle DOM changes
     * @private
     */
    _handleDOMChange() {
        // Remove duplicate buttons that may have been created
        this._removeDuplicateButtons();
        
        // Small delay to wait for complete rendering
        setTimeout(() => {
            if (this.onEditorChangeCallback) {
                this.onEditorChangeCallback();
            }
        }, 100);
    }

    /**
     * Remove duplicate buttons
     * @private
     */
    _removeDuplicateButtons() {
        const allButtons = document.querySelectorAll('#sn-add-location-button');
        if (allButtons.length > 1) {
            this.logger.log('Removendo', allButtons.length - 1, 'botões duplicados');
            for (let i = 1; i < allButtons.length; i++) {
                allButtons[i].remove();
            }
        }
    }

    /**
     * Setup navigation detection for SPA routing
     * @private
     */
    _setupNavigationDetection() {
        // Override history methods to detect navigation
        history.pushState = (...args) => {
            this.originalPushState.apply(history, args);
            setTimeout(() => {
                if (this.onEditorChangeCallback) {
                    this.onEditorChangeCallback();
                }
            }, 200);
        };
        
        history.replaceState = (...args) => {
            this.originalReplaceState.apply(history, args);
            setTimeout(() => {
                if (this.onEditorChangeCallback) {
                    this.onEditorChangeCallback();
                }
            }, 200);
        };
        
        // Listen for browser navigation events
        this._handlePopState = () => {
            setTimeout(() => {
                if (this.onEditorChangeCallback) {
                    this.onEditorChangeCallback();
                }
            }, 200);
        };
        
        window.addEventListener('popstate', this._handlePopState);
    }

    /**
     * Setup periodic check as fallback
     * @private
     */
    _setupPeriodicCheck() {
        if (this.navigationCheckInterval) {
            clearInterval(this.navigationCheckInterval);
        }
        
        // Reduced frequency and smarter checking
        this.navigationCheckInterval = setInterval(() => {
            // Only check if there's been some meaningful change
            const currentUrl = window.location.href;
            const currentNoteId = this._getCurrentNoteId();
            
            if (this.lastUrl !== currentUrl || this.lastNoteId !== currentNoteId) {
                this.lastUrl = currentUrl;
                this.lastNoteId = currentNoteId;
                
                if (this.onEditorChangeCallback) {
                    this.onEditorChangeCallback();
                }
            }
        }, 5000); // Check every 5 seconds instead of 3
    }

    /**
     * Get current note ID for change detection
     * @private
     * @returns {string|null} Note ID or null
     */
    _getCurrentNoteId() {
        const selectors = [
            '[data-note-uuid]',
            '[data-note-id]',
            '[data-id]'
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.getAttribute('data-note-uuid') ||
                       element.getAttribute('data-note-id') ||
                       element.getAttribute('data-id');
            }
        }

        return window.location.hash || window.location.pathname;
    }

    /**
     * Setup cleanup event listeners
     */
    setupCleanupListeners() {
        this._handleBeforeUnload = () => {
            this.cleanup();
        };
        
        this._handleUnload = () => {
            this.cleanup();
        };
        
        window.addEventListener('beforeunload', this._handleBeforeUnload);
        window.addEventListener('unload', this._handleUnload);
    }

    /**
     * Check if we're on Standard Notes domain
     * @returns {boolean} True if on Standard Notes
     */
    static isStandardNotesDomain() {
        return window.location.hostname === 'app.standardnotes.com';
    }

    /**
     * Wait for page to be ready
     * @returns {Promise} Promise that resolves when page is ready
     */
    static waitForPageReady() {
        return new Promise((resolve) => {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    /**
     * Check if Standard Notes interface is loaded
     * @returns {boolean} True if interface is loaded
     */
    static isStandardNotesLoaded() {
        // Look for key Standard Notes elements
        const indicators = [
            '.note-view',
            '.editor-content',
            '#super-editor-content',
            '.note-view-options-buttons',
            '[data-note-uuid]',
            '[data-note-id]'
        ];
        
        return indicators.some(selector => document.querySelector(selector) !== null);
    }
}

// Export to global scope
window.PageObserver = PageObserver;
