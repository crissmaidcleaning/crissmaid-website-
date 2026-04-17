import { useState, useEffect } from "react";

// ── Palette & helpers ──────────────────────────────────────────────────────────
const COLORS = {
  navy: "#1A3A6B",
  navyDark: "#1C4B9B",   // lighter blue matching logo
  blue: "#2468C0",
  blueLight: "#6aaee8",
  green: "#4BAD2E",
  greenLight: "#6DC94E",
  cream: "#F4F8FF",
  white: "#FFFFFF",
  gray: "#6B7280",
  lightGray: "#EDF2FB",
  red: "#EF4444",
  gold: "#F4D35E",
};

const EMPLOYEES = [
  { id: 1, name: "Maria G.", pin: "123456", color: "#2468C0" },
  { id: 2, name: "Sofia R.", pin: "654321", color: "#4BAD2E" },
  { id: 3, name: "Lucia M.", pin: "112233", color: "#4A90D9" },
];

const EXTRAS = [
  { id: "fridge", label: "Fridge (inside & out)", price: 45 },
  { id: "oven", label: "Oven cleaning", price: 45 },
  { id: "silver", label: "Silver cleaning", price: null, quote: true },
];

const TIME_SLOTS = ["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM"];

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

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDay(year, month) {
  return new Date(year, month, 1).getDay();
}
function pad(n) { return String(n).padStart(2, "0"); }
function dateKey(y, m, d) { return `${y}-${pad(m+1)}-${pad(d)}`; }
function today() {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth(), d: t.getDate() };
}

// Fake existing bookings for demo
const DEMO_BOOKINGS = [
  { id: "b1", date: dateKey(today().y, today().m, today().d + 1), slot: "9:00 AM", name: "Jennifer L.", phone: "555-0101", address: "123 Maple St", homeSize: "2 Bedroom", crew: 2, isFirst: true, extras: [], recurringFreq: "none", estimatedHours: 3, travelMins: 20, status: "confirmed", notes: "Gate code: 4521" },
  { id: "b2", date: dateKey(today().y, today().m, today().d + 1), slot: "2:00 PM", name: "Carlos M.", phone: "555-0202", address: "456 Oak Ave", homeSize: "3 Bedroom", crew: 3, isFirst: false, extras: ["fridge"], recurringFreq: "biweekly", estimatedHours: 2.5, travelMins: 15, status: "confirmed", notes: "" },
  { id: "b3", date: dateKey(today().y, today().m, today().d + 3), slot: "10:00 AM", name: "Amanda K.", phone: "555-0303", address: "789 Pine Rd", homeSize: "4 Bedroom", crew: 2, isFirst: true, extras: ["oven","fridge"], recurringFreq: "weekly", estimatedHours: 5, travelMins: 25, status: "confirmed", notes: "Allergic to strong scents" },
  { id: "b4", date: dateKey(today().y, today().m, today().d + 5), slot: "8:00 AM", name: "Thomas B.", phone: "555-0404", address: "321 Elm Blvd", homeSize: "Studio / 1BR", crew: 2, isFirst: false, extras: [], recurringFreq: "weekly", estimatedHours: 2, travelMins: 10, status: "confirmed", notes: "" },
];

// ── Styles (inline) ────────────────────────────────────────────────────────────
const css = {
  app: { fontFamily: "'Georgia', serif", background: COLORS.cream, minHeight: "100vh", color: COLORS.navy },
  header: { background: COLORS.white, padding: 0, display: "flex", flexDirection: "column", alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", overflow: "hidden" },
  logo: { display: "flex", alignItems: "center", gap: 12 },
  logoIcon: { width: 44, height: 44, background: COLORS.blue, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 },
  logoText: { color: COLORS.white },
  logoName: { fontFamily: "'Georgia', serif", fontSize: 20, fontWeight: "bold", letterSpacing: 1, margin: 0, lineHeight: 1.1 },
  logoSub: { fontSize: 11, color: COLORS.blueLight, letterSpacing: 2, textTransform: "uppercase", margin: 0 },
  nav: { display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center", width: "100%", background: COLORS.navyDark, padding: "10px 16px" },
  navBtn: (active) => ({ background: active ? COLORS.blue : "transparent", color: COLORS.white, border: `1px solid ${active ? COLORS.blue : "rgba(255,255,255,0.4)"}`, borderRadius: 6, padding: "7px 14px", cursor: "pointer", fontSize: 13, letterSpacing: 0.3, transition: "all 0.2s", whiteSpace: "nowrap" }),
  hero: { background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, #1a5bb5 60%, #2468C0 100%)`, padding: "48px 24px", textAlign: "center" },
  heroTitle: { fontFamily: "'Georgia', serif", fontSize: 42, color: COLORS.white, margin: "0 0 12px", letterSpacing: 2 },
  heroSub: { color: "rgba(255,255,255,0.85)", fontSize: 16, marginBottom: 32, letterSpacing: 1 },
  heroBtn: { background: COLORS.green, color: COLORS.white, border: "none", borderRadius: 8, padding: "16px 40px", fontSize: 16, cursor: "pointer", fontFamily: "'Georgia', serif", letterSpacing: 1, boxShadow: "0 4px 20px rgba(75,173,46,0.4)", transition: "transform 0.2s" },
  section: { maxWidth: 960, margin: "40px auto", padding: "0 24px" },
  card: { background: COLORS.white, borderRadius: 12, padding: 28, boxShadow: "0 2px 16px rgba(26,58,107,0.08)", marginBottom: 24 },
  sectionTitle: { fontSize: 22, fontFamily: "'Georgia', serif", color: COLORS.navy, marginBottom: 20, borderBottom: `2px solid ${COLORS.blue}`, paddingBottom: 10 },
  label: { fontSize: 13, color: COLORS.gray, fontWeight: "bold", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6, display: "block" },
  input: { width: "100%", padding: "11px 14px", border: `1px solid #C5D5EC`, borderRadius: 8, fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", outline: "none" },
  select: { width: "100%", padding: "11px 14px", border: `1px solid #C5D5EC`, borderRadius: 8, fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", background: COLORS.white },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 },
  formGroup: { marginBottom: 20 },
  tealBtn: { background: COLORS.blue, color: COLORS.white, border: "none", borderRadius: 8, padding: "13px 32px", fontSize: 15, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5, transition: "background 0.2s" },
  outlineBtn: { background: "transparent", color: COLORS.blue, border: `2px solid ${COLORS.blue}`, borderRadius: 8, padding: "11px 28px", fontSize: 14, cursor: "pointer", fontFamily: "inherit", letterSpacing: 0.5 },
  badge: (color) => ({ background: color + "22", color: color, border: `1px solid ${color}`, borderRadius: 20, padding: "3px 12px", fontSize: 12, fontWeight: "bold" }),
  tag: { background: COLORS.blueLight + "22", color: COLORS.blue, borderRadius: 4, padding: "2px 8px", fontSize: 12, marginRight: 4 },
  priceBox: { background: COLORS.navy, color: COLORS.white, borderRadius: 10, padding: "20px 24px", textAlign: "center", marginBottom: 16 },
  priceAmount: { fontSize: 36, fontWeight: "bold", color: COLORS.green },
  toast: { position: "fixed", bottom: 32, right: 32, background: COLORS.blue, color: COLORS.white, padding: "14px 24px", borderRadius: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.2)", fontSize: 15, zIndex: 9999 },
};

// ── Calendar Component ─────────────────────────────────────────────────────────
function CalendarView({ bookings, onSelectSlot, selectedDate, selectedSlot }) {
  const t = today();
  const [viewYear, setViewYear] = useState(t.y);
  const [viewMonth, setViewMonth] = useState(t.m);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDay(viewYear, viewMonth);

  function isBooked(day, slot) {
    const dk = dateKey(viewYear, viewMonth, day);
    return bookings.some(b => b.date === dk && b.slot === slot);
  }
  function isPast(day) {
    const d = new Date(viewYear, viewMonth, day);
    const now = new Date(); now.setHours(0,0,0,0);
    return d < now;
  }
  function isWeekend(day) {
    const dow = new Date(viewYear, viewMonth, day).getDay();
    return dow === 0; // Sundays fully closed; Saturdays available by quote
  }

  const [hovDay, setHovDay] = useState(null);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); }
    else setViewMonth(m => m-1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0); }
    else setViewMonth(m => m+1);
  }

  const selectedDk = selectedDate ? dateKey(selectedDate.y, selectedDate.m, selectedDate.d) : null;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ ...css.outlineBtn, padding: "6px 16px" }}>‹</button>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: "bold" }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ ...css.outlineBtn, padding: "6px 16px" }}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: "bold", color: COLORS.gray, padding: "4px 0" }}>{d}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const dk = dateKey(viewYear, viewMonth, day);
          const past = isPast(day);
          const sun = isWeekend(day);
          const bookedSlots = bookings.filter(b => b.date === dk).length;
          const isSelected = selectedDk === dk;
          const isToday = viewYear === t.y && viewMonth === t.m && day === t.d;
          return (
            <div
              key={day}
              onClick={() => !past && !sun && onSelectSlot && onSelectSlot({ y: viewYear, m: viewMonth, d: day }, null)}
              onMouseEnter={() => setHovDay(day)}
              onMouseLeave={() => setHovDay(null)}
              style={{
                borderRadius: 8,
                padding: "8px 4px",
                textAlign: "center",
                cursor: past || sun ? "not-allowed" : "pointer",
                background: isSelected ? COLORS.blue : isToday ? COLORS.navy : hovDay === day && !past && !sun ? COLORS.blueLight + "22" : COLORS.white,
                color: isSelected || isToday ? COLORS.white : past || sun ? "#CCC" : COLORS.navy,
                border: isToday && !isSelected ? `2px solid ${COLORS.blue}` : "2px solid transparent",
                transition: "all 0.15s",
                position: "relative",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: isToday ? "bold" : "normal" }}>{day}</div>
              {bookedSlots > 0 && !past && (
                <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 2 }}>
                  {[...Array(Math.min(bookedSlots, 3))].map((_, di) => (
                    <div key={di} style={{ width: 5, height: 5, borderRadius: "50%", background: isSelected ? COLORS.greenLight : COLORS.blue }} />
                  ))}
                </div>
              )}
              {sun && <div style={{ fontSize: 8, color: "#CCC" }}>Closed</div>}
            </div>
          );
        })}
      </div>

      {/* Time slots for selected day */}
      {selectedDate && selectedDate.m === viewMonth && selectedDate.y === viewYear && (
        <div style={{ marginTop: 24 }}>
          <div style={{ ...css.label, marginBottom: 12 }}>Available Times — {MONTHS[selectedDate.m]} {selectedDate.d}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {TIME_SLOTS.map(slot => {
              const booked = isBooked(selectedDate.d, slot);
              const isSelSlot = selectedSlot === slot;
              return (
                <button
                  key={slot}
                  disabled={booked}
                  onClick={() => onSelectSlot && onSelectSlot(selectedDate, slot)}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    border: `2px solid ${booked ? "#E5E7EB" : isSelSlot ? COLORS.blue : COLORS.blueLight}`,
                    background: booked ? "#F9FAFB" : isSelSlot ? COLORS.blue : COLORS.white,
                    color: booked ? "#CCC" : isSelSlot ? COLORS.white : COLORS.navy,
                    cursor: booked ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                >
                  {slot}{booked ? " ✗" : ""}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 8 }}>* 30-min travel buffer included between appointments</div>
        </div>
      )}
    </div>
  );
}

// ── Pricing Calculator ─────────────────────────────────────────────────────────
function PricingEstimate({ homeSize, crew, isFirst, extras, recurringFreq }) {
  if (!homeSize) return null;
  const sizeObj = HOME_SIZES.find(h => h.label === homeSize);
  const recurObj = RECURRING_PRICES.find(r => r.label === homeSize);
  if (!sizeObj) return null;

  let basePrice = 0;
  let label = "";
  if (isFirst) {
    const hours = crew === 2 ? sizeObj.crew2h : sizeObj.crew3h;
    const rate = crew === 2 ? 76 : 130;
    basePrice = Math.round(hours * rate);
    label = `First cleaning · ${hours}h · ${crew === 2 ? "2-person @ $76/hr" : "3-person @ $130/hr"}`;
  } else if (recurringFreq && recurringFreq !== "none") {
    basePrice = recurObj[recurringFreq] || 0;
    label = `Recurring (${recurringFreq}) flat rate`;
  }

  let extrasTotal = 0;
  let extrasLines = [];
  let needsQuote = false;
  (extras || []).forEach(eid => {
    const ex = EXTRAS.find(e => e.id === eid);
    if (!ex) return;
    if (ex.quote) { needsQuote = true; extrasLines.push({ label: ex.label, price: "Quote" }); }
    else { extrasTotal += ex.price; extrasLines.push({ label: ex.label, price: `$${ex.price}` }); }
  });

  const total = basePrice + extrasTotal;

  return (
    <div style={css.priceBox}>
      <div style={{ fontSize: 13, color: COLORS.blueLight, marginBottom: 4 }}>{label}</div>
      {extrasLines.map(l => (
        <div key={l.label} style={{ display: "flex", justifyContent: "space-between", color: "#DDD", fontSize: 13, marginBottom: 2 }}>
          <span>+ {l.label}</span><span>{l.price}</span>
        </div>
      ))}
      <div style={css.priceAmount}>{needsQuote ? `$${total}+ (quote req'd)` : `$${total}`}</div>
      <div style={{ fontSize: 12, color: "#AAA", marginTop: 4 }}>Estimated total {needsQuote ? "(silver cleaning TBD)" : ""}</div>
    </div>
  );
}

// ── Employee Schedule View ─────────────────────────────────────────────────────
function EmployeeSchedule({ bookings, employee, onLogout }) {
  const t = today();
  const [viewYear, setViewYear] = useState(t.y);
  const [viewMonth, setViewMonth] = useState(t.m);
  const [selectedB, setSelectedB] = useState(null);

  const monthBookings = bookings.filter(b => {
    const [y, m] = b.date.split("-").map(Number);
    return y === viewYear && (m - 1) === viewMonth;
  }).sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot));

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); }
    else setViewMonth(m => m-1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0); }
    else setViewMonth(m => m+1);
  }

  const todayKey = dateKey(t.y, t.m, t.d);
  const todayJobs = bookings.filter(b => b.date === todayKey);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Georgia', serif", color: COLORS.navy }}>👋 Hello, {employee.name}</h2>
          <div style={{ color: COLORS.gray, fontSize: 14 }}>Employee Schedule Portal</div>
        </div>
        <button onClick={onLogout} style={{ ...css.outlineBtn }}>Log Out</button>
      </div>

      {/* Today's jobs */}
      <div style={css.card}>
        <div style={css.sectionTitle}>Today's Jobs</div>
        {todayJobs.length === 0 ? (
          <div style={{ color: COLORS.gray, fontStyle: "italic" }}>No jobs scheduled today.</div>
        ) : todayJobs.map(b => (
          <div key={b.id} onClick={() => setSelectedB(b)} style={{ borderLeft: `4px solid ${COLORS.blue}`, paddingLeft: 16, marginBottom: 16, cursor: "pointer" }}>
            <div style={{ fontWeight: "bold", fontSize: 16 }}>{b.slot} — {b.name}</div>
            <div style={{ color: COLORS.gray, fontSize: 14 }}>{b.address} · {b.homeSize} · {b.crew}-person crew</div>
            <div style={{ color: COLORS.gray, fontSize: 13 }}>Est. {b.estimatedHours}h + {b.travelMins}min travel</div>
            {b.notes && <div style={{ color: COLORS.blue, fontSize: 13, marginTop: 4 }}>📝 {b.notes}</div>}
          </div>
        ))}
      </div>

      {/* Monthly calendar list */}
      <div style={css.card}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={css.sectionTitle}>{MONTHS[viewMonth]} {viewYear}</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={prevMonth} style={{ ...css.outlineBtn, padding: "4px 12px" }}>‹</button>
            <button onClick={nextMonth} style={{ ...css.outlineBtn, padding: "4px 12px" }}>›</button>
          </div>
        </div>
        {monthBookings.length === 0 ? (
          <div style={{ color: COLORS.gray, fontStyle: "italic" }}>No bookings this month yet.</div>
        ) : monthBookings.map(b => {
          const [, , dd] = b.date.split("-");
          const dow = new Date(b.date).toLocaleDateString("en-US", { weekday: "short" });
          return (
            <div key={b.id} onClick={() => setSelectedB(b)} style={{ display: "flex", gap: 16, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}>
              <div style={{ minWidth: 48, textAlign: "center", background: COLORS.navy, color: COLORS.white, borderRadius: 8, padding: "6px 0" }}>
                <div style={{ fontSize: 10, color: COLORS.blueLight }}>{dow}</div>
                <div style={{ fontWeight: "bold", fontSize: 18 }}>{Number(dd)}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: "bold" }}>{b.slot} · {b.name}</div>
                <div style={{ color: COLORS.gray, fontSize: 13 }}>{b.address} · {b.homeSize}</div>
              </div>
              <div style={{ textAlign: "right", fontSize: 13, color: COLORS.gray }}>
                <div>{b.estimatedHours}h</div>
                <div>+{b.travelMins}m travel</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail modal */}
      {selectedB && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }} onClick={() => setSelectedB(null)}>
          <div style={{ background: COLORS.white, borderRadius: 14, padding: 32, maxWidth: 440, width: "90%", boxShadow: "0 8px 40px rgba(0,0,0,0.2)" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Georgia', serif", marginTop: 0 }}>Job Details</h3>
            <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
              <div><strong>Client:</strong> {selectedB.name}</div>
              <div><strong>Phone:</strong> {selectedB.phone}</div>
              <div><strong>Address:</strong> {selectedB.address}</div>
              <div><strong>Date & Time:</strong> {selectedB.date} @ {selectedB.slot}</div>
              <div><strong>Home Size:</strong> {selectedB.homeSize}</div>
              <div><strong>Crew Size:</strong> {selectedB.crew} people</div>
              <div><strong>Est. Duration:</strong> {selectedB.estimatedHours} hours</div>
              <div><strong>Travel Time:</strong> {selectedB.travelMins} minutes</div>
              <div><strong>Type:</strong> {selectedB.isFirst ? "First Cleaning" : `Recurring (${selectedB.recurringFreq})`}</div>
              {selectedB.extras.length > 0 && <div><strong>Extras:</strong> {selectedB.extras.join(", ")}</div>}
              {selectedB.notes && <div style={{ background: COLORS.blue + "15", borderRadius: 8, padding: "10px 14px", color: COLORS.blue }}><strong>Notes:</strong> {selectedB.notes}</div>}
            </div>
            <button onClick={() => setSelectedB(null)} style={{ ...css.tealBtn, marginTop: 20, width: "100%" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Employee Login ─────────────────────────────────────────────────────────────
function EmployeeLogin({ onLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  function pressKey(k) {
    if (pin.length < 6) setPin(p => p + k);
  }
  function backspace() { setPin(p => p.slice(0, -1)); setError(""); }
  function clear() { setPin(""); setError(""); }

  function handleLogin() {
    const emp = EMPLOYEES.find(e => e.pin === pin);
    if (emp) {
      localStorage.setItem("cmc_employee", JSON.stringify(emp));
      onLogin(emp);
    } else {
      setError("Incorrect PIN. Please try again.");
      setShake(true);
      setTimeout(() => { setShake(false); setPin(""); setError(""); }, 1200);
    }
  }

  const keys = ["1","2","3","4","5","6","7","8","9","C","0","⌫"];

  return (
    <div style={{ maxWidth: 360, margin: "60px auto", padding: "0 24px" }}>
      <div style={{ ...css.card, textAlign: "center" }}>
        <div style={{ background: `linear-gradient(135deg, ${COLORS.navyDark}, ${COLORS.navy})`, borderRadius: 10, padding: "20px 0", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🧹</div>
          <div style={{ color: COLORS.white, fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: "bold" }}>Employee Portal</div>
          <div style={{ color: COLORS.blueLight, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>Criss Maid Cleaning</div>
        </div>

        {/* PIN dots */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: COLORS.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Enter your 6-digit PIN</div>
          <div style={{
            display: "flex", justifyContent: "center", gap: 12, marginBottom: 8,
            animation: shake ? "shake 0.4s ease" : "none",
          }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{
                width: 18, height: 18, borderRadius: "50%",
                background: pin.length > i ? COLORS.blue : "transparent",
                border: `2px solid ${pin.length > i ? COLORS.blue : "#C5D5EC"}`,
                transition: "all 0.15s",
              }} />
            ))}
          </div>
          {error && <div style={{ color: COLORS.red, fontSize: 13, marginBottom: 4 }}>{error}</div>}
        </div>

        {/* Keypad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {keys.map(k => (
            <button
              key={k}
              onClick={() => {
                if (k === "⌫") backspace();
                else if (k === "C") clear();
                else pressKey(k);
              }}
              style={{
                padding: "16px 0",
                borderRadius: 10,
                border: `1px solid ${k === "C" ? "#FECACA" : "#C5D5EC"}`,
                background: k === "C" ? "#FFF5F5" : k === "⌫" ? COLORS.lightGray : COLORS.white,
                color: k === "C" ? COLORS.red : COLORS.navy,
                fontSize: k === "⌫" ? 20 : 22,
                fontWeight: "bold",
                cursor: "pointer",
                fontFamily: "inherit",
                transition: "background 0.1s",
                boxShadow: "0 1px 4px rgba(26,58,107,0.08)",
              }}
            >{k}</button>
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={pin.length < 6}
          style={{ ...css.tealBtn, width: "100%", opacity: pin.length < 6 ? 0.4 : 1, fontSize: 16 }}
        >
          Sign In →
        </button>
        <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 14 }}>Demo PINs: 123456 · 654321 · 112233</div>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>
    </div>
  );
}

// ── Booking Form ───────────────────────────────────────────────────────────────
function BookingForm({ bookings, onBook }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "", city: "", notes: "",
    homeSize: "", crew: 2, isFirst: true, recurringFreq: "none",
    extras: [], date: null, slot: null,
  });
  const [submitted, setSubmitted] = useState(false);

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function toggleExtra(id) {
    set("extras", form.extras.includes(id) ? form.extras.filter(e => e !== id) : [...form.extras, id]);
  }

  function calcHours() {
    const s = HOME_SIZES.find(h => h.label === form.homeSize);
    if (!s) return 0;
    return form.crew === 2 ? s.crew2h : s.crew3h;
  }

  function canNext() {
    if (step === 1) return form.name && form.phone && form.email && form.address;
    if (step === 2) return form.homeSize;
    if (step === 3) return form.date && form.slot;
    return true;
  }

  function submit() {
    const booking = {
      id: "b" + Date.now(),
      ...form,
      estimatedHours: calcHours(),
      travelMins: 20,
      status: "confirmed",
    };
    onBook(booking);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ ...css.card, textAlign: "center", padding: 48 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: "'Georgia', serif", color: COLORS.blue }}>Booking Confirmed!</h2>
        <p style={{ color: COLORS.gray }}>Thank you, {form.name}! We'll see you on {form.date} at {form.slot}.</p>
        <p style={{ color: COLORS.gray, fontSize: 14 }}>A confirmation will be sent to {form.email}</p>
        {form.extras.includes("silver") && (
          <div style={{ background: COLORS.gold + "33", borderRadius: 8, padding: 14, marginTop: 16, fontSize: 14 }}>
            📞 We'll contact you soon with a quote for silver cleaning.
          </div>
        )}
        <button onClick={() => { setSubmitted(false); setStep(1); setForm({ name:"",phone:"",email:"",address:"",city:"",notes:"",homeSize:"",crew:2,isFirst:true,recurringFreq:"none",extras:[],date:null,slot:null }); }} style={{ ...css.outlineBtn, marginTop: 24 }}>
          Book Another
        </button>
      </div>
    );
  }

  const stepLabels = ["Your Info", "Service", "Schedule", "Review"];

  return (
    <div style={css.card}>
      {/* Progress */}
      <div style={{ display: "flex", marginBottom: 32, gap: 4 }}>
        {stepLabels.map((l, i) => (
          <div key={l} style={{ flex: 1, textAlign: "center" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: step > i+1 ? COLORS.green : step === i+1 ? COLORS.navy : "#E5E7EB", color: step > i+1 || step === i+1 ? COLORS.white : COLORS.gray, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: "bold", margin: "0 auto 4px" }}>
              {step > i+1 ? "✓" : i+1}
            </div>
            <div style={{ fontSize: 11, color: step === i+1 ? COLORS.navy : COLORS.gray, fontWeight: step === i+1 ? "bold" : "normal" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Step 1: Info */}
      {step === 1 && (
        <div>
          <div style={css.sectionTitle}>Your Information</div>
          <div style={css.row}>
            <div style={css.formGroup}>
              <label style={css.label}>Full Name *</label>
              <input style={css.input} value={form.name} onChange={e => set("name", e.target.value)} placeholder="Jane Smith" />
            </div>
            <div style={css.formGroup}>
              <label style={css.label}>Phone *</label>
              <input style={css.input} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="555-123-4567" />
            </div>
          </div>
          <div style={css.formGroup}>
            <label style={css.label}>Email *</label>
            <input style={css.input} value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@email.com" type="email" />
          </div>
          <div style={css.formGroup}>
            <label style={css.label}>Service Address *</label>
            <input style={css.input} value={form.address} onChange={e => set("address", e.target.value)} placeholder="123 Main St, City, State" />
          </div>
          <div style={css.formGroup}>
            <label style={css.label}>Special Instructions / Notes</label>
            <textarea style={{ ...css.input, height: 80, resize: "vertical" }} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Gate code, pets, allergies, etc." />
          </div>
        </div>
      )}

      {/* Step 2: Service */}
      {step === 2 && (
        <div>
          <div style={css.sectionTitle}>Service Details</div>
          <div style={css.formGroup}>
            <label style={css.label}>Home Size</label>
            <select style={css.select} value={form.homeSize} onChange={e => set("homeSize", e.target.value)}>
              <option value="">— Select —</option>
              {HOME_SIZES.map(h => <option key={h.label} value={h.label}>{h.label} ({h.sqft})</option>)}
            </select>
          </div>

          <div style={css.formGroup}>
            <label style={css.label}>Is this your first cleaning with us?</label>
            <div style={{ display: "flex", gap: 12 }}>
              {[true, false].map(v => (
                <button key={String(v)} onClick={() => set("isFirst", v)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `2px solid ${form.isFirst === v ? COLORS.blue : "#E5E7EB"}`, background: form.isFirst === v ? COLORS.blue + "15" : COLORS.white, color: form.isFirst === v ? COLORS.blue : COLORS.gray, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
                  {v ? "Yes – First cleaning" : "No – Returning client"}
                </button>
              ))}
            </div>
          </div>

          {form.isFirst && (
            <div style={css.formGroup}>
              <label style={css.label}>Crew Size</label>
              <div style={{ display: "flex", gap: 12 }}>
                {[2, 3].map(n => (
                  <button key={n} onClick={() => set("crew", n)} style={{ flex: 1, padding: "12px 0", borderRadius: 8, border: `2px solid ${form.crew === n ? COLORS.blue : "#E5E7EB"}`, background: form.crew === n ? COLORS.blue + "15" : COLORS.white, color: form.crew === n ? COLORS.blue : COLORS.gray, cursor: "pointer", fontFamily: "inherit" }}>
                    <div style={{ fontWeight: "bold", fontSize: 16 }}>{n} People</div>
                    <div style={{ fontSize: 13 }}>${n === 2 ? 76 : 130}/hr</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!form.isFirst && (
            <div style={css.formGroup}>
              <label style={css.label}>Recurring Frequency</label>
              <select style={css.select} value={form.recurringFreq} onChange={e => set("recurringFreq", e.target.value)}>
                <option value="none">One-time only</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          )}

          <div style={css.formGroup}>
            <label style={css.label}>Add-on Services</label>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {EXTRAS.map(ex => (
                <label key={ex.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", borderRadius: 8, border: `1px solid ${form.extras.includes(ex.id) ? COLORS.blue : "#E5E7EB"}`, background: form.extras.includes(ex.id) ? COLORS.blue + "08" : COLORS.white }}>
                  <input type="checkbox" checked={form.extras.includes(ex.id)} onChange={() => toggleExtra(ex.id)} />
                  <span style={{ flex: 1 }}>{ex.label}</span>
                  <span style={{ color: COLORS.blue, fontWeight: "bold" }}>{ex.quote ? "Quote" : `$${ex.price}`}</span>
                </label>
              ))}
            </div>
            <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 8 }}>⚠️ No laundry services available.</div>
          </div>

          <PricingEstimate homeSize={form.homeSize} crew={form.crew} isFirst={form.isFirst} extras={form.extras} recurringFreq={form.recurringFreq} />
        </div>
      )}

      {/* Step 3: Schedule */}
      {step === 3 && (
        <div>
          <div style={css.sectionTitle}>Pick a Date & Time</div>
          <CalendarView
            bookings={bookings}
            onSelectSlot={(date, slot) => { set("date", dateKey(date.y, date.m, date.d)); set("slot", slot); }}
            selectedDate={form.date ? { y: Number(form.date.split("-")[0]), m: Number(form.date.split("-")[1])-1, d: Number(form.date.split("-")[2]) } : null}
            selectedSlot={form.slot}
          />
        </div>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
        <div>
          <div style={css.sectionTitle}>Review Your Booking</div>
          <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
            {[
              ["Name", form.name], ["Phone", form.phone], ["Email", form.email],
              ["Address", form.address], ["Home Size", form.homeSize],
              ["Crew", form.isFirst ? `${form.crew} people (first cleaning)` : `Returning – ${form.recurringFreq}`],
              ["Date", form.date], ["Time", form.slot],
              ["Add-ons", form.extras.length ? form.extras.join(", ") : "None"],
              form.notes && ["Notes", form.notes],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6", fontSize: 14 }}>
                <span style={{ color: COLORS.gray }}>{k}</span>
                <span style={{ fontWeight: "bold", textAlign: "right", maxWidth: "60%" }}>{v}</span>
              </div>
            ))}
          </div>
          <PricingEstimate homeSize={form.homeSize} crew={form.crew} isFirst={form.isFirst} extras={form.extras} recurringFreq={form.recurringFreq} />
          <div style={{ fontSize: 13, color: COLORS.gray, marginTop: 12 }}>By booking you agree to our cancellation policy: 24h notice required for rescheduling.</div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
        {step > 1 ? <button onClick={() => setStep(s => s-1)} style={css.outlineBtn}>← Back</button> : <div />}
        {step < 4
          ? <button onClick={() => setStep(s => s+1)} disabled={!canNext()} style={{ ...css.tealBtn, opacity: canNext() ? 1 : 0.4 }}>Next →</button>
          : <button onClick={submit} style={css.tealBtn}>Confirm Booking ✓</button>
        }
      </div>
    </div>
  );
}

// ── Pricing Page ───────────────────────────────────────────────────────────────
function PricingPage() {
  return (
    <div style={css.section}>
      <div style={css.card}>
        <div style={css.sectionTitle}>First Cleaning Rates</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: COLORS.navy, color: COLORS.white }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Home Size</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Sq Ft</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>2-Person ($76/hr)</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>3-Person ($130/hr)</th>
              </tr>
            </thead>
            <tbody>
              {HOME_SIZES.map((h, i) => (
                <tr key={h.label} style={{ background: i % 2 === 0 ? COLORS.white : COLORS.lightGray }}>
                  <td style={{ padding: "11px 16px", fontWeight: "bold" }}>{h.label}</td>
                  <td style={{ padding: "11px 16px", textAlign: "center", color: COLORS.gray }}>{h.sqft}</td>
                  <td style={{ padding: "11px 16px", textAlign: "center", color: COLORS.blue, fontWeight: "bold" }}>${Math.round(h.crew2h * 76)}</td>
                  <td style={{ padding: "11px 16px", textAlign: "center", color: COLORS.blue, fontWeight: "bold" }}>${Math.round(h.crew3h * 130)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={css.card}>
        <div style={css.sectionTitle}>Recurring Cleaning Flat Rates</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: COLORS.navy, color: COLORS.white }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Home Size</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Weekly</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Bi-Weekly</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Monthly</th>
              </tr>
            </thead>
            <tbody>
              {RECURRING_PRICES.map((r, i) => (
                <tr key={r.label} style={{ background: i % 2 === 0 ? COLORS.white : COLORS.lightGray }}>
                  <td style={{ padding: "11px 16px", fontWeight: "bold" }}>{r.label}</td>
                  <td style={{ padding: "11px 16px", textAlign: "center", color: COLORS.blue, fontWeight: "bold" }}>${r.weekly}</td>
                  <td style={{ padding: "11px 16px", textAlign: "center", color: COLORS.blue, fontWeight: "bold" }}>${r.biweekly}</td>
                  <td style={{ padding: "11px 16px", textAlign: "center", color: COLORS.blue, fontWeight: "bold" }}>${r.monthly}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={css.card}>
        <div style={css.sectionTitle}>Add-On Services</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 16 }}>
          {EXTRAS.map(ex => (
            <div key={ex.id} style={{ border: `1px solid #E5E7EB`, borderRadius: 10, padding: 20, textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{ex.id === "fridge" ? "🧊" : ex.id === "oven" ? "🔥" : "🥄"}</div>
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>{ex.label}</div>
              <div style={{ color: COLORS.blue, fontSize: 20, fontWeight: "bold" }}>{ex.quote ? "Call for Quote" : `$${ex.price}`}</div>
            </div>
          ))}
          <div style={{ border: `1px solid #E5E7EB`, borderRadius: 10, padding: 20, textAlign: "center", background: "#FFF9F9" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🚫</div>
            <div style={{ fontWeight: "bold", marginBottom: 4, color: COLORS.gray }}>Laundry</div>
            <div style={{ color: COLORS.red, fontSize: 14 }}>Not Available</div>
          </div>
        </div>
      </div>

      <div style={{ ...css.card, background: COLORS.navy, color: COLORS.white }}>
        <div style={{ fontSize: 18, fontFamily: "'Georgia', serif", marginBottom: 8, color: COLORS.greenLight }}>📞 Contact Us for Quotes</div>
        <p style={{ color: "#DDD", marginBottom: 16, fontSize: 14 }}>Silver cleaning pricing depends on the quantity and condition of items. Contact us for a personalized quote.</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ color: COLORS.blueLight }}>📱 (240) 413-4313</div>
          <div style={{ color: COLORS.blueLight }}>📱 (301) 768-1371</div>
          <div style={{ color: COLORS.blueLight }}>✉️ crissmaidcleaning@gmail.com</div>
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [bookings, setBookings] = useState(DEMO_BOOKINGS);
  const [employee, setEmployee] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("cmc_employee");
    if (saved) {
      try { setEmployee(JSON.parse(saved)); } catch {}
    }
  }, []);

  function handleBook(b) {
    setBookings(prev => [...prev, b]);
    showToast("Booking confirmed! ✓");
  }

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  }

  function handleLogin(emp) {
    setEmployee(emp);
    setPage("employee");
    showToast(`Welcome, ${emp.name}! 👋`);
  }

  function handleLogout() {
    localStorage.removeItem("cmc_employee");
    setEmployee(null);
    setPage("home");
  }

  if (page === "employee" && employee) {
    return (
      <div style={css.app}>
        <header style={{ ...css.header, flexDirection: "row", justifyContent: "space-between", padding: "12px 20px" }}>
          <img src="/logo.png" alt="Criss Maid Cleaning" style={{ height: 40, objectFit: "contain" }} />
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>👋 {employee.name}</div>
        </header>
        <EmployeeSchedule bookings={bookings} employee={employee} onLogout={handleLogout} />
        {toast && <div style={css.toast}>{toast}</div>}
      </div>
    );
  }

  if (page === "employee" && !employee) {
    return (
      <div style={css.app}>
        <header style={{ ...css.header, flexDirection: "row", justifyContent: "space-between", padding: "12px 20px" }}>
          <img src="/logo.png" alt="Criss Maid Cleaning" style={{ height: 40, objectFit: "contain" }} />
          <button onClick={() => setPage("home")} style={{ ...css.navBtn(false), fontSize: 12 }}>← Back</button>
        </header>
        <EmployeeLogin onLogin={handleLogin} />
        {toast && <div style={css.toast}>{toast}</div>}
      </div>
    );
  }

  return (
    <div style={css.app}>
      {/* Header — nav only */}
      <header style={{ ...css.header, background: COLORS.navyDark, padding: "10px 16px" }}>
        <nav style={{ ...css.nav, background: "transparent", padding: 0 }}>
          {[["home","Home"],["book","Book Now"],["pricing","Pricing"],["calendar","Calendar"],["employee","Employee"]].map(([k,l]) => (
            <button key={k} onClick={() => setPage(k)} style={css.navBtn(page === k)}>{l}</button>
          ))}
        </nav>
      </header>

      {/* Home */}
      {page === "home" && (
        <>
          <div style={{ width: "100%", background: COLORS.white, position: "relative", textAlign: "center" }}>
            <img src="/logo.png" alt="Criss Maid Cleaning" style={{ width: "100%", display: "block", objectFit: "contain" }} />
            <div style={{ background: COLORS.white, paddingBottom: 28, paddingTop: 0 }}>
              <p style={{ fontFamily: "'Georgia', serif", fontSize: 17, color: COLORS.navy, fontWeight: "bold", letterSpacing: 2, margin: "0 0 20px", textTransform: "uppercase" }}>Professional · Reliable · Spotless</p>
              <button onClick={() => setPage("book")} style={css.heroBtn}>Book a Cleaning →</button>
            </div>
          </div>

          <div style={css.section}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 20, marginBottom: 32 }}>
              {[
                { icon: "🏠", title: "All Home Sizes", desc: "From studios to 5+ bedroom homes. First cleaning & recurring options." },
                { icon: "👥", title: "2 or 3-Person Crews", desc: "$76/hr for 2 people, $130/hr for 3. Faster, more thorough cleaning." },
                { icon: "📅", title: "Easy Scheduling", desc: "Book online in minutes. See real-time availability on our calendar." },
                { icon: "⭐", title: "Add-On Services", desc: "Fridge, oven cleaning & more. Silver cleaning available by quote." },
              ].map(f => (
                <div key={f.title} style={{ ...css.card, textAlign: "center", marginBottom: 0, background: COLORS.white }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>{f.icon}</div>
                  <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 8, fontFamily: "'Georgia', serif", color: COLORS.navy }}>{f.title}</div>
                  <div style={{ color: COLORS.gray, fontSize: 14, lineHeight: 1.5 }}>{f.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ ...css.card, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: 240 }}>
                <div style={{ fontSize: 22, fontFamily: "'Georgia', serif", marginBottom: 8 }}>Ready for a spotless home?</div>
                <div style={{ color: COLORS.gray, fontSize: 14 }}>View our live calendar and pick the time that works best for you. Bookings are confirmed instantly.</div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => setPage("book")} style={css.tealBtn}>Book Now</button>
                <button onClick={() => setPage("pricing")} style={css.outlineBtn}>See Pricing</button>
              </div>
            </div>
          </div>
        </>
      )}

      {page === "book" && (
        <div style={css.section}>
          <h2 style={{ fontFamily: "'Georgia', serif", marginBottom: 24 }}>Book a Cleaning</h2>
          <BookingForm bookings={bookings} onBook={handleBook} />
        </div>
      )}

      {page === "pricing" && <PricingPage />}

      {page === "calendar" && (
        <div style={css.section}>
          <div style={css.card}>
            <div style={css.sectionTitle}>Availability Calendar</div>
            <div style={{ color: COLORS.gray, fontSize: 14, marginBottom: 20 }}>Mon–Fri 8am–6pm. Weekends available by quote — call us to arrange. Sundays closed.</div>
            <CalendarView bookings={bookings} />
            <div style={{ marginTop: 24, display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.blue }} /> Bookings on this day</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.navy }} /> Today</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: "#CCC" }} /> Unavailable</div>
            </div>
            <div style={{ marginTop: 20 }}>
              <button onClick={() => setPage("book")} style={css.tealBtn}>Book a Time Slot →</button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ background: COLORS.navy, color: "#AAA", textAlign: "center", padding: "32px 24px", fontSize: 13 }}>
        <div style={{ color: COLORS.white, fontFamily: "'Georgia', serif", fontSize: 18, marginBottom: 8 }}>Criss Maid Cleaning</div>
        <div>📱 (240) 413-4313 &nbsp;·&nbsp; 📱 (301) 768-1371 &nbsp;·&nbsp; ✉️ crissmaidcleaning@gmail.com</div>
        <div style={{ marginTop: 8 }}>Mon–Fri · 8:00 AM – 6:00 PM &nbsp;|&nbsp; Weekends: Call for Quote</div>
        <div style={{ marginTop: 16, color: "#555", fontSize: 12 }}>© 2026 Criss Maid Cleaning. All rights reserved.</div>
      </footer>

      {toast && <div style={css.toast}>{toast}</div>}
    </div>
  );
}
