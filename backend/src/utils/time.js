function normalizeTime(value) {
  if (!value) return "";

  const text = String(value)
    .trim()
    .replace(/[hH]/g, ":")
    .replace(/\s+/g, " ");

  const match = text.match(/(\d{1,2})[:.](\d{2})/);

  if (!match) return "";

  const hours = match[1].padStart(2, "0");
  const minutes = match[2].padStart(2, "0");

  return `${hours}:${minutes}`;
}

function extractTimeRange(value) {
  const text = String(value || "")
    .trim()
    .replace(/[hH]/g, ":")
    .replace(/\s+/g, " ");

  const matches = [...text.matchAll(/(\d{1,2})[:.](\d{2})/g)];

  if (matches.length === 0) {
    return {
      startTime: "",
      endTime: "",
      original: text,
    };
  }

  const first = matches[0];
  const last = matches[matches.length - 1];

  return {
    startTime: `${first[1].padStart(2, "0")}:${first[2].padStart(2, "0")}`,
    endTime: `${last[1].padStart(2, "0")}:${last[2].padStart(2, "0")}`,
    original: text,
  };
}

function timeToMinutes(time) {
  const normalized = normalizeTime(time);

  if (!normalized) return null;

  const [hours, minutes] = normalized.split(":").map(Number);

  return hours * 60 + minutes;
}

function hasTimeOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  const aStart = timeToMinutes(firstStart);
  const aEnd = timeToMinutes(firstEnd);
  const bStart = timeToMinutes(secondStart);
  const bEnd = timeToMinutes(secondEnd);

  if ([aStart, aEnd, bStart, bEnd].some((value) => value === null)) {
    return false;
  }

  return aStart < bEnd && bStart < aEnd;
}

function getCurrentPeriod(settings, date = new Date()) {
  const currentMinutes = date.getHours() * 60 + date.getMinutes();
  const periods = settings.periods || {};

  for (const [period, config] of Object.entries(periods)) {
    const start = timeToMinutes(config.start);
    const end = timeToMinutes(config.end);

    if (start === null || end === null) continue;

    if (start <= end && currentMinutes >= start && currentMinutes <= end) {
      return period;
    }

    if (start > end && (currentMinutes >= start || currentMinutes <= end)) {
      return period;
    }
  }

  return "manha";
}

function getTodayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = {
  normalizeTime,
  extractTimeRange,
  timeToMinutes,
  hasTimeOverlap,
  getCurrentPeriod,
  getTodayIsoDate,
};
