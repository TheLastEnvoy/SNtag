(function() {
    'use strict';

    let addLocationButton = null;
    let isProcessing = false;
    let globalReferenceElement = null;
    let globalUsedSelector = null;
    let repositionTimeout = null;

    // Função global para reposicionar o botão (com debounce)
    function repositionButton() {
        // Limpar timeout anterior
        if (repositionTimeout) {
            clearTimeout(repositionTimeout);
        }
        
        // Agendar reposicionamento
        repositionTimeout = setTimeout(() => {
            doRepositionButton();
        }, 50);
    }
    
    function doRepositionButton() {
        if (!addLocationButton) return;
        
        // Revalidar elemento de referência se ele não existir mais
        if (!globalReferenceElement || !document.contains(globalReferenceElement)) {
            console.log('[SN Tag Addon] Elemento de referência perdido, procurando novo...');
            
            const referenceSelectors = [
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
            
            for (const selector of referenceSelectors) {
                const element = document.querySelector(selector);
                if (element) {
                    globalReferenceElement = element;
                    globalUsedSelector = selector;
                    console.log('[SN Tag Addon] Novo elemento de referência encontrado:', selector);
                    break;
                }
            }
        }
        
        if (globalReferenceElement) {
            try {
                const rect = globalReferenceElement.getBoundingClientRect();
                
                // Verificar se o elemento tem posição válida
                if (rect.top === 0 && rect.left === 0 && rect.width === 0 && rect.height === 0) {
                    console.log('[SN Tag Addon] Elemento de referência sem posição válida');
                    return;
                }
                
                let newLeft;
                
                // Aplicar a mesma lógica de posicionamento
                if (globalUsedSelector === '.note-view-options-buttons > button:nth-child(1) > svg:nth-child(1)') {
                    const parentButton = globalReferenceElement.closest('button');
                    if (parentButton) {
                        const parentRect = parentButton.getBoundingClientRect();
                        newLeft = Math.max(10, parentRect.left - 180);
                    } else {
                        newLeft = Math.max(10, rect.left - 180);
                    }
                } else {
                    newLeft = Math.max(10, rect.left - 180);
                }
                
                addLocationButton.style.top = `${rect.top}px`;
                addLocationButton.style.left = `${newLeft}px`;
                console.log('[SN Tag Addon] Botão reposicionado para:', {top: rect.top, left: newLeft});
            } catch (e) {
                console.log('[SN Tag Addon] Erro ao reposicionar botão:', e);
            }
        } else {
            console.log('[SN Tag Addon] Nenhum elemento de referência encontrado para posicionamento');
        }
    }

    // Funções de segurança para evitar innerHTML
    function sanitizeText(text) {
        // Método completamente seguro: escape manual de caracteres HTML
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function safeSetHTML(element, htmlContent) {
        // Método mais seguro: criar elementos DOM em vez de usar innerHTML diretamente
        element.innerHTML = '';
        
        if (typeof htmlContent === 'string') {
            // Converter quebras de linha para elementos <br>
            const parts = htmlContent.split('<br>');
            for (let i = 0; i < parts.length; i++) {
                if (i > 0) {
                    element.appendChild(document.createElement('br'));
                }
                if (parts[i]) {
                    const textNode = document.createTextNode(parts[i]);
                    element.appendChild(textNode);
                }
            }
        } else {
            element.appendChild(htmlContent);
        }
    }

    function safeInsertHTML(element, locationText, existingHTML) {
        // Limpar elemento
        element.innerHTML = '';
        
        // Adicionar texto de localização
        if (locationText) {
            const lines = locationText.split('\n');
            for (let i = 0; i < lines.length; i++) {
                if (i > 0) {
                    element.appendChild(document.createElement('br'));
                }
                if (lines[i]) {
                    const textNode = document.createTextNode(lines[i]);
                    element.appendChild(textNode);
                }
            }
        }
        
        // Adicionar conteúdo existente de forma completamente segura
        if (existingHTML) {
            // Usar DOMParser para parsing seguro em vez de innerHTML
            const parser = new DOMParser();
            const doc = parser.parseFromString(existingHTML, 'text/html');
            
            // Importar nodes de forma segura
            const bodyChildren = doc.body.childNodes;
            for (let i = 0; i < bodyChildren.length; i++) {
                const importedNode = document.importNode(bodyChildren[i], true);
                element.appendChild(importedNode);
            }
        }
    }

    // Função para extrair tags da nota atual (versão com seletores corretos)
    function extractTags() {
        const tags = [];
        
        console.log('[SN Tag Addon] Iniciando detecção de tags...');
        
        // Lista de strings que são elementos da interface, não tags
        const interfaceElements = [
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
        ];
        
        // Método 1: Usar o seletor correto informado pelo usuário
        const tagSpans = document.querySelectorAll('span.gap-1');
        console.log(`[SN Tag Addon] Encontradas ${tagSpans.length} spans com classe gap-1`);
        
        tagSpans.forEach((span, index) => {
            const text = span.textContent?.trim();
            const title = span.getAttribute('title')?.trim();
            
            console.log(`[SN Tag Addon] Span ${index}: texto="${text}", title="${title}"`);
            
            // Verificar ambos o texto e o título
            [text, title].forEach(tagText => {
                if (tagText && isValidTag(tagText, interfaceElements)) {
                    console.log(`[SN Tag Addon] Tag válida encontrada: "${tagText}"`);
                    tags.push(tagText);
                } else if (tagText) {
                    console.log(`[SN Tag Addon] Tag inválida rejeitada: "${tagText}"`);
                }
            });
        });
        
        // Método 2: Procurar na área de linking (fallback)
        const linkingContainer = document.querySelector('.note-view-linking-container');
        if (linkingContainer) {
            console.log('[SN Tag Addon] Container de linking encontrado');
            
            // Usar seletores mais específicos baseados no que sabemos
            const additionalSelectors = [
                'span.gap-1', // Seletor principal
                'button.group.h-6.cursor-pointer',
                'button[title*="/"]', // Tags hierárquicas
                '*[title]:not([title*="Link"]):not([title*="Focus"]):not([title*="menu"])'
            ];
            
            additionalSelectors.forEach(selector => {
                const elements = linkingContainer.querySelectorAll(selector);
                console.log(`[SN Tag Addon] Seletor "${selector}" encontrou ${elements.length} elementos no container de linking`);
                
                elements.forEach(element => {
                    const possibleTexts = [
                        element.textContent?.trim(),
                        element.getAttribute('title')?.trim(),
                        element.getAttribute('data-tag')?.trim(),
                        element.getAttribute('aria-label')?.trim(),
                        element.innerText?.trim()
                    ].filter(text => text && text.length > 0);
                    
                    possibleTexts.forEach(tagText => {
                        if (isValidTag(tagText, interfaceElements)) {
                            console.log(`[SN Tag Addon] Tag válida encontrada no linking: "${tagText}"`);
                            tags.push(tagText);
                        }
                    });
                });
            });
        }

        // Método 3: Buscar especificamente por padrões hierárquicos
        const allSpans = document.querySelectorAll('span');
        allSpans.forEach(span => {
            const text = span.textContent?.trim();
            if (text && text.includes('/') && text.match(/^[A-Za-z][A-Za-z\/]*$/)) {
                console.log(`[SN Tag Addon] Possível tag hierárquica encontrada: "${text}"`);
                if (isValidTag(text, interfaceElements)) {
                    tags.push(text);
                }
            }
        });

        // Limpeza e normalização mais flexível
        console.log('[SN Tag Addon] Tags brutas antes da limpeza:', tags);
        
        const cleanedTags = tags.map(tag => {
            // Remover quebras de linha, mas manter espaços se necessário
            return tag.replace(/[\n\r\t]/g, '').replace(/\s+/g, ' ').trim();
        }).filter(tag => {
            // Filtrar tags válidas - MAIS FLEXÍVEL agora
            return tag && 
                   tag.length > 0 && 
                   tag.length <= 100 &&
                   tag !== 'undefined' && 
                   tag !== 'null' &&
                   !tag.endsWith('/'); // Apenas remover tags que terminam com /
        });

        console.log('[SN Tag Addon] Tags após limpeza básica:', cleanedTags);

        // Remover duplicatas exatas
        const uniqueTags = [...new Set(cleanedTags)];
        console.log('[SN Tag Addon] Tags após remoção de duplicatas:', uniqueTags);
        
        // Se temos múltiplas tags, priorizar a mais completa
        let finalTags = uniqueTags;
        if (uniqueTags.length > 1) {
            // Ordenar por complexidade: primeiro por número de segmentos, depois por comprimento
            finalTags = uniqueTags.sort((a, b) => {
                const aSegments = a.split('/').length;
                const bSegments = b.split('/').length;
                
                if (aSegments !== bSegments) {
                    return bSegments - aSegments; // Mais segmentos primeiro
                }
                return b.length - a.length; // Mais longo primeiro
            });
            
            // Se a primeira tag é claramente mais específica, usar apenas ela
            const firstTag = finalTags[0];
            const otherTags = finalTags.slice(1);
            
            const isFirstMuchBetter = otherTags.every(tag => 
                firstTag.includes(tag) || firstTag.split('/').length > tag.split('/').length
            );
            
            if (isFirstMuchBetter) {
                finalTags = [firstTag];
            }
        }
        
        console.log(`[SN Tag Addon] Tags finais selecionadas:`, finalTags);
        return finalTags;
    }

    // Função auxiliar para validar se um texto é uma tag válida
    function isValidTag(tagText, interfaceElements) {
        if (!tagText || tagText.length === 0 || tagText.length > 100) {
            return false;
        }
        
        // Verificar se não é um elemento da interface
        const isInterfaceElement = interfaceElements.some(interfaceStr => 
            tagText.toLowerCase().includes(interfaceStr.toLowerCase())
        );
        
        if (isInterfaceElement) {
            return false;
        }
        
        // Permitir caracteres alfanuméricos, espaços, hífens, underscores e barras
        const validCharacters = /^[a-zA-ZÀ-ÿ0-9\s_\-\/\.]+$/;
        if (!validCharacters.test(tagText)) {
            return false;
        }
        
        // Rejeitar se contém caracteres suspeitos de interface
        const suspiciousPatterns = [
            /^\d+$/, // Apenas números
            /^[()[\]{}]+$/, // Apenas parênteses/colchetes
            /^[<>]+$/, // Apenas símbolos
            /\b(click|select|button|menu|link|focus|edit|delete|save|cancel)\b/i
        ];
        
        if (suspiciousPatterns.some(pattern => pattern.test(tagText))) {
            return false;
        }
        
        return true;
    }

    // Função para criar o bloco de localização (versão simplificada)
    function createLocationBlock(tags) {
        if (tags.length === 0) return '';
        
        console.log('[SN Tag Addon] Criando bloco com tags:', tags);
        
        // Filtrar apenas tags relevantes (não elementos da interface)
        const validTags = tags.filter(tag => 
            tag !== 'Create a new smart view' && 
            tag !== 'Show/hide password' &&
            !tag.toLowerCase().includes('link') &&
            !tag.toLowerCase().includes('focus') &&
            !tag.toLowerCase().includes('menu')
        );
        
        if (validTags.length === 0) return '';
        
        // SEMPRE usar apenas a primeira tag (que já deve ser a melhor após a limpeza)
        const tagPath = validTags[0];
        
        console.log('[SN Tag Addon] Tag path final:', tagPath);
        
        return `<<<Localização>>>\n${tagPath}\n<<<Localização>>>\n\n`;
    }

    // Função para verificar se o bloco de localização já existe
    function hasLocationBlock(content) {
        return content.includes('<<<Localização>>>');
    }

    // Função para remover bloco de localização existente
    function removeExistingLocationBlock(content) {
        const regex = /<<<Localização>>>\n.*?\n<<<Localização>>>\n\n/gs;
        return content.replace(regex, '');
    }

    // Função para obter o editor de conteúdo
    function getContentEditor() {
        const selectors = [
            '#super-editor-content',
            '.editor-content',
            '.note-text-editor',
            '[contenteditable="true"]',
            '.CodeMirror',
            '.cm-editor'
        ];

        for (const selector of selectors) {
            const editor = document.querySelector(selector);
            if (editor) {
                return editor;
            }
        }

        return null;
    }

    // Método específico para Lexical Editor (Standard Notes)
    function insertIntoLexicalEditor(editor, locationBlock) {
        try {
            console.log('[SN Tag Addon] Tentando inserção específica para Lexical Editor...');
            
            // Verificar se é realmente um editor Lexical
            if (!editor.getAttribute('data-lexical-editor')) {
                console.log('[SN Tag Addon] Não é um editor Lexical');
                return false;
            }
            
            // Tentar usar a API interna do Lexical
            const lexicalEditor = editor.__lexicalEditor;
            if (lexicalEditor && typeof lexicalEditor.update === 'function') {
                console.log('[SN Tag Addon] Usando API interna do Lexical...');
                return insertUsingLexicalAPI(lexicalEditor, editor, locationBlock);
            }
            
            // Fallback: Método de paste mais realista
            console.log('[SN Tag Addon] Tentando método de paste realista...');
            return insertUsingRealisticPaste(editor, locationBlock);
            
        } catch (e) {
            console.error('[SN Tag Addon] Erro na inserção Lexical:', e);
            return false;
        }
    }

    // Usar API interna do Lexical
    function insertUsingLexicalAPI(lexicalEditor, editorElement, locationBlock) {
        try {
            console.log('[SN Tag Addon] Executando atualização via API Lexical...');
            
            // Focar no editor primeiro
            editorElement.focus();
            
            // Usar a API update do Lexical para modificar o estado
            lexicalEditor.update(() => {
                try {
                    // Obter o nó raiz
                    const root = lexicalEditor.getRootElement();
                    const editorState = lexicalEditor.getEditorState();
                    
                    console.log('[SN Tag Addon] Estado do editor Lexical:', editorState);
                    
                    // Tentar diferentes abordagens de inserção na API Lexical
                    if (window.$getRoot && typeof window.$getRoot === 'function') {
                        const rootNode = window.$getRoot();
                        const textNode = window.$createTextNode ? window.$createTextNode(locationBlock) : null;
                        
                        if (textNode && rootNode) {
                            rootNode.selectStart();
                            rootNode.insertAfter(textNode);
                            console.log('[SN Tag Addon] Texto inserido via API Lexical');
                            return true;
                        }
                    }
                    
                    // Fallback: inserir usando seleção
                    const selection = window.$getSelection ? window.$getSelection() : null;
                    if (selection) {
                        selection.insertText(locationBlock);
                        console.log('[SN Tag Addon] Texto inserido via seleção Lexical');
                        return true;
                    }
                    
                } catch (updateError) {
                    console.error('[SN Tag Addon] Erro na atualização Lexical:', updateError);
                }
            });
            
            return true;
            
        } catch (e) {
            console.error('[SN Tag Addon] Erro na API Lexical:', e);
            return false;
        }
    }

    // Método de inserção único e preciso
    function insertUsingRealisticPaste(editor, locationBlock) {
        try {
            console.log('[SN Tag Addon] Executando inserção única...');
            
            // Tripla verificação para evitar duplicação
            const currentContent = editor.textContent || editor.innerText || '';
            if (currentContent.includes('<<<Localização>>>') || 
                currentContent.includes('Localização') ||
                currentContent.match(/<<<.*>>>/)) {
                console.log('[SN Tag Addon] Localização detectada, abortando inserção');
                return true;
            }
            
            // Focar no editor
            editor.focus();
            
            // Tentar método Lexical primeiro (mais preciso)
            if (editor.__lexicalEditor) {
                try {
                    console.log('[SN Tag Addon] Usando API Lexical direta...');
                    
                    editor.__lexicalEditor.update(() => {
                        const root = editor.__lexicalEditor.getEditorState()._nodeMap.get('root');
                        if (root && root.getFirstChild) {
                            const firstChild = root.getFirstChild();
                            if (firstChild && firstChild.insertTextBefore) {
                                firstChild.insertTextBefore(locationBlock);
                                console.log('[SN Tag Addon] Inserção Lexical bem-sucedida');
                            }
                        }
                    });
                    return true;
                } catch (lexicalError) {
                    console.log('[SN Tag Addon] Falha na API Lexical, tentando execCommand...');
                }
            }
            
            // Fallback para execCommand
            const selection = window.getSelection();
            const range = document.createRange();
            
            // Posicionar no início do editor
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
            
            // Inserir usando execCommand uma única vez
            const success = document.execCommand('insertText', false, locationBlock);
            
            if (success) {
                console.log('[SN Tag Addon] execCommand bem-sucedido');
                return true;
            } else {
                console.log('[SN Tag Addon] execCommand falhou');
                return false;
            }
            
        } catch (e) {
            console.error('[SN Tag Addon] Erro no método de inserção:', e);
            return false;
        }
    }

    // Simular digitação real caracter por caracter
    function simulateRealTyping(editor, text) {
        try {
            console.log('[SN Tag Addon] Simulando digitação real...');
            
            // Posicionar cursor no início
            const selection = window.getSelection();
            const range = document.createRange();
            
            if (editor.firstChild) {
                range.setStart(editor.firstChild, 0);
            } else {
                range.setStart(editor, 0);
            }
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Digitar cada caracter com delay
            let currentIndex = 0;
            const typeNextChar = () => {
                if (currentIndex >= text.length) {
                    console.log('[SN Tag Addon] Digitação completa');
                    return;
                }
                
                const char = text[currentIndex];
                
                // Simular eventos de teclado reais
                const keyboardEventInit = {
                    key: char,
                    code: `Key${char.toUpperCase()}`,
                    charCode: char.charCodeAt(0),
                    keyCode: char.charCodeAt(0),
                    which: char.charCodeAt(0),
                    bubbles: true,
                    cancelable: true,
                    composed: true
                };
                
                // Sequência completa de eventos
                editor.dispatchEvent(new KeyboardEvent('keydown', keyboardEventInit));
                editor.dispatchEvent(new KeyboardEvent('keypress', keyboardEventInit));
                
                // Evento de input com dados corretos
                const inputEvent = new InputEvent('input', {
                    inputType: 'insertText',
                    data: char,
                    bubbles: true,
                    cancelable: true,
                    composed: true
                });
                editor.dispatchEvent(inputEvent);
                
                editor.dispatchEvent(new KeyboardEvent('keyup', keyboardEventInit));
                
                currentIndex++;
                
                // Continuar com próximo caracter
                setTimeout(typeNextChar, 10); // 10ms entre caracteres
            };
            
            typeNextChar();
            return true;
            
        } catch (e) {
            console.error('[SN Tag Addon] Erro na simulação de digitação:', e);
            return false;
        }
    }

    // Eventos compatíveis com Lexical
    function insertUsingLexicalCompatibleEvents(editor, locationBlock) {
        try {
            console.log('[SN Tag Addon] Tentando eventos compatíveis com Lexical...');
            
            // Selecionar todo o conteúdo
            editor.focus();
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(editor);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Obter conteúdo atual
            const currentContent = editor.textContent || '';
            const newContent = locationBlock + currentContent;
            
            // Usar beforeinput event que é padrão para editores modernos
            const beforeInputEvent = new InputEvent('beforeinput', {
                inputType: 'insertText',
                data: newContent,
                bubbles: true,
                cancelable: true
            });
            
            editor.dispatchEvent(beforeInputEvent);
            
            // Definir conteúdo diretamente
            editor.textContent = newContent;
            
            // Disparar input event
            const inputEvent = new InputEvent('input', {
                inputType: 'insertText',
                data: newContent,
                bubbles: true,
                cancelable: false
            });
            
            editor.dispatchEvent(inputEvent);
            
            // Posicionar cursor após a localização
            const newSelection = window.getSelection();
            const newRange = document.createRange();
            
            if (editor.firstChild) {
                const locationLength = locationBlock.length;
                newRange.setStart(editor.firstChild, Math.min(locationLength, editor.firstChild.textContent.length));
            } else {
                newRange.setStart(editor, 0);
            }
            newRange.collapse(true);
            newSelection.removeAllRanges();
            newSelection.addRange(newRange);
            
            console.log('[SN Tag Addon] Eventos Lexical compatíveis disparados');
            return true;
            
        } catch (e) {
            console.error('[SN Tag Addon] Erro nos eventos Lexical:', e);
            return false;
        }
    }

    // Função para inserir texto no editor (versão simplificada anti-duplicação)
    function insertTextInEditor(editor, locationBlock) {
        try {
            console.log('[SN Tag Addon] Tentando inserir localização preservando formatação:', editor.tagName, editor.id);
            
            // Verificação final antes da inserção
            const currentContent = editor.textContent || editor.innerText || '';
            if (currentContent.includes('<<<Localização>>>')) {
                console.log('[SN Tag Addon] Localização já presente, cancelando inserção');
                return true;
            }
            
            // Usar apenas o método mais confiável
            return insertUsingRealisticPaste(editor, locationBlock);
            
        } catch (e) {
            console.error('[SN Tag Addon] Erro ao inserir texto:', e);
            return false;
        }
    }

    // Método mais agressivo: Interceptar a API do Standard Notes
    function insertUsingStandardNotesAPI(editor, locationBlock) {
        try {
            console.log('[SN Tag Addon] Tentando interceptar API do Standard Notes...');
            
            // Obter conteúdo atual
            const currentContent = editor.textContent || '';
            const newContent = locationBlock + currentContent;
            
            // Forçar mudança no nível do DOM e depois simular eventos de usuário
            editor.textContent = newContent;
            
            // Simular sequência completa de eventos de usuário
            const events = [
                // Primeiro, simular focus
                new FocusEvent('focus', { bubbles: true }),
                
                // Simular que o usuário começou a digitar
                new CompositionEvent('compositionstart', { 
                    bubbles: true, 
                    data: locationBlock 
                }),
                
                // Simular dados sendo inseridos
                new InputEvent('input', {
                    bubbles: true,
                    cancelable: false,
                    inputType: 'insertCompositionText',
                    data: locationBlock
                }),
                
                // Simular fim da composição
                new CompositionEvent('compositionend', { 
                    bubbles: true, 
                    data: locationBlock 
                }),
                
                // Simular blur para salvar
                new FocusEvent('blur', { bubbles: true })
            ];
            
            // Disparar eventos com delays realistas
            events.forEach((event, index) => {
                setTimeout(() => {
                    editor.dispatchEvent(event);
                    console.log(`[SN Tag Addon] Evento ${event.type} disparado`);
                }, index * 200); // 200ms entre eventos
            });
            
            // Verificação com delay maior
            setTimeout(() => {
                const finalContent = editor.textContent || '';
                if (finalContent.includes('<<<Localização>>>')) {
                    console.log('[SN Tag Addon] API do Standard Notes funcionou!');
                } else {
                    console.log('[SN Tag Addon] API do Standard Notes falhou');
                }
            }, events.length * 200 + 500);
            
            return true;
            
        } catch (e) {
            console.error('[SN Tag Addon] Erro na interceptação da API:', e);
            return false;
        }
    }

    // Método usando execCommand (mais compatível com editores ricos)
    function insertUsingExecCommand(editor, locationBlock) {
        try {
            console.log('[SN Tag Addon] Tentando inserção usando execCommand...');
            
            // Focar no editor
            editor.focus();
            
            // Obter conteúdo atual para preservar
            const currentContent = editor.textContent || editor.innerText || '';
            
            // Mover cursor para o início
            const selection = window.getSelection();
            const range = document.createRange();
            
            // Posicionar no início do editor
            if (editor.firstChild) {
                range.setStart(editor.firstChild, 0);
            } else {
                range.setStart(editor, 0);
            }
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Usar execCommand para inserir texto
            const success = document.execCommand('insertText', false, locationBlock);
            
            if (success) {
                console.log('[SN Tag Addon] Inserção via execCommand bem-sucedida');
                
                // Disparar eventos para notificar o Standard Notes
                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    data: locationBlock,
                    inputType: 'insertText'
                });
                editor.dispatchEvent(inputEvent);
                
                return true;
            } else {
                console.log('[SN Tag Addon] execCommand falhou');
                return false;
            }
            
        } catch (e) {
            console.error('[SN Tag Addon] Erro na inserção via execCommand:', e);
            return false;
        }
    }

    // Novo método: Inserção no início preservando formatação
    function insertAtBeginningPreservingFormat(editor, locationBlock) {
        try {
            console.log('[SN Tag Addon] Tentando inserção preservando formatação...');
            
            // Verificar se é o editor do Standard Notes
            if (editor.id !== 'super-editor-content') {
                console.log('[SN Tag Addon] Editor não é o super-editor-content, usando método alternativo');
                return false;
            }
            
            // Focar no editor
            editor.focus();
            
            // Método direto: inserir HTML no início
            const currentHTML = editor.innerHTML;
            const locationHTML = locationBlock.replace(/\n/g, '<br>');
            
            console.log('[SN Tag Addon] HTML atual (primeiros 200 chars):', currentHTML.substring(0, 200));
            console.log('[SN Tag Addon] Location HTML:', locationHTML);
            
            // Inserir no início do conteúdo usando método seguro
            safeInsertHTML(editor, locationBlock, currentHTML);
            
            console.log('[SN Tag Addon] Novo HTML definido (primeiros 200 chars):', editor.innerHTML.substring(0, 200));
            
            // Aguardar um momento para o DOM atualizar
            setTimeout(() => {
                console.log('[SN Tag Addon] HTML após timeout (primeiros 200 chars):', editor.innerHTML.substring(0, 200));
                console.log('[SN Tag Addon] TextContent após timeout:', editor.textContent.substring(0, 100));
                
                // Se ainda não foi inserido, tentar forçar de forma mais agressiva
                if (!editor.innerHTML.includes('Localização') && !editor.textContent.includes('Localização')) {
                    console.log('[SN Tag Addon] Tentando inserção forçada...');
                    
                    // Limpar editor e reinsert tudo usando método seguro
                    const originalContent = editor.innerHTML;
                    
                    setTimeout(() => {
                        safeInsertHTML(editor, locationBlock, originalContent);
                        
                        // Simular uma mudança manual do usuário
                        editor.focus();
                        
                        // Disparar evento de input mais específico
                        const event = new CompositionEvent('compositionend', {
                            bubbles: true,
                            cancelable: true,
                            data: locationBlock
                        });
                        editor.dispatchEvent(event);
                        
                    }, 100);
                }
            }, 500);
            
            // Posicionar cursor após a localização
            try {
                const selection = window.getSelection();
                const range = document.createRange();
                
                // Encontrar onde termina a localização inserida
                const textNodes = [];
                const walker = document.createTreeWalker(
                    editor,
                    NodeFilter.SHOW_TEXT,
                    null,
                    false
                );
                
                let node;
                while (node = walker.nextNode()) {
                    textNodes.push(node);
                }
                
                // Posicionar após a localização
                if (textNodes.length > 0) {
                    let targetNode = textNodes[0];
                    let offset = 0;
                    
                    // Procurar o fim do bloco de localização
                    for (let i = 0; i < textNodes.length; i++) {
                        if (textNodes[i].textContent.includes('<<<Localização>>>')) {
                            if (i + 1 < textNodes.length) {
                                targetNode = textNodes[i + 1];
                                offset = 0;
                            } else {
                                targetNode = textNodes[i];
                                offset = textNodes[i].textContent.length;
                            }
                            break;
                        }
                    }
                    
                    range.setStart(targetNode, offset);
                    range.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(range);
                }
            } catch (cursorError) {
                console.log('[SN Tag Addon] Erro ao posicionar cursor, mas inserção foi bem-sucedida:', cursorError);
            }
            
            // Disparar eventos necessários com propriedades completas
            const inputEvent = new InputEvent('input', {
                bubbles: true,
                cancelable: true,
                data: locationBlock,
                inputType: 'insertText'
            });
            editor.dispatchEvent(inputEvent);
            
            // Forçar atualização do Standard Notes com múltiplos eventos
            const events = [
                new Event('change', { bubbles: true, cancelable: true }),
                new FocusEvent('blur', { bubbles: true }),
                new FocusEvent('focus', { bubbles: true }),
                new Event('keyup', { bubbles: true, cancelable: true })
            ];
            
            events.forEach((event, index) => {
                setTimeout(() => {
                    try {
                        editor.dispatchEvent(event);
                    } catch (e) {
                        // Ignorar erros em eventos
                    }
                }, (index + 1) * 100);
            });
            
            console.log('[SN Tag Addon] Localização inserida preservando formatação');
            return true;
            
        } catch (e) {
            console.error('[SN Tag Addon] Erro na inserção preservando formatação:', e);
            return false;
        }
    }

    // Método via Clipboard API preservando formatação
    async function insertViaClipboardPreserving(editor, locationBlock) {
        try {
            console.log('[SN Tag Addon] Tentando inserção via clipboard preservando formatação...');
            
            // Salvar conteúdo atual do clipboard
            let originalClipboard = '';
            try {
                originalClipboard = await navigator.clipboard.readText();
            } catch (e) {
                // Ignorar se não conseguir ler clipboard
            }

            // Focar no editor e posicionar no início
            editor.focus();
            
            const selection = window.getSelection();
            const range = document.createRange();
            
            if (editor.firstChild) {
                range.setStart(editor.firstChild, 0);
            } else {
                range.setStart(editor, 0);
            }
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Colocar localização no clipboard
            await navigator.clipboard.writeText(locationBlock);
            
            // Simular Ctrl+V
            const pasteEvent = new ClipboardEvent('paste', {
                bubbles: true,
                cancelable: true,
                clipboardData: new DataTransfer()
            });
            pasteEvent.clipboardData.setData('text/plain', locationBlock);
            
            editor.dispatchEvent(pasteEvent);
            
            // Tentar execCommand como fallback
            if (document.execCommand) {
                document.execCommand('paste');
            }
            
            // Restaurar clipboard original
            setTimeout(async () => {
                try {
                    if (originalClipboard) {
                        await navigator.clipboard.writeText(originalClipboard);
                    }
                } catch (e) {
                    // Ignorar erro ao restaurar
                }
            }, 100);
            
            console.log('[SN Tag Addon] Localização inserida via clipboard preservando formatação');
            return true;
            
        } catch (e) {
            console.log('[SN Tag Addon] Falha na inserção via clipboard preservando formatação:', e);
            return false;
        }
    }

    // Método de inserção direta preservando formatação
    function insertDirectlyPreserving(editor, locationBlock) {
        try {
            console.log('[SN Tag Addon] Tentando inserção direta preservando formatação...');
            
            if (editor.contentEditable === 'true' || editor.isContentEditable) {
                // Obter conteúdo atual
                const currentHTML = editor.innerHTML;
                
                // Inserir no início preservando o resto usando método seguro
                safeInsertHTML(editor, locationBlock, currentHTML);
                
                // Focar e posicionar cursor após a localização
                editor.focus();
                
                // Disparar eventos seguros
                const inputEvent = new InputEvent('input', {
                    bubbles: true,
                    cancelable: true,
                    data: locationBlock,
                    inputType: 'insertText'
                });
                editor.dispatchEvent(inputEvent);
                
                const changeEvent = new Event('change', {
                    bubbles: true,
                    cancelable: true
                });
                editor.dispatchEvent(changeEvent);
                
                console.log('[SN Tag Addon] Localização inserida diretamente preservando formatação');
                return true;
            }
            
            return false;
        } catch (e) {
            console.error('[SN Tag Addon] Erro na inserção direta preservando formatação:', e);
            return false;
        }
    }

    // Função para adicionar localização (chamada pelo botão) - Versão anti-duplicação
    function addLocationToNote() {
        console.log('[SN Tag Addon] Adicionando localização manualmente...');
        
        const editor = getContentEditor();
        if (!editor) {
            console.error('[SN Tag Addon] Editor não encontrado');
            alert('Editor de nota não encontrado. Certifique-se de que uma nota está aberta.');
            return;
        }

        console.log('[SN Tag Addon] Editor encontrado:', editor.tagName, editor.id, editor.className);

        // Verificação mais robusta para localização existente
        const currentContent = editor.textContent || editor.innerText || '';
        const hasLocation = currentContent.includes('<<<Localização>>>') || 
                           currentContent.includes('Localização') ||
                           currentContent.match(/<<<.*>>>/);
        
        if (hasLocation) {
            console.log('[SN Tag Addon] Localização já existe na nota, abortando');
            alert('Esta nota já possui informações de localização.');
            return;
        }

        const tags = extractTags();
        console.log('[SN Tag Addon] Tags encontradas:', tags);

        // Filtrar tags válidas
        const validTags = tags.filter(tag => 
            tag !== 'Create a new smart view' && 
            tag !== 'Show/hide password' &&
            !tag.toLowerCase().includes('link') &&
            !tag.toLowerCase().includes('focus') &&
            !tag.toLowerCase().includes('menu')
        );

        console.log('[SN Tag Addon] Tags válidas filtradas:', validTags);

        if (validTags.length === 0) {
            alert('Nenhuma tag encontrada para esta nota. Certifique-se de que a nota tem tags visíveis.');
            return;
        }

        // Obter conteúdo atual para verificar se já tem localização
        let content = editor.textContent || editor.innerText || '';
        console.log('[SN Tag Addon] Conteúdo atual (primeiros 100 chars):', content.substring(0, 100));
        
        // Se já tem bloco de localização, remover o existente apenas do conteúdo texto
        if (hasLocationBlock(content)) {
            // Para remover da interface, vamos buscar e remover elementos HTML que contêm <<<Localização>>>
            removeExistingLocationFromEditor(editor);
            console.log('[SN Tag Addon] Bloco de localização existente removido da interface');
            
            // Aguardar um pouco para o DOM se atualizar após remoção
            setTimeout(() => {
                continueWithInsertion();
            }, 200);
        } else {
            continueWithInsertion();
        }
        
        function continueWithInsertion() {
            // Criar novo bloco de localização
            const locationBlock = createLocationBlock(validTags);
            console.log('[SN Tag Addon] Bloco criado:', locationBlock);
            
            // Inserir bloco preservando formatação
            const success = insertTextInEditor(editor, locationBlock);
            
            if (success) {
                console.log('[SN Tag Addon] Localização adicionada com sucesso');
                alert(`Localização adicionada: ${validTags.join('/')}`);
                
                // Aguardar um pouco e verificar se realmente foi inserido
                setTimeout(() => {
                    const currentContent = editor.textContent || editor.innerText || editor.innerHTML || '';
                    console.log('[SN Tag Addon] Conteúdo atual após inserção (primeiros 200 chars):', currentContent.substring(0, 200));
                    
                    // Verificação simples de sucesso (sem correção de duplicação)
                    if (currentContent.includes('<<<Localização>>>')) {
                        console.log('[SN Tag Addon] Localização inserida com sucesso');
                    } else {
                        console.log('[SN Tag Addon] Falha na inserção de localização');
                    }
                    
                    if (currentContent.includes('<<<Localização>>>')) {
                        console.log('[SN Tag Addon] Verificação: texto foi inserido com sucesso');
                    } else {
                        console.error('[SN Tag Addon] Verificação: texto não foi inserido corretamente');
                        console.log('[SN Tag Addon] Tentando verificação alternativa...');
                        
                        // Verificação alternativa usando innerHTML
                        const htmlContent = editor.innerHTML || '';
                        if (htmlContent.includes('Localização') || htmlContent.includes('<<<') || 
                            htmlContent.includes(validTags[0])) {
                            console.log('[SN Tag Addon] Verificação alternativa: localização encontrada no HTML');
                        } else {
                            alert('Aviso: A inserção pode não ter funcionado corretamente. Verifique o conteúdo da nota.');
                        }
                    }
                }, 1500);
            } else {
                console.error('[SN Tag Addon] Falha em todos os métodos de inserção');
                alert('Erro ao adicionar localização. Todos os métodos falharam. Verifique o console para mais detalhes.');
            }
        }
    }

    // Função para remover bloco de localização existente da interface (preserva formatação)
    function removeExistingLocationFromEditor(editor) {
        try {
            // Buscar e remover elementos que contêm <<<Localização>>>
            const walker = document.createTreeWalker(
                editor,
                NodeFilter.SHOW_TEXT,
                {
                    acceptNode: function(node) {
                        return node.textContent.includes('<<<Localização>>>') 
                            ? NodeFilter.FILTER_ACCEPT 
                            : NodeFilter.FILTER_REJECT;
                    }
                }
            );
            
            const nodesToRemove = [];
            let node;
            
            while (node = walker.nextNode()) {
                // Verificar se o nó contém a sequência completa de localização
                const text = node.textContent;
                if (text.includes('<<<Localização>>>')) {
                    // Se é um nó que contém localização, marcar para remoção
                    let nodeToRemove = node;
                    
                    // Se o nó pai é um elemento de formatação (p, div, br, etc), remover o pai
                    while (nodeToRemove.parentNode && 
                           nodeToRemove.parentNode !== editor && 
                           nodeToRemove.parentNode.children.length <= 1) {
                        nodeToRemove = nodeToRemove.parentNode;
                    }
                    
                    nodesToRemove.push(nodeToRemove);
                }
            }
            
            // Remover os nós encontrados
            nodesToRemove.forEach(node => {
                if (node.parentNode) {
                    node.parentNode.removeChild(node);
                }
            });
            
            // Também remover elementos <br> órfãos que podem ter sobrado
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
            
            console.log('[SN Tag Addon] Blocos de localização removidos da interface');
            return true;
            
        } catch (e) {
            console.error('[SN Tag Addon] Erro ao remover localização existente:', e);
            return false;
        }
    }

    // Função para remover localizações duplicadas (versão melhorada)
    function removeDuplicateLocations(editor) {
        try {
            console.log('[SN Tag Addon] Removendo localizações duplicadas...');
            
            // Aguardar um pouco para garantir que o DOM está estável
            setTimeout(() => {
                let content = editor.textContent || '';
                console.log('[SN Tag Addon] Conteúdo antes da remoção de duplicatas:', content.substring(0, 150));
                
                // Regex para capturar blocos completos de localização
                const locationBlockRegex = /<<<Localização>>>\n[^<]*\n<<<Localização>>>\n*/g;
                const matches = [...content.matchAll(locationBlockRegex)];
                
                console.log('[SN Tag Addon] Encontrados', matches.length, 'blocos de localização');
                
                if (matches.length > 1) {
                    console.log('[SN Tag Addon] Detectada duplicação, mantendo apenas o primeiro bloco...');
                    
                    // Manter apenas o primeiro bloco
                    const firstBlock = matches[0][0];
                    
                    // Remover todos os blocos do conteúdo
                    let newContent = content.replace(locationBlockRegex, '');
                    
                    // Adicionar o primeiro bloco no início
                    newContent = firstBlock + newContent;
                    
                    console.log('[SN Tag Addon] Novo conteúdo após limpeza:', newContent.substring(0, 150));
                    
                    // Atualizar o editor usando seleção completa
                    editor.focus();
                    
                    // Selecionar todo o conteúdo
                    const range = document.createRange();
                    range.selectNodeContents(editor);
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                    
                    // Substituir com o novo conteúdo
                    document.execCommand('insertText', false, newContent);
                    
                    console.log('[SN Tag Addon] Duplicações removidas com sucesso');
                } else {
                    console.log('[SN Tag Addon] Nenhuma duplicação detectada');
                }
            }, 300);
            
        } catch (e) {
            console.error('[SN Tag Addon] Erro ao remover duplicações:', e);
        }
    }

    // Função para criar o botão na interface (versão melhorada)
    function createAddLocationButton() {
        // Verificar se já existe um botão
        const existingButton = document.querySelector('#sn-add-location-button');
        if (existingButton) {
            console.log('[SN Tag Addon] Botão já existe, não criando duplicado');
            addLocationButton = existingButton;
            return;
        }
        
        // Remover botão existente se houver
        if (addLocationButton) {
            addLocationButton.remove();
            addLocationButton = null;
        }

        // Lista de seletores para encontrar elemento de referência (priorizando o seletor específico)
        const referenceSelectors = [
            '.note-view-options-buttons > button:nth-child(1) > svg:nth-child(1)', // Seletor específico solicitado
            '.note-view-options-buttons > button:nth-child(1)', // Botão pai como fallback
            '.note-view-options-buttons > button',
            '.note-view-options-buttons',
            '.note-view-header button',
            '.note-view .options button',
            '[title="Pin"], [title="Options"], [title="Menu"]',
            '.note-view-top button',
            '.note-view-content-header button'
        ];
        
        let referenceElement = null;
        let usedSelector = null;
        
        // Tentar encontrar um elemento de referência
        for (const selector of referenceSelectors) {
            referenceElement = document.querySelector(selector);
            if (referenceElement) {
                globalReferenceElement = referenceElement;
                globalUsedSelector = selector;
                usedSelector = selector;
                console.log('[SN Tag Addon] Elemento de referência encontrado:', selector);
                break;
            }
        }

        if (!referenceElement) {
            console.log('[SN Tag Addon] Nenhum elemento de referência encontrado, usando posição fixa');
        }

        // Criar o botão
        addLocationButton = document.createElement('button');
        addLocationButton.textContent = 'Adicionar Localização';
        addLocationButton.id = 'sn-add-location-button';
        
        // Determinar posicionamento do botão baseado no elemento de referência
        let buttonCSS;
        if (referenceElement) {
            const rect = referenceElement.getBoundingClientRect();
            
            // Se usamos o seletor específico do SVG, posicionar à esquerda do botão pai
            let targetLeft;
            if (usedSelector === '.note-view-options-buttons > button:nth-child(1) > svg:nth-child(1)') {
                // Obter as dimensões do botão pai (container do SVG)
                const parentButton = referenceElement.closest('button');
                if (parentButton) {
                    const parentRect = parentButton.getBoundingClientRect();
                    targetLeft = parentRect.left - 180; // Posicionar à esquerda do botão pai
                    console.log('[SN Tag Addon] Posicionando à esquerda do botão pai do SVG');
                } else {
                    targetLeft = rect.left - 180; // Fallback
                }
            } else {
                targetLeft = rect.left - 180; // Posicionamento padrão à esquerda
            }
            
            // Garantir que o botão não saia da tela
            targetLeft = Math.max(10, targetLeft);
            
            buttonCSS = `
                position: fixed;
                top: ${rect.top}px;
                left: ${targetLeft}px;
                z-index: 10000;
                background: #086dd9;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                white-space: nowrap;
            `;
        } else {
            // Fallback: posição fixa no canto superior direito
            buttonCSS = `
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 10000;
                background: #086dd9;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 6px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                transition: all 0.2s ease;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                white-space: nowrap;
            `;
        }
        
        // Aplicar estilos
        addLocationButton.style.cssText = buttonCSS;

        // Efeitos hover
        addLocationButton.addEventListener('mouseenter', () => {
            addLocationButton.style.background = '#0056b3';
            addLocationButton.style.transform = 'translateY(-1px)';
            addLocationButton.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
        });

        addLocationButton.addEventListener('mouseleave', () => {
            addLocationButton.style.background = '#086dd9';
            addLocationButton.style.transform = 'translateY(0)';
            addLocationButton.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        });

        // Adicionar evento de clique com proteção contra duplicação
        let isProcessing = false;
        addLocationButton.addEventListener('click', (event) => {
            if (isProcessing) {
                console.log('[SN Tag Addon] Clique ignorado - processamento em andamento');
                return;
            }
            
            isProcessing = true;
            event.preventDefault();
            event.stopPropagation();
            
            // Desabilitar botão temporariamente
            addLocationButton.disabled = true;
            addLocationButton.style.opacity = '0.6';
            addLocationButton.textContent = 'Adicionando...';
            
            try {
                addLocationToNote();
            } finally {
                // Reabilitar botão após 2 segundos
                setTimeout(() => {
                    isProcessing = false;
                    addLocationButton.disabled = false;
                    addLocationButton.style.opacity = '1';
                    addLocationButton.textContent = 'Adicionar Localização';
                }, 2000);
            }
        });

        // Adicionar à página
        document.body.appendChild(addLocationButton);

        // Adicionar listeners para reposicionamento apenas se houver elemento de referência
        if (referenceElement) {
            // Usar debounced functions para evitar reposicionamento excessivo
            const debouncedReposition = debounce(repositionButton, 200);
            window.addEventListener('resize', debouncedReposition);
            window.addEventListener('scroll', debouncedReposition);
            
            // Observer mais restrito para detectar mudanças relevantes
            const resizeObserver = new MutationObserver(debounce(() => {
                // Só reposicionar se o botão ainda existir e o elemento de referência for válido
                if (addLocationButton && globalReferenceElement && document.contains(globalReferenceElement)) {
                    repositionButton();
                }
            }, 300));
            
            resizeObserver.observe(document.body, {
                childList: true,
                subtree: true,
                attributes: false  // Desabilitar observação de atributos para reduzir ruído
            });
        }

        console.log('[SN Tag Addon] Botão "Adicionar Localização" criado e posicionado');
    }

    // Variáveis para controle de navegação
    let currentUrl = window.location.href;
    let currentNoteId = null;
    let navigationCheckInterval = null;
    
    // Função para extrair ID da nota atual da URL ou DOM
    function getCurrentNoteId() {
        // Método 1: Tentar extrair da URL
        const urlMatch = window.location.href.match(/\/notes\/([^?/]+)/);
        if (urlMatch) {
            return urlMatch[1];
        }
        
        // Método 2: Tentar extrair de elementos DOM específicos do Standard Notes
        const selectors = [
            '[data-note-uuid]',
            '[data-note-id]',
            '.note-view[data-id]',
            '.selected-note[data-id]'
        ];
        
        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element.getAttribute('data-note-uuid') || 
                       element.getAttribute('data-note-id') || 
                       element.getAttribute('data-id');
            }
        }
        
        // Método 3: Hash da URL como fallback
        const hash = window.location.hash;
        if (hash && hash.length > 1) {
            return hash.substring(1);
        }
        
        return null;
    }

    // Função para verificar se estamos na página correta e se há um editor
    function checkForEditor() {
        const editor = getContentEditor();
        const isNotePage = window.location.href.includes('app.standardnotes.com');
        const noteId = getCurrentNoteId();
        
        // Detectar mudança de nota
        const noteChanged = currentNoteId !== noteId;
        const urlChanged = currentUrl !== window.location.href;
        
        if (noteChanged || urlChanged) {
            console.log('[SN Tag Addon] Navegação detectada:', {
                noteChanged,
                urlChanged,
                oldNoteId: currentNoteId,
                newNoteId: noteId,
                oldUrl: currentUrl,
                newUrl: window.location.href
            });
            
            currentNoteId = noteId;
            currentUrl = window.location.href;
            
            // Não remover o botão, apenas reposicioná-lo se necessário
            if (addLocationButton) {
                console.log('[SN Tag Addon] Mantendo botão e ajustando posição se necessário');
                repositionButton();
            }
        }
        
        // Verificar se já existe um botão antes de criar um novo
        const existingButton = document.querySelector('#sn-add-location-button');
        if (existingButton && existingButton !== addLocationButton) {
            existingButton.remove();
            console.log('[SN Tag Addon] Botão duplicado removido');
        }
        
        if (isNotePage && editor && !addLocationButton && !existingButton) {
            console.log('[SN Tag Addon] Criando botão para nova nota:', noteId);
            createAddLocationButton();
        } else if (!isNotePage || !editor) {
            // Esconder botão se não estivermos na página certa, mas não remover
            if (addLocationButton) {
                addLocationButton.style.display = 'none';
                console.log('[SN Tag Addon] Botão escondido (fora da página de notas)');
            }
        } else if (isNotePage && editor && addLocationButton) {
            // Mostrar botão se estivermos na página certa
            addLocationButton.style.display = 'block';
            console.log('[SN Tag Addon] Botão mostrado (na página de notas)');
        }
    }

    // Observer melhorado para detectar mudanças na página
    function initializeObserver() {
        // Observer principal para mudanças no DOM
        const mainObserver = new MutationObserver((mutations) => {
            let shouldCheck = false;
            
            mutations.forEach((mutation) => {
                // Verificar se houve mudanças significativas
                if (mutation.type === 'childList') {
                    // Verificar se elementos relevantes foram adicionados/removidos
                    const relevantChanges = Array.from(mutation.addedNodes)
                        .concat(Array.from(mutation.removedNodes))
                        .some(node => {
                            if (node.nodeType === Node.ELEMENT_NODE) {
                                return node.matches && (
                                    node.matches('.note-view') ||
                                    node.matches('.editor-content') ||
                                    node.matches('#super-editor-content') ||
                                    node.matches('.note-view-options-buttons') ||
                                    (node.className && typeof node.className === 'string' && node.className.includes('note')) ||
                                    (node.className && typeof node.className === 'string' && node.className.includes('editor'))
                                );
                            }
                            return false;
                        });
                    
                    if (relevantChanges) {
                        shouldCheck = true;
                    }
                }
                
                // Verificar mudanças de atributos que podem indicar navegação
                if (mutation.type === 'attributes' && 
                    ['data-note-uuid', 'data-note-id', 'data-id', 'class'].includes(mutation.attributeName)) {
                    shouldCheck = true;
                }
            });
            
            if (shouldCheck) {
                // Remover botões duplicados que possam ter sido criados
                const allButtons = document.querySelectorAll('#sn-add-location-button');
                if (allButtons.length > 1) {
                    console.log('[SN Tag Addon] Removendo', allButtons.length - 1, 'botões duplicados');
                    for (let i = 1; i < allButtons.length; i++) {
                        allButtons[i].remove();
                    }
                    addLocationButton = allButtons[0];
                }
                
                // Pequeno delay para aguardar a renderização completa
                setTimeout(checkForEditor, 100);
            }
        });

        mainObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['data-note-uuid', 'data-note-id', 'data-id', 'class']
        });

        // Observer específico para mudanças na URL usando pushState/replaceState
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = function(...args) {
            originalPushState.apply(this, args);
            setTimeout(checkForEditor, 200);
        };
        
        history.replaceState = function(...args) {
            originalReplaceState.apply(this, args);
            setTimeout(checkForEditor, 200);
        };
        
        // Listener para eventos de navegação do browser
        window.addEventListener('popstate', () => {
            setTimeout(checkForEditor, 200);
        });
        
        // Verificação periódica como fallback
        if (navigationCheckInterval) {
            clearInterval(navigationCheckInterval);
        }
        
        navigationCheckInterval = setInterval(() => {
            checkForEditor();
        }, 3000); // Verificar a cada 3 segundos

        console.log('[SN Tag Addon] Observer melhorado inicializado');
    }

    // Variável para controlar inicialização
    let isInitialized = false;

    // Função principal de inicialização
    function initialize() {
        // Evitar múltiplas inicializações
        if (isInitialized) {
            console.log('[SN Tag Addon] Extensão já inicializada, ignorando...');
            return;
        }
        
        console.log('[SN Tag Addon] Inicializando extensão com botão manual...');
        
        // Aguardar o carregamento completo da página
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initialize);
            return;
        }

        // Marcar como inicializado
        isInitialized = true;

        // Aguardar um pouco para o Standard Notes carregar
        setTimeout(() => {
            checkForEditor();
            initializeObserver();
        }, 2000);
    }

    // Limpeza ao descarregar a página
    window.addEventListener('beforeunload', function() {
        if (addLocationButton) {
            addLocationButton.remove();
        }
        if (navigationCheckInterval) {
            clearInterval(navigationCheckInterval);
        }
    });

    // Limpeza adicional para mudanças de página SPA
    window.addEventListener('unload', function() {
        if (addLocationButton) {
            addLocationButton.remove();
        }
        if (navigationCheckInterval) {
            clearInterval(navigationCheckInterval);
        }
    });

    // Inicializar
    initialize();
})();
