/**
 * Content Inserter Module for Standard Notes Tag Addon
 * Handles insertion of location blocks into different editor types
 */
class ContentInserter {
    constructor() {
        this.logger = window.SNLogger;
        this.isInserting = false; // Flag to prevent concurrent insertions
        this.lastInsertionTime = 0; // Track last insertion time
        this.INSERTION_COOLDOWN = 2000; // 2 seconds cooldown between insertions
        this.editorSelectors = [
            '#super-editor-content',
            '.editor-content',
            '.note-text-editor',
            '[contenteditable="true"]',
            '.CodeMirror',
            '.cm-editor'
        ];
    }

    /**
     * Get the content editor element
     * @returns {HTMLElement|null} Editor element or null
     */
    getContentEditor() {
        for (const selector of this.editorSelectors) {
            const editor = document.querySelector(selector);
            if (editor) {
                this.logger.debug(`Editor encontrado: ${selector}`);
                return editor;
            }
        }
        
        this.logger.warn('Nenhum editor encontrado');
        return null;
    }

    /**
     * Insert location block into editor
     * @param {HTMLElement} editor - Editor element
     * @param {string} locationBlock - Location block to insert
     * @returns {boolean} Success status
     */
    insertLocationBlock(editor, locationBlock) {
        try {
            const now = Date.now();
            
            // Check insertion cooldown to prevent rapid-fire calls
            if (now - this.lastInsertionTime < this.INSERTION_COOLDOWN) {
                this.logger.log(`Inserção bloqueada por cooldown. Restam ${Math.ceil((this.INSERTION_COOLDOWN - (now - this.lastInsertionTime)) / 1000)}s`);
                return false;
            }
            
            // Prevent concurrent insertions
            if (this.isInserting) {
                this.logger.log('Inserção já em andamento, ignorando...');
                return false;
            }
            
            this.isInserting = true;
            this.logger.log('=== INICIANDO INSERÇÃO DE LOCALIZAÇÃO ===');
            
            // VERIFICAÇÃO SUPER RIGOROSA ANTES DA INSERÇÃO
            const verificationResult = this._performRigorousVerification(editor);
            if (!verificationResult.canInsert) {
                this.logger.log(`Inserção cancelada: ${verificationResult.reason}`);
                this.isInserting = false;
                return true; // Already exists, so technically successful
            }
            
            // Marcar tempo da inserção ANTES de inserir
            this.lastInsertionTime = now;
            
            // Perform single, precise insertion
            let success = false;
            
            if (this._isLexicalEditor(editor)) {
                this.logger.log('Detectado editor Lexical, usando API específica');
                success = this._insertIntoLexicalEditor(editor, locationBlock);
            } else {
                this.logger.log('Editor padrão detectado, usando execCommand');
                success = this._insertUsingExecCommand(editor, locationBlock);
            }
            
            // Final verification after insertion
            if (success) {
                setTimeout(() => {
                    const postVerification = this._performRigorousVerification(editor);
                    if (!postVerification.canInsert) {
                        this.logger.log('✅ Inserção confirmada - localização presente no editor');
                    } else {
                        this.logger.warn('⚠️ Possível falha na inserção - localização não detectada');
                    }
                }, 500);
            }
            
            // Reset flag after completion
            setTimeout(() => {
                this.isInserting = false;
            }, 1000);
            
            return success;
            
        } catch (error) {
            this.logger.log('Erro ao inserir localização: ' + error.message);
            this.isInserting = false;
            return false;
        }
    }

    /**
     * Perform rigorous verification before insertion to prevent any duplication
     * @private
     * @param {HTMLElement} editor - Editor element
     * @returns {Object} Verification result with canInsert flag and reason
     */
    _performRigorousVerification(editor) {
        this.logger.log('Realizando verificação rigorosa...');
        
        // Check 1: Text content
        const textContent = editor.textContent || '';
        if (textContent.includes('<<<Localização>>>') || textContent.includes('Localização')) {
            return { canInsert: false, reason: 'Localização encontrada no textContent' };
        }
        
        // Check 2: Inner HTML
        const innerHTML = editor.innerHTML || '';
        if (innerHTML.includes('<<<Localização>>>') || innerHTML.includes('Localização')) {
            return { canInsert: false, reason: 'Localização encontrada no innerHTML' };
        }
        
        // Check 3: Inner text
        const innerText = editor.innerText || '';
        if (innerText.includes('<<<Localização>>>') || innerText.includes('Localização')) {
            return { canInsert: false, reason: 'Localização encontrada no innerText' };
        }
        
        // Check 4: Query selectors for specific elements
        const locationElements = editor.querySelectorAll('*');
        for (const element of locationElements) {
            const elementText = element.textContent || '';
            if (elementText.includes('<<<Localização>>>') || elementText.includes('Localização')) {
                return { canInsert: false, reason: 'Localização encontrada em elemento filho' };
            }
        }
        
        // Check 5: Advanced location detection
        if (this._hasLocationInEditor(editor)) {
            return { canInsert: false, reason: 'Localização detectada pelo método avançado' };
        }
        
        // Check 6: Check for common location patterns
        const locationPatterns = [
            /<<<.*?Localização.*?>>>/gi,
            /Localização.*?:/gi,
            /Local.*?:/gi,
            /📍/gi
        ];
        
        for (const pattern of locationPatterns) {
            if (pattern.test(textContent) || pattern.test(innerHTML)) {
                return { canInsert: false, reason: `Padrão de localização detectado: ${pattern}` };
            }
        }
        
        this.logger.log('✅ Verificação rigorosa passou - pode inserir');
        return { canInsert: true, reason: 'Verificação aprovada' };
    }

    /**
     * Check if editor already has location content using multiple methods
     * @private
     * @param {HTMLElement} editor - Editor element
     * @returns {boolean} True if location exists
     */
    _hasLocationInEditor(editor) {
        // Check text content
        const textContent = editor.textContent || '';
        if (textContent.includes('<<<Localização>>>')) return true;
        
        // Check innerHTML
        const innerHTML = editor.innerHTML || '';
        if (innerHTML.includes('<<<Localização>>>') || innerHTML.includes('Localização')) return true;
        
        // Check for any text nodes containing location
        const walker = document.createTreeWalker(
            editor,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        let node;
        while (node = walker.nextNode()) {
            if (node.textContent && node.textContent.includes('Localização')) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Check if editor is a Lexical editor
     * @private
     * @param {HTMLElement} editor - Editor element
     * @returns {boolean} True if Lexical editor
     */
    _isLexicalEditor(editor) {
        return editor.getAttribute('data-lexical-editor') !== null || 
               editor.__lexicalEditor !== undefined;
    }

    /**
     * Insert content into Lexical editor
     * @private
     * @param {HTMLElement} editor - Lexical editor element
     * @param {string} locationBlock - Content to insert
     * @returns {boolean} Success status
     */
    _insertIntoLexicalEditor(editor, locationBlock) {
        try {
            this.logger.log('🎯 Inserção ÚNICA no Lexical Editor...');
            
            // MÉTODO 1: Tentar API Lexical direta e PARAR aqui
            const lexicalEditor = editor.__lexicalEditor;
            if (lexicalEditor && typeof lexicalEditor.update === 'function') {
                this.logger.log('Usando API interna do Lexical - MÉTODO ÚNICO');
                
                let insertionSuccess = false;
                
                lexicalEditor.update(() => {
                    try {
                        // Primeiro, verificar se já existe conteúdo
                        if (window.$getRoot && typeof window.$getRoot === 'function') {
                            const rootNode = window.$getRoot();
                            const currentText = rootNode.getTextContent();
                            
                            if (currentText.includes('Localização')) {
                                this.logger.log('⚠️ Localização já detectada no rootNode, cancelando');
                                return;
                            }
                            
                            // Inserir no início do documento
                            if (window.$createTextNode && window.$createParagraphNode) {
                                const paragraphNode = window.$createParagraphNode();
                                const textNode = window.$createTextNode(locationBlock + '\n\n');
                                paragraphNode.append(textNode);
                                rootNode.selectStart();
                                rootNode.getFirstChild() ? 
                                    rootNode.getFirstChild().insertBefore(paragraphNode) :
                                    rootNode.append(paragraphNode);
                                
                                insertionSuccess = true;
                                this.logger.log('✅ Inserção via createParagraphNode bem-sucedida');
                            }
                        }
                    } catch (apiError) {
                        this.logger.error('Erro na API Lexical:', apiError);
                    }
                });
                
                if (insertionSuccess) {
                    this.logger.log('✅ Inserção Lexical ÚNICA concluída com sucesso');
                    return true;
                }
            }
            
            // MÉTODO 2: Fallback simples - focus + execCommand (SEM chamar outros métodos)
            this.logger.log('API Lexical não disponível, usando fallback direto');
            editor.focus();
            
            // Posicionar cursor no início
            const range = document.createRange();
            const selection = window.getSelection();
            
            if (editor.firstChild) {
                range.setStart(editor.firstChild, 0);
            } else {
                range.setStart(editor, 0);
            }
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Inserir usando execCommand
            const success = document.execCommand('insertText', false, locationBlock + '\n\n');
            
            if (success) {
                this.logger.log('✅ Fallback execCommand bem-sucedido');
                return true;
            }
            
            this.logger.warn('❌ Todos os métodos de inserção falharam');
            return false;
            
        } catch (e) {
            this.logger.error('Erro crítico na inserção Lexical:', e);
            return false;
        }
    }

    /**
     * Insert using execCommand
     * @private
     * @param {HTMLElement} editor - Editor element
     * @param {string} locationBlock - Content to insert
     * @returns {boolean} Success status
     */
    _insertUsingExecCommand(editor, locationBlock) {
        try {
            this.logger.log('🎯 Inserção ÚNICA usando execCommand...');
            
            // Final check before insertion
            const preCheck = editor.textContent || '';
            if (preCheck.includes('Localização')) {
                this.logger.log('⚠️ Localização detectada antes do execCommand, cancelando');
                return true;
            }
            
            editor.focus();
            
            // Clear any existing selection and position at start
            const selection = window.getSelection();
            const range = document.createRange();
            
            // Position at the very beginning of editor
            if (editor.firstChild && editor.firstChild.nodeType === Node.TEXT_NODE) {
                range.setStart(editor.firstChild, 0);
            } else if (editor.firstChild) {
                range.setStartBefore(editor.firstChild);
            } else {
                range.setStart(editor, 0);
            }
            
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Single execCommand insertion with precise content
            const insertContent = locationBlock + '\n\n';
            const success = document.execCommand('insertText', false, insertContent);
            
            if (success) {
                this.logger.log('✅ execCommand ÚNICO bem-sucedido');
                
                // Notify Standard Notes about the change
                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    data: insertContent,
                    inputType: 'insertText'
                });
                editor.dispatchEvent(inputEvent);
                
                // Verify insertion
                setTimeout(() => {
                    const postCheck = editor.textContent || '';
                    if (postCheck.includes('Localização')) {
                        this.logger.log('✅ Verificação pós-inserção confirmada');
                    } else {
                        this.logger.warn('⚠️ Verificação pós-inserção falhou');
                    }
                }, 200);
                
                return true;
            } else {
                this.logger.warn('❌ execCommand falhou');
                return false;
            }
            
        } catch (e) {
            this.logger.error('Erro na inserção via execCommand:', e);
            return false;
        }
    }

    /**
     * Remove existing location blocks from content
     * @param {HTMLElement} editor - Editor element
     * @returns {boolean} Success status
     */
    removeExistingLocationBlocks(editor) {
        try {
            this.logger.log('Removendo blocos de localização existentes...');
            
            const walker = document.createTreeWalker(
                editor,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        if (node.textContent && node.textContent.includes('<<<Localização>>>')) {
                            return NodeFilter.FILTER_ACCEPT;
                        }
                        return NodeFilter.FILTER_REJECT;
                    }
                }
            );
            
            const nodesToRemove = [];
            let node;
            
            while (node = walker.nextNode()) {
                const text = node.textContent;
                if (text.includes('<<<Localização>>>')) {
                    let nodeToRemove = node;
                    
                    // Remove parent if it's a formatting element
                    while (nodeToRemove.parentNode && 
                           nodeToRemove.parentNode !== editor && 
                           nodeToRemove.parentNode.children.length <= 1) {
                        nodeToRemove = nodeToRemove.parentNode;
                    }
                    
                    nodesToRemove.push(nodeToRemove);
                }
            }
            
            // Remove found nodes
            nodesToRemove.forEach(node => {
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            });
            
            // Clean up orphaned <br> elements
            this._cleanupOrphanedBreaks(editor);
            
            this.logger.log('Blocos de localização removidos da interface');
            return true;
            
        } catch (e) {
            this.logger.error('Erro ao remover localização existente:', e);
            return false;
        }
    }

    /**
     * Clean up orphaned line breaks
     * @private
     * @param {HTMLElement} editor - Editor element
     */
    _cleanupOrphanedBreaks(editor) {
        const brs = editor.querySelectorAll('br');
        let consecutiveBrs = 0;
        
        brs.forEach(br => {
            if (br.previousSibling === null || br.previousSibling.nodeName === 'BR') {
                consecutiveBrs++;
                if (consecutiveBrs > 1) {
                    br.remove();
                }
            } else {
                consecutiveBrs = 0;
            }
        });
    }

    /**
     * Check if location block already exists in content
     * @param {string} content - Content to check
     * @returns {boolean} True if location block exists
     */
    hasLocationBlock(content) {
        return content.includes('<<<Localização>>>') || content.includes('Localização');
    }

    /**
     * Remove duplicate location blocks immediately
     * @private
     * @param {HTMLElement} editor - Editor element
     */
    _removeDuplicatesImmediate(editor) {
        try {
            let content = editor.textContent || '';
            const locationBlockRegex = /<<<Localização>>>\n[^<]*\n<<<Localização>>>\n*/g;
            const matches = [...content.matchAll(locationBlockRegex)];
            
            if (matches.length > 1) {
                this.logger.log('Removendo duplicatas detectadas...');
                
                const firstBlock = matches[0][0];
                let newContent = content.replace(locationBlockRegex, '');
                newContent = firstBlock + newContent;
                
                // Update editor content
                editor.focus();
                const range = document.createRange();
                range.selectNodeContents(editor);
                const selection = window.getSelection();
                selection.removeAllRanges();
                selection.addRange(range);
                
                document.execCommand('insertText', false, newContent);
                this.logger.log('Duplicatas removidas');
            }
        } catch (e) {
            this.logger.error('Erro ao remover duplicatas:', e);
        }
    }
}

// Export to global scope
window.ContentInserter = ContentInserter;
