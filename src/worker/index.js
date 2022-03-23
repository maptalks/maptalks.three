import { extrudePolygon, extrudePolyline } from 'deyihu-geometry-extrude';

export const initialize = function () {
};

export const onmessage = function (message, postResponse) {
    const data = message.data;
    let { type, datas, glRes, matrix, center } = data;
    if (type === 'ExtrudePolygons') {
        generateData(datas, center, glRes, matrix);
        const result = generateExtrude(datas);
        postResponse(null, result, [result.position, result.normal, result.uv, result.indices]);
    } else if (type === 'ExtrudeLines') {
        for (let i = 0, len = datas.length; i < len; i++) {
            for (let j = 0, len1 = datas[i].data.length; j < len1; j++) {
                datas[i].data[j] = arrayBufferToArray(datas[i].data[j], datas[i].center || center, glRes, matrix);
            }
        }
        const result = generateExtrude(datas, true);
        postResponse(null, result, [result.position, result.normal, result.uv, result.indices]);
    } else if (type === 'ExtrudePolygon') {
        const polygons = [], transfer = [];
        datas.forEach(d => {
            const polygon = [d];
            generateData(polygon, center, glRes, matrix);
            const { position, normal, uv, indices } = generateExtrude(polygon);
            polygons.push({
                id: d.id,
                position,
                normal,
                uv,
                indices
            });
            transfer.push(position, normal, uv, indices);
        });
        postResponse(null, polygons, transfer);
    } else if (type === 'Line' || type === 'FatLine') {
        const lines = [], transfer = [];
        for (let i = 0, len = datas.length; i < len; i++) {
            const positionList = [];
            for (let j = 0, len1 = datas[i].data.length; j < len1; j++) {
                datas[i].data[j] = arrayBufferToArray(datas[i].data[j], datas[i].center || center, glRes, matrix);
                const array = lineArrayToFloatArray(datas[i].data[j]);
                positionList.push(getLineSegmentPosition(array));
            }
            const position = mergeLinePositions(positionList);
            setBottomHeight(position, datas[i].bottomHeight);
            lines.push({
                id: datas[i].id,
                position: position.buffer
            });
            transfer.push(position.buffer);
        }
        postResponse(null, lines, transfer);
    } else if (type === 'Lines' || type === 'FatLines') {
        let faceIndex = 0, faceMap = [], geometriesAttributes = [],
            psIndex = 0, positionList = [];
        for (let i = 0, len = datas.length; i < len; i++) {
            let psCount = 0;
            for (let j = 0, len1 = datas[i].data.length; j < len1; j++) {
                datas[i].data[j] = arrayBufferToArray(datas[i].data[j], datas[i].center || center, glRes, matrix);
                const array = lineArrayToFloatArray(datas[i].data[j]);
                setBottomHeight(array, datas[i].bottomHeight);
                psCount += (array.length / 3 * 2 - 2);
                positionList.push(getLineSegmentPosition(array));
            }
            const faceLen = psCount;
            faceMap[i] = [faceIndex, faceIndex + faceLen];
            faceIndex += faceLen;

            geometriesAttributes[i] = {
                position: {
                    count: psCount,
                    start: psIndex,
                    end: psIndex + psCount * 3,
                },
                hide: false
            };
            if (type === 'FatLines') {
                geometriesAttributes[i].instanceStart = {
                    count: psCount,
                    start: psIndex,
                    end: psIndex + psCount * 3,
                };
                geometriesAttributes[i].instanceEnd = {
                    count: psCount,
                    start: psIndex,
                    end: psIndex + psCount * 3,
                };
            }
            psIndex += psCount * 3;
        }
        const position = mergeLinePositions(positionList);
        postResponse(null, {
            id: datas.id,
            position: position.buffer,
            geometriesAttributes,
            faceMap
        }, [position.buffer]);
    } else if (type === 'ExtrudeLine') {
        for (let i = 0, len = datas.length; i < len; i++) {
            for (let j = 0, len1 = datas[i].data.length; j < len1; j++) {
                datas[i].data[j] = arrayBufferToArray(datas[i].data[j], datas[i].center || center, glRes, matrix);
            }
        }
        const lines = [], transfer = [];
        datas.forEach(d => {
            const line = [d];
            const { position, normal, uv, indices } = generateExtrude(line, true);
            lines.push({
                id: d.id,
                position,
                normal,
                uv,
                indices
            });
            transfer.push(position, normal, uv, indices);
        });
        postResponse(null, lines, transfer);
    }
};

const TEMP_COORD = { x: 0, y: 0 }, TEMP_POINT = { x: 0, y: 0 };

function generateData(list, center, glRes, matrix) {
    const len = list.length;
    for (let i = 0; i < len; i++) {
        const { data } = list[i];
        center = list[i].center || center;
        //multi
        for (let j = 0, len1 = data.length; j < len1; j++) {
            const d = data[j];
            //poly
            for (let m = 0, len2 = d.length; m < len2; m++) {
                //ring
                list[i].data[j][m] = arrayBufferToArray(d[m], center, glRes, matrix);
            }
        }
    }
}



function arrayBufferToArray(buffer, center, glRes, matrix) {
    let ps;
    if (glRes) {
        ps = new Float64Array(buffer);
    } else {
        ps = new Float32Array(buffer);
    }
    const vs = [];
    for (let i = 0, len = ps.length; i < len; i += 2) {
        let x = ps[i], y = ps[i + 1];
        if (center && glRes && matrix) {
            TEMP_COORD.x = x;
            TEMP_COORD.y = y;
            let p = coordinateToMercator(TEMP_COORD, TEMP_POINT);
            //is Mercator
            TEMP_COORD.x = p.x;
            TEMP_COORD.y = p.y;

            p = transform(matrix, TEMP_COORD, glRes, TEMP_POINT);


            //is GL point
            x = p.x;
            y = p.y;

            //sub center
            x -= center[0];
            y -= center[1];

        }
        vs.push([x, y]);
    }
    return vs;
}



function generateExtrude(datas, isLine = false) {
    const len = datas.length;
    const geometriesAttributes = [], geometries = [];
    let psIndex = 0;
    for (let i = 0; i < len; i++) {
        const buffGeom = isLine ? extrudeLine(datas[i]) : extrudePolygons(datas[i]);
        const minZ = datas[i].bottomHeight || 0;
        const { position } = buffGeom;
        geometries.push(buffGeom);
        // const faceLen = indices.length / 3;
        // faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
        // faceIndex += faceLen;
        const psCount = position.length / 3;
        //  colorCount = buffGeom.attributes.color.count,
        // normalCount = normal.length / 3, uvCount = uv.length / 2;
        geometriesAttributes[i] = {
            position: {
                middleZ: minZ + (datas[i].height || 0) / 2,
                count: psCount,
                start: psIndex,
                end: psIndex + psCount * 3,
            },
            // normal: {
            //     count: normalCount,
            //     start: normalIndex,
            //     end: normalIndex + normalCount * 3,
            // },
            // // color: {
            // //     count: colorCount,
            // //     start: colorIndex,
            // //     end: colorIndex + colorCount * 3,
            // // },
            // uv: {
            //     count: uvCount,
            //     start: uvIndex,
            //     end: uvIndex + uvCount * 2,
            // },
            hide: false
        };
        psIndex += psCount * 3;
        // normalIndex += normalCount * 3;
        // colorIndex += colorCount * 3;
        // uvIndex += uvCount * 2;
    }
    const geometry = mergeBufferGeometries(geometries);
    const { position, normal, uv, indices } = geometry;
    return { position: position.buffer, normal: normal.buffer, uv: uv.buffer, indices: indices.buffer, geometriesAttributes };

}


function extrudePolygons(d) {
    const { data, height, bottomHeight } = d;
    const { position, normal, uv, indices } = extrudePolygon(
        // polygons same with coordinates of MultiPolygon type geometry in GeoJSON
        // See http://wiki.geojson.org/GeoJSON_draft_version_6#MultiPolygon
        data,
        // Options of extrude
        {
            // Can be a constant value, or a function.
            // Default to be 1.
            depth: height
        }
    );
    setBottomHeight(position, bottomHeight);
    return { position, normal, uv, indices };
}

function extrudeLine(d) {
    const { data, height, width, bottomHeight } = d;
    const { position, normal, uv, indices } = extrudePolyline(data, {
        lineWidth: width,
        depth: height
    });
    setBottomHeight(position, bottomHeight);
    return { position, normal, uv, indices };
}

function mergeBufferAttributes(attributes, arrayLength) {
    const array = new Float32Array(arrayLength);
    let offset = 0;
    for (let i = 0; i < attributes.length; ++i) {
        array.set(attributes[i], offset);
        offset += attributes[i].length;
    }
    return array;
}


function mergeBufferGeometries(geometries) {
    const attributes = {}, attributesLen = {};
    for (let i = 0; i < geometries.length; ++i) {
        const geometry = geometries[i];
        for (let name in geometry) {
            if (attributes[name] === undefined) {
                attributes[name] = [];
                attributesLen[name] = 0;
            }
            attributes[name].push(geometry[name]);
            attributesLen[name] += geometry[name].length;
        }
    }
    // merge attributes
    let mergedGeometry = {};
    let indexOffset = 0;
    let mergedIndex = [];
    for (let name in attributes) {
        if (name === 'indices') {
            const indices = attributes[name];
            for (let i = 0, len = indices.length; i < len; i++) {
                const index = indices[i];
                for (let j = 0, len1 = index.length; j < len1; j++) {
                    mergedIndex.push(index[j] + indexOffset);
                }
                indexOffset += attributes['position'][i].length / 3;
            }

        } else {
            let mergedAttribute = mergeBufferAttributes(attributes[name], attributesLen[name]);
            if (!mergedAttribute) return null;
            mergedGeometry[name] = mergedAttribute;
        }
    }
    mergedGeometry['indices'] = new Uint32Array(mergedIndex);
    return mergedGeometry;
}

function setBottomHeight(position, bottomHeight) {
    if (bottomHeight !== undefined && typeof bottomHeight === 'number' && bottomHeight !== 0) {
        for (let i = 0, len = position.length; i < len; i += 3) {
            position[i + 2] += bottomHeight;
        }
    }
}


const rad = Math.PI / 180,
    metersPerDegree = 6378137 * Math.PI / 180,
    maxLatitude = 85.0511287798;

function coordinateToMercator(lnglat, out) {
    const max = maxLatitude;
    const lng = lnglat.x,
        lat = Math.max(Math.min(max, lnglat.y), -max);
    let c;
    if (lat === 0) {
        c = 0;
    } else {
        c = Math.log(Math.tan((90 + lat) * rad / 2)) / rad;
    }
    const x = lng * metersPerDegree;
    const y = c * metersPerDegree;
    if (out) {
        out.x = x;
        out.y = y;
        return out;
    }
    return {
        x, y
    };
}

function transform(matrix, coordinates, scale, out) {
    const x = matrix[0] * (coordinates.x - matrix[2]) / scale;
    const y = -matrix[1] * (coordinates.y - matrix[3]) / scale;
    if (out) {
        out.x = x;
        out.y = y;
        return out;
    }
    return {
        x, y
    };
}

function lineArrayToFloatArray(coordinates = []) {
    const len = coordinates.length;
    const array = new Float32Array(len * 3);
    for (let i = 0; i < len; i++) {
        const c = coordinates[i];
        const idx = i * 3;
        array[idx] = c[0];
        array[idx + 1] = c[1];
    }
    return array;
}


function getLineSegmentPosition(ps) {
    const position = new Float32Array(ps.length * 2 - 6);
    let j = 0;
    for (let i = 0, len = ps.length / 3; i < len; i++) {
        const x = ps[i * 3], y = ps[i * 3 + 1], z = ps[i * 3 + 2];
        if (i > 0 && i < len - 1) {
            const idx = j * 3;
            position[idx] = x;
            position[idx + 1] = y;
            position[idx + 2] = z;
            j++;
        }
        const idx = j * 3;
        position[idx] = x;
        position[idx + 1] = y;
        position[idx + 2] = z;
        j++;
    }
    return position;
}

function mergeLinePositions(positionsList) {
    let len = 0;
    const l = positionsList.length;
    if (l === 1) {
        return positionsList[0];
    }
    for (let i = 0; i < l; i++) {
        len += positionsList[i].length;
    }
    const position = new Float32Array(len);
    let offset = 0;
    for (let i = 0; i < l; i++) {
        position.set(positionsList[i], offset);
        offset += positionsList[i].length;
    }
    return position;

}

