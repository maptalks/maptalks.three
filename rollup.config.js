const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify').uglify;
const pkg = require('./package.json');

const production = process.env.BUILD === 'production';
const outputFile = production ? 'dist/maptalks.three.min.js' : 'dist/maptalks.three.js';
const plugins = production ? [
    uglify({
    })] : [];

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;
const basePlugins = [
    resolve({
        module : true,
        jsnext : true,
        main : true
    }),
    commonjs(),
    babel({
        exclude: 'node_modules/**'
    })
];

module.exports = [
    {
        input: 'index.js',
        plugins: basePlugins.concat(plugins),
        external : ['maptalks', 'three'],
        output: {
            'sourcemap': production ? false : 'inline',
            'format': 'umd',
            'name': 'maptalks',
            'banner': banner,
            'extend' : true,
            'globals' : {
                'maptalks' : 'maptalks',
                'THREE' : 'three'
            },
            'file': outputFile
        }
    },

    {
        input: 'index.js',
        plugins: basePlugins,
        external : ['maptalks', 'three'],
        output: {
            'sourcemap': false,
            'format': 'es',
            'banner': banner,
            'file': pkg.module
        }
    }
];
