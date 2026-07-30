export const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;

export const toTrimmed = (value) => (typeof value === "string" ? value.trim() : "");

export const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

export const isDateString = (value) => {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

export const normalizeDateOnly = (value) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
};

export const isMongoObjectId = (value) => /^[a-fA-F0-9]{24}$/.test(String(value || ""));

export const inRange = (value, min, max) => {
  const number = toNumber(value);
  if (number === null) return false;
  return number >= min && number <= max;
};
