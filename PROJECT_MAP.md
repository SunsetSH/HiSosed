# Карта проекта HiSosed

Состояние на 2026-11-16, версия интеграции `0.2.0` (не выпущена). При изменении структуры, публичного метода или контракта обновляй этот файл. Решения v0.2 описаны в [ADR-0003](docs/adr/0003-layers-library-presets-outputs.md).

## 1. Дерево

```text
custom_components/hi_sosed/     # сама интеграция (HACS публикует только этот каталог)
  manifest.json                 # helper, single_config_entry, deps: frontend/http/panel_custom/websocket_api
  const.py                      # все константы: ключи Store, сигнал, URL, сервисы, лимиты
  __init__.py                   # async_setup (сервисы, WS, upload, панель) / setup_entry (платформы, устройства) / unload
  config_flow.py                # одношаговый UI-flow, единственный entry
  models.py                     # ДОМЕН: dataclass-модели, валидация, пресеты, timing_signature, migrate_v1 (без HA)
  engine.py                     # ДОМЕН: сетка, выбор звука, недельные окна с DST, номера клеток (без HA)
  audio.py                      # ДОМЕН: проверка сигнатур файлов, синтез WAV (тишина, сигнал, стартовый набор)
  files.py                      # блокирующие операции с <media>/hi_sosed (только через executor)
  manager.py                    # ПРИКЛАДНОЙ СЛОЙ: данные, планировщик дорожек, воспроизведение, keep-alive
  storage.py                    # Store v2 с миграцией + RuntimeStore (checkpoint)
  websocket_api.py              # адаптер: WS-команды панели (все require_admin)
  http.py                       # адаптер: POST /api/hi_sosed/upload
  entity.py                     # база сущностей + динамическое добавление/удаление
  switch.py / select.py / sensor.py  # сущности программ, дорожек, пресетов, состояния
  panel.py                      # регистрация статики и боковой панели
  services.yaml                 # схемы действий для UI HA
  static/hi-sosed-panel.js      # панель: ванильный Web Component, Shadow DOM, без сборки
  translations/{en,ru}.json     # config flow, сущности, действия
tests/
  conftest.py                   # enable_custom_integrations; на Windows отключает pytest-socket
  windows_shims/                # заглушки fcntl/resource для локального pytest на Windows
  components/hi_sosed/
    conftest.py                 # setup_integration (замороженное время, tmp media), FakePlayers
    test_engine.py / test_models.py   # чистый домен
    test_scheduler.py           # планировщик, гонки, рестарт, ошибки плееров, snooze, run_now, keep-alive
    test_adapters.py            # WS, upload, сущности, сервисы, удаление, миграция Store
scripts/install.sh              # установка из GitHub-архива с backup
scripts/proxmox/audio-node.sh   # аудиоузел Debian: N×MPD + PipeWire (+ Bluetooth)
docs/                           # спецификация, архитектура, ADR, PROXMOX_AUDIO.md
pyproject.toml                  # конфигурация pytest (pythonpath, asyncio_mode)
.github/workflows/static-checks.yml  # CI: синтаксис + pytest на Linux
```

## 2. Слои и зависимости

```text
panel.js ──WS──> websocket_api ─┐            switch/select/sensor ─┐
         ──HTTP─> http (upload) ┤  services (__init__) ────────────┤
                                v                                  v
                         manager.ScenarioManager  ──dispatcher SIGNAL_UPDATE──> панель (WS subscribe), сущности
                          │         │          │
              models/engine/audio  storage   hass.services media_player.{play_media,volume_set,turn_on}
                 (домен)          files (executor)
```

Только `ScenarioManager` меняет данные и runtime. Адаптеры проверяют форму запроса, переводят `HiSosedError(code)` в `ServiceValidationError` / WS `send_error(code)` и делегируют менеджеру.

## 3. Домен

### `models.py`

| Сущность | Назначение / инварианты |
|---|---|
| `HiSosedError(code)` | Единственное исключение домена, `code` — стабильный код. |
| `TimeRange`, `WeeklySchedule` | `days`: 7 кортежей интервалов `HH:MM` (≤8 в день). `end<=start` — через полночь, `start==end` — сутки. `simple()`, `is_empty`. |
| `GridSpec` | `slot_seconds` 1..600, `slot_count` 1..1800, `density_percent` 0..100. `active_count` = half-up. |
| `SoundRef` | `sound_id`, `enabled`, `weight` 1..1000. Дубли в дорожке запрещены. |
| `Layer` | `id, name, enabled, sounds, grid, schedule|None, target_entity_ids, volume|None, overlap replace|skip`. |
| `Preset`, `PresetLayer` | Снимок микса дорожки: `enabled`, `density_percent`, `volume`, `sounds`. |
| `Scenario` | `id, revision, name, enabled, target_entity_ids, schedule, layers(1..20), presets(≤30), active_preset_id, schema_version=2`. `from_dict` — единственный вход для недоверенных данных. `layer_schedule/layer_targets/sound_ids`. |
| `Sound` | Запись библиотеки: `name, category, media_content_id, content_type, size, managed, created_at`. |
| `OutputProfile` | `entity_id, kind (bluetooth|jack|network|other), volume, warmup_seconds 0..120, keepalive_seconds 0|15..3600, lead_ms 0..3000`. |
| `apply_preset` / `capture_preset` | Чистые преобразования сценария. |
| `timing_signature` | Поля, изменение которых требует перепланировать дорожку. |
| `migrate_v1` | Store v1 → v2 (библиотека + одна дорожка). |

### `engine.py`

| Функция | Назначение |
|---|---|
| `generate_pattern(grid, rng, previous)` | Ровно `active_count` клеток. До 3 попыток не повторить прошлый паттерн (HS-FR-024). |
| `choose_sound(refs, rng, available)` | Взвешенный выбор среди включённых и существующих. |
| `schedule_windows / current_window / next_window` | Склеенные окна на 8 дней. TZ передаётся параметром, DST-разрыв сдвигается, повтор даёт одно окно. |
| `next_slot_index(start, now, slot, fresh)` | `fresh` (граница окна) допускает опоздание на ½ клетки; иначе только будущая клетка. |
| `slot_time`, `pattern_to_text/from_text` | Абсолютная граница клетки; компактное хранение паттерна с проверкой инвариантов. |

## 4. Прикладной слой — `manager.py`

`LayerRuntime` — состояние одной дорожки: `generation, signature, cancel, prepare_cancel, state (disabled|idle|waiting|running), issue (no_sounds|no_targets|no_schedule), window_start/end, cycle_index, pattern, next_slot, next_event`, счётчики, `last_error`. Ключ — `(scenario_id, layer_id)`.

`ScenarioManager` владеет `_scenarios, _sounds, _outputs, _runtimes, _overrides (run_now), _snooze_until, _checkpoint, _inflight, _last_play` и единственным `_lock`.

| Группа | Методы |
|---|---|
| Жизненный цикл | `async_initialize` (Store + checkpoint + системные WAV), `async_start_all` (+ таймер `_tick`), `async_shutdown` (инвалидация, flush checkpoint) |
| Чтение | `get_state`, `scenario`, `scenario_ids`, `serialize_scenario`, `runtime_view`, `status`, `sound_usage` |
| Сценарии | `async_save_scenario` (ревизия → `revision_conflict`, проверка ссылок → `unknown_sound`), `async_delete_scenario`, `async_set_enabled`, `async_set_layer_enabled`, `async_set_sound_enabled`, `async_apply_preset`, `async_capture_preset` |
| Запуск | `async_start`/`async_stop` (= `enabled` true/false, сохраняется), `async_run_now`, `async_cancel_run_now`, `async_regenerate(layer?)`, `async_snooze`, `async_resume`, `async_preview`, `async_test_output` |
| Колонки | `async_save_output`, `async_delete_output` |
| Библиотека | `check_upload_quota`, `async_register_sound`, `async_add_uri_sound`, `async_update_sound`, `async_delete_sound(force)`, `async_scan_library`, `async_add_starter_pack` |
| Планировщик | `_reschedule_locked` (перезапускает только дорожки со сменившейся `signature`), `_start_layer_locked`, `_schedule_slot_locked`, `_schedule_boundary_locked`, `_schedule_prepare_locked`, `_ensure_pattern_locked` (восстановление из checkpoint) |
| Колбэки | `_async_fire_boundary`, `_async_fire_slot`, `_async_prepare`, `_tick` (истечение тишины, keep-alive) |
| Воспроизведение | `_plan_play_locked` (выбор звука, политика `skip`, громкость), `_async_play_on` (одна цель: busy/unavailable/volume_set/play_media, таймаут 10 с), `_record_results` |

### Алгоритм одной клетки

```text
_schedule_slot_locked: at = window_start + slot*slot_seconds; at >= window_end → граница окна
  fire_at = max(window_start, at - lead_ms)  ──timer──> _async_fire_slot(key, generation, slot, at)
lock: generation совпал? окно не кончилось? не опоздали > ½ клетки?  ──нет──> пересчитать / skipped
      pattern[slot % N] → active; next_slot = slot+1; запланировать следующую
      active и не snooze → _plan_play_locked (звук, цели, громкость)
без lock: gather(_async_play_on(цель)) — изоляция ошибок
lock: generation совпал? → played/error/skipped
```

## 5. Адаптеры и контракты

### Хранилище — `storage.py`

- `ScenarioStore`: `.storage/hi_sosed.scenarios`, version 2, `{"sounds": {id: Sound}, "outputs": {entity_id: OutputProfile}, "scenarios": {id: Scenario}}`. Версия 1 мигрирует через `migrate_v1`.
- `RuntimeStore`: `.storage/hi_sosed.runtime`, `{"layers": {"sid:lid": {window_start, cycle_index, pattern}}, "overrides": {sid: [start, end]}, "snooze_until"}`. Пишется с задержкой 5 с.

### WebSocket — `websocket_api.py` (все `require_admin`, ошибки — `{code}`)

| type | Вход | Ответ |
|---|---|---|
| `hi_sosed/state` | — | `{scenarios[+runtime, active_preset_modified], sounds[+usage], outputs, settings{snooze_until}, library{path, max_upload_bytes}}` |
| `hi_sosed/subscribe` | — | события `{scenario_id|null, config: bool, runtime?}` |
| `hi_sosed/scenario/save` / `delete` | `scenario` / `scenario_id` | `{scenario}` / `null` |
| `hi_sosed/scenario/action` | `scenario_id, action ∈ start|stop|run_now|cancel_run|regenerate|apply_preset|capture_preset|set_layer|set_sound`, `minutes, layer_id, sound_id, preset_id, name, enabled` | `null` или `{preset_id}` |
| `hi_sosed/snooze` | `minutes` (0 = снять) | `null` |
| `hi_sosed/sound/update|delete|add_uri|scan|starter|preview` | см. код | `{sound}` / `{added}` / `null` |
| `hi_sosed/output/save|delete|test` | `output` / `entity_id` | `{output}` / `null` |

`runtime`: `{state (disabled|idle|waiting|running|snoozed|error), override_until, layers: {layer_id: {state, issue, last_error, next_event, window_start, window_end, cycle_index, pattern "0101…", next_slot, played_count, skipped_count, error_count, last_played_at}}}`.

### HTTP upload — `http.py`

`POST /api/hi_sosed/upload`, multipart: необязательное поле `category`, затем `file`. Только админ, Bearer-токен. Проверки: расширение, сигнатура контейнера (`audio.sniff_matches`), ≤25 МБ, квота библиотеки 1 ГБ. Поток пишется в `.<uuid>.<ext>.part` через executor, затем `os.replace`. Ответ — объект `Sound`. Ошибки — `{code}` с HTTP 400/413/415/503/507.

### Действия (`__init__.py`, `services.yaml`)

`start, stop, run_now(minutes), regenerate(layer?), apply_preset(preset), set_layer(layer, enabled), preview(sound_id, entity_id?, scenario_id?), snooze(minutes), resume`. `scenario_id`, `layer` и `preset` принимают id или точное имя.

### Сущности

На программу — устройство (`identifiers {(hi_sosed, scenario_id)}`) с `switch.*_schedule`, `switch.<дорожка>` на каждую дорожку, `select.*_preset` (`—` + имена пресетов) и `sensor.*_status` (ENUM, атрибуты `next_window`, `manual_until`). Сущности удалённых дорожек и устройства удалённых программ убираются из реестров.

### Панель — `static/hi-sosed-panel.js`

Вкладки «Программы», «Библиотека звуков», «Колонки», «Справка». Строки на ru/en (`STRINGS`, `ERRORS`). Важное:

- `_reload` / `_onEvent`: полная загрузка по `config`-событиям, точечный патч runtime без перерисовки;
- `_changed` → `_flushSave`: автосохранение с debounce 700 мс, одна запись в полёте, повтор при новых правках, `revision_conflict` → перезагрузка;
- `_render` — полная перерисовка, откладывается при фокусе в поле. `_updateLive` / `_tickLive` патчат бейджи, счётчики и сетку на месте;
- `_uploadOne`: XHR с Bearer-токеном и прогрессом; drag&drop в библиотеку или прямо в дорожку;
- `_playBrowser`: `media_source/resolve_media` → `<audio>`. `_playSpeaker`: `hi_sosed/sound/preview`;
- `_dialog` и подобные: собственные модальные окна вместо `confirm/prompt`;
- id новых сущностей генерирует клиент (`uuid()` на `crypto.getRandomValues`, работает и по http).

## 6. Где что искать

| Задача | Куда смотреть |
|---|---|
| Новое поле дорожки/сценария | `models.py` → при необходимости `timing_signature` → панель (`_layerHtml`/`_editorHtml`) → миграция Store |
| Окна, перерывы, DST | `engine.schedule_windows`, `manager._window_for`, `_start_layer_locked` |
| Как и куда уходит звук | `manager._plan_play_locked`, `_async_play_on`, `_async_prepare`, `_tick` |
| Гонки stop/callback | `_invalidate_locked`, `_current`, проверки `generation` в `_async_fire_*` |
| Новое действие | `const.py` → `__init__.async_setup` → `services.yaml` → `translations/*.json` |
| Новая WS-команда | `websocket_api.py` (`@_command`) → панель |
| Лимиты импорта | `const.MAX_UPLOAD_BYTES`, `MAX_LIBRARY_BYTES`, `ALLOWED_AUDIO_SUFFIXES`, `audio.sniff_matches` |
| Тексты UI | `STRINGS`/`ERRORS` в панели, `translations/*.json` |

## 7. Известные расхождения и риски

Закрыто в v0.2 (с тестами): гонка stop со стартом окна, учёт ошибок плееров и изоляция целей, устаревший runtime после сохранения или удаления, потеря данных аудио в панели, наивное время и DST, remover `homeassistant_started` (теперь `async_at_started`), события шины на каждую клетку, отсутствие checkpoint, сущностей и попытки не повторять паттерн, upload без авторизации (`fetch` без токена), домен зависел от HA, не было тестовой инфраструктуры.

Остаётся:

1. `media_content_type` всегда `music` (сознательно, ADR-0003 п.9). Если конкретный плеер требует MIME, нужна настройка профиля.
2. Одновременное звучание есть только на разных `media_player`. Микширования внутри HiSosed нет.
3. Ручной запуск и пресеты расширяют исходный MVP (ADR-0003). ARCHITECTURE.md §10–12 частично устарел, актуальная картина — здесь и в ADR-0003.
4. `hi_sosed/state` доступен только админу, а ARCHITECTURE §10 требует чтения для любого пользователя. Не-админам состояние видно через сущности.
5. Hassfest и HACS validation не настроены. Ruff не запускается (в окружении нет).
6. Скрипт `audio-node.sh`, Bluetooth-переподключение, задержки A2DP, VLC и MPD на реальном железе не проверены. Панель проверена в jsdom и в headless Edge с моком `hass`, но не в живом HA и не в Android companion app.
7. Тесты на Windows идут только с заглушками `tests/windows_shims`. Официально HA на Windows не поддерживается, эталон — CI на Linux.
