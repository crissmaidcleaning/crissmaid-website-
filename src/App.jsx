import { useState, useEffect, useRef } from "react";

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

// Admin password — change this to whatever you want
const ADMIN_PASSWORD = "CrissMaid2024!";

// Default employees (only used if none saved yet)
const DEFAULT_EMPLOYEES = [
  { id: 1, name: "Maria G.", pin: "123456", color: "#2468C0" },
];

function loadEmployees() {
  try {
    const saved = localStorage.getItem("cmc_employees");
    return saved ? JSON.parse(saved) : DEFAULT_EMPLOYEES;
  } catch { return DEFAULT_EMPLOYEES; }
}
function saveEmployees(list) {
  localStorage.setItem("cmc_employees", JSON.stringify(list));
}

// Extras only apply to recurring/returning cleanings
const EXTRAS_RECURRING = [
  { id: "fridge", label: "Fridge (inside & out)", price: 45 },
  { id: "oven", label: "Oven cleaning", price: 45 },
  { id: "silver", label: "Silver cleaning", price: null, quote: true },
];
// For first cleaning, silver can still be requested (quoted separately)
const EXTRAS_FIRST = [
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

// ── Booking persistence ────────────────────────────────────────────────────────
function loadBookings() {
  try {
    const saved = localStorage.getItem("cmc_bookings");
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveBookings(list) {
  try {
    localStorage.setItem("cmc_bookings", JSON.stringify(list));
  } catch (e) { console.error("Failed to save bookings:", e); }
}

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
    return dow === 0 || dow === 6; // Closed Sat & Sun for customers
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
          <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 8 }}>* Mon–Fri only · 30-min travel buffer between appointments · Weekends closed (call for quote)</div>
        </div>
      )}
    </div>
  );
}

// ── Pricing Display ────────────────────────────────────────────────────────────
function PricingEstimate({ homeSize, crew, isFirst, extras, recurringFreq }) {
  if (!homeSize) return null;
  const recurObj = RECURRING_PRICES.find(r => r.label === homeSize);

  // FIRST CLEANING — no total shown, free estimate messaging
  if (isFirst) {
    const hasSilver = extras.includes("silver");
    return (
      <div style={css.priceBox}>
        <div style={{ fontSize: 13, color: COLORS.blueLight, marginBottom: 8 }}>
          {crew === 2 ? "2-person crew · $75/hr" : "3-person crew · $130/hr"}
        </div>
        <div style={{ fontSize: 15, color: COLORS.white, marginBottom: 8, lineHeight: 1.6 }}>
          ✅ Fridge (inside & out) included<br/>
          ✅ Oven cleaning included<br/>
          ✅ Full deep clean included
          {hasSilver && <><br/>🔔 Silver cleaning — quote required</>}
        </div>
        <div style={css.priceAmount}>Free Estimate</div>
        <div style={{ fontSize: 13, color: "#AAA", marginTop: 6 }}>
          We'll contact you with an exact quote before your appointment.
        </div>
      </div>
    );
  }

  // RECURRING — show flat rate + extras
  if (recurringFreq && recurringFreq !== "none" && recurObj) {
    const basePrice = recurObj[recurringFreq] || 0;
    let extrasTotal = 0;
    let extrasLines = [];
    let needsQuote = false;
    extras.forEach(eid => {
      const ex = EXTRAS_RECURRING.find(e => e.id === eid);
      if (!ex) return;
      if (ex.quote) { needsQuote = true; extrasLines.push({ label: ex.label, price: "Quote" }); }
      else { extrasTotal += ex.price; extrasLines.push({ label: ex.label, price: `+$${ex.price}` }); }
    });
    const total = basePrice + extrasTotal;
    return (
      <div style={css.priceBox}>
        <div style={{ fontSize: 13, color: COLORS.blueLight, marginBottom: 4 }}>
          Recurring flat rate · {recurringFreq}
        </div>
        <div style={{ fontSize: 13, color: "#DDD", marginBottom: 8, lineHeight: 1.6 }}>
          ⚠️ Fridge & oven cleaning not included — add below if needed
        </div>
        {extrasLines.map(l => (
          <div key={l.label} style={{ display: "flex", justifyContent: "space-between", color: "#DDD", fontSize: 13, marginBottom: 2 }}>
            <span>+ {l.label}</span><span>{l.price}</span>
          </div>
        ))}
        <div style={css.priceAmount}>{needsQuote ? `$${total}+ (quote for silver)` : `$${total}`}</div>
        <div style={{ fontSize: 12, color: "#AAA", marginTop: 4 }}>Estimated flat rate total</div>
      </div>
    );
  }

  return null;
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
          <div key={b.id} onClick={() => setSelectedB(b)} style={{ borderLeft: `4px solid ${b.isFirst ? COLORS.green : COLORS.blue}`, paddingLeft: 16, marginBottom: 16, cursor: "pointer" }}>
            <div style={{ fontWeight: "bold", fontSize: 16 }}>{b.slot} — {b.name} {b.isFirst && <span style={{ background: COLORS.green + "20", color: COLORS.green, fontSize: 12, borderRadius: 10, padding: "2px 8px", fontWeight: "bold" }}>Free Estimate</span>}</div>
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

// ── Admin Calendar View ────────────────────────────────────────────────────────
function AdminCalendarView({ bookings, employees, onAssign, onAdminBook }) {
  const t = today();
  const [viewYear, setViewYear] = useState(t.y);
  const [viewMonth, setViewMonth] = useState(t.m);
  const [selectedB, setSelectedB] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addSlot, setAddSlot] = useState("");
  const [addForm, setAddForm] = useState({ name: "", phone: "", email: "", address: "", homeSize: "", notes: "", isFirst: true, recurringFreq: "none" });

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDay(viewYear, viewMonth);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y-1); setViewMonth(11); }
    else setViewMonth(m => m-1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y+1); setViewMonth(0); }
    else setViewMonth(m => m+1);
  }

  function dayBookings(day) {
    const dk = dateKey(viewYear, viewMonth, day);
    return bookings.filter(b => b.date === dk).sort((a, b) => a.slot.localeCompare(b.slot));
  }

  const isToday = (day) => viewYear === t.y && viewMonth === t.m && day === t.d;
  const isPast = (day) => new Date(viewYear, viewMonth, day) < new Date(t.y, t.m, t.d);
  // Admin can book ANY day — no weekend restriction
  const isSun = (day) => false;

  const dayBooksForSelected = selectedDate ? dayBookings(selectedDate) : [];
  const selectedDk = selectedDate ? dateKey(viewYear, viewMonth, selectedDate) : null;

  function handleAdminBook() {
    if (!addForm.name || !addSlot) return;
    const booking = {
      id: "admin_" + Date.now(),
      date: selectedDk,
      slot: addSlot,
      name: addForm.name,
      phone: addForm.phone,
      email: addForm.email,
      address: addForm.address,
      homeSize: addForm.homeSize,
      notes: addForm.notes,
      isFirst: addForm.isFirst,
      recurringFreq: addForm.recurringFreq,
      extras: [],
      estimatedHours: 2,
      travelMins: 20,
      status: "confirmed",
      adminScheduled: true,
    };
    onAdminBook(booking);
    setShowAddForm(false);
    setAddForm({ name: "", phone: "", email: "", address: "", homeSize: "", notes: "", isFirst: true, recurringFreq: "none" });
    setAddSlot("");
  }

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <button onClick={prevMonth} style={{ ...css.outlineBtn, padding: "6px 16px" }}>‹</button>
        <span style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: "bold" }}>{MONTHS[viewMonth]} {viewYear}</span>
        <button onClick={nextMonth} style={{ ...css.outlineBtn, padding: "6px 16px" }}>›</button>
      </div>

      {/* Day labels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 8 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 12, fontWeight: "bold", color: COLORS.gray, padding: "4px 0" }}>{d}</div>)}
      </div>

      {/* Calendar grid — admin sees ALL days including weekends */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 20 }}>
        {Array(firstDay).fill(null).map((_, i) => <div key={`e${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const dow = new Date(viewYear, viewMonth, day).getDay();
          const isWeekend = dow === 0 || dow === 6;
          const bks = dayBookings(day);
          const estimates = bks.filter(b => b.isFirst);
          const regular = bks.filter(b => !b.isFirst);
          const isSelected = selectedDate === day;
          return (
            <div
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : day)}
              style={{
                borderRadius: 8, padding: "6px 4px", textAlign: "center", cursor: "pointer",
                background: isSelected ? COLORS.navy : isToday(day) ? COLORS.navyDark : isWeekend ? "#FFF8F0" : COLORS.white,
                color: isSelected || isToday(day) ? COLORS.white : isPast(day) ? "#CCC" : COLORS.navy,
                border: `2px solid ${isSelected ? COLORS.navy : isWeekend ? "#F39C12" : "transparent"}`,
                minHeight: 52,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: isToday(day) ? "bold" : "normal" }}>{day}</div>
              {isWeekend && !isSelected && <div style={{ fontSize: 8, color: "#E67E22" }}>Quote</div>}
              <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 3, flexWrap: "wrap" }}>
                {estimates.map((_, di) => <div key={`e${di}`} style={{ width: 6, height: 6, borderRadius: "50%", background: isSelected ? COLORS.greenLight : COLORS.green }} />)}
                {regular.map((_, di) => <div key={`r${di}`} style={{ width: 6, height: 6, borderRadius: "50%", background: isSelected ? "#AAD" : COLORS.blue }} />)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day */}
      {selectedDate && (
        <div style={{ background: COLORS.lightGray, borderRadius: 10, padding: 16, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontWeight: "bold", fontSize: 16, color: COLORS.navy }}>
              {MONTHS[viewMonth]} {selectedDate} — {dayBooksForSelected.length === 0 ? "No bookings" : `${dayBooksForSelected.length} booking(s)`}
              {(() => { const dow = new Date(viewYear, viewMonth, selectedDate).getDay(); return (dow === 0 || dow === 6) ? <span style={{ marginLeft: 8, background: "#F39C12", color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 11 }}>Weekend</span> : null; })()}
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              style={{ ...css.tealBtn, padding: "8px 16px", fontSize: 13 }}
            >+ Schedule Appointment</button>
          </div>

          {dayBooksForSelected.length === 0 && !showAddForm && (
            <div style={{ color: COLORS.gray, fontStyle: "italic", fontSize: 14 }}>No appointments. Click "+ Schedule Appointment" to add one.</div>
          )}
          {dayBooksForSelected.map(b => {
            const assigned = employees.find(e => e.id === b.assignedTo);
            return (
              <div key={b.id} onClick={() => setSelectedB(b)} style={{ background: COLORS.white, borderRadius: 8, padding: "12px 16px", marginBottom: 10, cursor: "pointer", borderLeft: `4px solid ${b.isFirst ? COLORS.green : COLORS.blue}`, boxShadow: "0 1px 6px rgba(0,0,0,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: "bold" }}>{b.slot} · {b.name} {b.adminScheduled && <span style={{ fontSize: 11, color: COLORS.gray }}>· Admin</span>}</div>
                    <div style={{ color: COLORS.gray, fontSize: 13 }}>{b.address} · {b.homeSize}</div>
                    {assigned && <div style={{ color: COLORS.green, fontSize: 12, marginTop: 2 }}>👤 {assigned.name}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    {b.isFirst && <span style={{ background: COLORS.green + "20", color: COLORS.green, border: `1px solid ${COLORS.green}`, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: "bold" }}>Free Estimate</span>}
                    <span style={{ color: COLORS.blue, fontSize: 12 }}>View →</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Admin add booking form */}
          {showAddForm && (
            <div style={{ background: COLORS.white, borderRadius: 10, padding: 20, marginTop: 12, border: `2px solid ${COLORS.blue}` }}>
              <div style={{ fontWeight: "bold", color: COLORS.navy, marginBottom: 16, fontSize: 15 }}>
                📅 Schedule for {MONTHS[viewMonth]} {selectedDate}
                {(() => { const dow = new Date(viewYear, viewMonth, selectedDate).getDay(); return (dow === 0 || dow === 6) ? <span style={{ marginLeft: 8, color: "#E67E22", fontSize: 13 }}>⚠️ Weekend — Admin only</span> : null; })()}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={css.label}>Client Name *</label><input style={css.input} value={addForm.name} onChange={e => setAddForm(f => ({...f, name: e.target.value}))} placeholder="Jane Smith" /></div>
                <div><label style={css.label}>Phone</label><input style={css.input} value={addForm.phone} onChange={e => setAddForm(f => ({...f, phone: e.target.value.replace(/[^\d\s\-().]/g,"")}))} placeholder="(240) 000-0000" type="tel" /></div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div><label style={css.label}>Email</label><input style={css.input} value={addForm.email} onChange={e => setAddForm(f => ({...f, email: e.target.value}))} placeholder="jane@email.com" /></div>
                <div>
                  <label style={css.label}>Time Slot *</label>
                  <select style={css.select} value={addSlot} onChange={e => setAddSlot(e.target.value)}>
                    <option value="">— Select —</option>
                    {TIME_SLOTS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={css.label}>Address</label><input style={css.input} value={addForm.address} onChange={e => setAddForm(f => ({...f, address: e.target.value}))} placeholder="123 Main St" /></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
                <div>
                  <label style={css.label}>Home Size</label>
                  <select style={css.select} value={addForm.homeSize} onChange={e => setAddForm(f => ({...f, homeSize: e.target.value}))}>
                    <option value="">— Select —</option>
                    {HOME_SIZES.map(h => <option key={h.label} value={h.label}>{h.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={css.label}>Service Type</label>
                  <select style={css.select} value={addForm.isFirst ? "first" : "recurring"} onChange={e => setAddForm(f => ({...f, isFirst: e.target.value === "first"}))}>
                    <option value="first">Free Estimate / First Cleaning</option>
                    <option value="recurring">Recurring</option>
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}><label style={css.label}>Notes</label><textarea style={{ ...css.input, height: 60, resize: "vertical" }} value={addForm.notes} onChange={e => setAddForm(f => ({...f, notes: e.target.value}))} placeholder="Any special instructions..." /></div>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={handleAdminBook} disabled={!addForm.name || !addSlot} style={{ ...css.tealBtn, flex: 1, opacity: (!addForm.name || !addSlot) ? 0.4 : 1 }}>Save Appointment</button>
                <button onClick={() => setShowAddForm(false)} style={css.outlineBtn}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking detail modal */}
      {selectedB && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200 }} onClick={() => setSelectedB(null)}>
          <div style={{ background: COLORS.white, borderRadius: 14, padding: 28, maxWidth: 460, width: "92%", boxShadow: "0 8px 40px rgba(0,0,0,0.2)", maxHeight: "90vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Georgia', serif", margin: 0, color: COLORS.navy }}>
                {selectedB.isFirst ? "✨ Free Estimate" : "📋 Booking"} Details
              </h3>
              <button onClick={() => setSelectedB(null)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: COLORS.gray }}>✕</button>
            </div>
            <div style={{ display: "grid", gap: 10, fontSize: 14, marginBottom: 20 }}>
              {[
                ["Client", selectedB.name],
                ["Phone", selectedB.phone],
                ["Email", selectedB.email],
                ["Date & Time", `${selectedB.date} @ ${selectedB.slot}`],
                ["Address", selectedB.address],
                ["Home Size", selectedB.homeSize],
                ["Service", selectedB.isFirst ? "Free Estimate — First Cleaning" : `Recurring (${selectedB.recurringFreq})`],
                selectedB.extras?.length > 0 && ["Add-ons", selectedB.extras.join(", ")],
                selectedB.notes && ["Notes", selectedB.notes],
              ].filter(Boolean).map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <span style={{ color: COLORS.gray, minWidth: 90 }}>{k}</span>
                  <span style={{ fontWeight: "bold", flex: 1 }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={css.label}>Assign to Employee</label>
              <select
                style={css.select}
                value={selectedB.assignedTo || ""}
                onChange={e => {
                  const empId = e.target.value ? Number(e.target.value) : null;
                  onAssign(selectedB.id, empId);
                  setSelectedB(prev => ({ ...prev, assignedTo: empId }));
                }}
              >
                <option value="">— Unassigned —</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setSelectedB(null)} style={{ ...css.tealBtn, flex: 1 }}>Close</button>
              <button
                onClick={() => {
                  if (window.confirm(`Remove booking for ${selectedB.name}?`)) {
                    onAssign(selectedB.id, "DELETE");
                    setSelectedB(null);
                  }
                }}
                style={{ background: "transparent", color: COLORS.red, border: `1px solid ${COLORS.red}`, borderRadius: 8, padding: "13px 16px", cursor: "pointer", fontSize: 14 }}
              >🗑</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Admin Dashboard ────────────────────────────────────────────────────────────
function AdminDashboard({ onLogout, bookings, onAssign, onAdminBook }) {
  const [employees, setEmployees] = useState(loadEmployees());
  const [newName, setNewName] = useState("");
  const [newPin, setNewPin] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("estimates");
  const COLORS_LIST = ["#2468C0","#4BAD2E","#4A90D9","#E67E22","#9B59B6","#E74C3C","#1ABC9C","#F39C12"];

  const freeEstimates = bookings.filter(b => b.isFirst);

  function addEmployee() {
    if (!newName.trim()) { setError("Please enter a name."); return; }
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) { setError("PIN must be exactly 6 digits."); return; }
    if (employees.find(e => e.pin === newPin)) { setError("That PIN is already in use. Choose a different one."); return; }
    const updated = [...employees, {
      id: Date.now(),
      name: newName.trim(),
      pin: newPin,
      color: COLORS_LIST[employees.length % COLORS_LIST.length],
    }];
    setEmployees(updated);
    saveEmployees(updated);
    setNewName(""); setNewPin("");
    setError("");
    setSuccess(`✅ ${newName.trim()} added successfully!`);
    setTimeout(() => setSuccess(""), 3000);
  }

  function removeEmployee(id) {
    if (!window.confirm("Remove this employee?")) return;
    const updated = employees.filter(e => e.id !== id);
    setEmployees(updated);
    saveEmployees(updated);
  }

  function changePin(id) {
    const newP = window.prompt("Enter new 6-digit PIN:");
    if (!newP) return;
    if (newP.length !== 6 || !/^\d+$/.test(newP)) { alert("PIN must be exactly 6 digits."); return; }
    if (employees.find(e => e.pin === newP && e.id !== id)) { alert("That PIN is already in use."); return; }
    const updated = employees.map(e => e.id === id ? { ...e, pin: newP } : e);
    setEmployees(updated);
    saveEmployees(updated);
    setSuccess("✅ PIN updated!");
    setTimeout(() => setSuccess(""), 3000);
  }

  const tabStyle = (active) => ({
    flex: 1, padding: "10px 0", textAlign: "center", cursor: "pointer",
    borderBottom: `3px solid ${active ? COLORS.blue : "transparent"}`,
    color: active ? COLORS.blue : COLORS.gray, fontWeight: active ? "bold" : "normal",
    fontSize: 14, background: "none", border: "none", borderBottom: `3px solid ${active ? COLORS.blue : "transparent"}`,
    fontFamily: "inherit",
  });

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "24px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h2 style={{ margin: 0, fontFamily: "'Georgia', serif", color: COLORS.navy }}>🔐 Admin Dashboard</h2>
          <div style={{ color: COLORS.gray, fontSize: 14 }}>Criss Maid Cleaning</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              if (window.confirm("Clear ALL bookings? This cannot be undone.")) {
                localStorage.removeItem("cmc_bookings");
                window.location.reload();
              }
            }}
            style={{ background: "transparent", color: COLORS.gray, border: `1px solid #E5E7EB`, borderRadius: 8, padding: "7px 12px", fontSize: 12, cursor: "pointer" }}
          >🗑 Clear All</button>
          <button onClick={onLogout} style={{ ...css.outlineBtn, color: COLORS.red, borderColor: COLORS.red }}>Log Out</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", background: COLORS.white, borderRadius: 10, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)", overflow: "hidden" }}>
        <button style={tabStyle(activeTab === "estimates")} onClick={() => setActiveTab("estimates")}>
          ✨ Free Estimates {freeEstimates.length > 0 && <span style={{ background: COLORS.blue, color: "#fff", borderRadius: 10, padding: "1px 7px", fontSize: 11, marginLeft: 4 }}>{freeEstimates.length}</span>}
        </button>
        <button style={tabStyle(activeTab === "calendar")} onClick={() => setActiveTab("calendar")}>
          📅 Calendar
        </button>
        <button style={tabStyle(activeTab === "employees")} onClick={() => setActiveTab("employees")}>
          👥 Employees
        </button>
      </div>

      {/* FREE ESTIMATES TAB */}
      {activeTab === "estimates" && (
        <div>
          <div style={css.card}>
            <div style={css.sectionTitle}>Free Estimate Requests</div>
            {freeEstimates.length === 0 ? (
              <div style={{ color: COLORS.gray, fontStyle: "italic" }}>No free estimate requests yet.</div>
            ) : freeEstimates.map(b => {
              const assigned = employees.find(e => e.id === b.assignedTo);
              return (
                <div key={b.id} style={{ padding: "16px 0", borderBottom: "1px solid #F3F4F6" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontWeight: "bold", fontSize: 16 }}>{b.name}</span>
                        {assigned
                          ? <span style={{ background: COLORS.green + "20", color: COLORS.green, border: `1px solid ${COLORS.green}`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: "bold" }}>Assigned to {assigned.name}</span>
                          : <span style={{ background: COLORS.red + "15", color: COLORS.red, border: `1px solid ${COLORS.red}`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: "bold" }}>Unassigned</span>
                        }
                      </div>
                      <div style={{ color: COLORS.gray, fontSize: 13, lineHeight: 1.7 }}>
                        📅 {b.date} @ {b.slot}<br/>
                        📍 {b.address}<br/>
                        🏠 {b.homeSize}<br/>
                        📱 {b.phone} &nbsp;·&nbsp; ✉️ {b.email}
                        {b.notes && <><br/>📝 {b.notes}</>}
                      </div>
                    </div>
                    <div style={{ minWidth: 160 }}>
                      <label style={{ ...css.label, marginBottom: 6 }}>Assign to:</label>
                      <select
                        style={{ ...css.select, fontSize: 13 }}
                        value={b.assignedTo || ""}
                        onChange={e => onAssign(b.id, e.target.value ? Number(e.target.value) : null)}
                      >
                        <option value="">— Unassigned —</option>
                        {employees.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CALENDAR TAB */}
      {activeTab === "calendar" && (
        <div>
          <div style={css.card}>
            <div style={css.sectionTitle}>📅 Full Schedule & Availability</div>
            <div style={{ color: COLORS.gray, fontSize: 14, marginBottom: 20 }}>
              Mon–Fri 8am–6pm. Weekends by quote. Sundays closed. Click a booking to view details.
            </div>
            <AdminCalendarView bookings={bookings} employees={employees} onAssign={onAssign} onAdminBook={onAdminBook} />
            <div style={{ marginTop: 20, display: "flex", gap: 20, flexWrap: "wrap", fontSize: 13 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.green }} /> Free Estimate</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.blue }} /> Regular Booking</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: "50%", background: COLORS.navy }} /> Today</div>
            </div>
          </div>
        </div>
      )}

      {/* EMPLOYEES TAB */}
      {activeTab === "employees" && (
        <div>
          {/* Add Employee */}
          <div style={css.card}>
            <div style={css.sectionTitle}>Add New Employee</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={css.label}>Full Name</label>
                <input style={css.input} value={newName} onChange={e => { setNewName(e.target.value); setError(""); }} placeholder="e.g. Sofia R." />
              </div>
              <div>
                <label style={css.label}>6-Digit PIN</label>
                <input style={css.input} value={newPin} onChange={e => { setNewPin(e.target.value.replace(/\D/g,"")); setError(""); }} placeholder="e.g. 445566" maxLength={6} type="password" />
              </div>
            </div>
            {error && <div style={{ color: COLORS.red, fontSize: 13, marginBottom: 12 }}>{error}</div>}
            {success && <div style={{ color: COLORS.green, fontSize: 13, marginBottom: 12 }}>{success}</div>}
            <button onClick={addEmployee} style={css.tealBtn}>+ Add Employee</button>
          </div>

          {/* Employee List */}
          <div style={css.card}>
            <div style={css.sectionTitle}>Current Employees ({employees.length})</div>
            {employees.length === 0 && <div style={{ color: COLORS.gray, fontStyle: "italic" }}>No employees added yet.</div>}
            {employees.map(emp => (
              <div key={emp.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 0", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: emp.color, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "bold", fontSize: 16, flexShrink: 0 }}>
                  {emp.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold", fontSize: 16 }}>{emp.name}</div>
                  <div style={{ color: COLORS.gray, fontSize: 13 }}>
                    PIN: ••••••
                    &nbsp;·&nbsp;
                    {freeEstimates.filter(b => b.assignedTo === emp.id).length} estimate(s) assigned
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => changePin(emp.id)} style={{ ...css.outlineBtn, padding: "7px 14px", fontSize: 12 }}>Change PIN</button>
                  <button onClick={() => removeEmployee(emp.id)} style={{ background: "transparent", color: COLORS.red, border: `1px solid ${COLORS.red}`, borderRadius: 8, padding: "7px 14px", fontSize: 12, cursor: "pointer" }}>Remove</button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ ...css.card, background: COLORS.lightGray }}>
            <div style={{ fontWeight: "bold", marginBottom: 8, color: COLORS.navy }}>📋 How it works</div>
            <div style={{ fontSize: 14, color: COLORS.gray, lineHeight: 1.7 }}>
              • Add each employee with their name and a unique 6-digit PIN<br/>
              • Give them their PIN privately — they use it to log into the Employee section<br/>
              • You can change or remove their PIN anytime from here<br/>
              • Assign free estimates to employees from the Estimates tab<br/>
              • Employees can only see the schedule — they cannot access this admin area
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Employee Login ─────────────────────────────────────────────────────────────
function EmployeeLogin({ onLogin, onAdminLogin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");
  const [adminError, setAdminError] = useState("");

  function pressKey(k) {
    if (pin.length < 6) setPin(p => p + k);
  }
  function backspace() { setPin(p => p.slice(0, -1)); setError(""); }
  function clear() { setPin(""); setError(""); }

  function handleLogin() {
    const employees = loadEmployees();
    const emp = employees.find(e => e.pin === pin);
    if (emp) {
      localStorage.setItem("cmc_employee", JSON.stringify(emp));
      onLogin(emp);
    } else {
      setError("Incorrect PIN. Please try again.");
      setShake(true);
      setTimeout(() => { setShake(false); setPin(""); setError(""); }, 1200);
    }
  }

  function handleAdminLogin() {
    if (adminPass === ADMIN_PASSWORD) {
      localStorage.setItem("cmc_admin", "true");
      onAdminLogin();
    } else {
      setAdminError("Incorrect password.");
      setAdminPass("");
    }
  }

  const keys = ["1","2","3","4","5","6","7","8","9","C","0","⌫"];

  if (showAdmin) {
    return (
      <div style={{ maxWidth: 360, margin: "60px auto", padding: "0 24px" }}>
        <div style={{ ...css.card, textAlign: "center" }}>
          <div style={{ background: `linear-gradient(135deg, ${COLORS.navyDark}, ${COLORS.navy})`, borderRadius: 10, padding: "20px 0", marginBottom: 24 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
            <div style={{ color: COLORS.white, fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: "bold" }}>Admin Access</div>
            <div style={{ color: COLORS.blueLight, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>Criss Maid Cleaning</div>
          </div>
          <label style={css.label}>Admin Password</label>
          <input
            type="password"
            value={adminPass}
            onChange={e => { setAdminPass(e.target.value); setAdminError(""); }}
            onKeyDown={e => e.key === "Enter" && handleAdminLogin()}
            placeholder="Enter admin password"
            style={{ ...css.input, marginBottom: 12, textAlign: "center", letterSpacing: 4 }}
          />
          {adminError && <div style={{ color: COLORS.red, fontSize: 13, marginBottom: 12 }}>{adminError}</div>}
          <button onClick={handleAdminLogin} style={{ ...css.tealBtn, width: "100%", marginBottom: 12 }}>Access Admin →</button>
          <button onClick={() => { setShowAdmin(false); setAdminPass(""); setAdminError(""); }} style={{ ...css.outlineBtn, width: "100%" }}>← Back to Employee Login</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 360, margin: "60px auto", padding: "0 24px" }}>
      <div style={{ ...css.card, textAlign: "center" }}>
        <div style={{ background: `linear-gradient(135deg, ${COLORS.navyDark}, ${COLORS.navy})`, borderRadius: 10, padding: "20px 0", marginBottom: 24 }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🧹</div>
          <div style={{ color: COLORS.white, fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: "bold" }}>Employee Portal</div>
          <div style={{ color: COLORS.blueLight, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", marginTop: 4 }}>Criss Maid Cleaning</div>
        </div>

        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: COLORS.gray, letterSpacing: 1, textTransform: "uppercase", marginBottom: 16 }}>Enter your 6-digit PIN</div>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 8, animation: shake ? "shake 0.4s ease" : "none" }}>
            {[0,1,2,3,4,5].map(i => (
              <div key={i} style={{ width: 18, height: 18, borderRadius: "50%", background: pin.length > i ? COLORS.blue : "transparent", border: `2px solid ${pin.length > i ? COLORS.blue : "#C5D5EC"}`, transition: "all 0.15s" }} />
            ))}
          </div>
          {error && <div style={{ color: COLORS.red, fontSize: 13, marginBottom: 4 }}>{error}</div>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
          {keys.map(k => (
            <button key={k} onClick={() => { if (k === "⌫") backspace(); else if (k === "C") clear(); else pressKey(k); }}
              style={{ padding: "16px 0", borderRadius: 10, border: `1px solid ${k === "C" ? "#FECACA" : "#C5D5EC"}`, background: k === "C" ? "#FFF5F5" : k === "⌫" ? COLORS.lightGray : COLORS.white, color: k === "C" ? COLORS.red : COLORS.navy, fontSize: k === "⌫" ? 20 : 22, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit", transition: "background 0.1s", boxShadow: "0 1px 4px rgba(26,58,107,0.08)" }}
            >{k}</button>
          ))}
        </div>

        <button onClick={handleLogin} disabled={pin.length < 6} style={{ ...css.tealBtn, width: "100%", opacity: pin.length < 6 ? 0.4 : 1, fontSize: 16, marginBottom: 12 }}>
          Sign In →
        </button>
        <button onClick={() => setShowAdmin(true)} style={{ background: "transparent", border: "none", color: COLORS.gray, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}>
          Admin access
        </button>
      </div>
      <style>{`@keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-6px)} 80%{transform:translateX(6px)} }`}</style>
    </div>
  );
}


// ── EmailJS Config ─────────────────────────────────────────────────────────────
const EMAILJS_PUBLIC_KEY = "xsJ6SE76AVOAqx9Xm";
const EMAILJS_SERVICE_ID = "service_wz55syl";
const EMAILJS_CUSTOMER_TEMPLATE = "template_z2z4o87";
const EMAILJS_BUSINESS_TEMPLATE = "template_3xsrgaj";

async function sendEmails(booking) {
  try {
    // Build extras text
    const allExtras = [...EXTRAS_FIRST, ...EXTRAS_RECURRING];
    const extrasText = booking.extras && booking.extras.length
      ? booking.extras.map(eid => allExtras.find(e => e.id === eid)?.label).filter(Boolean).join(", ")
      : "None";

    const serviceType = booking.isFirst
      ? "Free Estimate — First Cleaning"
      : `Recurring (${booking.recurringFreq})`;

    // Recurring price for business notification only
    const recurObj = RECURRING_PRICES.find(r => r.label === booking.homeSize);
    const recurringPrice = !booking.isFirst && recurObj
      ? `$${recurObj[booking.recurringFreq] || "TBD"} flat rate`
      : "Free Estimate — to be quoted";

    // Load EmailJS if not already loaded
    if (!window.emailjs) {
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }

    // Always init (safe to call multiple times)
    window.emailjs.init(EMAILJS_PUBLIC_KEY);

    // ── Customer email — NO price shown ──────────────────────────────
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_CUSTOMER_TEMPLATE, {
      to_email: booking.email,
      to_name: booking.name,
      customer_name: booking.name,
      customer_email: booking.email,
      customer_phone: booking.phone,
      date: booking.date,
      time: booking.slot,
      address: booking.address,
      home_size: booking.homeSize,
      service_type: serviceType,
      extras: extrasText,
      notes: booking.notes || "None",
      // No price field sent to customer template
    });

    // ── Business notification — full details ─────────────────────────
    await window.emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_BUSINESS_TEMPLATE, {
      to_email: "crissmaidcleaning@gmail.com",
      to_name: "Criss Maid Cleaning",
      customer_name: booking.name,
      customer_email: booking.email,
      customer_phone: booking.phone,
      date: booking.date,
      time: booking.slot,
      address: booking.address,
      home_size: booking.homeSize,
      service_type: serviceType,
      extras: extrasText,
      price: recurringPrice,
      notes: booking.notes || "None",
    });

    console.log("✅ Emails sent successfully!");
  } catch (err) {
    console.error("❌ Email error:", err);
    // Don't block the booking — just log the error
  }
}

// ── Address Autocomplete ────────────────────────────────────────────────────────
function AddressAutocomplete({ value, onChange }) {
  const inputRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const autocompleteService = useRef(null);
  const sessionToken = useRef(null);

  // Load Google Places API
  useEffect(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      setLoaded(true);
      return;
    }
    // Use a free approach without API key — browser native autocomplete fallback
    setLoaded(false);
  }, []);

  function handleInput(e) {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);

    if (!val || val.length < 3) { setSuggestions([]); setShowSuggestions(false); return; }

    // Use Google Places if available, otherwise use Nominatim (free, no key needed)
    if (window.google?.maps?.places) {
      if (!autocompleteService.current) {
        autocompleteService.current = new window.google.maps.places.AutocompleteService();
      }
      if (!sessionToken.current) {
        sessionToken.current = new window.google.maps.places.AutocompleteSessionToken();
      }
      autocompleteService.current.getPlacePredictions(
        { input: val, componentRestrictions: { country: "us" }, sessionToken: sessionToken.current },
        (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions.map(p => p.description));
            setShowSuggestions(true);
          }
        }
      );
    } else {
      // Free fallback: Nominatim OpenStreetMap geocoder
      clearTimeout(window._addrTimeout);
      window._addrTimeout = setTimeout(async () => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=5&q=${encodeURIComponent(val)}`, {
            headers: { "Accept-Language": "en" }
          });
          const data = await res.json();
          if (data && data.length > 0) {
            setSuggestions(data.map(d => d.display_name));
            setShowSuggestions(true);
          }
        } catch { setSuggestions([]); }
      }, 350);
    }
  }

  function selectSuggestion(s) {
    setInputValue(s);
    onChange(s);
    setSuggestions([]);
    setShowSuggestions(false);
  }

  return (
    <div style={{ position: "relative" }}>
      <input
        ref={inputRef}
        style={css.input}
        value={inputValue}
        onChange={handleInput}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        placeholder="Start typing your address..."
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div style={{
          position: "absolute", top: "100%", left: 0, right: 0, zIndex: 999,
          background: COLORS.white, border: `1px solid #C5D5EC`,
          borderRadius: 8, boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
          maxHeight: 220, overflowY: "auto", marginTop: 2,
        }}>
          {suggestions.map((s, i) => (
            <div
              key={i}
              onMouseDown={() => selectSuggestion(s)}
              style={{
                padding: "10px 14px", cursor: "pointer", fontSize: 13,
                borderBottom: i < suggestions.length - 1 ? "1px solid #F3F4F6" : "none",
                display: "flex", alignItems: "center", gap: 8,
              }}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.lightGray}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              <span style={{ color: COLORS.blue, fontSize: 14 }}>📍</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
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
  const [sending, setSending] = useState(false);

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

  async function submit() {
    setSending(true);
    const booking = {
      id: "b" + Date.now(),
      ...form,
      estimatedHours: calcHours(),
      travelMins: 20,
      status: "confirmed",
    };
    onBook(booking);
    await sendEmails(booking);
    setSending(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ ...css.card, textAlign: "center", padding: 48 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>{form.isFirst ? "🎉" : "✅"}</div>
        <h2 style={{ fontFamily: "'Georgia', serif", color: COLORS.blue }}>
          {form.isFirst ? "Free Estimate Scheduled!" : "Booking Confirmed!"}
        </h2>
        <p style={{ color: COLORS.gray }}>
          {form.isFirst
            ? `Thank you, ${form.name}! Your free estimate is scheduled for ${form.date} at ${form.slot}.`
            : `Thank you, ${form.name}! We'll see you on ${form.date} at ${form.slot}.`}
        </p>
        {form.isFirst && (
          <div style={{ background: COLORS.navyDark + "15", border: `1px solid ${COLORS.blueLight}`, borderRadius: 10, padding: 16, marginTop: 16, fontSize: 14, color: COLORS.navy, lineHeight: 1.7 }}>
            <strong>What happens next?</strong><br/>
            We'll assign one of our team members to your estimate and contact you to confirm. They'll assess your home and provide your custom quote — free, no obligation.
          </div>
        )}
        <p style={{ color: COLORS.gray, fontSize: 14, marginTop: 12 }}>A confirmation email has been sent to {form.email}</p>
        {form.extras.includes("silver") && (
          <div style={{ background: COLORS.gold + "33", borderRadius: 8, padding: 14, marginTop: 16, fontSize: 14 }}>
            📞 We'll also contact you soon with a quote for silver cleaning.
          </div>
        )}
        <button onClick={() => { setSubmitted(false); setStep(1); setForm({ name:"",phone:"",email:"",address:"",city:"",notes:"",homeSize:"",crew:2,isFirst:true,recurringFreq:"none",extras:[],date:null,slot:null }); }} style={{ ...css.outlineBtn, marginTop: 24 }}>
          {form.isFirst ? "Schedule Another" : "Book Another"}
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
              <input
                style={css.input}
                value={form.phone}
                onChange={e => {
                  // Only allow digits, spaces, dashes, parentheses
                  const cleaned = e.target.value.replace(/[^\d\s\-().]/g, "");
                  set("phone", cleaned);
                }}
                onKeyDown={e => {
                  // Block any non-numeric key except control keys
                  const allowed = ["Backspace","Delete","Tab","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End","Enter"];
                  if (allowed.includes(e.key)) return;
                  if (!/[\d\s\-().]/.test(e.key)) e.preventDefault();
                }}
                placeholder="(240) 413-4313"
                type="tel"
                inputMode="numeric"
                maxLength={15}
              />
            </div>
          </div>
          <div style={css.formGroup}>
            <label style={css.label}>Email *</label>
            <input style={css.input} value={form.email} onChange={e => set("email", e.target.value)} placeholder="jane@email.com" type="email" />
          </div>
          <div style={css.formGroup}>
            <label style={css.label}>Service Address *</label>
            <AddressAutocomplete value={form.address} onChange={v => set("address", v)} />
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
                <button key={String(v)} onClick={() => { set("isFirst", v); set("extras", []); }} style={{ flex: 1, padding: "10px 0", borderRadius: 8, border: `2px solid ${form.isFirst === v ? COLORS.blue : "#E5E7EB"}`, background: form.isFirst === v ? COLORS.blue + "15" : COLORS.white, color: form.isFirst === v ? COLORS.blue : COLORS.gray, cursor: "pointer", fontFamily: "inherit", fontSize: 14 }}>
                  {v ? "Yes – First cleaning" : "No – Returning client"}
                </button>
              ))}
            </div>
          </div>

          {/* FIRST CLEANING */}
          {form.isFirst && (
            <>
              {/* Free Estimate Hero Banner */}
              <div style={{ background: `linear-gradient(135deg, ${COLORS.navyDark}, ${COLORS.blue})`, borderRadius: 12, padding: "20px 20px", marginBottom: 20, textAlign: "center" }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>✨</div>
                <div style={{ color: COLORS.white, fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: "bold", marginBottom: 4 }}>Schedule Your Free Estimate!</div>
                <div style={{ color: "rgba(255,255,255,0.85)", fontSize: 13, lineHeight: 1.6 }}>
                  Pick a date &amp; time and one of our team members will come assess your home and provide a custom quote — completely free, no obligation.
                </div>
              </div>

              {/* What's included notice */}
              <div style={{ background: COLORS.green + "15", border: `1px solid ${COLORS.green}`, borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ fontWeight: "bold", color: COLORS.green, marginBottom: 6, fontSize: 14 }}>✅ First Cleaning Includes Everything:</div>
                <div style={{ fontSize: 13, color: COLORS.navy, lineHeight: 1.8 }}>
                  • Full deep clean of all rooms<br/>
                  • Fridge (inside &amp; out)<br/>
                  • Oven cleaning<br/>
                  • Crew size determined based on your home<br/>
                  • All standard cleaning tasks
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: COLORS.gray }}>
                  Crew of 2 @ $75/hr &nbsp;|&nbsp; Crew of 3 @ $130/hr — quoted after estimate visit
                </div>
              </div>

              {/* Silver cleaning option */}
              <div style={css.formGroup}>
                <label style={css.label}>Additional Services</label>
                <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", borderRadius: 8, border: `1px solid ${form.extras.includes("silver") ? COLORS.blue : "#E5E7EB"}`, background: form.extras.includes("silver") ? COLORS.blue + "08" : COLORS.white }}>
                  <input type="checkbox" checked={form.extras.includes("silver")} onChange={() => toggleExtra("silver")} />
                  <span style={{ flex: 1 }}>🥄 Silver cleaning</span>
                  <span style={{ color: COLORS.blue, fontWeight: "bold" }}>Quote required</span>
                </label>
                <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 8 }}>
                  🚫 We do not offer laundry services.
                </div>
              </div>

              {/* Free estimate box */}
              <div style={{ background: COLORS.navy, borderRadius: 10, padding: "18px 20px", textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: COLORS.blueLight, marginBottom: 6 }}>
                  Fridge &amp; Oven included · Crew size &amp; total determined at estimate
                </div>
                <div style={{ fontSize: 28, fontWeight: "bold", color: COLORS.green }}>Free Estimate</div>
                <div style={{ fontSize: 13, color: "#AAA", marginTop: 6 }}>We'll contact you to confirm and provide your custom quote.</div>
              </div>
            </>
          )}

          {/* RETURNING CLIENT */}
          {!form.isFirst && (
            <>
              <div style={css.formGroup}>
                <label style={css.label}>Recurring Frequency</label>
                <select style={css.select} value={form.recurringFreq} onChange={e => set("recurringFreq", e.target.value)}>
                  <option value="none">One-time only</option>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* What's NOT included notice */}
              <div style={{ background: "#FFF9F0", border: "1px solid #F39C12", borderRadius: 10, padding: "14px 16px", marginBottom: 20 }}>
                <div style={{ fontWeight: "bold", color: "#E67E22", marginBottom: 6, fontSize: 14 }}>ℹ️ Recurring Flat Rate — Note:</div>
                <div style={{ fontSize: 13, color: COLORS.navy, lineHeight: 1.8 }}>
                  • Your flat rate covers standard cleaning<br/>
                  • Fridge (inside &amp; out): <strong>+$45 extra</strong><br/>
                  • Oven cleaning: <strong>+$45 extra</strong><br/>
                  • Silver cleaning: <strong>Quote required</strong><br/>
                  • 🚫 We do not offer laundry services
                </div>
              </div>

              <div style={css.formGroup}>
                <label style={css.label}>Add-on Services (optional)</label>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {EXTRAS_RECURRING.map(ex => (
                    <label key={ex.id} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", borderRadius: 8, border: `1px solid ${form.extras.includes(ex.id) ? COLORS.blue : "#E5E7EB"}`, background: form.extras.includes(ex.id) ? COLORS.blue + "08" : COLORS.white }}>
                      <input type="checkbox" checked={form.extras.includes(ex.id)} onChange={() => toggleExtra(ex.id)} />
                      <span style={{ flex: 1 }}>{ex.label}</span>
                      <span style={{ color: COLORS.blue, fontWeight: "bold" }}>{ex.quote ? "Quote required" : `+$${ex.price}`}</span>
                    </label>
                  ))}
                </div>
              </div>

              <PricingEstimate homeSize={form.homeSize} crew={form.crew} isFirst={form.isFirst} extras={form.extras} recurringFreq={form.recurringFreq} />
            </>
          )}
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
          <div style={css.sectionTitle}>{form.isFirst ? "Review Your Free Estimate Request" : "Review Your Booking"}</div>
          {form.isFirst && (
            <div style={{ background: `linear-gradient(135deg, ${COLORS.navyDark}, ${COLORS.blue})`, borderRadius: 10, padding: "14px 18px", marginBottom: 20, textAlign: "center" }}>
              <div style={{ color: COLORS.white, fontWeight: "bold", fontSize: 16 }}>✨ Free Estimate Appointment</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 }}>A team member will be assigned and contact you to confirm.</div>
            </div>
          )}
          <div style={{ display: "grid", gap: 10, marginBottom: 24 }}>
            {[
              ["Name", form.name], ["Phone", form.phone], ["Email", form.email],
              ["Address", form.address], ["Home Size", form.homeSize],
              !form.isFirst && ["Service", `Recurring – ${form.recurringFreq}`],
              ["Date", form.date], ["Time", form.slot],
              form.extras.length > 0 && ["Add-ons", form.extras.join(", ")],
              form.notes && ["Notes", form.notes],
            ].filter(Boolean).map(([k, v]) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6", fontSize: 14 }}>
                <span style={{ color: COLORS.gray }}>{k}</span>
                <span style={{ fontWeight: "bold", textAlign: "right", maxWidth: "60%" }}>{v}</span>
              </div>
            ))}
          </div>
          {form.isFirst ? (
            <div style={{ background: COLORS.navy, borderRadius: 10, padding: "16px 20px", textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 26, fontWeight: "bold", color: COLORS.green }}>Free Estimate</div>
              <div style={{ fontSize: 13, color: "#AAA", marginTop: 4 }}>Crew size &amp; total quoted after our visit. Fridge &amp; oven included in first cleaning.</div>
            </div>
          ) : (
            <PricingEstimate homeSize={form.homeSize} crew={form.crew} isFirst={form.isFirst} extras={form.extras} recurringFreq={form.recurringFreq} />
          )}
          <div style={{ fontSize: 13, color: COLORS.gray, marginTop: 12 }}>By submitting you agree to our cancellation policy: 24h notice required for rescheduling.</div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
        {step > 1 ? <button onClick={() => setStep(s => s-1)} style={css.outlineBtn}>← Back</button> : <div />}
        {step < 4
          ? <button onClick={() => setStep(s => s+1)} disabled={!canNext()} style={{ ...css.tealBtn, opacity: canNext() ? 1 : 0.4 }}>Next →</button>
          : <button onClick={submit} disabled={sending} style={{ ...css.tealBtn, opacity: sending ? 0.7 : 1 }}>{sending ? "Sending..." : form.isFirst ? "Schedule Free Estimate ✓" : "Confirm Booking ✓"}</button>
        }
      </div>
    </div>
  );
}

// ── Pricing Page ───────────────────────────────────────────────────────────────
function PricingPage() {
  return (
    <div style={css.section}>

      {/* First Cleaning */}
      <div style={css.card}>
        <div style={css.sectionTitle}>First Cleaning — Free Estimate</div>
        <div style={{ background: COLORS.green + "12", border: `1px solid ${COLORS.green}`, borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ fontWeight: "bold", color: COLORS.green, marginBottom: 6 }}>✅ First Cleaning Includes Everything:</div>
          <div style={{ fontSize: 14, color: COLORS.navy, lineHeight: 1.8 }}>
            • Full deep clean of all rooms<br/>
            • Fridge (inside &amp; out) — included at no extra charge<br/>
            • Oven cleaning — included at no extra charge<br/>
            • All standard cleaning tasks<br/>
            • Silver cleaning available by quote (additional)
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ background: COLORS.navy, color: COLORS.white }}>
                <th style={{ padding: "12px 16px", textAlign: "left" }}>Home Size</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>Sq Ft</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>2-Person ($75/hr)</th>
                <th style={{ padding: "12px 16px", textAlign: "center" }}>3-Person ($130/hr)</th>
              </tr>
            </thead>
            <tbody>
              {HOME_SIZES.map((h, i) => (
                <tr key={h.label} style={{ background: i % 2 === 0 ? COLORS.white : COLORS.lightGray }}>
                  <td style={{ padding: "11px 16px", fontWeight: "bold" }}>{h.label}</td>
                  <td style={{ padding: "11px 16px", textAlign: "center", color: COLORS.gray }}>{h.sqft}</td>
                  <td style={{ padding: "11px 16px", textAlign: "center", color: COLORS.blue, fontWeight: "bold" }}>~${Math.round(h.crew2h * 75)}*</td>
                  <td style={{ padding: "11px 16px", textAlign: "center", color: COLORS.blue, fontWeight: "bold" }}>~${Math.round(h.crew3h * 130)}*</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 10 }}>
          * Estimates only — exact total quoted after free in-home assessment. Crew size and hours may vary.
        </div>
      </div>

      {/* Recurring */}
      <div style={css.card}>
        <div style={css.sectionTitle}>Recurring Cleaning — Flat Rates</div>
        <div style={{ background: "#FFF9F0", border: "1px solid #F39C12", borderRadius: 10, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ fontWeight: "bold", color: "#E67E22", marginBottom: 6 }}>ℹ️ Recurring Rate Does Not Include:</div>
          <div style={{ fontSize: 14, color: COLORS.navy, lineHeight: 1.8 }}>
            • Fridge (inside &amp; out) — <strong>+$45</strong> if requested<br/>
            • Oven cleaning — <strong>+$45</strong> if requested<br/>
            • Silver cleaning — <strong>Quote required</strong><br/>
            • 🚫 Laundry services are not available
          </div>
        </div>
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

      {/* Add-ons */}
      <div style={css.card}>
        <div style={css.sectionTitle}>Add-On Services (Recurring Clients)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 16 }}>
          <div style={{ border: `1px solid #E5E7EB`, borderRadius: 10, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🧊</div>
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>Fridge (inside &amp; out)</div>
            <div style={{ color: COLORS.blue, fontSize: 22, fontWeight: "bold" }}>$45</div>
            <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 4 }}>Included in first cleaning</div>
          </div>
          <div style={{ border: `1px solid #E5E7EB`, borderRadius: 10, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔥</div>
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>Oven cleaning</div>
            <div style={{ color: COLORS.blue, fontSize: 22, fontWeight: "bold" }}>$45</div>
            <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 4 }}>Included in first cleaning</div>
          </div>
          <div style={{ border: `1px solid #E5E7EB`, borderRadius: 10, padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🥄</div>
            <div style={{ fontWeight: "bold", marginBottom: 4 }}>Silver cleaning</div>
            <div style={{ color: COLORS.blue, fontSize: 18, fontWeight: "bold" }}>Call for Quote</div>
            <div style={{ fontSize: 12, color: COLORS.gray, marginTop: 4 }}>All clients</div>
          </div>
          <div style={{ border: `1px solid #E5E7EB`, borderRadius: 10, padding: 20, textAlign: "center", background: "#FFF9F9" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🚫</div>
            <div style={{ fontWeight: "bold", color: COLORS.gray, marginBottom: 4 }}>Laundry</div>
            <div style={{ color: COLORS.red, fontSize: 14 }}>Not Available</div>
          </div>
        </div>
      </div>

      <div style={{ ...css.card, background: COLORS.navy, color: COLORS.white }}>
        <div style={{ fontSize: 18, fontFamily: "'Georgia', serif", marginBottom: 8, color: COLORS.greenLight }}>📞 Get Your Free Estimate</div>
        <p style={{ color: "#DDD", marginBottom: 16, fontSize: 14 }}>First cleaning totals and silver cleaning are always quoted. Contact us and we'll give you a personalized quote at no charge.</p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <div style={{ color: COLORS.blueLight }}>📱 (240) 413-4313</div>
          <div style={{ color: COLORS.blueLight }}>📱 (301) 768-1371</div>
          <div style={{ color: COLORS.blueLight }}>✉️ crissmaidcleaning@gmail.com</div>
        </div>
      </div>
    </div>
  );
}

// ── About Page ─────────────────────────────────────────────────────────────────
function AboutPage({ onBook }) {
  return (
    <div>
      {/* Hero banner */}
      <div style={{ background: `linear-gradient(135deg, ${COLORS.navyDark} 0%, ${COLORS.navy} 100%)`, padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 52, marginBottom: 12 }}>👩‍👦</div>
        <h1 style={{ fontFamily: "'Georgia', serif", color: COLORS.white, fontSize: 28, margin: "0 0 10px" }}>About Criss Maid Cleaning</h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 16, maxWidth: 500, margin: "0 auto 16px" }}>
          A family business built on trust, dedication, and over 30 years of experience.
        </p>
        <div style={{ display: "inline-flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ background: "rgba(255,255,255,0.15)", color: COLORS.white, borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: "bold" }}>📍 Maryland</span>
          <span style={{ background: "rgba(255,255,255,0.15)", color: COLORS.white, borderRadius: 20, padding: "6px 16px", fontSize: 13, fontWeight: "bold" }}>📍 Washington D.C.</span>
        </div>
      </div>

      <div style={css.section}>

        {/* Our Story */}
        <div style={css.card}>
          <div style={css.sectionTitle}>Our Story</div>
          <div style={{ fontSize: 15, color: "#444", lineHeight: 1.9 }}>
            <p style={{ marginBottom: 16 }}>
              Criss Maid Cleaning was born from a simple belief: every home deserves to be treated with care, attention, and respect. What started as a passion became a calling — and today it's a family legacy.
            </p>
            <p style={{ marginBottom: 16 }}>
              At the heart of our business is <strong>Cristela</strong>, a mother with over <strong>30 years of professional cleaning experience</strong>. For three decades, she has walked into homes and transformed them — not just cleaning surfaces, but bringing a sense of comfort and pride back to the spaces families live in.
            </p>
            <p>
              Joining her is her son Alexi, who brings the business side and scheduling together so that Cristela can focus on what she does best: delivering an exceptional clean every single time. Together, they built Criss Maid Cleaning to offer the warmth of a family business with the professionalism of an expert service — proudly serving homes across <strong>Maryland and Washington D.C.</strong>
            </p>
          </div>
        </div>

        {/* Meet the Team */}
        <div style={css.card}>
          <div style={css.sectionTitle}>Meet the Team</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>

            {/* Cristela */}
            <div style={{ textAlign: "center", padding: "20px 16px", borderRadius: 12, background: COLORS.lightGray }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: `4px solid ${COLORS.white}`, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                <img src="/cristela.jpg" alt="Cristela" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
              </div>
              <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 20, color: COLORS.navy, margin: "0 0 4px" }}>Cristela</h3>
              <div style={{ color: COLORS.blue, fontSize: 13, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Founder & Lead Cleaner</div>
              <div style={{ color: COLORS.gray, fontSize: 14, lineHeight: 1.7 }}>
                With over <strong>30 years of experience</strong>, Cristela is the heart and soul of Criss Maid Cleaning. Her attention to detail, reliability, and genuine care for every home she enters is what sets us apart. She treats your home like her own.
              </div>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 8 }}>
                <span style={{ background: COLORS.blue + "15", color: COLORS.blue, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: "bold" }}>30+ Years Experience</span>
              </div>
            </div>

            {/* Son — placeholder name */}
            <div style={{ textAlign: "center", padding: "20px 16px", borderRadius: 12, background: COLORS.lightGray }}>
              <div style={{ width: 100, height: 100, borderRadius: "50%", overflow: "hidden", margin: "0 auto 16px", border: `4px solid ${COLORS.white}`, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
                <img src="/alexi.jpg" alt="Alexi" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
              </div>
              <h3 style={{ fontFamily: "'Georgia', serif", fontSize: 20, color: COLORS.navy, margin: "0 0 4px" }}>Alexi</h3>
              <div style={{ color: COLORS.green, fontSize: 13, fontWeight: "bold", letterSpacing: 1, textTransform: "uppercase", marginBottom: 12 }}>Co-Founder & Operations</div>
              <div style={{ color: COLORS.gray, fontSize: 14, lineHeight: 1.7 }}>
                Handling scheduling, customer relations, and operations, Alexi ensures every client gets a seamless experience from first booking to final walkthrough. Family-run means you're always talking to someone who cares.
              </div>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "center", gap: 8 }}>
                <span style={{ background: COLORS.green + "15", color: COLORS.green, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: "bold" }}>Family Owned</span>
              </div>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div style={css.card}>
          <div style={css.sectionTitle}>Why Choose Criss Maid Cleaning?</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
            {[
              { icon: "🏆", title: "30+ Years Experience", desc: "Cristela has been perfecting her craft for over three decades. Experience you can see in every corner." },
              { icon: "👨‍👩‍👦", title: "Family Owned", desc: "We're not a franchise. You're hiring real people who take pride in every home they clean." },
              { icon: "✅", title: "First Clean Guarantee", desc: "Your first cleaning includes everything — fridge, oven, full deep clean. We set the standard from day one." },
              { icon: "💬", title: "Always Reachable", desc: "Call or text us directly. No call centers, no bots. Just Cristela and her son ready to help." },
              { icon: "🔒", title: "Trusted & Reliable", desc: "We show up when we say we will. Your schedule matters to us as much as it matters to you." },
              { icon: "✨", title: "Attention to Detail", desc: "No corner is overlooked. We clean the way we'd want our own home cleaned — thoroughly and with care." },
            ].map(f => (
              <div key={f.title} style={{ padding: "18px 16px", borderRadius: 10, border: `1px solid #E5E7EB`, background: COLORS.white }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontWeight: "bold", fontSize: 14, color: COLORS.navy, marginBottom: 6 }}>{f.title}</div>
                <div style={{ color: COLORS.gray, fontSize: 13, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Service Area */}
        <div style={css.card}>
          <div style={css.sectionTitle}>📍 Areas We Serve</div>
          <div style={{ fontSize: 15, color: COLORS.gray, marginBottom: 20 }}>
            Criss Maid Cleaning is proud to serve homeowners and families across:
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 16 }}>
            <div style={{ background: COLORS.navyDark, borderRadius: 12, padding: "24px 20px", textAlign: "center", color: COLORS.white }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🏛️</div>
              <div style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: "bold", marginBottom: 6 }}>Washington D.C.</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>The nation's capital and surrounding areas</div>
            </div>
            <div style={{ background: COLORS.blue, borderRadius: 12, padding: "24px 20px", textAlign: "center", color: COLORS.white }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🌿</div>
              <div style={{ fontFamily: "'Georgia', serif", fontSize: 18, fontWeight: "bold", marginBottom: 6 }}>Maryland</div>
              <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>Residential homes throughout the state</div>
            </div>
          </div>
          <div style={{ marginTop: 16, padding: "12px 16px", background: COLORS.lightGray, borderRadius: 8, fontSize: 13, color: COLORS.gray }}>
            📞 Not sure if we serve your area? Give us a call at <strong>(240) 413-4313</strong> or <strong>(301) 768-1371</strong> and we'll let you know!
          </div>
        </div>

        {/* Values */}
        <div style={{ ...css.card, background: COLORS.navyDark, color: COLORS.white }}>
          <div style={{ fontSize: 18, fontFamily: "'Georgia', serif", marginBottom: 16, color: COLORS.gold }}>💛 Our Values</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 16, textAlign: "center" }}>
            {[["Integrity","We do what we say."],["Respect","Your home is sacred to us."],["Excellence","Good enough is never enough."],["Family","We treat clients like neighbors."]].map(([v, d]) => (
              <div key={v}>
                <div style={{ fontWeight: "bold", fontSize: 16, color: COLORS.gold, marginBottom: 4 }}>{v}</div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
          <div style={{ fontFamily: "'Georgia', serif", fontSize: 22, color: COLORS.navy, marginBottom: 12 }}>Ready to experience the Criss Maid difference?</div>
          <div style={{ color: COLORS.gray, fontSize: 14, marginBottom: 24 }}>Your first cleaning includes everything. Schedule your free estimate today — no obligation.</div>
          <button onClick={onBook} style={{ ...css.heroBtn, fontSize: 16 }}>Schedule Your Free Estimate →</button>
        </div>

      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [bookings, setBookings] = useState(loadBookings);
  const [employee, setEmployee] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [toast, setToast] = useState(null);

  // Save bookings to localStorage whenever they change
  useEffect(() => {
    saveBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    const saved = localStorage.getItem("cmc_employee");
    if (saved) { try { setEmployee(JSON.parse(saved)); } catch {} }
    const admin = localStorage.getItem("cmc_admin");
    if (admin === "true") setIsAdmin(true);
  }, []);

  function handleBook(b) {
    setBookings(prev => {
      const updated = [...prev, b];
      saveBookings(updated);
      return updated;
    });
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

  function handleAdminLogin() {
    setIsAdmin(true);
    setPage("employee");
    showToast("Welcome, Admin! 🔐");
  }

  function handleLogout() {
    localStorage.removeItem("cmc_employee");
    localStorage.removeItem("cmc_admin");
    setEmployee(null);
    setIsAdmin(false);
    setPage("home");
  }

  function handleAssign(bookingId, employeeId) {
    setBookings(prev => {
      const updated = employeeId === "DELETE"
        ? prev.filter(b => b.id !== bookingId)
        : prev.map(b => b.id === bookingId ? { ...b, assignedTo: employeeId } : b);
      saveBookings(updated);
      return updated;
    });
  }

  function handleAdminBook(b) {
    setBookings(prev => {
      const updated = [...prev, b];
      saveBookings(updated);
      return updated;
    });
    showToast(`✅ ${b.name} scheduled for ${b.date}`);
  }

  // Admin dashboard view
  if (page === "employee" && isAdmin) {
    return (
      <div style={css.app}>
        <header style={{ ...css.header, flexDirection: "row", justifyContent: "space-between", padding: "12px 20px", background: COLORS.navyDark }}>
          <img src="/logo.png" alt="Criss Maid Cleaning" style={{ height: 40, objectFit: "contain" }} />
          <div style={{ color: COLORS.gold, fontSize: 13, fontWeight: "bold" }}>🔐 Admin</div>
        </header>
        <AdminDashboard onLogout={handleLogout} bookings={bookings} onAssign={handleAssign} onAdminBook={handleAdminBook} />
        {toast && <div style={css.toast}>{toast}</div>}
      </div>
    );
  }

  // Employee schedule view
  if (page === "employee" && employee) {
    return (
      <div style={css.app}>
        <header style={{ ...css.header, flexDirection: "row", justifyContent: "space-between", padding: "12px 20px", background: COLORS.navyDark }}>
          <img src="/logo.png" alt="Criss Maid Cleaning" style={{ height: 40, objectFit: "contain" }} />
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>👋 {employee.name}</div>
        </header>
        <EmployeeSchedule bookings={bookings} employee={employee} onLogout={handleLogout} />
        {toast && <div style={css.toast}>{toast}</div>}
      </div>
    );
  }

  // Employee login view
  if (page === "employee" && !employee && !isAdmin) {
    return (
      <div style={css.app}>
        <header style={{ ...css.header, flexDirection: "row", justifyContent: "space-between", padding: "12px 20px", background: COLORS.navyDark }}>
          <img src="/logo.png" alt="Criss Maid Cleaning" style={{ height: 40, objectFit: "contain" }} />
          <button onClick={() => setPage("home")} style={{ ...css.navBtn(false), fontSize: 12 }}>← Back</button>
        </header>
        <EmployeeLogin onLogin={handleLogin} onAdminLogin={handleAdminLogin} />
        {toast && <div style={css.toast}>{toast}</div>}
      </div>
    );
  }

  return (
    <div style={css.app}>
      {/* Header — nav only, no calendar */}
      <header style={{ ...css.header, background: COLORS.navyDark, padding: "10px 16px" }}>
        <nav style={{ ...css.nav, background: "transparent", padding: 0 }}>
          {[["home","Home"],["book","Book Now"],["pricing","Pricing"],["about","About"],["employee","Employee"]].map(([k,l]) => (
            <button key={k} onClick={() => setPage(k)} style={css.navBtn(page === k)}>{l}</button>
          ))}
        </nav>
      </header>

      {/* Home */}
      {page === "home" && (
        <>
          <div style={css.hero}>
            <img src="/logo.png" alt="Criss Maid Cleaning" style={{ width: "85%", maxWidth: 380, objectFit: "contain", marginBottom: 16, mixBlendMode: "screen" }} />
            <p style={{ ...css.heroSub, color: COLORS.white, fontWeight: "bold", fontSize: 17, letterSpacing: 2 }}>Professional · Reliable · Spotless</p>
            <button onClick={() => setPage("book")} style={css.heroBtn}>Book a Cleaning →</button>
          </div>

          <div style={css.section}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 20, marginBottom: 32 }}>
              {[
                { icon: "🏠", title: "All Home Sizes", desc: "From studios to 5+ bedroom homes. First cleaning & recurring options." },
                { icon: "👥", title: "2 or 3-Person Crews", desc: "$75/hr for 2 people, $130/hr for 3. Faster, more thorough cleaning." },
                { icon: "📅", title: "Easy Scheduling", desc: "Book online in minutes. Schedule your free estimate today." },
                { icon: "⭐", title: "Add-On Services", desc: "Recurring clients can add fridge & oven cleaning for $45 each. Silver cleaning quoted separately." },
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
                <div style={{ color: COLORS.gray, fontSize: 14 }}>Book online in minutes. We'll reach out to confirm your appointment and provide your custom quote.</div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button onClick={() => setPage("book")} style={css.tealBtn}>Book Now</button>
                <button onClick={() => setPage("pricing")} style={css.outlineBtn}>See Pricing</button>
              </div>
            </div>

            {/* About teaser */}
            <div style={{ ...css.card, background: COLORS.navyDark, color: COLORS.white, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
              <div style={{ fontSize: 52 }}>👩‍👦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Georgia', serif", fontSize: 20, marginBottom: 8, color: COLORS.white }}>A Family You Can Trust</div>
                <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, lineHeight: 1.6 }}>
                  Criss Maid Cleaning is a mother-and-son business built on over 30 years of experience. Cristela has dedicated her career to making homes shine — proudly serving Maryland and Washington D.C.
                </div>
                <button onClick={() => setPage("about")} style={{ ...css.heroBtn, marginTop: 16, padding: "10px 24px", fontSize: 14 }}>Meet the Team →</button>
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

      {page === "about" && <AboutPage onBook={() => setPage("book")} />}

      {/* Footer */}
      <footer style={{ background: COLORS.navy, color: "#AAA", textAlign: "center", padding: "32px 24px", fontSize: 13 }}>
        <div style={{ color: COLORS.white, fontFamily: "'Georgia', serif", fontSize: 18, marginBottom: 8 }}>Criss Maid Cleaning</div>
        <div>📱 (240) 413-4313 &nbsp;·&nbsp; 📱 (301) 768-1371 &nbsp;·&nbsp; ✉️ crissmaidcleaning@gmail.com</div>
        <div style={{ marginTop: 8 }}>Mon–Fri · 8:00 AM – 6:00 PM &nbsp;|&nbsp; Weekends: Call for Quote</div>
        <div style={{ marginTop: 8, color: COLORS.blueLight }}>📍 Serving Maryland & Washington D.C.</div>
        <div style={{ marginTop: 16, color: "#555", fontSize: 12 }}>© 2026 Criss Maid Cleaning. All rights reserved.</div>
      </footer>

      {toast && <div style={css.toast}>{toast}</div>}
    </div>
  );
}
