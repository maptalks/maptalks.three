import * as THREE from 'three';

export type getBaseObjectMaterialType = {
    (layerName: string, data: any, index: string, geojson: any): THREE.Material
}

export type LineMaterialType = THREE.LineBasicMaterial | THREE.LineDashedMaterial;

export type FatLineMaterialType = THREE.ShaderMaterial;