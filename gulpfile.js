const gulp = require('gulp');
const terser = require('gulp-terser');
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');
const fs = require('fs');

// Минификация JavaScript с поддержкой ES6
function minifyJS() {
    console.log('📁 Начинаю обработку js/main.js');
    
    if (!fs.existsSync('js/main.js')) {
        console.error('❌ Файл js/main.js не найден!');
        return;
    }
    
    console.log('✅ Файл js/main.js найден, размер:', fs.statSync('js/main.js').size, 'байт');
    
    return gulp.src('js/main.js')
        .pipe(terser({
            compress: {
                drop_console: false,  // Не удаляем console.log (временно)
                drop_debugger: true,
                passes: 1
            },
            mangle: true,
            output: {
                beautify: false,
                comments: false
            },
            ecma: 2020,  // Поддержка ES2020
            module: true // Включаем поддержку модулей
        }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('js'))
        .on('end', function() {
            if (fs.existsSync('js/main.min.js')) {
                const size = fs.statSync('js/main.min.js').size;
                console.log('✅ Файл main.min.js создан! Размер:', size, 'байт');
                if (size < 1000) {
                    console.warn('⚠️ Внимание! Файл слишком маленький. Возможно, ошибка в main.js');
                }
            } else {
                console.error('❌ Файл main.min.js не был создан!');
            }
        })
        .on('error', function(err) {
            console.error('❌ Ошибка при минификации:', err.message);
        });
}

// Минификация CSS
function minifyCSS() {
    console.log('📁 Начинаю обработку styles.css');
    
    return gulp.src('styles.css')
        .pipe(cleanCSS({ level: 2 }))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest('.'))
        .on('end', function() {
            console.log('✅ Файл styles.min.css создан!');
        })
        .on('error', function(err) {
            console.error('❌ Ошибка:', err);
        });
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