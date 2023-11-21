import { HTMLElement } from "node-html-parser";
import { assertElement, childrenOf, getImageSrc, sanitize, walk } from "./html-function";
import Database from "bun:sqlite";

export type WeeklyBossMaterial = {
    name: string;
    image: string;
    stars: number;
};

export type WeeklyBoss = {
    name: string;
    image: string;
    region: string;
    materials: WeeklyBossMaterial[];
};

export function extractWeeklyBosses(page: HTMLElement): WeeklyBoss[] {
    const table = assertElement(
        page.querySelector('table.wikitable.tdc1'),
        'Could not locate table of weekly boss page'
    );
    const bosses: WeeklyBoss[] = [];

    let row = walk(table, 'vv>');
    do {
        const isValidRow = childrenOf(row).length > 1;
        if (!isValidRow) {
            row = row.nextElementSibling;
            continue;
        }

        const name = walk(row, 'vv$v');
        const image = walk(row, 'vvvv vvvv');
        const region = walk(row, 'v$');
        const materials = childrenOf(walk(row, '$'))
            .slice(0, 3)
            .map(card => {
                const image = walk(card, 'vvv vvv');
                const stars = walk(card, 'vvv> vv');

                return {
                    name: sanitize(image.attributes['alt']),
                    image: getImageSrc(image),
                    stars: parseInt(stars.attributes['alt'].at(-1)!),
                };
            });

        bosses.push({
            name: sanitize(name.textContent),
            image: getImageSrc(image),
            region: sanitize(region.textContent),
            materials,
        });

        row = row.nextElementSibling;
    } while (row);

    return bosses;
}

function storeWeeklyBosses(db: Database, bosses: WeeklyBoss[]): void {
    const insert = db.prepare("insert into boss_material (name, image, stars, boss_id) values ($name, $image, $stars, select id from enemy where name = $enemyName)");
    const insertMany = db.transaction((bosses: WeeklyBoss[]) => {
        for (const boss of bosses) {
            for (const mat of boss.materials) {
                insert.run({
                    $name: mat.name,
                    $image: mat.image,
                    $stars: mat.stars,
                    $enemyName: boss.name,
                });
            }
        }
    });

    insertMany(bosses);
}