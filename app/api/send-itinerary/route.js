import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { email, destination, days, pdfBase64, weather } = await request.json();

    if (!email || !destination || !days?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Simple email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Email service not configured. Add RESEND_API_KEY to your environment." }, { status: 500 });
    }

    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Build HTML itinerary
    const dayRows = days.map(day => {
      const w = weather?.[day.date];
      const weatherLine = w
        ? `<span style="font-size:13px;color:#8A9BA5;margin-left:8px;">${w.icon} ${w.highF}°F ${w.label}</span>`
        : "";

      const slots = (day.slots ?? [])
        .filter(s => s.title !== "Free Time")
        .map(s => {
          const time = formatTime12(s.start);
          const dur = s.duration_mins ? formatDuration(s.duration_mins) : "";
          const addr = s.location ? `<br/><span style="color:#8A9BA5;font-size:11px;">📍 ${s.location}</span>` : "";
          const notes = s.notes ? `<br/><span style="color:#1C2B33;font-size:12px;">✏️ ${s.notes}</span>` : "";
          const desc = s.description ? `<br/><span style="color:#8A9BA5;font-size:11px;">${s.description}</span>` : "";
          return `<tr>
            <td style="padding:6px 10px;border-bottom:1px solid #F0EDE8;font-size:13px;color:#8A9BA5;white-space:nowrap;vertical-align:top;">${time}</td>
            <td style="padding:6px 10px;border-bottom:1px solid #F0EDE8;">
              <strong style="font-size:13px;color:#1C2B33;">${s.title}</strong>
              ${dur ? `<span style="font-size:11px;color:#8A9BA5;margin-left:6px;">${dur}</span>` : ""}
              ${addr}${notes}${desc}
            </td>
          </tr>`;
        }).join("");

      return `<div style="margin-bottom:20px;">
        <h3 style="font-family:Georgia,serif;font-size:16px;color:#1C2B33;margin:0 0 6px;">
          Day ${day.day} — ${day.date ?? ""} ${weatherLine}
        </h3>
        <table style="width:100%;border-collapse:collapse;">${slots || '<tr><td style="padding:6px;color:#8A9BA5;font-style:italic;">No activities scheduled</td></tr>'}</table>
      </div>`;
    }).join("");

    const html = `
      <div style="font-family:'Nunito',Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;padding:20px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-family:Georgia,serif;font-size:24px;color:#1C2B33;margin:0;">
            🗓️ ${destination} Itinerary
          </h1>
          <p style="color:#8A9BA5;font-size:13px;margin-top:6px;">
            Powered by <a href="https://www.toddlertrip.com" style="color:#0B7A8E;text-decoration:none;font-weight:700;">Toddler Trip</a>
          </p>
        </div>
        ${dayRows}
        <div style="text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #F0EDE8;">
          <a href="https://www.toddlertrip.com/plan" style="display:inline-block;padding:10px 24px;border-radius:10px;background:linear-gradient(135deg,#E8643A,#F09A3A);color:#fff;font-size:14px;font-weight:800;text-decoration:none;">
            View & Edit on Toddler Trip
          </a>
        </div>
      </div>
    `;

    const emailPayload = {
      from: "Toddler Trip <itinerary@toddlertrip.com>",
      to: email,
      subject: `Your ${destination} Itinerary — Toddler Trip`,
      html,
    };

    if (pdfBase64) {
      emailPayload.attachments = [{
        filename: `${destination.replace(/[^a-zA-Z0-9 ]/g, "").trim()}-Itinerary.pdf`,
        content: Buffer.from(pdfBase64, "base64"),
      }];
    }

    const { error } = await resend.emails.send(emailPayload);

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Send itinerary error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function formatTime12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${String(m).padStart(2, "0")} ${suffix}`;
}

function formatDuration(mins) {
  if (!mins || mins <= 0) return "";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
