/**
 * CollectionTab.js
 * Collection Management Tab Implementation
 * 
 * Handles user's character collection with stats tracking, filtering by owned/favorites,
 * and collection progress visualization using CharacterCard components.
 */

class CollectionTab {
    constructor(database) {
        this.database = database;
        this.currentFilter = 'owned'; // 'owned', 'favorites', 'missing'
        this.isInitialized = false;
        this.allCharacters = [];
        
        // DOM element references
        this.elements = {};
        
        // Collection data cache
        this.collectionData = {
            owned: new Set(),
            favorites: new Set(),
            all: []
        };
    }

    /**
     * Initialize the collection tab with event listeners and UI setup
     */
    async init() {
        if (this.isInitialized) return;

        await this.database.waitForReady();
        if (!this.database.initialized) {
            await this.database.init();
        }
        this.allCharacters = this.database.getAllCharacters();
        this._cacheElements();
        this._setupEventListeners();
        this._loadCollectionData();
        this._updateCollectionStats();
        this._loadCollectionView();
        
        this.isInitialized = true;
        console.log('✅ Collection tab initialized');
    }

    /**
     * Cache frequently used DOM elements for performance
     */
    _cacheElements() {
        this.elements = {
            // Stats elements
            ownedCount: document.getElementById('ownedCount'),
            completionRate: document.getElementById('completionRate'),
            favoriteCount: document.getElementById('favoriteCount'),
            tierSCount: document.getElementById('tierSCount'),
            
            // Filter elements
            ownedFilter: document.getElementById('ownedFilter'),
            favoritesFilter: document.getElementById('favoritesFilter'),
            missingFilter: document.getElementById('missingFilter'),
            
            // Grid and results
            collectionGrid: document.getElementById('collectionGrid'),
            noCollectionResults: document.getElementById('noCollectionResults'),
            
            // Tab elements
            collectionBadge: document.getElementById('collectionBadge')
        };
    }

    /**
     * Setup event listeners for collection filters and interactions
     */
    _setupEventListeners() {
        // Filter tab buttons
        this.elements.ownedFilter.addEventListener('click', () => {
            this._setActiveFilter('owned');
        });
        
        this.elements.favoritesFilter.addEventListener('click', () => {
            this._setActiveFilter('favorites');
        });
        
        this.elements.missingFilter.addEventListener('click', () => {
            this._setActiveFilter('missing');
        });
    }

    /**
     * Load collection data from localStorage and database
     */
    _loadCollectionData() {
        try {
            const userData = UserDataStore.load();

            this.collectionData.owned = userData.owned;
            this.collectionData.favorites = userData.favorites;

            // Get all characters from database
            this.collectionData.all = this.allCharacters;
            
            console.log(`📊 Collection loaded: ${this.collectionData.owned.size} owned, ${this.collectionData.favorites.size} favorites`);
        } catch (error) {
            console.error('Error loading collection data:', error);
            this.collectionData.owned = new Set();
            this.collectionData.favorites = new Set();
            this.collectionData.all = [];
        }
    }

    /**
     * Update collection statistics in the header
     */
    _updateCollectionStats() {
        const totalCharacters = this.collectionData.all.length;
        const ownedCount = this.collectionData.owned.size;
        const favoriteCount = this.collectionData.favorites.size;
        
        // Calculate completion rate
        const completionRate = totalCharacters > 0 ? Math.round((ownedCount / totalCharacters) * 100) : 0;
        
        // Count S-tier owned characters
        const sTierCount = this.collectionData.all.filter(char => {
            const tier = char.basic_info?.tier?.gl;
            const isOwned = this.collectionData.owned.has(char.id);
            return isOwned && (tier === 'S+' || tier === 'S');
        }).length;
        
        // Update DOM elements
        if (this.elements.ownedCount) {
            this.elements.ownedCount.textContent = ownedCount;
        }
        
        if (this.elements.completionRate) {
            this.elements.completionRate.textContent = `${completionRate}%`;
        }
        
        if (this.elements.favoriteCount) {
            this.elements.favoriteCount.textContent = favoriteCount;
        }
        
        if (this.elements.tierSCount) {
            this.elements.tierSCount.textContent = sTierCount;
        }
        
        // Update tab badge
        if (this.elements.collectionBadge) {
            this.elements.collectionBadge.textContent = ownedCount;
        }
    }

    /**
     * Set active filter and update view
     */
    _setActiveFilter(filter) {
        this.currentFilter = filter;
        
        // Update filter button states
        document.querySelectorAll('.filter-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        this.elements[`${filter}Filter`].classList.add('active');
        
        // Update view
        this._loadCollectionView();
    }

    /**
     * Load and display characters based on current filter
     */
    _loadCollectionView() {
        let filteredCharacters = [];
        
        switch (this.currentFilter) {
            case 'owned':
                filteredCharacters = this.collectionData.all.filter(char => 
                    this.collectionData.owned.has(char.id)
                );
                break;
                
            case 'favorites':
                filteredCharacters = this.collectionData.all.filter(char => 
                    this.collectionData.favorites.has(char.id)
                );
                break;
                
            case 'missing':
                filteredCharacters = this.collectionData.all.filter(char => 
                    !this.collectionData.owned.has(char.id)
                );
                break;
        }
        
        this._renderCharacters(filteredCharacters);
        this._updateNoResultsMessage(filteredCharacters);
    }

    /**
     * Render characters in the collection grid using CharacterCard components
     */
    _renderCharacters(characters) {
        const grid = this.elements.collectionGrid;
        grid.innerHTML = '';
        
        if (characters.length === 0) {
            return;
        }
        
        // Sort characters by tier first, then by name
        const sortedCharacters = [...characters].sort((a, b) => {
            const tierOrder = ['S+', 'S', 'A', 'B', 'C', 'D'];
            const tierA = a.basic_info?.tier?.gl || 'D';
            const tierB = b.basic_info?.tier?.gl || 'D';
            const tierComparison = tierOrder.indexOf(tierA) - tierOrder.indexOf(tierB);
            
            if (tierComparison !== 0) return tierComparison;
            
            const nameA = a.basic_info?.name || a.id;
            const nameB = b.basic_info?.name || b.id;
            return nameA.localeCompare(nameB);
        });
        
        // Create CharacterCard for each character
        sortedCharacters.forEach(character => {
            const card = this._createCollectionCard(character);
            grid.appendChild(card);
        });
    }

    /**
     * Create a character card for collection view using CharacterCard component
     */
    _createCollectionCard(character) {
        // Ensure character has user_data
        if (!character.user_data) {
            character.user_data = {};
        }
        
        // Apply current collection data
        character.user_data.owned = this.collectionData.owned.has(character.id);
        character.user_data.favorite = this.collectionData.favorites.has(character.id);
        
        // Create CharacterCard component with collection-specific options
        const characterCard = new CharacterCard(character, {
            variant: 'collection',
            showFavorite: true,
            showOwned: true,
            showTierBadge: true,
            showRarity: true,
            clickable: true,
            size: 'medium',
            
            // Event handlers
            onCardClick: (char) => {
                this._showCharacterModal(char);
            },
            
            onFavoriteClick: (char, isFavorite) => {
                this._updateFavoriteStatus(char, isFavorite);
            },
            
            onOwnedChange: (char, isOwned) => {
                this._updateOwnedStatus(char, isOwned);
            }
        });
        
        return characterCard.render();
    }

    /**
     * Update no results message based on current filter
     */
    _updateNoResultsMessage(characters) {
        if (characters.length === 0) {
            this.elements.collectionGrid.style.display = 'none';
            this.elements.noCollectionResults.style.display = 'block';
            
            // Update message based on filter
            const title = this.elements.noCollectionResults.querySelector('.no-results-title');
            const subtitle = this.elements.noCollectionResults.querySelector('.no-results-subtitle');
            
            switch (this.currentFilter) {
                case 'owned':
                    title.textContent = 'No owned characters yet';
                    subtitle.textContent = 'Go to Gallery and mark characters as owned to build your collection!';
                    break;
                case 'favorites':
                    title.textContent = 'No favorite characters yet';
                    subtitle.textContent = 'Mark characters as favorites to see them here!';
                    break;
                case 'missing':
                    title.textContent = 'Collection complete!';
                    subtitle.textContent = 'You own all characters in the database. Amazing!';
                    break;
            }
        } else {
            this.elements.collectionGrid.style.display = 'grid';
            this.elements.noCollectionResults.style.display = 'none';
        }
    }

    /**
     * Show character modal (reuse from gallery)
     */
    _showCharacterModal(character) {
        // For now, we'll use the same modal as gallery
        // In future versions, this could be enhanced with collection-specific info
        const modal = document.getElementById('characterModal');
        
        if (modal && window.galleryTab && window.galleryTab._openCharacterModal) {
            window.galleryTab._openCharacterModal(character);
        } else {
            console.log('Character modal:', character.basic_info.name);
        }
    }

    /**
     * Update favorite status and refresh collection
     */
    _updateFavoriteStatus(character, isFavorite) {
        try {
            const updatedData = UserDataStore.updateFavorite(character.id, isFavorite);
            this.collectionData.favorites = updatedData.favorites;
            this.collectionData.owned = updatedData.owned;

            // Update stats and view
            this._updateCollectionStats();
            this._loadCollectionView();
            
            console.log(`Character ${character.basic_info.name} ${isFavorite ? 'added to' : 'removed from'} favorites`);
        } catch (error) {
            console.error('Error updating favorite status:', error);
        }
    }

    /**
     * Update owned status and refresh collection
     */
    _updateOwnedStatus(character, isOwned) {
        try {
            const updatedData = UserDataStore.updateOwned(character.id, isOwned);
            this.collectionData.owned = updatedData.owned;
            this.collectionData.favorites = updatedData.favorites;

            // Update stats and view
            this._updateCollectionStats();
            this._loadCollectionView();
            
            console.log(`Character ${character.basic_info.name} ${isOwned ? 'marked as owned' : 'removed from owned'}`);
        } catch (error) {
            console.error('Error updating owned status:', error);
        }
    }

    /**
     * Refresh collection data and view (called when tab becomes active)
     */
    refresh() {
        this._loadCollectionData();
        this._updateCollectionStats();
        this._loadCollectionView();
    }

    /**
     * Get collection statistics for external use
     */
    getStats() {
        return {
            total: this.collectionData.all.length,
            owned: this.collectionData.owned.size,
            favorites: this.collectionData.favorites.size,
            completionRate: this.collectionData.all.length > 0 ? 
                Math.round((this.collectionData.owned.size / this.collectionData.all.length) * 100) : 0
        };
    }

    /**
     * Called when tab becomes active
     */
    onActivate() {
        this.refresh();
    }

    /**
     * Called when tab becomes inactive
     */
    onDeactivate() {
        // Clean up if needed
    }
}

// Export for global use
window.CollectionTab = CollectionTab;