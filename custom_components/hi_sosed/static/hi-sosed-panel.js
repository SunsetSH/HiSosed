// HiSosed panel: a view of backend state. It never schedules sound itself (HS-FR-044).

const STRINGS = {
  tab_programs: ["Программы", "Programs"],
  tab_library: ["Библиотека звуков", "Sound library"],
  tab_speakers: ["Колонки", "Speakers"],
  tab_help: ["Справка", "Help"],
  loading: ["Загрузка…", "Loading…"],
  load_failed: ["Не удалось загрузить данные HiSosed", "Could not load HiSosed data"],
  retry: ["Повторить", "Retry"],
  snooze: ["Тишина", "Snooze"],
  snooze_for: ["Тишина на {m} мин", "Snooze {m} min"],
  snoozed_until: ["Тишина до {t}", "Silent until {t}"],
  resume: ["Вернуть звук", "Resume"],
  playing_now: ["Играет: {n}", "Playing: {n}"],
  nothing_playing: ["Сейчас тихо", "Quiet now"],
  new_program: ["Новая программа", "New program"],
  no_programs: ["Программ пока нет. Создайте первую: программа — это набор дорожек со своим расписанием.", "No programs yet. A program is a set of layers with a schedule."],
  pick_program: ["Выберите программу слева или создайте новую.", "Select a program or create a new one."],
  back: ["Назад", "Back"],
  name: ["Название", "Name"],
  schedule_enabled: ["Расписание включено", "Schedule enabled"],
  run_now: ["Запустить сейчас", "Run now"],
  run_for: ["на {m} мин", "for {m} min"],
  run_hours: ["на {h} ч", "for {h} h"],
  manual_until: ["Ручной запуск до {t}", "Manual run until {t}"],
  end_manual: ["Завершить", "End"],
  stop: ["Стоп", "Stop"],
  regenerate: ["Новая сетка", "New grid"],
  duplicate: ["Дублировать", "Duplicate"],
  delete: ["Удалить", "Delete"],
  copy_suffix: ["(копия)", "(copy)"],
  saved: ["Сохранено", "Saved"],
  saving: ["Сохранение…", "Saving…"],
  unsaved: ["Изменения…", "Editing…"],
  save_error: ["Не сохранено", "Not saved"],
  presets: ["Пресеты", "Presets"],
  presets_hint: ["Пресет запоминает, какие дорожки и звуки включены, плотность и громкость. Расписание и колонки не меняются.", "A preset stores which layers and sounds are on, density and volume. Schedules and speakers stay."],
  preset_save: ["Сохранить текущее как пресет", "Save current as preset"],
  preset_name_prompt: ["Название пресета", "Preset name"],
  preset_modified: ["изменён", "modified"],
  preset_overwrite: ["Перезаписать текущим", "Overwrite with current"],
  preset_rename: ["Переименовать", "Rename"],
  preset_manage: ["Управлять", "Manage"],
  done: ["Готово", "Done"],
  no_presets: ["Пресетов нет. Настройте дорожки и сохраните, чтобы потом переключаться в один клик.", "No presets yet. Tune the layers and save one to switch in a click."],
  program_speakers: ["Колонки программы", "Program speakers"],
  no_players: ["В Home Assistant нет ни одного media_player. Откройте вкладку «Колонки» — там описано, как подключить колонку.", "No media_player found. See the Speakers tab for how to connect one."],
  program_schedule: ["Расписание программы", "Program schedule"],
  schedule_hint: ["Несколько интервалов в день дают перерывы. Интервал, где конец раньше начала, идёт через полночь; одинаковые начало и конец — круглые сутки.", "Several ranges per day create breaks. End before start crosses midnight; equal start and end means 24 h."],
  layers: ["Дорожки", "Layers"],
  layers_hint: ["Дорожки играют независимо, каждая по своей случайной сетке. Снимите галочку, чтобы выключить дорожку без удаления.", "Layers play independently on their own random grids. Untick to mute a layer without deleting it."],
  add_layer: ["Добавить дорожку", "Add layer"],
  layer: ["Дорожка", "Layer"],
  layer_on: ["Дорожка включена", "Layer enabled"],
  move_up: ["Выше", "Up"],
  move_down: ["Ниже", "Down"],
  expand: ["Развернуть", "Expand"],
  collapse: ["Свернуть", "Collapse"],
  frequency: ["Частота", "Frequency"],
  density: ["Плотность", "Density"],
  dens_rare: ["Редко", "Rare"],
  dens_some: ["Иногда", "Sometimes"],
  dens_mid: ["Средне", "Medium"],
  dens_often: ["Часто", "Often"],
  dens_all: ["Каждая клетка", "Every cell"],
  slot_seconds: ["Клетка, сек", "Cell, s"],
  slot_count: ["Клеток в цикле", "Cells per cycle"],
  cycle_info: ["Цикл {c} · ≈ {r} звуков в минуту", "Cycle {c} · ≈ {r} sounds per minute"],
  volume: ["Громкость", "Volume"],
  own_volume: ["Своя громкость дорожки", "Layer volume"],
  volume_hint: ["Без галочки используется громкость колонки (если задана во вкладке «Колонки»).", "Unticked: the speaker volume from the Speakers tab is used."],
  overlap: ["Пересечения", "Overlap"],
  overlap_replace: ["Перебивать другие дорожки", "Interrupt other layers"],
  overlap_skip: ["Не перебивать, пропустить звук", "Do not interrupt, skip"],
  when_plays: ["Когда играет", "When it plays"],
  as_program: ["Как у программы", "Same as program"],
  own_schedule: ["Своё расписание", "Own schedule"],
  where_plays: ["Где играет", "Where it plays"],
  own_speakers: ["Свои колонки", "Own speakers"],
  sounds: ["Звуки", "Sounds"],
  add_sounds: ["Добавить звуки", "Add sounds"],
  all_on: ["Все вкл.", "All on"],
  all_off: ["Все выкл.", "All off"],
  no_layer_sounds: ["Звуков нет. Добавьте из библиотеки или перетащите файлы сюда.", "No sounds. Add from the library or drop files here."],
  drop_here: ["Отпустите, чтобы загрузить и добавить", "Drop to upload and add"],
  weight: ["Вес", "Weight"],
  weight_hint: ["Чем больше вес, тем чаще звук выбирается", "Higher weight means more often"],
  play_browser: ["Прослушать в браузере", "Listen in browser"],
  play_speaker: ["Проиграть на колонке", "Play on speaker"],
  remove: ["Убрать", "Remove"],
  played: ["Сыграно", "Played"],
  skipped: ["Пропущено", "Skipped"],
  errors: ["Ошибок", "Errors"],
  cycle_n: ["Цикл {n}", "Cycle {n}"],
  cell_of: ["клетка {i} из {n}", "cell {i} of {n}"],
  legend_past: ["прошла", "past"],
  legend_now: ["сейчас", "now"],
  legend_active: ["будет звук", "sound"],
  legend_silent: ["тишина", "silence"],
  next_event: ["Следующее: {t}", "Next: {t}"],
  grid_waiting: ["Сетка появится в начале окна.", "The grid appears when the window starts."],
  shared_target_warn: ["Дорожки делят одну колонку: один media_player играет один поток, звуки будут сменять друг друга. Для одновременного звучания назначьте дорожкам разные плееры (см. «Колонки» → «Одновременные дорожки»).", "Layers share a speaker: one media_player plays one stream, so sounds replace each other. Give layers different players for true simultaneity (Speakers → Simultaneous layers)."],
  days_short: [["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]],
  add_range: ["Интервал", "Range"],
  copy_all: ["На все дни", "To all days"],
  copy_weekdays: ["На будни", "To weekdays"],
  quick_weekdays: ["Будни 9–18", "Weekdays 9–18"],
  quick_daily: ["Ежедневно 10–22", "Daily 10–22"],
  quick_break: ["С обедом 10–13, 14–19", "Lunch break 10–13, 14–19"],
  quick_clear: ["Очистить", "Clear"],
  day_off: ["выходной", "off"],
  st_disabled: ["Выключена", "Disabled"],
  st_idle: ["Не настроена", "Not configured"],
  st_waiting: ["Ждёт окна", "Waiting"],
  st_running: ["Играет", "Running"],
  st_snoozed: ["Тишина", "Snoozed"],
  st_error: ["Ошибка плеера", "Player error"],
  issue_no_sounds: ["нет включённых звуков", "no enabled sounds"],
  issue_no_targets: ["не выбраны колонки", "no speakers selected"],
  issue_no_schedule: ["в расписании нет интервалов", "no schedule ranges"],
  template_title: ["Новая программа", "New program"],
  tpl_empty: ["Пустая", "Empty"],
  tpl_empty_d: ["Одна дорожка, будни 10:00–18:00.", "One layer, weekdays 10:00–18:00."],
  tpl_break: ["День с перерывом", "Day with a break"],
  tpl_break_d: ["Будни 10–13 и 14–19, суббота 11–16.", "Weekdays 10–13 and 14–19, Saturday 11–16."],
  tpl_two: ["Основа + акценты", "Base + accents"],
  tpl_two_d: ["Частая основная дорожка и редкие акценты, которые не перебивают основу.", "A frequent base layer plus rare accents that never interrupt it."],
  create: ["Создать", "Create"],
  cancel: ["Отмена", "Cancel"],
  confirm: ["Подтвердить", "Confirm"],
  confirm_delete_program: ["Удалить программу «{n}»? Звуки в библиотеке останутся.", "Delete program “{n}”? Library sounds stay."],
  confirm_delete_layer: ["Удалить дорожку «{n}»?", "Delete layer “{n}”?"],
  confirm_delete_preset: ["Удалить пресет «{n}»?", "Delete preset “{n}”?"],
  confirm_delete_sound: ["Удалить звук «{n}»? Файл будет удалён с диска.", "Delete sound “{n}”? The file is removed from disk."],
  confirm_delete_used: ["Звук «{n}» используется в программах ({c}). Удалить его отовсюду?", "Sound “{n}” is used by {c} program(s). Remove it everywhere?"],
  upload_title: ["Загрузка звуков", "Upload sounds"],
  drop_files: ["Перетащите аудиофайлы сюда", "Drop audio files here"],
  or: ["или", "or"],
  choose_files: ["Выбрать файлы на компьютере", "Choose files"],
  upload_limits: ["MP3, WAV, OGG, OPUS, M4A, AAC, FLAC · до {mb} МБ на файл. Файлы попадают в {path}.", "MP3, WAV, OGG, OPUS, M4A, AAC, FLAC · up to {mb} MB each. Files go to {path}."],
  upload_category: ["Категория для новых файлов", "Category for new files"],
  new_category: ["Новая категория…", "New category…"],
  category_prompt: ["Название категории", "Category name"],
  uploaded: ["Загружено: {n}", "Uploaded: {n}"],
  upload_failed: ["Не загружен: {n}", "Failed: {n}"],
  search: ["Поиск", "Search"],
  all_categories: ["Все", "All"],
  scan_folder: ["Найти файлы в папке", "Scan folder"],
  scan_hint: ["Файлы можно скопировать и через Samba в {path}; подпапка станет категорией.", "You can also copy files via Samba into {path}; a subfolder becomes the category."],
  scan_result: ["Найдено новых файлов: {n}", "New files found: {n}"],
  starter: ["Стартовый набор", "Starter pack"],
  starter_result: ["Добавлено звуков: {n}", "Sounds added: {n}"],
  add_uri: ["Добавить по ссылке", "Add by URI"],
  uri_prompt: ["Ссылка media-source:// (из «Медиа» Home Assistant)", "media-source:// URI (from HA Media)"],
  library_empty: ["Библиотека пуста. Загрузите свои звуки или добавьте стартовый набор.", "The library is empty. Upload sounds or add the starter pack."],
  used_in: ["в программах: {n}", "used: {n}"],
  unused: ["не используется", "unused"],
  rename: ["Переименовать", "Rename"],
  test_on: ["Колонка для проверки", "Speaker for testing"],
  picker_title: ["Добавить звуки в дорожку", "Add sounds to layer"],
  picker_add: ["Добавить выбранные ({n})", "Add selected ({n})"],
  already: ["уже в дорожке", "already added"],
  speakers_hint: ["HiSosed не управляет Bluetooth и звуковой картой напрямую: он играет через сущности media_player. Здесь задаётся, как обращаться с каждой колонкой.", "HiSosed does not drive Bluetooth or sound cards directly; it plays through media_player entities. Configure how each speaker is treated."],
  kind: ["Подключение", "Connection"],
  kind_bluetooth: ["Bluetooth", "Bluetooth"],
  kind_jack: ["Jack 3.5 / USB-звуковая карта", "3.5 mm jack / USB sound card"],
  kind_network: ["Сетевая (Cast, Sonos, DLNA…)", "Network (Cast, Sonos, DLNA…)"],
  kind_other: ["Другое", "Other"],
  speaker_volume: ["Громкость при воспроизведении", "Playback volume"],
  warmup: ["Прогрев перед окном, сек", "Warm-up before window, s"],
  warmup_hint: ["Включает колонку и будит Bluetooth тишиной до начала окна, чтобы первый звук не потерялся.", "Turns the speaker on and wakes Bluetooth with silence so the first sound is not lost."],
  keepalive: ["Не давать уснуть", "Keep awake"],
  keepalive_off: ["выкл.", "off"],
  keepalive_every: ["тишина каждые {s} с", "silence every {s} s"],
  keepalive_hint: ["Bluetooth-колонки засыпают и «съедают» начало короткого звука. Тихий клип в долгих паузах держит канал A2DP открытым.", "Bluetooth speakers fall asleep and clip short sounds. A silent clip during long pauses keeps A2DP open."],
  lead: ["Компенсация задержки, мс", "Latency compensation, ms"],
  lead_hint: ["Команда уходит раньше на это время. Для Bluetooth обычно 150–400 мс.", "Commands are sent this much earlier. Bluetooth is usually 150–400 ms."],
  recommended: ["Рекомендуемые настройки", "Recommended settings"],
  test_signal: ["Тестовый сигнал", "Test signal"],
  reset_profile: ["Сбросить", "Reset"],
  state: ["Состояние", "State"],
  unavailable: ["недоступна", "unavailable"],
  guide_title: ["Подключение колонки, если Home Assistant работает в Proxmox", "Connecting a speaker when Home Assistant runs in Proxmox"],
  copy: ["Копировать", "Copy"],
  copied: ["Скопировано", "Copied"],
  help_title: ["Как это работает", "How it works"],
  err_generic: ["Ошибка: {c}", "Error: {c}"],
  done_ok: ["Готово", "Done"],
  sent_to_speaker: ["Отправлено на колонку", "Sent to speaker"],
  no_test_target: ["Выберите колонку для проверки", "Choose a speaker for testing"],
  regenerated: ["Сетка обновлена", "Grid regenerated"],
  conflict_reloaded: ["Программу изменили в другом месте — загружена свежая версия.", "The program changed elsewhere; the latest version is loaded."],
};

const ERRORS = {
  revision_conflict: ["Программу изменили в другом месте", "Changed elsewhere"],
  scenario_not_found: ["Программа не найдена", "Program not found"],
  scenario_not_running: ["Сейчас ничего не играет — новая сетка не нужна", "Nothing is running"],
  missing_name: ["Укажите название", "Name is required"],
  invalid_time: ["Неверное время", "Invalid time"],
  invalid_schedule: ["Неверное расписание", "Invalid schedule"],
  invalid_slot_seconds: ["Клетка: от 1 до 600 секунд", "Cell: 1–600 s"],
  invalid_slot_count: ["Клеток в цикле: от 1 до 1800", "Cells: 1–1800"],
  invalid_density: ["Плотность: 0–100%", "Density: 0–100%"],
  invalid_targets: ["Неверная колонка", "Invalid speaker"],
  unknown_sound: ["Звук удалён из библиотеки", "Sound was removed"],
  sound_in_use: ["Звук используется в программах", "Sound is in use"],
  preset_not_found: ["Пресет не найден", "Preset not found"],
  missing_preset_name: ["Укажите название пресета", "Preset name required"],
  too_many_presets: ["Слишком много пресетов", "Too many presets"],
  no_targets: ["Не выбрана колонка", "No speaker selected"],
  target_unavailable: ["Колонка недоступна", "Speaker unavailable"],
  target_busy: ["Колонка занята предыдущей командой", "Speaker busy"],
  player_timeout: ["Колонка не ответила вовремя", "Speaker timed out"],
  player_error: ["Плеер вернул ошибку", "Player error"],
  unsupported_audio_format: ["Неподдерживаемый или повреждённый аудиофайл", "Unsupported or damaged audio"],
  file_too_large: ["Файл слишком большой", "File too large"],
  library_full: ["Библиотека заполнена", "Library is full"],
  invalid_media_source: ["Нужна ссылка media-source://", "A media-source:// URI is required"],
  invalid_keepalive: ["Интервал «не давать уснуть»: от 15 секунд", "Keep-awake interval: at least 15 s"],
  integration_not_ready: ["HiSosed ещё запускается", "HiSosed is starting"],
  unauthorized: ["Нужны права администратора", "Administrator rights required"],
};

const DENSITY_PRESETS = [["dens_rare", 10], ["dens_some", 25], ["dens_mid", 40], ["dens_often", 70], ["dens_all", 100]];
const RUN_MINUTES = [15, 30, 60, 120, 240];
const SNOOZE_MINUTES = [15, 30, 60, 120, 480];
const KEEPALIVE = [0, 30, 60, 120, 300];
const KINDS = ["bluetooth", "jack", "network", "other"];
const KIND_ICONS = { bluetooth: "mdi:bluetooth-audio", jack: "mdi:audio-input-stereo-minijack", network: "mdi:cast-audio", other: "mdi:speaker" };
const RECOMMENDED = {
  bluetooth: { warmup_seconds: 10, keepalive_seconds: 60, lead_ms: 250 },
  jack: { warmup_seconds: 0, keepalive_seconds: 0, lead_ms: 0 },
  network: { warmup_seconds: 5, keepalive_seconds: 0, lead_ms: 150 },
  other: { warmup_seconds: 0, keepalive_seconds: 0, lead_ms: 0 },
};

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const clone = (value) => JSON.parse(JSON.stringify(value));

// crypto.randomUUID needs a secure context; HA is often opened over plain http on the LAN.
const uuid = () => {
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
};

const emptyWeek = () => ({ days: [[], [], [], [], [], [], []] });
const week = (ranges, days) => ({ days: [0, 1, 2, 3, 4, 5, 6].map((d) => (days.includes(d) ? clone(ranges) : [])) });
const newLayer = (name, extra = {}) => ({
  id: uuid(), name, enabled: true, sounds: [], grid: { slot_seconds: 2, slot_count: 120, density_percent: 30 },
  schedule: null, target_entity_ids: [], volume: null, overlap: "replace", ...extra,
});

const getPath = (obj, path) => path.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
const setPath = (obj, path, value) => {
  const keys = path.split(".");
  const last = keys.pop();
  const target = keys.reduce((acc, key) => acc[key], obj);
  target[last] = value;
};

const formatSize = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

const STYLE = `
:host { --hs-radius: var(--ha-card-border-radius, 14px); --hs-gap: 16px; --hs-accent: var(--primary-color, #03a9f4);
  --hs-muted: var(--secondary-text-color, #6b7280); --hs-line: var(--divider-color, rgba(127,127,127,.25));
  --hs-card: var(--card-background-color, #fff); --hs-soft: var(--secondary-background-color, rgba(127,127,127,.08));
  --hs-ok: var(--success-color, #2e7d32); --hs-warn: var(--warning-color, #ed6c02); --hs-err: var(--error-color, #d32f2f);
  display:block; min-height:100vh; background:var(--primary-background-color); color:var(--primary-text-color);
  font-family: var(--paper-font-body1_-_font-family, Roboto, system-ui, sans-serif); font-size:14px; }
* { box-sizing:border-box; }
button, input, select { font:inherit; color:inherit; }
.toolbar { position:sticky; top:0; z-index:5; display:flex; align-items:center; gap:12px; height:56px; padding:0 12px;
  background:var(--app-header-background-color, var(--primary-color)); color:var(--app-header-text-color, #fff); }
.toolbar h1 { font-size:20px; font-weight:500; margin:0; flex:1; display:flex; align-items:center; gap:8px; }
.toolbar .pill { background:rgba(255,255,255,.18); border-radius:999px; padding:6px 12px; display:flex; align-items:center; gap:6px; white-space:nowrap; }
.toolbar button { background:rgba(255,255,255,.18); border:0; border-radius:999px; padding:7px 12px; cursor:pointer; color:inherit; display:flex; gap:6px; align-items:center; }
.tabs { display:flex; gap:4px; padding:0 12px; background:var(--hs-card); border-bottom:1px solid var(--hs-line); overflow-x:auto; position:sticky; top:56px; z-index:4; }
.tabs button { border:0; background:none; padding:14px 14px 12px; border-bottom:3px solid transparent; cursor:pointer; color:var(--hs-muted); display:flex; gap:6px; align-items:center; white-space:nowrap; }
.tabs button[aria-selected=true] { color:var(--hs-accent); border-bottom-color:var(--hs-accent); font-weight:500; }
main { max-width:1400px; margin:0 auto; padding:var(--hs-gap); }
.split { display:grid; grid-template-columns:300px minmax(0,1fr); gap:var(--hs-gap); align-items:start; }
.card { background:var(--hs-card); border-radius:var(--hs-radius); padding:16px; box-shadow:var(--ha-card-box-shadow, 0 1px 3px rgba(0,0,0,.12)); border:1px solid var(--ha-card-border-color, transparent); }
.card + .card { margin-top:var(--hs-gap); }
.card h2 { font-size:16px; font-weight:500; margin:0 0 4px; display:flex; align-items:center; gap:8px; }
.card h3 { font-size:14px; font-weight:500; margin:16px 0 8px; color:var(--hs-muted); text-transform:uppercase; letter-spacing:.04em; }
.hint { color:var(--hs-muted); font-size:13px; margin:2px 0 12px; line-height:1.45; }
.list { position:sticky; top:120px; display:flex; flex-direction:column; gap:8px; }
.prog { text-align:left; width:100%; border:1px solid var(--hs-line); background:var(--hs-card); border-radius:12px; padding:12px; cursor:pointer; display:grid; gap:4px; }
.prog[aria-current=true] { border-color:var(--hs-accent); box-shadow:0 0 0 1px var(--hs-accent) inset; }
.prog b { font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.prog small { color:var(--hs-muted); }
.btn { display:inline-flex; align-items:center; gap:6px; border:0; border-radius:10px; padding:8px 14px; cursor:pointer; background:var(--hs-accent); color:var(--text-primary-color, #fff); font-weight:500; min-height:36px; }
.btn.ghost { background:var(--hs-soft); color:var(--primary-text-color); }
.btn.danger { background:transparent; color:var(--hs-err); border:1px solid currentColor; }
.btn.small { padding:4px 10px; min-height:30px; font-weight:400; border-radius:8px; }
.btn:disabled { opacity:.45; cursor:default; }
.icon-btn { border:0; background:none; cursor:pointer; padding:6px; border-radius:50%; color:var(--hs-muted); display:inline-flex; }
.icon-btn:hover, .btn.ghost:hover { background:rgba(127,127,127,.18); }
.icon-btn.on { color:var(--hs-accent); }
button:focus-visible, input:focus-visible, select:focus-visible { outline:2px solid var(--hs-accent); outline-offset:2px; }
.row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; }
.row.between { justify-content:space-between; }
.grow { flex:1; min-width:0; }
.fields { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px,1fr)); gap:12px; }
label.field { display:grid; gap:4px; font-size:13px; color:var(--hs-muted); }
input[type=text], input[type=number], input[type=time], select { width:100%; padding:8px 10px; border-radius:8px; border:1px solid var(--hs-line); background:var(--hs-card); min-height:36px; }
input[type=time] { width:auto; min-width:96px; }
input.title { font-size:20px; font-weight:500; border:1px solid transparent; background:transparent; padding:6px 8px; }
input.title:hover, input.title:focus { border-color:var(--hs-line); background:var(--hs-card); }
input[type=range] { width:100%; accent-color:var(--hs-accent); }
input[type=checkbox] { width:18px; height:18px; accent-color:var(--hs-accent); cursor:pointer; flex:none; }
.switch { position:relative; display:inline-flex; align-items:center; gap:8px; cursor:pointer; user-select:none; }
.switch input { position:absolute; opacity:0; width:44px; height:24px; margin:0; cursor:pointer; }
.switch .track { width:40px; height:22px; border-radius:11px; background:rgba(127,127,127,.45); position:relative; transition:background .15s; flex:none; }
.switch .track::after { content:""; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform .15s; }
.switch input:checked + .track { background:var(--hs-accent); }
.switch input:checked + .track::after { transform:translateX(18px); }
.switch input:focus-visible + .track { outline:2px solid var(--hs-accent); outline-offset:2px; }
.badge { display:inline-flex; align-items:center; gap:4px; padding:2px 10px; border-radius:999px; font-size:12px; background:var(--hs-soft); white-space:nowrap; }
.badge::before { content:""; width:8px; height:8px; border-radius:50%; background:currentColor; opacity:.8; }
.badge.running { color:var(--hs-ok); } .badge.waiting { color:var(--hs-accent); } .badge.error { color:var(--hs-err); }
.badge.snoozed, .badge.idle { color:var(--hs-warn); } .badge.disabled { color:var(--hs-muted); }
.chip { display:inline-flex; align-items:center; gap:6px; border:1px solid var(--hs-line); border-radius:999px; padding:5px 12px; background:var(--hs-card); cursor:pointer; font-size:13px; }
.chip[aria-pressed=true] { background:var(--hs-accent); color:var(--text-primary-color,#fff); border-color:var(--hs-accent); }
.chip small { opacity:.75; }
.banner { display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:10px; background:rgba(3,169,244,.12); margin:12px 0; flex-wrap:wrap; }
.banner.warn { background:rgba(237,108,2,.12); }
.layer { border:1px solid var(--hs-line); border-radius:12px; margin-top:12px; overflow:hidden; background:var(--hs-card); }
.layer.off { opacity:.62; }
.layer.dragover { border-color:var(--hs-accent); box-shadow:0 0 0 2px var(--hs-accent) inset; }
.layer-head { display:flex; align-items:center; gap:8px; padding:10px 12px; background:var(--hs-soft); flex-wrap:wrap; }
.layer-head input[type=text] { flex:1; min-width:120px; font-weight:500; }
.layer-body { padding:12px 14px 16px; }
.summary { color:var(--hs-muted); font-size:13px; padding:0 12px 10px; background:var(--hs-soft); }
.grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(11px, 1fr)); gap:3px; margin:8px 0; }
.cell { height:14px; border-radius:3px; border:1px dashed rgba(127,127,127,.45); }
.cell.on { background:var(--hs-accent); border:1px solid var(--hs-accent); }
.cell.past { opacity:.25; }
.cell.now { outline:2px solid var(--primary-text-color); outline-offset:1px; }
.legend { display:flex; gap:14px; flex-wrap:wrap; font-size:12px; color:var(--hs-muted); }
.legend span { display:inline-flex; align-items:center; gap:5px; }
.legend i { display:inline-block; width:12px; height:12px; border-radius:3px; }
.stats { display:flex; gap:14px; flex-wrap:wrap; font-size:13px; color:var(--hs-muted); }
.sound-row { display:flex; align-items:center; gap:8px; padding:6px 0; border-bottom:1px solid var(--hs-line); }
.sound-row:last-child { border-bottom:0; }
.sound-row .name { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.sound-row.off .name { color:var(--hs-muted); text-decoration:line-through; }
.cat { font-size:11px; color:var(--hs-muted); border:1px solid var(--hs-line); border-radius:6px; padding:1px 6px; white-space:nowrap; }
.weight { display:inline-flex; align-items:center; border:1px solid var(--hs-line); border-radius:8px; }
.weight button { border:0; background:none; cursor:pointer; width:26px; height:26px; }
.weight span { min-width:22px; text-align:center; font-variant-numeric:tabular-nums; }
.week { display:grid; gap:6px; }
.day { display:grid; grid-template-columns:44px minmax(0,1fr) auto; gap:8px; align-items:center; padding:6px 0; border-bottom:1px solid var(--hs-line); }
.day:last-child { border-bottom:0; }
.day b { font-weight:500; }
.ranges { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
.range { display:inline-flex; align-items:center; gap:4px; background:var(--hs-soft); border-radius:10px; padding:3px 4px 3px 6px; }
.range input { border:0; background:transparent; min-height:28px; padding:2px; }
.off-label { color:var(--hs-muted); font-size:13px; }
.radio { display:flex; gap:16px; flex-wrap:wrap; margin:4px 0 8px; }
.radio label, .check { display:inline-flex; align-items:center; gap:8px; cursor:pointer; }
.players { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px,1fr)); gap:8px; }
.player { display:flex; gap:10px; align-items:center; border:1px solid var(--hs-line); border-radius:10px; padding:8px 10px; cursor:pointer; }
.player small { display:block; color:var(--hs-muted); }
.dropzone { border:2px dashed var(--hs-line); border-radius:var(--hs-radius); padding:28px 16px; text-align:center; display:grid; gap:10px; justify-items:center; transition:.15s; }
.dropzone.dragover { border-color:var(--hs-accent); background:rgba(3,169,244,.08); }
.dropzone ha-icon { --mdc-icon-size:40px; color:var(--hs-accent); }
.queue { display:grid; gap:6px; margin-top:12px; }
.queue-item { display:grid; grid-template-columns:minmax(0,1fr) 140px; gap:10px; align-items:center; font-size:13px; }
progress { width:100%; height:8px; accent-color:var(--hs-accent); }
.group { margin-top:16px; }
.group summary { cursor:pointer; font-weight:500; padding:6px 0; }
.lib-row { display:grid; grid-template-columns:auto minmax(0,1fr) 160px auto auto; gap:10px; align-items:center; padding:8px 0; border-bottom:1px solid var(--hs-line); }
.lib-row .meta { color:var(--hs-muted); font-size:12px; }
.speaker { display:grid; gap:12px; }
.speaker-head { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
.speaker-head ha-icon { color:var(--hs-accent); }
pre { background:var(--hs-soft); padding:10px 12px; border-radius:8px; overflow-x:auto; font-size:12.5px; margin:6px 0 0; white-space:pre; }
.code { position:relative; }
.code button { position:absolute; top:6px; right:6px; }
.guide ol { padding-left:20px; line-height:1.55; } .guide li { margin:6px 0; }
.guide details { border:1px solid var(--hs-line); border-radius:10px; padding:10px 14px; margin-top:10px; }
.guide summary { cursor:pointer; font-weight:500; }
.toast { position:fixed; left:50%; bottom:24px; transform:translateX(-50%); background:var(--primary-text-color); color:var(--hs-card); padding:10px 16px; border-radius:10px; z-index:20; max-width:90vw; box-shadow:0 4px 16px rgba(0,0,0,.3); }
.toast.err { background:var(--hs-err); color:#fff; }
.modal-bg { position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:30; display:flex; align-items:center; justify-content:center; padding:16px; }
.modal { background:var(--hs-card); border-radius:var(--hs-radius); max-width:640px; width:100%; max-height:86vh; display:flex; flex-direction:column; box-shadow:0 10px 40px rgba(0,0,0,.35); }
.modal header { padding:16px 20px 8px; font-size:18px; font-weight:500; }
.modal .body { padding:0 20px; overflow-y:auto; flex:1; }
.modal footer { padding:12px 20px 16px; display:flex; justify-content:flex-end; gap:8px; flex-wrap:wrap; }
.tpl { display:grid; gap:8px; }
.tpl button { text-align:left; border:1px solid var(--hs-line); border-radius:12px; padding:12px 14px; background:var(--hs-card); cursor:pointer; }
.tpl button[aria-pressed=true] { border-color:var(--hs-accent); box-shadow:0 0 0 1px var(--hs-accent) inset; }
.tpl small { display:block; color:var(--hs-muted); margin-top:2px; }
.save-state { font-size:12px; color:var(--hs-muted); display:inline-flex; gap:4px; align-items:center; }
.save-state.error { color:var(--hs-err); }
.empty { text-align:center; padding:32px 16px; color:var(--hs-muted); display:grid; gap:12px; justify-items:center; }
.empty ha-icon { --mdc-icon-size:48px; opacity:.6; }
.sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); }
@media (max-width: 900px) {
  .split { grid-template-columns:1fr; }
  .list { position:static; }
  .split.has-selection .list { display:none; }
  .split:not(.has-selection) .editor { display:none; }
  .lib-row { grid-template-columns:auto minmax(0,1fr) auto; }
  .lib-row select, .lib-row .meta { grid-column:2 / 4; }
  .toolbar .pill.hide-narrow { display:none; }
}
@media (min-width: 901px) { .only-narrow { display:none !important; } }
`;

class HiSosedPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._tab = "programs";
    this._collapsed = new Set();
    this._uploads = [];
    this._libFilter = "";
    this._libSearch = "";
    this._outputTimers = {};
    this._saveState = "saved";
    this._details = new Map();
  }

  _open(key, fallback) {
    return (this._details.get(key) ?? fallback) ? "open" : "";
  }

  set hass(value) {
    const first = !this._hass;
    this._hass = value;
    if (first) { this._connect(); return; }
    // hass changes on every state change in the house; only player changes matter here.
    const sig = this._players.map((p) => `${p.entity_id}:${p.state}:${p.attributes.friendly_name || ""}`).join("|");
    if (sig !== this._playerSig) { this._playerSig = sig; if (this._data && this._tab !== "help" && this._tab !== "library") this._scheduleRender(); }
  }

  set narrow(value) {
    this._narrow = value;
    const button = this.shadowRoot.querySelector("ha-menu-button");
    if (button) button.narrow = value;
  }

  connectedCallback() {
    if (!this._ticker) this._ticker = setInterval(() => this._tickLive(), 500);
    this._render();
  }

  disconnectedCallback() {
    clearInterval(this._ticker);
    this._ticker = null;
    this._unsub?.then((unsub) => unsub()).catch(() => {});
    this._unsub = null;
    this._audio?.pause();
  }

  // ------------------------------------------------------------------ i18n

  get _ru() { return (this._hass?.locale?.language || this._hass?.language || "ru").startsWith("ru"); }

  t(key, vars = {}) {
    const entry = STRINGS[key];
    let text = entry ? entry[this._ru ? 0 : 1] : key;
    if (typeof text === "string") for (const [name, value] of Object.entries(vars)) text = text.replaceAll(`{${name}}`, value);
    return text;
  }

  _err(error) {
    const code = error?.code || error?.message || String(error);
    const entry = ERRORS[code];
    return entry ? entry[this._ru ? 0 : 1] : this.t("err_generic", { c: code });
  }

  _time(iso, withDay = false) {
    if (!iso) return "";
    const date = new Date(iso);
    const options = { hour: "2-digit", minute: "2-digit", timeZone: this._hass?.config?.time_zone };
    const sameDay = new Date().toDateString() === date.toDateString();
    if (withDay && !sameDay) Object.assign(options, { weekday: "short", day: "numeric", month: "short" });
    try { return date.toLocaleString(this._ru ? "ru-RU" : "en-GB", options); } catch { return date.toLocaleString(); }
  }

  _duration(seconds) {
    if (seconds < 60) return this._ru ? `${seconds} с` : `${seconds} s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 120) return this._ru ? `${minutes} мин` : `${minutes} min`;
    return this._ru ? `${(minutes / 60).toFixed(1)} ч` : `${(minutes / 60).toFixed(1)} h`;
  }

  // ------------------------------------------------------------------ data

  async _ws(type, payload = {}) {
    return this._hass.connection.sendMessagePromise({ type, ...payload });
  }

  async _connect() {
    try {
      await this._reload();
      this._unsub = this._hass.connection.subscribeMessage((event) => this._onEvent(event), { type: "hi_sosed/subscribe" });
      this._hass.connection.addEventListener("ready", () => this._reload());
    } catch (error) {
      this._loadError = this._err(error);
      this._render();
    }
  }

  async _reload() {
    const data = await this._ws("hi_sosed/state");
    this._data = data;
    this._loadError = null;
    this._outputs = Object.fromEntries((data.outputs || []).map((item) => [item.entity_id, item]));
    const selected = data.scenarios.find((item) => item.id === this._selectedId);
    if (!selected) {
      if (this._selectedId && !this._saving) { this._selectedId = null; this._draft = null; }
    } else if (!this._dirty && !this._saving) {
      const fresh = this._strip(selected);
      const same = this._draft && JSON.stringify({ ...this._draft, revision: 0 }) === JSON.stringify({ ...fresh, revision: 0 });
      this._draft = fresh;
      if (same) { this._updateLive(); this._renderChrome(); return; }
    }
    this._scheduleRender();
  }

  _onEvent(event) {
    if (event.config) {
      clearTimeout(this._reloadTimer);
      this._reloadTimer = setTimeout(() => this._reload().catch(() => {}), 150);
      return;
    }
    const scenario = this._data?.scenarios.find((item) => item.id === event.scenario_id);
    if (scenario && event.runtime) {
      scenario.runtime = event.runtime;
      this._updateLive();
    }
  }

  _strip(scenario) {
    const copy = clone(scenario);
    delete copy.runtime;
    delete copy.active_preset_modified;
    return copy;
  }

  get _scenario() { return this._data?.scenarios.find((item) => item.id === this._selectedId); }
  get _sounds() { return Object.fromEntries((this._data?.sounds || []).map((item) => [item.id, item])); }
  get _players() {
    if (!this._hass) return [];
    return Object.values(this._hass.states)
      .filter((state) => state.entity_id.startsWith("media_player."))
      .sort((a, b) => this._playerName(a.entity_id).localeCompare(this._playerName(b.entity_id)));
  }
  _playerName(entityId) { return this._hass?.states[entityId]?.attributes?.friendly_name || entityId; }

  // ------------------------------------------------------------------ saving

  _changed({ render = false } = {}) {
    this._dirty = true;
    this._setSaveState("dirty");
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._flushSave(), 700);
    if (render) this._render();
  }

  _validate(draft) {
    if (!String(draft.name || "").trim()) return "missing_name";
    for (const layer of draft.layers) {
      const { slot_seconds: s, slot_count: c, density_percent: d } = layer.grid;
      if (!(s >= 1 && s <= 600)) return "invalid_slot_seconds";
      if (!(c >= 1 && c <= 1800)) return "invalid_slot_count";
      if (!(d >= 0 && d <= 100)) return "invalid_density";
    }
    const schedules = [draft.schedule, ...draft.layers.map((layer) => layer.schedule).filter(Boolean)];
    for (const schedule of schedules) for (const day of schedule.days) for (const range of day) {
      if (!/^\d\d:\d\d/.test(range.start || "") || !/^\d\d:\d\d/.test(range.end || "")) return "invalid_time";
    }
    return null;
  }

  async _flushSave() {
    clearTimeout(this._saveTimer);
    if (!this._dirty || !this._draft) return;
    if (this._saving) { this._saveAgain = true; return; }
    const problem = this._validate(this._draft);
    if (problem) { this._setSaveState("error", this._err({ code: problem })); return; }
    this._saving = true;
    this._dirty = false;
    this._setSaveState("saving");
    try {
      const { scenario } = await this._ws("hi_sosed/scenario/save", { scenario: this._draft });
      const index = this._data.scenarios.findIndex((item) => item.id === scenario.id);
      if (index >= 0) this._data.scenarios[index] = scenario; else this._data.scenarios.push(scenario);
      if (this._dirty) this._draft.revision = scenario.revision;
      else this._draft = this._strip(scenario);
      this._setSaveState("saved");
      this._renderChrome();
      this._updateLive();
    } catch (error) {
      if (error?.code === "revision_conflict") {
        this._dirty = false;
        this._toast(this.t("conflict_reloaded"), true);
        await this._reload();
        this._render();
      } else {
        this._dirty = true;
        this._setSaveState("error", this._err(error));
      }
    } finally {
      this._saving = false;
      if (this._saveAgain || this._dirty) { this._saveAgain = false; if (this._dirty) this._changed(); }
    }
  }

  _setSaveState(state, message = "") {
    this._saveState = state;
    this._saveMessage = message;
    const el = this.shadowRoot.querySelector("#save-state");
    if (el) { el.className = `save-state ${state === "error" ? "error" : ""}`; el.innerHTML = this._saveStateHtml(); }
  }

  _saveStateHtml() {
    const map = { saved: ["mdi:cloud-check-outline", this.t("saved")], saving: ["mdi:cloud-upload-outline", this.t("saving")],
      dirty: ["mdi:pencil-outline", this.t("unsaved")], error: ["mdi:alert-circle-outline", `${this.t("save_error")}: ${this._saveMessage}`] };
    const [icon, text] = map[this._saveState] || map.saved;
    return `<ha-icon icon="${icon}" style="--mdc-icon-size:16px"></ha-icon>${escapeHtml(text)}`;
  }

  async _act(action, payload = {}, okText = null) {
    await this._flushSave();
    try {
      const result = await this._ws("hi_sosed/scenario/action", { scenario_id: this._selectedId, action, ...payload });
      if (okText) this._toast(okText);
      return result;
    } catch (error) {
      this._toast(this._err(error), true);
      return null;
    }
  }

  async _call(type, payload = {}, okText = null) {
    try {
      const result = await this._ws(type, payload);
      if (okText) this._toast(typeof okText === "function" ? okText(result) : okText);
      return result;
    } catch (error) {
      this._toast(this._err(error), true);
      return null;
    }
  }

  // ------------------------------------------------------------------ rendering

  _focusInside() {
    const active = this.shadowRoot.activeElement;
    return active && ["INPUT", "SELECT", "TEXTAREA"].includes(active.tagName) && active.type !== "checkbox" && active.type !== "range";
  }

  _scheduleRender() {
    if (this._focusInside()) { this._renderPending = true; return; }
    cancelAnimationFrame(this._raf);
    this._raf = requestAnimationFrame(() => this._render());
  }

  _render() {
    if (!this.shadowRoot) return;
    if (!this._styled) {
      this.shadowRoot.innerHTML = `<style>${STYLE}</style><div id="root"></div><div id="overlay"></div>`;
      this._styled = true;
      this._bindRoot();
    }
    const scroll = window.scrollY;
    this.shadowRoot.querySelector("#root").innerHTML = this._html();
    const menu = this.shadowRoot.querySelector("ha-menu-button");
    if (menu) { menu.hass = this._hass; menu.narrow = this._narrow; }
    this._renderPending = false;
    this._updateLive();
    window.scrollTo({ top: scroll });
  }

  _renderChrome() {
    const top = this.shadowRoot.querySelector("#top-status");
    if (top) top.innerHTML = this._topStatusHtml();
    const list = this.shadowRoot.querySelector("#program-list");
    if (list) list.innerHTML = this._programListHtml();
    const presets = this.shadowRoot.querySelector("#presets");
    if (presets && this._draft) presets.outerHTML = this._presetsHtml();
  }

  _html() {
    const tabs = [["programs", "mdi:playlist-music"], ["library", "mdi:folder-music"], ["speakers", "mdi:speaker-wireless"], ["help", "mdi:help-circle-outline"]];
    let body;
    if (this._loadError) {
      body = `<div class="card empty"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div>${escapeHtml(this.t("load_failed"))}: ${escapeHtml(this._loadError)}</div><button class="btn" data-action="retry">${this.t("retry")}</button></div>`;
    } else if (!this._data) {
      body = `<div class="card empty">${this.t("loading")}</div>`;
    } else {
      body = { programs: () => this._programsHtml(), library: () => this._libraryHtml(), speakers: () => this._speakersHtml(), help: () => this._helpHtml() }[this._tab]();
    }
    return `
      <div class="toolbar">
        <ha-menu-button></ha-menu-button>
        <h1><ha-icon icon="mdi:music-note-plus"></ha-icon>HiSosed</h1>
        <div id="top-status" class="row">${this._data ? this._topStatusHtml() : ""}</div>
      </div>
      <nav class="tabs" role="tablist">${tabs.map(([id, icon]) => `<button role="tab" aria-selected="${this._tab === id}" data-action="tab" data-tab="${id}"><ha-icon icon="${icon}" style="--mdc-icon-size:18px"></ha-icon>${this.t(`tab_${id}`)}</button>`).join("")}</nav>
      <main>${body}</main>`;
  }

  _topStatusHtml() {
    const snooze = this._data.settings?.snooze_until;
    const playing = this._data.scenarios.filter((item) => item.runtime?.state === "running").length;
    const status = playing ? this.t("playing_now", { n: playing }) : this.t("nothing_playing");
    if (snooze) {
      return `<span class="pill"><ha-icon icon="mdi:volume-off" style="--mdc-icon-size:18px"></ha-icon>${this.t("snoozed_until", { t: this._time(snooze) })}</span>
        <button data-action="resume"><ha-icon icon="mdi:volume-high" style="--mdc-icon-size:18px"></ha-icon>${this.t("resume")}</button>`;
    }
    return `<span class="pill hide-narrow"><ha-icon icon="${playing ? "mdi:play-circle" : "mdi:pause-circle-outline"}" style="--mdc-icon-size:18px"></ha-icon>${status}</span>
      <button data-action="snooze-menu" aria-haspopup="dialog"><ha-icon icon="mdi:volume-off" style="--mdc-icon-size:18px"></ha-icon>${this.t("snooze")}</button>`;
  }

  // ------------------------------------------------------------------ programs tab

  _programsHtml() {
    return `<div class="split ${this._draft ? "has-selection" : ""}">
      <aside class="list">
        <button class="btn" data-action="new-scenario"><ha-icon icon="mdi:plus"></ha-icon>${this.t("new_program")}</button>
        <div id="program-list" style="display:grid;gap:8px">${this._programListHtml()}</div>
      </aside>
      <section class="editor">${this._draft ? this._editorHtml() : `<div class="card empty"><ha-icon icon="mdi:gesture-tap"></ha-icon>${this._data.scenarios.length ? this.t("pick_program") : this.t("no_programs")}</div>`}</section>
    </div>`;
  }

  _programListHtml() {
    if (!this._data.scenarios.length) return `<p class="hint">${this.t("no_programs")}</p>`;
    return this._data.scenarios.map((item) => {
      const state = item.runtime?.state || "disabled";
      const on = item.layers.filter((layer) => layer.enabled).length;
      const preset = item.presets.find((p) => p.id === item.active_preset_id);
      return `<button class="prog" data-action="select" data-id="${item.id}" aria-current="${item.id === this._selectedId}">
        <b>${escapeHtml(item.id === this._selectedId && this._draft ? this._draft.name : item.name)}</b>
        <span class="row"><span class="badge ${state}">${this.t(`st_${state}`)}</span>${preset ? `<span class="cat">${escapeHtml(preset.name)}</span>` : ""}</span>
        <small>${this.t("layers")}: ${on}/${item.layers.length}${this._nextText(item)}</small>
      </button>`;
    }).join("");
  }

  _nextText(item) {
    const runtime = item.runtime;
    if (runtime?.override_until) return ` · ${this.t("manual_until", { t: this._time(runtime.override_until) })}`;
    const upcoming = Object.values(runtime?.layers || {}).filter((l) => l.state === "waiting" && l.next_event).map((l) => l.next_event).sort()[0];
    return upcoming && runtime.state !== "running" ? ` · ${this._time(upcoming, true)}` : "";
  }

  _editorHtml() {
    const d = this._draft;
    const scenario = this._scenario;
    const runtime = scenario?.runtime || { state: "disabled", layers: {} };
    return `
      <div class="card">
        <div class="row between">
          <button class="btn ghost small only-narrow" data-action="back"><ha-icon icon="mdi:arrow-left"></ha-icon>${this.t("back")}</button>
          <span id="save-state" class="save-state ${this._saveState === "error" ? "error" : ""}">${this._saveStateHtml()}</span>
        </div>
        <div class="row">
          <input class="title grow" type="text" maxlength="80" aria-label="${this.t("name")}" value="${escapeHtml(d.name)}" data-bind="name">
          <span class="badge ${runtime.state}" id="scenario-state">${this.t(`st_${runtime.state}`)}</span>
        </div>
        <div class="row" style="margin-top:8px">
          <label class="switch"><input type="checkbox" data-bind="enabled" data-type="bool" ${d.enabled ? "checked" : ""}><span class="track"></span>${this.t("schedule_enabled")}</label>
        </div>
        <div id="override-banner">${this._overrideHtml(runtime)}</div>
        <div class="row" style="margin-top:12px">
          <button class="btn" data-action="run-menu"><ha-icon icon="mdi:play"></ha-icon>${this.t("run_now")}</button>
          <button class="btn ghost" data-action="stop"><ha-icon icon="mdi:stop"></ha-icon>${this.t("stop")}</button>
          <button class="btn ghost" data-action="regenerate"><ha-icon icon="mdi:dice-multiple"></ha-icon>${this.t("regenerate")}</button>
          <span class="grow"></span>
          <button class="btn ghost small" data-action="duplicate"><ha-icon icon="mdi:content-copy"></ha-icon>${this.t("duplicate")}</button>
          <button class="btn danger small" data-action="delete-scenario"><ha-icon icon="mdi:delete-outline"></ha-icon>${this.t("delete")}</button>
        </div>
      </div>
      ${this._presetsHtml()}
      <div class="card">
        <h2><ha-icon icon="mdi:speaker-multiple"></ha-icon>${this.t("program_speakers")}</h2>
        ${this._playersPicker("target_entity_ids", d.target_entity_ids)}
      </div>
      <div class="card">
        <h2><ha-icon icon="mdi:calendar-clock"></ha-icon>${this.t("program_schedule")}</h2>
        <p class="hint">${this.t("schedule_hint")}</p>
        ${this._weekHtml("schedule", d.schedule)}
      </div>
      <div class="card">
        <h2><ha-icon icon="mdi:layers-triple"></ha-icon>${this.t("layers")}</h2>
        <p class="hint">${this.t("layers_hint")}</p>
        ${this._sharedTargetWarning()}
        ${d.layers.map((layer, index) => this._layerHtml(layer, index, runtime.layers?.[layer.id])).join("")}
        <button class="btn ghost" style="margin-top:12px" data-action="layer-add"><ha-icon icon="mdi:plus"></ha-icon>${this.t("add_layer")}</button>
      </div>`;
  }

  _overrideHtml(runtime) {
    if (!runtime.override_until) return "";
    return `<div class="banner"><ha-icon icon="mdi:timer-play-outline"></ha-icon><span class="grow">${this.t("manual_until", { t: this._time(runtime.override_until) })}</span><button class="btn small ghost" data-action="cancel-run">${this.t("end_manual")}</button></div>`;
  }

  _presetsHtml() {
    const d = this._draft;
    const modified = this._scenario?.active_preset_modified;
    const chips = d.presets.map((preset) => {
      const active = preset.id === d.active_preset_id;
      const manage = this._managePresets
        ? `<span class="row" style="gap:2px"><button class="icon-btn" data-action="preset-overwrite" data-id="${preset.id}" title="${this.t("preset_overwrite")}" aria-label="${this.t("preset_overwrite")}"><ha-icon icon="mdi:content-save-outline"></ha-icon></button><button class="icon-btn" data-action="preset-rename" data-id="${preset.id}" title="${this.t("preset_rename")}" aria-label="${this.t("preset_rename")}"><ha-icon icon="mdi:rename-outline"></ha-icon></button><button class="icon-btn" data-action="preset-delete" data-id="${preset.id}" title="${this.t("delete")}" aria-label="${this.t("delete")}"><ha-icon icon="mdi:delete-outline"></ha-icon></button></span>`
        : "";
      return `<span class="row" style="gap:0"><button class="chip" aria-pressed="${active}" data-action="preset-apply" data-id="${preset.id}"><ha-icon icon="${active ? "mdi:check" : "mdi:tune-variant"}" style="--mdc-icon-size:16px"></ha-icon>${escapeHtml(preset.name)}${active && modified ? ` <small>· ${this.t("preset_modified")}</small>` : ""}</button>${manage}</span>`;
    }).join("");
    return `<div class="card" id="presets">
      <div class="row between"><h2><ha-icon icon="mdi:star-four-points-outline"></ha-icon>${this.t("presets")}</h2>
        ${d.presets.length ? `<button class="btn ghost small" data-action="presets-manage">${this._managePresets ? this.t("done") : this.t("preset_manage")}</button>` : ""}</div>
      <p class="hint">${this.t("presets_hint")}</p>
      <div class="row">${chips || `<span class="hint" style="margin:0">${this.t("no_presets")}</span>`}</div>
      <div class="row" style="margin-top:10px"><button class="btn ghost small" data-action="preset-capture"><ha-icon icon="mdi:plus"></ha-icon>${this.t("preset_save")}</button></div>
    </div>`;
  }

  _playersPicker(path, selected) {
    const players = this._players;
    if (!players.length) return `<p class="hint">${this.t("no_players")}</p>`;
    const set = new Set(selected || []);
    return `<div class="players">${players.map((state) => {
      const kind = this._outputs?.[state.entity_id]?.kind || "other";
      return `<label class="player"><input type="checkbox" data-targets="${path}" value="${escapeHtml(state.entity_id)}" ${set.has(state.entity_id) ? "checked" : ""}>
        <ha-icon icon="${KIND_ICONS[kind]}"></ha-icon><span class="grow"><b style="font-weight:500">${escapeHtml(this._playerName(state.entity_id))}</b><small>${escapeHtml(state.entity_id)} · ${escapeHtml(state.state === "unavailable" ? this.t("unavailable") : state.state)}</small></span></label>`;
    }).join("")}</div>`;
  }

  _weekHtml(path, schedule) {
    const days = this.t("days_short");
    return `<div class="row" style="margin-bottom:8px">
        <button class="chip" data-action="sched-quick" data-path="${path}" data-mode="weekdays">${this.t("quick_weekdays")}</button>
        <button class="chip" data-action="sched-quick" data-path="${path}" data-mode="daily">${this.t("quick_daily")}</button>
        <button class="chip" data-action="sched-quick" data-path="${path}" data-mode="break">${this.t("quick_break")}</button>
        <button class="chip" data-action="sched-quick" data-path="${path}" data-mode="clear">${this.t("quick_clear")}</button>
      </div>
      <div class="week">${schedule.days.map((ranges, day) => `
        <div class="day"><b>${days[day]}</b>
          <div class="ranges">${ranges.length ? ranges.map((range, i) => `
            <span class="range"><input type="time" aria-label="${days[day]} start" value="${escapeHtml(range.start)}" data-bind="${path}.days.${day}.${i}.start">–<input type="time" aria-label="${days[day]} end" value="${escapeHtml(range.end)}" data-bind="${path}.days.${day}.${i}.end">
            <button class="icon-btn" data-action="sched-del" data-path="${path}" data-day="${day}" data-i="${i}" aria-label="${this.t("remove")}"><ha-icon icon="mdi:close" style="--mdc-icon-size:16px"></ha-icon></button></span>`).join("") : `<span class="off-label">${this.t("day_off")}</span>`}
            <button class="btn ghost small" data-action="sched-add" data-path="${path}" data-day="${day}"><ha-icon icon="mdi:plus" style="--mdc-icon-size:16px"></ha-icon>${this.t("add_range")}</button>
          </div>
          <div class="row" style="gap:2px">
            <button class="icon-btn" data-action="sched-copy" data-path="${path}" data-day="${day}" data-mode="all" title="${this.t("copy_all")}" aria-label="${days[day]}: ${this.t("copy_all")}"><ha-icon icon="mdi:content-copy" style="--mdc-icon-size:18px"></ha-icon></button>
            <button class="icon-btn" data-action="sched-copy" data-path="${path}" data-day="${day}" data-mode="weekdays" title="${this.t("copy_weekdays")}" aria-label="${days[day]}: ${this.t("copy_weekdays")}"><ha-icon icon="mdi:briefcase-outline" style="--mdc-icon-size:18px"></ha-icon></button>
          </div>
        </div>`).join("")}</div>`;
  }

  _sharedTargetWarning() {
    const d = this._draft;
    const seen = new Map();
    for (const layer of d.layers.filter((l) => l.enabled)) {
      for (const target of (layer.target_entity_ids?.length ? layer.target_entity_ids : d.target_entity_ids)) seen.set(target, (seen.get(target) || 0) + 1);
    }
    return [...seen.values()].some((count) => count > 1) ? `<div class="banner warn"><ha-icon icon="mdi:information-outline"></ha-icon><span class="grow">${this.t("shared_target_warn")}</span></div>` : "";
  }

  _layerSummary(layer) {
    const on = layer.sounds.filter((s) => s.enabled).length;
    const parts = [`${this.t("sounds")}: ${on}/${layer.sounds.length}`, `${layer.grid.density_percent}%`, `${this.t("slot_seconds")}: ${layer.grid.slot_seconds}`];
    if (layer.schedule) parts.push(this.t("own_schedule"));
    if (layer.volume != null) parts.push(`${this.t("volume")} ${layer.volume}%`);
    return parts.join(" · ");
  }

  _layerHtml(layer, li, rt) {
    const p = `layers.${li}`;
    const collapsed = this._collapsed.has(layer.id);
    const issue = rt?.issue ? ` · ${this.t(`issue_${rt.issue}`)}` : "";
    const state = rt?.state || "disabled";
    const grid = layer.grid;
    const cycle = grid.slot_seconds * grid.slot_count;
    const rate = grid.slot_count ? ((Math.floor(grid.slot_count * grid.density_percent / 100 + 0.5) / cycle) * 60).toFixed(1) : 0;
    return `<div class="layer ${layer.enabled ? "" : "off"}" data-drop-layer="${li}">
      <div class="layer-head">
        <label class="switch" title="${this.t("layer_on")}"><input type="checkbox" aria-label="${this.t("layer_on")}" data-bind="${p}.enabled" data-type="bool" data-render="1" ${layer.enabled ? "checked" : ""}><span class="track"></span></label>
        <input type="text" maxlength="60" aria-label="${this.t("layer")}" value="${escapeHtml(layer.name)}" data-bind="${p}.name">
        <span class="badge ${state}" data-layer-state="${layer.id}">${this.t(`st_${state}`)}${escapeHtml(issue)}</span>
        <span class="row" style="gap:0">
          <button class="icon-btn" data-action="layer-move" data-li="${li}" data-delta="-1" ${li === 0 ? "disabled" : ""} aria-label="${this.t("move_up")}" title="${this.t("move_up")}"><ha-icon icon="mdi:arrow-up"></ha-icon></button>
          <button class="icon-btn" data-action="layer-move" data-li="${li}" data-delta="1" ${li === this._draft.layers.length - 1 ? "disabled" : ""} aria-label="${this.t("move_down")}" title="${this.t("move_down")}"><ha-icon icon="mdi:arrow-down"></ha-icon></button>
          <button class="icon-btn" data-action="layer-dup" data-li="${li}" aria-label="${this.t("duplicate")}" title="${this.t("duplicate")}"><ha-icon icon="mdi:content-copy"></ha-icon></button>
          <button class="icon-btn" data-action="layer-del" data-li="${li}" ${this._draft.layers.length === 1 ? "disabled" : ""} aria-label="${this.t("delete")}" title="${this.t("delete")}"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
          <button class="icon-btn" data-action="layer-collapse" data-id="${layer.id}" aria-expanded="${!collapsed}" aria-label="${collapsed ? this.t("expand") : this.t("collapse")}"><ha-icon icon="${collapsed ? "mdi:chevron-down" : "mdi:chevron-up"}"></ha-icon></button>
        </span>
      </div>
      ${collapsed ? `<div class="summary">${escapeHtml(this._layerSummary(layer))}</div>` : `
      <div class="layer-body">
        <div data-live-layer="${layer.id}"></div>
        <h3>${this.t("sounds")}</h3>
        ${this._layerSoundsHtml(layer, li)}
        <h3>${this.t("frequency")}</h3>
        <div class="row">${DENSITY_PRESETS.map(([key, value]) => `<button class="chip" aria-pressed="${grid.density_percent === value}" data-action="density" data-li="${li}" data-value="${value}">${this.t(key)} · ${value}%</button>`).join("")}</div>
        <div class="fields" style="margin-top:10px">
          <label class="field">${this.t("density")}: <output data-out="dens-${li}">${grid.density_percent}%</output><input type="range" min="0" max="100" value="${grid.density_percent}" data-bind="${p}.grid.density_percent" data-type="int" data-out-target="dens-${li}"></label>
          <label class="field">${this.t("slot_seconds")}<input type="number" min="1" max="600" value="${grid.slot_seconds}" data-bind="${p}.grid.slot_seconds" data-type="int"></label>
          <label class="field">${this.t("slot_count")}<input type="number" min="1" max="1800" value="${grid.slot_count}" data-bind="${p}.grid.slot_count" data-type="int"></label>
        </div>
        <p class="hint" data-out="cycle-${li}">${this.t("cycle_info", { c: this._duration(cycle), r: rate })}</p>
        <h3>${this.t("volume")}</h3>
        <div class="row"><label class="check"><input type="checkbox" data-action="layer-volume" data-li="${li}" ${layer.volume != null ? "checked" : ""}>${this.t("own_volume")}</label>
          ${layer.volume != null ? `<input type="range" class="grow" min="0" max="100" value="${layer.volume}" data-bind="${p}.volume" data-type="int" data-out-target="vol-${li}" aria-label="${this.t("volume")}"><output data-out="vol-${li}">${layer.volume}%</output>` : ""}</div>
        <p class="hint">${this.t("volume_hint")}</p>
        <h3>${this.t("overlap")}</h3>
        <div class="radio">${["replace", "skip"].map((mode) => `<label><input type="radio" name="ov-${layer.id}" value="${mode}" data-bind="${p}.overlap" ${layer.overlap === mode ? "checked" : ""}>${this.t(`overlap_${mode}`)}</label>`).join("")}</div>
        <h3>${this.t("when_plays")}</h3>
        <div class="radio"><label><input type="radio" name="sc-${layer.id}" data-action="layer-schedule" data-li="${li}" data-mode="inherit" ${layer.schedule ? "" : "checked"}>${this.t("as_program")}</label>
          <label><input type="radio" name="sc-${layer.id}" data-action="layer-schedule" data-li="${li}" data-mode="own" ${layer.schedule ? "checked" : ""}>${this.t("own_schedule")}</label></div>
        ${layer.schedule ? this._weekHtml(`${p}.schedule`, layer.schedule) : ""}
        <h3>${this.t("where_plays")}</h3>
        <div class="radio"><label><input type="radio" name="tg-${layer.id}" data-action="layer-targets" data-li="${li}" data-mode="inherit" ${layer.target_entity_ids.length ? "" : "checked"}>${this.t("as_program")}</label>
          <label><input type="radio" name="tg-${layer.id}" data-action="layer-targets" data-li="${li}" data-mode="own" ${layer.target_entity_ids.length || this._ownTargets?.has(layer.id) ? "checked" : ""}>${this.t("own_speakers")}</label></div>
        ${layer.target_entity_ids.length || this._ownTargets?.has(layer.id) ? this._playersPicker(`${p}.target_entity_ids`, layer.target_entity_ids) : ""}
      </div>`}
    </div>`;
  }

  _layerSoundsHtml(layer, li) {
    const sounds = this._sounds;
    const rows = layer.sounds.map((ref, si) => {
      const sound = sounds[ref.sound_id];
      if (!sound) return "";
      return `<div class="sound-row ${ref.enabled ? "" : "off"}">
        <input type="checkbox" aria-label="${escapeHtml(sound.name)}" data-bind="layers.${li}.sounds.${si}.enabled" data-type="bool" data-render="1" ${ref.enabled ? "checked" : ""}>
        <button class="icon-btn" data-action="play-browser" data-sound="${sound.id}" aria-label="${this.t("play_browser")}" title="${this.t("play_browser")}"><ha-icon icon="${this._playingId === sound.id ? "mdi:stop" : "mdi:play"}"></ha-icon></button>
        <span class="name" title="${escapeHtml(sound.name)}">${escapeHtml(sound.name)}</span>
        <span class="cat">${escapeHtml(sound.category)}</span>
        <span class="weight" title="${this.t("weight_hint")}"><button data-action="weight" data-li="${li}" data-si="${si}" data-delta="-1" aria-label="${this.t("weight")} −">−</button><span aria-label="${this.t("weight")}">${ref.weight}</span><button data-action="weight" data-li="${li}" data-si="${si}" data-delta="1" aria-label="${this.t("weight")} +">+</button></span>
        <button class="icon-btn" data-action="play-speaker" data-sound="${sound.id}" data-li="${li}" aria-label="${this.t("play_speaker")}" title="${this.t("play_speaker")}"><ha-icon icon="mdi:speaker-play"></ha-icon></button>
        <button class="icon-btn" data-action="sound-remove" data-li="${li}" data-si="${si}" aria-label="${this.t("remove")}" title="${this.t("remove")}"><ha-icon icon="mdi:close"></ha-icon></button>
      </div>`;
    }).join("");
    return `${rows || `<p class="hint">${this.t("no_layer_sounds")}</p>`}
      <div class="row" style="margin-top:8px">
        <button class="btn ghost small" data-action="picker" data-li="${li}"><ha-icon icon="mdi:playlist-plus"></ha-icon>${this.t("add_sounds")}</button>
        ${layer.sounds.length > 1 ? `<button class="btn ghost small" data-action="sounds-all" data-li="${li}" data-on="1">${this.t("all_on")}</button><button class="btn ghost small" data-action="sounds-all" data-li="${li}" data-on="0">${this.t("all_off")}</button>` : ""}
      </div>`;
  }

  // Live elements are patched in place so that inputs keep focus during playback.
  _updateLive() {
    const scenario = this._scenario;
    if (!scenario || !this._draft) return;
    const runtime = scenario.runtime || { layers: {} };
    const badge = this.shadowRoot.querySelector("#scenario-state");
    if (badge) { badge.className = `badge ${runtime.state}`; badge.textContent = this.t(`st_${runtime.state}`); }
    const banner = this.shadowRoot.querySelector("#override-banner");
    if (banner) banner.innerHTML = this._overrideHtml(runtime);
    for (const layer of this._draft.layers) {
      const rt = runtime.layers?.[layer.id];
      const state = this.shadowRoot.querySelector(`[data-layer-state="${layer.id}"]`);
      if (state) {
        const s = rt?.state || "disabled";
        state.className = `badge ${s}`;
        state.textContent = `${this.t(`st_${s}`)}${rt?.issue ? ` · ${this.t(`issue_${rt.issue}`)}` : ""}`;
      }
      const live = this.shadowRoot.querySelector(`[data-live-layer="${layer.id}"]`);
      if (!live) continue;
      const key = rt ? `${rt.cycle_index}|${rt.pattern}|${rt.state}|${layer.grid.slot_count}` : "none";
      if (live.dataset.key !== key) { live.dataset.key = key; live.innerHTML = this._liveHtml(layer, rt); }
      const stats = live.querySelector(".stats");
      if (stats && rt) stats.innerHTML = this._statsHtml(rt);
    }
    const list = this.shadowRoot.querySelector("#program-list");
    if (list && !list.contains(this.shadowRoot.activeElement)) list.innerHTML = this._programListHtml();
    this._tickLive();
  }

  _statsHtml(rt) {
    return `<span>${this.t("played")}: <b>${rt.played_count}</b></span><span>${this.t("skipped")}: <b>${rt.skipped_count}</b></span><span>${this.t("errors")}: <b>${rt.error_count}</b>${rt.last_error ? ` (${escapeHtml(this._err({ code: rt.last_error }))})` : ""}</span>${rt.next_event && rt.state === "waiting" ? `<span>${this.t("next_event", { t: this._time(rt.next_event, true) })}</span>` : ""}`;
  }

  _liveHtml(layer, rt) {
    if (!rt) return "";
    const pattern = rt.pattern || "";
    const head = `<div class="row between"><b data-cycle-label="${layer.id}">${pattern && rt.state === "running" ? this.t("cycle_n", { n: rt.cycle_index + 1 }) : ""}</b>
      ${rt.state === "running" ? `<button class="btn ghost small" data-action="regenerate" data-layer="${layer.id}"><ha-icon icon="mdi:dice-multiple" style="--mdc-icon-size:16px"></ha-icon>${this.t("regenerate")}</button>` : ""}</div>`;
    const grid = pattern && rt.state === "running"
      ? `<div class="grid" role="img" data-grid="${layer.id}" data-pattern="${pattern}">${[...pattern].map((c) => `<span class="cell ${c === "1" ? "on" : ""}"></span>`).join("")}</div>
        <div class="legend"><span><i class="cell on"></i>${this.t("legend_active")}</span><span><i class="cell"></i>${this.t("legend_silent")}</span><span><i class="cell on past"></i>${this.t("legend_past")}</span><span><i class="cell now"></i>${this.t("legend_now")}</span></div>`
      : `<p class="hint">${this.t("grid_waiting")}</p>`;
    return `${head}${grid}<div class="stats" style="margin-top:8px">${this._statsHtml(rt)}</div>`;
  }

  _tickLive() {
    const scenario = this._scenario;
    if (!scenario || !this._draft) return;
    const now = Date.now();
    for (const layer of this._draft.layers) {
      const rt = scenario.runtime?.layers?.[layer.id];
      const grid = this.shadowRoot.querySelector(`[data-grid="${layer.id}"]`);
      if (!grid || !rt?.window_start) continue;
      const slotMs = layer.grid.slot_seconds * 1000;
      const slot = Math.floor((now - Date.parse(rt.window_start)) / slotMs);
      const cycle = Math.floor(slot / layer.grid.slot_count);
      const index = cycle === rt.cycle_index ? slot % layer.grid.slot_count : -1;
      if (grid.dataset.index === String(index)) continue;
      grid.dataset.index = String(index);
      const cells = grid.children;
      const pattern = grid.dataset.pattern;
      let active = 0;
      for (let i = 0; i < cells.length; i += 1) {
        const on = pattern[i] === "1";
        if (on) active += 1;
        cells[i].className = `cell${on ? " on" : ""}${i < index ? " past" : ""}${i === index ? " now" : ""}`;
      }
      grid.setAttribute("aria-label", `${this.t("cycle_n", { n: rt.cycle_index + 1 })}: ${this.t("cell_of", { i: Math.max(index + 1, 0), n: cells.length })}, ${active} ${this.t("legend_active")}`);
    }
  }

  // ------------------------------------------------------------------ library tab

  _categories() {
    return [...new Set((this._data?.sounds || []).map((s) => s.category))].sort((a, b) => a.localeCompare(b));
  }

  _libraryHtml() {
    const lib = this._data.library || {};
    const cats = this._categories();
    const uploadCat = this._uploadCategory || "";
    const search = this._libSearch.toLowerCase();
    const sounds = (this._data.sounds || []).filter((s) => (!this._libFilter || s.category === this._libFilter) && (!search || s.name.toLowerCase().includes(search)));
    const groups = {};
    for (const sound of sounds) (groups[sound.category] ||= []).push(sound);
    const testTarget = this._testTarget || this._players[0]?.entity_id || "";
    return `
      <div class="card">
        <h2><ha-icon icon="mdi:upload"></ha-icon>${this.t("upload_title")}</h2>
        <div class="dropzone" data-dropzone="library">
          <ha-icon icon="mdi:cloud-upload-outline"></ha-icon>
          <div><b style="font-weight:500">${this.t("drop_files")}</b> ${this.t("or")}</div>
          <button class="btn" data-action="choose-files"><ha-icon icon="mdi:folder-open-outline"></ha-icon>${this.t("choose_files")}</button>
          <div class="hint" style="margin:0">${this.t("upload_limits", { mb: Math.round((lib.max_upload_bytes || 26214400) / 1048576), path: escapeHtml(lib.path || "/media/hi_sosed") })}</div>
          <label class="field" style="min-width:240px">${this.t("upload_category")}
            <select data-action-change="upload-category">
              <option value="" ${uploadCat ? "" : "selected"}>—</option>
              ${[...new Set([...cats, uploadCat].filter(Boolean))].map((c) => `<option ${c === uploadCat ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}
              <option value="__new__">${this.t("new_category")}</option>
            </select></label>
        </div>
        <div class="queue" id="upload-queue">${this._queueHtml()}</div>
      </div>
      <div class="card">
        <div class="row">
          <input type="text" class="grow" placeholder="${this.t("search")}" aria-label="${this.t("search")}" value="${escapeHtml(this._libSearch)}" data-action-input="lib-search" style="max-width:320px">
          <span class="grow"></span>
          <button class="btn ghost small" data-action="lib-scan"><ha-icon icon="mdi:folder-search-outline"></ha-icon>${this.t("scan_folder")}</button>
          <button class="btn ghost small" data-action="lib-starter"><ha-icon icon="mdi:package-variant"></ha-icon>${this.t("starter")}</button>
          <button class="btn ghost small" data-action="lib-uri"><ha-icon icon="mdi:link-variant"></ha-icon>${this.t("add_uri")}</button>
        </div>
        <p class="hint" style="margin-top:8px">${this.t("scan_hint", { path: escapeHtml(lib.path || "/media/hi_sosed") })}</p>
        <div class="row">
          <button class="chip" aria-pressed="${!this._libFilter}" data-action="lib-filter" data-cat="">${this.t("all_categories")} · ${(this._data.sounds || []).length}</button>
          ${cats.map((c) => `<button class="chip" aria-pressed="${this._libFilter === c}" data-action="lib-filter" data-cat="${escapeHtml(c)}">${escapeHtml(c)} · ${(this._data.sounds || []).filter((s) => s.category === c).length}</button>`).join("")}
        </div>
        <div class="row" style="margin-top:12px"><label class="field" style="min-width:240px">${this.t("test_on")}
          <select data-action-change="test-target">${this._players.map((p) => `<option value="${escapeHtml(p.entity_id)}" ${p.entity_id === testTarget ? "selected" : ""}>${escapeHtml(this._playerName(p.entity_id))}</option>`).join("")}</select></label></div>
        ${Object.keys(groups).length ? Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => `
          <details class="group" data-key="lib-${escapeHtml(cat)}" ${this._open(`lib-${cat}`, true)}><summary>${escapeHtml(cat)} · ${items.length}</summary>
            ${items.map((s) => this._libRowHtml(s, cats)).join("")}
          </details>`).join("") : `<div class="empty"><ha-icon icon="mdi:music-note-off-outline"></ha-icon>${this.t("library_empty")}</div>`}
      </div>`;
  }

  _libRowHtml(sound, cats) {
    return `<div class="lib-row">
      <button class="icon-btn" data-action="play-browser" data-sound="${sound.id}" aria-label="${this.t("play_browser")}" title="${this.t("play_browser")}"><ha-icon icon="${this._playingId === sound.id ? "mdi:stop" : "mdi:play"}"></ha-icon></button>
      <div style="min-width:0"><div class="name" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${escapeHtml(sound.name)}">${escapeHtml(sound.name)}</div>
        <div class="meta">${sound.size ? `${formatSize(sound.size)} · ` : ""}${sound.usage ? this.t("used_in", { n: sound.usage }) : this.t("unused")}</div></div>
      <select aria-label="${this.t("upload_category")}" data-action-change="sound-category" data-sound="${sound.id}">
        ${[...new Set([...cats, sound.category])].map((c) => `<option ${c === sound.category ? "selected" : ""}>${escapeHtml(c)}</option>`).join("")}
        <option value="__new__">${this.t("new_category")}</option></select>
      <span class="row" style="gap:0">
        <button class="icon-btn" data-action="play-speaker" data-sound="${sound.id}" aria-label="${this.t("play_speaker")}" title="${this.t("play_speaker")}"><ha-icon icon="mdi:speaker-play"></ha-icon></button>
        <button class="icon-btn" data-action="sound-rename" data-sound="${sound.id}" aria-label="${this.t("rename")}" title="${this.t("rename")}"><ha-icon icon="mdi:rename-outline"></ha-icon></button>
      </span>
      <button class="icon-btn" data-action="sound-delete" data-sound="${sound.id}" aria-label="${this.t("delete")}" title="${this.t("delete")}"><ha-icon icon="mdi:delete-outline"></ha-icon></button>
    </div>`;
  }

  _queueHtml() {
    return this._uploads.slice(-8).map((item) => `<div class="queue-item"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(item.name)}${item.error ? ` — <span style="color:var(--hs-err)">${escapeHtml(item.error)}</span>` : ""}</span>
      ${item.error ? `<ha-icon icon="mdi:alert-circle" style="color:var(--hs-err)"></ha-icon>` : item.done ? `<ha-icon icon="mdi:check-circle" style="color:var(--hs-ok)"></ha-icon>` : `<progress max="100" value="${item.progress}" aria-label="${escapeHtml(item.name)}"></progress>`}</div>`).join("");
  }

  async _token() {
    const auth = this._hass.auth;
    if (auth.expired) await auth.refreshAccessToken();
    return auth.data.access_token;
  }

  // XMLHttpRequest instead of fetch: it reports upload progress. HA auth is a bearer token, not a cookie.
  async _uploadOne(file, category) {
    const item = { name: file.name, progress: 0 };
    this._uploads.push(item);
    this._paintQueue();
    const token = await this._token();
    return new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/hi_sosed/upload");
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.upload.onprogress = (event) => { if (event.lengthComputable) { item.progress = Math.round((event.loaded / event.total) * 100); this._paintQueue(); } };
      xhr.onload = () => {
        let body = {};
        try { body = JSON.parse(xhr.responseText); } catch { body = {}; }
        if (xhr.status === 200) { item.done = true; resolve(body); }
        else { item.error = this._err({ code: body.code || (xhr.status === 401 ? "unauthorized" : `http_${xhr.status}`) }); resolve(null); }
        this._paintQueue();
      };
      xhr.onerror = () => { item.error = this._err({ code: "network_error" }); this._paintQueue(); resolve(null); };
      const form = new FormData();
      if (category) form.append("category", category);
      form.append("file", file, file.name);
      xhr.send(form);
    });
  }

  _paintQueue() {
    const el = this.shadowRoot.querySelector("#upload-queue");
    if (el) el.innerHTML = this._queueHtml();
  }

  async _uploadFiles(files, { category = this._uploadCategory, layerIndex = null } = {}) {
    const list = [...files].filter((file) => file && file.size > 0);
    if (!list.length) return;
    const added = [];
    for (const file of list) {
      const sound = await this._uploadOne(file, category);
      if (sound) added.push(sound);
    }
    const failed = list.length - added.length;
    this._toast(failed ? `${this.t("uploaded", { n: added.length })} · ${this.t("upload_failed", { n: failed })}` : this.t("uploaded", { n: added.length }), failed > 0);
    if (layerIndex != null && this._draft && added.length) {
      this._data.sounds.push(...added);
      const layer = this._draft.layers[layerIndex];
      for (const sound of added) if (!layer.sounds.some((ref) => ref.sound_id === sound.id)) layer.sounds.push({ sound_id: sound.id, enabled: true, weight: 1 });
      this._changed({ render: true });
    }
  }

  _pickFiles(options = {}) {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    input.accept = "audio/*,.mp3,.wav,.ogg,.opus,.m4a,.aac,.flac";
    input.addEventListener("change", () => this._uploadFiles(input.files, options));
    input.click();
  }

  async _playBrowser(soundId) {
    if (this._playingId === soundId) { this._audio?.pause(); this._playingId = null; this._render(); return; }
    const sound = this._sounds[soundId];
    if (!sound) return;
    try {
      const resolved = await this._ws("media_source/resolve_media", { media_content_id: sound.media_content_id, expires: 3600 });
      this._audio?.pause();
      this._audio = new Audio(this._hass.hassUrl(resolved.url));
      this._audio.onended = () => { this._playingId = null; this._scheduleRender(); };
      await this._audio.play();
      this._playingId = soundId;
      this._scheduleRender();
    } catch (error) {
      this._toast(this._err(error), true);
    }
  }

  async _playSpeaker(soundId, layerIndex) {
    let entityIds;
    if (layerIndex != null && this._draft) {
      const layer = this._draft.layers[layerIndex];
      entityIds = layer.target_entity_ids.length ? layer.target_entity_ids : this._draft.target_entity_ids;
    } else {
      entityIds = [this._testTarget || this._players[0]?.entity_id].filter(Boolean);
    }
    if (!entityIds.length) { this._toast(this.t("no_test_target"), true); return; }
    await this._call("hi_sosed/sound/preview", { sound_id: soundId, entity_ids: entityIds }, this.t("sent_to_speaker"));
  }

  // ------------------------------------------------------------------ speakers tab

  _speakersHtml() {
    const players = this._players;
    return `
      <div class="card"><h2><ha-icon icon="mdi:speaker-wireless"></ha-icon>${this.t("tab_speakers")}</h2><p class="hint">${this.t("speakers_hint")}</p></div>
      ${players.length ? players.map((state) => this._speakerHtml(state)).join("") : `<div class="card"><p class="hint">${this.t("no_players")}</p></div>`}
      ${this._guideHtml()}`;
  }

  _speakerHtml(state) {
    const id = state.entity_id;
    const profile = this._outputs?.[id] || { entity_id: id, kind: "other", volume: null, warmup_seconds: 0, keepalive_seconds: 0, lead_ms: 0 };
    const known = Boolean(this._outputs?.[id]);
    const key = escapeHtml(id);
    return `<div class="card speaker">
      <div class="speaker-head"><ha-icon icon="${KIND_ICONS[profile.kind]}"></ha-icon><div class="grow"><b style="font-weight:500">${escapeHtml(this._playerName(id))}</b><div class="hint" style="margin:0">${key} · ${this.t("state")}: ${escapeHtml(state.state === "unavailable" ? this.t("unavailable") : state.state)}</div></div>
        <button class="btn small" data-action="out-test" data-entity="${key}"><ha-icon icon="mdi:volume-high"></ha-icon>${this.t("test_signal")}</button>
        ${known ? `<button class="btn ghost small" data-action="out-reset" data-entity="${key}">${this.t("reset_profile")}</button>` : ""}</div>
      <div class="fields">
        <label class="field">${this.t("kind")}<select data-out-field="kind" data-entity="${key}">${KINDS.map((k) => `<option value="${k}" ${profile.kind === k ? "selected" : ""}>${this.t(`kind_${k}`)}</option>`).join("")}</select></label>
        <label class="field">${this.t("keepalive")}<select data-out-field="keepalive_seconds" data-entity="${key}">${KEEPALIVE.map((s) => `<option value="${s}" ${profile.keepalive_seconds === s ? "selected" : ""}>${s ? this.t("keepalive_every", { s }) : this.t("keepalive_off")}</option>`).join("")}</select></label>
        <label class="field">${this.t("warmup")}<input type="number" min="0" max="120" value="${profile.warmup_seconds}" data-out-field="warmup_seconds" data-entity="${key}"></label>
        <label class="field">${this.t("lead")}<input type="number" min="0" max="3000" step="50" value="${profile.lead_ms}" data-out-field="lead_ms" data-entity="${key}"></label>
      </div>
      <div class="row"><label class="check"><input type="checkbox" data-out-field="volume_on" data-entity="${key}" ${profile.volume != null ? "checked" : ""}>${this.t("speaker_volume")}</label>
        ${profile.volume != null ? `<input type="range" class="grow" min="0" max="100" value="${profile.volume}" data-out-field="volume" data-entity="${key}" aria-label="${this.t("speaker_volume")}"><output>${profile.volume}%</output>` : ""}</div>
      <p class="hint" style="margin:0">${profile.kind === "bluetooth" ? `${this.t("keepalive_hint")} ${this.t("warmup_hint")} ${this.t("lead_hint")}` : this.t("lead_hint")}</p>
      <div><button class="btn ghost small" data-action="out-recommend" data-entity="${key}"><ha-icon icon="mdi:auto-fix"></ha-icon>${this.t("recommended")}: ${this.t(`kind_${profile.kind}`)}</button></div>
    </div>`;
  }

  _saveOutput(entityId, patch) {
    const profile = { ...(this._outputs?.[entityId] || { entity_id: entityId, kind: "other", volume: null, warmup_seconds: 0, keepalive_seconds: 0, lead_ms: 0 }), ...patch };
    this._outputs[entityId] = profile;
    clearTimeout(this._outputTimers[entityId]);
    this._outputTimers[entityId] = setTimeout(() => this._call("hi_sosed/output/save", { output: profile }), 500);
  }

  _code(text) {
    return `<div class="code"><pre>${escapeHtml(text)}</pre><button class="btn ghost small" data-action="copy" data-text="${escapeHtml(text)}">${this.t("copy")}</button></div>`;
  }

  _guideHtml() {
    const ru = this._ru;
    const lxc = "lxc.cgroup2.devices.allow: c 116:* rwm\nlxc.mount.entry: /dev/snd dev/snd none bind,optional,create=dir";
    const node = "wget -qO- https://raw.githubusercontent.com/SunsetSH/HiSosed/main/scripts/proxmox/audio-node.sh | sudo sh -s -- --mode jack --players 2";
    const nodeBt = "wget -qO- https://raw.githubusercontent.com/SunsetSH/HiSosed/main/scripts/proxmox/audio-node.sh | sudo sh -s -- --mode bluetooth --players 2\n# " + (ru ? "затем сопряжение:" : "then pair:") + "\nsudo hisosed-bt-pair";
    const usb = ru
      ? "Proxmox → ВМ Home Assistant → Hardware → Add → USB Device → Use USB Vendor/Device ID → выберите звуковую карту → перезапустите ВМ."
      : "Proxmox → Home Assistant VM → Hardware → Add → USB Device → Use USB Vendor/Device ID → pick the sound card → restart the VM.";
    return `<div class="card guide">
      <h2><ha-icon icon="mdi:server-network"></ha-icon>${this.t("guide_title")}</h2>
      <p class="hint">${ru
        ? "Home Assistant OS в виртуальной машине Proxmox не видит звуковую карту и Bluetooth хоста. Нужен путь звука до колонки, который появится в HA как media_player. Выберите свой случай."
        : "Home Assistant OS in a Proxmox VM cannot see the host sound card or Bluetooth. You need an audio path that shows up in HA as a media_player. Pick your case."}</p>
      <details data-key="g-usb" ${this._open("g-usb", true)}><summary>${ru ? "Колонка по jack 3.5 — вариант А (проще всего): USB-звуковая карта в ВМ HA" : "3.5 mm jack — option A (simplest): USB sound card in the HA VM"}</summary>
        <ol>
          <li>${ru ? "Купите любую USB-звуковую карту с выходом 3.5 мм (class compliant, без драйверов) и подключите к серверу Proxmox." : "Get any class-compliant USB sound card with a 3.5 mm output and plug it into the Proxmox server."}</li>
          <li>${escapeHtml(usb)}</li>
          <li>${ru ? "В Home Assistant: Настройки → Система → Оборудование — карта должна появиться. Выход по умолчанию выбирается в Настройки → Система → Аудио (или в Terminal: <code>ha audio info</code>, <code>ha audio default output --name …</code>)." : "In HA: Settings → System → Hardware shows the card. Choose the default output under Settings → System → Audio (or in Terminal: <code>ha audio info</code>, <code>ha audio default output --name …</code>)."}</li>
          <li>${ru ? "Установите дополнение (add-on) <b>VLC</b> из официального магазина и запустите его. HA сам предложит интеграцию <b>VLC media player via Telnet</b> — примите её: появится media_player." : "Install the official <b>VLC</b> add-on and start it. HA discovers <b>VLC media player via Telnet</b>; accept it and a media_player appears."}</li>
          <li>${ru ? "Здесь, во вкладке «Колонки», выберите тип «Jack 3.5» и нажмите «Тестовый сигнал»." : "Here, set the kind to “3.5 mm jack” and press “Test signal”."}</li>
        </ol>
      </details>
      <details data-key="g-lxc" ${this._open("g-lxc", false)}><summary>${ru ? "Колонка по jack 3.5 — вариант Б: встроенный звук сервера через LXC-контейнер" : "3.5 mm jack — option B: onboard audio via an LXC container"}</summary>
        <ol>
          <li>${ru ? "Создайте Debian 12 LXC в Proxmox. На хосте добавьте в <code>/etc/pve/lxc/&lt;ID&gt;.conf</code>:" : "Create a Debian 12 LXC. On the host add to <code>/etc/pve/lxc/&lt;ID&gt;.conf</code>:"}${this._code(lxc)}</li>
          <li>${ru ? "Перезапустите контейнер и внутри выполните установщик аудиоузла HiSosed (MPD + PipeWire, два плеера для одновременных дорожек):" : "Restart the container and run the HiSosed audio-node installer inside (MPD + PipeWire, two players for simultaneous layers):"}${this._code(node)}</li>
          <li>${ru ? "В HA добавьте интеграцию <b>Music Player Daemon (MPD)</b> для каждого порта, который выведет скрипт (6600, 6601…), хост — IP контейнера." : "In HA add the <b>Music Player Daemon (MPD)</b> integration for each port the script prints (6600, 6601…), host = container IP."}</li>
        </ol>
      </details>
      <details data-key="g-bt" ${this._open("g-bt", false)}><summary>${ru ? "Bluetooth-колонка" : "Bluetooth speaker"}</summary>
        <ol>
          <li>${ru ? "Bluetooth-аудио (A2DP) надёжнее всего работает в отдельной маленькой ВМ Debian 12 (1 ядро, 512 МБ). LXC не подходит: Bluetooth там не пробрасывается." : "Bluetooth audio (A2DP) works best in a small dedicated Debian 12 VM (1 core, 512 MB). LXC is not suitable: Bluetooth cannot be passed through."}</li>
          <li>${ru ? "Пробросьте USB Bluetooth-адаптер в эту ВМ (Hardware → Add → USB Device). Если адаптер встроенный и HA его не использует — его тоже можно пробросить." : "Pass the USB Bluetooth adapter to that VM (Hardware → Add → USB Device)."}</li>
          <li>${ru ? "В ВМ запустите установщик и выполните сопряжение (колонку переведите в режим сопряжения):" : "Inside the VM run the installer and pair (put the speaker in pairing mode):"}${this._code(nodeBt)}</li>
          <li>${ru ? "Скрипт включает автопереподключение. В HA добавьте MPD-интеграции на порты 6600/6601, а здесь выберите тип «Bluetooth» и нажмите «Рекомендуемые настройки»: прогрев, «не давать уснуть» и компенсация задержки уберут обрезание первых долей секунды." : "The script enables auto-reconnect. Add MPD integrations for ports 6600/6601 in HA, set the kind to “Bluetooth” here and press “Recommended settings”: warm-up, keep-awake and latency compensation prevent clipped starts."}</li>
        </ol>
      </details>
      <details data-key="g-mix" ${this._open("g-mix", false)}><summary>${ru ? "Одновременные дорожки" : "Simultaneous layers"}</summary>
        <p>${ru
          ? "Один media_player в каждый момент играет один поток: новая команда заменяет текущий звук. Чтобы дорожки звучали одновременно, установщик аудиоузла создаёт несколько плееров MPD на одном выходе — PipeWire смешивает их. Назначьте дорожкам разные плееры в «Где играет → Свои колонки». Если плеер один, используйте для второстепенной дорожки режим «Не перебивать»."
          : "A media_player plays one stream at a time; a new command replaces the current sound. For true simultaneity the audio-node installer creates several MPD players on one output, mixed by PipeWire. Assign different players to layers via “Where it plays → Own speakers”. With a single player, set secondary layers to “Do not interrupt”."}</p>
      </details>
    </div>`;
  }

  // ------------------------------------------------------------------ help tab

  _helpHtml() {
    const ru = this._ru;
    const items = ru ? [
      ["Программа", "Набор дорожек с общим расписанием и колонками. Переключатель «Расписание включено» разрешает автоматическую игру только в заданные интервалы."],
      ["Дорожка", "Независимый поток случайных звуков со своей сеткой. Галочка у дорожки и у каждого звука выключает их без удаления. У дорожки может быть своё расписание и свои колонки."],
      ["Сетка", "Время окна делится на клетки (например, по 2 с). В каждом цикле ровно «плотность» % клеток активны, позиции случайны и меняются каждый цикл. В начале активной клетки играет один случайный звук с учётом весов."],
      ["Перерывы", "Добавьте несколько интервалов в один день — например 10:00–13:00 и 14:00–19:00. Вне интервалов звук не играет никогда."],
      ["Пресеты", "Быстро переключают микс: какие дорожки и звуки включены, плотность и громкость. Доступны и в дашборде как select-сущность."],
      ["Запустить сейчас", "Играет немедленно заданное время, не глядя на расписание, потом программа возвращается к расписанию."],
      ["Тишина", "Глушит все программы на время. Пропущенные звуки не догоняются."],
      ["Дашборд и автоматизации", "Для каждой программы создаются сущности: переключатель расписания, переключатели дорожек, выбор пресета и сенсор состояния. Действия hi_sosed.* принимают имя программы."],
      ["Звук обрезается или не играет", "Проверьте колонку во вкладке «Колонки» тестовым сигналом. Для Bluetooth включите рекомендуемые настройки. Звуки лучше делать не длиннее клетки."],
    ] : [
      ["Program", "A set of layers with a shared schedule and speakers. “Schedule enabled” allows automatic playback only inside the configured ranges."],
      ["Layer", "An independent stream of random sounds with its own grid. Checkboxes on a layer and on each sound mute them without deleting. A layer may have its own schedule and speakers."],
      ["Grid", "The window is split into cells (e.g. 2 s). Each cycle has exactly “density” % active cells at random positions. One weighted random sound plays at the start of each active cell."],
      ["Breaks", "Add several ranges to a day, e.g. 10:00–13:00 and 14:00–19:00. Nothing plays outside the ranges."],
      ["Presets", "Switch the mix quickly: which layers and sounds are on, density and volume. Also available on dashboards as a select entity."],
      ["Run now", "Plays immediately for a set time regardless of the schedule, then the program returns to its schedule."],
      ["Snooze", "Silences everything for a while. Skipped sounds are not replayed."],
      ["Dashboards and automations", "Each program gets entities: schedule switch, layer switches, preset select and a status sensor. hi_sosed.* actions accept the program name."],
      ["Sound is clipped or silent", "Test the speaker in the Speakers tab. For Bluetooth apply the recommended settings. Keep clips shorter than a cell."],
    ];
    return `<div class="card"><h2><ha-icon icon="mdi:help-circle-outline"></ha-icon>${this.t("help_title")}</h2>
      ${items.map(([title, text]) => `<h3>${escapeHtml(title)}</h3><p style="margin:0;line-height:1.5">${escapeHtml(text)}</p>`).join("")}</div>`;
  }

  // ------------------------------------------------------------------ dialogs & toast

  _toast(text, error = false) {
    const overlay = this.shadowRoot.querySelector("#overlay");
    if (!overlay) return;
    overlay.querySelector(".toast")?.remove();
    const el = document.createElement("div");
    el.className = `toast ${error ? "err" : ""}`;
    el.setAttribute("role", error ? "alert" : "status");
    el.textContent = text;
    overlay.append(el);
    setTimeout(() => el.remove(), error ? 6000 : 2600);
  }

  // Own modal instead of confirm()/prompt(): those are unreliable inside the companion apps.
  _dialog({ title, body = "", input = null, buttons, onOpen = null }) {
    return new Promise((resolve) => {
      const overlay = this.shadowRoot.querySelector("#overlay");
      const bg = document.createElement("div");
      bg.className = "modal-bg";
      bg.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}"><header>${escapeHtml(title)}</header>
        <div class="body">${body}${input !== null ? `<input type="text" id="dlg-input" maxlength="80" value="${escapeHtml(input)}" style="margin:8px 0">` : ""}</div>
        <footer>${buttons.map((b, i) => `<button class="btn ${b.style || ""}" data-i="${i}">${escapeHtml(b.label)}</button>`).join("")}</footer></div>`;
      const close = (value) => { bg.remove(); resolve(value); };
      const pick = (def) => {
        const text = bg.querySelector("#dlg-input")?.value;
        if (def.value === undefined) return text;
        return typeof def.value === "function" ? def.value(bg, text) : def.value;
      };
      bg.addEventListener("click", (event) => {
        if (event.target === bg) return close(null);
        const btn = event.target.closest("button[data-i]");
        if (!btn) return;
        close(pick(buttons[Number(btn.dataset.i)]));
      });
      bg.addEventListener("keydown", (event) => {
        if (event.key === "Escape") close(null);
        if (event.key === "Enter" && event.target.id === "dlg-input") { const def = buttons.find((b) => !b.style); if (def) close(pick(def)); }
      });
      overlay.append(bg);
      onOpen?.(bg);
      (bg.querySelector("#dlg-input") || bg.querySelector("button[data-i]"))?.focus();
    });
  }

  _confirm(text, okLabel = this.t("confirm")) {
    return this._dialog({ title: this.t("confirm"), body: `<p>${escapeHtml(text)}</p>`, buttons: [{ label: this.t("cancel"), style: "ghost", value: false }, { label: okLabel, style: "", value: true }] });
  }

  _prompt(title, value = "") {
    return this._dialog({ title, input: value, buttons: [{ label: this.t("cancel"), style: "ghost", value: null }, { label: this.t("done") }] })
      .then((result) => (typeof result === "string" && result.trim() ? result.trim() : null));
  }

  _choose(title, options) {
    return this._dialog({ title, buttons: [...options.map(([label, value]) => ({ label, value, style: "ghost" })), { label: this.t("cancel"), style: "ghost", value: null }] });
  }

  async _templateDialog() {
    const templates = [["empty", "tpl_empty"], ["break", "tpl_break"], ["two", "tpl_two"]];
    const body = `<div class="tpl">${templates.map(([id, key], i) => `<button data-tpl="${id}" aria-pressed="${i === 0}"><b style="font-weight:500">${this.t(key)}</b><small>${this.t(`${key}_d`)}</small></button>`).join("")}</div>
      <label class="field" style="margin-top:12px">${this.t("name")}<input type="text" id="dlg-input" maxlength="80" value="${escapeHtml(this.t("new_program"))}"></label>`;
    const onOpen = (bg) => bg.addEventListener("click", (event) => {
      const tpl = event.target.closest("[data-tpl]");
      if (!tpl) return;
      bg.querySelectorAll("[data-tpl]").forEach((el) => el.setAttribute("aria-pressed", String(el === tpl)));
    });
    return this._dialog({ title: this.t("template_title"), body, onOpen, buttons: [{ label: this.t("cancel"), style: "ghost", value: null }, { label: this.t("create"), value: (bg, name) => ({ tpl: bg.querySelector("[data-tpl][aria-pressed=true]")?.dataset.tpl || "empty", name }) }] });
  }

  async _pickerDialog(li) {
    const layer = this._draft.layers[li];
    const inLayer = new Set(layer.sounds.map((ref) => ref.sound_id));
    const groups = {};
    for (const sound of this._data.sounds) (groups[sound.category] ||= []).push(sound);
    const body = `<input type="text" id="pick-search" placeholder="${this.t("search")}" aria-label="${this.t("search")}" style="margin-bottom:8px">
      <div id="pick-list">${Object.keys(groups).length ? Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => `
        <details class="group" open><summary>${escapeHtml(cat)} · ${items.length}</summary>${items.map((s) => `
          <label class="sound-row check" data-name="${escapeHtml(s.name.toLowerCase())}"><input type="checkbox" value="${s.id}" ${inLayer.has(s.id) ? "checked disabled" : ""}><span class="name">${escapeHtml(s.name)}</span>${inLayer.has(s.id) ? `<small class="cat">${this.t("already")}</small>` : ""}</label>`).join("")}</details>`).join("") : `<p class="hint">${this.t("library_empty")}</p>`}</div>`;
    const onOpen = (bg) => {
      const addButton = bg.querySelector("footer button:last-child");
      const count = () => { addButton.textContent = this.t("picker_add", { n: bg.querySelectorAll("#pick-list input:checked:not(:disabled)").length }); };
      bg.querySelector("#pick-list")?.addEventListener("change", count);
      bg.querySelector("#pick-search")?.addEventListener("input", (event) => {
        const q = event.target.value.toLowerCase();
        bg.querySelectorAll("[data-name]").forEach((el) => { el.style.display = !q || el.dataset.name.includes(q) ? "" : "none"; });
      });
      count();
    };
    const result = await this._dialog({ title: this.t("picker_title"), body, onOpen, buttons: [
      { label: this.t("choose_files"), style: "ghost", value: "upload" },
      { label: this.t("cancel"), style: "ghost", value: null },
      { label: this.t("add_sounds"), value: (bg) => [...bg.querySelectorAll("#pick-list input:checked:not(:disabled)")].map((el) => el.value) },
    ] });
    if (result === "upload") { this._pickFiles({ layerIndex: li }); return; }
    if (!Array.isArray(result) || !result.length) return;
    for (const id of result) layer.sounds.push({ sound_id: id, enabled: true, weight: 1 });
    this._changed({ render: true });
  }

  // ------------------------------------------------------------------ events

  _bindRoot() {
    const root = this.shadowRoot;
    root.addEventListener("click", (event) => this._onClick(event));
    root.addEventListener("input", (event) => this._onInput(event));
    root.addEventListener("change", (event) => this._onChange(event));
    root.addEventListener("toggle", (event) => {
      const key = event.target.dataset?.key;
      if (key) this._details.set(key, event.target.open);
    }, true);
    root.addEventListener("focusout", () => setTimeout(() => { if (this._renderPending && !this._focusInside()) this._render(); }, 0));
    root.addEventListener("dragover", (event) => {
      const zone = event.target.closest?.("[data-dropzone], [data-drop-layer]");
      if (!zone || !event.dataTransfer?.types?.includes("Files")) return;
      event.preventDefault();
      zone.classList.add("dragover");
    });
    root.addEventListener("dragleave", (event) => event.target.closest?.("[data-dropzone], [data-drop-layer]")?.classList.remove("dragover"));
    root.addEventListener("drop", (event) => {
      const zone = event.target.closest?.("[data-dropzone], [data-drop-layer]");
      if (!zone || !event.dataTransfer?.files?.length) return;
      event.preventDefault();
      zone.classList.remove("dragover");
      const layerIndex = zone.dataset.dropLayer != null ? Number(zone.dataset.dropLayer) : null;
      this._uploadFiles(event.dataTransfer.files, { layerIndex });
    });
  }

  _coerce(el) {
    const type = el.dataset.type;
    if (type === "bool") return el.checked;
    if (type === "int") return el.value === "" ? NaN : Number(el.value);
    return el.value;
  }

  _onInput(event) {
    const el = event.target;
    if (el.dataset.actionInput === "lib-search") {
      this._libSearch = el.value;
      clearTimeout(this._searchTimer);
      this._searchTimer = setTimeout(() => { this._render(); const box = this.shadowRoot.querySelector("[data-action-input=lib-search]"); box?.focus(); box?.setSelectionRange(box.value.length, box.value.length); }, 250);
      return;
    }
    if (el.dataset.outField) { this._onOutputField(el, false); return; }
    if (!el.dataset.bind || !this._draft || el.type === "checkbox" || el.type === "radio") return;
    setPath(this._draft, el.dataset.bind, this._coerce(el));
    if (el.dataset.outTarget) {
      const out = this.shadowRoot.querySelector(`[data-out="${el.dataset.outTarget}"]`);
      if (out) out.textContent = `${el.value}%`;
    }
    const layerMatch = el.dataset.bind.match(/^layers\.(\d+)\.grid\./);
    if (layerMatch) this._refreshCycleInfo(Number(layerMatch[1]));
    if (el.dataset.bind === "name") { const item = this.shadowRoot.querySelector(`.prog[aria-current=true] b`); if (item) item.textContent = el.value; }
    this._changed();
  }

  _refreshCycleInfo(li) {
    const grid = this._draft.layers[li].grid;
    const out = this.shadowRoot.querySelector(`[data-out="cycle-${li}"]`);
    if (!out || !(grid.slot_seconds > 0 && grid.slot_count > 0)) return;
    const cycle = grid.slot_seconds * grid.slot_count;
    const rate = ((Math.floor(grid.slot_count * grid.density_percent / 100 + 0.5) / cycle) * 60).toFixed(1);
    out.textContent = this.t("cycle_info", { c: this._duration(cycle), r: rate });
    this.shadowRoot.querySelectorAll(`[data-action=density][data-li="${li}"]`).forEach((chip) => chip.setAttribute("aria-pressed", String(Number(chip.dataset.value) === grid.density_percent)));
  }

  async _onChange(event) {
    const el = event.target;
    if (el.dataset.outField) { this._onOutputField(el, true); return; }
    const action = el.dataset.actionChange;
    if (action === "upload-category") {
      if (el.value === "__new__") { this._uploadCategory = (await this._prompt(this.t("category_prompt"))) || this._uploadCategory; this._render(); }
      else this._uploadCategory = el.value;
      return;
    }
    if (action === "test-target") { this._testTarget = el.value; return; }
    if (action === "sound-category") {
      let category = el.value;
      if (category === "__new__") category = await this._prompt(this.t("category_prompt"));
      if (category) await this._call("hi_sosed/sound/update", { sound_id: el.dataset.sound, category });
      else this._render();
      return;
    }
    if (el.dataset.targets && this._draft) {
      const path = el.dataset.targets;
      const current = new Set(getPath(this._draft, path) || []);
      if (el.checked) current.add(el.value); else current.delete(el.value);
      setPath(this._draft, path, [...current]);
      this._changed({ render: path !== "target_entity_ids" || this._draft.layers.length > 1 });
      return;
    }
    if (el.dataset.bind && this._draft && (el.type === "checkbox" || el.type === "radio" || el.tagName === "SELECT")) {
      setPath(this._draft, el.dataset.bind, this._coerce(el));
      this._changed({ render: Boolean(el.dataset.render) });
    }
  }

  _onOutputField(el, final) {
    const entityId = el.dataset.entity;
    const field = el.dataset.outField;
    const profile = this._outputs?.[entityId] || {};
    if (field === "volume_on") { this._saveOutput(entityId, { volume: el.checked ? (profile.volume ?? 50) : null }); this._render(); return; }
    if (field === "volume") { const out = el.nextElementSibling; if (out) out.textContent = `${el.value}%`; }
    if (!final && field !== "volume") return;
    const value = field === "kind" ? el.value : Number(el.value);
    if (field !== "kind" && Number.isNaN(value)) return;
    this._saveOutput(entityId, { [field]: value });
    if (field === "kind") this._render();
  }

  async _onClick(event) {
    const el = event.target.closest("[data-action]");
    if (!el || el.disabled) return;
    const a = el.dataset.action;
    const d = this._draft;
    const li = el.dataset.li != null ? Number(el.dataset.li) : null;
    if (el.tagName === "BUTTON") event.preventDefault();
    switch (a) {
      case "tab": await this._flushSave(); this._tab = el.dataset.tab; this._render(); break;
      case "retry": this._loadError = null; this._render(); this._connect(); break;
      case "select": await this._flushSave(); this._selectedId = el.dataset.id; this._draft = this._strip(this._scenario); this._managePresets = false; this._render(); break;
      case "back": await this._flushSave(); this._selectedId = null; this._draft = null; this._render(); break;
      case "new-scenario": await this._createScenario(); break;
      case "duplicate": await this._duplicateScenario(); break;
      case "delete-scenario":
        if (await this._confirm(this.t("confirm_delete_program", { n: d.name }), this.t("delete"))) {
          clearTimeout(this._saveTimer); this._dirty = false;
          if (await this._call("hi_sosed/scenario/delete", { scenario_id: d.id }) !== null) { this._selectedId = null; this._draft = null; await this._reload(); this._render(); }
        }
        break;
      case "run-menu": {
        const minutes = await this._choose(this.t("run_now"), RUN_MINUTES.map((m) => [m < 60 ? this.t("run_for", { m }) : this.t("run_hours", { h: m / 60 }), m]));
        if (minutes) await this._act("run_now", { minutes });
        break;
      }
      case "cancel-run": await this._act("cancel_run"); break;
      case "stop": await this._act("stop"); break;
      case "regenerate": await this._act("regenerate", el.dataset.layer ? { layer_id: el.dataset.layer } : {}, this.t("regenerated")); break;
      case "snooze-menu": {
        const minutes = await this._choose(this.t("snooze"), SNOOZE_MINUTES.map((m) => [m < 60 ? this.t("snooze_for", { m }) : `${this.t("snooze")} ${this.t("run_hours", { h: m / 60 })}`, m]));
        if (minutes) await this._call("hi_sosed/snooze", { minutes });
        break;
      }
      case "resume": await this._call("hi_sosed/snooze", { minutes: 0 }); break;
      case "preset-apply": await this._act("apply_preset", { preset_id: el.dataset.id }); break;
      case "preset-capture": {
        const name = await this._prompt(this.t("preset_name_prompt"), `${this.t("presets").slice(0, -1)} ${d.presets.length + 1}`);
        if (name) await this._act("capture_preset", { name });
        break;
      }
      case "preset-overwrite": {
        const preset = d.presets.find((p) => p.id === el.dataset.id);
        if (preset) await this._act("capture_preset", { name: preset.name, preset_id: preset.id }, this.t("saved"));
        break;
      }
      case "preset-rename": {
        const preset = d.presets.find((p) => p.id === el.dataset.id);
        const name = preset && await this._prompt(this.t("preset_rename"), preset.name);
        if (name) { preset.name = name; this._changed({ render: true }); }
        break;
      }
      case "preset-delete": {
        const preset = d.presets.find((p) => p.id === el.dataset.id);
        if (preset && await this._confirm(this.t("confirm_delete_preset", { n: preset.name }), this.t("delete"))) {
          d.presets = d.presets.filter((p) => p !== preset);
          if (d.active_preset_id === preset.id) d.active_preset_id = null;
          this._changed({ render: true });
        }
        break;
      }
      case "presets-manage": this._managePresets = !this._managePresets; this._render(); break;
      case "layer-add": d.layers.push(newLayer(`${this.t("layer")} ${d.layers.length + 1}`)); this._changed({ render: true }); break;
      case "layer-dup": { const copy = clone(d.layers[li]); copy.id = uuid(); copy.name = `${copy.name} ${this.t("copy_suffix")}`; d.layers.splice(li + 1, 0, copy); this._changed({ render: true }); break; }
      case "layer-del":
        if (await this._confirm(this.t("confirm_delete_layer", { n: d.layers[li].name }), this.t("delete"))) { d.layers.splice(li, 1); this._changed({ render: true }); }
        break;
      case "layer-move": { const to = li + Number(el.dataset.delta); [d.layers[li], d.layers[to]] = [d.layers[to], d.layers[li]]; this._changed({ render: true }); break; }
      case "layer-collapse": { const id = el.dataset.id; if (this._collapsed.has(id)) this._collapsed.delete(id); else this._collapsed.add(id); this._render(); break; }
      case "density": d.layers[li].grid.density_percent = Number(el.dataset.value); this._changed({ render: true }); break;
      case "layer-volume": d.layers[li].volume = el.checked ? (d.layers[li].volume ?? 60) : null; this._changed({ render: true }); break;
      case "layer-schedule": d.layers[li].schedule = el.dataset.mode === "own" ? clone(d.layers[li].schedule || d.schedule) : null; this._changed({ render: true }); break;
      case "layer-targets":
        this._ownTargets ||= new Set();
        if (el.dataset.mode === "own") this._ownTargets.add(d.layers[li].id);
        else { this._ownTargets.delete(d.layers[li].id); d.layers[li].target_entity_ids = []; this._changed(); }
        this._render();
        break;
      case "weight": { const ref = d.layers[li].sounds[Number(el.dataset.si)]; ref.weight = Math.max(1, Math.min(100, ref.weight + Number(el.dataset.delta))); el.parentElement.querySelector("span").textContent = ref.weight; this._changed(); break; }
      case "sound-remove": d.layers[li].sounds.splice(Number(el.dataset.si), 1); this._changed({ render: true }); break;
      case "sounds-all": d.layers[li].sounds.forEach((ref) => { ref.enabled = el.dataset.on === "1"; }); this._changed({ render: true }); break;
      case "picker": await this._pickerDialog(li); break;
      case "play-browser": await this._playBrowser(el.dataset.sound); break;
      case "play-speaker": await this._playSpeaker(el.dataset.sound, li); break;
      case "sched-add": this._schedule(el.dataset.path).days[Number(el.dataset.day)].push({ start: "10:00", end: "18:00" }); this._changed({ render: true }); break;
      case "sched-del": this._schedule(el.dataset.path).days[Number(el.dataset.day)].splice(Number(el.dataset.i), 1); this._changed({ render: true }); break;
      case "sched-copy": {
        const schedule = this._schedule(el.dataset.path);
        const source = schedule.days[Number(el.dataset.day)];
        const targets = el.dataset.mode === "all" ? [0, 1, 2, 3, 4, 5, 6] : [0, 1, 2, 3, 4];
        for (const day of targets) schedule.days[day] = clone(source);
        this._changed({ render: true });
        break;
      }
      case "sched-quick": {
        const modes = {
          weekdays: () => week([{ start: "09:00", end: "18:00" }], [0, 1, 2, 3, 4]),
          daily: () => week([{ start: "10:00", end: "22:00" }], [0, 1, 2, 3, 4, 5, 6]),
          break: () => week([{ start: "10:00", end: "13:00" }, { start: "14:00", end: "19:00" }], [0, 1, 2, 3, 4]),
          clear: () => emptyWeek(),
        };
        setPath(d, el.dataset.path, modes[el.dataset.mode]());
        this._changed({ render: true });
        break;
      }
      case "choose-files": this._pickFiles(); break;
      case "lib-filter": this._libFilter = el.dataset.cat; this._render(); break;
      case "lib-scan": await this._call("hi_sosed/sound/scan", {}, (r) => this.t("scan_result", { n: r.added })); break;
      case "lib-starter": await this._call("hi_sosed/sound/starter", {}, (r) => this.t("starter_result", { n: r.added })); break;
      case "lib-uri": {
        const uri = await this._prompt(this.t("uri_prompt"), "media-source://media_source/local/");
        if (uri) await this._call("hi_sosed/sound/add_uri", { media_content_id: uri, name: decodeURIComponent(uri.split("/").pop() || "").replace(/\.[^.]+$/, ""), category: this._uploadCategory || undefined }, this.t("done_ok"));
        break;
      }
      case "sound-rename": {
        const sound = this._sounds[el.dataset.sound];
        const name = sound && await this._prompt(this.t("rename"), sound.name);
        if (name) await this._call("hi_sosed/sound/update", { sound_id: sound.id, name });
        break;
      }
      case "sound-delete": {
        const sound = this._sounds[el.dataset.sound];
        if (!sound) break;
        const used = sound.usage > 0;
        const ok = await this._confirm(used ? this.t("confirm_delete_used", { n: sound.name, c: sound.usage }) : this.t("confirm_delete_sound", { n: sound.name }), this.t("delete"));
        if (ok) await this._call("hi_sosed/sound/delete", { sound_id: sound.id, force: used });
        break;
      }
      case "out-test": await this._call("hi_sosed/output/test", { entity_id: el.dataset.entity }, this.t("sent_to_speaker")); break;
      case "out-recommend": { const kind = this._outputs?.[el.dataset.entity]?.kind || "other"; this._saveOutput(el.dataset.entity, { kind, ...RECOMMENDED[kind] }); this._render(); break; }
      case "out-reset": delete this._outputs[el.dataset.entity]; await this._call("hi_sosed/output/delete", { entity_id: el.dataset.entity }); this._render(); break;
      case "copy": try { await navigator.clipboard.writeText(el.dataset.text); this._toast(this.t("copied")); } catch { this._toast(el.dataset.text); } break;
      default: break;
    }
  }

  _schedule(path) {
    return getPath(this._draft, path);
  }

  async _createScenario() {
    await this._flushSave();
    const choice = await this._templateDialog();
    if (!choice) return;
    const targets = Object.keys(this._outputs || {}).filter((id) => this._hass.states[id]);
    const base = {
      id: uuid(), revision: null, name: (choice.name || "").trim() || this.t("new_program"), enabled: true,
      target_entity_ids: targets.length ? targets : this._players.slice(0, 1).map((p) => p.entity_id),
      schedule: week([{ start: "10:00", end: "18:00" }], [0, 1, 2, 3, 4]), presets: [], active_preset_id: null,
      layers: [newLayer(`${this.t("layer")} 1`)],
    };
    if (choice.tpl === "break") {
      base.schedule = week([{ start: "10:00", end: "13:00" }, { start: "14:00", end: "19:00" }], [0, 1, 2, 3, 4]);
      base.schedule.days[5] = [{ start: "11:00", end: "16:00" }];
    } else if (choice.tpl === "two") {
      base.layers = [
        newLayer(this._ru ? "Основа" : "Base", { grid: { slot_seconds: 2, slot_count: 120, density_percent: 30 } }),
        newLayer(this._ru ? "Акценты" : "Accents", { grid: { slot_seconds: 5, slot_count: 60, density_percent: 8 }, overlap: "skip" }),
      ];
    }
    const result = await this._call("hi_sosed/scenario/save", { scenario: base });
    if (!result) return;
    this._data.scenarios.push(result.scenario);
    this._selectedId = result.scenario.id;
    this._draft = this._strip(result.scenario);
    this._render();
  }

  async _duplicateScenario() {
    await this._flushSave();
    const copy = clone(this._draft);
    copy.id = uuid();
    copy.revision = null;
    copy.name = `${copy.name} ${this.t("copy_suffix")}`.slice(0, 80);
    copy.enabled = false;
    const ids = new Map(copy.layers.map((layer) => [layer.id, uuid()]));
    copy.layers.forEach((layer) => { layer.id = ids.get(layer.id); });
    copy.presets.forEach((preset) => { preset.id = uuid(); preset.layers.forEach((item) => { item.layer_id = ids.get(item.layer_id) || item.layer_id; }); });
    copy.active_preset_id = null;
    const result = await this._call("hi_sosed/scenario/save", { scenario: copy });
    if (!result) return;
    this._data.scenarios.push(result.scenario);
    this._selectedId = result.scenario.id;
    this._draft = this._strip(result.scenario);
    this._render();
  }
}

customElements.define("hi-sosed-panel", HiSosedPanel);
