# CLAUDE CONTEXT - Octopath Traveler Character Database

## PROJECT OVERVIEW

You are working on a **modern gaming web application** for browsing and managing an Octopath Traveler character database. This is a multi-tab application with intelligent team building features.

### CORE OBJECTIVES
- Create an intuitive character exploration experience
- Implement smart team building with AI recommendations
- Provide comprehensive character information and analysis
- Enable collection tracking and progress management

## APPLICATION STRUCTURE

### 4 Main Tabs:
1. **📚 Biblioteca General** - Browse all available characters
2. **👑 Mi Colección** - View owned characters and collection stats
3. **⚔️ Creador de Equipos** - Manual team building with real-time analysis
4. **🤖 IA Estratega** - AI-powered team recommendations

### Technology Stack:
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Architecture**: Modular design with clean separation of concerns
- **Styling**: Gaming-themed UI with tier-based color schemes
- **Data**: JSON-based character database with image assets
- **AI**: Frontend algorithms for team optimization (with future Claude API integration)

## CHARACTER DATA STRUCTURE

Each character contains:
```javascript
{
  "basic_info": {
    "name": "string",
    "japanese_name": "string", 
    "job": "enum",
    "tier_gl": "S|A|B|C|D",
    "class": "⭐⭐⭐⭐⭐",
    "influence": "Fame|Power|Wealth",
    "continent": "string",
    "location": "string",
    "owned": boolean
  },
  "stats": {
    "base": { "hp": int, "sp": int, "p_atk": int, ... },
    "level_120": { "hp": int, "sp": int, "p_atk": int, ... }
  },
  "combat_data": {
    "weaknesses": ["Bow", "Wind", ...],
    "attributes": ["Bow", "Wind", ...],
    "resistances": { "lightning_res": int, ... }
  },
  "passive_skills": [...],
  "battle_skills": [...],
  "ultimate": { ... },
  "ex_skill": { ... },
  "awakening_accessory": { ... }
}
```

## DESIGN SYSTEM

### Gaming Color Palette:
```css
/* Tier Colors */
--tier-s: #FF6B6B;    /* Red - Legendary */
--tier-a: #4ECDC4;    /* Teal - Epic */
--tier-b: #45B7D1;    /* Blue - Rare */
--tier-c: #96CEB4;    /* Green - Common */
--tier-d: #FFEAA7;    /* Yellow - Basic */

/* Gaming Backgrounds */
--bg-primary: #1a1a2e;
--bg-secondary: #16213e;
--bg-card: rgba(22, 33, 62, 0.8);
--gold: #FFD700;
--accent: #8B5CF6;
```

### Visual Principles:
- **Gaming aesthetic** with subtle elegance, not overwhelming
- **Tier-based visual hierarchy** with color coding
- **Responsive design** that works on all devices
- **Smooth animations** and micro-interactions
- **Day/night mode** toggle for user preference

## CORE FEATURES TO IMPLEMENT

### Character Gallery:
- Responsive grid layout with character cards
- Advanced filtering (tier, job, element, owned status)
- Real-time search with fuzzy matching
- Modal detail views with complete character information
- Collection tracking with owned/favorites system

### Team Building:
- Drag & drop interface for manual team creation
- Real-time synergy analysis and coverage metrics
- Visual feedback for team composition balance
- Save/load custom team configurations

### AI Strategy System:
- Natural language challenge input
- Priority sliders for strategy preferences
- Algorithm-based team recommendations
- Strategy explanation with reasoning
- Alternative team suggestions

### State Management:
- Shared state across all tabs
- Real-time updates when data changes
- Local storage persistence
- Smooth navigation between sections

## PERFORMANCE REQUIREMENTS

- **Fast loading**: Initial render < 2 seconds
- **Smooth filtering**: Results update < 200ms
- **Responsive interactions**: All animations 60fps
- **Memory efficient**: Handle 200+ characters smoothly
- **Mobile optimized**: Touch-friendly on all devices

## USER EXPERIENCE GOALS

### Primary User Flows:
1. **Discovery**: Browse characters → View details → Mark as owned
2. **Collection**: Review owned characters → Track progress → Set goals
3. **Team Building**: Select characters → Analyze synergy → Save team
4. **Strategy**: Describe challenge → Get AI recommendation → Refine team

### Key UX Principles:
- **Intuitive navigation** between different app sections
- **Immediate feedback** for all user actions
- **Visual clarity** in data presentation
- **Accessibility** compliance for inclusive design
- **Performance** that doesn't interrupt user flow

## TECHNICAL CONSIDERATIONS

### Code Organization:
- **Modular architecture** with single responsibility modules
- **Event-driven communication** between components
- **Consistent naming conventions** and documentation
- **Error handling** with graceful degradation
- **Testing strategies** for core functionality

### Data Management:
- **Efficient JSON parsing** and indexing
- **Fast search algorithms** with caching
- **Image lazy loading** and optimization
- **State synchronization** across tabs
- **Data validation** and integrity checks

## FUTURE ENHANCEMENTS

### Phase 2 Features:
- Claude API integration for more intelligent recommendations
- Advanced analytics and team performance tracking
- Community features for sharing teams and strategies
- Export/import functionality for team configurations
- Advanced filtering with custom criteria

### Scalability Planning:
- Plugin architecture for additional features
- API integration readiness
- Multi-language support preparation
- Performance monitoring and optimization
- User preference and customization systems

---

**Remember**: Focus on creating a polished, functional gaming experience that makes character exploration and team building enjoyable and intuitive. Prioritize clean code, smooth performance, and user-centered design in every implementation.