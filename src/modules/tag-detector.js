/**
 * Tag Detection Module for Standard Notes Tag Addon
 * Handles detection and extraction of tags from Standard Notes interface
 */
class TagDetector {
    constructor() {
        this.logger = window.SNLogger;
        this.interfaceElements = [
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
    }

    /**
     * Extract tags from the current Standard Notes interface
     * @returns {string[]} Array of detected tags
     */
    extractTags() {
        const tags = [];
        
        this.logger.log('Iniciando detecção de tags...');
        
        // Method 1: Primary selector for Standard Notes tags
        this._extractFromPrimarySelector(tags);
        
        // Method 2: Fallback - search in linking container
        this._extractFromLinkingContainer(tags);
        
        // Method 3: Search for hierarchical patterns
        this._extractHierarchicalTags(tags);
        
        // Clean and normalize tags
        const cleanedTags = this._cleanAndNormalizeTags(tags);
        
        // Remove duplicates and prioritize
        const finalTags = this._prioritizeTags(cleanedTags);
        
        this.logger.log('Tags finais selecionadas:', finalTags);
        return finalTags;
    }

    /**
     * Extract tags using primary Standard Notes selector
     * @private
     * @param {string[]} tags - Array to store found tags
     */
    _extractFromPrimarySelector(tags) {
        const tagSpans = document.querySelectorAll('span.gap-1');
        this.logger.log(`Encontradas ${tagSpans.length} spans com classe gap-1`);
        
        tagSpans.forEach((span, index) => {
            const text = span.textContent?.trim();
            const title = span.getAttribute('title')?.trim();
            
            this.logger.debug(`Span ${index}: texto="${text}", title="${title}"`);
            
            [text, title].forEach(tagText => {
                if (tagText && this._isValidTag(tagText)) {
                    this.logger.log(`Tag válida encontrada: "${tagText}"`);
                    tags.push(tagText);
                } else if (tagText) {
                    this.logger.debug(`Tag inválida rejeitada: "${tagText}"`);
                }
            });
        });
    }

    /**
     * Extract tags from linking container (fallback method)
     * @private
     * @param {string[]} tags - Array to store found tags
     */
    _extractFromLinkingContainer(tags) {
        const linkingContainer = document.querySelector('.note-view-linking-container');
        if (!linkingContainer) return;

        this.logger.log('Container de linking encontrado');
        
        const additionalSelectors = [
            'span.gap-1',
            'button.group.h-6.cursor-pointer',
            'button[title*="/"]',
            '*[title]:not([title*="Link"]):not([title*="Focus"]):not([title*="menu"])'
        ];
        
        additionalSelectors.forEach(selector => {
            const elements = linkingContainer.querySelectorAll(selector);
            this.logger.debug(`Seletor "${selector}" encontrou ${elements.length} elementos`);
            
            elements.forEach(element => {
                const possibleTexts = [
                    element.textContent?.trim(),
                    element.getAttribute('title')?.trim(),
                    element.getAttribute('data-tag')?.trim(),
                    element.getAttribute('aria-label')?.trim(),
                    element.innerText?.trim()
                ].filter(text => text && text.length > 0);
                
                possibleTexts.forEach(tagText => {
                    if (this._isValidTag(tagText)) {
                        this.logger.log(`Tag válida encontrada no linking: "${tagText}"`);
                        tags.push(tagText);
                    }
                });
            });
        });
    }

    /**
     * Extract hierarchical tags (containing forward slashes)
     * @private
     * @param {string[]} tags - Array to store found tags
     */
    _extractHierarchicalTags(tags) {
        const allSpans = document.querySelectorAll('span');
        allSpans.forEach(span => {
            const text = span.textContent?.trim();
            if (text && text.includes('/') && text.match(/^[A-Za-z][A-Za-z\/]*$/)) {
                this.logger.debug(`Possível tag hierárquica encontrada: "${text}"`);
                if (this._isValidTag(text)) {
                    tags.push(text);
                }
            }
        });
    }

    /**
     * Clean and normalize tags
     * @private
     * @param {string[]} tags - Raw tags array
     * @returns {string[]} Cleaned tags array
     */
    _cleanAndNormalizeTags(tags) {
        this.logger.debug('Tags brutas antes da limpeza:', tags);
        
        const cleanedTags = tags.map(tag => {
            return tag.replace(/[\n\r\t]/g, '').replace(/\s+/g, ' ').trim();
        }).filter(tag => {
            return tag && 
                   tag.length > 0 && 
                   tag.length <= 100 &&
                   tag !== 'undefined' && 
                   tag !== 'null' &&
                   !tag.endsWith('/');
        });

        this.logger.debug('Tags após limpeza básica:', cleanedTags);
        return [...new Set(cleanedTags)]; // Remove duplicates
    }

    /**
     * Prioritize tags by complexity and specificity
     * @private
     * @param {string[]} tags - Clean tags array
     * @returns {string[]} Prioritized tags array
     */
    _prioritizeTags(tags) {
        if (tags.length <= 1) return tags;

        // Sort by complexity: segments first, then length
        const sortedTags = tags.sort((a, b) => {
            const aSegments = a.split('/').length;
            const bSegments = b.split('/').length;
            
            if (aSegments !== bSegments) {
                return bSegments - aSegments; // More segments first
            }
            return b.length - a.length; // Longer first
        });
        
        // If first tag is clearly more specific, use only it
        const firstTag = sortedTags[0];
        const otherTags = sortedTags.slice(1);
        
        const isFirstMuchBetter = otherTags.every(tag => 
            firstTag.includes(tag) || firstTag.split('/').length > tag.split('/').length
        );
        
        return isFirstMuchBetter ? [firstTag] : sortedTags;
    }

    /**
     * Validate if text is a valid tag
     * @private
     * @param {string} tagText - Text to validate
     * @returns {boolean} True if valid tag
     */
    _isValidTag(tagText) {
        if (!tagText || tagText.length === 0 || tagText.length > 100) {
            return false;
        }
        
        // Check if it's an interface element
        const isInterfaceElement = this.interfaceElements.some(interfaceStr => 
            tagText.toLowerCase().includes(interfaceStr.toLowerCase())
        );
        
        if (isInterfaceElement) {
            return false;
        }
        
        // Allow alphanumeric characters, spaces, hyphens, underscores, and slashes
        const validCharacters = /^[a-zA-ZÀ-ÿ0-9\s_\-\/\.]+$/;
        if (!validCharacters.test(tagText)) {
            return false;
        }
        
        // Reject suspicious interface patterns
        const suspiciousPatterns = [
            /^\d+$/, // Only numbers
            /^[()[\]{}]+$/, // Only parentheses/brackets
            /^[<>]+$/, // Only symbols
            /\b(click|select|button|menu|link|focus|edit|delete|save|cancel)\b/i
        ];
        
        if (suspiciousPatterns.some(pattern => pattern.test(tagText))) {
            return false;
        }
        
        return true;
    }

    /**
     * Create location block from tags
     * @param {string[]} tags - Array of tags
     * @returns {string} Formatted location block
     */
    createLocationBlock(tags) {
        if (tags.length === 0) return '';
        
        this.logger.log('Criando bloco com tags:', tags);
        
        // Filter valid tags (additional filtering)
        const validTags = tags.filter(tag => 
            tag !== 'Create a new smart view' && 
            tag !== 'Show/hide password' &&
            !tag.toLowerCase().includes('link') &&
            !tag.toLowerCase().includes('focus') &&
            !tag.toLowerCase().includes('menu')
        );
        
        if (validTags.length === 0) return '';
        
        // Always use only the first tag (should be the best after cleaning)
        const tagPath = validTags[0];
        
        this.logger.log('Tag path final:', tagPath);
        
        return `<<<Localização>>>\n${tagPath}\n<<<Localização>>>\n\n`;
    }

    /**
     * Check if location block already exists in content
     * @param {string} content - Content to check
     * @returns {boolean} True if location block exists
     */
    hasLocationBlock(content) {
        return content.includes('<<<Localização>>>');
    }
}

// Export to global scope
window.TagDetector = TagDetector;
