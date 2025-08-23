/**
 * MarkdownIntegrator.js
 * Rich Content Markdown Integration System
 * Handles parsing and displaying detailed character information from markdown files
 */

class MarkdownIntegrator {
    constructor() {
        this.cache = new Map();
        this.markdownBase = 'DataBase/Personajes Markdown/';
        this.fallbackIcons = {
            passive: '🌟',
            battle: '⚔️',
            ultimate: '💥',
            ex: '✨',
            awakening: '🔮',
            stat: '📊',
            element: '🔥',
            weapon: '⚔️',
            default: '❓'
        };
        this.isLoading = false;
    }

    /**
     * Load character markdown content with intelligent caching
     */
    async loadCharacterMarkdown(character) {
        const cacheKey = character.id;
        
        // Return cached content if available
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        this.isLoading = true;

        try {
            // Find matching markdown file (name + hash pattern)
            const markdownFile = await this._findMarkdownFile(character.basic_info.name);
            
            if (!markdownFile) {
                console.warn(`No markdown file found for character: ${character.basic_info.name}`);
                return null;
            }

            const response = await fetch(`${this.markdownBase}${markdownFile}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch markdown: ${response.status}`);
            }

            const markdownContent = await response.text();
            const parsedContent = this._parseMarkdownContent(markdownContent, character);
            
            // Cache the parsed content with priority-based TTL
            const priority = this._getCachePriority(character);
            this.cache.set(cacheKey, {
                content: parsedContent,
                timestamp: Date.now(),
                priority
            });

            return parsedContent;

        } catch (error) {
            console.error('Error loading character markdown:', error);
            return null;
        } finally {
            this.isLoading = false;
        }
    }

    /**
     * Find matching markdown file for character name
     */
    async _findMarkdownFile(characterName) {
        try {
            // Dynamic file search - find files that start with the character name
            const searchPattern = characterName.replace(/'/g, "'"); // Handle apostrophes
            
            // List of all markdown files (we'll create this dynamically)
            const allFiles = [
                '2B 231093b1f06d817f94d6cfa1202cde31.md', '3 Stars 231093b1f06d81699ca7f28d97ce94da.md', '4 Stars 231093b1f06d81488e0efa87dae08185.md', '5 Stars 231093b1f06d81659b70f9e3bb9d51d7.md', '9S 231093b1f06d812fbff7dafd765e0e5b.md', 'A2 231093b1f06d8171af19f377b91ba666.md', 'Adelle 231093b1f06d81c7afcaffaeb86484d2.md', 'Aedelgard 231093b1f06d81dabb44ec2212c4c33f.md', 'Agnea 231093b1f06d812fa438d41343482e61.md', 'Agnea EX 231093b1f06d81ff989fe27cd19c8358.md', 'Agnès 231093b1f06d81e184d2c97aa7f4e6ed.md', 'Alaune 231093b1f06d81e7a895d7b634f62f0b.md', 'Alaune EX 231093b1f06d818eaf72c56b0d91a5a5.md', 'Alfyn 231093b1f06d81b4b819e1617e1adf19.md', 'Alrond 231093b1f06d818da8dbf463b7ac114b.md', 'Aoi 231093b1f06d81e093c0f8604bf77af0.md', 'Ashlan 231093b1f06d8127b2c0ed945b3c09b7.md', 'Aslyte 231093b1f06d81479560c8279ed67544.md', 'Auguste 231093b1f06d81ba857ec391c20f6cd1.md', 'Avar 231093b1f06d8194ab90df7fb91912d7.md', 'Bargello 231093b1f06d81c49596e5fd68e3097b.md', 'Bargello EX 231093b1f06d81aabc60f240196dff26.md', 'Barrad 231093b1f06d81b98908d93b9e248bb7.md', 'Bertrand 231093b1f06d812f98efc064d2d47c01.md', 'Billy 231093b1f06d81e5bd22f449e7f33e4f.md', 'Black Knight 231093b1f06d81b29251d6c9f3dbcd27.md', 'Black Maiden 231093b1f06d816296afc63883dded93.md', 'Brigitte 231093b1f06d819f8355ebdacad72687.md', 'Camilla 231093b1f06d81518ca8e7e9ab85b74e.md', 'Canary 231093b1f06d81799266d01c62e127e9.md', 'Cardona 231093b1f06d81bfaa9dc24c22da5957.md', 'Carroll 231093b1f06d812aaf46e76d8015129c.md', 'Cassia 231093b1f06d81f19daee36521ee1755.md', 'Castti 231093b1f06d818ea681dcd80f5e9ebc.md', 'Castti EX 231093b1f06d81d78999e1553514a0e1.md', 'Cecil 231093b1f06d81e1a0bec40c5ab9ac93.md', 'Cecily 231093b1f06d8118b2b1cf30d4c2d085.md', 'Cedric 231093b1f06d8107a150e38158e8a89d.md', 'Ceraphina 231093b1f06d81aaa149dad3e41830d2.md', 'Cerna 231093b1f06d81e7a3c8f6b2d6290976.md', 'Chloe 231093b1f06d81518ae3cf052373dae8.md', 'Cless 231093b1f06d81659fb9fb0f8d86a150.md', 'Conny 231093b1f06d81caa183e687419c036b.md', 'Cornelia 231093b1f06d817db8ecfae52a48faca.md', 'Crick 231093b1f06d81abab81ded1a66e8378.md', 'Cyrus 231093b1f06d815a8b75eb3768701c12.md', 'Cyrus EX 231093b1f06d81498d8dfb5164014f9e.md', 'Devin 231093b1f06d816e8f89de3b2c065d63.md', 'Diego 231093b1f06d8162a64bdfbaf846cf7b.md', 'Ditraina 231093b1f06d81719aeec5eda4ca829b.md', 'Ditraina EX 231093b1f06d81009505c3baf1d6faeb.md', 'Dolcinaea 231093b1f06d814d8762c201a3b3acc5.md', 'Dorothea 231093b1f06d81bbb5c1e7c3938f55cd.md', 'Dorrie 231093b1f06d815ea0fbe1f89fd1aa9d.md', 'Durand 231093b1f06d81b8b8eddd83eda60365.md', 'Edea 231093b1f06d812fa385f8b7bb90f586.md', 'Efrain 231093b1f06d81c2b68ce8eff2ca2937.md', 'Eleonora 231093b1f06d81cabc55ea2dfc66b892.md', 'Eliza 231093b1f06d813ba1bcf4693fcee682.md', 'Elrica 231093b1f06d81f4b41deba219fa8ad4.md', 'Elrica EX 231093b1f06d8124ad4bd6d598a8c4b7.md', 'Eltrix 231093b1f06d81f7884bff0313b1687f.md', 'Elvis 231093b1f06d81e9ab5ec0c73bc94af9.md', 'Emil 231093b1f06d81a79b1bff75e08eb65f.md', 'Esmeralda 231093b1f06d81ae9ea5fc40c86de7a7.md', 'Eunice 231093b1f06d8166b305d12cd4066af2.md', 'Evelyn 231093b1f06d8194af90fade57ce4d58.md', 'Fabio 231093b1f06d81018217e0744398f7cf.md', 'Falco 231093b1f06d81d58341c58e5c03cef6.md', 'Felline 231093b1f06d81baba29f466c077a696.md', 'Fiore 231093b1f06d81229e8bcfba8a5c7408.md', 'Fiore EX 231093b1f06d81879fd9c5c6ec088cd2.md', 'Frederica 231093b1f06d81b1912ed977861edd09.md', 'Gertrude 231093b1f06d81e89d2bec89cfc5ad65.md', 'Gilderoy 231093b1f06d81f88203e011597405c7.md', 'Gloria 231093b1f06d81bfa46dcf4edad7831f.md', 'Glossom 231093b1f06d8178beedc4c9734e6ca6.md', 'Grieg 231093b1f06d815aaf62c2b037c35e0d.md', 'Guti 231093b1f06d81719038ccdbb1a70d95.md', 'Hammy 231093b1f06d81118a03d903939cd940.md', 'Harley 231093b1f06d8186abceed7639881e49.md', 'Harry 231093b1f06d817aa7e6f16a71b07251.md', 'Hasumi 231093b1f06d8192b9f5d76b94d8ac6a.md', 'Hayes 231093b1f06d817fb68cdf10c2ddd781.md', 'Heathcote 231093b1f06d813faa9cc11b5bc0bb49.md', 'Heinz 231093b1f06d814cbaccefbba8cafe9e.md', 'Helga 231093b1f06d8145aac8e16cdce0f41c.md', 'Herminia 231093b1f06d810ead6adfa7f26c131a.md', 'Hikari 231093b1f06d81c58872e055f69ff91b.md', 'Hikari EX 231093b1f06d818d87adf12ceeb50418.md', 'Hujheb 231093b1f06d81299d5fe03aa11fe0aa.md', "H'aanit 231093b1f06d81d49d10d6e36a70be91.md", "H'aanit EX 231093b1f06d81eba13bc901f37603ed.md", 'Iris 231093b1f06d81f3917fe4377048dd4d.md', 'Isla 231093b1f06d8109a154c8caa412a694.md', 'Jane 231093b1f06d819ba1bcdcade42ef463.md', 'Jillmeila 231093b1f06d8100bb8dd2fe3705816d.md', 'Jorge 231093b1f06d81c4b95dd25f47632c1f.md', 'Jorn 231093b1f06d810ab84afd6601a2bedc.md', 'José 231093b1f06d811ca959fee760fbf755.md', 'Joshua 231093b1f06d818a947cc6a717cdaebf.md', 'Juan 231093b1f06d818a9756e71c8d8a600b.md', 'Julio 231093b1f06d81169acee63d3dc6dacc.md', 'Kagemune 231093b1f06d81baad69fab625152418.md', 'Kainé 231093b1f06d8121a66addf2684b763e.md', 'Kazan 231093b1f06d8111a899eecd8a62ec31.md', 'Kenneth 231093b1f06d8123915dc9e7f21506e7.md', 'Kersjes 231093b1f06d817c8118f07b39a0b978.md', 'Kilns 231093b1f06d8134a1f6e667e4f51205.md', 'Kouren 231093b1f06d8148b872f90ee76efcef.md', 'Krauser 231093b1f06d81bf9adfc6e84d68b777.md', 'Kurtz 231093b1f06d81c4bd18d91004eb8f3e.md', 'Largo 231093b1f06d815c938dc9c469a49cdd.md', 'Lars 231093b1f06d8116b9aeea0178a32be5.md', 'Laura 231093b1f06d81ee8af8d8b115cd8cbf.md', 'Lemaire 231093b1f06d814ab280da40059e112a.md', 'Leon 231093b1f06d81199d61f3053872539e.md', 'Levan 231093b1f06d81d495f3e0b3f6d969de.md', 'Levina 231093b1f06d810dba37efafb2f89a61.md', 'Lianna 231093b1f06d8169b578e1cca6b68627.md', 'Lionel 231093b1f06d81edb776fb39860b755a.md', 'Lolo 231093b1f06d8110b179cd66fc91b661.md', 'Lucetta 231093b1f06d8113bab8e4dc18185963.md', 'Lumis 231093b1f06d8136951bd2741de1a4cb.md', 'Lumis EX 231093b1f06d8143a4d9cfbe65665685.md', 'Lynette 231093b1f06d815c8769fc685c6149c6.md', 'Mabel 231093b1f06d814f85c3f88463d60b96.md', 'Madelaine 231093b1f06d8199addacfbd8dc2dc3d.md', 'Magnolia 231093b1f06d813894e6e072761a80f7.md', 'Mahrez 231093b1f06d81dba4d5f013809ad09c.md', 'Manuel 231093b1f06d81608818d2598e4bd3b3.md', 'Meena 231093b1f06d8199af86d9ef7ee475cf.md', 'Menno 231093b1f06d81f896ece929dc139921.md', 'Menny 231093b1f06d81d4bbfdc968b70a6151.md', 'Merrit 231093b1f06d813ebc4cc3ba92115ea9.md', 'Miles 231093b1f06d8172b482fd0e36627cdf.md', 'Millard 231093b1f06d81fba571e34922697858.md', 'Millard EX 231093b1f06d8170828cccd415fb2e91.md', 'Mirgardi 231093b1f06d81a78b54d62322bbaf8f.md', 'Molrusso 231093b1f06d81f59f4ecc3cbbee5c21.md', 'Molrusso EX 231093b1f06d813e820ddfffc03a4a81.md', 'Molu 231093b1f06d81818bfdc7408dd41034.md', 'Morena 231093b1f06d8172b9e3c775a5b49f59.md', 'Morffins 231093b1f06d81b3b840c310b0aa0fce.md', 'Mydia 231093b1f06d8196a5add09e518ebb74.md', 'Nanna 231093b1f06d8166a94dc69324b6c39b.md', 'Narr 231093b1f06d8111ae87d8391da10bc1.md', 'Neha 231093b1f06d81a596a9fb4e9f7933e8.md', 'Nephti 231093b1f06d810c89affe9c0b062c38.md', 'Nicola 231093b1f06d81819affebef854d16ef.md', 'Nier 231093b1f06d81a58e14c5ef26b497bc.md', 'Nina-Lanna 231093b1f06d81f588b3cd1e54e06635.md', 'Nivelle 231093b1f06d815981f3c9e47017fdef.md', 'Noelle 231093b1f06d81f3915ee1a1bfefd192.md', 'Nona 231093b1f06d81ac95d6c8ba7f0d9faa.md', 'O Odio 231093b1f06d81458b11c7f78658874c.md', 'Ochette 231093b1f06d8100ab65cc0c853310e1.md', 'Ochette EX 231093b1f06d81a4a4fdf87d97e160f5.md', 'Odette 231093b1f06d8106b25fec18830174f1.md', 'Oersted 231093b1f06d819e8cf7f4ee7a9ccecd.md', 'Ogen 231093b1f06d819e888bce2426207fcc.md', 'Olberic 231093b1f06d81309a48e63d4009eadf.md', 'Ophilia 231093b1f06d819aa418cdf096d0db48.md', 'Ophilia EX 231093b1f06d81f5a2affd53f8d469e7.md', 'Ori 231093b1f06d81c7a0c0d25f0137acb2.md', 'Oskha 231093b1f06d818ba1b4f292850b3158.md', 'Osvald 231093b1f06d81be8704d9976093d50f.md', 'Osvald EX 231093b1f06d8105ac1ace6073cdb543.md', 'Pardis III 231093b1f06d81ca8d80c70fc633ed52.md', 'Partitio 231093b1f06d81c081e0dae6bd371e0a.md', 'Partitio EX 231093b1f06d81e88cb9c3fde7a0c821.md', 'Paula 231093b1f06d811fbebfd504f812b0d7.md', 'Pearl 231093b1f06d81c881c7d57d284cf507.md', 'Penny 231093b1f06d81fcb79ad4c993c79524.md', 'Peredir 231093b1f06d81018d30e5fe75789a30.md', 'Pia 231093b1f06d81b9a2d1d83769c2099d.md', 'Pirro 231093b1f06d814eb5e0f5920410622d.md', 'Primrose 231093b1f06d813db733dcf78bd3d55d.md', 'Primrose EX 231093b1f06d815b944adc83ef2783b6.md', 'Promme 231093b1f06d813da700e8d4dda1d89a.md', 'Rai Mei 231093b1f06d81a291f7caa8c0ad1574.md', 'Ramona 231093b1f06d81e197c3c1d000a73bec.md', 'Relisha 231093b1f06d816bacb6fa5607fcd947.md', 'Richard 231093b1f06d8161b94ffd208f2da27d.md', 'Ringabel 231093b1f06d81fa8cbcdffb293b4ca0.md', 'Rinyuu 231093b1f06d8108b76dce660cb5bc0e.md', 'Rinyuu EX 231093b1f06d8130817ff157f95fd979.md', 'Rique 231093b1f06d8155b240df008da7a3cf.md', 'Rita 231093b1f06d8171a4d2ca8696fc6c97.md', "Ri'tu 231093b1f06d81f79fd0c40de2e71f59.md", 'Rodion 231093b1f06d81449e1fe86166b0b57a.md', 'Roland 231093b1f06d811da4a7c0d36e81a2fa.md', 'Rondo 231093b1f06d81bab6d1d73ca92eb20a.md', 'S Odio 231093b1f06d817b986dd26e638957ae.md', 'Sail 231093b1f06d81b08560fb869c322fad.md', 'Saria 231093b1f06d819ca186ee8ee3ad4f1e.md', 'Sarisa 231093b1f06d815fb540fa17af855653.md', 'Sazantos 231093b1f06d81da8a30ea073eddc2df.md', 'Sazantos EX 231093b1f06d81a7aadfd023ddcb31a8.md', 'Scarecrow 231093b1f06d81fdbafed46d4b27bbcd.md', 'Serenoa 231093b1f06d81028cfbd58ed394ff11.md', 'Sertet 231093b1f06d81f28e56f870e5d03123.md', 'Shana 231093b1f06d81a1a3a2c028ae3820f7.md', 'Shelby 231093b1f06d8133839cc648859efe1b.md', 'Signa 231093b1f06d81b988fcd08f891c0d51.md', 'Signa EX 231093b1f06d8174a2d8c52c7c50f13f.md', 'Sigrid 231093b1f06d81e3b2acdecc78fa6708.md', 'Sigrid EX 231093b1f06d81a9a6f8d9ba5322c74c.md', 'Sofia 231093b1f06d81d2a92bcd829871e7ce.md', 'Sofia EX 231093b1f06d812baf61e0ff33654d42.md', 'Soleil 231093b1f06d81a2bd4ec4b7c5160b4f.md', 'Solon 231093b1f06d81e3916ae42392b47b54.md', 'Sonia 231093b1f06d813fa219c7f4ee6ef69d.md', 'Sowan 231093b1f06d81b5b6b3dec7ff004e43.md', 'Stead 231093b1f06d813db86ffd0f95f7a0ef.md', 'Streibough 231093b1f06d81919b24f98845062af1.md', 'Sunny 231093b1f06d8194af03db5384306c9f.md', 'Tahir 231093b1f06d81ff8551c1e6662916ea.md', 'Tatloch 231093b1f06d815eb5a0e63898d01055.md', 'Tatloch EX 231093b1f06d81e0aa81fe30f150412d.md', 'Telly 231093b1f06d81f18795df9cce2bbc05.md', 'Temenos 231093b1f06d81a39adfe6e51d4d4d90.md', 'Theo 231093b1f06d810fa6f9c3c1d416cbdc.md', 'Therese 231093b1f06d812d92ddd62fa898ab4a.md', 'Therese EX 231093b1f06d813ab5f2c5e3617f3e74.md', 'Therion 231093b1f06d81248634e197f7d2acd5.md', 'Throné 231093b1f06d81f697eece8f5bb18721.md', 'Tikilen 231093b1f06d81229e8cfcd7637c780f.md', 'Tithi 231093b1f06d8135bf6cc431c94d30a1.md', 'Tiziano 231093b1f06d81c2b070fec78633eded.md', 'Tressa 231093b1f06d81aa8c18fcf01cc97a36.md', 'Tressa EX 231093b1f06d81e4b300fada7aae60d7.md', 'Trish 231093b1f06d8108a16ee27c1e8e254c.md', 'Tytos 231093b1f06d814c964bc5eefef851d0.md', 'Varkyn 231093b1f06d81f2ab0fec283d75cba7.md', 'Viola 231093b1f06d8111ad66fd6c6811c939.md', 'Viola EX 231093b1f06d8101bd20e9b7a3317130.md', 'Vivian 231093b1f06d814587d7e34411e881e8.md', 'Wingate 231093b1f06d819f82d9d6883275a184.md', "W'ludai 231093b1f06d814b8379e0a10f3dbd64.md", 'Yan Long 231093b1f06d81078c4af65912ce7697.md', 'Yugo 231093b1f06d81dba4c5e1a77692d391.md', 'Yukes 231093b1f06d81ca8a7ae7974e92246c.md', 'Yunnie 231093b1f06d81be9b3becbc22a8e0d7.md', 'Zenia 231093b1f06d81618eaacd740183ccdc.md', "Z'aanta 231093b1f06d812ab828ce50d9d51401.md"
            ];
            
            // Find exact match or closest match
            let matchedFile = allFiles.find(file => {
                const fileName = file.split(' ')[0]; // Get name before the first space
                return fileName.toLowerCase() === searchPattern.toLowerCase();
            });
            
            // Try EX version if base character not found
            if (!matchedFile) {
                matchedFile = allFiles.find(file => {
                    const fileName = file.split(' EX ')[0]; // Handle EX characters
                    return fileName.toLowerCase() === searchPattern.toLowerCase();
                });
            }
            
            return matchedFile || null;

        } catch (error) {
            console.error('Error finding markdown file:', error);
            return null;
        }
    }

    /**
     * Parse markdown content into structured data
     */
    _parseMarkdownContent(markdown, character) {
        const sections = {
            basicInfo: this._extractBasicInfo(markdown),
            passiveSkills: this._extractPassiveSkills(markdown),
            battleSkills: this._extractBattleSkills(markdown),
            latentPower: this._extractLatentPower(markdown),
            ultimateTechnique: this._extractUltimateTechnique(markdown),
            exSkill: this._extractExSkill(markdown),
            awakeningAccessory: this._extractAwakeningAccessory(markdown),
            miscInfo: this._extractMiscInfo(markdown),
            artwork: this._extractArtwork(markdown),
            differences: this._extractDifferences(markdown)
        };

        return {
            character,
            sections,
            originalMarkdown: markdown,
            parsedAt: Date.now()
        };
    }

    /**
     * Extract basic character information
     */
    _extractBasicInfo(markdown) {
        const lines = markdown.split('\n');
        const info = {};

        for (const line of lines) {
            if (line.includes('Japanese Name:')) {
                info.japaneseName = line.split('Japanese Name:')[1].trim();
            } else if (line.includes('Job:')) {
                info.job = line.split('Job:')[1].trim();
            } else if (line.includes('Influence:')) {
                info.influence = line.split('Influence:')[1].trim();
            } else if (line.includes('Continent:')) {
                info.continent = line.split('Continent:')[1].trim();
            } else if (line.includes('Location:')) {
                info.location = line.split('Location:')[1].trim();
            } else if (line.includes('Attributes:')) {
                info.attributes = line.split('Attributes:')[1].trim();
            }
        }

        return info;
    }

    /**
     * Extract passive skills section
     */
    _extractPassiveSkills(markdown) {
        const skills = [];
        const passiveSection = this._extractSection(markdown, '## Passive Skills', '## Battle Skills');
        
        if (!passiveSection) return skills;

        const skillBlocks = this._parseAsideBlocks(passiveSection);
        
        for (const block of skillBlocks) {
            const skill = this._parseSkillBlock(block, 'passive');
            if (skill) skills.push(skill);
        }

        return skills;
    }

    /**
     * Extract battle skills section
     */
    _extractBattleSkills(markdown) {
        const skills = [];
        const battleSection = this._extractSection(markdown, '## Battle Skills', '## Notes');
        
        if (!battleSection) return skills;

        const skillBlocks = this._parseAsideBlocks(battleSection);
        
        for (const block of skillBlocks) {
            const skill = this._parseSkillBlock(block, 'battle');
            if (skill) skills.push(skill);
        }

        return skills;
    }

    /**
     * Extract latent power information
     */
    _extractLatentPower(markdown) {
        const latentMatch = markdown.match(/\*\*Latent Power:(.*?)\*\*(.*?)(?=##|$)/s);
        
        if (!latentMatch) return null;

        return {
            name: latentMatch[1].trim(),
            description: this._cleanMarkdownText(latentMatch[2]),
            icon: this._extractIconFromText(latentMatch[0]),
            type: 'latent'
        };
    }

    /**
     * Extract ultimate technique information
     */
    _extractUltimateTechnique(markdown) {
        const ultimateSection = this._extractSection(markdown, '## Ultimate Technique', '## EX skill');
        
        if (!ultimateSection) return null;

        const technique = this._parseSkillBlock(ultimateSection, 'ultimate');
        
        if (technique) {
            // Extract level progression data
            const levelMatch = ultimateSection.match(/Lv\.\s*(\d+)→(\d+)/);
            if (levelMatch) {
                technique.levelProgression = {
                    from: parseInt(levelMatch[1]),
                    to: parseInt(levelMatch[2])
                };
            }

            // Extract potency progression
            const potencyMatch = ultimateSection.match(/potency:\s*\*\*(.*?)\*\*/);
            if (potencyMatch) {
                technique.potencyProgression = potencyMatch[1];
            }

            // Extract gauge information
            technique.gaugeInfo = this._extractGaugeInfo(ultimateSection);
        }

        return technique;
    }

    /**
     * Extract EX skill information
     */
    _extractExSkill(markdown) {
        const exSection = this._extractSection(markdown, '## EX skill', '## Awakening IV Accessory');
        
        if (!exSection) return null;

        const exSkill = this._parseSkillBlock(exSection, 'ex');
        
        if (exSkill) {
            // Extract usage conditions and restrictions
            const conditionMatch = exSection.match(/Usage Condition:\s*(.*?)(?=\n|$)/);
            if (conditionMatch) {
                exSkill.usageCondition = conditionMatch[1].trim();
            }

            const usesMatch = exSection.match(/Uses:\s*(\d+)/);
            if (usesMatch) {
                exSkill.uses = parseInt(usesMatch[1]);
            }
        }

        return exSkill;
    }

    /**
     * Extract awakening accessory information
     */
    _extractAwakeningAccessory(markdown) {
        const awakeningSection = this._extractSection(markdown, '## Awakening IV Accessory', '## Differences');
        
        if (!awakeningSection) return null;

        const nameMatch = awakeningSection.match(/\*\*(.*?)\*\*/);
        const statsMatch = awakeningSection.match(/·(.*?)(?=\n|$)/g);
        
        return {
            name: nameMatch ? nameMatch[1] : 'Unknown Accessory',
            stats: statsMatch ? statsMatch.map(stat => stat.replace('·', '').trim()) : [],
            icon: this._extractIconFromText(awakeningSection),
            type: 'awakening'
        };
    }

    /**
     * Extract miscellaneous information (VA, dates, availability)
     */
    _extractMiscInfo(markdown) {
        const miscSection = this._extractSection(markdown, '## Misc.', '## Artwork');
        
        if (!miscSection) return null;

        const info = {};

        // Extract availability
        const availabilityMatch = miscSection.match(/\*\*Availability:\*\*(.*?)(?=\n|$)/);
        if (availabilityMatch) {
            info.availability = availabilityMatch[1].trim();
        }

        // Extract release dates
        const jpDateMatch = miscSection.match(/\*\*JP Release Date:\*\*(.*?)(?=\n|$)/);
        if (jpDateMatch) {
            info.jpReleaseDate = jpDateMatch[1].trim();
        }

        const glDateMatch = miscSection.match(/\*\*GL Release Date:\*\*(.*?)(?=\n|$)/);
        if (glDateMatch) {
            info.glReleaseDate = glDateMatch[1].trim();
        }

        // Extract voice actor
        const vaMatch = miscSection.match(/\*\*V\.A\.:\*\*\s*\[(.*?)\]/);
        if (vaMatch) {
            info.voiceActor = vaMatch[1];
        }

        return info;
    }

    /**
     * Extract artwork information
     */
    _extractArtwork(markdown) {
        const artworkSection = this._extractSection(markdown, '## Artwork', '## Character Trailer');
        
        if (!artworkSection) return null;

        const images = [];
        const imageMatches = artworkSection.match(/!\[.*?\]\((.*?)\)/g);
        
        if (imageMatches) {
            for (const match of imageMatches) {
                const urlMatch = match.match(/!\[.*?\]\((.*?)\)/);
                if (urlMatch) {
                    images.push({
                        url: urlMatch[1],
                        alt: match.match(/!\[(.*?)\]/)?.[1] || 'Character Artwork'
                    });
                }
            }
        }

        return {
            images,
            hasTrailer: markdown.includes('## Character Trailer'),
            hasInfluenceCard: markdown.includes('## Influence Card Reveal')
        };
    }

    /**
     * Extract JP differences section
     */
    _extractDifferences(markdown) {
        const diffSection = this._extractSection(markdown, '## Differences with respect to JP', '## Misc.');
        
        if (!diffSection) return null;

        return {
            hasPassiveDifferences: diffSection.includes('**Passive Skills**'),
            hasBattleDifferences: diffSection.includes('**Battle Skills**'),
            hasUltimateDifferences: diffSection.includes('**Ultimate Technique**'),
            content: this._cleanMarkdownText(diffSection)
        };
    }

    /**
     * Helper: Extract section between two headers
     */
    _extractSection(markdown, startHeader, endHeader) {
        const startIndex = markdown.indexOf(startHeader);
        if (startIndex === -1) return null;

        const endIndex = endHeader ? markdown.indexOf(endHeader, startIndex) : markdown.length;
        if (endIndex === -1) return markdown.substring(startIndex);

        return markdown.substring(startIndex, endIndex);
    }

    /**
     * Helper: Parse aside blocks from markdown
     */
    _parseAsideBlocks(content) {
        const blocks = [];
        const asideMatches = content.match(/<aside>[\s\S]*?<\/aside>/g);
        
        if (asideMatches) {
            for (const match of asideMatches) {
                blocks.push(match);
            }
        }

        return blocks;
    }

    /**
     * Helper: Parse individual skill block
     */
    _parseSkillBlock(block, type) {
        if (!block) return null;

        // Extract skill name
        const nameMatch = block.match(/\*\*(.*?)\*\*/);
        if (!nameMatch) return null;

        const name = nameMatch[1].replace(/\([★✦\d]+\)/, '').trim();
        
        // Extract star rating
        const starMatch = block.match(/\(([★\d]+)\)/);
        const stars = starMatch ? starMatch[1] : null;

        // Extract description (text after skill name)
        const descMatch = block.match(/\*\*.*?\*\*(.*?)(?=<aside>|$)/s);
        const description = descMatch ? this._cleanMarkdownText(descMatch[1]) : '';

        // Extract SP cost
        const spMatch = block.match(/\[(\d+)\s*SP\]/);
        const spCost = spMatch ? parseInt(spMatch[1]) : null;

        // Extract potency
        const potencyMatch = block.match(/potency:\s*([\d\sx×→-]+)/);
        const potency = potencyMatch ? potencyMatch[1] : null;

        // Extract icon
        const icon = this._extractIconFromText(block);

        return {
            name,
            description,
            stars,
            spCost,
            potency,
            icon,
            type,
            rawBlock: block
        };
    }

    /**
     * Helper: Extract icon from markdown text
     */
    _extractIconFromText(text) {
        const iconMatch = text.match(/<img src="(.*?)".*?width="40px"/);
        if (iconMatch) {
            return iconMatch[1];
        }
        return null;
    }

    /**
     * Helper: Extract gauge information from ultimate technique
     */
    _extractGaugeInfo(content) {
        const info = {};

        const usesMatch = content.match(/Uses:\s*([\d→]+)/);
        if (usesMatch) {
            info.uses = usesMatch[1];
        }

        const initialMatch = content.match(/Initial Gauge:\s*([\d%→]+)/);
        if (initialMatch) {
            info.initialGauge = initialMatch[1];
        }

        const increaseMatch = content.match(/Gauge Increase:\s*([\d%/BP→]+)/);
        if (increaseMatch) {
            info.gaugeIncrease = increaseMatch[1];
        }

        return info;
    }

    /**
     * Helper: Clean markdown text (remove HTML, excessive whitespace)
     */
    _cleanMarkdownText(text) {
        return text
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
    }

    /**
     * Helper: Get cache priority based on character tier
     */
    _getCachePriority(character) {
        const tier = character.basic_info.tier?.gl || 'D';
        const priorityMap = {
            'S+': 'high',
            'S': 'high',
            'A': 'medium',
            'B': 'medium',
            'C': 'low',
            'D': 'low'
        };
        return priorityMap[tier] || 'low';
    }

    /**
     * Get fallback icon for content type
     */
    getFallbackIcon(type) {
        return this.fallbackIcons[type] || this.fallbackIcons.default;
    }

    /**
     * Check if content is loading
     */
    isContentLoading() {
        return this.isLoading;
    }

    /**
     * Clear cache (for memory management)
     */
    clearCache() {
        this.cache.clear();
        console.log('✅ Markdown cache cleared');
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
    }
}

// Export for global use
window.MarkdownIntegrator = MarkdownIntegrator;