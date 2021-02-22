/**
 * provide a simple geo function
 */
import * as maptalks from 'maptalks';

const PI = Math.PI / 180;
const R = 6378137;
const MINLENGTH = 1;


function formatLineArray(polyline: maptalks.LineString): Array<Array<number>> {
    const lnglats = polyline.getCoordinates();
    return lnglats.map(lnglat => {
        return lnglat.toArray();
    });
}

function degreesToRadians(d: number): number {
    return d * PI;
}



export function distance(c1: Array<number> | maptalks.Coordinate, c2: Array<number> | maptalks.Coordinate): number {
    if (!c1 || !c2) {
        return 0;
    }
    if (!Array.isArray(c1)) {
        c1 = c1.toArray();
    }
    if (!Array.isArray(c2)) {
        c2 = c2.toArray();
    }
    let b = degreesToRadians(c1[1]);
    const d = degreesToRadians(c2[1]),
        e = b - d,
        f = degreesToRadians(c1[0]) - degreesToRadians(c2[0]);
    b = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(e / 2), 2) + Math.cos(b) * Math.cos(d) * Math.pow(Math.sin(f / 2), 2)));
    b *= R;
    return Math.round(b * 1E5) / 1E5;
}


export function lineLength(polyline: Array<Array<number>> | maptalks.LineString): number {
    let lnglatArray = polyline;
    if (!Array.isArray(polyline)) {
        lnglatArray = formatLineArray(polyline);
    }
    let l = 0;
    for (let i = 0, len = (lnglatArray as Array<Array<number>>).length; i < len - 1; i++) {
        l += distance((lnglatArray as Array<Array<number>>)[i], (lnglatArray as Array<Array<number>>)[i + 1]);
    }
    return l;
}


function getPercentLngLat(l: any, length: number): Array<number> {
    const { len, c1, c2 } = l;
    const dx = c2[0] - c1[0],
        dy = c2[1] - c1[1];
    const percent = length / len;
    const lng = c1[0] + percent * dx;
    const lat = c1[1] + percent * dy;
    return [lng, lat];
}



/**
 * This is not an accurate line segment cutting method, but rough, in order to speed up the calculation,
 * the correct cutting algorithm can be referred to. http://turfjs.org/docs/#lineChunk
 * @param {*} cs
 * @param {*} lineChunkLength
 */
export function lineSlice(cs: Array<Array<number>> | maptalks.LineString, lineChunkLength = 10): Array<Array<Array<number>>> {
    lineChunkLength = Math.max(lineChunkLength, MINLENGTH);
    if (!Array.isArray(cs)) {
        cs = formatLineArray(cs);
    }
    const LEN = cs.length;
    let list = [];
    let totalLen = 0;
    for (let i = 0; i < LEN - 1; i++) {
        const len = distance(cs[i], cs[i + 1]);
        const floorlen = Math.floor(len);
        list.push({
            c1: cs[i],
            len: floorlen,
            c2: cs[i + 1]
        });
        totalLen += floorlen;
    }
    if (totalLen <= lineChunkLength) {
        const lnglats = list.map(d => {
            return [d.c1, d.c2];
        });
        return lnglats;
    }
    if (list.length === 1) {
        if (list[0].len <= lineChunkLength) {
            return [
                [list[0].c1, list[0].c2]
            ];
        }
    }

    const LNGLATSLEN = list.length;
    const first = list[0];

    let idx = 0;
    let currentLngLat;
    let currentLen = 0;
    const lines = [];
    let lls = [first.c1];
    while (idx < LNGLATSLEN) {
        const { len, c2 } = list[idx];
        currentLen += len;
        if (currentLen < lineChunkLength) {
            lls.push(c2);
            if (idx === LNGLATSLEN - 1) {
                lines.push(lls);
            }
            idx++;
        }
        if (currentLen === lineChunkLength) {
            lls.push(c2);
            currentLen = 0;
            lines.push(lls);
            //next
            lls = [c2];
            idx++;
        }
        if (currentLen > lineChunkLength) {
            const offsetLen = (len - currentLen + lineChunkLength);
            currentLngLat = getPercentLngLat(list[idx], offsetLen);
            lls.push(currentLngLat);
            lines.push(lls);
            currentLen = 0;
            list[idx].c1 = currentLngLat;
            list[idx].len = len - offsetLen;
            //next
            lls = [];
            lls.push(currentLngLat);
        }
    }
    return lines;
}
