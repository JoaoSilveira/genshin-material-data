import { HTMLElement } from "node-html-parser";
import { getImageSrc, sanitize, walk } from "./html-function";

export type Weapon = {
    name: string;
    image: string;
    stars: number;
    type: string;
};

export function extractWeapons(page: HTMLElement): Weapon[] {
    const headings = page.querySelectorAll('h2>.mw-headline');
    const weapons: Weapon[] = [];

    for (const heading of headings) {
        const weaponType = sanitize(heading.textContent);
        let row = walk(heading, '^>>vv>');
        do {
            const image = walk(row, 'vvv');
            const name = walk(row, 'v>v');
            const stars = walk(row, 'v>>v');

            weapons.push({
                name: sanitize(name.textContent),
                image: getImageSrc(image),
                stars: parseInt(stars.attributes['alt'].charAt(0)),
                type: weaponType,
            });

            row = row.nextElementSibling;
        } while (row);
    }

    return weapons;
}