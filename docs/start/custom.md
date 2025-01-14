---
outline: deep
---

# Custom BaseObject

the `BaseObject` is a super base class.

Its subclasses include:

```
├─ Bar.ts 
├─ Bars.ts 
├─ Box.ts 
├─ Boxs.ts 
├─ ExtrudeLine.ts 
├─ ExtrudeLines.ts 
├─ ExtrudeLineTrail.ts 
├─ ExtrudePolygon.ts 
├─ ExtrudePolygons.ts 
├─ FatLine.ts 
├─ FatLines.ts 
├─ HeatMap.ts 
├─ Line.ts 
├─ Lines.ts 
├─ Model.ts 
├─ Path.ts 
├─ Paths.ts 
├─ Point.ts
├─ Points.ts 
├─ Terrain.ts 
```

You can customize your own graphic classes based on your preferences

## Some Methods for Custom

some methods for custom if need custom BaseObject



### ThreeLayer

::: warning   
Note that distance conversion and altitude conversion are two different methods, and their underlying logic is different
:::


* `distanceToVector3(x, x)`

transform distance to gl point. Conversion of horizontal distance 

```js
const vector1 = threeLayer.distanceToVector3(100, 100);
```

* `altitudeToVector3(x, x)`

transform altitude to gl point. Conversion of Vertical Distance

```js
const vector2 = threeLayer.altitudeToVector3(100, 100);
```

* `coordinateToVector3(coordinate, z)`

transform geographical coordinates to gl point

```js
const vector3 = threeLayer.coordinateToVector3([120, 31]);
vector3.z = vector2.x;
```

### BaseObject

* `_initOptions(options)`

init BaseObject inner config <Badge type="tip" text="for custom" />

```js
   this._initOptions(options);
```

* `_createMesh(geometry, material)`

 create inner `THREE.Mesh` <Badge type="tip" text="for custom" />

```js
    const geometry = new THREE.CircleBufferGeometry(r, 50);

    //Initialize internal object3d
    // https://github.com/maptalks/maptalks.three/blob/1e45f5238f500225ada1deb09b8bab18c1b52cf2/src/BaseObject.js#L140
    this._createMesh(geometry, material);
```

* `_createGroup()`

 create inner `THREE.Group` <Badge type="tip" text="for custom" />

* `_createLine(geometry,material)`

 create inner `THREE.Line` <Badge type="tip" text="for custom" />

* `_createPoints(geometry,material)`

 create inner `THREE.Points` <Badge type="tip" text="for custom" />

* `_createLineSegments(geometry,material)`

 create inner `THREE.LineSegments` <Badge type="tip" text="for custom" />

* `_createInstancedMesh(geometry,material,count)`

 create inner `THREE.InstancedMesh` <Badge type="tip" text="for custom" />

* `getObject3d()`

get inner `THREE.Object3d` , `THREE.Mesh`,`THREE.Group` etc

* `getOptions()`

get BaseObject options config

## Custom A Circle

```js
import {
    BaseObject
} from 'maptalks.three';
//default values
var OPTIONS = {
    radius: 100,
    altitude: 0
};

/**
 * custom Circle component
 * 
 * you can customize your own components
 * */

class Circle extends BaseObject {
    constructor(coordinate, options, material, layer) {
        options = maptalks.Util.extend({}, OPTIONS, options, {
            layer,
            coordinate
        });
        super();
        //Initialize internal configuration
        // https://github.com/maptalks/maptalks.three/blob/1e45f5238f500225ada1deb09b8bab18c1b52cf2/src/BaseObject.js#L135
        this._initOptions(options);
        const {
            altitude,
            radius
        } = options;
        //generate geometry
        const r = layer.distanceToVector3(radius, radius).x
        const geometry = new THREE.CircleBufferGeometry(r, 50);

        //Initialize internal object3d
        // https://github.com/maptalks/maptalks.three/blob/1e45f5238f500225ada1deb09b8bab18c1b52cf2/src/BaseObject.js#L140
        this._createMesh(geometry, material);

        //set object3d position
        const z = layer.altitudeToVector3(altitude, altitude).x;
        const position = layer.coordinateToVector3(coordinate, z);
        this.getObject3d().position.copy(position);
        // this.getObject3d().rotation.x = -Math.PI;
    }

    /**
     * animateShow test
     * 
     * */
    animateShow(options = {}, cb) {
        if (this._showPlayer) {
            this._showPlayer.cancel();
        }
        if (maptalks.Util.isFunction(options)) {
            options = {};
            cb = options;
        }
        const duration = options['duration'] || 1000,
            easing = options['easing'] || 'out';
        const player = this._showPlayer = maptalks.animation.Animation.animate({
            'scale': 1
        }, {
            'duration': duration,
            'easing': easing
        }, frame => {
            const scale = frame.styles.scale;
            if (scale > 0) {
                this.getObject3d().scale.set(scale, scale, scale);
            }
            if (cb) {
                cb(frame, scale);
            }
        });
        player.play();
        return player;
    }
}

var circle = new Circle(lnglat, {
    radius: 200
}, material, threeLayer);
```

You can refer to this code to customize your graphics
