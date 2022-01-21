import { nodeResolve as resolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import json from '@rollup/plugin-json';

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
            terser()
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
