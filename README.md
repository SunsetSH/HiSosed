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

## Импорт звука

В панели **HiSosed** в боковом меню:

1. Создайте сценарий.
2. Выберите player и загрузите файл через «Быстрый импорт локального звука».
3. URI появится в списке аудио; сохраните сценарий.

Импорт ограничен 25 МБ на файл и разрешает MP3, WAV, OGG, OPUS, M4A, AAC и FLAC. Аудио хранится локально в `/media/hi_sosed` (либо в локальном media directory текущей установки); не загружается в облако и не попадает в SQLite.

Также можно пользоваться штатным Media browser Home Assistant и вручную вставлять `media-source://...` URI.

## Bluetooth-усилитель

USB Bluetooth-стик сам по себе не является audio player для custom integration. Если усилитель использует Bluetooth A2DP, рекомендуем Music Assistant + Sendspin Bluetooth Bridge:

1. Подключите адаптер к хосту Home Assistant и проверьте его в Settings → Bluetooth.
2. Установите Music Assistant и Sendspin Bluetooth Bridge.
3. Выполните pairing усилителя и включите auto-reconnect.
4. Убедитесь, что появился `media_player` и вручную проиграйте тестовый файл.
5. Выберите этот player в HiSosed.

Подробности и ограничения — в [ADR-0002](docs/adr/0002-bluetooth-audio-output.md).

## Статус

В репозитории реализуется стартовый вертикальный срез для будущего `v0.1.0`: панель, локальный импорт, CRUD сценариев, абсолютное планирование клеток, локальные `media_player` actions и HACS-структура. До первого релиза нужны интеграционные тесты в окружении Home Assistant и hardware probe Bluetooth-усилителя из [плана тестирования](docs/TEST_PLAN.md).
