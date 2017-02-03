const gulp = require('gulp'),
    pkg = require('./package.json'),
    BundleHelper = require('maptalks-build-helpers').BundleHelper,
    TestHelper = require('maptalks-build-helpers').TestHelper;
const bundleHelper = new BundleHelper(pkg);
const testHelper = new TestHelper();
const karmaConfig = require('./karma.config');

gulp.task('build', () => {
    const rollupConfig = bundleHelper.getDefaultRollupConfig();
    rollupConfig['sourceMap'] = false;
    rollupConfig['external'].push('three');
    return bundleHelper.bundle('index.js', rollupConfig);
});

gulp.task('minify', ['build'], () => {
    bundleHelper.minify();
});

gulp.task('watch', ['build'], () => {
    gulp.watch(['index.js', './gulpfile.js'], ['build']);
});

gulp.task('test', ['build'], () => {
    testHelper.test(karmaConfig);
});

gulp.task('tdd', ['build'], () => {
    karmaConfig.singleRun = false;
    gulp.watch(['index.js'], ['test']);
    testHelper.test(karmaConfig);
});

gulp.task('default', ['watch']);

