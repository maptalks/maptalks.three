const resolve = require('rollup-plugin-node-resolve');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const uglify = require('rollup-plugin-uglify').uglify;
const pkg = require('./package.json');

const banner = `/*!\n * ${pkg.name} v${pkg.version}\n * LICENSE : ${pkg.license}\n * (c) 2016-${new Date().getFullYear()} maptalks.org\n */`;

let outro = pkg.name + ' v' + pkg.version;
if (pkg.peerDependencies && pkg.peerDependencies['maptalks']) {
    outro += `, requires maptalks@${pkg.peerDependencies.maptalks}.`;
}

outro = `typeof console !== 'undefined' && console.log('${outro}');`;

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
        plugins: basePlugins.concat([uglify()]),
        external : ['maptalks', 'three'],
        output: {
            'sourcemap': false,
            'format': 'umd',
            'name': 'maptalks',
            'banner': banner,
            'outro' : outro,
            'extend' : true,
            'globals' : {
                'maptalks' : 'maptalks',
                'THREE' : 'three'
            },
            'file': 'dist/maptalks.three.min.js'
        }
    },
    {
        input: 'index.js',
        plugins: basePlugins,
        external : ['maptalks', 'three'],
        output: {
            'sourcemap': false,
            'format': 'umd',
            'name': 'maptalks',
            'banner': banner,
            'outro' : outro,
            'extend' : true,
            'globals' : {
                'maptalks' : 'maptalks',
                'THREE' : 'three'
            },
            'file': 'dist/maptalks.three.js'
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
            'outro' : outro,
            'file': pkg.module
        }
    }
];
