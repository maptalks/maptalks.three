import { extrudePolygon, extrudePolyline } from 'deyihu-geometry-extrude';

export const initialize = function () {
};

export const onmessage = function (message, postResponse) {
    const data = message.data;
    let { type, datas } = data;
    if (type === 'Polygon') {
        generateData(datas);
        const result = generateExtrude(datas);
        postResponse(null, result, [result.position, result.normal, result.uv, result.indices]);
    } else if (type === 'LineString') {
        for (let i = 0, len = datas.length; i < len; i++) {
            for (let j = 0, len1 = datas[i].data.length; j < len1; j++) {
                datas[i].data[j] = arrayBufferToArray(datas[i].data[j]);
            }
        }
        const result = generateExtrude(datas, true);
        postResponse(null, result, [result.position, result.normal, result.uv, result.indices]);
    }
};


function generateData(list) {
    const len = list.length;
    for (let i = 0; i < len; i++) {
        const { data } = list[i];
        for (let j = 0, len1 = data.length; j < len1; j++) {
            const d = data[j];
            for (let m = 0, len2 = d.length; m < len2; m++) {
                //ring
                list[i].data[j][m] = arrayBufferToArray(d[m]);
            }
        }
    }
}



function arrayBufferToArray(buffer) {
    const ps = new Float32Array(buffer);
    const vs = [];
    for (let i = 0, len = ps.length; i < len; i += 2) {
        const x = ps[i], y = ps[i + 1];
        vs.push([x, y]);
    }
    return vs;
}



function generateExtrude(datas, isLine = false) {
    const len = datas.length;
    const geometriesAttributes = [], geometries = [], faceMap = [];
    let faceIndex = 0, psIndex = 0, normalIndex = 0, uvIndex = 0;
    for (let i = 0; i < len; i++) {
        const buffGeom = isLine ? extrudeLine(datas[i]) : extrudePolygons(datas[i]);
        const { position, normal, uv, indices } = buffGeom;
        geometries.push(buffGeom);
        const faceLen = indices.length / 3;
        faceMap[i] = [faceIndex + 1, faceIndex + faceLen];
        faceIndex += faceLen;
        const psCount = position.length / 3,
            //  colorCount = buffGeom.attributes.color.count,
            normalCount = normal.length / 3, uvCount = uv.length / 2;
        geometriesAttributes[i] = {
            position: {
                count: psCount,
                start: psIndex,
                end: psIndex + psCount * 3,
            },
            normal: {
                count: normalCount,
                start: normalIndex,
                end: normalIndex + normalCount * 3,
            },
            // color: {
            //     count: colorCount,
            //     start: colorIndex,
            //     end: colorIndex + colorCount * 3,
            // },
            uv: {
                count: uvCount,
                start: uvIndex,
                end: uvIndex + uvCount * 2,
            },
            hide: false
        };
        psIndex += psCount * 3;
        normalIndex += normalCount * 3;
        // colorIndex += colorCount * 3;
        uvIndex += uvCount * 2;
    }
    const geometry = mergeBufferGeometries(geometries);
    const { position, normal, uv, indices } = geometry;
    return { position: position.buffer, normal: normal.buffer, uv: uv.buffer, indices: indices.buffer, faceMap, geometriesAttributes };

}


function extrudePolygons(d) {
    const { data, height } = d;
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
    return { position, normal, uv, indices };
}

function extrudeLine(d) {
    const { data, height, width } = d;
    return extrudePolyline(data, {
        lineWidth: width,
        depth: height
    });
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

