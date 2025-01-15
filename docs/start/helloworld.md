---
outline: deep
---

# Hello World

## ESM

```js
import * as THREE from 'three';
import * as maptalks from 'maptalks';
import {
    ThreeLayer
} from 'maptalks.three';

const map = new maptalks.Map('map', {
    center: [19.06325670775459, 42.16842479475318],
    zoom: 3,
    pitch: 60,
    // bearing: 180,
});

const threeLayer = new ThreeLayer('t');
threeLayer.prepareToDraw = function(gl, scene, camera) {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, -10, -10).normalize();
    scene.add(light);
    //...
};

threeLayer.addTo(map);
```

### Use maptalks-gl

```js
import * as THREE from 'three';
import * as maptalks from 'maptalks-gl';
import {
    ThreeLayer
} from 'maptalks.three';

const map = new maptalks.Map('map', {
    center: [19.06325670775459, 42.16842479475318],
    zoom: 3,
    pitch: 60,
    // bearing: 180,
});

const threeLayer = new ThreeLayer('t');
threeLayer.prepareToDraw = function(gl, scene, camera) {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, -10, -10).normalize();
    scene.add(light);
    //...
};

const sceneConfig = {
    postProcess: {
        enable: true,
        antialias: {
            enable: true
        }
    }
};
const groupLayer = new maptalks.GroupGLLayer('group', [threeLayer], {
    sceneConfig
});
groupLayer.addTo(map);
```

## UMD

```html
<script type="text/javascript" src="https://unpkg.com/three@0.138.0/build/three.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/maptalks/dist/maptalks.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/maptalks.three/dist/maptalks.three.js"></script>
<script>
    const map = new maptalks.Map('map', {
        center: [19.06325670775459, 42.16842479475318],
        zoom: 3,
        pitch: 60,
        // bearing: 180,
    });

    const threeLayer = new maptalks.ThreeLayer('t');
    threeLayer.prepareToDraw = function(gl, scene, camera) {
        const light = new THREE.DirectionalLight(0xffffff);
        light.position.set(0, -10, -10).normalize();
        scene.add(light);
        //...
    };

    threeLayer.addTo(map);
</script>
```
