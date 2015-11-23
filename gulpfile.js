
var gulp = require('gulp');
var watch = require('gulp-watch');
var webpack = require('gulp-webpack');
var mocha = require('gulp-mocha');

gulp.task('test', function () {
    return gulp.src('test/test.js', {read: false})
    // gulp-mocha needs filepaths so you can't have any plugins before it
        .pipe(mocha({reporter: 'nyan'}));
});

gulp.task('webpack', function () {
    gulp.src(['src/*.js'])
        .pipe(webpack({
            output: {
                filename: 'main.js'
            }
        }))
        .pipe(gulp.dest('./'));
});

gulp.task('watch', function () {
    watch(['src/*.js', 'test/*.js'], function () {
        gulp.start(['test', 'webpack']);
    });
});
