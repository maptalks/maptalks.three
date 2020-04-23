import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import { getLinePosition } from './util/LineUtil';
import { isGeoJSON, getGeoJSONCenter } from './util/GeoJSONUtil';
import LineGeometry from './util/fatline/LineGeometry';
import Line2 from './util/fatline/Line2';

const OPTIONS = {
    altitude: 0
};

class FatLine extends BaseObject {
    constructor(lineString, options, material, layer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineString });
        super();
        this._initOptions(options);
        const center = (isGeoJSON(lineString) ? getGeoJSONCenter(lineString) : lineString.getCenter());
        const positionsV = getLinePosition(lineString, layer, center).positionsV;
        const ps = [];
        for (let i = 0, len = positionsV.length; i < len; i++) {
            const v = positionsV[i];
            if (i > 0 && i < len - 1) {
                ps.push(v.x, v.y, v.z);
            }
            ps.push(v.x, v.y, v.z);
        }
        const geometry = new LineGeometry();
        geometry.setPositions(ps);
        this._setMaterialRes(layer, material);
        this._createLine2(geometry, material);
        const { altitude } = options;
        const z = layer.distanceToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);
        this._setPickObject3d(ps, material.linewidth);
        this._init();
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
        const material = new THREE.LineMaterial({
            color: '#fff',
            // side: THREE.BackSide,
            linewidth,
            vertexColors: THREE.VertexColors,
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
            material.resolution.set(width, height);
            this.getObject3d().material = material;
        }
        return this;
    }

}
export default FatLine;
