const sectionTitle = document.querySelector("#sectionTitle");
const userName = document.querySelector("#userName");
const logoutButton = document.querySelector("#logoutButton");

const sectionLabels = {
  import: "Importar mapa",
  schedules: "Mapa importado",
  notices: "Avisos",
  news: "Notícias",
  events: "Eventos",
  media: "Mídias",
  settings: "Configurações",
};

const contentLabels = {
  notices: "Aviso",
  news: "Notícia",
  events: "Evento",
};

function showFeedback(element, message, type = "") {
  element.className = `feedback ${type}`;
  element.textContent = message;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}

async function ensureAuthenticated() {
  if (!ApiClient.getToken()) {
    window.location.href = "/login.html";
    return;
  }

  try {
    const result = await AuthApi.me();
    userName.textContent = result.user.name;
  } catch (error) {
    ApiClient.clearToken();
    window.location.href = "/login.html";
  }
}

function setupNavigation() {
  document.querySelectorAll(".nav-button").forEach((button) => {
    button.addEventListener("click", () => {
      const section = button.dataset.section;

      document.querySelectorAll(".nav-button").forEach((item) => item.classList.remove("active"));
      document.querySelectorAll(".dashboard-section").forEach((item) => item.classList.remove("active"));

      button.classList.add("active");
      document.querySelector(`#section-${section}`).classList.add("active");
      sectionTitle.textContent = sectionLabels[section];

      if (section === "schedules") loadSchedules();
      if (section === "media") loadMedia();
      if (section === "settings") loadSettings();
      if (["notices", "news", "events"].includes(section)) loadContent(section);
    });
  });
}

function setupLogout() {
  logoutButton.addEventListener("click", async () => {
    try {
      await AuthApi.logout();
    } catch (error) {
      console.warn(error.message);
    }

    ApiClient.clearToken();
    window.location.href = "/login.html";
  });
}

function setupImportForm() {
  const importForm = document.querySelector("#importForm");
  const importDate = document.querySelector("#importDate");
  const importFeedback = document.querySelector("#importFeedback");

  importDate.value = getTodayInputValue();

  importForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    showFeedback(importFeedback, "Importando planilha...", "warning");

    const formData = new FormData(importForm);

    try {
      const result = await DashboardApi.importSpreadsheet(formData);
      const warnings = result.warnings && result.warnings.length
        ? ` Avisos: ${result.warnings.join(" | ")}`
        : "";

      showFeedback(
        importFeedback,
        `Importação concluída. Linhas importadas: ${result.importedCount}.${warnings}`,
        result.warnings?.length ? "warning" : "success"
      );

      document.querySelector("#scheduleDate").value = importDate.value;
      await loadSchedules();
    } catch (error) {
      showFeedback(importFeedback, error.message, "error");
    }
  });
}

async function setupQrCode() {
  const teacherQrImage = document.querySelector("#teacherQrImage");
  const teacherQrUrl = document.querySelector("#teacherQrUrl");
  const teacherQrLink = document.querySelector("#teacherQrLink");

  try {
    const result = await DashboardApi.getTeacherQrCode();

    teacherQrImage.src = result.qrCode.dataUrl;
    teacherQrUrl.textContent = result.qrCode.url;
    teacherQrLink.href = result.qrCode.url;
  } catch (error) {
    teacherQrUrl.textContent = error.message;
  }
}

function setupSchedules() {
  const scheduleDate = document.querySelector("#scheduleDate");
  const schedulePeriod = document.querySelector("#schedulePeriod");
  const loadButton = document.querySelector("#loadSchedulesButton");
  const resetButton = document.querySelector("#resetStatusesButton");

  scheduleDate.value = getTodayInputValue();

  loadButton.addEventListener("click", () => loadSchedules());

  schedulePeriod.addEventListener("change", () => loadSchedules());

  resetButton.addEventListener("click", async () => {
    if (!confirm("Deseja voltar todas as aulas desta data para vermelho / aguardando retirada?")) {
      return;
    }

    const feedback = document.querySelector("#schedulesFeedback");

    try {
      const result = await DashboardApi.resetStatuses(scheduleDate.value);
      showFeedback(feedback, `${result.updated} status atualizados.`, "success");
      await loadSchedules();
    } catch (error) {
      showFeedback(feedback, error.message, "error");
    }
  });
}

async function loadSchedules() {
  const scheduleDate = document.querySelector("#scheduleDate");
  const schedulePeriod = document.querySelector("#schedulePeriod");
  const container = document.querySelector("#schedulesTableContainer");
  const feedback = document.querySelector("#schedulesFeedback");

  try {
    const result = await DashboardApi.getSchedules(scheduleDate.value, schedulePeriod.value);
    renderSchedulesTable(result.schedules);
    showFeedback(feedback, `${result.schedules.length} aula(s) carregada(s).`, "success");
  } catch (error) {
    container.innerHTML = "";
    showFeedback(feedback, error.message, "error");
  }
}

function renderSchedulesTable(schedules) {
  const container = document.querySelector("#schedulesTableContainer");

  if (!schedules.length) {
    container.innerHTML = `<p style="padding: 18px;">Nenhuma aula importada para os filtros selecionados.</p>`;
    return;
  }

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Status</th>
          <th>Período</th>
          <th>Turma</th>
          <th>Horário</th>
          <th>Local</th>
          <th>Docente</th>
          <th>Retirada em</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${schedules.map((schedule) => `
          <tr data-schedule-id="${schedule.id}">
            <td class="status-cell">
              <span class="status-dot ${schedule.statusChave === "started" ? "started" : "pending"}"></span>
              ${schedule.statusChave === "started" ? "Em andamento" : "Aguardando"}
            </td>
            <td>
              <select data-field="period">
                <option value="manha" ${schedule.period === "manha" ? "selected" : ""}>Manhã</option>
                <option value="tarde" ${schedule.period === "tarde" ? "selected" : ""}>Tarde</option>
                <option value="noite" ${schedule.period === "noite" ? "selected" : ""}>Noite</option>
              </select>
            </td>
            <td><input data-field="turma" value="${escapeAttribute(schedule.turma)}" /></td>
            <td><input data-field="horario" value="${escapeAttribute(schedule.horario)}" /></td>
            <td><input data-field="local" value="${escapeAttribute(schedule.local)}" /></td>
            <td><input data-field="docente" value="${escapeAttribute(schedule.docente)}" /></td>
            <td>${formatDateTimePtBr(schedule.retiradaConfirmadaEm)}</td>
            <td>
              <button class="button primary" data-action="save" type="button">Salvar</button>
              <button class="button danger" data-action="delete" type="button">Excluir</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  container.querySelectorAll("[data-action='save']").forEach((button) => {
    button.addEventListener("click", async () => {
      const row = button.closest("tr");
      await saveScheduleRow(row);
    });
  });

  container.querySelectorAll("[data-action='delete']").forEach((button) => {
    button.addEventListener("click", async () => {
      const row = button.closest("tr");
      await deleteScheduleRow(row);
    });
  });
}

async function saveScheduleRow(row) {
  const feedback = document.querySelector("#schedulesFeedback");
  const id = row.dataset.scheduleId;
  const payload = {};
  const scheduleDate = document.querySelector("#scheduleDate").value;

  row.querySelectorAll("[data-field]").forEach((field) => {
    payload[field.dataset.field] = field.value;
  });

  payload.date = scheduleDate;

  try {
    await DashboardApi.updateSchedule(id, payload);
    showFeedback(feedback, "Linha atualizada com sucesso.", "success");
    await loadSchedules();
  } catch (error) {
    showFeedback(feedback, error.message, "error");
  }
}

async function deleteScheduleRow(row) {
  const feedback = document.querySelector("#schedulesFeedback");
  const id = row.dataset.scheduleId;

  if (!confirm("Deseja excluir esta aula do mapa?")) return;

  try {
    await DashboardApi.deleteSchedule(id);
    showFeedback(feedback, "Linha excluída com sucesso.", "success");
    await loadSchedules();
  } catch (error) {
    showFeedback(feedback, error.message, "error");
  }
}

function setupContentSections() {
  document.querySelectorAll("[data-content-type]").forEach((card) => {
    const type = card.dataset.contentType;
    const formContainer = card.querySelector("[data-content-form]");

    formContainer.innerHTML = createContentFormTemplate(type);

    const form = formContainer.querySelector("form");

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const feedback = form.querySelector(".feedback");
      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      payload.isActive = formData.get("isActive") === "on";

      try {
        await DashboardApi.createContent(type, payload);
        showFeedback(feedback, `${contentLabels[type]} cadastrado com sucesso.`, "success");
        form.reset();
        form.querySelector("[name='isActive']").checked = true;
        await loadContent(type);
      } catch (error) {
        showFeedback(feedback, error.message, "error");
      }
    });
  });
}

function createContentFormTemplate(type) {
  const isNotice = type === "notices";
  const isEvent = type === "events";

  return `
    <form>
      <div class="form-grid">
        <div class="field">
          <label>Título</label>
          <input name="title" placeholder="Pode usar emojis 😊" required />
        </div>

        ${isNotice ? `
          <div class="field">
            <label>Prioridade</label>
            <select name="priority">
              <option value="normal">Normal</option>
              <option value="high">Alta</option>
            </select>
          </div>
        ` : ""}

        ${isEvent ? `
          <div class="field">
            <label>Data do evento</label>
            <input name="eventDate" type="date" />
          </div>
        ` : ""}

        <div class="field full">
          <label>Descrição</label>
          <textarea name="description" placeholder="Texto exibido no carrossel"></textarea>
        </div>

        <div class="field full">
          <label>URL de imagem opcional</label>
          <input name="imageUrl" placeholder="/uploads/media/arquivo.png ou link externo" />
        </div>

        <label>
          <input name="isActive" type="checkbox" checked />
          Ativo no totem
        </label>
      </div>

      <div class="action-row">
        <button class="button primary" type="submit">Cadastrar ${contentLabels[type].toLowerCase()}</button>
      </div>

      <div class="feedback"></div>
    </form>
  `;
}

async function loadContent(type) {
  const card = document.querySelector(`[data-content-type="${type}"]`);
  const listContainer = card.querySelector("[data-content-list]");

  try {
    const result = await DashboardApi.getContent(type);
    renderContentTable(type, result.items, listContainer);
  } catch (error) {
    listContainer.innerHTML = `<p style="padding: 18px;">${escapeHtml(error.message)}</p>`;
  }
}

function renderContentTable(type, items, container) {
  if (!items.length) {
    container.innerHTML = `<p style="padding: 18px;">Nenhum conteúdo cadastrado.</p>`;
    return;
  }

  container.innerHTML = `
    <table class="admin-table">
      <thead>
        <tr>
          <th>Título</th>
          <th>Descrição</th>
          ${type === "notices" ? "<th>Prioridade</th>" : ""}
          ${type === "events" ? "<th>Data</th>" : ""}
          <th>Imagem</th>
          <th>Ativo</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        ${items.map((item) => `
          <tr data-content-id="${item.id}">
            <td><input data-field="title" value="${escapeAttribute(item.title)}" /></td>
            <td><textarea data-field="description">${escapeHtml(item.description)}</textarea></td>
            ${type === "notices" ? `
              <td>
                <select data-field="priority">
                  <option value="normal" ${item.priority === "normal" ? "selected" : ""}>Normal</option>
                  <option value="high" ${item.priority === "high" ? "selected" : ""}>Alta</option>
                </select>
              </td>
            ` : ""}
            ${type === "events" ? `
              <td><input data-field="eventDate" type="date" value="${escapeAttribute(item.eventDate || "")}" /></td>
            ` : ""}
            <td><input data-field="imageUrl" value="${escapeAttribute(item.imageUrl || "")}" /></td>
            <td><input data-field="isActive" type="checkbox" ${item.isActive ? "checked" : ""} /></td>
            <td>
              <button class="button primary" data-action="save-content" type="button">Salvar</button>
              <button class="button danger" data-action="delete-content" type="button">Excluir</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  container.querySelectorAll("[data-action='save-content']").forEach((button) => {
    button.addEventListener("click", async () => {
      const row = button.closest("tr");
      const payload = getRowPayload(row);
      const feedback = row.closest(".card").querySelector(".feedback");

      try {
        await DashboardApi.updateContent(type, row.dataset.contentId, payload);
        showFeedback(feedback, "Conteúdo atualizado com sucesso.", "success");
        await loadContent(type);
      } catch (error) {
        showFeedback(feedback, error.message, "error");
      }
    });
  });

  container.querySelectorAll("[data-action='delete-content']").forEach((button) => {
    button.addEventListener("click", async () => {
      const row = button.closest("tr");
      const feedback = row.closest(".card").querySelector(".feedback");

      if (!confirm("Deseja excluir este conteúdo?")) return;

      try {
        await DashboardApi.deleteContent(type, row.dataset.contentId);
        showFeedback(feedback, "Conteúdo excluído com sucesso.", "success");
        await loadContent(type);
      } catch (error) {
        showFeedback(feedback, error.message, "error");
      }
    });
  });
}

function getRowPayload(row) {
  const payload = {};

  row.querySelectorAll("[data-field]").forEach((field) => {
    if (field.type === "checkbox") {
      payload[field.dataset.field] = field.checked;
      return;
    }

    payload[field.dataset.field] = field.value;
  });

  return payload;
}

function setupMediaForm() {
  const mediaForm = document.querySelector("#mediaForm");
  const mediaFeedback = document.querySelector("#mediaFeedback");

  mediaForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(mediaForm);

    try {
      await DashboardApi.createMedia(formData);
      showFeedback(mediaFeedback, "Mídia cadastrada com sucesso.", "success");
      mediaForm.reset();
      document.querySelector("#mediaDuration").value = "8";
      document.querySelector("#mediaOrder").value = "1";
      await loadMedia();
    } catch (error) {
      showFeedback(mediaFeedback, error.message, "error");
    }
  });
}

async function loadMedia() {
  const mediaList = document.querySelector("#mediaList");

  try {
    const result = await DashboardApi.getMedia();
    renderMediaList(result.media);
  } catch (error) {
    mediaList.innerHTML = `<p>${escapeHtml(error.message)}</p>`;
  }
}

function renderMediaList(media) {
  const mediaList = document.querySelector("#mediaList");

  if (!media.length) {
    mediaList.innerHTML = "<p>Nenhuma mídia cadastrada.</p>";
    return;
  }

  mediaList.innerHTML = media.map((item) => `
    <article class="media-item" data-media-id="${item.id}">
      <div class="media-preview">
        ${item.type === "image" ? `<img src="${escapeAttribute(item.url)}" alt="${escapeAttribute(item.title)}" />` : ""}
        ${item.type === "video" ? `<video src="${escapeAttribute(item.url)}" muted controls></video>` : ""}
        ${item.type === "text" ? `<strong>Texto</strong>` : ""}
      </div>
      <div class="media-info">
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.description || "")}</p>
        <p><strong>Tipo:</strong> ${escapeHtml(item.type)} · <strong>Ordem:</strong> ${item.displayOrder}</p>
        <label>
          <input data-field="isActive" type="checkbox" ${item.isActive ? "checked" : ""} />
          Ativa
        </label>
        <div class="action-row">
          <button class="button primary" data-action="toggle-media" type="button">Salvar</button>
          <button class="button danger" data-action="delete-media" type="button">Excluir</button>
        </div>
      </div>
    </article>
  `).join("");

  mediaList.querySelectorAll("[data-action='toggle-media']").forEach((button) => {
    button.addEventListener("click", async () => {
      const card = button.closest("[data-media-id]");
      const checkbox = card.querySelector("[data-field='isActive']");
      const feedback = document.querySelector("#mediaFeedback");

      try {
        await DashboardApi.updateMedia(card.dataset.mediaId, {
          isActive: checkbox.checked,
        });
        showFeedback(feedback, "Mídia atualizada com sucesso.", "success");
        await loadMedia();
      } catch (error) {
        showFeedback(feedback, error.message, "error");
      }
    });
  });

  mediaList.querySelectorAll("[data-action='delete-media']").forEach((button) => {
    button.addEventListener("click", async () => {
      const card = button.closest("[data-media-id]");
      const feedback = document.querySelector("#mediaFeedback");

      if (!confirm("Deseja excluir esta mídia?")) return;

      try {
        await DashboardApi.deleteMedia(card.dataset.mediaId);
        showFeedback(feedback, "Mídia excluída com sucesso.", "success");
        await loadMedia();
      } catch (error) {
        showFeedback(feedback, error.message, "error");
      }
    });
  });
}

async function loadSettings() {
  const result = await DashboardApi.getSettings();
  const settings = result.settings;

  document.querySelector("#unitName").value = settings.unitName || "";
  document.querySelector("#publicTitle").value = settings.publicTitle || "";
  document.querySelector("#carouselIntervalMs").value = settings.carouselIntervalMs || 8000;
  document.querySelector("#secretaryTitleSetting").value = settings.secretaryTitle || "";
  document.querySelector("#secretaryHoursSetting").value = settings.secretaryHours || "";
  document.querySelector("#libraryTitleSetting").value = settings.libraryTitle || "";
  document.querySelector("#libraryHoursSetting").value = settings.libraryHours || "";
}

function setupSettingsForms() {
  const settingsForm = document.querySelector("#settingsForm");
  const schoolMapForm = document.querySelector("#schoolMapForm");

  settingsForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const feedback = document.querySelector("#settingsFeedback");
    const payload = Object.fromEntries(new FormData(settingsForm).entries());

    try {
      await DashboardApi.updateSettings(payload);
      showFeedback(feedback, "Configurações salvas com sucesso.", "success");
    } catch (error) {
      showFeedback(feedback, error.message, "error");
    }
  });

  schoolMapForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const feedback = document.querySelector("#schoolMapFeedback");
    const formData = new FormData(schoolMapForm);

    try {
      await DashboardApi.uploadSchoolMap(formData);
      showFeedback(feedback, "Mapa da escola atualizado com sucesso.", "success");
      schoolMapForm.reset();
    } catch (error) {
      showFeedback(feedback, error.message, "error");
    }
  });
}

async function bootstrap() {
  await ensureAuthenticated();

  setupNavigation();
  setupLogout();
  setupImportForm();
  setupSchedules();
  setupContentSections();
  setupMediaForm();
  setupSettingsForms();

  await setupQrCode();
  await loadSchedules();
}

bootstrap().catch((error) => {
  console.error(error);
});
