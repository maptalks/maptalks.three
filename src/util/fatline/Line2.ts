/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */
// import * as THREE from 'three';
import LineSegments2 from './LineSegments2';
import LineGeometry from './LineGeometry';
import LineMaterial from './LineMaterial';

class Line2 extends LineSegments2 {
    isLine2: boolean = true;
    _colorIndex: number;
    constructor(geometry, material) {
        super(geometry, material);
        this.type = 'Line2';

        this.geometry = geometry !== undefined ? geometry : new LineGeometry();
        this.material = material !== undefined ? material : new LineMaterial({ color: Math.random() * 0xffffff });
    }

    copy(source) {

        return this;
    }
};
export default Line2;
