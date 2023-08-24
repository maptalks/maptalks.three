import * as maptalks from 'maptalks';
import { ThreeLayer } from './index';
import BaseObject from './BaseObject';
import { BaseObjectOptionType } from './type';

const OPTIONS = {
    altitude: 0,
    coordinate: null
};


/**
 * Model container
 */
class Model extends BaseObject {
    constructor(model: THREE.Object3D, options: BaseObjectOptionType = {}, layer: ThreeLayer) {
        if (!options.coordinate) {
            console.warn('coordinate is null,it is important to locate the model');
            options.coordinate = layer.getMap().getCenter();
        }
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, model });
        super();
        this._initOptions(options);
        this._createGroup();
        this.getObject3d().add(model);
        const { altitude, coordinate } = options;
        const z = layer.altitudeToVector3(altitude, altitude).x;
        const position = layer.coordinateToVector3(coordinate, z);
        this.getObject3d().position.copy(position);
        this.type = 'Model';
    }


    getCoordinates() {
        const coordinate = this.options.coordinate;
        const altitude = this.options.altitude;
        const c = new maptalks.Coordinate(coordinate);
        c.z = altitude;
        return c;
    }
}

export default Model;
