import gulp from 'gulp';
import sourcemaps from 'gulp-sourcemaps';
import babel from 'gulp-babel';
import path from 'path';

const paths = {
  es6: ['src/*.js'],
  es5: 'dist/',
  sourceRoot: path.join(__dirname, 'es6'),
};

gulp.task('babel', () => {
  return gulp.src(paths.es6)
  .pipe(sourcemaps.init())
  .pipe(babel())
  .pipe(sourcemaps.write('.', { sourceRoot: paths.sourceRoot }))
  .pipe(gulp.dest(paths.es5));
});

gulp.task('watch', () => {
  gulp.watch(paths.es6, ['babel']);
});

gulp.task('default', ['watch']);
