// @ts-nocheck
import * as maptalks from 'maptalks';
import * as THREE from 'three';
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

        this.wrapSkinnedMesh(model, model);
        model.traverse((child) => {
            this.wrapSkinnedMesh(child, model);
        });

        this.type = 'Model';
    }


    getCoordinates() {
        const coordinate = this.options.coordinate;
        const altitude = this.options.altitude;
        const c = new maptalks.Coordinate(coordinate as maptalks.Coordinate);
        c.z = altitude;
        return c;
    }

    wrapSkinnedMesh(mesh, rootObject3D) {
        if (!mesh.isSkinnedMesh) {
            return;
        }
        mesh.updateMatrixWorld = wrapUpdateMatrixWorld(mesh.updateMatrixWorld, rootObject3D).bind(mesh);
        mesh.skeleton.update = wrapSkeletonUpdate(mesh.skeleton.update, rootObject3D).bind(mesh.skeleton);
    }
}

export default Model;

function wrapSkeletonUpdate(fn, rootObject3D) {
    const _offsetMatrix = /*@__PURE__*/ new THREE.Matrix4();
    const _identityMatrix = /*@__PURE__*/ new THREE.Matrix4();
    return function () {
        fn.apply(this, arguments);
        const matrixWorld = rootObject3D.matrixWorld;

        const bones = this.bones;
		const boneInverses = this.boneInverses;
		const boneMatrices = this.boneMatrices;
		const boneTexture = this.boneTexture;

        //写入boneTexture之前，从boneMatrices中去掉 root translation
        //重新计算 boneMatrices，不能直接减去 root translation，否则会有精度问题导致的绘制失真

		for ( let i = 0, il = bones.length; i < il; i ++ ) {

			const matrix = bones[ i ] ? bones[ i ].matrixWorld : _identityMatrix;

			_offsetMatrix.multiplyMatrices( matrix, boneInverses[ i ] );
            _offsetMatrix.elements[12] -= matrixWorld.elements[12];
            _offsetMatrix.elements[13] -= matrixWorld.elements[13];
            _offsetMatrix.elements[14] -= matrixWorld.elements[14];
			_offsetMatrix.toArray( boneMatrices, i * 16 );

		}
    }
}

function wrapUpdateMatrixWorld(fn, rootObject3D) {

    return function () {
        fn.apply(this, arguments);
        //从bindMatrixInverse中去掉 root translation
        const matrixWorld = rootObject3D.matrixWorld;
        if ( this.bindMode === (THREE.AttachedBindMode || 'attached')) {
            const bindMatrixInverse = this.bindMatrixInverse;
            bindMatrixInverse.copy( this.matrixWorld );
            bindMatrixInverse.elements[12] -= matrixWorld.elements[12];
            bindMatrixInverse.elements[13] -= matrixWorld.elements[13];
            bindMatrixInverse.elements[14] -= matrixWorld.elements[14];
            bindMatrixInverse.invert();
        }
    }
}
