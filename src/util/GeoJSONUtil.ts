/* eslint-disable indent */
import * as maptalks from 'maptalks';
import { GeoJSONFeature } from './../type/index';


const TYPES: Array<string> = ['Point', 'MultiPoint', 'LineString', 'MultiLineString', 'Polygon', 'MultiPolygon'];

function getGeoJSONType(feature: GeoJSONFeature): string {
    return feature.geometry ? feature.geometry.type : null;
}


export function isGeoJSON(feature: GeoJSONFeature): boolean {
    const type = getGeoJSONType(feature);
    if (type) {
        for (let i = 0, len = TYPES.length; i < len; i++) {
            if (TYPES[i] === type) {
                return true;
            }
        }
    }
    return false;
}


export function isGeoJSONPolygon(feature: GeoJSONFeature): boolean {
    const type = getGeoJSONType(feature);
    if (type && (type === TYPES[4] || type === TYPES[5])) {
        return true;
    }
    return false;
}

export function isGeoJSONLine(feature: GeoJSONFeature): boolean {
    const type = getGeoJSONType(feature);
    if (type && (type === TYPES[2] || type === TYPES[3])) {
        return true;
    }
    return false;
}

export function isGeoJSONPoint(feature: GeoJSONFeature): boolean {
    const type = getGeoJSONType(feature);
    if (type && (type === TYPES[0] || type === TYPES[1])) {
        return true;
    }
    return false;
}

export function isGeoJSONMulti(feature: GeoJSONFeature): boolean {
    const type = getGeoJSONType(feature);
    if (type) {
        if (type.indexOf('Multi') > -1) {
            return true;
        }
    }
    return false;
}

export function getGeoJSONCoordinates(feature: GeoJSONFeature):
    Array<number> | Array<Array<number>> | Array<Array<Array<number>>> | Array<Array<Array<Array<number>>>> {
    return feature.geometry ? feature.geometry.coordinates : [];
}


export function getGeoJSONCenter(feature: GeoJSONFeature): maptalks.Coordinate {
    const type = getGeoJSONType(feature);
    if (!type || !feature.geometry) {
        return null;
    }
    const geometry = feature.geometry;
    const coordinates = geometry.coordinates;
    if (!coordinates) {
        return null;
    }
    const coords: Array<Array<number>> = [];
    switch (type) {
        case 'Point': {
            coords.push(coordinates as Array<number>);
            break;
        }
        case 'MultiPoint':
        case 'LineString': {
            for (let i = 0, len = coordinates.length; i < len; i++) {
                coords.push(coordinates[i] as Array<number>);
            }
            break;
        }
        case 'MultiLineString':
        case 'Polygon': {
            for (let i = 0, len = coordinates.length; i < len; i++) {
                for (let j = 0, len1 = (coordinates[i] as Array<Array<number>>).length; j < len1; j++) {
                    coords.push((coordinates[i] as Array<Array<number>>)[j]);
                }
            }
            break;
        }
        case 'MultiPolygon': {
            for (let i = 0, len = coordinates.length; i < len; i++) {
                for (let j = 0, len1 = (coordinates[i] as Array<Array<Array<number>>>).length; j < len1; j++) {
                    for (let m = 0, len2 = (coordinates[i] as Array<Array<Array<number>>>)[j].length; m < len2; m++) {
                        coords.push(((coordinates[i] as Array<Array<Array<number>>>)[j])[m]);
                    }
                }
            }
            break;
        }
    }
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (let i = 0, len = coords.length; i < len; i++) {
        const c = coords[i];
        const x = c[0], y = c[1];

        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    }
    return new maptalks.Coordinate((minX + maxX) / 2, (minY + maxY) / 2);
}



export function spliteGeoJSONMulti(feature: GeoJSONFeature): GeoJSONFeature[] {
    const type = getGeoJSONType(feature);
    if (!type || !feature.geometry) {
        return null;
    }
    const geometry = feature.geometry;
    const properties = feature.properties || {};
    const coordinates = geometry.coordinates;
    if (!coordinates) {
        return null;
    }
    const features: GeoJSONFeature[] = [];
    let fType;
    switch (type) {
        case 'MultiPoint': {
            fType = 'Point';
            break;
        }
        case 'MultiLineString': {
            fType = 'LineString';
            break;
        }
        case 'MultiPolygon': {
            fType = 'Polygon';
            break;
        }
    }
    if (fType) {
        for (let i = 0, len = coordinates.length; i < len; i++) {
            features.push({
                type: 'Feature',
                geometry: {
                    type: fType as any,
                    coordinates: coordinates[i] as any
                },
                properties
            });
        }
    } else {
        features.push(feature);
    }
    return features;
}
