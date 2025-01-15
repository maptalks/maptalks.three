# Frequently Asked Questions

Answers to common user questions

## maptalks-gl?

The WebGL version of Maptalks is currently under development and will be released soon

## How to control the camera

When using the maptalks.tree plugin, due to the influence of Threejs, I always think about operating the camera in the ThreeLayer layer to control the map. This is not correct because ThreeLayer is just one layer, and there can be multiple layers on a map. If a layer can control the view angle of the map, then multiple layers simultaneously operating the camera view angle of the map will cause the map to receive multiple instructions to change the view angle, leading to confusion

The cameras in ThreeLayer are only used to synchronize the cameras in the map

* The camera is a global feature with map object control

* All layers are map driven, and there is no possibility of using layers to control the map because there are multiple layers on the map. If layers can control the map, the map will become chaotic

* Layers should only control their internal affairs, such as whether the graphics in the layer can be clicked, the display and hiding of the layer, clearing the data in the layer, enabling animation in the layer, and controlling the animation of graphics inside the layer

We should start with the map

```js
map.setCenter(center);
//or

map.setView(view);
//or

map.animateTo(view, {
    ....
})
```

## Initialize TheeLayer layer error

The initialization of TheeLayer is asynchronous, so business operations need to be performed in the `prepareToDraw` method of Threelayer

```js
  // the ThreeLayer to draw buildings
  var threeLayer = new maptalks.ThreeLayer('t', {
      forceRenderOnMoving: true,
      forceRenderOnRotating: true,
      identifyCountOnEvent: 1
      // animation: true
  });
  threeLayer.prepareToDraw = function(gl, scene, camera) {
      //do some things

  };
  const sceneConfig = {
      postProcess: {
          enable: true,
          antialias: {
              enable: true
          }
      }
  };
  const groupLayer = new maptalks.GroupGLLayer('group', [threeLayer], {
      sceneConfig
  });
  groupLayer.addTo(map);
```

## After upgrading to three, the program became abnormal

This is because the compatibility of the three version iteration is very poor, and there will be many destructive updates during the three version upgrade

::: danger
When using three, remember not to upgrade versions casually. It is best to upgrade them centrally, such as every six months or a year, instead of upgrading every time three releases a version. Currently, it seems that every version upgrade of three will make a lot of destructive updates
:::

## The issue of inheriting classes from prototypes

![](/4.png)

This is all caused by using the Three plugin, but the plugin is older and you used a higher version of Three. The new version of Three is packaged as ES6 by default, but the old plugin still uses the prototype method for inheritance. However, ES specification class prototypes cannot inherit classes. Therefore, please maintain consistency between Three and its plugin version when using it

## The various post-processing of three is not effective or does not achieve the expected effect

The webglcontext in the three plugin is provided by GroupGLLayer by default, and the entire webglcontext is controlled by GroupGLLayer. If the post-processing of three is used, it will change the state of webglcontext, which may conflict with the operations on webglcontext in GroupGLLayer and cause some unknown problems

GroupGLLayer provides some post-processing functions by default. If you need post-processing effects, you should start with GroupGLLayer, such as bloom, shadow, ssao, etc

## The model picking performance is relatively poor

The picking of models (gltf, obj, fbx, etc.) in the three plugin still uses raycaster. However, when the model becomes larger and more complex, there may be performance issues. You can use the three bvh plugin to speed it up. I tried it and the performance improvement was still very good

[three-mesh-bvh](https://github.com/gkjohnson/three-mesh-bvh)

## The graphics added to the layer need to be manually moved on the map to be rendered

Threelayer still uses the same rendering mechanism as Three internally, which requires activating the animation rendering function of the layer for real-time rendering

* Manually control animation functions by oneself

```js
function animation() {

    // layer animation support Skipping frames
    threeLayer._needsUpdate = !threeLayer._needsUpdate;
    if (threeLayer._needsUpdate) {
        threeLayer.redraw();
    }
    stats.update();
    requestAnimationFrame(animation);

}
```

* Or enable the animation function option for the layer 

```js
var threeLayer = new maptalks.ThreeLayer("t", {
    forceRenderOnMoving: true,
    forceRenderOnRotating: true,
    identifyCountOnEvent: 1,
    animation: true,
});
```

## The native Object 3D of three will automatically bloom when directly added to the ThreeLayer

The graphics in ThreeLayer are divided into two types:

* Based on BaseObject
* Three Native Object 3D

The native Object 3D of three is added to ThreeLayer, and ThreeLayer will also render, but it will be separated from ThreeLayer's global management:

* event control
* bloom control

It is recommended to construct graphics based on BaseObject, even if it is three's native Object 3D, it should be wrapped in BaseObject

```js
//default values
var OPTIONS = {
    altitude: 0,
};

//https://zhuanlan.zhihu.com/p/199353080
class XXX extends maptalks.BaseObject {
    constructor(mesh, options, material, layer) {
        options = maptalks.Util.extend({}, OPTIONS, options, {
            layer
        });
        super();
        //Initialize internal configuration
        // https://github.com/maptalks/maptalks.three/blob/1e45f5238f500225ada1deb09b8bab18c1b52cf2/src/BaseObject.js#L135
        this._initOptions(options);

        this._createGroup();
        this.getObject3d().add(mesh);
        //Initialize internal object3d
        // https://github.com/maptalks/maptalks.three/blob/1e45f5238f500225ada1deb09b8bab18c1b52cf2/src/BaseObject.js#L140

        //set object3d position
        this.getObject3d().position.copy(mesh.getObject3d().position);
    }
}
```

If it's a model, ThreeLayer comes with a built-in method

```js
baseObjectModel = threeLayer.toModel(model, {
    coordinate: map.getCenter()
});
```
