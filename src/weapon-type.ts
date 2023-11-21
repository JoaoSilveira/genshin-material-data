import { HTMLElement } from "node-html-parser";
import { assertElement, getImageSrc, sanitize, walk } from "./html-function";
import Database from "bun:sqlite";


export type WeaponType = {
    name: string;
    image: string;
};

export function extractWeaponTypes(page: HTMLElement): WeaponType[] {
    const weaponTypes = [];

    const header = assertElement(
        page.querySelector('#Weapon_Types'),
        'Weapon page is missing #Weapon_Types'
    );

    let row = walk(header, '^> vv>');
    do {
        const image = walk(row, 'vvv');
        const name = walk(row, 'v>v');

        weaponTypes.push({
            name: sanitize(name.textContent),
            image: getImageSrc(image),
        });

        row = row.nextElementSibling;
    } while (row);

    return weaponTypes;
}

export function storeWeaponTypes(db: Database, weaponTypes: WeaponType[]): void {
    const insert = db.prepare("insert into weapon_type (name, image) values ($name, $image)");
    const insertMany = db.transaction((weaponTypes: WeaponType[]) => {
        for (const weaponType of weaponTypes)
            insert.run({ $name: weaponType.name, $image: weaponType.image });
    });

    insertMany(weaponTypes);
}