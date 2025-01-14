---
outline: deep
---

# Install

maptalks.three  be dependent on [maptalks.js](https://github.com/maptalks/maptalks.js) and [three.js](https://github.com/mrdoob/three.js)

![](/terrain.png)


## NPM

::: code-group

```sh [npm]
npm i maptalks

# or
# npm i maptalks-gl

npm i three
npm i maptalks.three

```


```sh [pnpm]
pnpm i maptalks

# or
# pnpm i maptalks-gl

pnpm i three
pnpm i maptalks.three

```

```sh [yarn] 
yarn add maptalks
# or
# yarn add maptalks-gl

yarn add three
yarn add maptalks.three

```

:::

::: tip  
maptalks-gl is maptalks webgl/webgpu version
:::

## CDN

If you like the UMD package, you can also do it

```html
 <script type="text/javascript" src="https://unpkg.com/maptalks/dist/maptalks.js"></script>
 <!-- This is maptalks webgl version -->
 <!-- <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/maptalks-gl@0.105.4/dist/maptalks-gl.min.js"></script> -->
 <script type="text/javascript" src="https://unpkg.com/three@0.138.0/build/three.min.js"></script>
 <script type="text/javascript" src="https://unpkg.com/maptalks.three@latest/dist/maptalks.three.js"></script>
```

### About Namespace

maptalks.three umd package namespace is `maptalks`

Mount all exported variables to `maptalks`

```js
console.log(maptalks);
```

### Incompatible changes

* three.js <Badge type="tip" text=">=128" />  the default umd package is ES6 [Discussion address](https://github.com/mrdoob/three.js/issues/22025)
* Starting from version  <Badge type="tip" text="0.16.0" />, the default umd package is ES6, To fit the new version of three.js about three umd package change
* If your running environment does not support ES6, we also provide ES5 version [maptalks.three.es5.js](https://cdn.jsdelivr.net/npm/maptalks.three@0.39.0/dist/maptalks.three.es5.js), This requires the version of three.js <Badge type="tip" text="<=128" />

## Take Care

Due to the poor compatibility of Three.js, you may need to lock the version of Three.js when using it.

The official example currently uses version Three <Badge type="tip" text=">=138" />, and there may be compatibility issues with future versions. As for whether there are any problems, I am not sure. If you encounter any problems, please submit an [issue](https://github.com/maptalks/maptalks.three/issues)
