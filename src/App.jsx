import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useRef, useCallback, memo } from 'react'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const T = {
  deepBlue:'#1a3a6b', skyBlue:'#1e88e5', lightBlue:'#e3f2fd',
  midBlue:'#1565c0', navy:'#0f2240',
  green:'#2e7d32', greenLight:'#e8f5e9',
  red:'#c62828', redLight:'#ffebee',
  orange:'#e65100', orangeLight:'#fff3e0',
  amber:'#f57f17', amberLight:'#fffde7',
  purple:'#6a1b9a', purpleLight:'#f3e5f5',
  teal:'#00695c', tealLight:'#e0f2f1',
  gray50:'#f8fafc', gray100:'#f1f5f9', gray200:'#e2e8f0',
  gray400:'#94a3b8', gray600:'#475569', gray800:'#1e293b',
  white:'#ffffff', sidebarBg:'#0f2240',
}

const ROLES = {
  admin:   { label:'ผู้ดูแลระบบ',         color:T.red,     canApprove:true,  canCreate:true,  canAdmin:true  },
  manager: { label:'ผู้จัดการ/ผู้อนุมัติ', color:T.orange,  canApprove:true,  canCreate:true,  canAdmin:false },
  staff:   { label:'เจ้าหน้าที่',          color:T.skyBlue, canApprove:false, canCreate:true,  canAdmin:false },
  viewer:  { label:'ผู้ดูข้อมูล',          color:T.gray400, canApprove:false, canCreate:false, canAdmin:false },
}

const MEMO_CATEGORIES = [
  { code:'MEMO-01', name:'จัดซื้อจัดจ้าง',         icon:'🛒', color:T.skyBlue  },
  { code:'MEMO-02', name:'เบิกจ่าย',               icon:'💳', color:T.green    },
  { code:'MEMO-03', name:'อนุมัติงบเบ็ดเตล็ด',    icon:'📊', color:T.orange   },
  { code:'MEMO-04', name:'เบิกค่ารับรอง',          icon:'🍽️', color:T.purple   },
  { code:'MEMO-05', name:'ใช้ทุนสาธารณประโยชน์',  icon:'🏛️', color:T.teal     },
  { code:'MEMO-06', name:'ใช้ทุนส่งเสริมกิจสหกรณ์',icon:'🤝', color:T.midBlue  },
  { code:'MEMO-07', name:'ใช้ทุนศึกษาอบรม',       icon:'📚', color:T.amber    },
  { code:'MEMO-08', name:'งานบุคคล',               icon:'👥', color:T.red      },
  { code:'MEMO-09', name:'อื่นๆ',                  icon:'📝', color:T.gray600  },
]

const OUTGOING_CATEGORIES = [
  { code:'OUT-01', name:'ม.อ.',                        icon:'🏫', color:T.deepBlue },
  { code:'OUT-02', name:'กองคลัง ม.อ.',               icon:'🏦', color:T.midBlue  },
  { code:'OUT-03', name:'สอ.ม.อ.',                    icon:'🤝', color:T.teal     },
  { code:'OUT-04', name:'หน่วยงานใน ม.อ.',            icon:'🏢', color:T.skyBlue  },
  { code:'OUT-05', name:'สหกรณ์จังหวัด',             icon:'🗺️', color:T.green    },
  { code:'OUT-06', name:'หน่วยงานที่เกี่ยวกับสหกรณ์',icon:'⚖️', color:T.orange   },
  { code:'OUT-07', name:'สหกรณ์อื่น',                icon:'🏪', color:T.purple   },
  { code:'OUT-08', name:'เอกชน/บุคคลภายนอก',        icon:'👤', color:T.gray600  },
]

const APPROVAL_LEVELS = [
  { max:50000,    roles:['ผจก.หน่วยธุรกิจ'],                                      label:'≤ 50,000 บาท'   },
  { max:100000,   roles:['ผจก.หน่วยธุรกิจ','ผจก.ฝ่าย บห.','ผจก.ใหญ่'],          label:'≤ 100,000 บาท'  },
  { max:500000,   roles:['ผจก.หน่วยธุรกิจ','ผจก.ฝ่าย บห.','ผจก.ใหญ่'],          label:'≤ 500,000 บาท'  },
  { max:Infinity, roles:['ผจก.หน่วยธุรกิจ','ผจก.ฝ่าย บห.','ผจก.ใหญ่','ประธานกรรมการ'], label:'> 500,000 บาท' },
]

const DEFAULT_REGULATIONS = [
  { id:'reg-001', title:'พระราชบัญญัติสหกรณ์ พ.ศ. 2542', category:'กฎหมายหลัก', summary:'กฎหมายหลักที่ใช้บังคับสหกรณ์ทุกประเภทในประเทศไทย กำหนดโครงสร้าง การดำเนินงาน และการกำกับดูแลสหกรณ์', relevant:['MEMO-01','MEMO-02','MEMO-03'], file_url:null, file_name:null },
  { id:'reg-002', title:'ข้อบังคับสหกรณ์บริการ มอ. พ.ศ. 2566', category:'ข้อบังคับ', summary:'ข้อบังคับที่ใช้บังคับภายในสหกรณ์บริการมหาวิทยาลัยสงขลานครินทร์ กำหนดสิทธิ หน้าที่ และระเบียบปฏิบัติ', relevant:['MEMO-01','MEMO-02','MEMO-03','MEMO-04'], file_url:null, file_name:null },
  { id:'reg-003', title:'ระเบียบว่าด้วยการจัดซื้อจัดจ้าง พ.ศ. 2566', category:'ระเบียบ', summary:'วงเงินไม่เกิน 5,000 บาท ไม่ต้องขอใบเสนอราคา / 5,001-100,000 บาท ต้องมีใบเสนอราคา 3 ราย / เกิน 100,000 บาท ต้องประกวดราคา', relevant:['MEMO-01'], file_url:null, file_name:null },
  { id:'reg-004', title:'ระเบียบว่าด้วยเงินทุนสาธารณประโยชน์', category:'ระเบียบ', summary:'ใช้ได้เฉพาะกิจกรรมสาธารณประโยชน์ที่ผ่านการอนุมัติจากคณะกรรมการ วงเงินแต่ละครั้งไม่เกิน 50,000 บาท', relevant:['MEMO-05'], file_url:null, file_name:null },
  { id:'reg-005', title:'ระเบียบว่าด้วยการเบิกจ่ายค่ารับรอง', category:'ระเบียบ', summary:'วงเงินค่ารับรองไม่เกิน 500 บาท/คน ต้องมีรายชื่อผู้เข้าร่วม ต้องผ่านการอนุมัติก่อนจัดงาน', relevant:['MEMO-04'], file_url:null, file_name:null },
  { id:'reg-006', title:'ระเบียบว่าด้วยทุนศึกษาอบรม', category:'ระเบียบ', summary:'พนักงานขอทุนได้ไม่เกิน 20,000 บาท/ปี ต้องผ่านการอนุมัติผู้จัดการ และรายงานผลภายใน 30 วันหลังอบรม', relevant:['MEMO-07'], file_url:null, file_name:null },
]

const ALLOWED_DOC=['.pdf','.jpg','.jpeg','.docx','.xlsx']
const ALLOWED_REG=['.pdf','.doc','.docx']
const FILE_ICONS={
  pdf:{icon:'📄',color:'#c62828',bg:'#ffebee',label:'PDF'},
  jpg:{icon:'🖼️',color:'#1565c0',bg:'#e3f2fd',label:'JPG'},
  jpeg:{icon:'🖼️',color:'#1565c0',bg:'#e3f2fd',label:'JPG'},
  doc:{icon:'📝',color:'#1e88e5',bg:'#e3f2fd',label:'DOC'},
  docx:{icon:'📝',color:'#1e88e5',bg:'#e3f2fd',label:'DOCX'},
  xlsx:{icon:'📊',color:'#2e7d32',bg:'#e8f5e9',label:'XLSX'},
}
const getExt=n=>(n||'').split('.').pop().toLowerCase()
const getFI=n=>FILE_ICONS[getExt(n)]||{icon:'📎',color:'#64748b',bg:'#f1f5f9',label:'FILE'}
const fmtSz=b=>b<1048576?`${(b/1024).toFixed(1)} KB`:`${(b/1048576).toFixed(1)} MB`
const fmtMoney=n=>Number(n||0).toLocaleString('th-TH')
const getChain=budget=>{
  const b=parseFloat(budget)||0
  return APPROVAL_LEVELS.find(l=>b<=l.max)||APPROVAL_LEVELS[APPROVAL_LEVELS.length-1]
}
const getRegs=code=>DEFAULT_REGULATIONS.filter(r=>r.relevant.includes(code))

const inpStyle={width:'100%',border:`1px solid ${T.gray200}`,borderRadius:7,padding:'8px 12px',fontSize:13,fontFamily:'Sarabun',boxSizing:'border-box',outline:'none',background:'#fff'}

const Btn=({children,onClick,color=T.skyBlue,outline=false,sm=false,disabled=false,full=false,style={}})=>(
  <button onClick={onClick} disabled={disabled} style={{background:disabled?T.gray200:outline?'transparent':color,color:disabled?T.gray400:outline?color:'#fff',border:`1.5px solid ${disabled?T.gray200:color}`,borderRadius:7,padding:sm?'5px 12px':'9px 18px',fontFamily:'Sarabun',fontWeight:700,fontSize:sm?12:13,cursor:disabled?'not-allowed':'pointer',width:full?'100%':'auto',...style}}>{children}</button>
)

const Badge=({status})=>{
  const m={done:{bg:'#e8f5e9',c:'#2e7d32',t:'✅ ดำเนินการแล้ว'},pending:{bg:'#fff8e1',c:'#f57f17',t:'⏳ รอดำเนินการ'},approved:{bg:'#e8f5e9',c:'#2e7d32',t:'✔ อนุมัติ'},rejected:{bg:'#ffebee',c:'#c62828',t:'✗ ไม่อนุมัติ'},revise:{bg:'#fff3e0',c:'#e65100',t:'🔄 แจ้งแก้ไข'},waiting:{bg:'#e3f2fd',c:'#1565c0',t:'🔵 รอคิว'},draft:{bg:'#f1f5f9',c:'#64748b',t:'📝 ร่าง'}}
  const s=m[status]||m.waiting
  return <span style={{background:s.bg,color:s.c,borderRadius:20,padding:'2px 10px',fontSize:11.5,fontWeight:700,whiteSpace:'nowrap'}}>{s.t}</span>
}

// ══════════════════════════════════════════
// FILE ZONE (เอกสาร)
// ══════════════════════════════════════════
const FileZone=memo(({files,onAdd,onRemove,savedFiles=[]})=>{
  const ref=useRef()
  const [drag,setDrag]=useState(false)
  const addFiles=useCallback(incoming=>{
    Array.from(incoming).filter(f=>ALLOWED_DOC.includes('.'+getExt(f.name))).forEach(f=>{
      onAdd({file:f,id:Date.now()+Math.random(),name:f.name,size:f.size,preview:f.type.startsWith('image/')?URL.createObjectURL(f):null})
    })
  },[onAdd])
  return(
    <div>
      <div onClick={()=>ref.current.click()} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}}
        style={{border:`2px dashed ${drag?T.skyBlue:T.gray200}`,borderRadius:10,padding:'16px',textAlign:'center',background:drag?T.lightBlue:T.gray50,cursor:'pointer',transition:'all 0.2s'}}>
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.docx,.xlsx" style={{display:'none'}} onChange={e=>addFiles(e.target.files)}/>
        <div style={{fontSize:24,marginBottom:4}}>📎</div>
        <div style={{fontWeight:700,color:T.skyBlue,fontSize:13}}>คลิกหรือลากไฟล์มาวางที่นี่</div>
        <div style={{fontSize:11,color:T.gray400,marginTop:2}}>PDF · JPG · DOCX · XLSX (ไม่เกิน 10MB/ไฟล์)</div>
      </div>
      {[...savedFiles,...files].length>0&&(
        <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:5}}>
          {savedFiles.map(f=>{
            const fi=getFI(f.file_name||'')
            const url=supabase.storage.from('documents').getPublicUrl(f.file_path).data.publicUrl
            return(
              <div key={f.id} style={{display:'flex',alignItems:'center',gap:8,background:fi.bg,border:`1px solid ${fi.color}33`,borderRadius:7,padding:'7px 10px'}}>
                <span style={{fontSize:18}}>{fi.icon}</span>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.file_name}</div>
                  <div style={{fontSize:10,color:T.gray400}}>{fi.label} · {fmtSz(f.file_size||0)}</div>
                </div>
                <a href={url} target="_blank" rel="noreferrer" style={{color:T.skyBlue,fontSize:12,fontWeight:700,textDecoration:'none',background:T.lightBlue,padding:'3px 8px',borderRadius:4}}>👁 ดู</a>
              </div>
            )
          })}
          {files.map(f=>{
            const fi=getFI(f.name)
            return(
              <div key={f.id} style={{display:'flex',alignItems:'center',gap:8,background:fi.bg,border:`1px solid ${fi.color}33`,borderRadius:7,padding:'7px 10px'}}>
                {f.preview?<img src={f.preview} alt="" style={{width:32,height:32,objectFit:'cover',borderRadius:4}}/>:<span style={{fontSize:18}}>{fi.icon}</span>}
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div>
                  <div style={{fontSize:10,color:T.gray400}}>{fi.label} · {fmtSz(f.size)}</div>
                </div>
                <button onClick={()=>onRemove(f.id)} style={{background:'none',border:'none',cursor:'pointer',color:T.red,fontSize:15}}>✕</button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
})

// ══════════════════════════════════════════
// AI ANALYSIS
// ══════════════════════════════════════════
function AIPanel({category,budget}){
  const [result,setResult]=useState(null)
  const [loading,setLoading]=useState(false)
  const analyze=async()=>{
    setLoading(true)
    await new Promise(r=>setTimeout(r,1200))
    const b=parseFloat(budget)||0
    const chain=getChain(b)
    const regs=getRegs(category?.code||'')
    const risks=[]
    if(b>100000)risks.push('วงเงินสูง ต้องผ่านการอนุมัติหลายระดับ')
    if(b>500000)risks.push('ต้องผ่านประธานกรรมการ — เตรียมเอกสารให้ครบ')
    if(category?.code==='MEMO-01'&&b>5000)risks.push('ต้องมีใบเสนอราคาอย่างน้อย 3 ราย')
    if(category?.code==='MEMO-04')risks.push('ตรวจสอบวงเงินค่ารับรองต่อคนไม่เกิน 500 บาท')
    if(category?.code==='MEMO-07')risks.push('ต้องรายงานผลภายใน 30 วันหลังอบรม')
    setResult({chain:chain.roles,label:chain.label,regs,risks,
      advice:b===0?'ไม่มีวงเงิน ดำเนินการได้ตามปกติ':b<=50000?'วงเงินต่ำ อนุมัติได้รวดเร็ว':b<=100000?'ควรเตรียมเอกสารประกอบให้ครบก่อนส่ง':'วงเงินสูง ตรวจสอบความถูกต้องอย่างละเอียด'})
    setLoading(false)
  }
  return(
    <div style={{background:'#fff',borderRadius:10,padding:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1px solid ${T.lightBlue}`}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
        <div style={{fontWeight:700,color:T.deepBlue,fontSize:13}}>🤖 AI วิเคราะห์เอกสาร</div>
        <Btn sm color={T.skyBlue} onClick={analyze} disabled={loading}>{loading?'⏳...':'วิเคราะห์'}</Btn>
      </div>
      {!result&&!loading&&<div style={{fontSize:12,color:T.gray400,textAlign:'center',padding:8}}>กดปุ่มวิเคราะห์เพื่อสรุปข้อมูลเบื้องต้น</div>}
      {result&&(
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <div style={{background:T.lightBlue,borderRadius:7,padding:9}}>
            <div style={{fontSize:11,fontWeight:700,color:T.deepBlue,marginBottom:5}}>⚡ เส้นทางอนุมัติ ({result.label})</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:3}}>
              {['เจ้าหน้าที่',...result.chain,'ดำเนินการ'].map((r,i,a)=>(
                <span key={i} style={{display:'flex',alignItems:'center',gap:3}}>
                  <span style={{background:T.deepBlue,color:'#fff',borderRadius:4,padding:'1px 6px',fontSize:10,fontWeight:700}}>{r}</span>
                  {i<a.length-1&&<span style={{color:T.gray400,fontSize:10}}>→</span>}
                </span>
              ))}
            </div>
          </div>
          {result.risks.length>0&&(
            <div style={{background:T.amberLight,borderRadius:7,padding:9,border:`1px solid ${T.amber}44`}}>
              <div style={{fontSize:11,fontWeight:700,color:T.amber,marginBottom:3}}>⚠️ ข้อควรระวัง</div>
              {result.risks.map((r,i)=><div key={i} style={{fontSize:11,color:'#7c4a00'}}>• {r}</div>)}
            </div>
          )}
          {result.regs.length>0&&(
            <div style={{background:T.greenLight,borderRadius:7,padding:9}}>
              <div style={{fontSize:11,fontWeight:700,color:T.green,marginBottom:3}}>📋 กฎระเบียบที่เกี่ยวข้อง</div>
              {result.regs.map((r,i)=>(
                <div key={i} style={{marginTop:4}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.green}}>{r.title}</div>
                  <div style={{fontSize:10,color:'#2e7d32'}}>{r.summary.slice(0,80)}...</div>
                  {r.file_url&&<a href={r.file_url} target="_blank" rel="noreferrer" style={{fontSize:10,color:T.skyBlue,fontWeight:700}}>📄 เปิดไฟล์ต้นฉบับ</a>}
                </div>
              ))}
            </div>
          )}
          <div style={{background:'#f0f4ff',borderRadius:7,padding:9}}>
            <div style={{fontSize:11,fontWeight:700,color:T.deepBlue,marginBottom:2}}>💡 คำแนะนำ</div>
            <div style={{fontSize:11,color:T.gray600}}>{result.advice}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════
function PageLogin({onLogin}){
  const [email,setEmail]=useState('')
  const [pass,setPass]=useState('')
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)
  const doLogin=async()=>{
    if(!email||!pass){setErr('กรุณากรอกอีเมลและรหัสผ่าน');return}
    setLoading(true);setErr('')
    const{data,error}=await supabase.auth.signInWithPassword({email,password:pass})
    if(error)setErr('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    else onLogin(data.user)
    setLoading(false)
  }
  return(
    <div style={{minHeight:'100vh',background:`linear-gradient(135deg,${T.navy},${T.deepBlue},${T.midBlue})`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Sarabun'}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{background:'rgba(255,255,255,0.97)',borderRadius:20,padding:'40px 44px',width:420,boxShadow:'0 20px 60px rgba(0,0,0,0.35)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:64,height:64,background:`linear-gradient(135deg,${T.skyBlue},${T.deepBlue})`,borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 16px',boxShadow:`0 4px 16px ${T.skyBlue}44`}}>🏛️</div>
          <div style={{fontWeight:800,fontSize:24,color:T.deepBlue}}>SERCOOP.PSU</div>
          <div style={{fontSize:13,color:T.gray600,marginTop:6}}>ระบบสารบรรณอิเล็กทรอนิกส์</div>
          <div style={{fontSize:11,color:T.gray400,marginTop:2}}>สหกรณ์บริการมหาวิทยาลัยสงขลานครินทร์ จำกัด</div>
        </div>
        {err&&<div style={{background:T.redLight,color:T.red,borderRadius:8,padding:'9px 14px',fontSize:13,marginBottom:16,textAlign:'center',fontWeight:600}}>{err}</div>}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:T.gray600,display:'block',marginBottom:5,fontWeight:600}}>อีเมล</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="email@sercoop.psu.ac.th" style={{...inpStyle,padding:'10px 14px',fontSize:14}} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
        </div>
        <div style={{marginBottom:24}}>
          <label style={{fontSize:13,color:T.gray600,display:'block',marginBottom:5,fontWeight:600}}>รหัสผ่าน</label>
          <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••" style={{...inpStyle,padding:'10px 14px',fontSize:14}} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
        </div>
        <button onClick={doLogin} disabled={loading} style={{width:'100%',background:loading?T.gray200:`linear-gradient(135deg,${T.skyBlue},${T.deepBlue})`,color:loading?T.gray400:'#fff',border:'none',borderRadius:10,padding:'12px',fontWeight:800,fontSize:15,fontFamily:'Sarabun',cursor:loading?'not-allowed':'pointer'}}>
          {loading?'⏳ กำลังเข้าสู่ระบบ...':'🔐 เข้าสู่ระบบ'}
        </button>
        <div style={{textAlign:'center',marginTop:14,fontSize:11,color:T.gray400}}>ใช้งานได้ดีบน Google Chrome</div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// SIDEBAR
// ══════════════════════════════════════════
function Sidebar({page,setPage,user,userRole,onLogout}){
  const role=ROLES[userRole?.role]||ROLES.staff
  const menus=[
    {key:'dashboard',icon:'🏠',label:'หน้าหลัก',show:true},
    {key:'doc',icon:'📋',label:'เกษียณหนังสือ',show:true},
    {key:'workflow',icon:'⚙️',label:'Workflow อนุมัติ',show:role.canApprove},
    {key:'regulations',icon:'⚖️',label:'ฐานข้อมูลอ้างอิง',show:true},
    {key:'reports',icon:'📊',label:'รายงานและสรุป',show:true},
    {key:'admin',icon:'🛡️',label:'ผู้ดูแลระบบ',show:role.canAdmin},
  ].filter(m=>m.show)
  return(
    <div style={{width:224,background:T.sidebarBg,display:'flex',flexDirection:'column',flexShrink:0,boxShadow:'2px 0 8px rgba(0,0,0,0.15)'}}>
      <div style={{padding:'14px 16px',background:'rgba(0,0,0,0.3)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:40,height:40,background:`linear-gradient(135deg,${T.skyBlue},${T.deepBlue})`,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>🏛️</div>
          <div>
            <div style={{color:'#fff',fontWeight:800,fontSize:12}}>SERCOOP.PSU</div>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:10}}>ระบบสารบรรณอิเล็กทรอนิกส์</div>
          </div>
        </div>
      </div>
      <div style={{padding:'12px 14px',background:'rgba(0,0,0,0.2)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:32,height:32,background:`linear-gradient(135deg,${role.color},${T.deepBlue})`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13,flexShrink:0}}>
            {(userRole?.full_name||user?.email||'?')[0].toUpperCase()}
          </div>
          <div style={{minWidth:0}}>
            <div style={{color:'#fff',fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{userRole?.full_name||user?.email?.split('@')[0]}</div>
            <div style={{background:role.color+'33',color:role.color,borderRadius:3,padding:'1px 6px',fontSize:10,fontWeight:700,display:'inline-block',marginTop:2}}>{role.label}</div>
          </div>
        </div>
        {userRole?.dept&&<div style={{color:'rgba(255,255,255,0.4)',fontSize:10,marginTop:4}}>📍 {userRole.dept}</div>}
      </div>
      <div style={{flex:1,padding:'8px',overflowY:'auto'}}>
        {menus.map(m=>(
          <div key={m.key} onClick={()=>setPage(m.key)} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:7,marginBottom:2,cursor:'pointer',fontSize:13,background:page===m.key?`${T.skyBlue}25`:'transparent',color:page===m.key?'#fff':'rgba(255,255,255,0.6)',fontWeight:page===m.key?700:400,borderLeft:page===m.key?`3px solid ${T.skyBlue}`:'3px solid transparent',transition:'all 0.15s'}}
            onMouseEnter={e=>{if(page!==m.key)e.currentTarget.style.background='rgba(255,255,255,0.06)'}}
            onMouseLeave={e=>{if(page!==m.key)e.currentTarget.style.background='transparent'}}
          ><span style={{fontSize:15,width:20,textAlign:'center'}}>{m.icon}</span>{m.label}</div>
        ))}
      </div>
      <div style={{padding:'10px 14px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div onClick={onLogout} style={{display:'flex',alignItems:'center',gap:8,color:'rgba(255,255,255,0.35)',fontSize:12,cursor:'pointer',padding:'6px',borderRadius:6}}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}
        ><span>🚪</span>ออกจากระบบ</div>
      </div>
    </div>
  )
}

function Topbar({title,subtitle}){
  const now=new Date().toLocaleDateString('th-TH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})
  return(
    <div style={{background:'#fff',borderBottom:`1px solid ${T.gray200}`,padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
      <div>
        <div style={{fontWeight:800,fontSize:17,color:T.deepBlue}}>{title}</div>
        {subtitle&&<div style={{fontSize:12,color:T.gray400}}>{subtitle}</div>}
      </div>
      <div style={{fontSize:12,color:T.gray400}}>{now}</div>
    </div>
  )
}

// ══════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════
function PageDashboard({docs,setPage}){
  const stats=[
    {label:'เอกสารทั้งหมด',value:docs.length,icon:'📄',color:T.skyBlue},
    {label:'รอดำเนินการ',value:docs.filter(d=>!d.status||d.status==='pending').length,icon:'⏳',color:'#f57f17'},
    {label:'ดำเนินการแล้ว',value:docs.filter(d=>d.status==='approved').length,icon:'✅',color:T.green},
    {label:'งบรออนุมัติ',value:'฿'+fmtMoney(docs.filter(d=>d.budget>0&&(!d.status||d.status==='pending')).reduce((a,b)=>a+(Number(b.budget)||0),0)),icon:'💰',color:T.deepBlue},
  ]
  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        {stats.map(s=>(
          <div key={s.label} style={{background:'#fff',borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${s.color}`}}>
            <div style={{fontSize:22}}>{s.icon}</div>
            <div style={{fontSize:26,fontWeight:800,color:s.color,marginTop:4}}>{s.value}</div>
            <div style={{fontSize:12,color:T.gray400,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:16}}>
        {[
          {label:'บันทึกข้อความ',key:'memo',icon:'📝',color:T.skyBlue,cats:MEMO_CATEGORIES},
          {label:'หนังสือส่ง',key:'outgoing',icon:'📤',color:T.green,cats:OUTGOING_CATEGORIES},
          {label:'หนังสือรับ',key:'incoming',icon:'📥',color:T.orange,cats:[]},
        ].map(t=>(
          <div key={t.key} style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <span style={{fontSize:18}}>{t.icon}</span>
              <div style={{fontWeight:700,color:T.deepBlue,fontSize:14}}>{t.label}</div>
              <span style={{marginLeft:'auto',background:t.color+'22',color:t.color,borderRadius:20,padding:'2px 8px',fontSize:12,fontWeight:700}}>{docs.filter(d=>d.parent_type===t.key).length}</span>
            </div>
            {t.cats.slice(0,5).map(c=>{
              const cnt=docs.filter(d=>d.category_code===c.code).length
              return(
                <div key={c.code} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:12,borderBottom:`1px solid ${T.gray100}`}}>
                  <span style={{color:T.gray600}}>{c.icon} {c.name}</span>
                  <span style={{fontWeight:700,color:cnt>0?t.color:T.gray400}}>{cnt}</span>
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div style={{background:'#fff',borderRadius:12,padding:'16px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <div style={{fontWeight:700,color:T.deepBlue,fontSize:14}}>📋 เอกสารล่าสุด</div>
          <Btn sm outline color={T.skyBlue} onClick={()=>setPage('doc')}>ดูทั้งหมด →</Btn>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr style={{background:T.gray50}}>{['เลขที่','หมวด','เรื่อง','วันที่','งบประมาณ','สถานะ'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',color:T.gray600,fontWeight:600,borderBottom:`1px solid ${T.gray200}`,fontSize:12}}>{h}</th>)}</tr></thead>
          <tbody>
            {docs.slice(0,6).map((d,i)=>(
              <tr key={d.id} style={{borderBottom:`1px solid ${T.gray100}`,background:i%2===0?'#fff':T.gray50}}>
                <td style={{padding:'8px 12px',fontWeight:700,color:T.skyBlue,fontSize:12}}>{d.id}</td>
                <td style={{padding:'8px 12px'}}><span style={{background:T.lightBlue,color:T.deepBlue,borderRadius:4,padding:'2px 7px',fontSize:11,fontWeight:700}}>{d.category_name||d.type||'—'}</span></td>
                <td style={{padding:'8px 12px',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.subject}</td>
                <td style={{padding:'8px 12px',fontSize:12,color:T.gray400}}>{d.doc_date||'—'}</td>
                <td style={{padding:'8px 12px',fontSize:12,fontWeight:600,color:d.budget>0?T.green:T.gray400}}>{d.budget>0?`฿${fmtMoney(d.budget)}`:'—'}</td>
                <td style={{padding:'8px 12px'}}><Badge status={d.status||'pending'}/></td>
              </tr>
            ))}
          </tbody>
        </table>
        {docs.length===0&&<div style={{padding:32,textAlign:'center',color:T.gray400}}>ยังไม่มีเอกสาร — ไปที่ "เกษียณหนังสือ" เพื่อเริ่มต้น</div>}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// DOCUMENT FORM
// ══════════════════════════════════════════
function PageDocDetail({doc,onBack,onSaved,user,userRole}){
  const isNew=!doc
  const allCats=[...MEMO_CATEGORIES,...OUTGOING_CATEGORIES]
  const [step,setStep]=useState(isNew?0:1)
  const [parentType,setParentType]=useState(doc?.parent_type||'memo')
  const [category,setCategory]=useState(()=>doc?.category_code?allCats.find(c=>c.code===doc.category_code)||null:null)
  const refs={subject:useRef(doc?.subject||''),id:useRef(doc?.id||''),from:useRef(doc?.from_person||''),to:useRef(doc?.to_person||''),dept:useRef(doc?.dept||''),date:useRef(doc?.doc_date||''),budget:useRef(doc?.budget||''),content:useRef(doc?.content||''),note:useRef(doc?.note||'')}
  const [urgent,setUrgent]=useState(doc?.urgent||'ปกติ')
  const [secret,setSecret]=useState(doc?.secret||'ปกติ')
  const [files,setFiles]=useState([])
  const [savedFiles,setSavedFiles]=useState([])
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState('')
  const [budgetVal,setBudgetVal]=useState(parseFloat(doc?.budget)||0)

  useEffect(()=>{
    if(doc?.id)supabase.from('document_files').select('*').eq('document_id',doc.id).then(({data})=>{if(data)setSavedFiles(data)})
  },[doc])

  const onAddFile=useCallback(f=>setFiles(p=>[...p,f]),[])
  const onRemoveFile=useCallback(id=>setFiles(p=>p.filter(f=>f.id!==id)),[])

  const handleSave=async(status='pending')=>{
    if(!refs.subject.current.trim()){setMsg('❌ กรุณากรอกเรื่อง');return}
    setSaving(true);setMsg('')
    try{
      const prefix=parentType==='memo'?'บข':parentType==='outgoing'?'หส':'รบ'
      const docId=refs.id.current||`${prefix}.${new Date().getFullYear()+543}/${String(Date.now()).slice(-4)}`
      const storagePath=`${parentType}/${category?.code||'general'}/${docId}`
      const payload={id:docId,subject:refs.subject.current,type:category?.name||parentType,parent_type:parentType,category_code:category?.code||null,category_name:category?.name||null,dept:refs.dept.current,doc_date:refs.date.current,urgent,secret,from_person:refs.from.current,to_person:refs.to.current,budget:parseFloat(refs.budget.current)||0,content:refs.content.current,note:refs.note.current,status,storage_path:storagePath,created_by:user?.id}
      const{error:e1}=isNew?await supabase.from('documents').insert(payload):await supabase.from('documents').update(payload).eq('id',docId)
      if(e1)throw e1
      for(const f of files){
        const path=`${storagePath}/${Date.now()}_${f.name}`
        const{error:e2}=await supabase.storage.from('documents').upload(path,f.file)
        if(!e2)await supabase.from('document_files').insert({document_id:docId,file_name:f.name,file_path:path,file_size:f.size,file_type:getExt(f.name)})
      }
      if(isNew&&status==='pending'){
        const chain=getChain(refs.budget.current)
        await supabase.from('workflow_steps').insert([
          {document_id:docId,step_order:1,role_name:'เจ้าหน้าที่',action_label:'จัดทำและส่งเอกสาร',status:'done'},
          ...chain.roles.map((r,i)=>({document_id:docId,step_order:i+2,role_name:r,action_label:'พิจารณา/อนุมัติ',status:i===0?'pending':'waiting'})),
          {document_id:docId,step_order:chain.roles.length+2,role_name:'เจ้าหน้าที่',action_label:'ดำเนินการและบันทึกในระบบ',status:'waiting'},
        ])
      }
      setMsg(status==='draft'?'✅ บันทึกร่างสำเร็จ!':'✅ ส่ง Workflow สำเร็จ!')
      setTimeout(()=>onSaved(),1200)
    }catch(e){setMsg('❌ เกิดข้อผิดพลาด: '+e.message)}
    setSaving(false)
  }

  const cats=parentType==='memo'?MEMO_CATEGORIES:OUTGOING_CATEGORIES
  const chain=getChain(budgetVal)
  const regs=getRegs(category?.code||'')

  if(step===0)return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <Btn onClick={onBack} outline color={T.gray400}>← กลับ</Btn>
        <div style={{fontWeight:800,fontSize:16,color:T.deepBlue}}>สร้างเอกสารใหม่ — เลือกประเภท</div>
      </div>
      <div style={{background:'#fff',borderRadius:12,padding:24,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',maxWidth:760}}>
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {[{k:'memo',l:'📝 บันทึกข้อความ'},{k:'outgoing',l:'📤 หนังสือส่ง'},{k:'incoming',l:'📥 หนังสือรับ'}].map(t=>(
            <button key={t.k} onClick={()=>{setParentType(t.k);setCategory(null)}} style={{flex:1,padding:'12px',border:`2px solid ${parentType===t.k?T.skyBlue:T.gray200}`,borderRadius:9,background:parentType===t.k?T.lightBlue:'#fff',color:parentType===t.k?T.deepBlue:T.gray600,fontFamily:'Sarabun',fontWeight:parentType===t.k?700:400,fontSize:13,cursor:'pointer'}}>{t.l}</button>
          ))}
        </div>
        {parentType!=='incoming'?(
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
            {cats.map(c=>(
              <div key={c.code} onClick={()=>setCategory(c)} style={{padding:'14px',border:`2px solid ${category?.code===c.code?c.color:T.gray200}`,borderRadius:10,cursor:'pointer',background:category?.code===c.code?c.color+'11':'#fff',transition:'all 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor=c.color}
                onMouseLeave={e=>e.currentTarget.style.borderColor=category?.code===c.code?c.color:T.gray200}
              >
                <div style={{fontSize:22,marginBottom:5}}>{c.icon}</div>
                <div style={{fontSize:12,fontWeight:700,color:category?.code===c.code?c.color:T.gray800}}>{c.name}</div>
                <div style={{fontSize:10,color:c.color,fontWeight:600,marginTop:2}}>{c.code}</div>
              </div>
            ))}
          </div>
        ):(
          <div style={{textAlign:'center',padding:24,color:T.gray400,background:T.gray50,borderRadius:8}}>📥 หนังสือรับ — กรอกข้อมูลทั่วไป</div>
        )}
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:20,paddingTop:16,borderTop:`1px solid ${T.gray200}`}}>
          <Btn onClick={()=>setStep(1)} color={T.deepBlue} disabled={parentType!=='incoming'&&!category}>ถัดไป: กรอกข้อมูล →</Btn>
        </div>
      </div>
    </div>
  )

  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
        {isNew?<Btn onClick={()=>setStep(0)} outline color={T.gray400}>← เปลี่ยนประเภท</Btn>:<Btn onClick={onBack} outline color={T.gray400}>← กลับ</Btn>}
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {category&&<span style={{fontSize:20}}>{category.icon}</span>}
            <div style={{fontWeight:800,fontSize:16,color:T.deepBlue}}>{isNew?`สร้าง: ${category?.name||'หนังสือรับ'}`:doc.subject}</div>
          </div>
          <div style={{fontSize:12,color:T.gray400}}>{category?.code||''} · {isNew?'กรอกข้อมูลและแนบไฟล์':doc.id}</div>
        </div>
      </div>
      {msg&&<div style={{background:msg.includes('✅')?T.greenLight:T.redLight,color:msg.includes('✅')?T.green:T.red,borderRadius:8,padding:'10px 16px',marginBottom:16,fontWeight:600}}>{msg}</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16,alignItems:'start'}}>
        <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:16,paddingBottom:10,borderBottom:`2px solid ${T.lightBlue}`}}>📝 ข้อมูลเอกสาร</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px 16px'}}>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>เลขที่เอกสาร</label><input defaultValue={refs.id.current} onChange={e=>refs.id.current=e.target.value} placeholder="ระบบออกให้อัตโนมัติ" style={inpStyle}/></div>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>วันที่เอกสาร</label><input type="date" defaultValue={refs.date.current} onChange={e=>refs.date.current=e.target.value} style={inpStyle}/></div>
            <div style={{gridColumn:'span 2'}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>เรื่อง <span style={{color:T.red}}>*</span></label><input defaultValue={refs.subject.current} onChange={e=>refs.subject.current=e.target.value} placeholder="ระบุเรื่องของเอกสาร" style={inpStyle}/></div>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>จาก (ผู้ส่ง)</label><input defaultValue={refs.from.current} onChange={e=>refs.from.current=e.target.value} placeholder="ชื่อ-นามสกุล / หน่วยงาน" style={inpStyle}/></div>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>ถึง (ผู้รับ)</label><input defaultValue={refs.to.current} onChange={e=>refs.to.current=e.target.value} placeholder="ตำแหน่ง / หน่วยงาน" style={inpStyle}/></div>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>หน่วยงานที่ขอ</label><input defaultValue={refs.dept.current} onChange={e=>refs.dept.current=e.target.value} placeholder="ฝ่าย / แผนก" style={inpStyle}/></div>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>ชั้นความเร็ว</label><select value={urgent} onChange={e=>setUrgent(e.target.value)} style={inpStyle}>{['ปกติ','ด่วน','ด่วนมาก','ด่วนที่สุด'].map(o=><option key={o}>{o}</option>)}</select></div>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>ชั้นความลับ</label><select value={secret} onChange={e=>setSecret(e.target.value)} style={inpStyle}>{['ปกติ','ลับ','ลับมาก','ลับที่สุด'].map(o=><option key={o}>{o}</option>)}</select></div>
            <div style={{gridColumn:'span 2'}}>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>งบประมาณ (บาท)</label>
              <input type="number" defaultValue={refs.budget.current} onChange={e=>{refs.budget.current=e.target.value;setBudgetVal(parseFloat(e.target.value)||0)}} placeholder="0 = ไม่มีงบประมาณ" style={inpStyle}/>
              {budgetVal>0&&<div style={{marginTop:6,background:T.lightBlue,borderRadius:6,padding:'6px 12px',fontSize:12,color:T.deepBlue,fontWeight:600}}>⚡ เส้นทางอนุมัติ ({chain.label}): เจ้าหน้าที่ → {chain.roles.join(' → ')} → ดำเนินการ</div>}
            </div>
            <div style={{gridColumn:'span 2'}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>เนื้อหา / สรุปเรื่อง</label><textarea defaultValue={refs.content.current} onChange={e=>refs.content.current=e.target.value} rows={4} style={{...inpStyle,resize:'vertical'}}/></div>
            <div style={{gridColumn:'span 2'}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>หมายเหตุ</label><textarea defaultValue={refs.note.current} onChange={e=>refs.note.current=e.target.value} rows={2} style={{...inpStyle,resize:'vertical'}}/></div>
          </div>
          <div style={{marginTop:18,paddingTop:14,borderTop:`1px solid ${T.gray200}`}}>
            <div style={{fontWeight:700,color:T.deepBlue,fontSize:13,marginBottom:6}}>📎 แนบไฟล์เอกสาร</div>
            <div style={{fontSize:11,color:T.gray400,marginBottom:8}}>💡 ไม่จำเป็นต้องออกเอกสารจากระบบ — แนบไฟล์ที่มีอยู่ได้เลย (PDF · JPG · DOCX · XLSX)</div>
            <FileZone files={files} onAdd={onAddFile} onRemove={onRemoveFile} savedFiles={savedFiles}/>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:18,paddingTop:14,borderTop:`1px solid ${T.gray200}`}}>
            <Btn onClick={onBack} outline color={T.gray400}>ยกเลิก</Btn>
            <Btn onClick={()=>handleSave('draft')} disabled={saving} outline color={T.skyBlue}>💾 บันทึกร่าง</Btn>
            <Btn onClick={()=>handleSave('pending')} disabled={saving} color={T.deepBlue}>{saving?'⏳ กำลังบันทึก...':'📤 ส่ง Workflow + LINE'}</Btn>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <AIPanel category={category} budget={budgetVal}/>
          {regs.length>0&&(
            <div style={{background:'#fff',borderRadius:10,padding:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <div style={{fontWeight:700,color:T.deepBlue,fontSize:13,marginBottom:10}}>⚖️ กฎระเบียบที่เกี่ยวข้อง</div>
              {regs.map(r=>(
                <div key={r.id} style={{marginBottom:8,padding:'8px 10px',background:T.greenLight,borderRadius:7}}>
                  <div style={{fontSize:12,fontWeight:700,color:T.green}}>{r.title}</div>
                  <div style={{fontSize:11,color:'#2e7d32',marginTop:2}}>{r.summary.slice(0,70)}...</div>
                  {r.file_url&&<a href={r.file_url} target="_blank" rel="noreferrer" style={{fontSize:11,color:T.skyBlue,fontWeight:700,textDecoration:'none',display:'inline-block',marginTop:4}}>📄 เปิดไฟล์ →</a>}
                </div>
              ))}
            </div>
          )}
          <div style={{background:T.gray50,border:`1px solid ${T.gray200}`,borderRadius:10,padding:12}}>
            <div style={{fontWeight:700,color:T.deepBlue,fontSize:12,marginBottom:6}}>📁 การจัดเก็บ</div>
            <div style={{fontSize:11,color:T.gray600,lineHeight:1.8}}>
              <div>ประเภท: <strong>{parentType==='memo'?'บันทึกข้อความ':parentType==='outgoing'?'หนังสือส่ง':'หนังสือรับ'}</strong></div>
              <div>หมวด: <strong>{category?.name||'ทั่วไป'}</strong></div>
              <code style={{background:T.gray200,padding:'2px 6px',borderRadius:3,fontSize:10,display:'block',marginTop:4}}>{parentType}/{category?.code||'general'}/</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// DOCUMENT LIST
// ══════════════════════════════════════════
function PageDoc({docs,setDocs,onSelectDoc,user,userRole}){
  const [search,setSearch]=useState('')
  const [filterParent,setFilterParent]=useState('all')
  const [filterCat,setFilterCat]=useState('all')
  const [showNew,setShowNew]=useState(false)
  const [loading,setLoading]=useState(false)
  const role=ROLES[userRole?.role]||ROLES.staff

  const loadDocs=useCallback(async()=>{
    setLoading(true)
    const{data}=await supabase.from('documents').select('*').order('created_at',{ascending:false})
    if(data)setDocs(data)
    setLoading(false)
  },[setDocs])

  useEffect(()=>{loadDocs()},[])
  if(showNew)return <PageDocDetail onBack={()=>setShowNew(false)} onSaved={()=>{setShowNew(false);loadDocs()}} user={user} userRole={userRole}/>

  const cats=filterParent==='memo'?MEMO_CATEGORIES:filterParent==='outgoing'?OUTGOING_CATEGORIES:[]
  const filtered=docs.filter(d=>(filterParent==='all'||d.parent_type===filterParent)&&(filterCat==='all'||d.category_code===filterCat)&&(d.subject?.includes(search)||d.id?.includes(search)||d.dept?.includes(search)||d.category_name?.includes(search)))

  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',gap:10,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',flex:1,maxWidth:360,border:`1px solid ${T.gray200}`,borderRadius:7,overflow:'hidden'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเลขที่ / เรื่อง / หมวด..." style={{flex:1,border:'none',padding:'8px 14px',fontSize:13,fontFamily:'Sarabun',outline:'none'}}/>
          <div style={{padding:'0 12px',display:'flex',alignItems:'center',background:T.skyBlue,color:'#fff'}}>🔍</div>
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {[{k:'all',l:'ทั้งหมด'},{k:'memo',l:'📝 บันทึก'},{k:'outgoing',l:'📤 หนังสือส่ง'},{k:'incoming',l:'📥 หนังสือรับ'}].map(t=>(
            <button key={t.k} onClick={()=>{setFilterParent(t.k);setFilterCat('all')}} style={{padding:'6px 12px',border:`1px solid ${filterParent===t.k?T.skyBlue:T.gray200}`,borderRadius:6,background:filterParent===t.k?T.skyBlue:'#fff',color:filterParent===t.k?'#fff':T.gray600,fontFamily:'Sarabun',fontSize:12,cursor:'pointer',fontWeight:filterParent===t.k?700:400}}>{t.l}</button>
          ))}
        </div>
        <Btn onClick={loadDocs} outline color={T.skyBlue} sm>🔄</Btn>
        {role.canCreate&&<Btn onClick={()=>setShowNew(true)} color={T.deepBlue}>＋ สร้างเอกสาร</Btn>}
      </div>
      {cats.length>0&&(
        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:12}}>
          <button onClick={()=>setFilterCat('all')} style={{padding:'4px 10px',border:`1px solid ${filterCat==='all'?T.deepBlue:T.gray200}`,borderRadius:20,background:filterCat==='all'?T.deepBlue:'#fff',color:filterCat==='all'?'#fff':T.gray600,fontFamily:'Sarabun',fontSize:11,cursor:'pointer',fontWeight:filterCat==='all'?700:400}}>ทั้งหมด</button>
          {cats.map(c=><button key={c.code} onClick={()=>setFilterCat(c.code)} style={{padding:'4px 10px',border:`1px solid ${filterCat===c.code?c.color:T.gray200}`,borderRadius:20,background:filterCat===c.code?c.color+'22':'#fff',color:filterCat===c.code?c.color:T.gray600,fontFamily:'Sarabun',fontSize:11,cursor:'pointer',fontWeight:filterCat===c.code?700:400}}>{c.icon} {c.name}</button>)}
        </div>
      )}
      {loading?<div style={{textAlign:'center',padding:40,color:T.gray400}}>⏳ กำลังโหลด...</div>:(
        <div style={{background:'#fff',borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:T.deepBlue}}>{['เลขที่','ประเภท','หมวด','เรื่อง','วันที่','งบประมาณ','ไฟล์','สถานะ',''].map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',color:'#fff',fontWeight:600,fontSize:12}}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((d,i)=>(
                <tr key={d.id} style={{borderBottom:`1px solid ${T.gray100}`,background:i%2===0?'#fff':T.gray50,cursor:'pointer'}} onClick={()=>onSelectDoc(d)} onMouseEnter={e=>e.currentTarget.style.background=T.lightBlue} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':T.gray50}>
                  <td style={{padding:'9px 12px',fontWeight:700,color:T.skyBlue,fontSize:12,whiteSpace:'nowrap'}}>{d.id}</td>
                  <td style={{padding:'9px 12px'}}><span style={{background:T.lightBlue,color:T.deepBlue,borderRadius:4,padding:'2px 7px',fontSize:11,fontWeight:700}}>{d.parent_type==='memo'?'📝':d.parent_type==='outgoing'?'📤':'📥'}</span></td>
                  <td style={{padding:'9px 12px',fontSize:12,color:T.gray600}}>{d.category_name||'—'}</td>
                  <td style={{padding:'9px 12px',fontSize:13,maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.subject}</td>
                  <td style={{padding:'9px 12px',fontSize:12,color:T.gray400,whiteSpace:'nowrap'}}>{d.doc_date||'—'}</td>
                  <td style={{padding:'9px 12px',fontSize:12,fontWeight:600,color:d.budget>0?T.green:T.gray400}}>{d.budget>0?`฿${fmtMoney(d.budget)}`:'—'}</td>
                  <td style={{padding:'9px 12px',fontSize:12,color:T.skyBlue}}>📎</td>
                  <td style={{padding:'9px 12px'}}><Badge status={d.status||'pending'}/></td>
                  <td style={{padding:'9px 12px'}}><Btn sm color={T.skyBlue} onClick={e=>{e.stopPropagation();onSelectDoc(d)}}>ดู</Btn></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0&&<div style={{padding:40,textAlign:'center',color:T.gray400}}>ไม่พบเอกสาร</div>}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// REGULATIONS — รองรับแนบไฟล์
// ══════════════════════════════════════════
function PageRegulations({userRole}){
  const role=ROLES[userRole?.role]||ROLES.staff
  const [regs,setRegs]=useState(DEFAULT_REGULATIONS)
  const [search,setSearch]=useState('')
  const [filterCat,setFilterCat]=useState('ทั้งหมด')
  const [showAdd,setShowAdd]=useState(false)
  const [showDetail,setShowDetail]=useState(null)
  const [uploading,setUploading]=useState(false)
  const [msg,setMsg]=useState('')

  // Form state for add/edit
  const [form,setForm]=useState({title:'',category:'ระเบียบ',summary:'',relevant:[]})
  const [regFile,setRegFile]=useState(null)
  const fileRef=useRef()

  const cats=['ทั้งหมด','กฎหมายหลัก','ข้อบังคับ','ระเบียบ']
  const filtered=regs.filter(r=>(filterCat==='ทั้งหมด'||r.category===filterCat)&&(r.title.includes(search)||r.summary.includes(search)))

  const handleUploadReg=async()=>{
    if(!form.title){setMsg('❌ กรุณากรอกชื่อ');return}
    setUploading(true);setMsg('')
    try{
      let file_url=null,file_name=null
      if(regFile){
        const path=`regulations/${Date.now()}_${regFile.name}`
        const{error}=await supabase.storage.from('documents').upload(path,regFile)
        if(!error){
          file_url=supabase.storage.from('documents').getPublicUrl(path).data.publicUrl
          file_name=regFile.name
        }
      }
      const newReg={id:`reg-${Date.now()}`,title:form.title,category:form.category,summary:form.summary,relevant:form.relevant,file_url,file_name}
      setRegs(p=>[...p,newReg])
      setForm({title:'',category:'ระเบียบ',summary:'',relevant:[]})
      setRegFile(null)
      setShowAdd(false)
      setMsg('✅ เพิ่มกฎระเบียบสำเร็จ!')
    }catch(e){setMsg('❌ '+e.message)}
    setUploading(false)
  }

  const allCatCodes=[...MEMO_CATEGORIES,...OUTGOING_CATEGORIES]

  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      {msg&&<div style={{background:msg.includes('✅')?T.greenLight:T.redLight,color:msg.includes('✅')?T.green:T.red,borderRadius:8,padding:'10px 16px',marginBottom:14,fontWeight:600}}>{msg}</div>}

      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหากฎหมาย / ระเบียบ..." style={{...inpStyle,maxWidth:360}}/>
        <div style={{display:'flex',gap:4}}>
          {cats.map(c=><button key={c} onClick={()=>setFilterCat(c)} style={{padding:'6px 12px',border:`1px solid ${filterCat===c?T.green:T.gray200}`,borderRadius:6,background:filterCat===c?T.green:'#fff',color:filterCat===c?'#fff':T.gray600,fontFamily:'Sarabun',fontSize:12,cursor:'pointer',fontWeight:filterCat===c?700:400}}>{c}</button>)}
        </div>
        {role.canAdmin&&<Btn color={T.deepBlue} onClick={()=>setShowAdd(true)}>＋ เพิ่มกฎระเบียบ</Btn>}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
        {filtered.map(r=>(
          <div key={r.id} style={{background:'#fff',borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1px solid ${T.gray200}`,cursor:'pointer'}}
            onClick={()=>setShowDetail(r)}
            onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.1)'}
            onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.06)'}
          >
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:8,gap:8}}>
              <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,flex:1,lineHeight:1.4}}>{r.title}</div>
              <span style={{background:T.green,color:'#fff',borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700,flexShrink:0}}>{r.category}</span>
            </div>
            <div style={{fontSize:13,color:T.gray600,lineHeight:1.6,marginBottom:10}}>{r.summary}</div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:6}}>
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {r.relevant.map(code=>{
                  const cat=allCatCodes.find(c=>c.code===code)
                  return cat?<span key={code} style={{background:T.lightBlue,color:T.deepBlue,borderRadius:3,padding:'1px 6px',fontSize:10,fontWeight:700}}>{cat.icon}{cat.name}</span>:null
                })}
              </div>
              <div style={{display:'flex',gap:6,alignItems:'center'}}>
                {r.file_url?(
                  <a href={r.file_url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()}
                    style={{display:'flex',alignItems:'center',gap:4,background:T.redLight,color:T.red,borderRadius:6,padding:'4px 10px',fontSize:12,fontWeight:700,textDecoration:'none'}}>
                    📄 PDF
                  </a>
                ):(
                  <span style={{fontSize:11,color:T.gray400}}>ไม่มีไฟล์แนบ</span>
                )}
                <span style={{fontSize:11,color:T.skyBlue,fontWeight:700}}>คลิกดูรายละเอียด →</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {showDetail&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
          <div style={{background:'#fff',borderRadius:16,width:580,maxHeight:'85vh',overflowY:'auto',boxShadow:'0 8px 40px rgba(0,0,0,0.25)'}}>
            <div style={{background:`linear-gradient(135deg,${T.deepBlue},${T.midBlue})`,color:'#fff',padding:'16px 20px',borderRadius:'16px 16px 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontWeight:700,fontSize:16}}>⚖️ รายละเอียดกฎระเบียบ</span>
              <button onClick={()=>setShowDetail(null)} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{padding:24}}>
              <div style={{marginBottom:8}}><span style={{background:T.green,color:'#fff',borderRadius:4,padding:'2px 8px',fontSize:12,fontWeight:700}}>{showDetail.category}</span></div>
              <div style={{fontWeight:800,color:T.deepBlue,fontSize:18,marginBottom:12,lineHeight:1.4}}>{showDetail.title}</div>
              <div style={{fontSize:14,color:T.gray600,lineHeight:1.8,marginBottom:16,padding:14,background:T.gray50,borderRadius:8}}>{showDetail.summary}</div>
              <div style={{marginBottom:16}}>
                <div style={{fontWeight:700,color:T.deepBlue,fontSize:13,marginBottom:8}}>📂 ใช้กับหมวดเอกสาร</div>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {showDetail.relevant.map(code=>{
                    const cat=allCatCodes.find(c=>c.code===code)
                    return cat?<span key={code} style={{background:T.lightBlue,color:T.deepBlue,borderRadius:5,padding:'4px 10px',fontSize:12,fontWeight:700}}>{cat.icon} {cat.name}</span>:null
                  })}
                </div>
              </div>
              {/* File section */}
              <div style={{paddingTop:16,borderTop:`1px solid ${T.gray200}`}}>
                <div style={{fontWeight:700,color:T.deepBlue,fontSize:13,marginBottom:10}}>📎 ไฟล์เอกสาร</div>
                {showDetail.file_url?(
                  <div style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',background:T.redLight,borderRadius:9,border:`1px solid ${T.red}33`}}>
                    <span style={{fontSize:28}}>📄</span>
                    <div style={{flex:1}}>
                      <div style={{fontSize:13,fontWeight:700,color:T.red}}>{showDetail.file_name||'ไฟล์เอกสาร'}</div>
                      <div style={{fontSize:11,color:T.gray400}}>คลิกเพื่อเปิดหรือดาวน์โหลด</div>
                    </div>
                    <a href={showDetail.file_url} target="_blank" rel="noreferrer"
                      style={{background:T.red,color:'#fff',borderRadius:7,padding:'8px 16px',fontWeight:700,fontSize:13,textDecoration:'none'}}>
                      📖 เปิดอ่าน
                    </a>
                  </div>
                ):(
                  <div>
                    <div style={{fontSize:12,color:T.gray400,marginBottom:8}}>ยังไม่มีไฟล์แนบ</div>
                    {role.canAdmin&&(
                      <div>
                        <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{display:'none'}} onChange={e=>{
                          const f=e.target.files[0]
                          if(f){
                            setUploading(true)
                            const path=`regulations/${Date.now()}_${f.name}`
                            supabase.storage.from('documents').upload(path,f).then(({error})=>{
                              if(!error){
                                const url=supabase.storage.from('documents').getPublicUrl(path).data.publicUrl
                                setRegs(prev=>prev.map(r=>r.id===showDetail.id?{...r,file_url:url,file_name:f.name}:r))
                                setShowDetail(prev=>({...prev,file_url:url,file_name:f.name}))
                                setMsg('✅ อัปโหลดไฟล์สำเร็จ!')
                              }
                              setUploading(false)
                            })
                          }
                        }}/>
                        <Btn color={T.skyBlue} onClick={()=>fileRef.current.click()} disabled={uploading}>
                          {uploading?'⏳ กำลังอัปโหลด...':'📤 อัปโหลดไฟล์ PDF/DOC'}
                        </Btn>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Regulation Modal */}
      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
          <div style={{background:'#fff',borderRadius:16,width:560,maxHeight:'85vh',overflowY:'auto',boxShadow:'0 8px 40px rgba(0,0,0,0.25)'}}>
            <div style={{background:`linear-gradient(135deg,${T.deepBlue},${T.midBlue})`,color:'#fff',padding:'16px 20px',borderRadius:'16px 16px 0 0',display:'flex',justifyContent:'space-between'}}>
              <span style={{fontWeight:700,fontSize:16}}>＋ เพิ่มกฎระเบียบใหม่</span>
              <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{padding:24}}>
              {[['ชื่อกฎหมาย/ระเบียบ','title','text'],['สรุปสาระสำคัญ','summary','textarea']].map(([l,k,t])=>(
                <div key={k} style={{marginBottom:14}}>
                  <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>{l} *</label>
                  {t==='textarea'
                    ?<textarea value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} rows={3} style={{...inpStyle,resize:'vertical'}}/>
                    :<input value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inpStyle}/>
                  }
                </div>
              ))}
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>หมวดหมู่</label>
                <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} style={inpStyle}>
                  {['กฎหมายหลัก','ข้อบังคับ','ระเบียบ'].map(c=><option key={c}>{c}</option>)}
                </select>
              </div>
              <div style={{marginBottom:14}}>
                <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:6,fontWeight:600}}>ใช้กับหมวดเอกสาร (เลือกได้หลายหมวด)</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                  {[...MEMO_CATEGORIES,...OUTGOING_CATEGORIES].map(c=>{
                    const selected=form.relevant.includes(c.code)
                    return(
                      <button key={c.code} onClick={()=>setForm(p=>({...p,relevant:selected?p.relevant.filter(r=>r!==c.code):[...p.relevant,c.code]}))}
                        style={{padding:'4px 10px',border:`1px solid ${selected?c.color:T.gray200}`,borderRadius:20,background:selected?c.color+'22':'#fff',color:selected?c.color:T.gray600,fontFamily:'Sarabun',fontSize:11,cursor:'pointer',fontWeight:selected?700:400}}>
                        {c.icon} {c.name}
                      </button>
                    )
                  })}
                </div>
              </div>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:6,fontWeight:600}}>📎 แนบไฟล์ PDF / DOC (ถ้ามี)</label>
                <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${regFile?T.green:T.gray200}`,borderRadius:8,padding:'14px',textAlign:'center',cursor:'pointer',background:regFile?T.greenLight:T.gray50}}>
                  <input ref={fileRef} type="file" accept=".pdf,.doc,.docx" style={{display:'none'}} onChange={e=>setRegFile(e.target.files[0])}/>
                  {regFile?(
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      <span style={{fontSize:20}}>📄</span>
                      <div>
                        <div style={{fontSize:13,fontWeight:700,color:T.green}}>{regFile.name}</div>
                        <div style={{fontSize:11,color:T.gray400}}>{fmtSz(regFile.size)}</div>
                      </div>
                      <button onClick={e=>{e.stopPropagation();setRegFile(null)}} style={{background:'none',border:'none',color:T.red,cursor:'pointer',fontSize:16}}>✕</button>
                    </div>
                  ):(
                    <div>
                      <div style={{fontSize:20,marginBottom:4}}>📄</div>
                      <div style={{fontSize:13,color:T.gray400}}>คลิกเพื่อเลือกไฟล์ PDF หรือ DOC</div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                <Btn onClick={()=>setShowAdd(false)} outline color={T.gray400}>ยกเลิก</Btn>
                <Btn onClick={handleUploadReg} disabled={uploading} color={T.deepBlue}>{uploading?'⏳ กำลังบันทึก...':'💾 บันทึก'}</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════
function PageReports({docs}){
  const totalBudget=docs.reduce((a,b)=>a+(Number(b.budget)||0),0)
  const byCategory={}
  docs.forEach(d=>{const k=d.category_name||'ไม่ระบุ';byCategory[k]=(byCategory[k]||0)+(Number(d.budget)||0)})
  const byStatus={pending:0,approved:0,rejected:0,draft:0}
  docs.forEach(d=>{byStatus[d.status||'pending']=(byStatus[d.status||'pending']||0)+1})
  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:16}}>
        <div style={{background:'#fff',borderRadius:12,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:14}}>💰 สรุปงบประมาณตามหมวด</div>
          {Object.entries(byCategory).sort((a,b)=>b[1]-a[1]).map(([k,v])=>(
            <div key={k} style={{marginBottom:10}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontSize:13}}><span>{k}</span><span style={{fontWeight:700,color:T.green}}>฿{fmtMoney(v)}</span></div>
              <div style={{height:6,background:T.gray100,borderRadius:3}}><div style={{height:6,background:`linear-gradient(90deg,${T.skyBlue},${T.deepBlue})`,borderRadius:3,width:`${totalBudget>0?(v/totalBudget*100):0}%`}}/></div>
            </div>
          ))}
          <div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${T.gray200}`,display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:15}}>
            <span>รวมทั้งหมด</span><span style={{color:T.deepBlue}}>฿{fmtMoney(totalBudget)}</span>
          </div>
        </div>
        <div style={{background:'#fff',borderRadius:12,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:14}}>📊 สรุปสถานะเอกสาร</div>
          {[{k:'pending',label:'รอดำเนินการ',color:'#f57f17'},{k:'approved',label:'อนุมัติแล้ว',color:T.green},{k:'rejected',label:'ไม่อนุมัติ',color:T.red},{k:'draft',label:'ร่าง',color:T.gray400}].map(s=>(
            <div key={s.k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:`1px solid ${T.gray100}`,fontSize:13}}>
              <Badge status={s.k}/><span style={{fontWeight:800,fontSize:18,color:s.color}}>{byStatus[s.k]||0}</span>
            </div>
          ))}
          <div style={{marginTop:12,padding:'10px 14px',background:T.lightBlue,borderRadius:8,fontWeight:700,fontSize:14,color:T.deepBlue,display:'flex',justifyContent:'space-between'}}>
            <span>รวม</span><span>{docs.length} ฉบับ</span>
          </div>
        </div>
      </div>
      <div style={{background:'#fff',borderRadius:12,padding:'18px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
        <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:14}}>📋 สรุปตามประเภทเอกสาร</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12}}>
          {[{l:'บันทึกข้อความ',k:'memo',icon:'📝',c:T.skyBlue},{l:'หนังสือส่ง',k:'outgoing',icon:'📤',c:T.green},{l:'หนังสือรับ',k:'incoming',icon:'📥',c:T.orange}].map(t=>{
            const td=docs.filter(d=>d.parent_type===t.k)
            const tb=td.reduce((a,b)=>a+(Number(b.budget)||0),0)
            return(
              <div key={t.k} style={{border:`1px solid ${t.c}33`,borderRadius:9,padding:14,background:t.c+'08'}}>
                <div style={{fontSize:24,marginBottom:6}}>{t.icon}</div>
                <div style={{fontWeight:700,color:t.c,fontSize:14}}>{t.l}</div>
                <div style={{fontSize:22,fontWeight:800,color:t.c,marginTop:4}}>{td.length}</div>
                <div style={{fontSize:12,color:T.gray400}}>ฉบับ</div>
                {tb>0&&<div style={{fontSize:12,fontWeight:700,color:t.c,marginTop:4}}>฿{fmtMoney(tb)}</div>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// ADMIN
// ══════════════════════════════════════════
function PageAdmin(){
  const [tab,setTab]=useState('users')
  const [users,setUsers]=useState([])
  const [extraCats,setExtraCats]=useState([])
  const [newCat,setNewCat]=useState({parent_type:'memo',name:'',icon:'📄'})
  const [msg,setMsg]=useState('')
  useEffect(()=>{supabase.from('user_roles').select('*').then(({data})=>{if(data)setUsers(data)})},[])
  const tabs=[{k:'users',l:'👥 ผู้ใช้'},{k:'categories',l:'📂 หมวดเอกสาร'},{k:'system',l:'⚙️ ระบบ'}]
  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
        <div style={{borderBottom:`1px solid ${T.gray200}`,display:'flex',padding:'0 16px',background:T.gray50}}>
          {tabs.map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{padding:'12px 18px',border:'none',borderBottom:`2px solid ${tab===t.k?T.skyBlue:'transparent'}`,background:'transparent',color:tab===t.k?T.skyBlue:T.gray600,fontFamily:'Sarabun',fontWeight:tab===t.k?700:400,fontSize:13,cursor:'pointer'}}>{t.l}</button>)}
        </div>
        <div style={{padding:20}}>
          {tab==='users'&&(
            <div>
              <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:14}}>👥 รายชื่อผู้ใช้งาน ({users.length} คน)</div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{background:T.deepBlue}}>{['ชื่อ-สกุล','สิทธิ์','ฝ่าย/แผนก','สถานะ'].map(h=><th key={h} style={{padding:'9px 12px',textAlign:'left',color:'#fff',fontWeight:600,fontSize:12}}>{h}</th>)}</tr></thead>
                <tbody>
                  {users.map((u,i)=>{
                    const r=ROLES[u.role]||ROLES.staff
                    return(
                      <tr key={u.id} style={{borderBottom:`1px solid ${T.gray100}`,background:i%2===0?'#fff':T.gray50}}>
                        <td style={{padding:'9px 12px',fontWeight:600}}>{u.full_name||'—'}</td>
                        <td style={{padding:'9px 12px'}}><span style={{background:r.color+'22',color:r.color,borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700}}>{r.label}</span></td>
                        <td style={{padding:'9px 12px',fontSize:12,color:T.gray400}}>{u.dept||'—'}</td>
                        <td style={{padding:'9px 12px'}}><span style={{background:T.greenLight,color:T.green,borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700}}>✔ ใช้งาน</span></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <div style={{marginTop:12,padding:12,background:T.lightBlue,borderRadius:8,fontSize:12,color:T.deepBlue}}>
                💡 เพิ่มผู้ใช้ที่ Supabase → Authentication → Users แล้วรัน SQL: <code>insert into user_roles (user_id, role, full_name, dept) values ('...', 'staff', 'ชื่อ', 'ฝ่าย');</code>
              </div>
            </div>
          )}
          {tab==='categories'&&(
            <div>
              <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:14}}>📂 หมวดหมู่เอกสารทั้งหมด</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:16}}>
                {[...MEMO_CATEGORIES,...OUTGOING_CATEGORIES,...extraCats].map(c=>(
                  <div key={c.code} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',border:`1px solid ${T.gray200}`,borderRadius:7}}>
                    <span style={{fontSize:18}}>{c.icon}</span>
                    <div style={{flex:1}}><div style={{fontSize:12,fontWeight:700}}>{c.name}</div><div style={{fontSize:10,color:T.gray400}}>{c.code}</div></div>
                    <span style={{background:c.color+'22'||T.lightBlue,color:c.color||T.deepBlue,borderRadius:3,padding:'1px 6px',fontSize:10,fontWeight:700}}>{c.code?.startsWith('MEMO')?'บันทึก':'หนังสือส่ง'}</span>
                  </div>
                ))}
              </div>
              <div style={{padding:14,border:`1px dashed ${T.skyBlue}`,borderRadius:8,background:T.lightBlue}}>
                <div style={{fontWeight:700,color:T.deepBlue,fontSize:13,marginBottom:10}}>＋ เพิ่มหมวดย่อยใหม่</div>
                {msg&&<div style={{fontSize:12,color:T.green,fontWeight:600,marginBottom:8}}>{msg}</div>}
                <div style={{display:'grid',gridTemplateColumns:'auto 1fr auto auto',gap:8,alignItems:'center'}}>
                  <select value={newCat.parent_type} onChange={e=>setNewCat(p=>({...p,parent_type:e.target.value}))} style={{...inpStyle,width:'auto'}}>
                    <option value="memo">บันทึกข้อความ</option><option value="outgoing">หนังสือส่ง</option>
                  </select>
                  <input value={newCat.name} onChange={e=>setNewCat(p=>({...p,name:e.target.value}))} placeholder="ชื่อหมวดย่อย" style={inpStyle}/>
                  <input value={newCat.icon} onChange={e=>setNewCat(p=>({...p,icon:e.target.value}))} placeholder="🆕" style={{...inpStyle,width:56,textAlign:'center'}}/>
                  <Btn color={T.deepBlue} onClick={()=>{
                    if(!newCat.name)return
                    const prefix=newCat.parent_type==='memo'?'MEMO':'OUT'
                    const existingCats=[...MEMO_CATEGORIES,...OUTGOING_CATEGORIES,...extraCats].filter(c=>c.code.startsWith(prefix))
                    const code=`${prefix}-${String(existingCats.length+1).padStart(2,'0')}`
                    setExtraCats(p=>[...p,{code,name:newCat.name,icon:newCat.icon||'📄',color:T.gray600}])
                    setMsg(`✅ เพิ่มหมวด "${newCat.name}" สำเร็จ!`)
                    setNewCat({parent_type:'memo',name:'',icon:'📄'})
                  }}>เพิ่ม</Btn>
                </div>
              </div>
            </div>
          )}
          {tab==='system'&&(
            <div>
              <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:14}}>⚙️ ตั้งค่าระบบ</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[['LINE Notify Token','password','Token สำหรับส่งแจ้งเตือน LINE'],['LINE Group ID หลัก','text','Group ID ห้อง LINE สำนักงาน'],['LINE Group ID ผู้บริหาร','text','Group ID ห้อง LINE ผู้บริหาร'],['ชื่อองค์กร','text','ชื่อที่แสดงในเอกสาร']].map(([l,t,d])=>(
                  <div key={l} style={{border:`1px solid ${T.gray200}`,borderRadius:8,padding:14}}>
                    <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:2,fontWeight:600}}>{l}</label>
                    <div style={{fontSize:11,color:T.gray400,marginBottom:6}}>{d}</div>
                    <input type={t} placeholder="กรอกค่า..." style={inpStyle}/>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:14}}>
                <Btn color={T.deepBlue}>💾 บันทึกการตั้งค่า</Btn>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════
// ROOT APP
// ══════════════════════════════════════════
export default function App(){
  const [user,setUser]=useState(null)
  const [userRole,setUserRole]=useState(null)
  const [appLoading,setAppLoading]=useState(true)
  const [page,setPage]=useState('dashboard')
  const [docs,setDocs]=useState([])
  const [selectedDoc,setSelected]=useState(null)

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session?.user){
        setUser(session.user)
        const{data}=await supabase.from('user_roles').select('*').eq('user_id',session.user.id).single()
        setUserRole(data)
      }
      setAppLoading(false)
    })
    const{data:{subscription}}=supabase.auth.onAuthStateChange(async(_,session)=>{
      if(session?.user){setUser(session.user);const{data}=await supabase.from('user_roles').select('*').eq('user_id',session.user.id).single();setUserRole(data)}
      else{setUser(null);setUserRole(null)}
    })
    return()=>subscription.unsubscribe()
  },[])

  const handleLogout=async()=>{await supabase.auth.signOut();setUser(null);setUserRole(null)}
  const handleSelectDoc=doc=>{setSelected(doc);setPage('docdetail')}
  const handleBack=()=>{setSelected(null);setPage('doc')}

  if(appLoading)return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:T.sidebarBg,fontFamily:'Sarabun'}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{textAlign:'center',color:'#fff'}}>
        <div style={{fontSize:48,marginBottom:12}}>🏛️</div>
        <div style={{fontSize:16,fontWeight:700}}>SERCOOP.PSU</div>
        <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:4}}>กำลังโหลดระบบ...</div>
      </div>
    </div>
  )

  if(!user)return <PageLogin onLogin={u=>setUser(u)}/>

  const titles={dashboard:'หน้าหลัก · ภาพรวมระบบ',doc:'โปรแกรมเกษียณหนังสือ / เอกสาร',docdetail:selectedDoc?`รายละเอียด: ${selectedDoc.id}`:'สร้างเอกสารใหม่',workflow:'Workflow การอนุมัติ',regulations:'ฐานข้อมูลอ้างอิง · กฎหมาย / ระเบียบ',reports:'รายงานและสรุปข้อมูล',admin:'ผู้ดูแลระบบ (Admin Panel)'}
  const subs={doc:'บันทึกข้อความ 9 หมวด · หนังสือส่ง 8 หมวด · แนบไฟล์ PDF/JPG/DOCX/XLSX',regulations:'คลิกที่รายการเพื่อดูรายละเอียดและไฟล์ต้นฉบับ',admin:'จัดการผู้ใช้ · สิทธิ์ · หมวดเอกสาร · การตั้งค่า'}

  return(
    <div style={{display:'flex',height:'100vh',fontFamily:'Sarabun',background:T.gray100,overflow:'hidden'}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700;800&display=swap" rel="stylesheet"/>
      <Sidebar page={page} setPage={p=>{setSelected(null);setPage(p)}} user={user} userRole={userRole} onLogout={handleLogout}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <Topbar title={titles[page]||'SERCOOP.PSU'} subtitle={subs[page]||'สหกรณ์บริการมหาวิทยาลัยสงขลานครินทร์ จำกัด'}/>
        {page==='dashboard'&&<PageDashboard docs={docs} setPage={setPage}/>}
        {page==='doc'&&<PageDoc docs={docs} setDocs={setDocs} onSelectDoc={handleSelectDoc} user={user} userRole={userRole}/>}
        {page==='docdetail'&&<PageDocDetail doc={selectedDoc} onBack={handleBack} onSaved={handleBack} user={user} userRole={userRole}/>}
        {page==='regulations'&&<PageRegulations userRole={userRole}/>}
        {page==='reports'&&<PageReports docs={docs}/>}
        {page==='admin'&&<PageAdmin/>}
        {page==='workflow'&&(
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,color:T.gray400}}>
            <div style={{fontSize:48}}>⚙️</div>
            <div style={{fontSize:16,fontWeight:600,color:T.deepBlue}}>Workflow การอนุมัติ</div>
            <div style={{fontSize:13}}>เลือกเอกสารจากหน้า "เกษียณหนังสือ" เพื่อดำเนินการ Workflow</div>
            <Btn color={T.deepBlue} onClick={()=>setPage('doc')}>ไปที่รายการเอกสาร →</Btn>
          </div>
        )}
      </div>
    </div>
  )
}
