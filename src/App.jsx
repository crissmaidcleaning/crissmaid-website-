import React, { useState, useEffect, useRef } from "react";

// ── Supabase ──────────────────────────────────────────────────────────────────
const SB_URL = "https://ziltitzwqbyitxwcqgke.supabase.co";
const SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InppbHRpdHp3cWJ5aXR4d2NxZ2tlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI1MTQ3MDUsImV4cCI6MjA5ODA5MDcwNX0.Yy1KH1zFt5l6nr1oy5cyUYYzo8ZRlOI1ThhnlN3yFjI";

async function sbFetch(path, options={}) {
  try {
    const res = await fetch(`${SB_URL}/rest/v1${path}`, {
      ...options,
      headers: {
        "apikey": SB_KEY,
        "Authorization": `Bearer ${SB_KEY}`,
        "Content-Type": "application/json",
        "Prefer": options.prefer || "return=representation",
        ...options.headers,
      },
    });
    if (!res.ok) { const e = await res.text(); console.error("Supabase error:", e); return null; }
    const text = await res.text();
    return text ? JSON.parse(text) : [];
  } catch(e) { console.error("Supabase fetch error:", e); return null; }
}

async function sbGetBookings() {
  const data = await sbFetch("/bookings?select=*&order=created_at.desc");
  return data ? data.map(r => ({ ...r.data, id: r.id, _created: r.created_at })) : null;
}

async function sbSaveBooking(b) {
  await sbFetch("/bookings", { method: "POST", prefer: "return=minimal",
    body: JSON.stringify({ id: b.id, data: b, created_at: b.createdAt || new Date().toISOString() }) });
}

async function sbUpdateBooking(b) {
  await sbFetch(`/bookings?id=eq.${b.id}`, { method: "PATCH", prefer: "return=minimal",
    body: JSON.stringify({ data: b }) });
}

async function sbDeleteBooking(id) {
  await sbFetch(`/bookings?id=eq.${id}`, { method: "DELETE", prefer: "return=minimal" });
}

async function sbGetSettings(key) {
  const data = await sbFetch(`/settings?key=eq.${key}&select=value`);
  return data && data.length > 0 ? data[0].value : null;
}

async function sbSaveSettings(key, value) {
  await sbFetch("/settings", { method: "POST",
    headers: { "Prefer": "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ key, value }) });
}

// ── Config ────────────────────────────────────────────────────────────────────
const ADMIN_PASSWORD = "CrissMaid2024!";
const PROMO_CODE = "FIRSTCLEAN20";
const EJS_KEY = "xsJ6SE76AVOAqx9Xm", EJS_SVC = "service_wz55syl";
const EJS_CUST = "template_z2z4o87", EJS_BIZ = "template_3xsrgaj";

// ── Colors ────────────────────────────────────────────────────────────────────
const C = {
  navy:"#1A3A6B", navyDark:"#1C4B9B", blue:"#2468C0",
  blueLight:"#6aaee8", green:"#4BAD2E", greenLight:"#6DC94E",
  cream:"#F4F8FF", white:"#FFFFFF", gray:"#6B7280",
  light:"#EDF2FB", red:"#EF4444", gold:"#F4D35E", orange:"#F39C12",
};

// ── Data ──────────────────────────────────────────────────────────────────────
const HOME_SIZES = [
  {label:"Studio / 1BR",sqft:"< 800 sq ft"},{label:"2 Bedroom",sqft:"800–1,200 sq ft"},
  {label:"3 Bedroom",sqft:"1,200–1,800 sq ft"},{label:"4 Bedroom",sqft:"1,800–2,500 sq ft"},
  {label:"5+ Bedroom",sqft:"> 2,500 sq ft"},{label:"Apartment Hallways",sqft:"Common areas"},
  {label:"Office/Commercial",sqft:"Commercial space"},
];
const EXTRAS_RECURRING = [
  {id:"fridge",label:"Fridge (inside & out)",price:45},
  {id:"oven",label:"Oven cleaning",price:45},
  {id:"silver",label:"Silver cleaning",price:null,quote:true},
];
const ALL_SLOTS = ["8:00 AM","9:00 AM","10:00 AM","11:00 AM","12:00 PM","1:00 PM","2:00 PM","3:00 PM","4:00 PM","5:00 PM"];
const SLOT_HOURS = {"8:00 AM":8,"9:00 AM":9,"10:00 AM":10,"11:00 AM":11,"12:00 PM":12,"1:00 PM":13,"2:00 PM":14,"3:00 PM":15,"4:00 PM":16,"5:00 PM":17};
const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const RECUR_OPTIONS = [{v:"none",l:"One-time"},{v:"weekly",l:"Every Week"},{v:"biweekly",l:"Every 2 Weeks"},{v:"monthly",l:"Every Month"},{v:"3xweek",l:"3x Per Week"}];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDaysInMonth(y,m){return new Date(y,m+1,0).getDate();}
function getFirstDay(y,m){return new Date(y,m,1).getDay();}
function pad(n){return String(n).padStart(2,"0");}
function dateKey(y,m,d){return `${y}-${pad(m+1)}-${pad(d)}`;}
function todayObj(){const t=new Date();return{y:t.getFullYear(),m:t.getMonth(),d:t.getDate()};}
function addDays(dk,n){const d=new Date(dk);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10);}

// Generate recurring booking dates from a base booking
function generateRecurringDates(baseBooking, count=12) {
  if (!baseBooking.recurrence || baseBooking.recurrence === "none") return [];
  const dates = [];
  let current = baseBooking.date;
  for (let i = 0; i < count; i++) {
    let next;
    if (baseBooking.recurrence === "weekly") next = addDays(current, 7);
    else if (baseBooking.recurrence === "biweekly") next = addDays(current, 14);
    else if (baseBooking.recurrence === "monthly") next = addDays(current, 30);
    else if (baseBooking.recurrence === "3xweek") next = addDays(current, 2);
    else break;
    dates.push(next);
    current = next;
  }
  return dates;
}

// ── Storage ───────────────────────────────────────────────────────────────────
function safeGet(k){try{return localStorage.getItem(k);}catch{return null;}}
function safeSet(k,v){try{localStorage.setItem(k,v);}catch{}}
function safeRemove(k){try{localStorage.removeItem(k);}catch{}}
function loadBookings(){try{const s=safeGet("cmc_bookings");return s?JSON.parse(s):[];}catch{return[];}}
function saveBookings(l){safeSet("cmc_bookings",JSON.stringify(l));}
function loadBlocked(){try{const s=safeGet("cmc_blocked");return s?JSON.parse(s):{days:[],slots:{},closedWeekdays:[],hourBlocks:{}};}catch{return{days:[],slots:{},closedWeekdays:[],hourBlocks:{}};}}
function saveBlocked(d){safeSet("cmc_blocked",JSON.stringify(d));}
function loadEmployees(){try{const s=safeGet("cmc_employees");return s?JSON.parse(s):[];}catch{return[];}}
function saveEmployees(l){safeSet("cmc_employees",JSON.stringify(l));}
function loadLeads(){try{const s=safeGet("cmc_leads");return s?JSON.parse(s):[];}catch{return[];}}
function saveLeads(l){safeSet("cmc_leads",JSON.stringify(l));}
function loadReceipts(){try{const s=safeGet("cmc_receipts");return s?JSON.parse(s):[];}catch{return[];}}
function saveReceipts(l){safeSet("cmc_receipts",JSON.stringify(l));}

// ── Email ─────────────────────────────────────────────────────────────────────
async function sendEmails(b){
  try{
    if(!window.emailjs){await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
    window.emailjs.init(EJS_KEY);
    const extras=(b.extras||[]).map(id=>EXTRAS_RECURRING.find(e=>e.id===id)?.label).filter(Boolean).join(", ")||"None";
    const svc=b.isFirst?"Free Estimate — First Cleaning":`Recurring (${b.recurrence||b.recurringFreq||"one-time"})`;
    const base={customer_name:b.name,customer_email:b.email,customer_phone:b.phone,date:b.date,time:b.slot,address:b.address,home_size:b.homeSize,service_type:svc,extras,notes:b.notes||"None"};
    if(b.email)await window.emailjs.send(EJS_SVC,EJS_CUST,{...base,to_email:b.email,to_name:b.name});
    await window.emailjs.send(EJS_SVC,EJS_BIZ,{...base,to_email:"crissmaidcleaning@gmail.com",to_name:"Criss Maid Cleaning",price:b.isFirst?"Free Estimate":"Flat rate TBD"});
  }catch(e){console.error("Email:",e);}
}

// ── Service area ──────────────────────────────────────────────────────────────
function checkArea(addr){
  if(!addr||addr.length<6)return null;
  const u=addr.toUpperCase();
  const md=[/\bMARYLAND\b/,/,\s*MD\b/,/\bMD\s*\d{5}/,/ MD,/,/\bROCKVILLE\b/,/\bGAITHERSBURG\b/,/\bSILVER SPRING\b/,/\bBETHESDA\b/,/\bCHEVY CHASE\b/,/\bGREENBELT\b/,/\bCOLLEGE PARK\b/,/\bHYATTSVILLE\b/,/\bGERMANTOWN\b/,/\bCLARKSBURG\b/,/\bOLNEY\b/,/\bPOTOMAC\b/,/\bNORTH BETHESDA\b/,/\bWHEATON\b/,/\bKENSINGTON\b/,/\bTAKOMA PARK\b/,/\bLANHAM\b/,/\bBALTIMORE\b/,/\bANNAPOLIS\b/,/\bFREDERICK\b/,/\bBOWIE\b/,/\bLAUREL\b/,/\bCLINTON\b/,/\bSUITLAND\b/,/\bOXON HILL\b/,/\bFORT WASHINGTON\b/,/\bMONTGOMERY COUNTY\b/,/\bPRINCE GEORGE/];
  const dc=[/\bWASHINGTON,?\s*D\.?C\.?/,/,\s*DC\b/,/\bDC\s*\d{5}/,/\bCAPITOL HILL\b/,/\bDUPONT CIRCLE\b/,/\bGEORGETOWN\b/,/\bANACOSTIA\b/,/\bCOLUMBIA HEIGHTS\b/,/\bADAMS MORGAN\b/,/\bPETWORTH\b/];
  return md.some(p=>p.test(u))||dc.some(p=>p.test(u));
}

// ── Slot blocking logic ───────────────────────────────────────────────────────
function getSlotsBlockedByBooking(slot, durationHours=2) {
  // Returns all slots that fall within durationHours after the given slot
  const startH = SLOT_HOURS[slot];
  if (!startH) return [];
  return ALL_SLOTS.filter(s => {
    const h = SLOT_HOURS[s];
    return h > startH && h < startH + durationHours;
  });
}

function isSlotUnavailable(slot, dayBookings, blockedData, dk) {
  const adminSlots = (blockedData?.slots||{})[dk]||[];
  if (adminSlots.includes(slot)) return true;
  const hourBlocks = (blockedData?.hourBlocks||{})[dk]||[];
  const slotH = SLOT_HOURS[slot];
  for (const hb of hourBlocks) {
    const fromH = typeof hb.from === "number" ? hb.from : SLOT_HOURS[hb.from]||0;
    const toH   = typeof hb.to   === "number" ? hb.to   : SLOT_HOURS[hb.to]||0;
    if (slotH >= fromH && slotH < toH) return true;
  }
  for (const b of dayBookings) {
    const bH = SLOT_HOURS[b.slot];
    if (!bH) continue;
    const dur = b.durationHours||2;
    if (slotH >= bH && slotH < bH + dur) return true;
    if (slotH < bH && slotH + 2 > bH) return true;
  }
  return false;
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S={
  input:{width:"100%",padding:"11px 14px",border:"1px solid #C5D5EC",borderRadius:8,fontSize:15,fontFamily:"inherit",boxSizing:"border-box",outline:"none"},
  select:{width:"100%",padding:"11px 14px",border:"1px solid #C5D5EC",borderRadius:8,fontSize:15,fontFamily:"inherit",boxSizing:"border-box",background:"#fff"},
  label:{fontSize:12,color:C.gray,fontWeight:"bold",letterSpacing:0.5,textTransform:"uppercase",marginBottom:6,display:"block"},
  card:{background:"#fff",borderRadius:12,padding:24,boxShadow:"0 2px 16px rgba(26,58,107,0.08)",marginBottom:20},
  btn:{background:C.blue,color:"#fff",border:"none",borderRadius:8,padding:"12px 28px",fontSize:14,cursor:"pointer",fontFamily:"inherit"},
  btnG:{background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"12px 28px",fontSize:14,cursor:"pointer",fontFamily:"inherit"},
  btnO:{background:"transparent",color:C.blue,border:`2px solid ${C.blue}`,borderRadius:8,padding:"10px 24px",fontSize:14,cursor:"pointer",fontFamily:"inherit"},
  btnR:{background:"transparent",color:C.red,border:`1px solid ${C.red}`,borderRadius:8,padding:"8px 14px",fontSize:13,cursor:"pointer",fontFamily:"inherit"},
  section:{maxWidth:960,margin:"0 auto",padding:"32px 20px"},
  title:{fontSize:20,fontFamily:"Georgia,serif",color:C.navy,marginBottom:16,borderBottom:`2px solid ${C.blue}`,paddingBottom:8},
};
function Btn({children,onClick,v="blue",disabled,style={}}){
  const base=v==="green"?S.btnG:v==="outline"?S.btnO:v==="red"?S.btnR:S.btn;
  return <button onClick={onClick} disabled={disabled} style={{...base,opacity:disabled?0.4:1,...style}}>{children}</button>;
}
function Fld({label,children}){return <div style={{marginBottom:16}}><label style={S.label}>{label}</label>{children}</div>;}

// ── Address Input ─────────────────────────────────────────────────────────────
function AddrInput({value,onChange,onArea}){
  const [text,setText]=useState(value||"");
  const [sugs,setSugs]=useState([]);
  const [open,setOpen]=useState(false);
  const [ok,setOk]=useState(null);
  function chk(v){const r=checkArea(v);setOk(r);if(onArea)onArea(r);}
  function handleChange(e){
    const v=e.target.value;setText(v);onChange(v);chk(v);
    if(v.length<3){setSugs([]);setOpen(false);return;}
    clearTimeout(window._at);
    window._at=setTimeout(async()=>{
      try{const r=await fetch(`https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=5&q=${encodeURIComponent(v)}`,{headers:{"Accept-Language":"en"},signal:AbortSignal.timeout(5000)});if(!r.ok)return;const d=await r.json();if(Array.isArray(d)&&d.length){setSugs(d.map(x=>x.display_name));setOpen(true);}}catch{}
    },400);
  }
  function pick(s){setText(s);onChange(s);chk(s);setSugs([]);setOpen(false);}
  const bc=ok===false?C.red:ok===true?C.green:"#C5D5EC";
  return(
    <div style={{position:"relative"}}>
      <div style={{position:"relative"}}>
        <input style={{...S.input,border:`1px solid ${bc}`,paddingRight:34}} value={text} onChange={handleChange} onBlur={()=>setTimeout(()=>setOpen(false),200)} onFocus={()=>sugs.length&&setOpen(true)} placeholder="Start typing your address..." autoComplete="off"/>
        {ok===true&&<span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:C.green}}>✓</span>}
        {ok===false&&<span style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",color:C.red,fontWeight:"bold"}}>✱</span>}
      </div>
      {ok===false&&<div style={{marginTop:6,padding:"10px 14px",background:"#FFF5F5",border:`1px solid ${C.red}`,borderRadius:8,fontSize:13}}><span style={{color:C.red,fontWeight:"bold"}}>✱ Outside our service area.</span> We serve <strong>Maryland</strong> and <strong>Washington D.C.</strong> only.</div>}
      {ok===true&&<div style={{marginTop:4,color:C.green,fontSize:12}}>✓ We service this area!</div>}
      {open&&sugs.length>0&&(
        <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:999,background:"#fff",border:"1px solid #C5D5EC",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,0.12)",maxHeight:200,overflowY:"auto",marginTop:2}}>
          {sugs.map((s,i)=>{const a=checkArea(s);return(
            <div key={i} onMouseDown={()=>pick(s)} style={{padding:"9px 14px",cursor:"pointer",fontSize:13,borderBottom:i<sugs.length-1?"1px solid #F3F4F6":"none",display:"flex",alignItems:"center",gap:8}} onMouseEnter={e=>e.currentTarget.style.background=C.light} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{color:a===false?C.red:C.blue}}>{a===false?"✱":"📍"}</span>
              <span style={{flex:1}}>{s}</span>
              {a===true&&<span style={{color:C.green,fontSize:11}}>✓ MD/DC</span>}
              {a===false&&<span style={{color:C.red,fontSize:11}}>Out of area</span>}
            </div>
          );})}
        </div>
      )}
    </div>
  );
}

// ── Calendar Picker (customer) ────────────────────────────────────────────────
function CalPicker({bookings,blockedData,selectedDate,selectedSlot,onSelect}){
  const t=todayObj();
  const [yr,setYr]=useState(t.y);
  const [mo,setMo]=useState(t.m);
  function prev(){if(mo===0){setYr(y=>y-1);setMo(11);}else setMo(m=>m-1);}
  function next(){if(mo===11){setYr(y=>y+1);setMo(0);}else setMo(m=>m+1);}
  const dim=getDaysInMonth(yr,mo);const fd=getFirstDay(yr,mo);
  const todayMs=new Date(t.y,t.m,t.d).getTime();
  const selDk=selectedDate?dateKey(selectedDate.y,selectedDate.m,selectedDate.d):null;

  function isDayBlocked(d){
    const dow=new Date(yr,mo,d).getDay();
    if(dow===0||dow===6)return true;
    if(new Date(yr,mo,d).getTime()<todayMs)return true;
    const dk=dateKey(yr,mo,d);
    if((blockedData?.days||[]).includes(dk))return true;
    if((blockedData?.closedWeekdays||[]).includes(dow))return true;
    return false;
  }

  return(
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <button onClick={prev} style={{...S.btnO,padding:"5px 14px"}}>‹</button>
        <strong style={{fontFamily:"Georgia,serif",fontSize:17}}>{MONTHS[mo]} {yr}</strong>
        <button onClick={next} style={{...S.btnO,padding:"5px 14px"}}>›</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:C.gray,fontWeight:"bold",padding:"3px 0"}}>{d}</div>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:16}}>
        {Array(fd).fill(null).map((_,i)=><div key={`_${i}`}/>)}
        {Array(dim).fill(null).map((_,i)=>{
          const d=i+1;const blocked=isDayBlocked(d);const dk=dateKey(yr,mo,d);
          const isToday=yr===t.y&&mo===t.m&&d===t.d;const isSel=selDk===dk;
          const dayBks=bookings.filter(b=>b.date===dk);
          return(
            <div key={d} onClick={()=>!blocked&&onSelect({y:yr,m:mo,d},null)}
              style={{borderRadius:7,padding:"7px 3px",textAlign:"center",cursor:blocked?"not-allowed":"pointer",fontSize:13,
                background:isSel?C.navy:isToday?C.navyDark:"#fff",
                color:isSel||isToday?"#fff":blocked?"#CCC":C.navy,
                border:`2px solid ${isSel?C.navy:"transparent"}`}}>
              {d}
              {dayBks.length>0&&!blocked&&<div style={{width:5,height:5,borderRadius:"50%",background:isSel?C.greenLight:C.blue,margin:"2px auto 0"}}/>}
            </div>
          );
        })}
      </div>
      {selectedDate&&selectedDate.m===mo&&selectedDate.y===yr&&(()=>{
        const dk=dateKey(selectedDate.y,selectedDate.m,selectedDate.d);
        const dayBks=bookings.filter(b=>b.date===dk);
        return(
          <div>
            <div style={{...S.label,marginBottom:10}}>Available times — {MONTHS[mo]} {selectedDate.d}</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
              {ALL_SLOTS.map(slot=>{
                const unavail=isSlotUnavailable(slot,dayBks,blockedData,dk);
                const sel=selectedSlot===slot;
                return(
                  <button key={slot} disabled={unavail} onClick={()=>onSelect(selectedDate,slot)}
                    style={{padding:"8px 14px",borderRadius:6,border:`2px solid ${unavail?"#E5E7EB":sel?C.blue:C.blueLight}`,background:unavail?"#F9FAFB":sel?C.blue:"#fff",color:unavail?"#CCC":sel?"#fff":C.navy,cursor:unavail?"not-allowed":"pointer",fontSize:13,fontFamily:"inherit"}}>
                    {slot}{unavail?" ✗":""}
                  </button>
                );
              })}
            </div>
            <div style={{fontSize:11,color:C.gray,marginTop:8}}>Mon–Fri only · Blocked times shown with ✗</div>
          </div>
        );
      })()}
    </div>
  );
}

// ── Promo Popup ───────────────────────────────────────────────────────────────
function PromoPopup({onClose,onCapture}){
  const [email,setEmail]=useState("");const [name,setName]=useState("");
  const [done,setDone]=useState(false);const [err,setErr]=useState("");
  async function submit(){
    if(!email||!email.includes("@")){setErr("Please enter a valid email.");return;}
    const lead={id:"lead_"+Date.now(),name,email,code:PROMO_CODE,createdAt:new Date().toISOString()};
    const existing=loadLeads();saveLeads([...existing,lead]);if(onCapture)onCapture(lead);
    try{
      if(!window.emailjs){await new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js";s.onload=res;s.onerror=rej;document.head.appendChild(s);});}
      window.emailjs.init(EJS_KEY);
      await window.emailjs.send(EJS_SVC,EJS_BIZ,{to_email:"crissmaidcleaning@gmail.com",to_name:"Criss Maid Cleaning",customer_name:name||"New Lead",customer_email:email,customer_phone:"N/A",date:new Date().toLocaleDateString(),time:"N/A",address:"N/A",home_size:"N/A",service_type:"Promo Code Request — 20% Off",extras:`Code: ${PROMO_CODE}`,notes:"Lead from website popup"});
    }catch(e){console.error(e);}
    setDone(true);safeSet("cmc_promo_seen","true");
  }
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.65)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9000,padding:20}}>
      <div style={{background:"#fff",borderRadius:20,maxWidth:420,width:"100%",overflow:"hidden",boxShadow:"0 20px 60px rgba(0,0,0,0.3)",animation:"popIn 0.3s ease"}}>
        <div style={{background:`linear-gradient(135deg,${C.navyDark},${C.blue})`,padding:"28px 24px",textAlign:"center",position:"relative"}}>
          <button onClick={onClose} style={{position:"absolute",top:12,right:14,background:"rgba(255,255,255,0.15)",border:"none",color:"#fff",borderRadius:"50%",width:28,height:28,cursor:"pointer",fontSize:14}}>✕</button>
          <div style={{fontSize:40,marginBottom:8}}>✨</div>
          <div style={{background:C.gold,color:C.navy,fontWeight:"bold",fontSize:28,borderRadius:10,padding:"6px 20px",display:"inline-block",marginBottom:10,fontFamily:"Georgia,serif"}}>20% OFF</div>
          <div style={{color:"#fff",fontFamily:"Georgia,serif",fontSize:18,marginBottom:4}}>Your First Cleaning!</div>
          <div style={{color:"rgba(255,255,255,0.8)",fontSize:13}}>Enter your email to unlock your exclusive discount code</div>
        </div>
        <div style={{padding:24}}>
          {!done?(
            <>
              <div style={{marginBottom:12}}><label style={S.label}>Your Name</label><input style={S.input} value={name} onChange={e=>setName(e.target.value)} placeholder="Jane Smith"/></div>
              <div style={{marginBottom:16}}><label style={S.label}>Email Address *</label><input style={S.input} value={email} onChange={e=>{setEmail(e.target.value);setErr("");}} placeholder="jane@email.com" type="email"/>{err&&<div style={{color:C.red,fontSize:12,marginTop:4}}>{err}</div>}</div>
              <button onClick={submit} style={{...S.btnG,width:"100%",fontSize:16,padding:14,marginBottom:12}}>Claim My 20% Off →</button>
              <div style={{textAlign:"center",fontSize:11,color:C.gray,lineHeight:1.6}}>Valid for first-time customers only. No spam, ever.</div>
            </>
          ):(
            <div style={{textAlign:"center",padding:"10px 0"}}>
              <div style={{fontSize:44,marginBottom:12}}>🎉</div>
              <div style={{fontFamily:"Georgia,serif",fontSize:18,color:C.navy,marginBottom:8}}>You're all set!</div>
              <div style={{background:C.light,border:`2px dashed ${C.blue}`,borderRadius:10,padding:"16px 20px",marginBottom:16}}>
                <div style={{fontSize:26,fontWeight:"bold",color:C.blue,letterSpacing:4}}>{PROMO_CODE}</div>
                <div style={{fontSize:12,color:C.gray,marginTop:4}}>20% off your first cleaning</div>
              </div>
              <button onClick={onClose} style={{...S.btn,width:"100%"}}>Book Now →</button>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes popIn{from{transform:scale(0.85);opacity:0}to{transform:scale(1);opacity:1}}`}</style>
    </div>
  );
}

// ── Booking Form ──────────────────────────────────────────────────────────────
function BookingForm({bookings,blockedData,onBook}){
  const [step,setStep]=useState(1);
  const [form,setForm]=useState({name:"",phone:"",email:"",address:"",notes:"",homeSize:"",isFirst:true,recurrence:"none",extras:[],date:null,slot:null,durationHours:2});
  const [areaOk,setAreaOk]=useState(null);
  const [promo,setPromo]=useState("");const [promoOk,setPromoOk]=useState(false);const [promoErr,setPromoErr]=useState("");
  const [done,setDone]=useState(false);const [sending,setSending]=useState(false);

  function upd(k,v){setForm(f=>({...f,[k]:v}));}
  function toggleExtra(id){upd("extras",form.extras.includes(id)?form.extras.filter(x=>x!==id):[...form.extras,id]);}
  function applyPromo(){if(promo.trim().toUpperCase()===PROMO_CODE){setPromoOk(true);setPromoErr("");}else{setPromoErr("Invalid code.");setPromoOk(false);}}
  function canNext(){
    if(step===1)return form.name&&form.phone&&form.email&&form.address&&areaOk!==false;
    if(step===2)return!!form.homeSize;
    if(step===3)return!!(form.date&&form.slot);
    return true;
  }
  async function submit(){
    setSending(true);
    const dk=dateKey(form.date.y,form.date.m,form.date.d);
    const b={id:"b"+Date.now(),...form,date:dk,status:"confirmed",promoApplied:promoOk,createdAt:new Date().toISOString()};
    await onBook(b);await sendEmails(b);
    setSending(false);setDone(true);
  }

  if(done)return(
    <div style={{...S.card,textAlign:"center",padding:40}}>
      <div style={{fontSize:48,marginBottom:12}}>{form.isFirst?"🎉":"✅"}</div>
      <h2 style={{fontFamily:"Georgia,serif",color:C.blue,marginBottom:8}}>{form.isFirst?"Free Estimate Scheduled!":"Booking Confirmed!"}</h2>
      <p style={{color:C.gray,marginBottom:8}}>{form.isFirst?`Thank you, ${form.name}! We'll contact you to confirm.`:`Thank you, ${form.name}!`}</p>
      {promoOk&&<div style={{background:C.green+"20",border:`1px solid ${C.green}`,borderRadius:8,padding:12,marginTop:12,color:C.green,fontWeight:"bold",fontSize:14}}>🎉 20% discount applied!</div>}
      <Btn v="outline" onClick={()=>{setDone(false);setStep(1);setForm({name:"",phone:"",email:"",address:"",notes:"",homeSize:"",isFirst:true,recurrence:"none",extras:[],date:null,slot:null,durationHours:2});setAreaOk(null);setPromo("");setPromoOk(false);}} style={{marginTop:20}}>Schedule Another</Btn>
    </div>
  );

  const steps=["Your Info","Service","Schedule","Review"];
  return(
    <div style={S.card}>
      <div style={{display:"flex",marginBottom:28,gap:4}}>
        {steps.map((l,i)=>(
          <div key={l} style={{flex:1,textAlign:"center"}}>
            <div style={{width:26,height:26,borderRadius:"50%",margin:"0 auto 4px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:"bold",background:i+1<step?C.green:i+1===step?C.navy:"#E5E7EB",color:i+1<=step?"#fff":C.gray}}>{i+1<step?"✓":i+1}</div>
            <div style={{fontSize:10,color:i+1===step?C.navy:C.gray,fontWeight:i+1===step?"bold":"normal"}}>{l}</div>
          </div>
        ))}
      </div>

      {step===1&&(
        <div>
          <div style={S.title}>Your Information</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <Fld label="Full Name *"><input style={S.input} value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="Jane Smith"/></Fld>
            <Fld label="Phone *"><input style={S.input} value={form.phone} onChange={e=>upd("phone",e.target.value.replace(/[^\d\s\-().]/g,""))} onKeyDown={e=>{if(!["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Enter"].includes(e.key)&&!/[\d\s\-().]/.test(e.key))e.preventDefault();}} placeholder="(240) 413-4313" type="tel" inputMode="numeric" maxLength={15}/></Fld>
          </div>
          <Fld label="Email *"><input style={S.input} value={form.email} onChange={e=>upd("email",e.target.value)} type="email" placeholder="jane@email.com"/></Fld>
          <Fld label="Service Address *"><AddrInput value={form.address} onChange={v=>upd("address",v)} onArea={setAreaOk}/></Fld>
          <Fld label="Notes / Special Instructions"><textarea style={{...S.input,height:70,resize:"vertical"}} value={form.notes} onChange={e=>upd("notes",e.target.value)} placeholder="Gate code, pets, allergies, etc."/></Fld>

        </div>
      )}

      {step===2&&(
        <div>
          <div style={S.title}>Service Details</div>
          <Fld label="Home / Property Size">
            <select style={S.select} value={form.homeSize} onChange={e=>upd("homeSize",e.target.value)}>
              <option value="">— Select —</option>
              {HOME_SIZES.map(h=><option key={h.label} value={h.label}>{h.label} ({h.sqft})</option>)}
            </select>
          </Fld>
          <Fld label="Is this your first cleaning with us?">
            <div style={{display:"flex",gap:12}}>
              {[true,false].map(v=>(
                <button key={String(v)} onClick={()=>{upd("isFirst",v);upd("extras",[]);}}
                  style={{flex:1,padding:"10px 0",borderRadius:8,border:`2px solid ${form.isFirst===v?C.blue:"#E5E7EB"}`,background:form.isFirst===v?C.blue+"15":"#fff",color:form.isFirst===v?C.blue:C.gray,cursor:"pointer",fontFamily:"inherit",fontSize:14}}>
                  {v?"Yes – First cleaning":"No – Returning client"}
                </button>
              ))}
            </div>
          </Fld>
          {form.isFirst&&(
            <>
              <div style={{background:`linear-gradient(135deg,${C.navyDark},${C.blue})`,borderRadius:10,padding:18,textAlign:"center",marginBottom:16}}>
                <div style={{color:"#fff",fontFamily:"Georgia,serif",fontSize:17,fontWeight:"bold",marginBottom:4}}>✨ Schedule Your Free Estimate!</div>
                <div style={{color:"rgba(255,255,255,0.85)",fontSize:13}}>A team member will assess your home and provide a custom quote — completely free.</div>
              </div>
              <div style={{background:C.green+"15",border:`1px solid ${C.green}`,borderRadius:10,padding:14,marginBottom:16}}>
                <div style={{fontWeight:"bold",color:C.green,marginBottom:6,fontSize:14}}>✅ First Cleaning Includes Everything:</div>
                <div style={{fontSize:13,color:C.navy,lineHeight:1.8}}>• Full deep clean • Fridge (inside & out) • Oven cleaning<br/>• Crew size & rate quoted after estimate</div>
              </div>
            </>
          )}
          {!form.isFirst&&(
            <>
              <Fld label="Recurring Schedule">
                <select style={S.select} value={form.recurrence} onChange={e=>upd("recurrence",e.target.value)}>
                  {RECUR_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </Fld>
              <Fld label="Add-on Services">
                {EXTRAS_RECURRING.map(ex=>(
                  <label key={ex.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",border:`1px solid ${form.extras.includes(ex.id)?C.blue:"#E5E7EB"}`,borderRadius:8,cursor:"pointer",background:form.extras.includes(ex.id)?C.blue+"08":"#fff",marginBottom:8}}>
                    <input type="checkbox" checked={form.extras.includes(ex.id)} onChange={()=>toggleExtra(ex.id)}/>
                    <span style={{flex:1}}>{ex.label}</span>
                    <span style={{color:C.blue,fontWeight:"bold",fontSize:13}}>{ex.quote?"Quote required":`+$${ex.price}`}</span>
                  </label>
                ))}
                <div style={{fontSize:12,color:C.gray,marginTop:4}}>🚫 We do not offer laundry services.</div>
              </Fld>
            </>
          )}
        </div>
      )}

      {step===3&&(
        <div>
          <div style={S.title}>Pick a Date & Time</div>
          <CalPicker bookings={bookings} blockedData={blockedData} selectedDate={form.date} selectedSlot={form.slot} onSelect={(date,slot)=>{upd("date",date);if(slot)upd("slot",slot);}}/>
        </div>
      )}

      {step===4&&(
        <div>
          <div style={S.title}>{form.isFirst?"Review Free Estimate Request":"Review Booking"}</div>
          <div style={{display:"grid",gap:8,marginBottom:20}}>
            {[["Name",form.name],["Phone",form.phone],["Email",form.email],["Address",form.address],["Home Size",form.homeSize],
              !form.isFirst&&form.recurrence!=="none"&&["Schedule",RECUR_OPTIONS.find(o=>o.v===form.recurrence)?.l],
              ["Date",form.date?dateKey(form.date.y,form.date.m,form.date.d):""],["Time",form.slot],
              form.extras.length&&["Add-ons",form.extras.join(", ")],form.notes&&["Notes",form.notes],
              promoOk&&["Promo Code",`${PROMO_CODE} — 20% off`]
            ].filter(Boolean).map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:"1px solid #F3F4F6",fontSize:14}}>
                <span style={{color:C.gray}}>{k}</span><span style={{fontWeight:"bold",textAlign:"right",maxWidth:"60%"}}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{background:C.navy,borderRadius:10,padding:"14px 18px",textAlign:"center",marginBottom:12}}>
            <div style={{fontSize:20,fontWeight:"bold",color:C.green}}>{form.isFirst?"Free Estimate":"Flat Rate — Quoted after first cleaning"}</div>
            {promoOk&&<div style={{background:C.green,color:"#fff",borderRadius:8,padding:"4px 12px",display:"inline-block",marginTop:6,fontSize:13}}>🎉 20% Discount Applied</div>}
          </div>
          <div style={{fontSize:12,color:C.gray}}>By submitting you agree to our cancellation policy: 24h notice required.</div>
        </div>
      )}

      <div style={{marginTop:24}}>
        {step===1&&areaOk===false&&<div style={{color:C.red,fontSize:12,marginBottom:8,textAlign:"right"}}>✱ Please enter a Maryland or D.C. address to continue.</div>}
        <div style={{display:"flex",justifyContent:"space-between"}}>
          {step>1?<Btn v="outline" onClick={()=>setStep(s=>s-1)}>← Back</Btn>:<div/>}
          {step<4?<Btn disabled={!canNext()} onClick={()=>setStep(s=>s+1)}>Next →</Btn>
            :<Btn disabled={sending} onClick={submit}>{sending?"Sending...":form.isFirst?"Schedule Free Estimate ✓":"Confirm Booking ✓"}</Btn>}
        </div>
      </div>
    </div>
  );
}

// ── Pricing Page ──────────────────────────────────────────────────────────────
function PricingPage(){
  return(
    <div style={S.section}>
      <div style={S.card}>
        <div style={S.title}>First Cleaning — Free Estimate</div>
        <div style={{background:C.green+"12",border:`1px solid ${C.green}`,borderRadius:10,padding:14,marginBottom:16}}>
          <div style={{fontWeight:"bold",color:C.green,marginBottom:6}}>✅ First Cleaning Includes Everything:</div>
          <div style={{fontSize:13,color:C.navy,lineHeight:1.8}}>• Full deep clean · Fridge (inside & out) · Oven cleaning · All standard tasks<br/>• $75/hr (2-person) or $130/hr (3-person) — quoted after free estimate</div>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
            <thead><tr style={{background:C.navy,color:"#fff"}}>
              <th style={{padding:"11px 14px",textAlign:"left"}}>Home Size</th>
              <th style={{padding:"11px 14px",textAlign:"center"}}>2-Person ($75/hr)</th>
              <th style={{padding:"11px 14px",textAlign:"center"}}>3-Person ($130/hr)</th>
            </tr></thead>
            <tbody>
              {[{l:"Studio / 1BR",a:150,b:195},{l:"2 Bedroom",a:225,b:260},{l:"3 Bedroom",a:300,b:325},{l:"4 Bedroom",a:375,b:455},{l:"5+ Bedroom",a:525,b:650}].map((h,i)=>(
                <tr key={h.l} style={{background:i%2===0?"#fff":C.light}}>
                  <td style={{padding:"10px 14px",fontWeight:"bold"}}>{h.l}</td>
                  <td style={{padding:"10px 14px",textAlign:"center",color:C.blue,fontWeight:"bold"}}>~${h.a}*</td>
                  <td style={{padding:"10px 14px",textAlign:"center",color:C.blue,fontWeight:"bold"}}>~${h.b}*</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{fontSize:12,color:C.gray,marginTop:8}}>* Estimates only — exact total quoted after free in-home assessment.</div>
      </div>
      <div style={S.card}>
        <div style={S.title}>Recurring Cleaning — Custom Flat Rate</div>
        <div style={{background:C.navyDark,borderRadius:12,padding:"28px 24px",textAlign:"center",color:"#fff",marginBottom:16}}>
          <div style={{fontSize:32,marginBottom:10}}>📞</div>
          <div style={{fontFamily:"Georgia,serif",fontSize:20,fontWeight:"bold",marginBottom:10,color:C.gold}}>Personalized Rate</div>
          <div style={{color:"rgba(255,255,255,0.85)",fontSize:14,lineHeight:1.8,maxWidth:480,margin:"0 auto 18px"}}>After your first cleaning, we'll determine a flat rate based on your home and preferred frequency.</div>
          <div style={{display:"flex",justifyContent:"center",gap:12,flexWrap:"wrap",marginBottom:14}}>
            {["Weekly","Bi-Weekly","Monthly","3x Per Week"].map(f=><span key={f} style={{background:"rgba(255,255,255,0.12)",color:"#fff",borderRadius:20,padding:"6px 18px",fontSize:13,fontWeight:"bold"}}>{f}</span>)}
          </div>
          <div style={{color:C.blueLight,fontSize:13}}>📱 (240) 413-4313 &nbsp;·&nbsp; 📱 (301) 768-1371</div>
        </div>
        <div style={{background:"#FFF9F0",border:"1px solid #F39C12",borderRadius:10,padding:14}}>
          <div style={{fontWeight:"bold",color:"#E67E22",marginBottom:6,fontSize:14}}>ℹ️ Recurring Rate Does Not Include:</div>
          <div style={{fontSize:13,color:C.navy,lineHeight:1.8}}>• Fridge (inside & out) — <strong>+$45</strong> · Oven — <strong>+$45</strong> · Silver — <strong>Quote</strong> · 🚫 No laundry</div>
        </div>
      </div>
      <div style={{...S.card,background:C.navy,color:"#fff"}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:17,color:C.greenLight,marginBottom:8}}>🏢 Commercial & Multi-Unit Services</div>
        <p style={{color:"#DDD",fontSize:13,marginBottom:16,lineHeight:1.8}}>We also service commercial and multi-unit properties. Pricing is custom quoted based on size, frequency, and scope of work.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:12,marginBottom:20}}>
          {[["🏢","Apartment Complexes","Hallways, lobbies & common areas"],["🏛️","Condo Associations","Recurring common area cleaning"],["🏘️","HOAs","Clubhouses & shared facilities"],["💼","Office Buildings","Daily or weekly janitorial"]].map(([icon,t,d])=>(
            <div key={t} style={{background:"rgba(255,255,255,0.1)",borderRadius:10,padding:"14px 12px",textAlign:"center"}}>
              <div style={{fontSize:24,marginBottom:6}}>{icon}</div>
              <div style={{fontWeight:"bold",fontSize:13,marginBottom:4,color:C.gold}}>{t}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",lineHeight:1.5}}>{d}</div>
            </div>
          ))}
        </div>
        <div style={{background:"rgba(255,255,255,0.1)",borderRadius:10,padding:"14px 16px",textAlign:"center"}}>
          <div style={{color:C.gold,fontWeight:"bold",marginBottom:6}}>📞 Call for a Custom Quote</div>
          <div style={{color:"rgba(255,255,255,0.85)",fontSize:13}}>Every commercial property is different. We'll do a walkthrough and provide a tailored proposal.</div>
          <div style={{marginTop:10,color:C.blueLight,fontSize:13}}>📱 (240) 413-4313 &nbsp;·&nbsp; 📱 (301) 768-1371</div>
        </div>
      </div>

      <div style={{...S.card,background:C.navy,color:"#fff"}}>
        <div style={{fontFamily:"Georgia,serif",fontSize:17,color:C.greenLight,marginBottom:8}}>📞 Get Your Free Estimate</div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",color:C.blueLight}}>
          <span>📱 (240) 413-4313</span><span>📱 (301) 768-1371</span><span>✉️ crissmaidcleaning@gmail.com</span>
        </div>
      </div>
    </div>
  );
}

// ── About Page ────────────────────────────────────────────────────────────────
function AboutPage({onBook}){
  return(
    <div>
      <div style={{background:`linear-gradient(135deg,${C.navyDark},${C.navy})`,padding:"48px 24px",textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:10}}>👩‍👦</div>
        <h1 style={{fontFamily:"Georgia,serif",color:"#fff",fontSize:26,marginBottom:8}}>About Criss Maid Cleaning</h1>
        <p style={{color:"rgba(255,255,255,0.8)",fontSize:15,maxWidth:480,margin:"0 auto 16px"}}>A family business built on trust, dedication, and over 30 years of experience.</p>
        <div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap"}}>
          <span style={{background:"rgba(255,255,255,0.15)",color:"#fff",borderRadius:20,padding:"5px 14px",fontSize:13}}>📍 Maryland</span>
          <span style={{background:"rgba(255,255,255,0.15)",color:"#fff",borderRadius:20,padding:"5px 14px",fontSize:13}}>📍 Washington D.C.</span>
        </div>
      </div>
      <div style={S.section}>
        <div style={S.card}>
          <div style={S.title}>Our Story</div>
          <div style={{fontSize:14,color:"#444",lineHeight:1.9}}>
            <p style={{marginBottom:12}}>Criss Maid Cleaning was born from a simple belief: every home deserves to be treated with care, attention, and respect.</p>
            <p style={{marginBottom:12}}>At the heart of our business is <strong>Cristela</strong>, a mother with over <strong>30 years of professional cleaning experience</strong>. For three decades she has transformed homes — bringing comfort and pride back to every space.</p>
            <p>Joining her is her son <strong>Alexi</strong>, who handles scheduling and operations. Together they built Criss Maid Cleaning to serve <strong>Maryland and Washington D.C.</strong> with the warmth of a family business and the professionalism of experts.</p>
          </div>
        </div>
        <div style={S.card}>
          <div style={S.title}>Meet the Team</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:20}}>
            {[{img:"/cristela.jpg",name:"Cristela",role:"Founder & Lead Cleaner",rc:C.blue,bio:"With over 30 years of professional experience, Cristela is the heart and soul of Criss Maid Cleaning. Her attention to detail and genuine care for every home is what sets us apart.",badge:"30+ Years Experience"},{img:"/alexi.jpg",name:"Alexi",role:"Co-Founder & Operations",rc:C.green,bio:"Handling scheduling, customer relations, and operations, Alexi ensures every client gets a seamless experience from first booking to final walkthrough.",badge:"Family Owned"}].map(p=>(
              <div key={p.name} style={{textAlign:"center",padding:"20px 16px",borderRadius:12,background:C.light}}>
                <div style={{width:100,height:100,borderRadius:"50%",overflow:"hidden",margin:"0 auto 14px",border:"4px solid #fff",boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
                  <img src={p.img} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover",objectPosition:"center top"}}/>
                </div>
                <div style={{fontFamily:"Georgia,serif",fontSize:20,color:C.navy,marginBottom:4}}>{p.name}</div>
                <div style={{color:p.rc,fontSize:12,fontWeight:"bold",letterSpacing:1,textTransform:"uppercase",marginBottom:10}}>{p.role}</div>
                <div style={{color:C.gray,fontSize:13,lineHeight:1.7,marginBottom:12}}>{p.bio}</div>
                <span style={{background:p.rc+"15",color:p.rc,borderRadius:20,padding:"4px 12px",fontSize:12,fontWeight:"bold"}}>{p.badge}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={S.card}>
          <div style={S.title}>📍 Areas We Serve</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginBottom:14}}>
            <div style={{background:C.navyDark,borderRadius:12,padding:"22px 18px",textAlign:"center",color:"#fff"}}><div style={{fontSize:30,marginBottom:6}}>🏛️</div><div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:"bold",marginBottom:4}}>Washington D.C.</div></div>
            <div style={{background:C.blue,borderRadius:12,padding:"22px 18px",textAlign:"center",color:"#fff"}}><div style={{fontSize:30,marginBottom:6}}>🌿</div><div style={{fontFamily:"Georgia,serif",fontSize:17,fontWeight:"bold",marginBottom:4}}>Maryland</div></div>
          </div>
        </div>
        <div style={{textAlign:"center",padding:"20px 0 40px"}}>
          <Btn v="green" onClick={onBook} style={{padding:"14px 36px",fontSize:15}}>Schedule Your Free Estimate →</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Employee Schedule ─────────────────────────────────────────────────────────
function EmpSchedule({bookings,employee,onLogout}){
  const t=todayObj();const todayKey=dateKey(t.y,t.m,t.d);
  const [sel,setSel]=useState(null);
  const todayJobs=bookings.filter(b=>b.date===todayKey);
  const upcoming=bookings.filter(b=>b.date>todayKey).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,10);
  return(
    <div style={{maxWidth:720,margin:"0 auto",padding:"24px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{margin:0,fontFamily:"Georgia,serif",color:C.navy}}>👋 Hello, {employee.name}</h2></div>
        <Btn v="outline" onClick={onLogout}>Log Out</Btn>
      </div>
      <div style={S.card}>
        <div style={S.title}>Today's Jobs — {todayKey}</div>
        {todayJobs.length===0?<div style={{color:C.gray,fontStyle:"italic"}}>No jobs today.</div>:todayJobs.map(b=>(
          <div key={b.id} onClick={()=>setSel(b)} style={{borderLeft:`4px solid ${b.isFirst?C.green:C.blue}`,paddingLeft:14,marginBottom:14,cursor:"pointer"}}>
            <div style={{fontWeight:"bold"}}>{b.slot} — {b.name} {b.isFirst&&<span style={{background:C.green+"20",color:C.green,fontSize:11,borderRadius:10,padding:"2px 8px"}}>Free Estimate</span>}</div>
            <div style={{color:C.gray,fontSize:13}}>{b.address} · {b.homeSize}</div>
          </div>
        ))}
      </div>
      <div style={S.card}>
        <div style={S.title}>Upcoming Jobs</div>
        {upcoming.length===0?<div style={{color:C.gray,fontStyle:"italic"}}>No upcoming jobs.</div>:upcoming.map(b=>(
          <div key={b.id} onClick={()=>setSel(b)} style={{display:"flex",gap:14,alignItems:"center",padding:"10px 0",borderBottom:"1px solid #F3F4F6",cursor:"pointer"}}>
            <div style={{minWidth:52,textAlign:"center",background:C.navy,color:"#fff",borderRadius:8,padding:"6px 4px"}}>
              <div style={{fontSize:9,color:C.blueLight}}>{b.date.slice(5)}</div>
              <div style={{fontWeight:"bold",fontSize:14}}>{b.slot.replace(" AM","").replace(" PM","")}</div>
            </div>
            <div><div style={{fontWeight:"bold",fontSize:14}}>{b.name}</div><div style={{color:C.gray,fontSize:12}}>{b.address}</div></div>
          </div>
        ))}
      </div>
      {sel&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100}} onClick={()=>setSel(null)}>
          <div style={{background:"#fff",borderRadius:14,padding:28,maxWidth:420,width:"90%"}} onClick={e=>e.stopPropagation()}>
            <h3 style={{fontFamily:"Georgia,serif",margin:"0 0 14px"}}>{sel.isFirst?"✨ Free Estimate":"📋 Booking"}</h3>
            {[["Client",sel.name],["Phone",sel.phone],["Date & Time",`${sel.date} @ ${sel.slot}`],["Address",sel.address],["Home Size",sel.homeSize],sel.notes&&["Notes",sel.notes]].filter(Boolean).map(([k,v])=>(
              <div key={k} style={{display:"flex",gap:12,padding:"6px 0",borderBottom:"1px solid #F3F4F6",fontSize:14}}>
                <span style={{color:C.gray,minWidth:80}}>{k}</span><span style={{fontWeight:"bold"}}>{v}</span>
              </div>
            ))}
            <Btn onClick={()=>setSel(null)} style={{marginTop:18,width:"100%"}}>Close</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Receipt Modal ─────────────────────────────────────────────────────────────
function ReceiptModal({booking,onClose,onSave}){
  const receiptNum="RCP-"+Date.now().toString().slice(-6);
  const [lines,setLines]=useState([{id:1,desc:booking.isFirst?"First Cleaning — Free Estimate":"Recurring Cleaning",amount:""},...(booking.extras||[]).map((id,i)=>{const ex=EXTRAS_RECURRING.find(e=>e.id===id);return{id:i+2,desc:ex?.label||id,amount:ex?.price?String(ex.price):""};}),]);
  const [payMethod,setPayMethod]=useState("Cash");
  const [paidDate,setPaidDate]=useState(new Date().toISOString().slice(0,10));
  const [notes,setNotes]=useState("");const [sending,setSending]=useState(false);const [sent,setSent]=useState(false);
  function addLine(){setLines(l=>[...l,{id:Date.now(),desc:"",amount:""}]);}
  function removeLine(id){setLines(l=>l.filter(x=>x.id!==id));}
  function updateLine(id,f,v){setLines(l=>l.map(x=>x.id===id?{...x,[f]:v}:x));}
  const total=lines.reduce((s,l)=>s+(parseFloat(l.amount)||0),0);
  function printReceipt(){
    const w=window.open("","_blank");
    w.document.write(`<html><head><title>Receipt ${receiptNum}</title><style>body{font-family:Georgia,serif;max-width:600px;margin:40px auto;padding:20px;color:#1A3A6B;}table{width:100%;border-collapse:collapse;margin:20px 0;}th{background:#1C4B9B;color:#fff;padding:10px 14px;text-align:left;}td{padding:10px 14px;border-bottom:1px solid #EDF2FB;}.total{font-weight:bold;font-size:18px;text-align:right;margin-top:16px;}.footer{margin-top:32px;padding-top:16px;border-top:2px solid #EDF2FB;font-size:13px;color:#6B7280;}</style></head><body>
    <h1>🧹 Criss Maid Cleaning</h1><div style="color:#6B7280;font-size:14px;margin-bottom:20px;">Receipt #${receiptNum} · ${paidDate}</div>
    <div style="margin-bottom:16px;font-size:14px;"><strong>Bill To:</strong> ${booking.name}<br/>${booking.email||""}<br/>${booking.address}</div>
    <table><thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead><tbody>
    ${lines.map(l=>`<tr><td>${l.desc}</td><td style="text-align:right">$${parseFloat(l.amount||0).toFixed(2)}</td></tr>`).join("")}
    </tbody></table>
    <div class="total">Total Paid: $${total.toFixed(2)}</div>
    <div style="margin-top:8px;font-size:14px;color:#6B7280;">Payment: ${payMethod}</div>
    ${notes?`<div style="margin-top:6px;font-size:14px;color:#6B7280;">Notes: ${notes}</div>`:""}
    <div class="footer">📱 (240) 413-4313 · 📱 (301) 768-1371 · ✉️ crissmaidcleaning@gmail.com<br/>Serving Maryland & Washington D.C.<br/><br/><em>Thank you for choosing Criss Maid Cleaning!</em></div>
    </body></html>`);w.document.close();w.print();
  }
  async function sendReceipt(){
    setSending(true);
    const receipt={id:receiptNum,bookingId:booking.id,clientName:booking.name,clientEmail:booking.email,date:paidDate,serviceDate:booking.date,address:booking.address,lines,total,payMethod,notes,sentAt:new Date().toISOString()};
    onSave(receipt);setSent(true);setSending(false);
  }
  if(sent)return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:14,padding:36,maxWidth:400,width:"90%",textAlign:"center"}} onClick={e=>e.stopPropagation()}>
        <div style={{fontSize:48,marginBottom:12}}>✅</div>
        <h3 style={{fontFamily:"Georgia,serif",color:C.blue,marginBottom:8}}>Receipt Saved!</h3>
        <p style={{color:C.gray,fontSize:14,marginBottom:20}}>Receipt #{receiptNum}</p>
        <div style={{display:"flex",gap:10,justifyContent:"center"}}>
          <Btn onClick={printReceipt} v="outline">🖨 Print</Btn>
          <Btn onClick={onClose}>Done</Btn>
        </div>
      </div>
    </div>
  );
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300,padding:"20px 0",overflowY:"auto"}} onClick={onClose}>
      <div style={{background:"#fff",borderRadius:14,padding:28,maxWidth:560,width:"92%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div><h3 style={{fontFamily:"Georgia,serif",margin:0,color:C.navy}}>🧾 Create Receipt</h3><div style={{color:C.gray,fontSize:13}}>#{receiptNum} · {booking.name}</div></div>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:20,cursor:"pointer",color:C.gray}}>✕</button>
        </div>
        <div style={{background:C.light,borderRadius:8,padding:"12px 16px",marginBottom:20,fontSize:13,display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div><strong>Client:</strong> {booking.name}</div><div><strong>Email:</strong> {booking.email||"N/A"}</div>
          <div><strong>Service Date:</strong> {booking.date}</div><div><strong>Address:</strong> {booking.address}</div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
          <div><label style={S.label}>Payment Date</label><input type="date" style={S.input} value={paidDate} onChange={e=>setPaidDate(e.target.value)}/></div>
          <div><label style={S.label}>Payment Method</label>
            <select style={S.select} value={payMethod} onChange={e=>setPayMethod(e.target.value)}>
              {["Cash","Zelle","Venmo","CashApp","Check","Credit Card","Other"].map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <label style={S.label}>Services & Charges</label>
          {lines.map((l,i)=>(
            <div key={l.id} style={{display:"flex",gap:10,marginBottom:8,alignItems:"center"}}>
              <input style={{...S.input,flex:3}} value={l.desc} onChange={e=>updateLine(l.id,"desc",e.target.value)} placeholder="Description"/>
              <div style={{position:"relative",flex:1}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:C.gray}}>$</span><input style={{...S.input,paddingLeft:24}} value={l.amount} onChange={e=>updateLine(l.id,"amount",e.target.value.replace(/[^\d.]/g,""))} placeholder="0.00" type="number" min="0"/></div>
              {lines.length>1&&<button onClick={()=>removeLine(l.id)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:18}}>✕</button>}
            </div>
          ))}
          <button onClick={addLine} style={{background:"none",border:`1px dashed ${C.blue}`,color:C.blue,borderRadius:8,padding:"8px 16px",cursor:"pointer",fontSize:13,fontFamily:"inherit",width:"100%",marginTop:4}}>+ Add Line Item</button>
        </div>
        <div style={{background:C.navy,borderRadius:10,padding:"16px 20px",marginBottom:16,textAlign:"center"}}>
          <div style={{fontSize:28,fontWeight:"bold",color:C.green}}>${total.toFixed(2)}</div>
          <div style={{color:C.blueLight,fontSize:12,marginTop:4}}>Total · {payMethod}</div>
        </div>
        <div style={{marginBottom:20}}><label style={S.label}>Notes</label><textarea style={{...S.input,height:60,resize:"vertical"}} value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Thank you note..."/></div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          <Btn onClick={sendReceipt} disabled={sending} style={{flex:1}}>{sending?"Saving...":"💾 Save Receipt"}</Btn>
          <Btn v="outline" onClick={printReceipt} style={{flex:1}}>🖨 Print Receipt</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Admin Calendar ────────────────────────────────────────────────────────────
function AdminCal({bookings,employees,blockedData,onAssign,onAdminBook,onBlockDay,onUnblockDay,onBlockSlot,onUnblockSlot,onBlockHours,onUnblockHours}){
  const t=todayObj();
  const [yr,setYr]=useState(t.y);const [mo,setMo]=useState(t.m);
  const [selDay,setSelDay]=useState(null);const [selB,setSelB]=useState(null);
  const [showAdd,setShowAdd]=useState(false);
  const [addSlot,setAddSlot]=useState("");const [addDur,setAddDur]=useState(2);
  const [addRecur,setAddRecur]=useState("none");
  const [addF,setAddF]=useState({name:"",phone:"",email:"",address:"",homeSize:"",notes:"",isFirst:true});
  // Hour block state
  const [showHourBlock,setShowHourBlock]=useState(false);
  const [hbFrom,setHbFrom]=useState("8:00 AM");const [hbTo,setHbTo]=useState("10:00 AM");

  const dim=getDaysInMonth(yr,mo);const fd=getFirstDay(yr,mo);
  function dayBks(d){const dk=dateKey(yr,mo,d);return bookings.filter(b=>b.date===dk).sort((a,b)=>a.slot.localeCompare(b.slot));}
  function saveBook(){
    if(!addF.name||!addSlot)return;
    const dk=dateKey(yr,mo,selDay);
    const b={id:"adm_"+Date.now(),date:dk,slot:addSlot,durationHours:addDur,recurrence:addRecur,...addF,extras:[],status:"confirmed",adminScheduled:true,createdAt:new Date().toISOString()};
    onAdminBook(b);
    // If recurring, generate future dates
    if(addRecur!=="none"){
      const futureDates=generateRecurringDates(b,12);
      futureDates.forEach((fd2,i)=>{
        const recurB={...b,id:"adm_"+Date.now()+i+1,date:fd2,parentId:b.id};
        onAdminBook(recurB);
      });
    }
    setShowAdd(false);setAddSlot("");setAddDur(2);setAddRecur("none");
    setAddF({name:"",phone:"",email:"",address:"",homeSize:"",notes:"",isFirst:true});
  }

  const selDow=selDay?new Date(yr,mo,selDay).getDay():null;
  const isWknd=selDow===0||selDow===6;
  const selDk=selDay?dateKey(yr,mo,selDay):null;
  const isDayBlocked=selDk&&(blockedData?.days||[]).includes(selDk);
  const isWeekdayClosed=selDow&&(blockedData?.closedWeekdays||[]).includes(selDow);
  const dayBlockedSlots=selDk?(blockedData?.slots||{})[selDk]||[]:[];
  const dayHourBlocks=selDk?(blockedData?.hourBlocks||{})[selDk]||[]:[];
  const selDayBks=selDay?dayBks(selDay):[];

  return(
    <div>
      {/* Month nav */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <Btn v="outline" onClick={()=>{if(mo===0){setYr(y=>y-1);setMo(11);}else setMo(m=>m-1);}} style={{padding:"5px 14px"}}>‹</Btn>
        <strong style={{fontFamily:"Georgia,serif",fontSize:17}}>{MONTHS[mo]} {yr}</strong>
        <Btn v="outline" onClick={()=>{if(mo===11){setYr(y=>y+1);setMo(0);}else setMo(m=>m+1);}} style={{padding:"5px 14px"}}>›</Btn>
      </div>

      {/* Day labels */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:6}}>
        {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:11,color:C.gray,fontWeight:"bold",padding:"3px 0"}}>{d}</div>)}
      </div>

      {/* Calendar grid */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3,marginBottom:20}}>
        {Array(fd).fill(null).map((_,i)=><div key={`_${i}`}/>)}
        {Array(dim).fill(null).map((_,i)=>{
          const d=i+1;const dow=new Date(yr,mo,d).getDay();const wknd=dow===0||dow===6;
          const isToday=yr===t.y&&mo===t.m&&d===t.d;const isSel=selDay===d;
          const dk=dateKey(yr,mo,d);
          const dayBlocked=(blockedData?.days||[]).includes(dk);
          const wdClosed=(blockedData?.closedWeekdays||[]).includes(dow);
          const bks=dayBks(d);const ests=bks.filter(b=>b.isFirst).length;const regs=bks.filter(b=>!b.isFirst).length;
          const isClosed=dayBlocked||wdClosed;
          return(
            <div key={d} onClick={()=>setSelDay(isSel?null:d)}
              style={{borderRadius:7,padding:"6px 3px",textAlign:"center",cursor:"pointer",fontSize:12,minHeight:46,
                background:isClosed?"#FEE2E2":isSel?C.navy:isToday?C.navyDark:wknd?"#FFF8F0":"#fff",
                color:isClosed?C.red:isSel||isToday?"#fff":C.navy,
                border:`2px solid ${isClosed?C.red:isSel?C.navy:wknd?C.orange:"transparent"}`}}>
              <div style={{fontWeight:isToday?"bold":"normal"}}>{d}</div>
              {isClosed&&<div style={{fontSize:7,color:C.red}}>Closed</div>}
              {wknd&&!isClosed&&!isSel&&<div style={{fontSize:7,color:C.orange}}>Wknd</div>}
              <div style={{display:"flex",justifyContent:"center",gap:2,marginTop:2,flexWrap:"wrap"}}>
                {Array(ests).fill(null).map((_,i)=><div key={`e${i}`} style={{width:5,height:5,borderRadius:"50%",background:isSel?C.greenLight:C.green}}/>)}
                {Array(regs).fill(null).map((_,i)=><div key={`r${i}`} style={{width:5,height:5,borderRadius:"50%",background:isSel?"#AAD":C.blue}}/>)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected day panel */}
      {selDay&&(
        <div style={{background:C.light,borderRadius:10,padding:16,marginBottom:8}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12,flexWrap:"wrap",gap:8}}>
            <div style={{fontWeight:"bold",color:C.navy,fontSize:15}}>
              {DAYS[selDow]} {MONTHS[mo]} {selDay}
              {isWknd&&<span style={{marginLeft:6,background:C.orange,color:"#fff",borderRadius:10,padding:"2px 8px",fontSize:11}}>Weekend</span>}
              {(isDayBlocked||isWeekdayClosed)&&<span style={{marginLeft:6,background:C.red,color:"#fff",borderRadius:10,padding:"2px 8px",fontSize:11}}>🚫 Closed</span>}
            </div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <Btn onClick={()=>setShowAdd(v=>!v)} style={{padding:"6px 12px",fontSize:12}}>+ Schedule</Btn>
              <Btn v="outline" onClick={()=>setShowHourBlock(v=>!v)} style={{padding:"6px 12px",fontSize:12,color:C.orange,borderColor:C.orange}}>⏰ Block Hours</Btn>
              {isDayBlocked
                ?<Btn v="outline" onClick={()=>onUnblockDay(selDk)} style={{padding:"6px 12px",fontSize:12,color:C.green,borderColor:C.green}}>✓ Unblock Day</Btn>
                :<Btn v="red" onClick={()=>onBlockDay(selDk)} style={{padding:"6px 12px",fontSize:12}}>🚫 Block Full Day</Btn>
              }
            </div>
          </div>

          {/* Hour block form */}
          {showHourBlock&&(
            <div style={{background:"#FFF9F0",border:`1px solid ${C.orange}`,borderRadius:10,padding:16,marginBottom:12}}>
              <div style={{fontWeight:"bold",color:"#E67E22",marginBottom:12,fontSize:14}}>⏰ Block a Time Range</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10,alignItems:"end"}}>
                <div><label style={S.label}>From</label>
                  <select style={S.select} value={hbFrom} onChange={e=>setHbFrom(e.target.value)}>
                    {ALL_SLOTS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div><label style={S.label}>To</label>
                  <select style={S.select} value={hbTo} onChange={e=>setHbTo(e.target.value)}>
                    {ALL_SLOTS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <Btn onClick={()=>{onBlockHours(selDk,SLOT_HOURS[hbFrom],SLOT_HOURS[hbTo]);setShowHourBlock(false);}} style={{padding:"11px 16px"}}>Block</Btn>
              </div>
              <div style={{fontSize:11,color:C.gray,marginTop:8}}>Slots between these times will be blocked on the booking calendar.</div>
              {/* Show existing hour blocks */}
              {dayHourBlocks.length>0&&(
                <div style={{marginTop:12}}>
                  <div style={{fontSize:12,fontWeight:"bold",color:"#E67E22",marginBottom:6}}>Currently Blocked:</div>
                  {dayHourBlocks.map((hb,i)=>(
                    <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fff",borderRadius:6,padding:"6px 10px",marginBottom:4,fontSize:13}}>
                      <span>{ALL_SLOTS.find(s=>SLOT_HOURS[s]===hb.from)||`${hb.from}:00`} → {ALL_SLOTS.find(s=>SLOT_HOURS[s]===hb.to)||`${hb.to}:00`}</span>
                      <button onClick={()=>onUnblockHours(selDk,i)} style={{background:"none",border:"none",color:C.red,cursor:"pointer",fontSize:13}}>✕ Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Individual slot blocking */}
          <div style={{marginBottom:14}}>
            <div style={{...S.label,marginBottom:8}}>Block/Unblock Individual Slots:</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {ALL_SLOTS.map(slot=>{
                const isHourBlocked=(dayHourBlocks||[]).some(hb=>SLOT_HOURS[slot]>=hb.from&&SLOT_HOURS[slot]<hb.to);
                const isSlotBlocked=dayBlockedSlots.includes(slot);
                const hasBk=selDayBks.some(b=>b.slot===slot);
                const blocked=isHourBlocked||isSlotBlocked;
                return(
                  <button key={slot} onClick={()=>!hasBk&&(isSlotBlocked?onUnblockSlot(selDk,slot):!isHourBlocked&&onBlockSlot(selDk,slot))} disabled={hasBk||isHourBlocked}
                    style={{padding:"6px 10px",borderRadius:6,fontSize:11,cursor:(hasBk||isHourBlocked)?"not-allowed":"pointer",fontFamily:"inherit",
                      border:`1px solid ${blocked?C.red:hasBk?"#E5E7EB":"#C5D5EC"}`,
                      background:isHourBlocked?"#FEE2E2":isSlotBlocked?"#FEE2E2":hasBk?"#F9FAFB":"#fff",
                      color:blocked?C.red:hasBk?"#CCC":C.navy}}>
                    {slot} {hasBk?"📅":isHourBlocked?"⏰":isSlotBlocked?"🚫":""}
                  </button>
                );
              })}
            </div>
            <div style={{fontSize:11,color:C.gray,marginTop:6}}>📅 = has booking · 🚫 = blocked · ⏰ = hour range blocked</div>
          </div>

          {/* Bookings list */}
          {selDayBks.length===0&&!showAdd&&<div style={{color:C.gray,fontStyle:"italic",fontSize:13,marginBottom:8}}>No appointments. Click "+ Schedule" to add one.</div>}
          {selDayBks.map(b=>{
            const emp=employees.find(e=>e.id===b.assignedTo);
            return(
              <div key={b.id} onClick={()=>setSelB(b)} style={{background:"#fff",borderRadius:8,padding:"11px 14px",marginBottom:8,cursor:"pointer",borderLeft:`4px solid ${b.isFirst?C.green:C.blue}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:6}}>
                  <div>
                    <div style={{fontWeight:"bold",fontSize:14}}>{b.slot} · {b.name} {b.adminScheduled&&<span style={{fontSize:11,color:C.gray}}>· Admin</span>} {b.recurrence&&b.recurrence!=="none"&&<span style={{fontSize:11,color:C.blue,background:C.blue+"15",borderRadius:8,padding:"1px 6px"}}>🔄 {b.recurrence}</span>}</div>
                    <div style={{color:C.gray,fontSize:12}}>{b.address} · {b.homeSize} {b.durationHours&&b.durationHours>1?`· ${b.durationHours}h`:""}</div>
                    {emp&&<div style={{color:C.green,fontSize:11,marginTop:2}}>👤 {emp.name}</div>}
                  </div>
                  {b.isFirst&&<span style={{background:C.green+"20",color:C.green,border:`1px solid ${C.green}`,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:"bold"}}>Free Estimate</span>}
                </div>
              </div>
            );
          })}

          {/* Add booking form */}
          {showAdd&&(
            <div style={{background:"#fff",borderRadius:10,padding:18,marginTop:10,border:`2px solid ${C.blue}`}}>
              <div style={{fontWeight:"bold",color:C.navy,marginBottom:14,fontSize:14}}>
                📅 Schedule for {MONTHS[mo]} {selDay}
                {isWknd&&<span style={{marginLeft:8,color:C.orange,fontSize:12}}>⚠️ Weekend — Admin only</span>}
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                <div><label style={S.label}>Client Name *</label><input style={S.input} value={addF.name} onChange={e=>setAddF(f=>({...f,name:e.target.value}))} placeholder="Jane Smith"/></div>
                <div><label style={S.label}>Phone</label><input style={S.input} value={addF.phone} onChange={e=>setAddF(f=>({...f,phone:e.target.value.replace(/[^\d\s\-().]/g,"")}))} type="tel" placeholder="(240) 000-0000"/></div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                <div><label style={S.label}>Email</label><input style={S.input} value={addF.email} onChange={e=>setAddF(f=>({...f,email:e.target.value}))} placeholder="jane@email.com"/></div>
                <div><label style={S.label}>Time Slot *</label>
                  <select style={S.select} value={addSlot} onChange={e=>setAddSlot(e.target.value)}>
                    <option value="">— Select —</option>{ALL_SLOTS.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {/* Duration and Recurrence */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                <div>
                  <label style={S.label}>Duration (hours)</label>
                  <select style={S.select} value={addDur} onChange={e=>setAddDur(Number(e.target.value))}>
                    {[1,2,3,4,5,6,7,8].map(h=><option key={h} value={h}>{h} hour{h>1?"s":""}</option>)}
                  </select>
                  <div style={{fontSize:11,color:C.gray,marginTop:4}}>Blocks this many hours on the calendar</div>
                </div>
                <div>
                  <label style={S.label}>Recurring Schedule</label>
                  <select style={S.select} value={addRecur} onChange={e=>setAddRecur(e.target.value)}>
                    {RECUR_OPTIONS.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                  {addRecur!=="none"&&<div style={{fontSize:11,color:C.blue,marginTop:4}}>✅ Auto-books next 12 occurrences</div>}
                </div>
              </div>
              <div style={{marginBottom:10}}><label style={S.label}>Address</label><input style={S.input} value={addF.address} onChange={e=>setAddF(f=>({...f,address:e.target.value}))} placeholder="123 Main St"/></div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:10}}>
                <div><label style={S.label}>Home / Property Size</label>
                  <select style={S.select} value={addF.homeSize} onChange={e=>setAddF(f=>({...f,homeSize:e.target.value}))}>
                    <option value="">— Select —</option>{HOME_SIZES.map(h=><option key={h.label} value={h.label}>{h.label}</option>)}
                  </select>
                </div>
                <div><label style={S.label}>Service Type</label>
                  <select style={S.select} value={addF.isFirst?"first":"recurring"} onChange={e=>setAddF(f=>({...f,isFirst:e.target.value==="first"}))}>
                    <option value="first">Free Estimate / First Cleaning</option>
                    <option value="recurring">Recurring Cleaning</option>
                  </select>
                </div>
              </div>
              <div style={{marginBottom:14}}><label style={S.label}>Notes</label><textarea style={{...S.input,height:60,resize:"vertical"}} value={addF.notes} onChange={e=>setAddF(f=>({...f,notes:e.target.value}))} placeholder="Special instructions..."/></div>
              <div style={{display:"flex",gap:10}}>
                <Btn disabled={!addF.name||!addSlot} onClick={saveBook} style={{flex:1}}>Save Appointment</Btn>
                <Btn v="outline" onClick={()=>setShowAdd(false)}>Cancel</Btn>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Booking detail modal */}
      {selB&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}} onClick={()=>setSelB(null)}>
          <div style={{background:"#fff",borderRadius:14,padding:26,maxWidth:440,width:"92%",maxHeight:"90vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
              <h3 style={{fontFamily:"Georgia,serif",margin:0,color:C.navy}}>{selB.isFirst?"✨ Free Estimate":"📋 Booking"}</h3>
              <button onClick={()=>setSelB(null)} style={{background:"none",border:"none",fontSize:18,cursor:"pointer",color:C.gray}}>✕</button>
            </div>
            {[["Client",selB.name],["Phone",selB.phone],["Email",selB.email],["Date & Time",`${selB.date} @ ${selB.slot}`],
              selB.durationHours&&["Duration",`${selB.durationHours} hour(s)`],
              selB.recurrence&&selB.recurrence!=="none"&&["Recurring",RECUR_OPTIONS.find(o=>o.v===selB.recurrence)?.l],
              ["Address",selB.address],["Home Size",selB.homeSize],selB.notes&&["Notes",selB.notes]
            ].filter(Boolean).map(([k,v])=>(
              <div key={k} style={{display:"flex",gap:12,padding:"6px 0",borderBottom:"1px solid #F3F4F6",fontSize:13}}>
                <span style={{color:C.gray,minWidth:80}}>{k}</span><span style={{fontWeight:"bold",flex:1}}>{v}</span>
              </div>
            ))}
            <div style={{marginTop:16,marginBottom:14}}>
              <label style={S.label}>Assign to Employee</label>
              <select style={S.select} value={selB.assignedTo||""} onChange={e=>{const id=e.target.value?Number(e.target.value):null;onAssign(selB.id,id);setSelB(p=>({...p,assignedTo:id}));}}>
                <option value="">— Unassigned —</option>
                {employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={()=>setSelB(null)} style={{flex:1}}>Close</Btn>
              <button onClick={()=>{if(window.confirm(`Remove booking for ${selB.name}?`)){onAssign(selB.id,"DELETE");setSelB(null);}}} style={{...S.btnR,padding:"12px 14px"}}>🗑</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Closed Weekdays Manager ───────────────────────────────────────────────────
function ClosedWeekdaysPanel({blockedData,onToggleWeekday}){
  const WEEKDAY_NAMES=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const closed=blockedData?.closedWeekdays||[];
  return(
    <div style={{background:"#fff",borderRadius:10,padding:20,border:"1px solid #E5E7EB",marginBottom:16}}>
      <div style={{fontWeight:"bold",color:C.navy,marginBottom:12,fontSize:15}}>📅 Set Regular Closed Days</div>
      <div style={{fontSize:13,color:C.gray,marginBottom:14}}>Toggle any weekday to always close it for customer bookings. You can still schedule from admin.</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:8}}>
        {WEEKDAY_NAMES.map((name,dow)=>{
          const isClosed=closed.includes(dow);
          const isWeekend=dow===0||dow===6;
          return(
            <button key={dow} onClick={()=>!isWeekend&&onToggleWeekday(dow)}
              style={{padding:"10px 8px",borderRadius:8,border:`2px solid ${isClosed?C.red:isWeekend?C.orange:"#E5E7EB"}`,
                background:isClosed?"#FEE2E2":isWeekend?"#FFF8F0":"#fff",
                color:isClosed?C.red:isWeekend?C.orange:C.navy,
                cursor:isWeekend?"not-allowed":"pointer",fontSize:13,fontFamily:"inherit",fontWeight:isClosed?"bold":"normal"}}>
              {name}<br/><span style={{fontSize:11}}>{isWeekend?"Always closed":isClosed?"🚫 Closed":"✓ Open"}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Admin Dashboard ───────────────────────────────────────────────────────────
function AdminDash({onLogout,bookings,blockedData,leads=[],onAssign,onAdminBook,onBlockDay,onUnblockDay,onBlockSlot,onUnblockSlot,onBlockHours,onUnblockHours,onToggleWeekday}){
  const [employees,setEmployees]=useState(loadEmployees);
  const [tab,setTab]=useState("estimates");
  const [newName,setNewName]=useState("");const [newPin,setNewPin]=useState("");
  const [err,setErr]=useState("");const [ok,setOk]=useState("");
  const [receipts,setReceipts]=useState(loadReceipts);
  const [receiptFor,setReceiptFor]=useState(null);
  const CLR=[C.blue,C.green,"#4A90D9","#E67E22","#9B59B6","#E74C3C"];
  const estimates=bookings.filter(b=>b.isFirst);

  function saveReceipt(r){const u=[r,...receipts];setReceipts(u);saveReceipts(u);}
  function addEmp(){
    if(!newName.trim()){setErr("Enter a name.");return;}
    if(newPin.length!==6||!/^\d+$/.test(newPin)){setErr("PIN must be 6 digits.");return;}
    if(employees.find(e=>e.pin===newPin)){setErr("PIN in use.");return;}
    const u=[...employees,{id:Date.now(),name:newName.trim(),pin:newPin,color:CLR[employees.length%CLR.length]}];
    setEmployees(u);saveEmployees(u);setNewName("");setNewPin("");setErr("");setOk(`✅ ${newName.trim()} added!`);setTimeout(()=>setOk(""),3000);
  }
  function removeEmp(id){if(!window.confirm("Remove?"))return;const u=employees.filter(e=>e.id!==id);setEmployees(u);saveEmployees(u);}
  function changePin(id){const p=window.prompt("New 6-digit PIN:");if(!p||p.length!==6||!/^\d+$/.test(p)){if(p)alert("Must be 6 digits.");return;}if(employees.find(e=>e.pin===p&&e.id!==id)){alert("PIN in use.");return;}const u=employees.map(e=>e.id===id?{...e,pin:p}:e);setEmployees(u);saveEmployees(u);}
  const tabS=(a)=>({flex:1,textAlign:"center",padding:"9px 4px",cursor:"pointer",background:"none",fontFamily:"inherit",fontSize:12,border:"none",borderBottom:`3px solid ${a?C.blue:"transparent"}`,color:a?C.blue:C.gray,fontWeight:a?"bold":"normal",whiteSpace:"nowrap"});

  return(
    <div style={{maxWidth:780,margin:"0 auto",padding:"24px 16px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{margin:0,fontFamily:"Georgia,serif",color:C.navy}}>🔐 Admin Dashboard</h2><div style={{color:C.gray,fontSize:13}}>Criss Maid Cleaning</div></div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>{if(window.confirm("Clear ALL bookings?")){{saveBookings([]);window.location.reload();}}}} style={{background:"transparent",color:C.gray,border:"1px solid #E5E7EB",borderRadius:8,padding:"7px 10px",fontSize:11,cursor:"pointer"}}>🗑 Clear All</button>
          <Btn v="outline" onClick={onLogout} style={{color:C.red,borderColor:C.red,padding:"8px 14px",fontSize:13}}>Log Out</Btn>
        </div>
      </div>

      <div style={{display:"flex",background:"#fff",borderRadius:10,marginBottom:20,boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden",flexWrap:"wrap"}}>
        <button style={tabS(tab==="estimates")} onClick={()=>setTab("estimates")}>✨ Estimates {estimates.length>0&&<span style={{background:C.blue,color:"#fff",borderRadius:10,padding:"1px 6px",fontSize:10,marginLeft:3}}>{estimates.length}</span>}</button>
        <button style={tabS(tab==="calendar")} onClick={()=>setTab("calendar")}>📅 Calendar</button>
        <button style={tabS(tab==="clients")} onClick={()=>setTab("clients")}>👥 Clients</button>
        <button style={tabS(tab==="receipts")} onClick={()=>setTab("receipts")}>🧾 Receipts</button>
        <button style={tabS(tab==="leads")} onClick={()=>setTab("leads")}>📧 Leads {leads.length>0&&<span style={{background:C.gold,color:C.navy,borderRadius:10,padding:"1px 6px",fontSize:10,marginLeft:3}}>{leads.length}</span>}</button>
        <button style={tabS(tab==="employees")} onClick={()=>setTab("employees")}>👤 Staff</button>
      </div>

      {tab==="estimates"&&(
        <div style={S.card}>
          <div style={S.title}>Free Estimate Requests</div>
          {estimates.length===0?<div style={{color:C.gray,fontStyle:"italic"}}>No free estimate requests yet.</div>
            :estimates.map(b=>{const emp=employees.find(e=>e.id===b.assignedTo);return(
              <div key={b.id} style={{padding:"14px 0",borderBottom:"1px solid #F3F4F6"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,flexWrap:"wrap"}}>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                      <span style={{fontWeight:"bold",fontSize:15}}>{b.name}</span>
                      {emp?<span style={{background:C.green+"20",color:C.green,border:`1px solid ${C.green}`,borderRadius:20,padding:"2px 10px",fontSize:11}}>👤 {emp.name}</span>:<span style={{background:C.red+"15",color:C.red,border:`1px solid ${C.red}`,borderRadius:20,padding:"2px 10px",fontSize:11}}>Unassigned</span>}
                    </div>
                    <div style={{color:C.gray,fontSize:12,lineHeight:1.7}}>📅 {b.date} @ {b.slot}<br/>📍 {b.address}<br/>🏠 {b.homeSize}<br/>📱 {b.phone}{b.email&&` · ✉️ ${b.email}`}{b.notes&&<><br/>📝 {b.notes}</>}</div>
                  </div>
                  <div style={{minWidth:150}}>
                    <label style={S.label}>Assign to:</label>
                    <select style={{...S.select,fontSize:12}} value={b.assignedTo||""} onChange={e=>onAssign(b.id,e.target.value?Number(e.target.value):null)}>
                      <option value="">— Unassigned —</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            );})}
        </div>
      )}

      {tab==="calendar"&&(
        <div>
          <ClosedWeekdaysPanel blockedData={blockedData} onToggleWeekday={onToggleWeekday}/>
          <div style={S.card}>
            <div style={S.title}>📅 Schedule & Availability</div>
            <div style={{color:C.gray,fontSize:13,marginBottom:12}}>Click any day to view bookings, block time, schedule appointments, or set recurring schedules.</div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap",fontSize:12,marginBottom:16}}>
              <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:C.green,display:"inline-block"}}/>Free Estimate</span>
              <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:8,height:8,borderRadius:"50%",background:C.blue,display:"inline-block"}}/>Regular Booking</span>
              <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"#FEE2E2",border:"1px solid "+C.red,display:"inline-block"}}/>Closed/Blocked</span>
              <span style={{display:"flex",alignItems:"center",gap:4}}><span style={{width:10,height:10,borderRadius:2,background:"#FFF8F0",border:`1px solid ${C.orange}`,display:"inline-block"}}/>Weekend</span>
            </div>
            <AdminCal bookings={bookings} employees={employees} blockedData={blockedData} onAssign={onAssign} onAdminBook={onAdminBook} onBlockDay={onBlockDay} onUnblockDay={onUnblockDay} onBlockSlot={onBlockSlot} onUnblockSlot={onUnblockSlot} onBlockHours={onBlockHours} onUnblockHours={onUnblockHours}/>
          </div>
        </div>
      )}

      {tab==="clients"&&(
        <div style={S.card}>
          <div style={S.title}>👥 All Clients ({bookings.length})</div>
          {bookings.length===0?<div style={{color:C.gray,fontStyle:"italic"}}>No bookings yet.</div>
            :[...bookings].sort((a,b)=>b.createdAt?.localeCompare(a.createdAt||"")||0).map(b=>{
              const hasReceipt=receipts.some(r=>r.bookingId===b.id);
              return(
                <div key={b.id} style={{padding:"12px 0",borderBottom:"1px solid #F3F4F6"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                    <div>
                      <div style={{fontWeight:"bold",fontSize:15}}>
                        {b.name}
                        {b.isFirst&&<span style={{background:C.green+"20",color:C.green,fontSize:11,borderRadius:10,padding:"2px 6px",marginLeft:6}}>Estimate</span>}
                        {b.recurrence&&b.recurrence!=="none"&&<span style={{background:C.blue+"20",color:C.blue,fontSize:11,borderRadius:10,padding:"2px 6px",marginLeft:6}}>🔄 {b.recurrence}</span>}
                        {hasReceipt&&<span style={{background:C.blue+"20",color:C.blue,fontSize:11,borderRadius:10,padding:"2px 6px",marginLeft:6}}>🧾 Receipt</span>}
                      </div>
                      <div style={{color:C.gray,fontSize:12,lineHeight:1.7,marginTop:2}}>📅 {b.date} @ {b.slot} · 🏠 {b.homeSize}<br/>📍 {b.address}<br/>{b.phone&&`📱 ${b.phone}`}{b.email&&` · ✉️ ${b.email}`}</div>
                    </div>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      <Btn onClick={()=>setReceiptFor(b)} style={{padding:"6px 10px",fontSize:11,background:C.green}}>🧾 Receipt</Btn>
                      <button onClick={()=>{if(window.confirm(`Remove ${b.name}?`))onAssign(b.id,"DELETE");}} style={{...S.btnR,padding:"6px 10px",fontSize:11}}>🗑</button>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {tab==="receipts"&&(
        <div style={S.card}>
          <div style={S.title}>🧾 Receipt History ({receipts.length})</div>
          {receipts.length===0?<div style={{color:C.gray,fontStyle:"italic"}}>No receipts yet. Go to Clients to issue one.</div>
            :[...receipts].sort((a,b)=>b.sentAt?.localeCompare(a.sentAt||"")||0).map(r=>(
              <div key={r.id} style={{padding:"12px 0",borderBottom:"1px solid #F3F4F6"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
                  <div>
                    <div style={{fontWeight:"bold",fontSize:15}}>#{r.id} — {r.clientName}</div>
                    <div style={{color:C.gray,fontSize:12,lineHeight:1.7,marginTop:2}}>📅 Paid: {r.date} · Service: {r.serviceDate} · 💳 {r.payMethod}</div>
                    {r.lines.map(l=><div key={l.id} style={{fontSize:12,color:C.navy}}>• {l.desc}: <strong>${parseFloat(l.amount||0).toFixed(2)}</strong></div>)}
                  </div>
                  <div style={{fontSize:22,fontWeight:"bold",color:C.green}}>${r.total.toFixed(2)}</div>
                </div>
              </div>
            ))}
        </div>
      )}

      {tab==="leads"&&(
        <div style={S.card}>
          <div style={S.title}>📧 Promo Code Leads ({leads.length})</div>
          {leads.length===0?<div style={{color:C.gray,fontStyle:"italic"}}>No leads yet. The popup captures emails automatically.</div>
            :[...leads].sort((a,b)=>b.createdAt?.localeCompare(a.createdAt||"")||0).map(l=>(
              <div key={l.id} style={{padding:"12px 0",borderBottom:"1px solid #F3F4F6",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
                <div>
                  <div style={{fontWeight:"bold",fontSize:15}}>{l.name||"(No name)"}</div>
                  <div style={{color:C.gray,fontSize:13,marginTop:2}}>✉️ {l.email} · 🎟 {l.code} · {new Date(l.createdAt).toLocaleDateString()}</div>
                </div>
                <a href={`mailto:${l.email}?subject=Your 20% Off — Criss Maid Cleaning&body=Hi ${l.name||"there"},%0A%0AJust following up on your 20% discount! Use code: ${l.code}%0A%0ABook at crissmaidcleaning.com or call (240) 413-4313%0A%0A— Criss Maid Cleaning`}
                  style={{background:C.blue,color:"#fff",borderRadius:8,padding:"7px 12px",fontSize:12,textDecoration:"none"}}>📧 Follow Up</a>
              </div>
            ))}
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
            {employees.length===0&&<div style={{color:C.gray,fontStyle:"italic"}}>No employees yet.</div>}
            {employees.map(emp=>(
              <div key={emp.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:"1px solid #F3F4F6"}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:emp.color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:"bold",fontSize:16}}>{emp.name.charAt(0)}</div>
                <div style={{flex:1}}><div style={{fontWeight:"bold"}}>{emp.name}</div><div style={{color:C.gray,fontSize:12}}>PIN: ••••••</div></div>
                <div style={{display:"flex",gap:8}}>
                  <Btn v="outline" onClick={()=>changePin(emp.id)} style={{padding:"6px 10px",fontSize:12}}>Change PIN</Btn>
                  <button onClick={()=>removeEmp(emp.id)} style={{...S.btnR,padding:"6px 10px",fontSize:12}}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {receiptFor&&<ReceiptModal booking={receiptFor} onClose={()=>setReceiptFor(null)} onSave={saveReceipt}/>}
    </div>
  );
}

// ── Employee Login ────────────────────────────────────────────────────────────
function EmpLogin({onLogin,onAdmin}){
  const [pin,setPin]=useState("");const [err,setErr]=useState("");const [shake,setShake]=useState(false);
  const [adminMode,setAdminMode]=useState(false);const [ap,setAp]=useState("");const [ae,setAe]=useState("");
  const keys=["1","2","3","4","5","6","7","8","9","C","0","⌫"];
  function press(k){if(pin.length<6)setPin(p=>p+k);}
  function back(){setPin(p=>p.slice(0,-1));setErr("");}
  function clr(){setPin("");setErr("");}
  function tryLogin(){const emps=loadEmployees();const emp=emps.find(e=>e.pin===pin);if(emp){safeSet("cmc_employee",JSON.stringify(emp));onLogin(emp);}else{setErr("Incorrect PIN.");setShake(true);setTimeout(()=>{setShake(false);setPin("");setErr("");},1200);}}
  function tryAdmin(){if(ap===ADMIN_PASSWORD){safeSet("cmc_admin","true");onAdmin();}else{setAe("Incorrect password.");setAp("");}}
  if(adminMode)return(
    <div style={{maxWidth:360,margin:"60px auto",padding:"0 20px"}}>
      <div style={{...S.card,textAlign:"center"}}>
        <div style={{background:`linear-gradient(135deg,${C.navyDark},${C.navy})`,borderRadius:10,padding:"18px 0",marginBottom:20}}>
          <div style={{fontSize:32,marginBottom:6}}>🔐</div>
          <div style={{color:"#fff",fontFamily:"Georgia,serif",fontSize:17,fontWeight:"bold"}}>Admin Access</div>
        </div>
        <Fld label="Admin Password"><input type="password" value={ap} onChange={e=>{setAp(e.target.value);setAe("");}} onKeyDown={e=>e.key==="Enter"&&tryAdmin()} placeholder="Enter admin password" style={{...S.input,textAlign:"center",letterSpacing:4}}/></Fld>
        {ae&&<div style={{color:C.red,fontSize:12,marginBottom:10}}>{ae}</div>}
        <Btn onClick={tryAdmin} style={{width:"100%",marginBottom:10}}>Access Admin →</Btn>
        <Btn v="outline" onClick={()=>{setAdminMode(false);setAp("");setAe("");}} style={{width:"100%"}}>← Back</Btn>
      </div>
    </div>
  );
  return(
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
            <button key={k} onClick={()=>{if(k==="⌫")back();else if(k==="C")clr();else press(k);}}
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

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App(){
  const [page,setPage]=useState("home");
  const [bookings,setBookings]=useState(loadBookings);
  const [blocked,setBlocked]=useState(loadBlocked);
  const [employee,setEmployee]=useState(null);
  const [isAdmin,setIsAdmin]=useState(false);
  const [toast,setToast]=useState(null);
  const [showPromo,setShowPromo]=useState(false);
  const [leads,setLeads]=useState(loadLeads);
  const [dbReady,setDbReady]=useState(false);

  // Load from Supabase on startup
  useEffect(()=>{
    async function loadFromDB() {
      try {
        // Load bookings
        const dbBookings = await sbGetBookings();
        if (dbBookings && dbBookings.length >= 0) {
          setBookings(dbBookings);
          saveBookings(dbBookings);
        }
        // Load blocked/settings
        const dbBlocked = await sbGetSettings("blocked");
        if (dbBlocked) {
          setBlocked(dbBlocked);
          saveBlocked(dbBlocked);
        }
        setDbReady(true);
      } catch(e) {
        console.error("DB load error:", e);
        setDbReady(true); // fall back to localStorage
      }
    }
    loadFromDB();
  },[]);

  // Promo popup disabled
  useEffect(()=>{saveBookings(bookings);},[bookings]);
  useEffect(()=>{saveBlocked(blocked);},[blocked]);
  useEffect(()=>{try{const e=safeGet("cmc_employee");if(e)setEmployee(JSON.parse(e));if(safeGet("cmc_admin")==="true")setIsAdmin(true);}catch{}},[]);

  function toast2(msg){setToast(msg);setTimeout(()=>setToast(null),3000);}
  function handleLeadCapture(lead){const u=[lead,...leads];setLeads(u);saveLeads(u);}

  async function handleBook(b){
    setBookings(prev=>{const u=[...prev,b];saveBookings(u);return u;});
    await sbSaveBooking(b);
    toast2("Booking confirmed! ✓");
  }

  async function handleAssign(id,empId){
    setBookings(prev=>{
      const u=empId==="DELETE"?prev.filter(b=>b.id!==id):prev.map(b=>b.id===id?{...b,assignedTo:empId}:b);
      saveBookings(u);
      if(empId==="DELETE") sbDeleteBooking(id);
      else { const updated=u.find(b=>b.id===id); if(updated) sbUpdateBooking(updated); }
      return u;
    });
  }

  async function handleAdminBook(b){
    setBookings(prev=>{const u=[...prev,b];saveBookings(u);return u;});
    await sbSaveBooking(b);
    toast2(`✅ ${b.name} scheduled`);
  }

  async function saveBlockedToDB(newBlocked){
    saveBlocked(newBlocked);
    await sbSaveSettings("blocked", newBlocked);
  }

  function handleBlockDay(dk){setBlocked(prev=>{const u={...prev,days:[...(prev.days||[]).filter(d=>d!==dk),dk]};saveBlockedToDB(u);return u;});toast2("Day blocked");}
  function handleUnblockDay(dk){setBlocked(prev=>{const u={...prev,days:(prev.days||[]).filter(d=>d!==dk)};saveBlockedToDB(u);return u;});toast2("Day unblocked");}
  function handleBlockSlot(dk,slot){setBlocked(prev=>{const ex=(prev.slots||{})[dk]||[];const u={...prev,slots:{...prev.slots,[dk]:[...ex.filter(s=>s!==slot),slot]}};saveBlockedToDB(u);return u;});toast2("Slot blocked");}
  function handleUnblockSlot(dk,slot){setBlocked(prev=>{const u={...prev,slots:{...prev.slots,[dk]:((prev.slots||{})[dk]||[]).filter(s=>s!==slot)}};saveBlockedToDB(u);return u;});toast2("Slot unblocked");}
  function handleBlockHours(dk,fromH,toH){setBlocked(prev=>{const ex=(prev.hourBlocks||{})[dk]||[];const u={...prev,hourBlocks:{...prev.hourBlocks,[dk]:[...ex,{from:fromH,to:toH}]}};saveBlockedToDB(u);return u;});toast2(`Hours blocked`);}
  function handleUnblockHours(dk,idx){setBlocked(prev=>{const ex=(prev.hourBlocks||{})[dk]||[];const u={...prev,hourBlocks:{...prev.hourBlocks,[dk]:ex.filter((_,i)=>i!==idx)}};saveBlockedToDB(u);return u;});toast2("Hour block removed");}
  function handleToggleWeekday(dow){setBlocked(prev=>{const closed=prev.closedWeekdays||[];const u={...prev,closedWeekdays:closed.includes(dow)?closed.filter(d=>d!==dow):[...closed,dow]};saveBlockedToDB(u);return u;});}

  function logout(){safeRemove("cmc_employee");safeRemove("cmc_admin");setEmployee(null);setIsAdmin(false);setPage("home");}
  const navBtn=(active)=>({background:active?C.blue:"transparent",color:"#fff",border:`1px solid ${active?C.blue:"rgba(255,255,255,0.4)"}`,borderRadius:6,padding:"7px 14px",cursor:"pointer",fontSize:13,fontFamily:"inherit",whiteSpace:"nowrap"});
  const Toast=()=>toast?<div style={{position:"fixed",bottom:28,right:24,background:C.blue,color:"#fff",padding:"12px 22px",borderRadius:10,boxShadow:"0 4px 16px rgba(0,0,0,0.2)",fontSize:14,zIndex:9999}}>{toast}</div>:null;

  if(page==="employee"&&isAdmin)return(
    <div style={{fontFamily:"Georgia,serif",background:C.cream,minHeight:"100vh"}}>
      <header style={{background:C.navyDark,padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <img src="/logo.png" alt="Criss Maid Cleaning" style={{height:40,objectFit:"contain"}}/>
        <span style={{color:C.gold,fontSize:13,fontWeight:"bold"}}>🔐 Admin</span>
      </header>
      <AdminDash onLogout={logout} bookings={bookings} blockedData={blocked} leads={leads} onAssign={handleAssign} onAdminBook={handleAdminBook} onBlockDay={handleBlockDay} onUnblockDay={handleUnblockDay} onBlockSlot={handleBlockSlot} onUnblockSlot={handleUnblockSlot} onBlockHours={handleBlockHours} onUnblockHours={handleUnblockHours} onToggleWeekday={handleToggleWeekday}/>
      <Toast/>
    </div>
  );

  if(page==="employee"&&employee)return(
    <div style={{fontFamily:"Georgia,serif",background:C.cream,minHeight:"100vh"}}>
      <header style={{background:C.navyDark,padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <img src="/logo.png" alt="Criss Maid Cleaning" style={{height:40,objectFit:"contain"}}/>
        <span style={{color:"rgba(255,255,255,0.8)",fontSize:13}}>👋 {employee.name}</span>
      </header>
      <EmpSchedule bookings={bookings} employee={employee} onLogout={logout}/>
      <Toast/>
    </div>
  );

  if(page==="employee")return(
    <div style={{fontFamily:"Georgia,serif",background:C.cream,minHeight:"100vh"}}>
      <header style={{background:C.navyDark,padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <img src="/logo.png" alt="Criss Maid Cleaning" style={{height:40,objectFit:"contain"}}/>
        <button onClick={()=>setPage("home")} style={{...navBtn(false),fontSize:12}}>← Back</button>
      </header>
      <EmpLogin onLogin={emp=>{setEmployee(emp);toast2(`Welcome, ${emp.name}! 👋`);}} onAdmin={()=>{setIsAdmin(true);toast2("Welcome, Admin! 🔐");}}/>
      <Toast/>
    </div>
  );

  return(
    <div style={{fontFamily:"Georgia,serif",background:C.cream,minHeight:"100vh",color:C.navy}}>
      <header style={{background:C.navyDark,padding:"10px 16px",display:"flex",flexDirection:"column",alignItems:"center",gap:8,boxShadow:"0 2px 12px rgba(0,0,0,0.2)"}}>
        <nav style={{display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
          {[["home","Home"],["book","Book Now"],["pricing","Pricing"],["about","About"],["employee","Employee"]].map(([k,l])=>(
            <button key={k} onClick={()=>setPage(k)} style={navBtn(page===k)}>{l}</button>
          ))}
        </nav>
      </header>

      {page==="home"&&(
        <>
          <div style={{background:`linear-gradient(135deg,${C.navyDark} 0%,#1a5bb5 60%,${C.blue} 100%)`,padding:"48px 20px",textAlign:"center"}}>
            <img src="/logo.png" alt="Criss Maid Cleaning" style={{width:"85%",maxWidth:400,objectFit:"contain",marginBottom:14}}/>
            <p style={{color:"#fff",fontWeight:"bold",fontSize:16,letterSpacing:2,marginBottom:24}}>Professional · Reliable · Spotless</p>
            <button onClick={()=>setPage("book")} style={{background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"15px 36px",fontSize:15,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 20px rgba(75,173,46,0.4)"}}>Book a Cleaning →</button>
          </div>
          <div style={S.section}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:18,marginBottom:20}}>
              {[["🏠","All Home Sizes","From studios to 5+ bedrooms. First cleaning includes everything."],["👥","2 or 3-Person Crews","$75/hr for 2, $130/hr for 3. Crew size quoted after free estimate."],["🏢","Commercial Services","Apartment complexes, condos, HOAs & office buildings. Call for quote."],["⭐","Add-On Services","Fridge & oven ($45 each) for recurring clients. Silver cleaning quoted."]].map(([icon,t,d])=>(
                <div key={t} style={{...S.card,textAlign:"center",marginBottom:0}}>
                  <div style={{fontSize:32,marginBottom:10}}>{icon}</div>
                  <div style={{fontWeight:"bold",fontSize:15,marginBottom:6,fontFamily:"Georgia,serif"}}>{t}</div>
                  <div style={{color:C.gray,fontSize:13,lineHeight:1.5}}>{d}</div>
                </div>
              ))}
            </div>
            <div style={{...S.card,display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:220}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:20,marginBottom:6}}>Ready for a spotless home?</div>
                <div style={{color:C.gray,fontSize:13}}>Book online in minutes. We'll reach out to confirm and provide your custom quote.</div>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <Btn onClick={()=>setPage("book")}>Book Now</Btn>
                <Btn v="outline" onClick={()=>setPage("pricing")}>See Pricing</Btn>
              </div>
            </div>
            <div style={{...S.card,background:C.navyDark,color:"#fff",display:"flex",alignItems:"center",gap:20,flexWrap:"wrap"}}>
              <div style={{fontSize:48}}>👩‍👦</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"Georgia,serif",fontSize:18,marginBottom:6}}>A Family You Can Trust</div>
                <div style={{color:"rgba(255,255,255,0.8)",fontSize:13,lineHeight:1.6}}>Mother-and-son business built on 30+ years of experience. Serving Maryland & Washington D.C.</div>
                <button onClick={()=>setPage("about")} style={{background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"9px 22px",fontSize:13,cursor:"pointer",fontFamily:"inherit",marginTop:12}}>Meet the Team →</button>
              </div>
            </div>
          </div>
        </>
      )}

      {page==="book"&&(<div style={S.section}><h2 style={{fontFamily:"Georgia,serif",marginBottom:20}}>Book a Cleaning</h2><BookingForm bookings={bookings} blockedData={blocked} onBook={handleBook}/></div>)}
      {page==="pricing"&&<PricingPage/>}
      {page==="about"&&<AboutPage onBook={()=>setPage("book")}/>}

      

      <footer style={{background:C.navy,color:"#AAA",textAlign:"center",padding:"28px 20px",fontSize:13}}>
        <div style={{color:"#fff",fontFamily:"Georgia,serif",fontSize:17,marginBottom:8}}>Criss Maid Cleaning</div>
        <div>📱 (240) 413-4313 &nbsp;·&nbsp; 📱 (301) 768-1371 &nbsp;·&nbsp; ✉️ crissmaidcleaning@gmail.com</div>
        <div style={{marginTop:6}}>Mon–Fri · 8:00 AM – 6:00 PM &nbsp;|&nbsp; Weekends: Call for Quote</div>
        <div style={{marginTop:6,color:C.blueLight}}>📍 Serving Maryland & Washington D.C.</div>
        <div style={{marginTop:14,color:"#555",fontSize:11}}>© 2026 Criss Maid Cleaning. All rights reserved.</div>
      </footer>
      <Toast/>
    </div>
  );
}
