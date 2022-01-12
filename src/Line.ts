import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { LineTaskIns } from './BaseObjectTaskManager';
import { ThreeLayer } from './index';
import { LineMaterialType, LineOptionType, LineStringType } from './type/index';
import { setBottomHeight } from './util';
import { getDefaultLineGeometry, getLinePosition, getLineSegmentPosition, LineStringSplit, mergeLinePositions } from './util/LineUtil';
import { addAttribute, getVertexColors } from './util/ThreeAdaptUtil';

function initColors(cs) {
    const colors = [];
    if (cs && cs.length) {
        cs.forEach(color => {
            color = (color instanceof THREE.Color ? color : new THREE.Color(color));
            colors.push(color.r, color.g, color.b);
        });
    }
    return colors;
}

const OPTIONS = {
    altitude: 0,
    bottomHeight: 0,
    colors: null
};

/**
 *
 */
class Line extends BaseObject {
    constructor(lineString: LineStringType, options: LineOptionType, material: LineMaterialType, layer: ThreeLayer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineString });
        super();
        this._initOptions(options);
        const { lineStrings, center } = LineStringSplit(lineString);
        const { asynchronous } = options;
        let geometry: THREE.BufferGeometry;
        if (asynchronous) {
            geometry = getDefaultLineGeometry();
            const id = maptalks.Util.GUID();
            this.getOptions().id = id;
            this.getOptions().center = center;
            LineTaskIns.push({
                id,
                data: lineStrings,
                layer,
                key: (options as any).key,
                lineString,
                baseObject: this
            });
        } else {
            const positionList = [];
            for (let i = 0, len = lineStrings.length; i < len; i++) {
                const lineString = lineStrings[i];
                const { positions } = getLinePosition(lineString, layer, center, false);
                positionList.push(getLineSegmentPosition(positions));
            }
            const position = mergeLinePositions(positionList);
            geometry = new THREE.BufferGeometry();
            addAttribute(geometry, 'position', new THREE.BufferAttribute(position, 3));
            setBottomHeight(geometry, options.bottomHeight, layer);
            const colors = initColors(options.colors);
            if (colors && colors.length) {
                addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3));
                (material as any).vertexColors = getVertexColors();
            }
        }
        this._createLineSegments(geometry, material);
        const { altitude } = options;
        const z = layer.distanceToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);
        this.type = 'Line';
    }

    _workerLoad(result) {
        const geometry = new THREE.BufferGeometry();
        addAttribute(geometry, 'position', new THREE.BufferAttribute(new Float32Array(result.position), 3));
        const colors = initColors((this.getOptions() as any).colors);
        const object3d = this.getObject3d() as any;
        const material = object3d.material;
        if (colors && colors.length) {
            addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3));
            (material as any).vertexColors = getVertexColors();
        }
        this._computeLineDistances(geometry);
        object3d.geometry = geometry;
        object3d.material.needsUpdate = true;
        this._fire('workerload', { target: this });
    }
}

export default Line;
