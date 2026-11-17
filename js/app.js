const $=s=>document.querySelector(s),KEY="cybershield_v1";
const mk=()=>({rules:[{id:1,name:"Web HTTPS",ip:"*",port:"443",act:"ALLOW",on:1},{id:2,name:"Web HTTP",ip:"*",port:"80",act:"ALLOW",on:1},{id:3,name:"DNS",ip:"*",port:"53",act:"ALLOW",on:1},{id:4,name:"SSH Admin",ip:"10.0.0.0/8",port:"22",act:"ALLOW",on:1},{id:5,name:"Blokir Telnet",ip:"*",port:"23",act:"BLOCK",on:1}],
 logs:[],bl:[{ip:"185.220.101.4",why:"Node Tor / brute-force",at:"2026-10-28 10:12"},{ip:"45.155.205.233",why:"Port scanning",at:"2026-10-29 02:40"}],tot:124580,al:118920,blk:5660,ports:{22:1830,3389:1420,23:980,445:760,1433:420},on:true,nid:6});
let S=mk(),ready=false,last="";const save=()=>{};
async function flush(){if(!ready)return;const nl=S.logs.filter(l=>l.n),j=JSON.stringify({rules:S.rules,bl:S.bl,tot:S.tot,al:S.al,blk:S.blk,ports:S.ports,on:S.on,clr:!!S.clr,newLogs:nl});if(j===last)return;
 try{const r=await fetch("api.php?action=save",{method:"POST",headers:{"Content-Type":"application/json"},body:j});if(!(await r.json()).ok)throw 0;last=j;nl.forEach(l=>delete l.n);S.clr=false}catch(e){toast("Gagal menyimpan ke database")}}
fetch("api.php?action=load").then(r=>r.json()).then(d=>{if(d.error)throw 0;S=Object.assign(mk(),d);S.nid=Math.max(0,...S.rules.map(r=>r.id))+1;ready=true;render()}).catch(()=>{/* Mode statis (mis. GitHub Pages): tidak ada database, pakai data contoh di atas. */});
setInterval(flush,3000);
const now=()=>new Date().toISOString().replace("T"," ").slice(0,19);
const esc=t=>String(t).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const toast=m=>{const t=$("#toast");t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2000)};
function ipMatch(p,ip){if(p==="*"||p===ip)return true;if(p.includes("/")){const[b,m]=p.split("/"),n=x=>x.split(".").reduce((a,o)=>a*256+ +o,0),mask=m==0?0:(~0<<(32-m))>>>0;return((n(b)&mask)>>>0)===((n(ip)&mask)>>>0)}return false}
function evaluate(ip,port){
 if(!S.on)return{ok:true,type:"Firewall nonaktif",why:"Firewall dimatikan"};
 const b=S.bl.find(x=>x.ip===ip);if(b)return{ok:false,type:"IP Blacklist: "+b.why,why:"IP ada di blacklist"};
 for(const r of S.rules)if(r.on&&ipMatch(r.ip,ip)&&(r.port==="*"||r.port==String(port)))return{ok:r.act==="ALLOW",type:(r.act==="ALLOW"?"Koneksi sah – ":"Dilarang – ")+r.name,why:"Cocok aturan #"+r.id+" "+r.name};
 return{ok:false,type:"Tidak ada aturan cocok (default deny)",why:"Default deny"};}
function process(ip,port,label){
 const r=evaluate(ip,port);S.tot++;
 if(r.ok)S.al++;else{S.blk++;S.ports[port]=(S.ports[port]||0)+1}
 S.logs.unshift({n:1,t:now(),ip,port,type:label||r.type,act:r.ok?"DIIZINKAN":"DIBLOKIR"});S.logs.length>500&&(S.logs.length=500);
 tick.a+=r.ok?1:0;tick.b+=r.ok?0:1;
 const f=$("#feed"),d=document.createElement("div");d.innerHTML=`${now().slice(11)} ${esc(ip)}:${port} → <b class="${r.ok?"ok":"bad"}">${r.ok?"DIIZINKAN":"DIBLOKIR"}</b>`;f.prepend(d);while(f.children.length>60)f.lastChild.remove();
 return r}
let tick={a:0,b:0},hist=Array.from({length:40},()=>({a:0,b:0}));
const rip=()=>`${[192,10,172,45,185,91,103][Math.random()*7|0]}.${Math.random()*255|0}.${Math.random()*255|0}.${1+Math.random()*253|0}`;
const goodPorts=[443,80,53,22],badPorts=[22,23,3389,445,1433,3306];
const pick=a=>a[Math.random()*a.length|0];
function render(){
 const act=S.rules.filter(r=>r.on).length;
 $("#sTot").textContent=S.tot.toLocaleString("id-ID");$("#sAl").textContent=S.al.toLocaleString("id-ID");$("#sBl").textContent=S.blk.toLocaleString("id-ID");
 $("#sPct").textContent=(S.al/S.tot*100).toFixed(1)+"%";$("#sRu").textContent=act;$("#nRules").textContent=S.rules.length;
 $("#sRuD").textContent=`${S.rules.filter(r=>r.on&&r.act==="ALLOW").length} Allow / ${S.rules.filter(r=>r.on&&r.act==="BLOCK").length} Block`;
 const m=Math.max(...Object.values(S.ports),1);
 $("#topPorts").innerHTML=Object.entries(S.ports).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([p,c])=>`<div class="row mono" style="font-size:12px"><span>Port ${p}</span><span>${c}</span></div><div class="bar"><i style="width:${c/m*100}%;background:var(--rd)"></i></div>`).join("");
 const tg=l=>`<span class="tag ${l.act==="DIIZINKAN"?"a":"b"}">${l.act}</span>`;
 $("#recent").innerHTML=S.logs.filter(l=>l.act==="DIBLOKIR").slice(0,5).map(l=>`<tr><td class="mono">${l.t.slice(11)}</td><td class="mono">${esc(l.ip)}</td><td class="mono">${l.port}</td><td>${esc(l.type)}</td><td>${tg(l)}</td></tr>`).join("")||`<tr><td colspan="5" style="color:var(--mut)">Belum ada serangan. Jalankan simulasi.</td></tr>`;
 $("#tLogs").innerHTML=S.logs.map(l=>`<tr><td class="mono">${l.t}</td><td class="mono">${esc(l.ip)}</td><td class="mono">${l.port}</td><td>${esc(l.type)}</td><td>${tg(l)}</td></tr>`).join("")||`<tr><td colspan="5" style="color:var(--mut)">Log kosong.</td></tr>`;
 $("#tRules").innerHTML=S.rules.map(r=>`<tr><td><label class="sw"><input type="checkbox" data-t="${r.id}" ${r.on?"checked":""} aria-label="Aktifkan aturan ${esc(r.name)}"><span></span></label></td><td>${esc(r.name)}</td><td class="mono">${esc(r.ip)}</td><td class="mono">${esc(r.port)}</td><td><span class="tag ${r.act==="ALLOW"?"a":"b"}">${r.act==="ALLOW"?"IZINKAN":"BLOKIR"}</span></td><td><button class="btn-d" data-dr="${r.id}">Hapus</button></td></tr>`).join("");
 $("#tBl").innerHTML=S.bl.map(b=>`<tr><td class="mono">${esc(b.ip)}</td><td>${esc(b.why)}</td><td class="mono">${b.at}</td><td><button class="btn-d" data-db="${esc(b.ip)}">Hapus</button></td></tr>`).join("")||`<tr><td colspan="4" style="color:var(--mut)">Blacklist kosong.</td></tr>`;
 const fw=S.on;$("#fwSt").textContent=fw?"AKTIF (ALLOW-LIST)":"NONAKTIF";$("#fwSt").className=(fw?"ok":"bad")+" mono";const pw=$("#pw");pw.textContent=fw?"⏻ Matikan Firewall":"⏻ Aktifkan Firewall";pw.classList.toggle("off",!fw);
 save()}
function draw(){const c=$("#cv"),x=c.getContext("2d"),W=c.width,H=c.height;x.clearRect(0,0,W,H);const mx=Math.max(10,...hist.map(h=>h.a+h.b)),st=W/(hist.length-1);
 x.strokeStyle="#16233a";x.fillStyle="#7a8aa5";x.font="11px monospace";for(let i=0;i<=4;i++){const y=H-20-(H-30)*i/4;x.beginPath();x.moveTo(30,y);x.lineTo(W,y);x.stroke();x.fillText(Math.round(mx*i/4),0,y+3)}
 [["a","#34d399"],["b","#f43f5e"]].forEach(([k,col])=>{x.strokeStyle=col;x.lineWidth=2;x.beginPath();hist.forEach((h,i)=>{const px=30+i*(W-30)/(hist.length-1),py=H-20-(H-30)*h[k]/mx;i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke()})}
setInterval(()=>{hist.push({...tick});hist.shift();tick={a:0,b:0};draw();
 $("#clk").textContent=new Date().toISOString().slice(11,19)+" UTC";
 const cpu=15+Math.random()*10|0,mem=40+Math.random()*5|0;$("#cpuT").textContent=cpu+"%";$("#cpuB").style.width=cpu+"%";$("#memT").textContent=mem+"%";$("#memB").style.width=mem+"%";$("#bw").textContent=(1+Math.random()*1.2).toFixed(1)+" MB/s";
 const recent=hist.slice(-5).reduce((s,h)=>s+h.b,0),t=$("#thr");t.textContent=recent>40?"TINGGI":recent>10?"SEDANG":"RENDAH";t.className=(recent>40?"bad":recent>10?"":"ok")+" mono";t.style.color=recent>10&&recent<=40?"var(--am)":"";
 if(auto){for(let i=0;i<4+Math.random()*6;i++)process(rip(),pick(goodPorts))}
 if(S.on===false||auto||true)render()},1000);
let auto=null;
$("#nav").onclick=e=>{const b=e.target.closest("button");if(b)go(b.dataset.v)};
document.querySelector("[data-go]").onclick=()=>go("logs");
function go(v){document.querySelectorAll(".view").forEach(s=>s.classList.toggle("on",s.id==="v-"+v));document.querySelectorAll("nav button").forEach(b=>b.classList.toggle("on",b.dataset.v===v))}
$("#pw").onclick=()=>{S.on=!S.on;toast(S.on?"Firewall diaktifkan":"Firewall dimatikan – semua koneksi lolos");render()};
$("#fRule").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),ip=f.get("ip").trim(),pt=f.get("port").trim();
 if(ip!=="*"&&!/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(ip))return toast("Format IP tidak valid");
 if(pt!=="*"&&!(/^\d+$/.test(pt)&&pt>0&&pt<65536))return toast("Port harus 1–65535 atau *");
 S.rules.push({id:S.nid++,name:f.get("name"),ip,port:pt,act:f.get("act"),on:1});e.target.reset();e.target.ip.value="*";e.target.port.value="*";toast("Aturan ditambahkan");render()};
$("#tRules").onclick=e=>{const d=e.target.dataset.dr;if(d){S.rules=S.rules.filter(r=>r.id!=d);toast("Aturan dihapus");render()}};
$("#tRules").onchange=e=>{const r=S.rules.find(r=>r.id==e.target.dataset.t);if(r){r.on=e.target.checked?1:0;toast(`Aturan ${r.on?"diaktifkan":"dinonaktifkan"}`);render()}};
$("#fBl").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),ip=f.get("ip").trim();
 if(!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip))return toast("Format IP tidak valid");if(S.bl.some(b=>b.ip===ip))return toast("IP sudah ada di blacklist");
 S.bl.unshift({ip,why:f.get("why")||"Manual",at:now().slice(0,16)});e.target.reset();toast("IP diblacklist");render()};
$("#tBl").onclick=e=>{const d=e.target.dataset.db;if(d){S.bl=S.bl.filter(b=>b.ip!==d);toast("IP dihapus dari blacklist");render()}};
$("#bTraf").onclick=e=>{if(auto){clearInterval(auto);auto=null;e.target.textContent="▶ Mulai Traffic Normal"}else{auto=1;e.target.textContent="■ Hentikan Traffic"}};
$("#bOne").onclick=()=>process(rip(),pick(goodPorts));
$("#bAtk").onclick=()=>{const types=[["Brute-force SSH",22],["RDP Scan",3389],["Telnet Probe",23],["SMB Exploit",445],["SQL Injection Probe",1433]],bl=S.bl.map(b=>b.ip);
 for(let i=0;i<25;i++){const[t,p]=pick(types);const ip=Math.random()<.3&&bl.length?pick(bl):rip();process(ip,p,"Serangan: "+t)}toast("Simulasi serangan: 25 paket dikirim");render()};
$("#fPkt").onsubmit=e=>{e.preventDefault();const f=new FormData(e.target),ip=f.get("ip").trim(),p=+f.get("port");
 if(!/^(\d{1,3}\.){3}\d{1,3}$/.test(ip)||!(p>0&&p<65536))return toast("IP atau port tidak valid");
 const r=process(ip,p);$("#pktRes").innerHTML=`${esc(ip)}:${p} → <b class="${r.ok?"ok":"bad"}">${r.ok?"DIIZINKAN":"DIBLOKIR"}</b><br><span style="color:var(--mut)">${esc(r.why)}</span>`;render()};
$("#clrLog").onclick=()=>{S.logs=[];S.clr=true;toast("Log dihapus");render()};
$("#expLog").onclick=()=>{toast("Ekspor CSV hanya tersedia di versi unduhan");};
render();draw();
