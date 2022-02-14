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
import { FatLineTaskIns } from './BaseObjectTaskManager';

const OPTIONS = {
    bottomHeight: 0,
    altitude: 0
};

class FatLine extends BaseObject {
    constructor(lineString: LineStringType, options: LineOptionType, material: FatLineMaterialType, layer: ThreeLayer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineString });
        super();
        this._initOptions(options);
        const { asynchronous } = options;
        const { lineStrings, center } = LineStringSplit(lineString);
        const geometry = new LineGeometry();
        let position: Float32Array;
        if (asynchronous) {
            const id = maptalks.Util.GUID();
            this.getOptions().id = id;
            this.getOptions().center = center;
            FatLineTaskIns.push({
                id,
                data: lineStrings,
                lineString,
                center,
                layer,
                baseObject: this
            });
        } else {
            const positionList = [], cache = {};
            for (let m = 0, le = lineStrings.length; m < le; m++) {
                const positions = getLinePosition(lineStrings[m], layer, center, false).positions;
                setBottomHeight(positions, options.bottomHeight, layer, cache);
                positionList.push(getLineSegmentPosition(positions));
            }
            position = mergeLinePositions(positionList);
            geometry.setPositions(position);
        }
        this._setMaterialRes(layer, material);
        this._createLine2(geometry, material);
        const { altitude } = options;
        const z = layer.distanceToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);
        if (!asynchronous) {
            this._setPickObject3d(position, material.linewidth);
            this._init();
        }
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
        // if (!this._colorMap) {
        //     return;
        // }
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

    _workerLoad(result) {
        const position = new Float32Array(result.position);
        const object3d = this.getObject3d();
        (object3d as any).geometry.setPositions(position);
        (object3d as any).computeLineDistances();
        this._setPickObject3d(position, (object3d as any).material.linewidth);
        this._init();
        if (this.isAdd) {
            const pick = this.getLayer().getPick();
            pick.add(this.pickObject3d);
        }
        this._fire('workerload', { target: this });
    }

}
export default FatLine;
