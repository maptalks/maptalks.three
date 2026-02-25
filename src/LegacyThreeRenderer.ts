import * as maptalks from 'maptalks';
import * as THREE from 'three';
import GPUPick from './GPUPick';
import { BaseObjectTaskManager } from './BaseObjectTaskManager';
import { recursionObject3dLayer } from './rendererutil';
import { ThreeLayer } from './index';

const TEMPMESH = {
    bloom: true
};

const KEY_FBO = '__webglFramebuffer';
const TEMP_V4 = new THREE.Vector4();

export default class ThreeRenderer extends maptalks.renderer.CanvasLayerRenderer {
    scene: THREE.Scene;
    camera: THREE.Camera;
    canvas: any
    layer: ThreeLayer;
    gl: any
    context: THREE.WebGLRenderer;
    matrix4: THREE.Matrix4;
    pick: GPUPick;
    _renderTime: number = 0;
    _renderTarget: THREE.WebGLRenderTarget = null;

    getPrepareParams(): Array<any> {
        return [this.scene, this.camera];
    }

    getDrawParams(): Array<any> {
        return [this.scene, this.camera];
    }

    _drawLayer() {
        super._drawLayer.apply(this, arguments);
        // this.renderScene();
    }

    hitDetect(): boolean {
        return false;
    }

    createCanvas() {
        super.createCanvas();
        this.createContext();
    }

    createContext() {
        if (this.canvas.gl && this.canvas.gl.wrap) {
            this.gl = this.canvas.gl.wrap();
        } else {
            const layer = this.layer;
            const attributes = layer.options.glOptions || {
                alpha: true,
                depth: true,
                antialias: true,
                stencil: true,
                preserveDrawingBuffer: false
            };
            attributes.preserveDrawingBuffer = true;
            this.gl = this.gl || this._createGLContext(this.canvas, attributes);
        }
        this._initThreeRenderer();
        this.layer.onCanvasCreate(this.context, this.scene, this.camera);
    }

    _initThreeRenderer() {
        this.matrix4 = new THREE.Matrix4();
        const renderer = new THREE.WebGLRenderer({ 'context': this.gl, alpha: true });
        renderer.autoClear = false;
        renderer.setClearColor(new THREE.Color(1, 1, 1), 0);
        renderer.setSize(this.canvas.width, this.canvas.height);
        renderer.clear();
        // renderer.canvas = this.canvas;
        this.context = renderer;

        const scene = this.scene = new THREE.Scene();
        const map = this.layer.getMap();
        const fov = map.getFov() * Math.PI / 180;
        const camera = this.camera = new THREE.PerspectiveCamera(fov, map.width / map.height, map.cameraNear, map.cameraFar);
        camera.matrixAutoUpdate = false;
        this._syncCamera();
        scene.add(camera);
        this.pick = new GPUPick(this.layer);
        BaseObjectTaskManager.star();
        this.layer._addBaseObjectsWhenInit();
    }

    onCanvasCreate() {
        super.onCanvasCreate();

    }

    resizeCanvas(canvasSize: maptalks.Size) {
        if (!this.canvas) {
            return;
        }
        let size, map = this.getMap();
        if (!canvasSize) {
            size = map.getSize();
        } else {
            size = canvasSize;
        }
        // const r = maptalks.Browser.retina ? 2 : 1;
        const r = map.getDevicePixelRatio ? map.getDevicePixelRatio() : (maptalks.Browser.retina ? 2 : 1);
        const canvas = this.canvas;
        const { width, height, cssWidth, cssHeight } = maptalks.Util.calCanvasSize(size, r);
        if (this.layer._canvas && (canvas.style.width !== cssWidth || canvas.style.height !== cssHeight)) {
            canvas.style.width = cssWidth;
            canvas.style.height = cssHeight;
        }
        if (canvas.width === width && canvas.height === height) {
            return this;
        }
        //retina support
        canvas.width = width;
        canvas.height = height;
        this.context.setSize(canvas.width, canvas.height);
    }

    clearCanvas() {
        if (!this.canvas) {
            return;
        }

        this.context.clear();
    }

    prepareCanvas(): any {
        if (!this.canvas) {
            this.createCanvas();
        } else {
            this.clearCanvas();
        }
        this.layer.fire('renderstart', { 'context': this.context });
        return null;
    }
    renderScene(context) {
        // const time = maptalks.Util.now();
        // Make sure to execute only once in a frame
        // if (time - this._renderTime >= 16) {
        //     this.layer._callbackBaseObjectAnimation();
        //     this._renderTime = time;
        // }
        this.layer._callbackBaseObjectAnimation();
        this._syncCamera();
        // 把 WebglRenderTarget 中的 framebuffer 替换为 GroupGLLayer 中的 fbo
        // 参考: https://stackoverflow.com/questions/55082573/use-webgl-texture-as-a-three-js-texture-map
        // 实现有点 hacky，需要留意 three 版本变动 对它的影响
        if (context && context.renderTarget) {
            const { width, height } = context.renderTarget.fbo;
            if (!this._renderTarget) {
                this._renderTarget = new THREE.WebGLRenderTarget(width, height, {
                    // depthTexture: new THREE.DepthTexture(width, height, THREE.UnsignedInt248Type)
                    depthBuffer: false
                });
                // 绘制一次以后，才会生成 framebuffer 对象
                this.context.setRenderTarget(this._renderTarget);
                this.context.render(this.scene, this.camera);
            } else {
                // 这里不能setSize，因为setSize中会把原有的fbo dipose掉
                // this._renderTarget.setSize(width, height);
                this._renderTarget.viewport.set(0, 0, width, height);
                this._renderTarget.scissor.set(0, 0, width, height);
            }
            const renderTargetProps = this.context.properties.get(this._renderTarget);

            const threeCreatedFBO = renderTargetProps[KEY_FBO];
            // 用GroupGLLayer的webgl fbo对象替换WebglRenderTarget的fbo对象
            renderTargetProps[KEY_FBO] = context.renderTarget.getFramebuffer(context.renderTarget.fbo);
            this.context.setRenderTarget(this._renderTarget);
            const bloomEnable = context.bloom === 1 && context.sceneFilter;
            const object3ds = this.scene.children || [];
            //是否是bloom渲染帧
            let isBloomFrame = false;
            if (bloomEnable) {
                const sceneFilter = context.sceneFilter;
                // test 是否是bloom渲染帧
                isBloomFrame = sceneFilter(TEMPMESH);
                for (let i = 0, len = object3ds.length; i < len; i++) {
                    if (!object3ds[i] || !object3ds[i].layers) {
                        continue;
                    }
                    const parent = object3ds[i]['__parent'];
                    object3ds[i]['bloom'] = false;
                    //判断当前ojbect3d是否开启bloom
                    if (parent) {
                        object3ds[i]['bloom'] = parent.bloom;
                    }
                    let layer = 0;
                    //当object3d找不到parent(baseobject)时，也加入当前渲染帧，这种情况的一般都是灯光对象
                    //sceneFilter 用来过滤符合当前模式的meshes
                    if (object3ds[i] && sceneFilter(object3ds[i]) || !parent) {
                        //当时bloom渲染帧时，将meshes分组到layer=1
                        if (isBloomFrame) {
                            layer = 1;
                        }
                    }
                    // object3ds[i].layers.set(layer);
                    if ((object3ds[i] as any).__layer !== layer) {
                        recursionObject3dLayer(object3ds[i], layer);
                        (object3ds[i] as any).__layer = layer;
                    }
                }
            } else {
                //reset all object3ds layers
                for (let i = 0, len = object3ds.length; i < len; i++) {
                    if (!object3ds[i] || !object3ds[i].layers) {
                        continue;
                    }
                    // object3ds[i].layers.set(0);
                    if ((object3ds[i] as any).__layer !== 0) {
                        recursionObject3dLayer(object3ds[i], 0);
                        (object3ds[i] as any).__layer = 0;
                    }
                }
            }
            this.camera.layers.set(isBloomFrame ? 1 : 0);
            this.context.render(this.scene, this.camera);
            renderTargetProps[KEY_FBO] = threeCreatedFBO;
        } else {
            const { width, height } = this.canvas;
            const viewport = this.context.getViewport(TEMP_V4);
            if (viewport.width !== width || viewport.height !== height) {
                this.context.setViewport(0, 0, width, height);
            }
            this.context.render(this.scene, this.camera);
        }
        this.context.setRenderTarget(null);
        this.completeRender();
    }

    remove() {
        delete this._drawContext;
        if (this._renderTarget) {
            this._renderTarget.dispose();
            delete this._renderTarget;
        }
        super.remove();
    }

    _syncCamera() {
        const map = this.getMap();
        const camera = this.camera;
        camera.matrix.elements = map.cameraWorldMatrix;
        camera.projectionMatrix.elements = map.projMatrix;
        //https://github.com/mrdoob/three.js/commit/d52afdd2ceafd690ac9e20917d0c968ff2fa7661
        if (this.matrix4.invert) {
            camera.projectionMatrixInverse.elements = this.matrix4.copy(camera.projectionMatrix).invert().elements;
            //r95 no projectionMatrixInverse properties
        } else if (camera.projectionMatrixInverse) {
            camera.projectionMatrixInverse.elements = this.matrix4.getInverse(camera.projectionMatrix).elements;
        }
    }

    _createGLContext(canvas: HTMLCanvasElement, options: object) {
        const names = ['webgl2', 'webgl', 'experimental-webgl'];
        let context = null;
        /* eslint-disable no-empty */
        for (let i = 0; i < names.length; ++i) {
            try {
                context = canvas.getContext(names[i], options);
            } catch (e) { }
            if (context) {
                break;
            }
        }
        return context;
        /* eslint-enable no-empty */
    }
}
