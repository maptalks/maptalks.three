import { DEFAULT_EXTENSIONS } from '@babel/core';
const resolve = require('rollup-plugin-node-resolve');
import { babel } from '@rollup/plugin-babel';
const commonjs = require('rollup-plugin-commonjs');
// const uglify = require('rollup-plugin-uglify').uglify;
import { terser } from 'rollup-plugin-terser';
const json = require('rollup-plugin-json');
const typescript = require('rollup-plugin-typescript2');
const pkg = require('./package.json');

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;

let outro = pkg.name + ' v' + pkg.version;
if (pkg.peerDependencies && pkg.peerDependencies['maptalks']) {
    outro += `, requires maptalks@${pkg.peerDependencies.maptalks}.`;
}

outro = `typeof console !== 'undefined' && console.log('${outro}');`;

const intro = '';


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
    typescript({

    }),
    //handle node_modules
    resolve({
        module: true,
        jsnext: true,
        main: true
    }),
    commonjs(),
    //handle ES2015+
    // babel({
    //     // exclude: 'node_modules/**'
    // }),
    removeGlobal()
];

const es5BasePlugins = [
    json(),
    typescript({

    }),
    //handle node_modules
    resolve({
        module: true,
        jsnext: true,
        main: true
    }),
    commonjs(),
    //handle ES2015+
    babel({
        exclude: 'node_modules/**',
        babelHelpers: 'bundled',
        extensions: [
            ...DEFAULT_EXTENSIONS,
            '.ts',
            '.tsx'
        ]
    }),
    removeGlobal()
];

module.exports = [
    {
        input: 'src/index.ts',
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
                'three': 'THREE'
            },
            'file': 'dist/maptalks.three.js'
        }
    },
    {
        input: 'src/index.ts',
        plugins: basePlugins.concat([terser()]),
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
                'three': 'THREE'
            },
            'file': 'dist/maptalks.three.min.js'
        }
    },
    {
        input: 'src/index.ts',
        plugins: es5BasePlugins,
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
                'three': 'THREE'
            },
            'file': 'dist/maptalks.three.es5.js'
        }
    },
    {
        input: 'src/index.ts',
        plugins: es5BasePlugins.concat([terser()]),
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
                'three': 'THREE'
            },
            'file': 'dist/maptalks.three.es5.min.js'
        }
    },
    // {
    //     input: 'src/index.ts',
    //     plugins: basePlugins,
    //     external: ['maptalks', 'three'],
    //     output: {
    //         'sourcemap': false,
    //         'format': 'es',
    //         'banner': banner,
    //         'outro': outro,
    //         'intro': intro,
    //         'file': pkg.module
    //     }
    // }
];
