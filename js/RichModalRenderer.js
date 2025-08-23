/**
 * RichModalRenderer.js
 * Enhanced Modal Renderer with Rich Markdown Content Integration
 * Handles tabbed interface and detailed character information display
 */

class RichModalRenderer {
    constructor(markdownIntegrator, database) {
        this.markdownIntegrator = markdownIntegrator;
        this.database = database;
        this.currentCharacter = null;
        this.currentTab = 'overview';
        this.richContent = null;
        this.isLoadingContent = false;
    }

    /**
     * Render enhanced character modal with tabbed interface
     */
    async renderEnhancedModal(character, modalContent) {
        this.currentCharacter = character;
        this.currentTab = 'overview';
        
        const tier = character.basic_info.tier?.gl || 'D';
        
        // Create the main modal structure with tabs
        modalContent.innerHTML = `
            <div class="character-modal-enhanced">
                <!-- Modal Header with Character Portrait and Basic Info -->
                <div class="modal-header-enhanced">
                    <div class="character-portrait-section">
                        <div class="portrait-frame-enhanced">
                            <img src="${this.database.getCharacterPortraitUrl(character)}" 
                                 alt="${character.basic_info.name}"
                                 class="character-portrait-large">
                            <div class="tier-badge-large tier-${tier.toLowerCase().replace('+', 'plus')}">${tier}</div>
                        </div>
                    </div>
                    
                    <div class="character-header-info">
                        <div class="character-title-section">
                            <h1 class="character-name-enhanced">${character.basic_info.name}</h1>
                            ${character.basic_info.japanese_name ? `<div class="character-japanese-name">${character.basic_info.japanese_name}</div>` : ''}
                            <div class="character-job-badge">${character.basic_info.job}</div>
                        </div>
                        
                        <div class="character-quick-stats">
                            <div class="quick-stat">
                                <span class="stat-icon">⭐</span>
                                <span class="stat-value">${'★'.repeat(character.basic_info.rarity)}</span>
                            </div>
                            <div class="quick-stat">
                                <span class="stat-icon">📍</span>
                                <span class="stat-value">${character.basic_info.location || 'Unknown'}</span>
                            </div>
                            <div class="quick-stat">
                                <span class="stat-icon">💪</span>
                                <span class="stat-value">${character.computed?.total_stats || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab Navigation -->
                <div class="modal-tabs-navigation">
                    <button class="tab-btn active" data-tab="overview">
                        <span class="tab-icon">📊</span>
                        <span class="tab-label">Overview</span>
                    </button>
                    <button class="tab-btn" data-tab="skills">
                        <span class="tab-icon">⚔️</span>
                        <span class="tab-label">Skills</span>
                        <span class="tab-loading" id="skills-loading" style="display: none;">●</span>
                    </button>
                    <button class="tab-btn" data-tab="ultimate">
                        <span class="tab-icon">💥</span>
                        <span class="tab-label">Ultimate</span>
                        <span class="tab-loading" id="ultimate-loading" style="display: none;">●</span>
                    </button>
                    <button class="tab-btn" data-tab="details">
                        <span class="tab-icon">📋</span>
                        <span class="tab-label">Details</span>
                        <span class="tab-loading" id="details-loading" style="display: none;">●</span>
                    </button>
                </div>

                <!-- Tab Content Area -->
                <div class="modal-tabs-content">
                    <div id="tab-content" class="tab-content-area">
                        ${this._renderOverviewTab(character)}
                    </div>
                </div>

                <!-- Action Buttons -->
                <div class="modal-actions-enhanced">
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

        // Setup tab navigation
        this._setupTabNavigation(modalContent);
        
        // Setup action buttons
        this._setupActionButtons(modalContent);

        // Preload markdown content in background
        this._preloadMarkdownContent();
    }

    /**
     * Render overview tab (stats and basic information)
     */
    _renderOverviewTab(character) {
        return `
            <div class="overview-tab-content">
                <!-- Base Statistics Grid -->
                <div class="stats-section-enhanced">
                    <h3 class="section-title">
                        <span class="section-icon">📊</span>
                        Base Statistics
                    </h3>
                    <div class="stats-grid-enhanced">
                        ${this._renderStatCard('❤️', 'Health Points', character.stats?.base?.hp || 0, 'hp')}
                        ${this._renderStatCard('💙', 'Skill Points', character.stats?.base?.sp || 0, 'sp')}
                        ${this._renderStatCard('⚔️', 'Physical ATK', character.stats?.base?.p_atk || 0, 'p-atk')}
                        ${this._renderStatCard('🛡️', 'Physical DEF', character.stats?.base?.p_def || 0, 'p-def')}
                        ${this._renderStatCard('✨', 'Elemental ATK', character.stats?.base?.e_atk || 0, 'e-atk')}
                        ${this._renderStatCard('🔮', 'Elemental DEF', character.stats?.base?.e_def || 0, 'e-def')}
                        ${this._renderStatCard('💥', 'Critical Rate', character.stats?.base?.crit || 0, 'crit')}
                        ${this._renderStatCard('⚡', 'Speed', character.stats?.base?.speed || 0, 'speed')}
                    </div>
                </div>

                <!-- Attributes & Weaknesses -->
                <div class="attributes-section">
                    <h3 class="section-title">
                        <span class="section-icon">🎯</span>
                        Combat Attributes
                    </h3>
                    <div class="attributes-grid">
                        <div class="attribute-group">
                            <h4 class="attribute-group-title">Weapon Types</h4>
                            <div class="attribute-tags">
                                ${(character.combat?.weapon_types || []).map(weapon => 
                                    `<span class="attribute-tag weapon-tag">${weapon}</span>`
                                ).join('')}
                            </div>
                        </div>
                        <div class="attribute-group">
                            <h4 class="attribute-group-title">Elements</h4>
                            <div class="attribute-tags">
                                ${(character.combat?.element_types || []).map(element => 
                                    `<span class="attribute-tag element-tag">${element}</span>`
                                ).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Computed Stats Summary -->
                <div class="summary-section">
                    <h3 class="section-title">
                        <span class="section-icon">📈</span>
                        Performance Summary
                    </h3>
                    <div class="summary-cards">
                        <div class="summary-card">
                            <div class="summary-label">Total Base Stats</div>
                            <div class="summary-value">${character.computed?.total_stats || 0}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Power Level</div>
                            <div class="summary-value">${character.computed?.power_level || 0}</div>
                        </div>
                        <div class="summary-card">
                            <div class="summary-label">Synergy Score</div>
                            <div class="summary-value">${character.computed?.team_synergy_score || 0}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render individual stat card
     */
    _renderStatCard(icon, label, value, type) {
        return `
            <div class="stat-card-enhanced ${type}">
                <div class="stat-icon-enhanced">${icon}</div>
                <div class="stat-info-enhanced">
                    <div class="stat-label-enhanced">${label}</div>
                    <div class="stat-value-enhanced">${value.toLocaleString()}</div>
                </div>
            </div>
        `;
    }

    /**
     * Render skills tab with passive and battle skills
     */
    async _renderSkillsTab() {
        if (!this.richContent) {
            return this._renderLoadingContent('Loading character skills...');
        }

        const { passiveSkills, battleSkills } = this.richContent.sections;

        return `
            <div class="skills-tab-content">
                <!-- Passive Skills Section -->
                <div class="skills-section">
                    <h3 class="section-title">
                        <span class="section-icon">🌟</span>
                        Passive Skills
                    </h3>
                    <div class="skills-grid">
                        ${passiveSkills.map(skill => this._renderSkillCard(skill)).join('')}
                    </div>
                </div>

                <!-- Battle Skills Section -->
                <div class="skills-section">
                    <h3 class="section-title">
                        <span class="section-icon">⚔️</span>
                        Battle Skills
                    </h3>
                    <div class="skills-grid">
                        ${battleSkills.map(skill => this._renderSkillCard(skill)).join('')}
                    </div>
                </div>

                <!-- Latent Power -->
                ${this.richContent.sections.latentPower ? `
                <div class="skills-section">
                    <h3 class="section-title">
                        <span class="section-icon">✦</span>
                        Latent Power
                    </h3>
                    <div class="latent-power-card">
                        ${this._renderLatentPowerCard(this.richContent.sections.latentPower)}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render individual skill card
     */
    _renderSkillCard(skill) {
        const fallbackIcon = this.markdownIntegrator.getFallbackIcon(skill.type);
        
        return `
            <div class="skill-card ${skill.type}-skill">
                <div class="skill-header">
                    <div class="skill-icon">
                        ${skill.icon ? `<img src="${skill.icon}" alt="Skill Icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">` : ''}
                        <span class="skill-icon-fallback" style="${skill.icon ? 'display: none;' : ''}">${fallbackIcon}</span>
                    </div>
                    <div class="skill-info">
                        <div class="skill-name">${skill.name}</div>
                        <div class="skill-meta">
                            ${skill.stars ? `<span class="skill-stars">${skill.stars}</span>` : ''}
                            ${skill.spCost ? `<span class="skill-sp">${skill.spCost} SP</span>` : ''}
                            ${skill.potency ? `<span class="skill-potency">${skill.potency}</span>` : ''}
                        </div>
                    </div>
                </div>
                <div class="skill-description">
                    ${skill.description}
                </div>
            </div>
        `;
    }

    /**
     * Render latent power card
     */
    _renderLatentPowerCard(latentPower) {
        const fallbackIcon = this.markdownIntegrator.getFallbackIcon('latent');
        
        return `
            <div class="latent-power-card-content">
                <div class="latent-header">
                    <div class="latent-icon">
                        ${latentPower.icon ? `<img src="${latentPower.icon}" alt="Latent Power Icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">` : ''}
                        <span class="latent-icon-fallback" style="${latentPower.icon ? 'display: none;' : ''}">${fallbackIcon}</span>
                    </div>
                    <div class="latent-name">${latentPower.name}</div>
                </div>
                <div class="latent-description">
                    ${latentPower.description}
                </div>
            </div>
        `;
    }

    /**
     * Render ultimate tab with ultimate technique and EX skill
     */
    async _renderUltimateTab() {
        if (!this.richContent) {
            return this._renderLoadingContent('Loading ultimate abilities...');
        }

        const { ultimateTechnique, exSkill } = this.richContent.sections;

        return `
            <div class="ultimate-tab-content">
                <!-- Ultimate Technique -->
                ${ultimateTechnique ? `
                <div class="ultimate-section">
                    <h3 class="section-title">
                        <span class="section-icon">💥</span>
                        Ultimate Technique
                    </h3>
                    <div class="ultimate-card">
                        ${this._renderUltimateTechniqueCard(ultimateTechnique)}
                    </div>
                </div>
                ` : ''}

                <!-- EX Skill -->
                ${exSkill ? `
                <div class="ultimate-section">
                    <h3 class="section-title">
                        <span class="section-icon">✨</span>
                        EX Skill
                    </h3>
                    <div class="ex-skill-card">
                        ${this._renderExSkillCard(exSkill)}
                    </div>
                </div>
                ` : ''}

                <!-- Awakening Accessory -->
                ${this.richContent.sections.awakeningAccessory ? `
                <div class="ultimate-section">
                    <h3 class="section-title">
                        <span class="section-icon">🔮</span>
                        Awakening IV Accessory
                    </h3>
                    <div class="awakening-card">
                        ${this._renderAwakeningCard(this.richContent.sections.awakeningAccessory)}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render ultimate technique card
     */
    _renderUltimateTechniqueCard(ultimate) {
        const fallbackIcon = this.markdownIntegrator.getFallbackIcon('ultimate');
        
        return `
            <div class="ultimate-technique-content">
                <div class="ultimate-header">
                    <div class="ultimate-icon">
                        ${ultimate.icon ? `<img src="${ultimate.icon}" alt="Ultimate Icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">` : ''}
                        <span class="ultimate-icon-fallback" style="${ultimate.icon ? 'display: none;' : ''}">${fallbackIcon}</span>
                    </div>
                    <div class="ultimate-info">
                        <div class="ultimate-name">${ultimate.name}</div>
                        ${ultimate.levelProgression ? `
                        <div class="ultimate-progression">
                            Level ${ultimate.levelProgression.from} → ${ultimate.levelProgression.to}
                        </div>
                        ` : ''}
                    </div>
                </div>
                
                <div class="ultimate-description">
                    ${ultimate.description}
                </div>

                ${ultimate.potencyProgression ? `
                <div class="ultimate-potency">
                    <strong>Potency:</strong> ${ultimate.potencyProgression}
                </div>
                ` : ''}

                ${ultimate.gaugeInfo ? `
                <div class="ultimate-gauge-info">
                    <div class="gauge-stats">
                        ${ultimate.gaugeInfo.uses ? `<span class="gauge-stat">Uses: ${ultimate.gaugeInfo.uses}</span>` : ''}
                        ${ultimate.gaugeInfo.initialGauge ? `<span class="gauge-stat">Initial: ${ultimate.gaugeInfo.initialGauge}</span>` : ''}
                        ${ultimate.gaugeInfo.gaugeIncrease ? `<span class="gauge-stat">Increase: ${ultimate.gaugeInfo.gaugeIncrease}</span>` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render EX skill card
     */
    _renderExSkillCard(exSkill) {
        const fallbackIcon = this.markdownIntegrator.getFallbackIcon('ex');
        
        return `
            <div class="ex-skill-content">
                <div class="ex-header">
                    <div class="ex-icon">
                        ${exSkill.icon ? `<img src="${exSkill.icon}" alt="EX Skill Icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">` : ''}
                        <span class="ex-icon-fallback" style="${exSkill.icon ? 'display: none;' : ''}">${fallbackIcon}</span>
                    </div>
                    <div class="ex-name">${exSkill.name}</div>
                </div>
                
                <div class="ex-description">
                    ${exSkill.description}
                </div>

                <div class="ex-restrictions">
                    ${exSkill.usageCondition ? `
                    <div class="ex-condition">
                        <strong>Usage Condition:</strong> ${exSkill.usageCondition}
                    </div>
                    ` : ''}
                    ${exSkill.uses ? `
                    <div class="ex-uses">
                        <strong>Uses:</strong> ${exSkill.uses}
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render awakening accessory card
     */
    _renderAwakeningCard(awakening) {
        const fallbackIcon = this.markdownIntegrator.getFallbackIcon('awakening');
        
        return `
            <div class="awakening-content">
                <div class="awakening-header">
                    <div class="awakening-icon">
                        ${awakening.icon ? `<img src="${awakening.icon}" alt="Awakening Icon" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline';">` : ''}
                        <span class="awakening-icon-fallback" style="${awakening.icon ? 'display: none;' : ''}">${fallbackIcon}</span>
                    </div>
                    <div class="awakening-name">${awakening.name}</div>
                </div>
                
                <div class="awakening-stats">
                    ${awakening.stats.map(stat => `
                        <div class="awakening-stat">${stat}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render details tab with miscellaneous information
     */
    async _renderDetailsTab() {
        if (!this.richContent) {
            return this._renderLoadingContent('Loading character details...');
        }

        const { miscInfo, artwork, differences } = this.richContent.sections;

        return `
            <div class="details-tab-content">
                <!-- Miscellaneous Information -->
                ${miscInfo ? `
                <div class="details-section">
                    <h3 class="section-title">
                        <span class="section-icon">📋</span>
                        Character Information
                    </h3>
                    <div class="details-grid">
                        ${miscInfo.availability ? `
                        <div class="detail-item">
                            <div class="detail-label">Availability</div>
                            <div class="detail-value">${miscInfo.availability}</div>
                        </div>
                        ` : ''}
                        ${miscInfo.jpReleaseDate ? `
                        <div class="detail-item">
                            <div class="detail-label">JP Release</div>
                            <div class="detail-value">${miscInfo.jpReleaseDate}</div>
                        </div>
                        ` : ''}
                        ${miscInfo.glReleaseDate ? `
                        <div class="detail-item">
                            <div class="detail-label">GL Release</div>
                            <div class="detail-value">${miscInfo.glReleaseDate}</div>
                        </div>
                        ` : ''}
                        ${miscInfo.voiceActor ? `
                        <div class="detail-item">
                            <div class="detail-label">Voice Actor</div>
                            <div class="detail-value">${miscInfo.voiceActor}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
                ` : ''}

                <!-- Artwork Section -->
                ${artwork && artwork.images.length > 0 ? `
                <div class="details-section">
                    <h3 class="section-title">
                        <span class="section-icon">🎨</span>
                        Artwork Gallery
                    </h3>
                    <div class="artwork-gallery">
                        ${artwork.images.map(image => `
                            <div class="artwork-item">
                                <img src="${image.url}" alt="${image.alt}" 
                                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                                <div class="artwork-placeholder" style="display: none;">
                                    <span>🖼️</span>
                                    <span>Artwork Unavailable</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <!-- Regional Differences -->
                ${differences ? `
                <div class="details-section">
                    <h3 class="section-title">
                        <span class="section-icon">🌍</span>
                        Regional Differences (JP vs GL)
                    </h3>
                    <div class="differences-content">
                        <div class="differences-summary">
                            ${differences.hasPassiveDifferences ? '<span class="diff-tag">Passive Skills</span>' : ''}
                            ${differences.hasBattleDifferences ? '<span class="diff-tag">Battle Skills</span>' : ''}
                            ${differences.hasUltimateDifferences ? '<span class="diff-tag">Ultimate Technique</span>' : ''}
                        </div>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render loading content placeholder
     */
    _renderLoadingContent(message) {
        return `
            <div class="loading-content">
                <div class="loading-spinner-large"></div>
                <div class="loading-message">${message}</div>
                <div class="loading-hint">Rich content is being loaded...</div>
            </div>
        `;
    }

    /**
     * Setup tab navigation functionality
     */
    _setupTabNavigation(modalContent) {
        const tabButtons = modalContent.querySelectorAll('.tab-btn');
        const tabContentArea = modalContent.querySelector('#tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const tabName = button.dataset.tab;
                
                // Update active tab
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Load tab content
                await this._loadTabContent(tabName, tabContentArea);
            });
        });
    }

    /**
     * Load content for specific tab
     */
    async _loadTabContent(tabName, contentArea) {
        this.currentTab = tabName;
        
        switch (tabName) {
            case 'overview':
                contentArea.innerHTML = this._renderOverviewTab(this.currentCharacter);
                break;
                
            case 'skills':
                if (!this.richContent) {
                    contentArea.innerHTML = this._renderLoadingContent('Loading character skills...');
                    await this._ensureMarkdownLoaded();
                }
                contentArea.innerHTML = await this._renderSkillsTab();
                break;
                
            case 'ultimate':
                if (!this.richContent) {
                    contentArea.innerHTML = this._renderLoadingContent('Loading ultimate abilities...');
                    await this._ensureMarkdownLoaded();
                }
                contentArea.innerHTML = await this._renderUltimateTab();
                break;
                
            case 'details':
                if (!this.richContent) {
                    contentArea.innerHTML = this._renderLoadingContent('Loading character details...');
                    await this._ensureMarkdownLoaded();
                }
                contentArea.innerHTML = await this._renderDetailsTab();
                break;
        }
    }

    /**
     * Ensure markdown content is loaded
     */
    async _ensureMarkdownLoaded() {
        if (!this.richContent && !this.isLoadingContent) {
            this.isLoadingContent = true;
            try {
                this.richContent = await this.markdownIntegrator.loadCharacterMarkdown(this.currentCharacter);
            } catch (error) {
                console.error('Error loading markdown content:', error);
            } finally {
                this.isLoadingContent = false;
            }
        }
    }

    /**
     * Preload markdown content in background
     */
    async _preloadMarkdownContent() {
        if (!this.richContent) {
            // Start loading in background
            this._ensureMarkdownLoaded();
        }
    }

    /**
     * Setup action button functionality
     */
    _setupActionButtons(modalContent) {
        const favoriteBtn = modalContent.querySelector('.btn-favorite');
        const ownedBtn = modalContent.querySelector('.btn-owned');
        
        favoriteBtn.addEventListener('click', () => {
            const newStatus = !(this.currentCharacter.user_data?.favorite || false);
            this.database.updateCharacterUserData(this.currentCharacter.id, { favorite: newStatus });
            
            const btnText = favoriteBtn.querySelector('.btn-text');
            btnText.textContent = newStatus ? 'Favorited' : 'Add to Favorites';
            favoriteBtn.classList.toggle('active', newStatus);
            
            this._showToast(newStatus ? 'Added to favorites' : 'Removed from favorites');
        });
        
        ownedBtn.addEventListener('click', () => {
            const newStatus = !(this.currentCharacter.user_data?.owned || false);
            this.database.updateCharacterUserData(this.currentCharacter.id, { owned: newStatus });
            
            const btnText = ownedBtn.querySelector('.btn-text');
            btnText.textContent = newStatus ? 'Owned' : 'Mark as Owned';
            ownedBtn.classList.toggle('active', newStatus);
            
            this._showToast(newStatus ? 'Marked as owned' : 'Marked as not owned');
        });
    }

    /**
     * Show toast notification
     */
    _showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        const container = document.getElementById('toast-container') || document.body;
        container.appendChild(toast);
        
        // Animate in
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Export for global use
window.RichModalRenderer = RichModalRenderer;