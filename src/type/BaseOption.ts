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
    centerForDistance?: maptalks.Coordinate

};

export type BaseObjectOptionType = {
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
    index?: number
};

export type BarOptionType = BaseObjectOptionType & {
    radius?: number,
    height?: number,
    radialSegments?: number,
    topColor?: string,
    bottomColor?: string,
}

export type LineOptionType = BaseObjectOptionType & {
    colors?: Array<string | THREE.Color>
}

export type ExtrudePolygonOptionType = BaseObjectOptionType & {
    height?: number,
    topColor?: string,
    bottomColor?: string,
    key?: string
}
export type ExtrudeLineOptionType = BaseObjectOptionType & {
    width?: number,
    height?: number,
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
    texture?: ImageType
}
