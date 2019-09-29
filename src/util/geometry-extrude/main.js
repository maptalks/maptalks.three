// TODO fitRect x, y are negative?
// TODO Dimensions
// TODO bevel="top"|"bottom"

import earcut from 'earcut';
import doSimplify from './simplify';
import {
    slerp, v2Normalize, v2Dot, v2Add, area,
    v3Normalize, v3Sub, v3Cross
} from './math';

export function triangulate(vertices, holes, dimensions=2) {
    return earcut(vertices, holes, dimensions);
};

export function flatten(data) {
    return earcut.flatten(data);
}

const v1 = [];
const v2 = [];
const v = [];

function innerOffsetPolygon(
    vertices, out, start, end, outStart, offset, miterLimit, close
) {
    const checkMiterLimit = miterLimit != null;
    let outOff = outStart;
    let indicesMap = null;
    if (checkMiterLimit) {
        indicesMap = new Uint32Array(end - start);
    }
    for (let i = start; i < end; i++) {
        const nextIdx = i === end - 1 ? start : i + 1;
        const prevIdx = i === start ? end - 1 : i - 1;
        const x1 = vertices[prevIdx * 2];
        const y1 = vertices[prevIdx * 2 + 1];
        const x2 = vertices[i * 2];
        const y2 = vertices[i * 2 + 1];
        const x3 = vertices[nextIdx * 2];
        const y3 = vertices[nextIdx * 2 + 1];

        v1[0] = x2 - x1;
        v1[1] = y2 - y1;
        v2[0] = x3 - x2;
        v2[1] = y3 - y2;

        v2Normalize(v1, v1);
        v2Normalize(v2, v2);

        checkMiterLimit && (indicesMap[i] = outOff);
        if (!close && i === start) {
            v[0] = v2[1];
            v[1] = -v2[0];
            v2Normalize(v, v);
            out[outOff * 2] = x2 + v[0] * offset;
            out[outOff * 2 + 1] = y2 + v[1] * offset;
            outOff++;
        }
        else if (!close && i === end - 1) {
            v[0] = v1[1];
            v[1] = -v1[0];
            v2Normalize(v, v);
            out[outOff * 2] = x2 + v[0] * offset;
            out[outOff * 2 + 1] = y2 + v[1] * offset;
            outOff++;
        }
        else {
            // PENDING Why using sub will lost the direction info.
            v2Add(v, v2, v1);
            const tmp = v[1];
            v[1] = -v[0];
            v[0] = tmp;

            v2Normalize(v, v);

            const cosA = v2Dot(v, v2);
            const sinA = Math.sqrt(1 - cosA * cosA);
            // PENDING
            const miter = offset * Math.min(10, 1 / sinA);

            const isCovex = offset * cosA < 0;

            if (checkMiterLimit && (1 / sinA) > miterLimit && isCovex) {
                const mx = x2 + v[0] * offset;
                const my = y2 + v[1] * offset;
                const halfA = Math.acos(sinA) / 2;
                const dist = Math.tan(halfA) * Math.abs(offset);
                out[outOff * 2] = mx + v[1] * dist;
                out[outOff * 2 + 1] = my - v[0] * dist;
                outOff++;
                out[outOff * 2] = mx - v[1] * dist;
                out[outOff * 2 + 1] = my + v[0] * dist;
                outOff++;
            }
            else {
                out[outOff * 2] = x2 + v[0] * miter;
                out[outOff * 2 + 1] = y2 + v[1] * miter;
                outOff++;
            }
        }
    }

    return indicesMap;
}

export function offsetPolygon(vertices, holes, offset, miterLimit, close) {
    const offsetVertices = miterLimit != null ? [] : new Float32Array(vertices.length);
    const exteriorSize = (holes && holes.length) ? holes[0] : vertices.length / 2;

    innerOffsetPolygon(
        vertices, offsetVertices, 0, exteriorSize, 0, offset, miterLimit, close, false
    );

    if (holes) {
        for (let i = 0; i < holes.length; i++) {
            const start = holes[i];
            const end = holes[i + 1] || vertices.length / 2;
            innerOffsetPolygon(
                vertices, offsetVertices, start, end,
                miterLimit != null ? offsetVertices.length / 2 : start,
                offset, miterLimit, close
            );
        }
    }

    return offsetVertices;
}

function reversePoints(points, stride, start, end) {
    for (let i = 0; i < Math.floor((end - start) / 2); i++) {
        for (let j = 0; j < stride; j++) {
            const a = (i + start) * stride + j;
            const b = (end - i - 1) * stride + j;
            const tmp = points[a];
            points[a] = points[b];
            points[b] = tmp;
        }
    }

    return points;
}

function convertToClockwise(vertices, holes) {
    let polygonVertexCount = vertices.length / 2;
    let start = 0;
    let end = holes && holes.length ? holes[0] : polygonVertexCount;
    if (area(vertices, start, end) > 0) {
        reversePoints(vertices, 2, start, end);
    }
    for (let h = 1; h < (holes ? holes.length : 0) + 1; h++) {
        start = holes[h - 1];
        end = holes[h] || polygonVertexCount;
        if (area(vertices, start, end) < 0) {
            reversePoints(vertices, 2, start, end);
        }
    }
}

function normalizeOpts(opts) {

    opts.depth = opts.depth || 1;
    opts.bevelSize = opts.bevelSize || 0;
    opts.bevelSegments = opts.bevelSegments == null ? 2 : opts.bevelSegments;
    opts.smoothSide = opts.smoothSide || false;
    opts.smoothBevel = opts.smoothBevel || false;
    opts.simplify = opts.simplify || 0;

    // Normalize bevel options.
    if (typeof opts.depth === 'number') {
        opts.bevelSize = Math.min(!(opts.bevelSegments > 0) ? 0 : opts.bevelSize, opts.depth / 2);
    }
    if (!(opts.bevelSize > 0)) {
        opts.bevelSegments = 0;
    }
    opts.bevelSegments = Math.round(opts.bevelSegments);

    const boundingRect = opts.boundingRect;
    opts.translate = opts.translate || [0, 0];
    opts.scale = opts.scale || [1, 1];
    if (opts.fitRect) {
        let targetX = opts.fitRect.x == null
            ? (boundingRect.x || 0)
            : opts.fitRect.x;
        let targetY = opts.fitRect.y == null
            ? (boundingRect.y || 0)
            : opts.fitRect.y;
        let targetWidth = opts.fitRect.width;
        let targetHeight = opts.fitRect.height;
        if (targetWidth == null) {
            if (targetHeight != null) {
                targetWidth = targetHeight / boundingRect.height * boundingRect.width;
            }
            else {
                targetWidth = boundingRect.width;
                targetHeight = boundingRect.height;
            }
        }
        else if (targetHeight == null) {
            targetHeight = targetWidth / boundingRect.width * boundingRect.height;
        }
        opts.scale = [
            targetWidth / boundingRect.width,
            targetHeight / boundingRect.height
        ];
        opts.translate = [
            (targetX - boundingRect.x) * opts.scale[0],
            (targetY - boundingRect.y) * opts.scale[1]
        ];
    }
}

function generateNormal(indices, position) {

    function v3Set(p, a, b, c) {
        p[0] = a; p[1] = b; p[2] = c;
    }

    const p1 = [];
    const p2 = [];
    const p3 = [];

    const v21 = [];
    const v32 = [];

    const n = [];

    const len = indices.length;
    const normals = new Float32Array(position.length);
    for (let f = 0; f < len;) {
        const i1 = indices[f++] * 3;
        const i2 = indices[f++] * 3;
        const i3 = indices[f++] * 3;

        v3Set(p1, position[i1], position[i1 + 1], position[i1 + 2]);
        v3Set(p2, position[i2], position[i2 + 1], position[i2 + 2]);
        v3Set(p3, position[i3], position[i3 + 1], position[i3 + 2]);

        v3Sub(v21, p1, p2);
        v3Sub(v32, p2, p3);
        v3Cross(n, v21, v32);
        // Already be weighted by the triangle area
        for (let i = 0; i < 3; i++) {
            normals[i1 + i] = normals[i1 + i] + n[i];
            normals[i2 + i] = normals[i2 + i] + n[i];
            normals[i3 + i] = normals[i3 + i] + n[i];
        }
    }

    for (var i = 0; i < normals.length;) {
        v3Set(n, normals[i], normals[i+1], normals[i+2]);
        v3Normalize(n, n);
        normals[i++] = n[0];
        normals[i++] = n[1];
        normals[i++] = n[2];
    }

    return normals;
}
// 0,0----1,0
// 0,1----1,1
const quadToTriangle = [
    [0, 0], [1, 0], [1, 1],
    [0, 0], [1, 1], [0, 1]
];

// Add side vertices and indices. Include bevel.
function addExtrudeSide(
    out, {vertices, topVertices, depth, rect}, start, end,
    cursors, opts
) {
    const ringVertexCount = end - start;
    const splitSide = opts.smoothSide ? 1 : 2;
    const splitRingVertexCount = ringVertexCount * splitSide;

    const splitBevel = opts.smoothBevel ? 1 : 2;
    const bevelSize = Math.min(depth / 2, opts.bevelSize);
    const bevelSegments = opts.bevelSegments;
    const vertexOffset = cursors.vertex;
    const size = Math.max(rect.width, rect.height);

    // Side vertices
    if (bevelSize > 0) {

        const v0 = [0, 0, 1];
        const v1 = [];
        const v2 = [0, 0, -1];
        const v = [];

        let ringCount = 0;
        let vLen = new Float32Array(ringVertexCount);
        for (let k = 0; k < 2; k++) {
            const z = (k === 0 ? (depth - bevelSize) : bevelSize);
            for (let s = 0; s <= bevelSegments * splitBevel; s++) {
                let uLen = 0;
                let prevX;
                let prevY;
                for (let i = 0; i < ringVertexCount; i++) {

                    for (let j = 0; j < splitSide; j++) {
                        // TODO Cache and optimize
                        let idx = ((i + j) % ringVertexCount + start) * 2;
                        v1[0] = vertices[idx] - topVertices[idx];
                        v1[1] = vertices[idx + 1] - topVertices[idx + 1];
                        v1[2] = 0;
                        const l = Math.sqrt(v1[0] * v1[0] + v1[1] * v1[1]);
                        v1[0] /= l;
                        v1[1] /= l;

                        const t = (Math.floor(s / splitBevel) + (s % splitBevel)) / bevelSegments;
                        k === 0 ? slerp(v, v0, v1, t)
                            : slerp(v, v1, v2, t);

                        const t2 = k === 0  ? t : 1 - t;
                        const a = bevelSize * Math.sin(t2 * Math.PI / 2);
                        const b = l * Math.cos(t2 * Math.PI / 2);

                        // ellipse radius
                        const r = bevelSize * l / Math.sqrt(a * a + b * b);

                        const x = v[0] * r + topVertices[idx];
                        const y = v[1] * r + topVertices[idx + 1];
                        const zz = v[2] * r + z;
                        out.position[cursors.vertex * 3] = x;
                        out.position[cursors.vertex * 3 + 1] = y;
                        out.position[cursors.vertex * 3 + 2] = zz;

                        // TODO Cache and optimize
                        if (i > 0 || j > 0) {
                            uLen += Math.sqrt((prevX - x) * (prevX - x) + (prevY - y) * (prevY - y));
                        }
                        if (s > 0 || k > 0) {
                            let tmp = (cursors.vertex - splitRingVertexCount) * 3;
                            let prevX2 = out.position[tmp];
                            let prevY2 = out.position[tmp + 1];
                            let prevZ2 = out.position[tmp + 2];

                            vLen[i] += Math.sqrt(
                                (prevX2 - x) * (prevX2 - x)
                                + (prevY2 - y) * (prevY2 - y)
                                + (prevZ2 - zz) * (prevZ2 - zz)
                            );
                        }
                        out.uv[cursors.vertex * 2] = uLen / size;
                        out.uv[cursors.vertex * 2 + 1] = vLen[i] / size;

                        prevX = x;
                        prevY = y;
                        cursors.vertex++;
                    }

                    if ((splitBevel > 1 && (s % splitBevel)) || (splitBevel === 1 && s >= 1)) {
                        for (let f = 0; f < 6; f++) {
                            const m = (quadToTriangle[f][0] + i * splitSide) % splitRingVertexCount;
                            const n = quadToTriangle[f][1] + ringCount;
                            out.indices[cursors.index++] = (n - 1) * splitRingVertexCount + m + vertexOffset;
                        }
                    }
                }

                ringCount++;
            }
        }
    }
    else {
        for (let k = 0; k < 2; k++) {
            const z = k === 0 ? depth - bevelSize : bevelSize;
            let uLen = 0;
            let prevX;
            let prevY;
            for (let i = 0; i < ringVertexCount; i++) {
                for (let m = 0; m < splitSide; m++) {
                    const idx = ((i + m) % ringVertexCount + start) * 2;
                    const x = vertices[idx];
                    const y = vertices[idx + 1];
                    out.position[cursors.vertex * 3] = x;
                    out.position[cursors.vertex * 3 + 1] = y;
                    out.position[cursors.vertex * 3 + 2] = z;
                    if (i > 0 || m > 0) {
                        uLen += Math.sqrt((prevX - x) * (prevX - x) + (prevY - y) * (prevY - y));
                    }
                    out.uv[cursors.vertex * 2] = uLen / size;
                    out.uv[cursors.vertex * 2 + 1] = z / size;
                    prevX = x;
                    prevY = y;

                    cursors.vertex++;
                }
            }
        }
    }
    // Connect the side
    const sideStartRingN = bevelSize > 0 ? (bevelSegments * splitBevel + 1) : 1;
    for (let i = 0; i < ringVertexCount; i++) {
        for (let f = 0; f < 6; f++) {
            const m = (quadToTriangle[f][0] + i * splitSide) % splitRingVertexCount;
            const n = quadToTriangle[f][1] + sideStartRingN;
            out.indices[cursors.index++] = (n - 1) * splitRingVertexCount + m + vertexOffset;
        }
    }
}

function addTopAndBottom({indices, vertices, topVertices, rect, depth}, out, cursors, opts) {
    if (vertices.length <= 4) {
        return;
    }

    const vertexOffset = cursors.vertex;
    // Top indices
    const indicesLen = indices.length;
    for (let i = 0; i < indicesLen; i++) {
        out.indices[cursors.index++] = vertexOffset + indices[i];
    }
    const size = Math.max(rect.width, rect.height);
    // Top and bottom vertices
    for (let k = 0; k < (opts.excludeBottom ? 1 : 2); k++) {
        for (let i = 0; i < topVertices.length; i += 2) {
            const x = topVertices[i];
            const y = topVertices[i + 1];
            out.position[cursors.vertex * 3] = x;
            out.position[cursors.vertex * 3 + 1] = y;
            out.position[cursors.vertex * 3 + 2] = (1 - k) * depth;

            out.uv[cursors.vertex * 2] = (x - rect.x) / size;
            out.uv[cursors.vertex * 2 + 1] = (y - rect.y) / size;
            cursors.vertex++;
        }
    }
    // Bottom indices
    if (!opts.excludeBottom) {
        const vertexCount = vertices.length / 2;
        for (let i = 0; i < indicesLen; i += 3) {
            for (let k = 0; k < 3; k++) {
                out.indices[cursors.index++] = vertexOffset + vertexCount + indices[i + 2 - k];
            }
        }
    }
}


function innerExtrudeTriangulatedPolygon(preparedData, opts) {
    let indexCount = 0;
    let vertexCount = 0;

    for (let p = 0; p < preparedData.length; p++) {
        const {indices, vertices, holes, depth} = preparedData[p];
        const polygonVertexCount = vertices.length / 2;
        const bevelSize = Math.min(depth / 2, opts.bevelSize);
        const bevelSegments = !(bevelSize > 0) ? 0 : opts.bevelSegments;

        indexCount += indices.length * (opts.excludeBottom ? 1 : 2);
        vertexCount += polygonVertexCount * (opts.excludeBottom ? 1 : 2);
        const ringCount = 2 + bevelSegments * 2;

        let start = 0;
        let end = 0;
        for (let h = 0; h < (holes ? holes.length : 0) + 1; h++) {
            if (h === 0) {
                end = holes && holes.length ? holes[0] : polygonVertexCount;
            }
            else {
                start = holes[h - 1];
                end = holes[h] || polygonVertexCount;
            }

            indexCount += (end - start) * 6 * (ringCount - 1);

            const sideRingVertexCount = (end - start) * (opts.smoothSide ? 1 : 2);
            vertexCount += sideRingVertexCount * ringCount
                // Double the bevel vertex number if not smooth
                + (!opts.smoothBevel ? bevelSegments * sideRingVertexCount * 2 : 0);
        }
    }

    const data = {
        position: new Float32Array(vertexCount * 3),
        indices: new (vertexCount > 0xffff ? Uint32Array : Uint16Array)(indexCount),
        uv: new Float32Array(vertexCount * 2)
    };

    const cursors = {
        vertex: 0, index: 0
    };

    for (let d = 0; d < preparedData.length; d++) {
        addTopAndBottom(preparedData[d], data, cursors, opts);
    }

    for (let d = 0; d < preparedData.length; d++) {
        const {holes, vertices} = preparedData[d];
        const topVertexCount = vertices.length / 2;

        let start = 0;
        let end = (holes && holes.length) ? holes[0] : topVertexCount;
        // Add exterior
        addExtrudeSide(data, preparedData[d], start, end, cursors, opts);
        // Add holes
        if (holes) {
            for (let h = 0; h < holes.length; h++) {
                start = holes[h];
                end = holes[h + 1] || topVertexCount;
                addExtrudeSide(data, preparedData[d], start, end, cursors, opts);
            }
        }
    }

    // Wrap uv
    for (let i = 0; i < data.uv.length; i++) {
        const val = data.uv[i];
        if (val > 0 && Math.round(val) === val) {
            data.uv[i] = 1;
        }
        else {
            data.uv[i] = val % 1;
        }
    }

    data.normal = generateNormal(data.indices, data.position);
    // PENDING
    data.boundingRect = preparedData[0] && preparedData[0].rect;

    return data;
}

function convertPolylineToTriangulatedPolygon(polyline, polylineIdx, opts) {
    const lineWidth = opts.lineWidth;
    const pointCount = polyline.length;
    const points = new Float32Array(pointCount * 2);
    const translate = opts.translate || [0, 0];
    const scale = opts.scale || [1, 1];
    for (let i = 0, k = 0; i < pointCount; i++) {
        points[k++] = polyline[i][0] * scale[0] + translate[0];
        points[k++] = polyline[i][1] * scale[1] + translate[1];
    }

    if (area(points, 0, pointCount) < 0) {
        reversePoints(points, 2, 0, pointCount);
    }

    const insidePoints = [];
    const outsidePoints = [];
    const miterLimit = opts.miterLimit;
    const outsideIndicesMap = innerOffsetPolygon(
        points, outsidePoints, 0, pointCount, 0, -lineWidth / 2, miterLimit, false
    );
    reversePoints(points, 2, 0, pointCount);
    const insideIndicesMap = innerOffsetPolygon(
        points, insidePoints, 0, pointCount, 0, -lineWidth / 2, miterLimit, false
    );

    const polygonVertexCount = (insidePoints.length + outsidePoints.length) / 2;
    const polygonVertices = new Float32Array(polygonVertexCount * 2);

    let offset = 0;
    const outsidePointCount = outsidePoints.length / 2;
    for (let i = 0; i < outsidePoints.length; i++) {
        polygonVertices[offset++] = outsidePoints[i];
    }
    for (let i = 0; i < insidePoints.length; i++) {
        polygonVertices[offset++] = insidePoints[i];
    }

    // Built indices
    const indices = new (polygonVertexCount > 0xffff ? Uint32Array : Uint16Array)(
        ((pointCount - 1) * 2 + (polygonVertexCount - pointCount * 2)) * 3
    );
    let off = 0;
    for (let i = 0; i < pointCount - 1; i++) {
        const i2 = i + 1;
        indices[off++] = outsidePointCount - 1 - outsideIndicesMap[i];
        indices[off++] = outsidePointCount - 1 - outsideIndicesMap[i] - 1;
        indices[off++] = insideIndicesMap[i] + 1 + outsidePointCount;

        indices[off++] = outsidePointCount - 1 - outsideIndicesMap[i];
        indices[off++] = insideIndicesMap[i] + 1 + outsidePointCount;
        indices[off++] = insideIndicesMap[i] + outsidePointCount;

        if (insideIndicesMap[i2] - insideIndicesMap[i] === 2) {
            indices[off++] = insideIndicesMap[i] + 2 + outsidePointCount;
            indices[off++] = insideIndicesMap[i] + 1 + outsidePointCount;
            indices[off++] = outsidePointCount - outsideIndicesMap[i2] - 1;
        }
        else if (outsideIndicesMap[i2] - outsideIndicesMap[i] === 2) {
            indices[off++] = insideIndicesMap[i2] + outsidePointCount;
            indices[off++] = outsidePointCount - 1 - (outsideIndicesMap[i] + 1);
            indices[off++] = outsidePointCount - 1 - (outsideIndicesMap[i] + 2);
        }
    }

    const topVertices = opts.bevelSize > 0
        ? offsetPolygon(polygonVertices, [], opts.bevelSize, null, true) : polygonVertices;
    const boundingRect = opts.boundingRect;
    return {
        vertices: polygonVertices,
        indices,
        topVertices,
        rect: {
            x: boundingRect.x * scale[0] + translate[0],
            y: boundingRect.y * scale[1] + translate[1],
            width: boundingRect.width * scale[0],
            height: boundingRect.height * scale[1],
        },
        depth: typeof opts.depth === 'function' ? opts.depth(polylineIdx) : opts.depth,
        holes: []
    };
}

function removeClosePointsOfPolygon(polygon, epsilon) {
    const newPolygon = [];
    for (let k  = 0; k < polygon.length; k++) {
        const points = polygon[k];
        const newPoints = [];
        const len = points.length;
        let x1 = points[len - 1][0];
        let y1 = points[len - 1][1];
        let dist = 0;
        for (let i = 0; i < len; i++) {
            let x2 = points[i][0];
            let y2 = points[i][1];
            const dx = x2 - x1;
            const dy = y2 - y1;
            dist += Math.sqrt(dx * dx + dy * dy);
            if (dist > epsilon) {
                newPoints.push(points[i]);
                dist = 0;
            }
            x1 = x2;
            y1 = y2;
        }
        if (newPoints.length >= 3) {
            newPolygon.push(newPoints);
        }
    }
    return newPolygon.length > 0 ? newPolygon : null;
}

function simplifyPolygon(polygon, tolerance) {
    const newPolygon = [];
    for (let k  = 0; k < polygon.length; k++) {
        let points = polygon[k];
        points = doSimplify(points, tolerance, true);
        if (points.length >= 3) {
            newPolygon.push(points);
        }
    }
    return newPolygon.length > 0 ? newPolygon : null;
}
/**
 *
 * @param {Array} polygons Polygons array that match GeoJSON MultiPolygon geometry.
 * @param {Object} [opts]
 * @param {number|Function} [opts.depth]
 * @param {number} [opts.bevelSize = 0]
 * @param {number} [opts.bevelSegments = 2]
 * @param {number} [opts.simplify = 0]
 * @param {boolean} [opts.smoothSide = false]
 * @param {boolean} [opts.smoothBevel = false]
 * @param {boolean} [opts.excludeBottom = false]
 * @param {Object} [opts.fitRect] translate and scale will be ignored if fitRect is set
 * @param {Array} [opts.translate]
 * @param {Array} [opts.scale]
 *
 * @return {Object} {indices, position, uv, normal, boundingRect}
 */
export function extrudePolygon(polygons, opts) {

    opts = Object.assign({}, opts);

    const min = [Infinity, Infinity];
    const max = [-Infinity, -Infinity];
    for (let i = 0; i < polygons.length; i++) {
        updateBoundingRect(polygons[i][0], min, max);
    }
    opts.boundingRect = opts.boundingRect || {
        x: min[0], y: min[1], width: max[0] - min[0], height: max[1] - min[1]
    };

    normalizeOpts(opts);

    const preparedData = [];
    const translate = opts.translate || [0, 0];
    const scale = opts.scale || [1, 1];
    const boundingRect = opts.boundingRect;
    const transformdRect = {
        x: boundingRect.x * scale[0] + translate[0],
        y: boundingRect.y * scale[1] + translate[1],
        width: boundingRect.width * scale[0],
        height: boundingRect.height * scale[1],
    };

    const epsilon = Math.min(
        boundingRect.width, boundingRect.height
    ) / 1e5;
    for (let i = 0; i < polygons.length; i++) {
        let newPolygon = removeClosePointsOfPolygon(polygons[i], epsilon);
        if (!newPolygon) {
            continue;
        }
        const simplifyTolerance = opts.simplify / Math.max(scale[0], scale[1]);
        if (simplifyTolerance > 0) {
            newPolygon = simplifyPolygon(newPolygon, simplifyTolerance);
        }
        if (!newPolygon) {
            continue;
        }

        const {vertices, holes, dimensions} = earcut.flatten(newPolygon);

        for (let k = 0; k < vertices.length;) {
            vertices[k] = vertices[k++] * scale[0] + translate[0];
            vertices[k] = vertices[k++] * scale[1] + translate[1];
        }

        convertToClockwise(vertices, holes);

        if (dimensions !== 2) {
            throw new Error('Only 2D polygon points are supported');
        }
        const topVertices = opts.bevelSize > 0
            ? offsetPolygon(vertices, holes, opts.bevelSize, null, true) : vertices;
        const indices = triangulate(topVertices, holes, dimensions);
        preparedData.push({
            indices,
            vertices,
            topVertices,
            holes,
            rect: transformdRect,
            depth: typeof opts.depth === 'function' ? opts.depth(i) : opts.depth
        });
    }
    return innerExtrudeTriangulatedPolygon(preparedData, opts);
};

/**
 *
 * @param {Array} polylines Polylines array that match GeoJSON MultiLineString geometry.
 * @param {Object} [opts]
 * @param {number} [opts.depth]
 * @param {number} [opts.bevelSize = 0]
 * @param {number} [opts.bevelSegments = 2]
 * @param {number} [opts.simplify = 0]
 * @param {boolean} [opts.smoothSide = false]
 * @param {boolean} [opts.smoothBevel = false]
 * @param {boolean} [opts.excludeBottom = false]
 * @param {boolean} [opts.lineWidth = 1]
 * @param {boolean} [opts.miterLimit = 2]
 * @param {Object} [opts.fitRect] translate and scale will be ignored if fitRect is set
 * @param {Array} [opts.translate]
 * @param {Array} [opts.scale]
 * @param {Object} [opts.boundingRect]
 * @return {Object} {indices, position, uv, normal, boundingRect}
 */
export function extrudePolyline(polylines, opts) {

    opts = Object.assign({}, opts);

    const min = [Infinity, Infinity];
    const max = [-Infinity, -Infinity];
    for (let i = 0; i < polylines.length; i++) {
        updateBoundingRect(polylines[i], min, max);
    }
    opts.boundingRect = opts.boundingRect || {
        x: min[0], y: min[1], width: max[0] - min[0], height: max[1] - min[1]
    };

    normalizeOpts(opts);
    const scale = opts.scale || [1, 1];

    if (opts.lineWidth == null) {
        opts.lineWidth = 1;
    }
    if (opts.miterLimit == null) {
        opts.miterLimit = 2;
    }
    const preparedData = [];
    // Extrude polyline to polygon
    for (let i = 0; i < polylines.length; i++) {
        let newPolyline = polylines[i];
        const simplifyTolerance = opts.simplify / Math.max(scale[0], scale[1]);
        if (simplifyTolerance > 0) {
            newPolyline = doSimplify(newPolyline, simplifyTolerance, true);
        }
        preparedData.push(convertPolylineToTriangulatedPolygon(newPolyline, i, opts));
    }

    return innerExtrudeTriangulatedPolygon(preparedData, opts);
}

function updateBoundingRect(points, min, max) {
    for (let i = 0; i < points.length; i++) {
        min[0] = Math.min(points[i][0], min[0]);
        min[1] = Math.min(points[i][1], min[1]);
        max[0] = Math.max(points[i][0], max[0]);
        max[1] = Math.max(points[i][1], max[1]);
    }
}

/**
 *
 * @param {Object} geojson
 * @param {Object} [opts]
 * @param {number} [opts.depth]
 * @param {number} [opts.bevelSize = 0]
 * @param {number} [opts.bevelSegments = 2]
 * @param {number} [opts.simplify = 0]
 * @param {boolean} [opts.smoothSide = false]
 * @param {boolean} [opts.smoothBevel = false]
 * @param {boolean} [opts.excludeBottom = false]
 * @param {boolean} [opts.lineWidth = 1]
 * @param {boolean} [opts.miterLimit = 2]
 * @param {Object} [opts.fitRect] translate and scale will be ignored if fitRect is set
 * @param {Array} [opts.translate]
 * @param {Array} [opts.scale]
 * @param {Object} [opts.boundingRect]
 * @return {Object} {polyline: {indices, position, uv, normal}, polygon: {indices, position, uv, normal}}
 */

 // TODO Not merge feature
export function extrudeGeoJSON(geojson, opts) {

    opts = Object.assign({}, opts);

    const polylines = [];
    const polygons = [];

    const polylineFeatureIndices = [];
    const polygonFeatureIndices = [];

    const min = [Infinity, Infinity];
    const max = [-Infinity, -Infinity];

    for (let i = 0; i < geojson.features.length; i++) {
        const feature = geojson.features[i];
        const geometry = feature.geometry;
        if (geometry && geometry.coordinates) {
            switch (geometry.type) {
                case 'LineString':
                    polylines.push(geometry.coordinates);
                    polylineFeatureIndices.push(i);
                    updateBoundingRect(geometry.coordinates, min, max);
                    break;
                case 'MultiLineString':
                    for (let k = 0; k < geometry.coordinates.length; k++) {
                        polylines.push(geometry.coordinates[k]);
                        polylineFeatureIndices.push(i);
                        updateBoundingRect(geometry.coordinates[k], min, max);
                    }
                    break;
                case 'Polygon':
                    polygons.push(geometry.coordinates);
                    polygonFeatureIndices.push(i);
                    updateBoundingRect(geometry.coordinates[0], min, max);
                    break;
                case 'MultiPolygon':
                    for (let k = 0; k < geometry.coordinates.length; k++) {
                        polygons.push(geometry.coordinates[k]);
                        polygonFeatureIndices.push(i);
                        updateBoundingRect(geometry.coordinates[k][0], min, max);
                    }
                    break;
            }
        }
    }

    opts.boundingRect = opts.boundingRect || {
        x: min[0], y: min[1], width: max[0] - min[0], height: max[1] - min[1]
    };

    const originalDepth = opts.depth;
    return {
        polyline: extrudePolyline(polylines, Object.assign(opts, {
            depth: function (idx) {
                if (typeof originalDepth === 'function') {
                    return originalDepth(
                        geojson.features[polylineFeatureIndices[idx]]
                    );
                }
                return originalDepth;
            }
        })),
        polygon: extrudePolygon(polygons, Object.assign(opts, {
            depth: function (idx) {
                if (typeof originalDepth === 'function') {
                    return originalDepth(
                        geojson.features[polygonFeatureIndices[idx]]
                    );
                }
                return originalDepth;
            }
        }))
    };
}