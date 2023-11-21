import { HTMLElement } from "node-html-parser";
import { assertElement, getImageSrc, sanitize, walk } from "./html-function";
import Database from "bun:sqlite";

export type Region = {
    name: string;
    image: string;
};

export function extractRegions(page: HTMLElement): Region[] {
    const regions = [];

    const header = assertElement(
        page.querySelector('#Major_Nations'),
        'Region page is missing #Major_Nations'
    );

    let row = walk(header, '^> vv>');
    do {
        const image = walk(row, 'vvv');
        const name = walk(row, 'v$');

        regions.push({
            name: sanitize(name.textContent),
            image: getImageSrc(image),
        });

        row = row.nextElementSibling;
    } while (row);

    return regions;
}

export function storeRegions(db: Database, regions: Region[]): void {
    const insert = db.prepare("insert into region (name, image) values ($name, $image)");
    const insertMany = db.transaction((regions: Region[]) => {
        for (const region of regions)
            insert.run({ $name: region.name, $image: region.image });
    });

    insertMany(regions);
}