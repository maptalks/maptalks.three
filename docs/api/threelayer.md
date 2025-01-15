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

transform geographical coordinates to gl point.  <Badge type="tip" text="for custom" />

Usually used to construct vertices or positions in graphics

```js
//set object3d position
const z = layer.altitudeToVector3(altitude, altitude).x;
const position = layer.coordinateToVector3(coordinate, z);
this.getObject3d().position.copy(position);
```

### `distanceToVector3(w: number, h: number, coord?: maptalks.Coordinate | Array<number>)`

transform distance to gl point. Conversion of horizontal distance  <Badge type="tip" text="for custom" />

```js
const vector1 = threeLayer.distanceToVector3(100, 100);
```

### `altitudeToVector3(altitude: number, altitude1: number, coord?: maptalks.Coordinate | Array<number>, out?: THREE.Vector3)`

transform altitude to gl point. Conversion of Vertical Distance  <Badge type="tip" text="for custom" />

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
    material
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
    material
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

### `toModel(model: THREE.Object3D, options: BaseObjectOptionType)`

![](/model.png)

```js
    var loader = new THREE.GLTFLoader();
    loader.load('./data/RobotExpressive.glb', function(gltf) {

        const model = gltf.scene;
        model.rotation.x = Math.PI / 2;
        model.scale.set(100, 100, 100);

        baseObjectModel = threeLayer.toModel(model, {
            coordinate: map.getCenter()
        });
        // model.position.copy(threeLayer.coordinateToVector3(map.getCenter()));
        threeLayer.addMesh(baseObjectModel);

    }, undefined, function(e) {

        console.error(e);

    });
```

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

![](/extrudepolygons.png)

```ts
export type ExtrudePolygonOptionType = BaseObjectOptionType & {
    height?: number;
    bottomHeight?: number;
    topColor?: string;
    bottomColor?: string;
    key?: string;
};

const polygon1=new maptalks.Polygon(coordinates);
const polygon2=new maptalks.Polygon(coordinates);

polygon1.setProperties({
    height: 30
});
polygon2.setProperties({
    height: 100
});

const polygons =[polygon1,polygon2];

const mesh = threeLayer.toExtrudePolygons(
    polygons,
    { interactive: true, topColor: "#fff" },
    material
);
meshs.push(mesh);
```

::: tip
Please bring your own `height` value for each polygon data
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
        coordinate: [120,31],
        height: 1000,
        radius: 15000,
        radialSegments: 20,
    },
    {
        coordinate: [120,32],
        height: 1000,
        radius: 15000,
        radialSegments: 20,
    },
];

   const mesh = threeLayer.toBars(data, { interactive: true, asynchronous: true, topColor: "#fff" }, material);
   bars.push(mesh);

```

::: tip
Please bring your own coordinates, height, etc. for each data
:::

### `toExtrudeLines(lineStrings: Array<LineStringType>, options: ExtrudeLineOptionType, THREE.Material: THREE.Material)`

![](/extrudelines.png)

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
const mesh = threeLayer.toExtrudeLines(lineStrings, { interactive: true, minZoom: 11,width:5,height:1 }, material);

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
const mesh = threeLayer.toLines(lineStrings, { interactive: true, minZoom: 11 }, material);
```

### `toTerrain(extent: maptalks.Extent, options: TerrainOptionType, THREE.Material: THREE.Material)`

Create a simple terrain sand table effect

::: warning
Mainly used to create simple terrain sand tables, not suitable for loading large-scale terrain data
:::

![](/terrain-tile.png)

```ts

export type TerrainOptionType = BaseObjectOptionType & {
    image: ImageType,
    imageWidth?: number,
    imageHeight?: number,
    texture?: ImageType,
    flaserBoundary?: boolean,
    bufferPixel?: number
}

 const terrain = threeLayer.toTerrain(bbox, {
      flaserBoundary: false,
      bufferPixel: 0.2,
      image:'./data/tile-rgb.png',
      texture:'./data/tile-texture.png',
      imageWidth: TILESIZE,
      imageHeight: TILESIZE,
      altitude
  }, new THREE.MeshPhongMaterial({ color: terrainColor }));

```

the image data is mapbox terrain rgb tile data

![](/terrain-rgb.png)

[tilebelt util can get tile bbox](https://github.com/mapbox/tilebelt)

### `toHeatMap(data: Array<HeatMapDataType>, options: HeatMapOptionType, THREE.Material: THREE.Material)`

Create Simple 3D HeatMap

![](/heatmap.png)

```ts

export type HeatMapDataType = {
    coordinate: maptalks.Coordinate | number[],
    count: number,
    lnglat?: maptalks.Coordinate | number[],
    xy?: maptalks.Coordinate | number[],
}

export type HeatMapOptionType = BaseObjectOptionType & {
    min?: number,
    max?: number,
    size?: number,
    gradient?: { [key: number]: any },
    gridScale?: number
}

let data = response.slice(0, 1 * 100000).map(d => {
    return {
        coordinate: [Number(d.lng), Number(d.lat)],
        value: Math.random() * 10,
        count: 30 * Math.random(),
    };
});
heatmap = threeLayer.toHeatMap(data, {
    gridScale: 2,
    size: 2,
    gradient: {
        0.25: 'rgb(0,0,200)',
        0.55: 'rgb(0,255,0)',
        0.85: 'yellow',
        1.0: 'rgb(255,0,0)'
    },
}, material);
threeLayer.addMesh(heatmap);

```

### `toFatLine(lineString: LineStringType, options: LineOptionType, THREE.Material: FatLineMaterialType)`

![](/fatline.png)

```ts
export type LineOptionType = BaseObjectOptionType & {
    bottomHeight?: number,
    colors?: Array<string | THREE.Color>
}

  var material = new THREE.LineMaterial({
      color: 0x00ffff,
      transparent: true,
      // vertexColors: THREE.VertexColors,
      // side: THREE.BackSide,
      linewidth: 4 // in pixels
      // vertexColors: THREE.VertexColors,
      // dashed: false

  });

  var line = threeLayer.toFatLine(new maptalks.LineString(coordinates), {
      altitude: 0
  }, material);

```

[fatline details](https://threejs.org/examples/?q=fat#webgl_lines_fat)

### `toFatLines(lineStrings: Array<LineStringType>, options:LineOptionType, THREE.Material: FatLineMaterialType)`

![](/fatline.png)

```ts
export type LineOptionType = BaseObjectOptionType & {
    bottomHeight?: number,
    colors?: Array<string | THREE.Color>
}

  var material = new THREE.LineMaterial({
      color: 0x00ffff,
      transparent: true,
      // vertexColors: THREE.VertexColors,
      // side: THREE.BackSide,
      linewidth: 4 // in pixels
      // vertexColors: THREE.VertexColors,
      // dashed: false

  });

  var line = threeLayer.toFatLines([new maptalks.LineString(coordinates)], {
      altitude: 0
  }, material);

```

### `toBox(coorindate: maptalks.Coordinate, options: BarOptionType, THREE.Material: THREE.Material)`

![](/box.png)

```ts

export type BarOptionType = BaseObjectOptionType & {
    radius?: number,
    height?: number,
    radialSegments?: number,
    topColor?: string,
    bottomColor?: string,
}

  var bar = threeLayer.toBox(d.coordinate, {
      height: d.height * 200,
      radius: 15000,
      topColor: '#fff',
      // radialSegments: 4
  }, material);

```

### `toBoxs(points: Array<BarOptionType>, options: BarOptionType, THREE.Material: THREE.Material)`

![](/boxs.png)

```ts

export type BarOptionType = BaseObjectOptionType & {
    radius?: number,
    height?: number,
    radialSegments?: number,
    topColor?: string,
    bottomColor?: string,
}
 const data = json.features.slice(0, Infinity).map(function(dataItem) {
     return {
         coordinate: dataItem.geometry.coordinates,
         height: Math.random() * 200,
         value: Math.random() * 10000,
         topColor: '#fff'
     }
 });
 const box = threeLayer.toBoxs(data, {}, material);

```

### `toPath(lineString: LineStringType, options: PathOptionType, THREE.Material: THREE.Material)`

![](/path.png)

```ts

export type PathOptionType = BaseObjectOptionType & {
    bottomHeight?: number,
    width?: number,
    cornerRadius?: number,
    topColor?: string,
    bottomColor?: string,
    key?: string
}

var line = threeLayer.toPath(lineString, { altitude: Math.random() * 0.2, cornerRadius: 1, width: 8, asynchronous: true }, material);

```

### `toPaths(lineStrings: Array<LineStringType>, options: PathOptionType, THREE.Material: THREE.Material)`

![](/paths.png)

```ts

export type PathOptionType = BaseObjectOptionType & {
    bottomHeight?: number,
    width?: number,
    cornerRadius?: number,
    topColor?: string,
    bottomColor?: string,
    key?: string
}

var line = threeLayer.toPaths([lineString], { altitude: Math.random() * 0.2, cornerRadius: 1, width: 8, asynchronous: true }, material);

```

### `getBaseObjects()`

### `getMeshes()`

get all meshes.

::: warning
Native objects containing three, lights, etc
:::

### `clear()`

::: danger
Please use caution when clearing all graphic objects, including lights, etc
:::

### `clearBaseObjects()`

### `clearMesh()`

### `getCamera()`

### `getScene()`

### `renderScene()`

### `getThreeRenderer()`

### `addMesh(meshes: Array<BaseObject | THREE.Object3D>, render: boolean = true)`

```js
const bar = threeLayer.toBar(coordinate, {}, material);
threeLayer.addMesh(bar);
```

### `removeMesh(meshes: Array<BaseObject | THREE.Object3D>, render: boolean = true)`

### `identify(coordinate: maptalks.Coordinate | maptalks.Point, options: object)`

```js
map.on('click', e => {
    const baseObjects = threeLayer.identify(e.coordinate);
})
```

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
