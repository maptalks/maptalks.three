const path = require('path');
module.exports = {
    presets: [
        ['@babel/env', {
            'loose': true, 'modules': false
        }]
    ],
    include: [
        path.resolve(__dirname, './node_modules/geometry-extrude'),
        path.resolve(__dirname, './node_modules/deyihu-geometry-extrude')
    ]
};
