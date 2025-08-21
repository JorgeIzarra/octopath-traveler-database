/**
 * CharacterDatabase.js
 * Core data layer for Octopath Traveler Character Database
 * Handles database loading, indexing, and optimized data access
 */

class CharacterDatabase {
    constructor() {
        this.database = null;
        this.indexes = {};
        this.config = null;
        this.isLoaded = false;
        this.loadingPromise = null;
    }

    /**
     * Initialize the database and load all necessary data
     * Uses the optimized database structure with O(1) index lookups
     */
    async init() {
        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = this._loadData();
        return this.loadingPromise;
    }

    /**
     * Load all database files and indexes in parallel for optimal performance
     */
    async _loadData() {
        try {
            // Load main database, indexes, and config in parallel
            const [databaseResponse, configResponse, ...indexResponses] = await Promise.all([
                fetch('DataBase/octopath_optimized.json'),
                fetch('DataBase/config/frontend_config.json'),
                fetch('DataBase/indexes/by_job.json'),
                fetch('DataBase/indexes/by_tier.json'),
                fetch('DataBase/indexes/by_element.json'),
                fetch('DataBase/indexes/by_rarity.json'),
                fetch('DataBase/indexes/search_terms.json'),
                fetch('DataBase/indexes/synergy_map.json'),
                fetch('DataBase/indexes/performance_ranking.json')
            ]);

            // Parse all responses
            this.database = await databaseResponse.json();
            this.config = await configResponse.json();

            // Parse indexes
            const [byJob, byTier, byElement, byRarity, searchTerms, synergyMap, performanceRanking] = 
                await Promise.all(indexResponses.map(response => response.json()));

            this.indexes = {
                byJob,
                byTier,
                byElement,
                byRarity,
                searchTerms,
                synergyMap,
                performanceRanking
            };

            this.isLoaded = true;
            console.log(`✅ Database loaded: ${this.database.metadata.total_characters} characters`);
            return true;
        } catch (error) {
            console.error('❌ Failed to load database:', error);
            throw error;
        }
    }

    /**
     * Get all characters from the main database
     */
    getAllCharacters() {
        this._ensureLoaded();
        return this.database.characters;
    }

    /**
     * Get character by ID with O(1) lookup
     */
    getCharacterById(id) {
        this._ensureLoaded();
        return this.database.characters.find(char => char.id === id);
    }

    /**
     * Get characters by job using pre-computed index
     * @param {string} job - Job name (Hunter, Scholar, etc.)
     * @returns {Array} Characters in that job
     */
    getCharactersByJob(job) {
        this._ensureLoaded();
        if (!job || !this.indexes.byJob[job]) return [];
        
        // Get character IDs from index and fetch full character data
        const jobIndex = this.indexes.byJob[job];
        return jobIndex.map(indexEntry => this.getCharacterById(indexEntry.id))
                      .filter(Boolean);
    }

    /**
     * Get characters by tier using pre-computed index
     * @param {string} tier - Tier (S, A, B, C, D)
     * @returns {Array} Characters in that tier
     */
    getCharactersByTier(tier) {
        this._ensureLoaded();
        if (!tier || !this.indexes.byTier[tier]) return [];
        
        const tierIndex = this.indexes.byTier[tier];
        return tierIndex.map(indexEntry => this.getCharacterById(indexEntry.id))
                       .filter(Boolean);
    }

    /**
     * Get characters by rarity using pre-computed index
     * @param {number} rarity - Star rating (3, 4, 5)
     * @returns {Array} Characters with that rarity
     */
    getCharactersByRarity(rarity) {
        this._ensureLoaded();
        if (!rarity || !this.indexes.byRarity[rarity]) return [];
        
        const rarityIndex = this.indexes.byRarity[rarity];
        return rarityIndex.map(indexEntry => this.getCharacterById(indexEntry.id))
                         .filter(Boolean);
    }

    /**
     * Get characters by element using pre-computed index
     * @param {string} element - Element (Fire, Ice, Light, Dark, Wind)
     * @returns {Array} Characters with that element
     */
    getCharactersByElement(element) {
        this._ensureLoaded();
        if (!element || !this.indexes.byElement[element]) return [];
        
        const elementIndex = this.indexes.byElement[element];
        return elementIndex.map(indexEntry => this.getCharacterById(indexEntry.id))
                          .filter(Boolean);
    }

    /**
     * Advanced search with fuzzy matching using optimized search index
     * @param {string} query - Search query
     * @param {number} maxResults - Maximum results to return
     * @returns {Array} Matching characters sorted by relevance
     */
    searchCharacters(query, maxResults = 50) {
        this._ensureLoaded();
        if (!query || query.length < 2) return [];

        const normalizedQuery = query.toLowerCase().trim();
        const results = [];
        
        // Search through all characters with optimized matching
        for (const character of this.database.characters) {
            const score = this._calculateSearchScore(character, normalizedQuery);
            if (score > 0) {
                results.push({ character, score });
            }
        }

        // Sort by score (relevance) and limit results
        results.sort((a, b) => b.score - a.score);
        return results.slice(0, maxResults).map(result => result.character);
    }

    /**
     * Calculate search relevance score for a character
     * @param {Object} character - Character data
     * @param {string} query - Normalized search query
     * @returns {number} Relevance score
     */
    _calculateSearchScore(character, query) {
        let score = 0;
        
        const name = character.basic_info.name?.toLowerCase() || '';
        const japaneseName = character.basic_info.japanese_name?.toLowerCase() || '';
        const job = character.basic_info.job?.toLowerCase() || '';
        const location = character.basic_info.location?.toLowerCase() || '';
        
        // Exact name match gets highest score
        if (name === query) return 100;
        
        // Partial name matches
        if (name.includes(query)) score += 50;
        if (name.startsWith(query)) score += 25;
        
        // Japanese name matches
        if (japaneseName.includes(query)) score += 30;
        
        // Job matches
        if (job.includes(query)) score += 20;
        
        // Location matches
        if (location.includes(query)) score += 10;
        
        return score;
    }

    /**
     * Apply multiple filters simultaneously for advanced filtering
     * @param {Object} filters - Filter criteria
     * @returns {Array} Filtered characters
     */
    applyFilters(filters) {
        this._ensureLoaded();
        let results = this.getAllCharacters();

        // Apply job filter
        if (filters.job) {
            const jobCharacterIds = new Set(
                this.indexes.byJob[filters.job]?.map(char => char.id) || []
            );
            results = results.filter(char => jobCharacterIds.has(char.id));
        }

        // Apply tier filter
        if (filters.tier) {
            const tierCharacterIds = new Set(
                this.indexes.byTier[filters.tier]?.map(char => char.id) || []
            );
            results = results.filter(char => tierCharacterIds.has(char.id));
        }

        // Apply rarity filter
        if (filters.rarity) {
            const rarityCharacterIds = new Set(
                this.indexes.byRarity[filters.rarity]?.map(char => char.id) || []
            );
            results = results.filter(char => rarityCharacterIds.has(char.id));
        }

        // Apply element filter
        if (filters.element) {
            const elementCharacterIds = new Set(
                this.indexes.byElement[filters.element]?.map(char => char.id) || []
            );
            results = results.filter(char => elementCharacterIds.has(char.id));
        }

        // Apply owned filter
        if (filters.owned === 'owned') {
            results = results.filter(char => char.user_data?.owned === true);
        } else if (filters.owned === 'missing') {
            results = results.filter(char => char.user_data?.owned !== true);
        }

        // Apply search query
        if (filters.search && filters.search.length >= 2) {
            const searchResults = this.searchCharacters(filters.search);
            const searchIds = new Set(searchResults.map(char => char.id));
            results = results.filter(char => searchIds.has(char.id));
        }

        return results;
    }

    /**
     * Get filter options from configuration
     */
    getFilterOptions() {
        this._ensureLoaded();
        return this.config.filter_options;
    }

    /**
     * Get theme configuration
     */
    getTheme() {
        this._ensureLoaded();
        return this.config.theme;
    }

    /**
     * Get display configuration
     */
    getDisplayConfig() {
        this._ensureLoaded();
        return this.config.display;
    }

    /**
     * Get database statistics
     */
    getStatistics() {
        this._ensureLoaded();
        return {
            ...this.config.statistics,
            total_characters: this.database.metadata.total_characters
        };
    }

    /**
     * Update character user data (owned, favorite, notes)
     * @param {string} characterId - Character ID
     * @param {Object} userData - User data to update
     */
    updateCharacterUserData(characterId, userData) {
        this._ensureLoaded();
        const character = this.getCharacterById(characterId);
        if (character) {
            if (!character.user_data) {
                character.user_data = {};
            }
            Object.assign(character.user_data, userData);
            this._saveUserData();
        }
    }

    /**
     * Save user data to localStorage
     */
    _saveUserData() {
        const userData = {};
        for (const character of this.database.characters) {
            if (character.user_data && Object.keys(character.user_data).length > 0) {
                userData[character.id] = character.user_data;
            }
        }
        localStorage.setItem('octopath_user_data', JSON.stringify(userData));
    }

    /**
     * Load user data from localStorage
     */
    _loadUserData() {
        try {
            const savedData = localStorage.getItem('octopath_user_data');
            if (savedData) {
                const userData = JSON.parse(savedData);
                for (const character of this.database.characters) {
                    if (userData[character.id]) {
                        character.user_data = userData[character.id];
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load user data:', error);
        }
    }

    /**
     * Ensure database is loaded before operations
     */
    _ensureLoaded() {
        if (!this.isLoaded) {
            throw new Error('Database not loaded. Call init() first.');
        }
    }

    /**
     * Get character portrait image URL with fallback
     * @param {Object} character - Character data
     * @returns {string} Image URL
     */
    getCharacterPortraitUrl(character) {
        if (character.assets?.portrait) {
            return character.assets.portrait;
        }
        // Fallback based on character ID
        return `Imagenes - Octopath/portraits/${character.id}.png`;
    }

    /**
     * Get tier color from theme configuration
     * @param {string} tier - Character tier
     * @returns {string} Color hex code
     */
    getTierColor(tier) {
        this._ensureLoaded();
        return this.config.theme.tier_colors[tier] || '#666666';
    }

    /**
     * Get rarity color from theme configuration
     * @param {number} rarity - Character rarity
     * @returns {string} Color hex code
     */
    getRarityColor(rarity) {
        this._ensureLoaded();
        return this.config.theme.rarity_colors[rarity] || '#666666';
    }
}

// Export for use in other modules
window.CharacterDatabase = CharacterDatabase;