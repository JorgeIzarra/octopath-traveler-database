# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Gaming Web Application** for managing an **Octopath Traveler Character Database**. The application uses a **hybrid architecture** combining optimized JSON data for fast navigation with rich markdown content for detailed character information. Features include character browsing, team building, collection tracking, and AI-powered strategic recommendations.

## Project Structure

```
octopath-analizer/
├── DataBase/
│   ├── octopath_optimized.json      # Main optimized database (1.3MB, 243 characters)
│   ├── Personajes Markdown/         # Rich character details (246 markdown files)
│   │   ├── [character_name].md      # EX Skills, Voice Actors, Release Dates
│   │   └── ...                      # Awakening Accessories, Detailed Skills
│   ├── indexes/                     # Performance indexes for O(1) lookups
│   │   ├── by_job.json             # Job-based character grouping
│   │   ├── by_tier.json            # Tier rankings (S-D)
│   │   ├── by_element.json         # Elemental affinities
│   │   ├── by_rarity.json          # Star ratings (3-5)
│   │   ├── search_terms.json       # Optimized search index
│   │   ├── synergy_map.json        # Team building synergies
│   │   ├── performance_ranking.json # Power level rankings
│   │   └── index_master.json       # Index coordination
│   ├── config/
│   │   └── frontend_config.json    # UI configuration (colors, filters, presets)
│   └── [legacy files preserved]    # Original backup databases
├── scripts/
│   ├── migrate_database.js         # Database migration tool
│   └── database_utils.js           # CLI utilities for development
├── Imagenes - Octopath/
│   └── portraits/                  # 243 character portrait images (100% complete)
├── js/ ✅ IMPLEMENTED
│   ├── TabCoordinator.js           # Multi-tab state management ✅
│   ├── CharacterDatabase.js        # Data layer API ✅
│   ├── GalleryTab.js              # Character browsing ✅
│   ├── CollectionTab.js           # User collection tracking (placeholder)
│   ├── TeamBuilderTab.js          # Team composition (placeholder)
│   ├── AIStrategyTab.js           # AI recommendations (placeholder)
│   └── app.js                     # Application entry point ✅
├── index.html                     # Main interface (4-tab structure)
├── styles.css                     # Current styling
├── PROJECT_LOG.md                 # Development progress log
├── DECISIONS.md                   # Technical decisions record
└── migration_report.json          # Database migration results
```

## Current Project Status

### ✅ **COMPLETED: Data Foundation (100%)**
- **243 characters** successfully migrated and optimized
- **246 markdown files** with rich character details (EX Skills, Voice Actors, etc.)
- **243 character images** (100% coverage) with standardized naming
- **8 specialized indexes** for instant filtering and O(1) lookups
- **CLI utilities** for database management and validation
- **Hybrid architecture** implemented: Fast JSON + Rich Markdown ready

### ✅ **COMPLETED: Phase 1 - Foundation (100%)**
**Gallery Manager Implementation:**
- ✅ **Character Gallery System** - Grid view with 30 items per page
- ✅ **Advanced Filtering** - Search, Tier, Job, Rarity, Sort filters
- ✅ **Search Functionality** - Real-time search with 300ms debouncing
- ✅ **Database Integration** - O(1) filtering using specialized indexes
- ✅ **Character Cards** - Simplified cards (image, name, stars only)
- ✅ **Premium Modal System** - Detailed character view with stats and actions
- ✅ **Responsive Design** - Mobile-optimized grid layouts
- ✅ **User Data Persistence** - Favorite and owned status with localStorage

**Visual Design Implementation:**
- ✅ **Gaming Color Palette** - Dark theme with golden accents (#FFD700)
- ✅ **Tier-based Visual System** - S+ (purple), S (red), A (teal), B (blue), C (green), D (orange)
- ✅ **Premium Modal Design** - 200px portraits, tier badges, stat cards
- ✅ **Enhanced Typography** - Cinzel for headings, Inter for body text
- ✅ **Smooth Animations** - Hover transitions, custom golden scrollbar

**Technical Features:**
- ✅ **Flexbox Filter Layout** - Clean 5-filter system with perfect alignment
- ✅ **Modal Scroll System** - Custom golden scrollbar with webkit prefixes
- ✅ **Tier-First Sorting** - Default sort by tier (S+ → S → A → B → C → D)
- ✅ **Active Filter Tags** - Visual feedback with removable filter chips
- ✅ **Error Handling** - Loading states, empty states, error recovery

### 🚧 **NEXT PHASES:**
2. **Rich content integration** (`markdown-integrator` agent) - Detailed modals with EX Skills
3. **User collection tracking** (`collection-tracker` agent) - Progress & achievements
4. **Advanced features** (`module-architect` + `ai-strategist` agents)
5. **Final integration** (`tab-coordinator` agent) - Cross-tab synchronization

## Database Schema

The optimized database uses a unified structure:

```json
{
  "metadata": {
    "version": "1.0",
    "character_count": 243,
    "last_updated": "2025-08-06"
  },
  "characters": [
    {
      "id": "unique_character_id",
      "basic_info": {
        "name": "Character Name",
        "japanese_name": "日本語名",
        "job": "Hunter|Scholar|Warrior|...",
        "tier": {"gl": "S|A|B|C|D", "jp": "S|A|B|C|D"},
        "rarity": 3|4|5,
        "location": "Game Location",
        "obtained_from": "Acquisition Method"
      },
      "assets": {
        "portrait": "Imagenes - Octopath/portraits/name.png"
      },
      "stats": {
        "base": { /* Level 1 stats */ },
        "level_120": { /* Max level stats */ }
      },
      "combat": {
        "attributes": ["Fire", "Bow"],
        "weaknesses": ["Water", "Staff"],
        "weapon_types": ["bow", "staff"],
        "element_types": ["fire", "light"]
      },
      "computed": {
        "total_stats": 2901,
        "power_level": 67,
        "search_terms": ["optimized", "search", "array"],
        "team_synergy_score": 75,
        "ai_tags": ["dps", "fire_specialist", "ranged"]
      },
      "user_data": {
        "owned": false,
        "favorite": false,
        "notes": ""
      }
    }
  ]
}
```

## Development Utilities

### CLI Commands
```bash
# Database queries
node scripts/database_utils.js search "ochette"
node scripts/database_utils.js job "Hunter"
node scripts/database_utils.js tier "S"

# Team building
node scripts/database_utils.js team "ochette,scarecrow,lynette"
node scripts/database_utils.js recommend "ochette,scarecrow"
node scripts/database_utils.js synergy "ochette"

# Analytics
node scripts/database_utils.js top power_level 10
node scripts/database_utils.js stats
node scripts/database_utils.js validate
```

### Migration Script
```bash
# Re-run database migration if needed
node scripts/migrate_database.js
```

## Agent-Based Development Strategy

### 🎯 **Specialized Agents Available:**

1. **data-processor** ✅ *Completed*
   - Database optimization and migration
   - Index creation and performance tuning
   - Data validation and integrity checks

2. **gallery-manager** ✅ *Completed*
   - Character gallery with advanced filtering (using indexes)
   - Search functionality with debounced matching
   - Simplified character cards for clean design
   - Premium modal with stats and user actions

3. **markdown-integrator** 🔥 *High Priority - Phase 1*
   - Rich content parsing from markdown files
   - Detailed character modals with EX Skills
   - Voice Actor, Release Date, and Artwork display
   - Lazy loading and intelligent caching

4. **ui-designer** ✅ *Completed*
   - Gaming aesthetics with dark theme and golden accents
   - Tier-based color schemes (S+=purple, S=red, A=teal, etc.)
   - Smooth animations and hover transitions
   - Responsive design with flexbox layouts

5. **collection-tracker** ⚡ *Medium Priority - Phase 2*
   - Owned/favorite character tracking
   - Collection progress and achievement system
   - Personal notes and rating system
   - Import/export and statistics dashboard

6. **module-architect** ⚡ *Medium Priority - Phase 3*
   - Modular JavaScript architecture
   - State management system
   - Component reusability and scalability
   - Performance optimization

7. **ai-strategist** ⚡ *Medium Priority - Phase 3*
   - Team composition algorithms with EX Skills
   - Weakness coverage analysis
   - Character synergy calculations
   - Strategic recommendations

8. **tab-coordinator** 📋 *Lower Priority - Phase 4*
   - Multi-tab state synchronization
   - Smooth navigation transitions
   - Cross-tab data consistency

## Key Features

### **Hybrid Data Architecture**
- **Level 1**: Fast navigation with optimized JSON (243 characters)
- **Level 2**: Rich details with markdown parsing (246 detailed profiles)
- **O(1) filtering** using 8 specialized indexes
- **100% visual coverage** with character portraits

### **Character Management**
- Browse 243 characters with instant filtering
- Advanced search with fuzzy matching
- **Detailed modals** with EX Skills, Voice Actors, Release Dates
- Collection tracking with progress analytics
- Favorite characters and personal notes

### **Team Building**
- 8-character team composition
- **EX Skills integration** for advanced synergy analysis
- Weakness coverage analysis
- Saved team presets with detailed builds
- Owned-characters-only mode

### **AI Strategy**
- Purpose-driven team recommendations
- **EX Skills-aware** strategic analysis
- Playstyle optimization (aggressive, defensive, balanced)
- Difficulty-based suggestions
- Collection-based recommendations

### **Performance Features**
- O(1) lookup times for all filters
- Optimized search with pre-computed terms
- Efficient rendering with pagination
- Local storage persistence

## Technical Standards

### **Code Organization**
- ES6 modules with clear separation of concerns
- Configuration-driven UI from `frontend_config.json`
- Consistent error handling and validation
- Performance monitoring and optimization

### **Data Access Patterns**
```javascript
// HYBRID ARCHITECTURE: Fast + Rich Data

// Level 1: Fast navigation (optimized JSON)
const database = await fetch('DataBase/octopath_optimized.json');
const hunterIndex = await fetch('DataBase/indexes/by_job.json');
const hunters = hunterIndex.Hunter; // O(1) lookup

// Level 2: Rich details (markdown lazy loading)
const detailedInfo = await fetch(`DataBase/Personajes Markdown/${characterName}.md`);
const parsedContent = await markdownProcessor.parse(detailedInfo);

// Search with pre-computed terms
const searchIndex = await fetch('DataBase/indexes/search_terms.json');
const results = searchIndex.filter(term => term.includes(query));
```

### **Asset Management**
- Character portraits: `Imagenes - Octopath/portraits/{name}.png` (243 files, 100% coverage)
- Markdown assets: Rich content with artwork, icons, and videos
- Consistent naming conventions (standardized)
- Image lazy loading for performance
- Fallback system for edge cases

## Development Workflow

### **Completed Milestones**
1. ✅ Database analysis and optimization (243 characters)
2. ✅ Data migration with 100% integrity
3. ✅ Performance indexes created (8 specialized indexes)
4. ✅ Character images complete (243 files, 100% coverage)
5. ✅ Rich markdown content analyzed (246 files with unique data)
6. ✅ CLI utilities implemented and tested
7. ✅ Hybrid architecture designed
8. ✅ Agent specifications created (8 total agents)

### **Implementation Roadmap**
**Phase 1**: Foundation (gallery-manager + markdown-integrator)
**Phase 2**: Visual Design (ui-designer + collection-tracker)
**Phase 3**: Advanced Features (module-architect + ai-strategist)
**Phase 4**: Integration (tab-coordinator + final polish)

### **Quality Assurance**
- Data validation with CLI utilities
- Performance benchmarking
- Cross-browser compatibility testing
- Mobile responsiveness verification

## Project Statistics

- **Characters:** 243 total
- **Jobs:** 8 classes (Warrior, Hunter, Scholar, etc.)
- **Tiers:** S (16), A (27), B (22), C+D (remaining)
- **Rarities:** 5★ (176), 4★ (43), 3★ (24)
- **Elements:** Fire (64), Light (54), Dark (52), Water, Wind
- **Images:** 243 portraits (100% complete coverage)
- **Markdown Files:** 246 rich character profiles with unique content

---

## Important Instructions for Claude

### **Agent Implementation Status & Next Steps**

**✅ Phase 1 - Foundation (100% COMPLETED):**
1. **gallery-manager** ✅ → Character grid, filters, search, premium modals
2. **ui-designer** ✅ → Gaming visual design, tier colors, animations, scrollbar

**🎯 Phase 2 - Rich Content & Collections (NEXT):**
3. **markdown-integrator** 🔥 → Rich content parsing for detailed character modals
4. **collection-tracker** 📊 → User collection management and progress tracking

**📋 Phase 3 - Advanced Features:**
5. **module-architect** → Scalable JavaScript architecture optimization
6. **ai-strategist** → Team recommendations with EX Skills integration

**📋 Phase 4 - Final Integration:**
7. **tab-coordinator** → Multi-tab state synchronization and polish

### **Hybrid Data Handling**
- **Fast navigation**: Use optimized database `DataBase/octopath_optimized.json`
- **Rich details**: Parse markdown files `DataBase/Personajes Markdown/`
- **Instant filtering**: Leverage indexes `DataBase/indexes/by_*.json`
- **Development**: Use CLI utilities `node scripts/database_utils.js`
- **User data**: Preserve structure for collection tracking
- **Performance**: Implement lazy loading for markdown content

### **Development Standards**
- Follow the established modular architecture
- Use configuration from `frontend_config.json`
- Implement responsive design for all screen sizes
- Maintain performance with large datasets
- Ensure accessibility standards compliance

### **File Modifications**
- NEVER modify original database files (preserved as backups)
- Always test changes with CLI utilities first
- Update PROJECT_LOG.md with significant changes
- Document technical decisions in DECISIONS.md

---

**Last Updated:** 2025-08-21 (Current Session - Documentation Updated)  
**Data Status:** 100% Complete (243 characters + images + markdown)  
**Architecture:** Hybrid (Fast JSON + Rich Markdown) - IMPLEMENTED  
**Phase 1 Status:** ✅ COMPLETED - Gallery with premium design and filtering  
**Agents Used:** gallery-manager ✅, ui-designer ✅ (2/8 agents)  
**Current State:** Production-ready character browsing with premium modal system  
**Next Milestone:** markdown-integrator for rich character details