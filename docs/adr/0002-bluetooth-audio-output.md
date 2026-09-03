# ADR-0002: Bluetooth-усилитель подключается через media_player, не напрямую из HiSosed

- Статус: принято для v0.1.0
- Дата: 2026-09-03
- Связанные требования: HS-FR-036–039, HS-NFR-001–003

## Контекст

Целевой усилитель будет подключен к хосту Home Assistant отдельным USB Bluetooth-стиком. Это требует различать два протокола:

- BLE используется преимущественно для датчиков и управления;
- аудиоусилители/колонки обычно используют Bluetooth Classic, профиль A2DP.

Home Assistant Bluetooth integration обслуживает обнаружение и BLE-устройства через BlueZ/D-Bus, но сама по себе не превращает USB-стик в универсальный аудиоплеер. Direct ALSA/PipeWire/BlueALSA output из custom integration потребовал бы доступа к звуковой подсистеме хоста и работал бы по-разному в Home Assistant OS, Container и Core.

## Решение

HiSosed не управляет Bluetooth-стиком напрямую. Он передает воспроизведение выбранной сущности `media_player`.

Рекомендуемая конфигурация для усилителя:

```text
USB Bluetooth adapter → BlueZ/PipeWire на HA host
                    → Sendspin Bluetooth Bridge
                    → Music Assistant player
                    → media_player.<bluetooth_amplifier>
                    → HiSosed
```

Для Home Assistant OS предпочтителен Music Assistant app вместе с Sendspin Bluetooth Bridge, который представляет подключенный A2DP-усилитель как player. HiSosed остается совместимым и с другими уже существующими player-адаптерами (Cast, Sonos, DLNA, MPD и т. д.).

## Последствия

- custom integration остается local-first и не требует доступа к OS audio stack;
- Bluetooth reconnect, кодеки и buffer находятся в специализированном bridge;
- пользователь выбирает Bluetooth player в панели HiSosed как обычную цель;
- короткие звуки после долгой паузы все равно должны быть проверены аппаратным probe;
- при потере A2DP-соединения HiSosed зафиксирует пропущенную команду, но не будет пытаться сам pair/connect устройство.

## Установка Bluetooth-части

1. Подключить USB-стик с коротким USB-удлинителем, если требуется улучшить радиосвязь.
2. В Home Assistant включить Bluetooth и убедиться, что адаптер виден в Settings → Bluetooth.
3. Установить Music Assistant app и Sendspin Bluetooth Bridge.
4. Выполнить pairing усилителя в bridge, включить auto-reconnect.
5. Убедиться, что появился player и вручную проиграть тестовый файл.
6. Выбрать этот player в сценарии HiSosed.

## Условия пересмотра

Если bridge не поддерживает конкретный хост/стик, альтернативой является отдельный Linux-host с BlueZ + PipeWire/BlueALSA и MPD/Snapcast/Music Assistant player. Это будет отдельный deployment profile, а не код внутри HiSosed.
