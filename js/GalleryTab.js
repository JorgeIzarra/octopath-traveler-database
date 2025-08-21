/**
 * GalleryTab.js
 * Character Gallery Tab Implementation
 * Handles character browsing, filtering, search, and modal display
 */

class GalleryTab {
    constructor(database) {
        this.database = database;
        this.currentFilters = {};
        this.currentSort = 'tier';
        this.currentPage = 1;
        this.itemsPerPage = 30;
        this.searchTimeout = null;
        this.isInitialized = false;
        
        // DOM element references
        this.elements = {};
    }

    /**
     * Initialize the gallery tab with event listeners and UI setup
     */
    async init() {
        if (this.isInitialized) return;
        
        await this.database.init();
        this._cacheElements();
        this._setupEventListeners();
        this._populateFilterOptions();
        this._loadCharacters();
        
        this.isInitialized = true;
        console.log('✅ Gallery tab initialized');
    }

    /**
     * Cache frequently used DOM elements for performance
     */
    _cacheElements() {
        this.elements = {
            // Search and filters
            searchInput: document.getElementById('character-search'),
            searchClear: document.getElementById('search-clear'),
            tierFilter: document.getElementById('tier-filter'),
            jobFilter: document.getElementById('job-filter'),
            rarityFilter: document.getElementById('rarity-filter'),
            sortFilter: document.getElementById('sort-filter'),
            resetFilters: document.getElementById('reset-filters'),
            
            // Filter display
            resultsCounter: document.getElementById('results-counter'),
            activeFilters: document.getElementById('active-filters'),
            activeFiltersList: document.getElementById('active-filters-list'),
            
            // Character display
            characterGrid: document.getElementById('character-grid'),
            pagination: document.getElementById('pagination'),
            
            // Modal
            modal: document.getElementById('character-modal'),
            modalContent: document.getElementById('character-detail'),
            modalClose: document.getElementById('modal-close')
        };
    }

    /**
     * Setup all event listeners for gallery interactions
     */
    _setupEventListeners() {
        // Search functionality with debouncing
        this.elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this._handleSearch(e.target.value);
            }, 300);
        });

        // Search clear button
        this.elements.searchClear.addEventListener('click', () => {
            this.elements.searchInput.value = '';
            this._handleSearch('');
        });

        // Filter controls
        this.elements.tierFilter.addEventListener('change', (e) => {
            this._handleFilterChange('tier', e.target.value);
        });

        this.elements.jobFilter.addEventListener('change', (e) => {
            this._handleFilterChange('job', e.target.value);
        });

        this.elements.rarityFilter.addEventListener('change', (e) => {
            this._handleFilterChange('rarity', e.target.value);
        });

        this.elements.sortFilter.addEventListener('change', (e) => {
            this._handleSortChange(e.target.value);
        });

        // Reset filters
        this.elements.resetFilters.addEventListener('click', () => {
            this._resetAllFilters();
        });

        // Modal controls
        this.elements.modalClose.addEventListener('click', () => {
            this._closeModal();
        });

        this.elements.modal.addEventListener('click', (e) => {
            if (e.target === this.elements.modal) {
                this._closeModal();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this._closeModal();
            }
        });
    }

    /**
     * Populate filter dropdown options from database configuration
     */
    _populateFilterOptions() {
        const filterOptions = this.database.getFilterOptions();
        
        // Populate job filter
        filterOptions.jobs.forEach(job => {
            const option = document.createElement('option');
            option.value = job;
            option.textContent = job;
            this.elements.jobFilter.appendChild(option);
        });
        
        console.log('✅ Filter options populated');
    }

    /**
     * Load and display characters based on current filters
     */
    _loadCharacters() {
        try {
            this._showLoading();
            
            // Get all characters and apply filters
            let filteredCharacters = this.database.getAllCharacters();
            
            // Apply filters
            filteredCharacters = this._applyFilters(filteredCharacters);
            
            // Apply sorting
            filteredCharacters = this._applySorting(filteredCharacters);
            
            this._renderCharacters(filteredCharacters);
            this._updateResultsCount(filteredCharacters.length);
            this._hideLoading();
            
        } catch (error) {
            console.error('Error loading characters:', error);
            this._showError('Failed to load characters');
        }
    }

    /**
     * Render character cards in the grid
     */
    _renderCharacters(characters) {
        const grid = this.elements.characterGrid;
        grid.innerHTML = '';
        
        if (characters.length === 0) {
            this._showNoResults();
            return;
        }
        
        // Calculate pagination
        const totalPages = Math.ceil(characters.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageCharacters = characters.slice(startIndex, endIndex);
        
        // Create character cards
        pageCharacters.forEach(character => {
            const card = this._createCharacterCard(character);
            grid.appendChild(card);
        });
        
        // Update pagination
        this._renderPagination(totalPages);
        
        // Add intersection observer for lazy loading images
        this._setupLazyLoading();
    }

    /**
     * Apply current filters to character list
     */
    _applyFilters(characters) {
        return characters.filter(character => {
            // Search filter
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                const name = character.basic_info.name.toLowerCase();
                if (!name.includes(searchTerm)) return false;
            }

            // Tier filter
            if (this.currentFilters.tier) {
                const tier = character.basic_info.tier?.gl || 'D';
                if (tier !== this.currentFilters.tier) return false;
            }

            // Job filter
            if (this.currentFilters.job) {
                if (character.basic_info.job !== this.currentFilters.job) return false;
            }

            // Rarity filter
            if (this.currentFilters.rarity) {
                if (character.basic_info.rarity !== parseInt(this.currentFilters.rarity)) return false;
            }


            return true;
        });
    }

    /**
     * Apply current sorting to character list
     */
    _applySorting(characters) {
        return characters.sort((a, b) => {
            switch (this.currentSort) {
                case 'name':
                    return a.basic_info.name.localeCompare(b.basic_info.name);
                
                case 'rarity':
                    return (b.basic_info.rarity || 0) - (a.basic_info.rarity || 0);
                
                case 'job':
                    return a.basic_info.job.localeCompare(b.basic_info.job);
                
                case 'tier':
                default:
                    const tierOrder = { 'S+': 6, 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
                    const aTier = tierOrder[a.basic_info.tier?.gl] || 0;
                    const bTier = tierOrder[b.basic_info.tier?.gl] || 0;
                    return bTier - aTier;
            }
        });
    }

    /**
     * Handle search input changes
     */
    _handleSearch(query) {
        if (query) {
            this.currentFilters.search = query;
        } else {
            delete this.currentFilters.search;
        }
        
        this.currentPage = 1;
        this._loadCharacters();
        this._updateActiveFiltersDisplay();
        
        // Show/hide clear button
        this.elements.searchClear.style.display = query ? 'block' : 'none';
    }

    /**
     * Handle filter changes
     */
    _handleFilterChange(filterType, value) {
        if (value) {
            this.currentFilters[filterType] = value;
        } else {
            delete this.currentFilters[filterType];
        }
        
        this.currentPage = 1;
        this._loadCharacters();
        this._updateActiveFiltersDisplay();
        
        // Add visual feedback
        const selectElement = document.getElementById(`${filterType}-filter`);
        if (selectElement) {
            selectElement.classList.toggle('has-value', !!value);
        }
    }

    /**
     * Handle sort changes
     */
    _handleSortChange(sortType) {
        this.currentSort = sortType;
        this._loadCharacters();
    }

    /**
     * Reset all filters to default state
     */
    _resetAllFilters() {
        this.currentFilters = {};
        this.currentSort = 'tier';
        this.currentPage = 1;
        
        // Reset UI elements
        this.elements.searchInput.value = '';
        this.elements.tierFilter.value = '';
        this.elements.jobFilter.value = '';
        this.elements.rarityFilter.value = '';
        this.elements.sortFilter.value = 'tier';
        this.elements.searchClear.style.display = 'none';
        
        // Remove visual feedback classes
        document.querySelectorAll('.filter-select').forEach(select => {
            select.classList.remove('has-value');
        });
        
        this._updateActiveFiltersDisplay();
        this._loadCharacters();
    }

    /**
     * Update active filters display
     */
    _updateActiveFiltersDisplay() {
        if (!this.elements.activeFilters || !this.elements.activeFiltersList) return;
        
        const filterCount = Object.keys(this.currentFilters).length;
        
        if (filterCount === 0) {
            this.elements.activeFilters.style.display = 'none';
            return;
        }
        
        this.elements.activeFilters.style.display = 'flex';
        this.elements.activeFiltersList.innerHTML = '';
        
        // Create filter tags for each active filter
        Object.entries(this.currentFilters).forEach(([filterType, value]) => {
            if (!value) return;
            
            const tag = document.createElement('div');
            tag.className = 'active-filter-tag';
            
            const displayName = this._getFilterDisplayName(filterType, value);
            
            tag.innerHTML = `
                <span>${displayName}</span>
                <button class="filter-tag-remove" data-filter-type="${filterType}">×</button>
            `;
            
            // Add remove handler
            tag.querySelector('.filter-tag-remove').addEventListener('click', (e) => {
                e.stopPropagation();
                this._removeFilter(filterType);
            });
            
            this.elements.activeFiltersList.appendChild(tag);
        });
    }

    /**
     * Get display name for filter
     */
    _getFilterDisplayName(filterType, value) {
        const displayNames = {
            search: `"${value}"`,
            tier: `${value} Tier`,
            job: value,
            rarity: `${value} Star`
        };
        
        return displayNames[filterType] || `${filterType}: ${value}`;
    }

    /**
     * Remove specific filter
     */
    _removeFilter(filterType) {
        delete this.currentFilters[filterType];
        
        // Update UI element
        if (filterType === 'search') {
            this.elements.searchInput.value = '';
            this.elements.searchClear.style.display = 'none';
        } else {
            const selectElement = document.getElementById(`${filterType}-filter`);
            if (selectElement) {
                selectElement.value = '';
                selectElement.classList.remove('has-value');
            }
        }
        
        this.currentPage = 1;
        this._loadCharacters();
        this._updateActiveFiltersDisplay();
    }

    /**
     * Create a character card element
     */
    _createCharacterCard(character) {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.dataset.characterId = character.id;
        
        // Simplified card with just image, name, and stars
        card.innerHTML = `
            <div class="character-image">
                <img 
                    data-src="${this.database.getCharacterPortraitUrl(character)}" 
                    alt="${character.basic_info.name}"
                    class="lazy-image"
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                />
                <div class="character-placeholder" style="display: none;">
                    ${character.basic_info.name.substring(0, 2).toUpperCase()}
                </div>
            </div>
            
            <div class="character-info">
                <div class="character-name">${character.basic_info.name}</div>
                <div class="character-stars">
                    ${'★'.repeat(character.basic_info.rarity)}
                </div>
            </div>
        `;
        
        // Add click handlers
        card.addEventListener('click', (e) => {
            this._openCharacterModal(character);
        });
        
        return card;
    }

    /**
     * Setup lazy loading for character images
     */
    _setupLazyLoading() {
        const images = this.elements.characterGrid.querySelectorAll('.lazy-image');
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    
                    if (src) {
                        img.src = src;
                        img.classList.add('loaded');
                        observer.unobserve(img);
                    }
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }





    /**
     * Toggle character favorite status
     */
    _toggleFavorite(characterId, button) {
        const character = this.database.getCharacterById(characterId);
        const newFavoriteStatus = !(character.user_data?.favorite || false);
        
        this.database.updateCharacterUserData(characterId, { favorite: newFavoriteStatus });
        
        button.classList.toggle('active', newFavoriteStatus);
        
        // Show feedback
        this._showToast(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
    }

    /**
     * Toggle character owned status
     */
    _toggleOwned(characterId, button) {
        const character = this.database.getCharacterById(characterId);
        const newOwnedStatus = !(character.user_data?.owned || false);
        
        this.database.updateCharacterUserData(characterId, { owned: newOwnedStatus });
        
        button.classList.toggle('active', newOwnedStatus);
        
        // Show feedback
        this._showToast(newOwnedStatus ? 'Marked as owned' : 'Marked as not owned');
    }

    /**
     * Open character detail modal
     */
    _openCharacterModal(character) {
        this._renderCharacterModal(character);
        this.elements.modal.classList.add('active');
        document.body.classList.add('modal-open');
    }

    /**
     * Close character detail modal
     */
    _closeModal() {
        this.elements.modal.classList.remove('active');
        document.body.classList.remove('modal-open');
    }

    /**
     * Render character details in modal
     */
    _renderCharacterModal(character) {
        const tier = character.basic_info.tier?.gl || 'D';
        const tierColor = this.database.getTierColor(tier);
        
        this.elements.modalContent.innerHTML = `
            <div class="character-modal-premium">
                <!-- Header con imagen y info básica -->
                <div class="character-modal-header">
                    <div class="character-portrait-section">
                        <div class="portrait-frame">
                            <img src="${this.database.getCharacterPortraitUrl(character)}" 
                                 alt="${character.basic_info.name}"
                                 class="character-portrait-large">
                            <div class="tier-badge-large tier-${tier.toLowerCase().replace('+', 'plus')}">${tier}</div>
                        </div>
                    </div>
                    
                    <div class="character-main-info">
                        <div class="character-name-section">
                            <h1 class="character-name-large">${character.basic_info.name}</h1>
                            ${character.basic_info.japanese_name ? `<div class="character-japanese-name">${character.basic_info.japanese_name}</div>` : ''}
                        </div>
                        
                        <div class="character-meta-info">
                            <div class="meta-item job-item">
                                <span class="meta-icon">⚔️</span>
                                <span class="meta-label">Job</span>
                                <span class="meta-value job-name">${character.basic_info.job}</span>
                            </div>
                            
                            <div class="meta-item rarity-item">
                                <span class="meta-icon">⭐</span>
                                <span class="meta-label">Rarity</span>
                                <div class="rarity-stars">
                                    ${'<span class="star-large">★</span>'.repeat(character.basic_info.rarity)}
                                </div>
                            </div>
                            
                            ${character.basic_info.location ? `
                            <div class="meta-item location-item">
                                <span class="meta-icon">📍</span>
                                <span class="meta-label">Location</span>
                                <span class="meta-value">${character.basic_info.location}</span>
                            </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <!-- Stats Section -->
                <div class="character-stats-section">
                    <h2 class="stats-title">Base Statistics</h2>
                    <div class="stats-grid-premium">
                        <div class="stat-card">
                            <div class="stat-icon hp-icon">❤️</div>
                            <div class="stat-info">
                                <div class="stat-label">Health Points</div>
                                <div class="stat-value">${character.stats?.base?.hp || 0}</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon sp-icon">💙</div>
                            <div class="stat-info">
                                <div class="stat-label">Skill Points</div>
                                <div class="stat-value">${character.stats?.base?.sp || 0}</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon atk-icon">⚔️</div>
                            <div class="stat-info">
                                <div class="stat-label">Physical ATK</div>
                                <div class="stat-value">${character.stats?.base?.p_atk || 0}</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon def-icon">🛡️</div>
                            <div class="stat-info">
                                <div class="stat-label">Physical DEF</div>
                                <div class="stat-value">${character.stats?.base?.p_def || 0}</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon magic-icon">✨</div>
                            <div class="stat-info">
                                <div class="stat-label">Elemental ATK</div>
                                <div class="stat-value">${character.stats?.base?.e_atk || 0}</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon mdef-icon">🔮</div>
                            <div class="stat-info">
                                <div class="stat-label">Elemental DEF</div>
                                <div class="stat-value">${character.stats?.base?.e_def || 0}</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon crit-icon">💥</div>
                            <div class="stat-info">
                                <div class="stat-label">Critical Rate</div>
                                <div class="stat-value">${character.stats?.base?.crit || 0}</div>
                            </div>
                        </div>
                        
                        <div class="stat-card">
                            <div class="stat-icon speed-icon">⚡</div>
                            <div class="stat-info">
                                <div class="stat-label">Speed</div>
                                <div class="stat-value">${character.stats?.base?.speed || 0}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Total Stats Summary -->
                    <div class="stats-summary">
                        <div class="summary-item">
                            <span class="summary-label">Total Base Stats</span>
                            <span class="summary-value">${character.computed?.total_stats || 0}</span>
                        </div>
                    </div>
                </div>
                
                <!-- Actions Section -->
                <div class="character-actions-section">
                    <button class="btn-action btn-favorite ${character.user_data?.favorite ? 'active' : ''}" 
                            data-character-id="${character.id}">
                        <span class="btn-icon">❤️</span>
                        <span class="btn-text">${character.user_data?.favorite ? 'Favorited' : 'Add to Favorites'}</span>
                    </button>
                    <button class="btn-action btn-owned ${character.user_data?.owned ? 'active' : ''}" 
                            data-character-id="${character.id}">
                        <span class="btn-icon">✓</span>
                        <span class="btn-text">${character.user_data?.owned ? 'Owned' : 'Mark as Owned'}</span>
                    </button>
                </div>
            </div>
        `;
        
        // Add modal action handlers
        this._setupModalActions(character);
    }

    /**
     * Setup modal action button handlers
     */
    _setupModalActions(character) {
        const favoriteBtn = this.elements.modalContent.querySelector('.btn-favorite');
        const ownedBtn = this.elements.modalContent.querySelector('.btn-owned');
        
        favoriteBtn.addEventListener('click', () => {
            const newStatus = !(character.user_data?.favorite || false);
            this.database.updateCharacterUserData(character.id, { favorite: newStatus });
            
            const btnText = favoriteBtn.querySelector('.btn-text');
            btnText.textContent = newStatus ? 'Favorited' : 'Add to Favorites';
            favoriteBtn.classList.toggle('active', newStatus);
            
            this._showToast(newStatus ? 'Added to favorites' : 'Removed from favorites');
        });
        
        ownedBtn.addEventListener('click', () => {
            const newStatus = !(character.user_data?.owned || false);
            this.database.updateCharacterUserData(character.id, { owned: newStatus });
            
            const btnText = ownedBtn.querySelector('.btn-text');
            btnText.textContent = newStatus ? 'Owned' : 'Mark as Owned';
            ownedBtn.classList.toggle('active', newStatus);
            
            this._showToast(newStatus ? 'Marked as owned' : 'Marked as not owned');
        });
    }

    /**
     * Render pagination controls
     */
    _renderPagination(totalPages) {
        if (totalPages <= 1) {
            this.elements.pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                    data-page="${this.currentPage - 1}">Previous</button>
        `;
        
        // Page numbers (show up to 5 pages around current page)
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" data-page="1">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        data-page="${i}">${i}</button>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-ellipsis">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" data-page="${totalPages}">${totalPages}</button>`;
        }
        
        // Next button
        paginationHTML += `
            <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                    data-page="${this.currentPage + 1}">Next</button>
        `;
        
        this.elements.pagination.innerHTML = paginationHTML;
        
        // Add pagination event listeners
        this.elements.pagination.addEventListener('click', (e) => {
            if (e.target.classList.contains('pagination-btn') && !e.target.classList.contains('disabled')) {
                const newPage = parseInt(e.target.dataset.page);
                if (newPage !== this.currentPage) {
                    this.currentPage = newPage;
                    this._loadCharacters();
                    this._scrollToTop();
                }
            }
        });
    }

    /**
     * Update results count display
     */
    _updateResultsCount(count) {
        if (this.elements.resultsCounter) {
            const total = this.database.getAllCharacters().length;
            const hasFilters = Object.keys(this.currentFilters).length > 0;
            
            if (hasFilters) {
                this.elements.resultsCounter.textContent = `Showing ${count} of ${total} characters`;
                this.elements.resultsCounter.style.color = 'var(--gold-primary)';
            } else {
                this.elements.resultsCounter.textContent = `${total} characters total`;
                this.elements.resultsCounter.style.color = 'var(--text-muted)';
            }
        }
    }

    /**
     * Scroll to top of character grid
     */
    _scrollToTop() {
        this.elements.characterGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    /**
     * Show loading state
     */
    _showLoading() {
        this.elements.characterGrid.innerHTML = `
            <div class="loading-state">
                <div class="loading-spinner"></div>
                <p>Loading characters...</p>
            </div>
        `;
    }

    /**
     * Hide loading state
     */
    _hideLoading() {
        const loadingState = this.elements.characterGrid.querySelector('.loading-state');
        if (loadingState) {
            loadingState.remove();
        }
    }

    /**
     * Show no results message
     */
    _showNoResults() {
        this.elements.characterGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No characters found</h3>
                <p>There are no characters to display</p>
            </div>
        `;
    }

    /**
     * Show error message
     */
    _showError(message) {
        this.elements.characterGrid.innerHTML = `
            <div class="error-state">
                <div class="error-icon">⚠️</div>
                <h3>Error</h3>
                <p>${message}</p>
                <button class="btn-primary" onclick="galleryTab._loadCharacters()">Retry</button>
            </div>
        `;
    }

    /**
     * Show toast notification
     */
    _showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        const container = document.getElementById('toast-container');
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }

    
    
    
    /**
     * Public method to refresh characters (called by other tabs)
     */
    refresh() {
        if (this.isInitialized) {
            this._loadCharacters();
        }
    }
}

// Export for global use
window.GalleryTab = GalleryTab;