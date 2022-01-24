
const canvas: HTMLCanvasElement = document.createElement('canvas');
const SIZE: number = 256;
canvas.width = canvas.height = SIZE;
let DEFAULT_IMAGE;


export function generateImage(key: string, debug: boolean = false): string {
    if (DEFAULT_IMAGE) {
        return DEFAULT_IMAGE;
    }

    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    DEFAULT_IMAGE = canvas.toDataURL();
    return DEFAULT_IMAGE;
}


export function createCanvas(width: number = 1, height: number = 1): HTMLCanvasElement {
    let canvas;
    if (typeof document === 'undefined') {
        // var Canvas = require('canvas');
        // canvas = new Canvas(width, height);
    } else {
        canvas = document.createElement('canvas');
        if (width) {
            canvas.width = width;
        }
        if (height) {
            canvas.height = height;
        }
    }
    return canvas;
}
