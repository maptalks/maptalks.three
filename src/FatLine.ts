import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { getLinePosition, getLineSegmentPosition, LineStringSplit, mergeLinePositions } from './util/LineUtil';
import LineGeometry from './util/fatline/LineGeometry';
import Line2 from './util/fatline/Line2';
import LineMaterial from './util/fatline/LineMaterial';
import { FatLineMaterialType, LineOptionType, LineStringType } from './type';
import { ThreeLayer } from './index';
import { getVertexColors } from './util/ThreeAdaptUtil';
import { setBottomHeight } from './util';

const OPTIONS = {
    bottomHeight: 0,
    altitude: 0
};

class FatLine extends BaseObject {
    constructor(lineString: LineStringType, options: LineOptionType, material: FatLineMaterialType, layer: ThreeLayer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineString });
        super();
        this._initOptions(options);
        const { lineStrings, center } = LineStringSplit(lineString);
        const positionList = [], cache = {};
        for (let m = 0, le = lineStrings.length; m < le; m++) {
            const positions = getLinePosition(lineStrings[m], layer, center, false).positions;
            setBottomHeight(positions, options.bottomHeight, layer, cache);
            positionList.push(getLineSegmentPosition(positions));
        }
        const position = mergeLinePositions(positionList);
        const geometry = new LineGeometry();
        geometry.setPositions(position);
        this._setMaterialRes(layer, material);
        this._createLine2(geometry, material);
        const { altitude } = options;
        const z = layer.distanceToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);
        this._setPickObject3d(position, material.linewidth);
        this._init();
        this.type = 'FatLine';
    }

    _init() {
        const pick = this.getLayer().getPick();
        this.on('add', () => {
            pick.add(this.pickObject3d);
        });
        this.on('remove', () => {
            pick.remove(this.pickObject3d);
        });
    }

    _setMaterialRes(layer, material) {
        const map = layer.getMap();
        const size = map.getSize();
        const width = size.width,
            height = size.height;
        material.resolution.set(width, height);
    }

    _setPickObject3d(ps, linewidth) {
        const geometry = new LineGeometry();
        geometry.setPositions(ps);
        const pick = this.getLayer().getPick();
        const color = pick.getColor();
        const colors = [];
        for (let i = 0, len = ps.length / 3; i < len; i++) {
            colors.push(color.r, color.g, color.b);
        }
        geometry.setColors(colors);
        const material = new LineMaterial({
            color: '#fff',
            // side: THREE.BackSide,
            linewidth,
            vertexColors: getVertexColors()
        });
        this._setMaterialRes(this.getLayer(), material);
        const colorIndex = color.getHex();
        const mesh = new Line2(geometry, material);
        mesh.position.copy(this.getObject3d().position);
        mesh._colorIndex = colorIndex;
        this.setPickObject3d(mesh);
    }

    // eslint-disable-next-line no-unused-vars
    identify(coordinate) {
        return this.picked;
    }

    setSymbol(material) {
        if (material && material instanceof THREE.Material) {
            material.needsUpdate = true;
            const size = this.getMap().getSize();
            const width = size.width,
                height = size.height;
            (material as any).resolution.set(width, height);
            (this.getObject3d() as any).material = material;
        }
        return this;
    }

}
export default FatLine;
