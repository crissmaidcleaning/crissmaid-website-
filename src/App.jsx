import { useState, useEffect, useRef } from "react";
import React from "react";

// ── Colors ──────────────────────────────────────────────────────────────────
const C = {
  navy: "#1A3A6B", navyDark: "#1C4B9B", blue: "#2468C0",
  blueLight: "#6aaee8", green: "#4BAD2E", greenLight: "#6DC94E",
  cream: "#F4F8FF", white: "#FFFFFF", gray: "#6B7280",
  light: "#EDF2FB", red: "#EF4444", gold: "#F4D35E",
};

// ── Static data ──────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "CrissMaid2024!";

const HOME_SIZES = [
  { label: "Studio / 1BR", sqft: "< 800 sq ft", crew2h: 2, crew3h: 1.5 },
  { label: "2 Bedroom", sqft: "800–1,200 sq ft", crew2h: 3, crew3h: 2 },
  { label: "3 Bedroom", sqft: "1,200–1,800 sq ft", crew2h: 4, crew3h: 2.5 },
  { label: "4 Bedroom", sqft: "1,800–2,500 sq ft", crew2h: 5, crew3h: 3.5 },
  { label: "5+ Bedroom", sqft: "> 2,500 sq ft", crew2h: 7, crew3h: 5 },
];

const RECURRING_PRICES = [
  { label: "Studio / 1BR", weekly: 95, biweekly: 110, monthly: 130 },
  { label: "2 Bedroom", weekly: 120, biweekly: 140, monthly: 165 },
  { label: "3 Bedroom", weekly: 150, biweekly: 175, monthly: 200 },
  { label: "4 Bedroom", weekly: 185, biweekly: 215, monthly: 250 },
  { label: "5+ Bedroom", weekly: 230, biweekly: 265, monthly: 310 },
];

const EXTRAS_RECURRING = [
  { id: "fridge", label: "Fridge (inside & out)", price: 45 },
  { id: "oven", label: "Oven cleaning", price: 45 },
  { id: "silver", label: "Silver cleaning", price: null, quote: true },
];

const TIME_SLOTS = ["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"];
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// ── Date helpers ─────────────────────────────────────────────────────────────
function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m) { return new Date(y, m, 1).getDay(); }
function pad(n) { return String(n).padStart(2, "0"); }
function dateKey(y, m, d) { return `${y}-${pad(m+1)}-${pad(d)}`; }
function todayObj() { const t = new Date(); return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() }; }

// ── Storage helpers ──────────────────────────────────────────────────────────
function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, val) { try { localStorage.setItem(key, val); } catch {} }
function safeRemove(key) { try { localStorage.removeItem(key); } catch {} }

function loadEmployees() {
  try { const s = safeGet("cmc_employees"); return s ? JSON.parse(s) : [{ id: 1, name: "Maria G.", pin: "123456", color: C.blue }]; } catch { return []; }
}
function saveEmployees(list) { safeSet("cmc_employees", JSON.stringify(list)); }
function loadBookings() { try { const s = safeGet("cmc_bookings"); return s ? JSON.parse(s) : []; } catch { return []; } }
function saveBookings(list) { safeSet("cmc_bookings", JSON.stringify(list)); }

// ── Service area validation ──────────────────────────────────────────────────
function checkServiceArea(addr) {
  if (!addr || addr.length < 6) return null;
  const u = addr.toUpperCase();
  const md = [/\bMARYLAND\b/,/,\s*MD\b/,/\bMD\s*\d{5}/,/ MD,/,
    /\bROCKVILLE\b/,/\bGAITHERSBURG\b/,/\bSILVER SPRING\b/,/\bBETHESDA\b/,
    /\bCHEVY CHASE\b/,/\bGREENBELT\b/,/\bCOLLEGE PARK\b/,/\bHYATTSVILLE\b/,
    /\bGERMANTOWN\b/,/\bCLARKSBURG\b/,/\bOLNEY\b/,/\bPOTOMAC\b/,
    /\bNORTH BETHESDA\b/,/\bWHEATON\b/,/\bKENSINGTON\b/,/\bTAKOMA PARK\b/,
    /\bLANHAM\b/,/\bBALTIMORE\b/,/\bANNAPOLIS\b/,/\bFREDERICK\b/,
    /\bBOWIE\b/,/\bLAUREL\b/,/\bCLINTON\b/,/\bSUITLAND\b/,
    /\bOXON HILL\b/,/\bFORT WASHINGTON\b/,/\bMONTGOMERY COUNTY\b/,/\bPRINCE GEORGE/,
  ];
  const dc = [/\bWASHINGTON,?\s*D\.?C\.?/,/,\s*DC\b/,/\bDC\s*\d{5}/,
    /\bCAPITOL HILL\b/,/\bDUPONT CIRCLE\b/,/\bGEORGETOWN\b/,/\bANACOSTIA\b/,
    /\bCOLUMBIA HEIGHTS\b/,/\bADAMS MORGAN\b/,/\bPETWORTH\b/,
  ];
  return md.some(p => p.test(u)) || dc.some(p => p.test(u));
}

// ── EmailJS ──────────────────────────────────────────────────────────────────
const EJS_KEY = "xsJ6SE76AVOAqx9Xm";
const EJS_SVC = "service_wz55syl";
const EJS_CUST = "template_z2z4o87";
const EJS_BIZ = "template_3xsrgaj";

async function sendBookingEmails(b) {
  try {
    if (!window.emailjs) {
      await new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
        s.onload = res; s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    window.emailjs.init(EJS_KEY);
    const extras = (b.extras || []).map(id => EXTRAS_RECURRING.find(e => e.id === id)?.label).filter(Boolean).join(", ") || "None";
    const svcType = b.isFirst ? "Free Estimate — First Cleaning" : `Recurring (${b.recurringFreq})`;
    const recurObj = RECURRING_PRICES.find(r => r.label === b.homeSize);
    const price = !b.isFirst && recurObj ? `$${recurObj[b.recurringFreq] || "TBD"}` : "Free Estimate — to be quoted";
    const base = { customer_name: b.name, customer_email: b.email, customer_phone: b.phone, date: b.date, time: b.slot, address: b.address, home_size: b.homeSize, service_type: svcType, extras, notes: b.notes || "None" };
    await window.emailjs.send(EJS_SVC, EJS_CUST, { ...base, to_email: b.email, to_name: b.name });
    await window.emailjs.send(EJS_SVC, EJS_BIZ, { ...base, to_email: "crissmaidcleaning@gmail.com", to_name: "Criss Maid Cleaning", price });
  } catch (err) { console.error("Email error:", err); }
}

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  input: { width: "100%", padding: "11px 14px", border: `1px solid #C5D5EC`, borderRadius: 8, fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", outline: "none" },
  select: { width: "100%", padding: "11px 14px", border: `1px solid #C5D5EC`, borderRadius: 8, fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", background: "#fff" },
  label: { fontSize: 12, color: C.gray, fontWeight: "bold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6, display: "block" },
  card: { background: "#fff", borderRadius: 12, padding: 24, boxShadow: "0 2px 16px rgba(26,58,107,0.08)", marginBottom: 20 },
  btn: { background: C.blue, color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  btnGreen: { background: C.green, color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  btnOut: { background: "transparent", color: C.blue, border: `2px solid ${C.blue}`, borderRadius: 8, padding: "10px 24px", fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
  section: { maxWidth: 960, margin: "0 auto", padding: "32px 20px" },
  title: { fontSize: 20, fontFamily: "Georgia, serif", color: C.navy, marginBottom: 16, borderBottom: `2px solid ${C.blue}`, paddingBottom: 8 },
};

// ── Small reusable components ────────────────────────────────────────────────
function Btn({ children, onClick, variant = "blue", disabled, style = {} }) {
  const base = variant === "green" ? S.btnGreen : variant === "outline" ? S.btnOut : S.btn;
  return <button onClick={onClick} disabled={disabled} style={{ ...base, opacity: disabled ? 0.4 : 1, ...style }}>{children}</button>;
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={S.label}>{label}</label>
      {children}
    </div>
  );
}

// ── Address Autocomplete ──────────────────────────────────────────────────────
function AddressInput({ value, onChange, onAreaCheck }) {
  const [text, setText] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [areaOk, setAreaOk] = useState(null);

  function check(v) {
    const ok = checkServiceArea(v);
    setAreaOk(ok);
    if (onAreaCheck) onAreaCheck(ok);
  }

  function handleChange(e) {
    const v = e.target.value;
    setText(v);
    onChange(v);
    check(v);
    if (v.length < 3) { setSuggestions([]); setOpen(false); return; }
    clearTimeout(window._at);
    window._at = setTimeout(async () => {
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=5&q=${encodeURIComponent(v)}`,
          { headers: { "Accept-Language": "en" }, signal: AbortSignal.timeout(5000) }
        );
        if (!r.ok) return;
        const d = await r.json();
        if (Array.isArray(d) && d.length) { setSuggestions(d.map(x => x.display_name)); setOpen(true); }
      } catch { /* silently ignore network errors */ }
    }, 400);
  }

  function pick(s) {
    setText(s); onChange(s); check(s);
    setSuggestions([]); setOpen(false);
  }

  const borderCol = areaOk === false ? C.red : areaOk === true ? C.green : "#C5D5EC";

  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <input style={{ ...S.input, border: `1px solid ${borderCol}`, paddingRight: 34 }} value={text} onChange={handleChange}
          onBlur={() => setTimeout(() => setOpen(false), 200)} onFocus={() => suggestions.length && setOpen(true)}
          placeholder="Start typing your address..." autoComplete="off" />
        {areaOk === true && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.green }}>✓</span>}
        {areaOk === false && <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: C.red, fontWeight: "bold" }}>✱</span>}
      </div>
      {areaOk === false && (
        <div style={{ marginTop: 6, padding: "10px 14px", background: "#FFF5F5", border: `1px solid ${C.red}`, borderRadius: 8, fontSize: 13 }}>
          <span style={{ color: C.red, fontWeight: "bold" }}>✱ Outside our service area.</span>{" "}
          <span style={{ color: "#555" }}>We serve <strong>Maryland</strong> and <strong>Washington D.C.</strong> only. Call (240) 413-4313 if you think this is an error.</span>
        </div>
      )}
      {areaOk === true && <div style={{ marginTop: 4, color: C.green, fontSize: 12 }}>✓ We service this area!</div>}
      {open && suggestions.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999, background: "#fff", border: `1px solid #C5D5EC`, borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)", maxHeight: 200, overflowY: "auto", marginTop: 2 }}>
          {suggestions.map((s, i) => {
            const ok = checkServiceArea(s);
            return (
              <div key={i} onMouseDown={() => pick(s)}
                style={{ padding: "9px 14px", cursor: "pointer", fontSize: 13, borderBottom: i < suggestions.length - 1 ? "1px solid #F3F4F6" : "none", display: "flex", alignItems: "center", gap: 8 }}
                onMouseEnter={e => e.currentTarget.style.background = C.light}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <span style={{ color: ok === false ? C.red : C.blue }}>{ok === false ? "✱" : "📍"}</span>
                <span style={{ flex: 1 }}>{s}</span>
                {ok === true && <span style={{ color: C.green, fontSize: 11 }}>✓ MD/DC</span>}
                {ok === false && <span style={{ color: C.red, fontSize: 11 }}>Out of area</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Calendar (customer-facing, no weekends) ──────────────────────────────────
function CalendarPicker({ bookings, selectedDate, selectedSlot, onSelect }) {
  const t = todayObj();
  const [yr, setYr] = useState(t.y);
  const [mo, setMo] = useState(t.m);

  function prev() { if (mo === 0) { setYr(y => y-1); setMo(11); } else setMo(m => m-1); }
  function next() { if (mo === 11) { setYr(y => y+1); setMo(0); } else setMo(m => m+1); }

  const dim = getDaysInMonth(yr, mo);
  const fd = getFirstDay(yr, mo);
  const todayMs = new Date(t.y, t.m, t.d).getTime();

  function isBlocked(d) {
    const dow = new Date(yr, mo, d).getDay();
    return dow === 0 || dow === 6 || new Date(yr, mo, d).getTime() < todayMs;
  }
  function isBooked(d, slot) {
    const dk = dateKey(yr, mo, d);
    return bookings.some(b => b.date === dk && b.slot === slot);
  }
  function hasDots(d) {
    const dk = dateKey(yr, mo, d);
    return bookings.some(b => b.date === dk);
  }

  const selDk = selectedDate ? dateKey(selectedDate.y, selectedDate.m, selectedDate.d) : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={prev} style={{ ...S.btnOut, padding: "5px 14px" }}>‹</button>
        <strong style={{ fontFamily: "Georgia,serif", fontSize: 17 }}>{MONTHS[mo]} {yr}</strong>
        <button onClick={next} style={{ ...S.btnOut, padding: "5px 14px" }}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 6 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, color: C.gray, fontWeight: "bold", padding: "3px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3, marginBottom: 16 }}>
        {Array(fd).fill(null).map((_, i) => <div key={`_${i}`} />)}
        {Array(dim).fill(null).map((_, i) => {
          const d = i + 1;
          const blocked = isBlocked(d);
          const dk = dateKey(yr, mo, d);
          const isToday = yr === t.y && mo === t.m && d === t.d;
          const isSel = selDk === dk;
          const dow = new Date(yr, mo, d).getDay();
          const isWknd = dow === 0 || dow === 6;
          return (
            <div key={d} onClick={() => !blocked && onSelect({ y: yr, m: mo, d }, null)}
              style={{ borderRadius: 7, padding: "7px 3px", textAlign: "center", cursor: blocked ? "not-allowed" : "pointer", fontSize: 13,
                background: isSel ? C.navy : isToday ? C.navyDark : "#fff",
                color: isSel || isToday ? "#fff" : blocked ? "#CCC" : C.navy,
                border: `2px solid ${isSel ? C.navy : "transparent"}`,
              }}>
              {d}
              {isWknd && !blocked && <div style={{ fontSize: 7, color: "#CCC" }}>Closed</div>}
              {hasDots(d) && !blocked && <div style={{ width: 5, height: 5, borderRadius: "50%", background: isSel ? C.greenLight : C.blue, margin: "2px auto 0" }} />}
            </div>
          );
        })}
      </div>
      {selectedDate && selectedDate.m === mo && selectedDate.y === yr && (
        <div>
          <div style={{ ...S.label, marginBottom: 10 }}>Available times — {MONTHS[mo]} {selectedDate.d}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TIME_SLOTS.map(slot => {
              const booked = isBooked(selectedDate.d, slot);
              const sel = selectedSlot === slot;
              return (
                <button key={slot} disabled={booked} onClick={() => onSelect(selectedDate, slot)}
                  style={{ padding: "8px 14px", borderRadius: 6, border: `2px solid ${booked ? "#E5E7EB" : sel ? C.blue : C.blueLight}`,
                    background: booked ? "#F9FAFB" : sel ? C.blue : "#fff",
                    color: booked ? "#CCC" : sel ? "#fff" : C.navy, cursor: booked ? "not-allowed" : "pointer", fontSize: 13, fontFamily: "inherit" }}>
                  {slot}{booked ? " ✗" : ""}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: C.gray, marginTop: 8 }}>Mon–Fri only · 30-min travel buffer · Weekends closed (call for quote)</div>
        </div>
      )}
    </div>
  );
}

// ── Booking Form ─────────────────────────────────────────────────────────────
function BookingForm({ bookings, onBook }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", notes: "", homeSize: "", isFirst: true, recurringFreq: "none", extras: [], date: null, slot: null });
  const [areaOk, setAreaOk] = useState(null);
  const [done, setDone] = useState(false);
  const [sending, setSending] = useState(false);

  function upd(k, v) { setForm(f => ({ ...f, [k]: v })); }
  function toggleExtra(id) { upd("extras", form.extras.includes(id) ? form.extras.filter(x => x !== id) : [...form.extras, id]); }

  function canNext() {
    if (step === 1) return form.name && form.phone && form.email && form.address && areaOk !== false;
    if (step === 2) return !!form.homeSize;
    if (step === 3) return !!(form.date && form.slot);
    return true;
  }

  async function submit() {
    setSending(true);
    const b = { id: "b" + Date.now(), ...form, date: dateKey(form.date.y, form.date.m, form.date.d), status: "confirmed" };
    onBook(b);
    await sendBookingEmails(b);
    setSending(false);
    setDone(true);
  }

  if (done) {
    return (
      <div style={{ ...S.card, textAlign: "center", padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>{form.isFirst ? "🎉" : "✅"}</div>
        <h2 style={{ fontFamily: "Georgia,serif", color: C.blue, marginBottom: 8 }}>{form.isFirst ? "Free Estimate Scheduled!" : "Booking Confirmed!"}</h2>
        <p style={{ color: C.gray, marginBottom: 8 }}>{form.isFirst ? `Thank you, ${form.name}! We'll contact you to confirm your free estimate.` : `Thank you, ${form.name}! We'll see you on ${dateKey(form.date?.y, form.date?.m, form.date?.d)} at ${form.slot}.`}</p>
        {form.isFirst && <div style={{ background: C.navyDark + "15", border: `1px solid ${C.blueLight}`, borderRadius: 8, padding: 14, marginTop: 12, fontSize: 13, color: C.navy, lineHeight: 1.7 }}><strong>What's next?</strong> We'll assign a team member and contact you to confirm. They'll assess your home and provide a custom quote — free, no obligation.</div>}
        <p style={{ color: C.gray, fontSize: 13, marginTop: 12 }}>Confirmation email sent to {form.email}</p>
        <Btn variant="outline" onClick={() => { setDone(false); setStep(1); setForm({ name:"",phone:"",email:"",address:"",notes:"",homeSize:"",isFirst:true,recurringFreq:"none",extras:[],date:null,slot:null }); setAreaOk(null); }} style={{ marginTop: 20 }}>Schedule Another</Btn>
      </div>
    );
  }

  const steps = ["Your Info","Service","Schedule","Review"];

  return (
    <div style={S.card}>
      {/* Step indicator */}
      <div style={{ display: "flex", marginBottom: 28, gap: 4 }}>
        {steps.map((l, i) => (
          <div key={l} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold",
              background: i + 1 < step ? C.green : i + 1 === step ? C.navy : "#E5E7EB",
              color: i + 1 <= step ? "#fff" : C.gray }}>
              {i + 1 < step ? "✓" : i + 1}
            </div>
            <div style={{ fontSize: 10, color: i + 1 === step ? C.navy : C.gray, fontWeight: i + 1 === step ? "bold" : "normal" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Step 1: Info */}
      {step === 1 && (
        <div>
          <div style={S.title}>Your Information</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Field label="Full Name *"><input style={S.input} value={form.name} onChange={e => upd("name", e.target.value)} placeholder="Jane Smith" /></Field>
            <Field label="Phone *">
              <input style={S.input} value={form.phone}
                onChange={e => upd("phone", e.target.value.replace(/[^\d\s\-().]/g, ""))}
                onKeyDown={e => { if (!["Backspace","Delete","Tab","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End","Enter"].includes(e.key) && !/[\d\s\-().]/.test(e.key)) e.preventDefault(); }}
                placeholder="(240) 413-4313" type="tel" inputMode="numeric" maxLength={15} />
            </Field>
          </div>
          <Field label="Email *"><input style={S.input} value={form.email} onChange={e => upd("email", e.target.value)} type="email" placeholder="jane@email.com" /></Field>
          <Field label="Service Address *"><AddressInput value={form.address} onChange={v => upd("address", v)} onAreaCheck={setAreaOk} /></Field>
          <Field label="Special Instructions / Notes"><textarea style={{ ...S.input, height: 70, resize: "vertical" }} value={form.notes} onChange={e => upd("notes", e.target.value)} placeholder="Gate code, pets, allergies, etc." /></Field>
        </div>
      )}

      {/* Step 2: Service */}
      {step === 2 && (
        <div>
          <div style={S.title}>Service Details</div>
          <Field label="Home Size">
            <select style={S.select} value={form.homeSize} onChange={e => upd("homeSize", e.target.value)}>
              <option value="">— Select —</option>
              {HOME_SIZES.map(h => <option key={h.label} value={h.label}>{h.label} ({h.sqft})</option>)}
            </select>
          </Field>
          <Field label="Is this your first cleaning with us?">
            <div style={{ display: "flex", gap: 12 }}>
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => { upd("isFirst", v); upd("extras", []); }}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `2px solid ${form.isFirst === v ? C.blue : "#E5E7EB"}`, background: form.isFirst === v ? C.blue + "15" : "#fff", color: form.isFirst === v ? C.blue : C.gray, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
                  {v ? "Yes – First cleaning" : "No – Returning client"}
                </button>
              ))}
            </div>
          </Field>

          {form.isFirst && (
            <>
              <div style={{ background: `linear-gradient(135deg,${C.navyDark},${C.blue})`, borderRadius: 10, padding: 18, textAlign: "center", marginBottom: 16 }}>
                <div style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: 17, fontWeight: "bold", marginBottom: 4 }}>✨ Schedule Your Free Estimate!</div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13 }}>A team member will assess your home and provide a custom quote — completely free.</div>
              </div>
              <div style={{ background: C.green + "15", border: `1px solid ${C.green}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: "bold", color: C.green, marginBottom: 6, fontSize: 14 }}>✅ First Cleaning Includes Everything:</div>
                <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.8 }}>• Full deep clean of all rooms<br/>• Fridge (inside &amp; out)<br/>• Oven cleaning<br/>• Crew size &amp; rate quoted after estimate<br/>• $75/hr (2-person) or $130/hr (3-person)</div>
              </div>
              <Field label="Additional Services (optional)">
                <label style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: `1px solid ${form.extras.includes("silver") ? C.blue : "#E5E7EB"}`, borderRadius: 8, cursor: "pointer", background: form.extras.includes("silver") ? C.blue + "08" : "#fff" }}>
                  <input type="checkbox" checked={form.extras.includes("silver")} onChange={() => toggleExtra("silver")} />
                  <span style={{ flex: 1 }}>🥄 Silver cleaning</span>
                  <span style={{ color: C.blue, fontWeight: "bold", fontSize: 13 }}>Quote required</span>
                </label>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 6 }}>🚫 We do not offer laundry services.</div>
              </Field>
              <div style={{ background: C.navy, borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 13, color: C.blueLight, marginBottom: 4 }}>Fridge &amp; Oven included · Crew &amp; total quoted after estimate</div>
                <div style={{ fontSize: 26, fontWeight: "bold", color: C.green }}>Free Estimate</div>
                <div style={{ fontSize: 12, color: "#AAA", marginTop: 4 }}>We'll contact you with your custom quote before the appointment.</div>
              </div>
            </>
          )}

          {!form.isFirst && (
            <>
              <Field label="Recurring Frequency">
                <select style={S.select} value={form.recurringFreq} onChange={e => upd("recurringFreq", e.target.value)}>
                  <option value="none">One-time only</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </Field>
              <div style={{ background: "#FFF9F0", border: "1px solid #F39C12", borderRadius: 10, padding: 14, marginBottom: 16 }}>
                <div style={{ fontWeight: "bold", color: "#E67E22", marginBottom: 6, fontSize: 14 }}>ℹ️ Recurring Flat Rate Note:</div>
                <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.8 }}>• Standard cleaning included<br/>• Fridge (inside &amp; out): <strong>+$45</strong><br/>• Oven cleaning: <strong>+$45</strong><br/>• Silver cleaning: <strong>Quote required</strong><br/>• 🚫 No laundry services</div>
              </div>
              <Field label="Add-on Services (optional)">
                {EXTRAS_RECURRING.map(ex => (
                  <label key={ex.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", border: `1px solid ${form.extras.includes(ex.id) ? C.blue : "#E5E7EB"}`, borderRadius: 8, cursor: "pointer", background: form.extras.includes(ex.id) ? C.blue + "08" : "#fff", marginBottom: 8 }}>
                    <input type="checkbox" checked={form.extras.includes(ex.id)} onChange={() => toggleExtra(ex.id)} />
                    <span style={{ flex: 1 }}>{ex.label}</span>
                    <span style={{ color: C.blue, fontWeight: "bold", fontSize: 13 }}>{ex.quote ? "Quote required" : `+$${ex.price}`}</span>
                  </label>
                ))}
              </Field>
              {form.homeSize && form.recurringFreq !== "none" && (() => {
                const r = RECURRING_PRICES.find(x => x.label === form.homeSize);
                if (!r) return null;
                const base = r[form.recurringFreq] || 0;
                const extras = form.extras.reduce((s, id) => { const ex = EXTRAS_RECURRING.find(e => e.id === id); return ex?.price ? s + ex.price : s; }, 0);
                const hasQuote = form.extras.includes("silver");
                return (
                  <div style={{ background: C.navy, borderRadius: 10, padding: "16px 20px", textAlign: "center" }}>
                    <div style={{ fontSize: 13, color: C.blueLight, marginBottom: 4 }}>Recurring flat rate · {form.recurringFreq}</div>
                    <div style={{ fontSize: 28, fontWeight: "bold", color: C.green }}>{hasQuote ? `$${base + extras}+ (silver quoted)` : `$${base + extras}`}</div>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <div>
          <div style={S.title}>Pick a Date &amp; Time</div>
          <CalendarPicker bookings={bookings} selectedDate={form.date} selectedSlot={form.slot}
            onSelect={(date, slot) => { upd("date", date); if (slot) upd("slot", slot); }} />
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div>
          <div style={S.title}>{form.isFirst ? "Review Your Free Estimate Request" : "Review Your Booking"}</div>
          {form.isFirst && (
            <div style={{ background: `linear-gradient(135deg,${C.navyDark},${C.blue})`, borderRadius: 10, padding: "12px 18px", marginBottom: 16, textAlign: "center" }}>
              <div style={{ color: "#fff", fontWeight: "bold" }}>✨ Free Estimate Appointment</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>A team member will be assigned and contact you to confirm.</div>
            </div>
          )}
          <div style={{ display: "grid", gap: 8, marginBottom: 20 }}>
            {[["Name",form.name],["Phone",form.phone],["Email",form.email],["Address",form.address],["Home Size",form.homeSize],form.isFirst?null:["Service",`Recurring – ${form.recurringFreq}`],["Date",form.date ? dateKey(form.date.y,form.date.m,form.date.d) : ""],["Time",form.slot],form.extras.length?["Add-ons",form.extras.join(", ")]:null,form.notes?["Notes",form.notes]:null].filter(Boolean).map(([k,v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #F3F4F6", fontSize: 14 }}>
                <span style={{ color: C.gray }}>{k}</span>
                <span style={{ fontWeight: "bold", textAlign: "right", maxWidth: "60%" }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: C.navy, borderRadius: 10, padding: "14px 18px", textAlign: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 22, fontWeight: "bold", color: C.green }}>{form.isFirst ? "Free Estimate" : (() => { const r = RECURRING_PRICES.find(x => x.label === form.homeSize); return r && form.recurringFreq !== "none" ? `$${r[form.recurringFreq]}` : ""; })()}</div>
            {form.isFirst && <div style={{ fontSize: 12, color: "#AAA", marginTop: 4 }}>Crew size &amp; total quoted after our visit. Fridge &amp; oven included.</div>}
          </div>
          <div style={{ fontSize: 12, color: C.gray }}>By submitting you agree to our cancellation policy: 24h notice required for rescheduling.</div>
        </div>
      )}

      {/* Nav buttons */}
      <div style={{ marginTop: 24 }}>
        {step === 1 && areaOk === false && <div style={{ color: C.red, fontSize: 12, marginBottom: 8, textAlign: "right" }}>✱ Please enter a Maryland or D.C. address to continue.</div>}
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {step > 1 ? <Btn variant="outline" onClick={() => setStep(s => s - 1)}>← Back</Btn> : <div />}
          {step < 4 ? <Btn disabled={!canNext()} onClick={() => setStep(s => s + 1)}>Next →</Btn>
            : <Btn disabled={sending} onClick={submit}>{sending ? "Sending..." : form.isFirst ? "Schedule Free Estimate ✓" : "Confirm Booking ✓"}</Btn>}
        </div>
      </div>
    </div>
  );
}

// ── Pricing Page ─────────────────────────────────────────────────────────────
function PricingPage() {
  return (
    <div style={S.section}>
      <div style={S.card}>
        <div style={S.title}>First Cleaning — Free Estimate</div>
        <div style={{ background: C.green + "12", border: `1px solid ${C.green}`, borderRadius: 10, padding: 14, marginBottom: 16 }}>
          <div style={{ fontWeight: "bold", color: C.green, marginBottom: 6 }}>✅ First Cleaning Includes Everything:</div>
          <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.8 }}>• Full deep clean · Fridge (inside &amp; out) · Oven cleaning · Crew size quoted after estimate<br/>• $75/hr (2-person crew) or $130/hr (3-person crew)</div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead><tr style={{ background: C.navy, color: "#fff" }}>
              <th style={{ padding: "11px 14px", textAlign: "left" }}>Home Size</th>
              <th style={{ padding: "11px 14px", textAlign: "center" }}>Sq Ft</th>
              <th style={{ padding: "11px 14px", textAlign: "center" }}>2-Person ($75/hr)</th>
              <th style={{ padding: "11px 14px", textAlign: "center" }}>3-Person ($130/hr)</th>
            </tr></thead>
            <tbody>
              {HOME_SIZES.map((h, i) => (
                <tr key={h.label} style={{ background: i % 2 === 0 ? "#fff" : C.light }}>
                  <td style={{ padding: "10px 14px", fontWeight: "bold" }}>{h.label}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center", color: C.gray }}>{h.sqft}</td>
                  <td style={{ padding: "10px 14px", textAlign: "center", color: C.blue, fontWeight: "bold" }}>~${Math.round(h.crew2h * 75)}*</td>
                  <td style={{ padding: "10px 14px", textAlign: "center", color: C.blue, fontWeight: "bold" }}>~${Math.round(h.crew3h * 130)}*</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: C.gray, marginTop: 8 }}>* Estimates only — exact total quoted after free in-home assessment.</div>
      </div>

      <div style={S.card}>
        <div style={S.title}>Recurring Cleaning — Flat Rates</div>
        <div style={{ background: C.navyDark, borderRadius: 12, padding: "28px 24px", textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📞</div>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 20, fontWeight: "bold", marginBottom: 10, color: C.gold }}>Custom Flat Rate</div>
          <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, lineHeight: 1.8, maxWidth: 480, margin: "0 auto 20px" }}>
            After your first cleaning, we'll determine a personalized flat rate based on your home size and preferred cleaning frequency. Rates are tailored to you — no one-size-fits-all pricing.
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: 16 }}>
            {["Weekly","Bi-Weekly","Monthly"].map(f => (
              <span key={f} style={{ background: "rgba(255,255,255,0.12)", color: "#fff", borderRadius: 20, padding: "6px 18px", fontSize: 13, fontWeight: "bold" }}>{f}</span>
            ))}
          </div>
          <div style={{ color: C.blueLight, fontSize: 13 }}>📱 (240) 413-4313 &nbsp;·&nbsp; 📱 (301) 768-1371</div>
        </div>
        <div style={{ background: "#FFF9F0", border: "1px solid #F39C12", borderRadius: 10, padding: 14, marginTop: 14 }}>
          <div style={{ fontWeight: "bold", color: "#E67E22", marginBottom: 6, fontSize: 14 }}>ℹ️ Recurring Rate Does Not Include:</div>
          <div style={{ fontSize: 13, color: C.navy, lineHeight: 1.8 }}>• Fridge (inside &amp; out) — <strong>+$45</strong> · Oven cleaning — <strong>+$45</strong> · Silver cleaning — <strong>Quote required</strong> · 🚫 No laundry</div>
        </div>
      </div>

      <div style={S.card}>
        <div style={S.title}>Add-On Services (Recurring Clients)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
          {[{icon:"🧊",name:"Fridge (inside & out)",price:"$45",note:"Included in first cleaning"},{icon:"🔥",name:"Oven cleaning",price:"$45",note:"Included in first cleaning"},{icon:"🥄",name:"Silver cleaning",price:"Call for Quote",note:"All clients"},{icon:"🚫",name:"Laundry",price:"Not Available",red:true}].map(a => (
            <div key={a.name} style={{ border: "1px solid #E5E7EB", borderRadius: 10, padding: 16, textAlign: "center", background: a.red ? "#FFF9F9" : "#fff" }}>
              <div style={{ fontSize: 26, marginBottom: 6 }}>{a.icon}</div>
              <div style={{ fontWeight: "bold", fontSize: 13, marginBottom: 4, color: a.red ? C.gray : C.navy }}>{a.name}</div>
              <div style={{ color: a.red ? C.red : C.blue, fontWeight: "bold" }}>{a.price}</div>
              {a.note && <div style={{ fontSize: 11, color: C.gray, marginTop: 4 }}>{a.note}</div>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...S.card, background: C.navy, color: "#fff" }}>
        <div style={{ fontFamily: "Georgia,serif", fontSize: 17, color: C.greenLight, marginBottom: 8 }}>📞 Get Your Free Estimate</div>
        <p style={{ color: "#DDD", fontSize: 13, marginBottom: 14 }}>First cleaning totals and silver cleaning are always quoted. Call us for a personalized quote at no charge.</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", color: C.blueLight }}>
          <span>📱 (240) 413-4313</span><span>📱 (301) 768-1371</span><span>✉️ crissmaidcleaning@gmail.com</span>
        </div>
      </div>
    </div>
  );
}

// ── About Page ────────────────────────────────────────────────────────────────
function AboutPage({ onBook }) {
  return (
    <div>
      <div style={{ background: `linear-gradient(135deg,${C.navyDark},${C.navy})`, padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 10 }}>👩‍👦</div>
        <h1 style={{ fontFamily: "Georgia,serif", color: "#fff", fontSize: 26, marginBottom: 8 }}>About Criss Maid Cleaning</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 15, maxWidth: 480, margin: "0 auto 16px" }}>A family business built on trust, dedication, and over 30 years of experience.</p>
        <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
          <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 20, padding: "5px 14px", fontSize: 13 }}>📍 Maryland</span>
          <span style={{ background: "rgba(255,255,255,0.15)", color: "#fff", borderRadius: 20, padding: "5px 14px", fontSize: 13 }}>📍 Washington D.C.</span>
        </div>
      </div>

      <div style={S.section}>
        <div style={S.card}>
          <div style={S.title}>Our Story</div>
          <div style={{ fontSize: 14, color: "#444", lineHeight: 1.9 }}>
            <p style={{ marginBottom: 12 }}>Criss Maid Cleaning was born from a simple belief: every home deserves to be treated with care, attention, and respect.</p>
            <p style={{ marginBottom: 12 }}>At the heart of our business is <strong>Cristela</strong>, a mother with over <strong>30 years of professional cleaning experience</strong>. For three decades, she has transformed homes — bringing comfort and pride back to the spaces families live in.</p>
            <p>Joining her is her son <strong>Alexi</strong>, who handles the business and scheduling so Cristela can focus on what she does best. Together, they built Criss Maid Cleaning to offer the warmth of a family business with the professionalism of an expert service — proudly serving <strong>Maryland and Washington D.C.</strong></p>
          </div>
        </div>

        <div style={S.card}>
          <div style={S.title}>Meet the Team</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 20 }}>
            {[
              { img: "/cristela.jpg", name: "Cristela", role: "Founder & Lead Cleaner", roleColor: C.blue, bio: "With over 30 years of professional experience, Cristela is the heart and soul of Criss Maid Cleaning. Her attention to detail, reliability, and genuine care for every home she enters is what sets us apart.", badge: "30+ Years Experience", badgeColor: C.blue },
              { img: "/alexi.jpg", name: "Alexi", role: "Co-Founder & Operations", roleColor: C.green, bio: "Handling scheduling, customer relations, and operations, Alexi ensures every client gets a seamless experience from first booking to final walkthrough. Family-run means you're always talking to someone who cares.", badge: "Family Owned", badgeColor: C.green },
            ].map(p => (
              <div key={p.name} style={{ textAlign: "center", padding: "20px 16px", borderRadius: 12, background: C.light }}>
                <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", margin: "0 auto 14px", border: `4px solid #fff`, boxShadow: "0 4px 16px rgba(0,0,0,0.1)" }}>
                  <img src={p.img} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                </div>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 20, color: C.navy, marginBottom: 4 }}>{p.name}</div>
                <div style={{ color: p.roleColor, fontSize: 12, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>{p.role}</div>
                <div style={{ color: C.gray, fontSize: 13, lineHeight: 1.7, marginBottom: 12 }}>{p.bio}</div>
                <span style={{ background: p.badgeColor + "15", color: p.badgeColor, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: "bold" }}>{p.badge}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.title}>Why Choose Us?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14 }}>
            {[["🏆","30+ Years","Cristela has been perfecting her craft for over three decades."],["👨‍👩‍👦","Family Owned","You're hiring real people who take pride in every home they clean."],["✅","First Clean Guarantee","Your first cleaning includes everything — fridge, oven, full deep clean."],["💬","Always Reachable","Call or text us directly. No call centers, no bots."],["🔒","Reliable","We show up when we say we will. Your schedule matters to us."],["✨","Attention to Detail","No corner is overlooked. We clean the way we'd want our own home cleaned."]].map(([icon,title,desc]) => (
              <div key={title} style={{ padding: "16px 14px", border: "1px solid #E5E7EB", borderRadius: 10 }}>
                <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
                <div style={{ fontWeight: "bold", fontSize: 13, color: C.navy, marginBottom: 4 }}>{title}</div>
                <div style={{ color: C.gray, fontSize: 12, lineHeight: 1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={S.card}>
          <div style={S.title}>📍 Areas We Serve</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 14, marginBottom: 14 }}>
            <div style={{ background: C.navyDark, borderRadius: 12, padding: "22px 18px", textAlign: "center", color: "#fff" }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>🏛️</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: "bold", marginBottom: 4 }}>Washington D.C.</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>The nation's capital and surrounding areas</div>
            </div>
            <div style={{ background: C.blue, borderRadius: 12, padding: "22px 18px", textAlign: "center", color: "#fff" }}>
              <div style={{ fontSize: 30, marginBottom: 6 }}>🌿</div>
              <div style={{ fontFamily: "Georgia,serif", fontSize: 17, fontWeight: "bold", marginBottom: 4 }}>Maryland</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Residential homes throughout the state</div>
            </div>
          </div>
          <div style={{ background: C.light, borderRadius: 8, padding: "10px 14px", fontSize: 13, color: C.gray }}>
            📞 Not sure if we serve your area? Call <strong>(240) 413-4313</strong> or <strong>(301) 768-1371</strong>
          </div>
        </div>

        <div style={{ ...S.card, background: C.navy, color: "#fff" }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 16, marginBottom: 8, color: C.gold }}>💛 Our Values</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 14, textAlign: "center" }}>
            {[["Integrity","We do what we say."],["Respect","Your home is sacred to us."],["Excellence","Good enough is never enough."],["Family","We treat clients like neighbors."]].map(([v,d]) => (
              <div key={v}><div style={{ fontWeight: "bold", color: C.gold, marginBottom: 4 }}>{v}</div><div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{d}</div></div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
          <div style={{ fontFamily: "Georgia,serif", fontSize: 20, color: C.navy, marginBottom: 10 }}>Ready to experience the Criss Maid difference?</div>
          <div style={{ color: C.gray, fontSize: 14, marginBottom: 20 }}>Your first cleaning includes everything. Schedule your free estimate today.</div>
          <Btn variant="green" onClick={onBook} style={{ padding: "14px 36px", fontSize: 15 }}>Schedule Your Free Estimate →</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Employee Schedule View ────────────────────────────────────────────────────
function EmployeeSchedule({ bookings, employee, onLogout }) {
  const t = todayObj();
  const [yr, setYr] = useState(t.y);
  const [mo, setMo] = useState(t.m);
  const [sel, setSel] = useState(null);
  const todayKey = dateKey(t.y, t.m, t.d);
  const todayJobs = bookings.filter(b => b.date === todayKey);
  const monthJobs = bookings.filter(b => { const [y,m] = b.date.split("-"); return Number(y) === yr && Number(m)-1 === mo; }).sort((a,b) => a.date.localeCompare(b.date)||a.slot.localeCompare(b.slot));

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div><h2 style={{ margin: 0, fontFamily: "Georgia,serif", color: C.navy }}>👋 Hello, {employee.name}</h2><div style={{ color: C.gray, fontSize: 13 }}>Employee Schedule Portal</div></div>
        <Btn variant="outline" onClick={onLogout}>Log Out</Btn>
      </div>

      <div style={S.card}>
        <div style={S.title}>Today's Jobs</div>
        {todayJobs.length === 0 ? <div style={{ color: C.gray, fontStyle: "italic" }}>No jobs scheduled today.</div>
          : todayJobs.map(b => (
            <div key={b.id} onClick={() => setSel(b)} style={{ borderLeft: `4px solid ${b.isFirst ? C.green : C.blue}`, paddingLeft: 14, marginBottom: 14, cursor: "pointer" }}>
              <div style={{ fontWeight: "bold" }}>{b.slot} — {b.name} {b.isFirst && <span style={{ background: C.green + "20", color: C.green, fontSize: 11, borderRadius: 10, padding: "2px 8px" }}>Free Estimate</span>}</div>
              <div style={{ color: C.gray, fontSize: 13 }}>{b.address} · {b.homeSize}</div>
              {b.notes && <div style={{ color: C.blue, fontSize: 12, marginTop: 2 }}>📝 {b.notes}</div>}
            </div>
          ))}
      </div>

      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={S.title}>{MONTHS[mo]} {yr}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn variant="outline" onClick={() => { if (mo===0){setYr(y=>y-1);setMo(11);}else setMo(m=>m-1); }} style={{ padding: "4px 12px" }}>‹</Btn>
            <Btn variant="outline" onClick={() => { if (mo===11){setYr(y=>y+1);setMo(0);}else setMo(m=>m+1); }} style={{ padding: "4px 12px" }}>›</Btn>
          </div>
        </div>
        {monthJobs.length === 0 ? <div style={{ color: C.gray, fontStyle: "italic" }}>No bookings this month yet.</div>
          : monthJobs.map(b => {
            const [,, dd] = b.date.split("-");
            const dow = new Date(b.date).toLocaleDateString("en-US",{weekday:"short"});
            return (
              <div key={b.id} onClick={() => setSel(b)} style={{ display: "flex", gap: 14, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
                <div style={{ minWidth: 44, textAlign: "center", background: C.navy, color: "#fff", borderRadius: 8, padding: "5px 0" }}>
                  <div style={{ fontSize: 9, color: C.blueLight }}>{dow}</div>
                  <div style={{ fontWeight: "bold", fontSize: 16 }}>{Number(dd)}</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: 14 }}>{b.slot} · {b.name}</div>
                  <div style={{ color: C.gray, fontSize: 12 }}>{b.address} · {b.homeSize}</div>
                </div>
              </div>
            );
          })}
      </div>

      {sel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setSel(null)}>
          <div style={{ background: "#fff", borderRadius: 14, padding: 28, maxWidth: 420, width: "90%", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
              <h3 style={{ fontFamily: "Georgia,serif", margin: 0 }}>{sel.isFirst ? "✨ Free Estimate" : "📋 Booking"}</h3>
              <button onClick={() => setSel(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: C.gray }}>✕</button>
            </div>
            {[["Client",sel.name],["Phone",sel.phone],["Date & Time",`${sel.date} @ ${sel.slot}`],["Address",sel.address],["Home Size",sel.homeSize],sel.notes&&["Notes",sel.notes]].filter(Boolean).map(([k,v]) => (
              <div key={k} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid #F3F4F6", fontSize: 14 }}>
                <span style={{ color: C.gray, minWidth: 80 }}>{k}</span><span style={{ fontWeight: "bold" }}>{v}</span>
              </div>
            ))}
            <Btn onClick={() => setSel(null)} style={{ marginTop: 18, width: "100%" }}>Close</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Calendar ────────────────────────────────────────────────────────────
function AdminCalendar({ bookings, employees, onAssign, onAdminBook }) {
  const t = todayObj();
  const [yr, setYr] = useState(t.y);
  const [mo, setMo] = useState(t.m);
  const [selDay, setSelDay] = useState(null);
  const [selB, setSelB] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addSlot, setAddSlot] = useState("");
  const [addF, setAddF] = useState({ name:"",phone:"",email:"",address:"",homeSize:"",notes:"",isFirst:true,recurringFreq:"none" });

  const dim = getDaysInMonth(yr, mo);
  const fd = getFirstDay(yr, mo);
  const todayMs = new Date(t.y,t.m,t.d).getTime();

  function dayBks(d) { const dk=dateKey(yr,mo,d); return bookings.filter(b=>b.date===dk).sort((a,b)=>a.slot.localeCompare(b.slot)); }

  function saveAdminBook() {
    if (!addF.name||!addSlot) return;
    const b = { id:"adm_"+Date.now(), date:dateKey(yr,mo,selDay), slot:addSlot, ...addF, extras:[], status:"confirmed", adminScheduled:true };
    onAdminBook(b);
    setShowAdd(false);
    setAddSlot(""); setAddF({name:"",phone:"",email:"",address:"",homeSize:"",notes:"",isFirst:true,recurringFreq:"none"});
  }

  const selDayBks = selDay ? dayBks(selDay) : [];
  const selDow = selDay ? new Date(yr,mo,selDay).getDay() : null;
  const isWknd = selDow===0||selDow===6;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Btn variant="outline" onClick={() => {if(mo===0){setYr(y=>y-1);setMo(11);}else setMo(m=>m-1);}} style={{padding:"5px 14px"}}>‹</Btn>
        <strong style={{fontFamily:"Georgia,serif",fontSize:17}}>{MONTHS[mo]} {yr}</strong>
        <Btn variant="outline" onClick={() => {if(mo===11){setYr(y=>y+1);setMo(0);}else setMo(m=>m+1);}} style={{padding:"5px 14px"}}>›</Btn>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:C.gray,fontWeight:"bold",padding:"3px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:20}}>
        {Array(fd).fill(null).map((_,i)=><div key={`_${i}`}/>)}
        {Array(dim).fill(null).map((_,i)=>{
          const d=i+1;
          const dow=new Date(yr,mo,d).getDay();
          const wknd=dow===0||dow===6;
          const past=new Date(yr,mo,d).getTime()<todayMs;
          const isToday=yr===t.y&&mo===t.m&&d===t.d;
          const isSel=selDay===d;
          const bks=dayBks(d);
          const ests=bks.filter(b=>b.isFirst).length;
          const regs=bks.filter(b=>!b.isFirst).length;
          return (
            <div key={d} onClick={()=>setSelDay(isSel?null:d)}
              style={{borderRadius:7,padding:"6px 3px",textAlign:"center",cursor:"pointer",fontSize:12,minHeight:46,
                background:isSel?C.navy:isToday?C.navyDark:wknd?"#FFF8F0":"#fff",
                color:isSel||isToday?"#fff":past?"#CCC":C.navy,
                border:`2px solid ${isSel?C.navy:wknd?"#F39C12":"transparent"}`}}>
              <div style={{fontWeight:isToday?"bold":"normal"}}>{d}</div>
              {wknd&&!isSel&&<div style={{fontSize:7,color:"#E67E22"}}>Wknd</div>}
              <div style={{display:"flex",justifyContent:"center",gap:2,marginTop:2,flexWrap:"wrap"}}>
                {Array(ests).fill(null).map((_,i)=><div key={`e${i}`} style={{width:5,height:5,borderRadius:"50%",background:isSel?C.greenLight:C.green}}/>)}
                {Array(regs).fill(null).map((_,i)=><div key={`r${i}`} style={{width:5,height:5,borderRadius:"50%",background:isSel?"#AAD":C.blue}}/>)}
              </div>
            </div>
          );
        })}
      </div>

      {selDay && (
        <div style={{background:C.light,borderRadius:10,padding:16,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontWeight:"bold",color:C.navy}}>
              {MONTHS[mo]} {selDay} — {selDayBks.length} booking(s)
              {isWknd&&<span style={{marginLeft:8,background:"#F39C12",color:"#fff",borderRadius:10,padding:"2px 8px",fontSize:11}}>Weekend</span>}
            </div>
            <Btn onClick={()=>setShowAdd(true)} style={{padding:"7px 14px",fontSize:12}}>+ Schedule</Btn>
          </div>

          {selDayBks.length===0&&!showAdd&&<div style={{color:C.gray,fontStyle:"italic",fontSize:13}}>No appointments. Click "+ Schedule" to add one.</div>}

          {selDayBks.map(b=>{
            const emp=employees.find(e=>e.id===b.assignedTo);
            return (
              <div key={b.id} onClick={()=>setSelB(b)} style={{background:"#fff",borderRadius:8,padding:"11px 14px",marginBottom:8,cursor:"pointer",borderLeft:`4px solid ${b.isFirst?C.green:C.blue}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                  <div>
                    <div style={{fontWeight:"bold",fontSize:14}}>{b.slot} · {b.name} {b.adminScheduled&&<span style={{fontSize:11,color:C.gray}}>· Admin</span>}</div>
                    <div style={{color:C.gray,fontSize:12}}>{b.address}</div>
                    {emp&&<div style={{color:C.green,fontSize:11,marginTop:2}}>👤 {emp.name}</div>}
                  </div>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    {b.isFirst&&<span style={{background:C.green+"20",color:C.green,border:`1px solid ${C.green}`,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:"bold"}}>Free Estimate</span>}
                  </div>
                </div>
              </div>
            );
          })}

          {showAdd&&(
            <div style={{background:"#fff",borderRadius:10,padding:18,marginTop:10,border:`2px solid ${C.blue}`}}>
              <div style={{fontWeight:"bold",color:C.navy,marginBottom:14,fontSize:14}}>
                📅 Schedule for {MONTHS[mo]} {selDay}
                {isWknd&&<span style={{marginLeft:8,color:"#E67E22",fontSize:12}}>⚠️ Weekend — Admin only</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                <div><label style={S.label}>Client Name *</label><input style={S.input} value={addF.name} onChange={e=>setAddF(f=>({...f,name:e.target.value}))} placeholder="Jane Smith"/></div>
                <div><label style={S.label}>Phone</label><input style={S.input} value={addF.phone} onChange={e=>setAddF(f=>({...f,phone:e.target.value.replace(/[^\d\s\-().]/g,"")}))} type="tel" placeholder="(240) 000-0000"/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                <div><label style={S.label}>Email</label><input style={S.input} value={addF.email} onChange={e=>setAddF(f=>({...f,email:e.target.value}))} placeholder="jane@email.com"/></div>
                <div><label style={S.label}>Time Slot *</label>
                  <select style={S.select} value={addSlot} onChange={e=>setAddSlot(e.target.value)}>
                    <option value="">— Select —</option>{TIME_SLOTS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{marginBottom:10}}><label style={S.label}>Address</label><input style={S.input} value={addF.address} onChange={e=>setAddF(f=>({...f,address:e.target.value}))} placeholder="123 Main St"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                <div><label style={S.label}>Home Size</label>
                  <select style={S.select} value={addF.homeSize} onChange={e=>setAddF(f=>({...f,homeSize:e.target.value}))}>
                    <option value="">— Select —</option>{HOME_SIZES.map(h=><option key={h.label} value={h.label}>{h.label}</option>)}
                  </select>
                </div>
                <div><label style={S.label}>Service Type</label>
                  <select style={S.select} value={addF.isFirst?"first":"recurring"} onChange={e=>setAddF(f=>({...f,isFirst:e.target.value==="first"}))}>
                    <option value="first">Free Estimate / First Cleaning</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
              </div>
              <div style={{marginBottom:14}}><label style={S.label}>Notes</label><textarea style={{...S.input,height:60,resize:"vertical"}} value={addF.notes} onChange={e=>setAddF(f=>({...f,notes:e.target.value}))} placeholder="Special instructions..."/></div>
              <div style={{display:"flex",gap:10}}>
                <Btn disabled={!addF.name||!addSlot} onClick={saveAdminBook} style={{flex:1}}>Save Appointment</Btn>
                <Btn variant="outline" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {selB&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={()=>setSelB(null)}>
          <div style={{background:"#fff",borderRadius:14,padding:26,maxWidth:440,width:"92%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <h3 style={{fontFamily:"Georgia,serif",margin:0,color:C.navy}}>{selB.isFirst?"✨ Free Estimate":"📋 Booking"} Details</h3>
              <button onClick={()=>setSelB(null)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.gray}}>✕</button>
            </div>
            {[["Client",selB.name],["Phone",selB.phone],["Email",selB.email],["Date & Time",`${selB.date} @ ${selB.slot}`],["Address",selB.address],["Home Size",selB.homeSize],["Service",selB.isFirst?"Free Estimate":selB.recurringFreq],selB.notes&&["Notes",selB.notes]].filter(Boolean).map(([k,v])=>(
              <div key={k} style={{display:"flex",gap:12,padding:"6px 0",borderBottom:"1px solid #F3F4F6",fontSize:13}}>
                <span style={{color:C.gray,minWidth:80}}>{k}</span><span style={{fontWeight:"bold",flex:1}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:16,marginBottom:14}}>
              <label style={S.label}>Assign to Employee</label>
              <select style={S.select} value={selB.assignedTo||""} onChange={e=>{const id=e.target.value?Number(e.target.value):null;onAssign(selB.id,id);setSelB(p=>({...p,assignedTo:id}));}}>
                <option value="">— Unassigned —</option>
                {employees.map(emp=><option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={()=>setSelB(null)} style={{flex:1}}>Close</Btn>
              <button onClick={()=>{if(window.confirm(`Remove booking for ${selB.name}?`)){onAssign(selB.id,"DELETE");setSelB(null);}}} style={{background:"transparent",color:C.red,border:`1px solid ${C.red}`,borderRadius:8,padding:"12px 14px",cursor:"pointer",fontSize:14}}>🗑</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Dashboard ────────────────────────────────────────────────────────────
function AdminDashboard({ onLogout, bookings, onAssign, onAdminBook }) {
  const [employees, setEmployees] = useState(loadEmployees);
  const [tab, setTab] = useState("estimates");
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const COLORS_LIST = [C.blue,C.green,"#4A90D9","#E67E22","#9B59B6","#E74C3C","#1ABC9C","#F39C12"];
  const estimates = bookings.filter(b=>b.isFirst);

  function addEmp() {
    if (!newName.trim()) { setErr("Enter a name."); return; }
    if (newPin.length!==6||!/^\d+$/.test(newPin)) { setErr("PIN must be 6 digits."); return; }
    if (employees.find(e=>e.pin===newPin)) { setErr("PIN already in use."); return; }
    const upd = [...employees,{id:Date.now(),name:newName.trim(),pin:newPin,color:COLORS_LIST[employees.length%COLORS_LIST.length]}];
    setEmployees(upd); saveEmployees(upd);
    setNewName(""); setNewPin(""); setErr(""); setOk(`✅ ${newName.trim()} added!`);
    setTimeout(()=>setOk(""),3000);
  }
  function removeEmp(id) {
    if (!window.confirm("Remove this employee?")) return;
    const upd=employees.filter(e=>e.id!==id); setEmployees(upd); saveEmployees(upd);
  }
  function changePin(id) {
    const p=window.prompt("New 6-digit PIN:");
    if (!p) return;
    if (p.length!==6||!/^\d+$/.test(p)) { alert("Must be 6 digits."); return; }
    if (employees.find(e=>e.pin===p&&e.id!==id)) { alert("PIN already in use."); return; }
    const upd=employees.map(e=>e.id===id?{...e,pin:p}:e); setEmployees(upd); saveEmployees(upd);
    setOk("✅ PIN updated!"); setTimeout(()=>setOk(""),3000);
  }

  const tabStyle = (active) => ({
    flex:1,textAlign:"center",padding:"10px 0",cursor:"pointer",background:"none",fontFamily:"inherit",fontSize:13,
    border:"none",borderBottom:`3px solid ${active?C.blue:"transparent"}`,color:active?C.blue:C.gray,fontWeight:active?"bold":"normal",
  });

  return (
    <div style={{maxWidth:760,margin:"0 auto",padding:"24px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{margin:0,fontFamily:"Georgia,serif",color:C.navy}}>🔐 Admin Dashboard</h2><div style={{color:C.gray,fontSize:13}}>Criss Maid Cleaning</div></div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{if(window.confirm("Clear ALL bookings? Cannot be undone.")){safeRemove("cmc_bookings");window.location.reload();}}} style={{background:"transparent",color:C.gray,border:"1px solid #E5E7EB",borderRadius:8,padding:"7px 12px",fontSize:12,cursor:"pointer"}}>🗑 Clear All</button>
          <Btn variant="outline" onClick={onLogout} style={{color:C.red,borderColor:C.red}}>Log Out</Btn>
        </div>
      </div>

      <div style={{display:"flex",background:"#fff",borderRadius:10,marginBottom:20,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
        <button style={tabStyle(tab==="estimates")} onClick={()=>setTab("estimates")}>✨ Free Estimates {estimates.length>0&&<span style={{background:C.blue,color:"#fff",borderRadius:10,padding:"1px 7px",fontSize:11,marginLeft:4}}>{estimates.length}</span>}</button>
        <button style={tabStyle(tab==="calendar")} onClick={()=>setTab("calendar")}>📅 Calendar</button>
        <button style={tabStyle(tab==="employees")} onClick={()=>setTab("employees")}>👥 Employees</button>
      </div>

      {tab==="estimates"&&(
        <div style={S.card}>
          <div style={S.title}>Free Estimate Requests</div>
          {estimates.length===0?<div style={{color:C.gray,fontStyle:"italic"}}>No free estimate requests yet.</div>
            :estimates.map(b=>{
              const emp=employees.find(e=>e.id===b.assignedTo);
              return (
                <div key={b.id} style={{padding:"14px 0",borderBottom:"1px solid #F3F4F6"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span style={{fontWeight:"bold",fontSize:15}}>{b.name}</span>
                        {emp?<span style={{background:C.green+"20",color:C.green,border:`1px solid ${C.green}`,borderRadius:20,padding:"2px 10px",fontSize:11}}>👤 {emp.name}</span>:<span style={{background:C.red+"15",color:C.red,border:`1px solid ${C.red}`,borderRadius:20,padding:"2px 10px",fontSize:11}}>Unassigned</span>}
                      </div>
                      <div style={{color:C.gray,fontSize:12,lineHeight:1.7}}>📅 {b.date} @ {b.slot}<br/>📍 {b.address}<br/>🏠 {b.homeSize}<br/>📱 {b.phone} · ✉️ {b.email}{b.notes&&<><br/>📝 {b.notes}</>}</div>
                    </div>
                    <div style={{minWidth:160}}>
                      <label style={S.label}>Assign to:</label>
                      <select style={{...S.select,fontSize:12}} value={b.assignedTo||""} onChange={e=>onAssign(b.id,e.target.value?Number(e.target.value):null)}>
                        <option value="">— Unassigned —</option>
                        {employees.map(emp=><option key={emp.id} value={emp.id}>{emp.name}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {tab==="calendar"&&(
        <div style={S.card}>
          <div style={S.title}>📅 Full Schedule & Availability</div>
          <div style={{color:C.gray,fontSize:13,marginBottom:16}}>All 7 days visible. Orange border = weekend (admin-only booking). Click any day to view or add appointments.</div>
          <AdminCalendar bookings={bookings} employees={employees} onAssign={onAssign} onAdminBook={onAdminBook}/>
          <div style={{marginTop:16,display:"flex",gap:16,flexWrap:"wrap",fontSize:12}}>
            <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:C.green,display:"inline-block"}}/>Free Estimate</span>
            <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:C.blue,display:"inline-block"}}/>Regular Booking</span>
            <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:C.navy,display:"inline-block"}}/>Today</span>
          </div>
        </div>
      )}

      {tab==="employees"&&(
        <div>
          <div style={S.card}>
            <div style={S.title}>Add New Employee</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:12}}>
              <div><label style={S.label}>Full Name</label><input style={S.input} value={newName} onChange={e=>{setNewName(e.target.value);setErr("");}} placeholder="e.g. Sofia R."/></div>
              <div><label style={S.label}>6-Digit PIN</label><input style={S.input} value={newPin} onChange={e=>{setNewPin(e.target.value.replace(/\D/g,""));setErr("");}} placeholder="e.g. 445566" maxLength={6} type="password"/></div>
            </div>
            {err&&<div style={{color:C.red,fontSize:12,marginBottom:10}}>{err}</div>}
            {ok&&<div style={{color:C.green,fontSize:12,marginBottom:10}}>{ok}</div>}
            <Btn onClick={addEmp}>+ Add Employee</Btn>
          </div>
          <div style={S.card}>
            <div style={S.title}>Current Employees ({employees.length})</div>
            {employees.length===0&&<div style={{color:C.gray,fontStyle:"italic"}}>No employees added yet.</div>}
            {employees.map(emp=>(
              <div key={emp.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid #F3F4F6"}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:emp.color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:"bold",fontSize:16,flexShrink:0}}>{emp.name.charAt(0)}</div>
                <div style={{flex:1}}>
                  <div style={{fontWeight:"bold"}}>{emp.name}</div>
                  <div style={{color:C.gray,fontSize:12}}>PIN: •••••• · {estimates.filter(b=>b.assignedTo===emp.id).length} estimate(s) assigned</div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <Btn variant="outline" onClick={()=>changePin(emp.id)} style={{padding:"6px 12px",fontSize:12}}>Change PIN</Btn>
                  <button onClick={()=>removeEmp(emp.id)} style={{background:"transparent",color:C.red,border:`1px solid ${C.red}`,borderRadius:8,padding:"6px 12px",fontSize:12,cursor:"pointer"}}>Remove</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{...S.card,background:C.light}}>
            <div style={{fontWeight:"bold",marginBottom:6,color:C.navy}}>📋 How it works</div>
            <div style={{fontSize:13,color:C.gray,lineHeight:1.8}}>• Add employees with a unique 6-digit PIN<br/>• They log in from the Employee page using their PIN<br/>• Assign free estimates from the Estimates tab or Calendar<br/>• Employees can only see the schedule — no admin access</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Employee Login ────────────────────────────────────────────────────────────
function EmployeeLogin({ onLogin, onAdminLogin }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminErr, setAdminErr] = useState("");
  const keys = ["1","2","3","4","5","6","7","8","9","C","0","⌫"];

  function pressKey(k) { if(pin.length<6) setPin(p=>p+k); }
  function back() { setPin(p=>p.slice(0,-1)); setErr(""); }
  function clr() { setPin(""); setErr(""); }
  function tryLogin() {
    const emps=loadEmployees();
    const emp=emps.find(e=>e.pin===pin);
    if (emp) { safeSet("cmc_employee",JSON.stringify(emp)); onLogin(emp); }
    else { setErr("Incorrect PIN."); setShake(true); setTimeout(()=>{setShake(false);setPin("");setErr("");},1200); }
  }
  function tryAdmin() {
    if (adminPass===ADMIN_PASSWORD) { safeSet("cmc_admin","true"); onAdminLogin(); }
    else { setAdminErr("Incorrect password."); setAdminPass(""); }
  }

  if (adminMode) return (
    <div style={{maxWidth:360,margin:"60px auto",padding:"0 20px"}}>
      <div style={{...S.card,textAlign:"center"}}>
        <div style={{background:`linear-gradient(135deg,${C.navyDark},${C.navy})`,borderRadius:10,padding:"18px 0",marginBottom:20}}>
          <div style={{fontSize:32,marginBottom:6}}>🔐</div>
          <div style={{color:"#fff",fontFamily:"Georgia,serif",fontSize:17,fontWeight:"bold"}}>Admin Access</div>
        </div>
        <Field label="Admin Password"><input type="password" value={adminPass} onChange={e=>{setAdminPass(e.target.value);setAdminErr("");}} onKeyDown={e=>e.key==="Enter"&&tryAdmin()} placeholder="Enter admin password" style={{...S.input,textAlign:"center",letterSpacing:4}}/></Field>
        {adminErr&&<div style={{color:C.red,fontSize:12,marginBottom:10}}>{adminErr}</div>}
        <Btn onClick={tryAdmin} style={{width:"100%",marginBottom:10}}>Access Admin →</Btn>
        <Btn variant="outline" onClick={()=>{setAdminMode(false);setAdminPass("");setAdminErr("");}} style={{width:"100%"}}>← Back</Btn>
      </div>
    </div>
  );

  return (
    <div style={{maxWidth:340,margin:"60px auto",padding:"0 20px"}}>
      <div style={{...S.card,textAlign:"center"}}>
        <div style={{background:`linear-gradient(135deg,${C.navyDark},${C.navy})`,borderRadius:10,padding:"18px 0",marginBottom:20}}>
          <div style={{fontSize:32,marginBottom:6}}>🧹</div>
          <div style={{color:"#fff",fontFamily:"Georgia,serif",fontSize:17,fontWeight:"bold"}}>Employee Portal</div>
          <div style={{color:C.blueLight,fontSize:11,letterSpacing:2,textTransform:"uppercase",marginTop:4}}>Criss Maid Cleaning</div>
        </div>
        <div style={{fontSize:12,color:C.gray,letterSpacing:1,textTransform:"uppercase",marginBottom:14}}>Enter your 6-digit PIN</div>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginBottom:8,animation:shake?"shake 0.4s ease":"none"}}>
          {[0,1,2,3,4,5].map(i=><div key={i} style={{width:16,height:16,borderRadius:"50%",border:`2px solid ${pin.length>i?C.blue:"#C5D5EC"}`,background:pin.length>i?C.blue:"transparent",transition:"all 0.15s"}}/>)}
        </div>
        {err&&<div style={{color:C.red,fontSize:12,marginBottom:6}}>{err}</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:14}}>
          {keys.map(k=>(
            <button key={k} onClick={()=>{if(k==="⌫")back();else if(k==="C")clr();else pressKey(k);}}
              style={{padding:"14px 0",borderRadius:9,border:`1px solid ${k==="C"?"#FECACA":"#C5D5EC"}`,background:k==="C"?"#FFF5F5":k==="⌫"?C.light:"#fff",color:k==="C"?C.red:C.navy,fontSize:k==="⌫"?18:20,fontWeight:"bold",cursor:"pointer",fontFamily:"inherit"}}>
              {k}
            </button>
          ))}
        </div>
        <Btn disabled={pin.length<6} onClick={tryLogin} style={{width:"100%",fontSize:15,marginBottom:10}}>Sign In →</Btn>
        <button onClick={()=>setAdminMode(true)} style={{background:"none",border:"none",color:C.gray,fontSize:11,cursor:"pointer",textDecoration:"underline"}}>Admin access</button>
      </div>
      <style>{`@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}`}</style>
    </div>
  );
}

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, textAlign: "center", fontFamily: "Georgia,serif" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: "#1A3A6B", marginBottom: 12 }}>Something went wrong</h2>
          <p style={{ color: "#6B7280", marginBottom: 20 }}>{String(this.state.error.message || this.state.error)}</p>
          <button onClick={() => { this.setState({ error: null }); window.location.href = "/"; }}
            style={{ background: "#2468C0", color: "#fff", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 14, cursor: "pointer" }}>
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [bookings, setBookings] = useState(loadBookings);
  const [employee, setEmployee] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => { saveBookings(bookings); }, [bookings]);

  useEffect(() => {
    try {
      const e = safeGet("cmc_employee");
      if (e) setEmployee(JSON.parse(e));
      if (safeGet("cmc_admin") === "true") setIsAdmin(true);
    } catch {}
  }, []);

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 3000); }

  function handleBook(b) {
    setBookings(prev => { const u=[...prev,b]; saveBookings(u); return u; });
    showToast("Booking confirmed! ✓");
  }

  function handleAssign(bookingId, empId) {
    setBookings(prev => {
      const u = empId === "DELETE" ? prev.filter(b=>b.id!==bookingId) : prev.map(b=>b.id===bookingId?{...b,assignedTo:empId}:b);
      saveBookings(u); return u;
    });
  }

  function handleAdminBook(b) {
    setBookings(prev => { const u=[...prev,b]; saveBookings(u); return u; });
    showToast(`✅ ${b.name} scheduled for ${b.date}`);
  }

  function logout() { safeRemove("cmc_employee"); safeRemove("cmc_admin"); setEmployee(null); setIsAdmin(false); setPage("home"); }

  const navBtnStyle = (active) => ({
    background: active ? C.blue : "transparent", color: "#fff",
    border: `1px solid ${active ? C.blue : "rgba(255,255,255,0.4)"}`,
    borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 13,
    fontFamily: "inherit", transition: "all 0.2s", whiteSpace: "nowrap",
  });

  const Header = ({ right }) => (
    <header style={{ background: C.navyDark, padding: "10px 16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, boxShadow: "0 2px 12px rgba(0,0,0,0.2)" }}>
      {right && <div style={{ alignSelf: "flex-end", color: "rgba(255,255,255,0.7)", fontSize: 12 }}>{right}</div>}
      <nav style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
        {[["home","Home"],["book","Book Now"],["pricing","Pricing"],["about","About"],["employee","Employee"]].map(([k,l]) => (
          <button key={k} onClick={() => setPage(k)} style={navBtnStyle(page === k)}>{l}</button>
        ))}
      </nav>
    </header>
  );

  // Admin view
  if (page === "employee" && isAdmin) return (
    <div style={{ fontFamily: "Georgia,serif", background: C.cream, minHeight: "100vh" }}>
      <header style={{ background: C.navyDark, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <img src="/logo.png" alt="Criss Maid Cleaning" style={{ height: 40, objectFit: "contain" }} />
        <span style={{ color: C.gold, fontSize: 13, fontWeight: "bold" }}>🔐 Admin</span>
      </header>
      <AdminDashboard onLogout={logout} bookings={bookings} onAssign={handleAssign} onAdminBook={handleAdminBook} />
      {toast && <div style={{ position: "fixed", bottom: 28, right: 24, background: C.blue, color: "#fff", padding: "12px 22px", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", fontSize: 14, zIndex: 9999 }}>{toast}</div>}
    </div>
  );

  // Employee schedule view
  if (page === "employee" && employee) return (
    <div style={{ fontFamily: "Georgia,serif", background: C.cream, minHeight: "100vh" }}>
      <header style={{ background: C.navyDark, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <img src="/logo.png" alt="Criss Maid Cleaning" style={{ height: 40, objectFit: "contain" }} />
        <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>👋 {employee.name}</span>
      </header>
      <EmployeeSchedule bookings={bookings} employee={employee} onLogout={logout} />
      {toast && <div style={{ position: "fixed", bottom: 28, right: 24, background: C.blue, color: "#fff", padding: "12px 22px", borderRadius: 10, fontSize: 14, zIndex: 9999 }}>{toast}</div>}
    </div>
  );

  // Employee login
  if (page === "employee") return (
    <div style={{ fontFamily: "Georgia,serif", background: C.cream, minHeight: "100vh" }}>
      <header style={{ background: C.navyDark, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <img src="/logo.png" alt="Criss Maid Cleaning" style={{ height: 40, objectFit: "contain" }} />
        <button onClick={() => setPage("home")} style={{ ...navBtnStyle(false), fontSize: 12 }}>← Back</button>
      </header>
      <EmployeeLogin onLogin={emp => { setEmployee(emp); showToast(`Welcome, ${emp.name}! 👋`); }} onAdminLogin={() => { setIsAdmin(true); showToast("Welcome, Admin! 🔐"); }} />
    </div>
  );

  // Public pages
  return (
    <div style={{ fontFamily: "Georgia,serif", background: C.cream, minHeight: "100vh", color: C.navy }}>
      <Header />

      {page === "home" && (
        <>
          <div style={{ background: `linear-gradient(135deg,${C.navyDark} 0%,#1a5bb5 60%,${C.blue} 100%)`, padding: "48px 20px", textAlign: "center" }}>
            <img src="/logo.png" alt="Criss Maid Cleaning" style={{ width: "85%", maxWidth: 360, objectFit: "contain", marginBottom: 14, mixBlendMode: "screen" }} />
            <p style={{ color: "#fff", fontWeight: "bold", fontSize: 16, letterSpacing: 2, marginBottom: 24 }}>Professional · Reliable · Spotless</p>
            <button onClick={() => setPage("book")} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8, padding: "15px 36px", fontSize: 15, cursor: "pointer", fontFamily: "inherit", boxShadow: "0 4px 20px rgba(75,173,46,0.4)" }}>Book a Cleaning →</button>
          </div>

          <div style={S.section}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 18, marginBottom: 20 }}>
              {[["🏠","All Home Sizes","From studios to 5+ bedrooms. First cleaning & recurring options."],["👥","2 or 3-Person Crews","$75/hr for 2 people, $130/hr for 3."],["📅","Easy Scheduling","Book online in minutes. Schedule your free estimate today."],["⭐","Add-On Services","Fridge & oven ($45 each) for recurring clients. Silver cleaning quoted."]].map(([icon,t,d])=>(
                <div key={t} style={{ ...S.card, textAlign: "center", marginBottom: 0 }}>
                  <div style={{ fontSize: 32, marginBottom: 10 }}>{icon}</div>
                  <div style={{ fontWeight: "bold", fontSize: 15, marginBottom: 6, fontFamily: "Georgia,serif" }}>{t}</div>
                  <div style={{ color: C.gray, fontSize: 13, lineHeight: 1.5 }}>{d}</div>
                </div>
              ))}
            </div>

            <div style={{ ...S.card, display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 20, marginBottom: 6 }}>Ready for a spotless home?</div>
                <div style={{ color: C.gray, fontSize: 13 }}>Book online in minutes. We'll reach out to confirm and provide your custom quote.</div>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Btn onClick={() => setPage("book")}>Book Now</Btn>
                <Btn variant="outline" onClick={() => setPage("pricing")}>See Pricing</Btn>
              </div>
            </div>

            <div style={{ ...S.card, background: C.navyDark, color: "#fff", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ fontSize: 48 }}>👩‍👦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Georgia,serif", fontSize: 18, marginBottom: 6 }}>A Family You Can Trust</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.6 }}>Mother-and-son business built on 30+ years of experience. Serving Maryland & Washington D.C.</div>
                <button onClick={() => setPage("about")} style={{ background: C.green, color: "#fff", border: "none", borderRadius: 8, padding: "9px 22px", fontSize: 13, cursor: "pointer", fontFamily: "inherit", marginTop: 12 }}>Meet the Team →</button>
              </div>
            </div>
          </div>
        </>
      )}

      {page === "book" && (
        <div style={S.section}>
          <h2 style={{ fontFamily: "Georgia,serif", marginBottom: 20 }}>Book a Cleaning</h2>
          <ErrorBoundary>
            <BookingForm bookings={bookings} onBook={handleBook} />
          </ErrorBoundary>
        </div>
      )}

      {page === "pricing" && <PricingPage />}
      {page === "about" && <AboutPage onBook={() => setPage("book")} />}

      <footer style={{ background: C.navy, color: "#AAA", textAlign: "center", padding: "28px 20px", fontSize: 13 }}>
        <div style={{ color: "#fff", fontFamily: "Georgia,serif", fontSize: 17, marginBottom: 8 }}>Criss Maid Cleaning</div>
        <div>📱 (240) 413-4313 &nbsp;·&nbsp; 📱 (301) 768-1371 &nbsp;·&nbsp; ✉️ crissmaidcleaning@gmail.com</div>
        <div style={{ marginTop: 6 }}>Mon–Fri · 8:00 AM – 6:00 PM &nbsp;|&nbsp; Weekends: Call for Quote</div>
        <div style={{ marginTop: 6, color: C.blueLight }}>📍 Serving Maryland & Washington D.C.</div>
        <div style={{ marginTop: 14, color: "#555", fontSize: 11 }}>© 2026 Criss Maid Cleaning. All rights reserved.</div>
      </footer>

      {toast && <div style={{ position: "fixed", bottom: 28, right: 24, background: C.blue, color: "#fff", padding: "12px 22px", borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.2)", fontSize: 14, zIndex: 9999 }}>{toast}</div>}
    </div>
  );
}
