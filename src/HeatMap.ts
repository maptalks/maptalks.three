import * as maptalks from 'maptalks';
import * as THREE from 'three';
import BaseObject from './BaseObject';
import HeatMapUitl from './util/heatmap/HeatMapUtil';
import { createCanvas } from './util/CanvasUtil';
import Intensity from './util/heatmap/Intensity';
import { addAttribute, getVertexColors } from './util/ThreeAdaptUtil';
import { HeatMapDataType, HeatMapOptionType } from './type';
import { ThreeLayer } from './index';
import { getPlaneGeometry } from './util/GeometryUtil';

const OPTIONS = {
    altitude: 0,
    interactive: false,
    min: 0,
    max: 100,
    size: 13,
    gradient: { 0.25: 'rgb(0,0,255)', 0.55: 'rgb(0,255,0)', 0.85: 'yellow', 1.0: 'rgb(255,0,0)' },
    gridScale: 0.5
};

const CANVAS_MAX_SIZE = 2048;

/**
 *
 */
class HeatMap extends BaseObject {
    constructor(data: Array<HeatMapDataType>, options: HeatMapOptionType, material: THREE.Material, layer: ThreeLayer) {
        if (!Array.isArray(data)) {
            data = [data];
        }
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        const vs = [];
        //Calculate bbox
        for (let i = 0, len = data.length; i < len; i++) {
            const { coordinate, lnglat, xy } = data[i];
            const coord = coordinate || lnglat || xy;
            if (!coord) {
                console.warn('not find coordinate');
                continue;
            }
            const v = layer.coordinateToVector3(coord);
            vs.push(v);
            const { x, y } = v;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
        }
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, points: data });

        // Calculate canvas width and height
        let { gridScale, altitude } = options;
        const offsetX = Math.abs(maxX - minX), offsetY = Math.abs(maxY - minY);
        const maxOffset = Math.max((offsetX * gridScale), (offsetY * gridScale));
        if (maxOffset > CANVAS_MAX_SIZE) {
            console.warn(`gridScale: ${gridScale} it's too big. I hope it's a smaller value,canvas max size is ${CANVAS_MAX_SIZE}* ${CANVAS_MAX_SIZE}`);
            const offset = maxOffset / gridScale;
            gridScale = CANVAS_MAX_SIZE / offset;
        }
        const canvasWidth = Math.ceil(offsetX * gridScale), canvasHeight = Math.ceil(offsetY * gridScale);
        const scaleX = canvasWidth / offsetX, scaleY = canvasHeight / offsetY;
        const pixels = [];
        for (let i = 0, len = vs.length; i < len; i++) {
            const v = vs[i];
            v.x -= minX;
            v.y -= minY;
            v.x *= scaleX;
            v.y *= scaleY;
            v.y = canvasHeight - v.y;
            //for heat draw data
            pixels.push({
                coordinate: [v.x, v.y],
                count: data[i].count
            });
        }
        let shadowCanvas = createCanvas(canvasWidth, canvasHeight);
        let shadowContext = shadowCanvas.getContext('2d');
        // shadowContext.scale(devicePixelRatio, devicePixelRatio);
        HeatMapUitl.drawGray(shadowContext, pixels, options);
        const colored = shadowContext.getImageData(0, 0, shadowContext.canvas.width, shadowContext.canvas.height);

        let maxAlpha = -Infinity;
        const blackps = new Float32Array(colored.data.length / 4), alphas = new Float32Array(colored.data.length / 4);
        for (let i = 3, len = colored.data.length, j = 0; i < len; i += 4) {
            const alpha = colored.data[i];
            maxAlpha = Math.max(maxAlpha, alpha);
            alphas[j] = alpha;
            //Points that do not need to be drawn
            if (alpha <= 0) {
                blackps[j] = 1;
            }
            j++;
        }
        const intensity = new Intensity({
            gradient: options.gradient
        });
        HeatMapUitl.colorize(colored.data, intensity.getImageData(), options);
        shadowCanvas = null;
        shadowContext = null;

        // const geometry = new THREE.PlaneBufferGeometry(offsetX, offsetY, canvasWidth - 1, canvasHeight - 1);
        const geometry = getPlaneGeometry(offsetX, offsetY, canvasWidth - 1, canvasHeight - 1);
        const index = geometry.getIndex().array;
        const position = geometry.attributes.position.array as any;
        // Index of the points that really need to be drawn
        const colors = new Float32Array(position.length);
        const tempIndex = new Uint32Array(position.length * 6);
        const color = new THREE.Color();
        let iIndex = 0;
        for (let i = 0, len = position.length, j = 0, len1 = index.length, m = 0, len2 = colored.data.length, n = 0; i < Math.max(len, len1, len2); i += 3) {
            if (i < len) {
                const alpha = alphas[n];
                if (alpha > 0) {
                    position[i + 2] = alpha / maxAlpha;
                }
            }
            if (j < len1) {
                const a = index[j], b = index[j + 1], c = index[j + 2];
                if ((!blackps[a]) || (!blackps[b]) || (!blackps[c])) {
                    tempIndex[iIndex] = a;
                    tempIndex[iIndex + 1] = b;
                    tempIndex[iIndex + 2] = c;
                    iIndex += 3;
                }
            }
            if (m < len2) {
                const r = colored.data[m], g = colored.data[m + 1], b = colored.data[m + 2];// a = colored.data[i + 3];
                const rgb = `rgb(${r},${g},${b})`;
                color.setStyle(rgb);
                colors[j] = color.r;
                colors[j + 1] = color.g;
                colors[j + 2] = color.b;
            }
            j += 3;
            m += 4;
            n++;
        }
        const filterIndex = new Uint32Array(iIndex);
        for (let i = 0; i < iIndex; i++) {
            filterIndex[i] = tempIndex[i];
        }
        geometry.setIndex(new THREE.BufferAttribute(filterIndex, 1));
        addAttribute(geometry, 'color', new THREE.BufferAttribute(colors, 3, true));
        (material as any).vertexColors = getVertexColors();
        super();
        this._initOptions(options);
        this._createMesh(geometry, material);
        const z = layer.distanceToVector3(altitude, altitude).x;
        this.getObject3d().position.copy(new THREE.Vector3((minX + maxX) / 2, (minY + maxY) / 2, z));
        this.type = 'HeatMap';

    }
}

export default HeatMap;
