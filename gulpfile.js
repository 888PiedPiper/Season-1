const gulp = require('gulp');
const terser = require('gulp-terser');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');

// Минификация JavaScript
function minifyJS() {
    return gulp.src('js/main.js')
        .pipe(terser({
            compress: {
                drop_console: true,
                drop_debugger: true
            },
            mangle: true
        }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('js'));
}

// Минификация CSS
function minifyCSS() {
    return gulp.src('styles.css')
        .pipe(cleanCSS({ level: 2 }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('.'));
}

// Задача по умолчанию
exports.default = gulp.parallel(minifyJS, minifyCSS);

// Следим за изменениями
exports.watch = function() {
    console.log('👀 Слежу за изменениями...');
    console.log('📁 Изменения main.js или styles.css');
    console.log('🔄 При сохранении файлы пересоберутся автоматически');
    console.log('Ctrl+C для остановки');
    
    gulp.watch('js/main.js', minifyJS);
    gulp.watch('styles.css', minifyCSS);
};