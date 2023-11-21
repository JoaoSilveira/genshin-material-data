import { HTMLElement } from "node-html-parser";
import { assertElement, getImageSrc, sanitize, walk } from "./html-function";
import Database from "bun:sqlite";

export type ElementType = {
    name: string;
    image: string;
};

export function extractElementTypes(page: HTMLElement): ElementType[] {
    const header = assertElement(
        page.querySelector('#List_of_Elements'),
        'Element page is missing #List_of_Elements'
    );

    let gallery = walk(header, '^>');

    return gallery.querySelectorAll('.wikia-gallery-item')
        .map(item => {
            const image = walk(item, 'vvv$');
            const name = walk(item, '$v');

            return {
                name: sanitize(name.textContent),
                image: getImageSrc(image),
            };
        });
}

export function storeElementTypes(db: Database, elementTypes: ElementType[]): void {
    const insert = db.prepare("insert into element_type (name, image) values ($name, $image)");
    const insertMany = db.transaction((elementTypes: ElementType[]) => {
        for (const elementType of elementTypes)
            insert.run({ $name: elementType.name, $image: elementType.image });
    });

    insertMany(elementTypes);
}