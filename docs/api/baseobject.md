---
outline: deep
---

# BaseObject

It is a super base class.

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

Its API and maptalks Geometry is very similar

## constructor()

Usually, we directly use its subclasses

```js
 const baseObject = new BaseObject(id);
```

## methods

### `_initOptions(options: Record<string, any>)`

init BaseObject inner config  <Badge type="tip" text="for custom" />

```js
   this._initOptions(options);
```

### `_createMesh(geometry, material)`

 create inner `THREE.Mesh`  <Badge type="tip" text="for custom" />

```js
    const geometry = new THREE.CircleBufferGeometry(r, 50);

    //Initialize internal object3d
    // https://github.com/maptalks/maptalks.three/blob/1e45f5238f500225ada1deb09b8bab18c1b52cf2/src/BaseObject.js#L140
    this._createMesh(geometry, material);
```

### `_createGroup()`

 create inner `THREE.Group`  <Badge type="tip" text="for custom" />

### `_createLine(geometry, material)`

 create inner `THREE.Line`

### `_createPoints(geometry, material)` 

 create inner `THREE.Points`  <Badge type="tip" text="for custom" />

### `_createLineSegments(geometry, material)`

 create inner `THREE.LineSegments`  <Badge type="tip" text="for custom" />

### `_createInstancedMesh(geometry, material, count)`

 create inner `THREE.InstancedMesh`  <Badge type="tip" text="for custom" />

### `getObject3d()`

get inner `THREE.Object3d` , `THREE.Mesh` , `THREE.Group` etc

### `getOptions()`

get BaseObject options config

### `addTo(threeLayer)`

### `remove()`

### `getId()`

### `setId(id:string)`

### `getProperties()`

### `setProperties(props: Record<string, any>)`

### `getLayer(): ThreeLayer`

### `getMap(): Map`

### `getCenter(): Coordinate|null`

### `getAltitude():number`

### `setAltitude(altitude: number)`

### `getHeight():number`

### `setHeight(height: number)`

### `show()`

### `hide()`

### `isVisible():boolean`

### `setInfoWindow(options)`

```js
   // //infowindow test
   bar.setInfoWindow({
       content: 'hello world,height:' + d.height * 400,
       title: 'message',
       animationDuration: 0
   });
```

### `getInfoWindow()`

### `openInfoWindow(coordinate)`

### `closeInfoWindow()`

### `removeInfoWindow()`

### `setToolTip(content, options)`

```js
   // // tooltip test
   bar.setToolTip(d.height * 400, {
       showTimeout: 0,
       eventsPropagation: true,
       dx: 10
   });
```

### `getToolTip()`

### `closeToolTip()`

### `removeToolTip()`

### `getMinZoom()`

### `getMaxZoom()`

### `isAsynchronous()`

Is it asynchronous, that is, constructing graphic data through workers

### `on(eventName, handler, context)`

```js
const clickHandler = (e) => {

}
bar.on('click', clickHandler);
```

### `once(eventName, handler, context)`

```js
bar.once('click', clickHandler);
```

### `off(eventName, handler, context)`

```js
bar.off('click', clickHandler);
```

## events

```js
const clickHandler = (e) => {

}
bar.on('click mousemove', clickHandler);
```

### add

### remove

### click

### mousemove

### mouseover

### mouseout

### dblclick

### empty

### idchange

### propertieschange

### show

### hide

### symbolchange

### workerload

::: warning
This event will only be triggered by constructing graphic data through workers
:::
