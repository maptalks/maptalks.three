/* eslint-disable indent */
import * as THREE from 'three';
import { distanceToVector3 } from '.';

function positionsConvert(worldPoints, altitude = 0, layer) {
    const vectors = [], cache = {};
    for (let i = 0, len = worldPoints.length; i < len; i += 3) {
        let x = worldPoints[i], y = worldPoints[i + 1], z = worldPoints[i + 2];
        if (altitude > 0) {
            z += distanceToVector3(cache, altitude, layer);
        }
        vectors.push(new THREE.Vector3(x, y, z));
    }
    return vectors;
}

export function vectors2Pixel(worldPoints, size, camera, altitude = 0, layer) {
    if (!(worldPoints[0] instanceof THREE.Vector3)) {
        worldPoints = positionsConvert(worldPoints, altitude, layer);
    }
    const pixels = worldPoints.map(worldPoint => {
        return vector2Pixel(worldPoint, size, camera);
    });
    return pixels;

}

// eslint-disable-next-line camelcase
export function vector2Pixel(world_vector, size, camera) {
    // eslint-disable-next-line camelcase
    const vector = world_vector.project(camera);
    const halfWidth = size.width / 2;
    const halfHeight = size.height / 2;
    const result = {
        x: Math.round(vector.x * halfWidth + halfWidth),
        y: Math.round(-vector.y * halfHeight + halfHeight)
    };
    return result;
}

export function draw(context, data, type, options) {
    options = options || {};
    for (const key in options) {
        context[key] = options[key];
    }
    switch (type) {
        case 'Circle': {
            const size = options._size || options.size || 20;
            const x = data.x || data[0], y = data.y || data[1];
            context.beginPath();
            context.moveTo(x, y);
            context.arc(x, y, size / 2, 0, Math.PI * 2);
            context.fill();
            context.restore();
            break;
        }
        case 'LineString': {
            context.beginPath();
            for (let j = 0; j < data.length; j++) {
                const xy = data[j];
                const x = xy.x || xy[0],
                    y = xy.y || xy[1];
                if (j === 0) {
                    context.moveTo(x, y);
                } else {
                    context.lineTo(x, y);
                }
            }
            context.stroke();
            context.restore();
            break;
        }
        default: {
            console.error(`type ${type} is not support now!`);
            break;

        }
    }
}
