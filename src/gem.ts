import { HTMLElement } from "node-html-parser";
import { assertElement, childrenOf, getImageSrc, sanitize, walk } from "./html-function";

export type Gem = {
    name: string;
    image: string;
    stars: number;
};

export type GemTier = {
    name: string;
    element: string;
    low: Gem;
    mid: Gem;
    high: Gem;
    highest: Gem;
};

export function extractGems(page: HTMLElement): GemTier[] {
    const table = assertElement(
        page.querySelector('table.wikitable'),
        'Could not locate table in Gem page.'
    );

    const gems: GemTier[] = [];

    let row = walk(table, 'vv>');
    do {
        const name = walk(row, 'vv');
        const mats = childrenOf(walk(row, 'v'))
            .slice(2) // skip name and <BR>
            .map(card => {
                const image = walk(card, 'vvv vvv');
                const stars = walk(card, 'vvv >vv');

                return {
                    name: sanitize(image.attributes['alt']),
                    image: getImageSrc(image),
                    stars: parseInt(stars.attributes['alt'].at(-1)!),
                };
            });
        const element = walk(row, '$v $v', true) ?? walk(row, '$$');

        gems.push({
            name: sanitize(name.textContent),
            element: sanitize(element.textContent),
            low: mats[0],
            mid: mats[1],
            high: mats[2],
            highest: mats[3],
        });

        row = row.nextElementSibling;
    } while (row);

    return gems;
}