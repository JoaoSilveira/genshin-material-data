import { HTMLElement } from "node-html-parser";
import { getImageSrc, sanitize, walk } from "./html-function";

export type Character = {
    name: string;
    image: string;
    stars: number;
    element?: string;
    weapon: string;
    region?: string;
};

export function extractCharacters(page: HTMLElement): Character[] {
    const playableHeader = page.getElementById('Playable_Characters');

    const characters: Character[] = [];

    let row = walk(playableHeader, '^>> vv>');
    do {
        const image = walk(row, 'vvv');
        const name = walk(row, 'v>v');
        const stars = walk(row, 'v>> v');
        const element = walk(row, 'v>>> v$', true);
        const weapon = walk(row, 'v>>>> v$');
        const region = walk(row, 'v>>>>> v$', true);

        characters.push({
            name: sanitize(name.textContent),
            image: getImageSrc(image),
            stars: parseInt(stars.attributes['alt'].charAt(0)),
            element: element && sanitize(element.textContent),
            weapon: sanitize(weapon.textContent),
            region: region && sanitize(region.textContent),
        });

        row = row.nextElementSibling;
    } while (row);


    return characters;
}