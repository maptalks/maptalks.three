---
outline: deep
---

# BaseObject and SubClass Opitions Type


## BaseObject options type

```ts

export type BaseObjectOptionType = {
    pickWeight?: number,
    interactive?: boolean,
    altitude?: number,
    minZoom?: number,
    maxZoom?: number,
    asynchronous?: boolean,
    properties?: any,
    layer?: any,
    coordinate?: maptalks.Coordinate | Array<number>,
    lineString?: maptalks.LineString,
    polygon?: maptalks.Polygon,
    index?: number,
    id?: string,
    center?: maptalks.Coordinate | Array<number>,
    height?: number,
    heightEnable?: boolean,
    bloom?: boolean
};
```

## Bar options type

```ts
export type BarOptionType = BaseObjectOptionType & {
    radius?: number,
    height?: number,
    radialSegments?: number,
    topColor?: string,
    bottomColor?: string,
}
```

## Line options type

```ts
export type LineOptionType = BaseObjectOptionType & {
    bottomHeight?: number,
    colors?: Array<string | THREE.Color>
}
```

## ExtrudePolygon options type

```ts

export type ExtrudePolygonOptionType = BaseObjectOptionType & {
    height?: number,
    bottomHeight?: number,
    topColor?: string,
    bottomColor?: string,
    key?: string
}

```

## ExtrudeLine options type

```ts

export type ExtrudeLineOptionType = BaseObjectOptionType & {
    bottomHeight?: number,
    width?: number,
    height?: number,
    topColor?: string,
    bottomColor?: string,
    key?: string
}
```

## Path options type

```ts

export type PathOptionType = BaseObjectOptionType & {
    bottomHeight?: number,
    width?: number,
    cornerRadius?: number,
    topColor?: string,
    bottomColor?: string,
    key?: string
}
```

## ExtrudeLineTrail options type

```ts
export type ExtrudeLineTrailOptionType = BaseObjectOptionType & {
    trail?: number,
    chunkLength?: number,
    width?: number,
    height?: number,
    speed?: number
}
```

## Point options type

```ts

export type PointOptionType = BaseObjectOptionType & {
    height?: number,
    color?: string | THREE.Color
    size?: number,
    coords?: number[]
}

````

## HeatMap 

### HeatMap data type

```ts
export type HeatMapDataType = {
    coordinate: maptalks.Coordinate | number[],
    count: number,
    lnglat?: maptalks.Coordinate | number[],
    xy?: maptalks.Coordinate | number[],
}
```
### HeatMap options type

```ts
export type HeatMapOptionType = BaseObjectOptionType & {
    min?: number,
    max?: number,
    size?: number,
    gradient?: { [key: number]: any },
    gridScale?: number
}
```

## Terrain options type

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
