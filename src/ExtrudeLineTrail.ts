import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';

import { lineSlice } from './util/GeoUtil';
import { getExtrudeLineParams, getChunkLinesPosition } from './util/LineUtil';
import { isGeoJSON, getGeoJSONCenter, getGeoJSONCoordinates } from './util/GeoJSONUtil';
import { addAttribute } from './util/ThreeAdaptUtil';
import { ExtrudeLineTrailOptionType, SingleLineStringType } from './type';
import { ThreeLayer } from './index';

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
    interactive: false,
    heightEnable: true
};

/**
 *
 */
class ExtrudeLineTrail extends BaseObject {
    constructor(lineString: SingleLineStringType, options: ExtrudeLineTrailOptionType, material: THREE.Material, layer: ThreeLayer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineString });
        super();
        this._initOptions(options);

        const { width, height, altitude, speed, chunkLength, trail } = options;
        let center: maptalks.Coordinate, coordinates;
        if (isGeoJSON(lineString as any)) {
            center = getGeoJSONCenter(lineString as any);
            coordinates = getGeoJSONCoordinates(lineString as any);
        } else {
            center = (lineString as any).getCenter();
            coordinates = lineString;
        }
        const chunkLines = lineSlice(coordinates, chunkLength);

        const centerPt = layer.coordinateToVector3(center);
        //cache position for  faster computing,reduce double counting
        const positionMap: { [key: string]: THREE.Vector3 } = {};
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
        addAttribute(geometry, 'position', (new THREE.BufferAttribute(ps, 3)));
        addAttribute(geometry, 'normal', (new THREE.BufferAttribute(norls, 3)));
        geometry.setIndex(new THREE.BufferAttribute(inds, 1));


        const lineWidth = layer.distanceToVector3(width, width).x;
        const depth = layer.distanceToVector3(height, height).x;
        const params = getExtrudeLineParams(positions, lineWidth, depth, layer);
        setExtrudeLineGeometryAttribute(geometry, params.position, params.normal, params.indices);

        this._createMesh(geometry, material);
        const z = layer.distanceToVector3(altitude, altitude).x;
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
        this.type = 'ExtrudeLineTrail';

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
            const object3d = this.getObject3d() as any;
            setExtrudeLineGeometryAttribute(object3d.geometry, p.position, p.normal, p.indices);
            object3d.geometry.attributes.position.needsUpdate = true;
            object3d.geometry.attributes.normal.needsUpdate = true;
            object3d.geometry.index.needsUpdate = true;
        }
        if (index >= chunkLines.length - 1) {
            this._params.index = -1;
            this._params.idx = -1;
        }
        this._params.index += speed;
    }
}

export default ExtrudeLineTrail;
