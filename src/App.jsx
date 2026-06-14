import { createClient } from '@supabase/supabase-js'
import { useState, useEffect, useRef, useCallback, memo } from 'react'

const supabase = createClient(
  'https://rartcrxprbcoylqwjvjx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhcnRjcnhwcmJjb3lscXdqdmp4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg1MDQ1MDYsImV4cCI6MjA5NDA4MDUwNn0.41svsIGvzuaPBVjyD3XjZceGlL2bXd_BePcsqgDSd6o'
)

// ═══════════════════════════════
// THEME
// ═══════════════════════════════
const T = {
  primary:'#1a3a6b', primary2:'#1e88e5', primary3:'#e3f2fd',
  midBlue:'#1565c0', navy:'#0f2240',
  green:'#2e7d32', greenL:'#e8f5e9',
  red:'#c62828', redL:'#ffebee',
  orange:'#e65100', orangeL:'#fff3e0',
  amber:'#f57f17', amberL:'#fffde7',
  purple:'#6a1b9a', teal:'#00695c',
  g50:'#f8fafc', g100:'#f1f5f9', g200:'#e2e8f0',
  g400:'#94a3b8', g600:'#475569', g800:'#1e293b',
  white:'#fff', sidebar:'#0f2240',
}

const STATUS_CONFIG = {
  draft:             {label:'📝 ร่าง',             bg:'#f1f5f9',c:'#64748b'},
  submitted:         {label:'📤 ส่งแล้ว',           bg:'#ede9fe',c:'#6d28d9'},
  in_review:         {label:'🔵 กำลังพิจารณา',     bg:'#e0f2fe',c:'#0369a1'},
  pending_approval:  {label:'⏳ รออนุมัติ',         bg:'#fef9c3',c:'#854d0e'},
  approved:          {label:'✅ อนุมัติแล้ว',       bg:'#dcfce7',c:'#166534'},
  rejected:          {label:'❌ ไม่อนุมัติ',        bg:'#fee2e2',c:'#991b1b'},
  revised:           {label:'🔄 ส่งแก้ไข',          bg:'#ffedd5',c:'#9a3412'},
  in_progress:       {label:'📨 กำลังดำเนินการ',   bg:'#dbeafe',c:'#1e40af'},
  awaiting_evidence: {label:'💳 รอหลักฐานการจ่าย', bg:'#fae8ff',c:'#86198f'},
  notified:          {label:'🔔 แจ้งต้นทางแล้ว',   bg:'#d1fae5',c:'#065f46'},
  accounting:        {label:'📊 รอบัญชีบันทึก',     bg:'#fef3c7',c:'#92400e'},
  completed:         {label:'✔️ เสร็จสิ้น',          bg:'#d1fae5',c:'#065f46'},
}

const URGENCY = {
  normal:    {label:'ปกติ',         color:T.g600},
  urgent:    {label:'ด่วน',         color:T.orange},
  very_urgent:{label:'ด่วนมาก',     color:T.red},
  backdated: {label:'จัดทำย้อนหลัง',color:T.purple},
}

const PERMISSIONS = {
  super_admin: {label:'Super Admin',canAdmin:true,canApprove:true,canCreate:true},
  admin:       {label:'ผู้ดูแลระบบ',canAdmin:true,canApprove:true,canCreate:true},
  manager:     {label:'ผู้จัดการ',  canAdmin:false,canApprove:true,canCreate:true},
  staff:       {label:'เจ้าหน้าที่',canAdmin:false,canApprove:false,canCreate:true},
  viewer:      {label:'ผู้ดูข้อมูล',canAdmin:false,canApprove:false,canCreate:false},
}

const fmtMoney = n => Number(n||0).toLocaleString('th-TH')
const fmtDate = d => d ? new Date(d).toLocaleDateString('th-TH',{day:'2-digit',month:'2-digit',year:'numeric'}) : '—'
const getExt = n => (n||'').split('.').pop().toLowerCase()
const fmtSz = b => b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB`

const inpStyle = {
  width:'100%', border:`1px solid ${T.g200}`, borderRadius:7,
  padding:'8px 12px', fontSize:13, fontFamily:'Sarabun',
  boxSizing:'border-box', outline:'none', background:'#fff',
}

const Btn = ({children,onClick,color=T.primary2,outline=false,sm=false,
  disabled=false,full=false,danger=false,style={}}) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled?T.g200 : danger?T.red : outline?'transparent':color,
    color: disabled?T.g400 : outline?(danger?T.red:color) : '#fff',
    border:`1.5px solid ${disabled?T.g200:danger?T.red:color}`,
    borderRadius:7, padding:sm?'5px 12px':'9px 20px',
    fontFamily:'Sarabun', fontWeight:700, fontSize:sm?12:13,
    cursor:disabled?'not-allowed':'pointer', width:full?'100%':'auto',
    transition:'all 0.15s', ...style,
  }}>{children}</button>
)

const Badge = ({status}) => {
  const s = STATUS_CONFIG[status] || {label:status,bg:T.g100,c:T.g600}
  return <span style={{background:s.bg,color:s.c,borderRadius:20,
    padding:'3px 10px',fontSize:11.5,fontWeight:700,whiteSpace:'nowrap'}}>{s.label}</span>
}

const Modal = ({title,onClose,children,width=560}) => (
  <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',
    display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:16}}>
    <div style={{background:'#fff',borderRadius:16,width,maxWidth:'95vw',
      maxHeight:'90vh',overflowY:'auto',boxShadow:'0 8px 40px rgba(0,0,0,0.25)'}}>
      <div style={{background:`linear-gradient(135deg,${T.primary},${T.midBlue})`,
        color:'#fff',padding:'16px 20px',borderRadius:'16px 16px 0 0',
        display:'flex',justifyContent:'space-between',alignItems:'center',flexShrink:0}}>
        <span style={{fontWeight:700,fontSize:15}}>{title}</span>
        <button onClick={onClose} style={{background:'none',border:'none',
          color:'#fff',fontSize:20,cursor:'pointer',lineHeight:1}}>✕</button>
      </div>
      <div style={{padding:22}}>{children}</div>
    </div>
  </div>
)

// ═══════════════════════════════
// SIGNATURE PAD
// ═══════════════════════════════
function SignaturePad({onSave,existing}) {
  const canvasRef = useRef()
  const [drawing, setDrawing] = useState(false)
  const [hasDrawing, setHasDrawing] = useState(false)
  const lastPos = useRef(null)

  const getPos = (e, canvas) => {
    const r = canvas.getBoundingClientRect()
    const src = e.touches ? e.touches[0] : e
    return {x: src.clientX - r.left, y: src.clientY - r.top}
  }

  const startDraw = e => {
    e.preventDefault()
    const canvas = canvasRef.current
    const pos = getPos(e, canvas)
    lastPos.current = pos
    setDrawing(true)
  }

  const draw = e => {
    e.preventDefault()
    if(!drawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1a3a6b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
    lastPos.current = pos
    setHasDrawing(true)
  }

  const stopDraw = () => setDrawing(false)

  const clear = () => {
    const canvas = canvasRef.current
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawing(false)
  }

  const save = () => {
    const data = canvasRef.current.toDataURL('image/png')
    onSave(data)
  }

  return(
    <div>
      {existing && (
        <div style={{marginBottom:10,textAlign:'center'}}>
          <img src={existing} alt="ลายเซ็นปัจจุบัน" style={{maxHeight:60,border:`1px solid ${T.g200}`,borderRadius:4}}/>
          <div style={{fontSize:11,color:T.g400,marginTop:4}}>ลายเซ็นปัจจุบัน</div>
        </div>
      )}
      <div style={{border:`2px dashed ${T.primary2}`,borderRadius:8,background:T.g50,marginBottom:8}}>
        <canvas ref={canvasRef} width={420} height={150}
          style={{display:'block',cursor:'crosshair',touchAction:'none',width:'100%'}}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}/>
      </div>
      <div style={{display:'flex',gap:8}}>
        <Btn onClick={clear} outline color={T.g400} sm>🗑️ ล้าง</Btn>
        <Btn onClick={save} color={T.primary} sm disabled={!hasDrawing}>💾 บันทึกลายเซ็น</Btn>
      </div>
    </div>
  )
}

// ═══════════════════════════════
// FILE UPLOAD ZONE
// ═══════════════════════════════
const FileZone = memo(({files,onAdd,onRemove,savedFiles=[],accept='.pdf,.jpg,.jpeg,.docx,.xlsx'}) => {
  const ref = useRef()
  const [drag, setDrag] = useState(false)
  const icons = {pdf:'📄',jpg:'🖼️',jpeg:'🖼️',docx:'📝',doc:'📝',xlsx:'📊',png:'🖼️'}

  const addFiles = useCallback(incoming => {
    Array.from(incoming).forEach(f => {
      onAdd({file:f,id:Date.now()+Math.random(),name:f.name,
        size:f.size,preview:f.type.startsWith('image/')?URL.createObjectURL(f):null})
    })
  },[onAdd])

  return(
    <div>
      <div onClick={()=>ref.current.click()}
        onDragOver={e=>{e.preventDefault();setDrag(true)}}
        onDragLeave={()=>setDrag(false)}
        onDrop={e=>{e.preventDefault();setDrag(false);addFiles(e.dataTransfer.files)}}
        style={{border:`2px dashed ${drag?T.primary2:T.g200}`,borderRadius:10,
          padding:14,textAlign:'center',background:drag?T.primary3:T.g50,cursor:'pointer'}}>
        <input ref={ref} type="file" multiple accept={accept}
          style={{display:'none'}} onChange={e=>addFiles(e.target.files)}/>
        <div style={{fontSize:22,marginBottom:3}}>📎</div>
        <div style={{fontWeight:700,color:T.primary2,fontSize:13}}>คลิกหรือลากไฟล์มาวาง</div>
        <div style={{fontSize:11,color:T.g400}}>PDF · JPG · DOCX · XLSX</div>
      </div>
      {[...savedFiles,...files].map(f => {
        const isSaved = !!f.file_path
        const ext = getExt(f.file_name||f.name||'')
        const icon = icons[ext]||'📎'
        const url = isSaved ? supabase.storage.from('documents').getPublicUrl(f.file_path).data.publicUrl : null
        return(
          <div key={f.id} style={{display:'flex',alignItems:'center',gap:8,
            background:T.g50,border:`1px solid ${T.g200}`,borderRadius:7,
            padding:'7px 10px',marginTop:5}}>
            {f.preview ? <img src={f.preview} alt="" style={{width:30,height:30,objectFit:'cover',borderRadius:4}}/>
              : <span style={{fontSize:18}}>{icon}</span>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:12,fontWeight:600,overflow:'hidden',
                textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{f.file_name||f.name}</div>
              <div style={{fontSize:10,color:T.g400}}>{fmtSz(f.file_size||f.size||0)}</div>
            </div>
            {isSaved
              ? <a href={url} target="_blank" rel="noreferrer"
                  style={{color:T.primary2,fontSize:12,fontWeight:700,textDecoration:'none',
                    background:T.primary3,padding:'3px 8px',borderRadius:4}}>👁 ดู</a>
              : <button onClick={()=>onRemove(f.id)}
                  style={{background:'none',border:'none',cursor:'pointer',color:T.red,fontSize:15}}>✕</button>}
          </div>
        )
      })}
    </div>
  )
})

// ═══════════════════════════════
// LOGIN
// ═══════════════════════════════
function PageLogin({onLogin}) {
  const [email,setEmail] = useState('')
  const [pass,setPass] = useState('')
  const [err,setErr] = useState('')
  const [loading,setLoading] = useState(false)

  const doLogin = async () => {
    if(!email||!pass){setErr('กรุณากรอกอีเมลและรหัสผ่าน');return}
    setLoading(true);setErr('')
    const {data,error} = await supabase.auth.signInWithPassword({email,password:pass})
    if(error) setErr('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    else onLogin(data.user)
    setLoading(false)
  }

  return(
    <div style={{minHeight:'100vh',
      background:`linear-gradient(135deg,${T.navy} 0%,${T.primary} 50%,${T.midBlue} 100%)`,
      display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'Sarabun',padding:16}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{background:'rgba(255,255,255,0.97)',borderRadius:20,
        padding:'40px 44px',width:'100%',maxWidth:420,
        boxShadow:'0 20px 60px rgba(0,0,0,0.35)'}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{width:70,height:70,
            background:`linear-gradient(135deg,${T.primary2},${T.primary})`,
            borderRadius:18,display:'flex',alignItems:'center',
            justifyContent:'center',fontSize:36,margin:'0 auto 16px',
            boxShadow:`0 4px 20px ${T.primary2}44`}}>🏛️</div>
          <div style={{fontWeight:800,fontSize:26,color:T.primary,letterSpacing:0.5}}>SERCOOP.PSU</div>
          <div style={{fontSize:13,color:T.g600,marginTop:6}}>ระบบสารบรรณอิเล็กทรอนิกส์</div>
          <div style={{fontSize:11,color:T.g400,marginTop:2}}>สหกรณ์บริการมหาวิทยาลัยสงขลานครินทร์ จำกัด</div>
        </div>
        {err && <div style={{background:T.redL,color:T.red,borderRadius:8,padding:'9px 14px',
          fontSize:13,marginBottom:16,textAlign:'center',fontWeight:600}}>{err}</div>}
        <div style={{marginBottom:14}}>
          <label style={{fontSize:13,color:T.g600,display:'block',marginBottom:5,fontWeight:600}}>อีเมล</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} type="email"
            placeholder="email@sercoop.psu.ac.th"
            style={{...inpStyle,padding:'11px 14px',fontSize:14}}
            onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
        </div>
        <div style={{marginBottom:28}}>
          <label style={{fontSize:13,color:T.g600,display:'block',marginBottom:5,fontWeight:600}}>รหัสผ่าน</label>
          <input value={pass} onChange={e=>setPass(e.target.value)} type="password"
            placeholder="••••••••"
            style={{...inpStyle,padding:'11px 14px',fontSize:14}}
            onKeyDown={e=>e.key==='Enter'&&doLogin()}/>
        </div>
        <button onClick={doLogin} disabled={loading} style={{
          width:'100%',
          background:loading?T.g200:`linear-gradient(135deg,${T.primary2},${T.primary})`,
          color:loading?T.g400:'#fff',border:'none',borderRadius:10,padding:'13px',
          fontWeight:800,fontSize:15,fontFamily:'Sarabun',
          cursor:loading?'not-allowed':'pointer',
          boxShadow:loading?'none':`0 4px 16px ${T.primary2}44`}}>
          {loading ? '⏳ กำลังเข้าสู่ระบบ...' : '🔐 เข้าสู่ระบบ'}
        </button>
        <div style={{textAlign:'center',marginTop:14,fontSize:11,color:T.g400}}>
          รองรับ Desktop · Android · iOS
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════
// SIDEBAR
// ═══════════════════════════════
function Sidebar({page,setPage,user,userInfo,perm,onLogout,collapsed,setCollapsed}) {
  const role = PERMISSIONS[perm?.role] || PERMISSIONS.staff

  const groups = [
    {label:'งานหลัก', menus:[
      {key:'dashboard',icon:'🏠',label:'หน้าหลัก'},
      {key:'inbox',icon:'🔔',label:'กล่องรออนุมัติ'},
      {key:'doc',icon:'📋',label:'เกษียณหนังสือ'},
      {key:'incoming',icon:'📥',label:'หนังสือรับ'},
      {key:'tracking',icon:'⚙️',label:'ติดตามเอกสาร'},
    ]},
    {label:'ข้อมูล', menus:[
      {key:'budget',icon:'💰',label:'งบประมาณ'},
      {key:'regulations',icon:'⚖️',label:'ฐานข้อมูลอ้างอิง'},
      {key:'reports',icon:'📊',label:'รายงาน'},
    ]},
    ...(role.canAdmin ? [{label:'ตั้งค่า', menus:[
      {key:'admin',icon:'🛡️',label:'ผู้ดูแลระบบ'},
    ]}] : []),
  ]

  return(
    <div style={{
      width: collapsed ? 60 : 224,
      background:T.sidebar,
      display:'flex',flexDirection:'column',
      flexShrink:0,transition:'width 0.2s',overflow:'hidden',
      boxShadow:'2px 0 8px rgba(0,0,0,0.15)'}}>
      {/* Header */}
      <div style={{padding:'12px',background:'rgba(0,0,0,0.3)',
        borderBottom:'1px solid rgba(255,255,255,0.07)',
        display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        <div style={{width:36,height:36,flexShrink:0,
          background:`linear-gradient(135deg,${T.primary2},${T.primary})`,
          borderRadius:8,display:'flex',alignItems:'center',
          justifyContent:'center',fontSize:18,cursor:'pointer'}}
          onClick={()=>setCollapsed(!collapsed)}>🏛️</div>
        {!collapsed && (
          <div style={{minWidth:0}}>
            <div style={{color:'#fff',fontWeight:800,fontSize:11.5}}>SERCOOP.PSU</div>
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:9.5}}>ระบบสารบรรณ</div>
          </div>
        )}
      </div>

      {/* User info */}
      {!collapsed && (
        <div style={{padding:'10px 12px',background:'rgba(0,0,0,0.2)',
          borderBottom:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{width:30,height:30,borderRadius:'50%',flexShrink:0,overflow:'hidden',
              background:`linear-gradient(135deg,${T.primary2},${T.primary})`,
              display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontWeight:700,fontSize:13}}>
              {userInfo?.avatar_url
                ? <img src={userInfo.avatar_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                : (userInfo?.full_name||user?.email||'?')[0].toUpperCase()}
            </div>
            <div style={{minWidth:0}}>
              <div style={{color:'#fff',fontSize:11.5,fontWeight:600,
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {userInfo?.full_name||user?.email?.split('@')[0]}
              </div>
              <div style={{color:T.primary2,fontSize:10,fontWeight:600}}>
                {PERMISSIONS[perm?.role]?.label||'ผู้ใช้งาน'}
              </div>
            </div>
          </div>
          {userInfo?.unit_name && (
            <div style={{color:'rgba(255,255,255,0.4)',fontSize:10,marginTop:4}}>
              📍 {userInfo.unit_name}
            </div>
          )}
        </div>
      )}

      {/* Menus */}
      <div style={{flex:1,padding:'6px',overflowY:'auto'}}>
        {groups.map(g => (
          <div key={g.label}>
            {!collapsed && (
              <div style={{color:'rgba(255,255,255,0.3)',fontSize:10,fontWeight:700,
                padding:'8px 8px 4px',letterSpacing:1}}>{g.label.toUpperCase()}</div>
            )}
            {g.menus.map(m => (
              <div key={m.key} onClick={()=>setPage(m.key)}
                title={collapsed?m.label:''}
                style={{display:'flex',alignItems:'center',gap:8,
                  padding:collapsed?'10px':'9px 10px',borderRadius:7,marginBottom:2,
                  cursor:'pointer',fontSize:13,justifyContent:collapsed?'center':'flex-start',
                  background:page===m.key?`${T.primary2}25`:'transparent',
                  color:page===m.key?'#fff':'rgba(255,255,255,0.6)',
                  fontWeight:page===m.key?700:400,
                  borderLeft:page===m.key&&!collapsed?`3px solid ${T.primary2}`:'3px solid transparent',
                  transition:'all 0.15s'}}
                onMouseEnter={e=>{if(page!==m.key)e.currentTarget.style.background='rgba(255,255,255,0.06)'}}
                onMouseLeave={e=>{if(page!==m.key)e.currentTarget.style.background='transparent'}}>
                <span style={{fontSize:16,width:20,textAlign:'center',flexShrink:0}}>{m.icon}</span>
                {!collapsed && m.label}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Bottom */}
      <div style={{padding:'8px',borderTop:'1px solid rgba(255,255,255,0.07)',flexShrink:0}}>
        {!collapsed && (
          <div onClick={()=>setPage('profile')}
            style={{display:'flex',alignItems:'center',gap:8,color:'rgba(255,255,255,0.5)',
              fontSize:12,cursor:'pointer',padding:'6px 8px',borderRadius:6,marginBottom:4}}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            👤 โปรไฟล์ของฉัน
          </div>
        )}
        <div onClick={onLogout}
          style={{display:'flex',alignItems:'center',gap:8,color:'rgba(255,255,255,0.35)',
            fontSize:12,cursor:'pointer',padding:'6px 8px',borderRadius:6,
            justifyContent:collapsed?'center':'flex-start'}}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.05)'}
          onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
          <span>🚪</span>{!collapsed&&'ออกจากระบบ'}
        </div>
      </div>
    </div>
  )
}

function Topbar({title,subtitle,actions,notifications=0}) {
  const now = new Date().toLocaleDateString('th-TH',{
    weekday:'long',year:'numeric',month:'long',day:'numeric'})
  return(
    <div style={{background:'#fff',borderBottom:`1px solid ${T.g200}`,
      padding:'10px 20px',display:'flex',alignItems:'center',
      justifyContent:'space-between',flexShrink:0,gap:12}}>
      <div style={{minWidth:0}}>
        <div style={{fontWeight:800,fontSize:16,color:T.primary,
          overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</div>
        {subtitle && <div style={{fontSize:11,color:T.g400}}>{subtitle}</div>}
      </div>
      <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
        {actions}
        {notifications > 0 && (
          <div style={{position:'relative',cursor:'pointer'}}>
            <span style={{fontSize:20}}>🔔</span>
            <span style={{position:'absolute',top:-4,right:-4,
              background:T.red,color:'#fff',borderRadius:'50%',
              width:16,height:16,fontSize:9,fontWeight:700,
              display:'flex',alignItems:'center',justifyContent:'center'}}>
              {notifications}
            </span>
          </div>
        )}
        <div style={{fontSize:11,color:T.g400,textAlign:'right'}}>
          <div>{now}</div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════
// DASHBOARD
// ═══════════════════════════════
function PageDashboard({docs,notifications,setPage,userInfo}) {
  const pending = docs.filter(d=>d.status==='pending_approval'||d.status==='submitted').length
  const approved = docs.filter(d=>d.status==='approved'||d.status==='completed').length
  const inProgress = docs.filter(d=>d.status==='in_progress'||d.status==='awaiting_evidence').length
  const totalBudget = docs.filter(d=>d.budget_amount>0&&d.status!=='rejected').reduce((a,b)=>a+(Number(b.budget_amount)||0),0)

  const unreadNotifs = notifications.filter(n=>!n.is_read).length

  return(
    <div style={{padding:'20px',overflowY:'auto',flex:1}}>
      {/* Welcome */}
      <div style={{background:`linear-gradient(135deg,${T.primary},${T.midBlue})`,
        borderRadius:14,padding:'20px 24px',marginBottom:20,color:'#fff',
        display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div>
          <div style={{fontSize:18,fontWeight:800}}>
            สวัสดี, {userInfo?.full_name?.split(' ')[0] || 'ผู้ใช้งาน'} 👋
          </div>
          <div style={{fontSize:13,opacity:0.8,marginTop:4}}>
            {userInfo?.position_name||''} {userInfo?.unit_name ? `· ${userInfo.unit_name}` : ''}
          </div>
        </div>
        <div style={{fontSize:48,opacity:0.3}}>🏛️</div>
      </div>

      {/* Stats */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
        gap:12,marginBottom:20}}>
        {[
          {label:'รออนุมัติ',value:pending,icon:'⏳',color:'#f57f17',bg:'#fffde7'},
          {label:'อนุมัติแล้ว',value:approved,icon:'✅',color:T.green,bg:T.greenL},
          {label:'กำลังดำเนินการ',value:inProgress,icon:'📨',color:T.midBlue,bg:T.primary3},
          {label:'งบประมาณ (บาท)',value:'฿'+fmtMoney(totalBudget),icon:'💰',color:T.primary,bg:T.primary3},
          {label:'แจ้งเตือนใหม่',value:unreadNotifs,icon:'🔔',color:T.red,bg:T.redL},
        ].map(s => (
          <div key={s.label} style={{background:'#fff',borderRadius:12,
            padding:'14px 16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
            borderLeft:`4px solid ${s.color}`,cursor:'pointer'}}
            onClick={()=>s.label==='แจ้งเตือนใหม่'?setPage('inbox'):setPage('doc')}>
            <div style={{fontSize:20}}>{s.icon}</div>
            <div style={{fontSize:22,fontWeight:800,color:s.color,marginTop:4}}>{s.value}</div>
            <div style={{fontSize:11,color:T.g400,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:16,alignItems:'start'}}>
        {/* Recent docs */}
        <div style={{background:'#fff',borderRadius:12,padding:'16px 18px',
          boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{display:'flex',justifyContent:'space-between',
            alignItems:'center',marginBottom:12}}>
            <div style={{fontWeight:700,color:T.primary,fontSize:14}}>📋 เอกสารล่าสุด</div>
            <Btn sm outline color={T.primary2} onClick={()=>setPage('doc')}>ดูทั้งหมด →</Btn>
          </div>
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:12}}>
            <thead>
              <tr style={{background:T.g50}}>
                {['เลขที่','เรื่อง','หน่วยงาน','งบ','สถานะ'].map(h=>(
                  <th key={h} style={{padding:'7px 10px',textAlign:'left',
                    color:T.g600,fontWeight:600,borderBottom:`1px solid ${T.g200}`}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {docs.slice(0,6).map((d,i) => (
                <tr key={d.id} style={{borderBottom:`1px solid ${T.g100}`,
                  background:i%2===0?'#fff':T.g50}}>
                  <td style={{padding:'7px 10px',fontWeight:700,color:T.primary2,whiteSpace:'nowrap'}}>
                    {d.doc_number||'—'}
                  </td>
                  <td style={{padding:'7px 10px',maxWidth:180,overflow:'hidden',
                    textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{d.subject}</td>
                  <td style={{padding:'7px 10px',color:T.g400,whiteSpace:'nowrap'}}>
                    {d.unit_code||'—'}
                  </td>
                  <td style={{padding:'7px 10px',color:d.budget_amount>0?T.green:T.g400,
                    fontWeight:d.budget_amount>0?700:400,whiteSpace:'nowrap'}}>
                    {d.budget_amount>0?`฿${fmtMoney(d.budget_amount)}`:'—'}
                  </td>
                  <td style={{padding:'7px 10px'}}><Badge status={d.status}/></td>
                </tr>
              ))}
            </tbody>
          </table>
          {docs.length===0 && (
            <div style={{padding:24,textAlign:'center',color:T.g400}}>
              ยังไม่มีเอกสาร — ไปที่ "เกษียณหนังสือ" เพื่อเริ่มต้น
            </div>
          )}
        </div>

        {/* Notifications */}
        <div style={{background:'#fff',borderRadius:12,padding:'16px',
          boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight:700,color:T.primary,fontSize:14,marginBottom:12}}>
            🔔 การแจ้งเตือน
          </div>
          {notifications.slice(0,8).map(n => (
            <div key={n.id} style={{padding:'8px 10px',borderRadius:8,marginBottom:6,
              background:n.is_read?T.g50:`${T.primary2}11`,
              border:`1px solid ${n.is_read?T.g100:T.primary2+'33'}`}}>
              <div style={{fontSize:12,fontWeight:n.is_read?400:700,color:T.g800,
                overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {n.message}
              </div>
              <div style={{fontSize:10,color:T.g400,marginTop:2}}>
                {fmtDate(n.sent_at)}
              </div>
            </div>
          ))}
          {notifications.length===0 && (
            <div style={{textAlign:'center',color:T.g400,padding:20,fontSize:13}}>
              ไม่มีการแจ้งเตือน
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════
// INBOX — กล่องรออนุมัติ
// ═══════════════════════════════
function PageInbox({userInfo,perm,onSelectDoc}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadInbox()
  },[])

  const loadInbox = async () => {
    setLoading(true)
    const {data} = await supabase
      .from('sercoop_workflow_steps')
      .select('*, document:sercoop_documents(*)')
      .eq('status','pending')
      .order('created_at',{ascending:false})
    if(data) setItems(data)
    setLoading(false)
  }

  return(
    <div style={{padding:'20px',overflowY:'auto',flex:1}}>
      <div style={{fontWeight:700,color:T.primary,fontSize:15,marginBottom:16}}>
        🔔 กล่องรออนุมัติ ({items.length} รายการ)
      </div>
      {loading ? <div style={{textAlign:'center',padding:40,color:T.g400}}>⏳</div> : (
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {items.map(item => (
            <div key={item.id} style={{background:'#fff',borderRadius:12,
              padding:'14px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
              border:`1px solid ${T.amberL}`,cursor:'pointer'}}
              onClick={()=>onSelectDoc(item.document,item)}>
              <div style={{display:'flex',justifyContent:'space-between',
                alignItems:'flex-start',gap:10}}>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,color:T.primary,fontSize:14,marginBottom:4}}>
                    {item.document?.subject||'—'}
                  </div>
                  <div style={{fontSize:12,color:T.g600}}>
                    เลขที่: <strong>{item.document?.doc_number||'—'}</strong>
                    {' · '}ผู้จัดทำ: <strong>{item.document?.created_by_name||'—'}</strong>
                  </div>
                  <div style={{fontSize:12,color:T.g400,marginTop:2}}>
                    ขั้นตอน: {item.action_label}
                    {item.document?.budget_amount>0 && (
                      <span style={{marginLeft:8,fontWeight:700,color:T.green}}>
                        ฿{fmtMoney(item.document.budget_amount)}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{textAlign:'right',flexShrink:0}}>
                  <Badge status="pending_approval"/>
                  {item.due_date && (
                    <div style={{fontSize:10,color:T.red,marginTop:4}}>
                      กำหนดส่ง: {fmtDate(item.due_date)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {items.length===0 && (
            <div style={{background:'#fff',borderRadius:12,padding:40,
              textAlign:'center',color:T.g400,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <div style={{fontSize:40,marginBottom:12}}>✅</div>
              <div style={{fontSize:15,fontWeight:600,color:T.primary}}>ไม่มีเอกสารรออนุมัติ</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════
// WORKFLOW DETAIL — ดู + อนุมัติ
// ═══════════════════════════════
function PageWorkflowDetail({doc,stepFocus,onBack,userInfo,perm,onRefresh}) {
  const [steps, setSteps] = useState([])
  const [savedFiles, setSavedFiles] = useState([])
  const [comment, setComment] = useState('')
  const [showSig, setShowSig] = useState(false)
  const [sigData, setSigData] = useState(userInfo?.signature_data||'')
  const [signedDate, setSignedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const [files, setFiles] = useState([])
  const [dragIdx, setDragIdx] = useState(null)
  const onAddFile = useCallback(f=>setFiles(p=>[...p,f]),[])
  const onRemoveFile = useCallback(id=>setFiles(p=>p.filter(f=>f.id!==id)),[])

  useEffect(() => {
    if(doc?.id) {
      loadSteps()
      supabase.from('sercoop_doc_files').select('*')
        .eq('document_id',doc.id).then(({data})=>{if(data)setSavedFiles(data)})
    }
  },[doc])

  const loadSteps = async () => {
    const {data} = await supabase
      .from('sercoop_workflow_steps')
      .select('*')
      .eq('document_id',doc.id)
      .order('step_order')
    if(data) setSteps(data)
  }

  const handleAction = async (stepId, action) => {
    setLoading(true)
    const autoMsg = action==='approved'?'อนุมัติตามเสนอ'
      :action==='rejected'?'ไม่อนุมัติ'
      :action==='revised'?'ส่งกลับแก้ไข':'รับทราบ'
    const finalComment = comment || autoMsg

    await supabase.from('sercoop_workflow_steps').update({
      status: action,
      comment: finalComment,
      auto_comment: autoMsg,
      signature_data: sigData,
      signed_date: signedDate,
      acted_at: new Date().toISOString(),
      approver_name: userInfo?.full_name,
    }).eq('id', stepId)

    // อัปเดตขั้นตอนถัดไป
    if(action==='approved') {
      const cur = steps.find(s=>s.id===stepId)
      const next = steps.find(s=>s.step_order===cur.step_order+1&&s.status==='waiting')
      if(next) {
        await supabase.from('sercoop_workflow_steps').update({status:'pending'}).eq('id',next.id)
      } else {
        await supabase.from('sercoop_documents').update({
          status:'approved',updated_at:new Date().toISOString()
        }).eq('id',doc.id)
      }
    }
    if(action==='rejected'||action==='revised') {
      await supabase.from('sercoop_documents').update({
        status:action,updated_at:new Date().toISOString()
      }).eq('id',doc.id)
    }

    // Log
    await supabase.from('sercoop_audit_logs').insert({
      document_id:doc.id, user_id:userInfo?.user_id,
      user_name:userInfo?.full_name, action,
      detail:`${autoMsg}: ${finalComment}`
    })

    setMsg(`✅ ${autoMsg}เรียบร้อยแล้ว`)
    setComment('')
    await loadSteps()
    setLoading(false)
    onRefresh && onRefresh()
  }

  const skipStep = async (stepId) => {
    await supabase.from('sercoop_workflow_steps').update({
      status:'skipped', is_skipped:true, acted_at:new Date().toISOString()
    }).eq('id',stepId)
    const cur = steps.find(s=>s.id===stepId)
    const next = steps.find(s=>s.step_order===cur.step_order+1&&s.status==='waiting')
    if(next) await supabase.from('sercoop_workflow_steps').update({status:'pending'}).eq('id',next.id)
    await loadSteps()
  }

  const sc = {
    done:{bg:'#e8f5e9',c:'#2e7d32'},
    pending:{bg:'#fff8e1',c:'#f57f17'},
    approved:{bg:'#e8f5e9',c:'#2e7d32'},
    rejected:{bg:'#fee2e2',c:'#991b1b'},
    revised:{bg:'#ffedd5',c:'#9a3412'},
    waiting:{bg:'#e0f2fe',c:'#0369a1'},
    skipped:{bg:'#f1f5f9',c:'#94a3b8'},
    completed:{bg:'#d1fae5',c:'#065f46'},
  }

  const urgencyInfo = URGENCY[doc?.urgency]||URGENCY.normal

  return(
    <div style={{padding:'20px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
        <Btn onClick={onBack} outline color={T.g400}>← กลับ</Btn>
        <div>
          <div style={{fontWeight:800,fontSize:16,color:T.primary}}>{doc?.subject}</div>
          <div style={{fontSize:12,color:T.g400}}>
            {doc?.doc_number||'ยังไม่มีเลขที่'}
            {' · '}
            <span style={{color:urgencyInfo.color,fontWeight:600}}>{urgencyInfo.label}</span>
            {doc?.due_date && ` · กำหนดส่ง: ${fmtDate(doc.due_date)}`}
          </div>
        </div>
        <div style={{marginLeft:'auto'}}><Badge status={doc?.status}/></div>
      </div>

      {msg && <div style={{background:T.greenL,color:T.green,borderRadius:8,
        padding:'10px 14px',marginBottom:14,fontWeight:600}}>{msg}</div>}

      <div style={{display:'grid',gridTemplateColumns:'1fr 320px',gap:16,alignItems:'start'}}>
        {/* Left: Doc info + Files */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          {/* Doc details */}
          <div style={{background:'#fff',borderRadius:12,padding:'16px 18px',
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:700,color:T.primary,fontSize:13,
              marginBottom:12,paddingBottom:8,borderBottom:`2px solid ${T.primary3}`}}>
              📋 รายละเอียดเอกสาร
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'8px 16px',fontSize:13}}>
              {[
                ['เลขที่',doc?.doc_number||'—'],
                ['วันที่',fmtDate(doc?.created_at)],
                ['จาก',doc?.created_by_name||'—'],
                ['ตำแหน่ง',doc?.created_by_position||'—'],
                ['หน่วยงาน',doc?.created_by_unit||'—'],
                ['ถึง',doc?.to_person||'—'],
                ['ประเภท',doc?.doc_parent_type==='memo'?'บันทึกข้อความ':doc?.doc_parent_type==='outgoing'?'หนังสือส่ง':'หนังสือรับ'],
                ['งบประมาณ',doc?.budget_amount>0?`฿${fmtMoney(doc.budget_amount)}`:'—'],
              ].map(([k,v])=>(
                <div key={k} style={{borderBottom:`1px solid ${T.g100}`,paddingBottom:6}}>
                  <div style={{fontSize:10,color:T.g400}}>{k}</div>
                  <div style={{fontWeight:600,color:T.g800}}>{v}</div>
                </div>
              ))}
              {doc?.content && (
                <div style={{gridColumn:'span 2',borderBottom:`1px solid ${T.g100}`,paddingBottom:6}}>
                  <div style={{fontSize:10,color:T.g400}}>เนื้อหา</div>
                  <div style={{color:T.g800,lineHeight:1.6}}>{doc.content}</div>
                </div>
              )}
            </div>
          </div>

          {/* Files */}
          <div style={{background:'#fff',borderRadius:12,padding:'16px 18px',
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:700,color:T.primary,fontSize:13,marginBottom:10}}>
              📎 ไฟล์แนบ
            </div>
            <FileZone files={files} onAdd={onAddFile} onRemove={onRemoveFile} savedFiles={savedFiles}/>
          </div>
        </div>

        {/* Right: Workflow */}
        <div style={{background:'#fff',borderRadius:12,padding:'16px',
          boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight:700,color:T.primary,fontSize:13,marginBottom:14}}>
            ⚙️ ขั้นตอน Workflow
          </div>
          {steps.map((s,i) => {
            const scc = sc[s.status]||sc.waiting
            const isPending = s.status==='pending'
            const isWaiting = s.status==='waiting'
            return(
              <div key={s.id} style={{display:'flex',gap:10,marginBottom:isPending?0:12}}>
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',width:32,flexShrink:0}}>
                  <div style={{width:28,height:28,borderRadius:'50%',
                    background:isPending?T.amber:scc.bg,
                    border:`2px solid ${isPending?T.amber:scc.c}`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontSize:12,fontWeight:700,color:isPending?'#fff':scc.c,
                    boxShadow:isPending?`0 0 0 4px ${T.amberL}`:undefined,
                    flexShrink:0}}>
                    {s.status==='approved'||s.status==='done'?'✓'
                      :s.status==='rejected'?'✗'
                      :s.status==='skipped'?'—'
                      :s.status==='pending'?'!'
                      :i+1}
                  </div>
                  {i<steps.length-1 && (
                    <div style={{width:2,flex:1,minHeight:10,
                      background:['approved','done','completed'].includes(s.status)?T.green:T.g200,
                      margin:'3px 0'}}/>
                  )}
                </div>
                <div style={{flex:1,marginBottom:isPending?12:0}}>
                  <div style={{background:isPending?T.amberL:T.g50,
                    border:`1px solid ${isPending?T.amber:T.g200}`,
                    borderRadius:9,padding:'10px 12px'}}>
                    <div style={{display:'flex',justifyContent:'space-between',
                      alignItems:'flex-start',gap:6,flexWrap:'wrap'}}>
                      <div>
                        <div style={{fontWeight:700,color:T.primary,fontSize:12}}>
                          {s.assignee_name||s.assignee_position||`ขั้นตอนที่ ${s.step_order}`}
                        </div>
                        <div style={{fontSize:11,color:T.g600}}>{s.action_label}</div>
                        {s.comment && (
                          <div style={{fontSize:11,color:T.g800,marginTop:4,
                            fontStyle:'italic',borderLeft:`2px solid ${T.primary2}`,paddingLeft:6}}>
                            "{s.comment}"
                          </div>
                        )}
                        {s.signature_data && (
                          <div style={{marginTop:6}}>
                            <img src={s.signature_data} alt="ลายเซ็น"
                              style={{height:36,border:`1px solid ${T.g200}`,borderRadius:4}}/>
                            {s.signed_date && (
                              <div style={{fontSize:10,color:T.g400,marginTop:2}}>
                                {fmtDate(s.signed_date)}
                              </div>
                            )}
                          </div>
                        )}
                        {s.acted_at && (
                          <div style={{fontSize:10,color:T.g400,marginTop:2}}>
                            ⏱ {new Date(s.acted_at).toLocaleString('th-TH')}
                          </div>
                        )}
                      </div>
                      <span style={{background:scc.bg,color:scc.c,borderRadius:20,
                        padding:'2px 8px',fontSize:10,fontWeight:700,flexShrink:0}}>
                        {s.status==='approved'?'✔ อนุมัติ'
                          :s.status==='rejected'?'✗ ไม่อนุมัติ'
                          :s.status==='pending'?'⏳ รอดำเนินการ'
                          :s.status==='revised'?'🔄 แก้ไข'
                          :s.status==='skipped'?'— ข้าม'
                          :s.status==='waiting'?'🔵 รอคิว':'✅ เสร็จ'}
                      </span>
                    </div>

                    {/* Action buttons for pending */}
                    {isPending && (
                      <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${T.amber}44`}}>
                        <div style={{marginBottom:8}}>
                          <textarea value={comment} onChange={e=>setComment(e.target.value)}
                            placeholder="ความคิดเห็น / เหตุผล (ถ้ามี)" rows={2}
                            style={{...inpStyle,resize:'vertical',fontSize:12}}/>
                        </div>
                        {/* Signature */}
                        <div style={{marginBottom:8}}>
                          {sigData ? (
                            <div style={{display:'flex',alignItems:'center',gap:8}}>
                              <img src={sigData} alt="ลายเซ็น"
                                style={{height:40,border:`1px solid ${T.g200}`,borderRadius:4}}/>
                              <Btn sm outline color={T.g400} onClick={()=>setShowSig(true)}>เปลี่ยนลายเซ็น</Btn>
                            </div>
                          ) : (
                            <Btn sm outline color={T.primary2} onClick={()=>setShowSig(true)}>✍️ ลงนาม</Btn>
                          )}
                        </div>
                        <div style={{marginBottom:8,display:'flex',alignItems:'center',gap:8}}>
                          <label style={{fontSize:12,color:T.g600,flexShrink:0}}>วันที่:</label>
                          <input type="date" value={signedDate}
                            onChange={e=>setSignedDate(e.target.value)}
                            style={{...inpStyle,width:'auto'}}/>
                        </div>
                        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
                          <Btn sm color={T.green} onClick={()=>handleAction(s.id,'approved')} disabled={loading}>
                            ✔ อนุมัติ
                          </Btn>
                          <Btn sm color={T.primary2} onClick={()=>handleAction(s.id,'acknowledged')} disabled={loading}>
                            👁 รับทราบ
                          </Btn>
                          <Btn sm danger onClick={()=>handleAction(s.id,'rejected')} disabled={loading}>
                            ✗ ไม่อนุมัติ
                          </Btn>
                          <Btn sm color={T.orange} onClick={()=>handleAction(s.id,'revised')} disabled={loading}>
                            🔄 แก้ไข
                          </Btn>
                        </div>
                      </div>
                    )}
                    {/* Skip button for waiting (editable) */}
                    {isWaiting && s.is_skippable && (
                      <div style={{marginTop:6}}>
                        <Btn sm outline color={T.g400} onClick={()=>skipStep(s.id)}>ข้ามขั้นตอนนี้</Btn>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Signature Modal */}
      {showSig && (
        <Modal title="✍️ ลงลายเซ็น" onClose={()=>setShowSig(false)} width={500}>
          <SignaturePad
            existing={sigData}
            onSave={data=>{setSigData(data);setShowSig(false)}}/>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════
// CREATE DOCUMENT
// ═══════════════════════════════
function PageCreateDoc({user,userInfo,perm,onSaved,onBack}) {
  const [step, setStep] = useState(0)
  const [parentType, setParentType] = useState('memo')
  const [docType, setDocType] = useState(null)
  const [docTypes, setDocTypes] = useState([])
  const [units, setUnits] = useState([])
  const [approvers, setApprovers] = useState([])
  const [budgetCats, setBudgetCats] = useState([])
  const [budgetPlans, setBudgetPlans] = useState([])
  const [workflowSteps, setWorkflowSteps] = useState([])
  const [files, setFiles] = useState([])
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [showAddStep, setShowAddStep] = useState(false)
  const [dragIdx, setDragIdx] = useState(null)
  const onAddFile = useCallback(f=>setFiles(p=>[...p,f]),[])
  const onRemoveFile = useCallback(id=>setFiles(p=>p.filter(f=>f.id!==id)),[])

  const refs = {
    subject: useRef(''),
    fromPerson: useRef(userInfo?.full_name||''),
    fromPosition: useRef(userInfo?.position_name||''),
    toPerson: useRef(''),
    toPosition: useRef(''),
    content: useRef(''),
    notes: useRef(''),
    budgetAmount: useRef(''),
    dueDate: useRef(''),
  }
  const [urgency, setUrgency] = useState('normal')
  const [selBudgetCat, setSelBudgetCat] = useState('')
  const [selBudgetPlan, setSelBudgetPlan] = useState(null)
  const [budgetVal, setBudgetVal] = useState(0)
  const [workflowType, setWorkflowType] = useState(1)

  useEffect(() => {
    supabase.from('sercoop_doc_types').select('*').eq('is_active',true).order('sort_order')
      .then(({data})=>{if(data)setDocTypes(data)})
    supabase.from('sercoop_units').select('*').eq('is_active',true).order('sort_order')
      .then(({data})=>{if(data)setUnits(data)})
    supabase.from('sercoop_approvers').select('*').eq('is_active',true).order('sort_order')
      .then(({data})=>{if(data)setApprovers(data)})
    supabase.from('sercoop_budget_categories').select('*').eq('is_active',true).order('sort_order')
      .then(({data})=>{if(data)setBudgetCats(data)})
  },[])

  useEffect(() => {
    if(selBudgetCat) {
      const yr = new Date().getFullYear() + 543
      supabase.from('sercoop_budget_plans')
        .select('*')
        .eq('category_id',selBudgetCat)
        .eq('fiscal_year',yr)
        .then(({data})=>{if(data)setBudgetPlans(data)})
    }
  },[selBudgetCat])

  const buildAutoWorkflow = useCallback(() => {
    const b = budgetVal
    const steps = [{
      step_order:1, assignee_name:userInfo?.full_name||'เจ้าหน้าที่',
      assignee_position:userInfo?.position_name||'', action_label:'จัดทำและส่งเอกสาร',
      step_type:'submit', status:'done', is_skippable:false
    }]
    if(workflowType===1) {
      steps.push({step_order:2,assignee_name:'ผู้จัดการหน่วยธุรกิจ',
        action_label:'พิจารณา/อนุมัติ',step_type:'approve',status:'pending',is_skippable:false})
    } else if(workflowType===2) {
      steps.push({step_order:2,assignee_name:'ผู้จัดการหน่วยธุรกิจ',
        action_label:'พิจารณา/อนุมัติ',step_type:'approve',status:'pending',is_skippable:false})
      steps.push({step_order:3,assignee_name:'ผู้ที่เกี่ยวข้อง',
        action_label:'รับทราบ',step_type:'acknowledge',status:'waiting',is_skippable:true})
    } else {
      steps.push({step_order:2,assignee_name:'ผู้จัดการหน่วยธุรกิจ',
        action_label:'เห็นชอบ/ส่งต่อ',step_type:'approve',status:'pending',is_skippable:false})
      steps.push({step_order:3,assignee_name:'ฝ่ายบริหารงานทั่วไป',
        action_label:'พิจารณา',step_type:'review',status:'waiting',is_skippable:false})
      if(b>0) {
        if(b<=30000) {
          steps.push({step_order:4,assignee_name:'ผู้จัดการหน่วยธุรกิจ',
            action_label:'อนุมัติ (≤30,000)',step_type:'approve',status:'waiting',is_skippable:false})
        } else if(b<=100000) {
          steps.push({step_order:4,assignee_name:'ผู้จัดการใหญ่',
            action_label:'อนุมัติ (≤100,000)',step_type:'approve',status:'waiting',is_skippable:false})
        } else if(b<=500000) {
          steps.push({step_order:4,assignee_name:'เหรัญญิก',
            action_label:'พิจารณา (≤500,000)',step_type:'approve',status:'waiting',is_skippable:false})
          steps.push({step_order:5,assignee_name:'ประธานกรรมการ',
            action_label:'อนุมัติ',step_type:'approve',status:'waiting',is_skippable:false})
        } else {
          steps.push({step_order:4,assignee_name:'ผู้จัดการใหญ่',
            action_label:'พิจารณา',step_type:'approve',status:'waiting',is_skippable:false})
          steps.push({step_order:5,assignee_name:'ประธานกรรมการ',
            action_label:'อนุมัติ (>500,000)',step_type:'approve',status:'waiting',is_skippable:false})
        }
      }
    }
    steps.push({step_order:steps.length+1,assignee_name:'เจ้าหน้าที่ผู้จัดทำ',
      action_label:'ดำเนินการและบันทึกในระบบ',step_type:'complete',status:'waiting',is_skippable:false})
    return steps
  },[budgetVal,workflowType,userInfo])

  const handleNext = () => {
    if(!refs.subject.current.trim()){setMsg('❌ กรุณากรอกเรื่อง');return}
    setMsg('')
    const auto = buildAutoWorkflow()
    setWorkflowSteps(auto)
    setStep(1)
  }

  const handleSave = async(status='draft') => {
    if(!refs.subject.current.trim()){setMsg('❌ กรุณากรอกเรื่อง');return}
    setSaving(true);setMsg('')
    try {
      // Generate doc number
      const yr = new Date().getFullYear()+543
      const unitCode = userInfo?.unit_code||'01'
      const typeCode = docType?.type_code||''
      const {count} = await supabase.from('sercoop_documents')
        .select('*',{count:'exact',head:true})
        .eq('doc_year',yr)
        .eq('doc_parent_type',parentType)

      const seq = String((count||0)+1).padStart(2,'0')
      let docNum = ''
      if(unitCode==='01') {
        const typeNum = typeCode.replace('MEMO-','').replace('OUT-','')
        docNum = `สบ.ม.อ. ${unitCode} / ${typeNum}-${seq}(${yr})`
      } else {
        docNum = `สบ.ม.อ. ${unitCode} / ${seq}(${yr})`
      }

      const payload = {
        doc_number: status==='draft' ? null : docNum,
        doc_year: yr,
        doc_sequence: parseInt(seq),
        doc_type_id: docType?.id||null,
        doc_parent_type: parentType,
        unit_id: userInfo?.unit_id||null,
        subject: refs.subject.current,
        from_person: refs.fromPerson.current,
        from_position: refs.fromPosition.current,
        to_person: refs.toPerson.current,
        to_position: refs.toPosition.current,
        content: refs.content.current,
        urgency, due_date: refs.dueDate.current||null,
        budget_category_id: selBudgetCat||null,
        budget_amount: budgetVal||0,
        workflow_type: workflowType,
        status,
        created_by: user?.id,
        created_by_name: userInfo?.full_name||'',
        created_by_position: userInfo?.position_name||'',
        created_by_unit: userInfo?.unit_name||'',
        notes: refs.notes.current,
      }

      const {data:docData,error:docErr} = await supabase
        .from('sercoop_documents').insert(payload).select().single()
      if(docErr) throw docErr

      // Upload files
      for(const f of files) {
        const path = `docs/${docData.id}/${Date.now()}_${f.name}`
        const {error:upErr} = await supabase.storage.from('documents').upload(path,f.file)
        if(!upErr) await supabase.from('sercoop_doc_files').insert({
          document_id:docData.id, file_name:f.name,
          file_path:path, file_size:f.size, file_type:f.name.split('.').pop(),
          uploaded_by:user?.id
        })
      }

      // Create workflow
      if(status!=='draft') {
        const wfData = workflowSteps.map(s=>({...s, document_id:docData.id}))
        await supabase.from('sercoop_workflow_steps').insert(wfData)
      }

      // Audit log
      await supabase.from('sercoop_audit_logs').insert({
        document_id:docData.id, user_id:user?.id,
        user_name:userInfo?.full_name, action:'created',
        detail:`สร้างเอกสาร: ${payload.subject}`
      })

      setMsg(status==='draft'?'✅ บันทึกร่างสำเร็จ!':'✅ ส่ง Workflow สำเร็จ!')
      setTimeout(()=>onSaved(),1200)
    } catch(e) { setMsg('❌ '+e.message) }
    setSaving(false)
  }

  const movStep = (idx,dir) => {
    const arr = [...workflowSteps]
    const target = idx+dir
    if(target<0||target>=arr.length) return
    const tmp = arr[idx]; arr[idx] = arr[target]; arr[target] = tmp
    arr.forEach((s,i)=>s.step_order=i+1)
    setWorkflowSteps(arr)
  }

  const removeStep = (idx) => {
    const arr = workflowSteps.filter((_,i)=>i!==idx)
    arr.forEach((s,i)=>s.step_order=i+1)
    setWorkflowSteps(arr)
  }

  const memoTypes = docTypes.filter(t=>t.parent_type==='memo')
  const outTypes = docTypes.filter(t=>t.parent_type==='outgoing')

  return(
    <div style={{padding:'20px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:18}}>
        {step>0 ? <Btn onClick={()=>setStep(0)} outline color={T.g400}>← แก้ไขข้อมูล</Btn>
          : <Btn onClick={onBack} outline color={T.g400}>← กลับ</Btn>}
        <div>
          <div style={{fontWeight:800,fontSize:16,color:T.primary}}>
            {step===0?'สร้างเอกสารใหม่':'ตรวจสอบ Workflow ก่อนส่ง'}
          </div>
          <div style={{fontSize:12,color:T.g400}}>
            {step===0?'กรอกข้อมูลเอกสารและกำหนด Workflow':'ปรับแก้ลำดับขั้นตอนได้'}
          </div>
        </div>
      </div>

      {msg && <div style={{background:msg.includes('✅')?T.greenL:T.redL,
        color:msg.includes('✅')?T.green:T.red,
        borderRadius:8,padding:'10px 14px',marginBottom:14,fontWeight:600}}>{msg}</div>}

      {step===0 && (
        <div style={{display:'grid',gridTemplateColumns:'1fr 300px',gap:16,alignItems:'start'}}>
          <div style={{background:'#fff',borderRadius:12,padding:20,
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            {/* ประเภทเอกสาร */}
            <div style={{fontWeight:700,color:T.primary,fontSize:14,
              marginBottom:14,paddingBottom:10,borderBottom:`2px solid ${T.primary3}`}}>
              📝 ประเภทเอกสาร
            </div>
            <div style={{display:'flex',gap:6,marginBottom:14}}>
              {[{k:'memo',l:'📝 บันทึกข้อความ'},{k:'outgoing',l:'📤 หนังสือส่ง'}].map(t=>(
                <button key={t.k} onClick={()=>{setParentType(t.k);setDocType(null)}}
                  style={{flex:1,padding:'10px',border:`2px solid ${parentType===t.k?T.primary2:T.g200}`,
                    borderRadius:9,background:parentType===t.k?T.primary3:'#fff',
                    color:parentType===t.k?T.primary:T.g600,
                    fontFamily:'Sarabun',fontWeight:parentType===t.k?700:400,
                    cursor:'pointer',fontSize:13}}>{t.l}</button>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,marginBottom:16}}>
              {(parentType==='memo'?memoTypes:outTypes).map(c=>(
                <div key={c.id} onClick={()=>setDocType(c)}
                  style={{padding:'10px',border:`2px solid ${docType?.id===c.id?T.primary2:T.g200}`,
                    borderRadius:9,cursor:'pointer',
                    background:docType?.id===c.id?T.primary3:'#fff',transition:'all 0.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=T.primary2}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=docType?.id===c.id?T.primary2:T.g200}>
                  <div style={{fontSize:11,fontWeight:700,
                    color:docType?.id===c.id?T.primary:T.g800,lineHeight:1.3}}>{c.type_name}</div>
                  <div style={{fontSize:9,color:T.primary2,marginTop:2}}>{c.type_code}</div>
                </div>
              ))}
            </div>

            {/* ข้อมูลเอกสาร */}
            <div style={{fontWeight:700,color:T.primary,fontSize:14,
              marginBottom:14,paddingBottom:10,borderBottom:`2px solid ${T.primary3}`}}>
              📋 ข้อมูลเอกสาร
            </div>
            <div style={{background:T.primary3,borderRadius:8,padding:'8px 12px',
              marginBottom:12,fontSize:12,color:T.primary}}>
              <b>✍️ ผู้ออกเอกสาร:</b> {userInfo?.full_name}
              {userInfo?.position_name && ` · ${userInfo.position_name}`}
              {userInfo?.unit_name && ` · ${userInfo.unit_name}`}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px 14px'}}>
              <div style={{gridColumn:'span 2'}}>
                <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>
                  เรื่อง <span style={{color:T.red}}>*</span>
                </label>
                <input defaultValue={refs.subject.current}
                  onChange={e=>refs.subject.current=e.target.value}
                  placeholder="ระบุเรื่องของเอกสาร" style={inpStyle}/>
              </div>
              <div>
                <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>จาก (ผู้ส่ง)</label>
                <input defaultValue={refs.fromPerson.current}
                  onChange={e=>refs.fromPerson.current=e.target.value} style={inpStyle}/>
              </div>
              <div>
                <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>ตำแหน่งผู้ส่ง</label>
                <input defaultValue={refs.fromPosition.current}
                  onChange={e=>refs.fromPosition.current=e.target.value} style={inpStyle}/>
              </div>
              <div>
                <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>ถึง (ผู้รับ)</label>
                <input defaultValue={refs.toPerson.current}
                  onChange={e=>refs.toPerson.current=e.target.value} style={inpStyle}/>
              </div>
              <div>
                <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>ตำแหน่งผู้รับ</label>
                <input defaultValue={refs.toPosition.current}
                  onChange={e=>refs.toPosition.current=e.target.value} style={inpStyle}/>
              </div>
              <div>
                <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>ชั้นความสำคัญ</label>
                <select value={urgency} onChange={e=>setUrgency(e.target.value)} style={inpStyle}>
                  {Object.entries(URGENCY).map(([k,v])=>(
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>กำหนดส่ง (ถ้ามี)</label>
                <input type="date" defaultValue={refs.dueDate.current}
                  onChange={e=>refs.dueDate.current=e.target.value} style={inpStyle}/>
              </div>
              <div style={{gridColumn:'span 2'}}>
                <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>เนื้อหา / สรุปเรื่อง</label>
                <textarea defaultValue={refs.content.current}
                  onChange={e=>refs.content.current=e.target.value}
                  rows={4} style={{...inpStyle,resize:'vertical'}}/>
              </div>
              <div style={{gridColumn:'span 2'}}>
                <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>หมายเหตุ</label>
                <textarea defaultValue={refs.notes.current}
                  onChange={e=>refs.notes.current=e.target.value}
                  rows={2} style={{...inpStyle,resize:'vertical'}}/>
              </div>
            </div>

            {/* งบประมาณ */}
            <div style={{background:T.amberL,borderRadius:9,padding:'12px 14px',
              marginTop:14,border:`1px solid ${T.amber}33`}}>
              <div style={{fontWeight:700,color:T.amber,fontSize:13,marginBottom:10}}>💰 งบประมาณ</div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'10px 14px'}}>
                <div>
                  <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>หมวดงบประมาณ</label>
                  <select value={selBudgetCat} onChange={e=>setSelBudgetCat(e.target.value)} style={inpStyle}>
                    <option value="">-- เลือกหมวด --</option>
                    {budgetCats.filter(b=>b.level===1).map(b=>(
                      <optgroup key={b.id} label={`${b.category_code}. ${b.category_name}`}>
                        {budgetCats.filter(c=>c.parent_code===b.category_code).map(c=>(
                          <option key={c.id} value={c.id}>{c.category_code} {c.category_name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>วงเงินที่ขออนุมัติ (บาท)</label>
                  <input type="number" defaultValue={refs.budgetAmount.current}
                    onChange={e=>{refs.budgetAmount.current=e.target.value;setBudgetVal(parseFloat(e.target.value)||0)}}
                    placeholder="0 = ไม่มีวงเงิน" style={inpStyle}/>
                </div>
              </div>
              {budgetVal>0 && (
                <div style={{marginTop:8,fontSize:12,color:T.primary,fontWeight:600}}>
                  ⚡ เส้นทางอนุมัติ: {budgetVal<=30000?'ผจก.หน่วยธุรกิจ':budgetVal<=100000?'ผจก.ใหญ่':budgetVal<=500000?'เหรัญญิก → ประธาน':'ประธาน/กก.อำนวยการ'}
                </div>
              )}
            </div>

            {/* Files */}
            <div style={{marginTop:14,paddingTop:14,borderTop:`1px solid ${T.g200}`}}>
              <div style={{fontWeight:700,color:T.primary,fontSize:13,marginBottom:8}}>📎 แนบไฟล์เอกสาร</div>
              <div style={{fontSize:11,color:T.g400,marginBottom:6}}>
                💡 แนบไฟล์ PDF จากภายนอกได้โดยตรง ไม่ต้องออกเอกสารจากระบบ
              </div>
              <FileZone files={files} onAdd={onAddFile} onRemove={onRemoveFile} savedFiles={[]}/>
            </div>

            <div style={{display:'flex',gap:8,justifyContent:'flex-end',
              marginTop:16,paddingTop:14,borderTop:`1px solid ${T.g200}`}}>
              <Btn onClick={onBack} outline color={T.g400}>ยกเลิก</Btn>
              <Btn onClick={()=>handleSave('draft')} outline color={T.primary2} disabled={saving}>💾 บันทึกร่าง</Btn>
              <Btn onClick={handleNext} color={T.primary} disabled={saving}>ถัดไป: ตั้ง Workflow →</Btn>
            </div>
          </div>

          {/* Right: Workflow type */}
          <div style={{background:'#fff',borderRadius:12,padding:16,
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:700,color:T.primary,fontSize:13,marginBottom:12}}>
              🔄 ประเภท Workflow
            </div>
            {[
              {k:1,l:'อนุมัติภายในหน่วย',d:'ผจก.หน่วยธุรกิจอนุมัติได้เลย'},
              {k:2,l:'อนุมัติภายใน + แจ้งทราบ',d:'อนุมัติในหน่วย แต่ต้องแจ้งผู้เกี่ยวข้อง'},
              {k:3,l:'ส่งสำนักงานใหญ่',d:'เกินอำนาจหน่วย ส่งสนญ.พิจารณา'},
            ].map(t=>(
              <div key={t.k} onClick={()=>setWorkflowType(t.k)}
                style={{padding:'12px',border:`2px solid ${workflowType===t.k?T.primary2:T.g200}`,
                  borderRadius:9,cursor:'pointer',marginBottom:8,
                  background:workflowType===t.k?T.primary3:'#fff'}}>
                <div style={{fontSize:13,fontWeight:700,
                  color:workflowType===t.k?T.primary:T.g800}}>
                  {t.k}. {t.l}
                </div>
                <div style={{fontSize:11,color:T.g400,marginTop:2}}>{t.d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step===1 && (
        <div style={{background:'#fff',borderRadius:12,padding:20,
          boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight:700,color:T.primary,fontSize:14,marginBottom:4}}>
            ⚙️ ลำดับขั้นตอน Workflow
          </div>
          <div style={{fontSize:12,color:T.g400,marginBottom:16}}>
            ลาก ▲▼ เพื่อเรียงลำดับ · คลิก ✕ เพื่อลบขั้นตอน · เพิ่มขั้นตอนได้ตามต้องการ
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8,marginBottom:14}}>
            {workflowSteps.map((s,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',gap:10,
                padding:'10px 14px',border:`1px solid ${T.g200}`,borderRadius:9,
                background:s.status==='done'?T.greenL:s.status==='pending'?T.amberL:'#fff'}}>
                <div style={{display:'flex',flexDirection:'column',gap:2}}>
                  <button onClick={()=>movStep(i,-1)} disabled={i===0}
                    style={{background:'none',border:'none',cursor:i===0?'default':'pointer',
                      fontSize:12,color:i===0?T.g200:T.g600,lineHeight:1}}>▲</button>
                  <button onClick={()=>movStep(i,1)} disabled={i===workflowSteps.length-1}
                    style={{background:'none',border:'none',
                      cursor:i===workflowSteps.length-1?'default':'pointer',
                      fontSize:12,color:i===workflowSteps.length-1?T.g200:T.g600,lineHeight:1}}>▼</button>
                </div>
                <div style={{width:24,height:24,borderRadius:'50%',
                  background:s.status==='done'?T.green:T.primary,
                  color:'#fff',display:'flex',alignItems:'center',
                  justifyContent:'center',fontSize:11,fontWeight:700,flexShrink:0}}>
                  {s.status==='done'?'✓':i+1}
                </div>
                <div style={{flex:1}}>
                  <input value={s.assignee_name||''} onChange={e=>{
                    const arr=[...workflowSteps];arr[i].assignee_name=e.target.value;setWorkflowSteps(arr)
                  }} placeholder="ชื่อ/ตำแหน่งผู้อนุมัติ"
                    style={{...inpStyle,marginBottom:4,fontSize:12}}/>
                  <input value={s.action_label||''} onChange={e=>{
                    const arr=[...workflowSteps];arr[i].action_label=e.target.value;setWorkflowSteps(arr)
                  }} placeholder="การดำเนินการ เช่น พิจารณา/อนุมัติ"
                    style={{...inpStyle,fontSize:11}}/>
                </div>
                <label style={{display:'flex',alignItems:'center',gap:4,fontSize:11,
                  color:T.g600,cursor:'pointer',flexShrink:0}}>
                  <input type="checkbox" checked={s.is_skippable||false}
                    onChange={e=>{const arr=[...workflowSteps];arr[i].is_skippable=e.target.checked;setWorkflowSteps(arr)}}/>
                  ข้ามได้
                </label>
                {s.status!=='done' && (
                  <button onClick={()=>removeStep(i)}
                    style={{background:'none',border:'none',cursor:'pointer',
                      color:T.red,fontSize:16,flexShrink:0}}>✕</button>
                )}
              </div>
            ))}
          </div>
          <Btn sm outline color={T.primary2} onClick={()=>{
            setWorkflowSteps(p=>[...p,{
              step_order:p.length+1,assignee_name:'',action_label:'พิจารณา/อนุมัติ',
              step_type:'approve',status:'waiting',is_skippable:false
            }])
          }}>＋ เพิ่มขั้นตอน</Btn>

          <div style={{display:'flex',gap:8,justifyContent:'flex-end',
            marginTop:16,paddingTop:14,borderTop:`1px solid ${T.g200}`}}>
            <Btn onClick={()=>setStep(0)} outline color={T.g400}>← แก้ไขข้อมูล</Btn>
            <Btn onClick={()=>handleSave('draft')} outline color={T.primary2} disabled={saving}>💾 บันทึกร่าง</Btn>
            <Btn onClick={()=>handleSave('submitted')} color={T.primary} disabled={saving}>
              {saving?'⏳ กำลังส่ง...':'📤 ส่ง Workflow'}
            </Btn>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════
// DOCUMENT LIST
// ═══════════════════════════════
function PageDoc({user,userInfo,perm,onSelectDoc}) {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  const loadDocs = useCallback(async() => {
    setLoading(true)
    const {data} = await supabase.from('sercoop_documents')
      .select('*').order('created_at',{ascending:false})
    if(data) setDocs(data)
    setLoading(false)
  },[])

  useEffect(()=>{loadDocs()},[])

  if(showCreate) return <PageCreateDoc user={user} userInfo={userInfo} perm={perm}
    onSaved={()=>{setShowCreate(false);loadDocs()}}
    onBack={()=>setShowCreate(false)}/>

  const filtered = docs.filter(d => {
    const mt = filterType==='all' || d.doc_parent_type===filterType
    const ms = filterStatus==='all' || d.status===filterStatus
    const mq = !search || d.subject?.includes(search) ||
      d.doc_number?.includes(search) || d.created_by_name?.includes(search)
    return mt&&ms&&mq
  })

  const role = PERMISSIONS[perm?.role]||PERMISSIONS.staff

  return(
    <div style={{padding:'20px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',gap:8,marginBottom:12,flexWrap:'wrap',alignItems:'center'}}>
        <div style={{display:'flex',flex:1,maxWidth:360,
          border:`1px solid ${T.g200}`,borderRadius:7,overflow:'hidden'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="ค้นหาเลขที่ / เรื่อง / ผู้จัดทำ..."
            style={{flex:1,border:'none',padding:'8px 12px',fontSize:13,
              fontFamily:'Sarabun',outline:'none'}}/>
          <div style={{padding:'0 10px',display:'flex',alignItems:'center',
            background:T.primary2,color:'#fff'}}>🔍</div>
        </div>
        <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
          {[{k:'all',l:'ทั้งหมด'},{k:'memo',l:'📝 บันทึก'},
            {k:'outgoing',l:'📤 หนังสือส่ง'},{k:'incoming',l:'📥 หนังสือรับ'}].map(t=>(
            <button key={t.k} onClick={()=>setFilterType(t.k)} style={{
              padding:'6px 10px',border:`1px solid ${filterType===t.k?T.primary2:T.g200}`,
              borderRadius:6,background:filterType===t.k?T.primary2:'#fff',
              color:filterType===t.k?'#fff':T.g600,
              fontFamily:'Sarabun',fontSize:12,cursor:'pointer',
              fontWeight:filterType===t.k?700:400}}>{t.l}</button>
          ))}
        </div>
        <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}
          style={{...inpStyle,width:'auto',padding:'6px 10px',fontSize:12}}>
          <option value="all">ทุกสถานะ</option>
          {Object.entries(STATUS_CONFIG).map(([k,v])=>(
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
        <Btn onClick={loadDocs} outline color={T.primary2} sm>🔄</Btn>
        {role.canCreate && (
          <Btn onClick={()=>setShowCreate(true)} color={T.primary}>＋ สร้างเอกสาร</Btn>
        )}
      </div>

      {loading ? <div style={{textAlign:'center',padding:40,color:T.g400}}>⏳ กำลังโหลด...</div> : (
        <div style={{background:'#fff',borderRadius:10,overflow:'hidden',
          boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <table style={{width:'100%',borderCollapse:'collapse'}}>
            <thead>
              <tr style={{background:T.primary}}>
                {['เลขที่','ประเภท','เรื่อง','ผู้จัดทำ','หน่วยงาน','งบ','ความสำคัญ','สถานะ',''].map(h=>(
                  <th key={h} style={{padding:'9px 10px',textAlign:'left',
                    color:'#fff',fontWeight:600,fontSize:11}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((d,i)=>(
                <tr key={d.id}
                  style={{borderBottom:`1px solid ${T.g100}`,
                    background:i%2===0?'#fff':T.g50,cursor:'pointer'}}
                  onClick={()=>onSelectDoc(d)}
                  onMouseEnter={e=>e.currentTarget.style.background=T.primary3}
                  onMouseLeave={e=>e.currentTarget.style.background=i%2===0?'#fff':T.g50}>
                  <td style={{padding:'9px 10px',fontWeight:700,
                    color:T.primary2,fontSize:11,whiteSpace:'nowrap'}}>
                    {d.doc_number||<span style={{color:T.g400}}>ร่าง</span>}
                  </td>
                  <td style={{padding:'9px 10px'}}>
                    <span style={{fontSize:14}}>
                      {d.doc_parent_type==='memo'?'📝':d.doc_parent_type==='outgoing'?'📤':'📥'}
                    </span>
                  </td>
                  <td style={{padding:'9px 10px',fontSize:12,maxWidth:180,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                    {d.subject}
                  </td>
                  <td style={{padding:'9px 10px',fontSize:11,color:T.g600}}>
                    {d.created_by_name||'—'}
                  </td>
                  <td style={{padding:'9px 10px',fontSize:11,color:T.g400}}>
                    {d.created_by_unit||'—'}
                  </td>
                  <td style={{padding:'9px 10px',fontSize:11,fontWeight:600,
                    color:d.budget_amount>0?T.green:T.g400,whiteSpace:'nowrap'}}>
                    {d.budget_amount>0?`฿${fmtMoney(d.budget_amount)}`:'—'}
                  </td>
                  <td style={{padding:'9px 10px'}}>
                    <span style={{fontSize:11,fontWeight:600,
                      color:URGENCY[d.urgency]?.color||T.g600}}>
                      {URGENCY[d.urgency]?.label||'ปกติ'}
                    </span>
                  </td>
                  <td style={{padding:'9px 10px'}}><Badge status={d.status}/></td>
                  <td style={{padding:'9px 10px'}}>
                    <Btn sm color={T.primary2}
                      onClick={e=>{e.stopPropagation();onSelectDoc(d)}}>ดู</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && (
            <div style={{padding:40,textAlign:'center',color:T.g400}}>ไม่พบเอกสาร</div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════
function PageProfile({user,userInfo,setUserInfo}) {
  const [form, setForm] = useState({
    full_name: userInfo?.full_name||'',
    phone: userInfo?.phone||'',
    position_name: userInfo?.position_name||'',
  })
  const [showSig, setShowSig] = useState(false)
  const [sigData, setSigData] = useState(userInfo?.signature_data||'')
  const [msg, setMsg] = useState('')
  const [saving, setSaving] = useState(false)
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')

  const handleSave = async() => {
    setSaving(true);setMsg('')
    const {error} = await supabase.from('sercoop_users')
      .update({...form,signature_data:sigData,updated_at:new Date().toISOString()})
      .eq('user_id',user.id)
    if(!error) {
      setMsg('✅ บันทึกสำเร็จ!')
      setUserInfo(p=>({...p,...form,signature_data:sigData}))
    } else setMsg('❌ '+error.message)
    setSaving(false)
  }

  const handleChangePwd = async() => {
    if(newPwd!==confirmPwd){setMsg('❌ รหัสผ่านไม่ตรงกัน');return}
    if(newPwd.length<6){setMsg('❌ รหัสผ่านต้องมีอย่างน้อย 6 ตัว');return}
    const {error} = await supabase.auth.updateUser({password:newPwd})
    if(!error){setMsg('✅ เปลี่ยนรหัสผ่านสำเร็จ!');setShowChangePwd(false);setNewPwd('');setConfirmPwd('')}
    else setMsg('❌ '+error.message)
  }

  return(
    <div style={{padding:'20px',overflowY:'auto',flex:1,maxWidth:900,margin:'0 auto',width:'100%'}}>
      {msg && <div style={{background:msg.includes('✅')?T.greenL:T.redL,
        color:msg.includes('✅')?T.green:T.red,
        borderRadius:8,padding:'10px 14px',marginBottom:14,fontWeight:600}}>{msg}</div>}

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,alignItems:'start'}}>
        {/* ข้อมูลส่วนตัว */}
        <div style={{background:'#fff',borderRadius:12,padding:'20px',
          boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight:700,color:T.primary,fontSize:15,marginBottom:18,
            display:'flex',alignItems:'center',gap:8}}>
            👤 ข้อมูลส่วนตัว
          </div>
          {/* Avatar */}
          <div style={{textAlign:'center',marginBottom:20}}>
            <div style={{width:70,height:70,borderRadius:'50%',
              background:`linear-gradient(135deg,${T.primary2},${T.primary})`,
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:28,color:'#fff',fontWeight:700,margin:'0 auto 10px'}}>
              {form.full_name?.[0]?.toUpperCase()||'?'}
            </div>
            <div style={{fontSize:12,color:T.g400}}>{user?.email}</div>
          </div>
          {[['ชื่อ-สกุล','full_name'],['เบอร์โทร','phone'],['ตำแหน่ง','position_name']].map(([l,k])=>(
            <div key={k} style={{marginBottom:12}}>
              <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>{l}</label>
              <input value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inpStyle}/>
            </div>
          ))}
          <Btn full color={T.primary} onClick={handleSave} disabled={saving}>
            {saving?'⏳ กำลังบันทึก...':'✅ บันทึกข้อมูล'}
          </Btn>
        </div>

        {/* ลายเซ็น */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:'#fff',borderRadius:12,padding:'20px',
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:700,color:T.primary,fontSize:15,marginBottom:14,
              display:'flex',alignItems:'center',gap:8}}>
              ✍️ ลายเซ็น
            </div>
            {sigData ? (
              <div style={{textAlign:'center',marginBottom:12}}>
                <img src={sigData} alt="ลายเซ็น"
                  style={{maxHeight:80,border:`1px solid ${T.g200}`,
                    borderRadius:8,padding:8,background:T.g50}}/>
                <div style={{fontSize:11,color:T.g400,marginTop:6}}>ลายเซ็นปัจจุบัน</div>
              </div>
            ) : (
              <div style={{textAlign:'center',padding:'24px 0',color:T.g400,
                border:`2px dashed ${T.g200}`,borderRadius:8,marginBottom:12}}>
                <div style={{fontSize:32,marginBottom:6}}>✏️</div>
                <div style={{fontSize:13}}>ยังไม่มีลายเซ็น</div>
              </div>
            )}
            <SignaturePad
              existing={sigData}
              onSave={data=>{setSigData(data);setMsg('✅ บันทึกลายเซ็นชั่วคราว กด "บันทึกข้อมูล" เพื่อยืนยัน')}}/>
          </div>

          {/* เปลี่ยนรหัสผ่าน */}
          <div style={{background:'#fff',borderRadius:12,padding:'20px',
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:700,color:T.primary,fontSize:15,marginBottom:14,
              display:'flex',alignItems:'center',gap:8}}>
              🔒 ความปลอดภัย
            </div>
            {!showChangePwd ? (
              <Btn outline color={T.primary2} onClick={()=>setShowChangePwd(true)}>
                🔑 เปลี่ยนรหัสผ่าน
              </Btn>
            ) : (
              <div>
                <div style={{marginBottom:10}}>
                  <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>รหัสผ่านใหม่</label>
                  <input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} style={inpStyle}/>
                </div>
                <div style={{marginBottom:12}}>
                  <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>ยืนยันรหัสผ่านใหม่</label>
                  <input type="password" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} style={inpStyle}/>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <Btn sm outline color={T.g400} onClick={()=>setShowChangePwd(false)}>ยกเลิก</Btn>
                  <Btn sm color={T.primary} onClick={handleChangePwd}>บันทึก</Btn>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════
// ADMIN PANEL
// ═══════════════════════════════
function PageAdmin({user,userInfo,perm}) {
  const [tab, setTab] = useState('units')
  const [units, setUnits] = useState([])
  const [users, setUsers] = useState([])
  const [approvalRules, setApprovalRules] = useState([])
  const [budgetCats, setBudgetCats] = useState([])
  const [settings, setSettings] = useState({})
  const [msg, setMsg] = useState('')
  const [showModal, setShowModal] = useState(null)
  const [editItem, setEditItem] = useState(null)

  useEffect(()=>{
    loadAll()
  },[])

  const loadAll = async() => {
    const [u,us,ar,bc,st,pm] = await Promise.all([
      supabase.from('sercoop_units').select('*').order('sort_order'),
      supabase.from('sercoop_users').select('*,unit:sercoop_units(unit_name,unit_code)').order('full_name'),
      supabase.from('sercoop_approval_rules').select('*').order('category_code'),
      supabase.from('sercoop_budget_categories').select('*').order('sort_order'),
      supabase.from('sercoop_settings').select('*'),
      supabase.from('sercoop_permissions').select('*,user:sercoop_users(full_name)').eq('module','sarbun'),
    ])
    if(u.data) setUnits(u.data)
    if(us.data) {
      // merge permission role into user data
      const pmData = pm.data||[]
      const merged = us.data.map(user => {
        const userPerm = pmData.find(p=>p.user_id===user.user_id)
        return {
          ...user,
          role: userPerm?.role||'staff',
          unit_name: user.unit?.unit_name||user.unit_name||'',
          unit_code: user.unit?.unit_code||'',
        }
      })
      setUsers(merged)
    }
    if(ar.data) setApprovalRules(ar.data)
    if(bc.data) setBudgetCats(bc.data)
    if(st.data) {
      const obj={}; st.data.forEach(s=>{obj[s.setting_key]=s.setting_value}); setSettings(obj)
    }
  }

  const saveSetting = async(key,value) => {
    const {error} = await supabase.from('sercoop_settings').upsert(
      {setting_key:key,setting_value:value,updated_at:new Date().toISOString()},
      {onConflict:'setting_key'}
    )
    if(!error){setSettings(p=>({...p,[key]:value}));setMsg('✅ บันทึกสำเร็จ!')}
    else setMsg('❌ '+error.message)
  }

  const tabs = [
    {k:'units',l:'🏢 หน่วยธุรกิจ'},
    {k:'hq',l:'🏛️ สำนักงานใหญ่'},
    {k:'users',l:'👥 ผู้ใช้งาน'},
    {k:'approval',l:'⚡ อำนาจอนุมัติ'},
    {k:'budget',l:'💰 หมวดงบประมาณ'},
    {k:'doctype',l:'📋 ประเภทเอกสาร'},
    {k:'system',l:'⚙️ ตั้งค่าระบบ'},
    {k:'backup',l:'💾 สำรองข้อมูล'},
  ]

  const hqUnits = units.filter(u=>u.unit_type==='headquarters_dept')
  const bizUnits = units.filter(u=>u.unit_type==='business_unit')

  return(
    <div style={{display:'flex',flex:1,overflow:'hidden'}}>
      {/* Admin sidebar */}
      <div style={{width:200,borderRight:`1px solid ${T.g200}`,overflowY:'auto',
        background:T.g50,flexShrink:0}}>
        <div style={{padding:'12px 14px',fontWeight:700,color:T.primary,
          fontSize:13,borderBottom:`1px solid ${T.g200}`}}>🛡️ Admin Panel</div>
        {tabs.map(t=>(
          <div key={t.k} onClick={()=>setTab(t.k)} style={{
            padding:'10px 14px',cursor:'pointer',fontSize:13,
            background:tab===t.k?T.primary3:'transparent',
            color:tab===t.k?T.primary:T.g600,
            fontWeight:tab===t.k?700:400,
            borderLeft:tab===t.k?`3px solid ${T.primary2}`:'3px solid transparent',
            borderBottom:`1px solid ${T.g100}`}}>{t.l}</div>
        ))}
      </div>

      {/* Content */}
      <div style={{flex:1,overflowY:'auto',padding:'20px'}}>
        {msg&&<div style={{background:T.greenL,color:T.green,borderRadius:8,
          padding:'10px 14px',marginBottom:14,fontWeight:600}}>{msg}</div>}

        {/* หน่วยธุรกิจ */}
        {tab==='units'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontWeight:700,color:T.primary,fontSize:15}}>🏘️ หน่วยธุรกิจ ({bizUnits.length} หน่วย)</div>
              <Btn color={T.primary} sm onClick={()=>{setEditItem({unit_type:'business_unit',sort_order:bizUnits.length+4});setShowModal('unit')}}>＋ เพิ่มหน่วยธุรกิจ</Btn>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              {bizUnits.map(u=>(
                <div key={u.id} style={{background:'#fff',borderRadius:10,padding:'14px',
                  border:`1px solid ${T.g200}`,boxShadow:'0 1px 3px rgba(0,0,0,0.05)'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                    <div>
                      <div style={{fontWeight:700,color:T.primary,fontSize:14}}>
                        {u.unit_code}. {u.unit_name}
                      </div>
                      {u.manager_name&&<div style={{fontSize:12,color:T.g600,marginTop:2}}>
                        👤 {u.manager_name} · {u.manager_position}</div>}
                      {u.phone&&<div style={{fontSize:11,color:T.g400,marginTop:2}}>📞 {u.phone}</div>}
                    </div>
                    <div style={{display:'flex',gap:4}}>
                      <Btn sm outline color={T.primary2} onClick={()=>{setEditItem(u);setShowModal('unit')}}>แก้ไข</Btn>
                    </div>
                  </div>
                  {/* Budget summary */}
                  <div style={{marginTop:10,paddingTop:8,borderTop:`1px solid ${T.g100}`,
                    fontSize:11,color:T.g400}}>
                    <Btn sm outline color={T.g400} onClick={()=>{setEditItem(u);setTab('budget_unit')}}>
                      💰 จัดการงบประมาณ
                    </Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* สำนักงานใหญ่ */}
        {tab==='hq'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontWeight:700,color:T.primary,fontSize:15}}>🏛️ ฝ่ายในสำนักงานใหญ่</div>
              <Btn color={T.primary} sm onClick={()=>{setEditItem({unit_type:'headquarters_dept',sort_order:hqUnits.length+1});setShowModal('unit')}}>＋ เพิ่มฝ่าย</Btn>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {hqUnits.map(u=>(
                <div key={u.id} style={{background:'#fff',borderRadius:10,padding:'12px 16px',
                  border:`1px solid ${T.g200}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <div>
                    <div style={{fontWeight:700,color:T.primary}}>{u.unit_code}. {u.unit_name}</div>
                    {u.manager_name&&<div style={{fontSize:12,color:T.g600}}>👤 {u.manager_name}</div>}
                  </div>
                  <Btn sm outline color={T.primary2} onClick={()=>{setEditItem(u);setShowModal('unit')}}>แก้ไข</Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ผู้ใช้งาน */}
        {tab==='users'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontWeight:700,color:T.primary,fontSize:15}}>👥 ผู้ใช้งาน ({users.length} คน)</div>
              <Btn color={T.primary} sm onClick={()=>{setEditItem({is_active:true,role:'staff'});setShowModal('add_user')}}>＋ เพิ่มผู้ใช้งาน</Btn>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',background:'#fff',
              borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              <thead>
                <tr style={{background:T.primary}}>
                  {['ชื่อ-สกุล','ตำแหน่ง','หน่วยงาน','อีเมล','สิทธิ์','สถานะ',''].map(h=>(
                    <th key={h} style={{padding:'9px 12px',textAlign:'left',color:'#fff',fontWeight:600,fontSize:12}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u,i)=>(
                  <tr key={u.id} style={{borderBottom:`1px solid ${T.g100}`,background:i%2===0?'#fff':T.g50}}>
                    <td style={{padding:'9px 12px',fontWeight:600}}>{u.full_name||'—'}</td>
                    <td style={{padding:'9px 12px',fontSize:12,color:T.g600}}>{u.position_name||'—'}</td>
                    <td style={{padding:'9px 12px',fontSize:12,color:T.g400}}>{u.unit_name||'—'}</td>
                    <td style={{padding:'9px 12px',fontSize:11,color:T.g400}}>{u.email||'—'}</td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{background:T.primary3,color:T.primary,borderRadius:4,padding:'2px 8px',fontSize:11,fontWeight:700}}>
                        {PERMISSIONS[u.role]?.label||'ผู้ใช้งาน'}
                      </span>
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <span style={{background:u.is_active?T.greenL:T.redL,color:u.is_active?T.green:T.red,borderRadius:20,padding:'2px 8px',fontSize:11,fontWeight:700}}>
                        {u.is_active?'✔ ใช้งาน':'✕ ปิดใช้'}
                      </span>
                    </td>
                    <td style={{padding:'9px 12px'}}>
                      <Btn sm outline color={T.primary2} onClick={()=>{setEditItem(u);setShowModal('user')}}>แก้ไข</Btn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {showModal==='add_user'&&editItem&&(
          <Modal title="＋ เพิ่มผู้ใช้งานใหม่" onClose={()=>setShowModal(null)} width={520}>
            <AddUserForm units={units} onSave={async(data)=>{
              try {
                const selUnit=units.find(u=>u.id===data.unit_id)
                await supabase.from('sercoop_users').insert({
                  full_name:data.full_name,position_name:data.position_name,
                  unit_id:data.unit_id||null,unit_name:selUnit?.unit_name||'',
                  email:data.email,phone:data.phone||'',is_active:true,
                })
                setShowModal(null);loadAll()
                setMsg('✅ บันทึกข้อมูลผู้ใช้แล้ว — ให้ผู้ใช้ login ด้วยอีเมลนี้แล้วกลับมากำหนดสิทธิ์')
              }catch(e){setMsg('❌ '+e.message);setShowModal(null)}
            }}/>
          </Modal>
        )}

        {/* อำนาจอนุมัติ */}
        {tab==='approval'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontWeight:700,color:T.primary,fontSize:15}}>⚡ กฎอำนาจอนุมัติ</div>
              <Btn color={T.primary} sm onClick={()=>{setEditItem({});setShowModal('rule')}}>＋ เพิ่มกฎ</Btn>
            </div>
            <div style={{overflowX:'auto'}}>
              <table style={{width:'100%',borderCollapse:'collapse',background:'#fff',
                borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                minWidth:900}}>
                <thead>
                  <tr style={{background:T.primary}}>
                    {['รหัส','ชื่อหมวด','ผจก.หน่วย','รอง ผจก.ใหญ่','ผจก.ใหญ่','เหรัญญิก','ประธาน','กก.อำนวยการ','กก.ดำเนินการ','อนุกรรมการ',''].map(h=>(
                      <th key={h} style={{padding:'8px 10px',textAlign:'left',color:'#fff',fontWeight:600,fontSize:11,whiteSpace:'nowrap'}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {approvalRules.map((r,i)=>(
                    <tr key={r.id} style={{borderBottom:`1px solid ${T.g100}`,background:i%2===0?'#fff':T.g50}}>
                      <td style={{padding:'8px 10px',fontWeight:700,color:T.primary2,fontSize:11}}>{r.category_code}</td>
                      <td style={{padding:'8px 10px',fontSize:12,maxWidth:140,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.category_name}</td>
                      {[r.manager_limit,r.deputy_gm_limit,r.gm_limit,r.treasurer_limit,r.chairman_limit,r.exec_board_limit,r.full_board_limit].map((v,j)=>(
                        <td key={j} style={{padding:'8px 10px',fontSize:11,color:v>0?T.green:T.g400,fontWeight:v>0?700:400}}>
                          {v>0?`฿${fmtMoney(v)}`:'—'}
                        </td>
                      ))}
                      <td style={{padding:'8px 10px'}}>
                        {r.require_subcommittee&&<span style={{background:T.amberL,color:T.amber,borderRadius:3,padding:'1px 5px',fontSize:10,fontWeight:700}}>
                          {`>`}{fmtMoney(r.subcommittee_threshold)}
                        </span>}
                      </td>
                      <td style={{padding:'8px 10px'}}>
                        <Btn sm outline color={T.primary2} onClick={()=>{setEditItem(r);setShowModal('rule')}}>แก้ไข</Btn>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* หมวดงบประมาณ */}
        {tab==='budget'&&(
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
              <div style={{fontWeight:700,color:T.primary,fontSize:15}}>💰 หมวดงบประมาณ</div>
              <Btn color={T.primary} sm onClick={()=>{setEditItem({level:1});setShowModal('budget_cat')}}>＋ เพิ่มหมวด</Btn>
            </div>
            <div style={{background:'#fff',borderRadius:10,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
              {budgetCats.filter(b=>b.level===1).map(parent=>(
                <div key={parent.id}>
                  <div style={{padding:'10px 14px',background:T.primary3,
                    display:'flex',justifyContent:'space-between',alignItems:'center',
                    borderBottom:`1px solid ${T.g200}`}}>
                    <div style={{fontWeight:700,color:T.primary,fontSize:13}}>
                      หมวด {parent.category_code}: {parent.category_name}
                    </div>
                    <div style={{display:'flex',gap:6}}>
                      <Btn sm outline color={T.primary2} onClick={()=>{setEditItem({...parent});setShowModal('budget_cat')}}>แก้ไข</Btn>
                      <Btn sm outline color={T.green} onClick={()=>{setEditItem({level:2,parent_code:parent.category_code});setShowModal('budget_cat')}}>+ หมวดย่อย</Btn>
                    </div>
                  </div>
                  {budgetCats.filter(c=>c.parent_code===parent.category_code).map(child=>(
                    <div key={child.id} style={{padding:'8px 14px 8px 28px',
                      display:'flex',justifyContent:'space-between',alignItems:'center',
                      borderBottom:`1px solid ${T.g100}`,fontSize:13}}>
                      <span style={{color:T.g800}}>└ {child.category_code} {child.category_name}</span>
                      <Btn sm outline color={T.primary2} onClick={()=>{setEditItem(child);setShowModal('budget_cat')}}>แก้ไข</Btn>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ประเภทเอกสาร */}
        {tab==='doctype'&&<AdminDocTypes setMsg={setMsg}/>}

        {/* ตั้งค่าระบบ */}
        {tab==='system'&&(
          <div>
            <div style={{fontWeight:700,color:T.primary,fontSize:15,marginBottom:16}}>⚙️ ตั้งค่าระบบ</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
              {[
                {key:'org_name',label:'ชื่อองค์กร',type:'text'},
                {key:'org_name_short',label:'ชื่อย่อ',type:'text'},
                {key:'org_phone',label:'เบอร์โทร',type:'text'},
                {key:'fiscal_year',label:'ปีงบประมาณ',type:'text'},
                {key:'line_token',label:'LINE Notify Token',type:'password'},
                {key:'doc_number_format',label:'รูปแบบเลขที่ (สนญ.)',type:'text'},
                {key:'doc_number_format_unit',label:'รูปแบบเลขที่ (หน่วยธุรกิจ)',type:'text'},
              ].map(s=>(
                <div key={s.key} style={{background:'#fff',borderRadius:8,padding:14,
                  border:`1px solid ${T.g200}`}}>
                  <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>{s.label}</label>
                  <div style={{display:'flex',gap:6}}>
                    <input type={s.type} defaultValue={settings[s.key]||''}
                      id={`setting_${s.key}`}
                      style={{...inpStyle,flex:1}}/>
                    <Btn sm color={T.primary} onClick={()=>{
                      const val = document.getElementById(`setting_${s.key}`).value
                      saveSetting(s.key,val)
                    }}>บันทึก</Btn>
                  </div>
                </div>
              ))}
            </div>
            {/* Logo upload */}
            <div style={{background:'#fff',borderRadius:8,padding:14,border:`1px solid ${T.g200}`,marginTop:12}}>
              <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:8,fontWeight:600}}>🖼️ Logo องค์กร</label>
              {settings['org_logo_url'] && (
                <img src={settings['org_logo_url']} alt="Logo" style={{height:60,marginBottom:8,border:`1px solid ${T.g200}`,borderRadius:4,padding:4}}/>
              )}
              <div style={{fontSize:12,color:T.g400}}>อัปโหลด Logo ได้ในภายหลัง (รองรับ PNG, JPG)</div>
            </div>
          </div>
        )}

        {/* สำรองข้อมูล */}
        {tab==='backup'&&(
          <div>
            <div style={{fontWeight:700,color:T.primary,fontSize:15,marginBottom:16}}>💾 สำรองข้อมูล</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
              {[
                {icon:'📦',title:'Export ฐานข้อมูล',desc:'ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์ JSON',color:T.primary},
                {icon:'📊',title:'Export รายงาน Excel',desc:'ดาวน์โหลดรายงานเอกสารทั้งหมด',color:T.green},
                {icon:'📥',title:'Import ข้อมูล',desc:'นำเข้าข้อมูลจากไฟล์ Excel/CSV',color:T.orange},
                {icon:'🔄',title:'Restore ข้อมูล',desc:'กู้คืนข้อมูลจากไฟล์สำรอง',color:T.purple},
              ].map(b=>(
                <div key={b.title} style={{background:'#fff',borderRadius:10,padding:'18px',
                  border:`1px solid ${T.g200}`,boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                  <div style={{fontSize:32,marginBottom:8}}>{b.icon}</div>
                  <div style={{fontWeight:700,color:T.primary,fontSize:14,marginBottom:4}}>{b.title}</div>
                  <div style={{fontSize:12,color:T.g400,marginBottom:12}}>{b.desc}</div>
                  <Btn sm color={b.color} onClick={()=>setMsg('⏳ กำลังพัฒนาฟีเจอร์นี้...')}>ดำเนินการ</Btn>
                </div>
              ))}
            </div>
            <div style={{marginTop:14,padding:14,background:T.primary3,borderRadius:8,fontSize:12,color:T.primary}}>
              💡 สำรองข้อมูลอัตโนมัติ: Supabase มีระบบ Backup อัตโนมัติทุกวัน สามารถ Restore ได้ที่ Supabase Dashboard → Project Settings → Backups
            </div>
          </div>
        )}
      </div>

      {/* Unit Edit Modal */}
      {showModal==='unit'&&editItem&&(
        <Modal title={editItem.id?'แก้ไขหน่วยธุรกิจ/ฝ่าย':'เพิ่มหน่วยธุรกิจ/ฝ่าย'} onClose={()=>setShowModal(null)} width={520}>
          <UnitForm item={editItem} onSave={async(data)=>{
            const payload = {
              unit_code:data.unit_code, unit_name:data.unit_name,
              unit_type:data.unit_type||'business_unit',
              manager_name:data.manager_name||null,
              manager_position:data.manager_position||null,
              phone:data.phone||null, address:data.address||null,
              is_active:data.is_active!==false, sort_order:data.sort_order||0,
            }
            let error
            if(data.id) {
              const res = await supabase.from('sercoop_units').update(payload).eq('id',data.id)
              error = res.error
            } else {
              const res = await supabase.from('sercoop_units').insert(payload)
              error = res.error
            }
            if(!error){setShowModal(null);loadAll();setMsg('✅ บันทึกสำเร็จ!')}
            else setMsg('❌ '+error.message)
          }}/>
        </Modal>
      )}

      {/* User Edit Modal */}
      {showModal==='user'&&editItem&&(
        <Modal title="แก้ไขข้อมูลผู้ใช้งาน" onClose={()=>setShowModal(null)}>
          <UserPermForm item={editItem} units={units} onSave={async(data)=>{
            const selUnit = units.find(u=>u.id===data.unit_id)
            // update sercoop_users
            await supabase.from('sercoop_users').update({
              full_name:data.full_name,
              position_name:data.position_name,
              phone:data.phone||'',
              unit_id:data.unit_id||null,
              unit_name:selUnit?.unit_name||'',
              is_active:data.is_active,
            }).eq('id',data.id)
            // update or insert permission
            if(data.user_id) {
              const {data:existing} = await supabase.from('sercoop_permissions')
                .select('id').eq('user_id',data.user_id).eq('module','sarbun').single()
              if(existing) {
                await supabase.from('sercoop_permissions').update({
                  role:data.role, unit_id:data.unit_id||null, is_active:data.is_active
                }).eq('id',existing.id)
              } else {
                await supabase.from('sercoop_permissions').insert({
                  user_id:data.user_id, module:'sarbun',
                  role:data.role, unit_id:data.unit_id||null, is_active:data.is_active
                })
              }
              // also update old user_roles for backward compat
              await supabase.from('user_roles').update({
                role:data.role, full_name:data.full_name,
                dept:selUnit?.unit_name||'', position:data.position_name||''
              }).eq('user_id',data.user_id)
            }
            setShowModal(null);loadAll();setMsg('✅ บันทึกสำเร็จ!')
          }}/>
        </Modal>
      )}

      {/* Approval Rule Modal */}
      {showModal==='rule'&&editItem&&(
        <Modal title={editItem.id?'แก้ไขกฎอนุมัติ':'เพิ่มกฎอนุมัติ'} onClose={()=>setShowModal(null)} width={640}>
          <ApprovalRuleForm item={editItem} onSave={async(data)=>{
            const payload = {
              category_code:data.category_code, category_name:data.category_name,
              manager_limit:parseFloat(data.manager_limit)||0,
              deputy_gm_limit:parseFloat(data.deputy_gm_limit)||0,
              gm_limit:parseFloat(data.gm_limit)||0,
              treasurer_limit:parseFloat(data.treasurer_limit)||0,
              chairman_limit:parseFloat(data.chairman_limit)||0,
              exec_board_limit:parseFloat(data.exec_board_limit)||0,
              full_board_limit:parseFloat(data.full_board_limit)||0,
              require_subcommittee:data.require_subcommittee||false,
              subcommittee_threshold:parseFloat(data.subcommittee_threshold)||50000,
              notes:data.notes||'', is_active:data.is_active!==false,
            }
            let error
            if(data.id){
              const res = await supabase.from('sercoop_approval_rules').update(payload).eq('id',data.id)
              error = res.error
            } else {
              const res = await supabase.from('sercoop_approval_rules').insert(payload)
              error = res.error
            }
            if(!error){setShowModal(null);loadAll();setMsg('✅ บันทึกสำเร็จ!')}
            else setMsg('❌ '+error.message)
          }}/>
        </Modal>
      )}

      {/* Budget Cat Modal */}
      {showModal==='budget_cat'&&editItem&&(
        <Modal title={editItem.id?'แก้ไขหมวดงบ':'เพิ่มหมวดงบ'} onClose={()=>setShowModal(null)}>
          <BudgetCatForm item={editItem} onSave={async(data)=>{
            const payload = {
              category_code:data.category_code, category_name:data.category_name,
              parent_code:data.parent_code||null, level:parseInt(data.level)||1,
              is_active:data.is_active!==false, sort_order:data.sort_order||0,
            }
            let error
            if(data.id){
              const res = await supabase.from('sercoop_budget_categories').update(payload).eq('id',data.id)
              error = res.error
            } else {
              const res = await supabase.from('sercoop_budget_categories').insert(payload)
              error = res.error
            }
            if(!error){setShowModal(null);loadAll();setMsg('✅ บันทึกสำเร็จ!')}
            else setMsg('❌ '+error.message)
          }}/>
        </Modal>
      )}
    </div>
  )
}

// Sub-forms for Admin
function UnitForm({item,onSave}) {
  const [form,setForm] = useState({...item})
  return(
    <div>
      {[['รหัสหน่วย','unit_code'],['ชื่อหน่วยธุรกิจ','unit_name'],['ชื่อผู้จัดการ','manager_name'],['ตำแหน่งผู้จัดการ','manager_position'],['เบอร์โทร','phone'],['ที่อยู่','address']].map(([l,k])=>(
        <div key={k} style={{marginBottom:10}}>
          <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>{l}</label>
          <input value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inpStyle}/>
        </div>
      ))}
      <div style={{marginBottom:14}}>
        <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}>
          <input type="checkbox" checked={form.is_active!==false} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))}/>
          เปิดใช้งาน
        </label>
      </div>
      <Btn full color={T.primary} onClick={()=>onSave(form)}>💾 บันทึก</Btn>
    </div>
  )
}

function UserPermForm({item,units,onSave}) {
  const [form,setForm] = useState({
    role:'staff', ...item,
    unit_id: item.unit_id||'',
  })
  return(
    <div>
      <div style={{background:T.primary3,borderRadius:7,padding:'8px 12px',
        marginBottom:14,fontSize:12,color:T.primary,fontWeight:600}}>
        👤 {item.full_name||'ผู้ใช้งาน'} · {item.email||''}
      </div>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>สิทธิ์การใช้งาน</label>
        <select value={form.role||'staff'} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={inpStyle}>
          {Object.entries(PERMISSIONS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>
      <div style={{marginBottom:10}}>
        <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>หน่วยงาน</label>
        <select value={form.unit_id||''} onChange={e=>setForm(p=>({...p,unit_id:e.target.value}))} style={inpStyle}>
          <option value="">-- เลือกหน่วยงาน --</option>
          {units.map(u=><option key={u.id} value={u.id}>{u.unit_code}. {u.unit_name}</option>)}
        </select>
      </div>
      {[['ชื่อ-สกุล','full_name','text'],['ตำแหน่ง','position_name','text'],['เบอร์โทร','phone','text']].map(([l,k,t])=>(
        <div key={k} style={{marginBottom:10}}>
          <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>{l}</label>
          <input type={t} value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inpStyle}/>
        </div>
      ))}
      <div style={{marginBottom:14}}>
        <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}>
          <input type="checkbox" checked={form.is_active!==false}
            onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))}/>
          เปิดใช้งาน
        </label>
      </div>
      <Btn full color={T.primary} onClick={()=>onSave(form)}>💾 บันทึก</Btn>
    </div>
  )
}

function ApprovalRuleForm({item,onSave}) {
  const [form,setForm] = useState({
    category_code:'',category_name:'',
    manager_limit:0,deputy_gm_limit:0,gm_limit:0,
    treasurer_limit:0,chairman_limit:0,
    exec_board_limit:0,full_board_limit:0,
    require_subcommittee:false,subcommittee_threshold:50000,
    notes:'',is_active:true,...item
  })
  const fields = [
    ['ผจก.หน่วยธุรกิจ','manager_limit'],['รอง ผจก.ใหญ่','deputy_gm_limit'],
    ['ผจก.ใหญ่','gm_limit'],['เหรัญญิก','treasurer_limit'],
    ['ประธานกรรมการ','chairman_limit'],['กก.อำนวยการ','exec_board_limit'],
    ['กก.ดำเนินการ','full_board_limit'],
  ]
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:12}}>
        <div>
          <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>รหัสหมวด *</label>
          <input value={form.category_code} onChange={e=>setForm(p=>({...p,category_code:e.target.value}))} style={inpStyle}/>
        </div>
        <div style={{gridColumn:'span 1'}}>
          <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>ชื่อหมวด *</label>
          <input value={form.category_name} onChange={e=>setForm(p=>({...p,category_name:e.target.value}))} style={inpStyle}/>
        </div>
      </div>
      <div style={{fontWeight:600,color:T.primary,fontSize:13,marginBottom:8}}>วงเงินอนุมัติ (บาท) — 0 = ไม่มีอำนาจ</div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:12}}>
        {fields.map(([l,k])=>(
          <div key={k}>
            <label style={{fontSize:11,color:T.g600,display:'block',marginBottom:3,fontWeight:600}}>{l}</label>
            <input type="number" value={form[k]||0} onChange={e=>setForm(p=>({...p,[k]:parseFloat(e.target.value)||0}))} style={inpStyle}/>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:12,marginBottom:10}}>
        <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}>
          <input type="checkbox" checked={form.require_subcommittee} onChange={e=>setForm(p=>({...p,require_subcommittee:e.target.checked}))}/>
          ต้องผ่านอนุกรรมการ
        </label>
        {form.require_subcommittee&&(
          <div>
            <label style={{fontSize:11,color:T.g600}}>เมื่อเกิน (บาท):</label>
            <input type="number" value={form.subcommittee_threshold} onChange={e=>setForm(p=>({...p,subcommittee_threshold:parseFloat(e.target.value)||0}))} style={{...inpStyle,width:120,display:'inline',marginLeft:6}}/>
          </div>
        )}
      </div>
      <div style={{marginBottom:14}}>
        <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>หมายเหตุ</label>
        <textarea value={form.notes||''} onChange={e=>setForm(p=>({...p,notes:e.target.value}))} rows={2} style={{...inpStyle,resize:'vertical'}}/>
      </div>
      <Btn full color={T.primary} onClick={()=>onSave(form)}>💾 บันทึก</Btn>
    </div>
  )
}

function BudgetCatForm({item,onSave}) {
  const [form,setForm] = useState({level:1,is_active:true,...item})
  return(
    <div>
      {[['รหัสหมวด','category_code'],['ชื่อหมวด','category_name'],['รหัสหมวดแม่ (ถ้ามี)','parent_code']].map(([l,k])=>(
        <div key={k} style={{marginBottom:10}}>
          <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>{l}</label>
          <input value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inpStyle}/>
        </div>
      ))}
      <div style={{marginBottom:10}}>
        <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>ระดับ</label>
        <select value={form.level} onChange={e=>setForm(p=>({...p,level:parseInt(e.target.value)}))} style={inpStyle}>
          <option value={1}>หมวดหลัก (Level 1)</option>
          <option value={2}>หมวดย่อย (Level 2)</option>
        </select>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}>
          <input type="checkbox" checked={form.is_active!==false} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))}/>
          เปิดใช้งาน
        </label>
      </div>
      <Btn full color={T.primary} onClick={()=>onSave(form)}>💾 บันทึก</Btn>
    </div>
  )
}

function AdminDocTypes({setMsg}) {
  const [types, setTypes] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)

  useEffect(()=>{
    supabase.from('sercoop_doc_types').select('*').order('sort_order')
      .then(({data})=>{if(data)setTypes(data)})
  },[])

  const save = async(form) => {
    if(form.id) await supabase.from('sercoop_doc_types').update(form).eq('id',form.id)
    else await supabase.from('sercoop_doc_types').insert(form)
    setShowModal(false)
    const {data} = await supabase.from('sercoop_doc_types').select('*').order('sort_order')
    if(data) setTypes(data)
    setMsg('✅ บันทึกสำเร็จ!')
  }

  return(
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700,color:T.primary,fontSize:15}}>📋 ประเภทเอกสาร</div>
        <Btn color={T.primary} sm onClick={()=>{setEditItem({is_active:true,sort_order:types.length+1});setShowModal(true)}}>＋ เพิ่มประเภท</Btn>
      </div>
      {['memo','outgoing','incoming'].map(pt=>(
        <div key={pt} style={{marginBottom:16}}>
          <div style={{fontWeight:700,color:T.primary2,fontSize:13,marginBottom:8}}>
            {pt==='memo'?'📝 บันทึกข้อความ':pt==='outgoing'?'📤 หนังสือส่ง':'📥 หนังสือรับ'}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:5}}>
            {types.filter(t=>t.parent_type===pt).map(t=>(
              <div key={t.id} style={{display:'flex',justifyContent:'space-between',alignItems:'center',
                padding:'8px 12px',background:'#fff',border:`1px solid ${T.g200}`,borderRadius:7}}>
                <div>
                  <span style={{fontWeight:600,color:T.primary,marginRight:8}}>{t.type_code}</span>
                  <span style={{fontSize:13}}>{t.type_name}</span>
                </div>
                <Btn sm outline color={T.primary2} onClick={()=>{setEditItem(t);setShowModal(true)}}>แก้ไข</Btn>
              </div>
            ))}
          </div>
        </div>
      ))}
      {showModal&&editItem&&(
        <Modal title={editItem.id?'แก้ไขประเภทเอกสาร':'เพิ่มประเภทเอกสาร'} onClose={()=>setShowModal(false)}>
          <DocTypeForm item={editItem} onSave={save}/>
        </Modal>
      )}
    </div>
  )
}

function DocTypeForm({item,onSave}) {
  const [form,setForm] = useState({parent_type:'memo',is_active:true,...item})
  return(
    <div>
      {[['รหัสประเภท','type_code'],['ชื่อประเภท','type_name']].map(([l,k])=>(
        <div key={k} style={{marginBottom:10}}>
          <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>{l}</label>
          <input value={form[k]||''} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} style={inpStyle}/>
        </div>
      ))}
      <div style={{marginBottom:10}}>
        <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>ประเภทหลัก</label>
        <select value={form.parent_type} onChange={e=>setForm(p=>({...p,parent_type:e.target.value}))} style={inpStyle}>
          <option value="memo">บันทึกข้อความ</option>
          <option value="outgoing">หนังสือส่ง</option>
          <option value="incoming">หนังสือรับ</option>
        </select>
      </div>
      <div style={{marginBottom:14}}>
        <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}>
          <input type="checkbox" checked={form.is_active!==false} onChange={e=>setForm(p=>({...p,is_active:e.target.checked}))}/>
          เปิดใช้งาน
        </label>
      </div>
      <Btn full color={T.primary} onClick={()=>onSave(form)}>💾 บันทึก</Btn>
    </div>
  )
}

// ═══════════════════════════════
// REPORTS PAGE
// ═══════════════════════════════
function PageReports({docs}) {
  const [period, setPeriod] = useState('all')
  const totalBudget = docs.reduce((a,b)=>a+(Number(b.budget_amount)||0),0)
  const byCat = {}
  docs.forEach(d=>{const k=d.budget_category_name||'ไม่ระบุ';byCat[k]=(byCat[k]||0)+(Number(d.budget_amount)||0)})
  const byStatus = {}
  docs.forEach(d=>{byStatus[d.status]=(byStatus[d.status]||0)+1})
  const byUnit = {}
  docs.forEach(d=>{const k=d.created_by_unit||'ไม่ระบุ';byUnit[k]=(byUnit[k]||0)+1})
  const byType = {memo:0,outgoing:0,incoming:0}
  docs.forEach(d=>{if(byType[d.doc_parent_type]!==undefined)byType[d.doc_parent_type]++})

  return(
    <div style={{padding:'20px',overflowY:'auto',flex:1}}>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:12,marginBottom:20}}>
        {[
          {l:'เอกสารทั้งหมด',v:docs.length,icon:'📄',c:T.primary2},
          {l:'บันทึกข้อความ',v:byType.memo,icon:'📝',c:T.primary},
          {l:'หนังสือส่ง',v:byType.outgoing,icon:'📤',c:T.green},
          {l:'หนังสือรับ',v:byType.incoming,icon:'📥',c:T.orange},
          {l:'งบประมาณรวม',v:`฿${fmtMoney(totalBudget)}`,icon:'💰',c:T.teal},
        ].map(s=>(
          <div key={s.l} style={{background:'#fff',borderRadius:12,padding:'14px 16px',
            boxShadow:'0 1px 4px rgba(0,0,0,0.06)',borderLeft:`4px solid ${s.c}`}}>
            <div style={{fontSize:20}}>{s.icon}</div>
            <div style={{fontSize:22,fontWeight:800,color:s.c,marginTop:4}}>{s.v}</div>
            <div style={{fontSize:11,color:T.g400}}>{s.l}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14}}>
        {/* Budget by category */}
        <div style={{background:'#fff',borderRadius:12,padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
          <div style={{fontWeight:700,color:T.primary,fontSize:14,marginBottom:12}}>💰 งบประมาณตามหมวด</div>
          {Object.entries(byCat).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k,v])=>(
            <div key={k} style={{marginBottom:8}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:3,fontSize:12}}>
                <span style={{color:T.g800,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:'60%'}}>{k}</span>
                <span style={{fontWeight:700,color:T.green,flexShrink:0}}>฿{fmtMoney(v)}</span>
              </div>
              <div style={{height:5,background:T.g100,borderRadius:3}}>
                <div style={{height:5,borderRadius:3,
                  width:`${totalBudget>0?(v/totalBudget*100):0}%`,
                  background:`linear-gradient(90deg,${T.primary2},${T.primary})`}}/>
              </div>
            </div>
          ))}
          <div style={{marginTop:12,paddingTop:10,borderTop:`1px solid ${T.g200}`,
            display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:14}}>
            <span>รวมทั้งหมด</span>
            <span style={{color:T.primary}}>฿{fmtMoney(totalBudget)}</span>
          </div>
        </div>

        {/* Status + Unit */}
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <div style={{background:'#fff',borderRadius:12,padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:700,color:T.primary,fontSize:14,marginBottom:10}}>📊 สถานะเอกสาร</div>
            {Object.entries(byStatus).map(([k,v])=>{
              const sc = STATUS_CONFIG[k]||{label:k,bg:T.g100,c:T.g600}
              return(
                <div key={k} style={{display:'flex',justifyContent:'space-between',
                  alignItems:'center',padding:'5px 0',borderBottom:`1px solid ${T.g100}`}}>
                  <Badge status={k}/>
                  <span style={{fontWeight:800,fontSize:16,color:sc.c}}>{v}</span>
                </div>
              )
            })}
          </div>
          <div style={{background:'#fff',borderRadius:12,padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
            <div style={{fontWeight:700,color:T.primary,fontSize:14,marginBottom:10}}>🏢 ตามหน่วยงาน</div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
              {Object.entries(byUnit).slice(0,8).map(([k,v])=>(
                <div key={k} style={{border:`1px solid ${T.g200}`,borderRadius:7,
                  padding:'8px',textAlign:'center'}}>
                  <div style={{fontSize:10,color:T.g400,marginBottom:2,
                    overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{k}</div>
                  <div style={{fontSize:18,fontWeight:800,color:T.primary2}}>{v}</div>
                  <div style={{fontSize:9,color:T.g400}}>ฉบับ</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════
// BUDGET PAGE
// ═══════════════════════════════
function PageBudget() {
  const [units, setUnits] = useState([])
  const [cats, setCats] = useState([])
  const [plans, setPlans] = useState([])
  const [selUnit, setSelUnit] = useState('')
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({fiscal_year:new Date().getFullYear()+543,planned_amount:'',allow_overspend:false,allow_average:true})
  const [msg, setMsg] = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(()=>{
    Promise.all([
      supabase.from('sercoop_units').select('*').order('sort_order'),
      supabase.from('sercoop_budget_categories').select('*').order('sort_order'),
    ]).then(([u,c])=>{
      if(u.data)setUnits(u.data)
      if(c.data)setCats(c.data)
      setLoading(false)
    })
  },[])

  useEffect(()=>{
    if(selUnit) {
      supabase.from('sercoop_budget_plans').select('*,category:sercoop_budget_categories(*)')
        .eq('unit_id',selUnit).then(({data})=>{if(data)setPlans(data)})
    }
  },[selUnit])

  const handleSavePlan = async() => {
    if(!form.category_id||!selUnit){setMsg('❌ กรุณาเลือกหมวดงบและหน่วยงาน');return}
    const {error} = await supabase.from('sercoop_budget_plans').upsert({
      unit_id:selUnit, category_id:form.category_id,
      fiscal_year:parseInt(form.fiscal_year)||new Date().getFullYear()+543,
      planned_amount:parseFloat(form.planned_amount)||0,
      used_amount:0, allow_overspend:form.allow_overspend,
      allow_average:form.allow_average,
    },{onConflict:'unit_id,category_id,fiscal_year'})
    if(!error){
      setMsg('✅ บันทึกงบประมาณสำเร็จ!')
      const {data} = await supabase.from('sercoop_budget_plans').select('*,category:sercoop_budget_categories(*)')
        .eq('unit_id',selUnit)
      if(data)setPlans(data)
      setShowAdd(false)
    } else setMsg('❌ '+error.message)
  }

  const parentCats = cats.filter(c=>c.level===1)
  const getChildren = pc => cats.filter(c=>c.parent_code===pc&&c.level===2)
  const getPlan = catId => plans.find(p=>p.category_id===catId)
  const pct = plan => plan?.planned_amount>0?Math.min(100,(plan.used_amount/plan.planned_amount)*100):0

  return(
    <div style={{padding:'20px',overflowY:'auto',flex:1}}>
      {msg&&<div style={{background:msg.includes('✅')?T.greenL:T.redL,
        color:msg.includes('✅')?T.green:T.red,
        borderRadius:8,padding:'10px 14px',marginBottom:14,fontWeight:600}}>{msg}</div>}

      <div style={{display:'flex',gap:10,marginBottom:16,alignItems:'center',flexWrap:'wrap'}}>
        <select value={selUnit} onChange={e=>setSelUnit(e.target.value)}
          style={{...inpStyle,width:'auto',minWidth:220}}>
          <option value="">-- เลือกหน่วยงาน --</option>
          {units.map(u=><option key={u.id} value={u.id}>{u.unit_code}. {u.unit_name}</option>)}
        </select>
        {selUnit&&<Btn color={T.primary} sm onClick={()=>setShowAdd(true)}>＋ เพิ่มงบประมาณ</Btn>}
      </div>

      {!selUnit&&(
        <div style={{textAlign:'center',padding:60,color:T.g400}}>
          <div style={{fontSize:40,marginBottom:12}}>💰</div>
          <div style={{fontSize:15,fontWeight:600,color:T.primary}}>เลือกหน่วยงานเพื่อดูงบประมาณ</div>
        </div>
      )}

      {selUnit&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {parentCats.map(parent=>{
            const children = getChildren(parent.category_code)
            const isExp = expanded[parent.category_code]
            const parentPlan = getPlan(parent.id)
            const totalPlanned = children.reduce((a,c)=>{const p=getPlan(c.id);return a+(p?.planned_amount||0)},0)
            const totalUsed = children.reduce((a,c)=>{const p=getPlan(c.id);return a+(p?.used_amount||0)},0)

            return(
              <div key={parent.id} style={{background:'#fff',borderRadius:12,overflow:'hidden',
                boxShadow:'0 1px 4px rgba(0,0,0,0.06)'}}>
                <div style={{padding:'12px 16px',background:T.g50,cursor:'pointer',
                  display:'flex',alignItems:'center',gap:10,
                  borderBottom:isExp?`1px solid ${T.g200}`:'none'}}
                  onClick={()=>setExpanded(p=>({...p,[parent.category_code]:!p[parent.category_code]}))}>
                  <span style={{color:T.g400,fontSize:13,
                    transform:isExp?'rotate(90deg)':'none',
                    display:'inline-block',transition:'transform 0.2s'}}>▶</span>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                      <div style={{fontWeight:700,color:T.primary,fontSize:13}}>
                        หมวด {parent.category_code}: {parent.category_name}
                      </div>
                      <div style={{display:'flex',gap:12,fontSize:12}}>
                        <span>งบ: <b style={{color:T.primary}}>฿{fmtMoney(totalPlanned)}</b></span>
                        <span>ใช้: <b style={{color:T.orange}}>฿{fmtMoney(totalUsed)}</b></span>
                        <span>คงเหลือ: <b style={{color:totalPlanned-totalUsed>=0?T.green:T.red}}>฿{fmtMoney(totalPlanned-totalUsed)}</b></span>
                      </div>
                    </div>
                    {totalPlanned>0&&(
                      <div style={{height:5,background:T.g200,borderRadius:3}}>
                        <div style={{height:5,borderRadius:3,
                          width:`${Math.min(100,(totalUsed/totalPlanned)*100)}%`,
                          background:(totalUsed/totalPlanned)>0.9?T.red:(totalUsed/totalPlanned)>0.7?T.orange:`linear-gradient(90deg,${T.primary2},${T.primary})`}}/>
                      </div>
                    )}
                  </div>
                </div>
                {isExp&&(
                  <div>
                    {children.map(child=>{
                      const plan = getPlan(child.id)
                      const pp = pct(plan)
                      const rem = (plan?.planned_amount||0)-(plan?.used_amount||0)
                      return(
                        <div key={child.id} style={{padding:'10px 16px 10px 44px',
                          borderBottom:`1px solid ${T.g100}`}}>
                          <div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
                            <div style={{fontSize:13,fontWeight:600}}>
                              └ {child.category_code} {child.category_name}
                            </div>
                            <div style={{display:'flex',gap:10,fontSize:12}}>
                              {plan?(
                                <>
                                  <span>฿{fmtMoney(plan.planned_amount)}</span>
                                  <span style={{color:T.orange}}>ใช้ ฿{fmtMoney(plan.used_amount)}</span>
                                  <span style={{color:rem>=0?T.green:T.red}}>คงเหลือ ฿{fmtMoney(rem)}</span>
                                  {plan.allow_average&&<span style={{background:T.primary3,color:T.primary2,borderRadius:3,padding:'0 5px',fontSize:10,fontWeight:700}}>ถัวเฉลี่ยได้</span>}
                                  {plan.allow_overspend&&<span style={{background:T.redL,color:T.red,borderRadius:3,padding:'0 5px',fontSize:10,fontWeight:700}}>ใช้เกินได้</span>}
                                </>
                              ):<span style={{color:T.g400,fontSize:11}}>ยังไม่กำหนดงบ</span>}
                            </div>
                          </div>
                          {plan&&plan.planned_amount>0&&(
                            <div style={{height:4,background:T.g100,borderRadius:3}}>
                              <div style={{height:4,borderRadius:3,width:`${Math.min(100,pp)}%`,
                                background:pp>90?T.red:pp>70?T.orange:T.primary2}}/>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {children.length===0&&(
                      <div style={{padding:'10px 16px 10px 44px',fontSize:12,color:T.g400}}>ยังไม่มีหมวดย่อย</div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Add budget modal */}
      {showAdd&&(
        <Modal title="＋ เพิ่มงบประมาณ" onClose={()=>setShowAdd(false)}>
          <div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>หมวดงบประมาณ *</label>
              <select value={form.category_id||''} onChange={e=>setForm(p=>({...p,category_id:e.target.value}))} style={inpStyle}>
                <option value="">-- เลือกหมวด --</option>
                {parentCats.map(p=>(
                  <optgroup key={p.id} label={`หมวด ${p.category_code}: ${p.category_name}`}>
                    {getChildren(p.category_code).map(c=>(
                      <option key={c.id} value={c.id}>{c.category_code} {c.category_name}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>ปีงบประมาณ</label>
              <input type="number" value={form.fiscal_year} onChange={e=>setForm(p=>({...p,fiscal_year:e.target.value}))} style={inpStyle}/>
            </div>
            <div style={{marginBottom:12}}>
              <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>วงเงินงบประมาณ (บาท)</label>
              <input type="number" value={form.planned_amount} onChange={e=>setForm(p=>({...p,planned_amount:e.target.value}))} style={inpStyle}/>
            </div>
            <div style={{display:'flex',gap:14,marginBottom:14}}>
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}>
                <input type="checkbox" checked={form.allow_average} onChange={e=>setForm(p=>({...p,allow_average:e.target.checked}))}/>
                ถัวเฉลี่ยได้
              </label>
              <label style={{display:'flex',alignItems:'center',gap:6,fontSize:13,cursor:'pointer'}}>
                <input type="checkbox" checked={form.allow_overspend} onChange={e=>setForm(p=>({...p,allow_overspend:e.target.checked}))}/>
                ใช้เกินงบได้
              </label>
            </div>
            {msg&&<div style={{background:msg.includes('✅')?T.greenL:T.redL,color:msg.includes('✅')?T.green:T.red,borderRadius:7,padding:'8px 12px',fontSize:12,marginBottom:10,fontWeight:600}}>{msg}</div>}
            <Btn full color={T.primary} onClick={handleSavePlan}>💾 บันทึกงบประมาณ</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════
// REGULATIONS PAGE
// ═══════════════════════════════
function PageRegulations({perm}) {
  const role = PERMISSIONS[perm?.role]||PERMISSIONS.staff
  const [refCats, setRefCats] = useState([])
  const [refFiles, setRefFiles] = useState([])
  const [selCat, setSelCat] = useState(null)
  const [search, setSearch] = useState('')
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({title:'',description:'',category_id:''})
  const [uploadFile, setUploadFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')
  const fileRef = useRef()

  useEffect(()=>{
    supabase.from('sercoop_settings').select('*').then(()=>{})
    // Use existing reference tables
    supabase.from('reference_categories').select('*').order('sort_order')
      .then(({data})=>{if(data)setRefCats(data)})
    supabase.from('reference_files').select('*').order('created_at',{ascending:false})
      .then(({data})=>{if(data)setRefFiles(data)})
  },[])

  const handleUpload = async() => {
    if(!form.title||!form.category_id){setMsg('❌ กรุณากรอกชื่อและเลือกหมวด');return}
    setUploading(true)
    let file_path=null,file_name=null,file_type=null,file_size=null
    if(uploadFile){
      const path=`references/${form.category_id}/${Date.now()}_${uploadFile.name}`
      const {error} = await supabase.storage.from('documents').upload(path,uploadFile)
      if(!error){file_path=path;file_name=uploadFile.name;file_type=uploadFile.name.split('.').pop();file_size=uploadFile.size}
    }
    const {error} = await supabase.from('reference_files').insert({...form,file_path,file_name,file_type,file_size,is_readonly:true})
    if(!error){
      setMsg('✅ เพิ่มสำเร็จ!')
      const {data} = await supabase.from('reference_files').select('*').order('created_at',{ascending:false})
      if(data)setRefFiles(data)
      setShowUpload(false);setForm({title:'',description:'',category_id:''});setUploadFile(null)
    } else setMsg('❌ '+error.message)
    setUploading(false)
  }

  const filteredFiles = refFiles.filter(f=>(selCat?f.category_id===selCat:true)&&(f.title?.includes(search)||f.description?.includes(search)))
  const icons = {pdf:'📄',jpg:'🖼️',jpeg:'🖼️',docx:'📝',doc:'📝',xlsx:'📊'}

  return(
    <div style={{display:'flex',flex:1,overflow:'hidden'}}>
      <div style={{width:200,borderRight:`1px solid ${T.g200}`,overflowY:'auto',background:'#fff',flexShrink:0}}>
        <div style={{padding:'12px 14px',fontWeight:700,color:T.primary,borderBottom:`1px solid ${T.g200}`,fontSize:13}}>📂 หมวดหมู่</div>
        <div onClick={()=>setSelCat(null)} style={{padding:'10px 14px',cursor:'pointer',
          background:!selCat?T.primary3:'#fff',fontWeight:!selCat?700:400,
          color:!selCat?T.primary:T.g600,fontSize:13,borderBottom:`1px solid ${T.g100}`}}>
          📁 ทั้งหมด <span style={{float:'right',fontSize:11,color:T.g400}}>{refFiles.length}</span>
        </div>
        {refCats.map(c=>(
          <div key={c.id} onClick={()=>setSelCat(c.id)} style={{padding:'10px 14px',cursor:'pointer',
            background:selCat===c.id?T.primary3:'#fff',
            fontWeight:selCat===c.id?700:400,
            color:selCat===c.id?T.primary:T.g600,
            fontSize:13,borderBottom:`1px solid ${T.g100}`}}>
            {c.icon} {c.name} <span style={{float:'right',fontSize:11,color:T.g400}}>{refFiles.filter(f=>f.category_id===c.id).length}</span>
          </div>
        ))}
      </div>
      <div style={{flex:1,overflowY:'auto',padding:'16px 20px'}}>
        <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center'}}>
          <div style={{display:'flex',flex:1,maxWidth:360,border:`1px solid ${T.g200}`,borderRadius:7,overflow:'hidden'}}>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาไฟล์อ้างอิง..."
              style={{flex:1,border:'none',padding:'8px 12px',fontSize:13,fontFamily:'Sarabun',outline:'none'}}/>
            <div style={{padding:'0 10px',display:'flex',alignItems:'center',background:T.green,color:'#fff'}}>🔍</div>
          </div>
          {role.canAdmin&&<Btn color={T.primary} onClick={()=>setShowUpload(true)}>＋ เพิ่มไฟล์อ้างอิง</Btn>}
        </div>
        {msg&&<div style={{background:msg.includes('✅')?T.greenL:T.redL,color:msg.includes('✅')?T.green:T.red,borderRadius:8,padding:'10px 14px',marginBottom:12,fontWeight:600}}>{msg}</div>}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
          {filteredFiles.map(f=>{
            const cat = refCats.find(c=>c.id===f.category_id)
            const ext = (f.file_name||'').split('.').pop().toLowerCase()
            const icon = icons[ext]||'📎'
            const url = f.file_path?supabase.storage.from('documents').getPublicUrl(f.file_path).data.publicUrl:null
            return(
              <div key={f.id} style={{background:'#fff',borderRadius:10,padding:'14px 16px',
                boxShadow:'0 1px 4px rgba(0,0,0,0.06)',border:`1px solid ${T.g200}`}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:6,gap:6}}>
                  <div style={{fontWeight:700,color:T.primary,fontSize:13,flex:1,lineHeight:1.4}}>{f.title}</div>
                  {cat&&<span style={{background:T.green,color:'#fff',borderRadius:4,padding:'1px 7px',fontSize:10,fontWeight:700,flexShrink:0}}>{cat.icon} {cat.name}</span>}
                </div>
                {f.description&&<div style={{fontSize:12,color:T.g600,lineHeight:1.6,marginBottom:8}}>{f.description}</div>}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                  {f.file_name?(
                    <div style={{display:'flex',alignItems:'center',gap:6}}>
                      <span style={{fontSize:16}}>{icon}</span>
                      <div>
                        <div style={{fontSize:11,fontWeight:600}}>{f.file_name.split('.').pop().toUpperCase()}</div>
                        {f.file_size&&<div style={{fontSize:10,color:T.g400}}>{fmtSz(f.file_size)}</div>}
                      </div>
                    </div>
                  ):<span style={{fontSize:11,color:T.g400}}>ไม่มีไฟล์</span>}
                  {url&&<a href={url} target="_blank" rel="noreferrer"
                    style={{background:T.g50,color:T.primary,borderRadius:6,padding:'5px 12px',
                      fontSize:12,fontWeight:700,textDecoration:'none',border:`1px solid ${T.g200}`}}>
                    📖 เปิดอ่าน
                  </a>}
                </div>
                {f.is_readonly&&<div style={{marginTop:6,fontSize:10,color:T.g400}}>🔒 ไฟล์อ่านอย่างเดียว</div>}
              </div>
            )
          })}
          {filteredFiles.length===0&&<div style={{gridColumn:'span 2',padding:40,textAlign:'center',color:T.g400}}>ไม่พบไฟล์อ้างอิง</div>}
        </div>
      </div>
      {showUpload&&(
        <Modal title="＋ เพิ่มไฟล์ข้อมูลอ้างอิง" onClose={()=>setShowUpload(false)}>
          <div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>ชื่อเอกสาร *</label>
              <input value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} style={inpStyle}/>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>สรุปสาระสำคัญ</label>
              <textarea value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} rows={3} style={{...inpStyle,resize:'vertical'}}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>หมวดหมู่ *</label>
              <select value={form.category_id} onChange={e=>setForm(p=>({...p,category_id:e.target.value}))} style={inpStyle}>
                <option value="">-- เลือกหมวด --</option>
                {refCats.map(c=><option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
            <div style={{marginBottom:16}}>
              <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:6,fontWeight:600}}>📎 แนบไฟล์ (PDF · JPG · DOC — อ่านอย่างเดียว)</label>
              <div onClick={()=>fileRef.current?.click()} style={{border:`2px dashed ${uploadFile?T.green:T.g200}`,borderRadius:8,padding:14,textAlign:'center',cursor:'pointer',background:uploadFile?T.greenL:T.g50}}>
                <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.doc,.docx" style={{display:'none'}} onChange={e=>setUploadFile(e.target.files[0])}/>
                {uploadFile?(
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8}}>
                    <span style={{fontSize:22}}>📄</span>
                    <div><div style={{fontSize:13,fontWeight:700,color:T.green}}>{uploadFile.name}</div><div style={{fontSize:11,color:T.g400}}>{fmtSz(uploadFile.size)}</div></div>
                    <button onClick={e=>{e.stopPropagation();setUploadFile(null)}} style={{background:'none',border:'none',color:T.red,cursor:'pointer',fontSize:16}}>✕</button>
                  </div>
                ):(
                  <div><div style={{fontSize:22,marginBottom:4}}>📄</div><div style={{fontSize:13,color:T.g400}}>คลิกเพื่อเลือกไฟล์</div></div>
                )}
              </div>
            </div>
            <Btn full color={T.primary} onClick={handleUpload} disabled={uploading}>{uploading?'⏳ กำลังอัปโหลด...':'💾 บันทึก'}</Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

// ═══════════════════════════════
// ROOT APP
// ═══════════════════════════════
// ═══════════════════════════════
// ADD USER FORM
// ═══════════════════════════════
function AddUserForm({units, onSave}) {
  const [form, setForm] = useState({
    full_name:'', email:'', phone:'',
    position_name:'', unit_id:'', role:'staff'
  })
  const [msg, setMsg] = useState('')

  const handleSave = () => {
    if(!form.full_name||!form.email){setMsg('❌ กรุณากรอกชื่อและอีเมล');return}
    onSave(form)
  }

  return(
    <div>
      {msg&&<div style={{background:T.redL,color:T.red,borderRadius:7,
        padding:'8px 12px',fontSize:12,marginBottom:12,fontWeight:600}}>{msg}</div>}
      <div style={{background:T.amberL,borderRadius:8,padding:'10px 12px',
        marginBottom:14,fontSize:12,color:'#7c4a00'}}>
        💡 กรอกข้อมูลผู้ใช้ก่อน เมื่อผู้ใช้ Login ครั้งแรกด้วยอีเมลนี้ 
        ระบบจะดึงข้อมูลโปรไฟล์และสิทธิ์ที่กำหนดไว้อัตโนมัติ
      </div>
      {[
        ['ชื่อ-สกุล *','full_name','text'],
        ['อีเมล *','email','email'],
        ['เบอร์โทร','phone','text'],
        ['ตำแหน่ง','position_name','text'],
      ].map(([l,k,t])=>(
        <div key={k} style={{marginBottom:10}}>
          <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>{l}</label>
          <input type={t} value={form[k]||''} 
            onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} 
            style={inpStyle}/>
        </div>
      ))}
      <div style={{marginBottom:10}}>
        <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>หน่วยงาน</label>
        <select value={form.unit_id} onChange={e=>setForm(p=>({...p,unit_id:e.target.value}))} style={inpStyle}>
          <option value="">-- เลือกหน่วยงาน --</option>
          {units.map(u=><option key={u.id} value={u.id}>{u.unit_code}. {u.unit_name}</option>)}
        </select>
      </div>
      <div style={{marginBottom:16}}>
        <label style={{fontSize:12,color:T.g600,display:'block',marginBottom:4,fontWeight:600}}>สิทธิ์การใช้งาน</label>
        <select value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} style={inpStyle}>
          {Object.entries(PERMISSIONS).map(([k,v])=>(
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
      <div style={{background:T.greenL,borderRadius:8,padding:'10px 12px',marginBottom:14,fontSize:12,color:T.green}}>
        ✅ หลังบันทึกแล้ว ผู้ใช้สามารถ:<br/>
        1. สมัครที่ Supabase ด้วยอีเมลนี้<br/>
        2. หรือ Admin เพิ่มที่ Supabase → Authentication → Users<br/>
        3. ระบบจะจับคู่ข้อมูลโดยอัตโนมัติ
      </div>
      <Btn full color={T.primary} onClick={handleSave}>💾 บันทึกข้อมูลผู้ใช้</Btn>
    </div>
  )
}

export default function App() {
  const [user, setUser] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [perm, setPerm] = useState(null)
  const [appLoading, setAppLoading] = useState(true)
  const [page, setPage] = useState('dashboard')
  const [docs, setDocs] = useState([])
  const [notifications, setNotifications] = useState([])
  const [selectedDoc, setSelectedDoc] = useState(null)
  const [selectedStep, setSelectedStep] = useState(null)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(async ({data:{session}}) => {
      if (session?.user) {
        await loadUserData(session.user)
      }
      setAppLoading(false)
    })
    const {data:{subscription}} = supabase.auth.onAuthStateChange(async (_,session) => {
      if (session?.user) {
        setUser(session.user)
        await loadUserData(session.user)
      } else {
        setUser(null); setUserInfo(null); setPerm(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadUserData = async (u) => {
    setUser(u)
    // Load user info from sercoop_users
    const {data:ui} = await supabase.from('sercoop_users')
      .select('*, unit:sercoop_units(*), position:sercoop_positions(*)')
      .eq('user_id', u.id).single()

    // Load permission
    const {data:pm} = await supabase.from('sercoop_permissions')
      .select('*').eq('user_id', u.id)
      .eq('module','sarbun').eq('is_active',true).single()

    // Fallback: check old user_roles table
    if (!pm) {
      const {data:oldRole} = await supabase.from('user_roles')
        .select('*').eq('user_id', u.id).single()
      if (oldRole) {
        setPerm({role: oldRole.role || 'staff'})
        setUserInfo({
          user_id: u.id,
          full_name: oldRole.full_name || u.email?.split('@')[0],
          position_name: oldRole.position || '',
          unit_name: oldRole.dept || '',
          unit_code: '01',
          phone: '',
          signature_data: null,
          avatar_url: null,
        })
      } else {
        setPerm({role:'staff'})
        setUserInfo({
          user_id: u.id,
          full_name: u.email?.split('@')[0],
          position_name: '',
          unit_name: '',
          unit_code: '01',
        })
      }
    } else {
      setPerm(pm)
      if (ui) {
        setUserInfo({
          ...ui,
          unit_name: ui.unit?.unit_name || '',
          unit_code: ui.unit?.unit_code || '01',
          position_name: ui.position?.position_name || ui.position_name || '',
        })
      }
    }

    // Load docs and notifications
    await Promise.all([loadDocs(), loadNotifications(u.id)])
  }

  const loadDocs = async () => {
    const {data} = await supabase.from('sercoop_documents')
      .select('*').order('created_at',{ascending:false})
    if (data) setDocs(data)
  }

  const loadNotifications = async (uid) => {
    const {data} = await supabase.from('sercoop_notifications')
      .select('*').eq('recipient_user_id', uid)
      .order('sent_at',{ascending:false}).limit(20)
    if (data) setNotifications(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null); setUserInfo(null); setPerm(null)
  }

  const handleSelectDoc = (doc, step=null) => {
    setSelectedDoc(doc)
    setSelectedStep(step)
    setPage('docdetail')
  }

  const handleBack = () => {
    setSelectedDoc(null)
    setSelectedStep(null)
    setPage('doc')
  }

  const unreadCount = notifications.filter(n=>!n.is_read).length

  if (appLoading) return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',
      justifyContent:'center',background:T.sidebar,fontFamily:'Sarabun'}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700;800&display=swap" rel="stylesheet"/>
      <div style={{textAlign:'center',color:'#fff'}}>
        <div style={{fontSize:56,marginBottom:14}}>🏛️</div>
        <div style={{fontSize:18,fontWeight:800,letterSpacing:0.5}}>SERCOOP.PSU</div>
        <div style={{fontSize:13,color:'rgba(255,255,255,0.5)',marginTop:6}}>กำลังโหลดระบบ...</div>
      </div>
    </div>
  )

  if (!user) return <PageLogin onLogin={u=>setUser(u)}/>

  const titles = {
    dashboard:'หน้าหลัก · ภาพรวมระบบ',
    inbox:'กล่องรออนุมัติ',
    doc:'เกษียณหนังสือ / เอกสาร',
    docdetail: selectedDoc ? `รายละเอียด: ${selectedDoc.doc_number||'ร่าง'}` : 'สร้างเอกสารใหม่',
    incoming:'หนังสือรับ',
    tracking:'ติดตามเอกสาร',
    budget:'งบประมาณแยกหมวด',
    regulations:'ฐานข้อมูลอ้างอิง',
    reports:'รายงานและสรุปข้อมูล',
    admin:'ผู้ดูแลระบบ (Admin Panel)',
    profile:'โปรไฟล์ของฉัน',
  }

  const subs = {
    doc:'บันทึกข้อความ · หนังสือส่ง · แนบ PDF · Workflow อัตโนมัติ',
    inbox:'เอกสารที่รออนุมัติจากคุณ · ลงนามดิจิทัล',
    tracking:'ติดตามสถานะเอกสารทุกขั้นตอน',
    budget:'แยกหมวด · ถัวเฉลี่ย · ใช้เกินงบ',
    regulations:'PDF · JPG · DOC · อ่านอย่างเดียว',
    admin:'จัดการหน่วยธุรกิจ · ผู้ใช้ · อำนาจอนุมัติ · ตั้งค่าระบบ',
  }

  return (
    <div style={{display:'flex',height:'100vh',fontFamily:'Sarabun',
      background:T.g100,overflow:'hidden'}}>
      <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700;800&display=swap" rel="stylesheet"/>
      <Sidebar
        page={page}
        setPage={p=>{setSelectedDoc(null);setSelectedStep(null);setPage(p)}}
        user={user} userInfo={userInfo} perm={perm}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        setCollapsed={setSidebarCollapsed}/>
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <Topbar
          title={titles[page]||'SERCOOP.PSU'}
          subtitle={subs[page]||'สหกรณ์บริการมหาวิทยาลัยสงขลานครินทร์ จำกัด'}
          notifications={unreadCount}/>

        {page==='dashboard' && (
          <PageDashboard docs={docs} notifications={notifications}
            setPage={setPage} userInfo={userInfo}/>
        )}
        {page==='inbox' && (
          <PageInbox userInfo={userInfo} perm={perm} onSelectDoc={handleSelectDoc}/>
        )}
        {page==='doc' && (
          <PageDoc user={user} userInfo={userInfo} perm={perm}
            onSelectDoc={handleSelectDoc}/>
        )}
        {page==='docdetail' && (
          <PageWorkflowDetail
            doc={selectedDoc} stepFocus={selectedStep}
            onBack={handleBack} userInfo={userInfo} perm={perm}
            onRefresh={loadDocs}/>
        )}
        {page==='tracking' && (
          <PageWorkflow docs={docs} onSelectDoc={handleSelectDoc}/>
        )}
        {page==='budget' && <PageBudget/>}
        {page==='regulations' && <PageRegulations perm={perm}/>}
        {page==='reports' && <PageReports docs={docs}/>}
        {page==='admin' && <PageAdmin user={user} userInfo={userInfo} perm={perm}/>}
        {page==='profile' && (
          <PageProfile user={user} userInfo={userInfo} setUserInfo={setUserInfo}/>
        )}
        {page==='incoming' && (
          <div style={{flex:1,display:'flex',alignItems:'center',
            justifyContent:'center',flexDirection:'column',gap:12,color:T.g400}}>
            <div style={{fontSize:48}}>📥</div>
            <div style={{fontSize:16,fontWeight:600,color:T.primary}}>หนังสือรับ</div>
            <div style={{fontSize:13}}>กำลังพัฒนา — จะเปิดใช้งานเร็วๆ นี้</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════
// WORKFLOW TRACKER (in tracking page)
// ═══════════════════════════════
function PageWorkflow({docs, onSelectDoc}) {
  const [search, setSearch] = useState('')
  const filtered = docs.filter(d =>
    d.subject?.includes(search) || d.doc_number?.includes(search) ||
    d.created_by_name?.includes(search)
  )
  return (
    <div style={{padding:'20px',overflowY:'auto',flex:1}}>
      <div style={{display:'flex',gap:10,marginBottom:14,alignItems:'center'}}>
        <div style={{display:'flex',flex:1,maxWidth:360,
          border:`1px solid ${T.g200}`,borderRadius:7,overflow:'hidden'}}>
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="ค้นหาเอกสาร..."
            style={{flex:1,border:'none',padding:'8px 12px',fontSize:13,
              fontFamily:'Sarabun',outline:'none'}}/>
          <div style={{padding:'0 10px',display:'flex',alignItems:'center',
            background:T.primary2,color:'#fff'}}>🔍</div>
        </div>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:10}}>
        {filtered.map(d => (
          <div key={d.id} style={{background:'#fff',borderRadius:12,
            padding:'14px 18px',boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
            cursor:'pointer',border:`1px solid ${T.g200}`}}
            onClick={()=>onSelectDoc(d)}
            onMouseEnter={e=>e.currentTarget.style.borderColor=T.primary2}
            onMouseLeave={e=>e.currentTarget.style.borderColor=T.g200}>
            <div style={{display:'flex',justifyContent:'space-between',
              alignItems:'flex-start',gap:10}}>
              <div>
                <div style={{fontWeight:700,color:T.primary,fontSize:14,marginBottom:4}}>
                  {d.subject}
                </div>
                <div style={{fontSize:12,color:T.g600}}>
                  เลขที่: <strong style={{color:T.primary2}}>{d.doc_number||'ร่าง'}</strong>
                  {' · '}ผู้จัดทำ: {d.created_by_name||'—'}
                  {' · '}หน่วย: {d.created_by_unit||'—'}
                </div>
                {d.budget_amount>0 && (
                  <div style={{fontSize:12,fontWeight:700,color:T.green,marginTop:2}}>
                    ฿{fmtMoney(d.budget_amount)}
                  </div>
                )}
              </div>
              <div style={{textAlign:'right',flexShrink:0}}>
                <Badge status={d.status}/>
                <div style={{fontSize:10,color:T.g400,marginTop:4}}>
                  {fmtDate(d.created_at)}
                </div>
              </div>
            </div>
          </div>
        ))}
        {filtered.length===0 && (
          <div style={{background:'#fff',borderRadius:12,padding:40,
            textAlign:'center',color:T.g400}}>
            <div style={{fontSize:40,marginBottom:12}}>📋</div>
            <div>ไม่พบเอกสาร</div>
          </div>
        )}
      </div>
    </div>
  )
}
