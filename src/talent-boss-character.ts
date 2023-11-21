import { HTMLElement } from "node-html-parser";
import { assertElement, sanitize, walk } from "./html-function";

export function extractTalentBossForCharacters(page: HTMLElement): Record<string, string> {
    const table = assertElement(
        page.querySelector('table.fandom-table'),
        'Could not locate talent boss table'
    );

    const data: Record<string, string> = {};
    let row = walk(table, 'vv>');
    do {
        const character = sanitize(walk(row, 'vvvv$').textContent);
        const material = sanitize(walk(row, '$v$v').textContent);

        data[character] = material;

        row = row.nextElementSibling;
    } while (row);

    return data;
}