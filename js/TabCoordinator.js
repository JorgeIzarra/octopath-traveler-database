/**
 * TabCoordinator.js
 * Multi-tab state management and navigation coordinator
 * Handles tab switching, state persistence, and cross-tab communication
 */

class TabCoordinator {
    constructor() {
        this.activeTab = 'gallery';
        this.tabs = new Map();
        this.tabHistory = ['gallery'];
        this.isInitialized = false;
        
        // DOM element references
        this.elements = {};
    }

    /**
     * Initialize the tab coordinator with navigation and state management
     */
    init() {
        if (this.isInitialized) return;
        
        this._cacheElements();
        this._setupEventListeners();
        this._loadTabState();
        this._initializeActiveTab();
        
        this.isInitialized = true;
        console.log('✅ Tab coordinator initialized');
    }

    /**
     * Cache frequently used DOM elements
     */
    _cacheElements() {
        this.elements = {
            tabButtons: document.querySelectorAll('.tab-button'),
            tabPanels: document.querySelectorAll('.tab-panel'),
            
            // Individual tab elements
            galleryTab: document.getElementById('gallery-tab'),
            collectionTab: document.getElementById('collection-tab'),
            teamsTab: document.getElementById('teams-tab'),
            aiTab: document.getElementById('ai-tab'),
            
            galleryPanel: document.getElementById('gallery-panel'),
            collectionPanel: document.getElementById('collection-panel'),
            teamsPanel: document.getElementById('teams-panel'),
            aiPanel: document.getElementById('ai-panel'),
            
            // Badge elements for counters
            collectionBadge: document.getElementById('collection-badge'),
            teamsBadge: document.getElementById('teams-badge')
        };
    }

    /**
     * Setup tab navigation event listeners
     */
    _setupEventListeners() {
        // Tab button clicks
        this.elements.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabId = e.currentTarget.dataset.tab;
                this.switchToTab(tabId);
            });
        });

        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case '1':
                        e.preventDefault();
                        this.switchToTab('gallery');
                        break;
                    case '2':
                        e.preventDefault();
                        this.switchToTab('collection');
                        break;
                    case '3':
                        e.preventDefault();
                        this.switchToTab('teams');
                        break;
                    case '4':
                        e.preventDefault();
                        this.switchToTab('ai');
                        break;
                }
            }
            
            // Tab navigation with Alt + Arrow keys
            if (e.altKey) {
                switch (e.key) {
                    case 'ArrowLeft':
                        e.preventDefault();
                        this._navigateToPreviousTab();
                        break;
                    case 'ArrowRight':
                        e.preventDefault();
                        this._navigateToNextTab();
                        break;
                }
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.tab) {
                this.switchToTab(e.state.tab, false);
            }
        });

        // Save state before page unload
        window.addEventListener('beforeunload', () => {
            this._saveTabState();
        });
    }

    /**
     * Register a tab instance with the coordinator
     * @param {string} tabId - Tab identifier
     * @param {Object} tabInstance - Tab class instance
     */
    registerTab(tabId, tabInstance) {
        this.tabs.set(tabId, tabInstance);
        console.log(`📋 Tab registered: ${tabId}`);
    }

    /**
     * Switch to a specific tab
     * @param {string} tabId - Target tab identifier
     * @param {boolean} updateHistory - Whether to update browser history
     */
    switchToTab(tabId, updateHistory = true) {
        if (tabId === this.activeTab) return;
        
        const previousTab = this.activeTab;
        
        // Validate tab exists
        if (!this._isValidTab(tabId)) {
            console.warn(`Invalid tab ID: ${tabId}`);
            return;
        }

        try {
            // Notify current tab it's becoming inactive
            this._onTabDeactivate(previousTab);
            
            // Update UI
            this._updateTabUI(tabId);
            
            // Update active tab
            this.activeTab = tabId;
            
            // Update history
            if (updateHistory) {
                this._updateTabHistory(tabId);
                this._updateBrowserHistory(tabId);
            }
            
            // Notify new tab it's becoming active
            this._onTabActivate(tabId);
            
            // Save state
            this._saveTabState();
            
            console.log(`🔄 Switched to tab: ${tabId}`);
            
        } catch (error) {
            console.error(`Error switching to tab ${tabId}:`, error);
        }
    }

    /**
     * Update tab UI elements (buttons and panels)
     */
    _updateTabUI(activeTabId) {
        // Update tab buttons
        this.elements.tabButtons.forEach(button => {
            const tabId = button.dataset.tab;
            const isActive = tabId === activeTabId;
            
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', isActive.toString());
        });

        // Update tab panels
        this.elements.tabPanels.forEach(panel => {
            const tabId = panel.id.replace('-panel', '');
            const isActive = tabId === activeTabId;
            
            panel.classList.toggle('active', isActive);
            
            if (isActive) {
                panel.setAttribute('aria-hidden', 'false');
            } else {
                panel.setAttribute('aria-hidden', 'true');
            }
        });
    }

    /**
     * Handle tab activation
     */
    _onTabActivate(tabId) {
        const tabInstance = this.tabs.get(tabId);
        if (tabInstance && typeof tabInstance.onActivate === 'function') {
            tabInstance.onActivate();
        }

        // Lazy load tab if not initialized
        if (tabInstance && typeof tabInstance.init === 'function' && !tabInstance.isInitialized) {
            tabInstance.init().catch(error => {
                console.error(`Failed to initialize ${tabId} tab:`, error);
            });
        }

        // Update document title
        this._updateDocumentTitle(tabId);
        
        // Trigger any tab-specific analytics
        this._trackTabView(tabId);
    }

    /**
     * Handle tab deactivation
     */
    _onTabDeactivate(tabId) {
        const tabInstance = this.tabs.get(tabId);
        if (tabInstance && typeof tabInstance.onDeactivate === 'function') {
            tabInstance.onDeactivate();
        }
    }

    /**
     * Navigate to previous tab in history
     */
    _navigateToPreviousTab() {
        if (this.tabHistory.length > 1) {
            // Find current tab position
            const currentIndex = this.tabHistory.lastIndexOf(this.activeTab);
            if (currentIndex > 0) {
                const previousTab = this.tabHistory[currentIndex - 1];
                this.switchToTab(previousTab);
            }
        }
    }

    /**
     * Navigate to next tab in sequence
     */
    _navigateToNextTab() {
        const tabOrder = ['gallery', 'collection', 'teams', 'ai'];
        const currentIndex = tabOrder.indexOf(this.activeTab);
        const nextIndex = (currentIndex + 1) % tabOrder.length;
        this.switchToTab(tabOrder[nextIndex]);
    }

    /**
     * Update browser history for tab navigation
     */
    _updateBrowserHistory(tabId) {
        const url = new URL(window.location);
        url.searchParams.set('tab', tabId);
        
        const state = { tab: tabId };
        history.pushState(state, '', url.toString());
    }

    /**
     * Update internal tab history
     */
    _updateTabHistory(tabId) {
        // Remove existing occurrences of this tab from history
        this.tabHistory = this.tabHistory.filter(tab => tab !== tabId);
        
        // Add to end of history
        this.tabHistory.push(tabId);
        
        // Keep history manageable (last 10 tabs)
        if (this.tabHistory.length > 10) {
            this.tabHistory = this.tabHistory.slice(-10);
        }
    }

    /**
     * Update document title based on active tab
     */
    _updateDocumentTitle(tabId) {
        const tabTitles = {
            gallery: 'Character Gallery',
            collection: 'My Collection',
            teams: 'Team Builder',
            ai: 'AI Strategy'
        };
        
        const tabTitle = tabTitles[tabId] || 'Character Database';
        document.title = `${tabTitle} - Octopath Traveler Database`;
    }

    /**
     * Track tab view for analytics (placeholder for future implementation)
     */
    _trackTabView(tabId) {
        // This can be extended to track user behavior
        console.log(`📊 Tab view: ${tabId}`);
    }

    /**
     * Validate if tab ID is valid
     */
    _isValidTab(tabId) {
        const validTabs = ['gallery', 'collection', 'teams', 'ai'];
        return validTabs.includes(tabId);
    }

    /**
     * Initialize the active tab from URL parameters or saved state
     */
    _initializeActiveTab() {
        // Check URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        const urlTab = urlParams.get('tab');
        
        if (urlTab && this._isValidTab(urlTab)) {
            this.switchToTab(urlTab, false);
        } else {
            // Use saved state or default
            this.switchToTab(this.activeTab, false);
        }
    }

    /**
     * Save tab state to localStorage
     */
    _saveTabState() {
        const state = {
            activeTab: this.activeTab,
            tabHistory: this.tabHistory,
            timestamp: Date.now()
        };
        
        try {
            localStorage.setItem('octopath_tab_state', JSON.stringify(state));
        } catch (error) {
            console.warn('Failed to save tab state:', error);
        }
    }

    /**
     * Load tab state from localStorage
     */
    _loadTabState() {
        try {
            const saved = localStorage.getItem('octopath_tab_state');
            if (saved) {
                const state = JSON.parse(saved);
                
                // Only use saved state if it's recent (within 24 hours)
                const maxAge = 24 * 60 * 60 * 1000; // 24 hours
                if (Date.now() - state.timestamp < maxAge) {
                    this.activeTab = state.activeTab || 'gallery';
                    this.tabHistory = state.tabHistory || ['gallery'];
                }
            }
        } catch (error) {
            console.warn('Failed to load tab state:', error);
        }
    }

    /**
     * Update badge counters on tabs
     */
    updateTabBadges() {
        // This will be called by other tab instances to update counters
        // Implementation will be completed when CollectionTab and TeamBuilderTab are ready
        
        // Placeholder for now
        if (this.elements.collectionBadge) {
            this.elements.collectionBadge.textContent = '0';
        }
        
        if (this.elements.teamsBadge) {
            this.elements.teamsBadge.textContent = '0';
        }
    }

    /**
     * Broadcast message to all tabs
     */
    broadcastToTabs(message, data = null) {
        this.tabs.forEach((tabInstance, tabId) => {
            if (typeof tabInstance.onMessage === 'function') {
                tabInstance.onMessage(message, data);
            }
        });
    }

    /**
     * Get current active tab
     */
    getActiveTab() {
        return this.activeTab;
    }

    /**
     * Get tab instance by ID
     */
    getTab(tabId) {
        return this.tabs.get(tabId);
    }

    /**
     * Check if tab is active
     */
    isTabActive(tabId) {
        return this.activeTab === tabId;
    }

    /**
     * Get tab navigation history
     */
    getTabHistory() {
        return [...this.tabHistory];
    }
}

// Export for global use
window.TabCoordinator = TabCoordinator;