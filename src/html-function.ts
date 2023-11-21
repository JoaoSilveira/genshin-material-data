import parse, { HTMLElement, Node, NodeType } from "node-html-parser";


// todo: implement repetition in [movement]{times} format
export function walk(element: HTMLElement, directions: string): HTMLElement;
export function walk(element: HTMLElement, directions: string, returnUndefined: true): HTMLElement | undefined;
export function walk(element: HTMLElement, directions: string, returnUndefined?: true): HTMLElement | undefined {
    let cursor: HTMLElement | undefined = element;

    for (const char of directions) {
        if (!cursor) break;

        switch (char) {
            case '>':
                cursor = cursor.nextElementSibling;
                break;
            case '<':
                cursor = cursor.previousElementSibling;
                break;
            case '^':
                cursor = cursor.parentNode;
                break;
            case 'v':
                cursor = cursor.childNodes.find(n => n.nodeType === NodeType.ELEMENT_NODE) as HTMLElement | undefined;
                break;
            case '$':
                cursor = cursor.childNodes.findLast(n => n.nodeType === NodeType.ELEMENT_NODE) as HTMLElement | undefined;
                break;
            case ' ':
                break;
            default:
                throw new Error(`Invalid character in path "${directions}".`);
        }
    }

    if (!cursor) {
        if (returnUndefined) return undefined;

        throw new Error(`Invalid path "${directions}" for element ${element.tagName}`);
    }

    return cursor;
}

export function childrenOf(parent: HTMLElement): HTMLElement[] {
    return parent.childNodes.filter(filterElementsOnly);
}

export function extractCharactersFromCardList(cardList: HTMLElement): string[] {
    return cardList.childNodes
        .filter(filterElementsOnly)
        .map(e => sanitize(walk(e, 'vv$').textContent));
}

export function extractWeaponsFromCardList(cardList: HTMLElement): string[] {
    return cardList.childNodes
        .filter(filterElementsOnly)
        .map(e => sanitize(e.querySelector('.card-image img')?.attributes['alt']!));
}

export async function fetchPage(url: string): Promise<HTMLElement> {
    const response = await fetch(url);

    return parse(await response.text());
}

export async function readPage(filepath: string): Promise<HTMLElement> {
    return parse(await Bun.file(filepath).text());
}

export function assertElement(maybeElement: HTMLElement | undefined | null, message?: string): HTMLElement {
    if (!maybeElement)
        throw new Error(message ?? 'Expected element but got undefined');

    return maybeElement;
}

export function getImageSrc(image: HTMLElement): string {
    const src = [image.attributes['src'], image.attributes['data-src']]
        .find(img => !!img && img.startsWith('https://'));

    if (!src)
        throw new Error('Could not find image src');

    const revisionIndex = src.indexOf('/revision/');

    return revisionIndex > 0 ? src.substring(0, revisionIndex) : src;
}

export function filterElementsOnly(node: Node): node is HTMLElement {
    return node.nodeType === NodeType.ELEMENT_NODE;
}

export function sanitize(text: string): string {
    text = text.replaceAll(/\s+/g, ' ').trim();
    text = text.replaceAll(/\u{00ad}/gu, '');

    return text;
}

export type ExtractCardParams = {
    name: 'title' | 'caption' | 'text';
    stars: 'last' | 'first';
};

// TODO make a function to extract info from cards
export function extractCard(args: ExtractCardParams): any {

}