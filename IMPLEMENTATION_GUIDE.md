# CharacterCard Component - Implementation Guide

## 🎯 Objetivo
Crear el primer componente reutilizable del sistema Component Library, empezando por `CharacterCard` que se utilizará en múltiples tabs y será la base para futuras expansiones.

---

## 📋 Especificaciones del Componente

### **CharacterCard Features**

```javascript
class CharacterCard {
    constructor(character, options = {}) {
        this.character = character;
        this.options = {
            // Variants
            variant: 'gallery',           // 'gallery' | 'collection' | 'team-builder' | 'detailed'
            
            // Display Options
            showFavorite: true,           // Show favorite heart icon
            showOwned: true,              // Show owned indicator
            clickable: true,              // Make card clickable
            draggable: false,             // Enable drag & drop
            
            // Size Options
            size: 'medium',               // 'small' | 'medium' | 'large'
            
            // Future Expansion Options
            showSkills: false,            // Show EX Skills
            showVoiceActor: false,        // Show voice actor
            showStats: false,             // Show detailed stats
            expandable: false,            // Collapsible card
            
            // Event Handlers
            onCardClick: null,            // Click handler
            onFavoriteClick: null,        // Favorite button handler
            onOwnedChange: null,          // Owned status change
            
            ...options
        };
        
        this.element = null;
        this.isInitialized = false;
    }
}
```

### **API Methods**

```javascript
// Core Methods
card.render()                    // Returns DOM element
card.mount(container)            // Mount to container
card.unmount()                   // Remove from DOM
card.destroy()                   // Clean up events

// State Management
card.updateCharacter(character)  // Update character data
card.setOwned(isOwned)          // Update owned status
card.setFavorite(isFavorite)    // Update favorite status
card.updateOptions(newOptions)   // Update component options

// Events
card.on('click', handler)        // Event subscription
card.off('click', handler)       // Event unsubscription
card.emit('customEvent', data)   // Custom event emission
```

### **Variant Specifications**

#### **Gallery Variant**
```javascript
new CharacterCard(character, {
    variant: 'gallery',
    showFavorite: true,
    showOwned: true,
    clickable: true,
    size: 'medium'
});
```
- **Display**: Image, name, tier badge, rarity stars
- **Actions**: Click to open modal, favorite toggle, owned toggle
- **Styling**: Card with hover effects, tier-based border colors

#### **Collection Variant**
```javascript
new CharacterCard(character, {
    variant: 'collection',
    showStats: true,
    showProgress: true,
    size: 'large'
});
```
- **Display**: All gallery elements + basic stats + collection progress
- **Actions**: Same as gallery + quick stat view
- **Styling**: Extended card with stat bars

#### **Team Builder Variant**
```javascript
new CharacterCard(character, {
    variant: 'team-builder',
    draggable: true,
    showSynergy: true,
    size: 'small'
});
```
- **Display**: Compact view with synergy indicators
- **Actions**: Drag & drop, synergy info tooltip
- **Styling**: Smaller card optimized for team slots

#### **Future: Detailed Variant**
```javascript
new CharacterCard(character, {
    variant: 'detailed',
    showSkills: true,
    showVoiceActor: true,
    expandable: true,
    size: 'large'
});
```
- **Display**: Full character information including EX Skills
- **Actions**: Expand/collapse, skill details
- **Styling**: Rich card with markdown integration

---

## 🏗️ Implementation Strategy

### **Phase 1: Core Component (Día 1)**

```javascript
// js/components/CharacterCard.js
class CharacterCard {
    constructor(character, options = {}) {
        // Initialize basic structure
        // Set up default options
        // Prepare for rendering
    }
    
    render() {
        // Create DOM structure
        // Apply styling classes
        // Attach event listeners
        // Return element
    }
    
    _createCardStructure() {
        // Build HTML structure based on variant
    }
    
    _attachEventListeners() {
        // Handle clicks, hovers, etc.
    }
    
    _updateVisualState() {
        // Update owned/favorite indicators
        // Apply tier colors
        // Handle animations
    }
}
```

### **Phase 2: Integration (Día 1)**

```javascript
// Modify js/GalleryTab.js
import CharacterCard from './components/CharacterCard.js';

class GalleryTab {
    _renderCharacterCard(character) {
        // OLD: HTML string template
        // NEW: Component-based approach
        
        const card = new CharacterCard(character, {
            variant: 'gallery',
            onCardClick: (char) => this._showCharacterModal(char),
            onFavoriteClick: (char, isFav) => this._updateFavorite(char, isFav),
            onOwnedChange: (char, isOwned) => this._updateOwned(char, isOwned)
        });
        
        return card.render();
    }
}
```

### **Phase 3: Testing & Validation (Día 2)**

```javascript
// Test scenarios
const testScenarios = [
    // Basic functionality
    { character: sampleCharacter, options: { variant: 'gallery' } },
    
    // Different sizes
    { character: sampleCharacter, options: { size: 'small' } },
    { character: sampleCharacter, options: { size: 'large' } },
    
    // Different states
    { character: ownedCharacter, options: { showOwned: true } },
    { character: favoriteCharacter, options: { showFavorite: true } },
    
    // Edge cases
    { character: characterWithoutImage, options: {} },
    { character: characterLongName, options: {} }
];
```

---

## 💾 File Structure

### **New Files to Create**

```
js/components/
├── CharacterCard.js              # Main component
├── CharacterCard.css             # Component-specific styles
└── components.js                 # Component registry/exports

js/components/base/
├── BaseComponent.js              # Shared component functionality
└── EventEmitter.js               # Event system
```

### **Files to Modify**

```
js/GalleryTab.js                  # Integrate CharacterCard
index.html                        # Add component script
styles.css                        # Add component styles (if needed)
```

---

## 🎨 Styling Strategy

### **Component-Scoped CSS**

```css
/* CharacterCard.css */
.character-card-component {
    /* Base styles */
}

.character-card-component.variant-gallery {
    /* Gallery-specific styles */
}

.character-card-component.variant-collection {
    /* Collection-specific styles */
}

.character-card-component.size-small {
    /* Small size styles */
}

/* Maintain existing CSS variables for theming */
.character-card-component {
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--card-foreground);
}
```

### **Integration with Current Theme**

- ✅ **Mantener**: Sistema de variables CSS existente
- ✅ **Reutilizar**: Clases de tier colors actuales
- ✅ **Extender**: Añadir nuevas classes específicas del componente

---

## 🧪 Testing Plan

### **Manual Testing Checklist**

```markdown
## Basic Functionality
- [ ] Card renders correctly with character data
- [ ] Image loads properly (with fallback)
- [ ] Name and tier display correctly
- [ ] Stars show proper rarity

## Interactive Features
- [ ] Click opens character modal
- [ ] Favorite button toggles state
- [ ] Owned indicator works properly
- [ ] Hover effects function

## Visual States
- [ ] Tier colors applied correctly
- [ ] Light/dark theme compatibility
- [ ] Responsive behavior on mobile
- [ ] Loading state handling

## Edge Cases
- [ ] Missing character image
- [ ] Very long character names
- [ ] Characters without tier data
- [ ] Network loading delays
```

### **Automated Tests (Future)**

```javascript
// Basic unit tests for when we add testing framework
describe('CharacterCard', () => {
    test('renders with character data', () => {
        const card = new CharacterCard(mockCharacter);
        expect(card.render()).toBeDefined();
    });
    
    test('handles click events', () => {
        const clickHandler = jest.fn();
        const card = new CharacterCard(mockCharacter, {
            onCardClick: clickHandler
        });
        // Test click simulation
    });
});
```

---

## 🚀 Migration Strategy

### **Safe Implementation Process**

1. **Create Parallel**: Build component alongside existing code
2. **Test Isolated**: Verify component works independently
3. **Gradual Replace**: Replace one tab at a time
4. **Verify Functionality**: Ensure no feature regression
5. **Clean Legacy**: Remove old code after successful migration

### **Rollback Plan**

If something goes wrong:
```javascript
// Keep old code commented for quick rollback
class GalleryTab {
    _renderCharacterCard(character) {
        // NEW: Component approach
        try {
            const card = new CharacterCard(character, options);
            return card.render();
        } catch (error) {
            console.error('CharacterCard failed, falling back:', error);
            // FALLBACK: Original template approach
            return this._renderCharacterCardLegacy(character);
        }
    }
    
    // Keep original method as fallback
    _renderCharacterCardLegacy(character) {
        // Original implementation
    }
}
```

---

## 🔮 Future Expansion Readiness

### **Markdown Integration Ready**

```javascript
// When we add rich content from markdown files
new CharacterCard(character, {
    variant: 'detailed',
    showSkills: true,           // From markdown files
    showVoiceActor: true,       // From markdown files
    showArtwork: true,          // Multiple images
    markdownContent: richData   // Parsed markdown content
});
```

### **Advanced Filtering Ready**

```javascript
// Component can be filtered/sorted by any property
const filterableCards = characters.map(char => 
    new CharacterCard(char, {
        searchable: true,         // Enable search highlighting
        filterable: true,         // Enable filter matching
        sortable: true           // Enable sort comparison
    })
);
```

### **Animation Ready**

```javascript
// Built-in animation support for future enhancements
new CharacterCard(character, {
    animations: {
        enter: 'fadeInUp',       // Card appearance
        exit: 'fadeOutDown',     // Card removal
        hover: 'bounce',         // Hover interaction
        click: 'pulse'          // Click feedback
    }
});
```

---

## ✅ Success Criteria

### **Must Have (Phase 1)**
- [x] CharacterCard renders all current information
- [ ] Works in GalleryTab without breaking functionality
- [ ] Maintains current visual design
- [ ] Light/dark theme compatibility
- [ ] Mobile responsive

### **Should Have (Phase 2)**
- [ ] Event system working properly
- [ ] Performance equal or better than current
- [ ] Easy to use API for developers
- [ ] Documentation complete

### **Nice to Have (Future)**
- [ ] Animation system
- [ ] Advanced customization options
- [ ] Automated tests
- [ ] Storybook documentation

---

**Próximo paso:** Implementar `CharacterCard` component siguiendo esta guía paso a paso.