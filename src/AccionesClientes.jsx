import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";

const NAVY = "#012750";
const BLUE = "#245FA5";
const ICE = "#E5EDF9";
const ACTIONS = {
  REVISAR_CONFIG: { cnt: 6, monthly: 29589, label: "Revisar Config.", color: "#E74C3C", desc: "Subs <=1 anio sin next_billing (revisar cobro)" },
  CONTRATOS_ESP: { cnt: 18, monthly: 1344260, label: "Contratos Especiales", color: "#8E44AD", desc: "Subs multianuales (>1 anio) sin next_billing" },
  CREAR_SUB: { cnt: 101, monthly: 1307002, label: "Crear Suscripcion", color: "#F39C12", desc: "Sin fact. desde abr 2026, sin suscripcion" },
  CREAR_SUB_PREV: { cnt: 39, monthly: 7228764, label: "Crear Sub. Preventivo", color: "#F5B041", desc: "En ciclo pero sin suscripcion" },
  RENOVAR: { cnt: 7, monthly: 29343, label: "Renovar", color: "#9B59B6", desc: "Suscripciones expiradas" },
  REANUDAR: { cnt: 9, monthly: 22162, label: "Reanudar", color: "#3498DB", desc: "Suscripciones pausadas" },
  OK_SUB_VIGENTE: { cnt: 256, monthly: 3624342, label: "OK Sub Vigente", color: "#27AE60", desc: "Sub activa con next_billing futuro" },
  FUTURA: { cnt: 20, monthly: 223057, label: "Sub. Futura", color: "#95A5A6", desc: "Suscripciones futuras programadas" },
  ESCALAR: { cnt: 47, monthly: 0, label: "Escalar", color: "#7F8C8D", desc: "Sin historial ni suscripcion" },
  EXCLUIDOS: { cnt: 27, monthly: 0, label: "Excluidos (Masters)", color: "#BDC3C7", desc: "27 masters parent_account (hijos facturan)" },
};
const _CS = ["","C.parcial","P.Total(proc)","BAJA DEF."];
const _CSC = ["","#8E44AD","#E67E22","#C0392B"];
const _EXC_TAB = ["Revisar Subs","Crear Sub","Escalar"];
const _EXC_TAB_C = ["#E74C3C","#F39C12","#7F8C8D"];
const _BD=`AA SHIPPING COMPANY S. de R.L. de C.V. (|2025-06-20\nABAF|2026-03-02\nABIGAIL ALEJANDRA AVILES VARGAS|2025-02-19\nACERO COMPACTADO|2025-10-08\nAGROPECUARIA TARASCA (COMERCIALIZACION)|2026-01-17\nAGROPECUARIA TARASCA (PRODUCCION)|2026-03-05\nAGUA Y SANEAMIENTO AMBIENTAL|2026-01-08\nALAS DEL MONTE QUERETARO|2026-02-27\nANGEL SANCHEZ RAMIREZ|2025-12-08\nANGEL URIEL PEREZ HERNANDEZ (antes OSCAR|2025-04-04\nANGUS LAS GOLONDRINAS SPR DE RL DE CV Ot|2025-03-28\nANTONIA CRUZ LUCAS|2026-02-26\nANTONIO CALVARIO OSIO|2025-05-14\nANTONIO COCA GAITAN|2025-11-10\nANUNCIOS LUMINOSOS NOVOA|2025-06-19\nARELY HERNANDEZ RODRIGUEZ|2026-03-12\nARRENDA AGUASCALIENTES|2025-11-03\nARRENDADORA BANCREA|2025-07-08\nARRENDADORA IL|2026-02-20\nARRENDAMEX SA DE CV|2026-03-18\nAVIVA LOGISTICS|2026-03-10\nAceros Barajas Medina, S.A. de C.V.|2026-02-18\nAzulejos y Complementos|2025-12-24\nBASF MEXICANA|2025-09-08\nBIO GREEN BCS|2025-10-27`;
const BAJA_DATES=Object.fromEntries(_BD.split("\n").map(l=>{const i=l.indexOf("|");return[l.slice(0,i),l.slice(i+1)];}));
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
const _O = ["Adriana Rebeca Uribe Ramirez", "Andrea Quinones", "Andrea Salvador", "Angel Luis Faustino Ramirez", "Aurora Margarita Araujo Montes", "Bryan Mauricio Sanchez Dominguez", "Carlos Humberto Toriz Flores", "Cesar Alejandro Rodriguez Gutierrez", "Daniel Ocampo", "David Barba", "David Urieta", "Elizabeth Alejandra Pineda Gonzalez", "Elizabeth Cortes Aguirre", "Esmeralda Salgado", "Fernanda Garcia Cubas", "Gerardo Valls Abarca", "Giselle Maldonado Castro", "Jaime Moreno", "Jesus Trillo Albarran", "Joel Araiza", "Juan Alejandro Duarte Delgadillo", "Karen Andrea Gonzalez Ramirez", "Karla Janet Uribe Serrano", "Karla Mariana Rodriguez Contreras", "Laura Marcela Bocanegra Yepez", "Lorena Bolaños Cacho", "Luz Mariel Irineo Perez", "Manuel Adalberto Martinez Vargas", "Maria De Monserrat Samano Lomeli", "Maria Guadalupe Suarez Pulido", "Mario Rincón", "Marleem Hernandez Martinez", "Marlene Cedillo Contreras", "Mayra Alejandra Mendoza Gomez", "Mayra Alejandra Perez Barrera", "Mina Gabriela Rodriguez Fajardo", "Orlak Efrain Castañeda Diaz", "Pablo Octavio Aguilar Pedroza", "Raymundo Alfredo Solano Rueda", "Ricardo Edil Velazquez Diaz", "Samuel Santana Sanchez", "Viridiana Cantu Lugo", "Vivian Itzel Castañeda Varela", "Yanahui Joselyne Contreras Valdovinos", "lorena.ruiz"];
const _OX=["Alan Jahir Soto Miranda", "Alicia Mera Herrera", "Erika Arguelles Rangel", "Itzel Valdes Del Pilar", "Kenia Paola Hernandez Garcia", "Laura Elizabeth Correa Mendoza", "Marco Antonio Vazquez Lopez", "Mariana Becerra", "Martha Angelica Delgadillo Lopez", "Mayra Aranzazu Llanos Martinez", "Noe Jonathan Martinez Granda", "Ricardo Castillo"];
const _EM={"E":"Easytrack","S":"Sfleet","M":"Smart Tracker","T":"Tecnocontrol"};
const _XR=`ABARROTES GECAPA|T45,42\nALEXIS RELINGH REYES|M45,42\nANUNCIOS LUMINOSOS NOVOA|E24,24\nARRENDADORA BANCREA|T32,32\nARRENDADORA IL|T14,14\nBABACHU RODAMIENTOS|E33,33\nBH TRADE MARKET|M45,42\nBRAND MOTION MEDIA|M45,42\nBRANNELEMENT|E15,15\nCABB ARRENDA|T32,32\nCARPAS SAN MARINO|E35,35\nCARPENTUM|T14,14\nCASA VAME|E1,1\nCB COATS|E21,21\nCENTRAL DE FLETES ATLANTE|T38,38\nCHINA DEPOT|M45,42\nCIA HIDRO GAS DE CUERNAVACA|T41,41\nCOI DE TAMPICO|T30,30\nCOMERCIAL FERBERA|M45,42\nCOMERCIALIZADORA CALICHAL|T45,42\nCOMPLEJO INDUSTRIAL FUENTES|T38,38\nCONSULTORA MEXICANA|T14,14\nCREDICOR MEXICANO UNION DE CREDITO|T14,14\nCREDILEASING MEXICANA|T32,32\nCSI RENTING PERU|S2,2\nDARKS SERVICIOS Y ARRENDAMIENTO EMPRESAR|T14,14\nDIANA NOEMI ESPELOSIN RIOS|E24,24\nDICKA LOGISTICS,|E34,34\nDISTRIBUCION Y LOGISTICA DE ALIMENTOS|S10,10\nDISTRIBUCIONES MPS|E15,15\nDISTRIBUIDORA DE BEBIDAS GORILA VELMAR|T39,39\nDISTRIBUIDORA FUVA DE PARRAL|T38,38\nDISTRIBUIDORA Y COMERCIALIZADORA ORIENTA|T45,42\nEC ZONA VERDE|E35,35\nEDUARDO HERNANDEZ MORALES|E24,24\nEDUARDO ROJAS MARTINEZ|E24,24\nELECTRONICA Y MEDICINA|S10,10\nELIZABETH OLVERA VILLA|T45,42\nELVA LEONOR|E24,24\nEMPREVI|T14,14\nENLACES TERRESTRES COMERCIALES|T39,25\nFACTOR GFC LEASING|T32,32\nFARMACON|E27,27\nFASTERRAMA|E35,35\nFERNANDO OSORNIO PEREZ|T45,42\nFINTEGRA FINANCIAMIENTO|T32,32\nFLAMINGOS KPTL|T32,32\nFLEX N GATE MEXICO|M3,3\nFREYR RICARDO FLORES FLORES|E35,35\nGAS COMERCIAL DE CAMARGO|T38,38\nGAS COMERCIAL DE CHIHUAHUA|T38,38\nGAS COMERCIAL DE CUAUHTEMOC|T38,38\nGAS COMERCIAL DE DELICIAS|T38,38\nGAS COMERCIAL DE JIMENEZ|T38,38\nGAS COMERCIAL DE JUAREZ|T38,38\nGAS SUPREMO DE JUAREZ|T38,38\nGISULMEX|T47,30\nGLOBAL FINANCIAL LEASING|T32,32\nGLOY CONSTRUCTORES|E1,15\nGRUAS Y RESGUARDOS HEMI|E35,35\nGRUPO AGROINDUSTRIAL SAN MIGUEL|T45,42\nGRUPO DARIMI|M45,42\nGRUPO TECNO ELECTRONICS S. DE R.L DE C.V|E15,15\nID LEASING|T32,32\nIDEALEASE ORIENTE|T36,36\nILDEFONSO VEGA DUARTE|E1,1\nINDUSTRIAL BERSA|T45,42\nINTERNATIONAL LEASING SUPPORT|E23,23\nISAAC VAZQUEZ ZAVALA|E35,35\nIT SERVICIOS INTEGRADOS|M45,42\nJORGE ALBERTO SUAREZ VELAZQUEZ|E11,11\nJUAN CARLOS TLACUILO TORRES|T45,42\nJULY A|M45,42\nKPTL MEXICO BANK, SOCIEDAD ANONIMA, INST|T14,14\nLEASE AND FLEET SOLUTIONS|S2,2\nLEASING DPC|T14,14\nLENDERA CROWDFUNDING|T32,32\nLOGISTICA FORP|E27,15\nLOGISTICA INTEGRADA BE|T8,8\nLUIS ANGEL RODRIGUEZ PINEDA|E15,15\nMADIN IMPRESORES|M45,42\nMAERSA SERVICIOS DE TRANSPORTACION|E21,21\nMARCO ANTONIO ORTIZ HERNANDEZ|E35,35\nMARGARITA REYES VILLAFAÑA|T16,16\nMARIBEL MERCADO JIMENEZ|E1,1\nMARTHA GABRIELA RAMIREZ RUIZ|E24,24\nMIGUEL GONZALEZ GUERRA|E35,35\nMONTEPIO LUZ SAVIÑON|M5,5\nMOVI TECH|T32,32\nMUROS DE CONCRETO|T45,42\nNATURAL HEALTH II|M45,42\nNOVASEM INNOVACIONES|E33,33\nOAK LEASING|T14,14\nOCTAVIO ESQUEDA GONZALEZ|E35,35\nOSCAR ALEJANDRO BALDERRAMA FRANCO|T38,38\nP42 MEXICO|T36,43\nPAFFA|E24,24\nPANHEC|T32,32\nPARAPENTE GROUP INTERNATIONAL LOGISTICS |T39,39\nPASTISSERIA GALLELIS|E35,35\nPEPSICO INTERNACIONAL MEXICO|M18,18\nPERFETTI VAN MELLE MEXICO|M45,42\nPHI TOOLS|E-1,14\nPRACTICOCINA Y HOGAR|E35,35\nPRETMEX|T32,32\nPROTEINA ANIMAL|T25,25\nQUADRIGA SOLUCIONES|T14,14\nRAFAEL CASTILLO BLASCO|E21,21\nRAMON CONDE CARBAJAL|M45,42\nREFRIGERADOS MONTERREY VALLE|T45,42\nRENDAUTO|T32,32\nRICARDO ALBERTO CAMACHO LOPEZ|E1,1\nSAMUEL SERRATANA RAMIREZ|T45,42\nSANITARIOS PORTATILES POBLANOS NASA|T45,42\nSEGUROS INBURSA, S.A., GRUPO FINANCIERO |T3,3\nSERVI-GAS DEL NORTE|T38,38\nSERVICIO TRAPALA E HIJOS|T45,42\nSERVICIOS ADMINISTRATIVOS JUGOS DEL VALL|S2,2\nSERVICIOS Y COMPLEMENTOS GIL|E21,21\nSISTEMAS DE GEOLOCALIZACION DIGITAL|T39,39\nSMAR-T VALUE INNOVATION|S39,39\nSOFOM INBURSA S.A. DE C.V. SOFOM, E.R., |T26,26\nSOLUCIONES DE TRANSPORTE DE CARGA BDE|E19,19\nSONIGAS|T41,41\nSTANLEY MAGIC DOOR|M45,42\nSTART BANREGIO, S.A. DE C.V. SOFOM E.R.,|T32,32\nTECNO REPARADORES Y REFACCIONES|E15,15\nTECNOTRANSPORTES ESPECIALIZADOS|T37,37\nTELERENTA|T14,14\nTERNOR DE MEXICO|M45,42\nTERRAX LOGISTICA|M45,42\nTGM DEL NORTE|M38,38\nTIENDAS SUPER PRECIO|S2,2\nTITANES LOGISTICA|E33,33\nTRANS UNIVERS DG|M45,42\nTRANSCARGA Y GANADO MORENO|T11,11\nTRANSPORTE TERRESTRE TRANSMART|E24,24\nTRANSPORTES GYM INTERNATIONAL|E12,12\nTRANSPORTES JAGUAR DEL VALLE|E24,24\nTRANSPORTES KRONOS|E1,1\nTRANSPORTES KUGAR DEL PAPALOAPAN|T45,42\nTRANSPORTES RAMAG|S2,2\nTRANSPORTES REFRIGERADOS ORION DE ECATEP|E15,15\nTU LOGICA PERFECTA|E35,35\nTYR DESTINOS TERRESTRES|M45,42\nVALORARREND|T14,14\nVALUE ARRENDADORA SA DE CV SOFOM ER VALU|T32,32\nVELA LEASING SERVICES|T32,32`;
const _XD=Object.fromEntries(_XR.split("\n").map(l=>{const i=l.indexOf("|");return[l.slice(0,i),l.slice(i+1)];}));

const _AE=`AAG Arrendadora SF|52\nAGUA ÓPTIMA Sfleet|52\nANGEL URIEL PEREZ HERNANDEZ (antes OSCAR|49\nAUTOFLETES ALVAREZ NAVARRETE (Otra razón|54\nAUTOTANQUES TORRES|52\nAceros Barajas Medina, S.A. de C.V.|49\nAktiva Capital|52\nAktiva Financiera SF|52\nArrendadora Coppel SF|52\nAvanser SF|52\nBONN PASS SA DE CV|49\nCENTRUM|52\nCOEVA SA de CV|53\nCentral Leasing|48\nDIAN PROCESOS METALURGICOS SA DE CV|53\nDIOCESIS DE HUAJUAPAN DE LEON|47\nDulces Tinajita|50\nENERFLEX SF|52\nENLACES TERRESTRES.|55\nFIXAPP S.A. DE C.V.|52\nFRANCISCO SOLIS MEDINA ( Permisionario C|53\nFibrum SF|52\nFinactiv|51\nFintegra SF|52\nGRUPO INMOBILIARIO FRAVA S DE RL DE CV (|53\nGaleam SF|52\nGrupo Bafar SF|52\nGuadalupe Esmeralda Pinto Portillo|50\nHEB|52\nINMOBILIARIA BOCHUN (otra razón social d|54\nIrving Jair Velasco Alejo|54\nJOSE IGNACIO GALICIA PEREZ (Permisionari|53\nJOSE SANCHEZ ARIAS (Lineas Sanchez en S3|50\nLOGISTICA NENA, S.A DE C.V.|53\nLogística en Entrega|49\nManuel Patiño Almader|54\nMi granjita SF|52\nNATGAS|52\nSBLEASING SA DE CV|49\nSECRETARIA DE LA DEFENSA NACIONAL|46\nSTARFILTERS SA DE CV|54\nSTAY STICKY (antes CB COATS)|50\nSUPERMERCADOS DE ZAPOPAN SA DE CV (SU SU|53\nSector de México SA de CV|49\nTR Derivados de Maiz SA de CV|50\nTRANSPORTES AUTONOMOS DE OCCIDENTE SA DE|54\nTRANSPORTES KUGAR DEL PAPALOAPAN ( TUXTE|48\nTRANSPORTES KUGAR DEL PAPALOAPAN ( ZACAT|48\nTextiles Agricolas S.A. de C.V.|53\nTiendas Bafar|52\nTulps Total SF|52\nVITAMINAS, MINERALES Y ADITIVOS, S.A. DE|50`;
const _AD=Object.fromEntries(_AE.split("\n").map(l=>{const i=l.indexOf("|");return[l.slice(0,i),+l.slice(i+1)];}));
const _gx=n=>{const v=_XD[n];if(!v)return null;return[v[0],+v.slice(1).split(",")[0],+v.slice(1).split(",")[1]];};
const _pn=i=>{if(i<0)return"\u2014";if(i<45){const n=_O[i];return n?n.split(" ").slice(0,2).join(" "):"?";}const n=_OX[i-45];return n?n.split(" ").slice(0,2).join(" "):"?";};
const _cEmp={label:"Empresa",v:1,fmt:(_,r)=>{const x=_gx(r[0]);return x?(_EM[x[0]]||"\u2014"):"\u2014";}};
const _cEjC={label:"Ejec.Cobro",v:1,fmt:(_,r)=>{const x=_gx(r[0]);if(x)return _pn(x[1]);const a=_AD[r[0]];return a>=0?_pn(a):"\u2014";}};
const _cOwC={label:"Owner CRM",fmt:(v,r)=>{const x=_gx(r[0]);if(x)return _pn(x[2]);const o=_O[v];return o?o.split(" ").slice(0,2).join(" "):"\u2014";}};
const _CC={label:"# Cancel.",align:"right",fmt:v=>v>0?<span style={{padding:"2px 6px",borderRadius:4,fontSize:10,fontWeight:600,background:"#C0392B18",color:"#C0392B"}}>{v}</span>:<span style={{fontSize:10,color:"#ccc"}}>0</span>};
const _FC={label:"Fecha Cancel.",fmt:(v,r)=>{const d=BAJA_DATES[r[0]];return d?<span style={{fontSize:10}}>{d}</span>:<span style={{fontSize:10,color:"#ccc"}}>&mdash;</span>;}};
const _SP={label:"Sub Prev",fmt:v=>SubBdg(v)};
const _AC={label:"Accion CRM",fmt:(v,r)=>CndBdg(v,r)};
const _TDR=`ABARROTES GECAPA|5\nALEXIS RELINGH REYES|1\nANUNCIOS LUMINOSOS NOVOA|17\nAceros Barajas Medina, S.A. de C.V.|13\nAktiva Financiera|4\nBH TRADE MARKET|4\nBONN PASS SA DE CV|2\nCABB ARRENDA|3\nCARPAS SAN MARINO|12\nCARPENTUM|6\nCASA VAME|13\nCB COATS|11\nCHINA DEPOT|4\nCIA HIDRO GAS DE CUERNAVACA|82\nCOEVA SA de CV|3\nCOMERCIAL FERBERA|2\nCOMERCIALIZADORA CALICHAL|6\nCONSULTORA MEXICANA|39\nDARKS SERVICIOS Y ARRENDAMIENTO EMPRESAR|129\nDIAN PROCESOS METALURGICOS SA DE CV|12\nDIANA NOEMI ESPELOSIN RIOS|6\nDISTRIBUIDORA Y COMERCIALIZADORA ORIENTA|1\nEDUARDO HERNANDEZ MORALES|5\nELIZABETH OLVERA VILLA|4\nELVA LEONOR|2\nEMPREVI|68\nENLACES TERRESTRES.|4\nFACTOR GFC LEASING|30\nFASTERRAMA|1\nFERNANDO OSORNIO PEREZ|2\nFINTEGRA FINANCIAMIENTO|219\nFLAMINGOS KPTL|3\nFRANCISCO SOLIS MEDINA ( Permisionario C|1\nFREYR RICARDO FLORES FLORES|1\nGLOBAL FINANCIAL LEASING|16\nGLOY CONSTRUCTORES|16\nGRUAS Y RESGUARDOS HEMI|5\nGRUPO AGROINDUSTRIAL SAN MIGUEL|1\nGRUPO DARIMI|8\nGRUPO INMOBILIARIO FRAVA S DE RL DE CV (|3\nGRUPO TECNO ELECTRONICS S. DE R.L DE C.V|5\nID LEASING|14\nIDEALEASE ORIENTE|13\nILDEFONSO VEGA DUARTE|11\nINDUSTRIAL BERSA|4\nINMOBILIARIA BOCHUN (otra razón social d|10\nINTERNATIONAL LEASING SUPPORT|11\nISAAC VAZQUEZ ZAVALA|2\nIT SERVICIOS INTEGRADOS|6\nJOSE SANCHEZ ARIAS (Lineas Sanchez en S3|6\nJUAN CARLOS TLACUILO TORRES|1\nJULY A|6\nLENDERA CROWDFUNDING|53\nLOGISTICA FORP|16\nLOGISTICA NENA, S.A DE C.V.|10\nLUIS ANGEL RODRIGUEZ PINEDA|10\nMADIN IMPRESORES|3\nMARCO ANTONIO ORTIZ HERNANDEZ|2\nMARGARITA REYES VILLAFAÑA|2\nMARIBEL MERCADO JIMENEZ|1\nMARTHA GABRIELA RAMIREZ RUIZ|1\nMIGUEL GONZALEZ GUERRA|1\nMONTEPIO LUZ SAVIÑON|4\nMOVI TECH|20\nMUROS DE CONCRETO|2\nManuel Patiño Almader|4\nNATURAL HEALTH II|8\nNOVASEM INNOVACIONES|44\nOAK LEASING|32\nOCTAVIO ESQUEDA GONZALEZ|3\nPAFFA|3\nPARAPENTE GROUP INTERNATIONAL LOGISTICS |1\nPASTISSERIA GALLELIS|2\nPERFETTI VAN MELLE MEXICO|10\nPHI TOOLS|79\nPRACTICOCINA Y HOGAR|1\nQUADRIGA SOLUCIONES|85\nRAFAEL CASTILLO BLASCO|3\nRAMON CONDE CARBAJAL|1\nRENDAUTO|92\nRICARDO ALBERTO CAMACHO LOPEZ|1\nSAMUEL SERRATANA RAMIREZ|2\nSBLEASING SA DE CV|4\nSOLUCIONES DE TRANSPORTE DE CARGA BDE|1\nSTARFILTERS SA DE CV|4\nSTART BANREGIO, S.A. DE C.V. SOFOM E.R.,|431\nSTAY STICKY (antes CB COATS)|11\nSUPERMERCADOS DE ZAPOPAN SA DE CV (SU SU|16\nSector de México SA de CV|1\nTECNOTRANSPORTES ESPECIALIZADOS|27\nTERNOR DE MEXICO|4\nTERRAX LOGISTICA|2\nTR Derivados de Maiz SA de CV|6\nTRANS UNIVERS DG|8\nTRANSPORTE TERRESTRE TRANSMART|11\nTRANSPORTES JAGUAR DEL VALLE|67\nTRANSPORTES KRONOS|21\nTRANSPORTES KUGAR DEL PAPALOAPAN ( TUXTE|9\nTRANSPORTES KUGAR DEL PAPALOAPAN ( ZACAT|9\nTRANSPORTES REFRIGERADOS ORION DE ECATEP|16\nTU LOGICA PERFECTA|5\nTYR DESTINOS TERRESTRES|4\nVALORARREND|11\nVALUE ARRENDADORA SA DE CV SOFOM ER VALU|302\nVITAMINAS, MINERALES Y ADITIVOS, S.A. DE|1`;
const _TD=Object.fromEntries(_TDR.split("\n").map(l=>{const i=l.lastIndexOf("|");return[l.slice(0,i),l.slice(i+1)]}));
const _TA={label:"Activos",align:"right",fmt:(v,r)=>{const t=_TD[r[0]];return t?<b>{t}</b>:<span style={{color:"#ccc"}}>0</span>;}};
const Pgr=({p,tp,set})=>tp>1?<div style={{display:"flex",gap:6,justifyContent:"center",marginTop:10,alignItems:"center"}}><button onClick={()=>set(Math.max(0,p-1))} disabled={p===0} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #ddd",background:p===0?"#f0f0f0":"#fff",cursor:p===0?"default":"pointer",fontSize:11}}>&laquo; Ant</button><span style={{fontSize:11,color:NAVY,fontWeight:600}}>Pag {p+1}/{tp}</span><button onClick={()=>set(Math.min(tp-1,p+1))} disabled={p>=tp-1} style={{padding:"4px 10px",borderRadius:6,border:"1px solid #ddd",background:p>=tp-1?"#f0f0f0":"#fff",cursor:p>=tp-1?"default":"pointer",fontSize:11}}>Sig &raquo;</button></div>:null;

const RC_STD = [["ANGEL URIEL PEREZ HERNANDEZ (antes OSCAR",9,"Trim.",12874,"2026-01-04",8,12862,8,0,"3","CONFIG",1,0,3,0],
["VALORARREND",14,"Anual",6396,"2025-07-15",1,6396,0,0,"12","CONFIG",1,0,3,0],
["LUIS ANGEL RODRIGUEZ PINEDA",15,"Mensual",5868,"2026-03-03",9,6154,9,0,"1","CONFIG",1,0,3,0],
["TERNOR DE MEXICO",42,"Mensual",1918,"2026-03-03",4,1846,4,0,"1","CONFIG",1,0,0,0],
["ISAAC VAZQUEZ ZAVALA",35,"Trim.",1528,"2026-01-04",2,2777,2,0,"3","CONFIG",1,0,3,0],
["CONSULTORA MEXICANA",14,"Anual",1005,"2026-03-22",1,5066,0,0,"12","CONFIG",1,0,3,0]];
const RC_ESP = [["FINTEGRA FINANCIAMIENTO",32,"3 anios",797826,"2025-12-21",230,1668376,0,1,"29,30","PARCIAL",1,0,0,0],
["START BANREGIO, S.A. DE C.V. SOFOM E.R.,",32,"5 anios",118655,"2026-03-27",92,1527219,0,0,"24,26,27,30,36,48","CONFIG",1,0,3,0],
["FLAMINGOS KPTL",32,"5 anios",78429,"2026-03-07",11,191328,0,0,"1,20,24,36,48,60","CONFIG",1,0,3,0],
["PHI TOOLS",14,"4 anios",77133,"2025-03-20",9,134231,0,0,"24,36,48","CONFIG",1,0,3,0],
["IDEALEASE ORIENTE",36,"5 anios",72242,"2025-09-18",13,88089,0,0,"12,60","CONFIG",1,0,0,0],
["FACTOR GFC LEASING",32,"2 anios",34062,"2025-11-02",30,182955,0,0,"12,24","CONFIG",1,0,0,0],
["EMPREVI",14,"5 anios",31846,"2026-02-25",15,242231,0,0,"1,18,24,36,48,60","CONFIG",1,0,3,0],
["RENDAUTO",32,"5 anios",30281,"2026-01-13",25,333450,0,0,"24,36,48,60","CONFIG",1,0,3,0],
["ID LEASING",32,"3 anios",25968,"2025-11-30",13,155264,0,0,"1,12,36","CONFIG",1,0,0,0],
["OAK LEASING",14,"4 anios",15497,"2025-12-31",5,103295,0,0,"36,48","CONFIG",1,0,3,0],
["VALUE ARRENDADORA SA DE CV SOFOM ER VALU",32,"4 anios",15280,"2025-08-23",8,74176,0,0,"12,24,48","CONFIG",1,0,3,0],
["LENDERA CROWDFUNDING",32,"3 anios",12313,"2026-02-03",5,62270,0,0,"36","CONFIG",1,0,3,0],
["GLOBAL FINANCIAL LEASING",32,"4 anios",11559,"2026-01-20",6,92101,0,0,"12,36,48","CONFIG",1,0,3,0],
["MOVI TECH",32,"12m",7593,"2026-03-31",3,15222,0,0,"12","CONFIG",1,0,3,0],
["QUADRIGA SOLUCIONES",14,"12m",6497,"2026-02-09",4,21995,0,0,"12","CONFIG",1,0,3,0],
["Aktiva Financiera",14,"3 anios",4411,"2026-03-05",1,7917,0,0,"36","CONFIG",1,0,0,0],
["CARPENTUM",14,"5 anios",3241,"2026-02-26",3,28421,0,0,"4,48,60","CONFIG",1,0,0,0],
["CABB ARRENDA",32,"2 anios",1427,"2026-02-17",11,17147,0,0,"12,6","CONFIG",1,0,3,0]];

const CS = [["SOFOM INBURSA S.A. DE C.V. SOFOM, E.R., ",26,"Solo 1 mes",0,3.68,479646,"2025-12-15",1,0,0,0,0],
["COI DE TAMPICO",30,"Solo 1 mes",0,2.99,173582,"2026-01-05",1,0,0,0,0],
["AGUA ÓPTIMA Sfleet",2,"Solo 1 mes",0,2.69,45859,"2026-01-14",1,0,0,0,0],
["DICKA LOGISTICS,",34,"Solo 1 mes",0,9.1,33628,"2025-07-03",1,0,0,0,0],
["FASTERRAMA",35,"Mensual",1.03,9.1,27299,"2025-07-03",5,0,1,3,0],
["LOGISTICA INTEGRADA BE",8,"Mensual",0.96,7.13,24732,"2025-09-01",5,0,1,0,0],
["NOVASEM INNOVACIONES",33,"Mensual",0.93,2.04,22017,"2026-02-03",13,0,0,3,0],
["TECNOTRANSPORTES ESPECIALIZADOS",37,"Mensual",1,9.17,21186,"2025-07-01",4,0,1,0,0],
["TRANSPORTES GYM INTERNATIONAL",12,"Bimestral",1.82,9.17,19068,"2025-07-01",3,0,1,3,0],
["DIAN PROCESOS METALURGICOS SA DE CV",24,"Bimestral",2.12,7.59,17992,"2025-08-18",4,0,1,3,0],
["Logística en Entrega",12,"Solo 1 mes",0,9.82,17734,"2025-06-11",1,0,0,0,0],
["LOGISTICA FORP",15,"Mensual",0.99,11.17,17603,"2025-05-01",2,0,1,0,0],
["FIXAPP S.A. DE C.V.",13,"Solo 1 mes",0,0.23,16536,"2026-03-30",1,0,0,0,0],
["P42 MEXICO",43,"Solo 1 mes",0,13.07,15080,"2025-03-04",1,0,0,0,0],
["GRUPO TECNO ELECTRONICS S. DE R.L DE C.V",15,"Solo 1 mes",0,13.24,14824,"2025-02-27",1,0,0,0,0],
["TRANSPORTES JAGUAR DEL VALLE",24,"Mensual",0.92,7.13,14365,"2025-09-01",9,0,1,3,0],
["CSI RENTING PERU",2,"Mensual",1.41,3.81,13040,"2025-12-11",2,0,0,0,0],
["Dulces Tinajita",29,"Solo 1 mes",0,2.04,12748,"2026-02-03",1,0,0,0,0],
["SBLEASING SA DE CV",35,"Solo 1 mes",0,9.59,12725,"2025-06-18",1,0,0,3,0],
["CARPAS SAN MARINO",35,"Mensual",1.02,10.15,12028,"2025-06-01",2,0,1,3,0],
["TRANSPORTES REFRIGERADOS ORION DE ECATEP",15,"Mensual",1.25,6.14,11685,"2025-10-01",8,0,1,3,0],
["ENLACES TERRESTRES.",39,"Mensual",1,9.17,10871,"2025-07-01",3,0,1,0,0],
["MARIBEL MERCADO JIMENEZ",1,"Mensual",0.92,7.13,10691,"2025-09-01",8,0,1,3,0],
["MAERSA SERVICIOS DE TRANSPORTACION",21,"Solo 1 mes",0,1.35,10440,"2026-02-24",1,0,0,0,0],
["TRANSPORTE TERRESTRE TRANSMART",24,"Solo 1 mes",0,13.44,9697,"2025-02-21",1,0,0,0,0],
["SUPERMERCADOS DE ZAPOPAN SA DE CV (SU SU",35,"Solo 1 mes",0,12.09,9242,"2025-04-03",1,0,0,3,0],
["JULY A",42,"Solo 1 mes",0,11.7,9073,"2025-04-15",1,0,0,0,0],
["TRANSPORTES KRONOS",1,"Mensual",0.88,7.13,9030,"2025-09-01",9,0,1,3,0],
["ANUNCIOS LUMINOSOS NOVOA",24,"Trim.",2.97,9.17,8779,"2025-07-01",3,0,1,3,0],
["GLOY CONSTRUCTORES",15,"Mensual",0.96,2,8689,"2026-02-04",12,0,0,0,0],
["INMOBILIARIA BOCHUN (otra razón social d",15,"Mensual",1,11.17,7736,"2025-05-01",3,0,1,3,0],
["SERVICIO TRAPALA E HIJOS",42,"Mensual",0.94,6.08,7671,"2025-10-03",7,0,1,0,0],
["GRUAS Y RESGUARDOS HEMI",35,"Mensual",1.01,6.08,7348,"2025-10-03",7,0,1,3,0],
["STAY STICKY (antes CB COATS)",15,"Mensual",0.98,2,7077,"2026-02-04",13,0,0,0,0],
["STANLEY MAGIC DOOR",42,"Bimestral",1.84,10.91,6997,"2025-05-09",2,0,1,0,0],
["GRUPO INMOBILIARIO FRAVA S DE RL DE CV (",24,"Solo 1 mes",0,12.55,6820,"2025-03-20",1,0,0,0,0],
["TR Derivados de Maiz SA de CV",35,"Solo 1 mes",0,9.17,6681,"2025-07-01",1,0,0,3,0],
["COEVA SA de CV",15,"Trim.",2.6,6.08,6436,"2025-10-03",3,0,1,3,0],
["EC ZONA VERDE",35,"Trim.",3.02,9.13,6425,"2025-07-02",2,0,1,3,0],
["EDUARDO ROJAS MARTINEZ",24,"Mensual",1.02,7.13,6424,"2025-09-01",3,0,1,0,0],
["RAFAEL CASTILLO BLASCO",21,"Mensual",1.01,6.08,5808,"2025-10-03",7,0,1,3,0],
["CASA VAME",1,"Mensual",1.1,6.08,5739,"2025-10-03",9,0,1,3,0],
["CB COATS",21,"Bimestral",2.17,10.58,5297,"2025-05-19",3,0,1,0,0],
["COMERCIALIZADORA CALICHAL",42,"Mensual",1,3.06,5277,"2026-01-03",10,0,0,0,0],
["TU LOGICA PERFECTA",35,"Mensual",1,10.15,5271,"2025-06-01",3,0,1,3,0],
["PASTISSERIA GALLELIS",35,"Mensual",0.91,6.08,4855,"2025-10-03",9,0,1,3,0],
["DISTRIBUIDORA Y COMERCIALIZADORA ORIENTA",42,"Mensual",1,6.14,4241,"2025-10-01",8,0,1,3,0],
["JOSE IGNACIO GALICIA PEREZ (Permisionari",34,"Solo 1 mes",0,0.2,4215,"2026-03-31",1,0,0,0,0],
["BH TRADE MARKET",42,"Bimestral",1.63,5.42,3930,"2025-10-23",4,0,1,2,0],
["MARGARITA REYES VILLAFAÑA",16,"Solo 1 mes",0,4.47,3883,"2025-11-21",1,0,0,0,0],
["ELIZABETH OLVERA VILLA",42,"Mensual",1.12,10.58,3764,"2025-05-19",2,0,1,0,0],
["GRUPO DARIMI",42,"Mensual",1,6.83,3696,"2025-09-10",8,0,1,3,0],
["DIANA NOEMI ESPELOSIN RIOS",24,"Mensual",0.66,13.17,3678,"2025-03-01",3,0,1,3,0],
["LOGISTICA NENA, S.A DE C.V.",24,"Bimestral",1.57,6.04,3503,"2025-10-04",5,0,1,3,0],
["EDUARDO HERNANDEZ MORALES",24,"Mensual",0.93,2.1,3458,"2026-02-01",12,0,0,0,0],
["MADIN IMPRESORES",42,"Solo 1 mes",0,11.7,3433,"2025-04-15",1,0,0,0,0],
["REFRIGERADOS MONTERREY VALLE",42,"Bimestral",2.2,8.15,3016,"2025-08-01",3,0,1,0,0],
["CHINA DEPOT",42,"Mensual",0.99,8.51,2921,"2025-07-21",6,0,1,0,0],
["MARCO ANTONIO ORTIZ HERNANDEZ",35,"Mensual",0.85,10.74,2827,"2025-05-14",5,0,1,3,0],
["STARFILTERS SA DE CV",24,"Trim.",2.99,9.17,2445,"2025-07-01",2,0,1,3,0],
["Sector de México SA de CV",35,"Mensual",1,2.04,2435,"2026-02-03",13,0,0,3,0],
["AUTOFLETES ALVAREZ NAVARRETE (Otra razón",11,"Solo 1 mes",0,13.21,2383,"2025-02-28",1,0,0,0,0],
["GISULMEX",30,"Solo 1 mes",0,11.47,2204,"2025-04-22",1,0,0,0,0],
["SERVICIOS Y COMPLEMENTOS GIL",21,"Mensual",1.02,5.06,2069,"2025-11-03",7,0,1,3,0],
["JORGE ALBERTO SUAREZ VELAZQUEZ",11,"Solo 1 mes",0,2.43,1941,"2026-01-22",1,0,0,0,0],
["INDUSTRIAL BERSA",42,"Mensual",1,9.17,1832,"2025-07-01",5,0,1,0,0],
["OCTAVIO ESQUEDA GONZALEZ",35,"Mensual",1.01,3.06,1806,"2026-01-03",10,0,0,3,0],
["MUROS DE CONCRETO",42,"Mensual",0.99,9.17,1573,"2025-07-01",6,0,1,2,0],
["BABACHU RODAMIENTOS",33,"Solo 1 mes",0,1.51,1523,"2026-02-19",1,0,0,0,0],
["TRANSPORTES KUGAR DEL PAPALOAPAN ( ZACAT",42,"Mensual",1,4.14,1488,"2025-12-01",5,0,1,0,0],
["VITAMINAS, MINERALES Y ADITIVOS, S.A. DE",11,"Solo 1 mes",0,12.52,1461,"2025-03-21",1,0,0,3,0],
["PAFFA",24,"Mensual",1.01,8.15,1455,"2025-08-01",4,0,1,3,0],
["SAMUEL SERRATANA RAMIREZ",42,"Mensual",1,3.06,1383,"2026-01-03",12,0,0,0,0],
["COMERCIAL FERBERA",42,"Bimestral",1.89,8.15,1363,"2025-08-01",3,0,1,3,0],
["FRANCISCO SOLIS MEDINA ( Permisionario C",34,"Solo 1 mes",0,4.24,1361,"2025-11-28",1,0,0,0,0],
["SOLUCIONES DE TRANSPORTE DE CARGA BDE",19,"Mensual",1.01,3.06,1267,"2026-01-03",11,0,0,3,0],
["MARTHA GABRIELA RAMIREZ RUIZ",24,"Bimestral",1.97,10.18,1236,"2025-05-31",2,0,1,3,0],
["JUAN CARLOS TLACUILO TORRES",42,"Mensual",0.99,3.02,1203,"2026-01-04",12,0,0,0,0],
["TERRAX LOGISTICA",42,"Mensual",0.99,7.92,1144,"2025-08-08",7,0,1,3,0],
["DARKS SERVICIOS Y ARRENDAMIENTO EMPRESAR",14,"Solo 1 mes",0,4.07,1090,"2025-12-03",1,0,0,3,0]];

const RR = [["BRANNELEMENT",15,"Bimestral",6,14520,"2025-10-03",1,928,"Servicio Rastreo 2 mes(es). Co","Renovar",1,1,3,0],
["Aceros Barajas Medina, S.A. de C.V.",15,"Mensual",5,9082,"2026-03-04",1,348,"Servicio Rastreo 1 mes(es). Co","Renovar",1,0,3,0],
["GRUPO AGROINDUSTRIAL SAN MIGUEL",42,"Mensual",0,4556,"2026-02-03",7,4652,"Servicio Control de Combustibl","Reanudar",1,0,0,0],
["TRANS UNIVERS DG",42,"Mensual",0,4373,"2026-03-01",8,3173,"Servicio Rastreo 1 mes(es).","Reanudar",1,0,3,0],
["IT SERVICIOS INTEGRADOS",42,"Mensual",0,3965,"2026-01-03",6,2830,"Servicio Rastreo - Audio 1 mes","Reanudar",1,0,0,0],
["ABARROTES GECAPA",42,"Mensual",0,3708,"2025-06-01",5,2923,"Servicio Rastreo 1 mes(es).","Reanudar",1,1,0,0],
["cesar explicacion",7,"Mensual",11,2668,"2025-04-01",12,4524,"Servicio Custodia Virtual - Ha","Renovar",1,1,3,0],
["MONTEPIO LUZ SAVIÑON",5,"Mensual",0,2539,"2026-01-16",1,7113,"Servicio Rastreo - Satelital 1","Reanudar",1,0,3,0],
["Manuel Patiño Almader",15,"Mensual",1,1612,"2026-02-04",4,1577,"Servicio Rastreo 1 mes(es). Co","Renovar",1,0,0,0],
["RAMON CONDE CARBAJAL",42,"Mensual",0,1410,"2025-09-01",3,1218,"Servicio Rastreo - Audio 1 mes","Reanudar",1,1,0,0],
["FREYR RICARDO FLORES FLORES",35,"Trim.",0,617,"2026-01-04",1,1461,"Servicio Rastreo 3 mes(es). Co","Renovar",1,0,0,0],
["FERNANDO OSORNIO PEREZ",42,"Mensual",0,591,"2025-08-01",1,406,"Servicio Rastreo 1 mes(es).","Reanudar",1,1,0,0],
["DISTRIBUIDORA DE BEBIDAS GORILA VELMAR",39,"Mensual",0,564,"2026-01-03",1,729,"Servicio Remolques Rastreo 1 m","Reanudar",1,0,0,0],
["ALEXIS RELINGH REYES",42,"Mensual",0,456,"2025-10-10",1,406,"Servicio Rastreo - Audio 1 mes","Reanudar",1,1,0,0],
["PRACTICOCINA Y HOGAR",35,"Mensual",1,441,"2026-02-03",1,426,"Servicio Rastreo 1 mes(es). Co","Renovar",1,0,0,0],
["PARAPENTE GROUP INTERNATIONAL LOGISTICS ",39,"Mensual",4,403,"2026-01-15",1,563,"Servicio Rastreo 1 mes(es). Co","Renovar",1,0,0,0]];

const CSP = [["SISTEMAS DE GEOLOCALIZACION DIGITAL",39,"Mensual",4189524,"2026-03-12",0,0,0,0],
["ELECTRONICA Y MEDICINA",10,"Mensual",791741,"2026-03-09",0,0,0,0],
["LEASE AND FLEET SOLUTIONS",2,"Mensual",465363,"2026-03-20",0,0,0,0],
["CENTRUM",2,"Mensual",389841,"2026-03-09",0,0,0,0],
["DISTRIBUCION Y LOGISTICA DE ALIMENTOS",10,"Mensual",329131,"2026-03-19",0,0,0,0],
["SERVICIOS ADMINISTRATIVOS JUGOS DEL VALL",2,"Mensual",212114,"2026-03-27",0,0,0,0],
["NATGAS",2,"Mensual",174850,"2026-03-18",0,0,0,0],
["ENLACES TERRESTRES COMERCIALES",25,"Mensual",145765,"2026-03-05",0,0,0,0],
["Grupo AMPM",44,"Bimestral",116720,"2026-03-27",0,0,0,0],
["PROTEINA ANIMAL",25,"Mensual",105727,"2026-03-05",0,0,0,0],
["TRANSCARGA Y GANADO MORENO",11,"Mensual",47173,"2026-03-05",0,0,0,0],
["SONIGAS ( CUAUTLA ) FACT",41,"Mensual",36743,"2026-03-05",0,0,3,0],
["CIA HIDRO GAS DE CUERNAVACA",41,"Mensual",30319,"2026-03-05",0,0,0,0],
["TIENDAS SUPER PRECIO",2,"Mensual",22678,"2026-03-27",0,0,0,0],
["SMAR-T VALUE INNOVATION",39,"Mensual",19645,"2026-03-05",0,0,0,0],
["GAS COMERCIAL DE CHIHUAHUA",38,"Mensual",18732,"2026-03-20",0,0,0,0],
["SERVI-GAS DEL NORTE",38,"Mensual",17062,"2026-03-20",0,0,0,0],
["GAS COMERCIAL DE CUAUHTEMOC",38,"Mensual",13034,"2026-03-19",0,0,0,0],
["CENTRAL DE FLETES ATLANTE",38,"Mensual",12810,"2026-03-03",0,0,0,0],
["INTERNATIONAL LEASING SUPPORT",23,"Trim.",10323,"2025-11-25",0,0,3,0],
["JOSE SANCHEZ ARIAS (Lineas Sanchez en S3",21,"Mensual",8442,"2026-03-03",0,0,0,0],
["GAS COMERCIAL DE JUAREZ",38,"Mensual",8409,"2026-03-19",0,0,0,0],
["ILDEFONSO VEGA DUARTE",1,"Mensual",8375,"2026-03-03",0,0,3,0],
["GAS SUPREMO DE JUAREZ",38,"Mensual",8229,"2026-03-20",0,0,0,0],
["GAS COMERCIAL DE DELICIAS",38,"Mensual",6479,"2026-03-20",0,0,0,0],
["NATURAL HEALTH II",42,"Mensual",5854,"2026-02-10",0,0,3,0],
["BONN PASS SA DE CV",24,"Sem.",4897,"2026-03-19",0,0,0,0],
["GAS COMERCIAL DE CAMARGO",38,"Mensual",4799,"2026-03-20",0,0,0,0],
["PERFETTI VAN MELLE MEXICO",42,"Mensual",4647,"2026-02-23",0,0,3,0],
["GAS COMERCIAL DE JIMENEZ",38,"Bimestral",4416,"2026-03-20",0,0,0,0],
["TYR DESTINOS TERRESTRES",42,"Mensual",2756,"2026-03-12",0,0,0,0],
["RICARDO ALBERTO CAMACHO LOPEZ",1,"Sem.",2537,"2026-03-23",0,0,0,0],
["DISTRIBUIDORA FUVA DE PARRAL",38,"Bimestral",2259,"2026-03-03",0,0,0,0],
["OSCAR ALEJANDRO BALDERRAMA FRANCO",38,"Mensual",1711,"2026-03-01",0,0,0,0],
["TRANSPORTES RAMAG",2,"Mensual",1521,"2026-03-05",0,0,0,0],
["COMPLEJO INDUSTRIAL FUENTES",38,"Mensual",1408,"2026-03-03",0,0,0,0],
["ELVA LEONOR",24,"Sem.",1159,"2025-10-03",0,0,3,0],
["MIGUEL GONZALEZ GUERRA",35,"Trim.",851,"2026-01-03",0,0,3,0],
["TRANSPORTES KUGAR DEL PAPALOAPAN ( TUXTE",42,"Mensual",720,"2026-02-12",0,0,0,0]];

const EXC = [["Central Leasing", 14, 0, 40, 2275392, "2026-03-26"],
["SEGUROS INBURSA, S.A., GRUPO FINANCIERO ", 3, 0, 21, 646849, "2026-03-25"],
["KPTL MEXICO BANK, SOCIEDAD ANONIMA, INST", 14, 0, 2, 284916, "2026-03-24"],
["ARRENDADORA BANCREA", 32, 0, 2, 202595, "2025-11-29"],
["Finactiv", 32, 0, 13, 191093, "2026-03-23"],
["TGM DEL NORTE", 38, 0, 1, 106456, "2026-03-28"],
["PEPSICO INTERNACIONAL MEXICO", 18, 0, 1, 79944, "2026-02-01"],
["FARMACON", 27, 1, 7, 75187, "2025-09-30"],
["SONIGAS", 41, 1, 1, 64394, "2025-10-07"],
["VELA LEASING SERVICES", 32, 0, 1, 58688, "2026-03-27"],
["LEASING DPC", 14, 0, 2, 57663, "2026-03-29"],
["PRETMEX", 32, 0, 1, 49174, "2025-07-10"],
["TRANSPORTES AUTONOMOS DE OCCIDENTE SA DE", 24, 0, 1, 42456, "2025-04-03"],
["PANHEC", 32, 0, 1, 32372, "2025-08-25"],
["CREDILEASING MEXICANA", 32, 0, 6, 31449, "2026-03-28"],
["CREDICOR MEXICANO UNION DE CREDITO", 14, 0, 1, 29012, "2025-10-03"],
["FLEX N GATE MEXICO", 3, 1, 5, 23957, "2026-03-19"],
["BRAND MOTION MEDIA", 42, 0, 1, 15310, "2026-03-01"],
["Textiles Agricolas S.A. de C.V.", 34, 0, 1, 8966, "2026-01-15"],
["TRANSPORTES KUGAR DEL PAPALOAPAN", 42, 1, 1, 5872, "2025-07-28"],
["ARRENDADORA IL", 14, 0, 1, 5329, "2026-02-23"],
["DISTRIBUCIONES MPS", 15, 0, 1, 5078, "2025-11-28"],
["TECNO REPARADORES Y REFACCIONES", 15, 1, 1, 4503, "2026-02-03"],
["SANITARIOS PORTATILES POBLANOS NASA", 42, 1, 2, 1740, "2026-02-04"],
["TELERENTA", 14, 0, 1, 1619, "2026-03-28"],
["Galeam SF", 10, 2, 3, 0, ""],
["TITANES LOGISTICA", 33, 2, 1, 0, ""]];
const _E=`AAG Arrendadora SF|2|0|0\nANGEL AVILA CHILINO|15|0|0\nAUTOTANQUES TORRES|2|0|0\nAgencia Digital|28|0|0\nAktiva Capital|2|0|0\nAktiva Financiera SF|2|0|0\nArrendadora Coppel SF|2|0|0\nAvanser SF|2|0|0\nBanorte|20|0|0\nBig 500|2|0|0\nCasofin - SF|2|0|0\nCeDis Tecnocontrol Queretaro|40|0|0\nDIOCESIS DE HUAJUAPAN DE LEON|42|0|0\nEMMANUEL ABRAHAM SANDOVAL RAMIREZ|42|0|0\nENERFLEX SF|2|0|0\nFibrum SF|2|0|0\nFintegra SF|10|0|0\nGERARDO RAYA GONZALEZ|42|0|0\nGRUPO TRAXION|17|0|0\nGrupo Bafar SF|2|0|0\nGuadalupe Esmeralda Pinto Portillo|24|0|0\nHEB|2|0|0\nHERIBERTO MORALES GONZALEZ|8|0|0\nIMPORTACIONES Y LOGISTICA DE OCCIDENTE|11|0|0\nIrving Jair Velasco Alejo|15|0|0\nKONECT LOGISTICA INTEGRADA|8|0|0\nLUIS ADRIAN HERNANDEZ RAMIREZ|15|0|0\nLUIS ALAN ESPINOSA RUIZ|8|0|0\nMARIA CYNTHIA URIBE GARCIA|15|0|0\nMARIO IVAN LOPEZ VACA|8|0|0\nMARTIN FERNANDO EIRAS|2|0|0\nMISAEL ALATRISTE FLORES|42|0|0\nMar Systems|2|0|0\nMi granjita SF|2|0|0\nRodolfo Emiliano León López|28|0|0\nSALVADOR GARCIA MORALES|8|0|0\nSARA PAULINA RUBIO CASTRO|42|0|0\nSECRETARIA DE CULTURA Y TURISMO|28|0|0\nSECRETARIA DE LA CONTRALORÍA|28|0|0\nSECRETARIA DE LA DEFENSA NACIONAL|36|0|0\nTIMOTEO CARDENAS RODRIGUEZ|42|0|0\nTORTRACS|39|0|0\nTRANSPORTACION Y LOGISTICA EL CEDRO|38|0|0\nTiendas Bafar|2|0|0\nTulps Total SF|2|0|0\nUrba Ingeniería (no usar)|39|0|0\nUrba Ingeniería (no usar.)|39|0|0`;
const ESC_S=_E.split("\n").map(l=>{const p=l.split("|");return[p[0],+p[1],+p[2],+p[3]];});
const _EXR=`Adolfo Vallejo|32|CREDILEASING MEXICANA\nADRIANA COLIN GARCES (INBURSA)|3|SEGUROS INBURSA, S.A., GRUPO FINANCIERO \nALFREDO BELTRAN GARCIA (INBURSA)|3|SEGUROS INBURSA, S.A., GRUPO FINANCIERO \nALQUIELITE|14|Finactiv\nARRENDADORA PRETMEX|32|PRETMEX\nAUTOBUSES DE TURISMO PINO SA DE CV|32|Finactiv\nAVIVA LOGISTICS|33|TITANES LOGISTICA\nBANCO DE TEJIDOS DEL ESTADO DE MÉXICO- S|14|Central Leasing\nCARLOS CONCEPCION SUBIAS|32|CREDILEASING MEXICANA\nCAVAZOS CANO LUIS FELIPE (INBURSA)|3|SEGUROS INBURSA, S.A., GRUPO FINANCIERO \nCENTRO DE CONCILIACIÓN LABORAL DEL ESTAD|14|Central Leasing\nCENTRO DE CONTROL DE CONFIANZA DEL ESTAD|14|Central Leasing\nCERVEZAS FINAS MODELO SA DE CV (INBURSA)|3|SEGUROS INBURSA, S.A., GRUPO FINANCIERO \nCHRISTIAN ALENADRO DIAZ CARDIEL|32|CREDILEASING MEXICANA\nCOLEGIO DE EDUCACIÓN PROFESIONAL TÉCNICA|14|Central Leasing\nCOLUNGA RIVERA JUAN CARLOS|14|CREDICOR MEXICANO UNION DE CREDITO\nCOMERCIALIZADORA PEPSICO MEXICO|18|PEPSICO INTERNACIONAL MEXICO\nCOMISIÓN DEL AGUA DEL ESTADO DE MÉXICO|14|Central Leasing\nCOMITÉ DE PLANEACIÓN PARA EL DESARROLLO |14|Central Leasing\nCONSEJERÍA JURÍDICA|28|Central Leasing\nCONSEJO MEXIQUENSE DE CIENCIA Y TECNOLOG|14|Central Leasing\nCOORDINACIÓN ADMINISTRATIVA- COORDINACIÓ|14|Central Leasing\nCOORDINACIÓN ADMINISTRATIVA- OFICIALÍA M|14|Central Leasing\nCOORDINACIÓN ADMINISTRATIVA- SECRETARÍA |14|Central Leasing\nDANIELA ORTEGA DE LA FUENTE (INBURSA)|3|SEGUROS INBURSA, S.A., GRUPO FINANCIERO \nDIAMANTE AZUL (INBURSA)|3|SEGUROS INBURSA, S.A., GRUPO FINANCIERO \nDISTRIBUIDORA DE PIELES KANDO, SA DE CV|32|PANHEC\nDONACIANO FUENTES GONZALEZ|32|CREDILEASING MEXICANA\nDR RICARDO WASHIGTON CRUCES|32|Finactiv\nDrive Me (INBURSA)|3|SEGUROS INBURSA, S.A., GRUPO FINANCIERO \nECO-SAL DE MAR S.A. DE C.V.|32|ARRENDADORA BANCREA\nEMILIANO SANCHEZ CUENCA (INBURSA)|3|SEGUROS INBURSA, S.A., GRUPO FINANCIERO \nENRIQUE JAVIER OLVERA VILLASEÑOR|32|Finactiv\nESCOBAR CEBALLOS GABRIEL|14|Finactiv\nESTACION DE SERVICIO JOCO (INBURSA)|3|SEGUROS INBURSA, S.A., GRUPO FINANCIERO \nFLAVIO HUMBERTO GUTIERREZ ALVAREZ|32|Finactiv\nFLEX N GATE HERMOSILLO|3|FLEX N GATE MEXICO\nFLEX-N-GATE SALTILLO|3|FLEX N GATE MEXICO\nFLXPLS SAS DE CV|32|CREDILEASING MEXICANA\nGALVANOPLASTIA Y PINTURAS DE PUEBLA|3|FLEX N GATE MEXICO\nGGONZALEZ INMUEBLES DEL NORTE SA DE CV|32|ARRENDADORA BANCREA\nGLAFIRO RAUL SALAZAR GARZA (INBURSA)|3|SEGUROS INBURSA, S.A., GRUPO FINANCIERO \nGRUAS EGUIBAR|39|SANITARIOS PORTATILES POBLANOS NASA\nGRUPO AZUCARERO|14|Central Leasing\nGRUPO SIAYEC|14|ARRENDADORA IL\nHOPLON|2|Galeam SF\nINBURSA OPERADORES DE SERVICIO (INBURSA)|3|SEGUROS INBURSA, S.A., GRUPO FINANCIERO \nINST. DE INF. E INV. GEOGRÁFICA, ESTADÍS|14|Central Leasing\nINST. DE INV. Y FOMENTO DE LAS ARTESANIA|14|Central Leasing\nINST. DE SEGURIDAD SOCIAL DEL ESTADO DE |14|Central Leasing\nINSTITUTO DE SALUD DEL ESTADO DE MÉXICO|14|Central Leasing\nINSTITUTO ESTATAL DE ENERGÍA Y CAMBIO CL|14|Central Leasing\nINSTITUTO HACENDARIO DEL ESTADO DE MÉXIC|14|Central Leasing\nINSTITUTO MATERNO INFANTIL DEL ESTADO DE|14|Central Leasing\nINSTITUTO MATERNO INFANTIL DEL ESTADO DE|14|Central Leasing\nINSTITUTO MEXIQUENSE PARA LA DISCAPACIDA|14|Central Leasing\nITPS SA DE CV|32|Finactiv\nJESUS ENRIQUE SANDOVAL RODRIGUEZ (INBURS|3|SEGUROS INBURSA, S.A., GRUPO FINANCIERO \nJesus Roman Perez|32|Finactiv\nJuan Carlos Valdez Hernandez|32|VELA LEASING SERVICES`;
const EXP=_EXR.split("\n").map(l=>{const p=l.split("|");return[p[0],+p[1],p[2]];});

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
  const actionable = Object.entries(ACTIONS).filter(([k]) => !["OK_SUB_VIGENTE","FUTURA","ESCALAR","EXCLUIDOS"].includes(k));
  const totalActionable = actionable.reduce((s, [, v]) => s + v.cnt, 0);
  const totalMonthly = actionable.reduce((s, [, v]) => s + v.monthly, 0);
  const pieData = Object.entries(ACTIONS).filter(([k]) => k !== "EXCLUIDOS").map(([k, v]) => ({ name: v.label, value: v.cnt, color: v.color }));
  const barData = actionable.map(([k, v]) => ({ name: v.label, value: v.monthly, color: v.color })).sort((a, b) => b.value - a.value);
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <KPI label="Clientes Accionables" value={totalActionable} sub="requieren accion" color="#E74C3C" />
        <KPI label="Ingreso Mensual en Riesgo" value={fmtK(totalMonthly)} sub="de acciones pendientes" color="#E67E22" />
        <KPI label="OK Sub Vigente" value={ACTIONS.OK_SUB_VIGENTE.cnt} sub={fmtK(ACTIONS.OK_SUB_VIGENTE.monthly) + "/mes"} color="#27AE60" />
        <KPI label="Excluidos (Masters)" value={ACTIONS.EXCLUIDOS.cnt} sub="8 parent + 5 regionales" color="#BDC3C7" />
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
          {Object.entries(ACTIONS).map(([k,v])=>(
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
    _TA,_SP,_AC,_CC,_FC,
  ];
  const config = RC_STD.filter(r => r[10] === "CONFIG");
  const parcial = RC_STD.filter(r => r[10] === "PARCIAL");
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <KPI label="Config. (sin next_billing)" value={config.length} sub={fmtK(config.reduce((s, r) => s + (r[3] || 0), 0)) + "/mes"} color="#E74C3C" />
        <KPI label="Parcial (mixto)" value={parcial.length} sub={fmtK(parcial.reduce((s, r) => s + (r[3] || 0), 0)) + "/mes"} color="#E67E22" />
        <KPI label="Valor Total Subs" value={fmtK(RC_STD.reduce((s, r) => s + r[6], 0))} color={BLUE} />
      </div>
      <div style={{background:"#E8F8F5",border:"1px solid #A3E4D7",borderRadius:8,padding:12,marginBottom:12,fontSize:12}}>
        Subs frecuencia <strong>anual o menor</strong>. Multianuales en "Contratos Especiales".
      </div>
      <DataTable columns={cols} data={RC_STD} />
    </div>
  );
}

function TabEspeciales() {
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
    _TA,_SP,_AC,_CC,_FC,
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <KPI label="Contratos Especiales" value={RC_ESP.length} sub="suscripciones multianuales" color="#8E44AD" />
        <KPI label="Ingreso Mensual" value={fmtK(RC_ESP.reduce((s, r) => s + (r[3] || 0), 0))} color="#8E44AD" />
        <KPI label="Valor Total Subs" value={fmtK(RC_ESP.reduce((s, r) => s + r[6], 0))} color={BLUE} />
      </div>
      <div style={{background:"#F4ECF7",border:"1px solid #D2B4DE",borderRadius:8,padding:12,marginBottom:12,fontSize:12}}>
        <strong>Multianuales (&gt;1 anio):</strong> Leasing, arrendamiento. next_billing=NULL. Validar mecanismo de cobro.
      </div>
      <DataTable columns={cols} data={RC_ESP} />
    </div>
  );
}

function TabCrearSub() {
  const PAGE_SIZE = 25;
  const [page, setPage] = useState(0);
  const [crmFilter, setCrmFilter] = useState("Todos");
  const [subFilter, setSubFilter] = useState("Todos");
  const [csSearch, setCsSearch] = useState("");
  const crmOpts = ["Todos","BAJA DEF.","Cand.Cancel","C.parcial","P.Total","Con folios","Sin cancelacion"];
  const subOpts = ["Todos","Si","No"];
  const filtered = useMemo(() => {
    let d = CS;
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
  }, [crmFilter, subFilter, csSearch]);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const cols = [
    { label: "Cliente", fmt: v => v },_cEmp,_cEjC,_cOwC,
    { label: "Frec. Hist.", fmt: v => v },
    { label: "Gap Esp.", align: "right", fmt: v => v },
    { label: "Gap Actual", align: "right", fmt: v => v + "m" },
    { label: "Prom/Mes", align: "right", fmt: v => fmt(v) },
    { label: "Ult. Fact.", fmt: v => v },
    { label: "Meses Hist.", align: "right", fmt: v => v },
    _TA,_SP,_AC,_CC,_FC,
  ];
  const totalMonthlyFiltered = filtered.reduce((s, r) => s + r[5], 0);
  const [csvData,setCsvData]=useState(null);
  const dlCSV=()=>{const hd=["Cliente","Empresa","Ejec.Cobro","Owner CRM","Frec.Hist","Gap Esp.","Gap Actual","Prom/Mes","Ult.Fact","Meses Hist","Activos","Sub Prev","Accion CRM","# Cancel"];const esc=v=>{const s=String(v??"");return s.includes(",")||s.includes('"')||s.includes("\n")?'"'+s.replace(/"/g,'""')+'"':s;};const rows=filtered.map(r=>{const x=_gx(r[0]);const emp=x?(_EM[x[0]]||""):"";const ej=x?_pn(x[1]):"";const ow=x?_pn(x[2]):"";const act=_TD[r[0]]||"0";const sp=r[8]?"Si":"No";const cc=r[9]?"Cand.Cancel":"";const accion=r[10]===3?"BAJA DEF.":cc||(_CS[r[10]]||"");return[r[0],emp,ej,ow,r[2],r[3],r[4],r[5],r[6],r[7],act,sp,accion,r[11]].map(esc).join("\t");});setCsvData(hd.join("\t")+"\n"+rows.join("\n"));};
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14, alignItems: "flex-end" }}>
        <KPI label="Clientes sin Suscripcion" value={filtered.length} sub={filtered.length === CS.length ? "total en riesgo" : `de ${CS.length} (filtrado)`} color="#F39C12" />
        <KPI label="Ingreso Mensual en Riesgo" value={fmtK(totalMonthlyFiltered)} sub="sin proteccion de suscripcion" color="#F39C12" />
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
    _TA,_SP,_AC,_CC,_FC,
  ];
  const rean = RR.filter(r => r[9] === "REANUDAR");
  const reno = RR.filter(r => r[9] === "RENOVAR");
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <KPI label="Reanudar (Pausadas)" value={rean.length} sub={fmtK(rean.reduce((s, r) => s + (r[4] || 0), 0)) + "/mes"} color="#3498DB" />
        <KPI label="Renovar (Expiradas)" value={reno.length} sub={fmtK(reno.reduce((s, r) => s + (r[4] || 0), 0)) + "/mes"} color="#9B59B6" />
      </div>
      <DataTable columns={cols} data={RR} />
    </div>
  );
}

function TabPreventivos() {
  const cols = [
    { label: "Cliente", fmt: v => v },_cEmp,_cEjC,_cOwC,
    { label: "Frec. Hist.", fmt: v => v },
    { label: "Prom/Mes", align: "right", fmt: v => fmt(v) },
    { label: "Ult. Factura", fmt: v => v },
    _TA,_SP,_AC,_CC,_FC,
  ];
  return (
    <div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <KPI label="Clientes Preventivos" value={9} sub="en ciclo pero sin suscripcion" color="#F5B041" />
        <KPI label="Ingreso Mensual" value={fmtK(379582)} sub="para proteger" color="#F5B041" />
      </div>
      <div style={{ background: "#FEF9E7", border: "1px solid #F9E79F", borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 12 }}>
        <strong>Preventivo:</strong> Clientes dentro de su ciclo normal, pero sin suscripcion. Crear suscripcion para asegurar continuidad de cobro.
      </div>
      <DataTable columns={cols} data={CSP} />
    </div>
  );
}

function TabExcluidos() {
  const [tf,setTf]=useState("Todos");
  const opts=["Todos","Revisar Subs","Crear Sub","Escalar"];
  const filtered=useMemo(()=>{let d=EXC;if(tf==="Revisar Subs")d=d.filter(r=>r[2]===0);else if(tf==="Crear Sub")d=d.filter(r=>r[2]===1);else if(tf==="Escalar")d=d.filter(r=>r[2]===2);return d;},[tf]);
  const cols=[{label:"Cliente (Master)",fmt:v=>v},_cEmp,_cEjC,_cOwC,_TA,{label:"Tipo",fmt:v=><span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:"#2980B918",color:"#2980B9"}}>{v===0?"Parent":"Regional"}</span>},{label:"Tab",fmt:v=><span style={{padding:"2px 8px",borderRadius:4,fontSize:10,fontWeight:600,background:_EXC_TAB_C[v]+"18",color:_EXC_TAB_C[v]}}>{_EXC_TAB[v]}</span>},{label:"Hijos",align:"right",fmt:v=><b>{v}</b>},{label:"Prom/Mes",align:"right",fmt:v=>fmt(v)},{label:"Ult.Fact.",fmt:v=>v||"\u2014"}];
  return(<div>
    <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
      <KPI label="Masters" value={EXC.length} color="#7F8C8D"/>
      <KPI label="Prom/Mes" value={fmtK(EXC.reduce((s,r)=>s+r[4],0))} color="#2980B9"/>
    </div>
    <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
      {opts.map(o=><button key={o} onClick={()=>setTf(o)} style={{padding:"3px 10px",borderRadius:6,border:"1px solid "+(tf===o?BLUE:"#ddd"),background:tf===o?BLUE:"#fff",color:tf===o?"#fff":"#444",fontSize:11,cursor:"pointer"}}>{o}</button>)}
    </div>
    <DataTable columns={cols} data={filtered}/>
  </div>);
}

function TabEscalar() {
  const PG=25;const[page,setPage]=useState(0);const[escSearch,setEscSearch]=useState("");
  const filtered=useMemo(()=>{let d=ESC_S;if(escSearch){const s=escSearch.toLowerCase();d=d.filter(r=>r.some(c=>String(c).toLowerCase().includes(s)));}return d;},[escSearch]);
  const paged=filtered.slice(page*PG,(page+1)*PG);const pages=Math.ceil(filtered.length/PG);
  const cols=[{label:"Cliente",fmt:(v)=><span style={{fontWeight:600}}>{v}</span>},_cEmp,_cEjC,_cOwC,_TA,{label:"# Cancel.",fmt:(_,r)=>r[3]>0?r[3]:<span style={{color:"#ccc"}}>&mdash;</span>,align:"center"},{label:"Fecha Cancel.",fmt:(_,r)=>{const d=BAJA_DATES[r[0]];return d?<span style={{fontSize:10}}>{d}</span>:<span style={{fontSize:10,color:"#ccc"}}>&mdash;</span>;}}];
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
  const PG=25;const[page,setPage]=useState(0);const[epSearch,setEpSearch]=useState("");
  const filtered=useMemo(()=>{let d=EXP;if(epSearch){const s=epSearch.toLowerCase();d=d.filter(r=>r.some(c=>String(c).toLowerCase().includes(s)));}return d;},[epSearch]);
  const paged=filtered.slice(page*PG,(page+1)*PG);const pages=Math.ceil(filtered.length/PG);
  const cols=[{label:"Cliente",fmt:v=><span style={{fontWeight:600}}>{v}</span>},_cEmp,_cEjC,_cOwC,_TA,{label:"Parent Account",fmt:(_,r)=>r[2]}];
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

export default function AccionesClientes() {
  const [tab, setTab] = useState(0);
  return (
    <div style={{ fontFamily: "'Montserrat', 'Segoe UI', sans-serif", background: "#F4F6FA", minHeight: "100vh", padding: 20 }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:18}}>
          <div style={{width:40,height:40,borderRadius:10,background:`linear-gradient(135deg,${NAVY},${BLUE})`,display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{color:"#fff",fontSize:18,fontWeight:700}}>N</span></div>
          <div style={{flex:1}}>
            <div style={{fontSize:18,fontWeight:700,color:NAVY}}>Plan de Acciones - Clientes sin Facturacion</div>
            <div style={{fontSize:11,color:"#888"}}>27 masters excluidos | Filtro: ACTIVO + Cliente | 7 Abr 2026</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 16, flexWrap: "wrap" }}>
          {TABS.map((t, i) => (
            <button key={i} onClick={() => setTab(i)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: tab === i ? NAVY : "#fff", color: tab === i ? "#fff" : NAVY, fontWeight: tab === i ? 700 : 500, fontSize: 12, cursor: "pointer", boxShadow: tab === i ? "0 2px 6px rgba(0,0,0,.15)" : "0 1px 3px rgba(0,0,0,.06)" }}>{t}</button>
          ))}
        </div>
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
        <div style={{ textAlign: "center", fontSize: 10, color: "#bbb", marginTop: 20, padding: 10 }}>Numaris | Supabase (Zoho Books + Billing + CRM)</div>
      </div>
    </div>
  );
}
