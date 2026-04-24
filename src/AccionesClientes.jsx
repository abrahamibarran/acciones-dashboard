import { useState, useMemo, useEffect, createContext, useContext } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import * as XLSX from "xlsx";

const NAVY = "#012750";
const BLUE = "#245FA5";
const ICE = "#E5EDF9";
const MID_NAVY = "#1A3F6F";
const CTA_BLUE = "#3B82F6";
const GRAD = `linear-gradient(135deg, ${NAVY} 0%, ${BLUE} 100%)`;
const API_URL = "https://nhcbakoxxaajymbkzcvg.supabase.co/functions/v1/acciones-data";

let ACTIONS = {};
let BAJA_DATES = {};
let _O = [];
let _OX = [];
let _XD = {};
let _EC = {};
let _AD = {};
let _TD = {};
let _SV = {};
let RC_STD = [];
let RC_ESP = [];
let CS = [];
let CSP = [];
let RR = [];
let EXC = [];
let ESC_S = [];
let EXP = [];
const _CS = ["","C.parcial","P.Total(proc)","BAJA DEF."];
const _CSC = ["","#8E44AD","#E67E22","#C0392B"];
const _EXC_TAB = ["Revisar Subs","Crear Sub","Escalar"];
const _EXC_TAB_C = ["#E74C3C","#F39C12","#7F8C8D"];

const fmt = (n) => n == null ? "-" : "$" + Number(n).toLocaleString("es-MX");
const fmtK = (n) => n >= 1e6 ? "$" + (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? "$" + (n / 1e3).toFixed(0) + "K" : "$" + n;
const SubBdg = (v) => <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: v ? "#2980B918" : "#BDC3C718", color: v ? "#2980B9" : "#BDC3C7" }}>{v ? "Si" : "No"}</span>;
const CndBdg = (v, r) => {
  const cs = r[r.length-2];
  if (cs === 3) return <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 700, background: "#C0392B18", color: "#C0392B" }}>BAJA DEF.</span>;
  if (v) return <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600, background: "#D4820A18", color: "#D4820A" }}>Cand.Cancel</span>;
  if (cs === 1) return <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600, background: "#8E44AD18", color: "#8E44AD" }}>C.parcial</span>;
  if (cs === 2) return <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 9, fontWeight: 600, background: "#E67E2218", color: "#E67E22" }}>P.Total</span>;
  return <span style={{ fontSize: 10, color: "#ccc" }}>&mdash;</span>;
};


const _EM={"E":"Easytrack","S":"Sfleet","M":"Smart Tracker","T":"Tecnocontrol","R":"Traffilog"};
const _EMP_OPTS=["Todas","Easytrack","Sfleet","Smart Tracker","Tecnocontrol","Traffilog","Sin empresa"];
const _EMP_CODES={"Easytrack":"E","Sfleet":"S","Smart Tracker":"M","Tecnocontrol":"T","Traffilog":"R"};
const EmpCtx=createContext("Todas");
const BooksCtx=createContext("Todos");
const _BOOKS_OPTS=["Todos","Con Books","Sin Books"];
const getEmpCode=n=>{const v=_XD[n];if(v)return v[0];const c=_EC[n];if(c)return c[0];return"";};
const hasBooks=n=>!!_XD[n];
const empFilter=(data,emp)=>{if(emp==="Todas")return data;if(emp==="Sin empresa")return data.filter(r=>!getEmpCode(r[0]));const code=_EMP_CODES[emp];return data.filter(r=>getEmpCode(r[0])===code);};
const booksFilter=(data,bk)=>{if(bk==="Todos")return data;if(bk==="Con Books")return data.filter(r=>hasBooks(r[0]));return data.filter(r=>!hasBooks(r[0]));};
const applyFilters=(data,emp,bk)=>booksFilter(empFilter(data,emp),bk);

const _gx=n=>{const v=_XD[n];if(!v)return null;return[v[0],+v.slice(1).split(",")[0],+v.slice(1).split(",")[1]];};
const _gxc=n=>{const v=_EC[n];if(!v)return null;return[v[0],+v.slice(1).split(",")[0],+v.slice(1).split(",")[1]];};
const _pn=i=>{if(i<0)return"\u2014";if(i<_O.length){const n=_O[i];return n?n.split(" ").slice(0,2).join(" "):"?";}const n=_OX[i-_O.length];return n?n.split(" ").slice(0,2).join(" "):"?";};
const _cEmp={label:"Empresa",v:1,fmt:(_,r)=>{const x=_gx(r[0])||_gxc(r[0]);return x?(_EM[x[0]]||"\u2014"):"\u2014";}};
const _cEjC={label:"Ejec.Cobro",v:1,fmt:(_,r)=>{const x=_gx(r[0])||_gxc(r[0]);if(x)return _pn(x[1]);const a=_AD[r[0]];return a>=0?_pn(a):"\u2014";}};
const _cOwC={label:"Owner CRM",fmt:(v,r)=>{const x=_gx(r[0])||_gxc(r[0]);if(x)return _pn(x[2]);const o=_O[v];return o?o.split(" ").slice(0,2).join(" "):"\u2014";}};
const _CC={label:"# Cancel.",align:"right",fmt:v=>v>0?<span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:600,background:"#C0392B18",color:"#C0392B"}}>{v}</span>:<span style={{fontSize:10,color:"#ccc"}}>0</span>};
const _FC={label:"Fecha Cancel.",fmt:(v,r)=>{const d=BAJA_DATES[r[0]];return d?<span style={{fontSize:10}}>{d}</span>:<span style={{fontSize:10,color:"#ccc"}}>&mdash;</span>;}};
const _SP={label:"Sub Prev",fmt:v=>SubBdg(v)};
const _AC={label:"Accion CRM",fmt:(v,r)=>CndBdg(v,r)};

const _TA={label:"Activos",align:"right",fmt:(v,r)=>{const t=_TD[r[0]];return t?<b>{t}</b>:<span style={{color:"#ccc"}}>0</span>;}};
const _cSV={label:"Saldo Venc.",v:1,align:"right",fmt:(_,r)=>{const s=_SV[r[0]];return s?<span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:700,background:"#E74C3C18",color:"#E74C3C"}}>{fmt(s)}</span>:<span style={{fontSize:10,color:"#ccc"}}>&mdash;</span>;}};
const Pgr=({p,tp,set})=>tp>1?<div style={{display:"flex",gap:8,justifyContent:"center",marginTop:12,alignItems:"center"}}><button onClick={()=>set(Math.max(0,p-1))} disabled={p===0} style={{padding:"5px 14px",borderRadius:20,border:"none",background:p===0?"#edf0f5":BLUE,color:p===0?"#aaa":"#fff",cursor:p===0?"default":"pointer",fontSize:11,fontWeight:600,transition:"all .2s",boxShadow:p===0?"none":"0 1px 4px rgba(36,95,165,.2)"}}>&laquo; Ant</button><span style={{fontSize:11,color:NAVY,fontWeight:700}}>Pág {p+1}/{tp}</span><button onClick={()=>set(Math.min(tp-1,p+1))} disabled={p>=tp-1} style={{padding:"5px 14px",borderRadius:20,border:"none",background:p>=tp-1?"#edf0f5":BLUE,color:p>=tp-1?"#aaa":"#fff",cursor:p>=tp-1?"default":"pointer",fontSize:11,fontWeight:600,transition:"all .2s",boxShadow:p>=tp-1?"none":"0 1px 4px rgba(36,95,165,.2)"}}>Sig &raquo;</button></div>:null;



const TABS = ["Resumen","Revisar Suscripciones","Contratos Especiales","Crear Suscripcion","Reanudar/Renovar","Preventivos","Excluidos (Masters)","Escalar","Excluir (Parent)","Metodologia"];

function KPI({label,value,sub,color}){return(<div
  onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 4px 16px rgba(1,39,80,.12)";}}
  onMouseOut={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 2px 12px rgba(1,39,80,.07)";}}
  style={{background:"#fff",borderRadius:12,padding:"16px 20px",boxShadow:"0 2px 12px rgba(1,39,80,.07)",borderLeft:`4px solid ${color||BLUE}`,minWidth:140,transition:"all .2s ease",cursor:"default"}}><div style={{fontSize:10,color:"#666",textTransform:"uppercase",letterSpacing:.6,fontWeight:600}}>{label}</div><div style={{fontSize:24,fontWeight:700,color:color||NAVY,marginTop:4}}>{value}</div>{sub&&<div style={{fontSize:11,color:"#888",marginTop:3}}>{sub}</div>}</div>);}

function DataTable({columns,data,maxH,hideSearch}){
  const[sort,setSort]=useState({col:null,asc:true});const[search,setSearch]=useState("");
  const sorted=useMemo(()=>{let d=[...data];if(!hideSearch&&search){const s=search.toLowerCase();d=d.filter(r=>r.some(c=>String(c).toLowerCase().includes(s)));}if(sort.col!==null){const si=columns.slice(0,sort.col).filter(x=>!x.v).length;d.sort((a,b)=>{const va=a[si],vb=b[si];if(va==null)return 1;if(vb==null)return-1;return typeof va==="number"?(sort.asc?va-vb:vb-va):(sort.asc?String(va).localeCompare(String(vb)):String(vb).localeCompare(String(va)));});}return d;},[data,sort,search,hideSearch]);
  return(<div>
    {!hideSearch&&<input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"6px 12px",border:"1px solid #ddd",borderRadius:6,marginBottom:8,width:220,fontSize:12}}/>}
    <div style={{maxHeight:maxH||420,overflow:"auto",borderRadius:10,border:"1px solid #dde4ed",boxShadow:"0 1px 6px rgba(1,39,80,.05)"}}>
      <table style={{minWidth:900,borderCollapse:"collapse",fontSize:11}}>
        <thead><tr>{columns.map((c,i)=><th key={i} onClick={()=>setSort({col:i,asc:sort.col===i?!sort.asc:true})} style={{position:"sticky",top:0,background:GRAD,color:"#fff",padding:"9px 8px",cursor:"pointer",textAlign:c.align||"left",whiteSpace:"nowrap",fontSize:10,letterSpacing:.3,fontWeight:600}}>{c.label}{sort.col===i?(sort.asc?" ▲":" ▼"):""}</th>)}</tr></thead>
        <tbody>{sorted.map((r,ri)=><tr key={ri} style={{background:ri%2===0?"#fff":"#F0F4FA",transition:"background .15s"}} onMouseOver={e=>e.currentTarget.style.background="#E8EEF6"} onMouseOut={e=>e.currentTarget.style.background=ri%2===0?"#fff":"#F0F4FA"}>{columns.map((c,ci)=>{const di=columns.slice(0,ci).filter(x=>!x.v).length;return <td key={ci} style={{padding:"7px 8px",borderBottom:"1px solid #edf0f5",textAlign:c.align||"left",whiteSpace:"nowrap"}}>{c.fmt?c.fmt(r[di],r):r[di]}</td>;})}</tr>)}</tbody>
      </table>
    </div>
    <div style={{fontSize:10,color:"#888",marginTop:4}}>{sorted.length} registros</div>
  </div>);
}

function TabResumen() {
  const emp=useContext(EmpCtx);const bk=useContext(BooksCtx);
  const fA=useMemo(()=>{
    if(emp==="Todas"&&bk==="Todos") return ACTIONS;
    const fRC=applyFilters(RC_STD,emp,bk),fRE=applyFilters(RC_ESP,emp,bk),fCS=applyFilters(CS,emp,bk),fCSP=applyFilters(CSP,emp,bk);
    const fRR=applyFilters(RR,emp,bk),fEXC=applyFilters(EXC,emp,bk),fESC=applyFilters(ESC_S,emp,bk);
    const rean=fRR.filter(r=>r[9]==="Reanudar"),reno=fRR.filter(r=>r[9]==="Renovar");
    const mk=(l,cnt,mo,c,d)=>({label:l,cnt,monthly:mo,color:c,desc:d});
    return{
      REVISAR_CONFIG:mk('Revisar Config.',fRC.length,fRC.reduce((s,r)=>s+r[3],0),'#E74C3C',''),
      CONTRATOS_ESP:mk('Contratos Especiales',fRE.length,fRE.reduce((s,r)=>s+r[3],0),'#8E44AD',''),
      CREAR_SUB:mk('Crear Suscripcion',fCS.length,fCS.reduce((s,r)=>s+r[5],0),'#F39C12',''),
      CREAR_SUB_PREV:mk('Crear Sub. Preventivo',fCSP.length,fCSP.reduce((s,r)=>s+r[3],0),'#F5B041',''),
      RENOVAR:mk('Renovar',reno.length,reno.reduce((s,r)=>s+r[4],0),'#9B59B6',''),
      REANUDAR:mk('Reanudar',rean.length,rean.reduce((s,r)=>s+r[4],0),'#3498DB',''),
      OK_SUB_VIGENTE:ACTIONS.OK_SUB_VIGENTE,FUTURA:ACTIONS.FUTURA,
      ESCALAR:mk('Escalar',fESC.length,0,'#7F8C8D',''),
      EXCLUIDOS:mk('Excluidos (Masters)',fEXC.length,0,'#BDC3C7',''),
    };
  },[emp,bk]);
  const actionable = Object.entries(fA).filter(([k]) => !["OK_SUB_VIGENTE","FUTURA","ESCALAR","EXCLUIDOS"].includes(k));
  const totalActionable = actionable.reduce((s, [, v]) => s + v.cnt, 0);
  const totalMonthly = actionable.reduce((s, [, v]) => s + v.monthly, 0);
  const pieData = Object.entries(fA).filter(([k]) => k !== "EXCLUIDOS").map(([k, v]) => ({ name: v.label, value: v.cnt, color: v.color }));
  const barData = actionable.map(([k, v]) => ({ name: v.label, value: v.monthly, color: v.color })).sort((a, b) => b.value - a.value);
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <KPI label="Clientes Accionables" value={totalActionable} sub="requieren accion" color="#E74C3C" />
        <KPI label="Ingreso Mensual en Riesgo" value={fmtK(totalMonthly)} sub="de acciones pendientes" color="#E67E22" />
        <KPI label="OK Sub Vigente" value={fA.OK_SUB_VIGENTE.cnt} sub={fmtK(fA.OK_SUB_VIGENTE.monthly) + "/mes"} color="#27AE60" />
        <KPI label="Excluidos (Masters)" value={fA.EXCLUIDOS.cnt} color="#BDC3C7" />
      </div>
      <div style={{background:"#E8F8F5",border:"1px solid #A3E4D7",borderRadius:8,padding:12,marginBottom:16,fontSize:12}}>
        <strong>Criterios:</strong> Intervalo sub = frecuencia. next_billing = fuente de verdad. 25 masters excl. Sub Previa + Cand.Cancel + BAJA DEF.
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:16}}>
        <div style={{background:"#fff",borderRadius:12,padding:18,boxShadow:"0 2px 12px rgba(1,39,80,.06)"}}>
          <div style={{fontWeight:700,fontSize:13,color:NAVY,marginBottom:8,letterSpacing:.3}}>Distribución por Categoría</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false} fontSize={9}>{pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip formatter={v=>v+" clientes"}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"#fff",borderRadius:12,padding:18,boxShadow:"0 2px 12px rgba(1,39,80,.06)"}}>
          <div style={{fontWeight:700,fontSize:13,color:NAVY,marginBottom:8,letterSpacing:.3}}>Ingreso Mensual por Acción</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} layout="vertical" margin={{left:100}}>
              <XAxis type="number" tickFormatter={fmtK} fontSize={10}/><YAxis type="category" dataKey="name" fontSize={9} width={95}/><Tooltip formatter={v=>fmt(v)}/>
              <Bar dataKey="value" radius={[0,4,4,0]}>{barData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:12,padding:18,boxShadow:"0 2px 12px rgba(1,39,80,.06)"}}>
        <div style={{fontWeight:700,fontSize:13,color:NAVY,marginBottom:12,letterSpacing:.3}}>Matriz de Acciones</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
          {Object.entries(fA).map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:10,padding:12,borderRadius:10,border:`1px solid ${v.color}20`,background:`${v.color}06`,transition:"all .2s",cursor:"default"}}
              onMouseOver={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow=`0 3px 12px ${v.color}15`;}}
              onMouseOut={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <div style={{width:5,borderRadius:3,background:v.color,flexShrink:0}}/>
              <div>
                <div style={{fontWeight:600,fontSize:12,color:v.color}}>{v.label}</div>
                <div style={{fontSize:18,fontWeight:700,color:NAVY}}>{v.cnt} <span style={{fontSize:11,fontWeight:400,color:"#888"}}>clientes</span></div>
                <div style={{fontSize:11,color:"#666"}}>{v.monthly>0?fmtK(v.monthly)+"/mes":"N/A"}</div>
                <div style={{fontSize:10,color:"#999",marginTop:2}}>{v.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TabRevisarConfig() {
  const emp=useContext(EmpCtx);const bk=useContext(BooksCtx);
  const data=useMemo(()=>applyFilters(RC_STD,emp,bk),[emp,bk]);
  const cols = [
    { label: "Cliente", fmt: v => v },_cEmp,_cEjC,_cOwC,
    { label: "Frec. Sub", fmt: v => v },
    { label: "Prom/Mes", align: "right", fmt: v => fmt(v) },
    { label: "Ult. Fact.", fmt: v => v },
    { label: "Subs Live", align: "right", fmt: v => v },
    { label: "Valor Subs", align: "right", fmt: v => fmt(v) },
    { label: "Vencidas", align: "right", fmt: (v) => <span style={{ color: v > 0 ? "#E74C3C" : "#27AE60", fontWeight: 600 }}>{v}</span> },
    { label: "Vigentes", align: "right", fmt: (v) => <span style={{ color: v > 0 ? "#27AE60" : "#E74C3C", fontWeight: 600 }}>{v}</span> },
    { label: "Intervalos", fmt: v => v },
    { label: "Tipo", fmt: v => <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: v === "CONFIG" ? "#FDECEC" : "#FEF3E2", color: v === "CONFIG" ? "#C0392B" : "#E67E22" }}>{v}</span> },
    _TA,_cSV,_SP,_AC,_CC,_FC,
  ];
  const config = data.filter(r => r[10] === "CONFIG");
  const parcial = data.filter(r => r[10] === "PARCIAL");
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <KPI label="Config. (sin next_billing)" value={config.length} sub={fmtK(config.reduce((s, r) => s + (r[3] || 0), 0)) + "/mes"} color="#E74C3C" />
        <KPI label="Parcial (mixto)" value={parcial.length} sub={fmtK(parcial.reduce((s, r) => s + (r[3] || 0), 0)) + "/mes"} color="#E67E22" />
        <KPI label="Valor Total Subs" value={fmtK(data.reduce((s, r) => s + r[6], 0))} color={BLUE} />
      </div>
      <div style={{background:"#E8F8F5",border:"1px solid #A3E4D7",borderRadius:8,padding:12,marginBottom:12,fontSize:12}}>
        Subs frecuencia <strong>anual o menor</strong>. Multianuales en "Contratos Especiales".
      </div>
      <DataTable columns={cols} data={data} />
    </div>
  );
}

function TabEspeciales() {
  const emp=useContext(EmpCtx);const bk=useContext(BooksCtx);
  const data=useMemo(()=>applyFilters(RC_ESP,emp,bk),[emp,bk]);
  const cols = [
    { label: "Cliente", fmt: v => v },_cEmp,_cEjC,_cOwC,
    { label: "Frec. Sub", fmt: v => <span style={{ padding: "2px 6px", borderRadius: 4, fontSize: 10, background: "#F4ECF7", color: "#8E44AD", fontWeight: 600 }}>{v}</span> },
    { label: "Prom/Mes", align: "right", fmt: v => fmt(v) },
    { label: "Ult. Fact.", fmt: v => v },
    { label: "Subs Live", align: "right", fmt: v => v },
    { label: "Valor Subs", align: "right", fmt: v => fmt(v) },
    { label: "Vencidas", align: "right", fmt: (v) => <span style={{ color: v > 0 ? "#E74C3C" : "#27AE60", fontWeight: 600 }}>{v}</span> },
    { label: "Vigentes", align: "right", fmt: (v) => <span style={{ color: v > 0 ? "#27AE60" : "#E74C3C", fontWeight: 600 }}>{v}</span> },
    { label: "Intervalos", fmt: v => v },
    { label: "Tipo", fmt: v => <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: v === "CONFIG" ? "#FDECEC" : "#FEF3E2", color: v === "CONFIG" ? "#C0392B" : "#E67E22" }}>{v}</span> },
    _TA,_cSV,_SP,_AC,_CC,_FC,
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <KPI label="Contratos Especiales" value={data.length} sub="suscripciones multianuales" color="#8E44AD" />
        <KPI label="Ingreso Mensual" value={fmtK(data.reduce((s, r) => s + (r[3] || 0), 0))} color="#8E44AD" />
        <KPI label="Valor Total Subs" value={fmtK(data.reduce((s, r) => s + r[6], 0))} color={BLUE} />
      </div>
      <div style={{background:"#F4ECF7",border:"1px solid #D2B4DE",borderRadius:8,padding:12,marginBottom:12,fontSize:12}}>
        <strong>Multianuales (&gt;1 anio):</strong> Leasing, arrendamiento. next_billing=NULL. Validar mecanismo de cobro.
      </div>
      <DataTable columns={cols} data={data} />
    </div>
  );
}

function TabCrearSub() {
  const emp=useContext(EmpCtx);const bk=useContext(BooksCtx);
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(0);
  const [crmFilter, setCrmFilter] = useState("Todos");
  const [subFilter, setSubFilter] = useState("Todos");
  const [csSearch, setCsSearch] = useState("");
  const crmOpts = ["Todos","BAJA DEF.","Cand.Cancel","C.parcial","P.Total","Con folios","Sin cancelacion"];
  const subOpts = ["Todos","Si","No"];
  const filtered = useMemo(() => {
    let d = applyFilters(CS,emp,bk);
    if (csSearch) { const s = csSearch.toLowerCase(); d = d.filter(r => r.some(c => String(c).toLowerCase().includes(s))); }
    if (crmFilter === "BAJA DEF.") d = d.filter(r => r[10] === 3);
    else if (crmFilter === "Cand.Cancel") d = d.filter(r => r[9] === 1 && r[10] !== 3);
    else if (crmFilter === "C.parcial") d = d.filter(r => r[10] === 1 && r[9] !== 1 && r[10] !== 3);
    else if (crmFilter === "P.Total") d = d.filter(r => r[10] === 2 && r[10] !== 3);
    else if (crmFilter === "Con folios") d = d.filter(r => r[11] > 0);
    else if (crmFilter === "Sin cancelacion") d = d.filter(r => r[10] === 0 && r[9] === 0);
    if (subFilter === "Si") d = d.filter(r => r[8] === 1);
    else if (subFilter === "No") d = d.filter(r => r[8] === 0);
    return d;
  }, [crmFilter, subFilter, csSearch, emp, bk]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const _cBooks={label:"Books",v:1,fmt:(_,r)=>{const x=_gx(r[0]);return x?<span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:"#27AE6018",color:"#27AE60"}}>Si</span>:<span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:"#E74C3C18",color:"#E74C3C"}}>No</span>;}};
  const cols = [
    { label: "Cliente", fmt: v => v },_cBooks,_cEmp,_cEjC,_cOwC,
    { label: "Frec. Hist.", fmt: v => v },
    { label: "Gap Esp.", align: "right", fmt: v => v },
    { label: "Gap Actual", align: "right", fmt: v => v + "m" },
    { label: "Prom/Mes", align: "right", fmt: v => fmt(v) },
    { label: "Ult. Fact.", fmt: v => v },
    { label: "Meses Hist.", align: "right", fmt: v => v },
    _TA,_cSV,_SP,_AC,_CC,_FC,
  ];
  const totalMonthlyFiltered = filtered.reduce((s, r) => s + r[5], 0);
  const [csvData,setCsvData]=useState(null);
  const _buildRows=(data)=>{const hd=["Cliente","Books","Empresa","Ejec.Cobro","Owner CRM","Frec.Hist","Gap Esp.","Gap Actual","Prom/Mes","Ult.Fact","Meses Hist","Activos","Saldo Vencido","Sub Prev","Accion CRM","# Cancel"];const rows=data.map(r=>{const xb=_gx(r[0]);const xc=_gxc(r[0]);const x=xb||xc;const books=xb?"Si":"No";const emp=x?(_EM[x[0]]||""):"";const ej=x?_pn(x[1]):"";const ow=x?_pn(x[2]):"";const act=_TD[r[0]]||0;const sv=_SV[r[0]]||0;const sp=r[8]?"Si":"No";const cc=r[9]?"Cand.Cancel":"";const accion=r[10]===3?"BAJA DEF.":cc||(_CS[r[10]]||"");return[r[0],books,emp,ej,ow,r[2],r[3],r[4],r[5],r[6],r[7],act,sv,sp,accion,r[11]];});return{hd,rows};};
  const dlCSV=()=>{const{hd,rows}=_buildRows(filtered);const esc=v=>{const s=String(v??"");return s.includes(",")||s.includes('"')||s.includes("\n")?'"'+s.replace(/"/g,'""')+'"':s;};setCsvData(hd.map(esc).join("\t")+"\n"+rows.map(r=>r.map(esc).join("\t")).join("\n"));};
  const dlExcel=()=>{const{hd,rows}=_buildRows(filtered);const ws=XLSX.utils.aoa_to_sheet([hd,...rows]);ws["!cols"]=hd.map((_,i)=>({wch:i===0?40:i===7?14:12}));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Crear Suscripcion");XLSX.writeFile(wb,"crear_suscripcion.xlsx");};
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14, alignItems: "flex-end" }}>
        <KPI label="Clientes sin Suscripcion" value={filtered.length} sub={filtered.length === CS.length ? "total en riesgo" : `de ${CS.length} (filtrado)`} color="#F39C12" />
        <KPI label="Ingreso Mensual en Riesgo" value={fmtK(totalMonthlyFiltered)} sub="sin proteccion de suscripcion" color="#F39C12" />
        <button onClick={dlExcel} style={{padding:"8px 16px",borderRadius:8,border:"none",background:"#1a7f4b",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",height:40,display:"flex",alignItems:"center",gap:6}}>&#x1F4E5; Excel ({filtered.length})</button>
        <button onClick={dlCSV} style={{padding:"8px 16px",borderRadius:8,border:"none",background:"#27AE60",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",height:40,display:"flex",alignItems:"center",gap:6}}>&#x1F4CB; Copiar ({filtered.length})</button>
      </div>
      {csvData&&<div style={{background:"#fff",border:"2px solid #27AE60",borderRadius:8,padding:10,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
          <span style={{fontSize:12,color:"#27AE60",fontWeight:700}}>1. Ctrl+A en el cuadro &rarr; 2. Ctrl+C &rarr; 3. Pegar en Google Sheets</span>
          <button onClick={()=>setCsvData(null)} style={{padding:"3px 10px",borderRadius:6,border:"1px solid #ddd",background:"#fff",color:"#888",fontSize:11,cursor:"pointer"}}>X</button>
        </div>
        <textarea readOnly value={csvData} onClick={e=>e.target.select()} onFocus={e=>e.target.select()} style={{width:"100%",height:110,fontSize:10,fontFamily:"monospace",border:"2px solid #27AE60",borderRadius:4,padding:6}}/>
      </div>}

      <input placeholder="Buscar cliente..." value={csSearch} onChange={e => { setCsSearch(e.target.value); setPage(0); }} style={{ padding: "6px 12px", border: "1px solid #ddd", borderRadius: 6, marginBottom: 8, width: 260, fontSize: 12 }} />
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:8,flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:NAVY,letterSpacing:.4}}>CRM:</span>
        {crmOpts.map(o=><button key={o} onClick={()=>{setCrmFilter(o);setPage(0);}} style={{padding:"4px 10px",borderRadius:20,border:crmFilter===o?"none":"1px solid #dde4ed",background:crmFilter===o?NAVY:"#fff",color:crmFilter===o?"#fff":MID_NAVY,fontSize:10,fontWeight:600,cursor:"pointer",transition:"all .2s",boxShadow:crmFilter===o?"0 1px 4px rgba(1,39,80,.2)":"none"}}>{o}</button>)}
        <div style={{width:1,height:18,background:"#dde4ed",margin:"0 4px"}}/>
        <span style={{fontSize:10,fontWeight:700,color:"#2980B9",letterSpacing:.4}}>Sub:</span>
        {subOpts.map(o=><button key={o} onClick={()=>{setSubFilter(o);setPage(0);}} style={{padding:"4px 10px",borderRadius:20,border:subFilter===o?"none":"1px solid #dde4ed",background:subFilter===o?"#2980B9":"#fff",color:subFilter===o?"#fff":"#2980B9",fontSize:10,fontWeight:600,cursor:"pointer",transition:"all .2s",boxShadow:subFilter===o?"0 1px 4px rgba(41,128,185,.3)":"none"}}>{o}</button>)}
      </div>
      <div style={{background:"#FEF9E7",border:"1px solid #F9E79F",borderRadius:8,padding:8,marginBottom:8,fontSize:11}}>
        <b>Cand.Cancel:</b> Mens&gt;4m, Bim&gt;4m, Trim&gt;6m, Sem&gt;7m, Anual&gt;13m.
      </div>
      <DataTable columns={cols} data={paged} hideSearch />
      <Pgr p={page} tp={totalPages} set={setPage}/>
    </div>
  );
}

function TabReanudarRenovar() {
  const emp=useContext(EmpCtx);const bk=useContext(BooksCtx);
  const data=useMemo(()=>applyFilters(RR,emp,bk),[emp,bk]);
  const cols = [
    { label: "Cliente", fmt: v => v },_cEmp,_cEjC,_cOwC,
    { label: "Frec.", fmt: v => v },
    { label: "Gap", align: "right", fmt: v => v + "m" },
    { label: "Prom/Mes", align: "right", fmt: v => fmt(v) },
    { label: "Ult. Fact.", fmt: v => v },
    { label: "Subs", align: "right", fmt: v => v },
    { label: "Valor", align: "right", fmt: v => fmt(v) },
    { label: "Plan", fmt: v => v },
    { label: "Accion", fmt: v => <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 600, background: v === "REANUDAR" ? "#D6EAF8" : "#E8DAEF", color: v === "REANUDAR" ? "#2471A3" : "#7D3C98" }}>{v}</span> },
    _TA,_cSV,_SP,_AC,_CC,_FC,
  ];
  const rean = data.filter(r => r[9] === "Reanudar");
  const reno = data.filter(r => r[9] === "Renovar");
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <KPI label="Reanudar (Pausadas)" value={rean.length} sub={fmtK(rean.reduce((s, r) => s + (r[4] || 0), 0)) + "/mes"} color="#3498DB" />
        <KPI label="Renovar (Expiradas)" value={reno.length} sub={fmtK(reno.reduce((s, r) => s + (r[4] || 0), 0)) + "/mes"} color="#9B59B6" />
      </div>
      <DataTable columns={cols} data={data} />
    </div>
  );
}

function TabPreventivos() {
  const emp=useContext(EmpCtx);const bk=useContext(BooksCtx);
  const data=useMemo(()=>applyFilters(CSP,emp,bk),[emp,bk]);
  const cols = [
    { label: "Cliente", fmt: v => v },_cEmp,_cEjC,_cOwC,
    { label: "Frec. Hist.", fmt: v => v },
    { label: "Prom/Mes", align: "right", fmt: v => fmt(v) },
    { label: "Ult. Factura", fmt: v => v },
    _TA,_cSV,_SP,_AC,_CC,_FC,
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <KPI label="Clientes Preventivos" value={data.length} sub="en ciclo pero sin suscripcion" color="#F5B041" />
        <KPI label="Ingreso Mensual" value={fmtK(data.reduce((s,r)=>s+r[3],0))} sub="para proteger" color="#F5B041" />
      </div>
      <div style={{ background: "#FEF9E7", border: "1px solid #F9E79F", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12 }}>
        <strong>Preventivo:</strong> Clientes dentro de su ciclo normal, pero sin suscripcion. Crear suscripcion para asegurar continuidad de cobro.
      </div>
      <DataTable columns={cols} data={data} />
    </div>
  );
}

function TabExcluidos() {
  const emp=useContext(EmpCtx);const bk=useContext(BooksCtx);
  const [tf,setTf]=useState("Todos");
  const opts=["Todos","Revisar Subs","Crear Sub","Escalar"];
  const filtered=useMemo(()=>{let d=applyFilters(EXC,emp,bk);if(tf==="Revisar Subs")d=d.filter(r=>r[2]===0);else if(tf==="Crear Sub")d=d.filter(r=>r[2]===1);else if(tf==="Escalar")d=d.filter(r=>r[2]===2);return d;},[tf,emp,bk]);
  const cols=[{label:"Cliente (Master)",fmt:v=>v},_cEmp,_cEjC,_cOwC,_TA,_cSV,{label:"Tipo",fmt:v=><span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:"#2980B918",color:"#2980B9"}}>{v===0?"Parent":"Regional"}</span>},{label:"Tab",fmt:v=><span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:_EXC_TAB_C[v]+"18",color:_EXC_TAB_C[v]}}>{_EXC_TAB[v]}</span>},{label:"Hijos",align:"right",fmt:v=><b>{v}</b>},{label:"Prom/Mes",align:"right",fmt:v=>fmt(v)},{label:"Ult.Fact.",fmt:v=>v||"\u2014"}];
  return(<div>
    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
      <KPI label="Masters" value={filtered.length} color="#7F8C8D"/>
      <KPI label="Prom/Mes" value={fmtK(filtered.reduce((s,r)=>s+r[4],0))} color="#2980B9"/>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
      {opts.map(o=><button key={o} onClick={()=>setTf(o)} style={{padding:"4px 12px",borderRadius:20,border:tf===o?"none":"1px solid #dde4ed",background:tf===o?BLUE:"#fff",color:tf===o?"#fff":MID_NAVY,fontSize:10,fontWeight:600,cursor:"pointer",transition:"all .2s",boxShadow:tf===o?"0 1px 4px rgba(36,95,165,.3)":"none"}}>{o}</button>)}
    </div>
    <DataTable columns={cols} data={filtered}/>
  </div>);
}

function TabEscalar() {
  const emp=useContext(EmpCtx);const bk=useContext(BooksCtx);
  const PG=25;const[page,setPage]=useState(0);const[escSearch,setEscSearch]=useState("");
  const filtered=useMemo(()=>{let d=applyFilters(ESC_S,emp,bk);if(escSearch){const s=escSearch.toLowerCase();d=d.filter(r=>r.some(c=>String(c).toLowerCase().includes(s)));}return d;},[escSearch,emp,bk]);
  const paged=filtered.slice(page*PG,(page+1)*PG);const pages=Math.ceil(filtered.length/PG);
  const cols=[{label:"Cliente",fmt:(v)=><span style={{fontWeight:600}}>{v}</span>},_cEmp,_cEjC,_cOwC,_TA,_cSV,{label:"# Cancel.",fmt:(_,r)=>r[3]>0?r[3]:<span style={{color:"#ccc"}}>&mdash;</span>,align:"center"},{label:"Fecha Cancel.",fmt:(_,r)=>{const d=BAJA_DATES[r[0]];return d?<span style={{fontSize:10}}>{d}</span>:<span style={{fontSize:10,color:"#ccc"}}>&mdash;</span>;}}];
  return(<div>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
      <input placeholder="Buscar..." value={escSearch} onChange={e=>{setEscSearch(e.target.value);setPage(0);}} style={{padding:"6px 12px",border:"1px solid #ddd",borderRadius:6,width:220,fontSize:12}}/>
      <span style={{fontSize:11,color:"#888"}}>{filtered.length} clientes sin historial ni suscripcion</span>
    </div>
    <DataTable columns={cols} data={paged} hideSearch/>
    <Pgr p={page} tp={pages} set={setPage}/>
  </div>);
}
function TabExcParent() {
  const emp=useContext(EmpCtx);const bk=useContext(BooksCtx);
  const PG=25;const[page,setPage]=useState(0);const[epSearch,setEpSearch]=useState("");
  const filtered=useMemo(()=>{let d=applyFilters(EXP,emp,bk);if(epSearch){const s=epSearch.toLowerCase();d=d.filter(r=>r.some(c=>String(c).toLowerCase().includes(s)));}return d;},[epSearch,emp,bk]);
  const paged=filtered.slice(page*PG,(page+1)*PG);const pages=Math.ceil(filtered.length/PG);
  const cols=[{label:"Cliente",fmt:v=><span style={{fontWeight:600}}>{v}</span>},_cEmp,_cEjC,_cOwC,_TA,_cSV,{label:"Parent Account",fmt:(_,r)=>r[2]}];
  return(<div>
    <div style={{background:"#FEF9E7",border:"1px solid #F9E79F",borderRadius:8,padding:10,marginBottom:10,fontSize:11}}>
      Excluidas de Escalar: cuentas con <strong>Parent Account</strong> en CRM (hijos) o con <em>(antes...)</em> (facturan bajo otra razon social).
    </div>
    <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
      <input placeholder="Buscar..." value={epSearch} onChange={e=>{setEpSearch(e.target.value);setPage(0);}} style={{padding:"6px 12px",border:"1px solid #ddd",borderRadius:6,width:220,fontSize:12}}/>
      <span style={{fontSize:11,color:"#888"}}>{filtered.length} cuentas excluidas ({new Set(EXP.map(r=>r[2])).size} parents)</span>
    </div>
    <DataTable columns={cols} data={paged} hideSearch/>
    <Pgr p={page} tp={pages} set={setPage}/>
  </div>);
}
function TabMetodologia() {
  const card={background:"#fff",borderRadius:12,padding:"18px 20px",boxShadow:"0 2px 12px rgba(1,39,80,.06)",marginBottom:14};
  const stepNum=(n,color)=>({display:"inline-flex",alignItems:"center",justifyContent:"center",width:28,height:28,borderRadius:8,background:color,color:"#fff",fontSize:12,fontWeight:700,marginRight:10,flexShrink:0});
  const stepTitle={fontSize:14,fontWeight:700,color:NAVY,display:"flex",alignItems:"center",marginBottom:10};
  const sub={fontSize:12,fontWeight:600,color:MID_NAVY,marginTop:10,marginBottom:4};
  const body={fontSize:11,color:"#555",lineHeight:1.7};
  const pill=(bg,color,text)=><span style={{display:"inline-block",padding:"2px 8px",borderRadius:12,fontSize:9,fontWeight:700,background:bg,color:color,marginRight:4,marginBottom:2}}>{text}</span>;
  const rule=(label,val)=><div style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:"1px solid #f0f4f8",fontSize:11}}><span style={{color:"#666"}}>{label}</span><span style={{fontWeight:600,color:NAVY}}>{val}</span></div>;
  const divider=<div style={{height:1,background:`linear-gradient(90deg, ${BLUE}22, transparent)`,margin:"12px 0"}}/>;

  return(<div style={{maxWidth:780}}>
    {/* Intro */}
    <div style={{...card,background:GRAD,color:"#fff",padding:"20px 24px"}}>
      <div style={{fontSize:16,fontWeight:700,marginBottom:6}}>Metodología del Plan de Acciones</div>
      <div style={{fontSize:12,opacity:.8,lineHeight:1.6}}>
        Este dashboard identifica automáticamente clientes activos que no están facturando correctamente y los clasifica en acciones específicas para el equipo de cobranza. Los datos se actualizan en tiempo real desde Zoho Books, Billing y CRM vía Supabase.
      </div>
    </div>

    {/* Paso 1 */}
    <div style={card}>
      <div style={stepTitle}><span style={stepNum("1","#3498DB")}>1</span>Universo de Clientes</div>
      <div style={body}>
        Se parte de todas las cuentas registradas en Zoho CRM que cumplen los siguientes criterios simultáneamente:
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:8}}>
        {pill("#EBF5FB","#2471A3","account_type = Cliente")}
        {pill("#EBF5FB","#2471A3","status = ACTIVO")}
        {pill("#FEF9E7","#B7950B","Sin factura en el mes actual")}
      </div>
      <div style={sub}>Fuentes de datos</div>
      <div style={body}>
        <b>Zoho Books:</b> Facturas, suscripciones (frecuencia, next_billing_date, status). <b>Zoho CRM:</b> Cuentas (account_type, status, owner, parent_account, empresa_numaris). <b>Zoho Billing:</b> Historial de pagos y suscripciones complementarias.
      </div>
      {divider}
      <div style={sub}>Vinculación Books ↔ CRM</div>
      <div style={body}>
        Cada cliente CRM se busca primero en la tabla <code style={{background:"#f0f4f8",padding:"1px 4px",borderRadius:3,fontSize:10}}>customers</code> de Zoho Books (campo <b>company_name</b>). Si existe match, se extrae la empresa Numaris, el ejecutivo de cobro y el owner. Si no hay match en Books ("Sin Books"), se toma la empresa desde el campo <b>empresa_numaris</b> del CRM como fallback.
      </div>
    </div>

    {/* Paso 2 */}
    <div style={card}>
      <div style={stepTitle}><span style={stepNum("2","#E67E22")}>2</span>Exclusiones</div>
      <div style={body}>Antes de clasificar, se excluyen cuentas que no deben accionarse directamente:</div>
      <div style={{marginTop:8}}>
        {rule("Masters con hijos","Cuentas padre (parent) cuyos hijos sí facturan — se reportan en pestaña 'Excluidos (Masters)'")}
        {rule("Hijos de parent","Cuentas con parent_account asignado — se reportan en pestaña 'Excluir (Parent)'")}
        {rule("Razones sociales anteriores","Cuentas con '(antes...)' que facturan bajo otra razón social")}
      </div>
      <div style={{...body,marginTop:8}}>
        Los masters excluidos se subdividen según la acción que les correspondería: {pill("#E74C3C18","#E74C3C","Revisar Subs")} {pill("#F39C1218","#F39C12","Crear Sub")} {pill("#7F8C8D18","#7F8C8D","Escalar")}
      </div>
    </div>

    {/* Paso 3 */}
    <div style={card}>
      <div style={stepTitle}><span style={stepNum("3","#27AE60")}>3</span>Clasificación de Acciones</div>
      <div style={body}>Cada cliente del universo se asigna a exactamente una categoría según su estado de suscripción y facturación:</div>
      <div style={{marginTop:10}}>
        {rule("Revisar Configuración","Tiene suscripción activa pero next_billing_date = NULL → la configuración de cobro está incompleta")}
        {rule("Contratos Especiales","Suscripción con frecuencia > 1 año (leasing, arrendamiento) → next_billing NULL es esperado, validar mecanismo")}
        {rule("Crear Suscripción","No tiene suscripción activa, tiene historial de facturación → se debe crear suscripción nueva")}
        {rule("Crear Sub (Preventivo)","Tiene historial, está dentro de su ciclo normal pero sin suscripción → proteger antes de que venza")}
        {rule("Reanudar","Tiene suscripción en status 'paused' → reactivar la suscripción existente")}
        {rule("Renovar","Tiene suscripción en status 'expired' → crear nueva suscripción basada en la anterior")}
        {rule("Escalar","Sin historial de facturación ni suscripción → requiere investigación del equipo comercial")}
        {rule("OK Sub Vigente","Tiene suscripción activa con next_billing válido → no requiere acción")}
      </div>
    </div>

    {/* Paso 4 */}
    <div style={card}>
      <div style={stepTitle}><span style={stepNum("4","#E74C3C")}>4</span>Candidato a Cancelación</div>
      <div style={body}>
        Sobre la categoría "Crear Suscripción", se aplica un segundo filtro para identificar clientes cuyo gap de facturación supera el umbral esperado según su frecuencia histórica. Estos se marcan como <b>Cand.Cancel</b> porque podrían ya no estar operando:
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:0,marginTop:10,borderRadius:8,overflow:"hidden",border:"1px solid #fde2e2"}}>
        <div style={{background:NAVY,color:"#fff",padding:"6px 12px",fontSize:10,fontWeight:600}}>Frecuencia</div>
        <div style={{background:NAVY,color:"#fff",padding:"6px 12px",fontSize:10,fontWeight:600}}>Umbral sin factura</div>
        <div style={{padding:"6px 12px",fontSize:11,background:"#fff",borderBottom:"1px solid #f8f8f8"}}>Mensual</div>
        <div style={{padding:"6px 12px",fontSize:11,fontWeight:600,color:"#E74C3C",background:"#fff",borderBottom:"1px solid #f8f8f8"}}>&gt; 4 meses</div>
        <div style={{padding:"6px 12px",fontSize:11,background:"#fafafa",borderBottom:"1px solid #f8f8f8"}}>Bimestral</div>
        <div style={{padding:"6px 12px",fontSize:11,fontWeight:600,color:"#E74C3C",background:"#fafafa",borderBottom:"1px solid #f8f8f8"}}>&gt; 4 meses</div>
        <div style={{padding:"6px 12px",fontSize:11,background:"#fff",borderBottom:"1px solid #f8f8f8"}}>Trimestral</div>
        <div style={{padding:"6px 12px",fontSize:11,fontWeight:600,color:"#E74C3C",background:"#fff",borderBottom:"1px solid #f8f8f8"}}>&gt; 6 meses</div>
        <div style={{padding:"6px 12px",fontSize:11,background:"#fafafa",borderBottom:"1px solid #f8f8f8"}}>Semestral</div>
        <div style={{padding:"6px 12px",fontSize:11,fontWeight:600,color:"#E74C3C",background:"#fafafa",borderBottom:"1px solid #f8f8f8"}}>&gt; 7 meses</div>
        <div style={{padding:"6px 12px",fontSize:11,background:"#fff"}}>Anual</div>
        <div style={{padding:"6px 12px",fontSize:11,fontWeight:600,color:"#E74C3C",background:"#fff"}}>&gt; 13 meses</div>
      </div>
    </div>

    {/* Paso 5 */}
    <div style={card}>
      <div style={stepTitle}><span style={stepNum("5","#8E44AD")}>5</span>Acciones CRM (Cancelaciones)</div>
      <div style={body}>
        Adicionalmente, cada cliente se cruza con el historial de cancelaciones del CRM para enriquecer el contexto:
      </div>
      <div style={{marginTop:10}}>
        {rule("C.parcial","Tiene al menos una cancelación parcial registrada en CRM")}
        {rule("P.Total (proc)","Tiene una cancelación total en proceso — aún no se formaliza")}
        {rule("BAJA DEF.","Cancelación definitiva ya procesada — la cuenta debería darse de baja")}
        {rule("# Cancel.","Número total de folios de cancelación asociados a la cuenta")}
        {rule("Fecha Cancel.","Fecha de la última cancelación registrada")}
      </div>
    </div>

    {/* Paso 6 */}
    <div style={card}>
      <div style={stepTitle}><span style={stepNum("6","#1ABC9C")}>6</span>Saldo Vencido</div>
      <div style={body}>
        Para cada cliente se consultan las facturas pendientes de pago en Zoho Books. Se suman todos los saldos vencidos (facturas cuya fecha de vencimiento ya pasó y tienen balance pendiente). Este dato aparece como columna <b>"Saldo Venc."</b> en todas las secciones y ayuda a priorizar la gestión de cobranza.
      </div>
      {divider}
      <div style={sub}>Campos complementarios por cliente</div>
      <div style={{marginTop:4}}>
        {rule("Empresa Numaris","Easytrack, Sfleet, Smart Tracker, Tecnocontrol o Traffilog — origen: Books → CRM fallback")}
        {rule("Ejec. Cobro","Ejecutivo de cobranza asignado desde el campo salesrep de Zoho Books")}
        {rule("Owner CRM","Propietario de la cuenta en Zoho CRM")}
        {rule("Activos","Número de dispositivos/unidades activas vinculadas al cliente")}
        {rule("Sub Previa","Indica si el cliente tuvo alguna suscripción previa (aunque ya no esté activa)")}
        {rule("Books (Sí/No)","Indica si el cliente tiene vinculación en Zoho Books (tabla customers)")}
      </div>
    </div>

    {/* Paso 7 */}
    <div style={card}>
      <div style={stepTitle}><span style={stepNum("7","#34495E")}>7</span>Filtros Globales</div>
      <div style={body}>
        El dashboard permite filtrar todas las secciones simultáneamente por dos dimensiones:
      </div>
      <div style={{marginTop:10}}>
        {rule("Empresa Numaris","Filtra por la empresa asignada: Easytrack, Sfleet, Smart Tracker, Tecnocontrol, Traffilog o Sin empresa")}
        {rule("Vinculación Books","Filtra entre clientes que tienen match en Zoho Books (Con Books) vs los que solo existen en CRM (Sin Books)")}
      </div>
      <div style={{...body,marginTop:10,fontStyle:"italic",color:"#888"}}>
        Los KPIs del Resumen se recalculan dinámicamente al aplicar filtros, reflejando solo el subconjunto seleccionado.
      </div>
    </div>

    {/* Fuente */}
    <div style={{textAlign:"center",fontSize:10,color:"#aaa",marginTop:8,padding:8}}>
      Fuentes: Zoho Books · Zoho Billing · Zoho CRM · Supabase Edge Functions · Actualización en tiempo real
    </div>
  </div>);
}

export default function AccionesClientes({ userEmail, onLogout }) {
  const [tab, setTab] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [empFilt, setEmpFilt] = useState("Todas");
  const [booksFilt, setBooksFilt] = useState("Todos");
  useEffect(() => {
    fetch(API_URL).then(r => r.json()).then(d => {
      ACTIONS = d.ACTIONS; RC_STD = d.RC_STD; RC_ESP = d.RC_ESP;
      CS = d.CS; CSP = d.CSP; RR = d.RR; EXC = d.EXC;
      ESC_S = d.ESC_S; EXP = d.EXP;
      _O = d._O; _OX = d._OX;
      BAJA_DATES = d.BAJA_DATES; _TD = d._TD; _XD = d._XD; _EC = d._EC || {}; _AD = d._AD; _SV = d._SV || {};
      setLoaded(true);
    }).catch(e => console.error('Error loading data:', e));
  }, []);
  if (!loaded) return (
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: GRAD, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{width:56,height:56,borderRadius:14,background:"rgba(255,255,255,.12)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}>
          <span style={{color:"#fff",fontSize:28,fontWeight:800}}>N</span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Cargando datos...</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)" }}>Consultando Supabase</div>
      </div>
    </div>
  );
  return (
    <div style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif", background: "#F4F6FA", minHeight: "100vh", padding: 20 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{background:GRAD,borderRadius:14,padding:"16px 24px",marginBottom:18,display:"flex",alignItems:"center",gap:16,boxShadow:"0 4px 20px rgba(1,39,80,.18)"}}>
          <svg width="38" height="38" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="120" height="120" rx="16" fill="rgba(255,255,255,.12)"/>
            <text x="60" y="78" textAnchor="middle" fontFamily="Montserrat,sans-serif" fontSize="56" fontWeight="800" fill="#fff">N</text>
          </svg>
          <div style={{flex:1}}>
            <div style={{fontSize:19,fontWeight:700,color:"#fff",letterSpacing:.3}}>Plan de Acciones — Clientes sin Facturación</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,.65)",marginTop:2}}>27 masters excluidos · Filtro: ACTIVO + Cliente · {new Date().toLocaleDateString('es-MX')}</div>
          </div>
          {userEmail && <div style={{display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:11,color:"rgba(255,255,255,.7)"}}>{userEmail}</span>
            <button onClick={onLogout}
              onMouseOver={e=>{e.currentTarget.style.background="rgba(255,255,255,.25)";}}
              onMouseOut={e=>{e.currentTarget.style.background="rgba(255,255,255,.12)";}}
              style={{padding:"6px 14px",borderRadius:20,border:"1px solid rgba(255,255,255,.25)",background:"rgba(255,255,255,.12)",color:"#fff",fontSize:11,cursor:"pointer",fontWeight:600,transition:"all .2s"}}>Salir</button>
          </div>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:12,flexWrap:"wrap",padding:"8px 12px",background:"#fff",borderRadius:12,boxShadow:"0 1px 4px rgba(1,39,80,.05)"}}>
          <span style={{fontSize:10,fontWeight:700,color:NAVY,letterSpacing:.4}}>Empresa:</span>
          {_EMP_OPTS.map(o=><button key={o} onClick={()=>setEmpFilt(o)}
            onMouseOver={e=>{if(empFilt!==o)e.currentTarget.style.background="#EDF1F7";}}
            onMouseOut={e=>{if(empFilt!==o)e.currentTarget.style.background="#fff";}}
            style={{padding:"4px 12px",borderRadius:20,border:empFilt===o?"none":"1px solid #dde4ed",background:empFilt===o?BLUE:"#fff",color:empFilt===o?"#fff":MID_NAVY,fontSize:10,fontWeight:600,cursor:"pointer",transition:"all .2s",boxShadow:empFilt===o?"0 1px 4px rgba(36,95,165,.3)":"none"}}>{o}</button>)}
          <div style={{width:1,height:18,background:"#dde4ed",margin:"0 6px"}}/>
          <span style={{fontSize:10,fontWeight:700,color:"#27AE60",letterSpacing:.4}}>Books:</span>
          {_BOOKS_OPTS.map(o=><button key={o} onClick={()=>setBooksFilt(o)}
            onMouseOver={e=>{if(booksFilt!==o)e.currentTarget.style.background="#E8F8F0";}}
            onMouseOut={e=>{if(booksFilt!==o)e.currentTarget.style.background="#fff";}}
            style={{padding:"4px 12px",borderRadius:20,border:booksFilt===o?"none":"1px solid #dde4ed",background:booksFilt===o?"#27AE60":"#fff",color:booksFilt===o?"#fff":"#333",fontSize:10,fontWeight:600,cursor:"pointer",transition:"all .2s",boxShadow:booksFilt===o?"0 1px 4px rgba(39,174,96,.3)":"none"}}>{o}</button>)}
        </div>
        <div style={{ display: "flex", gap: 5, marginBottom: 16, flexWrap: "wrap", background:"#fff", padding:"6px", borderRadius:16, boxShadow:"0 1px 6px rgba(1,39,80,.06)" }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              onMouseOver={e=>{if(tab!==i)e.currentTarget.style.background="#EDF1F7";}}
              onMouseOut={e=>{if(tab!==i)e.currentTarget.style.background="transparent";}}
              style={{ padding: "8px 16px", borderRadius: 20, border: "none", background: tab === i ? GRAD : "transparent", color: tab === i ? "#fff" : MID_NAVY, fontWeight: tab === i ? 700 : 500, fontSize: 11, cursor: "pointer", transition:"all .2s ease", boxShadow: tab === i ? "0 2px 8px rgba(1,39,80,.18)" : "none", letterSpacing:.2 }}>{t}</button>
          ))}
        </div>
        <EmpCtx.Provider value={empFilt}>
        <BooksCtx.Provider value={booksFilt}>
        {tab === 0 && <TabResumen />}
        {tab === 1 && <TabRevisarConfig />}
        {tab === 2 && <TabEspeciales />}
        {tab === 3 && <TabCrearSub />}
        {tab === 4 && <TabReanudarRenovar />}
        {tab === 5 && <TabPreventivos />}
        {tab === 6 && <TabExcluidos />}
        {tab === 7 && <TabEscalar />}
        {tab === 8 && <TabExcParent />}
        {tab === 9 && <TabMetodologia />}
        </BooksCtx.Provider>
        </EmpCtx.Provider>
        <div style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,.7)", marginTop: 24, padding: "14px 0", background: GRAD, borderRadius: 10 }}>Numaris · Dashboard de Cobranza · Supabase (Zoho Books + Billing + CRM)</div>
      </div>
    </div>
  );
}