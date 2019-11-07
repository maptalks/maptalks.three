
/**
 * 
 * this is for test
 * 
 */

const PI = Math.PI / 180;
const R = 6378137;
const MINLENGTH = 1;

function formatLineArray(polyline) {
    const lnglats = polyline.getCoordinates();
    return lnglats.map(lnglat => {
        return lnglat.toArray();
    })
}

function degreesToRadians(d) {
    return d * PI;
}

function distance(c1, c2) {
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

function lineLength(polyline) {
    const lnglatArray = formatLineArray(polyline);
    let l = 0;
    for (let i = 0, len = lnglatArray.length; i < len - 1; i++) {
        l += distance(lnglatArray[i], lnglatArray[i + 1]);
    }
    return l;
}

function getLngLatKey(lnglat) {
    if (!Array.isArray(lnglat)) {
        lnglat = lnglat.toArray();
    }
    return lnglat.join('-').toString();
}

function getPercentLngLat(l, length) {
    const { len, c1, c2 } = l;
    const dx = c2[0] - c1[0],
        dy = c2[1] - c1[1];
    const percent = length / len;
    const lng = c1[0] + percent * dx;
    const lat = c1[1] + percent * dy;
    return [lng, lat];
}

function lineSlice(cs, lineChunkLength = 10) {
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
            ]
        }
    }
    const LNGLATSLEN = list.length;
    const first = list[0];
    // const last = list[list.length - 1];
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
        if (currentLen == lineChunkLength) {
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


function getLinePosition(lineString, layer) {
    const positions = [];
    const positionsV = [];
    if (Array.isArray(lineString) && lineString[0] instanceof THREE.Vector3) {
        for (let i = 0, len = lineString.length; i < len; i++) {
            const v = lineString[i];
            positions.push(v.x, v.y, v.z);
            positionsV.push(v);
        }
    } else {
        if (Array.isArray(lineString)) lineString = new maptalks.LineString(lineString);
        if (!lineString || !(lineString instanceof maptalks.LineString)) return;
        const z = 0;
        const coordinates = lineString.getCoordinates();
        for (let i = 0, len = coordinates.length; i < len; i++) {
            let coordinate = coordinates[i];
            if (Array.isArray(coordinate))
                coordinate = new maptalks.Coordinate(coordinate);
            const v = layer.coordinateToVector3(coordinate, z);
            positions.push(v.x, v.y, v.z);
            positionsV.push(v);
        }
    }
    return {
        positions: positions,
        positionsV: positionsV
    }
}


function getLinesPosition(chunkLines, layer) {
    const positions = [],
        positionsV = [], lnglats = [];
    for (let i = 0, len = chunkLines.length; i < len; i++) {
        const line = chunkLines[i];
        for (let j = 0, len1 = line.length; j < len1; j++) {
            const lnglat = line[j];
            if (lnglats.length > 0) {
                const key = lnglat.join(',').toString();
                const key1 = lnglats[lnglats.length - 1].join(',').toString();
                if (key !== key1) {
                    lnglats.push(lnglat);
                }
            } else {
                lnglats.push(lnglat);
            }
        }
    }
    const z = 0;
    lnglats.forEach(lnglat => {
        const v = layer.coordinateToVector3(lnglat, z);
        positionsV.push(v);
        positions.push(v.x, v.y, v.z);
    });
    return {
        positions: positions,
        positionsV: positionsV,
        lnglats: lnglats
    };
}