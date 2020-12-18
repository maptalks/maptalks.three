//Using cache to reduce computation
export function distanceToVector3(cache, distance, layer) {
    if (!cache[distance]) {
        cache[distance] = layer.distanceToVector3(distance, distance).x;
    }
    return cache[distance];
}
