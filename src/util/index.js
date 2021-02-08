import * as maptalks from 'maptalks';

//Using cache to reduce computation
export function distanceToVector3(cache, distance, layer) {
    if (!cache[distance]) {
        cache[distance] = layer.distanceToVector3(distance, distance).x;
    }
    return cache[distance];
}


/**
 *Get the center point of the point set
 * @param {*} coordinates
 */
export function getCenterOfPoints(coordinates = []) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0, len = coordinates.length; i < len; i++) {
        const { coordinate, lnglat, lnglats, xy, xys } = coordinates[i];
        const c = coordinate || lnglat || lnglats || xy || xys || coordinates[i];
        let x, y;
        if (Array.isArray(c)) {
            x = c[0];
            y = c[1];
        } else if (c instanceof maptalks.Coordinate) {
            x = c.x;
            y = c.y;
        }
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }
    return new maptalks.Coordinate((minX + maxX) / 2, (minY + maxY) / 2);
}
