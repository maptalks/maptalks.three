import * as maptalks from 'maptalks';
import { GeoJSONLineStringFeature, GeoJSONPolygonFeature, GeoJSONMultiStringLineFeature, GeoJSONMultiPolygonFeature } from './GeoJSON';


export type SingleLineStringType = maptalks.LineString | GeoJSONLineStringFeature;
export type SinglePolygonType = maptalks.Polygon | GeoJSONPolygonFeature;
export type LineStringType = SingleLineStringType | maptalks.MultiLineString | GeoJSONMultiStringLineFeature;
export type PolygonType = SinglePolygonType | maptalks.MultiPolygon | GeoJSONMultiPolygonFeature;

export * from './BaseAttribute';
export * from './BaseOption';
export * from './GeoJSON';
export * from './Queue';