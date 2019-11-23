# API

如果您不熟悉maptalks，请参阅其文档。这将帮助您阅读该文档

## BaseObject

这是所有三维对象的基类，其函数和maptalks.geometry尽可能类似。

[Bar](./src/Bar.js), [ExtrudePolygon](./src/ExtrudePolygon.js),  [ExtrudeLine](./src/ExtrudeLine.js),  [Line](./src/Line.js),  [Model](./src/Model.js) 基于它的

`如果你熟悉three.js。您可以基于它自定义自己的图形元素`

比如我们提供的例子 [circle](./demo/custom-circle.html) ,[fatline](./demo/custom-fatline.html),[linetrip](./demo/custom-linetrip.html),[linetrail](./demo/custom-linetrail.html)


### `methods`

* getObject3d()
  
  * return THREE.Object3D



* getId()

  * return id



* setId(id) 
   
  * id
  * return this



* getType() `获取图形元素的类型`

  * return String

```js
  const bar=threeLayer.toBar(...);
  bar.getType()
```


* getOptions() `获取图形元素的配置信息`

  * return Object



* getProperties() `获取图形元素的属性信息`

  * return Object



* setProperties(property) `设置图形元素的属性信息`

  * property [这是一个对象]
  * return this



* getLayer()

  * return ThreeLayer



* getMap()

  * return Map



* getCenter()

  * return Coordinate



* getAltitude() `获取图形元素的高程`

  * return Number



* setAltitude(altitude) `设置图形元素的高程`

  * altitude  [高程值]
  * return this
  * `如果自定义自己的图形元素，则可以重写此方法。` such as [Bar](./src/Bar.js)



* show()

  * return this



* hide()
  
  * return this



* isVisible()

  * return Boolean



* getSymbol()  

  * return THREE.Material
  * `如果自定义自己的图形元素，则可以重写此方法`



* setSymbol(material)

  * material [THREE.Material]
  * return this
  * `如果自定义自己的图形元素，则可以重写此方法`



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

  * eventsOn [要注册的事件类型，如果有多个，则用空格分隔。]
  * handler [要调用的处理程序函数]
  * context [处理程序的上下文]
  * return this
  * [detail maptalks.Eventable](https://maptalks.org/maptalks.js/api/0.x/Eventable.html)
```js
   bar.on('click',function(e){

   });

```


* addEventListener(eventTypes, handler, context)

  * eventTypes  [要注册的事件类型，如果有多个，则用空格分隔。]
  * handler  [要调用的处理程序函数]
  * context  [处理程序的上下文]
  * return this
  * [detail maptalks.Eventable](https://maptalks.org/maptalks.js/api/0.x/Eventable.html)



* once(eventTypes, handler, context)

  * eventTypes  [要注册的事件类型，如果有多个，则用空格分隔。]
  * handler  [要调用的处理程序函数]
  * context  [处理程序的上下文]
  * return this
  * [detail maptalks.Eventable](https://maptalks.org/maptalks.js/api/0.x/Eventable.html)



* off(eventsOff, handler, contextopt)

  * eventsOff  [要注销的事件类型，如果有多个，则用空格分隔。]
  * handler  [要调用的处理程序函数]
  * context  [处理程序的上下文]
  * return this
  * [detail maptalks.Eventable](https://maptalks.org/maptalks.js/api/0.x/Eventable.html)
```js
   bar.off('click',function(e){

   });

```


* removeEventListener(eventTypes, handler, context)

  * eventTypes  [要注销的事件类型，如果有多个，则用空格分隔。]
  * handler  [要调用的处理程序函数]
  * context  [处理程序的上下文]
  * return this
  * [detail maptalks.Eventable](https://maptalks.org/maptalks.js/api/0.x/Eventable.html)


* fire(eventType, param)

  * eventType  [要触发的事件类型]
  * param [侦听器函数的参数。]
  * return this
  * [detail maptalks.Eventable](https://maptalks.org/maptalks.js/api/0.x/Eventable.html)






* animateShow(options = {}, cb)

  * options [animation config]
  * options.duration
  * options.easing
  * cb [callback function]  
  * `如果自定义自己的图形元素，则可能需要重写此方法以延迟显示图形`
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
  * `如果要自定义自己的图形元素并拥有自己的命中检测实现，则需要添加此方法(默认情况下，图形的检测由Raycaster提供)`
  * such as [fatline](./demo/custom-fatline.html)





* _initOptions(options)  `初始化内部配置信息`

  * options
  * return this
  * `如果自定义图形，将使用此方法`. 比如我们提供的例子[circle](./demo/custom-circle.html) ,[fatline](./demo/custom-fatline.html)

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
  * `如果自定义图形，将使用此方法`




* _createGroup()  `Creating THREE.Group objects`

  * return this
  * `如果自定义图形，将使用此方法`




* _createLine(geometry, material)  `Creating THREE.Line objects`
 
  * geometry [THREE.BufferGeometry]
  * material [THREE.Material]
  * return this
  * `如果自定义图形，将使用此方法`


* _animation()

  * `如果自定义图形并希望它们执行循环动画，则需要实现此方法的功能`,such as [linetrail](./demo/custom-linetrail.html)



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


* coordinateToVector3(coordinate, z = 0) `经纬度变换三维矢量`

  * coordinate [maptalks.Coordinate]
  * z
  * return THREE.Vector3

```js
   threeLayer.coordinateToVector3(map.getCenter(),1);

```




* distanceToVector3(w, h, coord) `将长度转换为三维矢量`

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
  * height [多边形拔高的值]]
  * return THREE.Mesh
  * `在新版本中，您可以使用toExtrudePolygon代替`





* toExtrudePolygon(polygon, options, material)

  * polygon [Polygon|MultiPolygon]
  * options.altitude=0
  * options.height=1
  * options.topColor=null 
  * options.bottomColor='#2d2f61'
  * options.interactive=true [可以交互与否]
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

* toExtrudeLineTrail(lineString, options, material) `创造拖尾的线条`

  * lineString [maptalks.LineString]
  * options.altitude=0
  * options.width=2 [Buffer width]
  * options.height=1 [Buffer height]
  * options.trail=5 [尾部长度，最小1，长度为trail*chunkLength],
  * options.chunkLength=50 [切割线的长度，将一条线切割到此长度],
  * options.speed=1 [最大值1]
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




* addMesh(meshes) `添加图形。请批量添加数据，以便获得更高的渲染性能`

  * meshes Array[BaseObjectr]
  * return this




* removeMesh(meshes) `移除图形。请批量添加数据，以便获得更高的渲染性能`

  * meshes Array[BaseObjectr]
  * return this




* identify(coordinate, options) `图命中检测`

  * coordinate [maptalks.Coordinate]
  * options.count [返回图形元素的数目]
  * return Array[BaseObject]

```js
 map.on('mousemove',function(e){
     threeLayer.identify(e.coordinate);
 });

```




## 如何自定义自己的图形

BaseObject是我们提供的图形基类。如果您需要自定义自己的图形，请在此基础上进行扩展

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
BaseObject的object3d属性值为three.js原生对象。可以对其执行相关操作，如缩放、位置、旋转等

理论上，您可以自定义所需的任何图形组件
当然，它要求您熟悉three.js