import { extrudePolygon } from 'geometry-extrude';

export const initialize = function () {
};

export const onmessage = function (message, postResponse) {
    const data = message.data;
    let { type, datas } = data;
    if (type === 'Polygon') {
        datas = generateData(datas);
        const result = generateExtrudePolygons(datas);
        postResponse(null, result, [result.position, result.normal, result.uv, result.indices]);
    }
};


function generateData(list) {
    const datas = [];
    const len = list.length;
    for (let i = 0; i < len; i++) {
        const newdata = [];
        const { data, height } = list[i];
        for (let j = 0, len1 = data.length; j < len1; j++) {
            const { outer, holes } = data[j];
            const d = { outer: arrayBufferToArray(outer) };
            if (holes && holes.length) {
                d.holes = [];
                for (let m = 0, len2 = holes.length; m < len2; m++) {
                    d.holes.push(arrayBufferToArray(holes[m]));
                }
            }
            newdata.push(d);
        }
        datas.push({
            data: newdata,
            height
        });
    }
    return datas;
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



function generateExtrudePolygons(datas) {
    const len = datas.length;
    const geometriesAttributes = [], geometries = [], faceMap = [];
    let faceIndex = 0, psIndex = 0, normalIndex = 0, uvIndex = 0;
    for (let i = 0; i < len; i++) {
        const buffGeom = extrudePolygons(datas[i]);
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
    const shapes = [];
    for (let i = 0, len = data.length; i < len; i++) {
        const { outer, holes } = data[i];
        const shape = [outer];
        if (holes && holes.length) {
            for (let j = 0, len1 = holes.length; j < len1; j++) {
                shape.push(holes[j]);
            }
        }
        shapes.push(shape);
    }
    const { position, normal, uv, indices } = extrudePolygon(
        // polygons same with coordinates of MultiPolygon type geometry in GeoJSON
        // See http://wiki.geojson.org/GeoJSON_draft_version_6#MultiPolygon
        shapes,
        // Options of extrude
        {
            // Can be a constant value, or a function.
            // Default to be 1.
            depth: height
        }
    );
    return { position, normal, uv, indices };
}

function mergeBufferAttributes(attributes) {
    let arrayLength = 0;
    for (let i = 0; i < attributes.length; ++i) {
        const attribute = attributes[i];
        arrayLength += attribute.length;
    }
    const array = new Float32Array(arrayLength);
    let offset = 0;
    for (let i = 0; i < attributes.length; ++i) {
        array.set(attributes[i], offset);
        offset += attributes[i].length;
    }
    return array;
}


function mergeBufferGeometries(geometries) {
    const attributes = {};
    for (let i = 0; i < geometries.length; ++i) {
        const geometry = geometries[i];
        for (let name in geometry) {
            if (attributes[name] === undefined) attributes[name] = [];
            attributes[name].push(geometry[name]);
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
            let mergedAttribute = mergeBufferAttributes(attributes[name]);
            if (!mergedAttribute) return null;
            mergedGeometry[name] = mergedAttribute;
        }
    }
    mergedGeometry['indices'] = new Uint32Array(mergedIndex);
    return mergedGeometry;
}

