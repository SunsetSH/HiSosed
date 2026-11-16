# HiSosed

Локальная custom integration Home Assistant: она строит случайную сетку коротких аудиособытий и воспроизводит выбранные локальные файлы на существующих `media_player`.

## Установка

Предпочтительный способ — HACS:

1. Откройте HACS → Integrations → меню → Custom repositories.
2. Добавьте `https://github.com/SunsetSH/HiSosed` с категорией **Integration**.
3. Найдите **HiSosed**, установите и перезапустите Home Assistant.
4. Settings → Devices & services → Add integration → **HiSosed**.

После публикации репозитория возможна установка одной командой из Terminal & SSH add-on (для Home Assistant OS):

```sh
curl -fsSL https://raw.githubusercontent.com/SunsetSH/HiSosed/main/scripts/install.sh | sh -s -- SunsetSH/HiSosed main /config
```

Если в Terminal & SSH нет `curl`, используйте:

```sh
wget -qO- https://raw.githubusercontent.com/SunsetSH/HiSosed/main/scripts/install.sh | sh -s -- SunsetSH/HiSosed main /config
```

Скрипт загружает указанный GitHub tag или ветку в staging-каталог, сохраняет предыдущую версию компонента как backup и затем публикует только `custom_components/hi_sosed`; после этого требуется restart Home Assistant. Для регулярных обновлений удобнее HACS.

## Как пользоваться

После установки в боковом меню появится панель **HiSosed** (её видит только администратор). Если программ ещё нет, панель сама подскажет, с чего начать.

- **Программы.** Программа — это то, что играет: несколько дорожек, расписание и колонки. В расписании можно задать несколько промежутков в день, между ними будет пауза. Каждая дорожка играет сама по себе, у неё свои звуки, частота и громкость, а при желании своё расписание и свои колонки. Все правки сохраняются сами.
- **Режимы** запоминают, какие дорожки и звуки включены, частоту и громкость. Переключаться между ними можно в панели, на дашборде или из автоматизации.
- **Включить сейчас** запускает программу сразу, от 15 минут до 4 часов, не глядя на расписание. **Тишина** глушит всё на время.
- **Звуки.** Перетащите файлы в окно браузера или нажмите «Выбрать файлы». Подойдут MP3, WAV, OGG, OPUS, M4A, AAC и FLAC до 25 МБ, они сохранятся в `/media/hi_sosed`. Если копируете файлы по сети (Samba) в `/media/hi_sosed/<категория>/`, нажмите потом «Проверить папку». Любой звук можно послушать прямо в браузере. Для пробы есть стартовый набор.
- **Колонки.** Здесь указывают, как подключена колонка (Bluetooth, провод, сеть), её громкость, и проверяют звук. Для Bluetooth есть кнопка «Подобрать настройки»: колонка будет просыпаться заранее и не станет съедать начало звуков. Там же инструкция для Home Assistant в Proxmox.

У каждой программы в Home Assistant появляются переключатель расписания, переключатели дорожек, выбор режима и датчик состояния.

## Как это работает

Время внутри промежутка из расписания делится на шаги по `slot_seconds`. Каждые `slot_count` шагов образуют цикл, и в каждом цикле звук получают ровно `density_percent` % шагов, выбранных случайно. На выбранном шаге играет один включённый звук, чем больше у него вес, тем чаще. Дорожки не зависят друг от друга. Пропущенные шаги (перезапуск, сон сервера, тишина) потом не доигрываются, а вне расписания звук не играет никогда.

Один `media_player` за раз играет один звук, поэтому дорожки на общей колонке перебивают друг друга. Режим «Не мешать» в тонкой настройке дорожки пропускает звук, если колонку только что заняла другая дорожка. Чтобы дорожки звучали одновременно, дайте им разные плееры, например два MPD-плеера аудиоузла на одной колонке.

Действия для автоматизаций: `hi_sosed.start`, `stop`, `run_now`, `regenerate`, `apply_preset`, `set_layer`, `preview`, `snooze`, `resume`. Программы, дорожки и режимы можно указывать по названию.

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
