import * as maptalks from 'maptalks';
import * as THREE from 'three';

export type BaseLayerOptionType = {
    renderer?: string,
    doubleBuffer?: boolean,
    glOptions?: {
        preserveDrawingBuffer: boolean
    },
    geometryEvents?: boolean,
    identifyCountOnEvent?: number,
    forceRenderOnMoving?: boolean,
    forceRenderOnRotating?: boolean,
    forceRenderOnZooming?: boolean,
    centerForDistance?: maptalks.Coordinate,
    loopRenderCount?: number

};

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

export type BarOptionType = BaseObjectOptionType & {
    radius?: number,
    height?: number,
    radialSegments?: number,
    topColor?: string,
    bottomColor?: string,
}

export type LineOptionType = BaseObjectOptionType & {
    bottomHeight?: number,
    colors?: Array<string | THREE.Color>
}

export type ExtrudePolygonOptionType = BaseObjectOptionType & {
    height?: number,
    bottomHeight?: number,
    topColor?: string,
    bottomColor?: string,
    key?: string
}
export type ExtrudeLineOptionType = BaseObjectOptionType & {
    bottomHeight?: number,
    width?: number,
    height?: number,
    topColor?: string,
    bottomColor?: string,
    key?: string
}
export type PathOptionType = BaseObjectOptionType & {
    bottomHeight?: number,
    width?: number,
    cornerRadius?: number,
    topColor?: string,
    bottomColor?: string,
    key?: string
}

export type ExtrudeLineTrailOptionType = BaseObjectOptionType & {
    trail?: number,
    chunkLength?: number,
    width?: number,
    height?: number,
    speed?: number
}

export type PointOptionType = BaseObjectOptionType & {
    height?: number,
    color?: string | THREE.Color
    size?: number,
    coords?: number[]
}

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

export type ImageType = string | HTMLCanvasElement | HTMLImageElement;

export type TerrainOptionType = BaseObjectOptionType & {
    image: ImageType,
    imageWidth?: number,
    imageHeight?: number,
    texture?: ImageType,
    flaserBoundary?: boolean,
    bufferPixel?: number
}
