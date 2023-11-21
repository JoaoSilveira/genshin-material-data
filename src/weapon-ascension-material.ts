import { HTMLElement } from "node-html-parser";
import { childrenOf, getImageSrc, sanitize, walk } from "./html-function";

export type WeaponAscensionMaterial = {
    name: string;
    image: string;
    stars: number;
};

export type WeaponAscensionMaterialTier = {
    temple: string;
    region: string;
    days: string[];
    low: WeaponAscensionMaterial;
    mid: WeaponAscensionMaterial;
    high: WeaponAscensionMaterial;
    highest: WeaponAscensionMaterial;
    weapons: string[];
};

export function extractWeaponAscensionMaterials(page: HTMLElement): WeaponAscensionMaterialTier[] {
    const header = page.getElementById('Weapon_Ascension_Materials_by_Region');
    const mats: WeaponAscensionMaterialTier[] = [];

    let region: HTMLElement = walk(header, '^>v');
    do {
        let temple = walk(region, '^>v');
        let row = walk(region, '^>>vv>');

        do {
            const days = walk(row, 'v');
            const materials = childrenOf(walk(row, 'v>'))
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
            const weapons = childrenOf(walk(row, '$v'))
                .map(card => {
                    return sanitize(walk(card, 'vvv vv').attributes['title']);
                });

            mats.push({
                temple: sanitize(temple.textContent),
                days: ['Sunday', ...days.textContent.split('/').map(sanitize)],
                region: sanitize(region.textContent),
                low: materials[0],
                mid: materials[1],
                high: materials[2],
                highest: materials[3],
                weapons,
            })

            row = row.nextElementSibling;
        } while (row.nextElementSibling); // skip last row (sunday)

        region = walk(region, '^>> >v');
    } while (region.parentNode.tagName === 'H3');

    return mats;
}