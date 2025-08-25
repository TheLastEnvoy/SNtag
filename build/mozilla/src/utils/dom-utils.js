/**
 * DOM utility functions for Standard Notes Tag Addon
 */
class DOMUtils {
    /**
     * Debounce function to limit execution frequency
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in milliseconds
     * @returns {Function} Debounced function
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Sanitize text to prevent XSS attacks
     * @param {string} text - Text to sanitize
     * @returns {string} Sanitized text
     */
    static sanitizeText(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    /**
     * Safely set HTML content without using innerHTML directly
     * @param {HTMLElement} element - Target element
     * @param {string} htmlContent - HTML content to set
     */
    static safeSetHTML(element, htmlContent) {
        element.innerHTML = '';
        
        if (typeof htmlContent === 'string') {
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

    /**
     * Safely insert HTML content with location text
     * @param {HTMLElement} element - Target element
     * @param {string} locationText - Location text to insert
     * @param {string} existingHTML - Existing HTML content
     */
    static safeInsertHTML(element, locationText, existingHTML) {
        element.innerHTML = '';
        
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
        
        if (existingHTML) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(existingHTML, 'text/html');
            
            const bodyChildren = doc.body.childNodes;
            for (let i = 0; i < bodyChildren.length; i++) {
                const importedNode = document.importNode(bodyChildren[i], true);
                element.appendChild(importedNode);
            }
        }
    }

    /**
     * Find element using multiple selectors
     * @param {string[]} selectors - Array of CSS selectors
     * @param {HTMLElement} context - Context element (default: document)
     * @returns {HTMLElement|null} Found element or null
     */
    static findElement(selectors, context = document) {
        for (const selector of selectors) {
            const element = context.querySelector(selector);
            if (element) {
                return element;
            }
        }
        return null;
    }

    /**
     * Wait for element to appear in DOM
     * @param {string} selector - CSS selector
     * @param {number} timeout - Timeout in milliseconds
     * @returns {Promise<HTMLElement>} Promise that resolves with element
     */
    static waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const element = document.querySelector(selector);
            if (element) {
                resolve(element);
                return;
            }

            const observer = new MutationObserver((mutations) => {
                const element = document.querySelector(selector);
                if (element) {
                    observer.disconnect();
                    resolve(element);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                reject(new Error(`Element ${selector} not found within ${timeout}ms`));
            }, timeout);
        });
    }

    /**
     * Check if element is visible in viewport
     * @param {HTMLElement} element - Element to check
     * @returns {boolean} True if element is visible
     */
    static isElementVisible(element) {
        const rect = element.getBoundingClientRect();
        return rect.top >= 0 && rect.left >= 0 && 
               rect.bottom <= window.innerHeight && 
               rect.right <= window.innerWidth;
    }
}

// Export to global scope for content script usage
window.DOMUtils = DOMUtils;
