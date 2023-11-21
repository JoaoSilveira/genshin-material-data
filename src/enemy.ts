import { HTMLElement } from "node-html-parser";
import { filterElementsOnly, getImageSrc, sanitize, walk } from "./html-function";
import Database from "bun:sqlite";

export type Enemy = {
    name: string;
    image: string;
};

export function extractEnemies(page: HTMLElement): Enemy[] {
    const enemies: Enemy[] = [];
    const headlines = page.querySelectorAll('h2>.mw-headline');

    for (const head of headlines) {
        const container = walk(head, '^>>');

        container
            .childNodes
            .filter(filterElementsOnly)
            .map((card): Enemy => {
                const image = walk(card, 'vvv vvv');
                const name = walk(card, '$v');

                return {
                    name: sanitize(name.textContent),
                    image: getImageSrc(image),
                };
            })
            .forEach(enemy => enemies.push(enemy));
    }

    return enemies;
}

export function storeEnemies(db: Database, enemies: Enemy[]): void {
    const insert = db.prepare("insert into region (name, image) values ($name, $image)");
    const insertMany = db.transaction((enemies: Enemy[]) => {
        for (const enemy of enemies)
            insert.run({ $name: enemy.name, $image: enemy.image });
    });

    insertMany(enemies);
}