export function dayKeyBrussels(d = new Date()) {
    // Stable dayKey in Belgium timezone so server/client/routes match
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Brussels",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(d);
  
    const y = parts.find((p) => p.type === "year")?.value;
    const m = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
  
    return `${y}-${m}-${day}`;
  }