/**
 * CharacterCard.js
 * Reusable Character Card Component
 * 
 * A flexible, configurable character card component that can be used across
 * different tabs (Gallery, Collection, Team Builder) with various display modes
 * and interactive features.
 */

class CharacterCard {
    constructor(character, options = {}) {
        this.character = character;
        this.options = {
            // Component variant
            variant: 'gallery',               // 'gallery' | 'collection' | 'team-builder' | 'detailed'
            
            // Display options
            showFavorite: true,               // Show favorite heart icon
            showOwned: true,                  // Show owned indicator  
            showTierBadge: true,              // Show tier badge
            showRarity: true,                 // Show star rating
            clickable: true,                  // Make card clickable
            draggable: false,                 // Enable drag & drop
            
            // Size options
            size: 'medium',                   // 'small' | 'medium' | 'large'
            
            // Future expansion options
            showSkills: false,                // Show character skills
            showStats: false,                 // Show basic stats
            showSynergy: false,               // Show synergy indicators
            expandable: false,                // Collapsible card
            
            // Event handlers
            onCardClick: null,                // Click handler function
            onFavoriteClick: null,            // Favorite toggle handler
            onOwnedChange: null,              // Owned status change handler
            onDragStart: null,                // Drag start handler
            onDragEnd: null,                  // Drag end handler
            
            // Override with provided options
            ...options
        };
        
        // Component state
        this.element = null;
        this.isInitialized = false;
        this.isMounted = false;
        
        // Event listeners storage for cleanup
        this.eventListeners = [];
        
        // Unique ID for this component instance
        this.id = `character-card-${character.id}-${Date.now()}`;
    }

    /**
     * Render the character card and return DOM element
     * @returns {HTMLElement} The rendered card element
     */
    render() {
        if (this.element) {
            // Already rendered, return existing element
            return this.element;
        }

        // Create the card structure
        this.element = this._createCardStructure();
        
        // Apply styling classes
        this._applyClasses();
        
        // Attach event listeners
        this._attachEventListeners();
        
        // Update visual state
        this._updateVisualState();
        
        this.isInitialized = true;
        
        return this.element;
    }

    /**
     * Mount the card to a container element
     * @param {HTMLElement} container - Container to mount the card
     */
    mount(container) {
        if (!this.element) {
            this.render();
        }
        
        container.appendChild(this.element);
        this.isMounted = true;
        
        // Trigger mounted event
        this._emit('mounted', { card: this });
    }

    /**
     * Unmount the card from its container
     */
    unmount() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
            this.isMounted = false;
            
            // Trigger unmounted event
            this._emit('unmounted', { card: this });
        }
    }

    /**
     * Destroy the component and clean up resources
     */
    destroy() {
        // Remove event listeners
        this._cleanupEventListeners();
        
        // Unmount if mounted
        this.unmount();
        
        // Clear references
        this.element = null;
        this.character = null;
        this.options = null;
        
        // Trigger destroyed event
        this._emit('destroyed', { card: this });
    }

    /**
     * Update the character data and re-render
     * @param {Object} character - New character data
     */
    updateCharacter(character) {
        this.character = character;
        
        if (this.element) {
            // Update character-specific elements
            this._updateCharacterData();
            this._updateVisualState();
        }
        
        this._emit('characterUpdated', { character, card: this });
    }

    /**
     * Update component options
     * @param {Object} newOptions - Options to update
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        
        if (this.element) {
            this._applyClasses();
            this._updateVisualState();
        }
        
        this._emit('optionsUpdated', { options: this.options, card: this });
    }

    /**
     * Set the owned status of the character
     * @param {boolean} isOwned - Whether the character is owned
     */
    setOwned(isOwned) {
        if (!this.character.user_data) {
            this.character.user_data = {};
        }
        
        this.character.user_data.owned = isOwned;
        this._updateOwnedIndicator();
        
        this._emit('ownedChanged', { isOwned, character: this.character, card: this });
    }

    /**
     * Set the favorite status of the character
     * @param {boolean} isFavorite - Whether the character is favorited
     */
    setFavorite(isFavorite) {
        if (!this.character.user_data) {
            this.character.user_data = {};
        }
        
        this.character.user_data.favorite = isFavorite;
        this._updateFavoriteIndicator();
        
        this._emit('favoriteChanged', { isFavorite, character: this.character, card: this });
    }

    // ===================
    // Private Methods
    // ===================

    /**
     * Create the basic card DOM structure
     * @private
     */
    _createCardStructure() {
        const cardElement = document.createElement('div');
        cardElement.className = 'character-card-component';
        cardElement.id = this.id;
        
        // Set draggable attribute if needed
        if (this.options.draggable) {
            cardElement.draggable = true;
        }
        
        // Build card content based on variant
        cardElement.innerHTML = this._getCardHTML();
        
        return cardElement;
    }

    /**
     * Generate HTML content based on variant
     * @private
     */
    _getCardHTML() {
        const character = this.character;
        const assets = character.assets || {};
        const basicInfo = character.basic_info || {};
        const userData = character.user_data || {};
        
        // Get character image with fallback
        const imageUrl = assets.portrait || `Imagenes - Octopath/portraits/${character.id}.png`;
        
        // Get tier for styling
        const tier = basicInfo.tier?.gl || 'D';
        
        // Build HTML based on variant
        switch (this.options.variant) {
            case 'gallery':
                return this._getGalleryHTML(character, imageUrl, tier, userData);
            case 'collection':
                return this._getCollectionHTML(character, imageUrl, tier, userData);
            case 'team-builder':
                return this._getTeamBuilderHTML(character, imageUrl, tier, userData);
            case 'detailed':
                return this._getDetailedHTML(character, imageUrl, tier, userData);
            default:
                return this._getGalleryHTML(character, imageUrl, tier, userData);
        }
    }

    /**
     * Generate Gallery variant HTML
     * @private
     */
    _getGalleryHTML(character, imageUrl, tier, userData) {
        const basicInfo = character.basic_info || {};
        
        return `
            <div class="character-image-container">
                <div class="character-image-wrapper">
                    <img src="${imageUrl}" 
                         alt="${basicInfo.name || character.id}" 
                         class="character-image"
                         loading="lazy"
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5YTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg=='; this.onerror=null;">
                </div>
                
                ${this.options.showTierBadge ? `
                    <div class="character-tier-badge tier-${tier.toLowerCase()}">
                        ${tier}
                    </div>
                ` : ''}
                
                ${this.options.showFavorite ? `
                    <button class="character-favorite-btn ${userData.favorite ? 'active' : ''}" 
                            data-action="favorite" 
                            title="Toggle Favorite">
                        <svg class="heart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="m19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
                        </svg>
                    </button>
                ` : ''}
                
                ${this.options.showOwned ? `
                    <button class="character-owned-btn ${userData.owned ? 'active' : ''}" 
                            data-action="owned" 
                            title="Toggle Owned">
                        <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 12l2 2 4-4"/>
                            <circle cx="12" cy="12" r="10"/>
                        </svg>
                    </button>
                ` : ''}
            </div>
            
            <div class="character-info">
                <h3 class="character-name">${basicInfo.name || character.id}</h3>
                
                <div class="character-meta">
                    <span class="character-job">${basicInfo.job || 'Unknown'}</span>
                    
                    ${this.options.showRarity && basicInfo.rarity ? `
                        <div class="character-rarity">
                            ${this._generateStars(basicInfo.rarity)}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Generate Collection variant HTML
     * @private
     */
    _getCollectionHTML(character, imageUrl, tier, userData) {
        // For now, use gallery HTML with additional elements
        // This will be expanded in future versions
        return this._getGalleryHTML(character, imageUrl, tier, userData);
    }

    /**
     * Generate Team Builder variant HTML  
     * @private
     */
    _getTeamBuilderHTML(character, imageUrl, tier, userData) {
        const basicInfo = character.basic_info || {};
        
        return `
            <div class="character-image-container compact">
                <div class="character-image-wrapper">
                    <img src="${imageUrl}" 
                         alt="${basicInfo.name || character.id}" 
                         class="character-image"
                         loading="lazy">
                </div>
                
                <div class="character-tier-badge tier-${tier.toLowerCase()}">
                    ${tier}
                </div>
            </div>
            
            <div class="character-info compact">
                <h4 class="character-name">${basicInfo.name || character.id}</h4>
                <span class="character-job">${basicInfo.job || 'Unknown'}</span>
            </div>
        `;
    }

    /**
     * Generate Detailed variant HTML
     * @private  
     */
    _getDetailedHTML(character, imageUrl, tier, userData) {
        // For now, use gallery HTML - will be expanded for markdown integration
        return this._getGalleryHTML(character, imageUrl, tier, userData);
    }

    /**
     * Generate star rating HTML
     * @private
     */
    _generateStars(rarity) {
        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            if (i <= rarity) {
                starsHTML += `
                    <svg class="star star-filled" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                `;
            } else {
                starsHTML += `
                    <svg class="star star-empty" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                    </svg>
                `;
            }
        }
        return starsHTML;
    }

    /**
     * Apply CSS classes based on options
     * @private
     */
    _applyClasses() {
        if (!this.element) return;
        
        const classes = ['character-card-component'];
        
        // Add variant class
        classes.push(`variant-${this.options.variant}`);
        
        // Add size class
        classes.push(`size-${this.options.size}`);
        
        // Add interaction classes
        if (this.options.clickable) classes.push('clickable');
        if (this.options.draggable) classes.push('draggable');
        
        // Add state classes
        const userData = this.character.user_data || {};
        if (userData.owned) classes.push('owned');
        if (userData.favorite) classes.push('favorited');
        
        // Note: Tier classes removed to maintain clean uniform card design
        // Tier colors are now only applied to the tier badges
        
        this.element.className = classes.join(' ');
    }

    /**
     * Attach event listeners
     * @private
     */
    _attachEventListeners() {
        if (!this.element) return;
        
        // Card click handler
        if (this.options.clickable && this.options.onCardClick) {
            const cardClickHandler = (e) => {
                // Don't trigger on button clicks
                if (e.target.closest('button')) return;
                
                this.options.onCardClick(this.character, this);
            };
            
            this.element.addEventListener('click', cardClickHandler);
            this.eventListeners.push(['click', cardClickHandler]);
        }

        // Favorite button handler
        if (this.options.showFavorite) {
            const favoriteBtn = this.element.querySelector('[data-action="favorite"]');
            if (favoriteBtn) {
                const favoriteHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const isFavorite = !this.character.user_data?.favorite;
                    this.setFavorite(isFavorite);
                    
                    if (this.options.onFavoriteClick) {
                        this.options.onFavoriteClick(this.character, isFavorite, this);
                    }
                };
                
                favoriteBtn.addEventListener('click', favoriteHandler);
                this.eventListeners.push(['click', favoriteHandler, favoriteBtn]);
            }
        }

        // Owned button handler
        if (this.options.showOwned) {
            const ownedBtn = this.element.querySelector('[data-action="owned"]');
            if (ownedBtn) {
                const ownedHandler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    const isOwned = !this.character.user_data?.owned;
                    this.setOwned(isOwned);
                    
                    if (this.options.onOwnedChange) {
                        this.options.onOwnedChange(this.character, isOwned, this);
                    }
                };
                
                ownedBtn.addEventListener('click', ownedHandler);
                this.eventListeners.push(['click', ownedHandler, ownedBtn]);
            }
        }

        // Drag handlers
        if (this.options.draggable) {
            const dragStartHandler = (e) => {
                e.dataTransfer.setData('text/plain', JSON.stringify({
                    characterId: this.character.id,
                    sourceComponent: this.id
                }));
                
                this.element.classList.add('dragging');
                
                if (this.options.onDragStart) {
                    this.options.onDragStart(this.character, e, this);
                }
            };
            
            const dragEndHandler = (e) => {
                this.element.classList.remove('dragging');
                
                if (this.options.onDragEnd) {
                    this.options.onDragEnd(this.character, e, this);
                }
            };
            
            this.element.addEventListener('dragstart', dragStartHandler);
            this.element.addEventListener('dragend', dragEndHandler);
            
            this.eventListeners.push(['dragstart', dragStartHandler]);
            this.eventListeners.push(['dragend', dragEndHandler]);
        }
    }

    /**
     * Update visual state of the component
     * @private
     */
    _updateVisualState() {
        if (!this.element) return;
        
        this._applyClasses();
        this._updateFavoriteIndicator();
        this._updateOwnedIndicator();
    }

    /**
     * Update character data in existing elements
     * @private
     */
    _updateCharacterData() {
        if (!this.element) return;
        
        const basicInfo = this.character.basic_info || {};
        
        // Update name
        const nameElement = this.element.querySelector('.character-name');
        if (nameElement) {
            nameElement.textContent = basicInfo.name || this.character.id;
        }
        
        // Update job
        const jobElement = this.element.querySelector('.character-job');
        if (jobElement) {
            jobElement.textContent = basicInfo.job || 'Unknown';
        }
        
        // Update image
        const imageElement = this.element.querySelector('.character-image');
        if (imageElement) {
            const assets = this.character.assets || {};
            const imageUrl = assets.portrait || `Imagenes - Octopath/portraits/${this.character.id}.png`;
            imageElement.src = imageUrl;
            imageElement.alt = basicInfo.name || this.character.id;
        }
        
        // Update tier badge
        const tierBadge = this.element.querySelector('.character-tier-badge');
        if (tierBadge) {
            const tier = basicInfo.tier?.gl || 'D';
            tierBadge.textContent = tier;
            tierBadge.className = `character-tier-badge tier-${tier.toLowerCase()}`;
        }
        
        // Update rarity stars
        if (this.options.showRarity && basicInfo.rarity) {
            const rarityElement = this.element.querySelector('.character-rarity');
            if (rarityElement) {
                rarityElement.innerHTML = this._generateStars(basicInfo.rarity);
            }
        }
    }

    /**
     * Update favorite indicator
     * @private
     */
    _updateFavoriteIndicator() {
        if (!this.element || !this.options.showFavorite) return;
        
        const favoriteBtn = this.element.querySelector('[data-action="favorite"]');
        if (favoriteBtn) {
            const isFavorite = this.character.user_data?.favorite || false;
            favoriteBtn.classList.toggle('active', isFavorite);
        }
    }

    /**
     * Update owned indicator
     * @private
     */
    _updateOwnedIndicator() {
        if (!this.element || !this.options.showOwned) return;
        
        const ownedBtn = this.element.querySelector('[data-action="owned"]');
        if (ownedBtn) {
            const isOwned = this.character.user_data?.owned || false;
            ownedBtn.classList.toggle('active', isOwned);
        }
    }

    /**
     * Clean up event listeners
     * @private
     */
    _cleanupEventListeners() {
        this.eventListeners.forEach(([event, handler, element]) => {
            const target = element || this.element;
            if (target) {
                target.removeEventListener(event, handler);
            }
        });
        
        this.eventListeners = [];
    }

    /**
     * Emit custom events
     * @private
     */
    _emit(eventName, data) {
        if (this.element) {
            const event = new CustomEvent(`characterCard:${eventName}`, {
                detail: data,
                bubbles: true,
                cancelable: true
            });
            
            this.element.dispatchEvent(event);
        }
    }

    // ===================
    // Static Methods
    // ===================

    /**
     * Create multiple character cards
     * @param {Array} characters - Array of character objects
     * @param {Object} options - Options for all cards
     * @returns {Array} Array of CharacterCard instances
     */
    static createMany(characters, options = {}) {
        return characters.map(character => new CharacterCard(character, options));
    }

    /**
     * Get component version
     * @returns {string} Version number
     */
    static getVersion() {
        return '1.0.0';
    }
}

// Export the component
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterCard;
} else if (typeof window !== 'undefined') {
    window.CharacterCard = CharacterCard;
}