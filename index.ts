import { HTMLElement } from "node-html-parser";
import { extractWeaponTypes } from "./src/weapon-type";
import { fetchPage, readPage } from "./src/html-function";
import { extractLocalSpecialties } from "./src/local-specialty";
import { extractRegions } from "./src/region";
import { extractElementTypes } from "./src/element-type";
import { extractEnemies } from "./src/enemy";
import { extractEnemyDrops } from "./src/enemy-drop";
import { extractWeapons } from "./src/weapon";
import { extractCharacters } from "./src/character";
import { extractTalentBossForCharacters } from "./src/talent-boss-character";
import { extractAscensionBossForCharacters } from "./src/ascension-boss-character";
import { extractWeaponAscensionMaterials } from "./src/weapon-ascension-material";
import { extractGems } from "./src/gem";
import { extractTalentMaterials } from "./src/talent-material";
import { extractWeeklyBosses } from "./src/weekly-boss";
import { extractAscensionBosses } from "./src/ascension-boss-material";

async function fetchImages(obj: any): Promise<void> {
    async function fetchImage(url: string): Promise<string> {
        const filename = url.substring(url.lastIndexOf('/') + 1);
        const path = `images/${filename}`;
        const imageExists = await Bun.file(path).exists();

        if (imageExists)
            return path;

        const request = await fetch(url);
        await Bun.write(path, request);

        return path;
    }

    if (typeof obj !== 'object')
        return;

    for (const [prop, value] of Object.entries(obj)) {
        if (prop === 'image' && typeof value === 'string') {
            obj.image = await fetchImage(value);
        }

        if (typeof value !== 'object')
            continue;

        if (!Array.isArray(value)) {
            await fetchImages(value);
            continue;
        }

        for (const item of value) {
            await fetchImages(item);
        }
    }
}

const fetchUnit = {
    localSpecialty: {
        url: 'https://genshin-impact.fandom.com/wiki/Local_Specialty',
        file: 'local-specialty',
        extractor: extractLocalSpecialties,
    },
    regions: {
        url: 'https://genshin-impact.fandom.com/wiki/Teyvat',
        file: 'region',
        extractor: extractRegions,
    },
    weaponType: {
        url: 'https://genshin-impact.fandom.com/wiki/Weapon',
        file: 'weapon-type',
        extractor: extractWeaponTypes,
    },
    elementType: {
        url: 'https://genshin-impact.fandom.com/wiki/Element',
        file: 'element-type',
        extractor: extractElementTypes,
    },
    enemy: {
        url: 'https://genshin-impact.fandom.com/wiki/Enemy/List',
        file: 'enemy',
        extractor: extractEnemies,
    },
    enemyDrop: {
        url: 'https://genshin-impact.fandom.com/wiki/Character_and_Weapon_Enhancement_Material',
        file: 'enemy-drop',
        extractor: extractEnemyDrops,
    },
    weaponList: {
        url: 'https://genshin-impact.fandom.com/wiki/Weapon/List/By_Weapon_Type',
        file: 'weapon',
        extractor: extractWeapons,
    },
    characterList: {
        url: 'https://genshin-impact.fandom.com/wiki/Character/List',
        file: 'character',
        extractor: extractCharacters,
    },
    talentCharacterBoss: {
        url: 'https://genshin-impact.fandom.com/wiki/Talent/Leveling',
        file: 'talent-character-boss',
        extractor: extractTalentBossForCharacters,
    },
    ascensionCharacterBoss: {
        url: 'https://genshin-impact.fandom.com/wiki/Character/Ascension',
        file: 'ascension-character-boss',
        extractor: extractAscensionBossForCharacters,
    },
    weaponAscensionMaterial: {
        url: 'https://genshin-impact.fandom.com/wiki/Weapon_Ascension_Material',
        file: 'weapon-ascension-material',
        extractor: extractWeaponAscensionMaterials,
    },
    gem: {
        url: 'https://genshin-impact.fandom.com/wiki/Character_Ascension_Material',
        file: 'gem',
        extractor: extractGems,
    },
    talentMaterial: {
        url: 'https://genshin-impact.fandom.com/wiki/Character_Talent_Material',
        file: 'talent',
        extractor: extractTalentMaterials,
    },
    weeklyBoss: {
        url: 'https://genshin-impact.fandom.com/wiki/Weekly_Boss',
        file: 'weekly-boss',
        extractor: extractWeeklyBosses,
    },
    ascensionBoss: {
        url: 'https://genshin-impact.fandom.com/wiki/Normal_Boss',
        file: 'ascension-boss',
        extractor: extractAscensionBosses,
    },
}

async function fetchAllImages(): Promise<void> {
    for (const unit of Object.values(fetchUnit)) {
        const filepath = `data/${unit.file}.json`;
        const jsonFile = await Bun.file(filepath).json();

        if (typeof jsonFile !== 'object') continue;

        await fetchImages(jsonFile);
        await Bun.write(filepath, JSON.stringify(jsonFile, undefined, 2));
    }
}

async function fetchAndExtractPages(): Promise<void> {
    const fetchResults = await Promise.allSettled(
        Object.entries(fetchUnit)
            .map(async ([unit, meta]) => {
                const pagepath = `./pages/${meta.file}.html`;
                const pageExists = await Bun.file(pagepath).exists();
                let page: HTMLElement;

                if (pageExists) {
                    page = await readPage(pagepath);
                } else {
                    page = await fetchPage(meta.url);
                    await Bun.write(pagepath, page.toString());
                }

                const filepath = `./data/${meta.file}.json`;
                const fileExists = await Bun.file(filepath).exists();

                if (fileExists) {
                    return;
                }

                const extracted = meta.extractor(page);

                await Bun.write(filepath, JSON.stringify(extracted, undefined, 2));
            })
    );

    fetchResults.forEach(r => {
        if (r.status === 'rejected')
            console.error('Failed fetching', r.reason);
    });
}