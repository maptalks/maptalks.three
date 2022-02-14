# maptalks.three

[![CircleCI](https://circleci.com/gh/maptalks/maptalks.three/tree/master.svg?style=shield)](https://circleci.com/gh/maptalks/maptalks.three)
[![NPM Version](https://img.shields.io/npm/v/maptalks.three.svg)](https://github.com/maptalks/maptalks.three)

A maptalks Layer to render with three.js

<a href="http://maptalks.org/maptalks.three/demo/bloom.html" title="maptalks.three Demo" target="_blank"><video width="820" src = "https://user-images.githubusercontent.com/25998927/149662311-4cb06c54-49ab-44b2-b019-518c0228508c.mp4" autoplay loop hspace="10"></video></a>
## Examples

* [Demos](https://maptalks.github.io/maptalks.three/demo/index.html).

## Install
  
* Install with npm: ```npm install maptalks.three```. 
* Download from [dist directory](https://github.com/maptalks/maptalks.three/tree/gh-pages/dist).
* Use unpkg CDN: `https://unpkg.com/maptalks.three/dist/maptalks.three.min.js`

## Incompatible changes
 * three.js >=128  the default umd package is ES6
 * Starting from version 0.16.0, the default umd package is ES6,To fit the new version of three.js [about three umd package change](https://github.com/mrdoob/three.js/issues/22025)
 * If your running environment does not support ES6, we also provide Es5 version [maptalks.three.es5.js](https://unpkg.com/maptalks.three/dist/maptalks.three.es5.js),This requires the version of three.js < = 127,

## Migration from <=v0.5.x to v0.6.0

* Re-implementated locateCamera, sync with map's projMatrix and viewMatrix.
* Model's z position is reversed from v0.5.0. So if you have models rendered with v0.5.x, rotation needs to be updated.
* For THREE <= 0.94, material's side need to set to THREE.BackSide or THREE.DoubleSide to render correctly
    * THREE >= 0.95 doesn't need, maybe due to [#14379](https://github.com/mrdoob/three.js/pull/14379)
* Add support for THREE >= 0.93
* Add support for GroupGLLayer

## Usage

As a plugin, `maptalks.three` must be loaded after `maptalks.js` and `three.js` in browsers.
```html
<script type="text/javascript" src="https://unpkg.com/three@0.104.0/build/three.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/maptalks/dist/maptalks.min.js"></script>
<script type="text/javascript" src="https://unpkg.com/maptalks.three/dist/maptalks.three.js"></script>
<script>
var threeLayer = new maptalks.ThreeLayer('t');
threeLayer.prepareToDraw = function (gl, scene, camera) {
    var light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, -10, -10).normalize();
    scene.add(light);

    var material = new THREE.MeshPhongMaterial();
    countries.features.forEach(function (g) {
        //g is geojson Feature
        var num = g.properties.population;

        var extrudePolygon=threeLayer.toExtrudePolygon(g, { height: num }, material);
        threeLayer.addMesh(extrudePolygon)
    });
};

map.addLayer(threeLayer);
</script>
```

With ES Modules:

```javascript
import * as THREE from 'three';
import * as maptalks from 'maptalks';
import { ThreeLayer } from 'maptalks.three';

const map = new maptalks.Map('map', { /* options */ });

const threeLayer = new ThreeLayer('t');
threeLayer.prepareToDraw = function (gl, scene, camera) {
    const light = new THREE.DirectionalLight(0xffffff);
    light.position.set(0, -10, -10).normalize();
    scene.add(light);
    //...
};

threeLayer.addTo(map);
```

## Supported Browsers

IE 11, Chrome, Firefox, other modern and mobile browsers that support WebGL;

## API Reference

### [API](https://deyihu.github.io/maptalks.three.doc/build/)  


## Contributing

We welcome any kind of contributions including issue reportings, pull requests, documentation corrections, feature requests and any other helps.

## Develop

The only source file is ```index.js```.

It is written in ES6, transpiled by [babel](https://babeljs.io/) and tested with [mocha](https://mochajs.org) and [expect.js](https://github.com/Automattic/expect.js).

### Scripts

* Install dependencies
```shell
$ npm install
```

* Watch source changes and generate runnable bundle repeatedly
```shell
$ npm run dev
```

* Package and generate minified bundles to dist directory
```shell
$ npm run build
```

* Lint
```shell
$ npm run lint
```

## Publication
```shell
npm version ${version}
npm publish
npm push master ${version}
```
