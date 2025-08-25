/**
 * Main Application Controller for Standard Notes Tag Addon
 * Coordinates all modules and handles the main application logic
 */
class StandardNotesTagAddon {
    constructor() {
        this.logger = window.SNLogger;
        this.tagDetector = new TagDetector();
        this.contentInserter = new ContentInserter();
        this.uiButton = new UIButton();
        this.pageObserver = new PageObserver();
        
        this.isInitialized = false;
        this.currentEditor = null;
        this.lastProcessedNoteId = null;
        
        this.logger.log('Standard Notes Tag Addon inicializado');
    }

    /**
     * Initialize the addon
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            // Prevent multiple initializations
            if (this.isInitialized) {
                this.logger.log('Extensão já inicializada, ignorando...');
                return;
            }

            this.logger.log('Inicializando Standard Notes Tag Addon...');

            // Check if we're on the correct domain
            if (!PageObserver.isStandardNotesDomain()) {
                this.logger.log('Não está no domínio do Standard Notes, saindo...');
                return;
            }

            // Wait for page to be ready
            await PageObserver.waitForPageReady();

            // Mark as initialized
            this.isInitialized = true;

            // Wait for Standard Notes to load
            await this._waitForStandardNotesLoad();

            // Start main application logic
            this._startApplication();

        } catch (error) {
            this.logger.error('Erro durante a inicialização:', error);
        }
    }

    /**
     * Start the main application logic
     * @private
     */
    _startApplication() {
        // Initial check for editor
        this._checkForEditor();

        // Initialize page observer
        this.pageObserver.initialize(() => {
            this._checkForEditor();
        });

        // Setup cleanup listeners
        this.pageObserver.setupCleanupListeners();

        this.logger.log('Aplicação iniciada com sucesso');
    }

    /**
     * Wait for Standard Notes interface to load
     * @private
     * @returns {Promise<void>}
     */
    _waitForStandardNotesLoad() {
        return new Promise((resolve) => {
            const checkLoaded = () => {
                if (PageObserver.isStandardNotesLoaded()) {
                    this.logger.log('Interface do Standard Notes carregada');
                    resolve();
                } else {
                    setTimeout(checkLoaded, 500);
                }
            };

            // Wait a bit for Standard Notes to load, then start checking
            setTimeout(checkLoaded, 2000);
        });
    }

    /**
     * Check for editor and handle UI updates
     * @private
     */
    _checkForEditor() {
        try {
            this.logger.debug('Verificando presença do editor...');

            // Get current editor
            const editor = this.contentInserter.getContentEditor();
            
            if (!editor) {
                this.logger.debug('Editor não encontrado, removendo botão se existir');
                this.uiButton.removeButton();
                this.currentEditor = null;
                return;
            }

            // Check if this is a new editor or note
            const currentNoteId = this._getCurrentNoteId();
            if (this.currentEditor === editor && this.lastProcessedNoteId === currentNoteId) {
                this.logger.debug('Mesmo editor e nota, nenhuma ação necessária');
                return;
            }

            this.currentEditor = editor;
            this.lastProcessedNoteId = currentNoteId;

            // Extract tags from current note
            const tags = this.tagDetector.extractTags();

            if (tags.length === 0) {
                this.logger.debug('Nenhuma tag encontrada, removendo botão se existir');
                this.uiButton.removeButton();
                return;
            }

            // Check if location block already exists
            const currentContent = editor.textContent || '';
            const currentHTML = editor.innerHTML || '';
            
            if (this.tagDetector.hasLocationBlock(currentContent) || 
                currentHTML.includes('<<<Localização>>>') ||
                currentContent.includes('Localização')) {
                this.logger.debug('Bloco de localização já existe, removendo botão se existir');
                this.uiButton.removeButton();
                return;
            }

            // Create or update button
            if (!this.uiButton.exists()) {
                this.logger.log('Criando botão para nota com tags:', tags);
                this.uiButton.createButton(() => {
                    this._handleAddLocationClick(tags);
                });
            } else {
                this.logger.debug('Botão já existe, reposicionando se necessário');
                this.uiButton.repositionButton();
            }

        } catch (error) {
            this.logger.error('Erro ao verificar editor:', error);
        }
    }

    /**
     * Handle add location button click
     * @private
     * @param {string[]} tags - Tags to add
     */
    _handleAddLocationClick(tags) {
        try {
            this.logger.log('Processando clique do botão Adicionar Localização');

            const editor = this.contentInserter.getContentEditor();
            if (!editor) {
                this.logger.error('Editor não encontrado durante o clique');
                return;
            }

            // Check if location already exists (double-check)
            const currentContent = editor.textContent || '';
            if (this.tagDetector.hasLocationBlock(currentContent)) {
                this.logger.log('Bloco de localização já existe, removendo botão');
                this.uiButton.removeButton();
                return;
            }

            // Create location block
            const locationBlock = this.tagDetector.createLocationBlock(tags);
            if (!locationBlock) {
                this.logger.error('Não foi possível criar bloco de localização');
                return;
            }

            // Insert location block
            const success = this.contentInserter.insertLocationBlock(editor, locationBlock);

            if (success) {
                this.logger.log('Localização inserida com sucesso');
                
                // Remove button after successful insertion
                setTimeout(() => {
                    this.uiButton.removeButton();
                }, 1000);
            } else {
                this.logger.error('Falha ao inserir localização');
            }

        } catch (error) {
            this.logger.error('Erro ao processar clique:', error);
        }
    }

    /**
     * Get current note ID for change detection
     * @private
     * @returns {string|null} Note ID or null
     */
    _getCurrentNoteId() {
        // Try different methods to get note ID
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

        // Fallback: use URL hash or pathname
        return window.location.hash || window.location.pathname;
    }

    /**
     * Cleanup method for extension shutdown
     */
    cleanup() {
        this.logger.log('Executando cleanup da extensão...');

        try {
            this.uiButton.removeButton();
            this.pageObserver.cleanup();
            
            this.isInitialized = false;
            this.currentEditor = null;
            this.lastProcessedNoteId = null;

            this.logger.log('Cleanup completo');
        } catch (error) {
            this.logger.error('Erro durante cleanup:', error);
        }
    }

    /**
     * Get addon status for debugging
     * @returns {Object} Status object
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            hasEditor: !!this.currentEditor,
            hasButton: this.uiButton.exists(),
            currentNoteId: this.lastProcessedNoteId,
            isStandardNotes: PageObserver.isStandardNotesDomain(),
            isLoaded: PageObserver.isStandardNotesLoaded()
        };
    }
}

// Export to global scope
window.StandardNotesTagAddon = StandardNotesTagAddon;
