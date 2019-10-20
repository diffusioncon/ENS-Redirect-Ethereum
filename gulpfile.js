#!/usr/bin/env node
// vim: sts=2:ts=2:sw=2

const minifyInline = require('gulp-minify-inline');
const saveLicense = require('uglify-save-license');
// 
//gulp.task('minify-inline', function() {
//  gulp.src('src/*.html')
//    .pipe(gulp.dest('dist/'))
//});

var gulp = require('gulp');
var htmlmin = require('gulp-htmlmin');

gulp.task('minify', function() {
  //return gulp.src('src/*.htm')
  return gulp.src('dist/index.html')
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(minifyInline({
      js: {
        output: {
          comments: saveLicense
        }
      }
    }))
    .pipe(gulp.dest('dist'));
});
