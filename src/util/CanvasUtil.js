
const canvas = document.createElement('canvas');
const SIZE = 256;
canvas.width = canvas.height = SIZE;


export function generateImage(key, debug) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    if (debug) {
        ctx.fillStyle = 'red';
        ctx.strokeStyle = 'rgba(255,0,0,0.4)';
        ctx.lineWidth = 0.2;
        const text = key || 'tile';
        ctx.font = '18px sans-serif';
        ctx.rect(0, 0, SIZE, SIZE);
        ctx.stroke();
        ctx.fillText(text, 15, SIZE / 2);
    }
    return canvas.toDataURL();
}


export function Canvas(width = 1, height = 1) {
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
