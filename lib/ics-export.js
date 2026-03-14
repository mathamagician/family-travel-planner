/**
 * Generate an .ics (iCalendar) file from trip itinerary data.
 * Works with the WeeklyCalendar `days` structure.
 *
 * @param {Object} opts
 * @param {string} opts.destination - Trip destination name
 * @param {Array}  opts.days - Array of day objects with date and slots/blocks
 * @returns {string} ICS file content
 */
export function generateICS({ destination, days }) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Toddler Trip//toddlertrip.com//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(destination)} — Toddler Trip`,
  ];

  for (const day of days) {
    const dateStr = day.date; // e.g. "2026-03-20"
    if (!dateStr) continue;

    const blocks = day.slots ?? day.blocks ?? [];
    for (const block of blocks) {
      if (block.title === "Free Time") continue;

      const startDT = toICSDateTime(dateStr, block.start_time ?? block.start);
      const endDT = toICSDateTime(dateStr, block.end_time ?? block.end);
      if (!startDT || !endDT) continue;

      const uid = `${dateStr}-${block.start_time ?? block.start}-${slugify(block.title)}@toddlertrip.com`;

      lines.push("BEGIN:VEVENT");
      lines.push(`UID:${uid}`);
      lines.push(`DTSTART:${startDT}`);
      lines.push(`DTEND:${endDT}`);
      lines.push(`SUMMARY:${escapeText(block.title)}`);

      const descParts = [];
      if (block.description) descParts.push(block.description);
      if (block.location_name) descParts.push(`Location: ${block.location_name}`);
      if (block.notes) descParts.push(`Notes: ${block.notes}`);
      descParts.push(`Made with Toddler Trip — toddlertrip.com`);
      lines.push(`DESCRIPTION:${escapeText(descParts.join("\\n"))}`);

      if (block.location_name) {
        lines.push(`LOCATION:${escapeText(block.location_name)}`);
      }

      lines.push(`DTSTAMP:${formatNow()}`);
      lines.push("END:VEVENT");
    }
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Trigger browser download of an .ics file.
 */
export function downloadICS({ destination, days }) {
  const icsContent = generateICS({ destination, days });
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${destination.replace(/[^a-zA-Z0-9 ]/g, "").trim()}-Toddler-Trip.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Helpers ──

function toICSDateTime(dateStr, timeStr) {
  if (!timeStr) return null;
  // dateStr: "2026-03-20", timeStr: "09:00" or "09:00:00"
  const [y, m, d] = dateStr.split("-");
  const [h, min] = timeStr.split(":");
  return `${y}${m.padStart(2, "0")}${d.padStart(2, "0")}T${h.padStart(2, "0")}${min.padStart(2, "0")}00`;
}

function formatNow() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeText(str) {
  return (str || "").replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function slugify(str) {
  return (str || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
