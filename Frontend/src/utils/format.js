export const fmtDate = (d) =>
  new Date(d).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

// ---------- report periods ----------
// Week starts on Sunday (0). Change to 1 if you want Monday.
export const WEEK_START = 0;

export const startOfDay = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

export const addDays = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

const short = (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });

// kind = "day" | "week" | "month"; the range is [start, end) so end is exclusive
export const rangeFor = (kind, anchor) => {
  const a = startOfDay(anchor);
  if (kind === "day") {
    return {
      start: a,
      end: addDays(a, 1),
      label: a.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    };
  }
  if (kind === "week") {
    const start = addDays(a, -((a.getDay() - WEEK_START + 7) % 7));
    const end = addDays(start, 7);
    return { start, end, label: `${short(start)} – ${short(addDays(end, -1))} ${addDays(end, -1).getFullYear()}` };
  }
  const start = new Date(a.getFullYear(), a.getMonth(), 1);
  const end = new Date(a.getFullYear(), a.getMonth() + 1, 1);
  return { start, end, label: start.toLocaleDateString(undefined, { month: "long", year: "numeric" }) };
};

export const shiftAnchor = (kind, anchor, dir) => {
  if (kind === "day") return addDays(anchor, dir);
  if (kind === "week") return addDays(anchor, 7 * dir);
  return new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1);
};

export const toInputDate = (d) => {
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const fromInputDate = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
