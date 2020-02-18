const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify').uglify;
const json = require('rollup-plugin-json');
const pkg = require('./package.json');

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;

let outro = pkg.name + ' v' + pkg.version;
if (pkg.peerDependencies && pkg.peerDependencies['maptalks']) {
    outro += `, requires maptalks@${pkg.peerDependencies.maptalks}.`;
}

outro = `typeof console !== 'undefined' && console.log('${outro}');`;
const intro = `
    var IS_NODE = typeof exports === 'object' && typeof module !== 'undefined';
    var maptalks = maptalks;
    if (IS_NODE) {
        maptalks = maptalks || require('maptalks');
    }
    var workerLoaded;
    function define(_, chunk) {
    if (!workerLoaded) {
        if(maptalks.registerWorkerAdapter){
            maptalks.registerWorkerAdapter('${pkg.name}', chunk);
            workerLoaded = true;
        }else{
          console.warn('maptalks.registerWorkerAdapter is not defined,If you need to use ThreeVectorTileLayer,you can npm i maptalks@next,more https://github.com/maptalks/maptalks.js/tree/next');
        }
    } else {
        var exports = IS_NODE ? module.exports : maptalks;
        chunk(exports, maptalks);
    }
}`;


function removeGlobal() {
    return {
        transform(code, id) {
            if (id.indexOf('worker.js') === -1) return null;
            const commonjsCode = /typeof global/g;
            var transformedCode = code.replace(commonjsCode, 'typeof undefined');
            return {
                code: transformedCode,
                map: { mappings: '' }
            };
        }
    };
}

const basePlugins = [
    json(),
    resolve({
        module: true,
        jsnext: true,
        main: true
    }),
    commonjs(),
    babel({
        // exclude: 'node_modules/**'
    }),
    removeGlobal()
];

module.exports = [
    {
        input: 'src/worker/index.js',
        plugins: [
            json(),
            resolve({
                module: true,
                jsnext: true,
                main: true
            }),
            commonjs(),
            babel()
        ],
        external: ['maptalks'],
        output: {
            format: 'amd',
            name: 'maptalks',
            globals: {
                'maptalks': 'maptalks'
            },
            extend: true,
            file: 'dist/worker.js'
        },
        // watch: {
        //     include: 'src/worker/**'
        // }
    },
    {
        input: 'index.js',
        plugins: basePlugins.concat([uglify()]),
        external: ['maptalks', 'three'],
        output: {
            'sourcemap': false,
            'format': 'umd',
            'name': 'maptalks',
            'banner': banner,
            'outro': outro,
            'intro': intro,
            'extend': true,
            'globals': {
                'maptalks': 'maptalks',
                'THREE': 'three'
            },
            'file': 'dist/maptalks.three.min.js'
        }
    },
    {
        input: 'index.js',
        plugins: basePlugins,
        external: ['maptalks', 'three'],
        output: {
            'sourcemap': true,
            'format': 'umd',
            'name': 'maptalks',
            'banner': banner,
            'outro': outro,
            'extend': true,
            'intro': intro,
            'globals': {
                'maptalks': 'maptalks',
                'THREE': 'three'
            },
            'file': 'dist/maptalks.three.js'
        }
    },
    {
        input: 'index.js',
        plugins: basePlugins,
        external: ['maptalks', 'three'],
        output: {
            'sourcemap': false,
            'format': 'es',
            'banner': banner,
            'outro': outro,
            'intro': intro,
            'file': pkg.module
        }
    }
];
