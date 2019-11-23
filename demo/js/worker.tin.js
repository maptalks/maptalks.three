importScripts('turf.tin.js');


onmessage = function (e) {
    var points = e.data.points;
    var id = e.data.id;
    var indexMap = e.data.indexMap;
    var zs = e.data.zs;
    var minZ = e.data.minZ;
    var results = {
        id: id,
        result: {
            type: 'FeatureCollection',
            features: []
        },
        faces: []
    };
    if (points && Array.isArray(points)) {
        results.result = tin(e.data.points);
    }
    var features = results.result.features;
    var faces = [];
    if (features.length > 0) {
        for (var i = 0, len = features.length; i < len; i++) {
            var geometry = features[i].geometry;
            var lnglats = geometry.coordinates[0];
            for (var j = 0, len1 = lnglats.length; j < len1 - 1; j++) {
                var index = indexMap[lnglats[j].toString()];
                faces.push(index);
            }
        }
    }
    var fs = [];
    for (var i = 0, len2 = faces.length; i < len2; i += 3) {
        var index1 = faces[i],
            index2 = faces[i + 1],
            index3 = faces[i + 2];
        if ((!(zs[index1] > minZ) && (!(zs[index2] > minZ)) && (!(zs[index3] > minZ)))) {
            continue;
        }
        fs.push(index1, index2, index3);
    }
    results.faces = fs;
    delete results.result;
    this.postMessage(results);
};