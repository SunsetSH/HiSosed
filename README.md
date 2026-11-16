# HiSosed

Локальная custom integration Home Assistant: она строит случайную сетку коротких аудиособытий и воспроизводит выбранные локальные файлы на существующих `media_player`.

## Установка

Предпочтительный способ — HACS:

1. Откройте HACS → Integrations → меню → Custom repositories.
2. Добавьте `https://github.com/SunsetSH/hisosed` с категорией **Integration**.
3. Найдите **HiSosed**, установите и перезапустите Home Assistant.
4. Settings → Devices & services → Add integration → **HiSosed**.

После публикации репозитория возможна установка одной командой из Terminal & SSH add-on (для Home Assistant OS):

```sh
curl -fsSL https://raw.githubusercontent.com/SunsetSH/hisosed/main/scripts/install.sh | sh -s -- SunsetSH/hisosed main /config
```

Если в Terminal & SSH нет `curl`, используйте:

```sh
wget -qO- https://raw.githubusercontent.com/SunsetSH/hisosed/main/scripts/install.sh | sh -s -- SunsetSH/hisosed main /config
```

Скрипт загружает указанный GitHub tag или ветку в staging-каталог, сохраняет предыдущую версию компонента как backup и затем публикует только `custom_components/hi_sosed`; после этого требуется restart Home Assistant. Для регулярных обновлений удобнее HACS.

## Как пользоваться

Панель **HiSosed** в боковом меню (только для администратора):

- **Программы** — набор дорожек с общим расписанием и колонками. У каждой дорожки своя случайная сетка, звуки с чекбоксами и весами, громкость, при необходимости своё расписание и свои колонки. В расписании можно задать несколько интервалов в день — так получаются перерывы. Все изменения сохраняются автоматически.
- **Пресеты** запоминают микс (какие дорожки и звуки включены, плотность, громкость) и переключают его в один клик, из панели или с дашборда.
- **Запустить сейчас** — играть немедленно 15 минут … 4 часа независимо от расписания. **Тишина** глушит всё на время.
- **Библиотека звуков** — перетащите файлы с компьютера в окно браузера (или «Выбрать файлы»). Они загрузятся в `/media/hi_sosed` с выбранной категорией. MP3, WAV, OGG, OPUS, M4A, AAC, FLAC до 25 МБ. Файлы, скопированные через Samba в подпапки `/media/hi_sosed/<категория>/`, добавляет кнопка «Найти файлы в папке». Звук можно послушать прямо в браузере.
- **Колонки** — тип подключения (Bluetooth, jack, сеть), громкость, прогрев, «не давать уснуть», компенсация задержки, тестовый сигнал. Там же инструкция для Home Assistant в Proxmox.

На каждую программу создаются сущности: переключатель расписания, переключатели дорожек, выбор пресета и сенсор состояния.

## Как это работает

Внутри окна время делится на клетки по `slot_seconds`. Каждые `slot_count` клеток образуют цикл, и в каждом цикле ровно `density_percent` % клеток активны, а их позиции случайны. В начале активной клетки играет один взвешенно-случайный включённый звук. Дорожки работают независимо. Пропущенные клетки (рестарт, сон хоста, тишина) не догоняются. Вне окна звук не запускается.

Один `media_player` играет один поток: дорожки на общей колонке сменяют друг друга (режим «Не перебивать» пропускает звук, если колонку только что заняла другая дорожка). Для одновременного звучания назначьте дорожкам разные плееры, например два MPD-плеера аудиоузла на одном выходе.

Действия для автоматизаций: `hi_sosed.start`, `stop`, `run_now`, `regenerate`, `apply_preset`, `set_layer`, `preview`, `snooze`, `resume`. Программы, дорожки и пресеты можно указывать по имени.

## Колонка, если Home Assistant в Proxmox

HiSosed играет только через `media_player` и не трогает Bluetooth и звуковую карту напрямую. Рецепты для jack 3.5 (USB-карта + VLC add-on или LXC с MPD) и для Bluetooth (маленькая ВМ Debian + `scripts/proxmox/audio-node.sh`) — в [docs/PROXMOX_AUDIO.md](docs/PROXMOX_AUDIO.md) и во вкладке «Колонки».

## Статус

Версия 0.2.0, ещё не выпущена. Покрыта тестами на ядре Home Assistant, но не проверена на живом HA и реальном железе. Подробно — в [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md).

## Разработка

- Структура кода, назначение методов и известные расхождения со спецификацией: [PROJECT_MAP.md](PROJECT_MAP.md).
- Требования: [docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md). Архитектура: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Решения: [docs/adr/](docs/adr/).
- Правила для агентов и разработчиков: [CLAUDE.md](CLAUDE.md).

Статические проверки (как в CI):

```sh
python -m py_compile custom_components/hi_sosed/*.py
node --check custom_components/hi_sosed/static/hi-sosed-panel.js
sh -n scripts/install.sh
sh -n scripts/proxmox/audio-node.sh
```

Тесты требуют Home Assistant в виртуальном окружении:

```sh
python -m venv .venv
.venv/bin/pip install pytest-homeassistant-custom-component
.venv/bin/python -m pytest
```

На Windows Home Assistant официально не работает. Для локального запуска есть заглушки POSIX-модулей: `PYTHONPATH=tests/windows_shims .venv/Scripts/python -m pytest`.

Для ручной проверки скопируйте `custom_components/hi_sosed` в `<config>/custom_components/` тестового Home Assistant и перезапустите его.

## Лицензия

[MIT](LICENSE).
