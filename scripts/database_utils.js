const fs = require('fs');
const path = require('path');

class DatabaseUtils {
    constructor() {
        this.baseDir = path.dirname(__dirname);
        this.databaseDir = path.join(this.baseDir, 'DataBase');
        this.indexesDir = path.join(this.databaseDir, 'indexes');
        
        // Cargar datos en memoria para consultas rápidas
        this.database = null;
        this.indexes = {};
        this.config = null;
    }

    async loadDatabase() {
        if (!this.database) {
            const dbPath = path.join(this.databaseDir, 'octopath_optimized.json');
            this.database = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        }
        return this.database;
    }

    async loadIndex(indexName) {
        if (!this.indexes[indexName]) {
            const indexPath = path.join(this.indexesDir, `${indexName}.json`);
            this.indexes[indexName] = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
        }
        return this.indexes[indexName];
    }

    async loadConfig() {
        if (!this.config) {
            const configPath = path.join(this.databaseDir, 'config', 'frontend_config.json');
            this.config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        }
        return this.config;
    }

    // Consultas de personajes por filtros
    async getCharactersByJob(job) {
        const index = await this.loadIndex('by_job');
        return index[job] || [];
    }

    async getCharactersByTier(tier) {
        const index = await this.loadIndex('by_tier');
        return index[tier] || [];
    }

    async getCharactersByElement(element) {
        const index = await this.loadIndex('by_element');
        return index[element] || [];
    }

    async getCharactersByRarity(rarity) {
        const index = await this.loadIndex('by_rarity');
        return index[rarity] || [];
    }

    // Búsqueda por texto
    async searchCharacters(query, limit = 20) {
        const searchIndex = await this.loadIndex('search_terms');
        const results = new Set();
        
        const queryLower = query.toLowerCase();
        
        // Buscar coincidencias exactas primero
        if (searchIndex.terms[queryLower]) {
            searchIndex.terms[queryLower].forEach(id => results.add(id));
        }
        
        // Buscar coincidencias parciales
        Object.keys(searchIndex.terms).forEach(term => {
            if (term.includes(queryLower)) {
                searchIndex.terms[term].forEach(id => results.add(id));
            }
        });
        
        // Convertir IDs a información de personajes
        const charactersInfo = Array.from(results)
            .slice(0, limit)
            .map(id => ({
                id,
                ...searchIndex.characters[id]
            }));
            
        return charactersInfo;
    }

    // Obtener synergias de un personaje
    async getCharacterSynergies(characterId, limit = 10) {
        const synergyMap = await this.loadIndex('synergy_map');
        return synergyMap[characterId]?.slice(0, limit) || [];
    }

    // Recomendaciones de team building
    async getTeamRecommendations(characterIds, teamSize = 8) {
        if (!Array.isArray(characterIds) || characterIds.length === 0) {
            throw new Error('Se requiere al menos un personaje para las recomendaciones');
        }

        const database = await this.loadDatabase();
        const synergyMap = await this.loadIndex('synergy_map');
        
        // Obtener personajes actuales
        const currentTeam = characterIds.map(id => 
            database.characters.find(char => char.id === id)
        ).filter(Boolean);

        if (currentTeam.length === 0) {
            throw new Error('No se encontraron personajes válidos');
        }

        // Calcular candidatos basados en synergias
        const candidates = new Map();
        
        currentTeam.forEach(teamChar => {
            const synergies = synergyMap[teamChar.id] || [];
            synergies.forEach(synergy => {
                if (!characterIds.includes(synergy.character_id)) {
                    const existingScore = candidates.get(synergy.character_id) || 0;
                    candidates.set(synergy.character_id, existingScore + synergy.synergy_score);
                }
            });
        });

        // Ordenar candidatos por score total
        const sortedCandidates = Array.from(candidates.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, teamSize - currentTeam.length);

        // Obtener información completa de candidatos
        const recommendations = sortedCandidates.map(([characterId, totalScore]) => {
            const character = database.characters.find(char => char.id === characterId);
            return {
                character_id: characterId,
                name: character?.basic_info.name || 'Unknown',
                job: character?.basic_info.job || 'Unknown',
                tier_gl: character?.basic_info.tier.gl || 'Unknown',
                total_synergy_score: totalScore,
                power_level: character?.computed.power_level || 0
            };
        });

        return {
            current_team: currentTeam.map(char => ({
                id: char.id,
                name: char.basic_info.name,
                job: char.basic_info.job
            })),
            recommendations: recommendations
        };
    }

    // Análisis de team actual
    async analyzeTeam(characterIds) {
        const database = await this.loadDatabase();
        
        const team = characterIds.map(id => 
            database.characters.find(char => char.id === id)
        ).filter(Boolean);

        if (team.length === 0) {
            throw new Error('No se encontraron personajes válidos en el team');
        }

        // Análisis de composición
        const analysis = {
            team_size: team.length,
            job_distribution: {},
            tier_distribution: {},
            element_coverage: new Set(),
            weakness_coverage: new Set(),
            total_power_level: 0,
            average_power_level: 0,
            synergy_analysis: {}
        };

        // Calcular distribuciones
        team.forEach(char => {
            const job = char.basic_info.job;
            const tier = char.basic_info.tier.gl;
            
            analysis.job_distribution[job] = (analysis.job_distribution[job] || 0) + 1;
            analysis.tier_distribution[tier] = (analysis.tier_distribution[tier] || 0) + 1;
            
            char.combat.element_types.forEach(elem => analysis.element_coverage.add(elem));
            char.combat.attributes.forEach(attr => analysis.weakness_coverage.add(attr));
            
            analysis.total_power_level += char.computed.power_level;
        });

        analysis.average_power_level = Math.floor(analysis.total_power_level / team.length);
        analysis.element_coverage = Array.from(analysis.element_coverage);
        analysis.weakness_coverage = Array.from(analysis.weakness_coverage);

        // Análisis de synergias internas
        const synergyMap = await this.loadIndex('synergy_map');
        let totalSynergyScore = 0;
        let synergyPairs = 0;

        team.forEach(char => {
            const synergies = synergyMap[char.id] || [];
            synergies.forEach(synergy => {
                if (characterIds.includes(synergy.character_id)) {
                    totalSynergyScore += synergy.synergy_score;
                    synergyPairs++;
                }
            });
        });

        analysis.synergy_analysis = {
            total_synergy_score: totalSynergyScore,
            synergy_pairs: synergyPairs,
            average_pair_synergy: synergyPairs > 0 ? Math.floor(totalSynergyScore / synergyPairs) : 0
        };

        return analysis;
    }

    // Top personajes por categoría
    async getTopCharacters(category = 'power_level', limit = 10) {
        const ranking = await this.loadIndex('performance_ranking');
        
        switch (category) {
            case 'power_level':
                return ranking.overall.slice(0, limit);
            case 'gl_score':
                return ranking.overall
                    .sort((a, b) => b.gl_score - a.gl_score)
                    .slice(0, limit);
            case 'jp_score':
                return ranking.overall
                    .sort((a, b) => b.jp_score - a.jp_score)
                    .slice(0, limit);
            default:
                return ranking.overall.slice(0, limit);
        }
    }

    // Top personajes por job
    async getTopCharactersByJob(job, limit = 5) {
        const ranking = await this.loadIndex('performance_ranking');
        return ranking.by_job[job]?.slice(0, limit) || [];
    }

    // Estadísticas generales
    async getDatabaseStats() {
        const database = await this.loadDatabase();
        const config = await this.loadConfig();
        
        return {
            total_characters: database.characters.length,
            jobs: config.filter_options.jobs,
            elements: config.filter_options.elements,
            rarities: config.filter_options.rarities,
            tiers: config.filter_options.tiers,
            job_distribution: config.statistics.jobs_distribution,
            tier_distribution: config.statistics.tier_distribution,
            rarity_distribution: config.statistics.rarity_distribution,
            element_distribution: config.statistics.element_distribution
        };
    }

    // Obtener personaje completo por ID
    async getCharacterById(characterId) {
        const database = await this.loadDatabase();
        return database.characters.find(char => char.id === characterId) || null;
    }

    // Obtener múltiples personajes por IDs
    async getCharactersByIds(characterIds) {
        const database = await this.loadDatabase();
        return characterIds.map(id => 
            database.characters.find(char => char.id === id)
        ).filter(Boolean);
    }

    // Filtro avanzado
    async filterCharacters(filters) {
        const database = await this.loadDatabase();
        
        return database.characters.filter(char => {
            // Filtro por job
            if (filters.job && char.basic_info.job !== filters.job) {
                return false;
            }
            
            // Filtro por tier
            if (filters.tier && char.basic_info.tier.gl !== filters.tier) {
                return false;
            }
            
            // Filtro por rarity
            if (filters.rarity && char.basic_info.rarity !== filters.rarity) {
                return false;
            }
            
            // Filtro por elemento
            if (filters.element && !char.combat.element_types.includes(filters.element)) {
                return false;
            }
            
            // Filtro por power level mínimo
            if (filters.min_power_level && char.computed.power_level < filters.min_power_level) {
                return false;
            }
            
            // Filtro por owned
            if (filters.owned !== undefined && char.meta.owned !== filters.owned) {
                return false;
            }
            
            return true;
        });
    }

    // Validación de integridad
    async validateDatabaseIntegrity() {
        const database = await this.loadDatabase();
        const issues = [];
        
        database.characters.forEach(char => {
            // Validar campos requeridos
            if (!char.id) issues.push(`Missing ID: ${char.basic_info?.name || 'Unknown'}`);
            if (!char.basic_info?.name) issues.push(`Missing name: ${char.id}`);
            if (!char.basic_info?.job) issues.push(`Missing job: ${char.basic_info?.name}`);
            
            // Validar stats
            if (!char.stats?.level_120) issues.push(`Missing level 120 stats: ${char.basic_info?.name}`);
            
            // Validar assets
            if (!char.assets?.portrait) issues.push(`Missing portrait: ${char.basic_info?.name}`);
        });
        
        return {
            is_valid: issues.length === 0,
            issues: issues,
            total_characters: database.characters.length,
            checked_at: new Date().toISOString()
        };
    }
}

// Funciones de utilidad para usar desde línea de comandos
async function main() {
    const utils = new DatabaseUtils();
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
        console.log('Uso: node database_utils.js <comando> [argumentos]');
        console.log('\nComandos disponibles:');
        console.log('  stats                    - Mostrar estadísticas generales');
        console.log('  search <query>           - Buscar personajes');
        console.log('  job <job_name>           - Listar personajes por job');
        console.log('  tier <tier>              - Listar personajes por tier');
        console.log('  top [category] [limit]   - Top personajes');
        console.log('  synergy <character_id>   - Obtener synergias');
        console.log('  team <id1,id2,...>       - Analizar team');
        console.log('  recommend <id1,id2,...>  - Recomendar personajes para team');
        console.log('  validate                 - Validar integridad de la base de datos');
        return;
    }

    try {
        const command = args[0];
        
        switch (command) {
            case 'stats':
                const stats = await utils.getDatabaseStats();
                console.log(JSON.stringify(stats, null, 2));
                break;
                
            case 'search':
                if (!args[1]) throw new Error('Se requiere query de búsqueda');
                const results = await utils.searchCharacters(args[1], args[2] ? parseInt(args[2]) : 10);
                console.log(JSON.stringify(results, null, 2));
                break;
                
            case 'job':
                if (!args[1]) throw new Error('Se requiere nombre de job');
                const jobChars = await utils.getCharactersByJob(args[1]);
                console.log(JSON.stringify(jobChars, null, 2));
                break;
                
            case 'tier':
                if (!args[1]) throw new Error('Se requiere tier');
                const tierChars = await utils.getCharactersByTier(args[1]);
                console.log(JSON.stringify(tierChars, null, 2));
                break;
                
            case 'top':
                const category = args[1] || 'power_level';
                const limit = args[2] ? parseInt(args[2]) : 10;
                const topChars = await utils.getTopCharacters(category, limit);
                console.log(JSON.stringify(topChars, null, 2));
                break;
                
            case 'synergy':
                if (!args[1]) throw new Error('Se requiere character_id');
                const synergies = await utils.getCharacterSynergies(args[1]);
                console.log(JSON.stringify(synergies, null, 2));
                break;
                
            case 'team':
                if (!args[1]) throw new Error('Se requiere lista de character_ids separados por coma');
                const teamIds = args[1].split(',').map(id => id.trim());
                const teamAnalysis = await utils.analyzeTeam(teamIds);
                console.log(JSON.stringify(teamAnalysis, null, 2));
                break;
                
            case 'recommend':
                if (!args[1]) throw new Error('Se requiere lista de character_ids separados por coma');
                const currentTeamIds = args[1].split(',').map(id => id.trim());
                const recommendations = await utils.getTeamRecommendations(currentTeamIds);
                console.log(JSON.stringify(recommendations, null, 2));
                break;
                
            case 'validate':
                const validation = await utils.validateDatabaseIntegrity();
                console.log(JSON.stringify(validation, null, 2));
                break;
                
            default:
                throw new Error(`Comando desconocido: ${command}`);
        }
        
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main();
}

module.exports = DatabaseUtils;