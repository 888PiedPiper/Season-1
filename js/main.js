// ==================== НАСТРОЙКИ ====================
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycby9bB7ekAcvbnaai8_etUlUJwVbxqrrBhcKtmZWrtqzoiDeNUy_uAioervMt1L10B-l/exec';
const SHEET_ID = '1CeJjGHytehxVIxSxY_j_mx84EvGzKJNA5x9y9n-MSBs';
const API_KEY = 'AIzaSyCB_5jPpU-GtKmmzx8FTTu33WtbNntxGvg';
const TEAM_ROSTERS_URL = 'https://script.google.com/macros/s/AKfycbwv0BDy61n6t7Cmlvg9pVusvSwLnTNNkIVhcBsxknzGXnAgW4YrM5Eg7eQtCAukQ4ju/exec';

// ==================== ЗАЩИТА ОТ ОШИБОК JSONP ====================
const JSONP_RETRY_COUNT = 2; // Количество повторных попыток
const JSONP_TIMEOUT = 30000; // 30 секунд таймаут
const JSONP_RETRY_DELAY = 1500; // 1.5 секунды между попытками

// ==================== КЕШИРОВАНИЕ ====================
const CACHE_KEY = 'tournament_cache';
// Увеличиваем время кеша для зрителей до 15 минут
const CACHE_DURATION_USER = 15 * 60 * 1000; // 15 минут
// Ключ для кеша составов команд
const TEAM_ROSTERS_CACHE_KEY = 'team_rosters_cache';
// Время жизни кеша составов - 1 час
const TEAM_ROSTERS_CACHE_DURATION = 60 * 60 * 1000; // 1 час
// Ключ для кеша прогнозов
const PREDICTION_CACHE_KEY = 'prediction_cache';
// Время жизни кеша прогнозов - 15 минут
const PREDICTION_CACHE_DURATION = 15 * 60 * 1000; // 15 минут
// Ключ для кеша регламента
const RULES_CACHE_KEY = 'rules_cache';
// Время жизни кеша регламента - 1 час (регламент меняется редко)
const RULES_CACHE_DURATION = 60 * 60 * 1000; // 1 час
// Ключ для хеша обновлений (для легкого запроса)
const LAST_UPDATE_KEY = 'last_update_hash';
let isAdmin = false;

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
let tournamentData = {
    groups: { A: { teams: [], matches: [] }, B: { teams: [], matches: [] } },
    playoffs: {
        upperFinal: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' },
        lowerSemi: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' },
        lowerFinal: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' },
        grandFinal: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' }
    }
};

let scheduleData = {
    periodStart: null, periodEnd: null,
    qfStart: null, qfEnd: null,
    sfStart: null, sfEnd: null,
    final: null,
    prizePool: ''
};

let prizeData = {
    1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: ''
};

let teamRostersCache = null;
let teamTotalPowerCache = {};

let remainingTeamsAll = [];
let currentDrawStep = 0;
let groupATeamsList = [];
let groupBTeamsList = [];
let timerInterval = null;

let tempPlayoffDates = {
    upperFinal: '', lowerSemi: '', lowerFinal: '', grandFinal: ''
};

let tempPlayoffStreamUrls = {
    upperFinal: '', lowerSemi: '', lowerFinal: '', grandFinal: ''
};

// ==================== ОТКЛЮЧЕНИЕ ЛОГОВ В ПРОДАКШЕНЕ ====================
// Раскомментировать для продакшена
if (window.location.hostname !== 'localhost' && !window.location.href.includes('127.0.0.1')) {
    console.log = function() {};
    console.debug = function() {};
    console.info = function() {};
    // console.warn и console.error оставляем для важных сообщений
}

// ==================== ПЕРЕВОДЫ ====================
const translations = {
    ru: {
        // ==================== ОСНОВНЫЕ ====================
        'tournament_title': 'Турнир — Kraken Chronicles',
        'tournament_subtitle': 'По игре Call of Dragons',
        'schedule_title': 'РАСПИСАНИЕ ТУРНИРА (UTC)',
        'tournament_period': 'НАЧАЛО/ОКОНЧАНИЕ ТУРНИРА:',
        'prize_pool': 'ПРИЗОВОЙ ФОНД:',
        'group_stage': 'ГРУППОВОЙ ЭТАП:',
        'playoffs': 'ПЛЕЙ-ОФФ:',
        'grand_final': 'ГРАНД-ФИНАЛ:',
        'next_match': 'До следующего матча:',
        'edit_schedule': 'Редактировать расписание',
        'save_schedule': 'Сохранить расписание',
        'warning_utc': '⚠️ ВСЕ ДАТЫ ВВОДЯТСЯ В UTC',
        'tournament_period_label': 'Период турнира (UTC)',
        'group_stage_label': 'Групповой этап (UTC)',
        'playoffs_label': 'Плей-офф (UTC)',
        'grand_final_label': 'Гранд-финал (UTC)',
        'prize_pool_label': 'Призовой фонд',
        'start': 'Начало',
        'end': 'Окончание',

        // ==================== ЖЕРЕБЬЁВКА ====================
        'draw_title': 'ЖЕРЕБЬЁВКА КОМАНД (2 группы по 4 команды)',
        'draw_info': 'Введите названия 8 команд ниже. Нажимайте кнопки по очереди, чтобы распределить команды по группам.',
        'draw_group_a': 'Группа A — 4 команды',
        'draw_group_b': 'Группа B — 4 команды',
        'team': 'Команда',
        'avatar_url': 'Ссылка на аватар (URL)',
        'draw_to_group_a': 'В группу A (команды 1-2)',
        'draw_to_group_b': 'В группу B (команды 3-4)',
        'draw_to_group_a2': 'В группу A (команды 5-6)',
        'draw_to_group_b2': 'В группу B (команды 7-8)',
        'save_draw': 'Сохранить жеребьёвку',
        'clear_teams': 'Очистить команды',

        // ==================== ГРУППОВОЙ ЭТАП ====================
        'group_stage_title': 'ГРУППОВОЙ ЭТАП',
        'group': 'ГРУППА',
        'everyone_with_everyone': 'каждый с каждым — 3 матча на команду',
        'team_header': 'КОМАНДА',
        'wins_header': 'ПОБЕДЫ',
        'points_header': 'ОЧКИ',
        'matches_header': 'МАТЧИ ГРУППЫ',
        'waiting_draw': 'ожидание жеребьёвки',
        'placeholder_text': 'Команды будут распределены после жеребьёвки',
        'eliminated': 'вылет',

        // ==================== ПЛЕЙ-ОФФ ====================
        'playoffs_title': 'ПЛЕЙ-ОФФ',
        'upper_bracket': 'ВЕРХНЯЯ СЕТКА',
        'lower_bracket': 'НИЖНЯЯ СЕТКА (LOSERS)',
        'lower_semi': 'ПОЛУФИНАЛ',
        'lower_final': 'ФИНАЛ',
        'grand_final_title': 'ГРАНД-ФИНАЛ',
        'winner_label': 'ПОБЕДИТЕЛЬ:',
        'champion': 'ЧЕМПИОН:',

        // ==================== РЕЗУЛЬТАТЫ ====================
        'results_title': 'РЕЗУЛЬТАТЫ ТУРНИРА',
        'place_header': 'МЕСТО',
        'team_header_results': 'КОМАНДА',
        'wins_header_results': 'ПОБЕДЫ',
        'points_header_results': 'ОЧКИ',
        'prize_header': 'ПРИЗ',

        // ==================== АДМИН-ПАНЕЛЬ ====================
        'admin_title': 'Доступ администратора',
        'admin_password': 'Введите пароль',
        'admin_login': 'Войти',
        'admin_edit_matches': 'Редактирование матчей',
        'admin_prizes': 'ПРИЗОВОЙ ФОНД ПО МЕСТАМ',
        'admin_place': 'МЕСТО',
        'admin_save_prizes': 'СОХРАНИТЬ ПРИЗЫ',
        'admin_save_sheet': 'Сохранить в Google таблицу',
        'admin_full_reset': 'Полный сброс турнира',
        'admin_save_avatars': 'Сохранить жеребьёвку',
        'admin_reset_draw': 'Сбросить жеребьёвку',
        'save': 'СОХРАНИТЬ',

        // ==================== ОБЩИЕ ====================
        'live': 'LIVE',
        'vs': 'VS',
        'date_not_set': 'Дата не назначена',
        'on_air': 'В ЭФИРЕ!',
        'champion_text': 'ЧЕМПИОН',

        // ==================== РЕГЛАМЕНТ ====================
        'rules_title': 'РЕГЛАМЕНТ ТУРНИРА',
        'add_section': '+ ДОБАВИТЬ СЕКЦИЮ',
        'save_rules': 'СОХРАНИТЬ',
        'reset_rules': 'СБРОСИТЬ',
        'loading': 'Загрузка регламента...',
        'empty_rules': 'Регламент пока не заполнен',
        'new_section': 'Новая секция',
        'empty_content': 'Содержание не заполнено',

        // ==================== СТАТУСЫ ====================
        'status_saving': 'Сохранение...',
        'status_saved': 'Сохранено!',
        'status_error': 'Ошибка:',
        'status_admin_required': 'Требуется авторизация администратора',
        'status_draw_completed': 'Жеребьёвка завершена!',
        'status_draw_not_completed': 'Жеребьёвка не завершена!',
        'status_cleared': 'Все названия команд очищены',
        'status_full_reset': 'Полный сброс турнира...',
        'status_full_reset_done': 'Полный сброс выполнен!',
        'status_saving_avatars': 'Сохранение команд и аватаров...',
        'status_avatars_saved': 'Команды и аватары сохранены!',
        'status_saving_prizes': 'Сохранение призов...',
        'status_prizes_saved': 'Призы сохранены!',
        'status_saving_schedule': 'Сохранение расписания...',
        'status_schedule_saved': 'Расписание сохранено!',
        'status_saving_draw': 'Сохранение жеребьёвки...',
        'status_draw_saved': 'Жеребьёвка сохранена!',
        'status_saving_tournament': 'Сохранение...',
        'status_tournament_saved': 'Сохранено!',
        'status_password_check': 'Проверка пароля...',
        'status_admin_activated': 'Доступ администратора активирован',
        'status_wrong_password': 'Неверный пароль',
        'status_enter_password': 'Введите пароль',
        'status_auth_required': 'Сначала авторизуйтесь как администратор',
        'status_draw_already_completed': 'Жеребьёвка уже завершена!',
        'status_wrong_turn': 'Сейчас не ваш ход! Ожидается шаг',
        'status_team_not_filled': 'Команда {num} не заполнена!',
        'status_not_enough_teams': 'Недостаточно команд для жеребьёвки',
        'status_draw_reset': 'Жеребьёвка сброшена.',
        'status_exit_admin': 'Выход из режима администратора',

        // ==================== АДМИН МАТЧЕЙ ====================
        'admin_score': 'СЧЁТ',
        'admin_points': 'ОЧКИ',
        'admin_date': 'ДАТА',
        'admin_link': 'LINK',
        'admin_save': 'СОХРАНИТЬ',
        'admin_score1': 'Счёт 1',
        'admin_score2': 'Счёт 2',
        'admin_points1': 'Очки 1',
        'admin_points2': 'Очки 2',
        'admin_live_url': 'LIVE URL',
        'admin_winner': 'ПОБЕДИТЕЛЬ:',

        // ==================== РЕГЛАМЕНТ АДМИН ====================
        'rules_empty_sections': 'Нет секций. Нажмите "Добавить секцию".',
        'rules_load_error': 'Ошибка загрузки регламента',
        'rules_saving': 'Сохранение регламента...',
        'rules_saved': 'Регламент сохранён!',
        'rules_save_empty_error': 'Нельзя сохранить пустой регламент',
        'rules_resetting': 'Сброс регламента...',
        'rules_reset_done': 'Регламент сброшен к стандарту!',
        'new_section_default': 'Новая секция',
        'new_content_default': 'Текст новой секции...',

        // ==================== ЖЕРЕБЬЁВКА СТАТУС ====================
        'draw_status_title': 'Распределение по группам:',
        'draw_group_a_label': 'Группа A:',
        'draw_group_b_label': 'Группа B:',
        'draw_teams_left': 'Осталось команд:',
        'draw_completed_message': 'Жеребьёвка завершена! Нажмите "Сохранить жеребьёвку".',
        'draw_waiting_message': 'пока пусто',
        'team_not_filled_error': 'Команда {num} не заполнена!',
        'group_added_success': 'Команды добавлены в группу {group}',
        'draw_completed_success': 'Жеребьёвка завершена!',
        'team_placeholder': 'Название команды',
        'avatar_placeholder': 'Ссылка на аватар (URL)',
        'prize_placeholder': 'Сумма или приз',

        // ==================== ПРОГНОЗЫ ====================
        'prediction_modal_title': 'ТУРНИР ПРОГНОЗОВ',
        'export_ranking_button': 'ЭКСПОРТ СПИСКА УЧАСТНИКОВ',
        'search_placeholder': '🔍︎ Поиск участника...',
        'prediction_status_active': 'ПРИЁМ ПРОГНОЗОВ',
        'prediction_status_closed': 'ПРОГНОЗЫ ЗАКРЫТЫ',
        'prediction_status_upcoming': 'СКОРО',
        'arena_status_active': 'ПРИЁМ ГОЛОСОВ',
        'arena_status_closed': 'ГОЛОСОВАНИЕ ЗАКРЫТО',
        'arena_status_upcoming': 'СКОРО',
        'arena_votes_name': 'АРЕНА ГОЛОСОВ',
        'group_stage_name': 'ГРУППОВОЙ ЭТАП',
        'playoffs_name': 'ПЛЕЙ-ОФФ',
        'grand_final_name': 'ГРАНД-ФИНАЛ',
        'prediction_chart_title_arena': 'РЕЙТИНГ ЗРИТЕЛЬСКИХ СИМПАТИЙ',
        'prediction_chart_title_default': 'РАСПРЕДЕЛЕНИЕ ПРОГНОЗОВ',
        'prediction_rankings_title': 'РЕЙТИНГ УЧАСТНИКОВ',
        'ranking_category_perfect': 'УГАДАЛИ 4 КОМАНДЫ',
        'ranking_category_three': 'УГАДАЛИ 3 КОМАНДЫ',
        'ranking_category_two': 'УГАДАЛИ 2 КОМАНДЫ',
        'ranking_category_one': 'УГАДАЛИ 1 КОМАНДУ',
        'ranking_category_correct': 'УГАДАЛИ ЧЕМПИОНА',
        'ranking_category_wrong': 'НЕ УГАДАЛИ',

        // ==================== FAB / КНОПКИ ====================
        'trophy_fab_text': 'КУБОК 2026',
        'prediction_fab_tooltip': 'ПРОГНОЗЫ',

        // ==================== ЗАГРУЗЧИК ====================
        'page_loader_text': 'Загрузка турнирных данных...',

        // ==================== ДЕДЛАЙНЫ ====================
        'voting_deadline_until_tournament_end': 'Голосование открыто до окончания турнира:',
        'predictions_deadline_before_first_match': 'Прогнозы принимаются до начала первого матча:',
        'predictions_deadline_before_match': 'Прогнозы принимаются до начала матча:',
        'predictions_deadline_until': 'Приём прогнозов до:',

        // ==================== КНОПКИ ====================
        'leave_prediction_button': 'ОСТАВИТЬ ПРОГНОЗ',
        'support_team_button': 'ПОДДЕРЖАТЬ КОМАНДУ',

        // ==================== ОБЩИЕ СООБЩЕНИЯ ====================
        'no_participants': 'Нет участников',
        'loading_data': 'Загрузка данных...',
        'will_be_available_after_group_stage': 'Будет доступен после завершения группового этапа',
        'will_be_available_after_grand_final_teams': 'Будет доступен после определения команд в гранд-финале',
        'will_be_available_after_grand_final': 'Будет доступен после завершения гранд-финала',
        'loading_ranking': 'Загрузка рейтинга...',
        'error_loading_data': 'Ошибка загрузки данных',
        'no_data_to_display': 'Нет данных для отображения',
        'loading_3d_model': 'Загрузка 3D модели...',

        // ==================== ФУТЕР ====================
        'footer_copyright': '© Сайт создан игроком Call of Dragons: [888] PiedPiper, ID: 24165550',
        'footer_support_text': 'Оставить пожелание, поддержку для воплощения новых идей можно тут:',
        'fund_support_label': 'УВЕЛИЧИТЬ ФОНД:',
        'fund_support_link': 'ALERTS',
        'fund_support_tooltip': 'Поддержать призовой фонд',
        'fund_support_placeholder': 'Ссылка будет добавлена позже',

        // ==================== ДОПОЛНИТЕЛЬНЫЕ ПЕРЕВОДЫ ====================
        'data_synced': 'Данные синхронизируются с Google Sheets',
        'loading_rules': 'Загрузка регламента...',
        'status_warning': 'Предупреждение',
        'admin_notification': '🔓 Админ-панель разблокирована. Введите пароль.',
        'confirm_clear_teams': 'Очистить все названия команд?',
        'confirm_reset_draw': 'Сброс жеребьёвки очистит все распределение команд по группам. Продолжить?',
        'confirm_full_reset': 'ПОЛНЫЙ СБРОС ТУРНИРА\n\nЭто действие:\n- Удалит все названия команд\n- Обнулит все счета и очки\n- Очистит победителей\n- Сбросит расписание\n- Очистит аватары команд\n- Покажет блок жеребьёвки\n\nПродолжить?',
        'confirm_delete_section': 'Удалить эту секцию?',
        'confirm_reset_rules': 'Сбросить регламент к стандартным значениям?',
        'trophy_2026_title': 'КУБОК 2026',

        // ==================== НОВЫЕ ПЕРЕВОДЫ (ДОБАВЛЕНЫ) ====================
        'Сохранение...': 'Сохранение...',
        'СОХРАНЕНИЕ...': 'СОХРАНЕНИЕ...',
        '✓ СОХРАНЕНО': '✓ СОХРАНЕНО',
        '✗ ОШИБКА': '✗ ОШИБКА',
        'СОХРАНЯЮ...': 'СОХРАНЯЮ...',
        'Загрузка регламента...': 'Загрузка регламента...',
        'Ошибка загрузки': 'Ошибка загрузки',
        'Данные турнира обновлены!': 'Данные турнира обновлены!',
        'Обновление': 'Обновление',
        'Загрузка...': 'Загрузка...',
        'Проверка пароля...': 'Проверка пароля...',
        'Сбор данных для экспорта...': 'Сбор данных для экспорта...',
        'Данные экспортированы успешно!': 'Данные экспортированы успешно!',
        'Ошибка экспорта данных': 'Ошибка экспорта данных',
        'Импорт данных...': 'Импорт данных...',
        'Импорт данных выполнен успешно!': 'Импорт данных выполнен успешно!',
        'Ошибка импорта: неверный формат файла': 'Ошибка импорта: неверный формат файла',
        'Сохранить в Google таблицу': 'Сохранить в Google таблицу',
        'Не удалось загрузить составы команд': 'Не удалось загрузить составы команд',
        '✅ MVP сохранены! Обновлено: ': '✅ MVP сохранены! Обновлено: ',
        '❌ Ошибка: ': '❌ Ошибка: ',
        '❌ Ошибка сохранения': '❌ Ошибка сохранения',
        'Управление MVP': 'Управление MVP',
        '💾 Сохранить MVP': '💾 Сохранить MVP',
        'Закрыть': 'Закрыть',
        'Призы успешно сохранены': 'Призы успешно сохранены',
        'Не удалось сохранить призы': 'Не удалось сохранить призы',
        'Ошибка при сохранении призов': 'Ошибка при сохранении призов',
        'Все данные успешно сохранены в Google Sheets': 'Все данные успешно сохранены в Google Sheets',
        'Сохранение': 'Сохранение',
        'Кубок 2026': 'Кубок 2026',
        'ПРОГНОЗЫ': 'ПРОГНОЗЫ',
        'MVP': 'MVP',
        'По игре Call of Dragons': 'По игре Call of Dragons',
        'Регламент турнира / Tournament rules': 'Регламент турнира / Tournament rules',
        'РАСПИСАНИЕ ТУРНИРА (UTC)': 'РАСПИСАНИЕ ТУРНИРА (UTC)',
        'НАЧАЛО/ОКОНЧАНИЕ ТУРНИРА:': 'НАЧАЛО/ОКОНЧАНИЕ ТУРНИРА:',
        'ПРИЗОВОЙ ФОНД:': 'ПРИЗОВОЙ ФОНД:',
        'УВЕЛИЧИТЬ ФОНД:': 'УВЕЛИЧИТЬ ФОНД:',
        'ГРУППОВОЙ ЭТАП:': 'ГРУППОВОЙ ЭТАП:',
        'ПЛЕЙ-ОФФ:': 'ПЛЕЙ-ОФФ:',
        'ГРАНД-ФИНАЛ:': 'ГРАНД-ФИНАЛ:',
        'До следующего матча:': 'До следующего матча:',
        'Редактировать расписание': 'Редактировать расписание',
        'Сохранить расписание': 'Сохранить расписание',
        '⚠️ ВСЕ ДАТЫ ВВОДЯТСЯ В UTC': '⚠️ ВСЕ ДАТЫ ВВОДЯТСЯ В UTC',
        'Период турнира (UTC)': 'Период турнира (UTC)',
        'Групповой этап (UTC)': 'Групповой этап (UTC)',
        'Плей-офф (UTC)': 'Плей-офф (UTC)',
        'Гранд-финал (UTC)': 'Гранд-финал (UTC)',
        'Призовой фонд': 'Призовой фонд',
        'Начало': 'Начало',
        'Окончание': 'Окончание',
        'ЖЕРЕБЬЁВКА КОМАНД (2 группы по 4 команды)': 'ЖЕРЕБЬЁВКА КОМАНД (2 группы по 4 команды)',
        'Введите названия 8 команд ниже. Нажимайте кнопки по очереди, чтобы распределить команды по группам.': 'Введите названия 8 команд ниже. Нажимайте кнопки по очереди, чтобы распределить команды по группам.',
        'Группа A — 4 команды': 'Группа A — 4 команды',
        'Группа B — 4 команды': 'Группа B — 4 команды',
        'Команда': 'Команда',
        'Ссылка на аватар (URL)': 'Ссылка на аватар (URL)',
        'В группу A (команды 1-2)': 'В группу A (команды 1-2)',
        'В группу B (команды 3-4)': 'В группу B (команды 3-4)',
        'В группу A (команды 5-6)': 'В группу A (команды 5-6)',
        'В группу B (команды 7-8)': 'В группу B (команды 7-8)',
        'Сохранить жеребьёвку': 'Сохранить жеребьёвку',
        'Очистить команды': 'Очистить команды',
        'ГРУППОВОЙ ЭТАП': 'ГРУППОВОЙ ЭТАП',
        'ГРУППА': 'ГРУППА',
        'КОМАНДА': 'КОМАНДА',
        'ПОБЕДЫ': 'ПОБЕДЫ',
        'ОЧКИ': 'ОЧКИ',
        'МАТЧИ ГРУППЫ': 'МАТЧИ ГРУППЫ',
        'ПЛЕЙ-ОФФ': 'ПЛЕЙ-ОФФ',
        'ВЕРХНЯЯ СЕТКА': 'ВЕРХНЯЯ СЕТКА',
        'НИЖНЯЯ СЕТКА (LOSERS)': 'НИЖНЯЯ СЕТКА (LOSERS)',
        'ПОЛУФИНАЛ': 'ПОЛУФИНАЛ',
        'ФИНАЛ': 'ФИНАЛ',
        'ГРАНД-ФИНАЛ': 'ГРАНД-ФИНАЛ',
        'РЕЗУЛЬТАТЫ ТУРНИРА': 'РЕЗУЛЬТАТЫ ТУРНИРА',
        'МЕСТО': 'МЕСТО',
        'ПРИЗ': 'ПРИЗ',
        'Доступ администратора': 'Доступ администратора',
        'Введите пароль': 'Введите пароль',
        'Войти': 'Войти',
        'Редактирование матчей': 'Редактирование матчей',
        'ПРИЗОВОЙ ФОНД ПО МЕСТАМ': 'ПРИЗОВОЙ ФОНД ПО МЕСТАМ',
        'СОХРАНИТЬ ПРИЗЫ': 'СОХРАНИТЬ ПРИЗЫ',
        'ПОЛНЫЙ СБРОС ТУРНИРА': 'ПОЛНЫЙ СБРОС ТУРНИРА',
        'РЕГЛАМЕНТ ТУРНИРА': 'РЕГЛАМЕНТ ТУРНИРА',
        '+ ДОБАВИТЬ СЕКЦИЮ': '+ ДОБАВИТЬ СЕКЦИЮ',
        'СОХРАНИТЬ': 'СОХРАНИТЬ',
        'СБРОСИТЬ': 'СБРОСИТЬ',
        'Регламент пока не заполнен': 'Регламент пока не заполнен',
        'Новая секция': 'Новая секция',
        'Содержание не заполнено': 'Содержание не заполнено',
        'КУБОК 2026': 'КУБОК 2026',
        'Загрузка 3D модели...': 'Загрузка 3D модели...',
        'Сайт создан игроком Call of Dragons: [888] PiedPiper, ID: 24165550': 'Сайт создан игроком Call of Dragons: [888] PiedPiper, ID: 24165550',
        'Оставить пожелание, поддержку для воплощения новых идей можно тут:': 'Оставить пожелание, поддержку для воплощения новых идей можно тут:',
        'DONATIONALERTS': 'DONATIONALERTS',
        'ALERTS': 'ALERTS',
        'Сохранение...': 'Сохранение...',
        'data_tournament_updated': 'Данные турнира обновлены!',
        'update': 'Обновление',
        'data_saved_to_google': 'Все данные успешно сохранены в Google Sheets',
        'saving': 'Сохранение',
        'error_saving_to_google': 'Ошибка сохранения в Google Sheets',
        'error': 'Ошибка',
        'waiting_for_matches': 'ОЖИДАНИЕ МАТЧЕЙ',
        'match_1': 'Матч 1',
        'match_2': 'Матч 2',
        'match_3': 'Матч 3',
    },
    en: {
        // ==================== ОСНОВНЫЕ ====================
        'tournament_title': 'Tournament — Kraken Chronicles',
        'tournament_subtitle': 'Call of Dragons Tournament',
        'schedule_title': 'TOURNAMENT SCHEDULE (UTC)',
        'tournament_period': 'TOURNAMENT PERIOD:',
        'prize_pool': 'PRIZE POOL:',
        'group_stage': 'GROUP STAGE:',
        'playoffs': 'PLAYOFFS:',
        'grand_final': 'GRAND FINAL:',
        'next_match': 'Next match starts in:',
        'edit_schedule': 'Edit schedule',
        'save_schedule': 'Save schedule',
        'warning_utc': '⚠️ ALL DATES ARE IN UTC',
        'tournament_period_label': 'Tournament period (UTC)',
        'group_stage_label': 'Group stage (UTC)',
        'playoffs_label': 'Playoffs (UTC)',
        'grand_final_label': 'Grand final (UTC)',
        'prize_pool_label': 'Prize pool',
        'start': 'Start',
        'end': 'End',

        // ==================== ЖЕРЕБЬЁВКА ====================
        'draw_title': 'TEAM DRAW (2 groups of 4 teams)',
        'draw_info': 'Enter 8 team names below. Click buttons in order to distribute teams into groups.',
        'draw_group_a': 'Group A — 4 teams',
        'draw_group_b': 'Group B — 4 teams',
        'team': 'Team',
        'avatar_url': 'Avatar URL',
        'draw_to_group_a': 'To Group A (teams 1-2)',
        'draw_to_group_b': 'To Group B (teams 3-4)',
        'draw_to_group_a2': 'To Group A (teams 5-6)',
        'draw_to_group_b2': 'To Group B (teams 7-8)',
        'save_draw': 'Save draw',
        'clear_teams': 'Clear teams',

        // ==================== ГРУППОВОЙ ЭТАП ====================
        'group_stage_title': 'GROUP STAGE',
        'group': 'GROUP',
        'everyone_with_everyone': 'round robin — 3 matches per team',
        'team_header': 'TEAM',
        'wins_header': 'WINS',
        'points_header': 'POINTS',
        'matches_header': 'GROUP MATCHES',
        'waiting_draw': 'waiting for draw',
        'placeholder_text': 'Teams will be distributed after the draw',
        'eliminated': 'eliminated',

        // ==================== ПЛЕЙ-ОФФ ====================
        'playoffs_title': 'PLAYOFFS',
        'upper_bracket': 'UPPER BRACKET',
        'lower_bracket': 'LOWER BRACKET (LOSERS)',
        'lower_semi': 'SEMIFINAL',
        'lower_final': 'FINAL',
        'grand_final_title': 'GRAND FINAL',
        'winner_label': 'WINNER:',
        'champion': 'CHAMPION:',

        // ==================== РЕЗУЛЬТАТЫ ====================
        'results_title': 'TOURNAMENT RESULTS',
        'place_header': 'PLACE',
        'team_header_results': 'TEAM',
        'wins_header_results': 'WINS',
        'points_header_results': 'POINTS',
        'prize_header': 'PRIZE',

        // ==================== АДМИН-ПАНЕЛЬ ====================
        'admin_title': 'Admin Access',
        'admin_password': 'Enter password',
        'admin_login': 'Login',
        'admin_edit_matches': 'Match Editor',
        'admin_prizes': 'PRIZES BY PLACE',
        'admin_place': 'PLACE',
        'admin_save_prizes': 'SAVE PRIZES',
        'admin_save_sheet': 'Save to Google Sheet',
        'admin_full_reset': 'Full Tournament Reset',
        'admin_save_avatars': 'Save Avatars',
        'admin_reset_draw': 'Reset Draw',
        'save': 'SAVE',

        // ==================== ОБЩИЕ ====================
        'live': 'LIVE',
        'vs': 'VS',
        'date_not_set': 'Date not set',
        'on_air': 'ON AIR!',
        'champion_text': 'CHAMPION',

        // ==================== РЕГЛАМЕНТ ====================
        'rules_title': 'TOURNAMENT RULES',
        'add_section': '+ ADD SECTION',
        'save_rules': 'SAVE',
        'reset_rules': 'RESET',
        'loading': 'Loading rules...',
        'empty_rules': 'Rules not yet filled',
        'new_section': 'New Section',
        'empty_content': 'Content not filled',

        // ==================== СТАТУСЫ ====================
        'status_saving': 'Saving...',
        'status_saved': 'Saved!',
        'status_error': 'Error:',
        'status_admin_required': 'Admin authorization required',
        'status_draw_completed': 'Draw completed!',
        'status_draw_not_completed': 'Draw not completed!',
        'status_cleared': 'All team names cleared',
        'status_full_reset': 'Full tournament reset...',
        'status_full_reset_done': 'Full reset completed!',
        'status_saving_avatars': 'Saving teams and avatars...',
        'status_avatars_saved': 'Teams and avatars saved!',
        'status_saving_prizes': 'Saving prizes...',
        'status_prizes_saved': 'Prizes saved!',
        'status_saving_schedule': 'Saving schedule...',
        'status_schedule_saved': 'Schedule saved!',
        'status_saving_draw': 'Saving draw...',
        'status_draw_saved': 'Draw saved!',
        'status_saving_tournament': 'Saving...',
        'status_tournament_saved': 'Saved!',
        'status_password_check': 'Checking password...',
        'status_admin_activated': 'Admin access activated',
        'status_wrong_password': 'Wrong password',
        'status_enter_password': 'Enter password',
        'status_auth_required': 'Please login as admin first',
        'status_draw_already_completed': 'Draw already completed!',
        'status_wrong_turn': 'Not your turn! Expected step',
        'status_team_not_filled': 'Team {num} is not filled!',
        'status_not_enough_teams': 'Not enough teams for draw',
        'status_draw_reset': 'Draw reset.',
        'status_exit_admin': 'Exiting admin mode',

        // ==================== АДМИН МАТЧЕЙ ====================
        'admin_score': 'SCORE',
        'admin_points': 'POINTS',
        'admin_date': 'DATE',
        'admin_link': 'LINK',
        'admin_save': 'SAVE',
        'admin_score1': 'Score 1',
        'admin_score2': 'Score 2',
        'admin_points1': 'Points 1',
        'admin_points2': 'Points 2',
        'admin_live_url': 'LIVE URL',
        'admin_winner': 'WINNER:',

        // ==================== РЕГЛАМЕНТ АДМИН ====================
        'rules_empty_sections': 'No sections. Click "Add section".',
        'rules_load_error': 'Error loading rules',
        'rules_saving': 'Saving rules...',
        'rules_saved': 'Rules saved!',
        'rules_save_empty_error': 'Cannot save empty rules',
        'rules_resetting': 'Resetting rules...',
        'rules_reset_done': 'Rules reset to default!',
        'new_section_default': 'New Section',
        'new_content_default': 'New section content...',

        // ==================== ЖЕРЕБЬЁВКА СТАТУС ====================
        'draw_status_title': 'Group distribution:',
        'draw_group_a_label': 'Group A:',
        'draw_group_b_label': 'Group B:',
        'draw_teams_left': 'Teams left:',
        'draw_completed_message': 'Draw completed! Click "Save draw".',
        'draw_waiting_message': 'empty',
        'team_not_filled_error': 'Team {num} is not filled!',
        'group_added_success': 'Teams added to group {group}',
        'draw_completed_success': 'Draw completed!',
        'team_placeholder': 'Team name',
        'avatar_placeholder': 'Avatar URL',
        'prize_placeholder': 'Prize amount',

        // ==================== ПРОГНОЗЫ ====================
        'prediction_modal_title': 'PREDICTION TOURNAMENT',
        'export_ranking_button': 'EXPORT PARTICIPANTS LIST',
        'search_placeholder': '🔍︎ Search participant...',
        'prediction_status_active': 'ACCEPTING PREDICTIONS',
        'prediction_status_closed': 'PREDICTIONS CLOSED',
        'prediction_status_upcoming': 'SOON',
        'arena_status_active': 'ACCEPTING VOTES',
        'arena_status_closed': 'VOTING CLOSED',
        'arena_status_upcoming': 'SOON',
        'arena_votes_name': 'ARENA VOTES',
        'group_stage_name': 'GROUP STAGE',
        'playoffs_name': 'PLAYOFFS',
        'grand_final_name': 'GRAND FINAL',
        'prediction_chart_title_arena': 'SPECTATOR RATING',
        'prediction_chart_title_default': 'PREDICTION DISTRIBUTION',
        'prediction_rankings_title': 'PARTICIPANTS RANKING',
        'ranking_category_perfect': 'GUESSED 4 TEAMS',
        'ranking_category_three': 'GUESSED 3 TEAMS',
        'ranking_category_two': 'GUESSED 2 TEAMS',
        'ranking_category_one': 'GUESSED 1 TEAM',
        'ranking_category_correct': 'GUESSED CHAMPION',
        'ranking_category_wrong': 'NOT GUESSED',

        // ==================== FAB / КНОПКИ ====================
        'trophy_fab_text': 'TROPHY 2026',
        'prediction_fab_tooltip': 'PREDICTIONS',

        // ==================== ЗАГРУЗЧИК ====================
        'page_loader_text': 'Loading tournament data...',

        // ==================== ДЕДЛАЙНЫ ====================
        'voting_deadline_until_tournament_end': 'Voting is open until the end of the tournament:',
        'predictions_deadline_before_first_match': 'Predictions accepted before the first match starts:',
        'predictions_deadline_before_match': 'Predictions accepted before the match starts:',
        'predictions_deadline_until': 'Predictions accepted until:',

        // ==================== КНОПКИ ====================
        'leave_prediction_button': 'LEAVE PREDICTION',
        'support_team_button': 'SUPPORT TEAM',

        // ==================== ОБЩИЕ СООБЩЕНИЯ ====================
        'no_participants': 'No participants',
        'loading_data': 'Loading data...',
        'will_be_available_after_group_stage': 'Will be available after the group stage ends',
        'will_be_available_after_grand_final_teams': 'Will be available after teams are determined in the grand final',
        'will_be_available_after_grand_final': 'Will be available after the grand final ends',
        'loading_ranking': 'Loading ranking...',
        'error_loading_data': 'Error loading data',
        'no_data_to_display': 'No data to display',
        'loading_3d_model': 'Loading 3D model...',

        // ==================== ФУТЕР ====================
        'footer_copyright': '© Website created by Call of Dragons player: [888] PiedPiper, ID: 24165550',
        'footer_support_text': 'Leave a wish or support for new ideas here:',
        'fund_support_label': 'INCREASE PRIZE POOL:',
        'fund_support_link': 'ALERTS',
        'fund_support_tooltip': 'Support the prize pool',
        'fund_support_placeholder': 'Link will be added later',

        // ==================== ДОПОЛНИТЕЛЬНЫЕ ПЕРЕВОДЫ ====================
        'data_synced': 'Data synchronized with Google Sheets',
        'loading_rules': 'Loading rules...',
        'status_warning': 'Warning',
        'admin_notification': '🔓 Admin panel unlocked. Enter password.',
        'confirm_clear_teams': 'Clear all team names?',
        'confirm_reset_draw': 'Reset draw? This will clear all team distribution. Continue?',
        'confirm_full_reset': 'FULL TOURNAMENT RESET\n\nThis will:\n- Delete all team names\n- Reset all scores and points\n- Clear winners\n- Reset schedule\n- Clear avatars\n- Show draw block\n\nContinue?',
        'confirm_delete_section': 'Delete this section?',
        'confirm_reset_rules': 'Reset rules to default?',
        'trophy_2026_title': 'TROPHY 2026',

        // ==================== НОВЫЕ ПЕРЕВОДЫ (ДОБАВЛЕНЫ) ====================
        'Сохранение...': 'Saving...',
        'СОХРАНЕНИЕ...': 'SAVING...',
        '✓ СОХРАНЕНО': '✓ SAVED',
        '✗ ОШИБКА': '✗ ERROR',
        'СОХРАНЯЮ...': 'SAVING...',
        'Загрузка регламента...': 'Loading rules...',
        'Ошибка загрузки': 'Loading error',
        'Данные турнира обновлены!': 'Tournament data updated!',
        'Обновление': 'Update',
        'Загрузка...': 'Loading...',
        'Проверка пароля...': 'Checking password...',
        'Сбор данных для экспорта...': 'Collecting data for export...',
        'Данные экспортированы успешно!': 'Data exported successfully!',
        'Ошибка экспорта данных': 'Export error',
        'Импорт данных...': 'Importing data...',
        'Импорт данных выполнен успешно!': 'Data imported successfully!',
        'Ошибка импорта: неверный формат файла': 'Import error: invalid file format',
        'Сохранить в Google таблицу': 'Save to Google Sheet',
        'Не удалось загрузить составы команд': 'Failed to load team rosters',
        '✅ MVP сохранены! Обновлено: ': '✅ MVP saved! Updated: ',
        '❌ Ошибка: ': '❌ Error: ',
        '❌ Ошибка сохранения': '❌ Save error',
        'Управление MVP': 'Manage MVP',
        '💾 Сохранить MVP': '💾 Save MVP',
        'Закрыть': 'Close',
        'Призы успешно сохранены': 'Prizes saved successfully',
        'Не удалось сохранить призы': 'Failed to save prizes',
        'Ошибка при сохранении призов': 'Error saving prizes',
        'Все данные успешно сохранены в Google Sheets': 'All data successfully saved to Google Sheets',
        'Сохранение': 'Saving',
        'Кубок 2026': 'Trophy 2026',
        'ПРОГНОЗЫ': 'PREDICTIONS',
        'MVP': 'MVP',
        'По игре Call of Dragons': 'Call of Dragons Tournament',
        'Регламент турнира / Tournament rules': 'Tournament rules',
        'РАСПИСАНИЕ ТУРНИРА (UTC)': 'TOURNAMENT SCHEDULE (UTC)',
        'НАЧАЛО/ОКОНЧАНИЕ ТУРНИРА:': 'TOURNAMENT PERIOD:',
        'ПРИЗОВОЙ ФОНД:': 'PRIZE POOL:',
        'УВЕЛИЧИТЬ ФОНД:': 'INCREASE PRIZE POOL:',
        'ГРУППОВОЙ ЭТАП:': 'GROUP STAGE:',
        'ПЛЕЙ-ОФФ:': 'PLAYOFFS:',
        'ГРАНД-ФИНАЛ:': 'GRAND FINAL:',
        'До следующего матча:': 'Next match starts in:',
        'Редактировать расписание': 'Edit schedule',
        'Сохранить расписание': 'Save schedule',
        '⚠️ ВСЕ ДАТЫ ВВОДЯТСЯ В UTC': '⚠️ ALL DATES ARE IN UTC',
        'Период турнира (UTC)': 'Tournament period (UTC)',
        'Групповой этап (UTC)': 'Group stage (UTC)',
        'Плей-офф (UTC)': 'Playoffs (UTC)',
        'Гранд-финал (UTC)': 'Grand final (UTC)',
        'Призовой фонд': 'Prize pool',
        'Начало': 'Start',
        'Окончание': 'End',
        'ЖЕРЕБЬЁВКА КОМАНД (2 группы по 4 команды)': 'TEAM DRAW (2 groups of 4 teams)',
        'Введите названия 8 команд ниже. Нажимайте кнопки по очереди, чтобы распределить команды по группам.': 'Enter 8 team names below. Click buttons in order to distribute teams into groups.',
        'Группа A — 4 команды': 'Group A — 4 teams',
        'Группа B — 4 команды': 'Group B — 4 teams',
        'Команда': 'Team',
        'Ссылка на аватар (URL)': 'Avatar URL',
        'В группу A (команды 1-2)': 'To Group A (teams 1-2)',
        'В группу B (команды 3-4)': 'To Group B (teams 3-4)',
        'В группу A (команды 5-6)': 'To Group A (teams 5-6)',
        'В группу B (команды 7-8)': 'To Group B (teams 7-8)',
        'Сохранить жеребьёвку': 'Save draw',
        'Очистить команды': 'Clear teams',
        'ГРУППОВОЙ ЭТАП': 'GROUP STAGE',
        'ГРУППА': 'GROUP',
        'КОМАНДА': 'TEAM',
        'ПОБЕДЫ': 'WINS',
        'ОЧКИ': 'POINTS',
        'МАТЧИ ГРУППЫ': 'GROUP MATCHES',
        'ПЛЕЙ-ОФФ': 'PLAYOFFS',
        'ВЕРХНЯЯ СЕТКА': 'UPPER BRACKET',
        'НИЖНЯЯ СЕТКА (LOSERS)': 'LOWER BRACKET (LOSERS)',
        'ПОЛУФИНАЛ': 'SEMIFINAL',
        'ФИНАЛ': 'FINAL',
        'ГРАНД-ФИНАЛ': 'GRAND FINAL',
        'РЕЗУЛЬТАТЫ ТУРНИРА': 'TOURNAMENT RESULTS',
        'МЕСТО': 'PLACE',
        'ПРИЗ': 'PRIZE',
        'Доступ администратора': 'Admin Access',
        'Введите пароль': 'Enter password',
        'Войти': 'Login',
        'Редактирование матчей': 'Match Editor',
        'ПРИЗОВОЙ ФОНД ПО МЕСТАМ': 'PRIZES BY PLACE',
        'СОХРАНИТЬ ПРИЗЫ': 'SAVE PRIZES',
        'ПОЛНЫЙ СБРОС ТУРНИРА': 'FULL TOURNAMENT RESET',
        'РЕГЛАМЕНТ ТУРНИРА': 'TOURNAMENT RULES',
        '+ ДОБАВИТЬ СЕКЦИЮ': '+ ADD SECTION',
        'СОХРАНИТЬ': 'SAVE',
        'СБРОСИТЬ': 'RESET',
        'Регламент пока не заполнен': 'Rules not yet filled',
        'Новая секция': 'New Section',
        'Содержание не заполнено': 'Content not filled',
        'КУБОК 2026': 'TROPHY 2026',
        'Загрузка 3D модели...': 'Loading 3D model...',
        'Сайт создан игроком Call of Dragons: [888] PiedPiper, ID: 24165550': 'Website created by Call of Dragons player: [888] PiedPiper, ID: 24165550',
        'Оставить пожелание, поддержку для воплощения новых идей можно тут:': 'Leave a wish or support for new ideas here:',
        'DONATIONALERTS': 'DONATIONALERTS',
        'ALERTS': 'ALERTS',
        'Сохранение...': 'Saving...',
        'data_tournament_updated': 'Tournament data updated!',
        'update': 'Update',
        'data_saved_to_google': 'All data successfully saved to Google Sheets',
        'saving': 'Saving',
        'error_saving_to_google': 'Error saving to Google Sheets',
        'error': 'Error',
        'waiting_for_matches': 'WAITING FOR MATCHES',
        'match_1': 'Match 1',
        'match_2': 'Match 2',
        'match_3': 'Match 3',
    }
};

let currentLang = 'ru';

function t(key) { return translations[currentLang][key] || key; }

// ==================== УНИВЕРСАЛЬНЫЙ ПАРСИНГ ДАТ ====================
const DateUtils = {
    // Парсинг любого формата даты в объект Date (UTC)
    parseToUTC: function(dateStr) {
        if (!dateStr || dateStr === '—') return null;
        
        let cleanStr = String(dateStr);
        if (cleanStr.startsWith("'")) cleanStr = cleanStr.substring(1);
        
        // Формат: YYYY-MM-DDTHH:MM или YYYY-MM-DDTHH:MM:SS
        let isoMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
        if (isoMatch) {
            const [_, year, month, day, hours, minutes, seconds = '00'] = isoMatch;
            return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 
                                     parseInt(hours), parseInt(minutes), parseInt(seconds)));
        }
        
        // Формат: YYYY-MM-DD (без времени)
        const dateOnlyMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateOnlyMatch) {
            const [_, year, month, day] = dateOnlyMatch;
            return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0));
        }
        
        // Формат: DD.MM.YYYY HH:MM
        const rusFullMatch = cleanStr.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
        if (rusFullMatch) {
            const [_, day, month, year, hours, minutes] = rusFullMatch;
            return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day),
                                     parseInt(hours), parseInt(minutes), 0));
        }
        
        // Формат: DD.MM.YYYY
        const rusMatch = cleanStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (rusMatch) {
            const [_, day, month, year] = rusMatch;
            return new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0));
        }
        
        return null;
    },
    
    // Форматирование для отображения: ДД.ММ.ГГГГ ЧЧ:ММ
    formatDisplay: function(dateStr) {
        if (!dateStr || dateStr === '—') return '—';
        
        const date = this.parseToUTC(dateStr);
        if (!date) return dateStr;
        
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        
        // Если время 00:00, показываем только дату
        if (hours === '00' && minutes === '00') {
            return `${day}.${month}.${year}`;
        }
        
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    },
    
    // Безопасная версия для использования в переводах
    formatDisplaySafe: function(dateStr) {
        if (!dateStr || dateStr === '—') return '—';
        return this.formatDisplay(dateStr);
    },
    
    // Форматирование только даты
    formatDateOnly: function(dateStr) {
        if (!dateStr || dateStr === '—') return '—';
        const date = this.parseToUTC(dateStr);
        if (!date) return dateStr;
        
        const day = String(date.getUTCDate()).padStart(2, '0');
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const year = date.getUTCFullYear();
        return `${day}.${month}.${year}`;
    },
    
    // Форматирование для input datetime-local
    formatForInput: function(dateStr) {
        if (!dateStr) return '';
        const date = this.parseToUTC(dateStr);
        if (!date) return '';
        
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        const hours = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }
};

// ==================== ФУНКЦИИ КЕШИРОВАНИЯ ====================
function shouldUseCache() {
    return !isAdmin;
}

function isLocalStorageAvailable() {
    try {
        const test = '__storage_test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        console.warn('localStorage недоступен:', e);
        return false;
    }
}

function getCachedData() {
    if (!isLocalStorageAvailable()) return null;
    
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (!cached) return null;
        const data = JSON.parse(cached);
        const isExpired = Date.now() - data.timestamp > CACHE_DURATION_USER;
        if (isExpired) return null;
        return data;
    } catch (e) { 
        console.warn('Ошибка чтения кеша:', e);
        return null; 
    }
}

function saveToCache(data) {
    if (!isLocalStorageAvailable()) return;
    
    try {
        const cacheData = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
        console.warn('Ошибка сохранения кеша:', e);
    }
}

// ==================== ОБЪЕДИНЁННАЯ ЗАГРУЗКА ДАННЫХ ====================
async function loadAllData(showLoader = true) {
    try {
        // Обновляем прогресс только если showLoader = true
        if (showLoader) {
            updateLoaderProgress(20);
        }

        const response = await fetch(`${SCRIPT_URL}?action=getAllData`);
        const data = await response.json();

        if (data.success) {
            if (showLoader) {
                updateLoaderProgress(40);
            }

            // Инициализируем teamAvatars пустым объектом ДО использования
            if (!window.teamAvatars) {
                window.teamAvatars = {};
            }

            // Распределяем данные
            if (data.schedule) {
                scheduleData = data.schedule;
                updateScheduleUI();
                checkPastDates();
            }
            if (data.tournament) {
                tournamentData = data.tournament;
            }

            // ========== ИСПРАВЛЕНИЕ: проверяем, что призовые не пустые ==========
            if (data.prizes && Object.keys(data.prizes).length > 0) {
                prizeData = data.prizes;
                for (let i = 1; i <= 8; i++) {
                    const input = document.getElementById(`prize-${i}`);
                    if (input && prizeData[i]) {
                        input.value = prizeData[i];
                    }
                }
                saveOriginalPrizes();
                updatePrizesButtonColor();
            }
            // ================================================================

            if (showLoader) {
                updateLoaderProgress(60);
            }

            if (data.avatars) {
                // Формат: { "Название команды": "url аватара" }
                window.teamAvatars = { ...window.teamAvatars, ...data.avatars };

                // Восстанавливаем порядок команд из tournamentData.groups
                const groupATeams = tournamentData.groups.A.teams || [];
                const groupBTeams = tournamentData.groups.B.teams || [];
                const allTeamsInOrder = [...groupATeams, ...groupBTeams];

                // Заполняем поля ввода в правильном порядке
                for (let i = 0; i < allTeamsInOrder.length; i++) {
                    const teamName = allTeamsInOrder[i];
                    if (teamName && teamName !== '') {
                        const teamInput = document.getElementById(`team${i + 1}`);
                        if (teamInput) {
                            teamInput.value = teamName;
                        }

                        // Восстанавливаем аватар по имени команды
                        const avatarUrl = data.avatars[teamName];
                        if (avatarUrl) {
                            const avatarInput = document.getElementById(`team${i + 1}_avatar`);
                            if (avatarInput) {
                                avatarInput.value = avatarUrl;
                            }
                        }
                    }
                }

                // Fallback: если в groups нет команд, используем порядок из ключей объекта
                if (allTeamsInOrder.length === 0 || (allTeamsInOrder.length === 1 && allTeamsInOrder[0] === '')) {
                    const teamNames = Object.keys(data.avatars);
                    for (let i = 0; i < Math.min(teamNames.length, 8); i++) {
                        const teamName = teamNames[i];
                        const teamInput = document.getElementById(`team${i + 1}`);
                        if (teamInput) {
                            teamInput.value = teamName;
                        }

                        const avatarInput = document.getElementById(`team${i + 1}_avatar`);
                        if (avatarInput && data.avatars[teamName]) {
                            avatarInput.value = data.avatars[teamName];
                        }
                    }
                }
            }

            if (showLoader) {
                updateLoaderProgress(80);
            }

            if (data.drawStatus !== undefined) {
                updateDrawSectionVisibility();
            }

            // Загружаем составы команд параллельно с остальными данными
            const rosterPromise = loadTeamRosters();
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => resolve(null), 5000);
            });

            const rosters = await Promise.race([rosterPromise, timeoutPromise]);
            if (rosters) {
                window._rosters = rosters;
                updateTournamentDataWithMVP(rosters);
            } else {
                console.log('Team rosters loading timed out or failed');
            }

            // Обновляем UI
            if (!isAdmin) saveToCache(data);

            if (showLoader) {
                updateLoaderProgress(90);
            }

            // Безопасная отрисовка
            renderGroups();
            renderPlayoffs();
            renderResults();
            updateDrawStatus();
            updateDrawButtons();
            updatePlayoffsBracket();
            updateDrawSectionVisibility();
            updateGroupStageAnimation();
            checkPastDates();
            startCountdownTimer();
            initPredictionDates();

            if (showLoader) {
                updateLoaderProgress(100);
            }

            return true;
        }
        return false;
    } catch (error) {
        console.error('loadAllData error:', error);
        return false;
    }
}

async function loadAllDataWithCache(showLoader = true) {
    if (showLoader) {
        showPageLoader();
    }

    if (!shouldUseCache()) {
        await loadAllDataWithRetry(0, 3, showLoader);
        checkPastDates();
        if (showLoader) {
            hidePageLoader();
        }
        return;
    }

    const cached = getCachedData();
    if (cached) {
        const data = cached.data;
        if (data.schedule) {
            scheduleData = data.schedule;
            updateScheduleUI();
            checkPastDates();
        }
        if (data.tournament) tournamentData = data.tournament;
        if (data.prizes) {
            prizeData = data.prizes;
            saveOriginalPrizes();
            updatePrizesButtonColor();
        }
        if (data.avatars) {
            window.teamAvatars = data.avatars;

            const groupATeams = tournamentData.groups.A.teams || [];
            const groupBTeams = tournamentData.groups.B.teams || [];
            const allTeamsInOrder = [...groupATeams, ...groupBTeams];

            for (let i = 0; i < allTeamsInOrder.length; i++) {
                const teamName = allTeamsInOrder[i];
                if (teamName && teamName !== '') {
                    const teamInput = document.getElementById(`team${i + 1}`);
                    if (teamInput) teamInput.value = teamName;

                    const avatarUrl = data.avatars[teamName];
                    if (avatarUrl) {
                        const avatarInput = document.getElementById(`team${i + 1}_avatar`);
                        if (avatarInput) avatarInput.value = avatarUrl;
                    }
                }
            }

            if (allTeamsInOrder.length === 0 || (allTeamsInOrder.length === 1 && allTeamsInOrder[0] === '')) {
                const teamNames = Object.keys(data.avatars);
                for (let i = 0; i < Math.min(teamNames.length, 8); i++) {
                    const teamInput = document.getElementById(`team${i + 1}`);
                    if (teamInput) teamInput.value = teamNames[i];
                    const avatarInput = document.getElementById(`team${i + 1}_avatar`);
                    if (avatarInput && data.avatars[teamNames[i]]) {
                        avatarInput.value = data.avatars[teamNames[i]];
                    }
                }
            }
        }

        renderGroups();
        renderPlayoffs();
        renderResults();
        updateDrawStatus();
        updateDrawButtons();
        updatePlayoffsBracket();
        updateDrawSectionVisibility();
        updateGroupStageAnimation();
        startCountdownTimer();

        if (showLoader) {
            hidePageLoader();
        }
        return true;
    }

    const success = await loadAllDataWithRetry(0, 3, showLoader);
    checkPastDates();
    if (showLoader) {
        hidePageLoader();
    }
    return success;
}

// ==================== ОБРАБОТКА ОФЛАЙН-РЕЖИМА ====================
let isOnline = navigator.onLine;

function updateOnlineStatus() {
    isOnline = navigator.onLine;
    const statusDiv = document.getElementById('sync-status');
    
    if (!isOnline) {
        if (statusDiv && !statusDiv.innerHTML.includes('Офлайн')) {
            statusDiv.innerHTML = '<div class="status-error">⚠️ НЕТ СОЕДИНЕНИЯ С ИНТЕРНЕТОМ. Данные могут быть неактуальны.</div>';
        }
        console.warn('Приложение работает в офлайн-режиме');
    } else {
        if (statusDiv && statusDiv.innerHTML.includes('НЕТ СОЕДИНЕНИЯ')) {
            statusDiv.innerHTML = '<div class="status-success">✅ Соединение восстановлено. Обновление данных...</div>';
            setTimeout(() => {
                if (statusDiv.innerHTML.includes('восстановлено')) {
                    statusDiv.innerHTML = '';
                }
                // Пытаемся перезагрузить данные
                loadAllDataWithCache();
            }, 2000);
        }
        console.log('Соединение с интернетом восстановлено');
    }
}

// Слушаем события сети
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Функция для проверки соединения с Google Sheets
async function checkGoogleSheetsConnection() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('Connection check timeout, aborting...');
            controller.abort();
        }, 15000); // 15 секунд (было 5)
        
        const response = await fetch(`${SCRIPT_URL}?action=ping`, {
            method: 'GET',
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            console.log('Google Sheets connection: OK');
            return true;
        }
        console.warn('Google Sheets connection: Response not OK', response.status);
        return false;
    } catch (error) {
        console.warn('Google Sheets connection: FAILED', error);
        return false;
    }
}

// Обновлённая функция загрузки с проверкой соединения
async function loadAllDataWithRetry(retryCount = 0, maxRetries = 3, showLoader = true) {
    if (showLoader) {
        showPageLoader();
    }

    if (!navigator.onLine) {
        const cached = getCachedData();
        if (cached) {
            console.log('Офлайн-режим: используем кешированные данные');
            applyCachedData(cached.data);
            if (showLoader) {
                hidePageLoader();
            }
            showStatus('Офлайн-режим: показаны кешированные данные', 'success');
            return true;
        } else {
            if (showLoader) {
                hidePageLoader();
            }
            showStatus('Нет соединения и нет кешированных данных', 'error');
            return false;
        }
    }

    try {
        const connectionOk = await checkGoogleSheetsConnection();
        if (!connectionOk && retryCount < maxRetries) {
            console.log(`Попытка ${retryCount + 1}/${maxRetries}...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return loadAllDataWithRetry(retryCount + 1, maxRetries, showLoader);
        }

        if (!connectionOk) {
            throw new Error('Нет соединения с сервером');
        }

        const success = await loadAllData(showLoader);
        if (showLoader) {
            hidePageLoader();
        }
        return success;

    } catch (error) {
        console.error('loadAllDataWithRetry error:', error);

        if (retryCount < maxRetries) {
            console.log(`Повторная попытка ${retryCount + 1}/${maxRetries} через 2 секунды...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return loadAllDataWithRetry(retryCount + 1, maxRetries, showLoader);
        }

        const cached = getCachedData();
        if (cached) {
            console.log('Используем кешированные данные после ошибки');
            applyCachedData(cached.data);
            if (showLoader) {
                hidePageLoader();
            }
            showStatus('Используются кешированные данные. Обновите страницу позже.', 'warning');
            return true;
        }

        if (showLoader) {
            hidePageLoader();
        }
        showStatus('Ошибка загрузки данных. Проверьте соединение.', 'error');
        return false;
    }
}

// Применение кешированных данных
function applyCachedData(data) {
    // Показываем прогресс при загрузке из кеша
    updateLoaderProgress(30);

    if (data.schedule) {
        scheduleData = data.schedule;
        updateScheduleUI();
        checkPastDates();
    }
    if (data.tournament) {
        tournamentData = data.tournament;
    }

    // ========== ИСПРАВЛЕНИЕ: проверяем, что призовые не пустые ==========
    if (data.prizes && Object.keys(data.prizes).length > 0) {
        prizeData = data.prizes;
        saveOriginalPrizes();
        updatePrizesButtonColor();
    }
    // ================================================================

    if (data.avatars) {
        window.teamAvatars = data.avatars;

        // Восстанавливаем порядок команд из tournamentData.groups
        const groupATeams = tournamentData.groups.A.teams || [];
        const groupBTeams = tournamentData.groups.B.teams || [];
        const allTeamsInOrder = [...groupATeams, ...groupBTeams];

        for (let i = 0; i < allTeamsInOrder.length; i++) {
            const teamName = allTeamsInOrder[i];
            if (teamName && teamName !== '') {
                const teamInput = document.getElementById(`team${i + 1}`);
                if (teamInput) teamInput.value = teamName;

                const avatarUrl = data.avatars[teamName];
                if (avatarUrl) {
                    const avatarInput = document.getElementById(`team${i + 1}_avatar`);
                    if (avatarInput) avatarInput.value = avatarUrl;
                }
            }
        }

        if (allTeamsInOrder.length === 0 || (allTeamsInOrder.length === 1 && allTeamsInOrder[0] === '')) {
            const teamNames = Object.keys(data.avatars);
            for (let i = 0; i < Math.min(teamNames.length, 8); i++) {
                const teamInput = document.getElementById(`team${i + 1}`);
                if (teamInput) teamInput.value = teamNames[i];
                const avatarInput = document.getElementById(`team${i + 1}_avatar`);
                if (avatarInput && data.avatars[teamNames[i]]) {
                    avatarInput.value = data.avatars[teamNames[i]];
                }
            }
        }
    }

    // Обновляем tournamentData с MVP из кеша
    if (window._rosters) {
        updateTournamentDataWithMVP(window._rosters);
    }

    // Обновляем прогресс до 80%
    updateLoaderProgress(80);

    renderGroups();
    renderPlayoffs();
    renderResults();
    updateDrawStatus();
    updateDrawButtons();
    updatePlayoffsBracket();
    updateDrawSectionVisibility();
    updateGroupStageAnimation();
    startCountdownTimer();

    // Обновляем прогресс до 100%
    updateLoaderProgress(100);
}

function updateScheduleUI() {
    // Функция для преобразования даты из любого формата в ДД.ММ.ГГГГ
    function formatDateForDisplay(dateStr) {
        if (!dateStr || dateStr === '—') return '—';
        
        // Если уже в формате ДД.ММ.ГГГГ
        const rusFormat = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
        if (rusFormat) {
            return `${rusFormat[1]}.${rusFormat[2]}.${rusFormat[3]}`;
        }
        
        // Если в формате YYYY-MM-DD или YYYY-MM-DDTHH:MM
        let cleanStr = String(dateStr);
        if (cleanStr.startsWith("'")) {
            cleanStr = cleanStr.substring(1);
        }
        
        const isoMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch) {
            const [_, year, month, day] = isoMatch;
            return `${day}.${month}.${year}`;
        }
        
        return dateStr;
    }
    
    function formatDateTimeForDisplay(dateStr) {
        if (!dateStr || dateStr === '—') return '—';
        
        // Если уже в формате ДД.ММ.ГГГГ ЧЧ:ММ
        const rusFullMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
        if (rusFullMatch) {
            return `${rusFullMatch[1]}.${rusFullMatch[2]}.${rusFullMatch[3]} ${rusFullMatch[4]}:${rusFullMatch[5]}`;
        }
        
        // Если в формате YYYY-MM-DDTHH:MM
        let cleanStr = String(dateStr);
        if (cleanStr.startsWith("'")) {
            cleanStr = cleanStr.substring(1);
        }
        
        const isoMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
        if (isoMatch) {
            const [_, year, month, day, hours, minutes] = isoMatch;
            return `${day}.${month}.${year} ${hours}:${minutes}`;
        }
        
        // Если только дата без времени
        const dateOnlyMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (dateOnlyMatch) {
            const [_, year, month, day] = dateOnlyMatch;
            return `${day}.${month}.${year}`;
        }
        
        return dateStr;
    }
    
    const periodStartEl = document.getElementById('tournament-period-start');
    const periodEndEl = document.getElementById('tournament-period-end');
    const qfStartEl = document.getElementById('qf-period-start');
    const qfEndEl = document.getElementById('qf-period-end');
    const sfStartEl = document.getElementById('sf-period-start');
    const sfEndEl = document.getElementById('sf-period-end');
    const finalEl = document.getElementById('final-datetime');
    const prizeEl = document.getElementById('prize-pool');
    
    if (periodStartEl) periodStartEl.textContent = formatDateForDisplay(scheduleData.periodStart);
    if (periodEndEl) periodEndEl.textContent = formatDateForDisplay(scheduleData.periodEnd);
    if (qfStartEl) qfStartEl.textContent = formatDateForDisplay(scheduleData.qfStart);
    if (qfEndEl) qfEndEl.textContent = formatDateForDisplay(scheduleData.qfEnd);
    if (sfStartEl) sfStartEl.textContent = formatDateForDisplay(scheduleData.sfStart);
    if (sfEndEl) sfEndEl.textContent = formatDateForDisplay(scheduleData.sfEnd);
    if (finalEl) finalEl.textContent = formatDateTimeForDisplay(scheduleData.final);
    if (prizeEl) prizeEl.textContent = scheduleData.prizePool || '—';
}

// ==================== ЗАГРУЗКА РАСПИСАНИЯ (через API_KEY) ====================
async function loadSchedule() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Schedule!A2:C20?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values && data.values.length > 0) {
            for (let row of data.values) {
                const eventName = row[0];
                let startValue = row[1] || '—';
                let endValue = row[2] || '—';
                startValue = startValue.toString().trim();
                endValue = endValue.toString().trim();
                
                // Упрощённая функция для преобразования в ISO формат (для сохранения в scheduleData)
                function convertToISO(value) {
                    if (!value || value === '—') return '';
                    
                    let cleanValue = String(value);
                    if (cleanValue.startsWith("'")) cleanValue = cleanValue.substring(1);
                    
                    // Уже в ISO формате с временем
                    const isoMatch = cleanValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
                    if (isoMatch) return cleanValue;
                    
                    // Только дата в ISO формате
                    const dateOnlyMatch = cleanValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                    if (dateOnlyMatch) return cleanValue + 'T00:00';
                    
                    // Русский формат DD.MM.YYYY HH:MM или DD.MM.YYYY
                    const match = cleanValue.match(/(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
                    if (match) {
                        const [_, day, month, year, hours = '00', minutes = '00'] = match;
                        return `${year}-${month}-${day}T${hours}:${minutes}`;
                    }
                    
                    return '';
                }
                
                // Используем DateUtils для отображения (если доступен)
                function formatDisplay(value) {
                    if (!value || value === '—') return '—';
                    if (typeof DateUtils !== 'undefined' && DateUtils.formatDisplay) {
                        return DateUtils.formatDisplaySafe(value);
                    }
                    // Fallback если DateUtils нет
                    const converted = convertToISO(value);
                    if (converted && converted.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
                        const [datePart, timePart] = converted.split('T');
                        const [year, month, day] = datePart.split('-');
                        const [hours, minutes] = timePart.split(':');
                        if (hours === '00' && minutes === '00') return `${day}.${month}.${year}`;
                        return `${day}.${month}.${year} ${hours}:${minutes}`;
                    }
                    return value;
                }
                
                if (eventName === 'Период турнира') {
                    const parsedStart = convertToISO(startValue);
                    const parsedEnd = convertToISO(endValue);
                    document.getElementById('tournament-period-start').textContent = formatDisplay(startValue);
                    document.getElementById('tournament-period-end').textContent = formatDisplay(endValue);
                    scheduleData.periodStart = parsedStart;
                    scheduleData.periodEnd = parsedEnd;
                } else if (eventName === 'Групповой этап') {
                    const parsedStart = convertToISO(startValue);
                    const parsedEnd = convertToISO(endValue);
                    document.getElementById('qf-period-start').textContent = formatDisplay(startValue);
                    document.getElementById('qf-period-end').textContent = formatDisplay(endValue);
                    scheduleData.qfStart = parsedStart;
                    scheduleData.qfEnd = parsedEnd;
                } else if (eventName === 'Плей-офф') {
                    const parsedStart = convertToISO(startValue);
                    const parsedEnd = convertToISO(endValue);
                    document.getElementById('sf-period-start').textContent = formatDisplay(startValue);
                    document.getElementById('sf-period-end').textContent = formatDisplay(endValue);
                    scheduleData.sfStart = parsedStart;
                    scheduleData.sfEnd = parsedEnd;
                } else if (eventName === 'Гранд-финал') {
                    const parsedStart = convertToISO(startValue);
                    document.getElementById('final-datetime').textContent = formatDisplay(startValue);
                    scheduleData.final = parsedStart;
                } else if (eventName === 'Призовой фонд') {
                    document.getElementById('prize-pool').textContent = startValue;
                    scheduleData.prizePool = startValue;
                }
            }
        }
               
        checkPastDates();
        startCountdownTimer();
        updateGroupStageAnimation();
    } catch (e) { console.log('Schedule load error:', e); }
}

// ==================== ФУНКЦИИ ПЕРЕВОДА ====================
function setLanguage(lang) {
    if (currentLang === lang) return;
    
    currentLang = lang;
    localStorage.setItem('tournament_lang', lang);
    
    const langBtn = document.getElementById('lang-switch-btn');
    if (langBtn) langBtn.textContent = lang === 'ru' ? 'EN' : 'RU';
    
    // Обновляем названия в PREDICTION_CONFIG
    if (typeof PREDICTION_CONFIG !== 'undefined' && PREDICTION_CONFIG) {
        if (PREDICTION_CONFIG.arenaVotes) {
            PREDICTION_CONFIG.arenaVotes.name = t('arena_votes_name');
        }
        if (PREDICTION_CONFIG.groupStage) {
            PREDICTION_CONFIG.groupStage.name = t('group_stage_name');
        }
        if (PREDICTION_CONFIG.playoffs) {
            PREDICTION_CONFIG.playoffs.name = t('playoffs_name');
        }
        if (PREDICTION_CONFIG.grandFinal) {
            PREDICTION_CONFIG.grandFinal.name = t('grand_final_name');
        }
    }
    
    updateAllTexts();
    
    // Перерисовываем все компоненты
    renderGroups();
    renderPlayoffs();
    renderResults();
    updateDrawStatus();
    
    // Обновляем модальное окно прогнозов, если открыто
    const predictionModal = document.getElementById('prediction-modal');
    if (predictionModal && predictionModal.style.display === 'flex') {
        const contentDiv = document.getElementById('prediction-content');
        if (contentDiv) {
            // Сохраняем состояние открытых блоков
            const openBlocks = [];
            document.querySelectorAll('.prediction-stage-block.open').forEach(block => {
                if (block.id) openBlocks.push(block.id);
            });
            
            let html = '';
            for (const [key, stage] of Object.entries(PREDICTION_CONFIG)) {
                if (!stage) continue;
                html += renderStageBlock(key, stage);
            }
            contentDiv.innerHTML = html;
            
            // Восстанавливаем открытые блоки
            openBlocks.forEach(blockId => {
                const block = document.getElementById(blockId);
                if (block) block.classList.add('open');
            });
            
            updatePredictionStagesStatus();
            updatePredictionStagesStatusUI();
        }
    }
    
    playSound('click');
}

function updateAllTexts() {
    // Шапка
    const titleEl = document.querySelector('header h1');
    if (titleEl) titleEl.textContent = t('tournament_title');
    
    const subtitleEl = document.querySelector('header p');
    if (subtitleEl) subtitleEl.textContent = t('tournament_subtitle');
    
    // Расписание
    const scheduleTitle = document.querySelector('.schedule-section h2');
    if (scheduleTitle) scheduleTitle.textContent = t('schedule_title');
    
    const tournamentPeriodLabel = document.querySelector('.schedule-period .schedule-label-bold');
    if (tournamentPeriodLabel) tournamentPeriodLabel.textContent = t('tournament_period');
    
    const prizePoolLabel = document.querySelector('.schedule-period .schedule-label-bold:last-child');
    if (prizePoolLabel && prizePoolLabel.textContent.includes('ПРИЗОВОЙ')) {
        prizePoolLabel.textContent = t('prize_pool');
    }
    
    const groupStageTitle = document.querySelector('.groups-section h2');
    if (groupStageTitle) groupStageTitle.textContent = t('group_stage_title');
    
    const playoffsTitle = document.querySelector('.playoffs-section h2');
    if (playoffsTitle) playoffsTitle.textContent = t('playoffs_title');
    
    const upperBracketTitle = document.querySelector('.upper-bracket h3');
    if (upperBracketTitle) upperBracketTitle.textContent = t('upper_bracket');
    
    const lowerBracketTitle = document.querySelector('.lower-bracket h3');
    if (lowerBracketTitle) lowerBracketTitle.textContent = t('lower_bracket');
    
    const grandFinalTitle = document.querySelector('.final-bracket h3');
    if (grandFinalTitle) grandFinalTitle.textContent = t('grand_final_title');
    
    const lowerSemiLabel = document.querySelector('.lower-bracket .match-label');
    if (lowerSemiLabel && lowerSemiLabel.textContent === 'ПОЛУФИНАЛ') {
        lowerSemiLabel.textContent = t('lower_semi');
    }
    
    const lowerFinalLabel = document.querySelectorAll('.lower-bracket .match-label')[1];
    if (lowerFinalLabel && lowerFinalLabel.textContent === 'ФИНАЛ') {
        lowerFinalLabel.textContent = t('lower_final');
    }
    
    const resultsTitle = document.querySelector('.results-section h2');
    if (resultsTitle) resultsTitle.textContent = t('results_title');
    
    const resultsHeaders = document.querySelectorAll('.results-header div');
    if (resultsHeaders.length >= 5) {
        resultsHeaders[0].textContent = t('place_header');
        resultsHeaders[1].textContent = t('team_header_results');
        resultsHeaders[2].textContent = t('wins_header_results');
        resultsHeaders[3].textContent = t('points_header_results');
        resultsHeaders[4].textContent = t('prize_header');
    }
    
    const drawTitle = document.querySelector('.draw-section h2');
    if (drawTitle) drawTitle.textContent = t('draw_title');
    
    const drawInfo = document.querySelector('.draw-info');
    if (drawInfo) {
        const pElements = drawInfo.querySelectorAll('p');
        if (pElements[0]) pElements[0].textContent = t('draw_info');
        if (pElements[1]) pElements[1].innerHTML = `<strong>${t('draw_group_a')}</strong> | <strong>${t('draw_group_b')}</strong>`;
    }
    
    const drawBtnA1 = document.getElementById('draw-group-a1');
    if (drawBtnA1) drawBtnA1.textContent = t('draw_to_group_a');
    
    const drawBtnB1 = document.getElementById('draw-group-b1');
    if (drawBtnB1) drawBtnB1.textContent = t('draw_to_group_b');
    
    const drawBtnA2 = document.getElementById('draw-group-a2');
    if (drawBtnA2) drawBtnA2.textContent = t('draw_to_group_a2');
    
    const drawBtnB2 = document.getElementById('draw-group-b2');
    if (drawBtnB2) drawBtnB2.textContent = t('draw_to_group_b2');
    
    const saveDrawBtn = document.getElementById('save-draw');
    if (saveDrawBtn) saveDrawBtn.textContent = t('save_draw');
    
    const clearTeamsBtn = document.getElementById('clear-teams');
    if (clearTeamsBtn) clearTeamsBtn.textContent = t('clear_teams');
    
    const adminTitle = document.querySelector('#admin-panel h2');
    if (adminTitle) adminTitle.textContent = t('admin_title');
    
    const adminPassPlaceholder = document.getElementById('admin-pass');
    if (adminPassPlaceholder) adminPassPlaceholder.placeholder = t('admin_password');
    
    const adminLoginBtn = document.getElementById('unlock-admin');
    if (adminLoginBtn) adminLoginBtn.textContent = t('admin_login');
    
    const adminEditTitle = document.querySelector('#admin-controls h3');
    if (adminEditTitle) adminEditTitle.textContent = t('admin_edit_matches');
    
    const adminPrizesTitle = document.querySelector('#admin-controls .prize-section h3');
    if (adminPrizesTitle) adminPrizesTitle.textContent = t('admin_prizes');
    
    const savePrizesBtn = document.getElementById('save-prizes');
    if (savePrizesBtn) savePrizesBtn.textContent = t('admin_save_prizes');
    
    const saveChangesBtn = document.getElementById('save-changes');
    if (saveChangesBtn) saveChangesBtn.textContent = t('admin_save_sheet');
    
    const fullResetBtn = document.getElementById('full-reset-btn');
    if (fullResetBtn) fullResetBtn.textContent = t('admin_full_reset');
    
    const saveAvatarsBtn = document.getElementById('save-avatars');
    if (saveAvatarsBtn) saveAvatarsBtn.textContent = t('admin_save_avatars');
    
    const resetDrawBtn = document.getElementById('reset-draw-btn');
    if (resetDrawBtn) resetDrawBtn.textContent = t('admin_reset_draw');
    
    const editScheduleBtn = document.getElementById('edit-schedule-btn');
    if (editScheduleBtn) editScheduleBtn.textContent = t('edit_schedule');
    
    const saveScheduleBtn = document.getElementById('save-schedule');
    if (saveScheduleBtn) saveScheduleBtn.textContent = t('save_schedule');
    
    const warningLabel = document.querySelector('#schedule-editor .schedule-edit-grid ~ div span');
    if (warningLabel) warningLabel.textContent = t('warning_utc');
    
    const periodLabel = document.querySelector('.edit-group label');
    if (periodLabel && periodLabel.textContent === 'Период турнира (UTC)') {
        const labels = document.querySelectorAll('.edit-group label');
        if (labels[0]) labels[0].textContent = t('tournament_period_label');
        if (labels[1]) labels[1].textContent = t('group_stage_label');
        if (labels[2]) labels[2].textContent = t('playoffs_label');
        if (labels[3]) labels[3].textContent = t('grand_final_label');
        if (labels[4]) labels[4].textContent = t('prize_pool_label');
    }
    
    const rulesModalTitle = document.querySelector('.rules-modal-header h2');
    if (rulesModalTitle) rulesModalTitle.textContent = t('rules_title');
    
    const addRulesBtn = document.getElementById('add-rules-section');
    if (addRulesBtn) addRulesBtn.textContent = t('add_section');
    
    const saveRulesBtn = document.getElementById('save-rules');
    if (saveRulesBtn) saveRulesBtn.textContent = t('save_rules');
    
    const resetRulesBtn = document.getElementById('reset-rules');
    if (resetRulesBtn) resetRulesBtn.textContent = t('reset_rules');
    
    updateTimerText();
    
    // Обновляем плейсхолдеры
    for (let i = 1; i <= 8; i++) {
        const teamInput = document.getElementById(`team${i}`);
        const avatarInput = document.getElementById(`team${i}_avatar`);
        if (teamInput) teamInput.placeholder = t('team_placeholder');
        if (avatarInput) avatarInput.placeholder = t('avatar_placeholder');
    }
    
    for (let i = 1; i <= 8; i++) {
        const prizeInput = document.getElementById(`prize-${i}`);
        if (prizeInput) prizeInput.placeholder = t('prize_placeholder');
    }
    
    const footerText = document.querySelector('footer p');
    if (footerText) {
        footerText.innerHTML = t('data_synced') + ' <button id="force-refresh" class="refresh-btn">↻</button>';
    }

    // Обновляем расписание (schedule)
    const groupStageLabel = document.querySelector('.match-schedule-item .schedule-label-bold');
    if (groupStageLabel && groupStageLabel.textContent.includes('ГРУППОВОЙ ЭТАП')) {
        const labels = document.querySelectorAll('.match-schedule-item .schedule-label-bold');
        if (labels[0]) labels[0].textContent = t('group_stage');
        if (labels[1]) labels[1].textContent = t('playoffs');
        if (labels[2]) labels[2].textContent = t('grand_final');
    }

    // Обновляем заголовок "ПРИЗОВОЙ ФОНД:" в расписании
    const allScheduleLabels = document.querySelectorAll('.schedule-period .schedule-label-bold');
    for (let i = 0; i < allScheduleLabels.length; i++) {
        const label = allScheduleLabels[i];
        if (label && label.textContent.includes('ПРИЗОВОЙ')) {
            label.textContent = t('prize_pool');
            break;
        }
    }

    // Также обновляем заголовок "ПРИЗОВОЙ ФОНД:" в админ-панели
    const adminPrizeHeader = document.querySelector('#admin-controls .prize-section h3');
    if (adminPrizeHeader && adminPrizeHeader.textContent.includes('ПРИЗОВОЙ')) {
        adminPrizeHeader.textContent = t('admin_prizes');
    }
    
    // Принудительно обновляем HTML lang атрибут
    document.documentElement.lang = currentLang === 'ru' ? 'ru' : 'en';

    // Прогнозы модальное окно
    const predictionModalTitle = document.getElementById('prediction-modal-title');
    if (predictionModalTitle) predictionModalTitle.textContent = t('prediction_modal_title');
    
    const exportRankingBtn = document.getElementById('export-ranking-btn');
    if (exportRankingBtn) exportRankingBtn.textContent = t('export_ranking_button');
    
    const searchInput = document.getElementById('prediction-search-input');
    if (searchInput) searchInput.placeholder = t('search_placeholder');
    
    // Обновляем статусы в уже открытом модальном окне прогнозов
    const predictionModal = document.getElementById('prediction-modal');
    if (predictionModal && predictionModal.style.display === 'flex') {
        updatePredictionStagesStatusUI();
    } 
    // Кнопка Кубок 2026
    const trophyFabText = document.getElementById('trophy-fab-header-text');
    if (trophyFabText) trophyFabText.textContent = t('trophy_fab_text');
    
    // Кнопка Прогнозы
    const predictionFabTooltip = document.getElementById('prediction-fab-tooltip');
    if (predictionFabTooltip) predictionFabTooltip.textContent = t('prediction_fab_tooltip');
    
    // Текст лоадера
    const pageLoaderText = document.getElementById('page-loader-text');
    if (pageLoaderText) pageLoaderText.textContent = t('page_loader_text');
    
    // Обновляем названия в PREDICTION_CONFIG (если модальное окно открыто)
    if (PREDICTION_CONFIG.arenaVotes) {
        PREDICTION_CONFIG.arenaVotes.name = t('arena_votes_name');
        PREDICTION_CONFIG.groupStage.name = t('group_stage_name');
        PREDICTION_CONFIG.playoffs.name = t('playoffs_name');
        PREDICTION_CONFIG.grandFinal.name = t('grand_final_name');
    }

    // Кубок 2026 модальное окно
    const trophy2026Title = document.getElementById('trophy2026-title');
    if (trophy2026Title) trophy2026Title.textContent = t('trophy_2026_title');
    
    const trophy2026LoaderText = document.getElementById('trophy2026-loader-text');
    if (trophy2026LoaderText) trophy2026LoaderText.textContent = t('loading_3d_model');
    
    // Трофей модальное окно (3D модель)
    const trophyLoaderText = document.getElementById('trophy-loader-text');
    if (trophyLoaderText) trophyLoaderText.textContent = t('loading_3d_model');    
    
    // Если модальное окно прогнозов открыто, перерисовываем его
    const predictionModalEl = document.getElementById('prediction-modal');
    if (predictionModalEl && predictionModalEl.style.display === 'flex') {
        const contentDiv = document.getElementById('prediction-content');
        if (contentDiv) {
            let html = '';
            for (const [key, stage] of Object.entries(PREDICTION_CONFIG)) {
                if (!stage) continue;
                html += renderStageBlock(key, stage);
            }
            contentDiv.innerHTML = html;
            updatePredictionStagesStatus();
            updatePredictionStagesStatusUI();
        }
    }
    
    // Обновляем футер (подвал)
    const footerCopyright = document.getElementById('footer-copyright');
    if (footerCopyright) footerCopyright.textContent = t('footer_copyright');

    const footerSupportText = document.getElementById('footer-support-text');
    if (footerSupportText) footerSupportText.textContent = t('footer_support_text');

    // Обновляем текст "УВЕЛИЧИТЬ ФОНД"
    const fundLabel = document.getElementById('fund-support-label');
    if (fundLabel) {
        fundLabel.textContent = t('fund_support_label');
    }
    
    const fundLinkText = document.getElementById('fund-support-link-text');
    if (fundLinkText) {
        fundLinkText.textContent = t('fund_support_link');
    }
    
    const fundLink = document.getElementById('fund-support-link-schedule');
    if (fundLink) {
        fundLink.title = t('fund_support_tooltip');
    }
}

function updateTimerText() {
    const timerLabel = document.querySelector('.countdown-timer .schedule-label-bold');
    if (timerLabel) timerLabel.textContent = t('next_match');
}

// Переопределяем formatDateDisplay для перевода "Дата не назначена"
const originalFormatDateDisplay = formatDateDisplay;
window.formatDateDisplay = function(dateStr) {
    if (!dateStr) return t('date_not_set');
    return originalFormatDateDisplay(dateStr);
};

// ==================== ЗВУКИ ====================
let soundEnabled = true;
let audioContext = null;

function initAudio() {
    try {
        if (!audioContext) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                audioContext = new AudioCtx();
                if (audioContext.state === 'suspended') {
                    audioContext.resume();
                }
            } else {
                // Браузер не поддерживает AudioContext
                soundEnabled = false;
                return;
            }
        }
        // Если audioContext в состоянии closed, пересоздаём
        if (audioContext && audioContext.state === 'closed') {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                audioContext = new AudioCtx();
            } else {
                soundEnabled = false;
                return;
            }
        }
    } catch(e) {
        // Ошибка аудио, отключаем звук
        soundEnabled = false;
        audioContext = null;
    }
}

function playSound(type) {
    if (!soundEnabled) return;

    // Вибрация на мобильных устройствах (для тактильной обратной связи)
    if (navigator.vibrate) {
        if (type === 'click') navigator.vibrate(10);
        else if (type === 'success') navigator.vibrate([20, 30, 20]);
        else if (type === 'error') navigator.vibrate([50, 30, 50]);
        else if (type === 'draw') navigator.vibrate([15, 20, 15]);
    }

    try {
        initAudio();
        // Проверка, что audioContext инициализирован
        if (!audioContext || audioContext.state === 'closed') {
            audioContext = null;
            initAudio();
            if (!audioContext) return;
        }
        const now = audioContext.currentTime;
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        if (type === 'click') { osc.frequency.value = 180; gain.gain.setValueAtTime(0.15, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15); osc.start(now); osc.stop(now + 0.15); }
        else if (type === 'success') { osc.frequency.value = 120; gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4); osc.start(now); osc.stop(now + 0.4); }
        else if (type === 'error') { osc.frequency.value = 100; osc.type = 'sawtooth'; gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3); osc.start(now); osc.stop(now + 0.3); }
        else if (type === 'draw') { osc.frequency.value = 140; gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.2, now + 0.1); gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5); osc.start(now); osc.stop(now + 0.5); }
    } catch(e) {
        // Подавляем ошибки звука
    }
}

// Универсальная функция сохранения всех данных в Google Sheets
async function saveAllDataToGoogle() {
    if (!isAdmin) {
        showStatus('status_admin_required', 'error');
        playSound('error');
        return false;
    }
    
    // Собираем текущие призы из полей ввода
    const currentPrizes = {};
    for (let i = 1; i <= 8; i++) {
        const input = document.getElementById(`prize-${i}`);
        if (input) {
            currentPrizes[i] = input.value.trim();
        } else {
            currentPrizes[i] = prizeData[i] || '';
        }
    }
    
    // Собираем текущее расписание
    const currentSchedule = {
        periodStart: scheduleData.periodStart || '',
        periodEnd: scheduleData.periodEnd || '',
        qfStart: scheduleData.qfStart || '',
        qfEnd: scheduleData.qfEnd || '',
        sfStart: scheduleData.sfStart || '',
        sfEnd: scheduleData.sfEnd || '',
        final: scheduleData.final || '',
        prizePool: scheduleData.prizePool || ''
    };
    
    try {
        // 1. Сохраняем турнирные данные (группы и плей-офф)
        const responseTournament = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'tournament',
                data: JSON.stringify({ 
                    groups: tournamentData.groups, 
                    playoffs: tournamentData.playoffs 
                })
            }).toString()
        });
        
        const resultTournament = await responseTournament.json();
        
        if (!resultTournament.success) {
            console.error('Save tournament failed:', resultTournament.error);
            showToast(t('error_saving_to_google'), 'error', t('error'));
            playSound('error');
            return false;
        }
        
        // 2. Сохраняем призы
        const responsePrizes = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'prizes',
                data: JSON.stringify(currentPrizes)
            }).toString()
        });
        
        const resultPrizes = await responsePrizes.json();
        
        if (!resultPrizes.success) {
            console.error('Save prizes failed:', resultPrizes.error);
        }
        
        // 3. Сохраняем расписание
        const responseSchedule = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'schedule',
                data: JSON.stringify({
                    period: { start: currentSchedule.periodStart, end: currentSchedule.periodEnd },
                    qf: { start: currentSchedule.qfStart, end: currentSchedule.qfEnd },
                    sf: { start: currentSchedule.sfStart, end: currentSchedule.sfEnd },
                    final: currentSchedule.final,
                    prizePool: currentSchedule.prizePool
                })
            }).toString()
        });
        
        const resultSchedule = await responseSchedule.json();
        
        if (!resultSchedule.success) {
            console.error('Save schedule failed:', resultSchedule.error);
        }
        
        // Обновляем локальные данные
        prizeData = currentPrizes;
        
        // Обновляем оригинальные данные для отслеживания изменений
        saveOriginalPrizes();
        saveOriginalSchedule();
        updatePrizesButtonColor();
        updateScheduleButtonColor();
        
        // ========== ОЧИЩАЕМ ВСЕ КЕШИ ПОСЛЕ СОХРАНЕНИЯ ==========
        try {
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem('prediction_cache');
            localStorage.removeItem(TEAM_ROSTERS_CACHE_KEY);
            localStorage.removeItem(RULES_CACHE_KEY);
            console.log('All caches cleared after saving to Google');
        } catch(e) {
            console.warn('Failed to clear caches:', e);
        }
        
        // Убираем подсветку у всех кнопок
        document.querySelectorAll('.match-update-btn.has-changes').forEach(btn => {
            btn.classList.remove('has-changes');
        });
        document.querySelectorAll('.playoff-update-btn.has-changes').forEach(btn => {
            btn.classList.remove('has-changes');
        });
        
        // Убираем подсветку с кнопок призов и расписания
        const savePrizesBtn = document.getElementById('save-prizes');
        if (savePrizesBtn) savePrizesBtn.classList.remove('has-changes');
        
        const saveScheduleBtn = document.getElementById('save-schedule');
        if (saveScheduleBtn) saveScheduleBtn.classList.remove('has-changes');
        
        showToast(t('data_saved_to_google'), 'success', t('saving'));
        showStatus('status_tournament_saved', 'success');
        playSound('success');
        
        return true;
        
    } catch(e) {
        console.error('Save error:', e);
        showToast(t('error_saving_to_google'), 'error', t('error'));
        playSound('error');
        return false;
    }
}

// ==================== ЭКСПОРТ ВСЕХ ДАННЫХ ====================
async function exportAllData() {
    if (!isAdmin) {
        showStatus('status_admin_required', 'error');
        playSound('error');
        return;
    }
    
    showStatus('Сбор данных для экспорта...', 'success');
    
    try {
        // Собираем все данные
        const exportData = {
            exportDate: new Date().toISOString(),
            tournamentData: tournamentData,
            schedule: scheduleData,
            prizes: prizeData,
            avatars: window.teamAvatars || {},
            groups: {
                A: {
                    teams: tournamentData.groups.A.teams || [],
                    matches: tournamentData.groups.A.matches || []
                },
                B: {
                    teams: tournamentData.groups.B.teams || [],
                    matches: tournamentData.groups.B.matches || []
                }
            },
            playoffs: tournamentData.playoffs,
            drawCompleted: (tournamentData.groups.A.teams?.length === 4 && tournamentData.groups.B.teams?.length === 4)
        };
        
        // Создаём JSON строку
        const jsonString = JSON.stringify(exportData, null, 2);
        
        // Создаём Blob и ссылку для скачивания
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        // Формируем имя файла с текущей датой
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
        a.href = url;
        a.download = `tournament_export_${dateStr}.json`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        playSound('success');
        showStatus('Данные экспортированы успешно!', 'success');
        
    } catch (error) {
        console.error('Export error:', error);
        showStatus('Ошибка экспорта данных', 'error');
        playSound('error');
    }
}

// Функция для импорта данных из JSON (только для админа)
async function importAllData() {
    if (!isAdmin) {
        showStatus('status_admin_required', 'error');
        playSound('error');
        return;
    }
    
    // Создаём скрытый input для выбора файла
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const importedData = JSON.parse(e.target.result);
                
                // Валидация импортируемых данных
                if (!importedData.tournamentData && !importedData.groups) {
                    throw new Error('Неверный формат файла');
                }
                
                showStatus('Импорт данных...', 'success');
                
                // Восстанавливаем данные
                if (importedData.tournamentData) {
                    tournamentData = importedData.tournamentData;
                }
                if (importedData.groups) {
                    tournamentData.groups = importedData.groups;
                }
                if (importedData.playoffs) {
                    tournamentData.playoffs = importedData.playoffs;
                }
                if (importedData.schedule) {
                    scheduleData = importedData.schedule;
                    updateScheduleUI();
                }
                if (importedData.prizes) {
                    prizeData = importedData.prizes;
                    for (let i = 1; i <= 8; i++) {
                        const input = document.getElementById(`prize-${i}`);
                        if (input && prizeData[i]) {
                            input.value = prizeData[i];
                        }
                    }
                    saveOriginalPrizes();
                    updatePrizesButtonColor();
                }
                if (importedData.avatars) {
                    window.teamAvatars = importedData.avatars;
                }
                
                // Обновляем UI
                renderGroups();
                renderPlayoffs();
                renderResults();
                updateDrawStatus();
                updateDrawButtons();
                updatePlayoffsBracket();
                updateDrawSectionVisibility();
                updateGroupStageAnimation();
                checkPastDates();
                startCountdownTimer();
                
                // Сохраняем в Google Sheets
                await saveAllDataToGoogle();
                
                playSound('success');
                showStatus('Импорт данных выполнен успешно!', 'success');
                
            } catch (error) {
                console.error('Import error:', error);
                showStatus('Ошибка импорта: неверный формат файла', 'error');
                playSound('error');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    str = String(str);
    return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
}

function formatPlayerName(name) {
    if (!name) return '';
    const escaped = escapeHtml(name);
    // Заменяем [CAP] на картинку
    return escaped.replace(/\[CAP\]/g, '<img src="image/CAP.png" class="cap-icon" alt="CAP" title="CAP">');
}

function truncateNameWithFormat(name) {
    if (!name) return '';
    // Сначала форматируем с [CAP]
    const formatted = formatPlayerName(name);
    // Если имя длинное, обрезаем, но сохраняем HTML-разметку
    if (name.length > 18) {
        const truncated = name.substring(0, 16) + '..';
        // Применяем форматирование к обрезанному имени
        return formatPlayerName(truncated);
    }
    return formatted;
}

function getAvatarHtml(teamName) {
    if (!teamName || teamName === 'TBD' || teamName === '') return '';
    
    // Безопасная проверка window.teamAvatars
    let avatarUrl = '';
    try {
        if (typeof window !== 'undefined' && window.teamAvatars && typeof window.teamAvatars === 'object') {
            avatarUrl = window.teamAvatars[teamName] || '';
        }
    } catch(e) {
        // Подавляем ошибку, возвращаем пустую строку
        avatarUrl = '';
    }
    
    // Дополнительная проверка: если avatarUrl не строка
    if (typeof avatarUrl !== 'string') {
        avatarUrl = '';
    }
    
    if (!avatarUrl || avatarUrl === '') {
        return `<img src="" class="team-avatar" alt="${escapeHtml(teamName)}" style="visibility: hidden;">`;
    }
    return `<img src="${avatarUrl}" class="team-avatar" alt="${escapeHtml(teamName)}" onerror="this.style.display='none'">`;
}

function getMVPHtml(count) {
    if (!count || count === 0) return '';
    return '<span class="mvp-display"><img src="image/MVP.png" class="mvp-icon" alt="MVP"><span class="mvp-count">x ' + count + '</span></span>';
}

async function saveAvatarsToSheet() {
    if (!isAdmin) {
        showStatus('status_admin_required', 'error');
        playSound('error');
        return;
    }
    
    // Сохраняем в формате { "имя команды": "url аватара" }
    const avatarsData = {};
    for (let i = 1; i <= 8; i++) {
        const nameInput = document.getElementById(`team${i}`);
        const avatarInput = document.getElementById(`team${i}_avatar`);
        const teamName = nameInput ? nameInput.value.trim() : '';
        const avatarUrl = avatarInput ? avatarInput.value.trim() : '';
        
        if (teamName) {
            avatarsData[teamName] = avatarUrl || '';
        }
    }
    
    console.log('Сохраняем аватары:', avatarsData);
    showStatus('status_saving_avatars', 'success');
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'saveAvatars',
                data: JSON.stringify(avatarsData)
            }).toString()
        });
        
        const result = await response.json();
        console.log('Результат сохранения:', result);
        
        if (result.success) {
            window.teamAvatars = {};
            for (const [name, avatar] of Object.entries(avatarsData)) {
                if (name && avatar) {
                    window.teamAvatars[name] = avatar;
                }
            }
            playSound('success');
            showStatus('status_avatars_saved', 'success');
            renderGroups();
            renderPlayoffs();
        } else {
            showToast(t('error_saving_to_google'), 'error', t('error'));
            playSound('error');
        }
    } catch(e) {
        console.error('Save avatars error:', e);
        playSound('error');
        showToast(t('error_saving_to_google'), 'error', t('error'));
    }
}

function showStatus(msgKey, type) {
    const d = document.getElementById('sync-status');
    if (!d) return;

    // Получаем сообщение
    let msg = t(msgKey);
    if (!msg || msg === msgKey) {
        msg = msgKey; // Если перевода нет, используем как есть
    }

    // Создаём HTML с анимацией
    const iconMap = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️'
    };
    const icon = iconMap[type] || 'ℹ️';

    // Стили для плавного появления
    const statusDiv = document.createElement('div');
    statusDiv.className = `status-${type}`;
    statusDiv.style.animation = 'fadeInStatus 0.3s ease-out';
    statusDiv.innerHTML = `${icon} ${msg}`;

    // Очищаем и добавляем новое сообщение
    d.innerHTML = '';
    d.appendChild(statusDiv);

    // Авто-скрытие через 4 секунды с плавным затуханием
    clearTimeout(d._hideTimeout);
    d._hideTimeout = setTimeout(() => {
        statusDiv.style.transition = 'opacity 0.5s ease';
        statusDiv.style.opacity = '0';
        setTimeout(() => {
            if (d.contains(statusDiv)) {
                d.innerHTML = '';
            }
        }, 500);
    }, 4000);
}

// ==================== TOAST УВЕДОМЛЕНИЯ ====================

function showToast(message, type = 'info', title = null, duration = 30000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    // Иконки для типов
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };

    const titles = {
        success: 'Успешно',
        error: 'Ошибка',
        warning: 'Предупреждение',
        info: 'Информация'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || 'ℹ️'}</span>
        <div class="toast-content">
            <div class="toast-title">${title || titles[type] || 'Информация'}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.closest('.toast').remove()">✕</button>
    `;

    container.appendChild(toast);

    // Авто-скрытие через указанное время (по умолчанию 30 секунд)
    const hideTimeout = setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.remove();
            }
        }, 400);
    }, duration);

    // Закрытие по кнопке
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            clearTimeout(hideTimeout);
            toast.classList.add('hiding');
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 400);
        });
    }
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function addDrawAnimation(element) {
    if (!element) return;
    element.classList.add('draw-animation');
    setTimeout(() => element.classList.remove('draw-animation'), 400);
}

// ==================== АВТО-ОБНОВЛЕНИЕ ДЛЯ ЗРИТЕЛЕЙ ====================

let autoRefreshInterval = null;
let lastKnownUpdate = null;
let isPageVisible = true;
let isUpdating = false;

// Следим за видимостью страницы
document.addEventListener('visibilitychange', function() {
    isPageVisible = !document.hidden;
    if (isPageVisible) {
        console.log('📱 Страница активна, авто-обновление возобновлено');
        // При возвращении на вкладку сразу проверяем обновления
        checkForUpdates();
    } else {
        console.log('📱 Страница скрыта, авто-обновление приостановлено');
    }
});

async function checkForUpdates() {
    if (isAdmin) return;
    if (!isPageVisible) return;
    if (isUpdating) {
        console.log('⏳ Уже идет обновление, пропускаем');
        return;
    }
    
    try {
        isUpdating = true;
        
        // Проверяем кеш — если он свежий (менее 2 минут), пропускаем
        const cached = getCachedData();
        if (cached) {
            const age = Date.now() - cached.timestamp;
            if (age < 120000) { // 2 минуты
                console.log(`📦 Кеш свежий (${Math.round(age / 1000)}с), пропускаем запрос`);
                isUpdating = false;
                return;
            }
        }
        
        // Легкий запрос на проверку изменений
        console.log('🔍 Проверяем изменения...');
        const response = await fetch(`${SCRIPT_URL}?action=getLastUpdate`);
        const data = await response.json();
        
        if (data.success) {
            const currentHash = data.lastUpdate;
            
            if (lastKnownUpdate && lastKnownUpdate !== currentHash) {
                console.log('🔄 Данные изменились! Загружаем обновления...');
                showToast(t('data_tournament_updated'), 'info', t('update'), 30000);
                
                // ========== ОЧИЩАЕМ ВСЕ КЕШИ ==========
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem('last_update_hash');
                localStorage.removeItem(TEAM_ROSTERS_CACHE_KEY); // ← ОЧИЩАЕМ КЕШ СОСТАВОВ
                localStorage.removeItem('prediction_cache');
                localStorage.removeItem(RULES_CACHE_KEY);
                console.log('All caches cleared on update');
                
                // Сбрасываем кеш в памяти
                teamRostersCache = null;
                window._rosters = null;
                
                // Загружаем все данные без спиннера
                await loadAllDataWithCache(false);
                
                // Принудительно загружаем ростера с сервера
                const rosters = await loadTeamRosters();
                if (rosters) {
                    window._rosters = rosters;
                    calculateTotalPowers(rosters);
                    renderGroups();
                    renderPlayoffs();
                    renderResults();
                }
                
                lastKnownUpdate = currentHash;
                window.lastKnownUpdate = currentHash;
                console.log('✅ Данные обновлены, новый хеш:', currentHash);
            } else if (!lastKnownUpdate) {
                lastKnownUpdate = currentHash;
                window.lastKnownUpdate = currentHash;
                console.log('✅ Начальный хеш сохранен:', currentHash);
            } else {
                console.log('✅ Изменений нет');
            }
        }
    } catch (error) {
        console.log('❌ Check for updates error:', error);
    } finally {
        isUpdating = false;
    }
}

function initAutoRefresh() {
    if (isAdmin) {
        console.log('Auto-refresh не запускается для администратора');
        return;
    }

    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
    }

    console.log('🚀 Auto-refresh запущен для зрителей (интервал: 30 секунд, только активная вкладка)');
    console.log('📊 Отслеживаем изменения в: Groups, Playoffs, GroupTeams (MVP)');

    window.autoRefreshInterval = autoRefreshInterval;
    window.isAdmin = isAdmin;
    window.isPageVisible = isPageVisible;

    try {
        const savedHash = localStorage.getItem('last_update_hash');
        if (savedHash) {
            lastKnownUpdate = savedHash;
            window.lastKnownUpdate = savedHash;
            console.log('📦 Загружен сохраненный хеш:', lastKnownUpdate);
        }
    } catch(e) {}

    // Проверяем кеш при первом запуске
    setTimeout(() => {
        const cached = getCachedData();
        if (cached) {
            console.log(`📦 Кеш существует, возраст: ${Math.round((Date.now() - cached.timestamp) / 1000)}с`);
            // ========== ВСЕГДА ПРОВЕРЯЕМ ОБНОВЛЕНИЯ ==========
            console.log('🔍 Проверяем обновления при старте...');
            checkForUpdates();
        } else {
            console.log('📦 Кеша нет, загружаем данные...');
            loadAllDataWithCache(false).then(() => {
                setTimeout(() => {
                    checkForUpdates();
                }, 1000);
            });
        }
    }, 1000);

    autoRefreshInterval = setInterval(() => {
        if (!isPageVisible) {
            console.log('📱 Страница не активна, пропускаем обновление');
            return;
        }
        checkForUpdates();
    }, 30000);
}

// ==================== ФОРМАТИРОВАНИЕ ДАТ ДЛЯ UTC ====================
function formatDateOnly(dateTimeStr) {
    if (!dateTimeStr) return '—';
    const match = dateTimeStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (match) {
        const [_, year, month, day] = match;
        return `${day}.${month}.${year}`;
    }
    return dateTimeStr;
}

function formatDateTimeFull(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr === '—' || dateTimeStr === '') return '—';
    const cleanStr = String(dateTimeStr);
    const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (match) {
        const [_, year, month, day, hours, minutes] = match;
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }
    return cleanStr;
}

function formatDateDisplay(dateStr) {
    if (!dateStr || dateStr === '—' || dateStr === '') return t('date_not_set');
    
    // Убираем Z если есть
    let cleanStr = String(dateStr);
    if (cleanStr.endsWith('Z')) {
        cleanStr = cleanStr.slice(0, -1);
    }
    
    const [datePart, timePart] = cleanStr.split('T');
    if (!datePart || !timePart) return cleanStr;
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function formatDateForInput(dateStr) {
    if (!dateStr || dateStr === '—' || dateStr === '') return '';
    const cleanStr = String(dateStr);
    const match = cleanStr.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
    if (match) {
        return `${match[1]}T${match[2]}`;
    }
    return '';
}

function formatUTCDisplay(dateTimeStr) {
    if (!dateTimeStr || dateTimeStr === '—' || dateTimeStr === '') return '—';
    return formatDateTimeFull(dateTimeStr);
}

// ==================== ПРОВЕРКА ЗАВЕРШЕНИЯ ГРУППОВОГО ЭТАПА ====================
function isGroupStageCompleted(group) {
    const matches = tournamentData.groups[group].matches || [];
    if (matches.length === 0) return false;
    const allMatchesCompleted = matches.every(match => match.winner && match.winner !== '');
    return allMatchesCompleted;
}

function areBothGroupsCompleted() {
    return isGroupStageCompleted('A') && isGroupStageCompleted('B');
}

// ==================== BEST OF 2 ДЛЯ ГРАНД-ФИНАЛА ====================
function calculateGrandFinalWinner(grandFinal) {
    if (!grandFinal) return '';

    // Проверяем, есть ли какие-либо данные о матчах
    const m1s1 = grandFinal.match1Score1 || 0;
    const m1s2 = grandFinal.match1Score2 || 0;
    const m2s1 = grandFinal.match2Score1 || 0;
    const m2s2 = grandFinal.match2Score2 || 0;
    const m3s1 = grandFinal.match3Score1 || 0;
    const m3s2 = grandFinal.match3Score2 || 0;

    // Если все матчи пустые (все очки = 0) — сбрасываем победителя
    const hasAnyData = (m1s1 > 0 || m1s2 > 0 || m2s1 > 0 || m2s2 > 0 || m3s1 > 0 || m3s2 > 0);

    if (!hasAnyData) {
        grandFinal.team1Score = 0;
        grandFinal.team2Score = 0;
        grandFinal.team1Points = 0;
        grandFinal.team2Points = 0;
        grandFinal.winner = '';
        return '';
    }

    // Определяем победителя каждого матча по очкам
    let wins1 = 0;
    let wins2 = 0;

    // Матч 1
    if (m1s1 > 0 || m1s2 > 0) {
        if (m1s1 > m1s2) wins1++;
        else if (m1s2 > m1s1) wins2++;
    }

    // Матч 2
    if (m2s1 > 0 || m2s2 > 0) {
        if (m2s1 > m2s2) wins1++;
        else if (m2s2 > m2s1) wins2++;
    }

    // Матч 3
    if (m3s1 > 0 || m3s2 > 0) {
        if (m3s1 > m3s2) wins1++;
        else if (m3s2 > m3s1) wins2++;
    }

    // Обновляем общий счёт побед
    grandFinal.team1Score = wins1;
    grandFinal.team2Score = wins2;

    // Суммируем очки за все матчи
    grandFinal.team1Points = m1s1 + m2s1 + m3s1;
    grandFinal.team2Points = m1s2 + m2s2 + m3s2;

    // Определяем победителя (до двух побед)
    if (wins1 >= 2) {
        grandFinal.winner = grandFinal.team1;
        return grandFinal.team1;
    }
    if (wins2 >= 2) {
        grandFinal.winner = grandFinal.team2;
        return grandFinal.team2;
    }

    // Если победитель ещё не определён (счёт 1:0, 0:1, 1:1) — сбрасываем
    grandFinal.winner = '';
    return '';
}

function isGrandFinalCompleted() {
    const grandFinal = tournamentData.playoffs.grandFinal;
    if (!grandFinal) return false;
    const winner = calculateGrandFinalWinner(grandFinal);
    return winner && winner !== '' && winner !== 'TBD';
}

function updateGrandFinal() {
    const grandFinal = tournamentData.playoffs.grandFinal;
    if (!grandFinal) return;

    // Сбрасываем победителя, если нет данных
    const m1s1 = grandFinal.match1Score1 || 0;
    const m1s2 = grandFinal.match1Score2 || 0;
    const m2s1 = grandFinal.match2Score1 || 0;
    const m2s2 = grandFinal.match2Score2 || 0;
    const m3s1 = grandFinal.match3Score1 || 0;
    const m3s2 = grandFinal.match3Score2 || 0;

    const hasAnyData = (m1s1 > 0 || m1s2 > 0 || m2s1 > 0 || m2s2 > 0 || m3s1 > 0 || m3s2 > 0);

    if (!hasAnyData) {
        grandFinal.team1Score = 0;
        grandFinal.team2Score = 0;
        grandFinal.team1Points = 0;
        grandFinal.team2Points = 0;
        grandFinal.winner = '';
        return;
    }

    // Суммируем очки за все матчи
    const total1 = m1s1 + m2s1 + m3s1;
    const total2 = m1s2 + m2s2 + m3s2;

    grandFinal.team1Points = total1;
    grandFinal.team2Points = total2;

    // Определяем победителя
    const winner = calculateGrandFinalWinner(grandFinal);
    if (winner) {
        grandFinal.winner = winner;
    } else {
        grandFinal.winner = '';
    }
}

// ==================== ПРИЗОВОЙ ФОНД ====================
async function loadPrizes() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getPrizes`);
        const data = await response.json();
        if (data && data.prizes) {
            prizeData = data.prizes;
            for (let i = 1; i <= 8; i++) {
                const input = document.getElementById(`prize-${i}`);
                if (input && prizeData[i]) {
                    input.value = prizeData[i];
                }
            }
            saveOriginalPrizes();
            updatePrizesButtonColor();
        }
    } catch (error) {
        console.log('loadPrizes error:', error);
    }
}

async function loadTeamsAndAvatarsFromSheet() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getTeamsList`);
        const data = await response.json();
        
        if (data.success && data.teams) {
            // Если приходит объект { "команда": "url" }
            if (typeof data.teams === 'object' && !Array.isArray(data.teams)) {
                const teamNames = Object.keys(data.teams);
                for (let i = 0; i < Math.min(teamNames.length, 8); i++) {
                    const nameInput = document.getElementById(`team${i + 1}`);
                    const avatarInput = document.getElementById(`team${i + 1}_avatar`);
                    
                    if (nameInput) nameInput.value = teamNames[i];
                    if (avatarInput && data.teams[teamNames[i]]) {
                        avatarInput.value = data.teams[teamNames[i]];
                    }
                }
                
                window.teamAvatars = {};
                for (const [name, avatar] of Object.entries(data.teams)) {
                    window.teamAvatars[name] = avatar;
                }
            }
            // Если приходит массив
            else if (Array.isArray(data.teams)) {
                for (let i = 0; i < Math.min(data.teams.length, 8); i++) {
                    const nameInput = document.getElementById(`team${i + 1}`);
                    const avatarInput = document.getElementById(`team${i + 1}_avatar`);
                    
                    if (nameInput && data.teams[i].name) nameInput.value = data.teams[i].name;
                    if (avatarInput && data.teams[i].avatar) avatarInput.value = data.teams[i].avatar;
                }
                
                window.teamAvatars = {};
                for (let i = 0; i < data.teams.length; i++) {
                    if (data.teams[i].name && data.teams[i].avatar) {
                        window.teamAvatars[data.teams[i].name] = data.teams[i].avatar;
                    }
                }
            }
            
            console.log('Названия команд и аватары загружены в поля');
            return true;
        }
        return false;
    } catch (error) {
        console.error('loadTeamsAndAvatarsFromSheet error:', error);
        return false;
    }
}

async function savePrizes() {
    if (!isAdmin) {
        showStatus('status_admin_required', 'error');
        playSound('error');
        return;
    }

    const newPrizeData = {};
    for (let i = 1; i <= 8; i++) {
        const input = document.getElementById(`prize-${i}`);
        if (input) {
            newPrizeData[i] = input.value.trim();
        }
    }

    const saveBtn = document.getElementById('save-prizes');
    const originalText = saveBtn ? saveBtn.innerHTML : 'СОХРАНИТЬ ПРИЗЫ';
    if (saveBtn) {
        saveBtn.innerHTML = '<span class="btn-spinner"></span><span class="btn-text">СОХРАНЕНИЕ...</span>';
        saveBtn.classList.add('saving');
        saveBtn.disabled = true;
        // Принудительно устанавливаем стили для сохранения размера
        saveBtn.style.display = 'inline-flex';
        saveBtn.style.alignItems = 'center';
        saveBtn.style.justifyContent = 'center';
    }

    showStatus('status_saving_prizes', 'success');

    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'prizes',
                data: JSON.stringify(newPrizeData)
            }).toString()
        });

        const result = await response.json();
        console.log('Prizes save result:', result);

        if (result.success) {
            prizeData = newPrizeData;
            showStatus('status_prizes_saved', 'success');
            showToast('Призы успешно сохранены', 'success', 'Сохранение');
            renderResults();
            saveOriginalPrizes();
            updatePrizesButtonColor();
        } else {
            showToast(t('error_saving_to_google'), 'error', t('error'));
            showToast('Не удалось сохранить призы', 'error', 'Ошибка');
        }
    } catch(e) {
        console.error('Save prizes error:', e);
        playSound('error');
        showToast(t('error_saving_to_google'), 'error', t('error'));
        showToast('Ошибка при сохранении призов', 'error', 'Ошибка');
    } finally {
        if (saveBtn) {
            saveBtn.classList.remove('saving');
            saveBtn.innerHTML = originalText;
            saveBtn.disabled = false;
        }
    }
}

// ==================== ЗАГРУЗКА ДАННЫХ ====================
async function loadSchedule() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/Schedule!A2:C20?key=${API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.values && data.values.length > 0) {
            for (let row of data.values) {
                const eventName = row[0];
                let startValue = row[1] || '—';
                let endValue = row[2] || '—';
                startValue = startValue.toString().trim();
                endValue = endValue.toString().trim();
                
                function parseDateFromSheet(value) {
                    if (!value || value === '—') return '';
                    let cleanValue = String(value);
                    if (cleanValue.startsWith("'")) {
                        cleanValue = cleanValue.substring(1);
                    }
                    const isoMatch = cleanValue.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
                    if (isoMatch) {
                        return cleanValue;
                    }
                    const dateOnlyMatch = cleanValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
                    if (dateOnlyMatch) {
                        return cleanValue + 'T00:00';
                    }
                    const match = cleanValue.match(/(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
                    if (match) {
                        const [_, day, month, year, hours = '00', minutes = '00'] = match;
                        return `${year}-${month}-${day}T${hours}:${minutes}`;
                    }
                    return '';
                }
                
                function formatDisplay(value) {
                    if (!value || value === '—') return '—';
                    const converted = parseDateFromSheet(value);
                    if (converted && converted.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
                        const [datePart, timePart] = converted.split('T');
                        const [year, month, day] = datePart.split('-');
                        const [hours, minutes] = timePart.split(':');
                        if (hours === '00' && minutes === '00') {
                            return `${day}.${month}.${year}`;
                        }
                        return `${day}.${month}.${year} ${hours}:${minutes}`;
                    }
                    return value;
                }
                
                if (eventName === 'Период турнира') {
                    const parsedStart = parseDateFromSheet(startValue);
                    const parsedEnd = parseDateFromSheet(endValue);
                    document.getElementById('tournament-period-start').textContent = formatDisplay(startValue);
                    document.getElementById('tournament-period-end').textContent = formatDisplay(endValue);
                    scheduleData.periodStart = parsedStart;
                    scheduleData.periodEnd = parsedEnd;
                } else if (eventName === 'Групповой этап') {
                    const parsedStart = parseDateFromSheet(startValue);
                    const parsedEnd = parseDateFromSheet(endValue);
                    document.getElementById('qf-period-start').textContent = formatDisplay(startValue);
                    document.getElementById('qf-period-end').textContent = formatDisplay(endValue);
                    scheduleData.qfStart = parsedStart;
                    scheduleData.qfEnd = parsedEnd;
                } else if (eventName === 'Плей-офф') {
                    const parsedStart = parseDateFromSheet(startValue);
                    const parsedEnd = parseDateFromSheet(endValue);
                    document.getElementById('sf-period-start').textContent = formatDisplay(startValue);
                    document.getElementById('sf-period-end').textContent = formatDisplay(endValue);
                    scheduleData.sfStart = parsedStart;
                    scheduleData.sfEnd = parsedEnd;
                } else if (eventName === 'Гранд-финал') {
                    const parsedStart = parseDateFromSheet(startValue);
                    document.getElementById('final-datetime').textContent = formatDisplay(startValue);
                    scheduleData.final = parsedStart;
                } else if (eventName === 'Призовой фонд') {
                    document.getElementById('prize-pool').textContent = startValue;
                    scheduleData.prizePool = startValue;
                }
            }
        }
        
        console.log('Schedule data after conversion:', {
            periodStart: scheduleData.periodStart,
            periodEnd: scheduleData.periodEnd,
            qfStart: scheduleData.qfStart,
            qfEnd: scheduleData.qfEnd,
            sfStart: scheduleData.sfStart,
            sfEnd: scheduleData.sfEnd,
            final: scheduleData.final
        });
        
        checkPastDates();
        startCountdownTimer();
        updateGroupStageAnimation();
    } catch (e) { console.log('Schedule load error:', e); }
}

function checkPastDates() {
    // Защита от undefined
    if (!scheduleData || typeof scheduleData !== 'object') {
        scheduleData = {
            periodStart: null, periodEnd: null,
            qfStart: null, qfEnd: null,
            sfStart: null, sfEnd: null,
            final: null,
            prizePool: ''
        };
        return;
    }
    
    const now = new Date();
    const todayUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate()
    ));

    function parseDateToUTC(dateStr) {
        if (!dateStr || dateStr === '—') return null;
        
        let cleanStr = String(dateStr);
        if (cleanStr.startsWith("'")) {
            cleanStr = cleanStr.substring(1);
        }
        
        // Формат: YYYY-MM-DD (без времени)
        const dateOnlyMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (dateOnlyMatch) {
            const [_, year, month, day] = dateOnlyMatch;
            const d = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0));
            return isNaN(d.getTime()) ? null : d;
        }
        
        // Формат: YYYY-MM-DDTHH:MM
        const isoMatch = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
        if (isoMatch) {
            const [_, year, month, day, hours, minutes] = isoMatch;
            const d = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes)));
            return isNaN(d.getTime()) ? null : d;
        }
        
        // Формат: DD.MM.YYYY (отображаемый)
        const rusMatch = cleanStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (rusMatch) {
            const [_, day, month, year] = rusMatch;
            const d = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), 0, 0, 0));
            return isNaN(d.getTime()) ? null : d;
        }
        
        // Формат: DD.MM.YYYY HH:MM
        const rusFullMatch = cleanStr.match(/^(\d{2})\.(\d{2})\.(\d{4})\s+(\d{2}):(\d{2})/);
        if (rusFullMatch) {
            const [_, day, month, year, hours, minutes] = rusFullMatch;
            const d = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes)));
            return isNaN(d.getTime()) ? null : d;
        }
        
        return null;
    }

    function checkElement(elementId, dateValue, isEndDate = false, startDateValue = null) {
        const element = document.getElementById(elementId);
        if (!element) return;
        element.classList.remove('past', 'past-start');
        if (!dateValue || dateValue === '—') return;
        
        const dateToCheck = parseDateToUTC(dateValue);
        if (!dateToCheck) return;
        
        const checkDateOnly = new Date(Date.UTC(
            dateToCheck.getUTCFullYear(),
            dateToCheck.getUTCMonth(),
            dateToCheck.getUTCDate()
        ));
        
        if (isEndDate) {
            if (checkDateOnly < todayUTC) {
                element.classList.add('past');
            }
        } else {
            let isStageCompleted = false;
            if (startDateValue && startDateValue !== '—') {
                const endDate = parseDateToUTC(startDateValue);
                if (endDate) {
                    const endDateOnly = new Date(Date.UTC(
                        endDate.getUTCFullYear(),
                        endDate.getUTCMonth(),
                        endDate.getUTCDate()
                    ));
                    isStageCompleted = endDateOnly < todayUTC;
                }
            }
            if (isStageCompleted) {
                element.classList.add('past');
            } else if (checkDateOnly < todayUTC) {
                element.classList.add('past-start');
            }
        }
    }

    checkElement('tournament-period-start', scheduleData.periodStart, false, scheduleData.periodEnd);
    checkElement('tournament-period-end', scheduleData.periodEnd, true);
    checkElement('qf-period-start', scheduleData.qfStart, false, scheduleData.qfEnd);
    checkElement('qf-period-end', scheduleData.qfEnd, true);
    checkElement('sf-period-start', scheduleData.sfStart, false, scheduleData.sfEnd);
    checkElement('sf-period-end', scheduleData.sfEnd, true);
    checkElement('final-datetime', scheduleData.final, true);
}

function fillScheduleEditor() {
    // Используем scheduleData, который уже загружен из Google Sheets
    const periodStartInput = document.getElementById('edit-period-start');
    const periodEndInput = document.getElementById('edit-period-end');
    const qfStartInput = document.getElementById('edit-qf-start');
    const qfEndInput = document.getElementById('edit-qf-end');
    const sfStartInput = document.getElementById('edit-sf-start');
    const sfEndInput = document.getElementById('edit-sf-end');
    const finalInput = document.getElementById('edit-final');
    const prizePoolInput = document.getElementById('edit-prize-pool');
    
    // Функция для безопасного преобразования даты в формат datetime-local
    function toDatetimeLocal(dateStr) {
        if (!dateStr || dateStr === '—' || dateStr === '') return '';
        
        let cleanStr = String(dateStr);
        if (cleanStr.startsWith("'")) cleanStr = cleanStr.substring(1);
        
        // Если уже в формате YYYY-MM-DDTHH:MM
        if (cleanStr.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/)) {
            return cleanStr.substring(0, 16);
        }
        
        // Если только дата YYYY-MM-DD
        if (cleanStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return cleanStr + 'T00:00';
        }
        
        // Парсим русский формат DD.MM.YYYY HH:MM
        const match = cleanStr.match(/(\d{2})\.(\d{2})\.(\d{4})(?:\s+(\d{2}):(\d{2}))?/);
        if (match) {
            const [_, day, month, year, hours = '00', minutes = '00'] = match;
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        
        return '';
    }
    
    if (periodStartInput) periodStartInput.value = toDatetimeLocal(scheduleData.periodStart);
    if (periodEndInput) periodEndInput.value = toDatetimeLocal(scheduleData.periodEnd);
    if (qfStartInput) qfStartInput.value = toDatetimeLocal(scheduleData.qfStart);
    if (qfEndInput) qfEndInput.value = toDatetimeLocal(scheduleData.qfEnd);
    if (sfStartInput) sfStartInput.value = toDatetimeLocal(scheduleData.sfStart);
    if (sfEndInput) sfEndInput.value = toDatetimeLocal(scheduleData.sfEnd);
    if (finalInput) finalInput.value = toDatetimeLocal(scheduleData.final);
    if (prizePoolInput) prizePoolInput.value = scheduleData.prizePool || '';
    
    // Сохраняем оригинальные значения для отслеживания изменений
    saveOriginalSchedule();
    updateScheduleButtonColor();
}

function updateGroupStageAnimation() {
    
    const groupAHeader = document.getElementById('group-A-matches-header');
    const groupBHeader = document.getElementById('group-B-matches-header');
    
    if (!groupAHeader || !groupBHeader) {
        return;
    }
    
    const isGroupACompleted = isGroupStageCompleted('A');
    const isGroupBCompleted = isGroupStageCompleted('B');
    
    if (!isGroupACompleted) {
        groupAHeader.classList.add('active');
    } else {
        groupAHeader.classList.remove('active');
    }
    
    if (!isGroupBCompleted) {
        groupBHeader.classList.add('active');
    } else {
        groupBHeader.classList.remove('active');
    }
}

// ==================== АНИМАЦИЯ ДЛЯ ПЛЕЙ-ОФФ ====================

function updatePlayoffAnimation() {
    const upperFinal = tournamentData.playoffs.upperFinal;
    const lowerSemi = tournamentData.playoffs.lowerSemi;
    const lowerFinal = tournamentData.playoffs.lowerFinal;
    const grandFinal = tournamentData.playoffs.grandFinal;
    
    function shouldBeActive(match) {
        if (!match) return false;
        const hasTwoTeams = match.team1 && match.team1 !== '' && match.team1 !== 'TBD' &&
                           match.team2 && match.team2 !== '' && match.team2 !== 'TBD';
        const noWinner = !match.winner || match.winner === '';
        return hasTwoTeams && noWinner;
    }
    
    const upperBracketHeader = document.querySelector('.upper-bracket h3');
    const lowerBracketHeader = document.querySelector('.lower-bracket h3');
    const finalBracketHeader = document.querySelector('.final-bracket h3');
    
    function ensureWrapper(header, bracketClass) {
        if (!header) return null;
        
        let wrapper = header.parentElement;
        if (!wrapper.classList.contains('playoff-bracket-header')) {
            wrapper = document.createElement('div');
            wrapper.className = 'playoff-bracket-header';
            header.parentNode.insertBefore(wrapper, header);
            wrapper.appendChild(header);
        }
        return wrapper;
    }
    
    if (upperBracketHeader) {
        const wrapper = ensureWrapper(upperBracketHeader, 'upper');
        if (shouldBeActive(upperFinal)) {
            wrapper.classList.add('active');
        } else {
            wrapper.classList.remove('active');
        }
    }
    
    if (lowerBracketHeader) {
        const wrapper = ensureWrapper(lowerBracketHeader, 'lower');
        const isActive = shouldBeActive(lowerSemi) || shouldBeActive(lowerFinal);
        if (isActive) {
            wrapper.classList.add('active');
        } else {
            wrapper.classList.remove('active');
        }
    }
    
    if (finalBracketHeader) {
        const wrapper = ensureWrapper(finalBracketHeader, 'final');
        if (shouldBeActive(grandFinal)) {
            wrapper.classList.add('active');
        } else {
            wrapper.classList.remove('active');
        }
    }
}

// ==================== ОТСЛЕЖИВАНИЕ ИЗМЕНЕНИЙ РАСПИСАНИЯ И ПРИЗОВ ====================

let originalScheduleData = {
    periodStart: '', periodEnd: '',
    qfStart: '', qfEnd: '',
    sfStart: '', sfEnd: '',
    final: '', prizePool: ''
};

let originalPrizeData = {1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: ''};

function saveOriginalSchedule() {
    originalScheduleData = {
        periodStart: scheduleData.periodStart || '',
        periodEnd: scheduleData.periodEnd || '',
        qfStart: scheduleData.qfStart || '',
        qfEnd: scheduleData.qfEnd || '',
        sfStart: scheduleData.sfStart || '',
        sfEnd: scheduleData.sfEnd || '',
        final: scheduleData.final || '',
        prizePool: scheduleData.prizePool || ''
    };
}

function saveOriginalPrizes() {
    for (let i = 1; i <= 8; i++) {
        const input = document.getElementById(`prize-${i}`);
        if (input) {
            originalPrizeData[i] = input.value.trim();
        } else {
            originalPrizeData[i] = prizeData[i] || '';
        }
    }
}

function checkScheduleChanges() {
    const periodStart = document.getElementById('edit-period-start')?.value || '';
    const periodEnd = document.getElementById('edit-period-end')?.value || '';
    const qfStart = document.getElementById('edit-qf-start')?.value || '';
    const qfEnd = document.getElementById('edit-qf-end')?.value || '';
    const sfStart = document.getElementById('edit-sf-start')?.value || '';
    const sfEnd = document.getElementById('edit-sf-end')?.value || '';
    const final = document.getElementById('edit-final')?.value || '';
    const prizePool = document.getElementById('edit-prize-pool')?.value || '';
    
    return periodStart !== originalScheduleData.periodStart ||
           periodEnd !== originalScheduleData.periodEnd ||
           qfStart !== originalScheduleData.qfStart ||
           qfEnd !== originalScheduleData.qfEnd ||
           sfStart !== originalScheduleData.sfStart ||
           sfEnd !== originalScheduleData.sfEnd ||
           final !== originalScheduleData.final ||
           prizePool !== originalScheduleData.prizePool;
}

function checkPrizesChanges() {
    for (let i = 1; i <= 8; i++) {
        const input = document.getElementById(`prize-${i}`);
        if (input) {
            const currentValue = input.value.trim();
            const originalValue = originalPrizeData[i] || '';
            if (currentValue !== originalValue) {
                console.log(`Prize ${i} changed: "${currentValue}" vs "${originalValue}"`);
                return true;
            }
        }
    }
    return false;
}

function updateScheduleButtonColor() {
    const btn = document.getElementById('save-schedule');
    if (btn) {
        if (checkScheduleChanges()) {
            btn.classList.add('has-changes');
        } else {
            btn.classList.remove('has-changes');
        }
    }
}

function updatePrizesButtonColor() {
    const btn = document.getElementById('save-prizes');
    if (btn) {
        if (checkPrizesChanges()) {
            btn.classList.add('has-changes');
        } else {
            btn.classList.remove('has-changes');
        }
    }
}

function initScheduleTracking() {
    saveOriginalSchedule();
    
    const fields = ['edit-period-start', 'edit-period-end', 'edit-qf-start', 'edit-qf-end', 
                    'edit-sf-start', 'edit-sf-end', 'edit-final', 'edit-prize-pool'];
    
    const onInputChange = () => {
        scheduleData.periodStart = document.getElementById('edit-period-start')?.value || '';
        scheduleData.periodEnd = document.getElementById('edit-period-end')?.value || '';
        scheduleData.qfStart = document.getElementById('edit-qf-start')?.value || '';
        scheduleData.qfEnd = document.getElementById('edit-qf-end')?.value || '';
        scheduleData.sfStart = document.getElementById('edit-sf-start')?.value || '';
        scheduleData.sfEnd = document.getElementById('edit-sf-end')?.value || '';
        scheduleData.final = document.getElementById('edit-final')?.value || '';
        scheduleData.prizePool = document.getElementById('edit-prize-pool')?.value || '';
        
        updateScheduleButtonColor();
    };
    
    fields.forEach(fieldId => {
        const element = document.getElementById(fieldId);
        if (element) {
            element.addEventListener('input', onInputChange);
            element.addEventListener('change', onInputChange);
        }
    });
    
    updateScheduleButtonColor();
}

function initPrizesTracking() {
    saveOriginalPrizes();
    
    const onInputChange = () => {
        updatePrizesButtonColor();
    };
    
    for (let i = 1; i <= 8; i++) {
        const input = document.getElementById(`prize-${i}`);
        if (input) {
            input.addEventListener('input', onInputChange);
            input.addEventListener('change', onInputChange);
        }
    }
    
    updatePrizesButtonColor();
}

// ==================== ТАЙМЕР ====================
function startCountdownTimer() {
    if (timerInterval) clearInterval(timerInterval);
    
    const timerDiv = document.getElementById('countdown-timer');
    const timerSpan = document.getElementById('next-match-timer');
    if (!timerDiv || !timerSpan) return;

    function parseDate(dateStr) {
        if (!dateStr || dateStr === '—') return null;
        let dateTimeStr = dateStr;
        if (dateTimeStr.length === 16) {
            dateTimeStr = dateTimeStr + ':00';
        }
        const d = new Date(dateTimeStr + 'Z');
        return isNaN(d.getTime()) ? null : d;
    }

    function getNextMatchInfo() {
        const nowUTC = new Date();
        let nextMatch = null, nextDate = null;
        
        const qfDate = parseDate(scheduleData.qfStart);
        if (qfDate && qfDate > nowUTC && (!nextDate || qfDate < nextDate)) {
            nextDate = qfDate;
            nextMatch = { name: t('group_stage'), date: qfDate };
        }
        
        const sfDate = parseDate(scheduleData.sfStart);
        if (sfDate && sfDate > nowUTC && (!nextDate || sfDate < nextDate)) {
            nextDate = sfDate;
            nextMatch = { name: t('playoffs'), date: sfDate };
        }
        
        const finalDate = parseDate(scheduleData.final);
        if (finalDate && finalDate > nowUTC && (!nextDate || finalDate < nextDate)) {
            nextDate = finalDate;
            nextMatch = { name: t('grand_final'), date: finalDate };
        }
        
        return nextMatch;
    }

    function updateTimer() {
        const nextMatch = getNextMatchInfo();
        if (!nextMatch) {
            timerDiv.style.display = 'none';
            return;
        }

        const nowUTC = new Date();
        const diff = nextMatch.date - nowUTC;

        // Убираем двоеточие из названия, если оно есть
        let matchName = nextMatch.name.replace(/:$/, '');

        if (diff <= 0) {
            timerSpan.textContent = matchName + ' — ' + t('on_air');
            timerDiv.style.display = 'flex';
            return;
        }

        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        let timerText = '';
        if (days > 0) timerText += days + 'д ';
        if (hours > 0 || days > 0) timerText += hours + 'ч ';
        timerText += minutes + 'м ' + seconds + 'с';

        timerSpan.textContent = matchName + ': ' + timerText;
        timerDiv.style.display = 'flex';
    }
    
    updateTimer();
    updateGroupStageAnimation();
    timerInterval = setInterval(updateTimer, 1000);
}

function updateDrawSectionVisibility() {
    const drawSection = document.querySelector('.draw-section');
    if (!drawSection) return;
    
    const hasTeamsInGroups = (tournamentData.groups.A.teams && tournamentData.groups.A.teams.length > 0) ||
                             (tournamentData.groups.B.teams && tournamentData.groups.B.teams.length > 0);
    
    const isDrawCompleted = (tournamentData.groups.A.teams && tournamentData.groups.A.teams.length === 4) &&
                            (tournamentData.groups.B.teams && tournamentData.groups.B.teams.length === 4);
    
    if (isDrawCompleted && hasTeamsInGroups) {
        drawSection.classList.add('hidden');
    } else {
        drawSection.classList.remove('hidden');
    }
}

async function loadDrawStatus() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getDrawStatus`);
        const data = await response.json();
        let drawCompleted = data.drawCompleted || false;
        
        const hasTeamsInGroups = (tournamentData.groups.A.teams && tournamentData.groups.A.teams.length > 0) ||
                                 (tournamentData.groups.B.teams && tournamentData.groups.B.teams.length > 0);
        
        const isDrawCompleted = drawCompleted || 
                                (tournamentData.groups.A.teams && tournamentData.groups.A.teams.length === 4 && 
                                 tournamentData.groups.B.teams && tournamentData.groups.B.teams.length === 4);
        
        const drawSection = document.querySelector('.draw-section');
        if (drawSection) {
            if (isDrawCompleted) {
                drawSection.classList.add('hidden');
                const saveDrawBtn = document.getElementById('save-draw');
                if (saveDrawBtn) saveDrawBtn.style.display = 'none';
            } else {
                drawSection.classList.remove('hidden');
            }
        }
        
        return isDrawCompleted;
    } catch (error) { 
        console.log('loadDrawStatus error:', error);
        return false; 
    }
}

async function loadTournamentData() {
    try {
        const response = await fetch(`${SCRIPT_URL}?action=getTournamentData`);
        const data = await response.json();
        if (data && data.tournamentData) {
            const rawData = data.tournamentData;
            
            if (!rawData.groups) rawData.groups = { A: { teams: [], matches: [] }, B: { teams: [], matches: [] } };
            if (!rawData.groups.A) rawData.groups.A = { teams: [], matches: [] };
            if (!rawData.groups.B) rawData.groups.B = { teams: [], matches: [] };
            if (!rawData.groups.A.teams) rawData.groups.A.teams = [];
            if (!rawData.groups.B.teams) rawData.groups.B.teams = [];
            if (!rawData.groups.A.matches) rawData.groups.A.matches = [];
            if (!rawData.groups.B.matches) rawData.groups.B.matches = [];
            
            rawData.groups.A.teams = rawData.groups.A.teams.map(t => t === null || t === undefined ? '' : String(t));
            rawData.groups.B.teams = rawData.groups.B.teams.map(t => t === null || t === undefined ? '' : String(t));
            
            if (rawData.groups.A.matches) {
                rawData.groups.A.matches = rawData.groups.A.matches.filter(m => m && typeof m === 'object').map(m => ({
                    ...m,
                    team1: m.team1 ? String(m.team1) : 'TBD',
                    team2: m.team2 ? String(m.team2) : 'TBD',
                    winner: m.winner ? String(m.winner) : '',
                    streamUrl: m.streamUrl || '',
                    date: m.date || '',
                    score1: m.score1 || 0,
                    score2: m.score2 || 0,
                    points1: m.points1 || 0,
                    points2: m.points2 || 0
                }));
            }
            
            if (rawData.groups.B.matches) {
                rawData.groups.B.matches = rawData.groups.B.matches.filter(m => m && typeof m === 'object').map(m => ({
                    ...m,
                    team1: m.team1 ? String(m.team1) : 'TBD',
                    team2: m.team2 ? String(m.team2) : 'TBD',
                    winner: m.winner ? String(m.winner) : '',
                    streamUrl: m.streamUrl || '',
                    date: m.date || '',
                    score1: m.score1 || 0,
                    score2: m.score2 || 0,
                    points1: m.points1 || 0,
                    points2: m.points2 || 0
                }));
            }
            
            if (!rawData.playoffs) {
                rawData.playoffs = {};
            }
            
            const matches = ['upperFinal', 'lowerSemi', 'lowerFinal', 'grandFinal'];
            matches.forEach(match => {
                if (!rawData.playoffs[match]) {
                    rawData.playoffs[match] = {};
                }
                
                if (rawData.playoffs[match].team1 === 0 || rawData.playoffs[match].team1 === '0') {
                    rawData.playoffs[match].team1 = '';
                }
                if (rawData.playoffs[match].team2 === 0 || rawData.playoffs[match].team2 === '0') {
                    rawData.playoffs[match].team2 = '';
                }
                if (rawData.playoffs[match].winner === 0 || rawData.playoffs[match].winner === '0') {
                    rawData.playoffs[match].winner = '';
                }
                
                if (rawData.playoffs[match].date === 0 || rawData.playoffs[match].date === '0') {
                    rawData.playoffs[match].date = '';
                }
                if (rawData.playoffs[match].date && typeof rawData.playoffs[match].date === 'string') {
                    const dateMatch = rawData.playoffs[match].date.match(/(\d{2})\.(\d{2})\.(\d{4})\s+(\d{1,2}):(\d{2})/);
                    if (dateMatch) {
                        const [_, day, month, year, hours, minutes] = dateMatch;
                        const hh = hours.padStart(2, '0');
                        rawData.playoffs[match].date = `${year}-${month}-${day}T${hh}:${minutes}`;
                    }
                }
                
                if (rawData.playoffs[match].streamUrl === 0 || rawData.playoffs[match].streamUrl === '0') {
                    rawData.playoffs[match].streamUrl = '';
                }
                
                rawData.playoffs[match].team1Score = rawData.playoffs[match].team1Score || 0;
                rawData.playoffs[match].team2Score = rawData.playoffs[match].team2Score || 0;
                rawData.playoffs[match].team1Points = rawData.playoffs[match].team1Points || 0;
                rawData.playoffs[match].team2Points = rawData.playoffs[match].team2Points || 0;
            });
            
            tournamentData = rawData;

            const avatars = data.avatars || {};
            window.teamAvatars = avatars;

            window._originalGroupAMatches = JSON.parse(JSON.stringify(tournamentData.groups.A.matches || []));
            window._originalGroupBMatches = JSON.parse(JSON.stringify(tournamentData.groups.B.matches || []));
            window._originalPlayoffs = {
                upperFinal: JSON.parse(JSON.stringify(tournamentData.playoffs.upperFinal)),
                lowerSemi: JSON.parse(JSON.stringify(tournamentData.playoffs.lowerSemi)),
                lowerFinal: JSON.parse(JSON.stringify(tournamentData.playoffs.lowerFinal)),
                grandFinal: JSON.parse(JSON.stringify(tournamentData.playoffs.grandFinal))
            };

            tempPlayoffStreamUrls.upperFinal = tournamentData.playoffs.upperFinal?.streamUrl || '';
            tempPlayoffStreamUrls.lowerSemi = tournamentData.playoffs.lowerSemi?.streamUrl || '';
            tempPlayoffStreamUrls.lowerFinal = tournamentData.playoffs.lowerFinal?.streamUrl || '';
            tempPlayoffStreamUrls.grandFinal = tournamentData.playoffs.grandFinal?.streamUrl || '';

            tempPlayoffDates.upperFinal = tournamentData.playoffs.upperFinal?.date || '';
            tempPlayoffDates.lowerSemi = tournamentData.playoffs.lowerSemi?.date || '';
            tempPlayoffDates.lowerFinal = tournamentData.playoffs.lowerFinal?.date || '';
            tempPlayoffDates.grandFinal = tournamentData.playoffs.grandFinal?.date || '';
            
            groupATeamsList = [...(tournamentData.groups.A.teams || [])];
            groupBTeamsList = [...(tournamentData.groups.B.teams || [])];
            
            groupATeamsList = groupATeamsList.filter(t => t && t !== '');
            groupBTeamsList = groupBTeamsList.filter(t => t && t !== '');
            
            tournamentData.groups.A.teams = groupATeamsList;
            tournamentData.groups.B.teams = groupBTeamsList;
            
            updateTeamsInputStatus();
            
            if (groupATeamsList.length === 4 && groupBTeamsList.length === 4) {
                currentDrawStep = 4;
                remainingTeamsAll = [];
            }
            
            renderGroups();
            renderPlayoffs();
            updateDrawStatus();
            updateDrawButtons();
            updatePlayoffsBracket();
            updatePlayoffAnimation();
            updateDrawSectionVisibility();
            updateGroupStageAnimation();
            return true;
        }
        return false;
    } catch (error) { 
        console.log('loadTournamentData error:', error);
        return false; 
    }
}

// ==================== ПОЛУЧЕНИЕ КОМАНД, ВЫШЕДШИХ В ПЛЕЙ-ОФФ ====================
function getGroupWinnersList() {
    const winners = [];
    
    // Получаем ТОП-2 команды из группы A
    const groupAWinners = getGroupWinners(tournamentData.groups.A);
    if (groupAWinners && groupAWinners.length > 0) {
        // 1-е место
        if (groupAWinners[0] && groupAWinners[0].name) {
            winners.push(groupAWinners[0].name);
        }
        // 2-е место
        if (groupAWinners[1] && groupAWinners[1].name) {
            winners.push(groupAWinners[1].name);
        }
    }
    
    // Получаем ТОП-2 команды из группы B
    const groupBWinners = getGroupWinners(tournamentData.groups.B);
    if (groupBWinners && groupBWinners.length > 0) {
        // 1-е место
        if (groupBWinners[0] && groupBWinners[0].name) {
            winners.push(groupBWinners[0].name);
        }
        // 2-е место
        if (groupBWinners[1] && groupBWinners[1].name) {
            winners.push(groupBWinners[1].name);
        }
    }
    
    return winners;
}

// ==================== ОБНОВЛЕНИЕ ПЛЕЙ-ОФФ ====================
function getGroupWinners(group) {
    const teams = group.teams || [];
    const matches = group.matches || [];
    const teamsWithStats = teams.map(teamName => {
        let wins = 0, totalPoints = 0;
        matches.forEach(match => {
            if (match.team1 === teamName && match.winner === teamName) { wins++; totalPoints += (match.points1 || 0); }
            if (match.team2 === teamName && match.winner === teamName) { wins++; totalPoints += (match.points2 || 0); }
        });
        return { name: teamName, wins: wins || 0, points: totalPoints || 0 };
    });
    teamsWithStats.sort((a, b) => b.wins - a.wins || b.points - a.points);
    return teamsWithStats;
}

function cleanTBDFromPlayoffs() {
    const playoffs = tournamentData.playoffs;
    
    if (!playoffs.upperFinal.winner) {
        if (playoffs.grandFinal.team1 === playoffs.upperFinal.team1 || 
            playoffs.grandFinal.team1 === playoffs.upperFinal.team2) {
            playoffs.grandFinal.team1 = '';
        }
        if (playoffs.lowerFinal.team1 === playoffs.upperFinal.team1 || 
            playoffs.lowerFinal.team1 === playoffs.upperFinal.team2) {
            playoffs.lowerFinal.team1 = '';
        }
    }
    
    if (!playoffs.lowerSemi.winner) {
        if (playoffs.lowerFinal.team2 === playoffs.lowerSemi.team1 || 
            playoffs.lowerFinal.team2 === playoffs.lowerSemi.team2) {
            playoffs.lowerFinal.team2 = '';
        }
    }
    
    if (!playoffs.lowerFinal.winner) {
        if (playoffs.grandFinal.team2 === playoffs.lowerFinal.team1 || 
            playoffs.grandFinal.team2 === playoffs.lowerFinal.team2) {
            playoffs.grandFinal.team2 = '';
        }
    }
    
    if (playoffs.upperFinal.team1 === 'TBD') playoffs.upperFinal.team1 = '';
    if (playoffs.upperFinal.team2 === 'TBD') playoffs.upperFinal.team2 = '';
    if (playoffs.upperFinal.winner === 'TBD') playoffs.upperFinal.winner = '';
    
    if (playoffs.lowerSemi.team1 === 'TBD') playoffs.lowerSemi.team1 = '';
    if (playoffs.lowerSemi.team2 === 'TBD') playoffs.lowerSemi.team2 = '';
    if (playoffs.lowerSemi.winner === 'TBD') playoffs.lowerSemi.winner = '';
    
    if (playoffs.lowerFinal.team1 === 'TBD') playoffs.lowerFinal.team1 = '';
    if (playoffs.lowerFinal.team2 === 'TBD') playoffs.lowerFinal.team2 = '';
    if (playoffs.lowerFinal.winner === 'TBD') playoffs.lowerFinal.winner = '';
    
    if (playoffs.grandFinal.team1 === 'TBD') playoffs.grandFinal.team1 = '';
    if (playoffs.grandFinal.team2 === 'TBD') playoffs.grandFinal.team2 = '';
    if (playoffs.grandFinal.winner === 'TBD') playoffs.grandFinal.winner = '';
}

function updatePlayoffsBracket() {
    // Защита от undefined
    if (!tournamentData || !tournamentData.playoffs) {
        return;
    }
    
    // Убедимся, что все объекты существуют
    if (!tournamentData.playoffs.upperFinal) {
        tournamentData.playoffs.upperFinal = { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' };
    }
    if (!tournamentData.playoffs.lowerSemi) {
        tournamentData.playoffs.lowerSemi = { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' };
    }
    if (!tournamentData.playoffs.lowerFinal) {
        tournamentData.playoffs.lowerFinal = { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' };
    }
    if (!tournamentData.playoffs.grandFinal) {
        tournamentData.playoffs.grandFinal = { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' };
    }
    
    const savedDates = {
        upperFinal: tournamentData.playoffs.upperFinal?.date || '',
        lowerSemi: tournamentData.playoffs.lowerSemi?.date || '',
        lowerFinal: tournamentData.playoffs.lowerFinal?.date || '',
        grandFinal: tournamentData.playoffs.grandFinal?.date || ''
    };
    
    const savedStreamUrls = {
        upperFinal: tournamentData.playoffs.upperFinal?.streamUrl || '',
        lowerSemi: tournamentData.playoffs.lowerSemi?.streamUrl || '',
        lowerFinal: tournamentData.playoffs.lowerFinal?.streamUrl || '',
        grandFinal: tournamentData.playoffs.grandFinal?.streamUrl || ''
    };
    
    const savedScores = {
        upperFinal: { score1: tournamentData.playoffs.upperFinal?.team1Score || 0, score2: tournamentData.playoffs.upperFinal?.team2Score || 0 },
        lowerSemi: { score1: tournamentData.playoffs.lowerSemi?.team1Score || 0, score2: tournamentData.playoffs.lowerSemi?.team2Score || 0 },
        lowerFinal: { score1: tournamentData.playoffs.lowerFinal?.team1Score || 0, score2: tournamentData.playoffs.lowerFinal?.team2Score || 0 },
        grandFinal: { score1: tournamentData.playoffs.grandFinal?.team1Score || 0, score2: tournamentData.playoffs.grandFinal?.team2Score || 0 }
    };
    
    const savedPoints = {
        upperFinal: { points1: tournamentData.playoffs.upperFinal?.team1Points || 0, points2: tournamentData.playoffs.upperFinal?.team2Points || 0 },
        lowerSemi: { points1: tournamentData.playoffs.lowerSemi?.team1Points || 0, points2: tournamentData.playoffs.lowerSemi?.team2Points || 0 },
        lowerFinal: { points1: tournamentData.playoffs.lowerFinal?.team1Points || 0, points2: tournamentData.playoffs.lowerFinal?.team2Points || 0 },
        grandFinal: { points1: tournamentData.playoffs.grandFinal?.team1Points || 0, points2: tournamentData.playoffs.grandFinal?.team2Points || 0 }
    };
    
    const groupACompleted = isGroupStageCompleted('A');
    const groupBCompleted = isGroupStageCompleted('B');
    
    const groupAWinners = getGroupWinners(tournamentData.groups.A);
    const groupBWinners = getGroupWinners(tournamentData.groups.B);
    
    cleanTBDFromPlayoffs();
    
    if (groupACompleted && groupAWinners[0] && groupAWinners[0].name) {
        tournamentData.playoffs.upperFinal.team1 = groupAWinners[0].name;
    } else if (!groupACompleted) {
        tournamentData.playoffs.upperFinal.team1 = '';
    }
    
    if (groupBCompleted && groupBWinners[0] && groupBWinners[0].name) {
        tournamentData.playoffs.upperFinal.team2 = groupBWinners[0].name;
    } else if (!groupBCompleted) {
        tournamentData.playoffs.upperFinal.team2 = '';
    }
    
    if (groupACompleted && groupAWinners[1] && groupAWinners[1].name) {
        tournamentData.playoffs.lowerSemi.team1 = groupAWinners[1].name;
    } else if (!groupACompleted) {
        tournamentData.playoffs.lowerSemi.team1 = '';
    }
    
    if (groupBCompleted && groupBWinners[1] && groupBWinners[1].name) {
        tournamentData.playoffs.lowerSemi.team2 = groupBWinners[1].name;
    } else if (!groupBCompleted) {
        tournamentData.playoffs.lowerSemi.team2 = '';
    }
    
    tournamentData.playoffs.upperFinal.date = savedDates.upperFinal || tempPlayoffDates.upperFinal;
    tournamentData.playoffs.upperFinal.team1Score = savedScores.upperFinal.score1;
    tournamentData.playoffs.upperFinal.team2Score = savedScores.upperFinal.score2;
    tournamentData.playoffs.upperFinal.team1Points = savedPoints.upperFinal.points1;
    tournamentData.playoffs.upperFinal.team2Points = savedPoints.upperFinal.points2;
    
    tournamentData.playoffs.lowerSemi.date = savedDates.lowerSemi || tempPlayoffDates.lowerSemi;
    tournamentData.playoffs.lowerSemi.team1Score = savedScores.lowerSemi.score1;
    tournamentData.playoffs.lowerSemi.team2Score = savedScores.lowerSemi.score2;
    tournamentData.playoffs.lowerSemi.team1Points = savedPoints.lowerSemi.points1;
    tournamentData.playoffs.lowerSemi.team2Points = savedPoints.lowerSemi.points2;
    
    tournamentData.playoffs.lowerFinal.date = savedDates.lowerFinal || tempPlayoffDates.lowerFinal;
    tournamentData.playoffs.lowerFinal.team1Score = savedScores.lowerFinal.score1;
    tournamentData.playoffs.lowerFinal.team2Score = savedScores.lowerFinal.score2;
    tournamentData.playoffs.lowerFinal.team1Points = savedPoints.lowerFinal.points1;
    tournamentData.playoffs.lowerFinal.team2Points = savedPoints.lowerFinal.points2;
    
    tournamentData.playoffs.grandFinal.date = savedDates.grandFinal || tempPlayoffDates.grandFinal;
    tournamentData.playoffs.grandFinal.team1Score = savedScores.grandFinal.score1;
    tournamentData.playoffs.grandFinal.team2Score = savedScores.grandFinal.score2;
    tournamentData.playoffs.grandFinal.team1Points = savedPoints.grandFinal.points1;
    tournamentData.playoffs.grandFinal.team2Points = savedPoints.grandFinal.points2;

    tournamentData.playoffs.upperFinal.streamUrl = savedStreamUrls.upperFinal || tempPlayoffStreamUrls.upperFinal;
    tournamentData.playoffs.lowerSemi.streamUrl = savedStreamUrls.lowerSemi || tempPlayoffStreamUrls.lowerSemi;
    tournamentData.playoffs.lowerFinal.streamUrl = savedStreamUrls.lowerFinal || tempPlayoffStreamUrls.lowerFinal;
    tournamentData.playoffs.grandFinal.streamUrl = savedStreamUrls.grandFinal || tempPlayoffStreamUrls.grandFinal;

    tempPlayoffDates.upperFinal = tournamentData.playoffs.upperFinal.date;
    tempPlayoffDates.lowerSemi = tournamentData.playoffs.lowerSemi.date;
    tempPlayoffDates.lowerFinal = tournamentData.playoffs.lowerFinal.date;
    tempPlayoffDates.grandFinal = tournamentData.playoffs.grandFinal.date;
    
    tempPlayoffDates.upperFinal = tournamentData.playoffs.upperFinal.date;
    tempPlayoffDates.lowerSemi = tournamentData.playoffs.lowerSemi.date;
    tempPlayoffDates.lowerFinal = tournamentData.playoffs.lowerFinal.date;
    tempPlayoffDates.grandFinal = tournamentData.playoffs.grandFinal.date;
    
    const upperFinal = tournamentData.playoffs.upperFinal;
    const lowerSemi = tournamentData.playoffs.lowerSemi;
    const lowerFinal = tournamentData.playoffs.lowerFinal;
    const grandFinal = tournamentData.playoffs.grandFinal;
    
    // ========== ОЧИЩАЕМ ГРАНД-ФИНАЛ, ЕСЛИ НЕТ ПОБЕДИТЕЛЕЙ ==========
    // Если нет победителя верхнего финала — очищаем team1 гранд-финала
    if (!upperFinal.winner || upperFinal.winner === '') {
        grandFinal.team1 = '';
    }
    
    // Если нет победителя нижнего финала — очищаем team2 гранд-финала
    if (!lowerFinal.winner || lowerFinal.winner === '') {
        grandFinal.team2 = '';
    }
    // ================================================================
    
    if (upperFinal.winner && upperFinal.winner !== '') {
        grandFinal.team1 = upperFinal.winner;
        
        const upperLoser = upperFinal.team1 === upperFinal.winner ? upperFinal.team2 : upperFinal.team1;
        if (upperLoser && upperLoser !== '') {
            lowerFinal.team1 = upperLoser;
        }
    }
    
    if (lowerSemi.winner && lowerSemi.winner !== '') {
        lowerFinal.team2 = lowerSemi.winner;
    }
    
    if (lowerFinal.winner && lowerFinal.winner !== '') {
        grandFinal.team2 = lowerFinal.winner;
    }
    
    renderPlayoffs();
    renderResults();
    updatePlayoffAnimation();
    // ========== АВТО-ОБНОВЛЕНИЕ ГРАНД-ФИНАЛА ==========
    updateGrandFinal();    
}

// ==================== ИНИЦИАЛИЗАЦИЯ МАТЧЕЙ ГРУПП ====================
function initGroupMatches() {
    const groupATeams = tournamentData.groups.A.teams || [];
    const groupBTeams = tournamentData.groups.B.teams || [];
    
    if (groupATeams.length === 4 && tournamentData.groups.A.matches.length === 0) {
        tournamentData.groups.A.matches = [
            { id: 1, team1: groupATeams[0], team2: groupATeams[1], score1: 0, score2: 0, points1: 0, points2: 0, winner: '', stream: 1, streamUrl: '', date: '' },
            { id: 2, team1: groupATeams[2], team2: groupATeams[3], score1: 0, score2: 0, points1: 0, points2: 0, winner: '', stream: 2, streamUrl: '', date: '' },
            { id: 3, team1: groupATeams[0], team2: groupATeams[2], score1: 0, score2: 0, points1: 0, points2: 0, winner: '', stream: 3, streamUrl: '', date: '' },
            { id: 4, team1: groupATeams[1], team2: groupATeams[3], score1: 0, score2: 0, points1: 0, points2: 0, winner: '', stream: 3, streamUrl: '', date: '' },
            { id: 5, team1: groupATeams[0], team2: groupATeams[3], score1: 0, score2: 0, points1: 0, points2: 0, winner: '', stream: 4, streamUrl: '', date: '' },
            { id: 6, team1: groupATeams[1], team2: groupATeams[2], score1: 0, score2: 0, points1: 0, points2: 0, winner: '', stream: 1, streamUrl: '', date: '' }
        ];
    }
    
    if (groupBTeams.length === 4 && tournamentData.groups.B.matches.length === 0) {
        tournamentData.groups.B.matches = [
            { id: 1, team1: groupBTeams[0], team2: groupBTeams[1], score1: 0, score2: 0, points1: 0, points2: 0, winner: '', stream: 2, streamUrl: '', date: '' },
            { id: 2, team1: groupBTeams[2], team2: groupBTeams[3], score1: 0, score2: 0, points1: 0, points2: 0, winner: '', stream: 1, streamUrl: '', date: '' },
            { id: 3, team1: groupBTeams[0], team2: groupBTeams[2], score1: 0, score2: 0, points1: 0, points2: 0, winner: '', stream: 4, streamUrl: '', date: '' },
            { id: 4, team1: groupBTeams[1], team2: groupBTeams[3], score1: 0, score2: 0, points1: 0, points2: 0, winner: '', stream: 4, streamUrl: '', date: '' },
            { id: 5, team1: groupBTeams[0], team2: groupBTeams[3], score1: 0, score2: 0, points1: 0, points2: 0, winner: '', stream: 3, streamUrl: '', date: '' },
            { id: 6, team1: groupBTeams[1], team2: groupBTeams[2], score1: 0, score2: 0, points1: 0, points2: 0, winner: '', stream: 2, streamUrl: '', date: '' }
        ];
    }

    updateGroupStageAnimation();    
}

function getLiveStatus(matchDate, matchWinner) {
    if (!matchDate) return { isLive: false, isFinished: false };
    
    const now = new Date();
    const nowUTC = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        now.getUTCHours(),
        now.getUTCMinutes(),
        now.getUTCSeconds()
    ));
    
    let matchTimeStr = matchDate;
    if (matchTimeStr.length === 16) {
        matchTimeStr = matchTimeStr + ':00';
    }
    const matchTime = new Date(matchTimeStr + 'Z');
    
    if (isNaN(matchTime.getTime())) return { isLive: false, isFinished: false };
    
    const diffMinutes = (nowUTC - matchTime) / (1000 * 60);
    
    if (matchTime > nowUTC) return { isLive: false, isFinished: false };
    if (diffMinutes < 60 && (!matchWinner || matchWinner === '')) return { isLive: true, isFinished: false };
    return { isLive: false, isFinished: true };
}

function getTeamRankings(group) {
    const teams = tournamentData.groups[group].teams || [];
    const matches = tournamentData.groups[group].matches || [];
    const rosters = window._rosters || (teamRostersCache ? teamRostersCache.data : null);

    const teamsWithStats = teams.map(teamItem => {
        const teamName = typeof teamItem === 'object' ? teamItem.name : teamItem;
        if (!teamName || teamName === '') return { name: '—', wins: 0, points: 0, mvp: '', mvpCount: 0 };

        let wins = 0, totalPoints = 0;
        matches.forEach(match => {
            if (match.team1 === teamName && match.winner === teamName) { wins++; totalPoints += (match.points1 || 0); }
            if (match.team2 === teamName && match.winner === teamName) { wins++; totalPoints += (match.points2 || 0); }
        });

        let totalMVP = 0;
        if (rosters && rosters[teamName]) {
            for (const player of rosters[teamName]) {
                if (player.mvp) {
                    const match = player.mvp.match(/MVP\s*x\s*(\d+)/i);
                    if (match) {
                        totalMVP += parseInt(match[1]);
                    } else {
                        totalMVP += 1;
                    }
                }
            }
        }

        return {
            name: teamName,
            wins: wins || 0,
            points: totalPoints || 0,
            mvp: totalMVP > 0 ? String(totalMVP) : '',
            mvpCount: totalMVP
        };
    }).filter(team => team.name !== '—');

    teamsWithStats.sort((a, b) => b.wins - a.wins || b.points - a.points);
    return teamsWithStats;
}

function getRankClass(rank) {
    if (rank === 0) return 'rank-1';
    if (rank === 1) return 'rank-2';
    return '';
}

// ==================== ПРОВЕРКА ЗАВЕРШЕНИЯ ТУРНИРА ====================
function isTournamentCompleted() {
    const grandFinal = tournamentData.playoffs.grandFinal;
    return grandFinal.winner && grandFinal.winner !== '' && grandFinal.winner !== 'TBD';
}

// ==================== ОТОБРАЖЕНИЕ РЕЗУЛЬТАТОВ ТУРНИРА ====================
function renderResults() {
    const resultsSection = document.querySelector('.results-section');
    const resultsList = document.getElementById('results-list');
    
    if (!resultsList) return;
    
    const tournamentCompleted = isTournamentCompleted();
    
    if (!tournamentCompleted) {
        if (resultsSection) resultsSection.style.display = 'none';
        return;
    }
    
    if (resultsSection) resultsSection.style.display = 'block';
    
    const teamStats = [];
    
    const processGroup = (groupName) => {
        const group = tournamentData.groups[groupName];
        if (!group || !group.teams) return;
        
        group.teams.forEach(teamName => {
            if (!teamName || teamName === '') return;
            
            let wins = 0;
            let totalPoints = 0;
            
            if (group.matches) {
                group.matches.forEach(match => {
                    if (match.team1 === teamName) {
                        totalPoints += (match.points1 || 0);
                        if (match.winner === teamName) wins++;
                    }
                    if (match.team2 === teamName) {
                        totalPoints += (match.points2 || 0);
                        if (match.winner === teamName) wins++;
                    }
                });
            }
            
            teamStats.push({
                name: teamName,
                wins: wins,
                points: totalPoints
            });
        });
    };
    
    processGroup('A');
    processGroup('B');
    
    const updateTeamStats = (teamName, winsToAdd, pointsToAdd) => {
        const team = teamStats.find(t => t.name === teamName);
        if (team) {
            team.wins += winsToAdd;
            team.points += pointsToAdd;
        }
    };
    
    const addLoserPoints = (match, loserTeamName) => {
        const team = teamStats.find(t => t.name === loserTeamName);
        if (team && match) {
            let loserPoints = 0;
            if (match.team1 === loserTeamName) {
                loserPoints = match.team1Points || 0;
            } else if (match.team2 === loserTeamName) {
                loserPoints = match.team2Points || 0;
            }
            team.points += loserPoints;
        }
    };
    
    const playoffs = tournamentData.playoffs;
    
    if (playoffs.upperFinal.team1 && playoffs.upperFinal.team1 !== 'TBD' && playoffs.upperFinal.team1 !== '') {
        if (playoffs.upperFinal.winner === playoffs.upperFinal.team1) {
            updateTeamStats(playoffs.upperFinal.team1, 1, playoffs.upperFinal.team1Points || 0);
            addLoserPoints(playoffs.upperFinal, playoffs.upperFinal.team2);
        } else if (playoffs.upperFinal.winner === playoffs.upperFinal.team2) {
            updateTeamStats(playoffs.upperFinal.team2, 1, playoffs.upperFinal.team2Points || 0);
            addLoserPoints(playoffs.upperFinal, playoffs.upperFinal.team1);
        } else if (!playoffs.upperFinal.winner) {
            updateTeamStats(playoffs.upperFinal.team1, 0, playoffs.upperFinal.team1Points || 0);
            updateTeamStats(playoffs.upperFinal.team2, 0, playoffs.upperFinal.team2Points || 0);
        }
    }
    
    if (playoffs.lowerSemi.team1 && playoffs.lowerSemi.team1 !== 'TBD' && playoffs.lowerSemi.team1 !== '') {
        if (playoffs.lowerSemi.winner === playoffs.lowerSemi.team1) {
            updateTeamStats(playoffs.lowerSemi.team1, 1, playoffs.lowerSemi.team1Points || 0);
            addLoserPoints(playoffs.lowerSemi, playoffs.lowerSemi.team2);
        } else if (playoffs.lowerSemi.winner === playoffs.lowerSemi.team2) {
            updateTeamStats(playoffs.lowerSemi.team2, 1, playoffs.lowerSemi.team2Points || 0);
            addLoserPoints(playoffs.lowerSemi, playoffs.lowerSemi.team1);
        } else if (!playoffs.lowerSemi.winner) {
            updateTeamStats(playoffs.lowerSemi.team1, 0, playoffs.lowerSemi.team1Points || 0);
            updateTeamStats(playoffs.lowerSemi.team2, 0, playoffs.lowerSemi.team2Points || 0);
        }
    }
    
    if (playoffs.lowerFinal.team1 && playoffs.lowerFinal.team1 !== 'TBD' && playoffs.lowerFinal.team1 !== '') {
        if (playoffs.lowerFinal.winner === playoffs.lowerFinal.team1) {
            updateTeamStats(playoffs.lowerFinal.team1, 1, playoffs.lowerFinal.team1Points || 0);
            addLoserPoints(playoffs.lowerFinal, playoffs.lowerFinal.team2);
        } else if (playoffs.lowerFinal.winner === playoffs.lowerFinal.team2) {
            updateTeamStats(playoffs.lowerFinal.team2, 1, playoffs.lowerFinal.team2Points || 0);
            addLoserPoints(playoffs.lowerFinal, playoffs.lowerFinal.team1);
        } else if (!playoffs.lowerFinal.winner) {
            updateTeamStats(playoffs.lowerFinal.team1, 0, playoffs.lowerFinal.team1Points || 0);
            updateTeamStats(playoffs.lowerFinal.team2, 0, playoffs.lowerFinal.team2Points || 0);
        }
    }
    
    if (playoffs.grandFinal.team1 && playoffs.grandFinal.team1 !== 'TBD' && playoffs.grandFinal.team1 !== '') {
        if (playoffs.grandFinal.winner === playoffs.grandFinal.team1) {
            updateTeamStats(playoffs.grandFinal.team1, 1, playoffs.grandFinal.team1Points || 0);
            addLoserPoints(playoffs.grandFinal, playoffs.grandFinal.team2);
        } else if (playoffs.grandFinal.winner === playoffs.grandFinal.team2) {
            updateTeamStats(playoffs.grandFinal.team2, 1, playoffs.grandFinal.team2Points || 0);
            addLoserPoints(playoffs.grandFinal, playoffs.grandFinal.team1);
        } else if (!playoffs.grandFinal.winner) {
            updateTeamStats(playoffs.grandFinal.team1, 0, playoffs.grandFinal.team1Points || 0);
            updateTeamStats(playoffs.grandFinal.team2, 0, playoffs.grandFinal.team2Points || 0);
        }
    }
    
    teamStats.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.points - a.points;
    });
    
    const grandFinalWinner = tournamentData.playoffs.grandFinal.winner;
    const grandFinalLoser = tournamentData.playoffs.grandFinal.team1 === grandFinalWinner ? 
        tournamentData.playoffs.grandFinal.team2 : tournamentData.playoffs.grandFinal.team1;
    
    if (grandFinalWinner && grandFinalWinner !== '' && grandFinalWinner !== 'TBD') {
        const winnerIndex = teamStats.findIndex(t => t.name === grandFinalWinner);
        if (winnerIndex > 0) {
            const winner = teamStats.splice(winnerIndex, 1)[0];
            teamStats.unshift(winner);
        }
    }
    
    if (grandFinalLoser && grandFinalLoser !== '' && grandFinalLoser !== 'TBD') {
        const loserIndex = teamStats.findIndex(t => t.name === grandFinalLoser);
        if (loserIndex > 0 && loserIndex !== 1) {
            const loser = teamStats.splice(loserIndex, 1)[0];
            teamStats.splice(1, 0, loser);
        }
    }
    
    // ========== ДОБАВЛЯЕМ MVP ДЛЯ КАЖДОЙ КОМАНДЫ ==========
    // Считаем MVP для каждой команды
    const rosters = window._rosters || (teamRostersCache ? teamRostersCache.data : null);
    const teamMVPCount = {};
    if (rosters) {
        for (const [teamName, players] of Object.entries(rosters)) {
            let totalMVP = 0;
            for (const player of players) {
                if (player.mvp) {
                    const match = player.mvp.match(/MVP\s*x\s*(\d+)/i);
                    if (match) {
                        totalMVP += parseInt(match[1]);
                    } else {
                        totalMVP += 1;
                    }
                }
            }
            teamMVPCount[teamName] = totalMVP;
        }
    }
    // ========================================================
    
    let html = '';
    
    for (let i = 0; i < Math.min(teamStats.length, 8); i++) {
        const team = teamStats[i];
        const place = i + 1;
        const prize = prizeData[place] || '—';
        const mvpCount = teamMVPCount[team.name] || 0;
        const mvpHtml = mvpCount ? getMVPHtml(mvpCount) : '';
        
        let rankClass = '';
        let medalIcon = '';
        
        if (place === 1) {
            rankClass = 'rank-1-row';
            medalIcon = '🏆';
        } else if (place === 2) {
            rankClass = 'rank-2-row';
            medalIcon = '🥈';
        } else if (place === 3) {
            rankClass = 'rank-3-row';
            medalIcon = '🥉';
        } else {
            rankClass = 'rank-other';
        }
        
        html += `
            <div class="result-row ${rankClass}">
                <div class="result-place">${place}</div>
                <div class="result-team" style="cursor: pointer;" data-team-name="${escapeHtml(team.name)}">
                    ${getAvatarHtml(team.name)}${escapeHtml(team.name)}${mvpHtml}
                </div>
                <div class="result-wins">${team.wins}</div>
                <div class="result-points">${team.points.toLocaleString()}</div>
                <div class="result-prize">
                    ${escapeHtml(prize)} 
                    ${medalIcon ? `<span class="prize-icon">${medalIcon}</span>` : ''}
                </div>
            </div>
        `;
    }
    
    resultsList.innerHTML = html;
}

// ==================== ОТРИСОВКА ГРУПП ====================
function renderGroups() {
    const container = document.getElementById('groupsContainer');
    if (!container) return;

    if (!tournamentData || !tournamentData.groups) {
        container.innerHTML = '<div class="loading">Загрузка данных...</div>';
        return;
    }

    const groups = ['A', 'B'];
    container.innerHTML = groups.map(group => {
        if (!tournamentData.groups[group]) {
            return `<div class="group-card"><div class="group-header"><h3>${t('group')} ${group}</h3></div><div class="group-matches">${t('empty_content')}</div></div>`;
        }

        const rankings = getTeamRankings(group);
        const matches = tournamentData.groups[group].matches || [];
        const isGroupCompleted = isGroupStageCompleted(group);
        const hasTeams = tournamentData.groups[group].teams && tournamentData.groups[group].teams.length > 0;

        if (!hasTeams) {
            return `
                <div class="group-card">
                    <div class="group-header">
                        <h3>${t('group')} ${group}</h3>
                        <p>${t('waiting_draw')}</p>
                    </div>
                    <div class="group-placeholder">
                        <div class="placeholder-text">${t('placeholder_text')}</div>
                    </div>
                </div>
            `;
        }

        return `
            <div class="group-card">
                <div class="group-header">
                    <h3>${t('group')} ${group}${isGroupCompleted ? ' ✓' : ''}</h3>
                    <p>${t('everyone_with_everyone')}</p>
                </div>
                <table class="group-teams-table">
                    <thead>
                        <tr>
                            <th style="text-align: left">${t('team_header')}</th>
                            <th style="text-align: center">${t('wins_header')}</th>
                            <th>${t('points_header')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rankings.map((team, idx) => {
                            if (!team || !team.name) return '';
                            const rankClass = getRankClass(idx);
                            const isEliminated = isGroupCompleted && idx >= 2;
                            const eliminationText = isEliminated ? ' — ' + t('eliminated') : '';
                            const mvpHtml = team.mvpCount ? getMVPHtml(team.mvpCount) : '';

                            return `
                                <tr class="${rankClass}">
                                    <td style="text-align: left; font-weight: 700; font-size: 0.95rem; cursor: pointer; vertical-align: middle;" data-team-name="${escapeHtml(team.name)}">
                                        ${getAvatarHtml(team.name)}${escapeHtml(team.name)}${eliminationText}${mvpHtml}
                                    </td>
                                    <td style="text-align: center">
                                        <span class="${team.wins > 0 ? 'stat-wins' : 'stat-wins-zero'}">${team.wins}</span>
                                    </td>
                                    <td style="text-align: right; padding-right: 1rem;">
                                        <span class="stat-points">${(team.points || 0).toLocaleString()}</span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                <div class="group-matches">
                    <div class="group-matches-header" id="group-${group}-matches-header">
                        <h4>${t('matches_header')} ${group}</h4>
                    </div>
                    <div class="matches-list">
                        ${matches.map((match, idx) => renderMatchCard(group, match, idx)).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    if (isAdmin) {
        attachMatchHandlers();
        // ========== ДОБАВЛЯЕМ ОТСЛЕЖИВАНИЕ ПОЛЕЙ ПОСЛЕ РЕНДЕРА ==========
        setTimeout(initFieldTracking, 100);
    }

    updateGroupStageAnimation();
}

function renderMatchCard(group, match, idx) {
    const safeMatch = {
        id: match.id,
        team1: match.team1 || 'TBD',
        team2: match.team2 || 'TBD',
        score1: match.score1 !== undefined ? match.score1 : 0,
        score2: match.score2 !== undefined ? match.score2 : 0,
        points1: match.points1 !== undefined ? match.points1 : 0,
        points2: match.points2 !== undefined ? match.points2 : 0,
        winner: match.winner || '',
        date: match.date || '',
        streamUrl: match.streamUrl || ''
    };

    const isCompleted = safeMatch.winner && safeMatch.winner !== '';
    
    const isWinner1 = safeMatch.winner === safeMatch.team1;
    const isWinner2 = safeMatch.winner === safeMatch.team2;
    const winnerClass1 = isWinner1 ? 'match-winner' : '';
    const winnerClass2 = isWinner2 ? 'match-winner' : '';
    
    const liveStatus = getLiveStatus(safeMatch.date, safeMatch.winner);
    const isLiveNow = liveStatus.isLive;
    
    const hasStreamUrl = safeMatch.streamUrl && safeMatch.streamUrl !== '';
    
    // ========== КНОПКА LIVE С ТОЧКОЙ ==========
    let liveBtnClass = '';
    let liveDotHtml = '<span class="live-dot"></span>';

    if (isCompleted) {
        // Если матч завершён — показываем кнопку с красной точкой (запись доступна)
        liveBtnClass = 'match-live-btn-finished';
    } else if (isLiveNow && hasStreamUrl) {
        liveBtnClass = 'match-live-btn';
    } else if (hasStreamUrl) {
        liveBtnClass = 'match-live-btn-dimmed';
    } else {
        // Нет трансляции — серая точка
        liveBtnClass = 'match-live-btn-finished no-stream';
        liveDotHtml = '<span class="live-dot"></span>'; // серая точка
    }
    
    const streamLink = hasStreamUrl ? safeMatch.streamUrl : '#';
    const pulseAnimation = (isLiveNow && hasStreamUrl && !isCompleted) ? 'live-pulse' : '';
    
    const score1Class = safeMatch.score1 === 1 ? 'match-score-win' : 'match-score-loss';
    const score2Class = safeMatch.score2 === 1 ? 'match-score-win' : 'match-score-loss'
    
    const team1AvatarHtml = (safeMatch.team1 && safeMatch.team1 !== 'TBD') ? getAvatarHtml(safeMatch.team1) : '';
    const team2AvatarHtml = (safeMatch.team2 && safeMatch.team2 !== 'TBD') ? getAvatarHtml(safeMatch.team2) : '';
    
    const viewerHtml = `
        <div class="match-teams-row">
            <div class="match-team match-team-left ${winnerClass1}">
                ${team1AvatarHtml}
                <span class="match-team-name ${isCompleted && !isWinner1 ? 'match-loser-name' : ''}" style="cursor: pointer;" data-team-name="${escapeHtml(safeMatch.team1)}">${escapeHtml(safeMatch.team1)}</span>
            </div>
            <div class="match-vs ${isLiveNow ? 'match-vs-live' : ''}">${t('vs')}</div>
            <div class="match-team match-team-right ${winnerClass2}">
                <span class="match-team-name ${isCompleted && !isWinner2 ? 'match-loser-name' : ''}" style="cursor: pointer;" data-team-name="${escapeHtml(safeMatch.team2)}">${escapeHtml(safeMatch.team2)}</span>
                ${team2AvatarHtml}
            </div>
        </div>
        <div class="match-scores-row">
            <span class="match-score-left ${score1Class}">${safeMatch.score1}</span>
            <span class="match-score-divider">:</span>
            <span class="match-score-right ${score2Class}">${safeMatch.score2}</span>
        </div>
        <div class="match-points-row">
            <span class="match-points-left">${safeMatch.points1.toLocaleString()}</span>
            <span class="match-points-divider">:</span>
            <span class="match-points-right">${safeMatch.points2.toLocaleString()}</span>
        </div>
    `;

    const adminHtml = `
        <div class="match-teams-row">
            <div class="match-team match-team-left">
                <span class="match-team-name" style="cursor: pointer;" data-team-name="${escapeHtml(safeMatch.team1)}">${escapeHtml(safeMatch.team1)}</span>
            </div>
            <div class="match-vs">${t('vs')}</div>
            <div class="match-team match-team-right">
                <span class="match-team-name" style="cursor: pointer;" data-team-name="${escapeHtml(safeMatch.team2)}">${escapeHtml(safeMatch.team2)}</span>
            </div>
        </div>
        <div class="match-admin-controls">
            <div class="match-input-group">
                <span class="match-admin-label">${t('admin_score')} 1</span>
                <input type="number" id="${group}_score1_${safeMatch.id}" class="match-score-input" value="${safeMatch.score1}" min="0" max="1" step="1">
            </div>
            <div class="match-input-group">
                <span class="match-admin-label">${t('admin_score')} 2</span>
                <input type="number" id="${group}_score2_${safeMatch.id}" class="match-score-input" value="${safeMatch.score2}" min="0" max="1" step="1">
            </div>
            <div class="match-input-group">
                <span class="match-admin-label">${t('admin_points')} 1</span>
                <input type="number" id="${group}_points1_${safeMatch.id}" class="match-points-input" value="${safeMatch.points1}" min="0" max="100000" step="1">
            </div>
            <div class="match-input-group">
                <span class="match-admin-label">${t('admin_points')} 2</span>
                <input type="number" id="${group}_points2_${safeMatch.id}" class="match-points-input" value="${safeMatch.points2}" min="0" max="100000" step="1">
            </div>
            <div class="match-input-group">
                <span class="match-admin-label">${t('admin_date')}</span>
                <input type="datetime-local" id="${group}_date_${safeMatch.id}" class="match-date-input" value="${safeMatch.date ? formatDateForInput(safeMatch.date) : ''}">
            </div>
            <div class="match-input-group">
                <span class="match-admin-label">${t('admin_link')}</span>
                <input type="text" id="${group}_streamUrl_${safeMatch.id}" class="match-stream-input" placeholder="https://..." value="${escapeHtml(safeMatch.streamUrl)}">
            </div>
            <button class="match-update-btn" data-group="${group}" data-match-id="${safeMatch.id}">✓ ${t('admin_save')}</button>
        </div>
    `;
    
    return `
        <div class="match-card ${isCompleted ? 'completed' : ''}" data-team1="${escapeHtml(safeMatch.team1)}" data-team2="${escapeHtml(safeMatch.team2)}">
            <div class="match-info">
                <div class="match-datetime">${formatDateDisplay(safeMatch.date)}</div>
                <a href="${streamLink}" target="_blank" class="${liveBtnClass} ${pulseAnimation}">
                    ${liveDotHtml}${t('live')}
                </a>
            </div>
            ${isAdmin ? adminHtml : viewerHtml}
        </div>
    `;
}

function attachMatchHandlers() {
    document.querySelectorAll('.match-update-btn').forEach(btn => {
        btn.removeEventListener('click', handleMatchUpdate);
        btn.addEventListener('click', handleMatchUpdate);
    });

    if (isAdmin) {
        document.querySelectorAll('.match-stream-input').forEach(input => {
            input.removeEventListener('change', handleStreamUrlChange);
            input.addEventListener('change', handleStreamUrlChange);
        });
        document.querySelectorAll('.match-date-input').forEach(input => {
            input.removeEventListener('change', handleDateChange);
            input.addEventListener('change', handleDateChange);
        });
    }
}

function handleDateChange(e) {
    const idParts = e.target.id.split('_');
    const group = idParts[0];
    const matchId = parseInt(idParts[2]);
    
    if (isNaN(matchId)) return;
    
    const matches = tournamentData.groups[group].matches;
    const matchIndex = matches.findIndex(m => m.id === matchId);
    
    if (matchIndex !== -1) {
        const newDate = e.target.value;
        if (newDate) {
            const dateObj = new Date(newDate);
            if (!isNaN(dateObj.getTime())) {
                const year = dateObj.getFullYear();
                const month = String(dateObj.getMonth() + 1).padStart(2, '0');
                const day = String(dateObj.getDate()).padStart(2, '0');
                const hours = String(dateObj.getHours()).padStart(2, '0');
                const minutes = String(dateObj.getMinutes()).padStart(2, '0');
                tournamentData.groups[group].matches[matchIndex].date = `${year}-${month}-${day}T${hours}:${minutes}`;
            }
        }
    }
}

function handleStreamUrlChange(e) {
    const idParts = e.target.id.split('_');
    const group = idParts[0];
    const matchId = parseInt(idParts[2]);
    
    if (isNaN(matchId)) return;
    
    const matches = tournamentData.groups[group].matches;
    const matchIndex = matches.findIndex(m => m.id === matchId);
    
    if (matchIndex !== -1) {
        tournamentData.groups[group].matches[matchIndex].streamUrl = e.target.value;
    }
}

function handleMatchUpdate(e) {
    const group = e.currentTarget.dataset.group;
    const matchId = parseInt(e.currentTarget.dataset.matchId);

    if (isNaN(matchId)) {
        console.error('Invalid match ID');
        return;
    }

    const matches = tournamentData.groups[group].matches;
    const matchIndex = matches.findIndex(m => m.id === matchId);

    if (matchIndex === -1) {
        console.error('Match not found:', matchId);
        return;
    }

    const score1Input = document.getElementById(`${group}_score1_${matchId}`);
    const score2Input = document.getElementById(`${group}_score2_${matchId}`);
    const points1Input = document.getElementById(`${group}_points1_${matchId}`);
    const points2Input = document.getElementById(`${group}_points2_${matchId}`);
    const dateInput = document.getElementById(`${group}_date_${matchId}`);
    const streamUrlInput = document.getElementById(`${group}_streamUrl_${matchId}`);

    if (!score1Input || !score2Input || !points1Input || !points2Input) {
        console.error('Input fields not found for match:', matchId);
        return;
    }

    let score1 = parseInt(score1Input.value) || 0;
    let score2 = parseInt(score2Input.value) || 0;
    const points1 = parseInt(points1Input.value) || 0;
    const points2 = parseInt(points2Input.value) || 0;

    score1 = Math.min(score1, 1);
    score2 = Math.min(score2, 1);

    if (dateInput && dateInput.value) {
        const dateObj = new Date(dateInput.value);
        if (!isNaN(dateObj.getTime())) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');
            const hours = String(dateObj.getHours()).padStart(2, '0');
            const minutes = String(dateObj.getMinutes()).padStart(2, '0');
            tournamentData.groups[group].matches[matchIndex].date = `${year}-${month}-${day}T${hours}:${minutes}`;
        }
    }

    if (streamUrlInput) {
        tournamentData.groups[group].matches[matchIndex].streamUrl = streamUrlInput.value;
    }

    tournamentData.groups[group].matches[matchIndex].score1 = score1;
    tournamentData.groups[group].matches[matchIndex].score2 = score2;
    tournamentData.groups[group].matches[matchIndex].points1 = points1;
    tournamentData.groups[group].matches[matchIndex].points2 = points2;

    if (score1 > score2) {
        tournamentData.groups[group].matches[matchIndex].winner = tournamentData.groups[group].matches[matchIndex].team1;
    } else if (score2 > score1) {
        tournamentData.groups[group].matches[matchIndex].winner = tournamentData.groups[group].matches[matchIndex].team2;
    } else {
        tournamentData.groups[group].matches[matchIndex].winner = '';
    }

    // ========== ЗАПОМИНАЕМ ДАННЫЕ ДЛЯ ПОИСКА НОВОЙ КНОПКИ ==========
    const groupId = group;
    const matchIdStr = matchId;

    // ========== АНИМАЦИЯ КАРТОЧКИ ==========
    const matchCard = e.currentTarget.closest('.match-card');
    if (matchCard) {
        matchCard.classList.add('updating');
        setTimeout(() => {
            matchCard.classList.remove('updating');
        }, 500);
    }

    // ========== ПЕРЕРИСОВЫВАЕМ ==========
    updatePlayoffsBracket();
    renderGroups();
    renderPlayoffs();
    updateGroupStageAnimation();

    // ========== ПОСЛЕ РЕНДЕРА — НАХОДИМ НОВУЮ КНОПКУ ==========
    const newBtn = document.querySelector(`.match-update-btn[data-group="${groupId}"][data-match-id="${matchIdStr}"]`);

    if (!newBtn) {
        console.error('Новая кнопка не найдена после рендера!');
        return;
    }

    // ========== ДОБАВЛЯЕМ СПИННЕР В НОВУЮ КНОПКУ ==========
    const originalHTML = newBtn.innerHTML;

    // Очищаем кнопку
    newBtn.innerHTML = '';

    // Создаём спан для спиннера
    const spinnerSpan = document.createElement('span');
    spinnerSpan.className = 'btn-spinner';
    spinnerSpan.style.display = 'inline-block';
    spinnerSpan.style.width = '14px';
    spinnerSpan.style.height = '14px';
    spinnerSpan.style.border = '2px solid rgba(255,255,255,0.3)';
    spinnerSpan.style.borderTop = '2px solid #ffffff';
    spinnerSpan.style.borderRadius = '50%';
    spinnerSpan.style.animation = 'btnSpinnerSpin 0.7s linear infinite';
    spinnerSpan.style.verticalAlign = 'middle';
    spinnerSpan.style.marginRight = '4px';
    spinnerSpan.style.flexShrink = '0';

    // Создаём спан для текста
    const textSpan = document.createElement('span');
    textSpan.className = 'btn-text';
    textSpan.textContent = 'СОХРАНЕНИЕ...';

    // Добавляем в кнопку
    newBtn.appendChild(spinnerSpan);
    newBtn.appendChild(textSpan);

    // Добавляем классы (без инлайн-стилей!)
    newBtn.classList.add('saving');
    newBtn.disabled = true;

    console.log('Спиннер добавлен в новую кнопку');

    // ========== СОХРАНЯЕМ ДАННЫЕ ==========
    saveAllDataToGoogle().then(success => {
        setTimeout(() => {
            newBtn.classList.remove('saving');

            if (success) {
                newBtn.classList.remove('has-changes');
                newBtn.innerHTML = '✓ СОХРАНЕНО';
                setTimeout(() => {
                    newBtn.innerHTML = originalHTML;
                    newBtn.disabled = false;
                }, 800);
            } else {
                newBtn.innerHTML = '✗ ОШИБКА';
                setTimeout(() => {
                    newBtn.innerHTML = originalHTML;
                    newBtn.disabled = false;
                }, 1200);
            }
        }, 400);
    });
}

async function saveMatchToSheet(group, matchId) {
    try {
        const matches = tournamentData.groups[group].matches;
        const match = matches.find(m => m.id === matchId);
        if (!match) return;
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'tournament',
                data: JSON.stringify({ groups: tournamentData.groups, playoffs: tournamentData.playoffs })
            }).toString()
        });
        
        const result = await response.json();
        
        if (result.success) {
            
            // ========== ОЧИЩАЕМ КЕШ ПРОГНОЗОВ ПОСЛЕ СОХРАНЕНИЯ ==========
            // Чтобы скрипт прогнозов прочитал свежие данные
            localStorage.removeItem('prediction_cache');
            // ===============================================================
            
            const updateBtn = document.querySelector(`.match-update-btn[data-group="${group}"][data-match-id="${matchId}"]`);
            if (updateBtn) updateBtn.classList.remove('has-changes');
        } else {
            console.error('Failed to save match to sheet');
        }
        
    } catch(e) {
        console.error('Save match error:', e);
    }
}

// ==================== ОТРИСОВКА ПЛЕЙ-ОФФ ====================
function renderPlayoffMatchCard(match, matchId, extraClass = '') {
    const safeMatch = {
        team1: match.team1 || 'TBD',
        team2: match.team2 || 'TBD',
        team1Score: match.team1Score !== undefined ? match.team1Score : 0,
        team2Score: match.team2Score !== undefined ? match.team2Score : 0,
        team1Points: match.team1Points !== undefined ? match.team1Points : 0,
        team2Points: match.team2Points !== undefined ? match.team2Points : 0,
        winner: match.winner || '',
        date: match.date || '',
        streamUrl: match.streamUrl || ''
    };

    const isCompleted = safeMatch.winner && safeMatch.winner !== '';
    
    // ========== СУММА ДЛЯ ГРАНД-ФИНАЛА ==========
    const isGrandFinal = matchId === 'grandFinal';
    let sum1 = 0;
    let sum2 = 0;
    if (isGrandFinal) {
        const m1s1 = match.match1Score1 || 0;
        const m1s2 = match.match1Score2 || 0;
        const m2s1 = match.match2Score1 || 0;
        const m2s2 = match.match2Score2 || 0;
        const m3s1 = match.match3Score1 || 0;
        const m3s2 = match.match3Score2 || 0;
        sum1 = (m1s1 || 0) + (m2s1 || 0) + (m3s1 || 0);
        sum2 = (m1s2 || 0) + (m2s2 || 0) + (m3s2 || 0);
    }

    // ========== ОПРЕДЕЛЕНИЕ ЦВЕТОВ ИМЕН (как в групповом этапе) ==========
    const isWinner1 = safeMatch.winner === safeMatch.team1;
    const isWinner2 = safeMatch.winner === safeMatch.team2;
    
    // Для левой команды: победитель → белый, проигравший → серый (только если матч завершен)
    const team1Class = isWinner1 ? 'playoff-winner-text' : (isCompleted && !isWinner1 ? 'playoff-loser-text' : '');
    // Для правой команды: победитель → белый, проигравший → серый (только если матч завершен)
    const team2Class = isWinner2 ? 'playoff-winner-text' : (isCompleted && !isWinner2 ? 'playoff-loser-text' : '');
    
    // Классы для контейнеров команд (для подсветки победителя)
    const winnerClass1 = isWinner1 ? 'playoff-winner-text' : '';
    const winnerClass2 = isWinner2 ? 'playoff-winner-text' : '';

    const isTBDTeam1 = safeMatch.team1 === 'TBD' || safeMatch.team1 === '';
    const isTBDTeam2 = safeMatch.team2 === 'TBD' || safeMatch.team2 === '';

    // ========== ОПРЕДЕЛЕНИЕ ЦВЕТОВ СЧЁТА ==========
    let score1Class = 'playoff-score-loss';
    let score2Class = 'playoff-score-loss';

    if (isGrandFinal) {
        // Для гранд-финала — цвет зависит от победителя
        if (safeMatch.winner && safeMatch.winner !== '') {
            if (safeMatch.winner === safeMatch.team1) {
                score1Class = 'playoff-score-win';
                score2Class = 'playoff-score-loss';
            } else if (safeMatch.winner === safeMatch.team2) {
                score1Class = 'playoff-score-loss';
                score2Class = 'playoff-score-win';
            }
        } else {
            // Если победитель ещё не определён — оба серые
            score1Class = 'playoff-score-loss';
            score2Class = 'playoff-score-loss';
        }
    } else {
        // Для обычных матчей — по счёту 1:0
        if (safeMatch.team1Score === 1) {
            score1Class = 'playoff-score-win';
        } else {
            score1Class = 'playoff-score-loss';
        }
        if (safeMatch.team2Score === 1) {
            score2Class = 'playoff-score-win';
        } else {
            score2Class = 'playoff-score-loss';
        }
    }

    let effectiveDate = safeMatch.date;
    if (!effectiveDate && tempPlayoffDates[matchId]) {
        effectiveDate = tempPlayoffDates[matchId];
    }
    // Убираем Z перед отображением
    let cleanDate = effectiveDate;
    if (cleanDate && cleanDate.endsWith('Z')) {
        cleanDate = cleanDate.slice(0, -1);
    }
    const showDate = cleanDate && cleanDate !== '' ? formatDateDisplay(cleanDate) : t('date_not_set');

    let effectiveStreamUrl = safeMatch.streamUrl;
    if (!effectiveStreamUrl && tempPlayoffStreamUrls[matchId]) {
        effectiveStreamUrl = tempPlayoffStreamUrls[matchId];
    }
    const hasStreamUrl = effectiveStreamUrl && effectiveStreamUrl !== '';
    const streamLink = hasStreamUrl ? effectiveStreamUrl : '#';

    const liveStatus = getLiveStatus(effectiveDate, safeMatch.winner);
    const isLiveNow = liveStatus.isLive;

    // ========== КНОПКА LIVE С ТОЧКОЙ ==========
    let liveBtnClass = '';
    let liveDotHtml = '<span class="live-dot"></span>';

    // Проверяем, есть ли победитель (матч завершён)
    if (isCompleted) {
        liveBtnClass = 'match-live-btn-finished';
    }
    // Если матч ещё идёт и есть ссылка на стрим
    else if (isLiveNow && hasStreamUrl) {
        liveBtnClass = 'match-live-btn';
    }
    // Если есть ссылка на стрим, но матч ещё не начался
    else if (hasStreamUrl) {
        liveBtnClass = 'match-live-btn-dimmed';
    }
    // Нет ссылки на стрим
    else {
        liveBtnClass = 'match-live-btn-finished no-stream';
        liveDotHtml = '<span class="live-dot"></span>';
    }

    // Анимация пульсации только для LIVE
    const pulseAnimation = (isLiveNow && hasStreamUrl && !isCompleted) ? 'live-pulse' : '';
    const vsAnimationClass = isLiveNow ? 'match-vs-live' : '';

    const team1AvatarHtml = !isTBDTeam1 ? getAvatarHtml(safeMatch.team1) : '';
    const team2AvatarHtml = !isTBDTeam2 ? getAvatarHtml(safeMatch.team2) : '';

    // ========== BEST OF 2 ДЛЯ ГРАНД-ФИНАЛА ==========
    let bestOf3Html = '';
    if (isGrandFinal) {
        const m1s1 = match.match1Score1 || 0;
        const m1s2 = match.match1Score2 || 0;
        const m2s1 = match.match2Score1 || 0;
        const m2s2 = match.match2Score2 || 0;
        const m3s1 = match.match3Score1 || 0;
        const m3s2 = match.match3Score2 || 0;

        // Определяем победителя КАЖДОГО матча (по очкам)
        let m1Winner = '';
        let m2Winner = '';
        let m3Winner = '';

        if (m1s1 > 0 || m1s2 > 0) {
            m1Winner = m1s1 > m1s2 ? safeMatch.team1 : (m1s2 > m1s1 ? safeMatch.team2 : '');
        }
        if (m2s1 > 0 || m2s2 > 0) {
            m2Winner = m2s1 > m2s2 ? safeMatch.team1 : (m2s2 > m2s1 ? safeMatch.team2 : '');
        }
        if (m3s1 > 0 || m3s2 > 0) {
            m3Winner = m3s1 > m3s2 ? safeMatch.team1 : (m3s2 > m3s1 ? safeMatch.team2 : '');
        }

        // Функция для создания строки матча
        function renderMatchLine(label, score1, score2, winner) {
            const formattedScore1 = Number(score1).toLocaleString();
            const formattedScore2 = Number(score2).toLocaleString();
            
            // Получаем данные победителя (если есть)
            let winnerAvatar = '';
            let winnerName = '';
            if (winner && winner !== '') {
                winnerAvatar = getAvatarHtml(winner);
                winnerName = escapeHtml(winner);
            }

            // Проверяем, кто победил
            const isTeam1Winner = winner === safeMatch.team1;
            const isTeam2Winner = winner === safeMatch.team2;

            // Формируем отображение победителя
            let winnerLeft = '';
            let winnerRight = '';
            let emptySlot = '<span style="min-width: 70px;"></span>';

            if (isTeam1Winner) {
                // Победитель СЛЕВА
                winnerLeft = `
                    <span style="display: inline-flex; align-items: center; gap: 4px; color: #6aaf6a; font-weight: 600; font-size: 0.8rem; min-width: 70px; justify-content: flex-end;">
                        ${winnerAvatar}
                        <span>${winnerName}</span>
                    </span>
                `;
                winnerRight = emptySlot;
            } else if (isTeam2Winner) {
                // Победитель СПРАВА
                winnerLeft = emptySlot;
                winnerRight = `
                    <span style="display: inline-flex; align-items: center; gap: 4px; color: #6aaf6a; font-weight: 600; font-size: 0.8rem; min-width: 70px; justify-content: flex-start;">
                        ${winnerAvatar}
                        <span>${winnerName}</span>
                    </span>
                `;
            } else {
                // Нет победителя
                winnerLeft = emptySlot;
                winnerRight = emptySlot;
            }

            return `
                <div class="best-of-3-match">
                    <div style="text-align: center; color: #888888; font-size: 0.7rem; font-weight: 600; padding: 2px 0 1px 0; letter-spacing: 0.5px;">${label}</div>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 6px; padding: 2px 0;">
                        ${winnerLeft}
                        <span style="color: #ffffff; font-size: 0.9rem; font-weight: 600; min-width: 60px; text-align: center;">${formattedScore1}</span>
                        <span style="color: #ccaa66; font-size: 1rem; font-weight: 700; min-width: 14px; text-align: center;">:</span>
                        <span style="color: #ffffff; font-size: 0.9rem; font-weight: 600; min-width: 60px; text-align: center;">${formattedScore2}</span>
                        ${winnerRight}
                    </div>
                </div>
            `;
        }

        let matchesHtml = '';

        // Матч 1
        if (m1s1 > 0 || m1s2 > 0) {
            matchesHtml += renderMatchLine(t('match_1'), m1s1, m1s2, m1Winner);
        }

        // Матч 2
        if (m2s1 > 0 || m2s2 > 0) {
            matchesHtml += renderMatchLine(t('match_2'), m2s1, m2s2, m2Winner);
        }

        // Матч 3
        if (m3s1 > 0 || m3s2 > 0) {
            matchesHtml += renderMatchLine(t('match_3'), m3s1, m3s2, m3Winner);
        }

        if (matchesHtml) {
            bestOf3Html = `
                <div class="best-of-3-container">
                    <div class="best-of-3-label">Best of 2</div>
                    ${matchesHtml}
                </div>
            `;
        } else {
            bestOf3Html = `
                <div class="best-of-3-container">
                    <div class="best-of-3-label">Best of 2</div>
                    <div style="text-align: center; color: #666666; font-size: 0.6rem; padding: 4px 0;">${t('waiting_for_matches')}</div>
                </div>
            `;
        }
    }

    // ========== АДМИН-КОНТРОЛЫ ==========
    const adminControls = isAdmin ? `
        <div class="playoff-admin-controls">
            <div style="display: flex; flex-direction: column; gap: 4px; width: 100%;">
                ${isGrandFinal ? `
                <!-- Best of 2 — детали матчей -->
                <div style="display: flex; flex-direction: column; gap: 4px; width: 100%; align-items: center;">
                    <!-- Матч 1 -->
                    <div style="display: flex; align-items: center; gap: 8px; justify-content: center; width: 100%; max-width: 400px;">
                        <span style="color: #888888; font-size: 0.55rem; min-width: 80px; text-align: right;">Матч 1 очки:</span>
                        <input type="number" id="${matchId}_m1s1" class="playoff-score-input" value="${match.match1Score1 || 0}" min="0" step="1" style="width: 70px; font-size: 0.8rem; text-align: center;">
                        <span style="color: #ccaa66; font-size: 0.9rem; font-weight: 700; min-width: 16px; text-align: center;">:</span>
                        <input type="number" id="${matchId}_m1s2" class="playoff-score-input" value="${match.match1Score2 || 0}" min="0" step="1" style="width: 70px; font-size: 0.8rem; text-align: center;">
                    </div>
                    <!-- Матч 2 -->
                    <div style="display: flex; align-items: center; gap: 8px; justify-content: center; width: 100%; max-width: 400px;">
                        <span style="color: #888888; font-size: 0.55rem; min-width: 80px; text-align: right;">Матч 2 очки:</span>
                        <input type="number" id="${matchId}_m2s1" class="playoff-score-input" value="${match.match2Score1 || 0}" min="0" step="1" style="width: 70px; font-size: 0.8rem; text-align: center;">
                        <span style="color: #ccaa66; font-size: 0.9rem; font-weight: 700; min-width: 16px; text-align: center;">:</span>
                        <input type="number" id="${matchId}_m2s2" class="playoff-score-input" value="${match.match2Score2 || 0}" min="0" step="1" style="width: 70px; font-size: 0.8rem; text-align: center;">
                    </div>
                    <!-- Матч 3 -->
                    <div style="display: flex; align-items: center; gap: 8px; justify-content: center; width: 100%; max-width: 400px;">
                        <span style="color: #888888; font-size: 0.55rem; min-width: 80px; text-align: right;">Матч 3 очки:</span>
                        <input type="number" id="${matchId}_m3s1" class="playoff-score-input" value="${match.match3Score1 || 0}" min="0" step="1" style="width: 70px; font-size: 0.8rem; text-align: center;">
                        <span style="color: #ccaa66; font-size: 0.9rem; font-weight: 700; min-width: 16px; text-align: center;">:</span>
                        <input type="number" id="${matchId}_m3s2" class="playoff-score-input" value="${match.match3Score2 || 0}" min="0" step="1" style="width: 70px; font-size: 0.8rem; text-align: center;">
                    </div>
                    <!-- Сумма очков (автоматический расчёт) -->
                    <div style="display: flex; align-items: center; gap: 8px; justify-content: center; border-top: 1px solid #2a2a2a; padding-top: 8px; margin-top: 4px; width: 100%; max-width: 400px;">
                        <span style="color: #ccaa66; font-size: 0.6rem; font-weight: 700; letter-spacing: 0.5px; min-width: 80px; text-align: right;">Сумма очков:</span>
                        <span style="color: #ccaa66; font-weight: 700; font-size: 0.9rem; min-width: 70px; text-align: center;" id="${matchId}_sum1_display">${(match.match1Score1 || 0) + (match.match2Score1 || 0) + (match.match3Score1 || 0)}</span>
                        <span style="color: #ccaa66; font-size: 0.9rem; font-weight: 700; min-width: 16px; text-align: center;">:</span>
                        <span style="color: #ccaa66; font-weight: 700; font-size: 0.9rem; min-width: 70px; text-align: center;" id="${matchId}_sum2_display">${(match.match1Score2 || 0) + (match.match2Score2 || 0) + (match.match3Score2 || 0)}</span>
                    </div>
                </div>
                ` : `
                <!-- Обычный матч -->
                <div style="display: flex; flex-direction: column; gap: 4px; width: 100%; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 8px; justify-content: center; width: 100%; max-width: 320px;">
                        <span style="color: #888888; font-size: 0.5rem; min-width: 40px; text-align: right;">Счёт:</span>
                        <input type="number" id="${matchId}_score1" class="playoff-score-input" value="${safeMatch.team1Score}" min="0" max="1" step="1" placeholder="Счет 1" style="width: 50px; font-size: 0.8rem; text-align: center;">
                        <span style="color: #ccaa66; font-size: 0.9rem; font-weight: 700; min-width: 16px; text-align: center;">:</span>
                        <input type="number" id="${matchId}_score2" class="playoff-score-input" value="${safeMatch.team2Score}" min="0" max="1" step="1" placeholder="Счет 2" style="width: 50px; font-size: 0.8rem; text-align: center;">
                    </div>
                    <div style="display: flex; align-items: center; gap: 8px; justify-content: center; width: 100%; max-width: 320px;">
                        <span style="color: #888888; font-size: 0.5rem; min-width: 40px; text-align: right;">Очки:</span>
                        <input type="number" id="${matchId}_points1" class="playoff-points-input" value="${safeMatch.team1Points}" min="0" max="100000" step="1" placeholder="Очки 1" style="width: 70px; font-size: 0.8rem; text-align: center;">
                        <span style="color: #ccaa66; font-size: 0.9rem; font-weight: 700; min-width: 16px; text-align: center;">:</span>
                        <input type="number" id="${matchId}_points2" class="playoff-points-input" value="${safeMatch.team2Points}" min="0" max="100000" step="1" placeholder="Очки 2" style="width: 70px; font-size: 0.8rem; text-align: center;">
                    </div>
                </div>
                `}
                <!-- Общие поля (дата и ссылка) -->
                <div style="display: flex; align-items: center; gap: 6px; justify-content: center; flex-wrap: wrap; width: 100%;">
                    <input type="datetime-local" id="${matchId}_date" class="match-date-input" value="${formatDateForInput(effectiveDate)}" style="width: 160px;">
                    <input type="text" id="${matchId}_streamUrl" class="match-stream-input" placeholder="${t('admin_live_url')}" value="${escapeHtml(effectiveStreamUrl)}" style="width: 120px;">
                </div>
                <button id="update-${matchId}" class="playoff-update-btn" style="min-width: 120px; height: 32px; display: inline-flex; align-items: center; justify-content: center; margin: 4px auto 0;">✓ ${t('admin_save')}</button>
            </div>
        </div>
    ` : '';

    const winnerHtml = '';

    return `
        <div class="playoff-match-card ${extraClass} ${isCompleted ? 'completed' : ''}" data-team1="${escapeHtml(safeMatch.team1)}" data-team2="${escapeHtml(safeMatch.team2)}">
            <div class="match-header">
                <span class="match-datetime">${showDate}</span>
                <a href="${streamLink}" target="_blank" class="${liveBtnClass} ${pulseAnimation}">
                    ${liveDotHtml}${t('live')}
                </a>
            </div>
            <div class="match-content">
                <div class="playoff-teams-row">
                    <div class="playoff-team playoff-team-left ${winnerClass1}">
                        ${team1AvatarHtml}
                        <span class="playoff-team-name ${isTBDTeam1 ? 'tbd-team' : ''} ${team1Class}" style="cursor: pointer;" data-team-name="${escapeHtml(safeMatch.team1)}">${escapeHtml(safeMatch.team1)}</span>
                    </div>
                    <div class="playoff-vs ${vsAnimationClass}">${t('vs')}</div>
                    <div class="playoff-team playoff-team-right ${winnerClass2}">
                        <span class="playoff-team-name ${isTBDTeam2 ? 'tbd-team' : ''} ${team2Class}" style="cursor: pointer;" data-team-name="${escapeHtml(safeMatch.team2)}">${escapeHtml(safeMatch.team2)}</span>
                        ${team2AvatarHtml}
                    </div>
                </div>
                <div class="playoff-scores-row">
                    <span class="playoff-score-left ${score1Class}">${safeMatch.team1Score}</span>
                    <span class="playoff-score-divider">:</span>
                    <span class="playoff-score-right ${score2Class}">${safeMatch.team2Score}</span>
                </div>
                ${!isGrandFinal ? `
                <div class="playoff-points-row">
                    <span class="playoff-points-left">${safeMatch.team1Points.toLocaleString()}</span>
                    <span class="playoff-points-divider">:</span>
                    <span class="playoff-points-right">${safeMatch.team2Points.toLocaleString()}</span>
                </div>
                ` : `
                <div class="playoff-points-row">
                    <span class="playoff-points-left" style="color: #ccaa66; font-size: 0.9rem; font-weight: 700;">${sum1.toLocaleString()}</span>
                    <span class="playoff-points-divider" style="color: #ccaa66; font-size: 1rem; font-weight: 700;">:</span>
                    <span class="playoff-points-right" style="color: #ccaa66; font-size: 0.9rem; font-weight: 700;">${sum2.toLocaleString()}</span>
                </div>
                `}
                ${bestOf3Html}
                ${winnerHtml}
                ${adminControls}
            </div>
        </div>
    `;
}

function attachPlayoffHandlers() {
    const matches = ['upperFinal', 'lowerSemi', 'lowerFinal', 'grandFinal'];

    matches.forEach(matchId => {
        const updateBtn = document.getElementById(`update-${matchId}`);
        if (updateBtn) {
            updateBtn.removeEventListener('click', () => handlePlayoffUpdate(matchId));
            updateBtn.addEventListener('click', () => handlePlayoffUpdate(matchId));
        }
    });
}

function initFieldTracking() {
    // Для группового этапа
    document.querySelectorAll('.match-score-input, .match-points-input, .match-date-input, .match-stream-input').forEach(input => {
        input.removeEventListener('input', handleFieldChange);
        input.addEventListener('input', handleFieldChange);
    });

    // Для плей-офф
    document.querySelectorAll('.playoff-score-input, .playoff-points-input, .match-date-input, .match-stream-input').forEach(input => {
        input.removeEventListener('input', handleFieldChange);
        input.addEventListener('input', handleFieldChange);
    });
}

function handleFieldChange(e) {
    // Находим ближайшую кнопку сохранения
    const container = e.target.closest('.match-admin-controls, .playoff-admin-controls');
    if (!container) return;

    const btn = container.querySelector('.match-update-btn, .playoff-update-btn');
    if (btn) {
        btn.classList.add('has-changes');
    }
}

function handlePlayoffUpdate(matchId) {
    const score1Input = document.getElementById(`${matchId}_score1`);
    const score2Input = document.getElementById(`${matchId}_score2`);
    const points1Input = document.getElementById(`${matchId}_points1`);
    const points2Input = document.getElementById(`${matchId}_points2`);
    const dateInput = document.getElementById(`${matchId}_date`);
    const streamUrlInput = document.getElementById(`${matchId}_streamUrl`);

    if (!tournamentData.playoffs[matchId]) {
        tournamentData.playoffs[matchId] = {
            team1: 'TBD',
            team2: 'TBD',
            team1Score: 0,
            team2Score: 0,
            team1Points: 0,
            team2Points: 0,
            winner: '',
            date: '',
            streamUrl: ''
        };
    }

    // ========== ДЛЯ ГРАНД-ФИНАЛА — ЧИТАЕМ ТОЛЬКО ОЧКИ ==========
    if (matchId === 'grandFinal') {
        const m1s1 = document.getElementById(`${matchId}_m1s1`);
        const m1s2 = document.getElementById(`${matchId}_m1s2`);
        const m2s1 = document.getElementById(`${matchId}_m2s1`);
        const m2s2 = document.getElementById(`${matchId}_m2s2`);
        const m3s1 = document.getElementById(`${matchId}_m3s1`);
        const m3s2 = document.getElementById(`${matchId}_m3s2`);

        if (m1s1) tournamentData.playoffs[matchId].match1Score1 = parseInt(m1s1.value) || 0;
        if (m1s2) tournamentData.playoffs[matchId].match1Score2 = parseInt(m1s2.value) || 0;
        if (m2s1) tournamentData.playoffs[matchId].match2Score1 = parseInt(m2s1.value) || 0;
        if (m2s2) tournamentData.playoffs[matchId].match2Score2 = parseInt(m2s2.value) || 0;
        if (m3s1) tournamentData.playoffs[matchId].match3Score1 = parseInt(m3s1.value) || 0;
        if (m3s2) tournamentData.playoffs[matchId].match3Score2 = parseInt(m3s2.value) || 0;

        // Суммируем очки
        const total1 = (tournamentData.playoffs[matchId].match1Score1 || 0) +
                       (tournamentData.playoffs[matchId].match2Score1 || 0) +
                       (tournamentData.playoffs[matchId].match3Score1 || 0);
        const total2 = (tournamentData.playoffs[matchId].match1Score2 || 0) +
                       (tournamentData.playoffs[matchId].match2Score2 || 0) +
                       (tournamentData.playoffs[matchId].match3Score2 || 0);

        tournamentData.playoffs[matchId].team1Points = total1;
        tournamentData.playoffs[matchId].team2Points = total2;

        // Автоматический расчёт победителя
        const winner = calculateGrandFinalWinner(tournamentData.playoffs[matchId]);
        if (winner) {
            tournamentData.playoffs[matchId].winner = winner;
        } else {
            tournamentData.playoffs[matchId].winner = '';
        }
    }

    // ===== ОБНОВЛЕНИЕ СУММЫ ОЧКОВ В РЕАЛЬНОМ ВРЕМЕНИ =====
    if (matchId === 'grandFinal') {
        // Функция для обновления суммы
        function updateGrandFinalSum() {
            const m1s1 = parseInt(document.getElementById(`${matchId}_m1s1`)?.value) || 0;
            const m1s2 = parseInt(document.getElementById(`${matchId}_m1s2`)?.value) || 0;
            const m2s1 = parseInt(document.getElementById(`${matchId}_m2s1`)?.value) || 0;
            const m2s2 = parseInt(document.getElementById(`${matchId}_m2s2`)?.value) || 0;
            const m3s1 = parseInt(document.getElementById(`${matchId}_m3s1`)?.value) || 0;
            const m3s2 = parseInt(document.getElementById(`${matchId}_m3s2`)?.value) || 0;

            const sum1 = m1s1 + m2s1 + m3s1;
            const sum2 = m1s2 + m2s2 + m3s2;

            const sumDisplay1 = document.getElementById(`${matchId}_sum1_display`);
            const sumDisplay2 = document.getElementById(`${matchId}_sum2_display`);

            if (sumDisplay1) sumDisplay1.textContent = sum1;
            if (sumDisplay2) sumDisplay2.textContent = sum2;
        }

        // Вешаем обработчики на все поля
        const fields = [`${matchId}_m1s1`, `${matchId}_m1s2`, `${matchId}_m2s1`, `${matchId}_m2s2`, `${matchId}_m3s1`, `${matchId}_m3s2`];
        fields.forEach(fieldId => {
            const el = document.getElementById(fieldId);
            if (el) {
                el.removeEventListener('input', updateGrandFinalSum);
                el.addEventListener('input', updateGrandFinalSum);
            }
        });

        // Обновляем сумму сразу после рендера
        setTimeout(updateGrandFinalSum, 50);
    }  

    // ========== ОБЫЧНЫЙ МАТЧ (НЕ ГРАНД-ФИНАЛ) ==========
    if (matchId !== 'grandFinal') {
        if (score1Input && score2Input) {
            let score1 = parseInt(score1Input.value) || 0;
            let score2 = parseInt(score2Input.value) || 0;
            score1 = Math.min(score1, 1);
            score2 = Math.min(score2, 1);
            tournamentData.playoffs[matchId].team1Score = score1;
            tournamentData.playoffs[matchId].team2Score = score2;
        }

        if (points1Input && points2Input) {
            tournamentData.playoffs[matchId].team1Points = parseInt(points1Input.value) || 0;
            tournamentData.playoffs[matchId].team2Points = parseInt(points2Input.value) || 0;
        }

        if (tournamentData.playoffs[matchId].team1 && tournamentData.playoffs[matchId].team1 !== 'TBD' &&
            tournamentData.playoffs[matchId].team1 !== '' &&
            tournamentData.playoffs[matchId].team2 && tournamentData.playoffs[matchId].team2 !== 'TBD' &&
            tournamentData.playoffs[matchId].team2 !== '') {

            const score1 = tournamentData.playoffs[matchId].team1Score;
            const score2 = tournamentData.playoffs[matchId].team2Score;

            if (score1 > score2) {
                tournamentData.playoffs[matchId].winner = tournamentData.playoffs[matchId].team1;
            } else if (score2 > score1) {
                tournamentData.playoffs[matchId].winner = tournamentData.playoffs[matchId].team2;
            } else {
                tournamentData.playoffs[matchId].winner = '';
            }
        }
    }

    // ========== ОБЩИЕ ПОЛЯ (ДАТА, СТРИМ) ==========
    if (dateInput && dateInput.value) {
        let dateValue = dateInput.value;
        if (dateValue && !dateValue.includes('T')) {
            dateValue = dateValue.replace(' ', 'T');
        }
        if (dateValue && !dateValue.endsWith('Z')) {
            dateValue = dateValue + 'Z';
        }
        tournamentData.playoffs[matchId].date = dateValue;
        tempPlayoffDates[matchId] = dateValue;
    }

    if (streamUrlInput) {
        tournamentData.playoffs[matchId].streamUrl = streamUrlInput.value;
        tempPlayoffStreamUrls[matchId] = streamUrlInput.value;
    }

    // ========== ЗАПОМИНАЕМ ID МАТЧА ==========
    const matchIdStr = matchId;

    // ========== АНИМАЦИЯ КАРТОЧКИ ==========
    const matchCard = document.getElementById(`update-${matchId}`)?.closest('.playoff-match-card');
    if (matchCard) {
        matchCard.classList.add('updating');
        setTimeout(() => {
            matchCard.classList.remove('updating');
        }, 500);
    }

    // ========== ПЕРЕРИСОВЫВАЕМ ПЛЕЙ-ОФФ ==========
    updatePlayoffsBracket();
    renderPlayoffs();
    updatePlayoffAnimation();

    // ========== ПОСЛЕ РЕНДЕРА — НАХОДИМ НОВУЮ КНОПКУ ==========
    const newBtn = document.getElementById(`update-${matchIdStr}`);

    if (!newBtn) {
        console.error('Новая кнопка не найдена после рендера!');
        return;
    }

    // ========== ДОБАВЛЯЕМ СПИННЕР В НОВУЮ КНОПКУ ==========
    const originalText = newBtn.textContent;

    // Очищаем кнопку
    newBtn.innerHTML = '';

    // Создаём спан для спиннера
    const spinnerSpan = document.createElement('span');
    spinnerSpan.className = 'btn-spinner';
    spinnerSpan.style.display = 'inline-block';
    spinnerSpan.style.width = '14px';
    spinnerSpan.style.height = '14px';
    spinnerSpan.style.border = '2px solid rgba(255,255,255,0.3)';
    spinnerSpan.style.borderTop = '2px solid #ffffff';
    spinnerSpan.style.borderRadius = '50%';
    spinnerSpan.style.animation = 'btnSpinnerSpin 0.7s linear infinite';
    spinnerSpan.style.verticalAlign = 'middle';
    spinnerSpan.style.marginRight = '4px';
    spinnerSpan.style.flexShrink = '0';

    // Создаём спан для текста
    const textSpan = document.createElement('span');
    textSpan.className = 'btn-text';
    textSpan.textContent = 'СОХРАНЕНИЕ...';

    // Добавляем в кнопку
    newBtn.appendChild(spinnerSpan);
    newBtn.appendChild(textSpan);

    // Добавляем классы (без инлайн-стилей!)
    newBtn.classList.add('saving');
    newBtn.disabled = true;

    console.log('Спиннер добавлен в новую кнопку плей-офф');

    // ========== СОХРАНЯЕМ ДАННЫЕ ==========
    saveAllDataToGoogle().then(success => {
        setTimeout(() => {
            newBtn.classList.remove('saving');

            if (success) {
                newBtn.classList.remove('has-changes');
                newBtn.innerHTML = '✓ СОХРАНЕНО';
                setTimeout(() => {
                    newBtn.innerHTML = originalText;
                    newBtn.disabled = false;
                }, 1000);
            } else {
                newBtn.innerHTML = '✗ ОШИБКА';
                setTimeout(() => {
                    newBtn.innerHTML = originalText;
                    newBtn.disabled = false;
                }, 1500);
            }
        }, 400);
    });
}

async function savePlayoffToSheet(matchId) {
    try {
        // Убеждаемся, что все данные плей-офф актуальны
        const playoffsToSave = {
            upperFinal: {
                team1: tournamentData.playoffs.upperFinal?.team1 || '',
                team2: tournamentData.playoffs.upperFinal?.team2 || '',
                team1Score: tournamentData.playoffs.upperFinal?.team1Score || 0,
                team2Score: tournamentData.playoffs.upperFinal?.team2Score || 0,
                team1Points: tournamentData.playoffs.upperFinal?.team1Points || 0,
                team2Points: tournamentData.playoffs.upperFinal?.team2Points || 0,
                winner: tournamentData.playoffs.upperFinal?.winner || '',
                date: tournamentData.playoffs.upperFinal?.date || '',
                streamUrl: tournamentData.playoffs.upperFinal?.streamUrl || ''
            },
            lowerSemi: {
                team1: tournamentData.playoffs.lowerSemi?.team1 || '',
                team2: tournamentData.playoffs.lowerSemi?.team2 || '',
                team1Score: tournamentData.playoffs.lowerSemi?.team1Score || 0,
                team2Score: tournamentData.playoffs.lowerSemi?.team2Score || 0,
                team1Points: tournamentData.playoffs.lowerSemi?.team1Points || 0,
                team2Points: tournamentData.playoffs.lowerSemi?.team2Points || 0,
                winner: tournamentData.playoffs.lowerSemi?.winner || '',
                date: tournamentData.playoffs.lowerSemi?.date || '',
                streamUrl: tournamentData.playoffs.lowerSemi?.streamUrl || ''
            },
            lowerFinal: {
                team1: tournamentData.playoffs.lowerFinal?.team1 || '',
                team2: tournamentData.playoffs.lowerFinal?.team2 || '',
                team1Score: tournamentData.playoffs.lowerFinal?.team1Score || 0,
                team2Score: tournamentData.playoffs.lowerFinal?.team2Score || 0,
                team1Points: tournamentData.playoffs.lowerFinal?.team1Points || 0,
                team2Points: tournamentData.playoffs.lowerFinal?.team2Points || 0,
                winner: tournamentData.playoffs.lowerFinal?.winner || '',
                date: tournamentData.playoffs.lowerFinal?.date || '',
                streamUrl: tournamentData.playoffs.lowerFinal?.streamUrl || ''
            },
            grandFinal: {
                team1: tournamentData.playoffs.grandFinal?.team1 || '',
                team2: tournamentData.playoffs.grandFinal?.team2 || '',
                team1Score: tournamentData.playoffs.grandFinal?.team1Score || 0,
                team2Score: tournamentData.playoffs.grandFinal?.team2Score || 0,
                team1Points: tournamentData.playoffs.grandFinal?.team1Points || 0,
                team2Points: tournamentData.playoffs.grandFinal?.team2Points || 0,
                winner: tournamentData.playoffs.grandFinal?.winner || '',
                date: tournamentData.playoffs.grandFinal?.date || '',
                streamUrl: tournamentData.playoffs.grandFinal?.streamUrl || ''
            }
        };
        
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'tournament',
                data: JSON.stringify({ 
                    groups: tournamentData.groups, 
                    playoffs: playoffsToSave 
                })
            }).toString()
        });
        
        const result = await response.json();
        
        if (result.success) {
            
            // Очищаем кеш прогнозов
            localStorage.removeItem('prediction_cache');
            
            const updateBtn = document.getElementById(`update-${matchId}`);
            if (updateBtn) updateBtn.classList.remove('has-changes');
            
            // Показываем уведомление об успехе
            showStatus('Данные плей-офф сохранены', 'success');
        } else {
            console.error('Failed to save playoff:', result.error);
            showStatus('Ошибка сохранения плей-офф', 'error');
        }
        
    } catch(e) {
        console.error('Save playoff error:', e);
        showStatus('Ошибка сохранения: ' + e.message, 'error');
    }
}

function renderPlayoffs() {
    const upperBracketDiv = document.getElementById('upper-bracket-matches');
    const lowerSemiDiv = document.getElementById('lower-semi-match');
    const lowerFinalDiv = document.getElementById('lower-final-match');
    const finalDiv = document.getElementById('final-match');

    if (upperBracketDiv) {
        const upperFinal = tournamentData.playoffs.upperFinal;
        upperBracketDiv.innerHTML = renderPlayoffMatchCard(upperFinal, 'upperFinal', 'upper-final');
    }

    if (lowerSemiDiv) {
        const lowerSemi = tournamentData.playoffs.lowerSemi;
        lowerSemiDiv.innerHTML = renderPlayoffMatchCard(lowerSemi, 'lowerSemi', 'half-final');
    }

    if (lowerFinalDiv) {
        const lowerFinal = tournamentData.playoffs.lowerFinal;
        lowerFinalDiv.innerHTML = renderPlayoffMatchCard(lowerFinal, 'lowerFinal', 'lower-final');
    }

    if (finalDiv) {
        const grandFinal = tournamentData.playoffs.grandFinal;
        let html = renderPlayoffMatchCard(grandFinal, 'grandFinal', 'grand-final');

        if (grandFinal.winner && grandFinal.winner !== '' && grandFinal.winner !== 'TBD') {
            const championAvatar = getAvatarHtml(grandFinal.winner);
            html += `
                <div class="trophy-container">
                    <img src="image/GUP.png" alt="Champion Trophy" class="trophy-image" onclick="openTrophyModal()" style="cursor: pointer;">
                    <div class="winner-name">
                        <span class="winner-label">${t('champion')}</span>
                        ${championAvatar}
                        <span class="winner-team-name">${escapeHtml(grandFinal.winner)}</span>
                    </div>
                </div>
            `;
        }

        finalDiv.innerHTML = html;
    }

    if (isAdmin) {
        attachPlayoffHandlers();
        // ========== ДОБАВЛЯЕМ ОТСЛЕЖИВАНИЕ ПОЛЕЙ ПОСЛЕ РЕНДЕРА ==========
        setTimeout(initFieldTracking, 100);
    }

    updatePlayoffAnimation();
}

// ==================== ЖЕРЕБЬЁВКА ====================
function updateDrawButtons() {
    const btn1 = document.getElementById('draw-group-a1');
    const btn2 = document.getElementById('draw-group-b1');
    const btn3 = document.getElementById('draw-group-a2');
    const btn4 = document.getElementById('draw-group-b2');
    
    if (!isAdmin) {
        const allBtns = [btn1, btn2, btn3, btn4];
        allBtns.forEach(btn => { if (btn) btn.disabled = true; });
        return;
    }
    
    let allTeamsFilled = true;
    for (let i = 1; i <= 8; i++) {
        const input = document.getElementById(`team${i}`);
        if (!input || !input.value.trim()) {
            allTeamsFilled = false;
            break;
        }
    }
    
    if (!allTeamsFilled) {
        const allBtns = [btn1, btn2, btn3, btn4];
        allBtns.forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.classList.remove('active', 'completed', 'waiting');
                btn.classList.add('waiting');
            }
        });
        return;
    }
    
    if (btn1) {
        if (currentDrawStep >= 1) {
            btn1.classList.add('completed');
            btn1.classList.remove('active', 'waiting');
            btn1.disabled = true;
        } else {
            btn1.classList.add('active');
            btn1.classList.remove('completed', 'waiting');
            btn1.disabled = false;
        }
    }
    
    if (btn2) {
        if (currentDrawStep >= 2) {
            btn2.classList.add('completed');
            btn2.classList.remove('active', 'waiting');
            btn2.disabled = true;
        } else if (currentDrawStep >= 1) {
            btn2.classList.add('active');
            btn2.classList.remove('completed', 'waiting');
            btn2.disabled = false;
        } else {
            btn2.classList.add('waiting');
            btn2.classList.remove('active', 'completed');
            btn2.disabled = true;
        }
    }
    
    if (btn3) {
        if (currentDrawStep >= 3) {
            btn3.classList.add('completed');
            btn3.classList.remove('active', 'waiting');
            btn3.disabled = true;
        } else if (currentDrawStep >= 2) {
            btn3.classList.add('active');
            btn3.classList.remove('completed', 'waiting');
            btn3.disabled = false;
        } else {
            btn3.classList.add('waiting');
            btn3.classList.remove('active', 'completed');
            btn3.disabled = true;
        }
    }
    
    if (btn4) {
        if (currentDrawStep >= 4) {
            btn4.classList.add('completed');
            btn4.classList.remove('active', 'waiting');
            btn4.disabled = true;
        } else if (currentDrawStep >= 3) {
            btn4.classList.add('active');
            btn4.classList.remove('completed', 'waiting');
            btn4.disabled = false;
        } else {
            btn4.classList.add('waiting');
            btn4.classList.remove('active', 'completed');
            btn4.disabled = true;
        }
    }
}

function updateDrawStatus() {
    const statusDiv = document.getElementById('draw-status');
    if (!statusDiv) return;
    let html = `<strong>${t('draw_status_title')}</strong>`;
    html += `<div class="pair"><span class="pair-number">${t('draw_group_a_label')}</span> ${groupATeamsList.length ? groupATeamsList.join(', ') : t('draw_waiting_message')}</div>`;
    html += `<div class="pair"><span class="pair-number">${t('draw_group_b_label')}</span> ${groupBTeamsList.length ? groupBTeamsList.join(', ') : t('draw_waiting_message')}</div>`;
    html += `<p style="margin-top: 0.75rem; color: #ccaa66;">${t('draw_teams_left')} ${remainingTeamsAll.length}</p>`;
    if (currentDrawStep === 4) html += `<p style="margin-top: 0.75rem; color: #6aaf6a;">${t('draw_completed_message')}</p>`;
    statusDiv.innerHTML = html;
}

function performDrawToGroup(group, stepNumber) {
    console.log('=== performDrawToGroup ===', group, stepNumber);
    
    if (!isAdmin) { 
        showStatus('status_admin_required', 'error'); 
        playSound('error'); 
        return false; 
    }
    
    if (currentDrawStep === 4) {
        showStatus('status_draw_already_completed', 'error');
        playSound('error');
        return false;
    }
    
    if (stepNumber !== currentDrawStep + 1) {
        showStatus('status_wrong_turn', 'error');
        playSound('error');
        return false;
    }
    
    let btnSuffix = '';
    if (stepNumber === 1) btnSuffix = 'a1';
    else if (stepNumber === 2) btnSuffix = 'b1';
    else if (stepNumber === 3) btnSuffix = 'a2';
    else if (stepNumber === 4) btnSuffix = 'b2';
    const btnId = `draw-group-${btnSuffix}`;
    const btn = document.getElementById(btnId);
    console.log('Ищем кнопку:', btnId, 'найдена:', !!btn);
    
    if (stepNumber === 1 && remainingTeamsAll.length === 0) {
        console.log('Шаг 1: Инициализация');
        const teams = [];
        for (let i = 1; i <= 8; i++) {
            const input = document.getElementById(`team${i}`);
            const name = input ? input.value.trim() : '';
            if (!name) {
                showStatus('status_team_not_filled', 'error');
                playSound('error');
                return false;
            }
            teams.push(name);
        }
        remainingTeamsAll = shuffleArray([...teams]);
        groupATeamsList = [];
        groupBTeamsList = [];
        console.log('Команды перемешаны:', remainingTeamsAll);
    }
    
    if (remainingTeamsAll.length < 2) {
        showStatus('status_not_enough_teams', 'error');
        playSound('error');
        return false;
    }
    
    const team1 = remainingTeamsAll.shift();
    const team2 = remainingTeamsAll.shift();
    console.log(`Добавляем ${team1} и ${team2} в группу ${group}`);
    
    if (group === 'A') {
        groupATeamsList.push(team1, team2);
    } else {
        groupBTeamsList.push(team1, team2);
    }
    
    currentDrawStep = stepNumber;
    console.log(`Шаг ${stepNumber} выполнен. Осталось команд: ${remainingTeamsAll.length}`);
    
    if (btn) {
        btn.classList.remove('active', 'waiting');
        btn.classList.add('completed');
        btn.disabled = true;
    }
    
    let nextBtnId = null;
    if (stepNumber === 1) nextBtnId = 'draw-group-b1';
    else if (stepNumber === 2) nextBtnId = 'draw-group-a2';
    else if (stepNumber === 3) nextBtnId = 'draw-group-b2';
    
    if (nextBtnId) {
        const nextBtn = document.getElementById(nextBtnId);
        if (nextBtn) {
            nextBtn.classList.remove('waiting');
            nextBtn.classList.add('active');
            nextBtn.disabled = false;
            console.log(`Активирована кнопка: ${nextBtnId}`);
        }
    }
    
    updateTeamsInputStatus();
    updateDrawStatus();
    updateDrawButtons();
    
    if (groupATeamsList.length === 4 && groupBTeamsList.length === 4) {
        console.log('Жеребьёвка завершена!');
        tournamentData.groups.A.teams = [...groupATeamsList];
        tournamentData.groups.B.teams = [...groupBTeamsList];
        initGroupMatches();
        updatePlayoffsBracket();
        renderGroups();
        renderPlayoffs();
        updateTeamsInputStatus();
        currentDrawStep = 4;

        updateGroupStageAnimation();
        
        const saveDrawBtn = document.getElementById('save-draw');
        if (saveDrawBtn) {
            saveDrawBtn.style.display = 'inline-block';
            saveDrawBtn.classList.add('draw-save-ready');
        }
        
        showStatus('draw_completed_success', 'success');
        playSound('success');
    } else {
        showStatus('group_added_success', 'success');
        playSound('success');
    }
    
    return true;
}

async function saveDrawToSheet() {
    if (!isAdmin) {
        showStatus('status_admin_required', 'error');
        playSound('error');
        return;
    }
    if (currentDrawStep !== 4) {
        showStatus('status_draw_not_completed', 'error');
        playSound('error');
        return;
    }
    
    showStatus('status_saving_draw', 'success');
    
    // Собираем данные команд и аватаров
    const avatarsData = {};
    for (let i = 1; i <= 8; i++) {
        const nameInput = document.getElementById(`team${i}`);
        const avatarInput = document.getElementById(`team${i}_avatar`);
        const teamName = nameInput ? nameInput.value.trim() : '';
        const avatarUrl = avatarInput ? avatarInput.value.trim() : '';
        
        if (teamName) {
            avatarsData[teamName] = avatarUrl || '';
        }
    }
    
    try {
        // 1. Сохраняем статус жеребьёвки
        const response1 = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'drawStatus',
                data: JSON.stringify({ drawCompleted: true })
            }).toString()
        });
        const result1 = await response1.json();
        
        // 2. Сохраняем турнирные данные (группы)
        const response2 = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'tournament',
                data: JSON.stringify({ groups: tournamentData.groups, playoffs: tournamentData.playoffs })
            }).toString()
        });
        const result2 = await response2.json();
        
        // 3. Сохраняем аватары команд
        const response3 = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'saveAvatars',
                data: JSON.stringify(avatarsData)
            }).toString()
        });
        const result3 = await response3.json();
        
        console.log('Результаты сохранения:', { result1, result2, result3 });
        
        if (result1.success && result2.success && result3.success) {
            playSound('success');
            showStatus('status_draw_saved', 'success');
            const drawSection = document.querySelector('.draw-section');
            if (drawSection) drawSection.classList.add('hidden');
            updateGroupStageAnimation();
        } else {
            console.error('Ошибка сохранения:', { result1, result2, result3 });
            showToast(t('error_saving_to_google'), 'error', t('error'));
            playSound('error');
        }
    } catch(e) {
        console.error('saveDrawToSheet error:', e);
        playSound('error');
        showToast(t('error_saving_to_google'), 'error', t('error'));
    }
}

function clearAllTeams() {
    if (!isAdmin) { showStatus('status_admin_required', 'error'); playSound('error'); return; }
    if (confirm(t('confirm_clear_teams'))) {
        playSound('click');
        
        for (let i = 1; i <= 8; i++) { 
            const input = document.getElementById(`team${i}`); 
            if (input) {
                input.value = '';
                input.classList.remove('used');
                input.disabled = false;
            }
        }
        
        remainingTeamsAll = [];
        groupATeamsList = [];
        groupBTeamsList = [];
        currentDrawStep = 0;
        tournamentData.groups.A.teams = [];
        tournamentData.groups.B.teams = [];
        tournamentData.groups.A.matches = [];
        tournamentData.groups.B.matches = [];
        tournamentData.playoffs = {
            upperFinal: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' },
            lowerSemi: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' },
            lowerFinal: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' },
            grandFinal: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' }
        };
        
        const allBtns = ['draw-group-a1', 'draw-group-b1', 'draw-group-a2', 'draw-group-b2'];
        allBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.classList.remove('completed', 'active', 'waiting');
                btn.classList.add('waiting');
                btn.disabled = true;
            }
        });
        
        const saveDrawBtn = document.getElementById('save-draw');
        if (saveDrawBtn) {
            saveDrawBtn.style.display = 'none';
            saveDrawBtn.classList.remove('draw-save-ready');
        }
        
        updateDrawStatus();
        renderGroups();
        renderPlayoffs();
        
        showStatus('status_cleared', 'success');
    }
}

function checkTeamsAndUpdateButtons() {
    if (!isAdmin) return;
    
    let allTeamsFilled = true;
    for (let i = 1; i <= 8; i++) {
        const input = document.getElementById(`team${i}`);
        if (!input || !input.value.trim()) {
            allTeamsFilled = false;
            break;
        }
    }
    
    if (allTeamsFilled && currentDrawStep === 0 && remainingTeamsAll.length === 0) {
        const btn1 = document.getElementById('draw-group-a1');
        if (btn1) {
            btn1.disabled = false;
            btn1.classList.remove('waiting', 'completed');
            btn1.classList.add('active');
        }
    } else if (!allTeamsFilled) {
        const allBtns = ['draw-group-a1', 'draw-group-b1', 'draw-group-a2', 'draw-group-b2'];
        allBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.disabled = true;
                btn.classList.remove('active', 'completed');
                btn.classList.add('waiting');
            }
        });
    }
    
    updateDrawButtons();
}

function updateTeamsInputStatus() {
    const distributedTeams = [...groupATeamsList, ...groupBTeamsList];
    const isDrawCompleted = (groupATeamsList.length === 4 && groupBTeamsList.length === 4);
    
    for (let i = 1; i <= 8; i++) {
        const input = document.getElementById(`team${i}`);
        if (!input) continue;
        
        const teamName = input.value.trim();
        
        if (isDrawCompleted) {
            input.readOnly = true;
            input.classList.add('used');
            const avatarInput = document.getElementById(`team${i}_avatar`);
            if (avatarInput) {
                avatarInput.readOnly = true;
            }
        } 
        else if (teamName && distributedTeams.includes(teamName)) {
            input.classList.add('used');
            input.disabled = true;
        } else {
            input.classList.remove('used');
            input.disabled = false;
            input.readOnly = false;
            const avatarInput = document.getElementById(`team${i}_avatar`);
            if (avatarInput) {
                avatarInput.readOnly = false;
            }
        }
    }
}

function resetDraw() {
    if (!isAdmin) { showStatus('status_admin_required', 'error'); playSound('error'); return; }
    if (confirm(t('confirm_reset_draw'))) {
        playSound('click');
        
        remainingTeamsAll = [];
        groupATeamsList = [];
        groupBTeamsList = [];
        currentDrawStep = 0;
        tournamentData.groups.A.teams = [];
        tournamentData.groups.B.teams = [];
        tournamentData.groups.A.matches = [];
        tournamentData.groups.B.matches = [];
        tournamentData.playoffs = {
            upperFinal: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' },
            lowerSemi: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' },
            lowerFinal: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' },
            grandFinal: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' }
        };
        
        fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'drawStatus',
                data: JSON.stringify({ drawCompleted: false })
            }).toString()
        }).catch(e => console.log('Reset draw status error:', e));
        
        fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'tournament',
                data: JSON.stringify({ groups: { A: { teams: [], matches: [] }, B: { teams: [], matches: [] } }, playoffs: tournamentData.playoffs })
            }).toString()
        }).catch(e => console.log('Reset tournament error:', e));
        
        const allBtns = ['draw-group-a1', 'draw-group-b1', 'draw-group-a2', 'draw-group-b2'];
        allBtns.forEach(btnId => {
            const btn = document.getElementById(btnId);
            if (btn) {
                btn.classList.remove('completed', 'active', 'waiting');
                btn.classList.add('waiting');
                btn.disabled = true;
            }
        });
        
        const firstBtn = document.getElementById('draw-group-a1');
        if (firstBtn) {
            firstBtn.classList.remove('waiting');
            firstBtn.classList.add('active');
            firstBtn.disabled = false;
        }
        
        const saveDrawBtn = document.getElementById('save-draw');
        if (saveDrawBtn) {
            saveDrawBtn.style.display = 'none';
            saveDrawBtn.classList.remove('draw-save-ready');
        }
        
        for (let i = 1; i <= 8; i++) {
            const input = document.getElementById(`team${i}`);
            if (input) {
                input.classList.remove('used');
                input.disabled = false;
            }
        }
        
        updateDrawButtons();
        updateDrawStatus();
        renderGroups();
        renderPlayoffs();
        
        const drawSection = document.querySelector('.draw-section');
        if (drawSection) drawSection.classList.remove('hidden');
        
        showStatus('status_draw_reset', 'success');
    }
}

// ==================== ПОЛНЫЙ СБРОС ТУРНИРА ====================
async function fullResetTournament() {
    if (!isAdmin) { showStatus('status_admin_required', 'error'); playSound('error'); return; }
    if (confirm(t('confirm_full_reset'))) {
        showStatus('status_full_reset', 'success');
        
        // ========== ОЧИЩАЕМ ВСЕ КЕШИ ==========
        window._rosters = null;
        teamRostersCache = null;
        teamTotalPowerCache = {};
        
        // Очищаем все localStorage кеши
        try {
            localStorage.removeItem(CACHE_KEY);
            localStorage.removeItem('prediction_cache');
            localStorage.removeItem(TEAM_ROSTERS_CACHE_KEY);
            localStorage.removeItem(RULES_CACHE_KEY);
            localStorage.removeItem('last_update_hash');
            console.log('All caches cleared on full reset');
        } catch(e) {
            console.warn('Failed to clear caches:', e);
        }
        
        // Останавливаем все интервалы перед сбросом
        stopAllTimers();

        showPageLoader();
        
        tournamentData = {
            groups: { A: { teams: [], matches: [] }, B: { teams: [], matches: [] } },
            playoffs: {
                upperFinal: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' },
                lowerSemi: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' },
                lowerFinal: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' },
                grandFinal: { team1: '', team2: '', team1Score: 0, team2Score: 0, team1Points: 0, team2Points: 0, winner: '', date: '', streamUrl: '' }
            }
        };
        
        remainingTeamsAll = [];
        groupATeamsList = [];
        groupBTeamsList = [];
        currentDrawStep = 0;
        
        for (let i = 1; i <= 8; i++) { 
            const input = document.getElementById(`team${i}`); 
            if (input) input.value = '';
            const avatarInput = document.getElementById(`team${i}_avatar`);
            if (avatarInput) avatarInput.value = '';
        }
        
        window.teamAvatars = {};
        
        scheduleData = {
            periodStart: null, periodEnd: null,
            qfStart: null, qfEnd: null,
            sfStart: null, sfEnd: null,
            final: null,
            prizePool: ''
        };
        
        prizeData = {
            1: '', 2: '', 3: '', 4: '', 5: '', 6: '', 7: '', 8: ''
        };
        
        await resetPredictionsData();
        
        const periodStartEl = document.getElementById('tournament-period-start');
        const periodEndEl = document.getElementById('tournament-period-end');
        const qfStartEl = document.getElementById('qf-period-start');
        const qfEndEl = document.getElementById('qf-period-end');
        const sfStartEl = document.getElementById('sf-period-start');
        const sfEndEl = document.getElementById('sf-period-end');
        const finalEl = document.getElementById('final-datetime');
        const prizeEl = document.getElementById('prize-pool');
        
        if (periodStartEl) periodStartEl.textContent = '—';
        if (periodEndEl) periodEndEl.textContent = '—';
        if (qfStartEl) qfStartEl.textContent = '—';
        if (qfEndEl) qfEndEl.textContent = '—';
        if (sfStartEl) sfStartEl.textContent = '—';
        if (sfEndEl) sfEndEl.textContent = '—';
        if (finalEl) finalEl.textContent = '—';
        if (prizeEl) prizeEl.textContent = '—';
        
        for (let i = 1; i <= 8; i++) {
            const prizeInput = document.getElementById(`prize-${i}`);
            if (prizeInput) prizeInput.value = '';
        }
        
        for (let i = 1; i <= 8; i++) {
            const input = document.getElementById(`team${i}`);
            if (input) {
                input.classList.remove('used');
                input.disabled = false;
            }
        }
        
        const drawSection = document.querySelector('.draw-section');
        if (drawSection) drawSection.classList.remove('hidden');
        
        const saveDrawBtn = document.getElementById('save-draw');
        if (saveDrawBtn) saveDrawBtn.style.display = 'none';
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'drawStatus',
                data: JSON.stringify({ drawCompleted: false })
            }).toString()
        }).catch(e => console.log('Reset draw status error:', e));
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'tournament',
                data: JSON.stringify({ groups: { A: { teams: [], matches: [] }, B: { teams: [], matches: [] } }, playoffs: tournamentData.playoffs })
            }).toString()
        }).catch(e => console.log('Reset tournament error:', e));
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'schedule',
                data: JSON.stringify({ period: { start: '', end: '' }, qf: { start: '', end: '' }, sf: { start: '', end: '' }, final: '', prizePool: '' })
            }).toString()
        }).catch(e => console.log('Reset schedule error:', e));
        
        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'prizes',
                data: JSON.stringify(prizeData)
            }).toString()
        }).catch(e => console.log('Reset prizes error:', e));

        // Вместо пустых объектов отправляем пустой объект
        const emptyAvatarsData = {};

        await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'saveAvatars',
                data: JSON.stringify(emptyAvatarsData)
            }).toString()
        }).catch(e => console.log('Reset avatars error:', e));        
        
        // const emptyAvatarsData = {};
        // for (let i = 1; i <= 8; i++) {
        //     emptyAvatarsData[i] = { name: '', avatar: '' };
        // }
        
        // await fetch(SCRIPT_URL, {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        //     body: new URLSearchParams({
        //         action: 'saveAvatars',
        //         data: JSON.stringify(emptyAvatarsData)
        //     }).toString()
        // }).catch(e => console.log('Reset avatars error:', e));
        
        renderGroups();
        renderPlayoffs();
        updateDrawButtons();
        updateDrawStatus();
        checkPastDates();
        
        setTimeout(() => {
            hidePageLoader();
            // Перезапускаем интервалы после сброса
            startCountdownTimer();
            startFabWaitingAnimation();
            startArenaIconWaitingAnimation();
            initArenaRace();
        }, 1000);
        
        playSound('success');
        showStatus('status_full_reset_done', 'success');
    }
}

// ==================== АДМИН-ПАНЕЛЬ ====================
function initAdmin() {
    const unlockBtn = document.getElementById('unlock-admin');
    const passInput = document.getElementById('admin-pass');
    const saveBtn = document.getElementById('save-changes');
    const fullResetBtn = document.getElementById('full-reset-btn');
    const body = document.body;

    if (!unlockBtn || !passInput) return;

    unlockBtn.addEventListener('click', async () => {
        const enteredPass = passInput.value;

        if (!enteredPass) {
            showStatus('status_enter_password', 'error');
            playSound('error');
            return;
        }

        try {
            showStatus('status_password_check', 'success');

            const response = await fetch(`${SCRIPT_URL}?action=checkPassword&pass=${encodeURIComponent(enteredPass)}`);
            const data = await response.json();

            if (data.success) {
                playSound('success');
                isAdmin = true;
                body.classList.remove('viewer-mode');
                body.classList.add('admin-mode');

                // ========== ОСТАНАВЛИВАЕМ АВТО-ОБНОВЛЕНИЕ ==========
                if (autoRefreshInterval) {
                    clearInterval(autoRefreshInterval);
                    autoRefreshInterval = null;
                    console.log('Auto-refresh остановлен (админ-режим)');
                }

                const adminControls = document.getElementById('admin-controls');
                const editScheduleBtn = document.getElementById('edit-schedule-btn');
                if (adminControls) adminControls.style.display = 'block';
                if (editScheduleBtn) editScheduleBtn.style.display = 'inline-block';
                updateDrawButtons();
                checkTeamsAndUpdateButtons();

                if (!document.getElementById('reset-draw-btn')) {
                    const resetDrawBtn = document.createElement('button');
                    resetDrawBtn.id = 'reset-draw-btn';
                    resetDrawBtn.className = 'btn-secondary';
                    resetDrawBtn.style.marginTop = '10px';
                    resetDrawBtn.style.width = '100%';
                    resetDrawBtn.textContent = t('admin_reset_draw');
                    resetDrawBtn.addEventListener('click', resetDraw);
                    const adminControlsDiv = document.getElementById('admin-controls');
                    if (adminControlsDiv) adminControlsDiv.appendChild(resetDrawBtn);
                }

                if (!document.getElementById('save-avatars')) {
                    const saveAvatarsBtn = document.createElement('button');
                    saveAvatarsBtn.id = 'save-avatars';
                    saveAvatarsBtn.className = 'btn-primary';
                    saveAvatarsBtn.style.marginTop = '10px';
                    saveAvatarsBtn.style.width = '100%';
                    saveAvatarsBtn.textContent = t('admin_save_avatars');
                    saveAvatarsBtn.addEventListener('click', saveAvatarsToSheet);
                    const adminControlsDiv = document.getElementById('admin-controls');
                    if (adminControlsDiv) adminControlsDiv.appendChild(saveAvatarsBtn);
                }

                // ========== КНОПКИ ЭКСПОРТА/ИМПОРТА (без дублирования) ==========
                let exportImportContainer = document.getElementById('export-import-container');
                if (!exportImportContainer) {
                    exportImportContainer = document.createElement('div');
                    exportImportContainer.id = 'export-import-container';
                    exportImportContainer.style.display = 'flex';
                    exportImportContainer.style.gap = '10px';
                    exportImportContainer.style.marginTop = '10px';

                    const exportDataBtn = document.createElement('button');
                    exportDataBtn.id = 'export-data-btn';
                    exportDataBtn.className = 'btn-secondary';
                    exportDataBtn.style.flex = '1';
                    exportDataBtn.textContent = '📥 ЭКСПОРТ ДАННЫХ';
                    exportDataBtn.addEventListener('click', exportAllData);

                    const importDataBtn = document.createElement('button');
                    importDataBtn.id = 'import-data-btn';
                    importDataBtn.className = 'btn-secondary';
                    importDataBtn.style.flex = '1';
                    importDataBtn.textContent = '📤 ИМПОРТ ДАННЫХ';
                    importDataBtn.addEventListener('click', importAllData);

                    exportImportContainer.appendChild(exportDataBtn);
                    exportImportContainer.appendChild(importDataBtn);

                    const adminControlsDiv = document.getElementById('admin-controls');
                    if (adminControlsDiv) {
                        const fullResetBtnElement = document.getElementById('full-reset-btn');
                        if (fullResetBtnElement) {
                            adminControlsDiv.insertBefore(exportImportContainer, fullResetBtnElement);
                        } else {
                            adminControlsDiv.appendChild(exportImportContainer);
                        }
                    }
                } else {
                    exportImportContainer.style.display = 'flex';
                }
                // =================================================

                // Управление MVP (без дублирования)
                let mvpBtn = document.getElementById('manage-mvp-btn');
                if (!mvpBtn) {
                    mvpBtn = document.createElement('button');
                    mvpBtn.id = 'manage-mvp-btn';
                    mvpBtn.className = 'btn-primary';
                    mvpBtn.style.marginTop = '1rem';
                    mvpBtn.style.width = '100%';
                    mvpBtn.textContent = 'Управление MVP';
                    mvpBtn.addEventListener('click', openMVPManager);

                    const adminControlsDiv = document.getElementById('admin-controls');
                    if (adminControlsDiv) {
                        adminControlsDiv.appendChild(mvpBtn);
                    }
                } else {
                    // Если кнопка уже существует, перепривязываем обработчик
                    mvpBtn.addEventListener('click', openMVPManager);
                }

                const rulesModal = document.getElementById('rules-modal');
                const rulesAdminPanel = document.getElementById('rules-admin-panel');
                if (rulesModal && rulesModal.style.display === 'flex' && rulesAdminPanel) {
                    rulesAdminPanel.style.display = 'block';
                    if (typeof renderRulesAdminPanel === 'function') {
                        renderRulesAdminPanel();
                    }
                }

                // Обновляем кнопку экспорта в уже открытом модальном окне прогнозов
                const predictionModal = document.getElementById('prediction-modal');
                if (predictionModal && predictionModal.style.display === 'flex') {
                    ensureExportButton();
                    const exportBtn = document.getElementById('export-ranking-btn');
                    if (exportBtn) {
                        exportBtn.style.display = 'inline-flex';
                    }
                }

                showStatus('status_admin_activated', 'success');
                passInput.value = '';
                renderGroups();
                renderPlayoffs();
            } else {
                playSound('error');
                showStatus('status_wrong_password', 'error');
                passInput.value = '';
            }
        } catch (err) {
            console.error('Password check error:', err);
            playSound('error');
            showToast(t('error_saving_to_google'), 'error', t('error'));
            passInput.value = '';
        }
    });

    if (fullResetBtn) fullResetBtn.addEventListener('click', fullResetTournament);

    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {

            if (!isAdmin) {
                showStatus('status_admin_required', 'error');
                playSound('error');
                return;
            }

            showStatus('Сохранение всех данных...', 'success');

            const success = await saveAllDataToGoogle();

            if (success) {
                showStatus('status_tournament_saved', 'success');
                playSound('success');
            } else {
                showToast(t('error_saving_to_google'), 'error', t('error'));
                playSound('error');
            }
        });
    }

    const editScheduleBtn = document.getElementById('edit-schedule-btn');
    if (editScheduleBtn) {
        editScheduleBtn.addEventListener('click', () => {
            if (!isAdmin) {
                showStatus('status_auth_required', 'error');
                playSound('error');
                return;
            }
            const editor = document.getElementById('schedule-editor');
            if (editor) {
                fillScheduleEditor();
                editor.style.display = editor.style.display === 'none' ? 'block' : 'none';
                if (editor.style.display === 'block') {
                    initScheduleTracking();
                }
            }
        });
    }

    const saveScheduleBtn = document.getElementById('save-schedule');
    if (saveScheduleBtn) {
        saveScheduleBtn.addEventListener('click', async () => {

            if (!isAdmin) {
                showStatus('status_admin_required', 'error');
                playSound('error');
                return;
            }

            const periodStart = document.getElementById('edit-period-start')?.value || '';
            const periodEnd = document.getElementById('edit-period-end')?.value || '';
            const qfStart = document.getElementById('edit-qf-start')?.value || '';
            const qfEnd = document.getElementById('edit-qf-end')?.value || '';
            const sfStart = document.getElementById('edit-sf-start')?.value || '';
            const sfEnd = document.getElementById('edit-sf-end')?.value || '';
            const final = document.getElementById('edit-final')?.value || '';
            const prizePoolValue = document.getElementById('edit-prize-pool')?.value || '';

            const scheduleDataToSave = {
                period: { start: periodStart, end: periodEnd },
                qf: { start: qfStart, end: qfEnd },
                sf: { start: sfStart, end: sfEnd },
                final: final,
                prizePool: prizePoolValue
            };

            console.log('Schedule data to save:', scheduleDataToSave);
            showStatus('status_saving_schedule', 'success');

            try {
                const response = await fetch(SCRIPT_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        action: 'schedule',
                        data: JSON.stringify(scheduleDataToSave)
                    }).toString()
                });

                const result = await response.json();
                console.log('Schedule save result:', result);

                if (result.success) {
                    playSound('success');
                    showStatus('status_schedule_saved', 'success');

                    scheduleData.qfStart = qfStart;
                    scheduleData.qfEnd = qfEnd;
                    scheduleData.sfStart = sfStart;
                    scheduleData.sfEnd = sfEnd;
                    scheduleData.final = final;
                    scheduleData.prizePool = prizePoolValue;
                    scheduleData.periodStart = periodStart;
                    scheduleData.periodEnd = periodEnd;

                    document.getElementById('qf-period-start').textContent = formatDateOnly(qfStart);
                    document.getElementById('qf-period-end').textContent = formatDateOnly(qfEnd);
                    document.getElementById('sf-period-start').textContent = formatDateOnly(sfStart);
                    document.getElementById('sf-period-end').textContent = formatDateOnly(sfEnd);
                    document.getElementById('final-datetime').textContent = formatDateTimeFull(final);
                    document.getElementById('tournament-period-start').textContent = formatDateOnly(periodStart);
                    document.getElementById('tournament-period-end').textContent = formatDateOnly(periodEnd);
                    document.getElementById('prize-pool').textContent = prizePoolValue || '—';

                    startCountdownTimer();
                    checkPastDates();
                    updateGroupStageAnimation();

                    saveOriginalSchedule();
                    updateScheduleButtonColor();

                    const editor = document.getElementById('schedule-editor');
                    if (editor) editor.style.display = 'none';
                } else {
                    showToast(t('error_saving_to_google'), 'error', t('error'));
                    playSound('error');
                }
            } catch (e) {
                console.error('Schedule save error:', e);
                showToast(t('error_saving_to_google'), 'error', t('error'));
                playSound('error');
            }
        });
    }

    const savePrizesBtn = document.getElementById('save-prizes');
    if (savePrizesBtn) {
        savePrizesBtn.addEventListener('click', savePrizes);
    }

    const exitBtn = document.getElementById('admin-exit-btn');
    if (exitBtn) {
        exitBtn.removeEventListener('click', exitAdminMode);
        exitBtn.addEventListener('click', exitAdminMode);
    }
}

// ==================== ЗАПУСК ====================
async function start() {
    const savedLang = localStorage.getItem('tournament_lang');
    if (savedLang && (savedLang === 'ru' || savedLang === 'en')) {
        currentLang = savedLang;
    }
    
    const langBtn = document.getElementById('lang-switch-btn');
    if (langBtn) {
        langBtn.textContent = currentLang === 'ru' ? 'EN' : 'RU';
        langBtn.addEventListener('click', () => {
            const newLang = currentLang === 'ru' ? 'en' : 'ru';
            setLanguage(newLang);
        });
    }
    
    updateAllTexts();
    
    // ========== ОПТИМИЗИРОВАННАЯ ЗАГРУЗКА ==========
    // Загружаем ВСЕ данные параллельно для ускорения
    showPageLoader();
    
    try {
        // Запускаем оба запроса параллельно
        const [scheduleResult, allDataResult] = await Promise.allSettled([
            loadSchedule(),
            loadAllDataWithCache()
        ]);
        
        if (scheduleResult.status === 'rejected') {
            console.warn('Schedule loading failed:', scheduleResult.reason);
        }
        
        if (allDataResult.status === 'rejected') {
            console.error('All data loading failed:', allDataResult.reason);
            showStatus('Ошибка загрузки данных. Обновите страницу.', 'error');
        }
    } catch (error) {
        console.error('Startup error:', error);
        showStatus('Ошибка загрузки. Проверьте соединение.', 'error');
    } finally {
        // Скрываем лоадер через небольшую задержку, чтобы UI успел отрисоваться
        setTimeout(() => {
            hidePageLoader();
        }, 500);
    }
    
    updateDrawSectionVisibility();
    updateGroupStageAnimation();
    updatePlayoffAnimation();
    
    const btnA1 = document.getElementById('draw-group-a1');
    const btnB1 = document.getElementById('draw-group-b1');
    const btnA2 = document.getElementById('draw-group-a2');
    const btnB2 = document.getElementById('draw-group-b2');
    if (btnA1) btnA1.addEventListener('click', () => performDrawToGroup('A', 1));
    if (btnB1) btnB1.addEventListener('click', () => performDrawToGroup('B', 2));
    if (btnA2) btnA2.addEventListener('click', () => performDrawToGroup('A', 3));
    if (btnB2) btnB2.addEventListener('click', () => performDrawToGroup('B', 4));
    
    const saveDrawBtn = document.getElementById('save-draw');
    if (saveDrawBtn) saveDrawBtn.addEventListener('click', saveDrawToSheet);
    
    const clearTeamsBtn = document.getElementById('clear-teams');
    if (clearTeamsBtn) clearTeamsBtn.addEventListener('click', clearAllTeams);
    
    const forceRefreshBtn = document.getElementById('force-refresh');
    if (forceRefreshBtn) forceRefreshBtn.addEventListener('click', () => {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem('prediction_cache');
        location.reload();
    });
    
    for (let i = 1; i <= 8; i++) {
        const input = document.getElementById(`team${i}`);
        if (input) {
            input.addEventListener('input', checkTeamsAndUpdateButtons);
            input.addEventListener('change', checkTeamsAndUpdateButtons);
        }
    }
    
    initAdmin();
    initScheduleTracking();
    initPrizesTracking();
    updateDrawButtons();
    updateDrawStatus();
    startCountdownTimer();
    initRulesModal();
    initTrophyModal();
    initPredictionModal();
    initRankingsSearch();
    initArenaRace();
    initFundSupport();
    // Авто-обновление только для зрителей
    if (!isAdmin) {
        initAutoRefresh();
    }

    // Загружаем составы команд
    const rosters = await loadTeamRosters();
    if (rosters) {
        window._rosters = rosters;
        updateTournamentDataWithMVP(rosters);
        // Принудительно перерисовываем таблицы после загрузки
        renderGroups();
        renderPlayoffs();
    }    

    // Кнопка кубка 2026
    const trophy2026Close = document.querySelector('.trophy2026-modal-close');
    if (trophy2026Close) {
        trophy2026Close.addEventListener('click', closeTrophy2026Modal);
    }
    
    // Добавляем закрытие по Escape
    document.addEventListener('keydown', (e) => {
        const modal2026 = document.getElementById('trophy2026-modal');
        if (e.key === 'Escape' && modal2026 && modal2026.style.display === 'flex') {
            closeTrophy2026Modal();
        }
    });    

    // Периодическое обновление статусов прогнозов (каждые 10 секунд)
    setInterval(() => {
        const predictionModal = document.getElementById('prediction-modal');
        if (predictionModal && predictionModal.style.display === 'flex') {
            updatePredictionStagesStatus();
            updatePredictionStagesStatusUI();
        }
    }, 10000);
    
    // Фоновая загрузка прогнозов (только для зрителей) с задержкой
    if (!isAdmin) {
        setTimeout(() => {
            backgroundLoadAllPredictions();
        }, 3000);
    }
    
    document.body.addEventListener('click', () => { 
        if (audioContext?.state === 'suspended') audioContext.resume(); 
    }, { once: true });
}

// ==================== УПРАВЛЕНИЕ ИНТЕРВАЛАМИ ====================
// Глобальное хранилище всех интервалов для очистки
const activeIntervals = {
    timer: null,
    fabAnimation: null,
    arenaIcon: null,
    arenaRace: null,
    arenaRaceTimer: null,
    predictionStatus: null,
    utcTime: null
};

function clearAllIntervals() {
    if (activeIntervals.timer) {
        clearInterval(activeIntervals.timer);
        activeIntervals.timer = null;
    }
    if (activeIntervals.fabAnimation) {
        clearInterval(activeIntervals.fabAnimation);
        activeIntervals.fabAnimation = null;
    }
    if (activeIntervals.arenaIcon) {
        clearInterval(activeIntervals.arenaIcon);
        activeIntervals.arenaIcon = null;
    }
    if (activeIntervals.arenaRace) {
        clearInterval(activeIntervals.arenaRace);
        activeIntervals.arenaRace = null;
    }
    if (activeIntervals.arenaRaceTimer) {
        clearInterval(activeIntervals.arenaRaceTimer);
        activeIntervals.arenaRaceTimer = null;
    }
    if (activeIntervals.predictionStatus) {
        clearInterval(activeIntervals.predictionStatus);
        activeIntervals.predictionStatus = null;
    }
    if (activeIntervals.utcTime) {
        clearInterval(activeIntervals.utcTime);
        activeIntervals.utcTime = null;
    }
}

// Обновлённая функция startCountdownTimer с сохранением интервала
const originalStartCountdownTimer = startCountdownTimer;
window.startCountdownTimer = function() {
    // Очищаем старый интервал если есть
    if (activeIntervals.timer) {
        clearInterval(activeIntervals.timer);
        activeIntervals.timer = null;
    }
    
    const timerDiv = document.getElementById('countdown-timer');
    const timerSpan = document.getElementById('next-match-timer');
    if (!timerDiv || !timerSpan) return;

    function parseDate(dateStr) {
        if (!dateStr || dateStr === '—') return null;
        let dateTimeStr = dateStr;
        if (dateTimeStr.length === 16) {
            dateTimeStr = dateTimeStr + ':00';
        }
        const d = new Date(dateTimeStr + 'Z');
        return isNaN(d.getTime()) ? null : d;
    }

    function getNextMatchInfo() {
        const nowUTC = new Date();
        let nextMatch = null, nextDate = null;
        
        const qfDate = parseDate(scheduleData.qfStart);
        if (qfDate && qfDate > nowUTC && (!nextDate || qfDate < nextDate)) {
            nextDate = qfDate;
            nextMatch = { name: t('group_stage'), date: qfDate };
        }
        
        const sfDate = parseDate(scheduleData.sfStart);
        if (sfDate && sfDate > nowUTC && (!nextDate || sfDate < nextDate)) {
            nextDate = sfDate;
            nextMatch = { name: t('playoffs'), date: sfDate };
        }
        
        const finalDate = parseDate(scheduleData.final);
        if (finalDate && finalDate > nowUTC && (!nextDate || finalDate < nextDate)) {
            nextDate = finalDate;
            nextMatch = { name: t('grand_final'), date: finalDate };
        }
        
        return nextMatch;
    }

    function updateTimer() {
        const nextMatch = getNextMatchInfo();
        if (!nextMatch) {
            timerDiv.style.display = 'none';
            return;
        }

        const nowUTC = new Date();
        const diff = nextMatch.date - nowUTC;

        let matchName = nextMatch.name.replace(/:$/, '');

        if (diff <= 0) {
            timerSpan.textContent = matchName + ' — ' + t('on_air');
            timerDiv.style.display = 'flex';
            return;
        }

        const days = Math.floor(diff / 86400000);
        const hours = Math.floor((diff % 86400000) / 3600000);
        const minutes = Math.floor((diff % 3600000) / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);

        let timerText = '';
        if (days > 0) timerText += days + 'д ';
        if (hours > 0 || days > 0) timerText += hours + 'ч ';
        timerText += minutes + 'м ' + seconds + 'с';

        timerSpan.textContent = matchName + ': ' + timerText;
        timerDiv.style.display = 'flex';
    }
    
    updateTimer();
    updateGroupStageAnimation();
    
    // Сохраняем интервал
    activeIntervals.timer = setInterval(updateTimer, 1000);
};

// Обновлённая функция startFabWaitingAnimation
const originalStartFabWaitingAnimation = startFabWaitingAnimation;
window.startFabWaitingAnimation = function() {
    const fab = document.getElementById('prediction-fab');
    if (!fab) return;

    if (activeIntervals.fabAnimation) {
        clearInterval(activeIntervals.fabAnimation);
        activeIntervals.fabAnimation = null;
    }

    activeIntervals.fabAnimation = setInterval(() => {
        fab.classList.add('waiting');
        setTimeout(() => {
            fab.classList.remove('waiting');
        }, 500);
    }, 10000);
};

// Обновлённая функция startArenaIconWaitingAnimation
const originalStartArenaIconWaitingAnimation = startArenaIconWaitingAnimation;
window.startArenaIconWaitingAnimation = function() {
    if (activeIntervals.arenaIcon) {
        clearInterval(activeIntervals.arenaIcon);
        activeIntervals.arenaIcon = null;
    }
    
    function tryStart() {
        const icon = document.querySelector('.prediction-vote-icon');
        if (!icon) {
            setTimeout(tryStart, 200);
            return;
        }
        
        activeIntervals.arenaIcon = setInterval(() => {
            const currentIcon = document.querySelector('.prediction-vote-icon');
            if (currentIcon) {
                currentIcon.classList.add('waiting');
                setTimeout(() => {
                    if (currentIcon) currentIcon.classList.remove('waiting');
                }, 500);
            }
        }, 10000);
    }
    
    tryStart();
};

// Обновлённая функция initArenaRace с сохранением интервалов
const originalInitArenaRace = initArenaRace;
window.initArenaRace = async function() {
    arenaRaceData = await fetchArenaRaceData();

    if (arenaRaceData && Object.keys(arenaRaceData).length > 0) {
        renderArenaRaceBars(arenaRaceData);
        setArenaRaceVisibility(true);
        animateArenaRace();

        if (activeIntervals.arenaRace) {
            clearInterval(activeIntervals.arenaRace);
            activeIntervals.arenaRace = null;
        }
        
        activeIntervals.arenaRace = setInterval(() => {
            runArenaRace();
        }, 90000);
    } else {
        setArenaRaceVisibility(false);
    }
    
    initArenaRaceToggle();
};

// Функция для остановки всех интервалов (вызывается при выходе из админ-режима)
function stopAllTimers() {
    clearAllIntervals();
    
    // Останавливаем также глобальные переменные, которые могли быть созданы
    if (window.timerInterval) {
        clearInterval(window.timerInterval);
        window.timerInterval = null;
    }
    if (window.fabAnimationInterval) {
        clearInterval(window.fabAnimationInterval);
        window.fabAnimationInterval = null;
    }
    if (window.arenaIconAnimationInterval) {
        clearInterval(window.arenaIconAnimationInterval);
        window.arenaIconAnimationInterval = null;
    }
    if (window.arenaRaceInterval) {
        clearInterval(window.arenaRaceInterval);
        window.arenaRaceInterval = null;
    }
    if (window.arenaRaceAnimationTimer) {
        clearInterval(window.arenaRaceAnimationTimer);
        window.arenaRaceAnimationTimer = null;
    }
    
}

// ==================== ИНДИКАТОР ЗАГРУЗКИ СТРАНИЦЫ ====================

let loaderCounter = 0;

function showPageLoader(progress = null) {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loaderCounter++;
        loader.classList.remove('hide');

        // Показываем прогресс-бар всегда
        const progressContainer = document.getElementById('page-loader-progress');
        const progressBar = document.getElementById('page-loader-progress-bar');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        if (progressBar && progress !== null) {
            progressBar.style.width = Math.min(progress, 100) + '%';
        } else if (progressBar) {
            progressBar.style.width = '0%';
        }
    }
}

function hidePageLoader() {
    const loader = document.getElementById('page-loader');
    if (loader) {
        loaderCounter--;
        if (loaderCounter <= 0) {
            loaderCounter = 0;
            loader.style.transition = 'opacity 0.5s ease, visibility 0.5s ease';
            loader.classList.add('hide');
            // Сбрасываем прогресс
            const progressBar = document.getElementById('page-loader-progress-bar');
            if (progressBar) progressBar.style.width = '0%';
            const progressContainer = document.getElementById('page-loader-progress');
            if (progressContainer) progressContainer.style.display = 'block';
        }
    }
}

function updateLoaderProgress(percent, text = null) {
    const progressBar = document.getElementById('page-loader-progress-bar');
    const progressContainer = document.getElementById('page-loader-progress');
    const textEl = document.getElementById('page-loader-text');

    if (progressContainer) {
        progressContainer.style.display = 'block';
    }
    if (progressBar) {
        progressBar.style.width = Math.min(percent, 100) + '%';
    }
    if (textEl && text) {
        textEl.textContent = text;
    }
}

// Показываем индикатор при загрузке страницы
showPageLoader();

// Скрываем после полной загрузки всех данных
window.addEventListener('load', function() {
    // Ждём загрузки всех данных
    setTimeout(() => {
        hidePageLoader();
    }, 500);
});

// При ошибке загрузки (таймаут 15 секунд)
setTimeout(() => {
    const loader = document.getElementById('page-loader');
    if (loader && !loader.classList.contains('hide')) {
        loader.classList.add('hide');
        loaderCounter = 0;
    }
}, 15000);

function showAdminBlock() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.style.display = 'block';
        const notification = document.createElement('div');
        notification.className = 'admin-notification';
        notification.innerHTML = t('admin_notification');
        document.body.appendChild(notification);
        setTimeout(() => {
            if (notification.parentNode) notification.remove();
        }, 3000);
        adminPanel.scrollIntoView({ behavior: 'smooth' });
    }
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyA') {
        e.preventDefault();
        showAdminBlock();
    }
});

function exitAdminMode() {
    if (!isAdmin) return;
    performExitActions();
}

function performExitActions() {
    playSound('click');
    stopAllTimers();
    isAdmin = false;

    try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem('prediction_cache');
        localStorage.removeItem(TEAM_ROSTERS_CACHE_KEY);
        localStorage.removeItem(RULES_CACHE_KEY);
        localStorage.removeItem('last_update_hash');
        console.log('All caches cleared on admin exit');
    } catch(e) {
        console.warn('Failed to clear cache:', e);
    }

    const body = document.body;
    body.classList.remove('admin-mode');
    body.classList.add('viewer-mode');

    const editScheduleBtn = document.getElementById('edit-schedule-btn');
    if (editScheduleBtn) editScheduleBtn.style.display = 'none';

    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) adminPanel.style.display = 'none';

    const adminControls = document.getElementById('admin-controls');
    if (adminControls) adminControls.style.display = 'none';

    renderGroups();
    renderPlayoffs();
    updateDrawButtons();

    startCountdownTimer();
    startFabWaitingAnimation();

    initAutoRefresh();

    showStatus('status_exit_admin', 'success');
}

function updateUTCTime() {
    const utcElement = document.getElementById('utc-time');
    const utcHeaderElement = document.getElementById('utc-time-header');
    
    const now = new Date();
    const day = String(now.getUTCDate()).padStart(2, '0');
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const year = now.getUTCFullYear();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    
    const timeString = `UTC: ${day}.${month}.${year} ${hours}:${minutes}`;
    
    if (utcElement) utcElement.innerHTML = timeString;
    if (utcHeaderElement) utcHeaderElement.innerHTML = timeString;
}

// ==================== РЕГЛАМЕНТ (МОДАЛЬНОЕ ОКНО) ====================

let rulesData = [];

async function loadRules(forceRefresh = false) {
    // Если не админ и не принудительное обновление - проверяем кеш
    if (!isAdmin && !forceRefresh) {
        try {
            const cached = localStorage.getItem(RULES_CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                if (data && data.timestamp && data.data) {
                    // Проверяем, не истекло ли время
                    if ((Date.now() - data.timestamp) < RULES_CACHE_DURATION) {
                        console.log('Rules loaded from cache');
                        rulesData = data.data;
                        renderRulesModal();
                        return;
                    }
                }
            }
        } catch (e) {
            console.warn('Error reading rules cache:', e);
        }
    }

    // Загружаем с сервера
    try {
        console.log('Loading rules from server...');
        const response = await fetch(`${SCRIPT_URL}?action=getRules`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.rules) {
            rulesData = data.rules;
            
            // Сохраняем в кеш (только для зрителей)
            if (!isAdmin) {
                try {
                    localStorage.setItem(RULES_CACHE_KEY, JSON.stringify({
                        timestamp: Date.now(),
                        data: data.rules
                    }));
                    console.log('Rules saved to cache');
                } catch (e) {
                    console.warn('Error saving rules to cache:', e);
                }
            }
            
            renderRulesModal();
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        console.error('Load rules error:', error);
        
        // Если есть кеш даже просроченный - используем как fallback
        try {
            const fallbackCache = localStorage.getItem(RULES_CACHE_KEY);
            if (fallbackCache) {
                const data = JSON.parse(fallbackCache);
                if (data && data.data) {
                    console.log('Using expired cache as fallback');
                    rulesData = data.data;
                    renderRulesModal();
                    return;
                }
            }
        } catch (fallbackError) {
            // Игнорируем
        }
        
        const modalBody = document.getElementById('rules-modal-body');
        if (modalBody) {
            modalBody.innerHTML = `<div style="text-align: center; padding: 2rem; color: #888888;">${t('rules_load_error')}</div>`;
        }
    }
}

function renderRulesModal() {
    const container = document.getElementById('rules-modal-body');
    if (!container) return;
    
    if (!rulesData || rulesData.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 2rem; color: #888888;">${t('empty_rules')}</div>`;
        return;
    }
    
    if (isAdmin) {
        renderRulesAdminPanel();
    } else {
        renderRulesViewer();
    }
}

function renderRulesViewer() {
    const container = document.getElementById('rules-modal-body');
    if (!container) return;
    
    let html = '';
    for (let i = 0; i < rulesData.length; i++) {
        const section = rulesData[i];
        const sectionId = `rules-section-${i}`;
        
        // Преобразуем переносы строк в <br> или <p>
        let content = section.content || '';
        // Если контент не содержит HTML-тегов, преобразуем переносы строк
        if (!content.includes('<') && content.includes('\n')) {
            // Разбиваем на абзацы по двойным переносам
            const paragraphs = content.split(/\n\s*\n/);
            content = paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
        } else {
            // Если есть HTML, просто заменяем переносы на <br>
            content = content.replace(/\n/g, '<br>');
        }
        
        html += `
            <div class="rules-section" id="${sectionId}">
                <h3 onclick="window.toggleRulesSection('${sectionId}')">
                    ${escapeHtml(section.title)}
                    <span class="toggle-icon">▼</span>
                </h3>
                <div class="rules-content">
                    ${content || `<p>${t('empty_content')}</p>`}
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    if (rulesData.length > 0) {
        const firstSection = document.getElementById('rules-section-0');
        if (firstSection) {
            firstSection.classList.add('open');
        }
    }
}

function renderRulesAdminPanel() {
    const container = document.getElementById('rules-modal-body');
    if (!container) return;
    
    if (!rulesData || rulesData.length === 0) {
        container.innerHTML = `<div style="text-align: center; padding: 1rem; color: #888888;">${t('rules_empty_sections')}</div>`;
        return;
    }
    
    let html = '';
    for (let i = 0; i < rulesData.length; i++) {
        const section = rulesData[i];
        // Сохраняем оригинальный контент с переносами строк для редактирования
        const contentForEdit = section.content || '';
        
        html += `
            <div class="rules-admin-section" data-order="${section.order}">
                <div class="rules-admin-header">
                    <div class="rules-admin-title">
                        <input type="text" class="rules-title-input" value="${escapeHtml(section.title)}" placeholder="${t('new_section_default')}">
                    </div>
                    <div class="rules-admin-actions">
                        <button class="btn-primary move-up" ${i === 0 ? 'disabled' : ''} title="Вверх">↑</button>
                        <button class="btn-primary move-down" ${i === rulesData.length - 1 ? 'disabled' : ''} title="Вниз">↓</button>
                        <button class="btn-danger delete-section" title="Удалить">🗑️</button>
                    </div>
                </div>
                <div class="rules-editor-toolbar">
                    <button type="button" class="format-bold" data-section="${section.order}" title="Жирный"><strong>B</strong></button>
                    <button type="button" class="format-italic" data-section="${section.order}" title="Курсив"><em>I</em></button>
                    <button type="button" class="format-strike" data-section="${section.order}" title="Зачёркнутый"><s>S</s></button>
                    <button type="button" class="format-color-gold" data-section="${section.order}" title="Золотой" style="color:#ccaa66;">🟡</button>
                    <button type="button" class="format-color-red" data-section="${section.order}" title="Красный" style="color:#cc3333;">🔴</button>
                    <button type="button" class="format-color-green" data-section="${section.order}" title="Зелёный" style="color:#6aaf6a;">🟢</button>
                    <button type="button" class="format-link" data-section="${section.order}" title="Добавить ссылку">🔗</button>
                    <button type="button" class="format-clear" data-section="${section.order}" title="Очистить форматирование">✖</button>
                </div>
                <div class="rules-admin-content">
                    <textarea class="rules-content-input" id="rules-content-${section.order}" placeholder="${t('new_content_default')}">${contentForEdit}</textarea>
                </div>
            </div>
        `;
    }
    
    container.innerHTML = html;
    
    document.querySelectorAll('#rules-modal-body .move-up').forEach(btn => {
        btn.removeEventListener('click', handleMoveUp);
        btn.addEventListener('click', handleMoveUp);
    });
    
    document.querySelectorAll('#rules-modal-body .move-down').forEach(btn => {
        btn.removeEventListener('click', handleMoveDown);
        btn.addEventListener('click', handleMoveDown);
    });
    
    document.querySelectorAll('#rules-modal-body .delete-section').forEach(btn => {
        btn.removeEventListener('click', handleDeleteSection);
        btn.addEventListener('click', handleDeleteSection);
    });
    
    attachFormattingHandlers();
}

function attachFormattingHandlers() {
    document.querySelectorAll('.format-bold').forEach(btn => {
        btn.removeEventListener('click', handleFormatBold);
        btn.addEventListener('click', handleFormatBold);
    });
    
    document.querySelectorAll('.format-italic').forEach(btn => {
        btn.removeEventListener('click', handleFormatItalic);
        btn.addEventListener('click', handleFormatItalic);
    });
    
    document.querySelectorAll('.format-strike').forEach(btn => {
        btn.removeEventListener('click', handleFormatStrike);
        btn.addEventListener('click', handleFormatStrike);
    });
    
    document.querySelectorAll('.format-color-gold').forEach(btn => {
        btn.removeEventListener('click', handleFormatColorGold);
        btn.addEventListener('click', handleFormatColorGold);
    });
    
    document.querySelectorAll('.format-color-red').forEach(btn => {
        btn.removeEventListener('click', handleFormatColorRed);
        btn.addEventListener('click', handleFormatColorRed);
    });
    
    document.querySelectorAll('.format-color-green').forEach(btn => {
        btn.removeEventListener('click', handleFormatColorGreen);
        btn.addEventListener('click', handleFormatColorGreen);
    });
    
    document.querySelectorAll('.format-link').forEach(btn => {
        btn.removeEventListener('click', handleFormatLink);
        btn.addEventListener('click', handleFormatLink);
    });
    
    document.querySelectorAll('.format-clear').forEach(btn => {
        btn.removeEventListener('click', handleFormatClear);
        btn.addEventListener('click', handleFormatClear);
    });
}

function getSelectedTextarea(sectionOrder) {
    return document.getElementById(`rules-content-${sectionOrder}`);
}

function wrapSelectedText(textarea, before, after) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (selectedText) {
        const newText = textarea.value.substring(0, start) + before + selectedText + after + textarea.value.substring(end);
        textarea.value = newText;
        textarea.selectionStart = start;
        textarea.selectionEnd = end + before.length + after.length;
        textarea.focus();
    }
}

function handleFormatBold(e) {
    const sectionOrder = e.currentTarget.dataset.section;
    const textarea = getSelectedTextarea(sectionOrder);
    if (textarea) {
        wrapSelectedText(textarea, '<strong>', '</strong>');
    }
}

function handleFormatItalic(e) {
    const sectionOrder = e.currentTarget.dataset.section;
    const textarea = getSelectedTextarea(sectionOrder);
    if (textarea) {
        wrapSelectedText(textarea, '<em>', '</em>');
    }
}

function handleFormatStrike(e) {
    const sectionOrder = e.currentTarget.dataset.section;
    const textarea = getSelectedTextarea(sectionOrder);
    if (textarea) {
        wrapSelectedText(textarea, '<s>', '</s>');
    }
}

function handleFormatColorGold(e) {
    const sectionOrder = e.currentTarget.dataset.section;
    const textarea = getSelectedTextarea(sectionOrder);
    if (textarea) {
        wrapSelectedText(textarea, '<span style="color: #ccaa66;">', '</span>');
    }
}

function handleFormatColorRed(e) {
    const sectionOrder = e.currentTarget.dataset.section;
    const textarea = getSelectedTextarea(sectionOrder);
    if (textarea) {
        wrapSelectedText(textarea, '<span style="color: #cc3333;">', '</span>');
    }
}

function handleFormatColorGreen(e) {
    const sectionOrder = e.currentTarget.dataset.section;
    const textarea = getSelectedTextarea(sectionOrder);
    if (textarea) {
        wrapSelectedText(textarea, '<span style="color: #6aaf6a;">', '</span>');
    }
}

function handleFormatLink(e) {
    const sectionOrder = e.currentTarget.dataset.section;
    const textarea = getSelectedTextarea(sectionOrder);
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        
        let url = prompt('Введите URL ссылки:', 'https://');
        if (url && url.trim() !== '') {
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                url = 'https://' + url;
            }
            
            let linkHtml = '';
            if (selectedText) {
                linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${selectedText}</a>`;
            } else {
                linkHtml = `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
            }
            
            const newText = textarea.value.substring(0, start) + linkHtml + textarea.value.substring(end);
            textarea.value = newText;
            textarea.focus();
        }
    }
}

function handleFormatClear(e) {
    const sectionOrder = e.currentTarget.dataset.section;
    const textarea = getSelectedTextarea(sectionOrder);
    if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        let selectedText = textarea.value.substring(start, end);
        
        selectedText = selectedText.replace(/<[^>]*>/g, '');
        
        const newText = textarea.value.substring(0, start) + selectedText + textarea.value.substring(end);
        textarea.value = newText;
        textarea.selectionStart = start;
        textarea.selectionEnd = start + selectedText.length;
        textarea.focus();
    }
}

function handleMoveUp(e) {
    const sectionDiv = e.target.closest('.rules-admin-section');
    const order = parseInt(sectionDiv.dataset.order);
    const index = rulesData.findIndex(r => r.order === order);
    if (index > 0) {
        [rulesData[index - 1], rulesData[index]] = [rulesData[index], rulesData[index - 1]];
        rulesData.forEach((r, idx) => r.order = idx + 1);
        renderRulesAdminPanel();
    }
}

function handleMoveDown(e) {
    const sectionDiv = e.target.closest('.rules-admin-section');
    const order = parseInt(sectionDiv.dataset.order);
    const index = rulesData.findIndex(r => r.order === order);
    if (index < rulesData.length - 1) {
        [rulesData[index + 1], rulesData[index]] = [rulesData[index], rulesData[index + 1]];
        rulesData.forEach((r, idx) => r.order = idx + 1);
        renderRulesAdminPanel();
    }
}

function handleDeleteSection(e) {
    if (confirm(t('confirm_delete_section'))) {
        const sectionDiv = e.target.closest('.rules-admin-section');
        const order = parseInt(sectionDiv.dataset.order);
        rulesData = rulesData.filter(r => r.order !== order);
        rulesData.forEach((r, idx) => r.order = idx + 1);
        renderRulesAdminPanel();
    }
}

function collectRulesFromAdmin() {
    const sections = document.querySelectorAll('#rules-modal-body .rules-admin-section');
    const newRules = [];
    sections.forEach((section, index) => {
        const titleInput = section.querySelector('.rules-title-input');
        const contentInput = section.querySelector('.rules-content-input');
        // Сохраняем текст как есть, с переносами строк
        const content = contentInput ? contentInput.value : '';
        newRules.push({
            order: index + 1,
            title: titleInput ? titleInput.value.trim() : t('new_section_default'),
            content: content 
        });
    });
    return newRules;
}

function addRulesSection() {
    const newOrder = rulesData.length + 1;
    rulesData.push({
        order: newOrder,
        title: t('new_section_default'),
        content: t('new_content_default')
    });
    renderRulesAdminPanel();
}

async function saveRulesToSheet() {
    const updatedRules = collectRulesFromAdmin();
    
    if (updatedRules.length === 0) {
        showRulesStatus(t('rules_save_empty_error'), 'error');
        return;
    }
    
    showRulesStatus(t('rules_saving'), 'success');
    
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                action: 'saveRules',
                data: JSON.stringify({ rules: updatedRules })
            }).toString()
        });
        
        const result = await response.json();
        
        if (result.success) {
            rulesData = updatedRules;
            renderRulesAdminPanel();
            showRulesStatus(t('rules_saved'), 'success');
            
            // ========== ОБНОВЛЯЕМ КЕШ РЕГЛАМЕНТА ПОСЛЕ СОХРАНЕНИЯ ==========
            // Сохраняем обновленный регламент в кеш (для зрителей)
            try {
                localStorage.setItem(RULES_CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    data: updatedRules
                }));
                console.log('Rules cache updated after save');
            } catch (e) {
                console.warn('Error updating rules cache:', e);
            }
        } else {
            showRulesStatus(t('status_error'), 'error');
        }
    } catch(e) {
        console.error('Save rules error:', e);
        showRulesStatus(t('status_error'), 'error');
    }
}

async function resetRulesToDefault() {
    if (confirm(t('confirm_reset_rules'))) {
        showRulesStatus(t('rules_resetting'), 'success');
        
        const defaultRules = [
            { order: 1, title: 'ОБЩИЕ ПОЛОЖЕНИЯ', content: '<p>Здесь будет текст общих положений турнира...</p>' },
            { order: 2, title: 'ПРАВИЛА ИГРЫ', content: '<p>Здесь будут правила игры...</p>' },
            { order: 3, title: 'СИСТЕМА НАБРАННЫХ ОЧКОВ', content: '<p>Здесь будет описание системы начисления очков...</p>' },
            { order: 4, title: 'РАСПИСАНИЕ МАТЧЕЙ', content: '<p>Здесь будет расписание матчей...</p>' },
            { order: 5, title: 'ПРИЗОВОЙ ФОНД', content: '<p>Здесь будет информация о призовом фонде...</p>' },
            { order: 6, title: 'ДИСКВАЛИФИКАЦИЯ И СПОРЫ', content: '<p>Здесь будут правила дисквалификации и разрешения споров...</p>' }
        ];
        
        try {
            const response = await fetch(SCRIPT_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'saveRules',
                    data: JSON.stringify({ rules: defaultRules })
                }).toString()
            });
            
            const result = await response.json();
            
            if (result.success) {
                rulesData = defaultRules;
                renderRulesAdminPanel();
                showRulesStatus(t('rules_reset_done'), 'success');
                
                // ========== ОБНОВЛЯЕМ КЕШ РЕГЛАМЕНТА ПОСЛЕ СБРОСА ==========
                try {
                    localStorage.setItem(RULES_CACHE_KEY, JSON.stringify({
                        timestamp: Date.now(),
                        data: defaultRules
                    }));
                    console.log('Rules cache updated after reset');
                } catch (e) {
                    console.warn('Error updating rules cache:', e);
                }
            } else {
                showRulesStatus(t('status_error'), 'error');
            }
        } catch(e) {
            console.error('Reset rules error:', e);
            showRulesStatus(t('status_error'), 'error');
        }
    }
}

function showRulesStatus(msg, type) {
    const statusDiv = document.getElementById('rules-status');
    if (!statusDiv) return;
    statusDiv.textContent = msg;
    statusDiv.className = `rules-status ${type}`;
    setTimeout(() => {
        statusDiv.style.display = 'none';
    }, 3000);
}

window.toggleRulesSection = function(sectionId) {
    if (isAdmin) return;
    const section = document.getElementById(sectionId);
    if (section) {
        section.classList.toggle('open');
    }
}

function openRulesModal() {
    // Показываем лоадер с прогрессом
    showPageLoader();
    updateLoaderProgress(10, t('loading_rules'));

    const modal = document.getElementById('rules-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';

        const rulesAdminPanel = document.getElementById('rules-admin-panel');
        if (rulesAdminPanel) {
            rulesAdminPanel.style.display = isAdmin ? 'block' : 'none';
        }

        // Ждём загрузки регламента с прогрессом
        loadRules()
            .then(() => {
                updateLoaderProgress(100);
            })
            .catch(() => {
                updateLoaderProgress(100, 'Ошибка загрузки');
            })
            .finally(() => {
                setTimeout(() => {
                    hidePageLoader();
                }, 500);
            });
    } else {
        hidePageLoader();
    }
}

function closeRulesModal() {
    const modal = document.getElementById('rules-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

function initRulesModal() {
    const showBtn = document.getElementById('show-rules-btn');
    const closeBtn = document.querySelector('.rules-modal-close');
    const modal = document.getElementById('rules-modal');
    const addBtn = document.getElementById('add-rules-section');
    const saveBtn = document.getElementById('save-rules');
    const resetBtn = document.getElementById('reset-rules');
    
    if (showBtn) {
        showBtn.addEventListener('click', openRulesModal);
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeRulesModal);
    }
    
    if (addBtn) {
        addBtn.addEventListener('click', addRulesSection);
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', saveRulesToSheet);
    }
    
    if (resetBtn) {
        resetBtn.addEventListener('click', resetRulesToDefault);
    }
    
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeRulesModal();
            }
        });
    }
}

function updateTrophyModalContent() {
    const grandFinal = tournamentData.playoffs.grandFinal;
    const championName = grandFinal.winner;
    
    const championAvatarDiv = document.getElementById('trophy-champion-avatar');
    const championNameDiv = document.getElementById('trophy-champion-name');
    
    if (!championAvatarDiv || !championNameDiv) return;
    
    if (championName && championName !== '' && championName !== 'TBD') {
        const avatarUrl = window.teamAvatars ? window.teamAvatars[championName] : '';
        
        championAvatarDiv.innerHTML = '';
        
        const avatarImg = document.createElement('img');
        avatarImg.src = avatarUrl || '';
        avatarImg.alt = championName;
        avatarImg.className = 'team-avatar';
        if (!avatarUrl) {
            avatarImg.style.visibility = 'hidden';
        }
        avatarImg.onerror = function() {
            this.style.display = 'none';
        };
        championAvatarDiv.appendChild(avatarImg);
        
        championNameDiv.textContent = championName;
        championNameDiv.style.display = 'block';
        championNameDiv.style.textAlign = 'center';
        championNameDiv.style.width = '100%';
    } else {
        championAvatarDiv.innerHTML = '';
        championNameDiv.textContent = t('champion_text');
        championNameDiv.style.display = 'block';
        championNameDiv.style.textAlign = 'center';
        championNameDiv.style.width = '100%';
    }
}

function closeTrophyModal() {
    const modal = document.getElementById('trophy-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        
        // Очищаем Three.js ресурсы
        if (trophyRenderer) {
            trophyRenderer.dispose();
            trophyRenderer = null;
        }
        if (trophyScene) {
            trophyScene = null;
        }
        if (trophyControls) {
            trophyControls.dispose();
            trophyControls = null;
        }
        if (trophyModel) {
            trophyModel = null;
        }
    }
}

function initTrophyModal() {
    const modal = document.getElementById('trophy-modal');
    const closeBtn = document.querySelector('.trophy-modal-close');
    
    if (closeBtn) {
        closeBtn.addEventListener('click', closeTrophyModal);
    }
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            closeTrophyModal();
        }
    });
}

// ==================== КНОПКА КУБКА 2026 ====================

let trophy2026Scene = null;
let trophy2026Camera = null;
let trophy2026Renderer = null;
let trophy2026Model = null;
let trophy2026Controls = null;

// Флаг для предотвращения повторной загрузки Кубка 2026
let trophy2026LoadAttempted = false;
let trophy2026LoadSuccess = false;

async function initTrophy2026() {
    // Если уже загружено успешно, просто показываем
    if (trophy2026LoadSuccess && trophy2026Renderer) {
        return;
    }

    // Если уже была попытка загрузки и она не удалась, показываем fallback
    if (trophy2026LoadAttempted && !trophy2026LoadSuccess) {
        const container = document.getElementById('trophy2026-3d-container');
        if (container) {
            // Показываем fallback изображение вместо ошибки
            container.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;">
                    <img src="image/GUP.png" alt="Кубок 2026" style="max-width:80%;max-height:80%;object-fit:contain;filter:drop-shadow(0 0 30px rgba(204,170,102,0.3));">
                    <div style="color:#888888;font-size:0.8rem;margin-top:1rem;">Кубок 2026</div>
                </div>
            `;
        }
        return;
    }

    trophy2026LoadAttempted = true;

    const container = document.getElementById('trophy2026-3d-container');
    const loader = document.getElementById('trophy2026-loader');

    // Функция для плавного обновления прогресса внутри лоадера
    function updateTrophy2026Progress(percent) {
        const progressContainer = document.getElementById('trophy2026-loader-progress');
        const progressBar = document.getElementById('trophy2026-loader-progress-bar');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        if (progressBar) {
            const currentWidth = parseFloat(progressBar.style.width) || 0;
            const targetWidth = Math.min(percent, 100);
            const step = 1;
            const interval = 20;
            let current = currentWidth;
            
            if (current < targetWidth) {
                const timer = setInterval(() => {
                    current += step;
                    if (current >= targetWidth) {
                        current = targetWidth;
                        clearInterval(timer);
                    }
                    progressBar.style.width = current + '%';
                }, interval);
            } else {
                progressBar.style.width = targetWidth + '%';
            }
        }
    }

    if (!container) {
        return;
    }

    if (loader) {
        loader.classList.remove('hide');
        updateTrophy2026Progress(10);
    }

    // Очищаем контейнер, но сохраняем загрузчик
    const children = container.children;
    for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child !== loader) {
            container.removeChild(child);
        }
    }

    try {
        setTimeout(() => updateTrophy2026Progress(20), 300);

        const THREE = await import('three');
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

        setTimeout(() => updateTrophy2026Progress(35), 200);

        trophy2026Scene = new THREE.Scene();
        trophy2026Scene.background = null;

        const width = container.clientWidth;
        const height = container.clientHeight;
        trophy2026Camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        trophy2026Camera.position.set(0, 0.5, 3);
        trophy2026Camera.lookAt(0, 0.3, 0);

        trophy2026Renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "low-power",
            failIfMajorPerformanceCaveat: false
        });
        trophy2026Renderer.setSize(width, height);
        trophy2026Renderer.setClearColor(0x000000, 0);
        trophy2026Renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(trophy2026Renderer.domElement);

        setTimeout(() => updateTrophy2026Progress(50), 300);

        trophy2026Controls = new OrbitControls(trophy2026Camera, trophy2026Renderer.domElement);
        trophy2026Controls.enableDamping = true;
        trophy2026Controls.dampingFactor = 0.05;
        trophy2026Controls.enableZoom = true;
        trophy2026Controls.enablePan = false;
        trophy2026Controls.zoomSpeed = 1.0;
        trophy2026Controls.rotateSpeed = 1.0;
        trophy2026Controls.target.set(0, 0.3, 0);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        trophy2026Scene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(1, 2, 2);
        trophy2026Scene.add(mainLight);

        const rimLight = new THREE.PointLight(0xaaccff, 0.35);
        rimLight.position.set(0, 1, -2.5);
        trophy2026Scene.add(rimLight);

        const bottomLight = new THREE.PointLight(0xffffff, 0.35);
        bottomLight.position.set(0, -1, 0);
        trophy2026Scene.add(bottomLight);

        setTimeout(() => updateTrophy2026Progress(65), 300);

        const gltfLoader = new GLTFLoader();

        const loadModel = () => {
            return new Promise((resolve, reject) => {
                // Увеличиваем таймаут до 30 секунд
                const timeout = setTimeout(() => {
                    reject(new Error('3D model loading timeout (60s)'));
                }, 60000);

                setTimeout(() => updateTrophy2026Progress(75), 200);

                gltfLoader.loadAsync('https://static.wfolio.ru/file/AqiFFw_TXMM4LDwoI2TPSeEYv7M5masq/kdiGFy2hfRbDLZB4kMumXCFxp50BP_vR/Znlq5rC-YfFRn7rdN7ny1wUbQAZa0Ihy/w8zIXSDrKb90lCLMZSGNfXFXKjuBZATc/S4zm6POcf9y3Go2tu2Zk5CGu24f9n7jG/VYmIeCJ5VJQ.glb')
                    .then(gltf => {
                        clearTimeout(timeout);
                        updateTrophy2026Progress(90);
                        resolve(gltf);
                    })
                    .catch(err => {
                        clearTimeout(timeout);
                        reject(err);
                    });
            });
        };

        const gltf = await loadModel();
        trophy2026Model = gltf.scene;
        trophy2026Scene.add(trophy2026Model);

        setTimeout(() => updateTrophy2026Progress(95), 200);

        if (loader) {
            loader.classList.add('hide');
        }

        const box = new THREE.Box3().setFromObject(trophy2026Model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        trophy2026Model.position.x = -center.x;
        trophy2026Model.position.y = -center.y;
        trophy2026Model.position.z = -center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 1.8;
        const scale = targetSize / maxDim;
        trophy2026Model.scale.set(scale, scale, scale);

        const newBox = new THREE.Box3().setFromObject(trophy2026Model);
        const newCenter = newBox.getCenter(new THREE.Vector3());
        trophy2026Model.position.x -= newCenter.x;
        trophy2026Model.position.z -= newCenter.z;

        const newMinY = newBox.min.y;
        trophy2026Model.position.y -= newMinY;
        trophy2026Model.position.y -= 0.5;

        trophy2026Model.rotation.y = Math.PI;

        const rotatedBox = new THREE.Box3().setFromObject(trophy2026Model);
        const rotatedCenter = rotatedBox.getCenter(new THREE.Vector3());
        trophy2026Model.position.x -= rotatedCenter.x;
        trophy2026Model.position.z -= rotatedCenter.z;
        trophy2026Model.position.y = -0.5;

        trophy2026Controls.target.set(0, 0.3, 0);
        trophy2026Controls.update();

        trophy2026LoadSuccess = true;

        updateTrophy2026Progress(100);
        
        setTimeout(() => {
            const progressContainer = document.getElementById('trophy2026-loader-progress');
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }
        }, 600);

        function animate() {
            if (!trophy2026Renderer || !trophy2026Scene || !trophy2026Camera) return;
            requestAnimationFrame(animate);
            if (trophy2026Controls) {
                trophy2026Controls.update();
            }
            trophy2026Renderer.render(trophy2026Scene, trophy2026Camera);
        }
        animate();

        window.addEventListener('resize', () => {
            if (trophy2026Renderer && container) {
                const newWidth = container.clientWidth;
                const newHeight = container.clientHeight;
                trophy2026Renderer.setSize(newWidth, newHeight);
                trophy2026Camera.aspect = newWidth / newHeight;
                trophy2026Camera.updateProjectionMatrix();
            }
        });

    } catch (error) {
        console.error('Error loading trophy 2026:', error);
        trophy2026LoadSuccess = false;
        if (loader) {
            loader.classList.add('hide');
        }
        // Показываем fallback изображение вместо ошибки
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;">
                <img src="image/GUP.png" alt="Кубок 2026" style="max-width:80%;max-height:80%;object-fit:contain;filter:drop-shadow(0 0 30px rgba(204,170,102,0.3));">
                <div style="color:#888888;font-size:0.8rem;margin-top:1rem;">Кубок 2026</div>
            </div>
        `;
        return;
    }
}

// Открытие модального окна
window.openTrophy2026Modal = function() {
    const modal = document.getElementById('trophy2026-modal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        if (!trophy2026Renderer) {
            initTrophy2026();
        }
    }
};

window.closeTrophy2026Modal = function() {
    const modal = document.getElementById('trophy2026-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        if (trophy2026Renderer) {
            trophy2026Renderer.dispose();
            trophy2026Renderer = null;
        }
        trophy2026Scene = null;
        if (trophy2026Controls) {
            trophy2026Controls.dispose();
            trophy2026Controls = null;
        }
        trophy2026Model = null;
    }
};

// ==================== 3D ТРОФЕЙ ====================

let trophyScene = null;
let trophyCamera = null;
let trophyRenderer = null;
let trophyModel = null;
let trophyControls = null;

// Флаг для предотвращения повторной загрузки
let trophyLoadAttempted = false;
let trophyLoadSuccess = false;

async function initTrophy3D() {
    // Если уже загружено успешно, просто показываем
    if (trophyLoadSuccess && trophyRenderer) {
        return;
    }

    // Если уже была попытка загрузки и она не удалась, показываем fallback
    if (trophyLoadAttempted && !trophyLoadSuccess) {
        const container = document.getElementById('trophy-3d-container');
        if (container) {
            // Показываем fallback изображение вместо ошибки
            container.innerHTML = `
                <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;">
                    <img src="image/GUP.png" alt="Champion Trophy" style="max-width:80%;max-height:80%;object-fit:contain;filter:drop-shadow(0 0 30px rgba(204,170,102,0.3));">
                    <div style="color:#888888;font-size:0.8rem;margin-top:1rem;">🏆 Champion Trophy</div>
                </div>
            `;
        }
        return;
    }

    trophyLoadAttempted = true;

    const container = document.getElementById('trophy-3d-container');
    const loader = document.getElementById('trophy-loader');

    // Функция для плавного обновления прогресса внутри лоадера
    function updateTrophyProgress(percent) {
        const progressContainer = document.getElementById('trophy-loader-progress');
        const progressBar = document.getElementById('trophy-loader-progress-bar');
        if (progressContainer) {
            progressContainer.style.display = 'block';
        }
        if (progressBar) {
            const currentWidth = parseFloat(progressBar.style.width) || 0;
            const targetWidth = Math.min(percent, 100);
            const step = 1;
            const interval = 20;
            let current = currentWidth;
            
            if (current < targetWidth) {
                const timer = setInterval(() => {
                    current += step;
                    if (current >= targetWidth) {
                        current = targetWidth;
                        clearInterval(timer);
                    }
                    progressBar.style.width = current + '%';
                }, interval);
            } else {
                progressBar.style.width = targetWidth + '%';
            }
        }
    }

    if (!container) {
        console.warn('Trophy container not found');
        return;
    }

    // Проверяем, есть ли уже рендерер
    if (trophyRenderer) {
        if (loader) loader.classList.add('hide');
        return;
    }

    if (loader) {
        loader.classList.remove('hide');
        updateTrophyProgress(10);
    }

    // Очищаем контейнер (сохраняем loader)
    const children = container.children;
    for (let i = children.length - 1; i >= 0; i--) {
        const child = children[i];
        if (child !== loader) {
            container.removeChild(child);
        }
    }

    try {
        setTimeout(() => updateTrophyProgress(20), 300);

        const THREE = await import('three');
        const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
        const { OrbitControls } = await import('three/addons/controls/OrbitControls.js');

        setTimeout(() => updateTrophyProgress(35), 200);

        trophyScene = new THREE.Scene();
        trophyScene.background = null;

        const width = container.clientWidth;
        const height = container.clientHeight;
        trophyCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
        trophyCamera.position.set(0, 0.5, 3);
        trophyCamera.lookAt(0, 0.3, 0);

        trophyRenderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: "low-power",
            failIfMajorPerformanceCaveat: false
        });
        trophyRenderer.setSize(width, height);
        trophyRenderer.setClearColor(0x000000, 0);
        trophyRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(trophyRenderer.domElement);

        setTimeout(() => updateTrophyProgress(50), 300);

        trophyControls = new OrbitControls(trophyCamera, trophyRenderer.domElement);
        trophyControls.enableDamping = true;
        trophyControls.dampingFactor = 0.05;
        trophyControls.enableZoom = true;
        trophyControls.enablePan = false;
        trophyControls.zoomSpeed = 1.0;
        trophyControls.rotateSpeed = 1.0;
        trophyControls.target.set(0, 0.3, 0);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
        trophyScene.add(ambientLight);

        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(1, 2, 2);
        trophyScene.add(mainLight);

        const rimLight = new THREE.PointLight(0xaaccff, 0.35);
        rimLight.position.set(0, 1, -2.5);
        trophyScene.add(rimLight);

        const bottomLight = new THREE.PointLight(0xffffff, 0.35);
        bottomLight.position.set(0, -1, 0);
        trophyScene.add(bottomLight);

        setTimeout(() => updateTrophyProgress(65), 300);

        const gltfLoader = new GLTFLoader();

        const loadModel = () => {
            return new Promise((resolve, reject) => {
                // Увеличиваем таймаут до 30 секунд
                const timeout = setTimeout(() => {
                    reject(new Error('3D model loading timeout (60s)'));
                }, 60000);

                setTimeout(() => updateTrophyProgress(75), 200);

                gltfLoader.loadAsync('https://static.wfolio.ru/file/AqiFFw_TXMM4LDwoI2TPSeEYv7M5masq/kdiGFy2hfRbDLZB4kMumXCFxp50BP_vR/Znlq5rC-YfFRn7rdN7ny1wUbQAZa0Ihy/w8zIXSDrKb90lCLMZSGNfXFXKjuBZATc/S4zm6POcf9y3Go2tu2Zk5CGu24f9n7jG/VYmIeCJ5VJQ.glb')
                    .then(gltf => {
                        clearTimeout(timeout);
                        updateTrophyProgress(90);
                        resolve(gltf);
                    })
                    .catch(err => {
                        clearTimeout(timeout);
                        reject(err);
                    });
            });
        };

        const gltf = await loadModel();
        trophyModel = gltf.scene;
        trophyScene.add(trophyModel);

        setTimeout(() => updateTrophyProgress(95), 200);

        if (loader) {
            loader.classList.add('hide');
        }

        const box = new THREE.Box3().setFromObject(trophyModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        trophyModel.position.x = -center.x;
        trophyModel.position.y = -center.y;
        trophyModel.position.z = -center.z;

        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 1.8;
        const scale = targetSize / maxDim;
        trophyModel.scale.set(scale, scale, scale);

        const newBox = new THREE.Box3().setFromObject(trophyModel);
        const newCenter = newBox.getCenter(new THREE.Vector3());
        trophyModel.position.x -= newCenter.x;
        trophyModel.position.z -= newCenter.z;

        const newMinY = newBox.min.y;
        trophyModel.position.y -= newMinY;
        trophyModel.position.y -= 0.5;

        trophyModel.rotation.y = Math.PI;

        const rotatedBox = new THREE.Box3().setFromObject(trophyModel);
        const rotatedCenter = rotatedBox.getCenter(new THREE.Vector3());
        trophyModel.position.x -= rotatedCenter.x;
        trophyModel.position.z -= rotatedCenter.z;
        trophyModel.position.y = -0.5;

        trophyControls.target.set(0, 0.3, 0);
        trophyControls.update();

        trophyLoadSuccess = true;

        updateTrophyProgress(100);
        
        setTimeout(() => {
            const progressContainer = document.getElementById('trophy-loader-progress');
            if (progressContainer) {
                progressContainer.style.display = 'none';
            }
        }, 600);

        function animate() {
            if (!trophyRenderer || !trophyScene || !trophyCamera) return;
            requestAnimationFrame(animate);
            if (trophyControls) {
                trophyControls.update();
            }
            trophyRenderer.render(trophyScene, trophyCamera);
        }
        animate();

        window.addEventListener('resize', () => {
            if (trophyRenderer && container) {
                const newWidth = container.clientWidth;
                const newHeight = container.clientHeight;
                trophyRenderer.setSize(newWidth, newHeight);
                trophyCamera.aspect = newWidth / newHeight;
                trophyCamera.updateProjectionMatrix();
            }
        });

        console.log('3D Trophy initialization complete');

    } catch (error) {
        console.error('Error loading 3D trophy:', error);
        trophyLoadSuccess = false;
        if (loader) {
            loader.classList.add('hide');
        }
        // Показываем fallback изображение вместо ошибки
        container.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;width:100%;">
                <img src="image/GUP.png" alt="Champion Trophy" style="max-width:80%;max-height:80%;object-fit:contain;filter:drop-shadow(0 0 30px rgba(204,170,102,0.3));">
                <div style="color:#888888;font-size:0.8rem;margin-top:1rem;">🏆 Champion Trophy</div>
            </div>
        `;
        return;
    }
}

window.openTrophyModal = function() {
    const modal = document.getElementById('trophy-modal');
    if (modal) {
        updateTrophyModalContent();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        setTimeout(() => {
            const avatar = document.querySelector('.trophy-champion-avatar .team-avatar');
            if (avatar) {
                avatar.style.animation = 'none';
                setTimeout(() => {
                    avatar.style.animation = 'bounceAndFade 2.5s ease-out forwards';
                }, 50);
            }
        }, 100);
        if (!trophyRenderer) {
            initTrophy3D();
        }
    }
};

// ==================== КЕШ ДЛЯ ПРОГНОЗОВ ====================

// Получение всего кеша
function getPredictionCache() {
    try {
        const cached = localStorage.getItem(PREDICTION_CACHE_KEY);
        return cached ? JSON.parse(cached) : {};
    } catch(e) {
        console.warn('Error reading prediction cache:', e);
        return {};
    }
}

// Получение данных из кеша
function getPredictionFromCache(key) {
    try {
        const cache = getPredictionCache();
        const item = cache[key];
        if (item && (Date.now() - item.timestamp) < PREDICTION_CACHE_DURATION) {
            console.log(`Cache hit for ${key}`);
            return item.data;
        }
        if (item) {
            console.log(`Cache expired for ${key}`);
        } else {
            console.log(`Cache miss for ${key}`);
        }
        return null;
    } catch(e) {
        console.warn('Error reading from prediction cache:', e);
        return null;
    }
}

// Сохранение данных в кеш
function savePredictionToCache(key, data) {
    try {
        const cache = getPredictionCache();
        cache[key] = {
            timestamp: Date.now(),
            data: data
        };
        localStorage.setItem(PREDICTION_CACHE_KEY, JSON.stringify(cache));
        console.log(`Saved to prediction cache: ${key}`);
    } catch(e) {
        console.warn('Save to prediction cache error:', e);
    }
}

// Очистка кеша прогнозов
function clearPredictionCache() {
    try {
        localStorage.removeItem(PREDICTION_CACHE_KEY);
        console.log('Prediction cache cleared');
    } catch(e) {
        console.warn('Failed to clear prediction cache:', e);
    }
}

// Универсальная функция загрузки данных прогнозов с кешем (использует JSONP)
async function loadPredictionDataWithCache(stageKey, stage, forceRefresh = false, retryCount = 0) {
    if (!stage || !stage.statsUrl || stage.statsUrl === '#') {
        return { success: false, error: 'No stats URL' };
    }
    
    // Проверяем кеш (если не админ и не принудительное обновление)
    if (!isAdmin && !forceRefresh) {
        const cached = getPredictionFromCache(stageKey);
        if (cached) {
            console.log(`Loaded ${stageKey} from cache`);
            return cached;
        }
    }
    
    try {
        console.log(`Loading ${stageKey} via JSONP (attempt ${retryCount + 1})...`);
        
        // Используем JSONP вместо fetch
        const data = await new Promise((resolve, reject) => {
            const callbackName = `jsonp_callback_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            
            const timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error('JSONP request timeout'));
            }, 40000); // 40 секунд (было 30)
            
            function cleanup() {
                if (window[callbackName]) {
                    delete window[callbackName];
                }
                const script = document.querySelector(`script[data-callback="${callbackName}"]`);
                if (script && script.parentNode) {
                    script.parentNode.removeChild(script);
                }
                clearTimeout(timeoutId);
            }
            
            window[callbackName] = function(data) {
                cleanup();
                resolve(data);
            };
            
            const script = document.createElement('script');
            script.setAttribute('data-callback', callbackName);
            script.src = `${stage.statsUrl}?action=getStats&callback=${callbackName}`;
            script.onerror = function() {
                cleanup();
                reject(new Error('JSONP script load error'));
            };
            
            document.body.appendChild(script);
        });
        
        if (data && data.success) {
            // Сохраняем в кеш (только для зрителей)
            if (!isAdmin) {
                savePredictionToCache(stageKey, data);
                console.log(`Saved ${stageKey} to cache`);
            }
            return data;
        } else {
            console.warn(`Invalid data for ${stageKey}:`, data);
            
            // Если есть кеш даже просроченный - используем как fallback
            const cached = getPredictionFromCache(stageKey);
            if (cached) {
                console.log(`Using expired cache as fallback for ${stageKey}`);
                return cached;
            }
            
            return { success: false, error: 'Invalid data' };
        }
    } catch (error) {
        console.error(`Error loading ${stageKey}:`, error);
        
        // ========== ПОВТОРНЫЕ ПОПЫТКИ ==========
        if (retryCount < 2) {
            console.log(`Retrying ${stageKey} (${retryCount + 1}/3)...`);
            // Ждем 1-2 секунды перед повторной попыткой
            await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
            return loadPredictionDataWithCache(stageKey, stage, forceRefresh, retryCount + 1);
        }
        
        // Если есть кеш даже просроченный - используем как fallback
        const cached = getPredictionFromCache(stageKey);
        if (cached) {
            console.log(`Using expired cache as fallback for ${stageKey}`);
            return cached;
        }
        
        return { success: false, error: error.message };
    }
}

// ==================== ПРОГНОЗЫ (ПРОГНОЗЫ ЗРИТЕЛЕЙ) ====================
const PREDICTION_CONFIG = {
    arenaVotes: {
        name: 'АРЕНА ГОЛОСОВ',
        formUrl: 'https://forms.gle/oMh9MqKGt5KMNURdA',
        statsUrl: 'https://script.google.com/macros/s/AKfycbx_YYazGZSouMe7G0lSSLSSvLFHgu6YsI8CPg0CvVMnIK5oI7JM64uonFparvx5qckqlA/exec',
        startDate: null,
        endDate: null,
        votingActive: false,
        rankingVisible: false,
        hasRanking: false,
        rankingType: 'arena'
    },
    groupStage: {
        name: 'ГРУППОВОЙ ЭТАП',
        formUrl: 'https://forms.gle/BSs7kmQRiZJGuVEW7',
        statsUrl: 'https://script.google.com/macros/s/AKfycbwSvu36ZCD8snThHEytxqO3syBayYH3vhkZFlDdubNJCtdyE0UUZqPFAbT8hNRu3RSLlQ/exec',
        startDate: null,
        endDate: null,
        votingActive: false,
        rankingVisible: false,
        isClosed: false,
        hasRanking: true,
        rankingType: 'group'
    },
    playoffs: {
        name: 'ПЛЕЙ-ОФФ',
        formUrl: 'https://forms.gle/YSHmkeW6NWunxxih8',
        statsUrl: 'https://script.google.com/macros/s/AKfycbyx8WdIQB-6_lI6ylKhxXtsOxyX01CjbEOKnB0nyxAeOZ8O6b-zLIV3ZO5RhlpqjTiAmA/exec',
        startDate: null,
        endDate: null,
        votingActive: false,
        rankingVisible: false,
        isClosed: false,
        hasRanking: true,
        rankingType: 'playoffs'
    },
    grandFinal: {
        name: 'ГРАНД-ФИНАЛ',
        formUrl: 'https://forms.gle/BYMY5vYjhe482FQP6',
        statsUrl: 'https://script.google.com/macros/s/AKfycbw2mZ1vXtH_XzTTH2Ys53Hln1m4Ouwc7HgOwYfxmjR-P1bOSO3KzMUsGgJsuzCS_OnD4w/exec',
        startDate: null,
        endDate: null,
        votingActive: false,
        rankingVisible: false,
        isClosed: false,
        hasRanking: true,
        rankingType: 'grandFinal'
    }
};

// Получение текстов статусов для разных этапов
function getStatusTexts(stageKey) {
    if (stageKey === 'arenaVotes') {
        return {
            active: t('arena_status_active'),
            closed: t('arena_status_closed'),
            upcoming: t('arena_status_upcoming')
        };
    } else {
        return {
            active: t('prediction_status_active'),
            closed: t('prediction_status_closed'),
            upcoming: t('prediction_status_upcoming')
        };
    }
}

// ==================== ЛОГИКА ПРОГНОЗОВ ====================

// Проверка, завершён ли групповой этап (известны 4 команды в плей-офф)
function isGroupStageResultsKnown() {
    // Групповой этап завершён, когда есть победители в обеих группах
    const groupACompleted = isGroupStageCompleted('A');
    const groupBCompleted = isGroupStageCompleted('B');
    return groupACompleted && groupBCompleted;
}

// Проверка, завершён ли плей-офф (известны финалисты гранд-финала)
function isPlayoffsCompleted() {
    const grandFinal = tournamentData.playoffs.grandFinal;
    // Плей-офф завершён, когда в гранд-финале есть победитель
    return grandFinal.winner && grandFinal.winner !== '' && grandFinal.winner !== 'TBD';
}

// Проверка, завершён ли плей-офф (известны финалисты)
function isPlayoffsResultsKnown() {
    const grandFinal = tournamentData.playoffs.grandFinal;
    // Финалисты известны, когда в гранд-финале есть две команды
    const hasBothTeams = grandFinal.team1 && grandFinal.team1 !== '' && grandFinal.team1 !== 'TBD' &&
                         grandFinal.team2 && grandFinal.team2 !== '' && grandFinal.team2 !== 'TBD';
    return hasBothTeams;
}

// Проверка, завершён ли гранд-финал (известен чемпион)
function isGrandFinalCompleted() {
    const grandFinal = tournamentData.playoffs.grandFinal;
    return grandFinal.winner && grandFinal.winner !== '' && grandFinal.winner !== 'TBD';
}

// Проверка, есть ли две команды в карточке гранд-финала
function hasGrandFinalTeams() {
    const grandFinal = tournamentData.playoffs.grandFinal;
    return grandFinal.team1 && grandFinal.team1 !== '' && grandFinal.team1 !== 'TBD' &&
           grandFinal.team2 && grandFinal.team2 !== '' && grandFinal.team2 !== 'TBD';
}

// Обновление статусов этапов прогнозов
function updatePredictionStagesStatus() {
    const nowUTC = new Date();
    const nowUTCfixed = new Date(Date.UTC(
        nowUTC.getUTCFullYear(),
        nowUTC.getUTCMonth(),
        nowUTC.getUTCDate(),
        nowUTC.getUTCHours(),
        nowUTC.getUTCMinutes(),
        nowUTC.getUTCSeconds()
    ));

    // === АРЕНА ГОЛОСОВ ===
    if (PREDICTION_CONFIG.arenaVotes) {
        const arenaVotes = PREDICTION_CONFIG.arenaVotes;
        let tournamentStart = scheduleData.periodStart ? new Date(scheduleData.periodStart) : null;
        let tournamentEnd = scheduleData.periodEnd ? new Date(scheduleData.periodEnd) : null;
        
        let votingActive = false;
        if (tournamentStart) {
            if (tournamentEnd) {
                votingActive = nowUTC >= tournamentStart && nowUTC <= tournamentEnd;
            } else {
                votingActive = nowUTC >= tournamentStart;
            }
        }
        arenaVotes.votingActive = votingActive;
        arenaVotes.rankingVisible = false;
        arenaVotes.isClosed = false;
    }

    // === ГРУППОВОЙ ЭТАП ===
    if (PREDICTION_CONFIG.groupStage) {
        const groupStage = PREDICTION_CONFIG.groupStage;
        let tournamentStart = scheduleData.periodStart ? new Date(scheduleData.periodStart) : null;
        let firstMatchDate = getFirstGroupMatchTime();
        
        let votingActive = false;
        let isClosed = false;
        
        // Если турнир ещё не начался
        if (tournamentStart && nowUTC < tournamentStart) {
            votingActive = false;
            isClosed = false;
        }
        // Если турнир начался
        else if (tournamentStart) {
            // Если есть дата первого матча
            if (firstMatchDate) {
                // До первого матча — активно
                if (nowUTC < firstMatchDate) {
                    votingActive = true;
                    isClosed = false;
                }
                // После первого матча — закрыто
                else {
                    votingActive = false;
                    isClosed = true;
                }
            } else {
                // Если даты матча нет — активно (голосование открыто)
                votingActive = true;
                isClosed = false;
            }
        }
        
        // Если групповой этап завершён (есть победители) — закрыто и рейтинг виден
        if (isGroupStageResultsKnown()) {
            votingActive = false;
            isClosed = true;
        }
        
        groupStage.votingActive = votingActive;
        groupStage.rankingVisible = isGroupStageResultsKnown();
        groupStage.isClosed = isClosed;
    }

    // === ПЛЕЙ-ОФФ ===
    if (PREDICTION_CONFIG.playoffs) {
        const playoffs = PREDICTION_CONFIG.playoffs;
        const groupStageCompleted = isGroupStageResultsKnown();
        const hasGrandFinalTeams = tournamentData.playoffs.grandFinal.team1 && tournamentData.playoffs.grandFinal.team1 !== '' && tournamentData.playoffs.grandFinal.team1 !== 'TBD' &&
                                   tournamentData.playoffs.grandFinal.team2 && tournamentData.playoffs.grandFinal.team2 !== '' && tournamentData.playoffs.grandFinal.team2 !== 'TBD';
        
        let earliestMatchDate = getFirstPlayoffMatchTime();
        
        let votingActive = false;
        let isClosed = false;
        let rankingVisible = false;
        
        // Если групповой этап НЕ завершён — СКОРО (upcoming)
        if (!groupStageCompleted) {
            votingActive = false;
            isClosed = false;
            rankingVisible = false;
        }
        // Если групповой этап завершён
        else {
            // Если есть дата первого матча
            if (earliestMatchDate) {
                // До первого матча — активно
                if (nowUTC < earliestMatchDate) {
                    votingActive = true;
                    isClosed = false;
                }
                // После первого матча — закрыто
                else {
                    votingActive = false;
                    isClosed = true;
                }
            } else {
                // Если даты матча нет — активно (голосование открыто)
                votingActive = true;
                isClosed = false;
            }
            // Рейтинг виден, когда две команды в гранд-финале
            rankingVisible = hasGrandFinalTeams;
        }
        
        playoffs.votingActive = votingActive;
        playoffs.rankingVisible = rankingVisible;
        playoffs.isClosed = isClosed;
    }

    // === ГРАНД-ФИНАЛ ===
    if (PREDICTION_CONFIG.grandFinal) {
        const grandFinalStage = PREDICTION_CONFIG.grandFinal;
        const hasGrandFinalTeams = tournamentData.playoffs.grandFinal.team1 && tournamentData.playoffs.grandFinal.team1 !== '' && tournamentData.playoffs.grandFinal.team1 !== 'TBD' &&
                                   tournamentData.playoffs.grandFinal.team2 && tournamentData.playoffs.grandFinal.team2 !== '' && tournamentData.playoffs.grandFinal.team2 !== 'TBD';
        let matchDate = getGrandFinalMatchTime();
        
        let votingActive = false;
        let isClosed = false;
        let rankingVisible = false;
        
        // Если нет двух команд в гранд-финале — СКОРО (upcoming)
        if (!hasGrandFinalTeams) {
            votingActive = false;
            isClosed = false;
            rankingVisible = false;
        }
        // Если две команды есть
        else {
            // Если есть дата матча
            if (matchDate) {
                // До матча — активно
                if (nowUTC < matchDate) {
                    votingActive = true;
                    isClosed = false;
                }
                // После матча — закрыто
                else {
                    votingActive = false;
                    isClosed = true;
                }
            } else {
                // Если даты матча нет — активно (голосование открыто)
                votingActive = true;
                isClosed = false;
            }
            // Рейтинг виден, когда есть победитель
            const hasWinner = tournamentData.playoffs.grandFinal.winner && tournamentData.playoffs.grandFinal.winner !== '' && tournamentData.playoffs.grandFinal.winner !== 'TBD';
            rankingVisible = hasWinner;
        }
        
        grandFinalStage.votingActive = votingActive;
        grandFinalStage.rankingVisible = rankingVisible;
        grandFinalStage.isClosed = isClosed;
    }
}
// Обновление статусов этапов в уже открытом модальном окне
function updatePredictionStagesStatusUI() {
    for (const [key, stage] of Object.entries(PREDICTION_CONFIG)) {
        if (!stage) continue;
        
        const statusSpan = document.querySelector(`#prediction-block-${key} .prediction-stage-status`);
        const header = document.querySelector(`#prediction-block-${key} .prediction-stage-header`);
        if (!statusSpan) continue;
        
        const status = getStageStatus(stage, key);  // ← передаём key
        
        if (header) {
            header.setAttribute('data-status', status);
        }
        
        const texts = getStatusTexts(key);
        statusSpan.textContent = texts[status] || texts.upcoming;
        statusSpan.className = `prediction-stage-status ${status}`;
    }
}

// Получение времени первого матча в групповом этапе (в UTC)
function getFirstGroupMatchTime() {
    const allMatches = [
        ...(tournamentData.groups.A.matches || []),
        ...(tournamentData.groups.B.matches || [])
    ];

    let earliestDate = null;
    for (const match of allMatches) {
        // Проверяем, что у матча есть две валидные команды (не TBD и не пустые)
        const hasValidTeams = match.team1 && match.team1 !== '' && match.team1 !== 'TBD' &&
                              match.team2 && match.team2 !== '' && match.team2 !== 'TBD';
        // ============================================
        
        if (match.date && match.date !== '' && hasValidTeams) {
            let matchTimeStr = match.date;
            if (matchTimeStr.length === 16) {
                matchTimeStr = matchTimeStr + ':00';
            }
            const matchDate = new Date(matchTimeStr + 'Z');

            if (!isNaN(matchDate.getTime())) {
                if (!earliestDate || matchDate < earliestDate) {
                    earliestDate = matchDate;
                }
            }
        }
    }

    return earliestDate;
}

// Получение самой ранней даты матча плей-офф (верхний финал или полуфинал нижней сетки)
function getFirstPlayoffMatchTime() {
    let earliestDate = null;
    
    function parseDate(dateStr) {
        if (!dateStr || dateStr === '') return null;
        let matchTimeStr = dateStr;
        if (matchTimeStr.length === 16) {
            matchTimeStr = matchTimeStr + ':00';
        }
        const matchDate = new Date(matchTimeStr + 'Z');
        if (!isNaN(matchDate.getTime())) {
            return matchDate;
        }
        return null;
    }
    
    const upperFinal = tournamentData.playoffs.upperFinal;
    if (upperFinal && upperFinal.date) {
        const date = parseDate(upperFinal.date);
        if (date && (!earliestDate || date < earliestDate)) {
            earliestDate = date;
        }
    }
    
    const lowerSemi = tournamentData.playoffs.lowerSemi;
    if (lowerSemi && lowerSemi.date) {
        const date = parseDate(lowerSemi.date);
        if (date && (!earliestDate || date < earliestDate)) {
            earliestDate = date;
        }
    }
    
    return earliestDate;
}

// Получение времени первого матча верхней сетки
function getUpperFinalMatchTime() {
    const upperFinal = tournamentData.playoffs.upperFinal;
    if (upperFinal.date && upperFinal.date !== '') {
        return new Date(upperFinal.date);
    }
    return null;
}

// Получение даты матча гранд-финала из карточки ГРАНД-ФИНАЛ
function getGrandFinalMatchTime() {
    const grandFinal = tournamentData.playoffs.grandFinal;
    if (grandFinal && grandFinal.date && grandFinal.date !== '') {
        let matchTimeStr = grandFinal.date;
        if (matchTimeStr.length === 16) {
            matchTimeStr = matchTimeStr + ':00';
        }
        const matchDate = new Date(matchTimeStr + 'Z');
        if (!isNaN(matchDate.getTime())) {
            return matchDate;
        }
    }
    return null;
}

// Сброс данных прогнозов (при полном сбросе турнира)
async function resetPredictionsData() {
    try {
        // Сброс статусов в конфиге для ВСЕХ этапов
        if (PREDICTION_CONFIG.arenaVotes) {
            PREDICTION_CONFIG.arenaVotes.votingActive = false;
            PREDICTION_CONFIG.arenaVotes.rankingVisible = false;
        }
        if (PREDICTION_CONFIG.groupStage) {
            PREDICTION_CONFIG.groupStage.votingActive = false;
            PREDICTION_CONFIG.groupStage.rankingVisible = false;
        }
        if (PREDICTION_CONFIG.playoffs) {
            PREDICTION_CONFIG.playoffs.votingActive = false;
            PREDICTION_CONFIG.playoffs.rankingVisible = false;
        }
        if (PREDICTION_CONFIG.grandFinal) {
            PREDICTION_CONFIG.grandFinal.votingActive = false;
            PREDICTION_CONFIG.grandFinal.rankingVisible = false;
        }

        // Очищаем кеш прогнозов
        clearPredictionCache(); // Используем новую функцию
        
        // Сбрасываем глобальные переменные прогнозов
        if (typeof teamRostersCache !== 'undefined') {
            teamRostersCache = null;
        }
        if (typeof teamTotalPowerCache !== 'undefined') {
            teamTotalPowerCache = {};
        }
        if (typeof window._rosters !== 'undefined') {
            window._rosters = null;
        }

        // Закрываем модальное окно прогнозов, если оно открыто
        const modal = document.getElementById('prediction-modal');
        if (modal && modal.style.display === 'flex') {
            closePredictionModal();
        }

        console.log('Predictions data reset');
    } catch (error) {
        console.error('Reset predictions error:', error);
    }
}

// Состояние модального окна
let isPredictionModalOpen = false;

// Инициализация дат из scheduleData
function initPredictionDates() {
    if (PREDICTION_CONFIG.groupStage && scheduleData.periodStart) {
        let startDate = new Date(scheduleData.periodStart);
        if (!isNaN(startDate.getTime())) {
            PREDICTION_CONFIG.groupStage.startDate = startDate;
        }

        if (scheduleData.qfEnd) {
            let endDate = new Date(scheduleData.qfEnd);
            if (!isNaN(endDate.getTime())) {
                PREDICTION_CONFIG.groupStage.endDate = endDate;
            }
        }
    }
}

// Определение статуса этапа (для отображения в UI)
function getStageStatus(stage, stageKey) {
    if (!stage) return 'upcoming';
    
    // Активно — голосование идёт
    if (stage.votingActive) return 'active';
    
    // Закрыто — голосование завершено
    if (stage.isClosed) return 'closed';
    
    // Рейтинг виден — тоже значит, что голосование закрыто
    if (stage.rankingVisible) return 'closed';
    
    // Во всех остальных случаях — СКОРО
    return 'upcoming';
}

// Загрузка данных для этапа
async function loadStageData(stageKey, stage) {
    const status = getStageStatus(stage);

    // Загружаем данные, если:
    // 1. Этап активен (голосование идёт)
    // 2. Рейтинг виден (после завершения)
    // 3. Голосование было когда-либо (есть данные) - всегда загружаем
    // Для группового этапа загружаем всегда, так как данные нужны для диаграммы
    const shouldLoad = true; // Всегда загружаем данные

    if (!shouldLoad) {
        return { status, chart: null, rankings: null };
    }

    return new Promise((resolve) => {
        const callbackName = `jsonp_callback_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

        window[callbackName] = function(data) {
            delete window[callbackName];
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            resolve({
                status,
                chart: data.chart || null,
                rankings: data.rankings || null,
                success: data.success || false
            });
        };

        const script = document.createElement('script');
        script.src = `${stage.statsUrl}?action=getStats&callback=${callbackName}`;
        script.onerror = function() {
            delete window[callbackName];
            if (document.body.contains(script)) {
                document.body.removeChild(script);
            }
            console.error(`JSONP error for ${stageKey}`);
            resolve({ status, chart: null, rankings: null });
        };

        document.body.appendChild(script);

        setTimeout(() => {
            if (window[callbackName]) {
                delete window[callbackName];
                if (document.body.contains(script)) {
                    document.body.removeChild(script);
                }
                resolve({ status, chart: null, rankings: null });
            }
        }, 10000);
    });
}

// Рендер диаграммы
function renderChart(containerId, data, actualTeams, stageKey) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = `<div class="loading">${t('no_data_to_display')}</div>`;
        return;
    }

    const total = Object.values(data).reduce((a, b) => a + b, 0);
    if (total === 0) {
        container.innerHTML = `<div class="loading">${t('no_data_to_display')}</div>`;
        return;
    }

    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

    // ========== ОПРЕДЕЛЯЕМ КОМАНДЫ ДЛЯ ПОДСВЕТКИ ==========
    let winnersArray = [];
    
    if (stageKey === 'groupStage') {
        // Для группового этапа — подсвечиваем ТОП-2 из каждой группы (4 команды)
        const isGroupCompleted = isGroupStageResultsKnown();
        if (isGroupCompleted) {
            winnersArray = getGroupWinnersList();
        }
    } else if (stageKey === 'playoffs') {
        // Для плей-офф — подсвечиваем команды в гранд-финале (2 команды)
        const grandFinal = tournamentData.playoffs.grandFinal;
        if (grandFinal) {
            const teams = [];
            if (grandFinal.team1 && grandFinal.team1 !== '' && grandFinal.team1 !== 'TBD') {
                teams.push(grandFinal.team1);
            }
            if (grandFinal.team2 && grandFinal.team2 !== '' && grandFinal.team2 !== 'TBD') {
                teams.push(grandFinal.team2);
            }
            winnersArray = teams;
        }
    } else if (stageKey === 'grandFinal') {
        // Для гранд-финала подсвечиваем только команду-чемпиона
        const grandFinalMatch = tournamentData.playoffs.grandFinal;
        const champion = grandFinalMatch.winner;
        if (champion && champion !== '' && champion !== 'TBD') {
            winnersArray = [champion];
        }
    }
    // Для arenaVotes winnersArray остаётся пустым

    let html = '<div class="prediction-chart">';
    for (const [team, count] of sorted) {
        let percentRaw = (count / total * 100);
        let percent = 5 + (percentRaw / 100) * 95;
        percent = percent.toFixed(1);

        const avatarHtml = getAvatarHtml(team);
        const isWinner = winnersArray.includes(team);
        const winnerClass = isWinner ? 'winner-row' : '';

        html += `
            <div class="prediction-chart-bar ${winnerClass}">
                <div class="prediction-chart-label">
                    <span class="team" style="cursor: pointer;" data-team-name="${escapeHtml(team)}">${avatarHtml}${escapeHtml(team)}</span>
                    <span class="percentage">${percentRaw.toFixed(1)}% (${count})</span>
                </div>
                <div class="prediction-chart-fill">
                    <div class="prediction-chart-progress" style="width: ${percent}%"></div>
                </div>
            </div>
        `;
    }
    html += '</div>';
    container.innerHTML = html;
}

function renderRankings(containerId, data, type) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }

    if (!data || Object.keys(data).length === 0) {
        container.innerHTML = `<div class="loading">${t('no_data_to_display')}</div>`;
        return;
    }

    // ========== ДИАГНОСТИКА ==========
    console.log('renderRankings data:', data);
    console.log('renderRankings type:', type);

    let html = '<div class="prediction-rankings-container">';

    // ========== ДЛЯ ГРУППОВОГО ЭТАПА ==========
    if (type === 'group') {
        // Проверяем разные возможные ключи
        const perfectKey = data.perfect !== undefined ? 'perfect' : (data.correct !== undefined ? 'correct' : null);
        const threeKey = data.three !== undefined ? 'three' : (data.partial !== undefined ? 'partial' : null);
        const twoKey = data.two !== undefined ? 'two' : null;

        const categories = [];

        if (perfectKey) {
            categories.push({ key: perfectKey, title: t('ranking_category_perfect') });
        }
        if (threeKey) {
            categories.push({ key: threeKey, title: t('ranking_category_three') });
        }
        if (twoKey) {
            categories.push({ key: twoKey, title: t('ranking_category_two') });
        }

        // Если нет стандартных ключей, пробуем найти любые массивы
        if (categories.length === 0) {
            for (const [key, value] of Object.entries(data)) {
                if (Array.isArray(value) && value.length > 0) {
                    categories.push({ key: key, title: key.toUpperCase() });
                }
            }
        }

        for (const cat of categories) {
            const users = data[cat.key] || [];
            // Сортируем пользователей по имени
            const sortedUsers = [...users].sort((a, b) => {
                const nameA = a.name || a.username || a.user || '';
                const nameB = b.name || b.username || b.user || '';
                return nameA.localeCompare(nameB);
            });

            html += `
                <div class="prediction-rank-table">
                    <div class="prediction-rank-title">${cat.title} (${users.length})</div>
                    <div class="prediction-rank-rows">
                        ${sortedUsers.map(user => {
                            const userName = user.name || user.username || user.user || 'Аноним';
                            const picks = user.picks || user.correct || user.answer || [];
                            const picksText = Array.isArray(picks) ? picks.join(', ') : '';
                            return `
                                <div class="prediction-rank-row" data-user-name="${escapeHtml(userName)}">
                                    <span class="prediction-rank-name">${escapeHtml(userName)}</span>
                                    <span class="prediction-rank-picks">${escapeHtml(picksText)}</span>
                                </div>
                            `;
                        }).join('')}
                        ${users.length === 0 ? '<div class="prediction-rank-row"><span class="prediction-rank-name" style="color: #666666;">' + t('no_participants') + '</span><span class="prediction-rank-picks"></span></div>' : ''}
                    </div>
                </div>
            `;
        }
    }

    // ========== ДЛЯ ПЛЕЙ-ОФФ ==========
    else if (type === 'playoffs') {
        // ... аналогичная логика для плей-офф
        const categories = [
            { key: 'two', title: t('ranking_category_two') },
            { key: 'one', title: t('ranking_category_one') }
        ];

        for (const cat of categories) {
            const users = data[cat.key] || [];
            const sortedUsers = [...users].sort((a, b) => {
                const nameA = a.name || a.username || a.user || '';
                const nameB = b.name || b.username || b.user || '';
                return nameA.localeCompare(nameB);
            });

            html += `
                <div class="prediction-rank-table">
                    <div class="prediction-rank-title">${cat.title} (${users.length})</div>
                    <div class="prediction-rank-rows">
                        ${sortedUsers.map(user => {
                            const userName = user.name || user.username || user.user || 'Аноним';
                            const picks = user.picks || user.correct || [];
                            const picksText = Array.isArray(picks) ? picks.join(', ') : '';
                            return `
                                <div class="prediction-rank-row" data-user-name="${escapeHtml(userName)}">
                                    <span class="prediction-rank-name">${escapeHtml(userName)}</span>
                                    <span class="prediction-rank-picks">${escapeHtml(picksText)}</span>
                                </div>
                            `;
                        }).join('')}
                        ${users.length === 0 ? '<div class="prediction-rank-row"><span class="prediction-rank-name" style="color: #666666;">' + t('no_participants') + '</span><span class="prediction-rank-picks"></span></div>' : ''}
                    </div>
                </div>
            `;
        }
    }

    // ========== ДЛЯ ГРАНД-ФИНАЛА ==========
    else if (type === 'grandFinal') {
        const categories = [
            { key: 'correct', title: t('ranking_category_correct') },
            { key: 'wrong', title: t('ranking_category_wrong') }
        ];

        for (const cat of categories) {
            const users = data[cat.key] || [];
            const sortedUsers = [...users].sort((a, b) => {
                const nameA = a.name || a.username || a.user || '';
                const nameB = b.name || b.username || b.user || '';
                return nameA.localeCompare(nameB);
            });

            html += `
                <div class="prediction-rank-table">
                    <div class="prediction-rank-title">${cat.title} (${users.length})</div>
                    <div class="prediction-rank-rows">
                        ${sortedUsers.map(user => {
                            const userName = user.name || user.username || user.user || 'Аноним';
                            const pick = user.pick || user.answer || '';
                            return `
                                <div class="prediction-rank-row" data-user-name="${escapeHtml(userName)}">
                                    <span class="prediction-rank-name">${escapeHtml(userName)}</span>
                                    <span class="prediction-rank-picks">${escapeHtml(pick)}</span>
                                </div>
                            `;
                        }).join('')}
                        ${users.length === 0 ? '<div class="prediction-rank-row"><span class="prediction-rank-name" style="color: #666666;">' + t('no_participants') + '</span><span class="prediction-rank-picks"></span></div>' : ''}
                    </div>
                </div>
            `;
        }
    }

    html += '</div>';

    if (html === '<div class="prediction-rankings-container"></div>') {
        html = `<div class="loading">${t('no_data_to_display')}</div>`;
    }

    container.innerHTML = html;
}

function renderStageBlock(stageKey, stage) {
    // ========== ПОЛУЧАЕМ СТАТУС С УЧЁТОМ stageKey ==========
    const status = getStageStatus(stage, stageKey);

    const isActive = stage.votingActive || false;
    const isRankingVisible = stage.rankingVisible || false;

    const statusTexts = getStatusTexts(stageKey);
    const statusClass = {
        active: 'active',
        closed: 'closed',
        upcoming: 'upcoming'
    };
    
    // Используем полученный статус
    const statusText = statusTexts[status] || statusTexts.upcoming;

    // Форматируем дату в UTC для разных этапов
    let deadlineText = '';
    if (stageKey === 'arenaVotes') {
        if (isActive) {
            const tournamentEnd = scheduleData.periodEnd;
            if (tournamentEnd) {
                let endDate = new Date(tournamentEnd);
                if (!isNaN(endDate.getTime())) {
                    const year = endDate.getUTCFullYear();
                    const month = String(endDate.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(endDate.getUTCDate()).padStart(2, '0');
                    const hours = String(endDate.getUTCHours()).padStart(2, '0');
                    const minutes = String(endDate.getUTCMinutes()).padStart(2, '0');
                    deadlineText = `${t('voting_deadline_until_tournament_end')} ${day}.${month}.${year} ${hours}:${minutes} UTC`;
                }
            }
        }
    } else if (stageKey === 'grandFinal' && isActive) {
        const matchDate = getGrandFinalMatchTime();
        if (matchDate) {
            const year = matchDate.getUTCFullYear();
            const month = String(matchDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(matchDate.getUTCDate()).padStart(2, '0');
            const hours = String(matchDate.getUTCHours()).padStart(2, '0');
            const minutes = String(matchDate.getUTCMinutes()).padStart(2, '0');
            deadlineText = `${t('predictions_deadline_before_match')} ${day}.${month}.${year} ${hours}:${minutes} UTC`;
        }
    } else if (stageKey === 'playoffs' && isActive) {
        const firstMatchDate = getFirstPlayoffMatchTime();
        if (firstMatchDate) {
            const year = firstMatchDate.getUTCFullYear();
            const month = String(firstMatchDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(firstMatchDate.getUTCDate()).padStart(2, '0');
            const hours = String(firstMatchDate.getUTCHours()).padStart(2, '0');
            const minutes = String(firstMatchDate.getUTCMinutes()).padStart(2, '0');
            deadlineText = `${t('predictions_deadline_before_first_match')} ${day}.${month}.${year} ${hours}:${minutes} UTC`;
        }
    } else if (isActive) {
        const firstMatchDate = getFirstGroupMatchTime();
        if (firstMatchDate) {
            const year = firstMatchDate.getUTCFullYear();
            const month = String(firstMatchDate.getUTCMonth() + 1).padStart(2, '0');
            const day = String(firstMatchDate.getUTCDate()).padStart(2, '0');
            const hours = String(firstMatchDate.getUTCHours()).padStart(2, '0');
            const minutes = String(firstMatchDate.getUTCMinutes()).padStart(2, '0');
            deadlineText = `${t('predictions_deadline_before_first_match')} ${day}.${month}.${year} ${hours}:${minutes} UTC`;
        } else if (stage.endDate) {
            const end = new Date(stage.endDate);
            const year = end.getUTCFullYear();
            const month = String(end.getUTCMonth() + 1).padStart(2, '0');
            const day = String(end.getUTCDate()).padStart(2, '0');
            const hours = String(end.getUTCHours()).padStart(2, '0');
            const minutes = String(end.getUTCMinutes()).padStart(2, '0');
            deadlineText = `${t('predictions_deadline_until')} ${day}.${month}.${year} ${hours}:${minutes} UTC`;
        }
    }

    let html = `
        <div class="prediction-stage-block" id="prediction-block-${stageKey}">
            <div class="prediction-stage-header" data-status="${status}" onclick="togglePredictionStage('${stageKey}')">
                <h3>${stage.name || stageKey}</h3>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span class="prediction-stage-status ${statusClass[status]}">${statusTexts[status]}</span>
                    <span class="prediction-stage-toggle">▼</span>
                </div>
            </div>
            <div class="prediction-stage-content">
    `;

    // Кнопка голосования
    if (isActive && stage.formUrl && stage.formUrl !== '#') {
        if (stageKey === 'arenaVotes') {
            html += `<a href="${stage.formUrl}" target="_blank" class="prediction-vote-btn prediction-vote-btn-icon" title="${t('support_team_button')}">
                        <img src="image/chat.png" alt="${t('support_team_button')}" class="prediction-vote-icon">
                    </a>`;
        } else {
            html += `<a href="${stage.formUrl}" target="_blank" class="prediction-vote-btn">${t('leave_prediction_button')}</a>`;
        }
    }

    // Информация о сроках
    if (deadlineText) {
        html += `<div class="prediction-deadline">${deadlineText}</div>`;
    }

    // Диаграмма - создаётся для всех этапов
    const chartTitle = (stageKey === 'arenaVotes') ? t('prediction_chart_title_arena') : t('prediction_chart_title_default');
    html += `<div class="prediction-chart-title">${chartTitle}</div>`
    html += `<div id="prediction-chart-${stageKey}" class="prediction-chart-container">`;
    html += `<div class="prediction-stage-loading"><div class="mini-spinner"></div><div class="mini-text">${t('loading_data')}</div></div>`;
    html += `</div>`;

    // Таблицы рейтинга (всегда создаём контейнер, но показываем только если rankingVisible = true)
    if (stage.hasRanking === true) {
        html += `<div class="prediction-chart-title" style="margin-top: 1rem;">${t('prediction_rankings_title')}</div>`;
        html += `<div id="prediction-rankings-${stageKey}" class="prediction-rankings-container">`;
        if (isRankingVisible) {
            html += `<div class="prediction-stage-loading"><div class="mini-spinner"></div><div class="mini-text">${t('loading_ranking')}</div></div>`;
        } else {
            let waitingText = '';
            if (stageKey === 'playoffs') {
                waitingText = t('will_be_available_after_grand_final_teams');
            } else if (stageKey === 'grandFinal') {
                waitingText = t('will_be_available_after_grand_final');
            } else {
                waitingText = t('will_be_available_after_group_stage');
            }
            html += `<div class="loading" style="text-align: center; padding: 1rem; color: #888888;">${waitingText}</div>`;
        }
        html += `</div>`;
    }

    html += `
            </div>
        </div>
    `;

    return html;
}

// Переключение блока
window.togglePredictionStage = function(stageKey) {
    const block = document.getElementById(`prediction-block-${stageKey}`);
    if (block) {
        block.classList.toggle('open');
    }
};

function exportRankingToClipboard() {
    let exportText = 'СПИСОК УЧАСТНИКОВ ДЛЯ РОЗЫГРЫША\n\n';
    
    // ГРУППОВОЙ ЭТАП
    const groupContainer = document.getElementById('prediction-rankings-groupStage');
    if (groupContainer) {
        exportText += '***ГРУППОВОЙ ЭТАП***\n\n';
        
        const tables = groupContainer.querySelectorAll('.prediction-rank-table');
        tables.forEach(table => {
            const title = table.querySelector('.prediction-rank-title');
            if (!title) return;
            const category = title.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
            
            const rows = table.querySelectorAll('.prediction-rank-row');
            const users = [];
            rows.forEach(row => {
                const nameSpan = row.querySelector('.prediction-rank-name');
                if (nameSpan) {
                    const name = nameSpan.textContent.trim();
                    if (name && name !== 'Нет участников' && name !== 'Ничего не найдено' && !name.includes(',')) {
                        users.push(name);
                    }
                }
            });
            
            if (users.length > 0) {
                exportText += `_${category}_ (${users.length}):\n`;
                users.forEach(user => exportText += `${user}\n`);
                exportText += '\n';
            }
        });
    }
    
    // ПЛЕЙ-ОФФ
    const playoffsContainer = document.getElementById('prediction-rankings-playoffs');
    if (playoffsContainer) {
        exportText += '***ПЛЕЙ-ОФФ***\n\n';
        
        const tables = playoffsContainer.querySelectorAll('.prediction-rank-table');
        tables.forEach(table => {
            const title = table.querySelector('.prediction-rank-title');
            if (!title) return;
            const category = title.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
            
            const rows = table.querySelectorAll('.prediction-rank-row');
            const users = [];
            rows.forEach(row => {
                const nameSpan = row.querySelector('.prediction-rank-name');
                if (nameSpan) {
                    const name = nameSpan.textContent.trim();
                    if (name && name !== 'Нет участников' && name !== 'Ничего не найдено' && !name.includes(',')) {
                        users.push(name);
                    }
                }
            });
            
            if (users.length > 0) {
                exportText += `_${category}_ (${users.length}):\n`;
                users.forEach(user => exportText += `${user}\n`);
                exportText += '\n';
            }
        });
    }
    
    // ГРАНД-ФИНАЛ
    const grandContainer = document.getElementById('prediction-rankings-grandFinal');
    if (grandContainer) {
        exportText += '***ГРАНД-ФИНАЛ***\n\n';
        
        const tables = grandContainer.querySelectorAll('.prediction-rank-table');
        tables.forEach(table => {
            const title = table.querySelector('.prediction-rank-title');
            if (!title) return;
            const category = title.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
            
            const rows = table.querySelectorAll('.prediction-rank-row');
            const users = [];
            rows.forEach(row => {
                const nameSpan = row.querySelector('.prediction-rank-name');
                if (nameSpan) {
                    const name = nameSpan.textContent.trim();
                    if (name && name !== 'Нет участников' && name !== 'Ничего не найдено' && !name.includes(',')) {
                        users.push(name);
                    }
                }
            });
            
            if (users.length > 0) {
                exportText += `_${category}_ (${users.length}):\n`;
                users.forEach(user => exportText += `${user}\n`);
                exportText += '\n';
            }
        });
    }
    
    if (exportText === 'СПИСОК УЧАСТНИКОВ ДЛЯ РОЗЫГРЫША\n\n') {
        alert('Нет данных для экспорта');
        return;
    }
    
    navigator.clipboard.writeText(exportText).then(function() {
        const btn = document.getElementById('export-ranking-btn');
        const originalText = btn.textContent;
        btn.textContent = 'СКОПИРОВАНО!';
        playSound('success');
        setTimeout(function() {
            btn.textContent = originalText;
        }, 2000);
    }).catch(function(err) {
        console.error('Ошибка копирования:', err);
        alert('Не удалось скопировать текст. Попробуйте вручную.');
    });
}

// Принудительное создание кнопки экспорта (только для админа)
function ensureExportButton() {
    // Кнопка нужна только администратору
    if (!isAdmin) {
        console.log('Export button: not admin, skipping');
        return;
    }

    const modalBody = document.getElementById('prediction-modal-body');
    if (!modalBody) {
        console.log('Modal body not found, will retry in 100ms');
        setTimeout(ensureExportButton, 100);
        return;
    }

    let exportBtn = document.getElementById('export-ranking-btn');
    if (exportBtn) {
        exportBtn.style.display = 'inline-flex';
        exportBtn.textContent = t('export_ranking_button');
        exportBtn.removeEventListener('click', exportRankingToClipboard);
        exportBtn.addEventListener('click', exportRankingToClipboard);
        return;
    }

    // Создаём контейнер и кнопку
    const btnContainer = document.createElement('div');
    btnContainer.style.display = 'flex';
    btnContainer.style.justifyContent = 'flex-end';
    btnContainer.style.marginBottom = '1rem';

    exportBtn = document.createElement('button');
    exportBtn.id = 'export-ranking-btn';
    exportBtn.className = 'export-ranking-btn';
    exportBtn.style.display = 'inline-flex';
    exportBtn.textContent = t('export_ranking_button');
    exportBtn.addEventListener('click', exportRankingToClipboard);

    btnContainer.appendChild(exportBtn);

    // Вставляем в начало modal-body
    modalBody.insertBefore(btnContainer, modalBody.firstChild);

}

// ==================== ПОИСК В РЕЙТИНГЕ ====================

let currentRankingsDataGlobal = null;
let currentRankingsTypeGlobal = null;

function filterRankings(searchText) {
    if (!currentRankingsDataGlobal) return;

    const searchLower = searchText.toLowerCase().trim();
    const tables = document.querySelectorAll('.prediction-rank-table');

    tables.forEach(table => {
        const rows = table.querySelectorAll('.prediction-rank-row');
        let hasVisibleRows = false;

        rows.forEach(row => {
            const nameSpan = row.querySelector('.prediction-rank-name');
            if (nameSpan && nameSpan.innerText !== 'Нет участников') {
                const name = nameSpan.textContent.toLowerCase();
                if (searchLower === '' || name.includes(searchLower)) {
                    row.style.display = 'flex';
                    hasVisibleRows = true;
                } else {
                    row.style.display = 'none';
                }
            }
        });

        const existingNoResult = table.querySelector('.no-result-message');
        if (existingNoResult) {
            existingNoResult.remove();
        }

        const rowsContainer = table.querySelector('.prediction-rank-rows');
        const regularRows = table.querySelectorAll('.prediction-rank-row');
        const hasRegularRows = regularRows.length > 0;

        if (!hasVisibleRows && hasRegularRows && searchLower !== '') {
            const msgDiv = document.createElement('div');
            msgDiv.className = 'prediction-rank-row no-result-message';
            msgDiv.innerHTML = '<span class="prediction-rank-name" style="color: #666666;">Ничего не найдено</span><span class="prediction-rank-picks"></span>';
            if (rowsContainer) {
                rowsContainer.appendChild(msgDiv);
            }
        }
    });
}

function renderRankingsWithSearch(containerId, data, type) {
    currentRankingsDataGlobal = data;
    currentRankingsTypeGlobal = type;
    renderRankings(containerId, data, type);

    const searchInput = document.getElementById('prediction-search-input');
    if (searchInput && searchInput.value) {
        setTimeout(() => {
            filterRankings(searchInput.value);
        }, 50);
    }
}

function initRankingsSearch() {
    const searchInput = document.getElementById('prediction-search-input');
    const clearBtn = document.getElementById('prediction-search-clear');

    if (!searchInput) {
        console.log('Search input not found, will retry in 200ms');
        setTimeout(initRankingsSearch, 200);
        return;
    }

    const newSearchInput = searchInput.cloneNode(true);
    searchInput.parentNode.replaceChild(newSearchInput, searchInput);

    let newClearBtn = null;
    if (clearBtn && clearBtn.parentNode) {
        newClearBtn = clearBtn.cloneNode(true);
        clearBtn.parentNode.replaceChild(newClearBtn, clearBtn);
    }

    newSearchInput.addEventListener('input', (e) => {
        filterRankings(e.target.value);
        if (typeof playSound === 'function') playSound('click');
    });

    if (newClearBtn) {
        newClearBtn.addEventListener('click', () => {
            newSearchInput.value = '';
            filterRankings('');
            newSearchInput.focus();
            if (typeof playSound === 'function') playSound('click');
        });
    }

}

// Фоновая загрузка всех данных в кеш (только для зрителей)
async function backgroundLoadAllPredictions() {
    if (isAdmin) return;
    
    console.log('Background loading predictions...');
    const promises = [];

    for (const [key, stage] of Object.entries(PREDICTION_CONFIG)) {
        if (!stage || !stage.statsUrl || stage.statsUrl === '#') continue;

        // Проверяем кеш
        const cached = getPredictionFromCache(key);
        if (cached) {
            console.log(`Already cached for ${key}`);
            continue;
        }

        console.log(`Background loading ${key}...`);
        const promise = loadPredictionDataWithCache(key, stage)
            .then(data => {
                if (data && data.success) {
                    console.log(`Background loaded ${key}`);
                } else {
                    console.warn(`Background load ${key} failed:`, data?.error || 'Unknown error');
                }
            })
            .catch(error => console.error(`Background load error for ${key}:`, error));

        promises.push(promise);
    }

    if (promises.length > 0) {
        await Promise.all(promises);
        console.log('Background loading complete');
    }
}

// Открытие модального окна прогнозов
async function openPredictionModal() {
    if (isPredictionModalOpen) return;

    stopFabWaitingAnimation();
    isPredictionModalOpen = true;

    const modal = document.getElementById('prediction-modal');
    const contentDiv = document.getElementById('prediction-content');

    if (!modal || !contentDiv) return;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    if (isAdmin) {
        ensureExportButton();
    }

    initPredictionDates();
    updatePredictionStagesStatus();
    startArenaIconWaitingAnimation();

    // Рендерим блоки
    let html = '';
    for (const [key, stage] of Object.entries(PREDICTION_CONFIG)) {
        if (!stage) continue;
        html += renderStageBlock(key, stage);
    }
    contentDiv.innerHTML = html;

    // Открываем первый блок (Арена голосов)
    const arenaBlock = document.getElementById('prediction-block-arenaVotes');
    if (arenaBlock) {
        arenaBlock.classList.add('open');
    } else {
        const groupBlock = document.getElementById('prediction-block-groupStage');
        if (groupBlock) {
            groupBlock.classList.add('open');
        }
    }

    // Загружаем данные для ВСЕХ этапов
    for (const [key, stage] of Object.entries(PREDICTION_CONFIG)) {
        if (!stage) continue;

        // ========== АРЕНА ГОЛОСОВ ==========
        if (key === 'arenaVotes') {
            (async () => {
                const chartContainerId = `prediction-chart-${key}`;
                try {
                    let data = null;
                    if (stage.statsUrl && stage.statsUrl !== '') {
                        data = await loadPredictionDataWithCache(key, stage);
                    } else {
                        console.log(`${key} - waiting for Apps Script URL`);
                        data = { success: true, chart: {} };
                    }

                    if (data && data.success && data.chart) {
                        const chartContainer = document.getElementById(chartContainerId);
                        if (chartContainer) {
                            renderChart(chartContainerId, data.chart, []);
                        }
                    }
                } catch (error) {
                    console.error(`Error loading data for ${key}:`, error);
                    const chartContainer = document.getElementById(chartContainerId);
                    if (chartContainer) {
                        chartContainer.innerHTML = `<div class="loading" style="text-align: center; padding: 1rem; color: #cc6666;">${t('error_loading_data')}</div>`;
                    }
                }
            })();
            continue;
        }

        // ========== ГРУППОВОЙ ЭТАП ==========
        if (key === 'groupStage') {
            if (!stage.statsUrl || stage.statsUrl === '#') continue;
            
            (async () => {
                const chartContainerId = `prediction-chart-${key}`;
                const rankingsContainerId = `prediction-rankings-${key}`;

                try {
                    const data = await loadPredictionDataWithCache(key, stage);

                    if (data && data.success) {

                        // Диаграмма
                        if (stage.hasRanking !== false && data.chart) {
                            const chartContainer = document.getElementById(chartContainerId);
                            if (chartContainer) {
                                renderChart(chartContainerId, data.chart, data.actualTeams || [], 'groupStage');
                            }
                        }

                        // Рейтинг участников (только если rankingVisible = true)
                        if (stage.hasRanking === true && stage.rankingVisible && data.rankings) {
                            const rankingsContainer = document.getElementById(rankingsContainerId);
                            if (rankingsContainer) {
                                renderRankingsWithSearch(rankingsContainerId, data.rankings, stage.rankingType);
                            }
                        } else if (stage.hasRanking === true && !stage.rankingVisible) {
                            const rankingsContainer = document.getElementById(rankingsContainerId);
                            if (rankingsContainer) {
                                rankingsContainer.innerHTML = `<div class="loading" style="text-align: center; padding: 1rem; color: #888888;">${t('will_be_available_after_group_stage')}</div>`;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error loading data for ${key}:`, error);
                    const chartContainer = document.getElementById(chartContainerId);
                    if (chartContainer) {
                        chartContainer.innerHTML = `<div class="loading" style="text-align: center; padding: 1rem; color: #cc6666;">${t('error_loading_data')}</div>`;
                    }
                }
            })();
        }
        
        // ========== ПЛЕЙ-ОФФ ==========
        if (key === 'playoffs') {
            if (!stage.statsUrl || stage.statsUrl === '#') continue;
            
            (async () => {
                const chartContainerId = `prediction-chart-${key}`;
                const rankingsContainerId = `prediction-rankings-${key}`;

                try {
                    const data = await loadPredictionDataWithCache(key, stage);

                    if (data && data.success) {

                        // Диаграмма
                        if (stage.hasRanking !== false && data.chart) {
                            const chartContainer = document.getElementById(chartContainerId);
                            if (chartContainer) {
                                renderChart(chartContainerId, data.chart, data.actualTeams || [], 'playoffs');
                            }
                        }

                        // Рейтинг участников
                        if (stage.hasRanking === true && stage.rankingVisible && data.rankings) {
                            const rankingsContainer = document.getElementById(rankingsContainerId);
                            if (rankingsContainer) {
                                renderRankingsWithSearch(rankingsContainerId, data.rankings, stage.rankingType);
                            }
                        } else if (stage.hasRanking === true && !stage.rankingVisible) {
                            const rankingsContainer = document.getElementById(rankingsContainerId);
                            if (rankingsContainer) {
                                rankingsContainer.innerHTML = `<div class="loading" style="text-align: center; padding: 1rem; color: #888888;">${t('will_be_available_after_grand_final_teams')}</div>`;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error loading data for ${key}:`, error);
                    const chartContainer = document.getElementById(chartContainerId);
                    if (chartContainer) {
                        chartContainer.innerHTML = `<div class="loading" style="text-align: center; padding: 1rem; color: #cc6666;">${t('error_loading_data')}</div>`;
                    }
                }
            })();
        }

        // ========== ГРАНД-ФИНАЛ ==========
        if (key === 'grandFinal') {
            if (!stage.statsUrl || stage.statsUrl === '#') continue;
            
            (async () => {
                const chartContainerId = `prediction-chart-${key}`;
                const rankingsContainerId = `prediction-rankings-${key}`;
                
                try {
                    const data = await loadPredictionDataWithCache(key, stage);
                    
                    if (data && data.success) {
                        
                        // Диаграмма
                        if (stage.hasRanking !== false && data.chart) {
                            const chartContainer = document.getElementById(chartContainerId);
                            if (chartContainer) {
                                renderChart(chartContainerId, data.chart, [], 'grandFinal');
                            }
                        }
                        
                        // Рейтинг участников
                        if (stage.hasRanking === true && stage.rankingVisible && data.rankings) {
                            const rankingsContainer = document.getElementById(rankingsContainerId);
                            if (rankingsContainer) {
                                renderRankingsWithSearch(rankingsContainerId, data.rankings, stage.rankingType);
                            }
                        } else if (stage.hasRanking === true && !stage.rankingVisible) {
                            const rankingsContainer = document.getElementById(rankingsContainerId);
                            if (rankingsContainer) {
                                rankingsContainer.innerHTML = `<div class="loading" style="text-align: center; padding: 1rem; color: #888888;">${t('will_be_available_after_grand_final')}</div>`;
                            }
                        }
                    }
                } catch (error) {
                    console.error(`Error loading data for ${key}:`, error);
                    const chartContainer = document.getElementById(chartContainerId);
                    if (chartContainer) {
                        chartContainer.innerHTML = `<div class="loading" style="text-align: center; padding: 1rem; color: #cc6666;">${t('error_loading_data')}</div>`;
                    }
                }
            })();
        }
    }
}

// Закрытие модального окна
function closePredictionModal() {
    const modal = document.getElementById('prediction-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
        isPredictionModalOpen = false;

        // Очищаем контент при закрытии
        const contentDiv = document.getElementById('prediction-content');
        if (contentDiv) {
            contentDiv.innerHTML = '<div class="loading">Загрузка...</div>';
        }

        // Перезапускаем анимацию кнопки
        startFabWaitingAnimation();
        stopArenaIconWaitingAnimation();
    }
}

// Инициализация кнопки прогнозов
function initPredictionModal() {
    const fab = document.getElementById('prediction-fab');
    const modal = document.getElementById('prediction-modal');
    const closeBtn = document.querySelector('.prediction-modal-close');

    if (fab) {
        fab.addEventListener('click', openPredictionModal);

        // Запускаем анимацию подёргивания для кнопки
        startFabWaitingAnimation();
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closePredictionModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closePredictionModal();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                closePredictionModal();
            }
        });
    }
}

// Запуск периодической анимации кнопки прогнозов
let fabAnimationInterval = null;

function startFabWaitingAnimation() {
    const fab = document.getElementById('prediction-fab');
    if (!fab) return;

    // Очищаем предыдущий интервал, если есть
    if (fabAnimationInterval) {
        clearInterval(fabAnimationInterval);
        fabAnimationInterval = null;
    }

    // Запускаем анимацию каждые 15 секунд
    fabAnimationInterval = setInterval(() => {
        fab.classList.add('waiting');

        setTimeout(() => {
            fab.classList.remove('waiting');
        }, 500);
    }, 15000);
}

// Запуск периодической анимации для иконки Арены голосов
let arenaIconAnimationInterval = null;

function startArenaIconWaitingAnimation() {
    // Очищаем старый интервал
    if (arenaIconAnimationInterval) {
        clearInterval(arenaIconAnimationInterval);
        arenaIconAnimationInterval = null;
    }
    
    // Функция поиска иконки и запуска анимации
    function tryStart() {
        const icon = document.querySelector('.prediction-vote-icon');
        if (!icon) {
            // Иконка ещё не появилась, пробуем снова через 200мс
            setTimeout(tryStart, 200);
            return;
        }
        
        // Иконка найдена, запускаем интервал
        arenaIconAnimationInterval = setInterval(() => {
            const currentIcon = document.querySelector('.prediction-vote-icon');
            if (currentIcon) {
                currentIcon.classList.add('waiting');
                setTimeout(() => {
                    if (currentIcon) currentIcon.classList.remove('waiting');
                }, 500);
            }
        }, 10000);
    }
    
    tryStart();
}

function stopArenaIconWaitingAnimation() {
    if (arenaIconAnimationInterval) {
        clearInterval(arenaIconAnimationInterval);
        arenaIconAnimationInterval = null;
    }
}

// Остановка анимации (если нужно)
function stopFabWaitingAnimation() {
    if (fabAnimationInterval) {
        clearInterval(fabAnimationInterval);
        fabAnimationInterval = null;
    }
}

// ==================== АРЕНА ГОЛОСОВ - ГОНКА ====================

let arenaRaceInterval = null;
let arenaRaceAnimationTimer = null;
let arenaRaceData = null;
let arenaRaceIsAnimating = false;

// Получение данных для гонки (использует JSONP)
async function fetchArenaRaceData() {
    try {
        const arenaStage = PREDICTION_CONFIG.arenaVotes;
        if (!arenaStage || !arenaStage.statsUrl) return null;
        
        // Используем ту же функцию с JSONP
        const data = await loadPredictionDataWithCache('arenaVotes', arenaStage);
        
        if (data && data.success && data.chart) {
            arenaRaceData = data.chart;
            return arenaRaceData;
        }
        return null;
    } catch (error) {
        console.error('Fetch arena race data error:', error);
        return null;
    }
}

// Рендер полосок гонки
function renderArenaRaceBars(data) {
    const track = document.getElementById('arena-race-track');
    if (!track) return;

    if (!data || Object.keys(data).length === 0) {
        track.innerHTML = '';
        return;
    }

    // Общее количество голосов (для сортировки, но не для отображения)
    const maxVotes = Math.max(...Object.values(data));
    if (maxVotes === 0) {
        track.innerHTML = '';
        return;
    }

    // Сортируем по количеству голосов (от большего к меньшему)
    const sorted = Object.entries(data).sort((a, b) => b[1] - a[1]);

    let html = '';
    for (const [team, votes] of sorted) {
        // Для ширины полоски: относительно лидера (лидер = 100%)
        const barPercent = (votes / maxVotes * 100);
        
        const avatarUrl = window.teamAvatars ? window.teamAvatars[team] : '';
        const avatarHtml = avatarUrl ? `<img src="${avatarUrl}" class="arena-race-avatar" alt="" onerror="this.style.display='none'">` : `<div class="arena-race-avatar" style="width:36px;height:36px;"></div>`;

        html += `
            <div class="arena-race-bar" data-team="${escapeHtml(team)}" data-percent="${barPercent}">
                <div class="arena-race-fill" style="width: 0%;"></div>
                ${avatarHtml}
            </div>
        `;
    }

    track.innerHTML = html;
}

// Анимация гонки
function animateArenaRace() {
    const bars = document.querySelectorAll('.arena-race-bar');
    if (!bars.length) return;

    arenaRaceIsAnimating = true;

    // Сбрасываем все полоски и аватары в начальное положение
    bars.forEach(bar => {
        const fill = bar.querySelector('.arena-race-fill');
        const avatar = bar.querySelector('.arena-race-avatar');
        if (fill) {
            fill.style.transition = 'none';
            fill.style.width = '0%';
        }
        if (avatar) {
            avatar.style.transition = 'none';
            avatar.style.left = '0px';
        }
        bar.classList.remove('animating');
    });

    // Принудительный пересчёт стилей
    void bars[0].offsetHeight;

    // Запускаем анимацию
    setTimeout(() => {
        bars.forEach(bar => {
            const fill = bar.querySelector('.arena-race-fill');
            const avatar = bar.querySelector('.arena-race-avatar');
            const percent = parseFloat(bar.dataset.percent);
            const barWidth = bar.offsetWidth;
            const avatarWidth = avatar ? avatar.offsetWidth : 36;
            
            if (avatar && !isNaN(percent)) {
                // Аватар движется первым
                const maxLeft = barWidth - avatarWidth;
                let leftPos = (percent / 100) * barWidth;
                leftPos = Math.max(0, Math.min(leftPos, maxLeft));
                avatar.style.transition = 'left 13s cubic-bezier(0.33, 1, 0.68, 1)';
                avatar.style.left = leftPos + 'px';
            }
            
            if (fill && !isNaN(percent)) {
                // Линия заполняется до центра аватара
                // Используем тот же leftPos, что и у аватара, но с учётом ширины аватара
                const avatarLeftPos = parseFloat(avatar.style.left) || 0;
                const fillWidthPercent = (avatarLeftPos + avatarWidth / 2) / barWidth * 100;
                fill.style.transition = 'width 13s cubic-bezier(0.33, 1, 0.68, 1)';
                fill.style.width = Math.min(fillWidthPercent, 100) + '%';
            }
            
            bar.classList.add('animating');
        });

        setTimeout(() => {
            arenaRaceIsAnimating = false;
        }, 13200);
    }, 50);
}

// Запуск гонки (обновляем данные и анимируем)
async function runArenaRace() {
    if (arenaRaceIsAnimating) return;
    
    const newData = await fetchArenaRaceData();
    if (!newData) return;
    
    arenaRaceData = newData;
    renderArenaRaceBars(arenaRaceData);
    animateArenaRace();
    
    // Обновляем таймер на следующий запуск
    const timerSpan = document.querySelector('.arena-race-timer');
    if (timerSpan) {
        let countdown = 90;
        timerSpan.textContent = `Следующая гонка: ${countdown}с`;
        
        if (arenaRaceAnimationTimer) clearInterval(arenaRaceAnimationTimer);
        arenaRaceAnimationTimer = setInterval(() => {
            countdown--;
            if (countdown <= 0) {
                clearInterval(arenaRaceAnimationTimer);
                timerSpan.textContent = `Следующая гонка: 30с`;
            } else {
                timerSpan.textContent = `Следующая гонка: ${countdown}с`;
            }
        }, 1000);
    }
}

// Показать/скрыть блок гонки (на главном экране)
function setArenaRaceVisibility(visible) {
    const container = document.getElementById('arena-race-container');
    if (!container) return;
    
    if (visible && arenaRaceData && Object.keys(arenaRaceData).length > 0) {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// Инициализация гонки
async function initArenaRace() {
    // Загружаем данные
    arenaRaceData = await fetchArenaRaceData();

    if (arenaRaceData && Object.keys(arenaRaceData).length > 0) {
        renderArenaRaceBars(arenaRaceData);
        setArenaRaceVisibility(true);

        // Запускаем анимацию сразу после рендера
        animateArenaRace();

        // Запускаем интервал повторения каждые 45 секунд
        if (arenaRaceInterval) clearInterval(arenaRaceInterval);
        arenaRaceInterval = setInterval(() => {
            runArenaRace();
        }, 90000);
    } else {
        setArenaRaceVisibility(false);
    }
    
    // Инициализируем кнопку скрытия/показа
    initArenaRaceToggle();
}

// Остановка гонки (при необходимости)
function stopArenaRace() {
    if (arenaRaceInterval) {
        clearInterval(arenaRaceInterval);
        arenaRaceInterval = null;
    }
    if (arenaRaceAnimationTimer) {
        clearInterval(arenaRaceAnimationTimer);
        arenaRaceAnimationTimer = null;
    }
}

// ==================== КНОПКА СКРЫТИЯ/ПОКАЗА ДЛЯ ГОНКИ ====================

function initArenaRaceToggle() {
    const container = document.getElementById('arena-race-container');
    const trigger = document.querySelector('.arena-race-trigger');
    
    if (!container || !trigger) return;
    
    function toggleRace() {
        container.classList.toggle('collapsed');
        const nowCollapsed = container.classList.contains('collapsed');
        localStorage.setItem('arena_race_collapsed', nowCollapsed);
        
        if (nowCollapsed) {
            if (arenaRaceInterval) {
                clearInterval(arenaRaceInterval);
                arenaRaceInterval = null;
            }
        } else {
            if (arenaRaceData && Object.keys(arenaRaceData).length > 0) {
                if (arenaRaceInterval) clearInterval(arenaRaceInterval);
                arenaRaceInterval = setInterval(() => {
                    runArenaRace();
                }, 90000);
                animateArenaRace();
            }
        }
    }
    
    trigger.addEventListener('click', toggleRace);
    
    const isCollapsed = localStorage.getItem('arena_race_collapsed') === 'true';
    if (isCollapsed) {
        container.classList.add('collapsed');
    }
}

setInterval(updateUTCTime, 10000);
updateUTCTime();

window.addEventListener('DOMContentLoaded', start);

// ==================== ГЛОБАЛЬНЫЙ ОБРАБОТЧИК ОШИБОК ====================
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    
    if (event.error && event.error.message && 
        (event.error.message.includes('undefined') || 
         event.error.message.includes('null') ||
         event.error.message.includes('teamAvatars'))) {
        
        const statusDiv = document.getElementById('sync-status');
        if (statusDiv && !statusDiv.innerHTML.includes('ошибка')) {
            statusDiv.innerHTML = '<div class="status-error">⚠️ Произошла техническая ошибка. Обновите страницу (F5).</div>';
            setTimeout(() => {
                if (statusDiv.innerHTML.includes('техническая ошибка')) {
                    statusDiv.innerHTML = '';
                }
            }, 5000);
        }
    }
    
    return false;
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    
    const statusDiv = document.getElementById('sync-status');
    if (statusDiv && !statusDiv.innerHTML.includes('ошибка')) {
        statusDiv.innerHTML = '<div class="status-error">⚠️ Ошибка соединения. Проверьте интернет.</div>';
        setTimeout(() => {
            if (statusDiv.innerHTML.includes('Ошибка соединения')) {
                statusDiv.innerHTML = '';
            }
        }, 5000);
    }
});

// ==================== РАБОТА С СОСТАВАМИ КОМАНД ====================

async function loadTeamRosters() {
    // Сначала проверяем localStorage
    try {
        const cached = localStorage.getItem(TEAM_ROSTERS_CACHE_KEY);
        if (cached) {
            const data = JSON.parse(cached);
            // Проверяем структуру данных
            if (data && data.timestamp && data.data && typeof data.data === 'object') {
                if ((Date.now() - data.timestamp) < TEAM_ROSTERS_CACHE_DURATION) {
                    console.log('Team rosters loaded from localStorage');
                    const rosters = data.data;
                    teamRostersCache = { timestamp: data.timestamp, data: rosters };
                    window._rosters = rosters;
                    calculateTotalPowers(rosters);
                    updateTournamentDataWithMVP(rosters);
                    return rosters;
                }
            } else {
                console.warn('Invalid cache structure, removing...');
                localStorage.removeItem(TEAM_ROSTERS_CACHE_KEY);
            }
        }
    } catch (e) {
        console.warn('Error reading team rosters cache:', e);
        // Если кеш поврежден, удаляем его
        try {
            localStorage.removeItem(TEAM_ROSTERS_CACHE_KEY);
        } catch(removeError) {
            // Игнорируем ошибку удаления
        }
    }

    // Если в кеше нет или он устарел, грузим с сервера
    try {
        console.log('Loading team rosters from server...');
        const response = await fetch(`${TEAM_ROSTERS_URL}?action=getTeamRosters`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.rosters && typeof data.rosters === 'object') {
            // Сохраняем в глобальную переменную для быстрого доступа
            window._rosters = data.rosters;
            
            // Сохраняем в localStorage
            try {
                localStorage.setItem(TEAM_ROSTERS_CACHE_KEY, JSON.stringify({
                    timestamp: Date.now(),
                    data: data.rosters
                }));
            } catch (e) {
                console.warn('Error saving team rosters to localStorage:', e);
            }
            
            // Сохраняем в переменную для обратной совместимости
            teamRostersCache = {
                timestamp: Date.now(),
                data: data.rosters
            };
            
            calculateTotalPowers(data.rosters);
            updateTournamentDataWithMVP(data.rosters);
            return data.rosters;
        } else {
            console.warn('Invalid response structure:', data);
            return null;
        }
    } catch (error) {
        console.error('loadTeamRosters error:', error);
        // Если есть старый кеш, но он просрочен, используем его как fallback
        try {
            const fallbackCache = localStorage.getItem(TEAM_ROSTERS_CACHE_KEY);
            if (fallbackCache) {
                const data = JSON.parse(fallbackCache);
                if (data && data.data) {
                    console.log('Using expired cache as fallback');
                    window._rosters = data.data;
                    return data.data;
                }
            }
        } catch(fallbackError) {
            // Игнорируем
        }
        return null;
    }
}

function updateTournamentDataWithMVP(rosters) {
    if (!rosters) return;
}

function calculateTotalPowers(rosters) {
    teamTotalPowerCache = {};
    for (const [teamName, players] of Object.entries(rosters)) {
        let total = 0;
        for (const player of players) {
            total += player.power || 0;
        }
        teamTotalPowerCache[teamName] = total;
    }
}

function getTeamTotalPower(teamName) {
    return teamTotalPowerCache[teamName] || 0;
}

function formatPowerDisplay(power) {
    if (power >= 1000000000) {
        return (power / 1000000000).toFixed(1) + 'B';
    }
    if (power >= 1000000) {
        return (power / 1000000).toFixed(1) + 'M';
    }
    if (power >= 1000) {
        return (power / 1000).toFixed(0) + 'K';
    }
    return power.toString();
}

// ==================== WINRATE ЦВЕТА ====================
function getWinrateColor(winrate) {
    if (winrate === null || winrate === undefined || isNaN(winrate)) return '#888888';
    if (winrate <= 46) return '#cc5555';   // Красный (не едкий)
    if (winrate <= 48) return '#e8a040';   // Оранжевый
    if (winrate <= 51) return '#e8d040';   // Желтый
    if (winrate <= 56) return '#6aaf6a';   // Зеленый
    if (winrate <= 63) return '#40b8b8';   // Бирюзовый
    return '#b870d4';                      // Фиолетовый
}

function formatWinrate(winrate) {
    if (winrate === null || winrate === undefined || isNaN(winrate)) return '';
    // Если winrate целое число, показываем без .0
    if (winrate % 1 === 0) {
        return winrate.toFixed(0) + '%';
    }
    return winrate.toFixed(1) + '%';
}

function getTeamAverageWinrate(players) {
    if (!players || players.length === 0) return null;
    let total = 0;
    let count = 0;
    for (const player of players) {
        const winrate = player.winrate !== undefined ? parseFloat(player.winrate) : null;
        if (winrate !== null && !isNaN(winrate)) {
            total += winrate;
            count++;
        }
    }
    if (count === 0) return null;
    return total / count;
}

async function showTeamRoster(teamName) {
    let rosters = window._rosters;

    if (!rosters) {
        rosters = await loadTeamRosters();
    }

    if (!rosters || !rosters[teamName]) {
        return;
    }

    const players = rosters[teamName];
    const totalPower = getTeamTotalPower(teamName);
    const averageWinrate = getTeamAverageWinrate(players);
    const avgWinrateColor = getWinrateColor(averageWinrate);
    const avgWinrateText = averageWinrate !== null ? averageWinrate.toFixed(1) + '%' : '—';

    let html = '<div id="team-roster-modal" class="roster-modal">';
    html += '<button class="roster-modal-close">&times;</button>';
    html += '<div class="roster-modal-content compact">';
    html += '<div class="roster-modal-header compact">';
    html += '<div class="roster-modal-header-compact-left">';
    html += getAvatarHtml(teamName);
    html += '<h3>' + escapeHtml(teamName) + '</h3>';
    html += '</div>';
    html += '<div class="roster-modal-header-compact-right" style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px;">';
    html += '<div style="display: flex; align-items: center; gap: 8px;">';
    html += '<span class="total-power-label">Players:</span>';
    html += '<span class="total-power-value" style="color: #ccaa66; font-size: 0.9rem;">' + players.length + '</span>';
    html += '</div>';
    html += '<div style="display: flex; align-items: center; gap: 8px;">';
    html += '<span class="total-power-label">Avg WR:</span>';
    html += '<span class="total-winrate-value" style="color: ' + avgWinrateColor + ';">' + avgWinrateText + '</span>';
    html += '</div>';
    html += '<div style="display: flex; align-items: center; gap: 8px;">';
    html += '<span class="total-power-label">Total Pow:</span>';
    html += '<span class="total-power-value">' + formatPowerDisplay(totalPower) + '</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="roster-table-container compact">';
    html += '<div class="roster-list compact">';

    // ========== ЗАГОЛОВОК ТАБЛИЦЫ ==========
    html += '<div class="roster-table-header">';
    html += '<span class="header-item" style="min-width: 50px; max-width: 50px; text-align: center;">MVP</span>';
    html += '<span class="header-item" style="min-width: 55px; max-width: 55px; text-align: center;">KD</span>';
    html += '<span class="header-item name" style="text-align: center;">Name</span>';
    html += '<span class="header-item" style="min-width: 55px; max-width: 55px; text-align: center;">WR</span>';
    html += '<span class="header-item" style="min-width: 65px; max-width: 65px; text-align: center;">Power</span>';
    html += '</div>';;

    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        const displayName = truncateNameWithFormat(player.name);
        const kingdom = escapeHtml(player.kingdom);
        const power = formatPowerDisplay(player.power);
        const mvpClass = player.mvp ? ' mvp-player' : '';

        // ========== WINRATE ==========
        const winrate = player.winrate !== undefined ? parseFloat(player.winrate) : null;
        const winrateColor = getWinrateColor(winrate);
        const winrateText = formatWinrate(winrate);
        const winrateHtml = winrateText ? '<span class="roster-winrate-bracket" style="color: ' + winrateColor + '; --winrate-color: ' + winrateColor + ';">' + winrateText + '</span>' : '<span class="roster-winrate-bracket" style="color: #555555;">—</span>';

        let mvpDisplayHtml = '';
        if (player.mvp) {
            const match = player.mvp.match(/MVP\s*x\s*(\d+)/i);
            if (match) {
                mvpDisplayHtml = '<span class="mvp-display"><img src="image/MVP.png" class="mvp-icon" alt="MVP"><span class="mvp-count">x ' + match[1] + '</span></span>';
            } else {
                mvpDisplayHtml = '<span class="mvp-display"><img src="image/MVP.png" class="mvp-icon" alt="MVP"><span class="mvp-count">x 1</span></span>';
            }
        }

        html += '<div class="roster-row compact' + mvpClass + '" title="' + escapeHtml(player.name) + '">';
        html += '<span class="roster-mvp-bracket" style="min-width: 50px; max-width: 50px;">' + mvpDisplayHtml + '</span>';
        html += '<span class="roster-kingdom-bracket" style="min-width: 55px; max-width: 55px; text-align: center;">[' + kingdom + ']</span>';
        html += '<span class="roster-name-bracket">' + displayName + '</span>';
        html += winrateHtml;
        html += '<span class="roster-power-bracket" style="min-width: 65px; max-width: 65px;">' + power + '</span>';
        html += '</div>';
        html += '\n';
    }

    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    const existingModal = document.getElementById('team-roster-modal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', html);

    const modal = document.getElementById('team-roster-modal');
    const closeBtn = modal.querySelector('.roster-modal-close');

    closeBtn.onclick = function() { modal.remove(); };
    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };
}

// ==================== СРАВНЕНИЕ СОСТАВОВ КОМАНД В МАТЧЕ ====================

async function showMatchComparison(team1Name, team2Name) {
    let rosters = window._rosters;

    if (!rosters) {
        rosters = await loadTeamRosters();
    }

    if (!rosters) {
        return;
    }

    const team1Players = rosters[team1Name] || [];
    const team2Players = rosters[team2Name] || [];
    const team1Power = getTeamTotalPower(team1Name);
    const team2Power = getTeamTotalPower(team2Name);

    let html = '<div id="match-compare-modal" class="match-compare-modal">';
    html += '<button class="match-compare-close">&times;</button>';
    html += '<div class="match-compare-content">';
    html += '<div class="match-compare-body">';

    // ==================== КОМАНДА 1 (СЛЕВА) ====================
    const avgWinrate1 = getTeamAverageWinrate(team1Players);
    const avgColor1 = getWinrateColor(avgWinrate1);
    const avgText1 = avgWinrate1 !== null ? avgWinrate1.toFixed(1) + '%' : '—';

    html += '<div class="match-compare-team">';
    html += '<div class="match-compare-team-header">';
    html += getAvatarHtml(team1Name);
    html += '<h3>' + escapeHtml(team1Name) + '</h3>';
    html += '<div class="match-compare-stats-right">';
    html += '<div style="display: flex; align-items: center; gap: 6px;">';
    html += '<span style="color: #888888; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">Players:</span>';
    html += '<span style="color: #ccaa66; font-size: 0.85rem; font-weight: 700;">' + team1Players.length + '</span>';
    html += '</div>';
    html += '<div style="display: flex; align-items: center; gap: 6px;">';
    html += '<span style="color: #888888; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">Avg WR:</span>';
    html += '<span class="match-compare-avg-winrate" style="color: ' + avgColor1 + '; font-size: 0.85rem; font-weight: 700;">' + avgText1 + '</span>';
    html += '</div>';
    html += '<div style="display: flex; align-items: center; gap: 6px;">';
    html += '<span style="color: #888888; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">Total Pow:</span>';
    html += '<span class="match-compare-power-value">' + formatPowerDisplay(team1Power) + '</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="match-compare-list">';

    // ========== ЗАГОЛОВОК ЛЕВОЙ КОМАНДЫ ==========
    html += '<div class="match-compare-header">';
    html += '<span class="header-item" style="min-width: 55px; max-width: 55px;">MVP</span>';
    html += '<span class="header-item" style="min-width: 55px; max-width: 55px;">KD</span>';
    html += '<span class="header-item name">Name</span>';
    html += '<span class="header-item" style="min-width: 55px; max-width: 55px;">WR</span>';
    html += '<span class="header-item" style="min-width: 70px; max-width: 70px;">Power</span>';
    html += '</div>';

    for (let i = 0; i < team1Players.length; i++) {
        const player = team1Players[i];
        const displayName = formatPlayerName(player.name);
        const kingdom = escapeHtml(player.kingdom);
        const power = formatPowerDisplay(player.power);
        const mvpClass = player.mvp ? ' mvp-player' : '';

        // ========== WINRATE ==========
        const winrate = player.winrate !== undefined ? parseFloat(player.winrate) : null;
        const winrateColor = getWinrateColor(winrate);
        const winrateText = formatWinrate(winrate);
        const winrateHtml = winrateText ? '<span class="match-compare-winrate-bracket" style="color: ' + winrateColor + '; --winrate-color: ' + winrateColor + ';">' + winrateText + '</span>' : '<span class="match-compare-winrate-bracket" style="color: #555555;">—</span>';

        let mvpDisplayHtml = '';
        if (player.mvp) {
            const match = player.mvp.match(/MVP\s*x\s*(\d+)/i);
            if (match) {
                mvpDisplayHtml = '<span class="mvp-display"><img src="image/MVP.png" class="mvp-icon" alt="MVP"><span class="mvp-count">x ' + match[1] + '</span></span>';
            } else {
                mvpDisplayHtml = '<span class="mvp-display"><img src="image/MVP.png" class="mvp-icon" alt="MVP"><span class="mvp-count">x 1</span></span>';
            }
        }

        html += '<div class="match-compare-row' + mvpClass + ' winrate-gradient" title="' + escapeHtml(player.name) + '">';
        html += '<span class="match-compare-mvp" style="min-width: 55px; max-width: 55px;">' + mvpDisplayHtml + '</span>';
        html += '<span class="match-compare-kingdom" style="min-width: 55px; max-width: 55px;">[' + kingdom + ']</span>';
        html += '<span class="match-compare-name">' + displayName + '</span>';
        html += winrateHtml;
        html += '<span class="match-compare-power-val" style="min-width: 70px; max-width: 70px;">' + power + '</span>';
        html += '</div>';
        html += '\n';
    }

    if (team1Players.length === 0) {
        html += '<div class="match-compare-empty">Нет данных о составе</div>';
    }
    html += '</div>';
    html += '</div>';

    // ==================== VS ПО ЦЕНТРУ ====================
    html += '<div class="match-compare-vs-center">';
    html += '<div class="match-compare-vs-icon"><span class="vs-v">V</span><span class="vs-slash">/</span><span class="vs-s">S</span></div>';
    html += '</div>';

    // ==================== КОМАНДА 2 (СПРАВА) ====================
    const avgWinrate2 = getTeamAverageWinrate(team2Players);
    const avgColor2 = getWinrateColor(avgWinrate2);
    const avgText2 = avgWinrate2 !== null ? avgWinrate2.toFixed(1) + '%' : '—';

    html += '<div class="match-compare-team">';
    html += '<div class="match-compare-team-header right">';
    html += '<div class="match-compare-stats-left">';
    html += '<div style="display: flex; align-items: center; gap: 6px;">';
    html += '<span style="color: #ccaa66; font-size: 0.85rem; font-weight: 700;">' + team2Players.length + '</span>';
    html += '<span style="color: #888888; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">:Players</span>';
    html += '</div>';
    html += '<div style="display: flex; align-items: center; gap: 6px;">';
    html += '<span class="match-compare-avg-winrate" style="color: ' + avgColor2 + '; font-size: 0.85rem; font-weight: 700;">' + avgText2 + '</span>';
    html += '<span style="color: #888888; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">:Avg WR</span>';
    html += '</div>';
    html += '<div style="display: flex; align-items: center; gap: 6px;">';
    html += '<span class="match-compare-power-value">' + formatPowerDisplay(team2Power) + '</span>';
    html += '<span style="color: #888888; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.5px;">:Total Pow</span>';
    html += '</div>';
    html += '</div>';
    html += '<h3>' + escapeHtml(team2Name) + '</h3>';
    html += getAvatarHtml(team2Name);
    html += '</div>';
    html += '<div class="match-compare-list">';

    // ========== ЗАГОЛОВОК ПРАВОЙ КОМАНДЫ ==========
    html += '<div class="match-compare-header">';
    html += '<span class="header-item" style="min-width: 70px; max-width: 70px;">Power</span>';
    html += '<span class="header-item" style="min-width: 55px; max-width: 55px;">WR</span>';
    html += '<span class="header-item name">Name</span>';
    html += '<span class="header-item" style="min-width: 55px; max-width: 55px;">KD</span>';
    html += '<span class="header-item" style="min-width: 55px; max-width: 55px;">MVP</span>';
    html += '</div>';

    for (let i = 0; i < team2Players.length; i++) {
        const player = team2Players[i];
        const displayName = formatPlayerName(player.name);
        const kingdom = escapeHtml(player.kingdom);
        const power = formatPowerDisplay(player.power);
        const mvpClass = player.mvp ? ' mvp-player' : '';

        // ========== WINRATE ==========
        const winrate = player.winrate !== undefined ? parseFloat(player.winrate) : null;
        const winrateColor = getWinrateColor(winrate);
        const winrateText = formatWinrate(winrate);
        const winrateHtml = winrateText ? '<span class="match-compare-winrate-bracket" style="color: ' + winrateColor + '; --winrate-color: ' + winrateColor + ';">' + winrateText + '</span>' : '<span class="match-compare-winrate-bracket" style="color: #555555;">—</span>';

        let mvpDisplayHtml = '';
        if (player.mvp) {
            const match = player.mvp.match(/MVP\s*x\s*(\d+)/i);
            if (match) {
                mvpDisplayHtml = '<span class="mvp-display"><img src="image/MVP.png" class="mvp-icon" alt="MVP"><span class="mvp-count">x ' + match[1] + '</span></span>';
            } else {
                mvpDisplayHtml = '<span class="mvp-display"><img src="image/MVP.png" class="mvp-icon" alt="MVP"><span class="mvp-count">x 1</span></span>';
            }
        }

        html += '<div class="match-compare-row' + mvpClass + ' winrate-gradient" title="' + escapeHtml(player.name) + '">';
        html += '<span class="match-compare-power-val" style="min-width: 70px; max-width: 70px;">' + power + '</span>';
        html += winrateHtml;
        html += '<span class="match-compare-name">' + displayName + '</span>';
        html += '<span class="match-compare-kingdom" style="min-width: 55px; max-width: 55px;">[' + kingdom + ']</span>';
        html += '<span class="match-compare-mvp" style="min-width: 55px; max-width: 55px;">' + mvpDisplayHtml + '</span>';
        html += '</div>';
        html += '\n';
    }

    if (team2Players.length === 0) {
        html += '<div class="match-compare-empty">Нет данных о составе</div>';
    }
    html += '</div>';
    html += '</div>';

    html += '</div>';
    html += '</div>';
    html += '</div>';

    const existingModal = document.getElementById('match-compare-modal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', html);

    const modal = document.getElementById('match-compare-modal');
    const closeBtn = modal.querySelector('.match-compare-close');
    const content = modal.querySelector('.match-compare-content');

    if (closeBtn) {
        closeBtn.onclick = function(e) {
            e.stopPropagation();
            modal.remove();
        };
    }

    modal.onclick = function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    };

    if (content) {
        content.onclick = function(e) {
            e.stopPropagation();
        };
    }
}

// ==================== УПРАВЛЕНИЕ MVP (АДМИН-ПАНЕЛЬ) ====================

let mvpEditData = {};

async function openMVPManager() {
    if (!isAdmin) {
        showStatus('status_admin_required', 'error');
        return;
    }

    const rosters = await loadTeamRosters();
    if (!rosters) {
        showStatus('Не удалось загрузить составы команд', 'error');
        return;
    }

    mvpEditData = {};
    let allPlayers = [];

    for (const [teamName, players] of Object.entries(rosters)) {
        for (const player of players) {
            const key = teamName + '|||' + player.name;
            const currentMVP = player.mvp || '';
            let currentCount = 0;
            if (currentMVP) {
                const match = currentMVP.match(/MVP\s*x\s*(\d+)/i);
                if (match) {
                    currentCount = parseInt(match[1]);
                } else {
                    currentCount = 1;
                }
            }
            mvpEditData[key] = currentCount;
            allPlayers.push({
                team: teamName,
                name: player.name,
                key: key,
                current: currentCount
            });
        }
    }

    allPlayers.sort((a, b) => a.team.localeCompare(b.team) || a.name.localeCompare(b.name));

    let html = '<div id="mvp-manager-modal" class="mvp-manager-modal">';
    html += '<div class="mvp-manager-content">';
    html += '<div class="mvp-manager-header">';
    html += '<h2> Управление MVP</h2>';
    html += '<button class="mvp-manager-close">&times;</button>';
    html += '</div>';
    html += '<div class="mvp-manager-body">';
    html += '<div class="mvp-manager-list">';

    let currentTeam = '';
    for (const player of allPlayers) {
        if (player.team !== currentTeam) {
            if (currentTeam !== '') {
                html += '</div>';
            }
            currentTeam = player.team;
            html += '<div class="mvp-team-group">';
            html += '<div class="mvp-team-title">' + escapeHtml(player.team) + '</div>';
        }

        html += '<div class="mvp-player-row">';
        html += '<span class="mvp-player-name">' + escapeHtml(player.name) + '</span>';
        html += '<div class="mvp-controls">';
        html += '<button class="mvp-minus" data-key="' + escapeHtml(player.key) + '">−</button>';
        html += '<input type="number" class="mvp-input" id="mvp-input-' + escapeHtml(player.key) + '" value="' + player.current + '" min="0" max="99">';
        html += '<button class="mvp-plus" data-key="' + escapeHtml(player.key) + '">+</button>';
        html += '</div>';
        html += '</div>';
    }
    if (currentTeam !== '') {
        html += '</div>';
    }

    html += '</div>';
    html += '</div>';
    html += '<div class="mvp-manager-footer">';
    html += '<button id="mvp-save-btn" class="btn-primary">💾 Сохранить MVP</button>';
    html += '<button id="mvp-close-btn" class="btn-secondary">Закрыть</button>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    const existingModal = document.getElementById('mvp-manager-modal');
    if (existingModal) existingModal.remove();

    document.body.insertAdjacentHTML('beforeend', html);

    const modal = document.getElementById('mvp-manager-modal');

    modal.querySelector('.mvp-manager-close').onclick = function() { modal.remove(); };
    modal.querySelector('#mvp-close-btn').onclick = function() { modal.remove(); };
    modal.onclick = function(e) {
        if (e.target === modal) modal.remove();
    };

    modal.querySelectorAll('.mvp-plus').forEach(btn => {
        btn.onclick = function() {
            const key = this.dataset.key;
            const input = document.getElementById('mvp-input-' + key);
            if (input) {
                input.value = parseInt(input.value) + 1;
            }
        };
    });

    modal.querySelectorAll('.mvp-minus').forEach(btn => {
        btn.onclick = function() {
            const key = this.dataset.key;
            const input = document.getElementById('mvp-input-' + key);
            if (input && parseInt(input.value) > 0) {
                input.value = parseInt(input.value) - 1;
            }
        };
    });

    document.getElementById('mvp-save-btn').onclick = async function() {
        const mvpData = {};
        for (const player of allPlayers) {
            const input = document.getElementById('mvp-input-' + player.key);
            if (input) {
                const count = parseInt(input.value) || 0;
                mvpData[player.key] = count > 0 ? (count === 1 ? 'MVP' : 'MVP x' + count) : '';
            }
        }

        this.textContent = '⏳ Сохранение...';
        this.disabled = true;

        try {
            const response = await fetch(TEAM_ROSTERS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: new URLSearchParams({
                    action: 'saveMVP',
                    data: JSON.stringify(mvpData)
                }).toString()
            });

            const result = await response.json();

            if (result.success) {
                showStatus('✅ MVP сохранены! Обновлено: ' + result.updated + ' игроков', 'success');
                playSound('success');

                // Полная перезагрузка данных
                localStorage.removeItem('prediction_cache');
                teamRostersCache = null;
                teamTotalPowerCache = {};
                
                await loadTeamRosters();

                // Перерисовка всех таблиц
                renderGroups();
                renderPlayoffs();
                renderResults();

                // Закрываем все открытые модальные окна
                const rosterModal = document.getElementById('team-roster-modal');
                if (rosterModal) rosterModal.remove();
                
                const compareModal = document.getElementById('match-compare-modal');
                if (compareModal) compareModal.remove();

                setTimeout(() => {
                    modal.remove();
                }, 800);

            } else {
                showStatus('❌ Ошибка: ' + (result.error || 'неизвестная'), 'error');
                playSound('error');
            }
        } catch (error) {
            console.error('Save MVP error:', error);
            showStatus('❌ Ошибка сохранения', 'error');
            playSound('error');
        }

        this.textContent = '💾 Сохранить MVP';
        this.disabled = false;
    };;
}

// ==================== КНОПКА УВЕЛИЧИТЬ ФОНД ====================
function initFundSupport() {
    const link = document.getElementById('fund-support-link-schedule');
    if (link) {
        // Левая кнопка
        link.addEventListener('click', function(e) {
            e.preventDefault();
            playSound('click');
            window.open('https://dalink.to/kraken_khronicles', '_blank');
        });

        // Средняя кнопка (колесико)
        link.addEventListener('mousedown', function(e) {
            if (e.button === 1) { // 1 = средняя кнопка
                e.preventDefault();
                playSound('click');
                window.open('https://dalink.to/kraken_khronicles', '_blank');
            }
        });

        const donationLink = document.querySelector('.donation-link');
        if (donationLink) {
            donationLink.addEventListener('mousedown', function(e) {
                if (e.button === 1) {
                    e.preventDefault();
                    window.open(this.href, '_blank');
                }
            });
        }
    }
}

// ==================== ОБРАБОТЧИК КЛИКОВ ====================
document.body.addEventListener('click', function(e) {
    // 1. Открытие сравнения команд при клике на VS в карточке матча
    const vsElement = e.target.closest('.match-vs, .playoff-vs');
    if (vsElement) {
        const matchCard = vsElement.closest('.match-card, .playoff-match-card');
        if (matchCard && matchCard.dataset.team1 && matchCard.dataset.team2) {
            const team1 = matchCard.dataset.team1;
            const team2 = matchCard.dataset.team2;
            if (team1 && team1 !== 'TBD' && team1 !== '' && team2 && team2 !== 'TBD' && team2 !== '') {
                e.stopPropagation();
                showMatchComparison(team1, team2);
                return;
            }
        }
    }
    
    // 2. Открытие состава команды при клике на название команды
    const teamElement = e.target.closest('[data-team-name]');
    if (teamElement) {
        const teamName = teamElement.getAttribute('data-team-name');
        if (teamName && teamName !== 'TBD' && teamName !== '') {
            e.stopPropagation();
            showTeamRoster(teamName);
        }
    }
});

window.forceRefreshCache = function() {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem('prediction_cache');
    location.reload();
    return 'Кеш очищен, страница перезагружается...';
};