const fs = require('fs');
const path = require('path');

class DatabaseMigrator {
    constructor() {
        this.baseDir = path.dirname(__dirname);
        this.databaseDir = path.join(this.baseDir, 'DataBase');
        this.outputDir = this.databaseDir;
        this.indexesDir = path.join(this.databaseDir, 'indexes');
        this.configDir = path.join(this.databaseDir, 'config');
        this.portraitsDir = path.join(this.baseDir, 'Imagenes - Octopath', 'portraits');
        
        // Contadores para validación
        this.stats = {
            totalCharacters: 0,
            processedCharacters: 0,
            missingPortraits: [],
            errors: [],
            startTime: new Date()
        };
    }

    async migrate() {
        try {
            console.log('🚀 Iniciando migración de base de datos Octopath...\n');
            
            // Crear directorios necesarios
            this.createDirectories();
            
            // Cargar datos existentes
            const rawData = await this.loadExistingData();
            
            // Procesar y normalizar datos
            const optimizedData = await this.processData(rawData);
            
            // Generar base de datos optimizada
            await this.generateOptimizedDatabase(optimizedData);
            
            // Generar índices
            await this.generateIndexes(optimizedData.characters);
            
            // Generar configuración frontend
            await this.generateFrontendConfig(optimizedData.characters);
            
            // Validar datos migrados
            await this.validateMigration(optimizedData);
            
            // Generar reporte final
            this.generateReport();
            
            console.log('✅ Migración completada exitosamente!');
            
        } catch (error) {
            console.error('❌ Error durante la migración:', error.message);
            this.stats.errors.push(error.message);
            throw error;
        }
    }

    createDirectories() {
        [this.indexesDir, this.configDir].forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
                console.log(`📁 Creado directorio: ${dir}`);
            }
        });
    }

    async loadExistingData() {
        console.log('📚 Cargando archivos JSON existentes...');
        
        const files = [
            'octopath_compact.json',
            'octopath_complete_database.json', 
            'octopath_skills_database.json'
        ];

        const data = {};
        
        for (const file of files) {
            const filePath = path.join(this.databaseDir, file);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                data[file] = JSON.parse(content);
                console.log(`✓ Cargado: ${file} (${(content.length / 1024 / 1024).toFixed(2)} MB)`);
            } catch (error) {
                console.error(`❌ Error cargando ${file}:`, error.message);
                this.stats.errors.push(`Error cargando ${file}: ${error.message}`);
            }
        }

        return data;
    }

    async processData(rawData) {
        console.log('\n🔄 Procesando y normalizando datos...');

        const compact = rawData['octopath_compact.json'] || [];
        const complete = rawData['octopath_complete_database.json']?.characters || [];
        const skills = rawData['octopath_skills_database.json']?.characters || [];

        // Crear mapa de personajes por nombre para cruzar datos
        const completeMap = new Map();
        const skillsMap = new Map();

        complete.forEach(char => {
            completeMap.set(char.basic_info?.name || char.name, char);
        });

        skills.forEach(char => {
            skillsMap.set(char.name, char);
        });

        const optimizedCharacters = [];
        this.stats.totalCharacters = compact.length;

        // Verificar portraits disponibles
        const availablePortraits = this.getAvailablePortraits();

        for (const compactChar of compact) {
            try {
                const completeChar = completeMap.get(compactChar.name);
                const skillsChar = skillsMap.get(compactChar.name);

                const optimizedChar = this.mergeCharacterData(
                    compactChar, 
                    completeChar, 
                    skillsChar, 
                    availablePortraits
                );

                optimizedCharacters.push(optimizedChar);
                this.stats.processedCharacters++;

                if (this.stats.processedCharacters % 50 === 0) {
                    console.log(`⚙️  Procesados ${this.stats.processedCharacters}/${this.stats.totalCharacters} personajes`);
                }

            } catch (error) {
                console.error(`❌ Error procesando ${compactChar.name}:`, error.message);
                this.stats.errors.push(`Error procesando ${compactChar.name}: ${error.message}`);
            }
        }

        return {
            metadata: {
                export_date: new Date().toISOString(),
                total_characters: optimizedCharacters.length,
                data_source: "Migración automática desde 3 archivos fuente",
                version: "3.0.0-optimized",
                migration_date: new Date().toISOString(),
                features: [
                    "Estructura unificada y optimizada",
                    "Campos calculados para IA",
                    "Índices de búsqueda optimizados", 
                    "Validación de integridad de imágenes",
                    "Team building synergies",
                    "Frontend configuration ready"
                ]
            },
            characters: optimizedCharacters
        };
    }

    getAvailablePortraits() {
        try {
            return fs.readdirSync(this.portraitsDir)
                .filter(file => file.endsWith('.png'))
                .map(file => file.replace('.png', ''));
        } catch (error) {
            console.warn('⚠️  No se pudo leer directorio de portraits');
            return [];
        }
    }

    mergeCharacterData(compact, complete, skills, availablePortraits) {
        const name = compact.name;
        const nameLower = name.toLowerCase();
        
        // Buscar imagen disponible
        let portraitFile = null;
        const possibleNames = [name, nameLower, name.replace(/\s+/g, '').toLowerCase()];
        
        for (const possibleName of possibleNames) {
            if (availablePortraits.includes(possibleName)) {
                portraitFile = `${possibleName}.png`;
                break;
            }
        }

        if (!portraitFile) {
            this.stats.missingPortraits.push(name);
            portraitFile = 'default.png'; // Fallback
        }

        // Estructura optimizada unificada
        return {
            // Identificador único
            id: this.generateUniqueId(name),
            
            // Información básica
            basic_info: {
                name: name,
                display_name: name,
                japanese_name: compact.japanese_name || complete?.basic_info?.japanese_name || "",
                job: compact.job,
                tier: {
                    gl: compact.tier_gl,
                    jp: compact.tier_jp
                },
                rarity: this.parseRarity(compact.class),
                influence: complete?.basic_info?.influence || "",
                continent: complete?.basic_info?.continent || "",
                location: compact.location || complete?.basic_info?.location || "",
                obtained_from: compact.obtained_from || ""
            },

            // Assets de imágenes
            assets: {
                portrait: `Imagenes - Octopath/portraits/${portraitFile}`,
                icon: `Imagenes - Octopath/portraits/${portraitFile}`,
                artwork: `Imagenes - Octopath/portraits/${portraitFile}`
            },

            // Stats unificados
            stats: {
                base: complete?.stats?.base || this.calculateBaseStats(compact.stats_120),
                level_120: compact.stats_120,
                awakened: complete?.stats?.awakened || null
            },

            // Habilidades y skills
            skills: {
                passive_skills: skills?.passive_skills || complete?.skills?.passive || [],
                active_skills: skills?.active_skills || complete?.skills?.active || [],
                ultimate: skills?.ultimate || complete?.skills?.ultimate || null,
                ex_skill: skills?.ex_skill || complete?.skills?.ex || null
            },

            // Elementos y weaknesses
            combat: {
                attributes: compact.attributes || [],
                weaknesses: compact.weaknesses || [],
                weapon_types: this.extractWeaponTypes(compact.attributes || []),
                element_types: this.extractElementTypes(compact.attributes || [])
            },

            // Campos calculados para IA y optimización
            computed: {
                total_stats: this.calculateTotalStats(compact.stats_120),
                stat_distribution: this.calculateStatDistribution(compact.stats_120),
                power_level: this.calculatePowerLevel(compact),
                search_terms: this.generateSearchTerms(name, compact.job, compact.japanese_name),
                team_synergy_score: this.calculateTeamSynergyScore(compact),
                ai_tags: this.generateAITags(compact, complete, skills),
                performance_score: {
                    gl: compact.gl_score || 0,
                    jp: compact.jp_score || 0
                },
                element_count: (compact.attributes || []).length,
                skill_count: this.countTotalSkills(skills, complete)
            },

            // Metadatos
            meta: {
                owned: compact.owned || false,
                ultimate_priority: compact.ultimate_priority || "",
                last_updated: new Date().toISOString(),
                data_completeness: this.calculateDataCompleteness(compact, complete, skills)
            }
        };
    }

    // Métodos auxiliares para cálculos
    generateUniqueId(name) {
        return name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    parseRarity(classStr) {
        if (!classStr) return 1;
        return (classStr.match(/⭐️/g) || []).length;
    }

    calculateBaseStats(stats120) {
        // Estimación aproximada de stats base (nivel 1)
        const baseMultiplier = 0.3;
        const result = {};
        
        Object.entries(stats120 || {}).forEach(([key, value]) => {
            result[key] = Math.floor(value * baseMultiplier);
        });
        
        return result;
    }

    extractWeaponTypes(attributes) {
        const weapons = ['Sword', 'Dagger', 'Axe', 'Bow', 'Staff', 'Tome', 'Fan'];
        return attributes.filter(attr => weapons.includes(attr));
    }

    extractElementTypes(attributes) {
        const elements = ['Fire', 'Ice', 'Thunder', 'Wind', 'Light', 'Dark'];
        return attributes.filter(attr => elements.includes(attr));
    }

    calculateTotalStats(stats) {
        if (!stats) return 0;
        return Object.values(stats).reduce((sum, val) => sum + (val || 0), 0);
    }

    calculateStatDistribution(stats) {
        if (!stats) return {};
        
        const total = this.calculateTotalStats(stats);
        const distribution = {};
        
        Object.entries(stats).forEach(([key, value]) => {
            distribution[key] = total > 0 ? ((value || 0) / total * 100).toFixed(2) + '%' : '0%';
        });
        
        return distribution;
    }

    calculatePowerLevel(compact) {
        const rarity = this.parseRarity(compact.class);
        const totalStats = this.calculateTotalStats(compact.stats_120);
        const tierMultiplier = this.getTierMultiplier(compact.tier_gl);
        
        return Math.floor((totalStats * rarity * tierMultiplier) / 1000);
    }

    getTierMultiplier(tier) {
        const multipliers = { 'S': 2.0, 'A': 1.5, 'B': 1.2, 'C': 1.0, 'D': 0.8 };
        return multipliers[tier] || 1.0;
    }

    generateSearchTerms(name, job, japaneseName) {
        const terms = [
            name.toLowerCase(),
            job.toLowerCase(),
            ...name.toLowerCase().split(' ')
        ];
        
        if (japaneseName) {
            terms.push(japaneseName);
        }
        
        return [...new Set(terms)].filter(term => term.length > 0);
    }

    calculateTeamSynergyScore(compact) {
        // Algoritmo básico de synergy basado en elementos y job
        let score = 0;
        
        // Bonus por versatilidad de elementos
        score += (compact.attributes || []).length * 10;
        
        // Bonus por job específicos
        const synergisticJobs = ['Dancer', 'Cleric', 'Scholar'];
        if (synergisticJobs.includes(compact.job)) {
            score += 25;
        }
        
        return Math.min(score, 100);
    }

    generateAITags(compact, complete, skills) {
        const tags = [];
        
        // Tags por job
        tags.push(`job_${compact.job.toLowerCase()}`);
        
        // Tags por tier
        tags.push(`tier_${compact.tier_gl?.toLowerCase()}`);
        
        // Tags por elementos
        (compact.attributes || []).forEach(attr => {
            tags.push(`element_${attr.toLowerCase()}`);
        });
        
        // Tags por rarity
        const rarity = this.parseRarity(compact.class);
        tags.push(`rarity_${rarity}`);
        
        // Tags especiales
        if (compact.ultimate_priority?.includes('Priority')) {
            tags.push('high_priority');
        }
        
        if ((compact.gl_score || 0) >= 8) {
            tags.push('meta_relevant');
        }
        
        return [...new Set(tags)];
    }

    countTotalSkills(skills, complete) {
        let count = 0;
        
        if (skills) {
            count += (skills.passive_skills || []).length;
            count += (skills.active_skills || []).length;
            if (skills.ultimate) count += 1;
            if (skills.ex_skill) count += 1;
        } else if (complete) {
            count += (complete.skills?.passive || []).length;
            count += (complete.skills?.active || []).length;
            if (complete.skills?.ultimate) count += 1;
            if (complete.skills?.ex) count += 1;
        }
        
        return count;
    }

    calculateDataCompleteness(compact, complete, skills) {
        let completeness = 0;
        let total = 0;
        
        // Campos básicos requeridos
        ['name', 'job', 'class', 'tier_gl'].forEach(field => {
            total++;
            if (compact[field]) completeness++;
        });
        
        // Stats
        total++;
        if (compact.stats_120) completeness++;
        
        // Datos extendidos
        total++;
        if (complete) completeness++;
        
        // Skills
        total++;
        if (skills) completeness++;
        
        return Math.floor((completeness / total) * 100);
    }

    async generateOptimizedDatabase(optimizedData) {
        console.log('\n💾 Generando base de datos optimizada...');
        
        const outputPath = path.join(this.outputDir, 'octopath_optimized.json');
        
        try {
            fs.writeFileSync(outputPath, JSON.stringify(optimizedData, null, 2));
            const sizeKB = Math.floor(fs.statSync(outputPath).size / 1024);
            console.log(`✓ Base de datos optimizada guardada: ${sizeKB} KB`);
        } catch (error) {
            throw new Error(`Error guardando base de datos optimizada: ${error.message}`);
        }
    }

    async generateIndexes(characters) {
        console.log('\n📇 Generando índices optimizados...');

        const indexes = {
            by_job: this.createJobIndex(characters),
            by_tier: this.createTierIndex(characters), 
            by_element: this.createElementIndex(characters),
            by_rarity: this.createRarityIndex(characters),
            search_terms: this.createSearchIndex(characters),
            synergy_map: this.createSynergyMap(characters),
            performance_ranking: this.createPerformanceRanking(characters)
        };

        // Guardar cada índice por separado
        for (const [indexName, indexData] of Object.entries(indexes)) {
            const filePath = path.join(this.indexesDir, `${indexName}.json`);
            fs.writeFileSync(filePath, JSON.stringify(indexData, null, 2));
            console.log(`✓ Índice creado: ${indexName}.json`);
        }

        // Crear índice maestro
        const masterIndex = {
            created_at: new Date().toISOString(),
            total_characters: characters.length,
            available_indexes: Object.keys(indexes),
            index_stats: {
                jobs: Object.keys(indexes.by_job).length,
                tiers: Object.keys(indexes.by_tier).length,
                elements: Object.keys(indexes.by_element).length,
                rarities: Object.keys(indexes.by_rarity).length,
                search_terms: indexes.search_terms.terms.length
            }
        };

        fs.writeFileSync(
            path.join(this.indexesDir, 'index_master.json'),
            JSON.stringify(masterIndex, null, 2)
        );

        console.log('✓ Índice maestro creado: index_master.json');
    }

    createJobIndex(characters) {
        const jobIndex = {};
        
        characters.forEach(char => {
            const job = char.basic_info.job;
            if (!jobIndex[job]) {
                jobIndex[job] = [];
            }
            jobIndex[job].push({
                id: char.id,
                name: char.basic_info.name,
                tier_gl: char.basic_info.tier.gl,
                power_level: char.computed.power_level
            });
        });

        // Ordenar por tier y power level
        Object.keys(jobIndex).forEach(job => {
            jobIndex[job].sort((a, b) => {
                const tierOrder = { 'S': 5, 'A': 4, 'B': 3, 'C': 2, 'D': 1 };
                const tierDiff = (tierOrder[b.tier_gl] || 0) - (tierOrder[a.tier_gl] || 0);
                return tierDiff !== 0 ? tierDiff : b.power_level - a.power_level;
            });
        });

        return jobIndex;
    }

    createTierIndex(characters) {
        const tierIndex = {};
        
        characters.forEach(char => {
            const tier = char.basic_info.tier.gl;
            if (!tierIndex[tier]) {
                tierIndex[tier] = [];
            }
            tierIndex[tier].push({
                id: char.id,
                name: char.basic_info.name,
                job: char.basic_info.job,
                power_level: char.computed.power_level
            });
        });

        // Ordenar por power level
        Object.keys(tierIndex).forEach(tier => {
            tierIndex[tier].sort((a, b) => b.power_level - a.power_level);
        });

        return tierIndex;
    }

    createElementIndex(characters) {
        const elementIndex = {};
        
        characters.forEach(char => {
            char.combat.element_types.forEach(element => {
                if (!elementIndex[element]) {
                    elementIndex[element] = [];
                }
                elementIndex[element].push({
                    id: char.id,
                    name: char.basic_info.name,
                    job: char.basic_info.job,
                    all_elements: char.combat.element_types
                });
            });
        });

        return elementIndex;
    }

    createRarityIndex(characters) {
        const rarityIndex = {};
        
        characters.forEach(char => {
            const rarity = char.basic_info.rarity;
            if (!rarityIndex[rarity]) {
                rarityIndex[rarity] = [];
            }
            rarityIndex[rarity].push({
                id: char.id,
                name: char.basic_info.name,
                job: char.basic_info.job,
                tier_gl: char.basic_info.tier.gl
            });
        });

        return rarityIndex;
    }

    createSearchIndex(characters) {
        const searchTerms = {};
        const characterMap = {};
        
        characters.forEach(char => {
            // Mapear personaje por ID
            characterMap[char.id] = {
                name: char.basic_info.name,
                job: char.basic_info.job,
                japanese_name: char.basic_info.japanese_name
            };
            
            // Indexar términos de búsqueda
            char.computed.search_terms.forEach(term => {
                if (!searchTerms[term]) {
                    searchTerms[term] = [];
                }
                searchTerms[term].push(char.id);
            });
        });

        return {
            terms: searchTerms,
            characters: characterMap
        };
    }

    createSynergyMap(characters) {
        const synergyMap = {};
        
        characters.forEach(char => {
            const synergies = [];
            
            // Encontrar synergias basadas en elementos compartidos
            characters.forEach(otherChar => {
                if (char.id !== otherChar.id) {
                    const sharedElements = char.combat.element_types.filter(
                        elem => otherChar.combat.element_types.includes(elem)
                    );
                    
                    if (sharedElements.length > 0) {
                        synergies.push({
                            character_id: otherChar.id,
                            shared_elements: sharedElements,
                            synergy_score: this.calculatePairSynergy(char, otherChar)
                        });
                    }
                }
            });
            
            // Ordenar por synergy score
            synergies.sort((a, b) => b.synergy_score - a.synergy_score);
            
            synergyMap[char.id] = synergies.slice(0, 10); // Top 10 synergies
        });

        return synergyMap;
    }

    calculatePairSynergy(char1, char2) {
        let score = 0;
        
        // Bonus por elementos compartidos
        const sharedElements = char1.combat.element_types.filter(
            elem => char2.combat.element_types.includes(elem)
        );
        score += sharedElements.length * 20;
        
        // Bonus por complementar weaknesses
        const coveringWeaknesses = char1.combat.weaknesses.filter(
            weak => char2.combat.attributes.includes(weak)
        );
        score += coveringWeaknesses.length * 15;
        
        // Bonus por jobs complementarios
        const complementaryJobs = {
            'Hunter': ['Dancer', 'Cleric'],
            'Scholar': ['Warrior', 'Thief'],
            'Cleric': ['Warrior', 'Hunter']
        };
        
        if (complementaryJobs[char1.basic_info.job]?.includes(char2.basic_info.job)) {
            score += 25;
        }
        
        return Math.min(score, 100);
    }

    createPerformanceRanking(characters) {
        const ranking = {
            overall: characters.map(char => ({
                id: char.id,
                name: char.basic_info.name,
                power_level: char.computed.power_level,
                gl_score: char.computed.performance_score.gl,
                jp_score: char.computed.performance_score.jp
            })).sort((a, b) => b.power_level - a.power_level),
            
            by_job: {}
        };

        // Ranking por job
        const jobGroups = {};
        characters.forEach(char => {
            const job = char.basic_info.job;
            if (!jobGroups[job]) jobGroups[job] = [];
            
            jobGroups[job].push({
                id: char.id,
                name: char.basic_info.name,
                power_level: char.computed.power_level,
                gl_score: char.computed.performance_score.gl
            });
        });

        Object.keys(jobGroups).forEach(job => {
            ranking.by_job[job] = jobGroups[job].sort((a, b) => b.power_level - a.power_level);
        });

        return ranking;
    }

    async generateFrontendConfig(characters) {
        console.log('\n⚙️  Generando configuración frontend...');

        const config = {
            version: "1.0.0",
            created_at: new Date().toISOString(),
            
            // Opciones de filtros disponibles
            filter_options: {
                jobs: [...new Set(characters.map(c => c.basic_info.job))].sort(),
                tiers: ['S', 'A', 'B', 'C', 'D'],
                rarities: [1, 2, 3, 4, 5],
                elements: this.extractUniqueElements(characters),
                influences: [...new Set(characters.map(c => c.basic_info.influence).filter(Boolean))].sort(),
                continents: [...new Set(characters.map(c => c.basic_info.continent).filter(Boolean))].sort()
            },

            // Configuración de colores por tier/rareza
            theme: {
                tier_colors: {
                    'S': '#ff6b6b',  // Rojo
                    'A': '#4ecdc4',  // Turquesa
                    'B': '#45b7d1',  // Azul
                    'C': '#96ceb4',  // Verde
                    'D': '#dda0dd'   // Púrpura claro
                },
                rarity_colors: {
                    1: '#808080',    // Gris
                    2: '#32cd32',    // Verde Lima
                    3: '#1e90ff',    // Azul Dodger
                    4: '#9932cc',    // Púrpura Oscuro
                    5: '#ffd700'     // Dorado
                },
                element_colors: {
                    'Fire': '#ff4757',
                    'Ice': '#3742fa',
                    'Thunder': '#ffa502',
                    'Wind': '#2ed573',
                    'Light': '#f1c40f',
                    'Dark': '#5f27cd'
                }
            },

            // Configuración de team building
            team_building: {
                max_team_size: 8,
                recommended_compositions: [
                    {
                        name: "Balanced Team",
                        description: "2 DPS + 2 Support + 2 Tank + 2 Utility",
                        roles: {
                            "Hunter": 2,
                            "Scholar": 2,
                            "Warrior": 2,
                            "Cleric": 2
                        }
                    },
                    {
                        name: "Element Focus", 
                        description: "Team focused on specific element synergy",
                        min_shared_elements: 2
                    }
                ],
                synergy_bonus_thresholds: {
                    low: 25,
                    medium: 50,
                    high: 75,
                    perfect: 90
                }
            },

            // Configuración de búsqueda
            search: {
                min_query_length: 2,
                max_results: 50,
                search_fields: ["name", "job", "japanese_name", "location"],
                boost_factors: {
                    name_exact: 10,
                    name_partial: 5,
                    job: 3,
                    japanese_name: 2,
                    ai_tags: 1
                }
            },

            // Configuración de visualización
            display: {
                default_sort: "power_level",
                items_per_page: 24,
                image_sizes: {
                    thumbnail: "64x64",
                    card: "128x128", 
                    detail: "256x256"
                },
                default_view: "grid"
            },

            // Stats para dashboard
            statistics: {
                total_characters: characters.length,
                jobs_distribution: this.calculateJobDistribution(characters),
                tier_distribution: this.calculateTierDistribution(characters),
                rarity_distribution: this.calculateRarityDistribution(characters),
                element_distribution: this.calculateElementDistribution(characters)
            }
        };

        const configPath = path.join(this.configDir, 'frontend_config.json');
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        console.log('✓ Configuración frontend guardada: frontend_config.json');

        return config;
    }

    extractUniqueElements(characters) {
        const elements = new Set();
        characters.forEach(char => {
            char.combat.element_types.forEach(elem => elements.add(elem));
        });
        return [...elements].sort();
    }

    calculateJobDistribution(characters) {
        const distribution = {};
        characters.forEach(char => {
            const job = char.basic_info.job;
            distribution[job] = (distribution[job] || 0) + 1;
        });
        return distribution;
    }

    calculateTierDistribution(characters) {
        const distribution = {};
        characters.forEach(char => {
            const tier = char.basic_info.tier.gl;
            distribution[tier] = (distribution[tier] || 0) + 1;
        });
        return distribution;
    }

    calculateRarityDistribution(characters) {
        const distribution = {};
        characters.forEach(char => {
            const rarity = char.basic_info.rarity;
            distribution[rarity] = (distribution[rarity] || 0) + 1;
        });
        return distribution;
    }

    calculateElementDistribution(characters) {
        const distribution = {};
        characters.forEach(char => {
            char.combat.element_types.forEach(element => {
                distribution[element] = (distribution[element] || 0) + 1;
            });
        });
        return distribution;
    }

    async validateMigration(optimizedData) {
        console.log('\n🔍 Validando integridad de datos migrados...');

        const characters = optimizedData.characters;
        let validationErrors = [];

        // Validar conteo de personajes
        if (characters.length !== this.stats.totalCharacters) {
            validationErrors.push(`Conteo de personajes no coincide: esperado ${this.stats.totalCharacters}, obtenido ${characters.length}`);
        }

        // Validar campos requeridos
        characters.forEach(char => {
            if (!char.id || !char.basic_info?.name || !char.basic_info?.job) {
                validationErrors.push(`Campos requeridos faltantes en: ${char.basic_info?.name || 'Unknown'}`);
            }

            if (!char.stats?.level_120) {
                validationErrors.push(`Stats nivel 120 faltantes en: ${char.basic_info.name}`);
            }

            if (!char.assets?.portrait) {
                validationErrors.push(`Asset portrait faltante en: ${char.basic_info.name}`);
            }
        });

        // Validar IDs únicos
        const ids = characters.map(c => c.id);
        const uniqueIds = new Set(ids);
        if (ids.length !== uniqueIds.size) {
            validationErrors.push('Se encontraron IDs duplicados');
        }

        this.stats.validationErrors = validationErrors;
        
        if (validationErrors.length === 0) {
            console.log('✅ Validación completada: Todos los datos están íntegros');
        } else {
            console.log('⚠️  Se encontraron errores de validación:');
            validationErrors.forEach(error => console.log(`   - ${error}`));
        }
    }

    generateReport() {
        console.log('\n📊 REPORTE FINAL DE MIGRACIÓN');
        console.log('================================');
        
        const endTime = new Date();
        const duration = Math.floor((endTime - this.stats.startTime) / 1000);
        
        console.log(`⏱️  Duración: ${duration} segundos`);
        console.log(`📈 Personajes procesados: ${this.stats.processedCharacters}/${this.stats.totalCharacters}`);
        console.log(`🖼️  Portraits faltantes: ${this.stats.missingPortraits.length}`);
        console.log(`❌ Errores encontrados: ${this.stats.errors.length}`);
        console.log(`⚠️  Errores de validación: ${this.stats.validationErrors?.length || 0}`);

        if (this.stats.missingPortraits.length > 0) {
            console.log('\n🖼️  Portraits faltantes:');
            this.stats.missingPortraits.slice(0, 10).forEach(name => {
                console.log(`   - ${name}`);
            });
            if (this.stats.missingPortraits.length > 10) {
                console.log(`   ... y ${this.stats.missingPortraits.length - 10} más`);
            }
        }

        if (this.stats.errors.length > 0) {
            console.log('\n❌ Errores durante el procesamiento:');
            this.stats.errors.slice(0, 5).forEach(error => {
                console.log(`   - ${error}`);
            });
        }

        console.log('\n📁 Archivos generados:');
        console.log('   ✓ DataBase/octopath_optimized.json');
        console.log('   ✓ DataBase/indexes/*.json');
        console.log('   ✓ DataBase/config/frontend_config.json');

        // Guardar reporte detallado
        const reportPath = path.join(this.baseDir, 'migration_report.json');
        const detailedReport = {
            summary: {
                migration_date: new Date().toISOString(),
                duration_seconds: duration,
                total_characters: this.stats.totalCharacters,
                processed_characters: this.stats.processedCharacters,
                success_rate: `${((this.stats.processedCharacters / this.stats.totalCharacters) * 100).toFixed(2)}%`
            },
            statistics: this.stats,
            generated_files: [
                'DataBase/octopath_optimized.json',
                'DataBase/indexes/by_job.json',
                'DataBase/indexes/by_tier.json',
                'DataBase/indexes/by_element.json',
                'DataBase/indexes/by_rarity.json',
                'DataBase/indexes/search_terms.json',
                'DataBase/indexes/synergy_map.json',
                'DataBase/indexes/performance_ranking.json',
                'DataBase/indexes/index_master.json',
                'DataBase/config/frontend_config.json'
            ]
        };

        fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));
        console.log('   ✓ migration_report.json');
    }
}

// Ejecutar migración si es llamado directamente
if (require.main === module) {
    const migrator = new DatabaseMigrator();
    migrator.migrate().catch(console.error);
}

module.exports = DatabaseMigrator;