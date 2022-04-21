/**
 * this is a template declare file for maptalks
 * To solve the problem maptalks.three Statement about maptalks in
 */
declare const Browser: {
  retina: number
}

declare namespace Ajax {
  function get(url: string, options: any, callback: Function): any
  function getArrayBuffer(url: string, options: any, callback: Function): any
  function getImage(image: any, url: string, options: any): any
  function getJSON(url: string, options: any, callback: Function): any
  function jsonp(url: string, callback: Function): any
  function post(url: string, options: any, callback: Function): any
}


declare function Eventable(base: any): any;

declare function registerWorkerAdapter(workerName: string, code: string | Function);

declare namespace Util {
  function GUID(): string
  function isNumber(obj: any): boolean
  function isFunction(obj: any): boolean
  function extend(...obj: any[]): any
  function sign(params: number): number
  function now(): number
  function requestAnimFrame(params: Function)
}

declare const animation: {
  Animation: {
    animate(style: any, options: any, callback: Function): any
  }
}
declare namespace worker {
  export class Actor {
    constructor(parameters)
    send(message: any, error: any, callback: Function)
  }
}

declare class Coordinate {
  x: number;
  y: number;
  constructor(parameters: any)
  constructor(x: number, y: number)
  equals(coordinate: Coordinate): boolean
  toArray(): Array<number>
}
declare class Extent {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  constructor(parameters: any)
  constructor(min: Coordinate, max: Coordinate)
  getCenter(): Coordinate
  getMin(): Coordinate
  getMax(): Coordinate
}
declare class Point {
  x: number;
  y: number;
  constructor(x: any, y?: any)
}

declare class PointExtent {
  constructor(parameters: any)
}
declare class Size {
  width: number;
  height: number;
  constructor(width: number, height: number)
}

declare namespace renderer {
  export class CanvasLayerRenderer {
    _drawContext: boolean;
    _drawLayer(params: any): void
    createCanvas(): void
    onCanvasCreate(): void
    getMap(): Map
    completeRender(): void
    remove(): void
    setToRedraw(): void

  }
}

declare class TileLayer {
  _renderer: any;
  options: any;
  constructor(url: string, options: any)
  getTiles(): any
  getTileUrl(x: number, y: number, z: number): string
  isVisible(): boolean
  getMap(): Map
  _getTileConfig(): any
  on(eventType: string, handle: Function, context?: any): void
  off(eventType: string, handle: Function, context?: any): void
  fire(eventType: string, params?: any): boolean
}
declare class CanvasLayer {
  _canvas: any
  constructor(id: string, options: Object)
  fire(eventType: string, params: any): boolean
  getMap(): Map
  redraw(): void
  static mergeOptions(options: Object): void
  onAdd(): void
  onRemove(): void
  _getRenderer(): any
  getRenderer(): any
  static registerRenderer(type: string, render: any): void
  onCanvasCreate(...params: any[]): void

}

declare class LineString {
  constructor(coordinates: Array<Coordinate>, options?: Object)
  getCenter(): Coordinate
  getCoordinates(): Array<Coordinate>
}
declare class Polygon {
  constructor(coordinates: Array<Array<Coordinate>>, options: Object)
  getCenter(): Coordinate
  getShell(): Array<Coordinate>
  getHoles(): Array<Array<Coordinate>>
  getCoordinates(): Array<Array<Coordinate>>
  setCoordinates(coordinates: Array<Array<Coordinate>>): void
}
declare class MultiPolygon {
  constructor(coordinates: Array<Array<Array<Coordinate>>>, options: Object)
  getCenter(): Coordinate
  getGeometries(): Array<Polygon>
}
declare class MultiLineString {
  constructor(coordinates: Array<Array<Coordinate>>, options: Object)
  getCenter(): Coordinate
  getGeometries(): Array<LineString>
}


declare class Map {
  options: any;
  cameraWorldMatrix: any;
  projMatrix: any;
  width: number;
  height: number;
  cameraNear: number;
  cameraFar: number;
  constructor(container: string, options: Object)
  getCenter(): Coordinate
  coordinateToPoint(coordinate: Coordinate, zoom: number): any
  coordToPointAtRes(coordinate: Coordinate, zoom: number): any
  getZoom(): number
  getFov(): number
  locate(center: Coordinate, w: number, h: number): Coordinate
  coordToContainerPoint(coordinate: Coordinate): Point
  getSize(): Size
  getResolution(): number
  resetCursor(type: string): void
  setCursor(type: string): void
  on(eventType: string, handle: Function, context?: any): void
  off(eventType: string, handle: Function, context?: any): void
  getDevicePixelRatio(): number
  getGLZoom(): number
  getGLRes(): number
  _getResolution(zoom: number): number
  getProjection(): any
  isInteracting(): boolean
  isAnimating(): boolean
  getSpatialReference(): any
  altitudeToPoint(altitude: number, res?: number): Point
}


declare namespace ui {
  export class InfoWindow {
    _owner: any
    constructor(parameters: any)
    addTo(target: any): void
    show(coordinate: Coordinate): void
    hide(): void
    remove(): void
  }
  export class ToolTip {
    _owner: any
    constructor(content: string, options: any)
    onMouseMove(e: any): void
    onMouseOut(e: any): void
    _switchEvents(eventType: string): void
    onAdd(): void
    fire(eventType: string): void
    show(coordinate: Coordinate): void
    hide(): void
    remove(): void
    addTo(target: any): void

  }
}



export {
  Browser,
  Ajax,
  // ArcConnectorLine,
  registerWorkerAdapter,
  Eventable,
  Util,
  worker,
  ui,
  animation,
  Coordinate,
  Extent,
  Point,
  PointExtent,
  Size,
  Map,
  TileLayer,
  CanvasLayer,
  LineString,
  MultiLineString,
  Polygon,
  MultiPolygon,
  renderer
};
