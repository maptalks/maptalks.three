import * as THREE from 'three';

export function recursionObject3dLayer(object3d: THREE.Object3D, layer: number) {
    if (!object3d) {
        return;
    }
    if (object3d.layers) {
        object3d.layers.set(layer);
    }
    const children = object3d.children;
    if (children && children.length) {
        for (let i = 0, len = children.length; i < len; i++) {
            recursionObject3dLayer(children[i], layer);
        }
    }
}
