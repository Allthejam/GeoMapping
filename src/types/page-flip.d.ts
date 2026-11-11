declare module 'page-flip' {
  export class PageFlip {
    constructor(element: HTMLElement, setting: any);
    destroy(): void;
    loadFromHTML(items: NodeListOf<Element> | HTMLElement[]): void;
    loadFromImages(images: string[]): void;
    turnToPage(page: number): void;
    turnToNextPage(): void;
    turnToPrevPage(): void;
    flip(page: number, corner?: 'top' | 'bottom'): void;
    flipNext(corner?: 'top' | 'bottom'): void;
    flipPrev(corner?: 'top' | 'bottom'): void;
    getPageCount(): number;
    getCurrentPageIndex(): number;
    getOrientation(): 'portrait' | 'landscape';
    getBoundsRect(): any;
    update(): void;
    on(event: string, app: (e: any) => void): PageFlip;
    off(event: string): PageFlip;
  }
}
