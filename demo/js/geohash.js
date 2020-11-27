/* eslint-disable camelcase */
/**
 * Copyright (c) 2011, Sun Ning.
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS
 * BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
 * ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 *
 */
// https://github.com/sunng87/node-geohash
// eslint-disable-next-line quotes
var BASE32_CODES = "0123456789bcdefghjkmnpqrstuvwxyz";
var BASE32_CODES_DICT = {};
for (var i = 0; i < BASE32_CODES.length; i++) {
    BASE32_CODES_DICT[BASE32_CODES.charAt(i)] = i;
}

var ENCODE_AUTO = 'auto';

var MIN_LAT = -90;
var MAX_LAT = 90;
var MIN_LON = -180;
var MAX_LON = 180;
/**
 * Significant Figure Hash Length
 *
 * This is a quick and dirty lookup to figure out how long our hash
 * should be in order to guarantee a certain amount of trailing
 * significant figures. This was calculated by determining the error:
 * 45/2^(n-1) where n is the number of bits for a latitude or
 * longitude. Key is # of desired sig figs, value is minimum length of
 * the geohash.
 * @type Array
 */
//     Desired sig figs:  0  1  2  3  4   5   6   7   8   9  10
var SIGFIG_HASH_LENGTH = [0, 5, 7, 8, 11, 12, 13, 15, 16, 17, 18];
/**
 * Encode
 *
 * Create a Geohash out of a latitude and longitude that is
 * `numberOfChars` long.
 *
 * @param {Number|String} latitude
 * @param {Number|String} longitude
 * @param {Number} numberOfChars
 * @returns {String}
 */
var encode = function (latitude, longitude, numberOfChars) {
    if (numberOfChars === ENCODE_AUTO) {
        if (typeof (latitude) === 'number' || typeof (longitude) === 'number') {
            throw new Error('string notation required for auto precision.');
        }
        var decSigFigsLat = latitude.split('.')[1].length;
        var decSigFigsLong = longitude.split('.')[1].length;
        var numberOfSigFigs = Math.max(decSigFigsLat, decSigFigsLong);
        numberOfChars = SIGFIG_HASH_LENGTH[numberOfSigFigs];
    } else if (numberOfChars === undefined) {
        numberOfChars = 9;
    }

    var chars = [],
        bits = 0,
        bitsTotal = 0,
        hash_value = 0,
        maxLat = MAX_LAT,
        minLat = MIN_LAT,
        maxLon = MAX_LON,
        minLon = MIN_LON,
        mid;
    while (chars.length < numberOfChars) {
        if (bitsTotal % 2 === 0) {
            mid = (maxLon + minLon) / 2;
            if (longitude > mid) {
                hash_value = (hash_value << 1) + 1;
                minLon = mid;
            } else {
                hash_value = (hash_value << 1) + 0;
                maxLon = mid;
            }
        } else {
            mid = (maxLat + minLat) / 2;
            if (latitude > mid) {
                hash_value = (hash_value << 1) + 1;
                minLat = mid;
            } else {
                hash_value = (hash_value << 1) + 0;
                maxLat = mid;
            }
        }

        bits++;
        bitsTotal++;
        if (bits === 5) {
            var code = BASE32_CODES[hash_value];
            chars.push(code);
            bits = 0;
            hash_value = 0;
        }
    }
    return chars.join('');
};

/**
 * Encode Integer
 *
 * Create a Geohash out of a latitude and longitude that is of 'bitDepth'.
 *
 * @param {Number} latitude
 * @param {Number} longitude
 * @param {Number} bitDepth
 * @returns {Number}
 */
var encode_int = function (latitude, longitude, bitDepth) {

    bitDepth = bitDepth || 52;

    var bitsTotal = 0,
        maxLat = MAX_LAT,
        minLat = MIN_LAT,
        maxLon = MAX_LON,
        minLon = MIN_LON,
        mid,
        combinedBits = 0;

    while (bitsTotal < bitDepth) {
        combinedBits *= 2;
        if (bitsTotal % 2 === 0) {
            mid = (maxLon + minLon) / 2;
            if (longitude > mid) {
                combinedBits += 1;
                minLon = mid;
            } else {
                maxLon = mid;
            }
        } else {
            mid = (maxLat + minLat) / 2;
            if (latitude > mid) {
                combinedBits += 1;
                minLat = mid;
            } else {
                maxLat = mid;
            }
        }
        bitsTotal++;
    }
    return combinedBits;
};

/**
 * Decode Bounding Box
 *
 * Decode hashString into a bound box matches it. Data returned in a four-element array: [minlat, minlon, maxlat, maxlon]
 * @param {String} hash_string
 * @returns {Array}
 */
var decode_bbox = function (hash_string) {
    var isLon = true,
        maxLat = MAX_LAT,
        minLat = MIN_LAT,
        maxLon = MAX_LON,
        minLon = MIN_LON,
        mid;

    var hashValue = 0;
    for (var i = 0, l = hash_string.length; i < l; i++) {
        var code = hash_string[i].toLowerCase();
        hashValue = BASE32_CODES_DICT[code];

        for (var bits = 4; bits >= 0; bits--) {
            var bit = (hashValue >> bits) & 1;
            if (isLon) {
                mid = (maxLon + minLon) / 2;
                if (bit === 1) {
                    minLon = mid;
                } else {
                    maxLon = mid;
                }
            } else {
                mid = (maxLat + minLat) / 2;
                if (bit === 1) {
                    minLat = mid;
                } else {
                    maxLat = mid;
                }
            }
            isLon = !isLon;
        }
    }
    return [minLat, minLon, maxLat, maxLon];
};

/**
 * Decode Bounding Box Integer
 *
 * Decode hash number into a bound box matches it. Data returned in a four-element array: [minlat, minlon, maxlat, maxlon]
 * @param {Number} hashInt
 * @param {Number} bitDepth
 * @returns {Array}
 */
var decode_bbox_int = function (hashInt, bitDepth) {

    bitDepth = bitDepth || 52;

    var maxLat = MAX_LAT,
        minLat = MIN_LAT,
        maxLon = MAX_LON,
        minLon = MIN_LON;

    var latBit = 0, lonBit = 0;
    var step = bitDepth / 2;

    for (var i = 0; i < step; i++) {

        lonBit = get_bit(hashInt, ((step - i) * 2) - 1);
        latBit = get_bit(hashInt, ((step - i) * 2) - 2);

        if (latBit === 0) {
            maxLat = (maxLat + minLat) / 2;
        // eslint-disable-next-line brace-style
        }
        else {
            minLat = (maxLat + minLat) / 2;
        }

        if (lonBit === 0) {
            maxLon = (maxLon + minLon) / 2;
        // eslint-disable-next-line brace-style
        }
        else {
            minLon = (maxLon + minLon) / 2;
        }
    }
    return [minLat, minLon, maxLat, maxLon];
};

function get_bit(bits, position) {
    return (bits / Math.pow(2, position)) & 0x01;
}

/**
 * Decode
 *
 * Decode a hash string into pair of latitude and longitude. A javascript object is returned with keys `latitude`,
 * `longitude` and `error`.
 * @param {String} hashString
 * @returns {Object}
 */
var decode = function (hashString) {
    var bbox = decode_bbox(hashString);
    var lat = (bbox[0] + bbox[2]) / 2;
    var lon = (bbox[1] + bbox[3]) / 2;
    var latErr = bbox[2] - lat;
    var lonErr = bbox[3] - lon;
    return {
        latitude: lat, longitude: lon,
        error: { latitude: latErr, longitude: lonErr }
    };
};

/**
 * Decode Integer
 *
 * Decode a hash number into pair of latitude and longitude. A javascript object is returned with keys `latitude`,
 * `longitude` and `error`.
 * @param {Number} hash_int
 * @param {Number} bitDepth
 * @returns {Object}
 */
var decode_int = function (hash_int, bitDepth) {
    var bbox = decode_bbox_int(hash_int, bitDepth);
    var lat = (bbox[0] + bbox[2]) / 2;
    var lon = (bbox[1] + bbox[3]) / 2;
    var latErr = bbox[2] - lat;
    var lonErr = bbox[3] - lon;
    return {
        latitude: lat, longitude: lon,
        error: { latitude: latErr, longitude: lonErr }
    };
};

/**
 * Neighbor
 *
 * Find neighbor of a geohash string in certain direction. Direction is a two-element array, i.e. [1,0] means north, [-1,-1] means southwest.
 * direction [lat, lon], i.e.
 * [1,0] - north
 * [1,1] - northeast
 * ...
 * @param {String} hashString
 * @param {Array} Direction as a 2D normalized vector.
 * @returns {String}
 */
var neighbor = function (hashString, direction) {
    var lonLat = decode(hashString);
    var neighborLat = lonLat.latitude
        // eslint-disable-next-line operator-linebreak
        + direction[0] * lonLat.error.latitude * 2;
    var neighborLon = lonLat.longitude
        // eslint-disable-next-line operator-linebreak
        + direction[1] * lonLat.error.longitude * 2;
    neighborLon = ensure_valid_lon(neighborLon);
    neighborLat = ensure_valid_lat(neighborLat);
    return encode(neighborLat, neighborLon, hashString.length);
};

/**
 * Neighbor Integer
 *
 * Find neighbor of a geohash integer in certain direction. Direction is a two-element array, i.e. [1,0] means north, [-1,-1] means southwest.
 * direction [lat, lon], i.e.
 * [1,0] - north
 * [1,1] - northeast
 * ...
 * @param {String} hash_string
 * @returns {Array}
*/
var neighbor_int = function (hash_int, direction, bitDepth) {
    bitDepth = bitDepth || 52;
    var lonlat = decode_int(hash_int, bitDepth);
    var neighbor_lat = lonlat.latitude + direction[0] * lonlat.error.latitude * 2;
    var neighbor_lon = lonlat.longitude + direction[1] * lonlat.error.longitude * 2;
    neighbor_lon = ensure_valid_lon(neighbor_lon);
    neighbor_lat = ensure_valid_lat(neighbor_lat);
    return encode_int(neighbor_lat, neighbor_lon, bitDepth);
};

/**
 * Neighbors
 *
 * Returns all neighbors' hashstrings clockwise from north around to northwest
 * 7 0 1
 * 6 x 2
 * 5 4 3
 * @param {String} hash_string
 * @returns {encoded neighborHashList|Array}
 */
var neighbors = function (hash_string) {

    var hashstringLength = hash_string.length;

    var lonlat = decode(hash_string);
    var lat = lonlat.latitude;
    var lon = lonlat.longitude;
    var latErr = lonlat.error.latitude * 2;
    var lonErr = lonlat.error.longitude * 2;

    var neighbor_lat,
        neighbor_lon;

    var neighborHashList = [
        encodeNeighbor(1, 0),
        encodeNeighbor(1, 1),
        encodeNeighbor(0, 1),
        encodeNeighbor(-1, 1),
        encodeNeighbor(-1, 0),
        encodeNeighbor(-1, -1),
        encodeNeighbor(0, -1),
        encodeNeighbor(1, -1)
    ];

    function encodeNeighbor(neighborLatDir, neighborLonDir) {
        neighbor_lat = lat + neighborLatDir * latErr;
        neighbor_lon = lon + neighborLonDir * lonErr;
        neighbor_lon = ensure_valid_lon(neighbor_lon);
        neighbor_lat = ensure_valid_lat(neighbor_lat);
        return encode(neighbor_lat, neighbor_lon, hashstringLength);
    }

    return neighborHashList;
};

/**
 * Neighbors Integer
 *
 * Returns all neighbors' hash integers clockwise from north around to northwest
 * 7 0 1
 * 6 x 2
 * 5 4 3
 * @param {Number} hash_int
 * @param {Number} bitDepth
 * @returns {encode_int'd neighborHashIntList|Array}
 */
var neighbors_int = function (hash_int, bitDepth) {

    bitDepth = bitDepth || 52;

    var lonlat = decode_int(hash_int, bitDepth);
    var lat = lonlat.latitude;
    var lon = lonlat.longitude;
    var latErr = lonlat.error.latitude * 2;
    var lonErr = lonlat.error.longitude * 2;

    var neighbor_lat,
        neighbor_lon;

    var neighborHashIntList = [
        encodeNeighbor_int(1, 0),
        encodeNeighbor_int(1, 1),
        encodeNeighbor_int(0, 1),
        encodeNeighbor_int(-1, 1),
        encodeNeighbor_int(-1, 0),
        encodeNeighbor_int(-1, -1),
        encodeNeighbor_int(0, -1),
        encodeNeighbor_int(1, -1)
    ];

    function encodeNeighbor_int(neighborLatDir, neighborLonDir) {
        neighbor_lat = lat + neighborLatDir * latErr;
        neighbor_lon = lon + neighborLonDir * lonErr;
        neighbor_lon = ensure_valid_lon(neighbor_lon);
        neighbor_lat = ensure_valid_lat(neighbor_lat);
        return encode_int(neighbor_lat, neighbor_lon, bitDepth);
    }

    return neighborHashIntList;
};


/**
 * Bounding Boxes
 *
 * Return all the hashString between minLat, minLon, maxLat, maxLon in numberOfChars
 * @param {Number} minLat
 * @param {Number} minLon
 * @param {Number} maxLat
 * @param {Number} maxLon
 * @param {Number} numberOfChars
 * @returns {bboxes.hashList|Array}
 */
var bboxes = function (minLat, minLon, maxLat, maxLon, numberOfChars) {
    if (numberOfChars <= 0) {
        throw new Error('numberOfChars must be strictly positive');
    }
    numberOfChars = numberOfChars || 9;

    var hashSouthWest = encode(minLat, minLon, numberOfChars);
    var hashNorthEast = encode(maxLat, maxLon, numberOfChars);

    var latLon = decode(hashSouthWest);

    var perLat = latLon.error.latitude * 2;
    var perLon = latLon.error.longitude * 2;

    var boxSouthWest = decode_bbox(hashSouthWest);
    var boxNorthEast = decode_bbox(hashNorthEast);

    var latStep = Math.round((boxNorthEast[0] - boxSouthWest[0]) / perLat);
    var lonStep = Math.round((boxNorthEast[1] - boxSouthWest[1]) / perLon);

    var hashList = [];

    for (var lat = 0; lat <= latStep; lat++) {
        for (var lon = 0; lon <= lonStep; lon++) {
            hashList.push(neighbor(hashSouthWest, [lat, lon]));
        }
    }

    return hashList;
};

/**
 * Bounding Boxes Integer
 *
 * Return all the hash integers between minLat, minLon, maxLat, maxLon in bitDepth
 * @param {Number} minLat
 * @param {Number} minLon
 * @param {Number} maxLat
 * @param {Number} maxLon
 * @param {Number} bitDepth
 * @returns {bboxes_int.hashList|Array}
 */
var bboxes_int = function (minLat, minLon, maxLat, maxLon, bitDepth) {
    bitDepth = bitDepth || 52;

    var hashSouthWest = encode_int(minLat, minLon, bitDepth);
    var hashNorthEast = encode_int(maxLat, maxLon, bitDepth);

    var latlon = decode_int(hashSouthWest, bitDepth);

    var perLat = latlon.error.latitude * 2;
    var perLon = latlon.error.longitude * 2;

    var boxSouthWest = decode_bbox_int(hashSouthWest, bitDepth);
    var boxNorthEast = decode_bbox_int(hashNorthEast, bitDepth);

    var latStep = Math.round((boxNorthEast[0] - boxSouthWest[0]) / perLat);
    var lonStep = Math.round((boxNorthEast[1] - boxSouthWest[1]) / perLon);

    var hashList = [];

    for (var lat = 0; lat <= latStep; lat++) {
        for (var lon = 0; lon <= lonStep; lon++) {
            hashList.push(neighbor_int(hashSouthWest, [lat, lon], bitDepth));
        }
    }

    return hashList;
};

function ensure_valid_lon(lon) {
    if (lon > MAX_LON)
        return MIN_LON + lon % MAX_LON;
    if (lon < MIN_LON)
        return MAX_LON + lon % MAX_LON;
    return lon;
}

function ensure_valid_lat(lat) {
    if (lat > MAX_LAT)
        return MAX_LAT;
    if (lat < MIN_LAT)
        return MIN_LAT;
    return lat;
}

// eslint-disable-next-line no-unused-vars
var geohash = {
    'ENCODE_AUTO': ENCODE_AUTO,
    'encode': encode,
    'encode_uint64': encode_int, // keeping for backwards compatibility, will deprecate
    'encode_int': encode_int,
    'decode': decode,
    'decode_int': decode_int,
    'decode_uint64': decode_int, // keeping for backwards compatibility, will deprecate
    'decode_bbox': decode_bbox,
    'decode_bbox_uint64': decode_bbox_int, // keeping for backwards compatibility, will deprecate
    'decode_bbox_int': decode_bbox_int,
    'neighbor': neighbor,
    'neighbor_int': neighbor_int,
    'neighbors': neighbors,
    'neighbors_int': neighbors_int,
    'bboxes': bboxes,
    'bboxes_int': bboxes_int
};
