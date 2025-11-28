class CharacterDatabase {
    constructor() {
        this.characters = [];
        this.initialized = false;
        this._initPromise = null;
        this.metadata = null;
        this._metadata = {
            jobs: null
        };
    }

    async init() {
        if (this.initialized) return this.characters;
        if (!this._initPromise) {
            this._initPromise = this._loadData();
        }
        await this._initPromise;
        this.initialized = true;
        return this.characters;
    }

    async _loadData() {
        const response = await fetch('DataBase/octopath_optimized.json');
        if (!response.ok) {
            throw new Error(`Failed to load database: ${response.status}`);
        }

        const data = await response.json();
        const characters = Array.isArray(data) ? data : data.characters || [];

        this.characters = characters;
        this.metadata = data.metadata || null;
        this._metadata.jobs = this._extractUniqueJobs(characters);
    }

    waitForReady() {
        return this._initPromise || Promise.resolve();
    }

    getAllCharacters() {
        return this.characters;
    }

    getUniqueJobs() {
        if (this._metadata.jobs) {
            return this._metadata.jobs;
        }

        this._metadata.jobs = this._extractUniqueJobs(this.characters);
        return this._metadata.jobs;
    }

    _extractUniqueJobs(characters) {
        if (!Array.isArray(characters)) return [];
        return [...new Set(characters.map(char => char.basic_info?.job))]
            .filter(Boolean)
            .sort();
    }
}

window.CharacterDatabase = CharacterDatabase;
