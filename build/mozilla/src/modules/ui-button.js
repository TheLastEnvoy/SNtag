/**
 * UI Button Module for Standard Notes Tag Addon
 * Handles creation, positioning, and management of the "Add tag" button
 */
class UIButton {
    constructor() {
        this.logger = window.SNLogger;
        this.button = null;
        this.referenceElement = null;
        this.usedSelector = null;
        this.repositionTimeout = null;
        this.isProcessing = false;
        
        this.referenceSelectors = [
            '.note-view-options-buttons > button:nth-child(1) > svg:nth-child(1)',
            '.note-view-options-buttons > button:nth-child(1)',
            '.note-view-options-buttons > button',
            '.note-view-options-buttons',
            '.note-view-header button',
            '.note-view .options button',
            '[title="Pin"], [title="Options"], [title="Menu"]',
            '.note-view-top button',
            '.note-view-content-header button'
        ];
    }

    /**
     * Create and display the add location button
     * @param {Function} onClickCallback - Callback function for button click
     * @returns {boolean} Success status
     */
    createButton(onClickCallback) {
        try {
            // Remove existing button if any
            this.removeButton();
            
            this.logger.log('Criando botão "Add tag"...');
            
            // Find reference element for positioning
            this._findReferenceElement();
            
            // Create button element
            this.button = this._createButtonElement();
            
            // Position button
            this._positionButton();
            
            // Add event listeners
            this._addEventListeners(onClickCallback);
            
            // Add to page
            document.body.appendChild(this.button);
            
            // Setup repositioning listeners
            this._setupRepositioning();
            
            this.logger.log('Botão "Add tag" criado e posicionado');
            return true;
            
        } catch (e) {
            this.logger.error('Erro ao criar botão:', e);
            return false;
        }
    }

    /**
     * Remove the button from the page
     */
    removeButton() {
        if (this.button) {
            this.button.remove();
            this.button = null;
            this.logger.log('Botão removido');
        }
    }

    /**
     * Check if button exists and is visible
     * @returns {boolean} True if button exists
     */
    exists() {
        return this.button !== null && document.contains(this.button);
    }

    /**
     * Reposition button relative to reference element
     */
    repositionButton() {
        if (this.repositionTimeout) {
            clearTimeout(this.repositionTimeout);
        }
        
        this.repositionTimeout = setTimeout(() => {
            this._doRepositionButton();
        }, 50);
    }

    /**
     * Find reference element for button positioning
     * @private
     */
    _findReferenceElement() {
        for (const selector of this.referenceSelectors) {
            const element = document.querySelector(selector);
            if (element) {
                this.referenceElement = element;
                this.usedSelector = selector;
                this.logger.debug('Elemento de referência encontrado:', selector);
                return;
            }
        }
        
        this.logger.warn('Nenhum elemento de referência encontrado');
        this.referenceElement = null;
        this.usedSelector = null;
    }

    /**
     * Create button DOM element
     * @private
     * @returns {HTMLButtonElement} Button element
     */
    _createButtonElement() {
        const button = document.createElement('button');
        button.id = 'sn-add-location-button';
        button.textContent = 'Add tag';
        button.type = 'button';
        
        return button;
    }

    /**
     * Position button based on reference element
     * @private
     */
    _positionButton() {
        if (!this.button) return;
        
        let buttonCSS;
        
        if (this.referenceElement) {
            const rect = this.referenceElement.getBoundingClientRect();
            
            // Check if reference element has valid position
            if (rect.top === 0 && rect.left === 0 && rect.width === 0 && rect.height === 0) {
                this.logger.debug('Elemento de referência sem posição válida, usando posição fixa');
                buttonCSS = this._getFixedPositionCSS();
            } else {
                buttonCSS = this._getRelativePositionCSS(rect);
            }
        } else {
            buttonCSS = this._getFixedPositionCSS();
        }
        
        this.button.style.cssText = buttonCSS;
    }

    /**
     * Get CSS for relative positioning
     * @private
     * @param {DOMRect} rect - Reference element rectangle
     * @returns {string} CSS string
     */
    _getRelativePositionCSS(rect) {
        let leftPosition;
        
        if (this.usedSelector === '.note-view-options-buttons > button:nth-child(1) > svg:nth-child(1)') {
            const parentButton = this.referenceElement.closest('button');
            if (parentButton) {
                const parentRect = parentButton.getBoundingClientRect();
                leftPosition = Math.max(10, parentRect.left - 180);
            } else {
                leftPosition = Math.max(10, rect.left - 180);
            }
        } else {
            leftPosition = Math.max(10, rect.left - 180);
        }
        
        return `
            position: fixed;
            top: ${rect.top}px;
            left: ${leftPosition}px;
            z-index: 10000;
            background: #086dd9;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            white-space: nowrap;
        `;
    }

    /**
     * Get CSS for fixed positioning (fallback)
     * @private
     * @returns {string} CSS string
     */
    _getFixedPositionCSS() {
        return `
            position: fixed;
            top: 10px;
            right: 10px;
            z-index: 10000;
            background: #086dd9;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            transition: all 0.2s ease;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            white-space: nowrap;
        `;
    }

    /**
     * Add event listeners to button
     * @private
     * @param {Function} onClickCallback - Click callback function
     */
    _addEventListeners(onClickCallback) {
        // Hover effects
        this.button.addEventListener('mouseenter', () => {
            this.button.style.background = '#0056b3';
            this.button.style.transform = 'translateY(-1px)';
            this.button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        });

        this.button.addEventListener('mouseleave', () => {
            this.button.style.background = '#086dd9';
            this.button.style.transform = 'translateY(0)';
            this.button.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        });

        // Click handler with processing protection
        this.button.addEventListener('click', (event) => {
            if (this.isProcessing) {
                this.logger.debug('Clique ignorado - processamento em andamento');
                return;
            }
            
            this.isProcessing = true;
            event.preventDefault();
            event.stopPropagation();
            
            // Update button state
            this._setProcessingState(true);
            
            try {
                onClickCallback();
            } finally {
                // Re-enable button after delay
                setTimeout(() => {
                    this.isProcessing = false;
                    this._setProcessingState(false);
                }, 2000);
            }
        });
    }

    /**
     * Set button processing state
     * @private
     * @param {boolean} processing - Processing state
     */
    _setProcessingState(processing) {
        if (!this.button) return;
        
        if (processing) {
            this.button.disabled = true;
            this.button.style.opacity = '0.6';
            this.button.textContent = 'Adding...';
        } else {
            this.button.disabled = false;
            this.button.style.opacity = '1';
            this.button.textContent = 'Add tag';
        }
    }

    /**
     * Setup repositioning event listeners
     * @private
     */
    _setupRepositioning() {
        if (!this.referenceElement) return;
        
        const debouncedReposition = DOMUtils.debounce(() => this.repositionButton(), 200);
        
        window.addEventListener('resize', debouncedReposition);
        window.addEventListener('scroll', debouncedReposition);
        
        // Observer for DOM changes
        const resizeObserver = new MutationObserver(DOMUtils.debounce(() => {
            if (this.button && this.referenceElement && document.contains(this.referenceElement)) {
                this.repositionButton();
            }
        }, 300));
        
        resizeObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false
        });
    }

    /**
     * Perform button repositioning
     * @private
     */
    _doRepositionButton() {
        if (!this.button) return;
        
        // Revalidate reference element if it doesn't exist anymore
        if (!this.referenceElement || !document.contains(this.referenceElement)) {
            this.logger.debug('Elemento de referência perdido, procurando novo...');
            this._findReferenceElement();
        }
        
        if (this.referenceElement) {
            try {
                const rect = this.referenceElement.getBoundingClientRect();
                
                // Check if element has valid position
                if (rect.top === 0 && rect.left === 0 && rect.width === 0 && rect.height === 0) {
                    this.logger.debug('Elemento de referência sem posição válida');
                    return;
                }
                
                let newLeft;
                
                if (this.usedSelector === '.note-view-options-buttons > button:nth-child(1) > svg:nth-child(1)') {
                    const parentButton = this.referenceElement.closest('button');
                    if (parentButton) {
                        const parentRect = parentButton.getBoundingClientRect();
                        newLeft = Math.max(10, parentRect.left - 180);
                    } else {
                        newLeft = Math.max(10, rect.left - 180);
                    }
                } else {
                    newLeft = Math.max(10, rect.left - 180);
                }
                
                this.button.style.top = `${rect.top}px`;
                this.button.style.left = `${newLeft}px`;
                this.logger.debug('Botão reposicionado para:', {top: rect.top, left: newLeft});
            } catch (e) {
                this.logger.error('Erro ao reposicionar botão:', e);
            }
        } else {
            this.logger.debug('Nenhum elemento de referência encontrado para posicionamento');
        }
    }
}

// Export to global scope
window.UIButton = UIButton;
