import * as maptalks from 'maptalks';
import BaseObject from './BaseObject';
import { getExtrudeLineGeometry } from './util/LineUtil';


const OPTIONS = {
    width: 3,
    height: 1,
    altitude: 0
};


/**
 * 
 */
class ExtrudeLine extends BaseObject {
    constructor(lineString, options, material, layer) {
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, lineString });
        super();
        this._initOptions(options);

        const { height, width } = options;
        options.height = layer.distanceToVector3(height, height).x;
        options.width = layer.distanceToVector3(width, width).x;
        const geometry = getExtrudeLineGeometry(lineString, options.width, options.height, layer);
        this._createMesh(geometry, material);

        const { altitude } = options;
        const center = lineString.getCenter();
        const z = layer.distanceToVector3(altitude, altitude).x;
        const v = layer.coordinateToVector3(center, z);
        this.getObject3d().position.copy(v);
    }
}

export default ExtrudeLine;