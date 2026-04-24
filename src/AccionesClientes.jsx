import { useState, useMemo, useEffect, createContext, useContext } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import * as XLSX from "xlsx";

const NAVY = "#012750";
const BLUE = "#245FA5";
const ICE = "#E5EDF9";
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
const getEmpCode=n=>{const v=_XD[n];if(v)return v[0];const c=_EC[n];if(c)return c[0];return"";};
const empFilter=(data,emp)=>{if(emp==="Todas")return data;if(emp==="Sin empresa")return data.filter(r=>!getEmpCode(r[0]));const code=_EMP_CODES[emp];return data.filter(r=>getEmpCode(r[0])===code);};

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
const Pgr=({p,tp,set})=>tp>1?<div style={{display:"flex",gap:6,justifyContent:"center",marginTop:10,alignItems:"center"}}><button onClick={()=>set(Math.max(0,p-1))} disabled={p===0} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #ddd",background:p===0?"#f0f0f0":"#fff",cursor:p===0?"default":"pointer",fontSize:11}}>&laquo; Ant</button><span style={{fontSize:11,color:NAVY,fontWeight:600}}>Pag {p+1}/{tp}</span><button onClick={()=>set(Math.min(tp-1,p+1))} disabled={p>=tp-1} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #ddd",background:p>=tp-1?"#f0f0f0":"#fff",cursor:p>=tp-1?"default":"pointer",fontSize:11}}>Sig &raquo;</button></div>:null;



const TABS = ["Resumen","Revisar Suscripciones","Contratos Especiales","Crear Suscripcion","Reanudar/Renovar","Preventivos","Excluidos (Masters)","Escalar","Excluir (Parent)","Metodologia"];

function KPI({label,value,sub,color}){return(<div style={{background:"#fff",borderRadius:10,padding:"14px 18px",boxShadow:"0 1px 4px rgba(0,0,0,.08)",borderLeft:`4px solid ${color||BLUE}`,minWidth:140}}><div style={{fontSize:11,color:"#666",textTransform:"uppercase",letterSpacing:.5}}>{label}</div><div style={{fontSize:22,fontWeight:700,color:color||NAVY,marginTop:2}}>{value}</div>{sub&&<div style={{fontSize:11,color:"#888",marginTop:2}}>{sub}</div>}</div>);}

function DataTable({columns,data,maxH,hideSearch}){
  const[sort,setSort]=useState({col:null,asc:true});const[search,setSearch]=useState("");
  const sorted=useMemo(()=>{let d=[...data];if(!hideSearch&&search){const s=search.toLowerCase();d=d.filter(r=>r.some(c=>String(c).toLowerCase().includes(s)));}if(sort.col!==null){const si=columns.slice(0,sort.col).filter(x=>!x.v).length;d.sort((a,b)=>{const va=a[si],vb=b[si];if(va==null)return 1;if(vb==null)return-1;return typeof va==="number"?(sort.asc?va-vb:vb-va):(sort.asc?String(va).localeCompare(String(vb)):String(vb).localeCompare(String(va)));});}return d;},[data,sort,search,hideSearch]);
  return(<div>
    {!hideSearch&&<input placeholder="Buscar..." value={search} onChange={e=>setSearch(e.target.value)} style={{padding:"6px 12px",border:"1px solid #ddd",borderRadius:6,marginBottom:8,width:220,fontSize:12}}/>}
    <div style={{maxHeight:maxH||420,overflow:"auto",borderRadius:8,border:"1px solid #e0e0e0"}}>
      <table style={{minWidth:900,borderCollapse:"collapse",fontSize:11}}>
        <thead><tr>{columns.map((c,i)=><th key={i} onClick={()=>setSort({col:i,asc:sort.col===i?!sort.asc:true})} style={{position:"sticky",top:0,background:NAVY,color:"#fff",padding:"8px 6px",cursor:"pointer",textAlign:c.align||"left",whiteSpace:"nowrap",fontSize:10}}>{c.label}{sort.col===i?(sort.asc?" ▲":" ▼"):""}</th>)}</tr></thead>
        <tbody>{sorted.map((r,ri)=><tr key={ri} style={{background:ri%2===0?"#fff":ICE}}>{columns.map((c,ci)=>{const di=columns.slice(0,ci).filter(x=>!x.v).length;return <td key={ci} style={{padding:"6px",borderBottom:"1px solid #f0f0f0",textAlign:c.align||"left",whiteSpace:"nowrap"}}>{c.fmt?c.fmt(r[di],r):r[di]}</td>;})}</tr>)}</tbody>
      </table>
    </div>
    <div style={{fontSize:10,color:"#888",marginTop:4}}>{sorted.length} registros</div>
  </div>);
}

function TabResumen() {
  const emp=useContext(EmpCtx);
  const fA=useMemo(()=>{
    if(emp==="Todas") return ACTIONS;
    const fRC=empFilter(RC_STD,emp),fRE=empFilter(RC_ESP,emp),fCS=empFilter(CS,emp),fCSP=empFilter(CSP,emp);
    const fRR=empFilter(RR,emp),fEXC=empFilter(EXC,emp),fESC=empFilter(ESC_S,emp);
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
  },[emp]);
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
        <div style={{background:"#fff",borderRadius:10,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,.08)"}}>
          <div style={{fontWeight:600,fontSize:13,color:NAVY,marginBottom:8}}>Distribucion por Categoria</div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({name,value})=>`${name}: ${value}`} labelLine={false} fontSize={9}>{pieData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip formatter={v=>v+" clientes"}/></PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{background:"#fff",borderRadius:10,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,.08)"}}>
          <div style={{fontWeight:600,fontSize:13,color:NAVY,marginBottom:8}}>Ingreso Mensual por Accion</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barData} layout="vertical" margin={{left:100}}>
              <XAxis type="number" tickFormatter={fmtK} fontSize={10}/><YAxis type="category" dataKey="name" fontSize={9} width={95}/><Tooltip formatter={v=>fmt(v)}/>
              <Bar dataKey="value" radius={[0,4,4,0]}>{barData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div style={{background:"#fff",borderRadius:10,padding:16,boxShadow:"0 1px 4px rgba(0,0,0,.08)"}}>
        <div style={{fontWeight:600,fontSize:13,color:NAVY,marginBottom:10}}>Matriz de Acciones</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10}}>
          {Object.entries(fA).map(([k,v])=>(
            <div key={k} style={{display:"flex",gap:10,padding:10,borderRadius:8,border:`1px solid ${v.color}22`,background:`${v.color}08`}}>
              <div style={{width:6,borderRadius:3,background:v.color,flexShrink:0}}/>
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
  const emp=useContext(EmpCtx);
  const data=useMemo(()=>empFilter(RC_STD,emp),[emp]);
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
  const emp=useContext(EmpCtx);
  const data=useMemo(()=>empFilter(RC_ESP,emp),[emp]);
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
  const emp=useContext(EmpCtx);
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(0);
  const [crmFilter, setCrmFilter] = useState("Todos");
  const [subFilter, setSubFilter] = useState("Todos");
  const [csSearch, setCsSearch] = useState("");
  const crmOpts = ["Todos","BAJA DEF.","Cand.Cancel","C.parcial","P.Total","Con folios","Sin cancelacion"];
  const subOpts = ["Todos","Si","No"];
  const filtered = useMemo(() => {
    let d = empFilter(CS,emp);
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
  }, [crmFilter, subFilter, csSearch, emp]);
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
      <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6,flexWrap:"wrap"}}>
        <span style={{fontSize:10,fontWeight:700,color:NAVY}}>CRM:</span>
        {crmOpts.map(o=><button key={o} onClick={()=>{setCrmFilter(o);setPage(0);}} style={{padding:"3px 8px",borderRadius:5,border:crmFilter===o?`2px solid ${NAVY}`:"1px solid #ddd",background:crmFilter===o?NAVY:"#fff",color:crmFilter===o?"#fff":NAVY,fontSize:10,fontWeight:600,cursor:"pointer"}}>{o}</button>)}
        <span style={{fontSize:10,fontWeight:700,color:"#2980B9",marginLeft:8}}>Sub:</span>
        {subOpts.map(o=><button key={o} onClick={()=>{setSubFilter(o);setPage(0);}} style={{padding:"3px 8px",borderRadius:5,border:subFilter===o?"2px solid #2980B9":"1px solid #ddd",background:subFilter===o?"#2980B9":"#fff",color:subFilter===o?"#fff":"#2980B9",fontSize:10,fontWeight:600,cursor:"pointer"}}>{o}</button>)}
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
  const emp=useContext(EmpCtx);
  const data=useMemo(()=>empFilter(RR,emp),[emp]);
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
  const emp=useContext(EmpCtx);
  const data=useMemo(()=>empFilter(CSP,emp),[emp]);
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
  const emp=useContext(EmpCtx);
  const [tf,setTf]=useState("Todos");
  const opts=["Todos","Revisar Subs","Crear Sub","Escalar"];
  const filtered=useMemo(()=>{let d=empFilter(EXC,emp);if(tf==="Revisar Subs")d=d.filter(r=>r[2]===0);else if(tf==="Crear Sub")d=d.filter(r=>r[2]===1);else if(tf==="Escalar")d=d.filter(r=>r[2]===2);return d;},[tf,emp]);
  const cols=[{label:"Cliente (Master)",fmt:v=>v},_cEmp,_cEjC,_cOwC,_TA,_cSV,{label:"Tipo",fmt:v=><span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:"#2980B918",color:"#2980B9"}}>{v===0?"Parent":"Regional"}</span>},{label:"Tab",fmt:v=><span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:_EXC_TAB_C[v]+"18",color:_EXC_TAB_C[v]}}>{_EXC_TAB[v]}</span>},{label:"Hijos",align:"right",fmt:v=><b>{v}</b>},{label:"Prom/Mes",align:"right",fmt:v=>fmt(v)},{label:"Ult.Fact.",fmt:v=>v||"\u2014"}];
  return(<div>
    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
      <KPI label="Masters" value={filtered.length} color="#7F8C8D"/>
      <KPI label="Prom/Mes" value={fmtK(filtered.reduce((s,r)=>s+r[4],0))} color="#2980B9"/>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
      {opts.map(o=><button key={o} onClick={()=>setTf(o)} style={{padding:"3px 10px",borderRadius:6,border:"1px solid "+(tf===o?BLUE:"#ddd"),background:tf===o?BLUE:"#fff",color:tf===o?"#fff":"#444",fontSize:11,cursor:"pointer"}}>{o}</button>)}
    </div>
    <DataTable columns={cols} data={filtered}/>
  </div>);
}

function TabEscalar() {
  const emp=useContext(EmpCtx);
  const PG=25;const[page,setPage]=useState(0);const[escSearch,setEscSearch]=useState("");
  const filtered=useMemo(()=>{let d=empFilter(ESC_S,emp);if(escSearch){const s=escSearch.toLowerCase();d=d.filter(r=>r.some(c=>String(c).toLowerCase().includes(s)));}return d;},[escSearch,emp]);
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
  const emp=useContext(EmpCtx);
  const PG=25;const[page,setPage]=useState(0);const[epSearch,setEpSearch]=useState("");
  const filtered=useMemo(()=>{let d=empFilter(EXP,emp);if(epSearch){const s=epSearch.toLowerCase();d=d.filter(r=>r.some(c=>String(c).toLowerCase().includes(s)));}return d;},[epSearch,emp]);
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
  const S={h:{fontWeight:700,fontSize:13,color:NAVY,marginTop:12,marginBottom:6},b:(bg,bd)=>({background:bg,border:"1px solid "+bd,borderRadius:8,padding:10,marginBottom:8,fontSize:11,lineHeight:1.5})};
  return(<div style={{maxWidth:700}}>
    <div style={S.h}>1. Universo</div><div style={S.b("#EBF5FB","#AED6F1")}>account_type=Cliente, status=ACTIVO, sin factura mes actual.</div>
    <div style={S.h}>2. Exclusion</div><div style={S.b("#FDF2E9","#F5CBA7")}>Masters con hijos que facturan.</div>
    <div style={S.h}>3. Clasificacion</div><div style={S.b("#E8F8F5","#A3E4D7")}>Sub: next_billing NULL=REVISAR. Sin sub+fact: gap=CrearSub/Preventivo. Paused=Reanudar. Expired=Renovar.</div>
    <div style={S.h}>4. Cand.Cancel</div><div style={S.b("#FDEDEC","#F5B7B1")}>Mensual&gt;4m, Bim&gt;4m, Trim&gt;6m, Sem&gt;7m, Anual&gt;13m sin factura.</div>
  </div>);
}

export default function AccionesClientes({ userEmail, onLogout }) {
  const [tab, setTab] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [empFilt, setEmpFilt] = useState("Todas");
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
    <div style={{ fontFamily: "'Montserrat', sans-serif", background: "#F4F6FA", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: "#012750", marginBottom: 8 }}>Cargando datos...</div>
        <div style={{ fontSize: 13, color: "#888" }}>Consultando Supabase</div>
      </div>
    </div>
  );
  return (
    <div style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif", background: "#F4F6FA", minHeight: "100vh", padding: 20 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
          <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${NAVY},${BLUE})`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:18,fontWeight:700}}>N</span></div>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:700,color:NAVY}}>Plan de Acciones - Clientes sin Facturacion</div>
            <div style={{fontSize:11,color:"#888"}}>27 masters excluidos | Filtro: ACTIVO + Cliente | ${new Date().toLocaleDateString('es-MX')}</div>
          </div>
          {userEmail && <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:"#888"}}>{userEmail}</span>
            <button onClick={onLogout} style={{padding:"5px 12px",borderRadius:6,border:"1px solid #ddd",background:"#fff",color:"#666",fontSize:11,cursor:"pointer",fontWeight:600}}>Salir</button>
          </div>}
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:10,flexWrap:"wrap"}}>
          <span style={{fontSize:10,fontWeight:700,color:NAVY}}>Empresa:</span>
          {_EMP_OPTS.map(o=><button key={o} onClick={()=>setEmpFilt(o)} style={{padding:"3px 10px",borderRadius:6,border:empFilt===o?`2px solid ${BLUE}`:"1px solid #ddd",background:empFilt===o?BLUE:"#fff",color:empFilt===o?"#fff":NAVY,fontSize:10,fontWeight:600,cursor:"pointer"}}>{o}</button>)}
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: tab === i ? NAVY : "#fff", color: tab === i ? "#fff" : NAVY, fontWeight: tab === i ? 700 : 500, fontSize: 12, cursor: "pointer", boxShadow: tab === i ? "0 2px 6px rgba(0,0,0,.15)" : "0 1px 3px rgba(0,0,0,.06)" }}>{t}</button>
          ))}
        </div>
        <EmpCtx.Provider value={empFilt}>
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
        </EmpCtx.Provider>
        <div style={{ textAlign: "center", fontSize: 10, color: "#bbb", marginTop: 20, padding: 10 }}>Numaris | Supabase (Zoho Books + Billing + CRM)</div>
      </div>
    </div>
  );
}