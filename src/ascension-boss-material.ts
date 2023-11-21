import Database from "bun:sqlite";
import { HTMLElement } from "node-html-parser";
import { childrenOf, getImageSrc, sanitize, walk } from "./html-function";

// TODO fix that some bosses can have more than 1 material
export type AscensionBossMaterial = {
    name: string;
    image: string;
    stars: number;
};

export type AscensionBoss = {
    name: string;
    image: string;
    region: string;
    material: AscensionBossMaterial;
};

function isCardBossMaterial(card: HTMLElement): boolean {
    return walk(card, 'vvv> vv', true)?.attributes['alt'].at(-1) === '4' && /WL\s?0\+/.test(walk(card, 'vv$', true)?.textContent!);
}

export function extractAscensionBosses(page: HTMLElement): AscensionBoss[] {
    const tables = page.querySelectorAll('table.wikitable')
        .filter(table => table.previousElementSibling?.tagName === 'H3');

    const bosses: AscensionBoss[] = [];

    for (const table of tables) {
        let row = walk(table, 'vv>');

        do {
            const name = walk(row, 'vv$v');
            const image = walk(row, 'vvvv vvvv');
            const region = walk(row, 'v$');
            const materialCards = childrenOf(walk(row, '$'))
                .filter(isCardBossMaterial);

            if (materialCards.length < 1)
                throw new Error(`Could not find material for boss "${sanitize(name.textContent)}"`);

            for (const materialCard of materialCards) {
                const materialImage = walk(materialCard, 'vvv vvv');
                const materialStars = walk(materialCard, 'vvv> vv');

                bosses.push({
                    name: sanitize(name.textContent),
                    image: getImageSrc(image),
                    region: sanitize(region.textContent),
                    material: {
                        name: sanitize(materialImage.attributes['alt']),
                        image: getImageSrc(materialImage),
                        stars: parseInt(materialStars.attributes['alt'].at(-1)!)
                    },
                });
            }

            row = row.nextElementSibling;
        } while (row);
    }

    return bosses;
}

export function storeAscensionBosses(db: Database, bosses: AscensionBoss[]): void {
    const insert = db.prepare("insert into boss_material (name, image, stars, boss_id) values ($name, $image, $stars, select id from enemy where name = $enemyName)");
    const insertMany = db.transaction((bosses: AscensionBoss[]) => {
        for (const boss of bosses)
            insert.run({
                $name: boss.material.name,
                $image: boss.material.image,
                $stars: boss.material.stars,
                $enemyName: boss.name,
            });
    });

    insertMany(bosses);
}