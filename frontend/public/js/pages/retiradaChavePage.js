const currentPeriodLabel = document.querySelector("#currentPeriodLabel");
const classList = document.querySelector("#classList");
const keyFeedback = document.querySelector("#keyFeedback");
const periodButtons = document.querySelectorAll("[data-period]");

let selectedPeriod = "";

function showFeedback(message, type = "") {
  keyFeedback.className = `key-feedback ${type}`;
  keyFeedback.textContent = message;
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function loadClasses() {
  classList.innerHTML = "";
  showFeedback("Carregando aulas...", "");

  try {
    const result = await KeyPickupApi.getCurrentClasses(selectedPeriod);

    currentPeriodLabel.textContent = `Período: ${result.periodLabel}`;

    if (!result.schedules.length) {
      classList.innerHTML = `
        <article class="class-card">
          <h2>Nenhuma aula encontrada</h2>
          <p>Não há aulas cadastradas para este período.</p>
        </article>
      `;
      showFeedback("", "");
      return;
    }

    classList.innerHTML = result.schedules.map((schedule) => `
      <article class="class-card ${schedule.statusChave === "started" ? "started" : ""}" data-schedule-id="${schedule.id}">
        <h2>${escapeHtml(schedule.local)} · ${escapeHtml(schedule.turma)}</h2>
        <p><strong>Horário:</strong> ${escapeHtml(schedule.horario)}</p>
        <p><strong>Docente:</strong> ${escapeHtml(schedule.docente)}</p>
        <p><strong>Status:</strong> ${schedule.statusChave === "started" ? "Aula em andamento" : "Aguardando retirada da chave"}</p>
        <button
          class="confirm-button"
          type="button"
          ${schedule.statusChave === "started" ? "disabled" : ""}
        >
          ${schedule.statusChave === "started" ? "Chave já retirada" : "Confirmar retirada desta chave"}
        </button>
      </article>
    `).join("");

    classList.querySelectorAll(".confirm-button:not([disabled])").forEach((button) => {
      button.addEventListener("click", async () => {
        const card = button.closest("[data-schedule-id]");
        await confirmPickup(card.dataset.scheduleId);
      });
    });

    showFeedback("", "");
  } catch (error) {
    showFeedback(error.message, "error");
  }
}

async function confirmPickup(scheduleId) {
  if (!confirm("Confirmar a retirada desta chave?")) {
    return;
  }

  showFeedback("Registrando retirada...", "");

  try {
    await KeyPickupApi.confirm(scheduleId);
    showFeedback("Retirada registrada com sucesso. O totem será atualizado.", "success");
    await loadClasses();
  } catch (error) {
    showFeedback(error.message, "error");
  }
}

periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    selectedPeriod = button.dataset.period;

    periodButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    loadClasses();
  });
});

loadClasses();
