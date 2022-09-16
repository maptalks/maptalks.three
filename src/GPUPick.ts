
import * as THREE from 'three';
import * as maptalks from 'maptalks';

const color: THREE.Color = new THREE.Color();
let colorIndex = 1;
/**
 *https://github.com/mrdoob/three.js/blob/master/examples/webgl_interactive_cubes_gpu.html
 */
class GPUPick {
    object3ds: THREE.Object3D[];
    layer: any;
    camera: THREE.Camera;
    renderer: THREE.WebGLRenderer;
    pickingTexture: THREE.WebGLRenderTarget;
    pickingScene: THREE.Scene;

    constructor(layer: any) {
        this.object3ds = [];
        this.layer = layer;
        this.camera = layer.getCamera();
        this.renderer = layer.getThreeRenderer();
        this.pickingTexture = new THREE.WebGLRenderTarget(1, 1);
        this.pickingScene = new THREE.Scene();
    }

    getColor(): THREE.Color {
        color.setHex(colorIndex);
        colorIndex++;
        return color;
    }

    add(object3d: THREE.Object3D) {
        if (object3d) {
            const colorIndex = object3d['_colorIndex'];
            if (colorIndex) {
                this.object3ds[colorIndex] = object3d;
                this.pickingScene.add(object3d);
            }
        }
        return this;
    }

    remove(object3d: THREE.Object3D) {
        if (object3d) {
            const colorIndex = object3d['_colorIndex'];
            if (colorIndex) {
                this.object3ds[colorIndex] = null;
                this.pickingScene.remove(object3d);
            }
        }
        return this;
    }

    isEmpty(): boolean {
        if (this.pickingScene.children.length === 0) {
            return true;
        }
        for (let i = 0, len = this.pickingScene.children.length; i < len; i++) {
            const mesh = this.pickingScene.children[i];
            if (mesh) {
                const object3d = mesh['__parent'];
                if (object3d && object3d.getOptions().interactive === true) {
                    return false;
                }
            }
        }
        return true;
    }

    pick(pixel: maptalks.Point) {
        if (!pixel) {
            return;
        }
        if (this.isEmpty()) {
            return;
        }
        const { camera, renderer, pickingTexture, pickingScene, object3ds, layer } = this;
        const len = this.pickingScene.children.length;
        // reset all object3d picked
        for (let i = 0; i < len; i++) {
            const object3d = this.pickingScene.children[i];
            if (object3d && object3d['__parent']) {
                object3d['__parent'].picked = false;
            }
        }
        //resize size
        const { width, height } = layer._getRenderer().canvas;
        const pw = pickingTexture.width, ph = pickingTexture.height;
        if (width !== pw || height !== ph) {
            pickingTexture.setSize(width, height);
        }

        //render the picking scene off-screen

        // set the view offset to represent just a single pixel under the mouse

        // camera.setViewOffset(width, height, mouse.x, mouse.y, 1, 1);

        // render the scene
        renderer.setRenderTarget(pickingTexture);
        renderer.clear();
        if (camera && camera.layers) {
            this.camera.layers.set(0);
        }
        renderer.render(pickingScene, camera);

        // clear the view offset so rendering returns to normal

        // camera.clearViewOffset();

        //create buffer for reading single pixel

        const pixelBuffer = new Uint8Array(4);

        //read the pixel
        const { x, y } = pixel;
        const devicePixelRatio = window.devicePixelRatio;
        const offsetX = (x * devicePixelRatio), offsetY = (pickingTexture.height - y * devicePixelRatio);
        renderer.readRenderTargetPixels(pickingTexture, Math.round(offsetX), Math.round(offsetY), 1, 1, pixelBuffer);

        //interpret the pixel as an ID


        const id = (pixelBuffer[0] << 16) | (pixelBuffer[1] << 8) | (pixelBuffer[2]);
        const object3d = object3ds[id];
        if (object3d) {
            if (object3d['__parent']) {
                object3ds[id]['__parent'].picked = true;
            }
        } else {
            //for merged mesh
            for (let i = 0; i < len; i++) {
                const object3d = this.pickingScene.children[i];
                if (object3d && object3d['__parent']) {
                    const parent = object3d['__parent'];
                    if (parent._colorMap && parent._colorMap[id] != null) {
                        parent.picked = true;
                        parent.index = parent._colorMap[id];
                        break;
                    }
                }
            }
        }
        renderer.setRenderTarget(null);
    }
}
export default GPUPick;
