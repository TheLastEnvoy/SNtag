/**
 * Configuration file for Standard Notes Tag Addon
 * Centralized configuration for all modules
 */
window.SNTagAddonConfig = {
    // Application metadata
    version: '2.2.0',
    name: 'Standard Notes Tag Location',
    
    // Debug settings
    debug: {
        enabled: false, // Set to false for production
        logLevel: 'debug' // 'debug', 'log', 'warn', 'error'
    },
    
    // UI settings
    ui: {
        button: {
            text: 'Adicionar Localização',
            processingText: 'Adicionando...',
            id: 'sn-add-location-button',
            repositionDelay: 50,
            processingTimeout: 2000
        },
        positioning: {
            fallbackPosition: { top: 10, right: 10 },
            minLeftOffset: 10,
            buttonOffset: 180
        }
    },
    
    // Tag detection settings
    tagDetection: {
        primarySelector: 'span.gap-1',
        maxTagLength: 100,
        cleanupRegex: /[\n\r\t]/g,
        suspiciousPatterns: [
            /^\d+$/,
            /^[()[\]{}]+$/,
            /^[<>]+$/,
            /\b(click|select|button|menu|link|focus|edit|delete|save|cancel)\b/i
        ]
    },
    
    // Content insertion settings
    contentInsertion: {
        locationFormat: '<<<Localização>>>',
        blockTemplate: '<<<Localização>>>\n{tag}\n<<<Localização>>>\n\n',
        insertionMethods: ['lexical', 'execCommand', 'paste'],
        retryAttempts: 3,
        retryDelay: 100
    },
    
    // Page observation settings
    observation: {
        debounceDelay: 100,
        periodicCheckInterval: 3000,
        domObserverConfig: {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-note-uuid', 'data-note-id', 'data-id', 'class']
        }
    },
    
    // Editor selectors in order of preference
    editorSelectors: [
        '#super-editor-content',
        '.editor-content',
        '.note-text-editor',
        '[contenteditable="true"]',
        '.CodeMirror',
        '.cm-editor'
    ],
    
    // Reference selectors for button positioning
    referenceSelectors: [
        '.note-view-options-buttons > button:nth-child(1) > svg:nth-child(1)',
        '.note-view-options-buttons > button:nth-child(1)',
        '.note-view-options-buttons > button',
        '.note-view-options-buttons',
        '.note-view-header button',
        '.note-view .options button',
        '[title="Pin"], [title="Options"], [title="Menu"]',
        '.note-view-top button',
        '.note-view-content-header button'
    ],
    
    // Interface elements to ignore
    interfaceElements: [
        'create a new smart view',
        'show/hide password',
        'link tags',
        'focus mode',
        'change',
        'pin',
        'options',
        'menu',
        'ctrl',
        'files',
        'link',
        'editor',
        'note',
        'view',
        'settings',
        'preferences',
        'search',
        'filter',
        'toggle',
        'button',
        'click',
        'select',
        'add',
        'remove',
        'delete',
        'edit',
        'save',
        'cancel'
    ],
    
    // Timing settings
    timing: {
        initializationDelay: 2000,
        moduleLoadTimeout: 5000,
        editorCheckDelay: 100,
        navigationDelay: 200,
        cleanupDelay: 500
    },
    
    // Domain validation
    allowedDomains: ['app.standardnotes.com'],
    
    // Error handling
    errorHandling: {
        maxRetries: 3,
        retryDelay: 1000,
        logErrors: true
    }
};

