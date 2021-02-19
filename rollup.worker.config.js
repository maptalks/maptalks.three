const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify').uglify;
const json = require('rollup-plugin-json');

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
            babel(),
            uglify()
        ],
        external: ['maptalks'],
        output: {
            format: 'amd',
            name: 'maptalks',
            globals: {
                'maptalks': 'maptalks'
            },
            extend: true,
            file: 'dist/worker.amd.js'
        },
        // watch: {
        //     include: 'src/worker/**'
        // }
    }
];
