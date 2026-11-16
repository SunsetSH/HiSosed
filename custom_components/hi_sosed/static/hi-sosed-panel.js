// HiSosed panel: a view of backend state. It never schedules sound itself (HS-FR-044).

const STRINGS = {
  tab_programs: ["Программы", "Programs"],
  tab_library: ["Звуки", "Sounds"],
  tab_speakers: ["Колонки", "Speakers"],
  tab_help: ["Как это работает", "How it works"],
  loading: ["Загружаю…", "Loading…"],
  load_failed: ["Не получилось загрузить данные HiSosed", "Couldn't load HiSosed data"],
  retry: ["Попробовать ещё раз", "Try again"],
  snooze: ["Тишина", "Quiet"],
  snooze_title: ["Тишина во всех программах", "Quiet in every program"],
  snooze_hint: ["Звуки, которые выпадут на это время, просто пропустятся.", "Sounds that fall into this time are simply skipped."],
  snoozed_until: ["Тихо до {t}", "Quiet until {t}"],
  resume: ["Вернуть звук", "Sound back on"],
  nothing_playing: ["Сейчас тихо", "All quiet"],
  for_minutes: ["{m} мин", "{m} min"],
  for_hours: ["{h} ч", "{h} h"],
  new_program: ["Новая программа", "New program"],
  start_title: ["С чего начать", "Getting started"],
  start_lead: ["Три шага, и всё заработает.", "Three steps and you're set."],
  start_1: ["Добавьте звуки: свои файлы или стартовый набор, чтобы попробовать.", "Add sounds: your own files, or the starter pack to try things out."],
  start_1_btn: ["К звукам", "Go to sounds"],
  start_2: ["Убедитесь, что колонка играет: во вкладке «Колонки» есть кнопка «Проверить звук».", "Make sure the speaker works: the Speakers tab has a “Test sound” button."],
  start_2_btn: ["К колонкам", "Go to speakers"],
  start_3: ["Создайте программу и укажите, когда ей играть.", "Create a program and choose when it plays."],
  pick_program: ["Выберите программу в списке.", "Pick a program from the list."],
  back: ["К списку", "Back to list"],
  name: ["Название", "Name"],
  schedule_enabled: ["Играть по расписанию", "Play on schedule"],
  run_now: ["Включить сейчас", "Play now"],
  run_title: ["Сколько играть?", "Play for how long?"],
  run_hint: ["Программа зазвучит сразу, не дожидаясь расписания, а потом вернётся к нему.", "The program starts right away, ignoring the schedule, then goes back to it."],
  end_manual: ["Вернуться к расписанию", "Back to schedule"],
  stop: ["Остановить", "Stop"],
  stop_hint: ["Выключает расписание. Включить обратно можно переключателем «Играть по расписанию».", "Turns the schedule off. Switch “Play on schedule” back on to resume."],
  regenerate: ["Перемешать", "Shuffle"],
  regenerate_hint: ["Заново выбрать, в какие моменты звучат звуки", "Pick new random moments for the sounds"],
  regenerated: ["Порядок перемешан", "Shuffled"],
  duplicate: ["Сделать копию", "Duplicate"],
  delete: ["Удалить", "Delete"],
  copy_suffix: ["(копия)", "(copy)"],
  saved: ["Сохранено", "Saved"],
  saving: ["Сохраняю…", "Saving…"],
  save_error: ["Не сохранилось", "Not saved"],
  status_off: ["Расписание выключено, программа молчит.", "The schedule is off, so the program stays silent."],
  status_layers_off: ["Все дорожки выключены, играть нечему.", "Every layer is off, so there is nothing to play."],
  status_running: ["Играет до {t}.", "Playing until {t}."],
  status_manual: ["Включена вручную, играет до {t}.", "Started by hand, playing until {t}."],
  status_waiting: ["Заиграет {w}.", "Starts {w}."],
  status_snoozed: ["Сейчас тишина, звук вернётся в {t}.", "Quiet for now, sound comes back at {t}."],
  status_idle: ["Пока не может играть: {why}.", "Can't play yet: {why}."],
  status_error: ["Есть проблема: {e}.", "Something's wrong: {e}."],
  today_at: ["сегодня в {t}", "today at {t}"],
  tomorrow_at: ["завтра в {t}", "tomorrow at {t}"],
  weekday_at: ["{d} в {t}", "{d} at {t}"],
  weekdays_on: [["в понедельник", "во вторник", "в среду", "в четверг", "в пятницу", "в субботу", "в воскресенье"], ["on Monday", "on Tuesday", "on Wednesday", "on Thursday", "on Friday", "on Saturday", "on Sunday"]],
  presets: ["Режимы", "Modes"],
  presets_hint: ["Режим запоминает, какие дорожки и звуки включены, как часто они звучат и насколько громко. Расписание и колонки он не трогает.", "A mode remembers which layers and sounds are on, how often they play and how loud. It leaves the schedule and speakers alone."],
  preset_save: ["Запомнить как режим", "Save as a mode"],
  preset_name_prompt: ["Как назвать режим?", "What should this mode be called?"],
  preset_default_name: ["Режим {n}", "Mode {n}"],
  preset_modified: ["есть правки", "edited"],
  preset_overwrite: ["Записать в этот режим текущие настройки", "Save the current settings into this mode"],
  preset_overwritten: ["Режим обновлён", "Mode updated"],
  preset_rename: ["Переименовать", "Rename"],
  preset_manage: ["Изменить", "Edit"],
  done: ["Готово", "Done"],
  no_presets: ["Пока ни одного. Настройте дорожки как нравится и запомните, потом переключитесь в один клик.", "None yet. Set the layers up the way you like and save them, then switch in one click."],
  program_speakers: ["Где играть", "Where it plays"],
  no_players: ["Home Assistant пока не видит ни одной колонки. Как её подключить, рассказано во вкладке «Колонки».", "Home Assistant doesn't see any speakers yet. The Speakers tab explains how to connect one."],
  program_schedule: ["Когда играть", "When it plays"],
  schedule_hint: ["В один день можно задать несколько промежутков, между ними будет пауза. Если конец раньше начала, промежуток заканчивается на следующий день (например, 22:00–02:00). Одинаковые начало и конец означают «весь день».", "A day can have several time ranges with pauses in between. If the end is earlier than the start, the range runs past midnight (say 22:00–02:00). The same start and end means all day."],
  layers: ["Дорожки", "Layers"],
  layers_hint: ["Каждая дорожка играет сама по себе, в своём случайном порядке. Чтобы временно заглушить дорожку, просто выключите её.", "Each layer plays on its own, in its own random order. To mute one for a while, just switch it off."],
  layers_on: ["Дорожки: {on} из {all}", "Layers: {on} of {all}"],
  add_layer: ["Добавить дорожку", "Add layer"],
  layer: ["Дорожка", "Layer"],
  layer_on: ["Дорожка включена", "Layer on"],
  move_up: ["Поднять", "Move up"],
  move_down: ["Опустить", "Move down"],
  expand: ["Развернуть", "Expand"],
  collapse: ["Свернуть", "Collapse"],
  frequency: ["Как часто", "How often"],
  density: ["Частота", "Frequency"],
  dens_rare: ["Редко", "Rarely"],
  dens_some: ["Иногда", "Sometimes"],
  dens_mid: ["Средне", "Medium"],
  dens_often: ["Часто", "Often"],
  dens_all: ["Без пауз", "Non-stop"],
  rate_info: ["Выходит {rate}, в среднем раз в {every}.", "That's {rate}, about once every {every}."],
  rate_none: ["При частоте 0% дорожка молчит.", "At 0% the layer stays silent."],
  advanced: ["Тонкая настройка", "Fine-tuning"],
  slot_seconds: ["Длина шага, с", "Step length, s"],
  slot_count: ["Шагов в цикле", "Steps per cycle"],
  advanced_hint: ["Время делится на шаги. В начале каждого цикла HiSosed заново решает, на каких шагах прозвучит звук. Сейчас цикл длится {cycle}.", "Time is split into steps. At the start of every cycle HiSosed picks again which steps get a sound. One cycle now lasts {cycle}."],
  volume: ["Громкость", "Volume"],
  own_volume: ["Своя громкость для этой дорожки", "Own volume for this layer"],
  volume_hint: ["Если не задавать, возьмётся громкость колонки из вкладки «Колонки».", "If unset, the speaker volume from the Speakers tab is used."],
  overlap: ["Если колонка уже занята другой дорожкой", "If another layer is using the speaker"],
  overlap_replace: ["Прервать её и сыграть свой звук", "Interrupt it and play"],
  overlap_skip: ["Не мешать, свой звук пропустить", "Don't interrupt, skip this sound"],
  when_plays: ["Когда играет", "When it plays"],
  as_program: ["Как вся программа", "Same as the program"],
  own_schedule: ["По своему расписанию", "On its own schedule"],
  where_plays: ["Где играет", "Where it plays"],
  own_speakers: ["На своих колонках", "On its own speakers"],
  sounds: ["Звуки", "Sounds"],
  add_sounds: ["Добавить звуки", "Add sounds"],
  all_on: ["Включить все", "All on"],
  all_off: ["Выключить все", "All off"],
  no_layer_sounds: ["Здесь пока пусто. Добавьте звуки из библиотеки или просто перетащите сюда файлы.", "Nothing here yet. Add sounds from the library or just drop files here."],
  weight: ["Вес", "Weight"],
  weight_hint: ["Чем больше вес, тем чаще звучит этот звук", "The higher the weight, the more often this sound plays"],
  play_browser: ["Послушать здесь", "Listen here"],
  play_speaker: ["Сыграть на колонке", "Play on speaker"],
  remove: ["Убрать", "Remove"],
  played: ["Сыграно", "Played"],
  skipped: ["Пропущено", "Skipped"],
  errors: ["Ошибки", "Errors"],
  cycle_n: ["Цикл {n}", "Cycle {n}"],
  cell_of: ["шаг {i} из {n}", "step {i} of {n}"],
  legend_past: ["уже прошло", "done"],
  legend_now: ["сейчас", "now"],
  legend_active: ["будет звук", "sound"],
  legend_silent: ["пауза", "pause"],
  next_event: ["Начнёт {w}", "Starts {w}"],
  grid_waiting: ["Когда дорожка заиграет, здесь будет видно, в какие моменты прозвучат звуки.", "Once the layer starts, you'll see here when its sounds will play."],
  shared_target_warn: ["Несколько дорожек играют на одной колонке. Колонка за раз воспроизводит только один звук, поэтому они будут перебивать друг друга. Чтобы дорожки звучали одновременно, дайте им разные колонки (подробнее во вкладке «Колонки»).", "Several layers share one speaker. A speaker plays one sound at a time, so they'll cut each other off. To hear them together, give the layers different speakers (see the Speakers tab)."],
  days_short: [["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"], ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]],
  time_from: ["с", "from"],
  time_to: ["до", "to"],
  add_range: ["Время", "Time"],
  add_range_hint: ["Добавить промежуток", "Add a time range"],
  copy_all: ["То же во все дни", "Same on every day"],
  copy_weekdays: ["То же по будням", "Same on weekdays"],
  quick_weekdays: ["Будни 9–18", "Weekdays 9–18"],
  quick_daily: ["Каждый день 10–22", "Every day 10–22"],
  quick_break: ["Будни с обедом", "Weekdays with lunch"],
  quick_clear: ["Очистить", "Clear"],
  day_off: ["не играет", "off"],
  st_disabled: ["Выключена", "Off"],
  st_idle: ["Не готова", "Not ready"],
  st_waiting: ["Ждёт начала", "Waiting"],
  st_running: ["Играет", "Playing"],
  st_snoozed: ["Тишина", "Quiet"],
  st_error: ["Проблема с колонкой", "Speaker problem"],
  issue_no_sounds: ["нет звуков", "no sounds"],
  issue_no_targets: ["не выбрана колонка", "no speaker"],
  issue_no_schedule: ["в расписании нет времени", "the schedule is empty"],
  template_title: ["Новая программа", "New program"],
  tpl_empty: ["С чистого листа", "From scratch"],
  tpl_empty_d: ["Одна дорожка, по будням с 10 до 18.", "One layer, weekdays 10 to 6."],
  tpl_break: ["С перерывом на обед", "With a lunch break"],
  tpl_break_d: ["Будни 10–13 и 14–19, в субботу 11–16.", "Weekdays 10–13 and 14–19, Saturday 11–16."],
  tpl_two: ["Фон и редкие акценты", "Background and rare accents"],
  tpl_two_d: ["Одна дорожка звучит часто, вторая изредка и не перебивает первую.", "One layer plays often, the other now and then without cutting in."],
  create: ["Создать", "Create"],
  cancel: ["Отмена", "Cancel"],
  delete_program_title: ["Удалить программу?", "Delete this program?"],
  confirm_delete_program: ["«{n}» пропадёт вместе с дорожками и режимами. Звуки останутся в библиотеке.", "“{n}” goes away with its layers and modes. Your sounds stay in the library."],
  delete_layer_title: ["Удалить дорожку?", "Delete this layer?"],
  confirm_delete_layer: ["«{n}» пропадёт вместе со своими настройками. Если нужно просто заглушить её, хватит выключателя.", "“{n}” goes away with its settings. If you only want it quiet, switching it off is enough."],
  delete_preset_title: ["Удалить режим?", "Delete this mode?"],
  confirm_delete_preset: ["Режим «{n}» пропадёт, а дорожки останутся как сейчас.", "The mode “{n}” goes away; the layers stay as they are now."],
  delete_sound_title: ["Удалить звук?", "Delete this sound?"],
  confirm_delete_sound: ["Файл «{n}» удалится с диска насовсем.", "The file “{n}” will be deleted from disk for good."],
  confirm_delete_link: ["«{n}» пропадёт из библиотеки. Сам файл останется на месте.", "“{n}” leaves the library. The file itself stays where it is."],
  confirm_delete_used: ["Этот звук {used}. Если его удалить, он пропадёт и оттуда.", "This sound is {used}. Deleting it removes it there too."],
  upload_title: ["Добавить свои звуки", "Add your own sounds"],
  drop_files: ["Перетащите сюда аудиофайлы", "Drop audio files here"],
  or: ["или", "or"],
  choose_files: ["Выбрать файлы", "Choose files"],
  upload_limits: ["Подойдут MP3, WAV, OGG, OPUS, M4A, AAC и FLAC размером до {mb} МБ. Файлы сохраняются в {path}.", "MP3, WAV, OGG, OPUS, M4A, AAC and FLAC up to {mb} MB each. Files are saved to {path}."],
  upload_category: ["В какую категорию", "Category"],
  new_category: ["Новая категория…", "New category…"],
  category_prompt: ["Как назвать категорию?", "Category name"],
  search: ["Найти звук", "Find a sound"],
  all_categories: ["Все", "All"],
  scan_folder: ["Проверить папку", "Check the folder"],
  scan_hint: ["Файлы можно закинуть и по сети (Samba) в папку {path}, а потом нажать «Проверить папку». Подпапка станет категорией.", "You can also copy files over the network (Samba) into {path} and press “Check the folder”. A subfolder becomes a category."],
  scan_none: ["Новых файлов нет", "No new files"],
  starter: ["Стартовый набор", "Starter pack"],
  starter_none: ["Стартовый набор уже в библиотеке", "The starter pack is already in the library"],
  add_uri: ["Добавить по ссылке", "Add by link"],
  uri_prompt: ["Ссылка на файл из раздела «Медиа» (начинается с media-source://)", "Link to a file from the Media panel (starts with media-source://)"],
  uri_added: ["Звук добавлен", "Sound added"],
  library_empty: ["Звуков пока нет. Загрузите свои или возьмите стартовый набор, чтобы попробовать.", "No sounds yet. Upload your own or grab the starter pack to try things out."],
  unused: ["пока нигде не звучит", "not used yet"],
  rename: ["Переименовать", "Rename"],
  test_on: ["На какой колонке пробовать", "Speaker to try on"],
  picker_title: ["Какие звуки добавить?", "Which sounds to add?"],
  picker_add: ["Добавить ({n})", "Add ({n})"],
  picker_upload: ["Загрузить новые", "Upload new ones"],
  already: ["уже есть", "already in"],
  speakers_hint: ["HiSosed играет через колонки, которые уже есть в Home Assistant. Bluetooth и звуковую карту он сам не трогает. Здесь можно рассказать, что это за колонка, чтобы звук не обрезался.", "HiSosed plays through speakers Home Assistant already knows. It never touches Bluetooth or the sound card itself. Tell it what kind of speaker this is so sounds don't get cut off."],
  kind: ["Как подключена", "Connected via"],
  kind_bluetooth: ["Bluetooth", "Bluetooth"],
  kind_jack: ["Провод (jack 3.5 или USB-карта)", "Cable (3.5 mm jack or USB card)"],
  kind_network: ["По сети (Cast, Sonos, DLNA…)", "Network (Cast, Sonos, DLNA…)"],
  kind_other: ["Другое", "Other"],
  speaker_volume: ["Своя громкость", "Own volume"],
  warmup: ["Разбудить заранее, с", "Wake up early, s"],
  warmup_hint: ["Перед началом колонка включится и получит немного тишины, чтобы не проглотить первый звук.", "Before playback starts the speaker is turned on and fed a little silence so it doesn't swallow the first sound."],
  keepalive: ["Не давать уснуть", "Keep awake"],
  keepalive_off: ["нет", "no"],
  keepalive_every: ["тишина раз в {d}", "silence every {d}"],
  keepalive_hint: ["Bluetooth-колонки засыпают в паузах и потом съедают начало звука. Короткая тишина время от времени не даёт им уснуть.", "Bluetooth speakers doze off in pauses and then eat the start of a sound. A bit of silence now and then keeps them awake."],
  lead: ["Отправлять раньше, мс", "Send early, ms"],
  lead_hint: ["Команда уйдёт на столько раньше, чтобы звук попал точно в свой момент. Bluetooth обычно запаздывает на 150–400 мс.", "The command goes out this much earlier so the sound lands on time. Bluetooth usually lags 150–400 ms."],
  recommended: ["Подобрать настройки", "Suggest settings"],
  recommended_done: ["Подобраны настройки для типа «{k}»", "Settings for “{k}” applied"],
  test_signal: ["Проверить звук", "Test sound"],
  reset_profile: ["Сбросить", "Reset"],
  ps_playing: ["играет", "playing"],
  ps_paused: ["на паузе", "paused"],
  ps_idle: ["свободна", "idle"],
  ps_on: ["включена", "on"],
  ps_off: ["выключена", "off"],
  ps_standby: ["спит", "standby"],
  ps_buffering: ["загружает", "buffering"],
  ps_unavailable: ["недоступна", "unavailable"],
  ps_unknown: ["неизвестно", "unknown"],
  guide_title: ["Как подключить колонку, если Home Assistant стоит в Proxmox", "Connecting a speaker when Home Assistant runs in Proxmox"],
  copy: ["Скопировать", "Copy"],
  copied: ["Скопировано", "Copied"],
  err_generic: ["Что-то пошло не так ({c})", "Something went wrong ({c})"],
  sent_to_speaker: ["Отправлено на колонку", "Sent to the speaker"],
  no_test_target: ["Сначала выберите колонку", "Choose a speaker first"],
  conflict_reloaded: ["Программу только что изменили в другом окне. Показываю свежую версию.", "The program was just changed in another window. Showing the latest version."],
};

// Plural forms: Russian has three (1, 2–4, 5+), English two.
const PLURALS = {
  playing: [["Играет {n} программа", "Играют {n} программы", "Играют {n} программ"], ["{n} program playing", "{n} programs playing"]],
  uploaded: [["Загружен {n} файл", "Загружено {n} файла", "Загружено {n} файлов"], ["Uploaded {n} file", "Uploaded {n} files"]],
  failed: [["{n} файл не загрузился", "{n} файла не загрузились", "{n} файлов не загрузились"], ["{n} file failed", "{n} files failed"]],
  found: [["Нашёлся {n} новый файл", "Нашлось {n} новых файла", "Нашлось {n} новых файлов"], ["Found {n} new file", "Found {n} new files"]],
  added: [["Добавлен {n} звук", "Добавлено {n} звука", "Добавлено {n} звуков"], ["Added {n} sound", "Added {n} sounds"]],
  used: [["есть в {n} программе", "есть в {n} программах", "есть в {n} программах"], ["used in {n} program", "used in {n} programs"]],
  sounds: [["{n} звук", "{n} звука", "{n} звуков"], ["{n} sound", "{n} sounds"]],
  per_minute: [["примерно {n} звук в минуту", "примерно {n} звука в минуту", "примерно {n} звуков в минуту"], ["about {n} sound a minute", "about {n} sounds a minute"]],
  per_hour: [["примерно {n} звук в час", "примерно {n} звука в час", "примерно {n} звуков в час"], ["about {n} sound an hour", "about {n} sounds an hour"]],
};

const ERRORS = {
  revision_conflict: ["Программу изменили в другом окне", "The program was changed in another window"],
  scenario_not_found: ["Такой программы уже нет", "This program no longer exists"],
  scenario_not_running: ["Сейчас ничего не играет, перемешивать нечего", "Nothing is playing, so there's nothing to shuffle"],
  layer_not_found: ["Такой дорожки уже нет", "This layer no longer exists"],
  sound_not_found: ["Такого звука уже нет", "This sound no longer exists"],
  preset_not_found: ["Такого режима уже нет", "This mode no longer exists"],
  output_not_found: ["Для этой колонки ничего не настроено", "Nothing is set up for this speaker"],
  missing_name: ["Дайте программе название", "Give the program a name"],
  missing_preset_name: ["Дайте режиму название", "Give the mode a name"],
  invalid_time: ["Время указано неверно", "That time doesn't look right"],
  invalid_schedule: ["В расписании ошибка", "Something's off in the schedule"],
  invalid_slot_seconds: ["Шаг может длиться от 1 до 600 секунд", "A step can last 1 to 600 seconds"],
  invalid_slot_count: ["Шагов в цикле может быть от 1 до 1800", "A cycle can have 1 to 1800 steps"],
  invalid_density: ["Частота бывает от 0 до 100%", "Frequency goes from 0 to 100%"],
  invalid_volume: ["Громкость бывает от 0 до 100", "Volume goes from 0 to 100"],
  invalid_warmup: ["Разбудить можно за 0–120 секунд", "Wake-up can be 0 to 120 seconds"],
  invalid_lead: ["Отправить раньше можно на 0–3000 мс", "Send-early can be 0 to 3000 ms"],
  invalid_keepalive: ["«Не давать уснуть» можно не чаще раза в 15 секунд", "Keep-awake can't be more often than every 15 seconds"],
  invalid_duration: ["Такой срок не подходит", "That duration won't work"],
  invalid_targets: ["Такой колонки нет", "There's no such speaker"],
  duplicate_sound: ["Этот звук уже есть в дорожке", "This sound is already in the layer"],
  unknown_sound: ["Одного из звуков уже нет в библиотеке", "One of the sounds is gone from the library"],
  sound_in_use: ["Этот звук используется в программах", "This sound is used by a program"],
  too_many_presets: ["Режимов слишком много, удалите лишние", "Too many modes, delete a few"],
  invalid_preset: ["Режимов может быть не больше 30", "A program can have at most 30 modes"],
  invalid_layers: ["Дорожек может быть от 1 до 20", "A program needs 1 to 20 layers"],
  no_targets: ["Не выбрана ни одна колонка", "No speaker selected"],
  target_unavailable: ["Колонка недоступна", "The speaker is unavailable"],
  target_busy: ["Колонка ещё занята прошлой командой", "The speaker is still busy with the last command"],
  player_timeout: ["Колонка не ответила", "The speaker didn't respond"],
  player_error: ["Колонка вернула ошибку", "The speaker reported an error"],
  unsupported_audio_format: ["Это не похоже на аудиофайл, или формат не подходит", "This doesn't look like a supported audio file"],
  file_too_large: ["Файл слишком большой", "The file is too big"],
  file_required: ["Файл не выбран", "No file chosen"],
  library_full: ["В библиотеке не осталось места", "The library is full"],
  invalid_media_source: ["Ссылка должна начинаться с media-source://", "The link should start with media-source://"],
  integration_not_ready: ["HiSosed ещё запускается, попробуйте через пару секунд", "HiSosed is still starting, try again in a moment"],
  unauthorized: ["Это может делать только администратор", "Only an administrator can do this"],
  network_error: ["Нет связи с Home Assistant", "Can't reach Home Assistant"],
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

const formatSize = (bytes, ru) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} ${ru ? "МБ" : "MB"}` : `${Math.max(1, Math.round(bytes / 1024))} ${ru ? "КБ" : "KB"}`);

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
.status-line { margin:6px 8px 0; font-size:15px; line-height:1.4; }
.status-line.error { color:var(--hs-err); }
.steps { list-style:none; margin:8px 0 0; padding:0; display:grid; gap:10px; text-align:left; width:100%; max-width:560px; }
.steps li { display:grid; grid-template-columns:32px minmax(0,1fr) auto; gap:12px; align-items:center; padding:12px; border:1px solid var(--hs-line); border-radius:12px; color:var(--primary-text-color); }
.steps .num { width:32px; height:32px; border-radius:50%; display:grid; place-items:center; background:var(--hs-soft); font-weight:500; }
.advanced { margin-top:14px; border-top:1px solid var(--hs-line); padding-top:6px; }
.advanced summary { cursor:pointer; color:var(--hs-muted); padding:6px 0; }
@media (max-width: 900px) {
  .split { grid-template-columns:minmax(0,1fr); }
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

  // "{n} sound(s)" with the right grammatical form for the number.
  _p(key, n) {
    const forms = PLURALS[key][this._ru ? 0 : 1];
    let index = n === 1 ? 0 : 1;
    if (this._ru) {
      const mod10 = n % 10;
      const mod100 = n % 100;
      index = mod10 === 1 && mod100 !== 11 ? 0 : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14) ? 1 : 2;
    }
    return forms[index].replaceAll("{n}", n);
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

  // Calendar day in the HA time zone, so "today"/"tomorrow" match the schedule, not the browser.
  _dayNumber(date) {
    let key;
    try { key = date.toLocaleDateString("en-CA", { timeZone: this._hass?.config?.time_zone }); } catch { key = date.toLocaleDateString("en-CA"); }
    return Math.round(Date.parse(`${key}T00:00:00Z`) / 86400000);
  }

  _when(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    const t = this._time(iso);
    const days = this._dayNumber(date) - this._dayNumber(new Date());
    if (days <= 0) return this.t("today_at", { t });
    if (days === 1) return this.t("tomorrow_at", { t });
    if (days < 7) {
      const weekday = (new Date((this._dayNumber(date) * 86400000)).getUTCDay() + 6) % 7;
      return this.t("weekday_at", { d: this.t("weekdays_on")[weekday], t });
    }
    return this._time(iso, true);
  }

  _duration(seconds) {
    const number = (value) => value.toLocaleString(this._ru ? "ru-RU" : "en-GB", { maximumFractionDigits: 1 });
    if (seconds < 60) return this._ru ? `${seconds} с` : `${seconds} s`;
    const minutes = Math.round(seconds / 60);
    if (minutes < 120) return this._ru ? `${minutes} мин` : `${minutes} min`;
    return this._ru ? `${number(minutes / 60)} ч` : `${number(minutes / 60)} h`;
  }

  _rateText(grid) {
    const active = Math.floor(grid.slot_count * grid.density_percent / 100 + 0.5);
    const cycle = grid.slot_seconds * grid.slot_count;
    if (!active || !(cycle > 0)) return this.t("rate_none");
    const perMinute = (active * 60) / cycle;
    const rate = perMinute >= 1 ? this._p("per_minute", Math.round(perMinute)) : this._p("per_hour", Math.max(1, Math.round(perMinute * 60)));
    return this.t("rate_info", { rate, every: this._duration(Math.round(cycle / active)) });
  }

  _playerState(state) {
    const key = `ps_${state}`;
    return STRINGS[key] ? this.t(key) : state;
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
      dirty: ["mdi:cloud-upload-outline", this.t("saving")], error: ["mdi:alert-circle-outline", `${this.t("save_error")}: ${this._saveMessage}`] };
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

  // Returns null on failure and a truthy value on success, even for commands that answer null.
  async _call(type, payload = {}, okText = null) {
    try {
      const result = await this._ws(type, payload);
      if (okText) this._toast(typeof okText === "function" ? okText(result) : okText);
      return result ?? true;
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
    const playing = this._data.scenarios.filter((item) => ["running", "error"].includes(item.runtime?.state)).length;
    const status = playing ? this._p("playing", playing) : this.t("nothing_playing");
    if (snooze) {
      return `<span class="pill"><ha-icon icon="mdi:volume-off" style="--mdc-icon-size:18px"></ha-icon>${this.t("snoozed_until", { t: this._time(snooze) })}</span>
        <button data-action="resume"><ha-icon icon="mdi:volume-high" style="--mdc-icon-size:18px"></ha-icon>${this.t("resume")}</button>`;
    }
    return `<span class="pill hide-narrow"><ha-icon icon="${playing ? "mdi:play-circle" : "mdi:pause-circle-outline"}" style="--mdc-icon-size:18px"></ha-icon>${status}</span>
      <button data-action="snooze-menu" aria-haspopup="dialog"><ha-icon icon="mdi:volume-off" style="--mdc-icon-size:18px"></ha-icon>${this.t("snooze")}</button>`;
  }

  // ------------------------------------------------------------------ programs tab

  _programsHtml() {
    if (!this._data.scenarios.length) return this._startHtml();
    return `<div class="split ${this._draft ? "has-selection" : ""}">
      <aside class="list">
        <button class="btn" data-action="new-scenario"><ha-icon icon="mdi:plus"></ha-icon>${this.t("new_program")}</button>
        <div id="program-list" style="display:grid;gap:8px">${this._programListHtml()}</div>
      </aside>
      <section class="editor">${this._draft ? this._editorHtml() : `<div class="card empty"><ha-icon icon="mdi:gesture-tap"></ha-icon>${this.t("pick_program")}</div>`}</section>
    </div>`;
  }

  // First run: walk through the three things a working program needs.
  _startHtml() {
    const hasSounds = Boolean(this._data.sounds?.length);
    const steps = [
      [this.t("start_1"), `<button class="btn ${hasSounds ? "ghost" : ""} small" data-action="tab" data-tab="library">${this.t("start_1_btn")}</button>`, hasSounds],
      [this.t("start_2"), `<button class="btn ghost small" data-action="tab" data-tab="speakers">${this.t("start_2_btn")}</button>`, false],
      [this.t("start_3"), `<button class="btn ${hasSounds ? "" : "ghost"} small" data-action="new-scenario">${this.t("new_program")}</button>`, false],
    ];
    return `<div class="card empty"><ha-icon icon="mdi:music-note-plus"></ha-icon>
      <h2 style="margin:0">${this.t("start_title")}</h2><div>${this.t("start_lead")}</div>
      <ol class="steps">${steps.map(([text, button, done], i) => `<li><span class="num">${done ? `<ha-icon icon="mdi:check" style="--mdc-icon-size:18px;opacity:1"></ha-icon>` : i + 1}</span><span>${text}</span>${button}</li>`).join("")}</ol>
    </div>`;
  }

  _programListHtml() {
    return this._data.scenarios.map((item) => {
      const state = item.runtime?.state || "disabled";
      const on = item.layers.filter((layer) => layer.enabled).length;
      const preset = item.presets.find((p) => p.id === item.active_preset_id);
      return `<button class="prog" data-action="select" data-id="${item.id}" aria-current="${item.id === this._selectedId}">
        <b>${escapeHtml(item.id === this._selectedId && this._draft ? this._draft.name : item.name)}</b>
        <span class="row"><span class="badge ${state}">${this.t(`st_${state}`)}</span>${preset ? `<span class="cat">${escapeHtml(preset.name)}</span>` : ""}</span>
        <small>${this.t("layers_on", { on, all: item.layers.length })}${this._nextText(item)}</small>
      </button>`;
    }).join("");
  }

  _nextText(item) {
    const runtime = item.runtime;
    if (runtime?.override_until) return ` · ${this.t("time_to")} ${this._time(runtime.override_until)}`;
    const upcoming = this._nextStart(runtime);
    return upcoming && runtime.state !== "running" ? ` · ${this._when(upcoming)}` : "";
  }

  _nextStart(runtime) {
    return Object.values(runtime?.layers || {}).filter((l) => l.state === "waiting" && l.next_event).map((l) => l.next_event).sort()[0];
  }

  // One plain sentence about what the program is doing, so nobody has to decode badges.
  _statusText(scenario, runtime) {
    const layers = Object.values(runtime.layers || {});
    switch (runtime.state) {
      case "running":
      case "error": {
        const end = runtime.override_until || layers.filter((l) => l.state === "running").map((l) => l.window_end).sort().pop();
        let text = this.t(runtime.override_until ? "status_manual" : "status_running", { t: this._time(end, true) });
        const error = layers.find((l) => l.state === "running" && l.last_error)?.last_error;
        if (runtime.state === "error" && error) text += ` ${this.t("status_error", { e: this._err({ code: error }).toLowerCase() })}`;
        return text;
      }
      case "snoozed": return this.t("status_snoozed", { t: this._time(this._data.settings?.snooze_until) });
      case "waiting": return this.t("status_waiting", { w: this._when(this._nextStart(runtime)) });
      case "idle": {
        const why = [...new Set(layers.map((l) => l.issue).filter(Boolean))].map((issue) => this.t(`issue_${issue}`));
        return this.t("status_idle", { why: why.join(", ") });
      }
      default:
        if (scenario && scenario.enabled && !scenario.layers.some((l) => l.enabled)) return this.t("status_layers_off");
        return this.t("status_off");
    }
  }

  _runControlsHtml(runtime) {
    const sounding = ["running", "snoozed", "error"].includes(runtime.state) || Boolean(runtime.override_until);
    return `<button class="btn" data-action="run-menu"><ha-icon icon="mdi:play"></ha-icon>${this.t("run_now")}</button>
      ${runtime.override_until ? `<button class="btn ghost" data-action="cancel-run"><ha-icon icon="mdi:calendar-clock"></ha-icon>${this.t("end_manual")}</button>` : ""}
      ${runtime.state === "running" || runtime.state === "error" ? `<button class="btn ghost" data-action="regenerate" title="${this.t("regenerate_hint")}"><ha-icon icon="mdi:dice-multiple"></ha-icon>${this.t("regenerate")}</button>` : ""}
      ${sounding && this._draft?.enabled ? `<button class="btn ghost" data-action="stop" title="${this.t("stop_hint")}"><ha-icon icon="mdi:stop"></ha-icon>${this.t("stop")}</button>` : ""}`;
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
        <p class="status-line ${runtime.state === "error" ? "error" : ""}" id="status-line" role="status">${escapeHtml(this._statusText(d, runtime))}</p>
        <div class="row" style="margin-top:8px">
          <label class="switch"><input type="checkbox" data-bind="enabled" data-type="bool" ${d.enabled ? "checked" : ""}><span class="track"></span>${this.t("schedule_enabled")}</label>
        </div>
        <div class="row" style="margin-top:12px">
          <span class="row" id="run-controls">${this._runControlsHtml(runtime)}</span>
          <span class="grow"></span>
          <button class="btn ghost small" data-action="duplicate"><ha-icon icon="mdi:content-copy"></ha-icon>${this.t("duplicate")}</button>
          <button class="btn danger small" data-action="delete-scenario"><ha-icon icon="mdi:delete-outline"></ha-icon>${this.t("delete")}</button>
        </div>
      </div>
      ${d.presets.length ? this._presetsHtml() : ""}
      <div class="card">
        <h2><ha-icon icon="mdi:calendar-clock"></ha-icon>${this.t("program_schedule")}</h2>
        <p class="hint">${this.t("schedule_hint")}</p>
        ${this._weekHtml("schedule", d.schedule)}
      </div>
      <div class="card">
        <h2><ha-icon icon="mdi:speaker-multiple"></ha-icon>${this.t("program_speakers")}</h2>
        ${this._playersPicker("target_entity_ids", d.target_entity_ids)}
      </div>
      <div class="card">
        <h2><ha-icon icon="mdi:layers-triple"></ha-icon>${this.t("layers")}</h2>
        <p class="hint">${this.t("layers_hint")}</p>
        ${this._sharedTargetWarning()}
        ${d.layers.map((layer, index) => this._layerHtml(layer, index, runtime.layers?.[layer.id])).join("")}
        <button class="btn ghost" style="margin-top:12px" data-action="layer-add" ${d.layers.length >= 20 ? "disabled" : ""}><ha-icon icon="mdi:plus"></ha-icon>${this.t("add_layer")}</button>
      </div>
      ${d.presets.length ? "" : this._presetsHtml()}`;
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
      return `<label class="player" title="${escapeHtml(state.entity_id)}"><input type="checkbox" data-targets="${path}" value="${escapeHtml(state.entity_id)}" ${set.has(state.entity_id) ? "checked" : ""}>
        <ha-icon icon="${KIND_ICONS[kind]}"></ha-icon><span class="grow"><b style="font-weight:500">${escapeHtml(this._playerName(state.entity_id))}</b><small>${escapeHtml(this._playerState(state.state))}</small></span></label>`;
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
            <span class="range"><input type="time" aria-label="${days[day]}, ${this.t("time_from")}" value="${escapeHtml(range.start)}" data-bind="${path}.days.${day}.${i}.start">–<input type="time" aria-label="${days[day]}, ${this.t("time_to")}" value="${escapeHtml(range.end)}" data-bind="${path}.days.${day}.${i}.end">
            <button class="icon-btn" data-action="sched-del" data-path="${path}" data-day="${day}" data-i="${i}" aria-label="${this.t("remove")}"><ha-icon icon="mdi:close" style="--mdc-icon-size:16px"></ha-icon></button></span>`).join("") : `<span class="off-label">${this.t("day_off")}</span>`}
            <button class="btn ghost small" data-action="sched-add" data-path="${path}" data-day="${day}" title="${this.t("add_range_hint")}" aria-label="${days[day]}: ${this.t("add_range_hint")}"><ha-icon icon="mdi:plus" style="--mdc-icon-size:16px"></ha-icon>${this.t("add_range")}</button>
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
    const parts = [this._p("sounds", on), this._rateText(layer.grid).replace(/[.]$/, "")];
    if (layer.schedule) parts.push(this.t("own_schedule").toLowerCase());
    if (layer.volume != null) parts.push(`${this.t("volume").toLowerCase()} ${layer.volume}%`);
    return parts.join(" · ");
  }

  _layerHtml(layer, li, rt) {
    const p = `layers.${li}`;
    const collapsed = this._collapsed.has(layer.id);
    const issue = rt?.issue ? ` · ${this.t(`issue_${rt.issue}`)}` : "";
    const state = rt?.state || "disabled";
    const grid = layer.grid;
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
        <label class="field" style="margin-top:10px"><span>${this.t("density")}: <output data-out="dens-${li}">${grid.density_percent}%</output></span><input type="range" min="0" max="100" value="${grid.density_percent}" data-bind="${p}.grid.density_percent" data-type="int" data-out-target="dens-${li}"></label>
        <p class="hint" data-out="rate-${li}">${escapeHtml(this._rateText(grid))}</p>
        <h3>${this.t("volume")}</h3>
        <div class="row"><label class="check"><input type="checkbox" data-action="layer-volume" data-li="${li}" ${layer.volume != null ? "checked" : ""}>${this.t("own_volume")}</label>
          ${layer.volume != null ? `<input type="range" class="grow" min="0" max="100" value="${layer.volume}" data-bind="${p}.volume" data-type="int" data-out-target="vol-${li}" aria-label="${this.t("volume")}"><output data-out="vol-${li}">${layer.volume}%</output>` : ""}</div>
        <p class="hint">${this.t("volume_hint")}</p>
        <h3>${this.t("when_plays")}</h3>
        <div class="radio"><label><input type="radio" name="sc-${layer.id}" data-action="layer-schedule" data-li="${li}" data-mode="inherit" ${layer.schedule ? "" : "checked"}>${this.t("as_program")}</label>
          <label><input type="radio" name="sc-${layer.id}" data-action="layer-schedule" data-li="${li}" data-mode="own" ${layer.schedule ? "checked" : ""}>${this.t("own_schedule")}</label></div>
        ${layer.schedule ? this._weekHtml(`${p}.schedule`, layer.schedule) : ""}
        <h3>${this.t("where_plays")}</h3>
        <div class="radio"><label><input type="radio" name="tg-${layer.id}" data-action="layer-targets" data-li="${li}" data-mode="inherit" ${layer.target_entity_ids.length ? "" : "checked"}>${this.t("as_program")}</label>
          <label><input type="radio" name="tg-${layer.id}" data-action="layer-targets" data-li="${li}" data-mode="own" ${layer.target_entity_ids.length || this._ownTargets?.has(layer.id) ? "checked" : ""}>${this.t("own_speakers")}</label></div>
        ${layer.target_entity_ids.length || this._ownTargets?.has(layer.id) ? this._playersPicker(`${p}.target_entity_ids`, layer.target_entity_ids) : ""}
        <details class="advanced" data-key="adv-${layer.id}" ${this._open(`adv-${layer.id}`, false)}><summary>${this.t("advanced")}</summary>
          <div class="fields" style="margin-top:6px">
            <label class="field">${this.t("slot_seconds")}<input type="number" min="1" max="600" value="${grid.slot_seconds}" data-bind="${p}.grid.slot_seconds" data-type="int"></label>
            <label class="field">${this.t("slot_count")}<input type="number" min="1" max="1800" value="${grid.slot_count}" data-bind="${p}.grid.slot_count" data-type="int"></label>
          </div>
          <p class="hint" data-out="cycle-${li}">${escapeHtml(this.t("advanced_hint", { cycle: this._duration(grid.slot_seconds * grid.slot_count) }))}</p>
          <h3>${this.t("overlap")}</h3>
          <div class="radio">${["replace", "skip"].map((mode) => `<label><input type="radio" name="ov-${layer.id}" value="${mode}" data-bind="${p}.overlap" ${layer.overlap === mode ? "checked" : ""}>${this.t(`overlap_${mode}`)}</label>`).join("")}</div>
        </details>
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
    const line = this.shadowRoot.querySelector("#status-line");
    if (line) { line.className = `status-line ${runtime.state === "error" ? "error" : ""}`; line.textContent = this._statusText(this._draft, runtime); }
    const controls = this.shadowRoot.querySelector("#run-controls");
    if (controls && !controls.contains(this.shadowRoot.activeElement)) controls.innerHTML = this._runControlsHtml(runtime);
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
    return `<span>${this.t("played")}: <b>${rt.played_count}</b></span><span>${this.t("skipped")}: <b>${rt.skipped_count}</b></span><span>${this.t("errors")}: <b>${rt.error_count}</b>${rt.last_error ? ` (${escapeHtml(this._err({ code: rt.last_error }))})` : ""}</span>${rt.next_event && rt.state === "waiting" ? `<span>${this.t("next_event", { w: this._when(rt.next_event) })}</span>` : ""}`;
  }

  _liveHtml(layer, rt) {
    if (!rt) return "";
    const pattern = rt.pattern || "";
    const head = `<div class="row between"><b data-cycle-label="${layer.id}">${pattern && rt.state === "running" ? this.t("cycle_n", { n: rt.cycle_index + 1 }) : ""}</b>
      ${rt.state === "running" ? `<button class="btn ghost small" data-action="regenerate" data-layer="${layer.id}" title="${this.t("regenerate_hint")}"><ha-icon icon="mdi:dice-multiple" style="--mdc-icon-size:16px"></ha-icon>${this.t("regenerate")}</button>` : ""}</div>`;
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
        <div class="meta">${sound.size ? `${formatSize(sound.size, this._ru)} · ` : ""}${sound.usage ? this._p("used", sound.usage) : this.t("unused")}</div></div>
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
    const parts = [added.length ? this._p("uploaded", added.length) : "", failed ? this._p("failed", failed) : ""].filter(Boolean);
    this._toast(parts.join(", "), failed > 0);
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
      <div class="speaker-head"><ha-icon icon="${KIND_ICONS[profile.kind]}"></ha-icon><div class="grow"><b style="font-weight:500">${escapeHtml(this._playerName(id))}</b><div class="hint" style="margin:0">${escapeHtml(this._playerState(state.state))} · <span style="opacity:.75">${key}</span></div></div>
        <button class="btn small" data-action="out-test" data-entity="${key}"><ha-icon icon="mdi:volume-high"></ha-icon>${this.t("test_signal")}</button>
        ${known ? `<button class="btn ghost small" data-action="out-reset" data-entity="${key}">${this.t("reset_profile")}</button>` : ""}</div>
      <div class="fields">
        <label class="field">${this.t("kind")}<select data-out-field="kind" data-entity="${key}">${KINDS.map((k) => `<option value="${k}" ${profile.kind === k ? "selected" : ""}>${this.t(`kind_${k}`)}</option>`).join("")}</select></label>
        <label class="field">${this.t("keepalive")}<select data-out-field="keepalive_seconds" data-entity="${key}">${KEEPALIVE.map((s) => `<option value="${s}" ${profile.keepalive_seconds === s ? "selected" : ""}>${s ? this.t("keepalive_every", { d: this._duration(s) }) : this.t("keepalive_off")}</option>`).join("")}</select></label>
        <label class="field">${this.t("warmup")}<input type="number" min="0" max="120" value="${profile.warmup_seconds}" data-out-field="warmup_seconds" data-entity="${key}"></label>
        <label class="field">${this.t("lead")}<input type="number" min="0" max="3000" step="50" value="${profile.lead_ms}" data-out-field="lead_ms" data-entity="${key}"></label>
      </div>
      <div class="row"><label class="check"><input type="checkbox" data-out-field="volume_on" data-entity="${key}" ${profile.volume != null ? "checked" : ""}>${this.t("speaker_volume")}</label>
        ${profile.volume != null ? `<input type="range" class="grow" min="0" max="100" value="${profile.volume}" data-out-field="volume" data-entity="${key}" aria-label="${this.t("speaker_volume")}"><output>${profile.volume}%</output>` : ""}</div>
      <p class="hint" style="margin:0">${profile.kind === "bluetooth" ? `${this.t("keepalive_hint")} ${this.t("warmup_hint")} ${this.t("lead_hint")}` : this.t("lead_hint")}</p>
      <div><button class="btn ghost small" data-action="out-recommend" data-entity="${key}"><ha-icon icon="mdi:auto-fix"></ha-icon>${this.t("recommended")}</button></div>
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
    const nodeBt = "wget -qO- https://raw.githubusercontent.com/SunsetSH/HiSosed/main/scripts/proxmox/audio-node.sh | sudo sh -s -- --mode bluetooth --players 2\n# " + (ru ? "потом сопряжение:" : "then pair:") + "\nsudo hisosed-bt-pair";
    const usb = ru
      ? "Proxmox → ВМ с Home Assistant → Hardware → Add → USB Device → Use USB Vendor/Device ID → выберите звуковую карту и перезапустите ВМ."
      : "Proxmox → Home Assistant VM → Hardware → Add → USB Device → Use USB Vendor/Device ID → pick the sound card and restart the VM.";
    return `<div class="card guide">
      <h2><ha-icon icon="mdi:server-network"></ha-icon>${this.t("guide_title")}</h2>
      <p class="hint">${ru
        ? "Home Assistant OS внутри виртуальной машины Proxmox не видит ни звуковую карту, ни Bluetooth сервера. Звук нужно довести до колонки отдельно, и чтобы она при этом появилась в Home Assistant как плеер. Ниже три рабочих способа, выберите подходящий."
        : "Home Assistant OS inside a Proxmox VM can't see the server's sound card or Bluetooth. The sound has to reach the speaker some other way, and the speaker has to show up in Home Assistant as a player. Here are three ways that work."}</p>
      <details data-key="g-usb" ${this._open("g-usb", true)}><summary>${ru ? "Колонка на проводе, способ 1 (самый простой): USB-звуковая карта" : "Wired speaker, option 1 (simplest): a USB sound card"}</summary>
        <ol>
          <li>${ru ? "Возьмите любую USB-звуковую карту с выходом 3.5 мм, которая работает без драйверов, и воткните её в сервер." : "Get any driverless USB sound card with a 3.5 mm output and plug it into the server."}</li>
          <li>${escapeHtml(usb)}</li>
          <li>${ru ? "В Home Assistant откройте Настройки → Система → Оборудование: карта должна быть там. Выход по умолчанию выбирается в Настройки → Система → Аудио (или в терминале: <code>ha audio info</code> и <code>ha audio default output --name …</code>)." : "In Home Assistant, Settings → System → Hardware should list the card. Pick the default output under Settings → System → Audio (or in the terminal: <code>ha audio info</code> and <code>ha audio default output --name …</code>)."}</li>
          <li>${ru ? "Поставьте из официального магазина дополнение <b>VLC</b> и запустите его. Home Assistant сам предложит интеграцию <b>VLC media player via Telnet</b>, согласитесь, и появится плеер." : "Install the official <b>VLC</b> add-on and start it. Home Assistant will offer the <b>VLC media player via Telnet</b> integration; accept it and a player appears."}</li>
          <li>${ru ? "Вернитесь сюда, выберите для неё «Провод» и нажмите «Проверить звук»." : "Come back here, set it to “Cable” and press “Test sound”."}</li>
        </ol>
      </details>
      <details data-key="g-lxc" ${this._open("g-lxc", false)}><summary>${ru ? "Колонка на проводе, способ 2: встроенный звук сервера через LXC" : "Wired speaker, option 2: the server's onboard audio via LXC"}</summary>
        <ol>
          <li>${ru ? "Создайте в Proxmox контейнер LXC с Debian 12. На хосте допишите в <code>/etc/pve/lxc/&lt;ID&gt;.conf</code>:" : "Create a Debian 12 LXC container. On the host, add to <code>/etc/pve/lxc/&lt;ID&gt;.conf</code>:"}${this._code(lxc)}</li>
          <li>${ru ? "Перезапустите контейнер и запустите внутри установщик аудиоузла. Он поставит MPD и PipeWire и сделает два плеера, чтобы дорожки могли звучать одновременно:" : "Restart the container and run the audio-node installer inside. It sets up MPD and PipeWire with two players so layers can play at the same time:"}${this._code(node)}</li>
          <li>${ru ? "В Home Assistant добавьте интеграцию <b>Music Player Daemon (MPD)</b> на каждый порт, который покажет скрипт (6600, 6601…). Хост — IP контейнера." : "In Home Assistant, add the <b>Music Player Daemon (MPD)</b> integration for each port the script prints (6600, 6601…). The host is the container's IP."}</li>
        </ol>
      </details>
      <details data-key="g-bt" ${this._open("g-bt", false)}><summary>${ru ? "Bluetooth-колонка" : "Bluetooth speaker"}</summary>
        <ol>
          <li>${ru ? "Для Bluetooth лучше всего завести отдельную маленькую ВМ с Debian 12 (хватит одного ядра и 512 МБ). Контейнер LXC не подойдёт: Bluetooth в него не пробросить." : "Bluetooth works best in a small separate Debian 12 VM (one core and 512 MB are plenty). An LXC container won't do: Bluetooth can't be passed into it."}</li>
          <li>${ru ? "Пробросьте в эту ВМ USB Bluetooth-адаптер (Hardware → Add → USB Device). Встроенный адаптер тоже можно, если Home Assistant им не пользуется." : "Pass a USB Bluetooth adapter to that VM (Hardware → Add → USB Device). A built-in adapter works too if Home Assistant isn't using it."}</li>
          <li>${ru ? "В ВМ запустите установщик и выполните сопряжение, переведя колонку в режим сопряжения:" : "Inside the VM run the installer, put the speaker in pairing mode and pair:"}${this._code(nodeBt)}</li>
          <li>${ru ? "Скрипт сам переподключает колонку, если она отвалилась. В Home Assistant добавьте MPD на порты 6600 и 6601, а здесь выберите «Bluetooth» и нажмите «Подобрать настройки». Тогда колонка будет просыпаться заранее и не станет съедать начало звуков." : "The script reconnects the speaker on its own if it drops. Add MPD on ports 6600 and 6601 in Home Assistant, then pick “Bluetooth” here and press “Suggest settings”. The speaker will wake up early and stop eating the start of sounds."}</li>
        </ol>
      </details>
      <details data-key="g-mix" ${this._open("g-mix", false)}><summary>${ru ? "Чтобы дорожки звучали одновременно" : "Playing layers at the same time"}</summary>
        <p>${ru
          ? "Один плеер за раз играет один звук: новый просто обрывает предыдущий. Поэтому установщик аудиоузла делает несколько плееров MPD на одной колонке, а PipeWire их смешивает. Дайте дорожкам разные плееры («Где играет» → «На своих колонках»). Если плеер всего один, второстепенной дорожке в «Тонкой настройке» выберите «Не мешать»."
          : "A player plays one sound at a time; a new one just cuts off the last. That's why the audio-node installer creates several MPD players on one speaker and PipeWire mixes them. Give the layers different players (“Where it plays” → “On its own speakers”). With only one player, set the secondary layer to “Don't interrupt” under “Fine-tuning”."}</p>
      </details>
    </div>`;
  }

  // ------------------------------------------------------------------ help tab

  _helpHtml() {
    const ru = this._ru;
    const items = ru ? [
      ["Программа", "Это то, что играет: несколько дорожек, расписание и колонки. Пока включено «Играть по расписанию», программа сама начнёт в нужное время и сама замолчит, когда оно выйдет."],
      ["Дорожка", "Отдельный поток звуков. У каждой дорожки свои звуки и своя частота, а если нужно, то и своё расписание и свои колонки. Дорожки друг другу не мешают. Выключенная дорожка просто молчит, удалять её не нужно."],
      ["Когда именно звучит звук", "Время делится на короткие шаги, по умолчанию по 2 секунды. В начале каждого цикла HiSosed случайно выбирает, на каких шагах будет звук. При частоте 30% это ровно 30% шагов, не больше и не меньше. На выбранном шаге играет один звук, и чем больше у него вес, тем чаще выпадает именно он."],
      ["Перерывы", "Добавьте в день несколько промежутков, например 10:00–13:00 и 14:00–19:00. Вне них звук не играет никогда."],
      ["Режимы", "Режим запоминает, какие дорожки и звуки включены, частоту и громкость. Переключаться можно здесь, на дашборде или из автоматизации."],
      ["Включить сейчас", "Программа играет сразу и столько, сколько вы выбрали, не глядя на расписание. Потом снова живёт по расписанию."],
      ["Тишина", "Глушит все программы на время. То, что должно было прозвучать за эту паузу, потом не доигрывается."],
      ["Дашборд и автоматизации", "У каждой программы в Home Assistant есть переключатели (расписание и каждая дорожка), выбор режима и датчик состояния. В действиях hi_sosed.* программу можно указать по названию."],
      ["Звук обрезается или его не слышно", "Нажмите «Проверить звук» во вкладке «Колонки». Для Bluetooth там же нажмите «Подобрать настройки». И лучше брать звуки не длиннее одного шага."],
    ] : [
      ["Program", "This is what plays: a few layers, a schedule and speakers. While “Play on schedule” is on, the program starts at the right time and goes quiet when the time is up."],
      ["Layer", "A separate stream of sounds. Each layer has its own sounds and frequency and, if you like, its own schedule and speakers. Layers don't get in each other's way. A layer that's switched off just stays quiet; no need to delete it."],
      ["When exactly a sound plays", "Time is split into short steps, 2 seconds by default. At the start of every cycle HiSosed picks at random which steps get a sound. At 30% that's exactly 30% of the steps. On a picked step one sound plays, and the higher its weight, the more often it's the one."],
      ["Breaks", "Give a day several time ranges, for example 10:00–13:00 and 14:00–19:00. Nothing ever plays outside them."],
      ["Modes", "A mode remembers which layers and sounds are on, the frequency and the volume. Switch between them here, on a dashboard or from an automation."],
      ["Play now", "The program plays right away for as long as you choose, ignoring the schedule. Then it goes back to the schedule."],
      ["Quiet", "Silences every program for a while. Whatever would have played during that time is not made up later."],
      ["Dashboards and automations", "Each program gets switches in Home Assistant (the schedule and every layer), a mode selector and a status sensor. hi_sosed.* actions accept the program's name."],
      ["A sound is cut off or can't be heard", "Press “Test sound” in the Speakers tab. For Bluetooth, press “Suggest settings” there too. And keep sounds shorter than one step."],
    ];
    return `<div class="card"><h2><ha-icon icon="mdi:help-circle-outline"></ha-icon>${this.t("tab_help")}</h2>
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

  _confirmDelete(title, text) {
    return this._dialog({ title, body: `<p>${escapeHtml(text)}</p>`, buttons: [{ label: this.t("cancel"), style: "ghost", value: false }, { label: this.t("delete"), style: "", value: true }] });
  }

  _prompt(title, value = "") {
    return this._dialog({ title, input: value, buttons: [{ label: this.t("cancel"), style: "ghost", value: null }, { label: this.t("done") }] })
      .then((result) => (typeof result === "string" && result.trim() ? result.trim() : null));
  }

  _choose(title, hint, options) {
    return this._dialog({ title, body: `<p class="hint">${escapeHtml(hint)}</p>`, buttons: [...options.map(([label, value]) => ({ label, value, style: "ghost" })), { label: this.t("cancel"), style: "ghost", value: null }] });
  }

  _durationOptions(values) {
    return values.map((m) => [m < 60 ? this.t("for_minutes", { m }) : this.t("for_hours", { h: m / 60 }), m]);
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
      { label: this.t("picker_upload"), style: "ghost", value: "upload" },
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
    if (!(grid.slot_seconds > 0 && grid.slot_count > 0)) return;
    const rate = this.shadowRoot.querySelector(`[data-out="rate-${li}"]`);
    if (rate) rate.textContent = this._rateText(grid);
    const cycle = this.shadowRoot.querySelector(`[data-out="cycle-${li}"]`);
    if (cycle) cycle.textContent = this.t("advanced_hint", { cycle: this._duration(grid.slot_seconds * grid.slot_count) });
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
        if (await this._confirmDelete(this.t("delete_program_title"), this.t("confirm_delete_program", { n: d.name }))) {
          clearTimeout(this._saveTimer); this._dirty = false;
          if (await this._call("hi_sosed/scenario/delete", { scenario_id: d.id })) { this._selectedId = null; this._draft = null; await this._reload(); this._render(); }
        }
        break;
      case "run-menu": {
        const minutes = await this._choose(this.t("run_title"), this.t("run_hint"), this._durationOptions(RUN_MINUTES));
        if (minutes) await this._act("run_now", { minutes });
        break;
      }
      case "cancel-run": await this._act("cancel_run"); break;
      case "stop": await this._act("stop"); break;
      case "regenerate": await this._act("regenerate", el.dataset.layer ? { layer_id: el.dataset.layer } : {}, this.t("regenerated")); break;
      case "snooze-menu": {
        const minutes = await this._choose(this.t("snooze_title"), this.t("snooze_hint"), this._durationOptions(SNOOZE_MINUTES));
        if (minutes) await this._call("hi_sosed/snooze", { minutes });
        break;
      }
      case "resume": await this._call("hi_sosed/snooze", { minutes: 0 }); break;
      case "preset-apply": await this._act("apply_preset", { preset_id: el.dataset.id }); break;
      case "preset-capture": {
        const name = await this._prompt(this.t("preset_name_prompt"), this.t("preset_default_name", { n: d.presets.length + 1 }));
        if (name) await this._act("capture_preset", { name });
        break;
      }
      case "preset-overwrite": {
        const preset = d.presets.find((p) => p.id === el.dataset.id);
        if (preset) await this._act("capture_preset", { name: preset.name, preset_id: preset.id }, this.t("preset_overwritten"));
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
        if (preset && await this._confirmDelete(this.t("delete_preset_title"), this.t("confirm_delete_preset", { n: preset.name }))) {
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
        if (await this._confirmDelete(this.t("delete_layer_title"), this.t("confirm_delete_layer", { n: d.layers[li].name }))) { d.layers.splice(li, 1); this._changed({ render: true }); }
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
      case "lib-scan": await this._call("hi_sosed/sound/scan", {}, (r) => (r.added ? this._p("found", r.added) : this.t("scan_none"))); break;
      case "lib-starter": await this._call("hi_sosed/sound/starter", {}, (r) => (r.added ? this._p("added", r.added) : this.t("starter_none"))); break;
      case "lib-uri": {
        const uri = await this._prompt(this.t("uri_prompt"), "media-source://media_source/local/");
        if (uri) await this._call("hi_sosed/sound/add_uri", { media_content_id: uri, name: decodeURIComponent(uri.split("/").pop() || "").replace(/\.[^.]+$/, ""), category: this._uploadCategory || undefined }, this.t("uri_added"));
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
        const text = used ? this.t("confirm_delete_used", { used: this._p("used", sound.usage) })
          : this.t(sound.managed ? "confirm_delete_sound" : "confirm_delete_link", { n: sound.name });
        const ok = await this._confirmDelete(this.t("delete_sound_title"), text);
        if (ok) await this._call("hi_sosed/sound/delete", { sound_id: sound.id, force: used });
        break;
      }
      case "out-test": await this._call("hi_sosed/output/test", { entity_id: el.dataset.entity }, this.t("sent_to_speaker")); break;
      case "out-recommend": { const kind = this._outputs?.[el.dataset.entity]?.kind || "other"; this._saveOutput(el.dataset.entity, { kind, ...RECOMMENDED[kind] }); this._render(); this._toast(this.t("recommended_done", { k: this.t(`kind_${kind}`) })); break; }
      case "out-reset": {
        // A pending debounced save would resurrect the profile, and an unsaved one has nothing to delete.
        const id = el.dataset.entity;
        clearTimeout(this._outputTimers[id]);
        delete this._outputs[id];
        if ((this._data.outputs || []).some((item) => item.entity_id === id)) await this._call("hi_sosed/output/delete", { entity_id: id });
        this._render();
        break;
      }
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
        newLayer(this._ru ? "Фон" : "Background", { grid: { slot_seconds: 2, slot_count: 120, density_percent: 30 } }),
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
