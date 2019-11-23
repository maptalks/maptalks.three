import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';

import { lineSlice } from './util/GeoUtil';
import { getExtrudeLineParams, getChunkLinesPosition } from './util/LineUtil';


const MAX_POINTS = 1000;

/**
 *
 * @param {THREE.BufferGeometry} geometry
 * @param {*} ps
 * @param {*} norls
 * @param {*} indices
 */
function setExtrudeLineGeometryAttribute(geometry, ps, norls, indices) {
    const len = ps.length;
    geometry.attributes.normal.count = len;
    geometry.attributes.position.count = len;
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal.array;
    for (let i = 0; i < len; i++) {
        positions[i] = ps[i];
        normals[i] = norls[i];
    }
    // geometry.index.array = new Uint16Array(indices.length);
    geometry.index.count = indices.length;
    // geometry.index.needsUpdate = true;
    for (let i = 0, len1 = indices.length; i < len1; i++) {
        geometry.index.array[i] = indices[i];
    }
    // geometry.setIndex(new THREE.Uint32BufferAttribute(indices, 1));
    // geometry.setDrawRange(0, len / 3);
}


const OPTIONS = {
    trail: 5,
    chunkLength: 50,
    width: 2,
    height: 1,
    speed: 1,
    altitude: 0,
    interactive: false
};

/**
 *
 */
class ExtrudeLineTrail extends BaseObject {
    constructor(lineString, options, material, layer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineString });
        super();
        this._initOptions(options);

        const { width, height, altitude, speed, chunkLength, trail } = options;
        const chunkLines = lineSlice(lineString, chunkLength);

        const centerPt = layer.coordinateToVector3(lineString.getCenter());
        //cache position for  faster computing,reduce double counting
        const positionMap = {};
        for (let i = 0, len = chunkLines.length; i < len; i++) {
            const chunkLine = chunkLines[i];
            for (let j = 0, len1 = chunkLine.length; j < len1; j++) {
                const lnglat = chunkLine[j];
                const key = lnglat.join(',').toString();
                if (!positionMap[key]) {
                    positionMap[key] = layer.coordinateToVector3(lnglat).sub(centerPt);
                }
            }
        }

        const positions = getChunkLinesPosition(chunkLines.slice(0, 1), layer, positionMap, centerPt).positionsV;

        //generate geometry
        const geometry = new THREE.BufferGeometry();
        const ps = new Float32Array(MAX_POINTS * 3); // 3 vertices per point
        const norls = new Float32Array(MAX_POINTS * 3); // 3 vertices per point
        const inds = new Uint16Array(MAX_POINTS);
        geometry.addAttribute('position', new THREE.BufferAttribute(ps, 3).setDynamic(true));
        geometry.addAttribute('normal', new THREE.BufferAttribute(norls, 3).setDynamic(true));
        geometry.setIndex(new THREE.BufferAttribute(inds, 1));


        const lineWidth = layer.distanceToVector3(width, width).x;
        const depth = layer.distanceToVector3(height, height).x;
        const params = getExtrudeLineParams(positions, lineWidth, depth, layer);
        setExtrudeLineGeometryAttribute(geometry, params.position, params.normal, params.indices);

        this._createMesh(geometry, material);
        const z = layer.distanceToVector3(altitude, altitude).x;
        const center = lineString.getCenter();
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);

        this._params = {
            index: 0,
            chunkLines,
            geometries: [],
            layer,
            trail: Math.max(1, trail),
            lineWidth,
            depth,
            speed: Math.min(1, speed),
            idx: 0,
            loaded: false,
            positionMap,
            centerPt
        };
        this._init(this._params);

    }

    /**
     * Follow-up support for adding webworker
     * @param {*} params
     */
    _init(params) {
        const { layer, trail, lineWidth, depth, chunkLines, positionMap, centerPt } = params;
        const len = chunkLines.length, geometries = [];
        for (let i = 0; i < len; i++) {
            const lines = chunkLines.slice(i, i + trail);
            const ps = getChunkLinesPosition(lines, layer, positionMap, centerPt).positionsV;
            geometries.push(getExtrudeLineParams(ps, lineWidth, depth, layer));
        }
        this._params.geometries = geometries;
        this._params.loaded = true;
    }


    _animation() {
        const { index, geometries, speed, idx, chunkLines, trail, lineWidth, depth, loaded, layer, positionMap, centerPt } = this._params;
        if (!loaded) return;
        const i = Math.round(index);
        if (i > idx) {
            this._params.idx++;
            let p = geometries[i];
            //if not init, this is will running
            if (!p) {
                const lines = chunkLines.slice(i, i + trail);
                const ps = getChunkLinesPosition(lines, layer, positionMap, centerPt).positionsV;
                p = getExtrudeLineParams(ps, lineWidth, depth, layer);
                geometries[i] = p;
            }
            setExtrudeLineGeometryAttribute(this.getObject3d().geometry, p.position, p.normal, p.indices);
            this.getObject3d().geometry.attributes.position.needsUpdate = true;
            this.getObject3d().geometry.attributes.normal.needsUpdate = true;
            this.getObject3d().geometry.index.needsUpdate = true;
        }
        if (index >= chunkLines.length - 1) {
            this._params.index = -1;
            this._params.idx = -1;
        }
        this._params.index += speed;
    }
}

export default ExtrudeLineTrail;
