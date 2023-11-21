import { HTMLElement } from "node-html-parser";
import { assertElement, childrenOf, getImageSrc, sanitize, walk } from "./html-function";

export type CharacterTalentMaterial = {
    name: string;
    image: string;
    stars: number;
};

export type CharacterTalentMaterialTier = {
    temple: string;
    name: string;
    region: string;
    days: string[];
    low: CharacterTalentMaterial;
    mid: CharacterTalentMaterial;
    high: CharacterTalentMaterial;
    characters: string[];
};

export function extractTalentMaterials(page: HTMLElement): CharacterTalentMaterialTier[] {
    const header = assertElement(
        page.getElementById('Talent_Books'),
        'Could not locate header of talent page'
    );
    const mats: CharacterTalentMaterialTier[] = [];

    let region: HTMLElement = walk(header, '^ >>>>> v');
    do {
        let temple = walk(region, '^>v');
        let row = walk(region, '^>>vv>');

        do {
            const days = walk(row, 'v');
            const name = walk(row, 'v>v');
            const materials = childrenOf(walk(row, 'v>'))
                .slice(2) // skip name and <BR/>
                .map(card => {
                    const name = walk(card, 'vvv vv');
                    const image = walk(card, 'vvv vvv');
                    const stars = walk(card, 'vvv >vv');

                    return {
                        name: sanitize(name.attributes['title']),
                        image: getImageSrc(image),
                        stars: parseInt(stars.attributes['alt'].at(-1)!),
                    };
                });
            const characters = childrenOf(walk(row, '$v'))
                .map(card => sanitize(walk(card, 'vv$').textContent));

            mats.push({
                temple: sanitize(temple.textContent),
                name: sanitize(name.textContent),
                days: ['Sunday', ...days.textContent.split('/').map(sanitize)],
                region: sanitize(region.textContent),
                low: materials[0],
                mid: materials[1],
                high: materials[2],
                characters,
            })

            row = row.nextElementSibling;
        } while (row.nextElementSibling); // skip last row (sunday)

        region = walk(region, '^>> >v');
    } while (region.parentNode.tagName === 'H3');

    return mats;
}