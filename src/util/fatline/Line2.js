/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */
// import * as THREE from 'three';
import LineSegments2 from './LineSegments2';
import LineGeometry from './LineGeometry';
import LineMaterial from './LineMaterial';

const Line2 = function (geometry, material) {

    LineSegments2.call(this);

    this.type = 'Line2';

    this.geometry = geometry !== undefined ? geometry : new LineGeometry();
    this.material = material !== undefined ? material : new LineMaterial({ color: Math.random() * 0xffffff });

};

Line2.prototype = Object.assign(Object.create(LineSegments2.prototype), {

    constructor: Line2,

    isLine2: true,

    // eslint-disable-next-line no-unused-vars
    copy: function (source) {

        // todo

        return this;

    }

});
export default Line2;
