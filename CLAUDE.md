# CLAUDE.md — рабочие инструкции для агента

HiSosed — custom integration Home Assistant (домен `hi_sosed`). По расписанию она строит случайную клеточную сетку и проигрывает локальные аудиофайлы через существующие сущности `media_player`. Язык общения с пользователем, документации и UI — русский; идентификаторы, коды ошибок и комментарии в коде — английский.

## С чего начинать

1. [PROJECT_MAP.md](PROJECT_MAP.md): где что лежит, какие методы за что отвечают, потоки данных, известные расхождения кода со спецификацией.
2. Спецификация, источник истины: [docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md) (ID `HS-FR-*`, `HS-NFR-*`).
3. Архитектура и решения: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/adr/](docs/adr/).
4. Статус и бэклог: [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md), [docs/DEVELOPMENT_PLAN.md](docs/DEVELOPMENT_PLAN.md) §12, [docs/TEST_PLAN.md](docs/TEST_PLAN.md).

Читай только разделы, относящиеся к задаче. Спецификацию в комментариях не дублируй.

## Окружение (Windows)

- Git ругается на `dubious ownership`: репозиторий создан пользователем `CodexSandboxOffline`. Глобальный конфиг без спроса не меняй, вызывай git так: `git -c safe.directory=H:/.pet/HiSosed <команда>`.
- Есть Python 3.13, Node 24, Git Bash (`sh`). Нет `homeassistant`, `pytest-homeassistant-custom-component`, `ruff`, `jq`.
- Каталог `.pytest_cache` закрыт для текущего пользователя (Permission denied). Запускай pytest с `-p no:cacheprovider`.
- Remote: `https://github.com/SunsetSH/HiSosed.git`, ветка `main`. Коммить и пушь только по просьбе.

## Команды

Статические проверки, те же, что в CI ([.github/workflows/static-checks.yml](.github/workflows/static-checks.yml)):

```sh
python -m py_compile custom_components/hi_sosed/*.py
for f in hacs.json custom_components/hi_sosed/manifest.json custom_components/hi_sosed/translations/*.json; do python -m json.tool "$f" >/dev/null || echo "BAD $f"; done
node --check custom_components/hi_sosed/static/hi-sosed-panel.js
sh -n scripts/install.sh
sh -n scripts/proxmox/audio-node.sh
sh -n scripts/proxmox/host-setup.sh
```

Тесты. Нужен venv с Home Assistant (пакет `custom_components.hi_sosed` импортирует HA). Конфигурация pytest лежит в `pyproject.toml` (`pythonpath`, `asyncio_mode`, `-p no:cacheprovider`). На Windows HA 2026.2 требует `lru-dict==1.3.0` без готового wheel, поэтому ставим через uv с override, а POSIX-модули подменяем заглушками:

```sh
python -m venv .venv && .venv/Scripts/pip install uv
echo "lru-dict==1.4.1" > overrides.txt   # временный файл вне репозитория
.venv/Scripts/python -m uv pip install --python .venv/Scripts/python.exe --override overrides.txt pytest-homeassistant-custom-component
PYTHONPATH=tests/windows_shims .venv/Scripts/python -m pytest
```

Venv в этом рабочем дереве уже стоит. Новую установку делай только с согласия пользователя (большая загрузка). Если тесты не запускались, так и пиши; не заявляй о проверках, которых не было.

После правок удаляй `__pycache__` в `custom_components/` (CPython их создаёт, в git они не попадают, но засоряют дерево).

## Инварианты продукта

- Local-first: никаких облаков, телеметрии и скрытых сетевых fallback. Звук идёт только через `media_player.play_media` ([ADR-0001](docs/adr/0001-home-assistant-custom-integration.md)). Bluetooth/ALSA напрямую не трогаем ([ADR-0002](docs/adr/0002-bluetooth-audio-output.md)).
- Вне временного окна ни один автоматический callback не играет звук. `stop`, удаление и выгрузка исключают поздний `play_media` (HS-FR-012/013/041/055).
- Каждый callback сверяет `generation` перед побочным эффектом. Сначала инвалидация поколения, потом `cancel()`.
- Пропущенные клетки не «догоняются» (HS-FR-014/054). Клетки планируются по абсолютному времени `window_start + k * slot_seconds`, а не через `sleep`-цикл.
- Плотность: ровно `floor(N * d / 100 + 0.5)` активных клеток. Python `round()` не использовать.
- Сохранение атомарно и с optimistic revision: устаревшая ревизия даёт `revision_conflict` и ничего не перезаписывает.
- Все мутации сценариев и runtime сериализуются одним `ScenarioManager._lock`. Внутри lock нельзя ждать `play_media`, сеть или файловый I/O.
- В event loop нет блокирующего I/O: файлы пишутся через `hass.async_add_executor_job`.
- Приватность: в логах, событиях и диагностике нет имён сценариев и файлов, путей, URI. Допустимы UUID, счётчики и коды ошибок.
- Ошибки — стабильные коды (`scenario_not_found`, `revision_conflict`, `invalid_*`), а не свободный текст.
- Все пользовательские строки на `ru` и `en` (HS-FR-005).

## Архитектурные правила

- `models.py` и `engine.py` — домен: чистые функции и frozen dataclass, без `hass`, I/O и реальных часов (RNG и `now` передаются параметром). Сейчас они импортируют `homeassistant.util` и `HomeAssistantError`. Новых зависимостей от HA туда не добавляй.
- `manager.py` — прикладной слой (use cases + scheduler). Только он меняет сценарии и runtime.
- Адаптеры: `storage.py` (Store), `http.py` (upload), `websocket_api.py`, `panel.py`, сервисы в `__init__.py`. Бизнес-логики в них нет, только валидация формы запроса и делегирование менеджеру.
- Панель (`static/hi-sosed-panel.js`) отображает состояние backend. Собственного планировщика в браузере нет (HS-FR-044).
- Медиа хранятся файлами в `<media>/hi_sosed/`: staging, затем `os.replace`. Base64 в JSON недопустим.
- Перед кросс-сечным или необратимым решением (новый формат хранения, новый endpoint, add-on/renderer, смена схемы) пиши ADR в `docs/adr/NNNN-*.md`. Если код, прототип и спецификация расходятся, решение фиксируется в ADR.
- Новые зависимости, разрешения, сетевые вызовы и фоновые сервисы добавляются только с обоснованием. В `manifest.json` пока нет `requirements`, и так должно оставаться без явной необходимости.

## Безопасность

- Импорт и всё, что пришло из WebSocket/HTTP, считается недоверенным: allowlist расширений, предел размера, имена файлов генерирует сервер (UUID), выход за `MEDIA_SUBDIR` запрещён.
- WebSocket CRUD и upload доступны только администратору (`require_admin`, `user.is_admin`).
- Секреты в git не кладём. Actions пиним по SHA, как в существующем workflow.

## Порядок работы

1. Найди ID требований и затронутые инварианты в PRODUCT_REQUIREMENTS.
2. Сверься с разделом «Известные расхождения» в PROJECT_MAP. Если задача их задевает, исправь или явно оговори.
3. Делай самый маленький вертикальный срез: домен → manager → адаптер → панель → тесты.
4. На каждое изменение поведения добавь тесты домена и, где возможно, интеграционные: success, cancel/stop, stale callback, restart внутри и вне окна, ошибка плеера.
5. Прогони статические проверки, а если окружение позволяет, то и pytest. В отчёте укажи точные команды и что не проверено (реальное железо, Android/Windows UI).
6. Обнови PROJECT_MAP.md, если поменялась структура, публичный метод или контракт. Обнови IMPLEMENTATION_STATUS, если закрыт пункт статуса. Спецификацию меняй только при принятом изменении поведения.
7. Не делай широких непрошеных рефакторингов и сохраняй чужие незакоммиченные изменения.

## Стиль кода

- Python: `from __future__ import annotations`, полные type hints, docstring в одну строку у публичных методов, методы `async_*` для корутин, `_..._locked` для методов, вызываемых под `_lock`.
- Константы только в `const.py` с `Final`.
- JS-панель: ванильный Web Component без сборки. Любой пользовательский текст в разметке проходит через `escapeHtml`.
- Комментарии объясняют ограничения, а не очевидный код.
