# Архитектура

## 1. Решение

Зафиксированное решение описано в [ADR-0001](adr/0001-home-assistant-custom-integration.md): сначала создается custom integration, которая оркестрирует существующие сущности `media_player`. Отдельный add-on или собственный аудиодвижок не нужен для MVP и добавляется только при подтвержденной проблеме с задержками/разрывами.

Для USB Bluetooth-стика и A2DP-усилителя действует [ADR-0002](adr/0002-bluetooth-audio-output.md): HiSosed не работает с Bluetooth-стеком напрямую, а использует player, предоставленный Bluetooth bridge/Music Assistant.

## 2. Технологии

### Backend

- **Python** версии, поддерживаемой целевым релизом Home Assistant;
- асинхронные API Home Assistant и `asyncio`;
- `ConfigEntry` для жизненного цикла установки;
- `homeassistant.helpers.storage.Store` для версионированных сценариев и runtime checkpoint;
- event helpers (`async_track_point_in_time`/`async_call_later`) для отменяемых callback;
- стандартный вызов `media_player.play_media` с блокировкой ответа только на уровне async service call, без блокировки event loop.

Python обязателен практически, потому что Home Assistant Core и custom integrations используют Python. Выбор другого backend-языка означал бы отдельный сетевой сервис или add-on и лишнюю точку отказа.

В `manifest.json` рекомендуется `integration_type: "helper"`: продукт не обнаруживает отдельное физическое устройство или облачный сервис, а добавляет локальную управляющую функцию поверх существующих сущностей. Так как все сценарии обслуживает один runtime/store, manifest также должен запрещать создание дублирующего корневого config entry (`single_config_entry`).

### Frontend

- **TypeScript + Lit** для отдельной панели;
- Web Components, чтобы встраиваться в frontend Home Assistant;
- WebSocket-команды интеграции для CRUD сценариев и подписки на быстрый runtime state;
- CSS Grid для клеточного поля и адаптивной раскладки.

Панель не должна импортировать внутренние нестабильные компоненты frontend Home Assistant без необходимости. Базовый интерфейс настройки остается доступен через config/options flow, поэтому отказ панели не должен лишать пользователя аварийной остановки.

### Инструменты качества

- `pytest` и `pytest-homeassistant-custom-component`;
- Ruff для lint/format;
- MyPy или Pyright в strict-профиле для собственного пакета;
- Hassfest и HACS Action validation;
- Vitest для чистой логики панели и Playwright для основных пользовательских потоков панели.

## 3. Границы компонентов

```text
Config/options flow        Custom panel (TS/Lit)
        |                         |
        +------ commands / WebSocket ------+
                                          |
                                  Application service
                                  (start/stop/update)
                                          |
                   +----------------------+------------------+
                   |                      |                  |
             Domain engine          Scenario Store     Runtime publisher
          (grid, windows, RNG)     (versioned JSON)   (entities/WebSocket)
                   |
              Scheduler
                   |
            MediaPlayerPort
                   |
       Home Assistant service adapter
                   |
        media_player.play_media
```

Domain engine не должен обращаться к `hass`, файловой системе, UI или реальным часам напрямую. Он получает `Clock`, `RandomSource` и `MediaPlayerPort` через интерфейсы. Это делает алгоритм детерминированно тестируемым.

## 4. Предлагаемая структура будущего кода

```text
custom_components/hi_sosed/
  __init__.py
  manifest.json
  const.py
  config_flow.py
  services.yaml
  storage.py
  models.py
  engine.py
  scheduler.py
  media_player_adapter.py
  websocket_api.py
  switch.py
  sensor.py
  diagnostics.py                 # не раньше стабилизации и без приватных данных
  translations/en.json
  translations/ru.json
  brand/
frontend/
  src/hi-sosed-panel.ts
  src/api.ts
  src/components/...
tests/
  components/hi_sosed/...
hacs.json
```

Эта структура — план реализации, а не просьба хранить код в `docs`. В текущей аналитической задаче все созданные файлы находятся только в `/docs`.

## 5. Модель данных

Упрощенная схема сценария:

```json
{
  "schema_version": 1,
  "id": "uuid",
  "revision": 7,
  "name": "Scenario 1",
  "enabled": true,
  "target_entity_ids": ["media_player.living_room"],
  "schedule": {
    "weekdays": [1, 2, 3, 4, 5],
    "start": "10:00:00",
    "end": "18:00:00"
  },
  "grid": {
    "slot_seconds": 2,
    "slot_count": 120,
    "density_percent": 30
  },
  "audio": [
    {
      "id": "uuid",
      "media_content_id": "media-source://media_source/local/hi_sosed/sample.mp3",
      "enabled": true,
      "weight": 1
    }
  ],
  "playback": {
    "overlap_policy": "replace",
    "announce": false
  }
}
```

Runtime checkpoint хранится отдельно: `scenario_id`, `revision`, `generation_id`, логическое начало окна, `cycle_index`, seed и готовый bitset паттерна текущего цикла, а также время следующей границы. Сохраненный bitset важнее повторной генерации из seed: результат не должен зависеть от изменений реализации PRNG после обновления Python. Изменяемое состояние не записывается на каждую двухсекундную клетку: checkpoint сохраняется на старте, смене цикла, изменении конфигурации и остановке. Иначе будет ненужная нагрузка на накопитель.

## 6. Генерация паттерна

Псевдокод чистой доменной функции:

```python
def generate_pattern(slot_count, density_percent, random_source):
    active_count = round_half_up(slot_count * density_percent / 100)
    active_indexes = random_source.sample(range(slot_count), active_count)
    return tuple(index in active_indexes for index in range(slot_count))
```

Нужно явно реализовать округление, а не полагаться на `round()` Python с bankers rounding. Один и тот же seed, версия алгоритма и конфигурация должны давать одинаковый паттерн. Версия алгоритма хранится рядом с checkpoint, чтобы обновление интеграции не меняло восстановленную последовательность неожиданно.

Выбор аудио выполняется отдельной функцией weighted random. Для тестов обе функции получают внедренный псевдогенератор. Криптографическая случайность продукту не нужна; важны неповторяемость и воспроизводимость тестов.

## 7. Scheduler без накопительного дрейфа

Scheduler не использует вечный цикл `while: await sleep(slot_seconds)`. Для окна с началом `T0` граница клетки вычисляется как абсолютное время:

```text
slot_time(k) = T0 + k × slot_duration
```

После callback вычисляется первый `k`, чей `slot_time(k)` строго в будущем. Это дает следующие свойства:

- задержка одного callback не сдвигает весь последующий график;
- после suspend/restart пропущенные клетки не «догоняются»;
- конец окна проверяется перед каждым вызовом;
- переход на новый цикл — всего лишь изменение `cycle_index` при сохранении общей временной оси.

Каждый callback захватывает `scenario_id`, `revision` и `generation_id`. Перед `play_media` он повторно сравнивает их с текущим состоянием. `stop` сначала увеличивает поколение, затем отменяет callback. Даже если отмена и callback встретились в гонке, устаревшая операция не пройдет проверку.

## 8. Временные окна

Все сохраненные часы — локальные пользовательские значения, но расчеты конкретных срабатываний используют timezone Home Assistant и aware `datetime`.

- `start < end`: обычное окно в один календарный день;
- `start > end`: конец относится к следующим суткам;
- `start == end`: не «24 часа», а невалидная конфигурация в MVP;
- изменение timezone требует пересчета следующего запуска;
- при загрузке вычисляется текущее логическое окно, затем ближайшая будущая клетка.

## 9. Интеграция с Media source и media_player

Пользователь загружает аудио через встроенный Media browser Home Assistant. На Home Assistant OS `/media` готов сразу; для Container каталог нужно смонтировать. Ссылки вида `media-source://...` не следует вручную превращать в публичные `/local/...`: `/media` требует аутентификацию, а `www` обычно публичен.

Опциональный стартовый набор лучше предоставлять отдельным `media_source.py` внутри интеграции. Тогда демонстрационные файлы видны в Media browser, не копируются в произвольные пользовательские каталоги и имеют проверяемый license manifest. В базовый пакет входят только небольшие собственные/совместимо лицензированные assets; пользователь всегда может заменить их локальными файлами.

Перед первым сохранением и при `preview` интеграция разрешает Media source и получает воспроизводимый URL/MIME. На запуске можно использовать стандартную обработку media source в `media_player.play_media`. Необходимо аппаратно проверить:

- доступен ли локальный URL самой колонке;
- минимальную надежную длительность клипа;
- задержку после 5–30 секунд тишины;
- заменяет ли новая команда текущий клип;
- поддерживаются ли `announce` и очередь;
- возвращает ли плеер достоверное состояние `playing`.

### Когда понадобится add-on/stream renderer

Если целевой плеер теряет короткие команды или требование «без пауз» означает именно непрерывный аудиосигнал, orchestration mode недостаточен. Тогда отдельный renderer заранее собирает, например, 5–20 минут PCM/FLAC/MP3 из клипов и тишины либо отдает локальный непрерывный поток. Плеер получает одну команду на большой фрагмент. Это отдельная архитектурная итерация, поскольку потребует кодеков, временных файлов/потока, квот, очистки и платформенной упаковки.

## 10. Интерфейс Home Assistant

### Сущности

На сценарий:

- `switch.<scenario>` — включает или выключает автоматическое расписание;
- основной sensor — агрегированное состояние `waiting/running/error` и время следующего события;
- диагностический sensor (disabled by default) — счетчики проигранных/пропущенных/ошибочных событий без имен файлов.

Не нужно обновлять entity attributes каждые две секунды: это раздувает Recorder. Быстро меняющуюся сетку панель получает отдельной WebSocket-подпиской.

### Действия

- `hi_sosed.start`: начать текущий допустимый запуск сценария;
- `hi_sosed.stop`: аварийно остановить планирование;
- `hi_sosed.regenerate`: заменить будущую сетку;
- `hi_sosed.preview`: один раз воспроизвести явно выбранный файл.

Регистрация выполняется в `async_setup`, а не отдельно для каждого config entry. Схемы валидируют UUID сценария, target и media URI. Действия должны учитывать права пользователя; CRUD WebSocket-команды требуют администратора, чтение состояния — авторизованного пользователя.

## 11. Ошибки и устойчивость

- Нет доступных файлов: сценарий переходит в `error`, звук не воспроизводится.
- Плеер `unavailable`: событие считается пропущенным; без частого retry внутри клетки.
- Ошибка одного target: `gather(..., return_exceptions=True)` или эквивалентная изоляция.
- Изменение сценария: optimistic revision; старое обновление получает conflict, а не перезаписывает новое.
- Невалидное хранилище: сохранить исходный файл для диагностики средствами Home Assistant, не активировать частично прочитанные сценарии, создать Repair issue.
- Выгрузка entry: сначала инвалидировать поколения, затем отменить callbacks/подписки и выгрузить платформы.

## 12. Что сознательно не входит в MVP

- собственный аудиодрайвер и прямой вывод на ALSA/Bluetooth;
- генерация или поставка «встроенных» защищенных авторским правом аудиофайлов;
- загрузка файлов через собственный endpoint;
- гарантированный gapless на любом `media_player`;
- облачный аккаунт, телеметрия или внешний сервер;
- скрытый запуск, обход временного окна, автоматическое повышение громкости;
- сложный календарь исключений и синхронизация между несколькими Home Assistant.
