# Звук для HiSosed, когда Home Assistant работает в Proxmox

HiSosed играет только через сущности `media_player` (ADR-0001, ADR-0002). Home Assistant OS в виртуальной машине Proxmox не видит ни звуковую карту, ни Bluetooth хоста, поэтому сначала нужно построить путь звука до колонки, который появится в HA как `media_player`. Ниже три проверенных по документации схемы. На реальном железе этого проекта они пока не испытаны.

| Колонка | Схема | Одновременные дорожки |
|---|---|---|
| Jack 3.5, есть USB-звуковая карта | A. USB-карта → ВМ HA → add-on VLC | нет (один плеер) |
| Jack 3.5 встроенной карты сервера | Б. LXC Debian с `/dev/snd` → `audio-node.sh --mode jack` → MPD | да (N плееров) |
| Bluetooth | В. ВМ Debian с USB-адаптером → `audio-node.sh --mode bluetooth` → MPD | да (N плееров) |

## A. USB-звуковая карта в ВМ Home Assistant

1. Подключите class-compliant USB-звуковую карту с выходом 3.5 мм к серверу.
2. Proxmox → ВМ HA → Hardware → Add → USB Device → Use USB Vendor/Device ID → карта. Перезапустите ВМ.
3. HA: Настройки → Система → Оборудование: карта видна. Выход по умолчанию: `ha audio info`, `ha audio default output --name <имя>` в Terminal & SSH.
4. Установите официальный add-on **VLC** и запустите его. Примите обнаруженную интеграцию **VLC media player via Telnet**.
5. HiSosed → Колонки: тип «Jack 3.5», «Тестовый сигнал».

## Б. Встроенная звуковая карта через LXC

1. Создайте LXC Debian 12 (1 ядро, 256–512 МБ).
2. На хосте добавьте в `/etc/pve/lxc/<ID>.conf`:

   ```text
   lxc.cgroup2.devices.allow: c 116:* rwm
   lxc.mount.entry: /dev/snd dev/snd none bind,optional,create=dir
   ```

3. Перезапустите контейнер и внутри выполните:

   ```sh
   wget -qO- https://raw.githubusercontent.com/SunsetSH/HiSosed/main/scripts/proxmox/audio-node.sh | sudo sh -s -- --mode jack --players 2
   ```

4. В HA добавьте интеграцию **Music Player Daemon (MPD)** для каждого порта (6600, 6601…), хост — IP контейнера. MPD скачивает звук по URL Home Assistant, поэтому HA должен быть доступен из контейнера (Настройки → Система → Сеть → локальный URL).

## В. Bluetooth-колонка

Bluetooth в LXC не пробрасывается, поэтому нужна маленькая ВМ Debian 12 (1 ядро, 512 МБ).

1. Пробросьте USB Bluetooth-адаптер в эту ВМ (Hardware → Add → USB Device).
2. В ВМ:

   ```sh
   wget -qO- https://raw.githubusercontent.com/SunsetSH/HiSosed/main/scripts/proxmox/audio-node.sh | sudo sh -s -- --mode bluetooth --players 2
   sudo hisosed-bt-pair     # колонка в режиме сопряжения
   ```

   Скрипт включает `AutoEnable`, а таймер `hisosed-bt-reconnect.timer` раз в 30 секунд переподключает сохранённую колонку.
3. Добавьте MPD-интеграции, как в схеме Б.
4. HiSosed → Колонки: тип «Bluetooth» → «Рекомендуемые настройки» (прогрев 10 с, keep-alive 60 с, компенсация 250 мс).

## Что делает `audio-node.sh`

- ставит `mpd`, PipeWire (`pipewire-pulse`, `wireplumber`), для Bluetooth — `bluez` и `libspa-0.2-bluetooth`;
- создаёт системного пользователя `hisosed` с `loginctl enable-linger`, чтобы пользовательская сессия PipeWire жила без входа в систему, и отключает привязку Bluetooth к seat в WirePlumber;
- запускает N пользовательских сервисов `hisosed-mpd@<i>` на портах `6600+i` с выходом `pulse`. PipeWire смешивает их, поэтому разные дорожки HiSosed на разных плеерах звучат одновременно;
- повторный запуск безопасен; сетевых обращений, кроме `apt`, нет.

## Почему обрезается начало звука по Bluetooth

A2DP-колонки засыпают и открывают поток с задержкой 0,2–2 с. Против этого в профиле колонки HiSosed есть:

- **прогрев**: за N секунд до окна `turn_on` и тихий клип;
- **не давать уснуть**: тихий клип, если колонка молчит дольше N секунд, только внутри идущего окна;
- **компенсация задержки**: команда уходит раньше, но никогда не раньше начала окна.
