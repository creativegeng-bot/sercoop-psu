import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useRef, useCallback, memo } from 'react'

const supabase = createClient(
  'https://rartcrxprbcoylqwjvjx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhcnRjcnhwcmJjb3lscXdqdmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDQ1MDYsImV4cCI6MjA5NDA4MDUwNn0.41svsIGvzuaPBVjyD3XjZceGlL2bXd_BePcsqgDSd6o'
)

const T = {
  deepBlue:'#1a3a6b',skyBlue:'#1e88e5',lightBlue:'#e3f2fd',
  midBlue:'#1565c0',navy:'#0f2240',
  green:'#2e7d32',greenLight:'#e8f5e9',
  red:'#c62828',redLight:'#ffebee',
  orange:'#e65100',orangeLight:'#fff3e0',
  amber:'#f57f17',amberLight:'#fffde7',
  purple:'#6a1b9a',teal:'#00695c',tealLight:'#e0f2f1',
  gray50:'#f8fafc',gray100:'#f1f5f9',gray200:'#e2e8f0',
  gray400:'#94a3b8',gray600:'#475569',gray800:'#1e293b',
  white:'#ffffff',sidebarBg:'#0f2240',
}

const ROLES={
  admin:{label:'ผู้ดูแลระบบ',color:T.red,canApprove:true,canCreate:true,canAdmin:true},
  manager:{label:'ผู้จัดการ/ผู้อนุมัติ',color:T.orange,canApprove:true,canCreate:true,canAdmin:false},
  staff:{label:'เจ้าหน้าที่',color:T.skyBlue,canApprove:false,canCreate:true,canAdmin:false},
  viewer:{label:'ผู้ดูข้อมูล',color:T.gray400,canApprove:false,canCreate:false,canAdmin:false},
}

const MEMO_CATS=[
  {code:'MEMO-01',name:'จัดซื้อจัดจ้าง',icon:'🛒',color:T.skyBlue},
  {code:'MEMO-02',name:'เบิกจ่าย',icon:'💳',color:T.green},
  {code:'MEMO-03',name:'อนุมัติงบเบ็ดเตล็ด',icon:'📊',color:T.orange},
  {code:'MEMO-04',name:'เบิกค่ารับรอง',icon:'🍽️',color:T.purple},
  {code:'MEMO-05',name:'ใช้ทุนสาธารณประโยชน์',icon:'🏛️',color:T.teal},
  {code:'MEMO-06',name:'ใช้ทุนส่งเสริมกิจสหกรณ์',icon:'🤝',color:T.midBlue},
  {code:'MEMO-07',name:'ใช้ทุนศึกษาอบรม',icon:'📚',color:T.amber},
  {code:'MEMO-08',name:'งานบุคคล',icon:'👥',color:T.red},
  {code:'MEMO-09',name:'อื่นๆ',icon:'📝',color:T.gray600},
]
const OUT_CATS=[
  {code:'OUT-01',name:'ม.อ.',icon:'🏫',color:T.deepBlue},
  {code:'OUT-02',name:'กองคลัง ม.อ.',icon:'🏦',color:T.midBlue},
  {code:'OUT-03',name:'สอ.ม.อ.',icon:'🤝',color:T.teal},
  {code:'OUT-04',name:'หน่วยงานใน ม.อ.',icon:'🏢',color:T.skyBlue},
  {code:'OUT-05',name:'สหกรณ์จังหวัด',icon:'🗺️',color:T.green},
  {code:'OUT-06',name:'หน่วยงานที่เกี่ยวกับสหกรณ์',icon:'⚖️',color:T.orange},
  {code:'OUT-07',name:'สหกรณ์อื่น',icon:'🏪',color:T.purple},
  {code:'OUT-08',name:'เอกชน/บุคคลภายนอก',icon:'👤',color:T.gray600},
]

const DOC_STYLES=[
  {key:'formal',label:'เป็นทางการ',icon:'🎩',desc:'Formal/Official'},
  {key:'friendly',label:'เป็นมิตร',icon:'😊',desc:'Friendly'},
  {key:'concise',label:'กระชับ',icon:'⚡',desc:'Concise/Direct'},
  {key:'semiformal',label:'กึ่งทางการ',icon:'📋',desc:'Semi-formal'},
]

const APPROVAL_CHAIN=(budget)=>{
  const b=parseFloat(budget)||0
  if(b<=0)    return [{role:'ผจก.หน่วยธุรกิจ',label:'ผู้จัดการหน่วยธุรกิจ'}]
  if(b<=50000)  return [{role:'ผจก.หน่วยธุรกิจ',label:'ผู้จัดการหน่วยธุรกิจ'}]
  if(b<=100000) return [{role:'ผจก.หน่วยธุรกิจ',label:'ผู้จัดการหน่วยธุรกิจ'},{role:'ผจก.ฝ่าย บห.',label:'ผู้จัดการฝ่าย'},{role:'ผจก.ใหญ่',label:'ผู้จัดการใหญ่'}]
  if(b<=500000) return [{role:'ผจก.หน่วยธุรกิจ',label:'ผู้จัดการหน่วยธุรกิจ'},{role:'ผจก.ฝ่าย บห.',label:'ผู้จัดการฝ่าย'},{role:'ผจก.ใหญ่',label:'ผู้จัดการใหญ่'}]
  return [{role:'ผจก.หน่วยธุรกิจ',label:'ผู้จัดการหน่วยธุรกิจ'},{role:'ผจก.ฝ่าย บห.',label:'ผู้จัดการฝ่าย'},{role:'ผจก.ใหญ่',label:'ผู้จัดการใหญ่'},{role:'ประธานกรรมการ',label:'ประธานกรรมการ'}]
}

const getExt=n=>(n||'').split('.').pop().toLowerCase()
const getFI=n=>{
  const m={pdf:{icon:'📄',color:'#c62828',bg:'#ffebee',label:'PDF'},jpg:{icon:'🖼️',color:'#1565c0',bg:'#e3f2fd',label:'JPG'},jpeg:{icon:'🖼️',color:'#1565c0',bg:'#e3f2fd',label:'JPG'},docx:{icon:'📝',color:'#1e88e5',bg:'#e3f2fd',label:'DOCX'},doc:{icon:'📝',color:'#1e88e5',bg:'#e3f2fd',label:'DOC'},xlsx:{icon:'📊',color:'#2e7d32',bg:'#e8f5e9',label:'XLSX'}}
  return m[getExt(n)]||{icon:'📎',color:'#64748b',bg:'#f1f5f9',label:'FILE'}
}
const fmtMoney=n=>Number(n||0).toLocaleString('th-TH')
const fmtSz=b=>b<1048576?`${(b/1024).toFixed(1)} KB`:`${(b/1048576).toFixed(1)} MB`
const inpStyle={width:'100%',border:`1px solid ${T.gray200}`,borderRadius:7,padding:'8px 12px',fontSize:13,fontFamily:'Sarabun',boxSizing:'border-box',outline:'none',background:'#fff'}

const Btn=({children,onClick,color=T.skyBlue,outline=false,sm=false,disabled=false,full=false,style={}})=>(
  <button onClick={onClick} disabled={disabled} style={{background:disabled?T.gray200:outline?'transparent':color,color:disabled?T.gray400:outline?color:'#fff',border:`1.5px solid ${disabled?T.gray200:color}`,borderRadius:7,padding:sm?'5px 12px':'9px 18px',fontFamily:'Sarabun',fontWeight:700,fontSize:sm?12:13,cursor:disabled?'not-allowed':'pointer',width:full?'100%':'auto',...style}}>{children}</button>
)

const Badge=({status})=>{
  const m={done:{bg:'#e8f5e9',c:'#2e7d32',t:'✅ ดำเนินการแล้ว'},pending:{bg:'#fff8e1',c:'#f57f17',t:'⏳ รอดำเนินการ'},approved:{bg:'#e8f5e9',c:'#2e7d32',t:'✔ อนุมัติ'},rejected:{bg:'#ffebee',c:'#c62828',t:'✗ ไม่อนุมัติ'},revise:{bg:'#fff3e0',c:'#e65100',t:'🔄 แจ้งแก้ไข'},waiting:{bg:'#e3f2fd',c:'#1565c0',t:'🔵 รอคิว'},draft:{bg:'#f1f5f9',c:'#64748b',t:'📝 ร่าง'}}
  const s=m[status]||m.waiting
  return <span style={{background:s.bg,color:s.c,borderRadius:20,padding:'2px 10px',fontSize:11.5,fontWeight:700,whiteSpace:'nowrap'}}>{s.t}</span>
}

const FileZone=memo(({files,onAdd,onRemove,savedFiles=[]})=>{
  const ref=useRef()
  const [drag,setDrag]=useState(false)
  const addFiles=useCallback(incoming=>{
    Array.from(incoming).filter(f=>['.pdf','.jpg','.jpeg','.docx','.xlsx'].includes('.'+getExt(f.name))).forEach(f=>{
      onAdd({file:f,id:Date.now()+Math.random(),name:f.name,size:f.size,preview:f.type.startsWith('image/')?URL.createObjectURL(f):null})
    })
  },[onAdd])
  return(
    <div>
      <div onClick={()=>ref.current.click()} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}}
        style={{border:`2px dashed ${drag?T.skyBlue:T.gray200}`,borderRadius:10,padding:14,textAlign:'center',background:drag?T.lightBlue:T.gray50,cursor:'pointer'}}>
        <input ref={ref} type="file" multiple accept=".pdf,.jpg,.jpeg,.docx,.xlsx" style={{display:'none'}} onChange={e=>addFiles(e.target.files)}/>
        <div style={{fontSize:22,marginBottom:3}}>📎</div>
        <div style={{fontWeight:700,color:T.skyBlue,fontSize:13}}>คลิกหรือลากไฟล์มาวาง</div>
        <div style={{fontSize:11,color:T.gray400}}>PDF · JPG · DOCX · XLSX (ไม่เกิน 10MB)</div>
      </div>
      {[...savedFiles,...files].map(f=>{
        const fi=getFI(f.file_name||f.name||'')
        const isSaved=!!f.file_path
        const url=isSaved?supabase.storage.from('documents').getPublicUrl(f.file_path).data.publicUrl:null
        return(
          <div key={f.id} style={{display:'flex',alignItems:'center',gap:8,background:fi.bg,border:`1px solid ${fi.color}33`,borderRadius:7,padding:'7px 10px',marginTop:5}}>
            {f.preview?<img src={f.preview} alt="" style={{width:30,height:30,objectFit:'cover',borderRadius:4}}/>:<span style={{fontSize:18}}>{fi.icon}</span>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.file_name||f.name}</div>
              <div style={{fontSize:10,color:T.gray400}}>{fi.label} · {fmtSz(f.file_size||f.size||0)}</div>
            </div>
            {isSaved?<a href={url} target="_blank" rel="noreferrer" style={{color:T.skyBlue,fontSize:12,fontWeight:700,textDecoration:'none',background:T.lightBlue,padding:'3px 8px',borderRadius:4}}>👁 ดู</a>
              :<button onClick={()=>onRemove(f.id)} style={{background:'none',border:'none',cursor:'pointer',color:T.red,fontSize:15}}>✕</button>}
          </div>
        )
      })}
    </div>
  )
})

function AIDraftPanel({subject,content,category}){
  const [style,setStyle]=useState('formal')
  const [loading,setLoading]=useState(false)
  const [result,setResult]=useState('')
  const draft=async()=>{
    setLoading(true);setResult('')
    const styleDesc={formal:'แบบเป็นทางการ ใช้ภาษาราชการ',friendly:'แบบเป็นมิตร สุภาพอบอุ่น',concise:'แบบกระชับตรงประเด็น',semiformal:'แบบกึ่งทางการ'}
    try{
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,messages:[{role:'user',content:`ร่างบันทึกข้อความ${styleDesc[style]} สำหรับสหกรณ์บริการ มอ.\nเรื่อง: ${subject||'-'}\nประเภท: ${category?.name||'-'}\nรายละเอียด: ${content||'-'}\n\nร่างเฉพาะเนื้อหา 3 ส่วน: 1.ความเป็นมา 2.รายละเอียด 3.ขออนุมัติ อ้างข้อมูลที่ให้มาเท่านั้น`}]})})
      const d=await r.json()
      setResult(d.content?.map(c=>c.text||'').join('')||'ไม่สามารถร่างได้')
    }catch(e){setResult('ไม่สามารถเชื่อมต่อ AI ได้ กรุณาตั้งค่า Claude API Key')}
    setLoading(false)
  }
  return(
    <div style={{background:'#fff',borderRadius:10,padding:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1px solid ${T.lightBlue}`}}>
      <div style={{fontWeight:700,color:T.deepBlue,fontSize:13,marginBottom:10}}>🤖 AI ร่างหนังสือ</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginBottom:10}}>
        {DOC_STYLES.map(s=>(
          <button key={s.key} onClick={()=>setStyle(s.key)} style={{padding:'8px',border:`1.5px solid ${style===s.key?T.skyBlue:T.gray200}`,borderRadius:7,background:style===s.key?T.lightBlue:'#fff',cursor:'pointer',textAlign:'left',fontFamily:'Sarabun'}}>
            <div style={{fontSize:14}}>{s.icon}</div>
            <div style={{fontSize:11,fontWeight:700,color:style===s.key?T.deepBlue:T.gray600}}>{s.label}</div>
          </button>
        ))}
      </div>
      <Btn full color={T.skyBlue} onClick={draft} disabled={loading}>{loading?'⏳ AI กำลังร่าง...':'✍️ ร่างหนังสืออัตโนมัติ'}</Btn>
      {result&&<div style={{marginTop:10,background:T.gray50,borderRadius:7,padding:12,fontSize:12,lineHeight:1.8,maxHeight:180,overflowY:'auto',whiteSpace:'pre-wrap'}}>{result}</div>}
    </div>
  )
}

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
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{background:'rgba(255,255,255,0.97)',borderRadius:20,padding:'40px 44px',width:420,boxShadow:'0 20px 60px rgba(0,0,0,0.35)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:64,height:64,background:`linear-gradient(135deg,${T.skyBlue},${T.deepBlue})`,borderRadius:16,display:'flex',alignItems:'center',justifyContent:'center',fontSize:32,margin:'0 auto 16px'}}>🏛️</div>
          <div style={{fontWeight:800,fontSize:24,color:T.deepBlue}}>SERCOOP.PSU</div>
          <div style={{fontSize:13,color:T.gray600,marginTop:4}}>ระบบสารบรรณอิเล็กทรอนิกส์</div>
          <div style={{fontSize:11,color:T.gray400}}>สหกรณ์บริการมหาวิทยาลัยสงขลานครินทร์ จำกัด</div>
        </div>
        {err&&<div style={{background:T.redLight,color:T.red,borderRadius:8,padding:'9px 14px',fontSize:13,marginBottom:16,textAlign:'center',fontWeight:600}}>{err}</div>}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:T.gray600,display:'block',marginBottom:5,fontWeight:600}}>อีเมล</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="email@sercoop.psu.ac.th" style={{...inpStyle,padding:'10px 14px'}} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
        </div>
        <div style={{marginBottom:24}}>
          <label style={{fontSize:13,color:T.gray600,display:'block',marginBottom:5,fontWeight:600}}>รหัสผ่าน</label>
          <input value={pass} onChange={e=>setPass(e.target.value)} type="password" placeholder="••••••••" style={{...inpStyle,padding:'10px 14px'}} onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
        </div>
        <button onClick={doLogin} disabled={loading} style={{width:'100%',background:loading?T.gray200:`linear-gradient(135deg,${T.skyBlue},${T.deepBlue})`,color:loading?T.gray400:'#fff',border:'none',borderRadius:10,padding:'12px',fontWeight:800,fontSize:15,fontFamily:'Sarabun',cursor:loading?'not-allowed':'pointer'}}>
          {loading?'⏳ กำลังเข้าสู่ระบบ...':'🔐 เข้าสู่ระบบ'}
        </button>
      </div>
    </div>
  )
}

function Sidebar({page,setPage,user,userRole,onLogout}){
  const role=ROLES[userRole?.role]||ROLES.staff
  const menus=[
    {key:'dashboard',icon:'🏠',label:'หน้าหลัก',show:true},
    {key:'doc',icon:'📋',label:'เกษียณหนังสือ',show:true},
    {key:'incoming',icon:'📥',label:'หนังสือรับ',show:true},
    {key:'workflow',icon:'⚙️',label:'ติดตาม Workflow',show:true},
    {key:'budget',icon:'💰',label:'งบประมาณ',show:true},
    {key:'regulations',icon:'⚖️',label:'ฐานข้อมูลอ้างอิง',show:true},
    {key:'reports',icon:'📊',label:'รายงานสรุป',show:true},
    {key:'admin',icon:'🛡️',label:'ผู้ดูแลระบบ',show:role.canAdmin},
  ].filter(m=>m.show)
  return(
    <div style={{width:224,background:T.sidebarBg,display:'flex',flexDirection:'column',flexShrink:0}}>
      <div style={{padding:'14px 16px',background:'rgba(0,0,0,0.3)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{width:40,height:40,background:`linear-gradient(135deg,${T.skyBlue},${T.deepBlue})`,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🏛️</div>
          <div><div style={{color:'#fff',fontWeight:800,fontSize:12}}>SERCOOP.PSU</div><div style={{color:'rgba(255,255,255,0.4)',fontSize:10}}>ระบบสารบรรณอิเล็กทรอนิกส์</div></div>
        </div>
      </div>
      <div style={{padding:'10px 14px',background:'rgba(0,0,0,0.2)',borderBottom:'1px solid rgba(255,255,255,0.07)'}}>
        <div style={{display:'flex',alignItems:'center',gap:8}}>
          <div style={{width:32,height:32,background:`linear-gradient(135deg,${role.color},${T.deepBlue})`,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13}}>
            {(userRole?.full_name||user?.email||'?')[0].toUpperCase()}
          </div>
          <div style={{minWidth:0}}>
            <div style={{color:'#fff',fontSize:11,fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{userRole?.full_name||user?.email?.split('@')[0]}</div>
            <div style={{background:role.color+'33',color:role.color,borderRadius:3,padding:'1px 6px',fontSize:10,fontWeight:700,display:'inline-block'}}>{role.label}</div>
          </div>
        </div>
        {userRole?.dept&&<div style={{color:'rgba(255,255,255,0.4)',fontSize:10,marginTop:3}}>📍 {userRole.dept}</div>}
      </div>
      <div style={{flex:1,padding:'8px',overflowY:'auto'}}>
        {menus.map(m=>(
          <div key={m.key} onClick={()=>setPage(m.key)} style={{display:'flex',alignItems:'center',gap:9,padding:'9px 10px',borderRadius:7,marginBottom:2,cursor:'pointer',fontSize:13,background:page===m.key?`${T.skyBlue}25`:'transparent',color:page===m.key?'#fff':'rgba(255,255,255,0.6)',fontWeight:page===m.key?700:400,borderLeft:page===m.key?`3px solid ${T.skyBlue}`:'3px solid transparent'}}
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
      <div><div style={{fontWeight:800,fontSize:17,color:T.deepBlue}}>{title}</div>{subtitle&&<div style={{fontSize:12,color:T.gray400}}>{subtitle}</div>}</div>
      <div style={{fontSize:12,color:T.gray400}}>{now}</div>
    </div>
  )
}

function PageDashboard({docs,setPage}){
  const stats=[
    {label:'เอกสารทั้งหมด',value:docs.length,icon:'📄',color:T.skyBlue},
    {label:'รอดำเนินการ',value:docs.filter(d=>!d.status||d.status==='pending').length,icon:'⏳',color:'#f57f17'},
    {label:'อนุมัติแล้ว',value:docs.filter(d=>d.status==='approved').length,icon:'✅',color:T.green},
    {label:'งบรออนุมัติ',value:'฿'+fmtMoney(docs.filter(d=>d.budget>0&&(!d.status||d.status==='pending')).reduce((a,b)=>a+(Number(b.budget)||0),0)),icon:'💰',color:T.deepBlue},
  ]
  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:14,marginBottom:20}}>
        {stats.map(s=>(
          <div key={s.label} style={{background:'#fff',borderRadius:12,padding:'16px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${s.color}`}}>
            <div style={{fontSize:22}}>{s.icon}</div>
            <div style={{fontSize:26,fontWeight:800,color:s.color,marginTop:4}}>{s.value}</div>
            <div style={{fontSize:12,color:T.gray400}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14,marginBottom:16}}>
        {[{l:'บันทึกข้อความ',k:'memo',icon:'📝',c:T.skyBlue,cats:MEMO_CATS},{l:'หนังสือส่ง',k:'outgoing',icon:'📤',c:T.green,cats:OUT_CATS},{l:'หนังสือรับ',k:'incoming',icon:'📥',c:T.orange,cats:[]}].map(t=>(
          <div key={t.k} style={{background:'#fff',borderRadius:12,padding:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
              <span style={{fontSize:18}}>{t.icon}</span>
              <div style={{fontWeight:700,color:T.deepBlue,fontSize:13}}>{t.l}</div>
              <span style={{marginLeft:'auto',background:t.c+'22',color:t.c,borderRadius:20,padding:'2px 8px',fontSize:12,fontWeight:700}}>{docs.filter(d=>d.parent_type===t.k).length}</span>
            </div>
            {t.cats.slice(0,5).map(c=>{
              const cnt=docs.filter(d=>d.category_code===c.code).length
              return(<div key={c.code} style={{display:'flex',justifyContent:'space-between',padding:'3px 0',fontSize:12,borderBottom:`1px solid ${T.gray100}`}}><span style={{color:T.gray600}}>{c.icon} {c.name}</span><span style={{fontWeight:700,color:cnt>0?t.c:T.gray400}}>{cnt}</span></div>)
            })}
          </div>
        ))}
      </div>
      <div style={{background:'#fff',borderRadius:12,padding:'14px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
          <div style={{fontWeight:700,color:T.deepBlue,fontSize:14}}>📋 เอกสารล่าสุด</div>
          <Btn sm outline color={T.skyBlue} onClick={()=>setPage('doc')}>ดูทั้งหมด →</Btn>
        </div>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
          <thead><tr style={{background:T.gray50}}>{['เลขที่','หมวด','เรื่อง','หน่วยงาน','งบ','สถานะ'].map(h=><th key={h} style={{padding:'7px 10px',textAlign:'left',color:T.gray600,fontWeight:600,borderBottom:`1px solid ${T.gray200}`}}>{h}</th>)}</tr></thead>
          <tbody>{docs.slice(0,5).map((d,i)=>(
            <tr key={d.id} style={{borderBottom:`1px solid ${T.gray100}`,background:i%2===0?'#fff':T.gray50}}>
              <td style={{padding:'7px 10px',fontWeight:700,color:T.skyBlue}}>{d.id}</td>
              <td style={{padding:'7px 10px'}}><span style={{background:T.lightBlue,color:T.deepBlue,borderRadius:3,padding:'1px 6px',fontSize:10,fontWeight:700}}>{d.category_name||'—'}</span></td>
              <td style={{padding:'7px 10px',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.subject}</td>
              <td style={{padding:'7px 10px',color:T.gray400}}>{d.unit_name||d.dept||'—'}</td>
              <td style={{padding:'7px 10px',fontWeight:600,color:d.budget>0?T.green:T.gray400}}>{d.budget>0?`฿${fmtMoney(d.budget)}`:'—'}</td>
              <td style={{padding:'7px 10px'}}><Badge status={d.status||'pending'}/></td>
            </tr>
          ))}</tbody>
        </table>
        {docs.length===0&&<div style={{padding:24,textAlign:'center',color:T.gray400}}>ยังไม่มีเอกสาร</div>}
      </div>
    </div>
  )
}

function PageBudget(){
  const [budgets,setBudgets]=useState([])
  const [loading,setLoading]=useState(true)
  const [showAdd,setShowAdd]=useState(false)
  const [form,setForm]=useState({code:'',name:'',level:2,annual_budget:'',allow_overspend:false,allow_average:true,sort_order:0})
  const [msg,setMsg]=useState('')
  const [expanded,setExpanded]=useState({})

  useEffect(()=>{
    supabase.from('budget_categories').select('*').order('level').order('sort_order').then(({data})=>{if(data)setBudgets(data);setLoading(false)})
  },[])

  const parents=budgets.filter(b=>b.level===1)
  const getChildren=pc=>budgets.filter(b=>b.level===2&&b.code.startsWith(pc+'-'))
  const pct=b=>b.annual_budget>0?Math.min(100,(b.used_budget/b.annual_budget)*100):0

  const handleAdd=async()=>{
    if(!form.code||!form.name){setMsg('❌ กรุณากรอกรหัสและชื่อ');return}
    const{error}=await supabase.from('budget_categories').insert({...form,annual_budget:parseFloat(form.annual_budget)||0,used_budget:0})
    if(error){setMsg('❌ '+error.message);return}
    setMsg('✅ เพิ่มสำเร็จ!')
    const{data}=await supabase.from('budget_categories').select('*').order('level').order('sort_order')
    if(data)setBudgets(data)
    setShowAdd(false)
    setForm({code:'',name:'',level:2,annual_budget:'',allow_overspend:false,allow_average:true,sort_order:0})
  }

  const total={budget:parents.reduce((a,b)=>a+(b.annual_budget||0),0),used:parents.reduce((a,b)=>a+(b.used_budget||0),0)}

  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      {msg&&<div style={{background:msg.includes('✅')?T.greenLight:T.redLight,color:msg.includes('✅')?T.green:T.red,borderRadius:8,padding:'10px 16px',marginBottom:14,fontWeight:600}}>{msg}</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {[{label:'งบประมาณรวม',value:`฿${fmtMoney(total.budget)}`,icon:'💼',c:T.deepBlue},{label:'ใช้ไปแล้ว',value:`฿${fmtMoney(total.used)}`,icon:'📤',c:T.orange},{label:'คงเหลือ',value:`฿${fmtMoney(total.budget-total.used)}`,icon:'💰',c:T.green},{label:'% ใช้งบ',value:`${total.budget>0?((total.used/total.budget)*100).toFixed(1):0}%`,icon:'📊',c:T.skyBlue}].map(s=>(
          <div key={s.label} style={{background:'#fff',borderRadius:10,padding:'14px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${s.c}`}}>
            <div style={{fontSize:20}}>{s.icon}</div>
            <div style={{fontSize:20,fontWeight:800,color:s.c,marginTop:4}}>{s.value}</div>
            <div style={{fontSize:11,color:T.gray400}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
        <div style={{fontWeight:700,color:T.deepBlue,fontSize:15}}>💰 งบประมาณแยกหมวด</div>
        <Btn color={T.deepBlue} onClick={()=>setShowAdd(true)}>＋ เพิ่มหมวดงบ</Btn>
      </div>
      {loading?<div style={{textAlign:'center',padding:40,color:T.gray400}}>⏳</div>:(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {parents.map(p=>{
            const ch=getChildren(p.code)
            const pp=pct(p)
            const rem=(p.annual_budget||0)-(p.used_budget||0)
            const isExp=expanded[p.code]
            return(
              <div key={p.id} style={{background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{padding:'14px 16px',cursor:'pointer',display:'flex',alignItems:'center',gap:12,background:T.gray50,borderBottom:isExp?`1px solid ${T.gray200}`:'none'}}
                  onClick={()=>setExpanded(prev=>({...prev,[p.code]:!prev[p.code]}))}>
                  <span style={{fontSize:14,color:T.gray400,transform:isExp?'rotate(90deg)':'none',display:'inline-block',transition:'transform 0.2s'}}>▶</span>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <div style={{fontWeight:700,color:T.deepBlue}}>{p.name}</div>
                      <div style={{display:'flex',gap:12,fontSize:12}}>
                        <span>งบ: <b style={{color:T.deepBlue}}>฿{fmtMoney(p.annual_budget)}</b></span>
                        <span>ใช้: <b style={{color:T.orange}}>฿{fmtMoney(p.used_budget)}</b></span>
                        <span>คงเหลือ: <b style={{color:rem>=0?T.green:T.red}}>฿{fmtMoney(rem)}</b></span>
                      </div>
                    </div>
                    <div style={{height:6,background:T.gray200,borderRadius:3}}>
                      <div style={{height:6,borderRadius:3,width:`${Math.min(100,pp)}%`,background:pp>90?T.red:pp>70?T.orange:`linear-gradient(90deg,${T.skyBlue},${T.deepBlue})`}}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'space-between',marginTop:3,fontSize:11,color:T.gray400}}>
                      <span>{pp.toFixed(1)}% ใช้แล้ว</span>
                      <div style={{display:'flex',gap:4}}>
                        {p.allow_average&&<span style={{background:T.lightBlue,color:T.skyBlue,borderRadius:3,padding:'0 5px',fontWeight:700}}>ถัวเฉลี่ยได้</span>}
                        {p.allow_overspend&&<span style={{background:T.redLight,color:T.red,borderRadius:3,padding:'0 5px',fontWeight:700}}>ใช้เกินได้</span>}
                      </div>
                    </div>
                  </div>
                </div>
                {isExp&&(
                  <div>
                    {ch.map(c=>{
                      const cp=pct(c);const cr=(c.annual_budget||0)-(c.used_budget||0)
                      return(
                        <div key={c.id} style={{padding:'10px 16px 10px 52px',borderBottom:`1px solid ${T.gray100}`}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                            <div style={{fontSize:13,fontWeight:600}}>└ {c.name} <span style={{fontSize:10,color:T.gray400}}>({c.code})</span></div>
                            <div style={{display:'flex',gap:10,fontSize:12}}>
                              <span>฿{fmtMoney(c.annual_budget)}</span>
                              <span style={{color:T.orange}}>ใช้ ฿{fmtMoney(c.used_budget)}</span>
                              <span style={{color:cr>=0?T.green:T.red}}>คงเหลือ ฿{fmtMoney(cr)}</span>
                            </div>
                          </div>
                          <div style={{height:5,background:T.gray100,borderRadius:3}}><div style={{height:5,borderRadius:3,width:`${Math.min(100,cp)}%`,background:cp>90?T.red:cp>70?T.orange:T.skyBlue}}/></div>
                        </div>
                      )
                    })}
                    {ch.length===0&&<div style={{padding:'10px 16px 10px 52px',fontSize:12,color:T.gray400}}>ยังไม่มีหมวดย่อย</div>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
      {showAdd&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
          <div style={{background:'#fff',borderRadius:16,width:480,padding:28,boxShadow:'0 8px 40px rgba(0,0,0,0.2)'}}>
            <div style={{fontWeight:700,fontSize:16,color:T.deepBlue,marginBottom:18}}>💰 เพิ่มหมวดงบประมาณ</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:12}}>
              <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>ระดับ</label>
                <select value={form.level} onChange={e=>setForm(p=>({...p,level:parseInt(e.target.value)}))} style={inpStyle}><option value={1}>หมวดหลัก</option><option value={2}>หมวดย่อย</option></select>
              </div>
              <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>รหัส *</label><input value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} placeholder="เช่น OP-NEW" style={inpStyle}/></div>
              <div style={{gridColumn:'span 2'}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>ชื่อหมวด *</label><input value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} style={inpStyle}/></div>
              <div style={{gridColumn:'span 2'}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>งบประมาณ (บาท)</label><input type="number" value={form.annual_budget} onChange={e=>setForm(p=>({...p,annual_budget:e.target.value}))} style={inpStyle}/></div>
            </div>
            <div style={{display:'flex',gap:16,marginBottom:14}}>
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}><input type="checkbox" checked={form.allow_average} onChange={e=>setForm(p=>({...p,allow_average:e.target.checked}))}/>ถัวเฉลี่ยได้</label>
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}><input type="checkbox" checked={form.allow_overspend} onChange={e=>setForm(p=>({...p,allow_overspend:e.target.checked}))}/>ใช้เกินงบได้</label>
            </div>
            {msg&&<div style={{fontSize:12,color:msg.includes('✅')?T.green:T.red,marginBottom:10,fontWeight:600}}>{msg}</div>}
            <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
              <Btn onClick={()=>setShowAdd(false)} outline color={T.gray400}>ยกเลิก</Btn>
              <Btn onClick={handleAdd} color={T.deepBlue}>💾 บันทึก</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PageWorkflow({docs}){
  const [sel,setSel]=useState(null)
  const [steps,setSteps]=useState([])
  const [comment,setComment]=useState('')
  const [loading,setLoading]=useState(false)
  const [msg,setMsg]=useState('')

  const loadSteps=async(docId)=>{
    const{data}=await supabase.from('workflow_steps').select('*').eq('document_id',docId).order('step_order')
    if(data)setSteps(data)
  }

  const handleAction=async(stepId,action)=>{
    setLoading(true)
    const now=new Date().toISOString()
    await supabase.from('workflow_steps').update({status:action,approver_comment:comment,approved_at:now}).eq('id',stepId)
    if(action==='approved'){
      const cur=steps.find(s=>s.id===stepId)
      const nxt=steps.find(s=>s.step_order===cur.step_order+1)
      if(nxt)await supabase.from('workflow_steps').update({status:'pending'}).eq('id',nxt.id)
      else await supabase.from('documents').update({status:'approved'}).eq('id',sel.id)
    }
    if(action==='rejected'||action==='revise'){
      await supabase.from('documents').update({status:action}).eq('id',sel.id)
    }
    await loadSteps(sel.id)
    setComment('')
    setMsg(`✅ ${action==='approved'?'อนุมัติ':action==='rejected'?'ไม่อนุมัติ':'แจ้งแก้ไข'}เรียบร้อย`)
    setLoading(false)
  }

  const sc={done:{bg:'#e8f5e9',c:'#2e7d32'},pending:{bg:'#fff8e1',c:'#f57f17'},approved:{bg:'#e8f5e9',c:'#2e7d32'},rejected:{bg:'#ffebee',c:'#c62828'},revise:{bg:'#fff3e0',c:'#e65100'},waiting:{bg:'#e3f2fd',c:'#1565c0'}}

  return(
    <div style={{display:'flex',flex:1,overflow:'hidden'}}>
      <div style={{width:300,borderRight:`1px solid ${T.gray200}`,overflowY:'auto',background:'#fff',flexShrink:0}}>
        <div style={{padding:'12px 14px',fontWeight:700,color:T.deepBlue,borderBottom:`1px solid ${T.gray200}`,fontSize:13}}>⚙️ เอกสารรอดำเนินการ</div>
        {docs.filter(d=>!d.status||d.status==='pending'||d.status==='revise').map(d=>(
          <div key={d.id} onClick={()=>{setSel(d);loadSteps(d.id);setMsg('')}} style={{padding:'12px 14px',cursor:'pointer',borderBottom:`1px solid ${T.gray100}`,background:sel?.id===d.id?T.lightBlue:'#fff'}}
            onMouseEnter={e=>{if(sel?.id!==d.id)e.currentTarget.style.background=T.gray50}}
            onMouseLeave={e=>{if(sel?.id!==d.id)e.currentTarget.style.background='#fff'}}
          >
            <div style={{fontWeight:700,color:T.skyBlue,fontSize:12}}>{d.id}</div>
            <div style={{fontSize:13,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.subject}</div>
            <div style={{fontSize:11,color:T.gray400,marginTop:2}}>{d.category_name||d.type||'—'}</div>
            {d.budget>0&&<div style={{fontSize:11,fontWeight:700,color:T.green}}>฿{fmtMoney(d.budget)}</div>}
            <Badge status={d.status||'pending'}/>
          </div>
        ))}
        {docs.filter(d=>!d.status||d.status==='pending'||d.status==='revise').length===0&&(
          <div style={{padding:40,textAlign:'center',color:T.gray400,fontSize:13}}>ไม่มีเอกสารรอดำเนินการ</div>
        )}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'20px 24px'}}>
        {!sel?(
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100%',flexDirection:'column',gap:12,color:T.gray400}}>
            <div style={{fontSize:48}}>⚙️</div>
            <div style={{fontSize:15,fontWeight:600,color:T.deepBlue}}>เลือกเอกสารทางซ้ายเพื่อดู Workflow</div>
          </div>
        ):(
          <>
            <div style={{background:'#fff',borderRadius:12,padding:16,marginBottom:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <div style={{fontWeight:800,color:T.deepBlue,fontSize:15,marginBottom:4}}>{sel.subject}</div>
              <div style={{display:'flex',gap:12,fontSize:12,color:T.gray400,flexWrap:'wrap'}}>
                <span>เลขที่: <b style={{color:T.skyBlue}}>{sel.id}</b></span>
                <span>ประเภท: <b>{sel.category_name||sel.type}</b></span>
                <span>หน่วยงาน: <b>{sel.unit_name||sel.dept||'—'}</b></span>
                {sel.budget>0&&<span>งบ: <b style={{color:T.green}}>฿{fmtMoney(sel.budget)}</b></span>}
              </div>
            </div>
            {msg&&<div style={{background:T.greenLight,color:T.green,borderRadius:8,padding:'10px 14px',marginBottom:12,fontWeight:600}}>{msg}</div>}
            <div style={{background:'#fff',borderRadius:12,padding:18,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:14}}>📋 ขั้นตอน Workflow</div>
              {steps.map((s,i)=>{
                const scc=sc[s.status]||sc.waiting
                const isPending=s.status==='pending'
                return(
                  <div key={s.id} style={{display:'flex',gap:12,marginBottom:isPending?0:14}}>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:36,flexShrink:0}}>
                      <div style={{width:32,height:32,borderRadius:'50%',background:isPending?T.amber:scc.bg,border:`2px solid ${isPending?T.amber:scc.c}`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,color:isPending?'#fff':scc.c,boxShadow:isPending?`0 0 0 4px ${T.amberLight}`:undefined}}>
                        {s.status==='done'||s.status==='approved'?'✓':s.status==='rejected'?'✗':s.status==='pending'?'!':i+1}
                      </div>
                      {i<steps.length-1&&<div style={{width:2,flex:1,minHeight:14,background:s.status==='done'||s.status==='approved'?T.green:T.gray200,margin:'3px 0'}}/>}
                    </div>
                    <div style={{flex:1,marginBottom:isPending?14:0}}>
                      <div style={{background:isPending?T.amberLight:'#fff',border:`1px solid ${isPending?T.amber:T.gray200}`,borderRadius:9,padding:'10px 14px'}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:6}}>
                          <div>
                            <div style={{fontWeight:700,color:T.deepBlue,fontSize:13}}>{s.role_name}</div>
                            <div style={{fontSize:12,color:T.gray600}}>{s.action_label}</div>
                            {s.approver_name&&<div style={{fontSize:11,color:T.gray400,marginTop:2}}>ผู้ดำเนินการ: {s.approver_name}</div>}
                            {s.approver_comment&&<div style={{fontSize:12,color:T.gray600,marginTop:4,fontStyle:'italic'}}>💬 "{s.approver_comment}"</div>}
                            {s.approved_at&&<div style={{fontSize:11,color:T.gray400,marginTop:2}}>⏱ {new Date(s.approved_at).toLocaleString('th-TH')}</div>}
                          </div>
                          <span style={{background:scc.bg,color:scc.c,borderRadius:20,padding:'2px 10px',fontSize:11,fontWeight:700}}>
                            {s.status==='done'?'✅ เสร็จ':s.status==='approved'?'✔ อนุมัติ':s.status==='rejected'?'✗ ไม่อนุมัติ':s.status==='pending'?'⏳ รอดำเนินการ':s.status==='revise'?'🔄 แก้ไข':'🔵 รอคิว'}
                          </span>
                        </div>
                        {isPending&&(
                          <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.amber}44`}}>
                            <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="ความคิดเห็น / เหตุผล (ถ้ามี)" rows={2} style={{...inpStyle,marginBottom:8,resize:'vertical'}}/>
                            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
                              <Btn sm color={T.green} onClick={()=>handleAction(s.id,'approved')} disabled={loading}>✔ อนุมัติ/เห็นชอบ</Btn>
                              <Btn sm color={T.red} onClick={()=>handleAction(s.id,'rejected')} disabled={loading}>✗ ไม่อนุมัติ</Btn>
                              <Btn sm color={T.orange} onClick={()=>handleAction(s.id,'revise')} disabled={loading}>🔄 แจ้งแก้ไข</Btn>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              {steps.length===0&&<div style={{textAlign:'center',color:T.gray400,padding:24}}>ยังไม่มีขั้นตอน Workflow</div>}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function PageIncoming({user,userRole}){
  const [docs,setDocs]=useState([])
  const [loading,setLoading]=useState(true)
  const [filter,setFilter]=useState('all')
  const [search,setSearch]=useState('')
  const [showForm,setShowForm]=useState(false)
  const [msg,setMsg]=useState('')
  const refs={id:useRef(''),subject:useRef(''),from:useRef(''),date:useRef(''),ref_doc:useRef(''),content:useRef(''),note:useRef('')}
  const [inType,setInType]=useState('external')
  const [files,setFiles]=useState([])
  const [saving,setSaving]=useState(false)
  const onAddFile=useCallback(f=>setFiles(p=>[...p,f]),[])
  const onRemoveFile=useCallback(id=>setFiles(p=>p.filter(f=>f.id!==id)),[])

  const load=()=>{
    supabase.from('documents').select('*').eq('parent_type','incoming').order('created_at',{ascending:false}).then(({data})=>{if(data)setDocs(data);setLoading(false)})
  }
  useEffect(()=>{load()},[])

  const handleSave=async()=>{
    if(!refs.subject.current.trim()){setMsg('❌ กรุณากรอกเรื่อง');return}
    setSaving(true)
    const docId=refs.id.current||`รบ.${new Date().getFullYear()+543}/${String(Date.now()).slice(-4)}`
    const payload={id:docId,subject:refs.subject.current,parent_type:'incoming',type:inType==='internal'?'หนังสือรับภายใน':'หนังสือรับภายนอก',category_code:inType==='internal'?'IN-INT':'IN-EXT',category_name:inType==='internal'?'หนังสือรับภายใน':'หนังสือรับภายนอก',from_person:refs.from.current,doc_date:refs.date.current,ref_doc_id:refs.ref_doc.current,content:refs.content.current,note:refs.note.current,status:'pending',created_by:user?.id,unit_name:userRole?.dept||''}
    const{error}=await supabase.from('documents').insert(payload)
    if(!error){
      for(const f of files){
        const path=`incoming/${docId}/${Date.now()}_${f.name}`
        const{error:e2}=await supabase.storage.from('documents').upload(path,f.file)
        if(!e2)await supabase.from('document_files').insert({document_id:docId,file_name:f.name,file_path:path,file_size:f.size,file_type:getExt(f.name)})
      }
      setMsg('✅ บันทึกสำเร็จ!')
      load();setShowForm(false);setFiles([])
    }else setMsg('❌ '+error.message)
    setSaving(false)
  }

  const filtered=docs.filter(d=>{
    const mf=filter==='all'||(filter==='internal'&&d.type?.includes('ภายใน'))||(filter==='external'&&d.type?.includes('ภายนอก'))
    const ms=d.subject?.includes(search)||d.id?.includes(search)||d.from_person?.includes(search)
    return mf&&ms
  })

  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      {msg&&<div style={{background:msg.includes('✅')?T.greenLight:T.redLight,color:msg.includes('✅')?T.green:T.red,borderRadius:8,padding:'10px 14px',marginBottom:12,fontWeight:600}}>{msg}</div>}
      <div style={{display:'flex',gap:10,marginBottom:12,alignItems:'center',flexWrap:'wrap'}}>
        <div style={{display:'flex',flex:1,maxWidth:360,border:`1px solid ${T.gray200}`,borderRadius:7,overflow:'hidden'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหา..." style={{flex:1,border:'none',padding:'8px 12px',fontSize:13,fontFamily:'Sarabun',outline:'none'}}/>
          <div style={{padding:'0 10px',display:'flex',alignItems:'center',background:T.skyBlue,color:'#fff'}}>🔍</div>
        </div>
        <div style={{display:'flex',gap:4}}>
          {[{k:'all',l:'ทั้งหมด'},{k:'internal',l:'📄 ภายใน'},{k:'external',l:'📬 ภายนอก'}].map(t=>(
            <button key={t.k} onClick={()=>setFilter(t.k)} style={{padding:'6px 10px',border:`1px solid ${filter===t.k?T.skyBlue:T.gray200}`,borderRadius:6,background:filter===t.k?T.skyBlue:'#fff',color:filter===t.k?'#fff':T.gray600,fontFamily:'Sarabun',fontSize:12,cursor:'pointer',fontWeight:filter===t.k?700:400}}>{t.l}</button>
          ))}
        </div>
        <Btn color={T.deepBlue} onClick={()=>setShowForm(true)}>＋ รับหนังสือ</Btn>
      </div>
      {loading?<div style={{textAlign:'center',padding:40,color:T.gray400}}>⏳</div>:(
        <div style={{background:'#fff',borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:T.deepBlue}}>{['เลขที่','ประเภท','เรื่อง','จาก','วันที่','อ้างถึง','สถานะ'].map(h=><th key={h} style={{padding:'9px 12px',textAlign:'left',color:'#fff',fontWeight:600,fontSize:12}}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((d,i)=>(
                <tr key={d.id} style={{borderBottom:`1px solid ${T.gray100}`,background:i%2===0?'#fff':T.gray50}}>
                  <td style={{padding:'9px 12px',fontWeight:700,color:T.skyBlue,fontSize:12}}>{d.id}</td>
                  <td style={{padding:'9px 12px'}}><span style={{background:d.type?.includes('ภายใน')?T.lightBlue:T.orangeLight,color:d.type?.includes('ภายใน')?T.deepBlue:T.orange,borderRadius:4,padding:'2px 7px',fontSize:11,fontWeight:700}}>{d.type}</span></td>
                  <td style={{padding:'9px 12px',fontSize:13,maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.subject}</td>
                  <td style={{padding:'9px 12px',fontSize:12,color:T.gray600}}>{d.from_person||'—'}</td>
                  <td style={{padding:'9px 12px',fontSize:12,color:T.gray400}}>{d.doc_date||'—'}</td>
                  <td style={{padding:'9px 12px',fontSize:12,color:d.ref_doc_id?T.skyBlue:T.gray400}}>{d.ref_doc_id||'—'}</td>
                  <td style={{padding:'9px 12px'}}><Badge status={d.status||'pending'}/></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0&&<div style={{padding:32,textAlign:'center',color:T.gray400}}>ไม่พบหนังสือรับ</div>}
        </div>
      )}
      {showForm&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
          <div style={{background:'#fff',borderRadius:16,width:560,maxHeight:'88vh',overflowY:'auto',boxShadow:'0 8px 40px rgba(0,0,0,0.25)'}}>
            <div style={{background:`linear-gradient(135deg,${T.deepBlue},${T.midBlue})`,color:'#fff',padding:'16px 20px',borderRadius:'16px 16px 0 0',display:'flex',justifyContent:'space-between'}}>
              <span style={{fontWeight:700,fontSize:16}}>📥 รับหนังสือ</span>
              <button onClick={()=>setShowForm(false)} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{padding:22}}>
              <div style={{display:'flex',gap:8,marginBottom:14}}>
                {[{k:'external',l:'📬 ภายนอก'},{k:'internal',l:'📄 ภายใน'}].map(t=>(
                  <button key={t.k} onClick={()=>setInType(t.k)} style={{flex:1,padding:'10px',border:`2px solid ${inType===t.k?T.skyBlue:T.gray200}`,borderRadius:8,background:inType===t.k?T.lightBlue:'#fff',color:inType===t.k?T.deepBlue:T.gray600,fontFamily:'Sarabun',fontWeight:inType===t.k?700:400,cursor:'pointer'}}>{t.l}</button>
                ))}
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 14px'}}>
                <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>เลขที่</label><input defaultValue={refs.id.current} onChange={e=>refs.id.current=e.target.value} style={inpStyle}/></div>
                <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>วันที่รับ</label><input type="date" defaultValue={refs.date.current} onChange={e=>refs.date.current=e.target.value} style={inpStyle}/></div>
                <div style={{gridColumn:'span 2'}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>เรื่อง *</label><input defaultValue={refs.subject.current} onChange={e=>refs.subject.current=e.target.value} style={inpStyle}/></div>
                <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>จาก</label><input defaultValue={refs.from.current} onChange={e=>refs.from.current=e.target.value} style={inpStyle}/></div>
                <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>อ้างถึงหนังสือส่งเลขที่</label><input defaultValue={refs.ref_doc.current} onChange={e=>refs.ref_doc.current=e.target.value} placeholder="หส.2568/xxx" style={inpStyle}/></div>
                <div style={{gridColumn:'span 2'}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>สรุปเนื้อหา</label><textarea defaultValue={refs.content.current} onChange={e=>refs.content.current=e.target.value} rows={3} style={{...inpStyle,resize:'vertical'}}/></div>
                <div style={{gridColumn:'span 2'}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>หมายเหตุ</label><textarea defaultValue={refs.note.current} onChange={e=>refs.note.current=e.target.value} rows={2} style={{...inpStyle,resize:'vertical'}}/></div>
              </div>
              <div style={{marginTop:12}}><div style={{fontWeight:700,color:T.deepBlue,fontSize:13,marginBottom:8}}>📎 แนบไฟล์</div><FileZone files={files} onAdd={onAddFile} onRemove={onRemoveFile} savedFiles={[]}/></div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:14}}>
                <Btn onClick={()=>setShowForm(false)} outline color={T.gray400}>ยกเลิก</Btn>
                <Btn onClick={handleSave} disabled={saving} color={T.deepBlue}>{saving?'⏳...':'💾 บันทึก + แจ้งเตือน LINE'}</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PageDocDetail({doc,onBack,onSaved,user,userRole}){
  const isNew=!doc
  const allCats=[...MEMO_CATS,...OUT_CATS]
  const [step,setStep]=useState(isNew?0:1)
  const [parentType,setParentType]=useState(doc?.parent_type||'memo')
  const [category,setCategory]=useState(()=>doc?.category_code?allCats.find(c=>c.code===doc.category_code)||null:null)
  const [budgets,setBudgets]=useState([])
  const [selBudget,setSelBudget]=useState(doc?.budget_category_id||'')
  const [showAI,setShowAI]=useState(false)
  const refs={subject:useRef(doc?.subject||''),id:useRef(doc?.id||''),from:useRef(doc?.from_person||userRole?.full_name||''),to:useRef(doc?.to_person||''),dept:useRef(doc?.dept||userRole?.dept||''),date:useRef(doc?.doc_date||''),budget:useRef(doc?.budget||''),content:useRef(doc?.content||''),note:useRef(doc?.note||'')}
  const [urgent,setUrgent]=useState(doc?.urgent||'ปกติ')
  const [secret,setSecret]=useState(doc?.secret||'ปกติ')
  const [files,setFiles]=useState([])
  const [savedFiles,setSavedFiles]=useState([])
  const [saving,setSaving]=useState(false)
  const [msg,setMsg]=useState('')
  const [budgetVal,setBudgetVal]=useState(parseFloat(doc?.budget)||0)
  const onAddFile=useCallback(f=>setFiles(p=>[...p,f]),[])
  const onRemoveFile=useCallback(id=>setFiles(p=>p.filter(f=>f.id!==id)),[])

  useEffect(()=>{
    supabase.from('budget_categories').select('*').order('level').order('sort_order').then(({data})=>{if(data)setBudgets(data)})
    if(doc?.id)supabase.from('document_files').select('*').eq('document_id',doc.id).then(({data})=>{if(data)setSavedFiles(data)})
  },[doc])

  const handleSave=async(status='pending')=>{
    if(!refs.subject.current.trim()){setMsg('❌ กรุณากรอกเรื่อง');return}
    setSaving(true);setMsg('')
    try{
      const prefix=parentType==='memo'?'บข':parentType==='outgoing'?'หส':'รบ'
      const docId=refs.id.current||`${prefix}.${new Date().getFullYear()+543}/${String(Date.now()).slice(-4)}`
      const storagePath=`${parentType}/${category?.code||'general'}/${docId}`
      const selBudgetObj=budgets.find(b=>b.id===selBudget)
      const payload={id:docId,subject:refs.subject.current,type:category?.name||parentType,parent_type:parentType,category_code:category?.code||null,category_name:category?.name||null,dept:refs.dept.current,doc_date:refs.date.current,urgent,secret,from_person:refs.from.current,to_person:refs.to.current,budget:parseFloat(refs.budget.current)||0,budget_category_id:selBudget||null,budget_category_name:selBudgetObj?.name||null,content:refs.content.current,note:refs.note.current,status,storage_path:storagePath,created_by:user?.id,author_name:userRole?.full_name||'',author_position:userRole?.position||'',unit_name:userRole?.dept||''}
      const{error:e1}=isNew?await supabase.from('documents').insert(payload):await supabase.from('documents').update(payload).eq('id',docId)
      if(e1)throw e1
      for(const f of files){
        const path=`${storagePath}/${Date.now()}_${f.name}`
        const{error:e2}=await supabase.storage.from('documents').upload(path,f.file)
        if(!e2)await supabase.from('document_files').insert({document_id:docId,file_name:f.name,file_path:path,file_size:f.size,file_type:getExt(f.name)})
      }
      if(isNew&&status==='pending'){
        const chain=APPROVAL_CHAIN(refs.budget.current)
        await supabase.from('workflow_steps').insert([
          {document_id:docId,step_order:1,role_name:'เจ้าหน้าที่',action_label:'จัดทำและส่งเอกสาร',status:'done',approver_name:userRole?.full_name||''},
          ...chain.map((c,i)=>({document_id:docId,step_order:i+2,role_name:c.role,action_label:'พิจารณา/อนุมัติ',status:i===0?'pending':'waiting'})),
          {document_id:docId,step_order:chain.length+2,role_name:'เจ้าหน้าที่',action_label:'ดำเนินการและบันทึกในระบบ',status:'waiting'},
        ])
      }
      setMsg(status==='draft'?'✅ บันทึกร่างสำเร็จ!':'✅ ส่ง Workflow สำเร็จ!')
      setTimeout(()=>onSaved(),1200)
    }catch(e){setMsg('❌ '+e.message)}
    setSaving(false)
  }

  const cats=parentType==='memo'?MEMO_CATS:OUT_CATS
  const chain=APPROVAL_CHAIN(budgetVal)
  const parentBudgets=budgets.filter(b=>b.level===1)
  const childBudgets=budgets.filter(b=>b.level===2)

  if(step===0)return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
        <Btn onClick={onBack} outline color={T.gray400}>← กลับ</Btn>
        <div style={{fontWeight:800,fontSize:16,color:T.deepBlue}}>เลือกประเภทเอกสาร</div>
      </div>
      <div style={{background:'#fff',borderRadius:12,padding:24,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',maxWidth:740}}>
        <div style={{display:'flex',gap:8,marginBottom:20}}>
          {[{k:'memo',l:'📝 บันทึกข้อความ'},{k:'outgoing',l:'📤 หนังสือส่ง'}].map(t=>(
            <button key={t.k} onClick={()=>{setParentType(t.k);setCategory(null)}} style={{flex:1,padding:'12px',border:`2px solid ${parentType===t.k?T.skyBlue:T.gray200}`,borderRadius:9,background:parentType===t.k?T.lightBlue:'#fff',color:parentType===t.k?T.deepBlue:T.gray600,fontFamily:'Sarabun',fontWeight:parentType===t.k?700:400,cursor:'pointer'}}>{t.l}</button>
          ))}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
          {cats.map(c=>(
            <div key={c.code} onClick={()=>setCategory(c)} style={{padding:'14px',border:`2px solid ${category?.code===c.code?c.color:T.gray200}`,borderRadius:10,cursor:'pointer',background:category?.code===c.code?c.color+'11':'#fff'}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=c.color}
              onMouseLeave={e=>e.currentTarget.style.borderColor=category?.code===c.code?c.color:T.gray200}
            >
              <div style={{fontSize:22,marginBottom:5}}>{c.icon}</div>
              <div style={{fontSize:12,fontWeight:700,color:category?.code===c.code?c.color:T.gray800}}>{c.name}</div>
              <div style={{fontSize:10,color:c.color,marginTop:2}}>{c.code}</div>
            </div>
          ))}
        </div>
        <div style={{display:'flex',justifyContent:'flex-end',marginTop:20,paddingTop:14,borderTop:`1px solid ${T.gray200}`}}>
          <Btn onClick={()=>setStep(1)} color={T.deepBlue} disabled={!category}>ถัดไป: กรอกข้อมูล →</Btn>
        </div>
      </div>
    </div>
  )

  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14}}>
        {isNew?<Btn onClick={()=>setStep(0)} outline color={T.gray400}>← เปลี่ยนประเภท</Btn>:<Btn onClick={onBack} outline color={T.gray400}>← กลับ</Btn>}
        <div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            {category&&<span style={{fontSize:20}}>{category.icon}</span>}
            <div style={{fontWeight:800,fontSize:16,color:T.deepBlue}}>{isNew?`สร้าง: ${category?.name}`:doc.subject}</div>
          </div>
          <div style={{fontSize:12,color:T.gray400}}>{category?.code} · {isNew?'กรอกข้อมูล':doc.id}</div>
        </div>
        <div style={{marginLeft:'auto'}}>
          <Btn sm outline color={T.skyBlue} onClick={()=>setShowAI(!showAI)}>{showAI?'ปิด AI':'🤖 AI ร่าง'}</Btn>
        </div>
      </div>
      {msg&&<div style={{background:msg.includes('✅')?T.greenLight:T.redLight,color:msg.includes('✅')?T.green:T.red,borderRadius:8,padding:'10px 14px',marginBottom:12,fontWeight:600}}>{msg}</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:16,alignItems:'start'}}>
        <div style={{background:'#fff',borderRadius:12,padding:20,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{background:T.lightBlue,borderRadius:8,padding:'8px 12px',marginBottom:12,fontSize:12,color:T.deepBlue}}>
            <b>✍️ ผู้ออกเอกสาร:</b> {userRole?.full_name||user?.email}{userRole?.position&&` · ${userRole.position}`}{userRole?.dept&&` · ${userRole.dept}`}
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 14px',marginBottom:12}}>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>เลขที่</label><input defaultValue={refs.id.current} onChange={e=>refs.id.current=e.target.value} placeholder="ระบบออกให้อัตโนมัติ" style={inpStyle}/></div>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>วันที่</label><input type="date" defaultValue={refs.date.current} onChange={e=>refs.date.current=e.target.value} style={inpStyle}/></div>
            <div style={{gridColumn:'span 2'}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>เรื่อง *</label><input defaultValue={refs.subject.current} onChange={e=>refs.subject.current=e.target.value} style={inpStyle}/></div>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>จาก</label><input defaultValue={refs.from.current} onChange={e=>refs.from.current=e.target.value} style={inpStyle}/></div>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>ถึง</label><input defaultValue={refs.to.current} onChange={e=>refs.to.current=e.target.value} style={inpStyle}/></div>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>หน่วยงาน</label><input defaultValue={refs.dept.current} onChange={e=>refs.dept.current=e.target.value} style={inpStyle}/></div>
            <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>ชั้นความเร็ว</label><select value={urgent} onChange={e=>setUrgent(e.target.value)} style={inpStyle}>{['ปกติ','ด่วน','ด่วนมาก','ด่วนที่สุด'].map(o=><option key={o}>{o}</option>)}</select></div>
          </div>
          <div style={{background:T.amberLight,borderRadius:8,padding:'12px 14px',marginBottom:12,border:`1px solid ${T.amber}33`}}>
            <div style={{fontWeight:700,color:T.amber,fontSize:13,marginBottom:8}}>💰 งบประมาณ</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 14px'}}>
              <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>หมวดงบประมาณ</label>
                <select value={selBudget} onChange={e=>setSelBudget(e.target.value)} style={inpStyle}>
                  <option value="">-- เลือกหมวดงบ --</option>
                  {parentBudgets.map(b=>(
                    <optgroup key={b.id} label={`${b.name} (คงเหลือ ฿${fmtMoney((b.annual_budget||0)-(b.used_budget||0))})`}>
                      {childBudgets.filter(c=>c.code.startsWith(b.code+'-')).map(c=><option key={c.id} value={c.id}>{c.name} (฿{fmtMoney((c.annual_budget||0)-(c.used_budget||0))})</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>วงเงิน (บาท)</label>
                <input type="number" defaultValue={refs.budget.current} onChange={e=>{refs.budget.current=e.target.value;setBudgetVal(parseFloat(e.target.value)||0)}} style={inpStyle}/>
              </div>
            </div>
            {budgetVal>0&&(
              <div style={{marginTop:8,fontSize:12,color:T.deepBlue}}>
                <b>⚡ เส้นทางอนุมัติ:</b> เจ้าหน้าที่ → {chain.map(c=>c.label).join(' → ')} → ดำเนินการ
              </div>
            )}
            {selBudget&&(()=>{
              const b=budgets.find(x=>x.id===selBudget)
              if(!b)return null
              const rem=(b.annual_budget||0)-(b.used_budget||0)
              return(
                <div style={{marginTop:6,fontSize:11,display:'flex',gap:10,flexWrap:'wrap'}}>
                  <span>งบปี: <b>฿{fmtMoney(b.annual_budget)}</b></span>
                  <span>ใช้: <b style={{color:T.orange}}>฿{fmtMoney(b.used_budget)}</b></span>
                  <span>คงเหลือ: <b style={{color:rem>=0?T.green:T.red}}>฿{fmtMoney(rem)}</b></span>
                  {b.allow_average&&<span style={{background:T.lightBlue,color:T.skyBlue,borderRadius:3,padding:'0 5px',fontWeight:700,fontSize:10}}>ถัวเฉลี่ยได้</span>}
                  {b.allow_overspend&&<span style={{background:T.redLight,color:T.red,borderRadius:3,padding:'0 5px',fontWeight:700,fontSize:10}}>ใช้เกินได้</span>}
                  {budgetVal>0&&budgetVal>rem&&!b.allow_overspend&&<span style={{background:T.redLight,color:T.red,borderRadius:3,padding:'0 5px',fontWeight:700,fontSize:10}}>⚠️ เกินงบ!</span>}
                </div>
              )
            })()}
          </div>
          <div style={{marginBottom:10}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>เนื้อหา</label><textarea defaultValue={refs.content.current} onChange={e=>refs.content.current=e.target.value} rows={4} style={{...inpStyle,resize:'vertical'}}/></div>
          <div style={{marginBottom:12}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>หมายเหตุ</label><textarea defaultValue={refs.note.current} onChange={e=>refs.note.current=e.target.value} rows={2} style={{...inpStyle,resize:'vertical'}}/></div>
          <div style={{paddingTop:12,borderTop:`1px solid ${T.gray200}`}}>
            <div style={{fontWeight:700,color:T.deepBlue,fontSize:13,marginBottom:6}}>📎 แนบไฟล์เอกสาร</div>
            <div style={{fontSize:11,color:T.gray400,marginBottom:6}}>💡 ไม่จำเป็นต้องออกจากระบบ — แนบไฟล์ที่มีอยู่ได้เลย</div>
            <FileZone files={files} onAdd={onAddFile} onRemove={onRemoveFile} savedFiles={savedFiles}/>
          </div>
          <div style={{display:'flex',justifyContent:'flex-end',gap:8,marginTop:14,paddingTop:12,borderTop:`1px solid ${T.gray200}`}}>
            <Btn onClick={onBack} outline color={T.gray400}>ยกเลิก</Btn>
            <Btn onClick={()=>handleSave('draft')} disabled={saving} outline color={T.skyBlue}>💾 ร่าง</Btn>
            <Btn onClick={()=>handleSave('pending')} disabled={saving} color={T.deepBlue}>{saving?'⏳...':'📤 ส่ง Workflow + LINE'}</Btn>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:12}}>
          {showAI&&<AIDraftPanel subject={refs.subject.current} content={refs.content.current} category={category}/>}
          <div style={{background:'#fff',borderRadius:10,padding:14,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:700,color:T.deepBlue,fontSize:13,marginBottom:10}}>⚙️ ขั้นตอนอนุมัติ</div>
            {[{role:'เจ้าหน้าที่',label:userRole?.full_name||'เจ้าหน้าที่',status:'done'},...chain.map(c=>({role:c.role,label:c.label,status:'waiting'})),{role:'เจ้าหน้าที่',label:'ดำเนินการ',status:'waiting'}].map((s,i,a)=>(
              <div key={i} style={{display:'flex',gap:0}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:26}}>
                  <div style={{width:20,height:20,borderRadius:'50%',background:s.status==='done'?T.green:T.gray200,color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:700}}>{s.status==='done'?'✓':i+1}</div>
                  {i<a.length-1&&<div style={{width:2,flex:1,minHeight:10,background:T.gray200,margin:'2px 0'}}/>}
                </div>
                <div style={{flex:1,marginLeft:7,marginBottom:7}}>
                  <div style={{fontSize:11,fontWeight:700,color:T.deepBlue}}>{s.role}</div>
                  <div style={{fontSize:10,color:T.gray400}}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{background:T.greenLight,border:`1px solid ${T.green}44`,borderRadius:10,padding:12}}>
            <div style={{fontWeight:700,color:T.green,fontSize:12,marginBottom:5}}>💬 LINE แจ้งเตือน</div>
            <div style={{fontSize:11,color:'#2e7d32',lineHeight:1.8}}>→ ผู้มีอำนาจแต่ละขั้น<br/>→ เจ้าหน้าที่ที่เกี่ยวข้อง<br/>→ ผู้ส่งเมื่ออนุมัติ/ไม่อนุมัติ</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PageDoc({docs,setDocs,onSelectDoc,user,userRole}){
  const [search,setSearch]=useState('')
  const [filterParent,setFilterParent]=useState('all')
  const [filterCat,setFilterCat]=useState('all')
  const [filterUnit,setFilterUnit]=useState('all')
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

  const units=[...new Set(docs.map(d=>d.unit_name||d.dept).filter(Boolean))]
  const cats=filterParent==='memo'?MEMO_CATS:filterParent==='outgoing'?OUT_CATS:[]
  const filtered=docs.filter(d=>
    (filterParent==='all'||d.parent_type===filterParent)&&
    (filterCat==='all'||d.category_code===filterCat)&&
    (filterUnit==='all'||d.unit_name===filterUnit||d.dept===filterUnit)&&
    (d.subject?.includes(search)||d.id?.includes(search)||d.dept?.includes(search)||d.category_name?.includes(search))
  )

  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',gap:8,marginBottom:10,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',flex:1,maxWidth:320,border:`1px solid ${T.gray200}`,borderRadius:7,overflow:'hidden'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหา..." style={{flex:1,border:'none',padding:'8px 12px',fontSize:13,fontFamily:'Sarabun',outline:'none'}}/>
          <div style={{padding:'0 10px',display:'flex',alignItems:'center',background:T.skyBlue,color:'#fff'}}>🔍</div>
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {[{k:'all',l:'ทั้งหมด'},{k:'memo',l:'📝'},{k:'outgoing',l:'📤'},{k:'incoming',l:'📥'}].map(t=>(
            <button key={t.k} onClick={()=>{setFilterParent(t.k);setFilterCat('all')}} style={{padding:'6px 10px',border:`1px solid ${filterParent===t.k?T.skyBlue:T.gray200}`,borderRadius:6,background:filterParent===t.k?T.skyBlue:'#fff',color:filterParent===t.k?'#fff':T.gray600,fontFamily:'Sarabun',fontSize:12,cursor:'pointer',fontWeight:filterParent===t.k?700:400}}>{t.l}</button>
          ))}
        </div>
        {units.length>0&&(
          <select value={filterUnit} onChange={e=>setFilterUnit(e.target.value)} style={{...inpStyle,width:'auto',padding:'6px 10px',fontSize:12}}>
            <option value="all">ทุกหน่วยงาน</option>
            {units.map(u=><option key={u} value={u}>{u}</option>)}
          </select>
        )}
        <Btn onClick={loadDocs} outline color={T.skyBlue} sm>🔄</Btn>
        {role.canCreate&&<Btn onClick={()=>setShowNew(true)} color={T.deepBlue}>＋ สร้างเอกสาร</Btn>}
      </div>
      {cats.length>0&&(
        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:10}}>
          <button onClick={()=>setFilterCat('all')} style={{padding:'3px 8px',border:`1px solid ${filterCat==='all'?T.deepBlue:T.gray200}`,borderRadius:20,background:filterCat==='all'?T.deepBlue:'#fff',color:filterCat==='all'?'#fff':T.gray600,fontFamily:'Sarabun',fontSize:11,cursor:'pointer'}}>ทั้งหมด</button>
          {cats.map(c=><button key={c.code} onClick={()=>setFilterCat(c.code)} style={{padding:'3px 8px',border:`1px solid ${filterCat===c.code?c.color:T.gray200}`,borderRadius:20,background:filterCat===c.code?c.color+'22':'#fff',color:filterCat===c.code?c.color:T.gray600,fontFamily:'Sarabun',fontSize:11,cursor:'pointer'}}>{c.icon} {c.name}</button>)}
        </div>
      )}
      {loading?<div style={{textAlign:'center',padding:40,color:T.gray400}}>⏳ กำลังโหลด...</div>:(
        <div style={{background:'#fff',borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead><tr style={{background:T.deepBlue}}>{['เลขที่','ประเภท','หมวด','เรื่อง','หน่วยงาน','วันที่','งบ','สถานะ',''].map(h=><th key={h} style={{padding:'9px 10px',textAlign:'left',color:'#fff',fontWeight:600,fontSize:11}}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((d,i)=>(
                <tr key={d.id} style={{borderBottom:`1px solid ${T.gray100}`,background:i%2===0?'#fff':T.gray50,cursor:'pointer'}} onClick={()=>onSelectDoc(d)} onMouseEnter={e=>e.currentTarget.style.background=T.lightBlue} onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':T.gray50}>
                  <td style={{padding:'9px 10px',fontWeight:700,color:T.skyBlue,fontSize:11,whiteSpace:'nowrap'}}>{d.id}</td>
                  <td style={{padding:'9px 10px'}}><span style={{fontSize:14}}>{d.parent_type==='memo'?'📝':d.parent_type==='outgoing'?'📤':'📥'}</span></td>
                  <td style={{padding:'9px 10px',fontSize:11,color:T.gray600,whiteSpace:'nowrap'}}>{d.category_name||'—'}</td>
                  <td style={{padding:'9px 10px',fontSize:12,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.subject}</td>
                  <td style={{padding:'9px 10px',fontSize:11,color:T.gray400}}>{d.unit_name||d.dept||'—'}</td>
                  <td style={{padding:'9px 10px',fontSize:11,color:T.gray400,whiteSpace:'nowrap'}}>{d.doc_date||'—'}</td>
                  <td style={{padding:'9px 10px',fontSize:11,fontWeight:600,color:d.budget>0?T.green:T.gray400}}>{d.budget>0?`฿${fmtMoney(d.budget)}`:'—'}</td>
                  <td style={{padding:'9px 10px'}}><Badge status={d.status||'pending'}/></td>
                  <td style={{padding:'9px 10px'}}><Btn sm color={T.skyBlue} onClick={e=>{e.stopPropagation();onSelectDoc(d)}}>ดู</Btn></td>
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

function PageRegulations({userRole}){
  const role=ROLES[userRole?.role]||ROLES.staff
  const [refCats,setRefCats]=useState([])
  const [refFiles,setRefFiles]=useState([])
  const [selCat,setSelCat]=useState(null)
  const [search,setSearch]=useState('')
  const [showUpload,setShowUpload]=useState(false)
  const [form,setForm]=useState({title:'',description:'',category_id:''})
  const [uploadFile,setUploadFile]=useState(null)
  const [uploading,setUploading]=useState(false)
  const [msg,setMsg]=useState('')
  const fileRef=useRef()

  useEffect(()=>{
    supabase.from('reference_categories').select('*').order('sort_order').then(({data})=>{if(data)setRefCats(data)})
    supabase.from('reference_files').select('*').order('created_at',{ascending:false}).then(({data})=>{if(data)setRefFiles(data)})
  },[])

  const handleUpload=async()=>{
    if(!form.title||!form.category_id){setMsg('❌ กรุณากรอกชื่อและเลือกหมวด');return}
    setUploading(true)
    let file_path=null,file_name=null,file_type=null,file_size=null
    if(uploadFile){
      const path=`references/${form.category_id}/${Date.now()}_${uploadFile.name}`
      const{error}=await supabase.storage.from('documents').upload(path,uploadFile)
      if(!error){file_path=path;file_name=uploadFile.name;file_type=getExt(uploadFile.name);file_size=uploadFile.size}
    }
    const{error}=await supabase.from('reference_files').insert({...form,file_path,file_name,file_type,file_size,is_readonly:true,uploaded_by:userRole?.user_id})
    if(!error){
      setMsg('✅ เพิ่มสำเร็จ!')
      const{data}=await supabase.from('reference_files').select('*').order('created_at',{ascending:false})
      if(data)setRefFiles(data)
      setShowUpload(false);setForm({title:'',description:'',category_id:''});setUploadFile(null)
    }else setMsg('❌ '+error.message)
    setUploading(false)
  }

  const filteredFiles=refFiles.filter(f=>(selCat?f.category_id===selCat:true)&&(f.title?.includes(search)||f.description?.includes(search)))

  return(
    <div style={{display:'flex',flex:1,overflow:'hidden'}}>
      <div style={{width:210,borderRight:`1px solid ${T.gray200}`,overflowY:'auto',background:'#fff',flexShrink:0}}>
        <div style={{padding:'12px 14px',fontWeight:700,color:T.deepBlue,borderBottom:`1px solid ${T.gray200}`,fontSize:13}}>📂 หมวดหมู่</div>
        <div onClick={()=>setSelCat(null)} style={{padding:'10px 14px',cursor:'pointer',background:!selCat?T.lightBlue:'#fff',fontWeight:!selCat?700:400,color:!selCat?T.deepBlue:T.gray600,fontSize:13,borderBottom:`1px solid ${T.gray100}`}}>
          📁 ทั้งหมด <span style={{float:'right',fontSize:11,color:T.gray400}}>{refFiles.length}</span>
        </div>
        {refCats.map(c=>{
          const cnt=refFiles.filter(f=>f.category_id===c.id).length
          return(<div key={c.id} onClick={()=>setSelCat(c.id)} style={{padding:'10px 14px',cursor:'pointer',background:selCat===c.id?T.lightBlue:'#fff',fontWeight:selCat===c.id?700:400,color:selCat===c.id?T.deepBlue:T.gray600,fontSize:13,borderBottom:`1px solid ${T.gray100}`}}>
            {c.icon} {c.name} <span style={{float:'right',fontSize:11,color:T.gray400}}>{cnt}</span>
          </div>)
        })}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
        <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center'}}>
          <div style={{display:'flex',flex:1,maxWidth:360,border:`1px solid ${T.gray200}`,borderRadius:7,overflow:'hidden'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาไฟล์อ้างอิง..." style={{flex:1,border:'none',padding:'8px 12px',fontSize:13,fontFamily:'Sarabun',outline:'none'}}/>
            <div style={{padding:'0 10px',display:'flex',alignItems:'center',background:T.green,color:'#fff'}}>🔍</div>
          </div>
          {role.canAdmin&&<Btn color={T.deepBlue} onClick={()=>setShowUpload(true)}>＋ เพิ่มไฟล์อ้างอิง</Btn>}
        </div>
        {msg&&<div style={{background:msg.includes('✅')?T.greenLight:T.redLight,color:msg.includes('✅')?T.green:T.red,borderRadius:8,padding:'10px 14px',marginBottom:12,fontWeight:600}}>{msg}</div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {filteredFiles.map(f=>{
            const cat=refCats.find(c=>c.id===f.category_id)
            const fi=getFI(f.file_name||'')
            const url=f.file_path?supabase.storage.from('documents').getPublicUrl(f.file_path).data.publicUrl:null
            return(
              <div key={f.id} style={{background:'#fff',borderRadius:10,padding:'14px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1px solid ${T.gray200}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6,gap:6}}>
                  <div style={{fontWeight:700,color:T.deepBlue,fontSize:13,flex:1,lineHeight:1.4}}>{f.title}</div>
                  {cat&&<span style={{background:T.green,color:'#fff',borderRadius:4,padding:'1px 7px',fontSize:10,fontWeight:700,flexShrink:0}}>{cat.icon} {cat.name}</span>}
                </div>
                {f.description&&<div style={{fontSize:12,color:T.gray600,lineHeight:1.6,marginBottom:8}}>{f.description}</div>}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                  {f.file_name?(
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:16}}>{fi.icon}</span>
                      <div><div style={{fontSize:11,fontWeight:600,color:fi.color}}>{fi.label}</div>
                      {f.file_size&&<div style={{fontSize:10,color:T.gray400}}>{fmtSz(f.file_size)}</div>}</div>
                    </div>
                  ):<span style={{fontSize:11,color:T.gray400}}>ไม่มีไฟล์</span>}
                  {url&&<a href={url} target="_blank" rel="noreferrer" style={{background:fi.bg,color:fi.color,borderRadius:6,padding:'5px 12px',fontSize:12,fontWeight:700,textDecoration:'none',border:`1px solid ${fi.color}44`}}>📖 เปิดอ่าน</a>}
                </div>
                {f.is_readonly&&<div style={{marginTop:6,fontSize:10,color:T.gray400}}>🔒 ไฟล์อ่านอย่างเดียว</div>}
              </div>
            )
          })}
          {filteredFiles.length===0&&<div style={{gridColumn:'span 2',padding:40,textAlign:'center',color:T.gray400}}>ไม่พบไฟล์อ้างอิง</div>}
        </div>
      </div>
      {showUpload&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200}}>
          <div style={{background:'#fff',borderRadius:16,width:520,maxHeight:'85vh',overflowY:'auto',boxShadow:'0 8px 40px rgba(0,0,0,0.25)'}}>
            <div style={{background:`linear-gradient(135deg,${T.deepBlue},${T.midBlue})`,color:'#fff',padding:'16px 20px',borderRadius:'16px 16px 0 0',display:'flex',justifyContent:'space-between'}}>
              <span style={{fontWeight:700,fontSize:16}}>＋ เพิ่มไฟล์ข้อมูลอ้างอิง</span>
              <button onClick={()=>setShowUpload(false)} style={{background:'none',border:'none',color:'#fff',fontSize:20,cursor:'pointer'}}>✕</button>
            </div>
            <div style={{padding:22}}>
              <div style={{marginBottom:12}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>ชื่อเอกสาร *</label><input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={inpStyle}/></div>
              <div style={{marginBottom:12}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>สรุปสาระสำคัญ</label><textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3} style={{...inpStyle,resize:'vertical'}}/></div>
              <div style={{marginBottom:14}}><label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:4,fontWeight:600}}>หมวดหมู่ *</label>
                <select value={form.category_id} onChange={e=>setForm(p=>({...p,category_id:e.target.value}))} style={inpStyle}>
                  <option value="">-- เลือกหมวด --</option>
                  {refCats.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </select>
              </div>
              <div style={{marginBottom:16}}>
                <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:6,fontWeight:600}}>📎 แนบไฟล์ (PDF · JPG · DOC — อ่านอย่างเดียว)</label>
                <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${uploadFile?T.green:T.gray200}`,borderRadius:8,padding:14,textAlign:'center',cursor:'pointer',background:uploadFile?T.greenLight:T.gray50}}>
                  <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.doc,.docx" style={{display:'none'}} onChange={e=>setUploadFile(e.target.files[0])}/>
                  {uploadFile?(
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                      <span style={{fontSize:22}}>{getFI(uploadFile.name).icon}</span>
                      <div><div style={{fontSize:13,fontWeight:700,color:T.green}}>{uploadFile.name}</div><div style={{fontSize:11,color:T.gray400}}>{fmtSz(uploadFile.size)}</div></div>
                      <button onClick={e=>{e.stopPropagation();setUploadFile(null)}} style={{background:'none',border:'none',color:T.red,cursor:'pointer',fontSize:16}}>✕</button>
                    </div>
                  ):(
                    <div><div style={{fontSize:22,marginBottom:4}}>📄</div><div style={{fontSize:13,color:T.gray400}}>คลิกเพื่อเลือกไฟล์ PDF · JPG · DOC</div></div>
                  )}
                </div>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
                <Btn onClick={()=>setShowUpload(false)} outline color={T.gray400}>ยกเลิก</Btn>
                <Btn onClick={handleUpload} disabled={uploading} color={T.deepBlue}>{uploading?'⏳ กำลังอัปโหลด...':'💾 บันทึก'}</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PageReports({docs}){
  const totalBudget=docs.reduce((a,b)=>a+(Number(b.budget)||0),0)
  const byCat={};docs.forEach(d=>{const k=d.category_name||'ไม่ระบุ';byCat[k]=(byCat[k]||0)+(Number(d.budget)||0)})
  const byStatus={pending:0,approved:0,rejected:0,draft:0};docs.forEach(d=>{byStatus[d.status||'pending']=(byStatus[d.status||'pending']||0)+1})
  const byUnit={};docs.forEach(d=>{const k=d.unit_name||d.dept||'ไม่ระบุ';byUnit[k]=(byUnit[k]||0)+1})
  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        <div style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:12}}>💰 สรุปงบประมาณตามหมวด</div>
          {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).map(([k,v])=>(
            <div key={k} style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontSize:13}}><span>{k}</span><span style={{fontWeight:700,color:T.green}}>฿{fmtMoney(v)}</span></div>
              <div style={{height:6,background:T.gray100,borderRadius:3}}><div style={{height:6,background:`linear-gradient(90deg,${T.skyBlue},${T.deepBlue})`,borderRadius:3,width:`${totalBudget>0?(v/totalBudget*100):0}%`}}/></div>
            </div>
          ))}
          <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${T.gray200}`,display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:14}}><span>รวม</span><span style={{color:T.deepBlue}}>฿{fmtMoney(totalBudget)}</span></div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:12}}>📊 สถานะเอกสาร</div>
            {[{k:'pending',l:'รอดำเนินการ',c:'#f57f17'},{k:'approved',l:'อนุมัติ',c:T.green},{k:'rejected',l:'ไม่อนุมัติ',c:T.red},{k:'draft',l:'ร่าง',c:T.gray400}].map(s=>(
              <div key={s.k} style={{display:'flex',justifyContent:'space-between',padding:'6px 0',borderBottom:`1px solid ${T.gray100}`,fontSize:13}}>
                <Badge status={s.k}/><span style={{fontWeight:800,fontSize:16,color:s.c}}>{byStatus[s.k]||0}</span>
              </div>
            ))}
            <div style={{marginTop:10,padding:'8px 12px',background:T.lightBlue,borderRadius:7,fontWeight:700,fontSize:13,color:T.deepBlue,display:'flex',justifyContent:'space-between'}}><span>รวม</span><span>{docs.length} ฉบับ</span></div>
          </div>
          <div style={{background:'#fff',borderRadius:12,padding:16,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:12}}>🏢 ตามหน่วยงาน</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {Object.entries(byUnit).map(([k,v])=>(
                <div key={k} style={{border:`1px solid ${T.gray200}`,borderRadius:7,padding:'8px 10px',textAlign:'center'}}>
                  <div style={{fontSize:11,color:T.gray400,marginBottom:2}}>{k}</div>
                  <div style={{fontSize:18,fontWeight:800,color:T.skyBlue}}>{v}</div>
                  <div style={{fontSize:10,color:T.gray400}}>ฉบับ</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PageAdmin(){
  const [tab,setTab]=useState('users')
  const [users,setUsers]=useState([])
  useEffect(()=>{supabase.from('user_roles').select('*').then(({data})=>{if(data)setUsers(data)})},[])
  return(
    <div style={{padding:'20px 24px',overflowY:'auto',flex:1}}>
      <div style={{background:'#fff',borderRadius:12,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
        <div style={{borderBottom:`1px solid ${T.gray200}`,display:'flex',padding:'0 16px',background:T.gray50}}>
          {[{k:'users',l:'👥 ผู้ใช้'},{k:'system',l:'⚙️ ระบบ'}].map(t=>(
            <button key={t.k} onClick={()=>setTab(t.k)} style={{padding:'12px 18px',border:'none',borderBottom:`2px solid ${tab===t.k?T.skyBlue:'transparent'}`,background:'transparent',color:tab===t.k?T.skyBlue:T.gray600,fontFamily:'Sarabun',fontWeight:tab===t.k?700:400,fontSize:13,cursor:'pointer'}}>{t.l}</button>
          ))}
        </div>
        <div style={{padding:20}}>
          {tab==='users'&&(
            <div>
              <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:14}}>👥 ผู้ใช้งาน ({users.length} คน)</div>
              <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
                <thead><tr style={{background:T.deepBlue}}>{['ชื่อ-สกุล','สิทธิ์','ฝ่าย','ตำแหน่ง'].map(h=><th key={h} style={{padding:'9px 12px',textAlign:'left',color:'#fff',fontWeight:600,fontSize:12}}>{h}</th>)}</tr></thead>
                <tbody>{users.map((u,i)=>{const r=ROLES[u.role]||ROLES.staff;return(<tr key={u.id} style={{borderBottom:`1px solid ${T.gray100}`,background:i%2===0?'#fff':T.gray50}}><td style={{padding:'9px 12px',fontWeight:600}}>{u.full_name||'—'}</td><td style={{padding:'9px 12px'}}><span style={{background:r.color+'22',color:r.color,borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700}}>{r.label}</span></td><td style={{padding:'9px 12px',fontSize:12,color:T.gray400}}>{u.dept||'—'}</td><td style={{padding:'9px 12px',fontSize:12,color:T.gray400}}>{u.position||'—'}</td></tr>)})}</tbody>
              </table>
              <div style={{marginTop:12,padding:12,background:T.lightBlue,borderRadius:8,fontSize:12,color:T.deepBlue}}>
                💡 เพิ่มผู้ใช้ที่ Supabase → Authentication → Users แล้วรัน SQL: <code style={{background:T.gray200,padding:'1px 4px',borderRadius:3}}>insert into user_roles (user_id, role, full_name, dept, position) values ('...uuid...', 'staff', 'ชื่อ', 'ฝ่าย', 'ตำแหน่ง');</code>
              </div>
            </div>
          )}
          {tab==='system'&&(
            <div>
              <div style={{fontWeight:700,color:T.deepBlue,fontSize:14,marginBottom:14}}>⚙️ ตั้งค่าระบบ</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                {[['LINE Notify Token','password','Token สำหรับส่งแจ้งเตือน LINE'],['LINE Group ID หลัก','text','Group ID ห้อง LINE สำนักงาน'],['Claude API Key (AI ร่างหนังสือ)','password','API Key จาก console.anthropic.com'],['ชื่อองค์กร','text','ชื่อที่แสดงในเอกสาร']].map(([l,t,d])=>(
                  <div key={l} style={{border:`1px solid ${T.gray200}`,borderRadius:8,padding:14}}>
                    <label style={{fontSize:12,color:T.gray600,display:'block',marginBottom:2,fontWeight:600}}>{l}</label>
                    <div style={{fontSize:11,color:T.gray400,marginBottom:6}}>{d}</div>
                    <input type={t} placeholder="กรอกค่า..." style={inpStyle}/>
                  </div>
                ))}
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:14}}><Btn color={T.deepBlue}>💾 บันทึก</Btn></div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function App(){
  const [user,setUser]=useState(null)
  const [userRole,setUserRole]=useState(null)
  const [appLoading,setAppLoading]=useState(true)
  const [page,setPage]=useState('dashboard')
  const [docs,setDocs]=useState([])
  const [selectedDoc,setSelected]=useState(null)

  useEffect(()=>{
    supabase.auth.getSession().then(async({data:{session}})=>{
      if(session?.user){setUser(session.user);const{data}=await supabase.from('user_roles').select('*').eq('user_id',session.user.id).single();setUserRole(data)}
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
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{textAlign:'center',color:'#fff'}}>
        <div style={{fontSize:48,marginBottom:12}}>🏛️</div>
        <div style={{fontSize:16,fontWeight:700}}>SERCOOP.PSU</div>
        <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:4}}>กำลังโหลดระบบ...</div>
      </div>
    </div>
  )

  if(!user)return <PageLogin onLogin={u=>setUser(u)}/>

  const titles={dashboard:'หน้าหลัก · ภาพรวมระบบ',doc:'เกษียณหนังสือ / เอกสาร',docdetail:selectedDoc?`รายละเอียด: ${selectedDoc.id}`:'สร้างเอกสารใหม่',incoming:'หนังสือรับ ภายใน/ภายนอก',workflow:'ติดตาม Workflow การอนุมัติ',budget:'งบประมาณแยกหมวด',regulations:'ฐานข้อมูลอ้างอิง',reports:'รายงานและสรุปข้อมูล',admin:'ผู้ดูแลระบบ'}
  const subs={doc:'บันทึกข้อความ 9 หมวด · หนังสือส่ง 8 หมวด · แยกหน่วยงาน · AI ร่างหนังสือ',incoming:'แยกภายใน/ภายนอก · อ้างอิงหนังสือส่ง · ติดตามงาน',workflow:'ติดตามทุกขั้นตอน · อนุมัติ/ไม่อนุมัติ · บันทึกความคิดเห็น',budget:'งบประมาณรายหมวด · ถัวเฉลี่ย · ใช้เกินงบ · ติดตามการใช้',regulations:'PDF · JPG · DOC · ไฟล์อ่านอย่างเดียว · จัดหมวดหมู่'}

  return(
    <div style={{display:'flex',height:'100vh',fontFamily:'Sarabun',background:T.gray100,overflow:'hidden'}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700;800&display=swap" rel="stylesheet"/>
      <Sidebar page={page} setPage={p=>{setSelected(null);setPage(p)}} user={user} userRole={userRole} onLogout={handleLogout}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <Topbar title={titles[page]||'SERCOOP.PSU'} subtitle={subs[page]||'สหกรณ์บริการมหาวิทยาลัยสงขลานครินทร์ จำกัด'}/>
        {page==='dashboard'&&<PageDashboard docs={docs} setPage={setPage}/>}
        {page==='doc'&&<PageDoc docs={docs} setDocs={setDocs} onSelectDoc={handleSelectDoc} user={user} userRole={userRole}/>}
        {page==='docdetail'&&<PageDocDetail doc={selectedDoc} onBack={handleBack} onSaved={handleBack} user={user} userRole={userRole}/>}
        {page==='incoming'&&<PageIncoming user={user} userRole={userRole}/>}
        {page==='workflow'&&<PageWorkflow docs={docs}/>}
        {page==='budget'&&<PageBudget/>}
        {page==='regulations'&&<PageRegulations userRole={userRole}/>}
        {page==='reports'&&<PageReports docs={docs}/>}
        {page==='admin'&&<PageAdmin/>}
      </div>
    </div>
  )
}
