# 1. Открыть папку в VS Code
# 2. Открыть терминал (Ctrl + `)
# 3. Запустить сборку
npx gulp watch

# 4. Редактировать код, сохранять
# 5. По окончании: Ctrl + C

# Если не запускается (Windows PowerShell)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# ==================== ЗАГРУЗКА НА GITHUB ====================

# Проверить статус изменений
git status

# Добавить все изменения
git add .

# Создать коммит (замените текст на свой)
git commit -m "feat: описание изменений"

# Отправить на GitHub
git push origin master

# ==================== ПРИМЕРЫ КОММИТОВ ====================

git commit -m "feat: добавил Best of 3 для гранд-финала"
git commit -m "fix: исправил центровку Best of 3"
git commit -m "style: обновил дизайн кнопки Кубок 2026"
git commit -m "feat: готовая сборка"

# ==================== БЫСТРАЯ ЗАГРУЗКА ====================

git add .
git commit -m "feat: изменил 2 best"
git push origin master

# ==================== СТРУКТУРА ПРОЕКТА ====================

project/
├── index.html              # Главная страница
├── styles.css              # Исходные стили
├── styles.min.css          # Минифицированные стили
├── js/
│   ├── main.js             # Исходный JS
│   └── main.min.js         # Минифицированный JS
├── image/                  # Изображения
├── favicon/                # Иконки
├── gulpfile.js             # Сборка
├── package.json            # Зависимости
└── README.md               # Инструкция