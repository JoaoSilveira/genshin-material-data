import { HTMLElement } from "node-html-parser";
import { extractCharactersFromCardList, getImageSrc, sanitize, walk } from "./html-function";
import Database from "bun:sqlite";

export type LocalSpecialty = {
    name: string;
    image: string;
    region: string;
    characters: string[];
};

export function extractLocalSpecialties(page: HTMLElement): LocalSpecialty[] {
    const specialties = [];

    const headlines = page.querySelectorAll('h3>.mw-headline')
        .filter(e => e.id.match(/\d$/));

    for (const head of headlines) {
        let row = walk(head, '^>v v>');

        do {
            const image = walk(row, 'vvv vvv vv');
            const name = walk(row, 'vv$v');
            const charactersContainer = walk(row, '$v', true);

            specialties.push({
                name: sanitize(name.textContent),
                image: getImageSrc(image),
                region: sanitize(head.textContent),
                characters: charactersContainer ? extractCharactersFromCardList(charactersContainer) : [],
            });

            row = row.nextElementSibling;
        } while (row);
    }

    return specialties;
}

export function storeLocalSpecialties(db: Database, localSpecialties: LocalSpecialty[]): void {
    const insert = db.prepare("insert into region (name, image, region_id) values ($name, $image, select id from region where name = $region)");
    const insertMany = db.transaction((localSpecialties: LocalSpecialty[]) => {
        for (const localSpecialty of localSpecialties)
            insert.run({ $name: localSpecialty.name, $image: localSpecialty.image, $region: localSpecialty.region });
    });

    insertMany(localSpecialties);
}