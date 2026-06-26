const { readDatabase, updateDatabase } = require("../../database/storage");
const { getCurrentPeriod, getTodayIsoDate } = require("../../utils/time");
const { notifyTotem } = require("../../utils/totemEvents");

async function getCurrentClasses({ date, period } = {}) {
  const database = await readDatabase();
  const selectedDate = date || getTodayIsoDate();
  const selectedPeriod = period || getCurrentPeriod(database.settings);

  const schedules = database.schedules
    .filter((schedule) => schedule.date === selectedDate)
    .filter((schedule) => schedule.period === selectedPeriod)
    .sort((first, second) => {
      return String(first.local).localeCompare(String(second.local), "pt-BR", {
        numeric: true,
        sensitivity: "base",
      });
    });

  return {
    date: selectedDate,
    period: selectedPeriod,
    periodLabel: database.settings.periods?.[selectedPeriod]?.label || selectedPeriod.toUpperCase(),
    schedules,
  };
}

async function confirmPickup(scheduleId) {
  const schedule = await updateDatabase((database) => {
    const currentSchedule = database.schedules.find((item) => item.id === scheduleId);

    if (!currentSchedule) {
      const error = new Error("Aula não encontrada.");
      error.statusCode = 404;
      throw error;
    }

    if (currentSchedule.statusChave === "started") {
      return currentSchedule;
    }

    currentSchedule.statusChave = "started";
    currentSchedule.retiradaConfirmadaEm = new Date().toISOString();
    currentSchedule.updatedAt = new Date().toISOString();

    return currentSchedule;
  });

  notifyTotem("key-picked-up", { scheduleId });

  return schedule;
}

module.exports = {
  getCurrentClasses,
  confirmPickup,
};
