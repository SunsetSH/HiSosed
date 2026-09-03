const weekdays = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const escapeHtml = (value) => String(value ?? "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

class HiSosedPanel extends HTMLElement {
  set hass(value) {
    this._hass = value;
    if (!this._loaded) this._load();
  }

  connectedCallback() {
    this._render();
  }

  async _load() {
    this._loaded = true;
    try {
      const response = await this._hass.connection.sendMessagePromise({ type: "hi_sosed/list" });
      this._scenarios = response.scenarios;
      this._error = "";
    } catch (error) {
      this._error = error?.message || "Не удалось загрузить сценарии";
    }
    this._render();
  }

  _newScenario() {
    const audio = this._uploadedAudio || [];
    return {
      revision: null,
      name: "Новый сценарий",
      enabled: true,
      target_entity_ids: [],
      schedule: { weekdays: [0, 1, 2, 3, 4, 5, 6], start: "10:00:00", end: "18:00:00" },
      grid: { slot_seconds: 2, slot_count: 120, density_percent: 30 },
      audio,
    };
  }

  _select(id) {
    this._selected = this._scenarios?.find((item) => item.id === id) || this._newScenario();
    this._render();
  }

  _collect() {
    const form = this.querySelector("form");
    const data = new FormData(form);
    const audio = (data.get("audio") || "").split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((media_content_id, index) => ({
        id: this._selected?.audio?.[index]?.id,
        name: media_content_id.split("/").pop() || "Audio",
        media_content_id,
        enabled: true,
        weight: 1,
      }));
    return {
      ...this._selected,
      name: data.get("name"),
      enabled: data.get("enabled") === "on",
      target_entity_ids: [...form.querySelectorAll("select[name=targets] option:checked")].map((item) => item.value),
      schedule: {
        weekdays: weekdays.map((_, index) => index).filter((index) => data.get(`weekday_${index}`) === "on"),
        start: `${data.get("start")}:00`,
        end: `${data.get("end")}:00`,
      },
      grid: {
        slot_seconds: Number(data.get("slot_seconds")),
        slot_count: Number(data.get("slot_count")),
        density_percent: Number(data.get("density_percent")),
      },
      audio,
    };
  }

  async _save(event) {
    event.preventDefault();
    try {
      const result = await this._hass.connection.sendMessagePromise({ type: "hi_sosed/save", scenario: this._collect() });
      this._selected = result.scenario;
      await this._load();
      this._notice = "Сценарий сохранен";
    } catch (error) {
      this._error = error?.message || "Не удалось сохранить сценарий";
      this._render();
    }
  }

  async _delete() {
    if (!this._selected?.id || !confirm("Удалить сценарий?")) return;
    try {
      await this._hass.connection.sendMessagePromise({ type: "hi_sosed/delete", scenario_id: this._selected.id });
      this._selected = null;
      await this._load();
    } catch (error) {
      this._error = error?.message || "Не удалось удалить сценарий";
      this._render();
    }
  }

  async _action(service) {
    if (!this._selected?.id) return;
    try {
      await this._hass.callService("hi_sosed", service, { scenario_id: this._selected.id });
      this._notice = `Действие выполнено: ${service}`;
      setTimeout(() => this._load(), 250);
    } catch (error) {
      this._error = error?.message || "Действие не выполнено";
      this._render();
    }
  }

  async _upload(file) {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await fetch("/api/hi_sosed/upload", { method: "POST", body: form, credentials: "same-origin" });
      if (!response.ok) throw new Error(await response.text());
      const audio = await response.json();
      this._selected = this._selected || this._newScenario();
      this._selected.audio = [...(this._selected.audio || []), audio];
      this._notice = `Импортирован: ${audio.name}`;
      this._render();
    } catch (error) {
      this._error = error?.message || "Импорт не удался";
      this._render();
    }
  }

  _render() {
    if (!this.isConnected) return;
    const selected = this._selected;
    const players = this._hass ? Object.keys(this._hass.states).filter((id) => id.startsWith("media_player.")).sort() : [];
    const scenarios = this._scenarios || [];
    const pattern = selected?.runtime?.pattern || [];
    this.innerHTML = `
      <style>
        :host { display:block; max-width:1300px; margin:0 auto; padding:16px; color:var(--primary-text-color); }
        main { display:grid; grid-template-columns:minmax(220px, .8fr) minmax(0, 2fr); gap:16px; }
        section { background:var(--card-background-color); border-radius:12px; padding:16px; box-shadow:var(--ha-card-box-shadow, none); }
        button { cursor:pointer; margin:4px 0; padding:9px 12px; border:0; border-radius:8px; background:var(--primary-color); color:var(--text-primary-color); }
        button.secondary { background:var(--secondary-background-color); color:var(--primary-text-color); }
        button.danger { background:var(--error-color); } .scenario { display:block; width:100%; text-align:left; background:transparent; color:var(--primary-text-color); }
        label { display:block; margin:10px 0 4px; font-weight:600; } input, select, textarea { width:100%; box-sizing:border-box; padding:9px; border-radius:7px; border:1px solid var(--divider-color); background:var(--card-background-color); color:var(--primary-text-color); }
        select[multiple] { min-height:112px; } textarea { min-height:105px; font-family:monospace; } .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(10px, 1fr)); gap:3px; margin:12px 0; } .cell { height:14px; border-radius:3px; background:var(--secondary-background-color); } .cell.active { background:var(--primary-color); }
        .row { display:grid; grid-template-columns:1fr 1fr; gap:10px; } .days { display:flex; flex-wrap:wrap; gap:8px; } .days label { font-weight:400; margin:0; } .notice { color:var(--success-color); } .error { color:var(--error-color); white-space:pre-wrap; } small { color:var(--secondary-text-color); } h1 { margin-top:0; }
        @media (max-width: 800px) { main { grid-template-columns:1fr; } }
      </style>
      <h1>HiSosed</h1>
      <p>Локальный планировщик случайного аудио. Для Bluetooth-усилителя выберите player, созданный Bluetooth bridge или Music Assistant.</p>
      ${this._error ? `<p class="error">${escapeHtml(this._error)}</p>` : ""}
      ${this._notice ? `<p class="notice">${escapeHtml(this._notice)}</p>` : ""}
      <main>
        <section><h2>Сценарии</h2><button id="new">+ Создать</button>
          ${scenarios.map((item) => `<button class="scenario" data-id="${item.id}">${escapeHtml(item.name)}<br><small>${escapeHtml(item.runtime?.state || "disabled")}</small></button>`).join("") || "<p>Сценариев пока нет.</p>"}
        </section>
        <section>${selected ? this._editor(selected, players, pattern) : "<p>Выберите существующий сценарий или создайте новый.</p>"}</section>
      </main>`;
    this.querySelector("#new")?.addEventListener("click", () => { this._selected = this._newScenario(); this._render(); });
    this.querySelectorAll("button[data-id]").forEach((button) => button.addEventListener("click", () => this._select(button.dataset.id)));
    this.querySelector("form")?.addEventListener("submit", (event) => this._save(event));
    this.querySelector("#delete")?.addEventListener("click", () => this._delete());
    this.querySelector("#upload")?.addEventListener("change", (event) => this._upload(event.target.files?.[0]));
    this.querySelectorAll("button[data-action]").forEach((button) => button.addEventListener("click", () => this._action(button.dataset.action)));
  }

  _editor(item, players, pattern) {
    const selectedTargets = new Set(item.target_entity_ids || []);
    const selectedDays = new Set(item.schedule.weekdays || []);
    const audio = (item.audio || []).map((entry) => entry.media_content_id).join("\n");
    return `<form><h2>${escapeHtml(item.name || "Новый сценарий")}</h2>
      <label>Название<input name="name" required maxlength="80" value="${escapeHtml(item.name)}"></label>
      <label><input name="enabled" type="checkbox" ${item.enabled ? "checked" : ""}> Включить расписание</label>
      <div class="row"><label>Начало<input name="start" type="time" required value="${escapeHtml(item.schedule.start.slice(0,5))}"></label><label>Конец<input name="end" type="time" required value="${escapeHtml(item.schedule.end.slice(0,5))}"></label></div>
      <label>Дни</label><div class="days">${weekdays.map((day, index) => `<label><input name="weekday_${index}" type="checkbox" ${selectedDays.has(index) ? "checked" : ""}> ${day}</label>`).join("")}</div>
      <div class="row"><label>Клетка, сек.<input name="slot_seconds" type="number" min="1" max="60" value="${item.grid.slot_seconds}"></label><label>Клеток в цикле<input name="slot_count" type="number" min="1" max="1800" value="${item.grid.slot_count}"></label></div>
      <label>Плотность: <output>${item.grid.density_percent}%</output><input name="density_percent" type="range" min="0" max="100" value="${item.grid.density_percent}" oninput="this.previousElementSibling.value=this.value+'%'"></label>
      <label>Цель воспроизведения<select name="targets" multiple required>${players.map((id) => `<option value="${id}" ${selectedTargets.has(id) ? "selected" : ""}>${id}</option>`).join("")}</select></label>
      <label>Аудиофайлы (по одному Media source URI в строке)<textarea name="audio" required placeholder="media-source://media_source/local/hi_sosed/example.mp3">${escapeHtml(audio)}</textarea></label>
      <label>Быстрый импорт локального звука<input id="upload" type="file" accept="audio/*,.opus"></label><small>До 25 МБ: MP3, WAV, OGG, OPUS, M4A, AAC или FLAC. Файл попадет в локальный каталог HiSosed.</small>
      ${pattern.length ? `<h3>Текущий цикл ${item.runtime.cycle_index ?? 0}</h3><div class="grid" title="Синий: активная клетка">${pattern.map((active) => `<span class="cell ${active ? "active" : ""}"></span>`).join("")}</div>` : ""}
      <p><button type="submit">Сохранить</button> ${item.id ? '<button class="secondary" type="button" data-action="start">Запустить</button> <button class="secondary" type="button" data-action="stop">Остановить</button> <button class="secondary" type="button" data-action="regenerate">Новая сетка</button> <button class="secondary" type="button" data-action="preview">Предпрослушать</button> <button class="danger" type="button" id="delete">Удалить</button>' : ""}</p>
    </form>`;
  }
}

customElements.define("hi-sosed-panel", HiSosedPanel);
