import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { ThreeLayer } from './index';
import { LineMaterialType, LineOptionType, LineStringType } from './type/index';
import { setBottomHeight } from './util';
import { getLinePosition, LineStringSplit, setLineSegmentPosition } from './util/LineUtil';
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
        const ps = [];
        for (let i = 0, len = lineStrings.length; i < len; i++) {
            const lineString = lineStrings[i];
            const { positionsV } = getLinePosition(lineString, layer, center);
            setLineSegmentPosition(ps, positionsV);
        }
        const geometry = new THREE.BufferGeometry();
        addAttribute(geometry, 'position', new THREE.Float32BufferAttribute(ps, 3));
        setBottomHeight(geometry, options.bottomHeight, layer);
        const colors = initColors(options.colors);
        if (colors && colors.length) {
            addAttribute(geometry, 'color', new THREE.Float32BufferAttribute(colors, 3));
            (material as any).vertexColors = getVertexColors();
        }
        this._createLineSegments(geometry, material);

        const { altitude } = options;
        const z = layer.distanceToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);
        this.type = 'Line';
    }
}

export default Line;
