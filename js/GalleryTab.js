/**
 * GalleryTab.js - Simplified Clean Design Version
 * Character Gallery Tab Implementation for Clean UI
 * Handles character browsing, filtering, search, and modal display
 */

class GalleryTab {
    constructor(database) {
        this.database = database;
        this.currentFilters = {};
        this.searchTimeout = null;
        this.isInitialized = false;
        this.currentViewMode = 'grid';
        this.filteredCharacters = [];
        this.allCharacters = [];
        this.userDataCache = UserDataStore.load();
        
        // DOM element references
        this.elements = {};
    }

    /**
     * Initialize the gallery tab with event listeners and UI setup
     */
    async init() {
        if (this.isInitialized) return;

        await this.database.waitForReady();
        if (!this.database.initialized) {
            await this.database.init();
        }
        this.allCharacters = this.database.getAllCharacters();
        this.userDataCache = UserDataStore.load();
        this._cacheElements();
        this._setupEventListeners();
        this._populateFilterOptions();
        this._loadCharacters();
        
        this.isInitialized = true;
        console.log('✅ Gallery tab initialized with clean design');
    }

    /**
     * Cache frequently used DOM elements for performance
     */
    _cacheElements() {
        this.elements = {
            // Search and filters
            searchInput: document.getElementById('searchInput'),
            tierFilter: document.getElementById('tierFilter'),
            jobFilter: document.getElementById('jobFilter'),
            rarityFilter: document.getElementById('rarityFilter'),
            clearFilters: document.getElementById('clearFilters'),
            
            // Grid and results
            characterGrid: document.getElementById('characterGrid'),
            characterCount: document.getElementById('characterCount'),
            noResults: document.getElementById('noResults'),
            
            // View controls
            gridViewBtn: document.getElementById('gridViewBtn'),
            listViewBtn: document.getElementById('listViewBtn'),
            
            // Modal
            modal: document.getElementById('characterModal'),
            modalClose: document.getElementById('closeModal'),
            modalCharacterImage: document.getElementById('modalCharacterImage'),
            modalCharacterName: document.getElementById('modalCharacterName'),
            modalCharacterJob: document.getElementById('modalCharacterJob'),
            modalCharacterRarity: document.getElementById('modalCharacterRarity'),
            modalCharacterTier: document.getElementById('modalCharacterTier'),
            modalCharacterDescription: document.getElementById('modalCharacterDescription'),
            modalStatsGrid: document.getElementById('modalStatsGrid'),
            modalCharacterSkills: document.getElementById('modalCharacterSkills'),
            toggleOwned: document.getElementById('toggleOwned'),
            toggleFavorite: document.getElementById('toggleFavorite')
        };
    }

    /**
     * Setup event listeners for all interactive elements
     */
    _setupEventListeners() {
        // Search with debouncing
        this.elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.currentFilters.search = e.target.value;
                this._loadCharacters();
                this._updateClearFiltersVisibility();
            }, 300);
        });

        // Filter changes
        this.elements.tierFilter.addEventListener('change', (e) => {
            this.currentFilters.tier = e.target.value === 'all' ? null : e.target.value;
            this._loadCharacters();
            this._updateClearFiltersVisibility();
        });

        this.elements.jobFilter.addEventListener('change', (e) => {
            this.currentFilters.job = e.target.value === 'all' ? null : e.target.value;
            this._loadCharacters();
            this._updateClearFiltersVisibility();
        });

        this.elements.rarityFilter.addEventListener('change', (e) => {
            this.currentFilters.rarity = e.target.value === 'all' ? null : e.target.value;
            this._loadCharacters();
            this._updateClearFiltersVisibility();
        });

        // View mode switches
        this.elements.gridViewBtn.addEventListener('click', () => {
            this._setViewMode('grid');
        });

        this.elements.listViewBtn.addEventListener('click', () => {
            this._setViewMode('list');
        });

        // Clear filters
        this.elements.clearFilters.addEventListener('click', () => {
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
     * Populate filter dropdown options from database
     */
    _populateFilterOptions() {
        try {
            const jobs = this.database.getUniqueJobs();
            
            jobs.forEach(job => {
                const option = document.createElement('option');
                option.value = job;
                option.textContent = job;
                this.elements.jobFilter.appendChild(option);
            });
            
            console.log('✅ Filter options populated');
        } catch (error) {
            console.error('Error populating filter options:', error);
        }
    }

    /**
     * Load and display characters based on current filters
     */
    _loadCharacters() {
        try {
            // Get all characters and apply filters
            this.filteredCharacters = this._applyFilters(this.allCharacters);
            
            // Apply sorting (tier-first by default)
            this.filteredCharacters = this._applySorting(this.filteredCharacters);
            
            this._renderCharacters(this.filteredCharacters);
            this._updateCharacterCount(this.filteredCharacters.length);
            
        } catch (error) {
            console.error('Error loading characters:', error);
            this._showError('Failed to load characters');
        }
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
     * Apply sorting to character list (tier-first by default)
     */
    _applySorting(characters) {
        const tierOrder = { 'S+': 0, 'S': 1, 'A': 2, 'B': 3, 'C': 4, 'D': 5 };
        
        return characters.sort((a, b) => {
            const tierA = a.basic_info.tier?.gl || 'D';
            const tierB = b.basic_info.tier?.gl || 'D';
            
            // Sort by tier first
            const tierDiff = tierOrder[tierA] - tierOrder[tierB];
            if (tierDiff !== 0) return tierDiff;
            
            // Then by name
            return a.basic_info.name.localeCompare(b.basic_info.name);
        });
    }

    /**
     * Render character cards in the grid
     */
    _renderCharacters(characters) {
        const grid = this.elements.characterGrid;
        grid.innerHTML = '';

        this.userDataCache = UserDataStore.load();

        if (characters.length === 0) {
            this.elements.noResults.style.display = 'block';
            return;
        }
        
        this.elements.noResults.style.display = 'none';

        // Create character cards
        characters.forEach(character => {
            const card = this._createCharacterCard(character, this.userDataCache);
            grid.appendChild(card);
        });
    }

    /**
     * Create a character card using CharacterCard component
     */
    _createCharacterCard(character, userData = this.userDataCache) {
        // Ensure character has user_data
        if (!character.user_data) {
            character.user_data = {};
        }
        
        // Apply user data from localStorage
        character.user_data.owned = userData.owned.has(character.id);
        character.user_data.favorite = userData.favorites.has(character.id);
        
        // Create CharacterCard component
        const characterCard = new CharacterCard(character, {
            variant: 'gallery',
            showFavorite: true,
            showOwned: true,
            showTierBadge: true,
            showRarity: true,
            clickable: true,
            size: 'medium',
            
            // Event handlers
            onCardClick: (char) => {
                this._openCharacterModal(char);
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
     * Render star rating for character
     */
    _renderStars(rarity) {
        return Array.from({ length: 5 }, (_, i) => {
            const isFilled = i < rarity;
            return `
                <svg class="star ${isFilled ? 'star-filled' : 'star-empty'}" viewBox="0 0 24 24" fill="${isFilled ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
            `;
        }).join('');
    }

    /**
     * Get character image URL with fallback
     */
    _getCharacterImageUrl(character) {
        if (character.assets && character.assets.portrait) {
            return character.assets.portrait;
        }
        
        // Generate from name (fallback)
        const name = character.basic_info.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        return `Imagenes - Octopath/portraits/${name}.png`;
    }

    /**
     * Open character modal with details
     */
    _openCharacterModal(character) {
        try {
            // Populate modal with character data
            this.elements.modalCharacterImage.src = this._getCharacterImageUrl(character);
            this.elements.modalCharacterImage.alt = character.basic_info.name;
            this.elements.modalCharacterName.textContent = character.basic_info.name;
            this.elements.modalCharacterJob.textContent = character.basic_info.job;
            this.elements.modalCharacterRarity.innerHTML = this._renderStars(character.basic_info.rarity);
            
            // Set tier badge
            const tier = character.basic_info.tier?.gl || 'D';
            this.elements.modalCharacterTier.textContent = tier;
            this.elements.modalCharacterTier.className = `tier-badge tier-${tier.toLowerCase().replace('+', '-plus')}`;
            
            // Set description
            this.elements.modalCharacterDescription.textContent = character.basic_info.location || 'A skilled traveler with unique abilities.';
            
            // Populate stats
            this._populateModalStats(character);
            
            // Populate skills (placeholder for now)
            this._populateModalSkills(character);
            
            // Setup user action buttons
            this._setupUserActions(character);
            
            // Show modal
            this.elements.modal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
        } catch (error) {
            console.error('Error opening character modal:', error);
        }
    }

    /**
     * Populate modal stats section
     */
    _populateModalStats(character) {
        const stats = character.stats;
        let statsHtml = '';
        
        if (stats && stats.level_120) {
            const levelStats = stats.level_120;
            
            // Health Points
            if (levelStats.hp) {
                statsHtml += `
                    <div class="stat-card">
                        <div class="stat-header">
                            <svg class="stat-icon health" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="m19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>
                            </svg>
                            <span class="stat-label">Health Points</span>
                        </div>
                        <p class="stat-value">${levelStats.hp.toLocaleString()}</p>
                    </div>
                `;
            }
            
            // Skill Points
            if (levelStats.sp) {
                statsHtml += `
                    <div class="stat-card">
                        <div class="stat-header">
                            <svg class="stat-icon skill" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10"/>
                            </svg>
                            <span class="stat-label">Skill Points</span>
                        </div>
                        <p class="stat-value">${levelStats.sp.toLocaleString()}</p>
                    </div>
                `;
            }
            
            // Physical Attack
            if (levelStats.physical_attack) {
                statsHtml += `
                    <div class="stat-card">
                        <div class="stat-header">
                            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                                <line x1="3" x2="21" y1="6" y2="6"/>
                                <path d="M16 10a4 4 0 0 1-8 0"/>
                            </svg>
                            <span class="stat-label">Physical Attack</span>
                        </div>
                        <p class="stat-value">${levelStats.physical_attack.toLocaleString()}</p>
                    </div>
                `;
            }
            
            // Elemental Attack
            if (levelStats.elemental_attack) {
                statsHtml += `
                    <div class="stat-card">
                        <div class="stat-header">
                            <svg class="stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                            </svg>
                            <span class="stat-label">Elemental Attack</span>
                        </div>
                        <p class="stat-value">${levelStats.elemental_attack.toLocaleString()}</p>
                    </div>
                `;
            }
        }
        
        this.elements.modalStatsGrid.innerHTML = statsHtml || '<p>No stats available</p>';
    }

    /**
     * Populate modal skills section (placeholder)
     */
    _populateModalSkills(character) {
        // This is a placeholder - in the full implementation this would parse markdown files
        const skillsHtml = `
            <div class="skill-card">
                <h4 class="skill-name">Signature Skill</h4>
                <p class="skill-description">This character has unique abilities based on their job class and tier ranking.</p>
            </div>
            <div class="skill-card">
                <h4 class="skill-name">Class Ability</h4>
                <p class="skill-description">Advanced techniques available to ${character.basic_info.job} class characters.</p>
            </div>
        `;
        
        this.elements.modalCharacterSkills.innerHTML = skillsHtml;
    }

    /**
     * Setup user action buttons (owned/favorite)
     */
    _setupUserActions(character) {
        // Ensure we are using the shared user data store
        this.userDataCache = UserDataStore.load();
        const { owned, favorites } = this.userDataCache;
        const isOwned = owned.has(character.id);
        const isFavorite = favorites.has(character.id);
        
        // Update button states
        this._updateActionButton(this.elements.toggleOwned, isOwned, '❤️', 'Owned', 'Add to Owned');
        this._updateActionButton(this.elements.toggleFavorite, isFavorite, '⭐', 'Favorited', 'Favorite');
        
        // Setup click handlers
        this.elements.toggleOwned.onclick = () => this._toggleUserData(character.id, 'owned');
        this.elements.toggleFavorite.onclick = () => this._toggleUserData(character.id, 'favorite');
    }

    /**
     * Update action button appearance
     */
    _updateActionButton(button, isActive, icon, activeText, inactiveText) {
        const iconSpan = button.querySelector('.owned-icon, .favorite-icon');
        const textSpan = button.querySelector('.owned-text, .favorite-text');
        
        iconSpan.textContent = icon;
        textSpan.textContent = isActive ? activeText : inactiveText;
        
        if (isActive) {
            button.classList.remove('btn-outline');
            button.classList.add('btn-primary');
        } else {
            button.classList.remove('btn-primary');
            button.classList.add('btn-outline');
        }
    }

    /**
     * Toggle user data (owned/favorite)
     */
    _toggleUserData(characterId, dataType) {
        const currentStatus = dataType === 'owned'
            ? this.userDataCache.owned.has(characterId)
            : this.userDataCache.favorites.has(characterId);

        const updatedData = dataType === 'owned'
            ? UserDataStore.updateOwned(characterId, !currentStatus)
            : UserDataStore.updateFavorite(characterId, !currentStatus);

        this.userDataCache = updatedData;

        // Refresh modal buttons with the updated status
        const character = this.database.getAllCharacters().find(c => c.id === characterId);
        if (character) {
            this._setupUserActions(character);
        }
    }

    /**
     * Close character modal
     */
    _closeModal() {
        this.elements.modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    /**
     * Set view mode (grid/list)
     */
    _setViewMode(mode) {
        this.currentViewMode = mode;
        
        // Update grid class
        this.elements.characterGrid.className = `character-grid ${mode}-view`;
        
        // Update button states
        if (mode === 'grid') {
            this.elements.gridViewBtn.className = 'btn btn-primary';
            this.elements.listViewBtn.className = 'btn btn-outline';
        } else {
            this.elements.gridViewBtn.className = 'btn btn-outline';
            this.elements.listViewBtn.className = 'btn btn-primary';
        }
        
        // Re-render characters
        this._renderCharacters(this.filteredCharacters);
    }

    /**
     * Update character count display
     */
    _updateCharacterCount(count) {
        const total = this.allCharacters.length;
        this.elements.characterCount.textContent = `${count} of ${total} Characters`;
    }

    /**
     * Update clear filters button visibility
     */
    _updateClearFiltersVisibility() {
        const hasFilters = this.elements.searchInput.value || 
                          this.elements.tierFilter.value !== 'all' || 
                          this.elements.jobFilter.value !== 'all' || 
                          this.elements.rarityFilter.value !== 'all';
        
        this.elements.clearFilters.style.display = hasFilters ? 'block' : 'none';
    }

    /**
     * Reset all filters
     */
    _resetAllFilters() {
        this.elements.searchInput.value = '';
        this.elements.tierFilter.value = 'all';
        this.elements.jobFilter.value = 'all';
        this.elements.rarityFilter.value = 'all';
        
        this.currentFilters = {};
        this._loadCharacters();
        this._updateClearFiltersVisibility();
    }

    /**
     * Show error message
     */
    _showError(message) {
        this.elements.characterGrid.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--muted-foreground);">
                <div style="font-size: 2rem; margin-bottom: 1rem;">❌</div>
                <div>${message}</div>
            </div>
        `;
    }

    /**
     * Load user data from localStorage (owned/favorites)
     */
    _updateFavoriteStatus(character, isFavorite) {
        try {
            this.userDataCache = UserDataStore.updateFavorite(character.id, isFavorite);
            console.log(`Character ${character.basic_info.name} ${isFavorite ? 'added to' : 'removed from'} favorites`);
        } catch (error) {
            console.error('Error updating favorite status:', error);
        }
    }

    /**
     * Update owned status for a character
     */
    _updateOwnedStatus(character, isOwned) {
        try {
            this.userDataCache = UserDataStore.updateOwned(character.id, isOwned);
            console.log(`Character ${character.basic_info.name} ${isOwned ? 'marked as owned' : 'removed from owned'}`);
        } catch (error) {
            console.error('Error updating owned status:', error);
        }
    }
}