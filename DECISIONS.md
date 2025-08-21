# TECHNICAL DECISIONS

Este archivo documenta las decisiones técnicas más importantes tomadas durante el desarrollo. Cada decisión incluye contexto, razonamiento e implementación real.

## Architecture & Data

### Eliminación de Power Level
**Contexto**: Usuario feedback sobre métricas irrelevantes  
**Decisión**: Remover power level completamente del sistema  
**Implementación**:
- Eliminado de sorting options
- Removido de modal stats display
- Default sort cambiado a tier ranking
- Solo mostramos: tier, name, rarity, job, total stats

### Tier-First Default Sorting
**Contexto**: Experiencia de usuario al abrir la aplicación  
**Decisión**: Ordenar por tier por defecto (S+ → S → A → B → C → D)  
**Implementación**:
- Tier order mapping: S+ = 6, S = 5, A = 4, etc.
- `currentSort = 'tier'` por defecto
- Reset filters vuelve a tier sorting

### 30 Characters Per Page
**Contexto**: Grid layout balance y feedback visual  
**Decisión**: 30 personajes por página en lugar de 24  
**Implementación**:
- `itemsPerPage = 30`
- Mejor balance visual en grid
- Más contenido por página sin saturar

## UI/UX Design

### Simplified Character Cards
**Contexto**: Cards cluttered con información excesiva  
**Decisión**: Solo mostrar imagen, nombre y estrellas  
**Implementación**:
- Removido tier badges de cards
- Removido job y stats de cards
- Focus en: portrait + name + rarity stars
- Información detallada en modal

### Premium Modal Design
**Contexto**: Vista de detalle de personaje  
**Decisión**: Modal premium con imagen prominente y stats organizadas  
**Implementación**:
- Portrait de 200x200px con frame dorado
- Tier badge grande con gradientes por tier
- 8 stat cards individuales con iconos temáticos
- Custom golden scrollbar
- Responsive design completo

### Gaming Color Palette
**Contexto**: Aesthetic gaming coherente  
**Decisión**: Tema oscuro con acentos dorados y tier colors  
**Implementación**:
- Background oscuro: `#1e1e1e`, `#2a2a2a`, `#3d3d3d`
- Golden primary: `#FFD700`, secondary: `#FFA500`
- Tier colors: S+ púrpura, S rojo, A teal, B azul, C verde, D naranja

## Performance & Technical

### Modular JavaScript Architecture
**Contexto**: Organización de código sin frameworks  
**Decisión**: ES6 modules con vanilla JavaScript  
**Implementación**:
- `CharacterDatabase.js`: Data layer
- `GalleryTab.js`: Main browsing logic
- `TabCoordinator.js`: Multi-tab management
- No dependencies, bundle pequeño

### Optimized Filter System
**Contexto**: Filtrado rápido de 243 personajes  
**Decisión**: Sistema de filtros limpio con solo filtros útiles  
**Implementación**:
- 5 filtros: Search, Tier, Job, Rarity, Sort
- Eliminados Element y Power filters (no útiles)
- Flexbox layout en lugar de grid para mejor alineación
- Debounced search con 300ms timeout

### Custom Scrollbar Implementation
**Contexto**: Modal scroll experience  
**Decisión**: Scrollbar dorada personalizada  
**Implementación**:
- `overflow-y: auto` en modal container
- Golden gradient scrollbar thumb
- 8px width para visibilidad
- Webkit prefixes para compatibilidad

### Responsive Modal System
**Contexto**: Funcionalidad en todos los dispositivos  
**Decisión**: Modal completamente responsive con scroll funcional  
**Implementación**:
- Desktop: `max-height: 90vh`
- Tablet: `max-height: 85vh`
- Mobile: layout vertical, padding optimizado
- Custom scrollbar mantiene theme gaming

## Data Structure

### Hybrid Database Approach
**Contexto**: Balance entre performance y contenido rico  
**Decisión**: JSON optimizado + Markdown files (futuro)  
**Implementación**:
- `octopath_optimized.json`: 243 personajes, 1.3MB
- Performance indexes para O(1) filtering
- 243 portraits con lazy loading
- 246 markdown files para contenido detallado (futuro)

### User Data Integration
**Contexto**: Collection tracking y favorites  
**Decisión**: Local storage para datos de usuario  
**Implementación**:
- `user_data` object en cada personaje
- `owned` y `favorite` boolean flags
- Modal buttons para toggle states
- Persistencia con localStorage

## Filter & Search Design

### Essential Filters Only
**Contexto**: User feedback sobre filtros innecesarios  
**Decisión**: Solo 5 filtros core + reset  
**Implementación**:
- Search (name), Tier, Job, Rarity, Sort, Reset
- Removidos Element y Power (no funcionales)
- Flexbox layout para alineación perfecta
- Active filter tags con remove buttons

### Flexbox Filter Layout
**Contexto**: Grid layout no se veía bien alineado  
**Decisión**: Cambiar a flexbox para mejor control  
**Implementación**:
- Search box toma 2x el espacio (`flex: 2`)
- Otros filtros equitativos (`flex: 1`)
- Reset button no se comprime (`flex-shrink: 0`)
- Responsive: stack vertical en mobile

---

**Principio**: Cada decisión se basa en user feedback, performance real o mejoras evidentes. No documentamos planes futuros, solo implementación actual.