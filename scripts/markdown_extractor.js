#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Markdown Extractor for Octopath Traveler Character Database
 * 
 * This script extracts unique data from 246 markdown files that is NOT present
 * in the existing optimized JSON database, creating a fast-lookup JSON file
 * for rich character details.
 * 
 * Extracted Data:
 * - Voice Actors with links
 * - JP/GL Release Dates
 * - Availability and Pool Status
 * - Awakening IV Accessories
 * - EX Skills with usage conditions
 * - Ultimate Techniques with progression
 * - Detailed Battle Skills and Passive Skills
 * - Artwork references and video links
 * - Japanese version differences
 */

class MarkdownExtractor {
    constructor() {
        this.extractionStats = {
            filesProcessed: 0,
            charactersExtracted: 0,
            errors: [],
            missingFields: {},
            processingTime: 0
        };
        
        this.outputData = {
            metadata: {
                extraction_date: new Date().toISOString(),
                source_files: 0,
                characters_processed: 0,
                version: "1.0.0",
                purpose: "Rich character details from markdown for instant modal loading",
                performance_improvement: "Eliminates real-time markdown parsing"
            },
            characters: {}
        };
    }

    /**
     * Main extraction process
     */
    async extract() {
        const startTime = Date.now();
        console.log('🚀 Starting markdown extraction process...');
        
        // Load existing JSON for character mapping
        const existingData = await this.loadExistingDatabase();
        
        // Get all markdown files
        const markdownDir = path.join(__dirname, '..', 'DataBase', 'Personajes Markdown');
        const markdownFiles = fs.readdirSync(markdownDir).filter(file => file.endsWith('.md'));
        
        console.log(`📁 Found ${markdownFiles.length} markdown files`);
        this.outputData.metadata.source_files = markdownFiles.length;
        
        // Process each markdown file
        for (const filename of markdownFiles) {
            try {
                await this.processMarkdownFile(filename, markdownDir, existingData);
                this.extractionStats.filesProcessed++;
            } catch (error) {
                console.error(`❌ Error processing ${filename}:`, error.message);
                this.extractionStats.errors.push({
                    file: filename,
                    error: error.message
                });
            }
        }
        
        // Finalize metadata
        this.outputData.metadata.characters_processed = this.extractionStats.charactersExtracted;
        this.extractionStats.processingTime = Date.now() - startTime;
        
        // Save extracted data
        await this.saveExtractedData();
        
        // Print extraction report
        this.printExtractionReport();
    }
    
    /**
     * Load existing optimized database for character mapping
     */
    async loadExistingDatabase() {
        const dbPath = path.join(__dirname, '..', 'DataBase', 'octopath_optimized.json');
        if (fs.existsSync(dbPath)) {
            const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
            console.log(`✅ Loaded existing database with ${data.characters.length} characters`);
            return data;
        }
        console.log('⚠️  No existing database found - proceeding without character mapping');
        return null;
    }
    
    /**
     * Process individual markdown file
     */
    async processMarkdownFile(filename, markdownDir, existingData) {
        const filePath = path.join(markdownDir, filename);
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        
        // Extract character name from first line
        const characterName = this.extractCharacterName(lines[0]);
        if (!characterName) {
            throw new Error(`Could not extract character name from ${filename}`);
        }
        
        // Create character entry
        const characterData = {
            source_file: filename,
            character_name: characterName,
            extraction_date: new Date().toISOString(),
            
            // Core extracted data
            japanese_name: this.extractJapaneseName(lines),
            voice_actor: this.extractVoiceActor(lines),
            release_dates: this.extractReleaseDates(lines),
            availability: this.extractAvailability(lines),
            awakening_accessory: this.extractAwakeningAccessory(lines),
            ex_skill: this.extractEXSkill(lines),
            ultimate_technique: this.extractUltimateTechnique(lines),
            passive_skills: this.extractPassiveSkills(lines),
            battle_skills: this.extractBattleSkills(lines),
            artwork: this.extractArtwork(lines),
            videos: this.extractVideos(lines),
            jp_differences: this.extractJPDifferences(lines),
            notes: this.extractNotes(lines)
        };
        
        // Map to existing character if possible
        const characterId = this.mapToExistingCharacter(characterName, existingData);
        const key = characterId || this.generateKey(characterName);
        
        this.outputData.characters[key] = characterData;
        this.extractionStats.charactersExtracted++;
        
        console.log(`✅ Extracted: ${characterName} (${filename})`);
    }
    
    /**
     * Extract character name from markdown title
     */
    extractCharacterName(firstLine) {
        const match = firstLine.match(/^#\s*(.+)$/);
        return match ? match[1].trim() : null;
    }
    
    /**
     * Extract Japanese name
     */
    extractJapaneseName(lines) {
        for (const line of lines) {
            const match = line.match(/Japanese Name:\s*(.+)$/);
            if (match) return match[1].trim();
        }
        return null;
    }
    
    /**
     * Extract Voice Actor information
     */
    extractVoiceActor(lines) {
        for (const line of lines) {
            const match = line.match(/\*\*V\.A\.\:\*\*\s*\[([^\]]+)\]\(([^\)]+)\)/);
            if (match) {
                return {
                    name: match[1].trim(),
                    mal_link: match[2].trim()
                };
            }
            
            // Alternative format
            const altMatch = line.match(/V\.A\.\:\s*\[([^\]]+)\]\(([^\)]+)\)/);
            if (altMatch) {
                return {
                    name: altMatch[1].trim(),
                    mal_link: altMatch[2].trim()
                };
            }
        }
        return null;
    }
    
    /**
     * Extract JP and GL release dates
     */
    extractReleaseDates(lines) {
        const dates = { jp: null, gl: null };
        
        for (const line of lines) {
            const jpMatch = line.match(/\*\*JP Release Date:\*\*\s*(.+)$/);
            if (jpMatch) dates.jp = jpMatch[1].trim();
            
            const glMatch = line.match(/\*\*GL Release Date:\*\*\s*(.+)$/);
            if (glMatch) dates.gl = glMatch[1].trim() || null;
        }
        
        return dates.jp || dates.gl ? dates : null;
    }
    
    /**
     * Extract availability information
     */
    extractAvailability(lines) {
        const availability = {};
        
        for (const line of lines) {
            const availMatch = line.match(/\*\*Availability:\*\*\s*(.+)$/);
            if (availMatch) availability.method = availMatch[1].trim();
            
            const poolMatch = line.match(/\*\*Global Pool:\*\*\s*(.+)$/);
            if (poolMatch) availability.global_pool = poolMatch[1].trim();
        }
        
        return Object.keys(availability).length > 0 ? availability : null;
    }
    
    /**
     * Extract Awakening IV Accessory details
     */
    extractAwakeningAccessory(lines) {
        let inAwakeningSection = false;
        let accessory = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('## Awakening IV Accessory')) {
                inAwakeningSection = true;
                continue;
            }
            
            if (inAwakeningSection && line.startsWith('##')) {
                break; // Exit section
            }
            
            if (inAwakeningSection) {
                // Extract accessory name
                const nameMatch = line.match(/\*\*([^*]+)\*\*/);
                if (nameMatch && !accessory) {
                    accessory = {
                        name: nameMatch[1].trim(),
                        effects: []
                    };
                }
                
                // Extract effects (lines starting with ·)
                if (line.startsWith('·') && accessory) {
                    accessory.effects.push(line.substring(1).trim());
                }
            }
        }
        
        return accessory;
    }
    
    /**
     * Extract EX Skill information
     */
    extractEXSkill(lines) {
        let inEXSection = false;
        let exSkill = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('## EX skill')) {
                inEXSection = true;
                continue;
            }
            
            if (inEXSection && line.startsWith('##')) {
                break;
            }
            
            if (inEXSection) {
                // Extract skill description
                if (line.includes('**') && line.includes('(EX)')) {
                    exSkill = { description: '', usage_condition: null, uses: null };
                }
                
                if (exSkill && line.includes('potency:')) {
                    exSkill.description = line.trim();
                }
                
                if (line.includes('Usage Condition:') && exSkill) {
                    const match = line.match(/Usage Condition:\s*(.+)$/);
                    if (match) exSkill.usage_condition = match[1].trim();
                }
                
                if (line.includes('Uses:') && exSkill) {
                    const match = line.match(/Uses:\s*(.+)$/);
                    if (match) exSkill.uses = match[1].trim();
                }
            }
        }
        
        return exSkill;
    }
    
    /**
     * Extract Ultimate Technique information
     */
    extractUltimateTechnique(lines) {
        let inUltimateSection = false;
        let ultimate = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (line.includes('## Ultimate Technique')) {
                inUltimateSection = true;
                continue;
            }
            
            if (inUltimateSection && line.startsWith('##')) {
                break;
            }
            
            if (inUltimateSection && line.includes('**') && line.includes('(Lv.')) {
                const nameMatch = line.match(/\*\*([^*]+)\*\*/);
                if (nameMatch) {
                    ultimate = {
                        name: nameMatch[1].trim(),
                        description: '',
                        progression: {}
                    };
                }
            }
            
            if (ultimate) {
                if (line.includes('potency:')) {
                    ultimate.description = line.trim();
                }
                
                if (line.includes('Uses:')) {
                    ultimate.progression.uses = line.replace('Uses:', '').trim();
                }
                
                if (line.includes('Initial Gauge:')) {
                    ultimate.progression.initial_gauge = line.replace('Initial Gauge:', '').trim();
                }
                
                if (line.includes('Gauge Increase:')) {
                    ultimate.progression.gauge_increase = line.replace('Gauge Increase:', '').trim();
                }
            }
        }
        
        return ultimate;
    }
    
    /**
     * Extract Passive Skills
     */
    extractPassiveSkills(lines) {
        let inPassiveSection = false;
        const skills = [];
        
        for (const line of lines) {
            if (line.includes('## Passive Skills')) {
                inPassiveSection = true;
                continue;
            }
            
            if (inPassiveSection && line.startsWith('##')) {
                break;
            }
            
            if (inPassiveSection && line.includes('**') && !line.includes('<img')) {
                const skillMatch = line.match(/\*\*([^*]+)\*\*/);
                if (skillMatch) {
                    skills.push({
                        name: skillMatch[1].trim(),
                        description: line.trim()
                    });
                }
            }
        }
        
        return skills.length > 0 ? skills : null;
    }
    
    /**
     * Extract Battle Skills
     */
    extractBattleSkills(lines) {
        let inBattleSection = false;
        const skills = [];
        
        for (const line of lines) {
            if (line.includes('## Battle Skills')) {
                inBattleSection = true;
                continue;
            }
            
            if (inBattleSection && line.startsWith('##')) {
                break;
            }
            
            if (inBattleSection && line.includes('**') && !line.includes('<img')) {
                const skillMatch = line.match(/\*\*([^*]+)\*\*/);
                if (skillMatch && line.includes('[') && line.includes('SP]')) {
                    skills.push({
                        name: skillMatch[1].trim(),
                        description: line.trim()
                    });
                }
            }
        }
        
        return skills.length > 0 ? skills : null;
    }
    
    /**
     * Extract artwork references
     */
    extractArtwork(lines) {
        for (const line of lines) {
            if (line.includes('## Artwork') || line.includes('![') && line.includes('.png')) {
                const match = line.match(/!\[([^\]]*)\]\(([^\)]+)\)/);
                if (match) {
                    return {
                        filename: match[2].trim(),
                        alt_text: match[1].trim()
                    };
                }
            }
        }
        return null;
    }
    
    /**
     * Extract video links
     */
    extractVideos(lines) {
        const videos = {};
        
        for (const line of lines) {
            if (line.includes('## Character Trailer')) {
                const nextLineIndex = lines.indexOf(line) + 1;
                if (nextLineIndex < lines.length) {
                    const nextLine = lines[nextLineIndex + 1]; // Skip empty line
                    if (nextLine && nextLine.includes('http')) {
                        videos.character_trailer = nextLine.trim();
                    }
                }
            }
            
            if (line.includes('## Influence Card Reveal')) {
                const nextLineIndex = lines.indexOf(line) + 1;
                if (nextLineIndex < lines.length) {
                    const nextLine = lines[nextLineIndex + 1]; // Skip empty line
                    if (nextLine && nextLine.includes('.mp4')) {
                        videos.influence_card = nextLine.trim();
                    }
                }
            }
        }
        
        return Object.keys(videos).length > 0 ? videos : null;
    }
    
    /**
     * Extract Japanese differences section
     */
    extractJPDifferences(lines) {
        let inDiffSection = false;
        const differences = [];
        
        for (const line of lines) {
            if (line.includes('## Differences with respect to JP')) {
                inDiffSection = true;
                continue;
            }
            
            if (inDiffSection && line.startsWith('##')) {
                break;
            }
            
            if (inDiffSection && line.trim() && !line.includes('<aside>')) {
                differences.push(line.trim());
            }
        }
        
        return differences.length > 0 ? differences : null;
    }
    
    /**
     * Extract notes section
     */
    extractNotes(lines) {
        let inNotesSection = false;
        const notes = [];
        
        for (const line of lines) {
            if (line.includes('## Notes')) {
                inNotesSection = true;
                continue;
            }
            
            if (inNotesSection && line.startsWith('##')) {
                break;
            }
            
            if (inNotesSection && line.trim() && !line.includes('<aside>')) {
                notes.push(line.trim());
            }
        }
        
        return notes.length > 0 ? notes.join(' ') : null;
    }
    
    /**
     * Map character name to existing database ID
     */
    mapToExistingCharacter(characterName, existingData) {
        if (!existingData) return null;
        
        // Direct name match
        for (const char of existingData.characters) {
            if (char.basic_info.name.toLowerCase() === characterName.toLowerCase()) {
                return char.id;
            }
            if (char.basic_info.display_name.toLowerCase() === characterName.toLowerCase()) {
                return char.id;
            }
        }
        
        // Fuzzy matching for EX characters
        if (characterName.includes(' EX')) {
            const baseName = characterName.replace(' EX', '').trim();
            for (const char of existingData.characters) {
                if (char.basic_info.name.toLowerCase().includes(baseName.toLowerCase())) {
                    return char.id + '_ex';
                }
            }
        }
        
        return null;
    }
    
    /**
     * Generate key from character name
     */
    generateKey(characterName) {
        return characterName.toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
    }
    
    /**
     * Save extracted data to JSON file
     */
    async saveExtractedData() {
        const outputPath = path.join(__dirname, '..', 'DataBase', 'markdown_extracted.json');
        
        // Add extraction metadata
        this.outputData.metadata.extraction_stats = this.extractionStats;
        
        fs.writeFileSync(outputPath, JSON.stringify(this.outputData, null, 2));
        console.log(`💾 Saved extracted data to: ${outputPath}`);
        console.log(`📊 File size: ${(fs.statSync(outputPath).size / 1024).toFixed(2)} KB`);
    }
    
    /**
     * Print comprehensive extraction report
     */
    printExtractionReport() {
        console.log('\n' + '='.repeat(60));
        console.log('📋 MARKDOWN EXTRACTION REPORT');
        console.log('='.repeat(60));
        
        console.log(`✅ Files Processed: ${this.extractionStats.filesProcessed}`);
        console.log(`✅ Characters Extracted: ${this.extractionStats.charactersExtracted}`);
        console.log(`⏱️  Processing Time: ${this.extractionStats.processingTime}ms`);
        
        if (this.extractionStats.errors.length > 0) {
            console.log(`❌ Errors: ${this.extractionStats.errors.length}`);
            this.extractionStats.errors.forEach(error => {
                console.log(`   • ${error.file}: ${error.error}`);
            });
        }
        
        // Field extraction stats
        console.log('\n📊 EXTRACTION STATISTICS:');
        const sampleCharacter = Object.values(this.outputData.characters)[0];
        if (sampleCharacter) {
            Object.keys(sampleCharacter).forEach(field => {
                if (field === 'source_file' || field === 'extraction_date') return;
                
                const count = Object.values(this.outputData.characters)
                    .filter(char => char[field] !== null && char[field] !== undefined).length;
                const percentage = ((count / this.extractionStats.charactersExtracted) * 100).toFixed(1);
                console.log(`   • ${field}: ${count}/${this.extractionStats.charactersExtracted} (${percentage}%)`);
            });
        }
        
        console.log('\n🎯 PERFORMANCE BENEFITS:');
        console.log('   • Eliminates real-time markdown parsing');
        console.log('   • Instant modal loading with rich content');
        console.log('   • O(1) character detail lookup');
        console.log('   • Structured data ready for frontend consumption');
        
        console.log('\n✨ Extraction completed successfully!');
    }
}

// Run extraction if called directly
if (require.main === module) {
    const extractor = new MarkdownExtractor();
    extractor.extract().catch(console.error);
}

module.exports = MarkdownExtractor;