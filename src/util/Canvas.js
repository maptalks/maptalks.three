/**
 * https://github.com/huiyan-fe/mapv/blob/master/src/utils/Canvas.js
 * @param {*} width
 * @param {*} height
 */

function Canvas(width, height) {

    var canvas;

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

export default Canvas;
