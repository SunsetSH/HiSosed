# Источники

Проверено 2026-09-03. Для технических решений использованы главным образом официальные документы Home Assistant.

## Исходный аналог

- [«БумСосед» или альтернатива «МозгоПраву»](https://boomdown.org/node/5848) — описание исходной программы, случайных звуков, своего аудио, времени остановки и наборов звуков. Страница также сообщает о закрытии оригинального проекта и содержит пользовательские наблюдения о проблемах коротких Bluetooth-сэмплов после паузы.

## Home Assistant backend

- [Creating your first integration](https://developers.home-assistant.io/docs/creating_component_index/) — базовая структура custom integration и требование `version` для custom manifest.
- [Integration file structure](https://developers.home-assistant.io/docs/creating_integration_file_structure/) — расположение `custom_components/<domain>`, `services.yaml`, coordinator и brand assets.
- [Integration manifest](https://developers.home-assistant.io/docs/creating_integration_manifest/) — `config_flow`, тип интеграции, зависимости и metadata.
- [Config flow](https://developers.home-assistant.io/docs/core/integration/config_flow/) — UI-конфигурация, options/reconfigure и актуальная модель reload.
- [Config entries](https://developers.home-assistant.io/docs/config_entries_index/) — жизненный цикл, миграции и запрет прямой мутации entry.
- [Listening for events](https://developers.home-assistant.io/docs/integration_listen_events/) — отменяемые time helpers, включая `async_track_point_in_time` и `async_call_later`.
- [Media source platform](https://developers.home-assistant.io/docs/core/platform/media_source/) — разрешение, просмотр и воспроизведение Media source.
- [Play specified media](https://www.home-assistant.io/actions/media_player.play_media/) — стандартное действие, target, content id/type, enqueue и announce.
- [Media player entity](https://developers.home-assistant.io/docs/core/entity/media-player/) — контракт media player и media types.
- [Extending the WebSocket API](https://developers.home-assistant.io/docs/frontend/extending/websocket-api) — backend-команды для панели.
- [Permissions](https://developers.home-assistant.io/docs/auth_permissions/) — права на действия и WebSocket-команды.
- [Integration quality scale](https://developers.home-assistant.io/docs/core/integration-quality-scale/) и [rules](https://developers.home-assistant.io/docs/core/integration-quality-scale/rules/) — ориентир по качеству, тестам, config flow, diagnostics и локализации.
- [Custom integration localization](https://developers.home-assistant.io/docs/internationalization/custom_integration/) — отдельные `translations/<language>.json` для custom components; core `strings.json` сам по себе недостаточен.

## Медиа и frontend

- [Setting up local media sources](https://www.home-assistant.io/more-info/local-media/setup-media/) — `/media`, Container mount и отличие от публичного `www`.
- [Adding media](https://www.home-assistant.io/more-info/local-media/add-media/) — встроенная загрузка файлов через Media browser на Home Assistant OS и особенности Container.
- [Creating custom panels](https://developers.home-assistant.io/docs/frontend/custom-ui/creating-custom-panels/) — full-screen panel и объект `hass`.
- [Custom card](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/) — Web Components и формы/схемы frontend.

## Bluetooth-аудио

- [Bluetooth](https://www.home-assistant.io/integrations/bluetooth/) — требования к USB-адаптерам, BlueZ/D-Bus и рекомендации по USB-удлинителю. Этот компонент относится к Bluetooth discovery/BLE и не является сам по себе A2DP audio player.
- [Music Assistant Server](https://github.com/music-assistant/server) — рекомендуемая установка рядом с Home Assistant и требования к runtime.
- [Sendspin Bluetooth Bridge](https://github.com/trudenboy/sendspin-bt-bridge/tree/main/ha-addon-rc) — bridge A2DP-колонок/усилителей в players Music Assistant с auto-reconnect.

## Учтенные актуальные изменения

- [Config entry listener/reload deprecation](https://developers.home-assistant.io/blog/2026/05/07/config-entry-listener-together-with-reloading-methods/) — не смешивать listener и reload-методы так, чтобы получить двойную reload-гонку.
- [BrowseMediaSource domain requirement](https://developers.home-assistant.io/blog/2026/05/20/browse-media-source-root-class/) — `domain` обязателен для интеграционного media source.
- [Advanced mode deprecation](https://developers.home-assistant.io/blog/2026/05/26/advanced-mode-config-flow-deprecation/) — дополнительные параметры группировать в секции, не прятать за advanced mode.
- [Local brand assets for custom integrations](https://developers.home-assistant.io/blog/2026/02/24/brands-proxy-api/) — custom integration может поставлять локальные icon/logo в `brand/`.
