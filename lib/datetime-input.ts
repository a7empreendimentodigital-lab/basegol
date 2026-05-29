/** Valores para `<input type="date">` e `<input type="time">` no fuso local do navegador. */
export function dateTimeToInputValues(isoOrDate: string | Date): {
  scheduledDate: string;
  scheduledTime: string;
} {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) {
    const now = new Date();
    return { scheduledDate: toDateInputValue(now), scheduledTime: "12:00" };
  }
  return {
    scheduledDate: toDateInputValue(d),
    scheduledTime: toTimeInputValue(d),
  };
}

export function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function toTimeInputValue(d: Date): string {
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

/** Combina data + hora locais e retorna ISO UTC para o banco. */
export function dateTimeInputsToISO(date: string, time: string): string {
  const [y, mo, day] = date.split("-").map(Number);
  const [h, min] = (time || "00:00").split(":").map(Number);
  const local = new Date(y, mo - 1, day, h, min ?? 0, 0, 0);
  return local.toISOString();
}
