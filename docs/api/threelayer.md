---
outline: deep
---

# ThreeLayer

A maptalks Layer to render with three.js

It is based on `maptalks.CanvasLayer`

It is subclass of `maptalks.Layer`

![](/layer.png)

## constructor(id: string, options: BaseLayerOptionType)

```js
const threeLayer = new ThreeLayer("t", {
    identifyCountOnEvent: 1,
});
threeLayer.addTo(map);
```

```ts
export type BaseLayerOptionType = {
    renderer?: string;
    doubleBuffer?: boolean;
    glOptions?: {
        preserveDrawingBuffer: boolean;
    };
    geometryEvents?: boolean;
    identifyCountOnEvent?: number;
    forceRenderOnMoving?: boolean;
    forceRenderOnRotating?: boolean;
    forceRenderOnZooming?: boolean;
    centerForDistance?: maptalks.Coordinate;
    loopRenderCount?: number;
};
```

## methods

### getId()

<Badge type="tip" text="from super class" />

### setId(id:string)

<Badge type="tip" text="from super class" />

### addTo(map)

<Badge type="tip" text="from super class" />

### remove()

<Badge type="tip" text="from super class" />

### setZIndex(zIndex: number)

<Badge type="tip" text="from super class" />

### getZIndex()

<Badge type="tip" text="from super class" />

### getMinZoom()

<Badge type="tip" text="from super class" />

### getMaxZoom()

<Badge type="tip" text="from super class" />

### getOpacity()

<Badge type="tip" text="from super class" />

### setOpacity(op: number)

<Badge type="tip" text="from super class" />

### getMap()

<Badge type="tip" text="from super class" />

### bringToFront()

<Badge type="tip" text="from super class" />

### bringToBack()

<Badge type="tip" text="from super class" />

### show()

<Badge type="tip" text="from super class" />

### hide()

<Badge type="tip" text="from super class" />

### isVisible()

<Badge type="tip" text="from super class" />

### `isMercator()`

### `isRendering()`

### `prepareToDraw(gl, scene, camera)`

```js
var threeLayer = new ThreeLayer("t", {
    forceRenderOnMoving: true,
    forceRenderOnRotating: true,
    identifyCountOnEvent: 1,
    // animation: true
});
threeLayer.prepareToDraw = function(gl, scene, camera) {
    //so some things if need
};
```

::: danger
This function is triggered every time a layer is added to the map
:::

### `coordinateToVector3(coordinate: maptalks.Coordinate | Array<number>, z: number = 0, out?: THREE.Vector3)`

transform geographical coordinates to gl point.

Usually used to construct vertices or positions in graphics

```js
//set object3d position
const z = layer.altitudeToVector3(altitude, altitude).x;
const position = layer.coordinateToVector3(coordinate, z);
this.getObject3d().position.copy(position);
```

### `distanceToVector3(w: number, h: number, coord?: maptalks.Coordinate | Array<number>)`

transform distance to gl point. Conversion of horizontal distance

```js
const vector1 = threeLayer.distanceToVector3(100, 100);
```

### `altitudeToVector3(altitude: number, altitude1: number, coord?: maptalks.Coordinate | Array<number>, out?: THREE.Vector3)`

transform altitude to gl point. Conversion of Vertical Distance

```js
const vector2 = threeLayer.altitudeToVector3(100, 100);
```

### `toExtrudePolygon(polygon: PolygonType, options: ExtrudePolygonOptionType, THREE.Material)`

![](/building.png)

```ts
export type ExtrudePolygonOptionType = BaseObjectOptionType & {
    height?: number;
    bottomHeight?: number;
    topColor?: string;
    bottomColor?: string;
    key?: string;
};

const extrudePolygon = threeLayer.toExtrudePolygon(
    new maptalks.Polygon(coordinates),
    {
        height: 100,
    },
    new THREE.MeshBasicMaterial()
);
```

### `toBar(coordinate: maptalks. Coordinate, options: BarOptionType, THREE.Material)`

![](/bar.png)

```ts
export type BarOptionType = BaseObjectOptionType & {
    radius?: number;
    height?: number;
    radialSegments?: number;
    topColor?: string;
    bottomColor?: string;
};

const bar = threeLayer.toBar(
    [120, 31],
    {
        radius: 100,
        height: 100,
    },
    new THREE.MeshBasicMaterial()
);
```

### `toLine(lineString: LineStringType, options: LineOptionType, THREE.Material: LineMaterialType)`

![](/line.png)

```ts
export type LineOptionType = BaseObjectOptionType & {
    bottomHeight?: number;
    colors?: Array<string | THREE.Color>;
};
const line = threeLayer.toLine(
    new maptalks.LineString(coordinates),
    {},
    material
);
```

### `toExtrudeLine(lineString: LineStringType, options: ExtrudeLineOptionType, THREE.Material)`

![](/extrudeline.png)

```ts
export type ExtrudeLineOptionType = BaseObjectOptionType & {
    bottomHeight?: number;
    width?: number;
    height?: number;
    topColor?: string;
    bottomColor?: string;
    key?: string;
};

const line = threeLayer.toExtrudeLine(
    new maptalks.LineString(coordinates),
    {
        width: 5,
        height: 1,
    },
    material
);
```

### `toModel(model: THREE. Object3D, options: BaseObjectOptionType)`

![](/model.png)

### `toExtrudeLineTrail(lineString: SingleLineStringType, options: ExtrudeLineTrailOptionType, THREE.Material)`

![](/ExtrudeLineTrail.png)

```ts
export type ExtrudeLineTrailOptionType = BaseObjectOptionType & {
    trail?: number;
    chunkLength?: number;
    width?: number;
    height?: number;
    speed?: number;
};

const line = threeLayer.toExtrudeLineTrail(
    new maptalks.LineString(coordinates),
    {
        width: 5,
        height: 1,
        chunkLength: 50,
        trail: 5,
    },
    material
);
```

::: danger

Considering performance issues, it is not recommended to use it

:::

### `toExtrudePolygons(polygons: Array<PolygonType>, options: ExtrudePolygonOptionType, THREE.Material)`

![](/buildings.png)

```ts
export type ExtrudePolygonOptionType = BaseObjectOptionType & {
    height?: number;
    bottomHeight?: number;
    topColor?: string;
    bottomColor?: string;
    key?: string;
};

var polygons = features.map((f) => {
    const polygon = maptalks.GeoJSON.toGeometry(f);
    var levels = f.properties.levels || 1;
    polygon.setProperties({
        height: heightPerLevel * levels,
    });
    return polygon;
});

const mesh = threeLayer.toExtrudePolygons(
    polygons,
    { interactive: false, topColor: "#fff" },
    material
);
meshs.push(mesh);
```

::: tip
Please bring your own height value for each polygon data
:::

### `toPoint(coordinate: maptalks. Coordinate, options: PointOptionType, THREE.Material: THREE. PointsMaterial)`

![](/point.png)

```ts
export type PointOptionType = BaseObjectOptionType & {
    height?: number;
    color?: string | THREE.Color;
    size?: number;
    coords?: number[];
};

const point = threeLayer.toPoint([120, 31], {}, material);
```

::: danger
Suggest using maptalks Marker to display icon points
:::

### `toBars(points: Array<BarOptionType>, options: BarOptionType, THREE.Material: THREE. Material)`

![](/bars.png)

```ts
export type BarOptionType = BaseObjectOptionType & {
    radius?: number;
    height?: number;
    radialSegments?: number;
    topColor?: string;
    bottomColor?: string;
};

const data = [
    {
        coordinate: dataItem.slice(0, 2),
        height: dataItem[2],
        radius: 15000,
        radialSegments: 20,
    },
    {
        coordinate: dataItem.slice(0, 2),
        height: dataItem[2],
        radius: 15000,
        radialSegments: 20,
    },
];

   const mesh = threeLayer.toBars(data, { interactive: false, asynchronous: true, topColor: "#fff" }, material);
   bars.push(mesh);

```

### `toExtrudeLines(lineStrings: Array<LineStringType>, options: ExtrudeLineOptionType, THREE.Material: THREE.Material)`

```ts

export type ExtrudeLineOptionType = BaseObjectOptionType & {
    bottomHeight?: number,
    width?: number,
    height?: number,
    topColor?: string,
    bottomColor?: string,
    key?: string
}

const lineStrings=[
    new maptalks.LineString(coordinates),
    new maptalks.LineString(coordinates),
]
const mesh = threeLayer.toExtrudeLines(lineStrings, { interactive: false, minZoom: 11,width:5,height:1 }, material);

```

### `toLines(lineStrings: Array<LineStringType>, options: LineOptionType, THREE.Material: LineMaterialType)`

```ts

export type LineOptionType = BaseObjectOptionType & {
    bottomHeight?: number,
    colors?: Array<string | THREE.Color>
}

const lineStrings=[
    new maptalks.LineString(coordinates),
    new maptalks.LineString(coordinates),
]
const mesh = threeLayer.toLines(lineStrings, { interactive: false, minZoom: 11 }, material);
```

### `toTerrain(extent: maptalks.Extent, options: TerrainOptionType, THREE.Material: THREE.Material)`

```ts

export type TerrainOptionType = BaseObjectOptionType & {
    image: ImageType,
    imageWidth?: number,
    imageHeight?: number,
    texture?: ImageType,
    flaserBoundary?: boolean,
    bufferPixel?: number
}

```

### `toHeatMap(data: Array<HeatMapDataType>, options: HeatMapOptionType, THREE.Material: THREE.Material)`

### `toFatLine(lineString: LineStringType, options: LineOptionType, THREE.Material: FatLineMaterialType)`

### `toFatLines(lineStrings: Array<LineStringType>, options, THREE.Material: FatLineMaterialType)`

### `toBox(coorindate: maptalks.Coordinate, options: BarOptionType, THREE.Material: THREE.Material)`

### `toBoxs(points: Array<BarOptionType>, options: BarOptionType, THREE.Material: THREE.Material)`

### `toPath(lineString: LineStringType, options: PathOptionType, THREE.Material: THREE.Material)`

### `toPaths(lineStrings: Array<LineStringType>, options: PathOptionType, THREE.Material: THREE.Material)`

### `getBaseObjects()`

### `getMeshes()`

### `clear()`

### `clearBaseObjects()`

### `clearMesh()`

### `getCamera()`

### `getScene()`

### `renderScene()`

### `getThreeRenderer()`

### `addMesh(meshes: Array<BaseObject | THREE.Object3D>, render: boolean = true)`

### `removeMesh(meshes: Array<BaseObject | THREE.Object3D>, render: boolean = true)`

### `identify(coordinate: maptalks.Coordinate | maptalks.Point, options: object)`
