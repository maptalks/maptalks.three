
export type GeoJSONPoint = {
    type: 'Point',
    coordinates: Array<number>
};
export type GeoJSONMultiPoint = {
    type: 'MultiPoint',
    coordinates: Array<Array<number>>
};
export type GeoJSONLineString = {
    type: 'LineString',
    coordinates: Array<Array<number>>
};
export type GeoJSONMultiLineString = {
    type: 'MultiLineString',
    coordinates: Array<Array<Array<number>>>
};
export type GeoJSONPolygon = {
    type: 'Polygon',
    coordinates: Array<Array<Array<number>>>
};
export type GeoJSONMultiPolygon = {
    type: 'MultiPolygon',
    coordinates: Array<Array<Array<Array<number>>>>
};
// feature
export type GeoJSONLineStringFeature = {
    type: 'Feature',
    geometry: GeoJSONLineString,
    properties: any
}
export type GeoJSONMultiStringLineFeature = {
    type: 'Feature',
    geometry: GeoJSONMultiLineString,
    properties: any
}
export type GeoJSONPolygonFeature = {
    type: 'Feature',
    geometry: GeoJSONPolygon
    properties: any
}
export type GeoJSONMultiPolygonFeature = {
    type: 'Feature',
    geometry: GeoJSONMultiPolygon
    properties: any
}

export type GeoJSONFeature = {
    type: 'Feature',
    geometry: GeoJSONPoint | GeoJSONMultiPoint | GeoJSONLineString | GeoJSONMultiLineString | GeoJSONPolygon | GeoJSONMultiPolygon,
    properties: any
};
export type GeoJSONCollection = {
    type: "FeatureCollection";
    features: GeoJSONFeature[]
}