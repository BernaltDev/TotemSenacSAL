const fs = require("fs/promises");
const XLSX = require("xlsx");
const { readDatabase, updateDatabase } = require("../../database/storage");
const { generateId } = require("../../utils/generateId");
const { extractTimeRange, hasTimeOverlap, getTodayIsoDate } = require("../../utils/time");
const { notifyTotem } = require("../../utils/totemEvents");

const PERIOD_BY_LABEL = {
  manha: ["manha", "manhã", "matutino", "morning"],
  tarde: ["tarde", "vespertino", "afternoon"],
  noite: ["noite", "noturno", "night"],
};

function normalizeText(value) {
  return String(value || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getPeriodFromCell(value) {
  const normalized = normalizeText(value);

  for (const [period, labels] of Object.entries(PERIOD_BY_LABEL)) {
    if (labels.some((label) => normalized.includes(normalizeText(label)))) {
      return period;
    }
  }

  return null;
}

function getPeriodLabel(period, database) {
  return database.settings?.periods?.[period]?.label || period.toUpperCase();
}

function rowHasHeader(row) {
  const normalizedRow = row.map(normalizeText);

  return normalizedRow.some((cell) => cell === "turma")
    && normalizedRow.some((cell) => cell === "horario" || cell === "horário" || cell === "horário")
    && normalizedRow.some((cell) => cell === "local")
    && normalizedRow.some((cell) => cell === "docente");
}

function getHeaderMap(row) {
  const normalizedRow = row.map(normalizeText);

  return {
    turma: normalizedRow.findIndex((cell) => cell === "turma"),
    horario: normalizedRow.findIndex((cell) => cell === "horario" || cell === "horário"),
    local: normalizedRow.findIndex((cell) => cell === "local"),
    docente: normalizedRow.findIndex((cell) => cell === "docente"),
  };
}

function getCell(row, index) {
  if (index < 0 || index === undefined) return "";
  return String(row[index] || "").trim();
}

function validateImportedRow(row, rowNumber) {
  const missingFields = [];

  if (!row.turma) missingFields.push("Turma");
  if (!row.horario) missingFields.push("Horário");
  if (!row.local) missingFields.push("Local");
  if (!row.docente) missingFields.push("Docente");

  if (missingFields.length > 0) {
    return `Linha ${rowNumber}: campos obrigatórios ausentes (${missingFields.join(", ")}).`;
  }

  return null;
}

function parseWorkbook(filePath, date, database) {
  const workbook = XLSX.readFile(filePath, {
    cellDates: false,
    raw: false,
  });

  const importedRows = [];
  const warnings = [];

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
      raw: false,
    });

    let currentPeriod = null;
    let currentHeaderMap = null;

    rows.forEach((row, rowIndex) => {
      const cells = row.map((cell) => String(cell || "").trim());
      const rowNumber = rowIndex + 1;
      const periodFromRow = cells.map(getPeriodFromCell).find(Boolean);

      if (periodFromRow) {
        currentPeriod = periodFromRow;
        currentHeaderMap = null;
        return;
      }

      if (!currentPeriod) {
        return;
      }

      if (rowHasHeader(cells)) {
        currentHeaderMap = getHeaderMap(cells);
        return;
      }

      if (!currentHeaderMap) {
        return;
      }

      const rowData = {
        turma: getCell(cells, currentHeaderMap.turma),
        horario: getCell(cells, currentHeaderMap.horario),
        local: getCell(cells, currentHeaderMap.local),
        docente: getCell(cells, currentHeaderMap.docente),
      };

      const isEmptyRow = Object.values(rowData).every((value) => !value);

      if (isEmptyRow) {
        return;
      }

      const warning = validateImportedRow(rowData, rowNumber);

      if (warning) {
        warnings.push(warning);
        return;
      }

      const timeRange = extractTimeRange(rowData.horario);

      importedRows.push({
        id: generateId("schedule"),
        date,
        period: currentPeriod,
        periodLabel: getPeriodLabel(currentPeriod, database),
        turma: rowData.turma,
        horario: rowData.horario,
        startTime: timeRange.startTime,
        endTime: timeRange.endTime,
        local: rowData.local,
        docente: rowData.docente,
        statusChave: "pending",
        retiradaConfirmadaEm: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
  }

  return {
    importedRows,
    warnings,
  };
}

function findConflicts(schedules) {
  const conflicts = [];

  for (let index = 0; index < schedules.length; index += 1) {
    const current = schedules[index];

    for (let nextIndex = index + 1; nextIndex < schedules.length; nextIndex += 1) {
      const next = schedules[nextIndex];

      if (
        current.date !== next.date
        || current.period !== next.period
        || !current.local
        || !next.local
        || normalizeText(current.local) !== normalizeText(next.local)
      ) {
        continue;
      }

      const overlaps = hasTimeOverlap(
        current.startTime,
        current.endTime,
        next.startTime,
        next.endTime
      );

      if (overlaps) {
        conflicts.push(
          `Conflito: ${current.local} possui mais de uma turma no período ${current.periodLabel} (${current.turma} / ${next.turma}).`
        );
      }
    }
  }

  return conflicts;
}

async function listSchedules({ date, period } = {}) {
  const database = await readDatabase();
  const selectedDate = date || getTodayIsoDate();

  return database.schedules
    .filter((schedule) => schedule.date === selectedDate)
    .filter((schedule) => !period || schedule.period === period)
    .sort((first, second) => {
      const periodOrder = { manha: 1, tarde: 2, noite: 3 };
      const byPeriod = (periodOrder[first.period] || 99) - (periodOrder[second.period] || 99);

      if (byPeriod !== 0) return byPeriod;

      return String(first.local).localeCompare(String(second.local), "pt-BR", {
        numeric: true,
        sensitivity: "base",
      });
    });
}

async function importSpreadsheet({ filePath, date, mode = "replace" }) {
  const selectedDate = date || getTodayIsoDate();

  const result = await updateDatabase((database) => {
    const { importedRows, warnings } = parseWorkbook(filePath, selectedDate, database);

    if (mode === "replace") {
      database.schedules = database.schedules.filter(
        (schedule) => schedule.date !== selectedDate
      );
    }

    database.schedules.push(...importedRows);

    const conflicts = findConflicts(
      database.schedules.filter((schedule) => schedule.date === selectedDate)
    );

    return {
      importedCount: importedRows.length,
      warnings: [...warnings, ...conflicts],
      schedules: database.schedules.filter((schedule) => schedule.date === selectedDate),
    };
  });

  await fs.unlink(filePath).catch(() => {});
  notifyTotem("schedules-imported", { date: selectedDate });

  return result;
}

async function updateSchedule(id, payload) {
  const result = await updateDatabase((database) => {
    const schedule = database.schedules.find((item) => item.id === id);

    if (!schedule) {
      const error = new Error("Aula não encontrada.");
      error.statusCode = 404;
      throw error;
    }

    const nextSchedule = {
      ...schedule,
      turma: String(payload.turma || schedule.turma).trim(),
      horario: String(payload.horario || schedule.horario).trim(),
      local: String(payload.local || schedule.local).trim(),
      docente: String(payload.docente || schedule.docente).trim(),
      period: payload.period || schedule.period,
      date: payload.date || schedule.date,
      updatedAt: new Date().toISOString(),
    };

    const timeRange = extractTimeRange(nextSchedule.horario);
    nextSchedule.startTime = timeRange.startTime;
    nextSchedule.endTime = timeRange.endTime;
    nextSchedule.periodLabel = getPeriodLabel(nextSchedule.period, database);

    const conflict = database.schedules.find((item) => {
      if (item.id === id) return false;
      if (item.date !== nextSchedule.date) return false;
      if (item.period !== nextSchedule.period) return false;
      if (normalizeText(item.local) !== normalizeText(nextSchedule.local)) return false;

      return hasTimeOverlap(
        item.startTime,
        item.endTime,
        nextSchedule.startTime,
        nextSchedule.endTime
      );
    });

    if (conflict) {
      const error = new Error(
        `Conflito: ${nextSchedule.local} já está alocada para "${conflict.turma}" neste horário.`
      );
      error.statusCode = 409;
      throw error;
    }

    Object.assign(schedule, nextSchedule);

    return schedule;
  });

  notifyTotem("schedule-updated", { id });
  return result;
}

async function deleteSchedule(id) {
  await updateDatabase((database) => {
    const exists = database.schedules.some((schedule) => schedule.id === id);

    if (!exists) {
      const error = new Error("Aula não encontrada.");
      error.statusCode = 404;
      throw error;
    }

    database.schedules = database.schedules.filter((schedule) => schedule.id !== id);
  });

  notifyTotem("schedule-deleted", { id });
}

async function resetStatuses(date) {
  const selectedDate = date || getTodayIsoDate();

  const result = await updateDatabase((database) => {
    let updated = 0;

    database.schedules.forEach((schedule) => {
      if (schedule.date === selectedDate) {
        schedule.statusChave = "pending";
        schedule.retiradaConfirmadaEm = null;
        schedule.updatedAt = new Date().toISOString();
        updated += 1;
      }
    });

    return {
      updated,
    };
  });

  notifyTotem("keys-reset", { date: selectedDate });
  return result;
}

module.exports = {
  listSchedules,
  importSpreadsheet,
  updateSchedule,
  deleteSchedule,
  resetStatuses,
};
