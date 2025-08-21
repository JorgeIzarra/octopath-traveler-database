/**
 * app.js
 * Main Application Entry Point
 * Initializes the Octopath Traveler Character Database application
 */

class OctopathApp {
    constructor() {
        this.database = null;
        this.tabCoordinator = null;
        this.tabs = {};
        this.isInitialized = false;
    }

    /**
     * Initialize the entire application
     */
    async init() {
        if (this.isInitialized) return;

        try {
            console.log('🚀 Initializing Octopath Traveler Character Database...');
            
            // Show loading screen
            this._showLoading();
            
            // Initialize database
            await this._initializeDatabase();
            
            // Initialize tab coordinator
            this._initializeTabCoordinator();
            
            // Initialize individual tabs
            await this._initializeTabs();
            
            // Setup global event handlers
            this._setupGlobalHandlers();
            
            // Initialize active tab
            this._initializeActiveTab();
            
            // Hide loading screen
            this._hideLoading();
            
            // Update UI with database stats
            this._updateGlobalStats();
            
            this.isInitialized = true;
            console.log('✅ Application initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize application:', error);
            this._showError(error.message);
        }
    }

    /**
     * Initialize the character database
     */
    async _initializeDatabase() {
        this.database = new CharacterDatabase();
        await this.database.init();
        
        // Load user data from localStorage
        this.database._loadUserData();
    }

    /**
     * Initialize tab coordination system
     */
    _initializeTabCoordinator() {
        this.tabCoordinator = new TabCoordinator();
        this.tabCoordinator.init();
        
        // Make globally accessible for debugging
        window.tabCoordinator = this.tabCoordinator;
    }

    /**
     * Initialize all tab instances
     */
    async _initializeTabs() {
        // Create tab instances
        this.tabs.gallery = new GalleryTab(this.database);
        this.tabs.collection = new CollectionTab(this.database);
        this.tabs.teams = new TeamBuilderTab(this.database);
        this.tabs.ai = new AIStrategyTab(this.database);
        
        // Register tabs with coordinator
        this.tabCoordinator.registerTab('gallery', this.tabs.gallery);
        this.tabCoordinator.registerTab('collection', this.tabs.collection);
        this.tabCoordinator.registerTab('teams', this.tabs.teams);
        this.tabCoordinator.registerTab('ai', this.tabs.ai);
        
        // Initialize the gallery tab immediately (it's the default)
        await this.tabs.gallery.init();
        
        // Make tabs globally accessible for debugging
        window.galleryTab = this.tabs.gallery;
        window.collectionTab = this.tabs.collection;
        window.teamBuilderTab = this.tabs.teams;
        window.aiStrategyTab = this.tabs.ai;
    }

    /**
     * Initialize the currently active tab
     */
    _initializeActiveTab() {
        // The tab coordinator handles this automatically
        // but we can add any app-specific logic here
    }

    /**
     * Setup global event handlers
     */
    _setupGlobalHandlers() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Global search shortcut (Ctrl/Cmd + K)
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this._focusSearch();
            }
        });

        // Handle window resize for responsive updates
        window.addEventListener('resize', this._debounce(() => {
            this._handleResize();
        }, 250));

        // Handle online/offline status
        window.addEventListener('online', () => {
            this._showToast('Connection restored');
        });

        window.addEventListener('offline', () => {
            this._showToast('You are offline. Some features may be limited.', 'warning');
        });

        // Prevent form submission on Enter key in search fields
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.target.matches('input[type="text"], input[type="search"]')) {
                e.preventDefault();
            }
        });
    }

    /**
     * Update global statistics in the header
     */
    _updateGlobalStats() {
        const stats = this.database.getStatistics();
        
        // Update collection count in header
        const collectionCount = document.getElementById('collection-count');
        if (collectionCount) {
            const ownedCount = this._getOwnedCharacterCount();
            collectionCount.textContent = `${ownedCount}/${stats.total_characters}`;
        }
        
        // Update team count (placeholder for now)
        const teamCount = document.getElementById('team-count');
        if (teamCount) {
            teamCount.textContent = '0'; // Will be updated by TeamBuilderTab
        }
    }

    /**
     * Get count of owned characters
     */
    _getOwnedCharacterCount() {
        const characters = this.database.getAllCharacters();
        return characters.filter(char => char.user_data?.owned === true).length;
    }

    /**
     * Focus the search input in the active tab
     */
    _focusSearch() {
        const activeTab = this.tabCoordinator.getActiveTab();
        
        if (activeTab === 'gallery') {
            const searchInput = document.getElementById('character-search');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        } else if (activeTab === 'teams') {
            const teamSearchInput = document.getElementById('team-character-search');
            if (teamSearchInput) {
                teamSearchInput.focus();
                teamSearchInput.select();
            }
        }
    }

    /**
     * Handle window resize events
     */
    _handleResize() {
        // Trigger resize handling in active tab
        const activeTab = this.tabCoordinator.getActiveTab();
        const tabInstance = this.tabCoordinator.getTab(activeTab);
        
        if (tabInstance && typeof tabInstance.onResize === 'function') {
            tabInstance.onResize();
        }
    }

    /**
     * Show loading screen
     */
    _showLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    /**
     * Hide loading screen
     */
    _hideLoading() {
        const loadingOverlay = document.getElementById('loading-overlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    /**
     * Show error screen
     */
    _showError(message) {
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div class="error-screen">
                    <div class="error-content">
                        <div class="error-icon">⚠️</div>
                        <h2>Application Error</h2>
                        <p>${message}</p>
                        <button class="btn-primary" onclick="location.reload()">
                            Reload Application
                        </button>
                    </div>
                </div>
            `;
        }
    }

    /**
     * Show toast notification
     */
    _showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
            
            // Animate in
            setTimeout(() => toast.classList.add('show'), 100);
            
            // Remove after 4 seconds
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (container.contains(toast)) {
                        container.removeChild(toast);
                    }
                }, 300);
            }, 4000);
        }
    }

    /**
     * Utility function for debouncing events
     */
    _debounce(func, wait) {
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
     * Get application instance (singleton pattern)
     */
    static getInstance() {
        if (!window.octopathApp) {
            window.octopathApp = new OctopathApp();
        }
        return window.octopathApp;
    }

    /**
     * Public API for other scripts to access app functionality
     */
    getDatabase() {
        return this.database;
    }

    getTabCoordinator() {
        return this.tabCoordinator;
    }

    getTab(tabId) {
        return this.tabs[tabId];
    }

    updateStats() {
        this._updateGlobalStats();
        this.tabCoordinator.updateTabBadges();
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = OctopathApp.getInstance();
    await app.init();
});

// Export for global access
window.OctopathApp = OctopathApp;