import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useRef, useCallback, memo } from 'react'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

const T = {
  deepBlue:'#1a3a6b',skyBlue:'#1e88e5',lightBlue:'#e3f2fd',
  green:'#2e7d32',greenLight:'#e8f5e9',red:'#c62828',redLight:'#ffebee',
  gray50:'#f8fafc',gray100:'#f1f5f9',gray200:'#e2e8f0',
  gray400:'#94a3b8',gray600:'#475569',white:'#ffffff',sidebarBg:'#0f2240',
}

const ALLOWED=['.pdf','.jpg','.jpeg','.docx','.xlsx']
const FILE_ICONS={
  pdf:{icon:'📄',color:'#c62828',bg:'#ffebee',label:'PDF'},
  jpg:{icon:'🖼️',color:'#1565c0',bg:'#e3f2fd',label:'JPG'},
  jpeg:{icon:'🖼️',color:'#1565c0',bg:'#e3f2fd',label:'JPG'},
  docx:{icon:'📝',color:'#1e88e5',bg:'#e3f2fd',label:'DOCX'},
  xlsx:{icon:'📊',color:'#2e7d32',bg:'#e8f5e9',label:'XLSX'},
}
const getExt=n=>n.split('.').pop().toLowerCase()
const getFI=n=>FILE_ICONS[getExt(n)]||{icon:'📎',color:'#64748b',bg:'#f1f5f9',label:'FILE'}
const fmtSz=b=>b<1048576?`${(b/1024).toFixed(1)} KB`:`${(b/1048576).toFixed(1)} MB`

function buildSteps(budget){
  const b=parseFloat(budget)||0
  const s0={order:1,role:'เจ้าหน้าที่',action:'จัดทำและส่งเอกสาร',status:'done'}
  const s99={order:99,role:'เจ้าหน้าที่',action:'ดำเนินการและบันทึกในระบบ',status:'waiting'}
  if(b<=0)   return [s0,{order:2,role:'ผจก.หน่วยธุรกิจ',action:'พิจารณา/อนุมัติ',status:'pending'},s99]
  if(b<=50000)  return [s0,{order:2,role:'ผจก.หน่วยธุรกิจ',action:'พิจารณา/อนุมัติ',status:'pending'},{order:3,role:'เจ้าหน้าที่ บห.',action:'รับทราบ',status:'waiting'},s99]
  if(b<=100000) return [s0,{order:2,role:'ผจก.หน่วยธุรกิจ',action:'พิจารณา',status:'pending'},{order:3,role:'เจ้าหน้าที่ บห.',action:'พิจารณา',status:'waiting'},{order:4,role:'ผจก.ฝ่าย บห.',action:'พิจารณา',status:'waiting'},{order:5,role:'ผจก.ใหญ่',action:'อนุมัติ',status:'waiting'},s99]
  if(b<=500000) return [s0,{order:2,role:'ผจก.หน่วยธุรกิจ',action:'พิจารณา',status:'pending'},{order:3,role:'เจ้าหน้าที่ บห.',action:'พิจารณา',status:'waiting'},{order:4,role:'ผจก.ฝ่าย บห.',action:'พิจารณา',status:'waiting'},{order:5,role:'ผจก.ใหญ่',action:'อนุมัติ',status:'waiting'},s99]
  return [s0,{order:2,role:'ผจก.หน่วยธุรกิจ',action:'พิจารณา',status:'pending'},{order:3,role:'เจ้าหน้าที่ บห.',action:'พิจารณา',status:'waiting'},{order:4,role:'ผจก.ฝ่าย บห.',action:'พิจารณา',status:'waiting'},{order:5,role:'ผจก.ใหญ่',action:'พิจารณา',status:'waiting'},{order:6,role:'ประธานกรรมการ',action:'อนุมัติ',status:'waiting'},{order:7,role:'ผจก.ฝ่าย บห.',action:'รับทราบ',status:'waiting'},{order:8,role:'เจ้าหน้าที่ บห.',action:'รับทราบ',status:'waiting'},s99]
}

const inpStyle={width:'100%',border:`1px solid ${T.gray200}`,borderRadius:7,padding:'8px 12px',fontSize:14,fontFamily:'Sarabun',boxSizing:'border-box',outline:'none',background:'#fff'}

const Btn=({children,onClick,color=T.skyBlue,outline=false,sm=false,disabled=false,style={}})=>(
  <button onClick={onClick} disabled={disabled} style={{background:disabled?T.gray200:outline?'transparent':color,color:disabled?T.gray400:outline?color:'#fff',border:`1.5px solid ${disabled?T.gray200:color}`,borderRadius:7,padding:sm?'4px 12px':'8px 18px',fontFamily:'Sarabun',fontWeight:700,fontSize:sm?12:13,cursor:disabled?'not-allowed':'pointer',...style}}>{children}</button>
)

const Badge=({status})=>{
  const m={done:{bg:'#e8f5e9',c:'#2e7d32',t:'✅ ดำเนินการแล้ว'},pending:{bg:'#fff8e1',c:'#f57f17',t:'⏳ รอดำเนินการ'},approved:{bg:'#e8f5e9',c:'#2e7d32',t:'✔ อนุมัติ'},rejected:{bg:'#ffebee',c:'#c62828',t:'✗ ไม่อนุมัติ'},revise:{bg:'#fff3e0',c:'#e65100',t:'🔄 แจ้งแก้ไข'},waiting:{bg:'#e3f2fd',c:'#1565c0',t:'🔵 รอคิว'}}
  const s=m[status]||m.waiting
  return <span style={{background:s.bg,color:s.c,borderRadius:20,padding:'2px 10px',fontSize:11.5,fontWeight:700}}>{s.t}</span>
}

const FileZone=memo(({files,onAdd,onRemove,savedFiles=[]})=>{
  const ref=useRef()
  const [drag,setDrag]=useState(false)
  const addFiles=useCallback(incoming=>{
    Array.from(incoming).filter(f=>ALLOWED.includes('.'+getExt(f.name))).forEach(f=>{
      onAdd({file:f,id:Date.now()+Math.random(),name:f.name,size:f.size,preview:f.type.startsWith('image/')?URL.createObjectURL(f):null})
    })
  },[onAdd])
  return(
    <div>
      <div onClick={()=>ref.current.click()} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}} style={{border:`2px dashed ${drag?T.skyBlue:T.gray200}`,borderRadius:10,padding:'18px 16px',textAlign:'center',background:drag?T.lightBlue:T.gray50,cursor:'pointer'}}>
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.docx,.xlsx" style={{display:'none'}} onChange={e=>addFiles(e.target.files)}/>
        <div style={{fontSize:26,marginBottom:4}}>📎</div>
        <div style={{fontWeight:700,color:T.skyBlue,fontSize:13}}>คลิกหรือลากไฟล์มาวางที่นี่</div>
        <div style={{fontSize:11,color:T.gray400,marginTop:2}}>PDF · JPG · DOCX · XLSX</div>
      </div>
      {savedFiles.map(f=>{const fi=getFI(f.file_name||'');const url=supabase.storage.from('documents').getPublicUrl(f.file_path).data.publicUrl;return(
        <div key={f.id} style={{display:'flex',alignItems:'center',gap:8,background:fi.bg,border:`1px solid ${fi.color}33`,borderRadius:7,padding:'7px 10px',marginTop:6}}>
          <span style={{fontSize:18}}>{fi.icon}</span>
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.file_name}</div><div style={{fontSize:10,color:T.gray400}}>{fi.label}·{fmtSz(f.file_size||0)}</div></div>
          <a href={url} target="_blank" rel="noreferrer" style={{color:T.skyBlue,fontSize:12,fontWeight:700,textDecoration:'none',background:T.lightBlue,padding:'2px 8px',borderRadius:4}}>👁 ดู</a>
        </div>
      )})}
      {files.map(f=>{const fi=getFI(f.name);return(
        <div key={f.id} style={{display:'flex',alignItems:'center',gap:8,background:fi.bg,border:`1px solid ${fi.color}33`,borderRadius:7,padding:'7px 10px',marginTop:6}}>
          {f.preview?<img src={f.preview} alt="" style={{width:32,height:32,objectFit:'cover',borderRadius:4}}/>:<span style={{fontSize:18}}>{fi.icon}</span>}
          <div style={{flex:1,minWidth:0}}><div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.name}</div><div style={{fontSize:10,color:T.gray400}}>{fi.label}·{fmtSz(f.size)}</div></div>
          <button onClick={()=>onRemove(f.id)} style={{background:'none',border:'none',cursor:'pointer',color:T.red,fontSize:15}}>✕</button>
        </div>
      )})}
    </div>
  )
})

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
    <div style={{minHeight:'100vh',background:`linear-gradient(135deg,${T.sidebarBg},${T.deepBlue})`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Sarabun'}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{background:'#fff',borderRadius:16,padding:40,width:400,boxShadow:'0 8px 40px rgba(0,0,0,0.3)'}}>
        <div style={{textAlign:'center',marginBottom:28}}>
          <div style={{width:60,height:60,background:`linear-gradient(135deg,${T.skyBlue},${T.deepBlue})`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,margin:'0 auto 12px'}}>🏛️</div>
          <div style={{fontWeight:800,fontSize:22,color:T.deepBlue}}>SERCOOP.PSU</div>
          <div style={{fontSize:13,color:T.gray400,marginTop:4}}>ระบบสารบรรณอิเล็กทรอนิกส์</div>
          <div style={{fontSize:11,color:T.gray400}}>สหกรณ์บริการมหาวิทยาลัยสงขลานครินทร์ จำกัด</div>
        </div>
        {err&&<div style={{background:T.redLight,color:T.red,borderRadius:7,padding:'8px 12px',fontSize:13,marginBottom:14,textAlign:'center'}}>{err}</div>}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:T.gray600,display:'block',marginBottom:5}}>อีเมล</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="email@sercoop.psu.ac.th" style={inpStyle} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
        </div>
        <div style={{marginBottom:22}}>
          <label style={{fontSize:13,color:T.gray600,display:'block',marginBottom:5}}>รหัสผ่าน</label>
          <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••" style={inpStyle} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
        </div>
        <button onClick={doLogin} disabled={loading} style={{width:'100%',background:loading?T.gray200:T.deepBlue,color:loading?T.gray400:'#fff',border:'none',borderRadius:8,padding:'11px',fontWeight:700,fontSize:15,fontFamily:'Sarabun',cursor:loading?'not-allowed':'pointer'}}>{loading?'⏳ กำลังเข้าสู่ระบบ...':'🔐 เข้าสู่ระบบ'}</button>
        <div style={{textAlign:'center',marginTop:14,fontSize:11,color:T.gray400}}>ระบบนี้ใช้งานได้ดีบน Google Chrome</div>
      </div>
    </div>
  )
}

function Sidebar({page,setPage,user,onLogout}){
  const menus=[{key:'dashboard',icon:'🏠',label:'หน้าหลัก'},{key:'doc',icon:'📋',label:'เกษียณหนังสือ'},{key:'workflow',icon:'⚙️',label:'Workflow อนุมัติ'},{key:'admin',icon:'🛡️',label:'ผู้ดูแลระบบ'},{key:'news',icon:'📰',label:'ข่าวสาร'},{key:'contact',icon:'📞',label:'ติดต่อเจ้าหน้าที่'}]
  return(
    <div style={{width:220,background:T.sidebarBg,display:'flex',flexDirection:'column',flexShrink:0}}>
      <div style={{padding:'14px 16px',background:'rgba(0,0,0,0.25)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:40,height:40,background:`linear-gradient(135deg,${T.skyBlue},${T.deepBlue})`,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🏛️</div>
          <div><div style={{color:'#fff',fontWeight:800,fontSize:11.5}}>SERCOOP.PSU</div><div style={{color:'rgba(255,255,255,0.45)',fontSize:10}}>ระบบสารบรรณอิเล็กทรอนิกส์</div></div>
        </div>
      </div>
      <div style={{padding:'12px 16px',background:'rgba(0,0,0,0.15)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{color:'rgba(255,255,255,0.5)',fontSize:10.5}}>ผู้ใช้: <span style={{color:T.skyBlue}}>{user?.email?.split('@')[0]}</span></div>
        <div style={{color:'#fff',fontSize:11,marginTop:2,wordBreak:'break-all'}}>{user?.email}</div>
      </div>
      <div style={{flex:1,padding:'10px'}}>
        {menus.map(m=>(
          <div key={m.key} onClick={()=>setPage(m.key)} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:7,marginBottom:2,cursor:'pointer',fontSize:13,background:page===m.key?`${T.skyBlue}30`:'transparent',color:page===m.key?'#fff':'rgba(255,255,255,0.6)',fontWeight:page===m.key?700:400,borderLeft:page===m.key?`3px solid ${T.skyBlue}`:'3px solid transparent'}}
            onMouseEnter={e=>{if(page!==m.key)e.currentTarget.style.background='rgba(255,255,255,0.06)'}}
            onMouseLeave={e=>{if(page!==m.key)e.currentTarget.style.background='transparent'}}
          ><span style={{fontSize:15}}>{m.icon}</span>{m.label}</div>
        ))}
      </div>
      <div style={{padding:'10px 16px',borderTop:'1px solid rgba(255,255,255,0.07)'}}>
        <div onClick={onLogout} style={{display:'flex',alignItems:'center',gap:8,color:'rgba(255,255,255,0.4)',fontSize:12,cursor:'pointer'}}><span>🚪</span>ออกจากระบบ</div>
      </div>
    </div>
  )
}

function Topbar({title,subtitle}){
  const now=new Date().toLocaleDateString('th-TH',{weekday:'long',year:'numeric',month:'long',day:'numeric'})
  return(
    <div style={{background:'#fff',borderBottom:`1px solid ${T.gray200}`,padding:'10px 24px',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
      <div><div style={{fontWeight:800,fontSize:17,color:T.deepBlue}}>{title}</div>{subtitle&&<div style={{fontSize:12,color:T.gray400}}>{subtitle}</div>}</div>
      <div style={{fontSize:12,color:T.gray400}}>{now}</div>
    </div>
  )
}

function PageDashboard({docs}){
  const stats=[
    {label:'เอกสารทั้งหมด',value:docs.length,icon:'📄',color:T.skyBlue},
    {label:'รอดำเนินการ',value:docs.filter(d=>!d.status||d.status==='pending').length,icon:'⏳',color:'#f57f17'},
    {label:'ดำเนินการแล้ว',value:docs.filter(d=>d.status==='approved').length,icon:'✅',color:T.green},
    {label:'งบรออนุมัติ',value:'฿'+docs.filter(d=>d.budget>0&&(!d.status||d.status==='pending')).reduce((a,b)=>a+(Number(b.budget)||0),0).toLocaleString(),icon:'💰',color:T.deepBlue},
  ]
  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        {stats.map(s=>(
          <div key={s.label} style={{background:'#fff',borderRadius:10,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${s.color}`}}>
            <div style={{fontSize:24}}>{s.icon}</div>
            <div style={{fontSize:26,fontWeight:800,color:s.color,marginTop:4}}>{s.value}</div>
            <div style={{fontSize:12,color:T.gray400}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{background:'#fff',borderRadius:10,padding:'16px 20px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
        <div style={{fontWeight:700,color:T.deepBlue,marginBottom:12,fontSize:14}}>📋 เอกสารล่าสุด</div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
          <thead><tr style={{background:T.gray50}}>{['เลขที่','เรื่อง','ฝ่าย','วันที่','งบประมาณ','สถานะ'].map(h=><th key={h} style={{padding:'8px 12px',textAlign:'left',color:T.gray600,fontWeight:600,borderBottom:`1px solid ${T.gray200}`,fontSize:12}}>{h}</th>)}</tr></thead>
          <tbody>
            {docs.slice(0,8).map((d,i)=>(
              <tr key={d.id} style={{borderBottom:`1px solid ${T.gray100}`,background:i%2===0?'#fff':T.gray50}}>
                <td style={{padding:'8px 12px',fontWeight:700,color:T.skyBlue,fontSize:12}}>{d.id}</td>
                <td style={{padding:'8px 12px',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.subject}</td>
                <td style={{padding:'8px 12px',color:T.gray400,fontSize:12}}>{d.dept}</td>
                <td style={{padding:'8px 12px',color:T.gray400,fontSize:12}}>{d.doc_date}</td>
                <td style={{padding:'8px 12px',fontSize:12,fontWeight:600,color:d.budget>0?T.green:T.gray400}}>{d.budget>0?`฿${Number(d.budget).toLocaleString()}`:'—'}</td>
                <td style={{padding:'8px 12px'}}><Badge status={d.status||'pending'}/></td>
              </tr>
            ))}
          </tbody>
        </table>
        {docs.length===0&&<div style={{padding:32,textAlign:'center',color:T.gray400,fontSize:14}}>ยังไม่มีเอกสาร — ไปที่ "เกษียณหนังสือ" แล้วกด "สร้างเอกสาร"</div>}
      </div>
    </div>
  )
}

// ── DOCUMENT FORM (KEY FIX: ใช้ uncontrolled inputs + useRef) ──
function PageDocDetail({doc,onBack,onSaved,user}){
  const isNew=!doc
  // uncontrolled refs - ป้องกัน re-render ทุกครั้งที่พิมพ์
  const refs={
    subject: useRef(doc?.subject||''),
    id:      useRef(doc?.id||''),
    from:    useRef(doc?.from_person||''),
    to:      useRef(doc?.to_person||''),
    dept:    useRef(doc?.dept||''),
    date:    useRef(doc?.doc_date||''),
    budget:  useRef(doc?.budget||''),
    content: useRef(doc?.content||''),
    note:    useRef(doc?.note||''),
  }
  const [docType,setDocType]=useState(doc?.type||'บันทึกข้อความ')
  const [urgent,setUrgent]=useState(doc?.urgent||'ปกติ')
  const [secret,setSecret]=useState(doc?.secret||'ปกติ')
  const [files,setFiles]=useState([])
  const [savedFiles,setSavedFiles]=useState([])
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState('')
  const [route,setRoute]=useState(()=>{
    const b=parseFloat(doc?.budget)||0
    if(!b)return''
    if(b<=50000)return'ผจก.หน่วยธุรกิจ'
    if(b<=100000)return'ผจก.หน่วยธุรกิจ → ผจก.ฝ่าย → ผจก.ใหญ่'
    if(b<=500000)return'ผจก.หน่วยธุรกิจ → ผจก.ฝ่าย → ผจก.ใหญ่'
    return'ผจก.หน่วยธุรกิจ → ผจก.ฝ่าย → ผจก.ใหญ่ → ประธานกรรมการ'
  })

  useEffect(()=>{
    if(doc?.id){supabase.from('document_files').select('*').eq('document_id',doc.id).then(({data})=>{if(data)setSavedFiles(data)})}
  },[doc])

  const onBudgetChange=useCallback(e=>{
    refs.budget.current=e.target.value
    const b=parseFloat(e.target.value)||0
    if(!b)setRoute('')
    else if(b<=50000)setRoute('ผจก.หน่วยธุรกิจ')
    else if(b<=100000)setRoute('ผจก.หน่วยธุรกิจ → ผจก.ฝ่าย → ผจก.ใหญ่')
    else if(b<=500000)setRoute('ผจก.หน่วยธุรกิจ → ผจก.ฝ่าย → ผจก.ใหญ่')
    else setRoute('ผจก.หน่วยธุรกิจ → ผจก.ฝ่าย → ผจก.ใหญ่ → ประธานกรรมการ')
  },[])

  const onAddFile=useCallback(f=>setFiles(p=>[...p,f]),[])
  const onRemoveFile=useCallback(id=>setFiles(p=>p.filter(f=>f.id!==id)),[])

  const handleSave=async()=>{
    const subject=refs.subject.current
    if(!subject.trim()){setMsg('❌ กรุณากรอกเรื่อง');return}
    setSaving(true);setMsg('')
    try{
      const docId=refs.id.current||`บข.${new Date().getFullYear()+543}/${String(Date.now()).slice(-4)}`
      const payload={id:docId,subject,type:docType,dept:refs.dept.current,doc_date:refs.date.current,urgent,secret,from_person:refs.from.current,to_person:refs.to.current,budget:parseFloat(refs.budget.current)||0,content:refs.content.current,note:refs.note.current,status:'pending',created_by:user?.id}
      const{error:e1}=isNew?await supabase.from('documents').insert(payload):await supabase.from('documents').update(payload).eq('id',docId)
      if(e1)throw e1
      for(const f of files){
        const path=`${docId}/${Date.now()}_${f.name}`
        const{error:e2}=await supabase.storage.from('documents').upload(path,f.file)
        if(!e2)await supabase.from('document_files').insert({document_id:docId,file_name:f.name,file_path:path,file_size:f.size,file_type:getExt(f.name)})
      }
      if(isNew){
        const steps=buildSteps(refs.budget.current)
        await supabase.from('workflow_steps').insert(steps.map(s=>({document_id:docId,step_order:s.order,role_name:s.role,action_label:s.action,status:s.status})))
      }
      setMsg('✅ บันทึกสำเร็จ!')
      setTimeout(()=>onSaved(),1200)
    }catch(e){setMsg('❌ เกิดข้อผิดพลาด: '+e.message)}
    setSaving(false)
  }

  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
        <Btn onClick={onBack} outline color={T.gray400}>← กลับ</Btn>
        <div>
          <div style={{fontWeight:800,fontSize:16,color:T.deepBlue}}>{isNew?'สร้างเอกสารใหม่':`รายละเอียด: ${doc.id}`}</div>
          <div style={{fontSize:12,color:T.gray400}}>{isNew?'กรอกข้อมูลเอกสารและแนบไฟล์':doc.type+' · '+doc.dept}</div>
        </div>
      </div>
      {msg&&<div style={{background:msg.includes('✅')?T.greenLight:T.redLight,color:msg.includes('✅')?T.green:T.red,borderRadius:8,padding:'10px 16px',marginBottom:16,fontWeight:600}}>{msg}</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:16,alignItems:'start'}}>
        <div style={{background:'#fff',borderRadius:10,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:16,paddingBottom:10,borderBottom:`2px solid ${T.lightBlue}`}}>📝 ข้อมูลเอกสาร</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px 16px'}}>
            <div>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4}}>ประเภทเอกสาร *</label>
              <select value={docType} onChange={e=>setDocType(e.target.value)} style={inpStyle}>
                {['บันทึกข้อความ','หนังสือรับ','หนังสือส่ง','คำสั่ง','ประกาศ','หนังสือรับรอง'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4}}>เลขที่</label>
              <input defaultValue={refs.id.current} onChange={e=>refs.id.current=e.target.value} placeholder="ระบบจะออกให้อัตโนมัติ" style={inpStyle}/>
            </div>
            <div style={{gridColumn:'span 2'}}>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4}}>เรื่อง <span style={{color:T.red}}>*</span></label>
              <input defaultValue={refs.subject.current} onChange={e=>refs.subject.current=e.target.value} placeholder="ระบุเรื่องของเอกสาร" style={inpStyle}/>
            </div>
            <div>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4}}>จาก (ผู้ส่ง) *</label>
              <input defaultValue={refs.from.current} onChange={e=>refs.from.current=e.target.value} placeholder="ชื่อ-นามสกุล / หน่วยงาน" style={inpStyle}/>
            </div>
            <div>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4}}>ถึง (ผู้รับ) *</label>
              <input defaultValue={refs.to.current} onChange={e=>refs.to.current=e.target.value} placeholder="ตำแหน่ง / หน่วยงาน" style={inpStyle}/>
            </div>
            <div>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4}}>หน่วยงานที่ขอ</label>
              <input defaultValue={refs.dept.current} onChange={e=>refs.dept.current=e.target.value} placeholder="ฝ่าย / แผนก" style={inpStyle}/>
            </div>
            <div>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4}}>วันที่เอกสาร</label>
              <input type="date" defaultValue={refs.date.current} onChange={e=>refs.date.current=e.target.value} style={inpStyle}/>
            </div>
            <div>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4}}>ชั้นความเร็ว</label>
              <select value={urgent} onChange={e=>setUrgent(e.target.value)} style={inpStyle}>
                {['ปกติ','ด่วน','ด่วนมาก','ด่วนที่สุด'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4}}>ชั้นความลับ</label>
              <select value={secret} onChange={e=>setSecret(e.target.value)} style={inpStyle}>
                {['ปกติ','ลับ','ลับมาก','ลับที่สุด'].map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div style={{gridColumn:'span 2'}}>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4}}>งบประมาณที่เกี่ยวข้อง (บาท)</label>
              <input type="number" defaultValue={refs.budget.current} onChange={onBudgetChange} placeholder="0 = ไม่มีงบประมาณ" style={inpStyle}/>
              {route&&<div style={{marginTop:6,background:T.lightBlue,borderRadius:6,padding:'6px 12px',fontSize:12,color:T.deepBlue,fontWeight:600}}>⚡ เส้นทางอนุมัติ: {route}</div>}
            </div>
            <div style={{gridColumn:'span 2'}}>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4}}>เนื้อหา / สรุปเรื่อง</label>
              <textarea defaultValue={refs.content.current} onChange={e=>refs.content.current=e.target.value} rows={4} placeholder="ระบุรายละเอียดเนื้อหา" style={{...inpStyle,resize:'vertical'}}/>
            </div>
            <div style={{gridColumn:'span 2'}}>
              <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4}}>หมายเหตุ</label>
              <textarea defaultValue={refs.note.current} onChange={e=>refs.note.current=e.target.value} rows={3} placeholder="หมายเหตุเพิ่มเติม" style={{...inpStyle,resize:'vertical'}}/>
            </div>
          </div>
          <div style={{marginTop:18,paddingTop:14,borderTop:`1px solid ${T.gray200}`}}>
            <div style={{fontWeight:700,color:T.deepBlue,fontSize:13,marginBottom:10}}>📎 แนบไฟล์เอกสาร (PDF · JPG · DOCX · XLSX)</div>
            <FileZone files={files} onAdd={onAddFile} onRemove={onRemoveFile} savedFiles={savedFiles}/>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:18,paddingTop:14,borderTop:`1px solid ${T.gray200}`}}>
            <Btn onClick={onBack} outline color={T.gray400}>ยกเลิก</Btn>
            <Btn onClick={handleSave} disabled={saving} color={T.deepBlue}>{saving?'⏳ กำลังบันทึก...':'📤 บันทึกและส่ง Workflow'}</Btn>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:'#fff',borderRadius:10,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:700,color:T.deepBlue,fontSize:13,marginBottom:12}}>⚙️ ขั้นตอน Workflow</div>
            {buildSteps(refs.budget.current).map((s,i,arr)=>(
              <div key={s.order} style={{display:'flex',gap:0}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:26,flexShrink:0}}>
                  <div style={{width:22,height:22,borderRadius:'50%',background:s.status==='done'?T.green:s.status==='pending'?'#f57f17':T.gray200,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:700}}>{s.status==='done'?'✓':s.order}</div>
                  {i<arr.length-1&&<div style={{width:2,flex:1,minHeight:12,background:T.gray200,margin:'2px 0'}}/>}
                </div>
                <div style={{flex:1,marginLeft:8,marginBottom:8}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.deepBlue}}>{s.role}</div>
                  <div style={{fontSize:11,color:T.gray400}}>{s.action}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:T.greenLight,border:`1px solid ${T.green}44`,borderRadius:10,padding:14}}>
            <div style={{fontWeight:700,color:T.green,fontSize:13,marginBottom:8}}>💬 LINE แจ้งเตือนอัตโนมัติ</div>
            <div style={{fontSize:12,color:'#2e7d32',lineHeight:1.8}}>เมื่อส่งขออนุมัติ ระบบจะแจ้งเตือน:<br/>→ ผู้มีอำนาจในแต่ละขั้นตอน<br/>→ เจ้าหน้าที่ที่เกี่ยวข้อง<br/>→ ผู้ส่งเมื่ออนุมัติ/ไม่อนุมัติ</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PageDoc({docs,setDocs,onSelectDoc,user}){
  const [search,setSearch]=useState('')
  const [filterType,setFilterType]=useState('ทั้งหมด')
  const [showNew,setShowNew]=useState(false)
  const [loading,setLoading]=useState(false)

  const loadDocs=useCallback(async()=>{
    setLoading(true)
    const{data}=await supabase.from('documents').select('*').order('created_at',{ascending:false})
    if(data)setDocs(data)
    setLoading(false)
  },[setDocs])

  useEffect(()=>{loadDocs()},[])

  if(showNew)return <PageDocDetail onBack={()=>setShowNew(false)} onSaved={()=>{setShowNew(false);loadDocs()}} user={user}/>

  const types=['ทั้งหมด','บันทึกข้อความ','หนังสือรับ','หนังสือส่ง','คำสั่ง','ประกาศ']
  const filtered=docs.filter(d=>(filterType==='ทั้งหมด'||d.type===filterType)&&(d.subject?.includes(search)||d.id?.includes(search)||d.dept?.includes(search)))

  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',flex:1,maxWidth:380,border:`1px solid ${T.gray200}`,borderRadius:7,overflow:'hidden'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาเลขที่ / เรื่อง / ฝ่าย..." style={{flex:1,border:'none',padding:'8px 14px',fontSize:13,fontFamily:'Sarabun',outline:'none'}}/>
          <div style={{padding:'0 12px',display:'flex',alignItems:'center',background:T.skyBlue,color:'#fff'}}>🔍</div>
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {types.map(t=><button key={t} onClick={()=>setFilterType(t)} style={{padding:'6px 12px',border:`1px solid ${filterType===t?T.skyBlue:T.gray200}`,borderRadius:6,background:filterType===t?T.skyBlue:'#fff',color:filterType===t?'#fff':T.gray600,fontFamily:'Sarabun',fontSize:12,cursor:'pointer',fontWeight:filterType===t?700:400}}>{t}</button>)}
        </div>
        <Btn onClick={loadDocs} outline color={T.skyBlue}>🔄</Btn>
        <Btn onClick={()=>setShowNew(true)} color={T.deepBlue}>＋ สร้างเอกสาร</Btn>
      </div>
      {loading&&<div style={{textAlign:'center',padding:40,color:T.gray400}}>⏳ กำลังโหลด...</div>}
      {!loading&&(
        <div style={{background:'#fff',borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:T.deepBlue}}>{['เลขที่','ประเภท','เรื่อง','ฝ่าย','วันที่','งบประมาณ','ความเร็ว','สถานะ',''].map(h=><th key={h} style={{padding:'10px 12px',textAlign:'left',color:'#fff',fontWeight:600,fontSize:12}}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((d,i)=>(
                <tr key={d.id} style={{borderBottom:`1px solid ${T.gray100}`,background:i%2===0?'#fff':T.gray50,cursor:'pointer'}} onClick={()=>onSelectDoc(d)} onMouseEnter={e=>e.currentTarget.style.background=T.lightBlue} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':T.gray50}>
                  <td style={{padding:'10px 12px',fontWeight:700,color:T.skyBlue,fontSize:12}}>{d.id}</td>
                  <td style={{padding:'10px 12px'}}><span style={{background:T.lightBlue,color:T.deepBlue,borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700}}>{d.type}</span></td>
                  <td style={{padding:'10px 12px',fontSize:13,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.subject}</td>
                  <td style={{padding:'10px 12px',fontSize:12,color:T.gray400}}>{d.dept}</td>
                  <td style={{padding:'10px 12px',fontSize:12,color:T.gray400}}>{d.doc_date}</td>
                  <td style={{padding:'10px 12px',fontSize:12,fontWeight:600,color:d.budget>0?T.green:T.gray400}}>{d.budget>0?`฿${Number(d.budget).toLocaleString()}`:'—'}</td>
                  <td style={{padding:'10px 12px'}}><span style={{background:d.urgent==='ปกติ'?T.greenLight:T.redLight,color:d.urgent==='ปกติ'?T.green:T.red,borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700}}>{d.urgent||'ปกติ'}</span></td>
                  <td style={{padding:'10px 12px'}}><Badge status={d.status||'pending'}/></td>
                  <td style={{padding:'10px 12px'}}><Btn sm color={T.skyBlue} onClick={e=>{e.stopPropagation();onSelectDoc(d)}}>ดู</Btn></td>
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

export default function App(){
  const [user,setUser]=useState(null)
  const [loading,setLoading]=useState(true)
  const [page,setPage]=useState('dashboard')
  const [docs,setDocs]=useState([])
  const [selectedDoc,setSelected]=useState(null)

  useEffect(()=>{
    supabase.auth.getSession().then(({data:{session}})=>{setUser(session?.user||null);setLoading(false)})
    const{data:{subscription}}=supabase.auth.onAuthStateChange((_,session)=>setUser(session?.user||null))
    return()=>subscription.unsubscribe()
  },[])

  const handleLogout=async()=>{await supabase.auth.signOut();setUser(null)}
  const handleSelectDoc=doc=>{setSelected(doc);setPage('docdetail')}
  const handleBack=()=>{setSelected(null);setPage('doc')}

  if(loading)return<div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:T.sidebarBg,fontFamily:'Sarabun'}}><div style={{color:'#fff',fontSize:16}}>⏳ กำลังโหลด...</div></div>
  if(!user)return<PageLogin onLogin={u=>setUser(u)}/>

  const titles={dashboard:'หน้าหลัก · ภาพรวมระบบ',doc:'โปรแกรมเกษียณหนังสือ / เอกสาร',docdetail:selectedDoc?`รายละเอียด: ${selectedDoc.id}`:'สร้างเอกสารใหม่',workflow:'Workflow การอนุมัติ',admin:'ผู้ดูแลระบบ',news:'ข่าวสาร',contact:'ติดต่อเจ้าหน้าที่'}

  return(
    <div style={{display:'flex',height:'100vh',fontFamily:'Sarabun',background:T.gray100,overflow:'hidden'}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700;800&display=swap" rel="stylesheet"/>
      <Sidebar page={page} setPage={p=>{setSelected(null);setPage(p)}} user={user} onLogout={handleLogout}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <Topbar title={titles[page]||'SERCOOP.PSU'} subtitle="สหกรณ์บริการมหาวิทยาลัยสงขลานครินทร์ จำกัด"/>
        {page==='dashboard'&&<PageDashboard docs={docs}/>}
        {page==='doc'&&<PageDoc docs={docs} setDocs={setDocs} onSelectDoc={handleSelectDoc} user={user}/>}
        {page==='docdetail'&&<PageDocDetail doc={selectedDoc} onBack={handleBack} onSaved={handleBack} user={user}/>}
        {['workflow','admin','news','contact'].includes(page)&&(
          <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',gap:12,color:T.gray400}}>
            <div style={{fontSize:48}}>🚧</div>
            <div style={{fontSize:16,fontWeight:600,color:T.deepBlue}}>{titles[page]}</div>
            <div style={{fontSize:13}}>อยู่ระหว่างพัฒนา</div>
          </div>
        )}
      </div>
    </div>
  )
}
