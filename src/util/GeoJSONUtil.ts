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


export function getGeoJSONCenter(feature: GeoJSONFeature, out?: maptalks.Coordinate): maptalks.Coordinate {
    const type = getGeoJSONType(feature);
    if (!type || !feature.geometry) {
        return null;
    }
    const geometry = feature.geometry;
    const coordinates = geometry.coordinates;
    if (!coordinates) {
        return null;
    }
    // const coords: Array<Array<number>> = [];
    let sumX = 0, sumY = 0, coordLen = 0;
    switch (type) {
        case 'Point': {
            sumX = (coordinates as Array<number>)[0];
            sumY = (coordinates as Array<number>)[1];
            // coords.push(coordinates as Array<number>);
            coordLen++;
            break;
        }
        case 'MultiPoint':
        case 'LineString': {
            for (let i = 0, len = coordinates.length; i < len; i++) {
                sumX += (coordinates[i] as Array<number>)[0];
                sumY += (coordinates[i] as Array<number>)[1];
                coordLen++;
                // coords.push(coordinates[i] as Array<number>);
            }
            break;
        }
        case 'MultiLineString':
        case 'Polygon': {
            for (let i = 0, len = coordinates.length; i < len; i++) {
                for (let j = 0, len1 = (coordinates[i] as Array<Array<number>>).length; j < len1; j++) {
                    // coords.push((coordinates[i] as Array<Array<number>>)[j]);
                    sumX += (coordinates[i] as Array<Array<number>>)[j][0];
                    sumY += (coordinates[i] as Array<Array<number>>)[j][1];
                    coordLen++;
                }
            }
            break;
        }
        case 'MultiPolygon': {
            for (let i = 0, len = coordinates.length; i < len; i++) {
                for (let j = 0, len1 = (coordinates[i] as Array<Array<Array<number>>>).length; j < len1; j++) {
                    for (let m = 0, len2 = (coordinates[i] as Array<Array<Array<number>>>)[j].length; m < len2; m++) {
                        // coords.push(((coordinates[i] as Array<Array<Array<number>>>)[j])[m]);
                        sumX += (coordinates[i] as Array<Array<Array<number>>>)[j][m][0];
                        sumY += (coordinates[i] as Array<Array<Array<number>>>)[j][m][1];
                        coordLen++;
                    }
                }
            }
            break;
        }
    }
    const x = sumX / coordLen, y = sumY / coordLen;
    if (out) {
        out.x = x;
        out.y = y;
        return out;
    }
    return new maptalks.Coordinate(x, y);
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
