const { readDatabase } = require("../../database/storage");
const { getTodayIsoDate } = require("../../utils/time");

function onlyActive(items) {
  return items.filter((item) => item.isActive);
}

async function getTotemData({ date } = {}) {
  const database = await readDatabase();
  const selectedDate = date || getTodayIsoDate();

  const schedules = database.schedules
    .filter((schedule) => schedule.date === selectedDate)
    .sort((first, second) => {
      const periodOrder = { manha: 1, tarde: 2, noite: 3 };
      const byPeriod = (periodOrder[first.period] || 99) - (periodOrder[second.period] || 99);

      if (byPeriod !== 0) return byPeriod;

      return String(first.local).localeCompare(String(second.local), "pt-BR", {
        numeric: true,
        sensitivity: "base",
      });
    });

  return {
    date: selectedDate,
    settings: database.settings,
    schedules,
    notices: onlyActive(database.contents.notices),
    news: onlyActive(database.contents.news),
    events: onlyActive(database.contents.events),
    media: onlyActive(database.media).sort(
      (first, second) => Number(first.displayOrder || 0) - Number(second.displayOrder || 0)
    ),
  };
}

module.exports = {
  getTotemData,
};
