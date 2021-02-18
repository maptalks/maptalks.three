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
    constructor(model: THREE.Object3D, options: BaseObjectOptionType = ({} as any), layer: ThreeLayer) {
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
        const z = layer.distanceToVector3(altitude, altitude).x;
        const position = layer.coordinateToVector3(coordinate, z);
        this.getObject3d().position.copy(position);
        this.type = 'Model';
    }
}

export default Model;
