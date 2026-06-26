const clockElement = document.querySelector("#totemClock");
const dateElement = document.querySelector("#totemDate");
const scheduleTitle = document.querySelector("#scheduleTitle");
const scheduleScroll = document.querySelector("#scheduleScroll");
const carouselStage = document.querySelector("#carouselStage");
const carouselDots = document.querySelector("#carouselDots");
const secretaryTitle = document.querySelector("#secretaryTitle");
const secretaryHours = document.querySelector("#secretaryHours");
const libraryTitle = document.querySelector("#libraryTitle");
const libraryHours = document.querySelector("#libraryHours");
const openMapButton = document.querySelector("#openMapButton");
const closeMapButton = document.querySelector("#closeMapButton");
const schoolMapModal = document.querySelector("#schoolMapModal");
const schoolMapImage = document.querySelector("#schoolMapImage");

let carouselItems = [];
let carouselIndex = 0;
let carouselTimer = null;
let carouselIntervalMs = 8000;

function updateClock() {
  const now = new Date();

  clockElement.textContent = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  dateElement.textContent = formatDatePtBr(now);
}

function groupSchedulesByPeriod(schedules, settings) {
  const periods = settings.periods || {};
  const group = {
    manha: [],
    tarde: [],
    noite: [],
  };

  schedules.forEach((schedule) => {
    if (!group[schedule.period]) {
      group[schedule.period] = [];
    }

    group[schedule.period].push(schedule);
  });

  return Object.entries(group).map(([period, items]) => ({
    period,
    label: periods[period]?.label || period.toUpperCase(),
    items,
  }));
}

function createStatusLabel(status) {
  return status === "started" ? "Aula em andamento" : "Aguardando retirada da chave";
}

function renderSchedules(schedules, settings) {
  const groups = groupSchedulesByPeriod(schedules, settings);

  if (!schedules.length) {
    scheduleScroll.innerHTML = `
      <div class="empty-state">
        Nenhum mapa de sala importado para hoje.
      </div>
    `;
    return;
  }

  scheduleScroll.innerHTML = groups
    .filter((group) => group.items.length > 0)
    .map((group) => `
      <section class="schedule-period">
        <div class="schedule-period-title">${group.label}</div>
        <table class="schedule-table">
          <thead>
            <tr>
              <th class="col-status">Status</th>
              <th>Turma</th>
              <th class="col-time">Horário</th>
              <th class="col-local">Local</th>
              <th class="col-teacher">Docente</th>
            </tr>
          </thead>
          <tbody>
            ${group.items.map((schedule) => `
              <tr>
                <td class="col-status">
                  <span
                    class="status-dot ${schedule.statusChave === "started" ? "started" : "pending"}"
                    title="${createStatusLabel(schedule.statusChave)}"
                    aria-label="${createStatusLabel(schedule.statusChave)}"
                  ></span>
                </td>
                <td>${escapeHtml(schedule.turma)}</td>
                <td>${escapeHtml(schedule.horario)}</td>
                <td>${escapeHtml(schedule.local)}</td>
                <td>${escapeHtml(schedule.docente)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </section>
    `)
    .join("");
}

function contentToCarouselItems(data) {
  const textItems = [
    ...data.notices.map((item) => ({
      type: "text",
      title: item.title,
      description: item.description,
    })),
    ...data.news.map((item) => ({
      type: item.imageUrl ? "image" : "text",
      title: item.title,
      description: item.description,
      url: item.imageUrl,
    })),
    ...data.events.map((item) => ({
      type: item.imageUrl ? "image" : "text",
      title: item.title,
      description: item.description,
      url: item.imageUrl,
    })),
  ];

  const mediaItems = data.media.map((item) => ({
    type: item.type,
    title: item.title,
    description: item.description,
    url: item.url,
    durationSeconds: item.durationSeconds,
  }));

  const items = [...mediaItems, ...textItems].filter((item) => {
    if (item.type === "text") return item.title || item.description;
    return item.url;
  });

  if (items.length === 0) {
    return [{
      type: "text",
      title: "Bem-vindo ao Senac",
      description: "Confira o mapa de salas, avisos e eventos da unidade.",
    }];
  }

  return items;
}

function renderCarousel() {
  carouselStage.innerHTML = carouselItems.map((item, index) => {
    const activeClass = index === carouselIndex ? "active" : "";

    if (item.type === "image") {
      return `
        <div class="carousel-slide ${activeClass}">
          <img src="${escapeAttribute(item.url)}" alt="${escapeAttribute(item.title || "Imagem institucional")}" />
        </div>
      `;
    }

    if (item.type === "video") {
      return `
        <div class="carousel-slide ${activeClass}">
          <video src="${escapeAttribute(item.url)}" autoplay muted playsinline loop></video>
        </div>
      `;
    }

    return `
      <div class="carousel-slide ${activeClass}">
        <div class="text-slide">
          <h3>${escapeHtml(item.title || "")}</h3>
          <p>${escapeHtml(item.description || "")}</p>
        </div>
      </div>
    `;
  }).join("");

  carouselDots.innerHTML = carouselItems.map((item, index) => `
    <button class="carousel-dot ${index === carouselIndex ? "active" : ""}" type="button" aria-label="Ir para slide ${index + 1}"></button>
  `).join("");
}

function startCarousel() {
  clearInterval(carouselTimer);

  if (carouselItems.length <= 1) {
    renderCarousel();
    return;
  }

  renderCarousel();

  carouselTimer = setInterval(() => {
    carouselIndex = (carouselIndex + 1) % carouselItems.length;
    renderCarousel();
  }, carouselIntervalMs);
}

function renderSettings(settings) {
  scheduleTitle.textContent = settings.publicTitle || "ENCONTRE SUA SALA AQUI";
  secretaryTitle.textContent = settings.secretaryTitle || "SECRETARIA";
  secretaryHours.textContent = settings.secretaryHours || "";
  libraryTitle.textContent = settings.libraryTitle || "BIBLIOTECA";
  libraryHours.textContent = settings.libraryHours || "";
  schoolMapImage.src = settings.schoolMapUrl || "/assets/images/school-map-placeholder.svg";
  carouselIntervalMs = Number(settings.carouselIntervalMs || 8000);
}

async function loadTotemData() {
  const data = await TotemApi.getData();

  renderSettings(data.settings);
  renderSchedules(data.schedules, data.settings);

  carouselItems = contentToCarouselItems(data);
  carouselIndex = 0;
  startCarousel();
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

function setupMapModal() {
  openMapButton.addEventListener("click", () => {
    schoolMapModal.classList.add("open");
    schoolMapModal.setAttribute("aria-hidden", "false");
  });

  closeMapButton.addEventListener("click", () => {
    schoolMapModal.classList.remove("open");
    schoolMapModal.setAttribute("aria-hidden", "true");
  });

  schoolMapModal.addEventListener("click", (event) => {
    if (event.target === schoolMapModal) {
      schoolMapModal.classList.remove("open");
      schoolMapModal.setAttribute("aria-hidden", "true");
    }
  });
}

function setupRealtimeUpdates() {
  if (!window.EventSource) {
    setInterval(loadTotemData, 10000);
    return;
  }

  const source = new EventSource("/api/totem/stream");

  source.addEventListener("totem-update", () => {
    loadTotemData().catch(console.error);
  });

  source.onerror = () => {
    console.warn("Canal em tempo real indisponível. O polling será usado como apoio.");
  };

  setInterval(loadTotemData, 30000);
}

updateClock();
setInterval(updateClock, 1000);
setupMapModal();
loadTotemData().catch(console.error);
setupRealtimeUpdates();
