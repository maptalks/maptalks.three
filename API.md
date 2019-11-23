# API

If you are not familiar with maptalks, refer to its documentation.This will help you read the document

## BaseObject

This is the base class for all 3D objects,Its function and maptalks.geometry are as similar as possible.

[Bar](./src/Bar.js), [ExtrudePolygon](./src/ExtrudePolygon.js),  [ExtrudeLine](./src/ExtrudeLine.js),  [Line](./src/Line.js),  [Model](./src/Model.js) base on it

`If you're familiar with three.js. You can customize your own graphic elements based on it`

such as examples we provide [circle](./demo/custom-circle.html) ,[fatline](./demo/custom-fatline.html),[linetrip](./demo/custom-linetrip.html),[linetrail](./demo/custom-linetrail.html)

### `methods`

* getObject3d()
  
  * return THREE.Object3D



* getId()

  * return id



* setId(id) 
   
  * id
  * return this



* getType() `Get the type of graphic element`

  * return String

```js
  const bar=threeLayer.toBar(...);
  bar.getType()
```


* getOptions() `Get configuration information of graphic elements`

  * return Object



* getProperties() `Get attribute information of graphic elements`

  * return Object



* setProperties(property) `set attribute information of graphic elements`

  * property [this a Object]
  * return this



* getLayer()

  * return ThreeLayer



* getMap()

  * return Map



* getCenter()

  * return Coordinate



* getAltitude() `Get the elevation of the graphic element`

  * return Number



* setAltitude(altitude) `set the elevation of the graphic element`

  * altitude  [elevation value]
  * return this
  * `If you customize your own graphic elements, you may override this method.` such as [Bar](./src/Bar.js)



* show()

  * return this



* hide()
  
  * return this



* isVisible()

  * return Boolean



* getSymbol()  

  * return THREE.Material
  * `If you customize your own graphic elements, you may override this method`



* setSymbol(material)

  * material [THREE.Material]
  * return this
  * `If you customize your own graphic elements, you may override this method`



* setInfoWindow(options)
 
  * options [infowindow config ,[detail](https://maptalks.org/maptalks.js/api/0.x/ui.InfoWindow.html)]
  * return this


```js

bar.setInfoWindow({
    content: 'hello world,height:' + d.height * 400,
    title: 'message',
    animationDuration: 0,
    autoOpenOn: false
});
```



* getInfoWindow()

  * return ui.InfoWindow



* openInfoWindow(coordinate)

  * coordinate [infowindow position]
  * return this



* closeInfoWindow()

  * return this



* removeInfoWindow()

  * return this



* setToolTip(content, options)

  * content [tooltip content]
  * options [tooltip cofig  [detail](https://maptalks.org/maptalks.js/api/0.x/ui.ToolTip.html)]
  * return this
  
```js
bar.setToolTip(d.height * 400, {
    showTimeout: 0,
    eventsPropagation: true,
    dx: 10
});


```

* getToolTip()

  * return ui.ToolTip




* openToolTip(coordinate)

  * coordinate [tooltip position]
  * return this




* closeToolTip()

  * return this




* removeToolTip()

  * return this



* on(eventsOn, handler, context)

  * eventsOn [event types to register, seperated by space if more than one.]
  * handler [handler function to be called]
  * context [the context of the handler]
  * return this
  * [detail maptalks.Eventable](https://maptalks.org/maptalks.js/api/0.x/Eventable.html)

```js
   bar.on('click',function(e){

   });

```



* addEventListener(eventTypes, handler, context)

  * eventTypes  [event types to register, seperated by space if more than one.
  * handler  [handler function to be called]
  * context  [the context of the handler]
  * return this
  * [detail maptalks.Eventable](https://maptalks.org/maptalks.js/api/0.x/Eventable.html)



* once(eventTypes, handler, context)

  * eventTypes  [event types to register, seperated by space if more than one.]
  * handler  [handler function to be called]
  * context  [the context of the handler]
  * return this
  * [detail maptalks.Eventable](https://maptalks.org/maptalks.js/api/0.x/Eventable.html)



* off(eventsOff, handler, contextopt)

  * eventsOff  [event types to unregister, seperated by space if more than one.]
  * handler  [handler function to be called]
  * context  [the context of the handler]
  * return this
  * [detail maptalks.Eventable](https://maptalks.org/maptalks.js/api/0.x/Eventable.html)

```js
   bar.off('click',function(e){

   });

```

* removeEventListener(eventTypes, handler, context)

  * eventTypes  [event types to unregister, seperated by space if more than one.]
  * handler  [handler function to be called]
  * context  [the context of the handler]
  * return this
  * [detail maptalks.Eventable](https://maptalks.org/maptalks.js/api/0.x/Eventable.html)



* fire(eventType, param)

  * eventType  [an event type to fire]
  * param [parameters for the listener function.]
  * return this
  * [detail maptalks.Eventable](https://maptalks.org/maptalks.js/api/0.x/Eventable.html)





* animateShow(options = {}, cb)
    
  * options [animation config]
  * options.duration
  * options.easing
  * cb [callback function]  
  * `If you customize your own graphic elements, you may need to override this method to delayed display of graphics`
  * such as [circle](./demo/custom-circle.html)

```js
 animationShow(options = {}, cb) {
                if (this._showPlayer) {
                    this._showPlayer.cancel();
                }
                if (maptalks.Util.isFunction(options)) {
                    options = {};
                    cb = options;
                }
                const duration = options['duration'] || 1000,
                    easing = options['easing'] || 'out';
                const player = this._showPlayer = maptalks.animation.Animation.animate({
                    'scale': 1
                }, {
                    'duration': duration,
                    'easing': easing
                }, frame => {
                    const scale = frame.styles.scale;
                    if (scale > 0) {
                        this.getObject3d().scale.set(scale, scale, scale);
                    }
                    if (cb) {
                        cb(frame, scale);
                    }
                });
                player.play();
                return player;
}

```



* identify(coordinate)
  
  * coordinate [Coordinate]
  * return Boolean
  * `You need to add this method if you want to customize your own graphic elements and have your own hit detection implementation(By default, the detection of graphics is provided by Raycaster)`
  * such as [fatline](./demo/custom-fatline.html)




* _initOptions(options)  `Initialize internal configuration information`

  * options
  * return this
  * `If you customize the graphics, you will use this method`. such as examples we provide [circle](./demo/custom-circle.html) ,[fatline](./demo/custom-fatline.html)

```js
 class Circle extends maptalks.BaseObject {
            constructor(coordinate, options, material, layer) {
                options = maptalks.Util.extend({}, OPTIONS, options, { layer, coordinate });
                super();
                //Initialize internal configuration
                // https://github.com/maptalks/maptalks.three/blob/1e45f5238f500225ada1deb09b8bab18c1b52cf2/src/BaseObject.js#L135
                this._initOptions(options);
                const { altitude, radius } = options;
                //generate geometry
                const r = layer.distanceToVector3(radius, radius).x
                const geometry = new THREE.CircleBufferGeometry(r, 50);

                //Initialize internal object3d
                // https://github.com/maptalks/maptalks.three/blob/1e45f5238f500225ada1deb09b8bab18c1b52cf2/src/BaseObject.js#L140
                this._createMesh(geometry, material);

                //set object3d position
                const z = layer.distanceToVector3(altitude, altitude).x;
                const position = layer.coordinateToVector3(coordinate, z);
                this.getObject3d().position.copy(position);
                this.getObject3d().rotation.x = -Math.PI;
            }
 }

```


* _createMesh(geometry, material)   `Creating THREE.Mesh objects`
  
  * geometry [THREE.BufferGeometry]
  * material [THREE.Material]
  * return this
  * `If you customize the graphics, you will use this method`




* _createGroup()  `Creating THREE.Group objects`

  * return this
  * `If you customize the graphics, you will use this method`




* _createLine(geometry, material)  `Creating THREE.Line objects`
 
  * geometry [THREE.BufferGeometry]
  * material [THREE.Material]
  * return this
  * `If you customize the graphics, you will use this method`



* _animation()

  * `If you customize graphics and want them to perform circular animation, you need to implement the function of this method`,such as [linetrail](./demo/custom-linetrail.html)



### `events support`

* add
* remove 
* mousemove
* click
* mousedown
* mouseup
* dblclick
* contextmenu
* touchstart
* touchmove
* touchend
* mouseover
* mouseout
* idchange
* propertieschange
* show
* hide
* symbolchange


## ThreeLayer

A maptalks Layer to render with THREE.js

```ThreeLayer``` is a subclass of [maptalks.CanvasLayer](http://maptalks.github.io/maptalks.js/api/0.x/CanvasLayer.html) and inherits all the methods of its parent.

### `constructor`

```javascript
new maptalks.ThreeLayer(id, options)
```

### `methods`


* coordinateToVector3(coordinate, z = 0) `Latitude and longitude transform three-dimensional vector`

  * coordinate [maptalks.Coordinate]
  * z
  * return THREE.Vector3

```js
   threeLayer.coordinateToVector3(map.getCenter(),1);

```




* distanceToVector3(w, h, coord) `Convert length to 3D vector`

  * w
  * h
  * coord  [maptalks.Coordinate]
  * return THREE.Vector3
```js
  threeLayer.distanceToVector3(100,100);

```




* toShape(polygon) `polygon|MultiPolygono to THREE.Shape`

  * polygon
  * return THREE.Shape




* toExtrudeMesh(polygon, altitude, material, height) `polygon to THREE.ExtrudeGeometry Mesh`
 
  * polygon [Polygon|MultiPolygon]
  * altitude
  * material [THREE.Material]
  * height [The value of the polygon being raised]
  * return THREE.Mesh
  * `In the new version, you can use toExtrudePolygon instead`





* toExtrudePolygon(polygon, options, material)

  * polygon [Polygon|MultiPolygon]
  * options.altitude=0
  * options.height=1
  * options.topColor=null 
  * options.bottomColor='#2d2f61'
  * options.interactive=true [Can I interact]
  * material [THREE.Material]
  * return [ExtrudePolygon](./src/ExtrudePolygon.js)

```js
  var mesh = threeLayer.toExtrudePolygon(maptalks.GeoJSON.toGeometry(g), {
        height: levels * heightPerLevel,
        topColor: '#fff'
  }, material);

```


* toBar(coordinate, options, material) 

  * coordinate [maptalks.Coordinate]
  * options.radius=10
  * options.height=100
  * options.radialSegments=6
  * options.altitude=0
  * options.topColor=null
  * options.bottomColor='#2d2f61'
  * options.interactive=true
  * material [THREE.Material]
  * return [Bar](./src/Bar.js)
```js
  var bar = threeLayer.toBar(d.coordinate, {
       height: d.height * 400,
       radius: 15000,
       topColor: '#fff',
       // radialSegments: 4
 }, material);

```



* toLine(lineString, options, material)

  * lineString [maptalks.LineString]
  * options.altitude=0
  * options.colors=null
  * options.interactive=true
  * material [THREE.Material]
  * return [Line](./src/Line.js)
```js
 var line = threeLayer.toLine(lineString, { altitude: 0 }, material);

```



* toExtrudeLine(lineString, options, material)

  * lineString [maptalks.LineString]
  * options.altitude=0
  * options.width=3 [Buffer width]
  * options.height=1 [Buffer height]
  * options.interactive=true
  * material [THREE.Material]
  * return [ExtrudeLine](./src/ExtrudeLine.js)

```js
 var line = threeLayer.toExtrudeLine(lineString, { altitude: 0, width: 3, height: 1 }, material);

```


* toExtrudeLineTrail(lineString, options, material) `Create trailing lines`

  * lineString [maptalks.LineString]
  * options.altitude=0
  * options.width=2 [Buffer width]
  * options.height=1 [Buffer height]
  * options.trail=5 [tail length,1 minimum, the length is trail*chunkLength],
  * options.chunkLength=50 [Length of cutting line，Cut a line to this length],
  * options.speed=1 [1 Max]
  * options.interactive=true
  * material [THREE.Material]
  * return [ExtrudeLineTrail](./src/ExtrudeLineTrail.js)

```js
   lineTrails = lineStrings.slice(0, 300).map(function (d) {
     var line = threeLayer.toExtrudeLineTrail(d.lineString,
       { altitude: 0, width: 3, height: 2, chunkLength: d.len / 40, speed: 1, trail: 6 },
       highlightmaterial);
     return line;
   });

```



* toModel(model, options)

  * model [model data]
  * options.altitude=0
  * options.coordinate=null [model position]
  * options.interactive=true
  * return [Model](./src/Model.js)

```js
  var model=threeLayer.toModel(object,{
                coordinate:map.getCenter(),
                altitude:100
  });

```


* getCamera()

  * return THREE.Camera




* getScene()

  * return THREE.Scene




* getThreeRenderer()

  * return THREE.WebGLRenderer




* renderScene() `Render Scene`

  * return this




* addMesh(meshes) `add Graphical.Please add data in batch, so that you can have higher rendering performance`

  * meshes Array[BaseObjectr]
  * return this




* removeMesh(meshes) `remove Graphical.Please add data in batch, so that you can have higher rendering performance`

  * meshes Array[BaseObjectr]
  * return this




* identify(coordinate, options) `Graph hit detection`

  * coordinate [maptalks.Coordinate]
  * options.count [Returns the number of graphic elements]
  * return Array[BaseObject]

```js
 map.on('mousemove',function(e){
     threeLayer.identify(e.coordinate);
 });

```




## How to customize your own graphics

BaseObject is the base class of graphics provided by us. If you need to customize your own graphics, please extend it based on it

```js
  class xxx extends maptalks.BaseObject{
    
    constructor(...){
        options = maptalks.Util.extend({}, OPTIONS, options, { layer, coordinate });
        super();
        this._initOptions(options);

        ...

        this._createMesh(geometry, material);
        //this._createGroup();
        //this._createLine(geometry,material);
    }

    ....
   
  }

```
The value of BaseObject's object3d attribute is three.js. You can perform relevant operations on it, such as scale, position, rotation, etc

In theory, you can customize any graphics component you need.
Of course, it requires you to be familiar with three.js



## Tips

There is no sharing of WebGL context between different threelayer layers, so you'd better complete the rendering of all graphics on one threelayer layer.

Because the normal 3D relationship rendering cannot be maintained between multiple threelayer layers at present