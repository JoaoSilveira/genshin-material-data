import { HTMLElement } from "node-html-parser";
import { childrenOf, extractCharactersFromCardList, extractWeaponsFromCardList, getImageSrc, sanitize, walk } from "./html-function";
import Database from "bun:sqlite";

export type EnemyDrop = {
    name: string;
    image: string;
    stars: number;
};

export type EnemyDropTier = {
    name: string;
    low: EnemyDrop;
    mid: EnemyDrop;
    high: EnemyDrop;
    enemies: string[];
    characters: string[];
    weapons: string[];
};

export function extractEnemyDrops(page: HTMLElement): EnemyDropTier[] {
    const drops: EnemyDropTier[] = [];
    const tables = page.querySelectorAll('.wikitable');

    function enemyTable(
        table: HTMLElement,
        characterExtractor: (e: HTMLElement) => string[],
        weaponExtractor: (e: HTMLElement) => string[],
        next: (row: HTMLElement) => HTMLElement | undefined
    ): void {
        let row: HTMLElement | undefined = walk(table, 'vv>');

        while (row) {
            const groupName = walk(row, 'vv');
            const mats = childrenOf(walk(row, 'v>'))
                .map(card => {
                    const name = walk(card, '$v');
                    const image = walk(card, 'vvv vvv');
                    const stars = walk(card, 'vvv >vv');

                    return {
                        name: sanitize(name.textContent),
                        image: getImageSrc(image),
                        stars: parseInt(stars.attributes['alt'].at(-1)!),
                    };
                });
            const enemies = childrenOf(walk(row, '$v'))
                .map(line => sanitize(walk(line, 'v').textContent));
            const characters = characterExtractor(row);
            const weapons = weaponExtractor(row);

            drops.push({
                name: sanitize(groupName.textContent),
                low: mats[0],
                mid: mats[1],
                high: mats[2],
                enemies,
                characters,
                weapons,
            });

            row = next(row);
        }
    }

    enemyTable(
        tables[0],
        row => extractCharactersFromCardList(walk(row, '>vv')),
        row => extractWeaponsFromCardList(walk(row, '>>vv')),
        e => walk(e, '>>>', true),
    );
    enemyTable(
        tables[1],
        () => [],
        row => extractWeaponsFromCardList(walk(row, '>vv')),
        e => walk(e, '>>', true),
    );

    return drops;
}

export function storeEnemyDrops(db: Database, enemyTiers: EnemyDropTier[], translations: Record<string, string[]>): void {
    const matInsert = db.prepare("insert into material (name, image, stars) values ($name, $image, $stars)");
    const tierInsert = db.prepare("insert into enemy_material_tier (name, image, low_id, mid_id, high_id) values ($name, select id from material where name = $lowMat, select id from material where name = $midMat, select id from material where name = $highMat)");
    const joinInsert = db.prepare("insert into enemy_material_tier_join_enemy (enemy_id, tier_id) values ($enemy, select id from enemy_material_tier where name = $name)");

    const insertMany = db.transaction((enemyTiers: EnemyDropTier[]) => {
        for (const enemyTier of enemyTiers) {
            (['low', 'mid', 'high'] as (keyof EnemyDropTier)[])
                .map(prop => enemyTier[prop] as EnemyDrop)
                .forEach(mat => matInsert.run({ $name: mat.name, $image: mat.image, $stars: mat.stars }));

            tierInsert.run({
                $name: enemyTier.name,
                $lowMat: enemyTier.low.name,
                $midMat: enemyTier.mid.name,
                $highMat: enemyTier.high.name,
            });

            enemyTier.enemies
                .flatMap(e => translations[e])
                .forEach(e =>
                    joinInsert.run({
                        $name: enemyTier.name,
                        $enemy: e,
                    })
                );
        }
    });

    insertMany(enemyTiers);
}