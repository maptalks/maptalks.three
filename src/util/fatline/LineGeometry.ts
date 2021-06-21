/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */
// import * as THREE from 'three';
import LineSegmentsGeometry from './LineSegmentsGeometry';

class LineGeometry extends LineSegmentsGeometry {
    isLineGeometry: boolean = true;
    constructor() {
        super();
        this.type = 'LineGeometry';
    }

    fromLine(line) {

        var geometry = line.geometry;

        if (geometry.isGeometry) {

            this.setPositions(geometry.vertices);

        } else if (geometry.isBufferGeometry) {

            this.setPositions(geometry.position.array); // assumes non-indexed

        }

        return this;
    }
};
export default LineGeometry;
