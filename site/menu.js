const $=s=>document.querySelector(s);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\u1780-\u17ff]/g,'');
menuFabrics.forEach(f=>{if(window.fabricPhotoMap[f.name])f.image=window.fabricPhotoMap[f.name]});
FabricColors.configure(menuFabrics);
let menuJerseys=jerseys;
let previousFocus=null;
function photo(item){return item.image?FabricColors.image(item):`<div class="no-photo"><b>${escapeHTML(item.name)}</b>រូបភាពនឹងបន្ថែមពេលក្រោយ</div>`}
function contactURL(name){return 'https://t.me/soriyasport?text='+encodeURIComponent('សួស្តី SORIYA SPORT! ខ្ញុំចាប់អារម្មណ៍ '+name+'។ សូមជួយណែនាំព័ត៌មានបន្ថែម។')}
function openPhoto(item){previousFocus=document.activeElement;$('#menuModalBody').innerHTML=`<h2 id="menuModalHeading">${escapeHTML(item.name)}</h2>${item.image?FabricColors.image(item,'modal-image'):'<p>រូបភាពនឹងបន្ថែមពេលក្រោយ។</p>'}<a class="button menu-modal-cta" href="${escapeHTML(contactURL(item.name))}" target="_blank" rel="noopener">ទាក់ទងហាងអំពីម៉ូតនេះ ↗</a>`;$('#menuModal').showModal()}
$('#closeMenuModal').onclick=()=>$('#menuModal').close();
$('#menuModal').addEventListener('close',()=>previousFocus?.focus({preventScroll:true}));
$('#menuModal').addEventListener('click',e=>{if(e.target!==e.currentTarget)return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close()});
function renderFabrics(){const q=normalize($('#search').value);const shown=menuFabrics.map((f,index)=>({...f,index})).filter(f=>[f.name,/^\d+$/.test(f.name)?'A'+f.name:'',/^\d+$/.test(f.name)?'Vai'+f.name:'',f.name==='Vải 144'?'A144':''].some(n=>normalize(n).includes(q))).sort((a,b)=>Number(!!b.image)-Number(!!a.image));$('#menuFabricCount').textContent=shown.length+' ប្រភេទសាច់ក្រណាត់';$('#menuEmpty').hidden=shown.length>0;$('#menuFabricGrid').innerHTML=shown.map(f=>`<article class="card"><button class="card-photo menu-photo-button" data-fabric="${f.index}" aria-label="មើល ${escapeHTML(f.name)}">${photo(f)}</button><div class="menu-card-info"><h3>${escapeHTML(f.name)}</h3><button data-fabric="${f.index}" aria-label="ពង្រីករូប ${escapeHTML(f.name)}">មើលធំ ↗</button></div>${FabricColors.button(f)}</article>`).join('')}
$('#search').addEventListener('input',renderFabrics);
$('#menuFabricGrid').addEventListener('click',e=>{const b=e.target.closest('[data-fabric]');if(b)openPhoto(menuFabrics[Number(b.dataset.fabric)])});
const necklines=Array.from({length:29},(_,i)=>({name:'ម៉ូតកអាវ '+String(i+1).padStart(2,'0'),id:String(i+1).padStart(2,'0'),image:`assets/soriya-neckline-v2-${String(i+1).padStart(2,'0')}.webp`}));
$('#menuNecklineGrid').innerHTML=necklines.map((n,i)=>`<article class="neckline-card"><button class="neckline-preview" data-neckline="${i}" aria-label="ពង្រីករូប ${n.name}"><img src="${n.image}" alt="${n.name}" width="260" height="260" loading="lazy"><span class="neckline-zoom" aria-hidden="true">↗</span></button><div class="neckline-info"><h3>ម៉ូត <span>${n.id}</span></h3><button data-neckline="${i}">មើលធំ ↗</button></div></article>`).join('');
$('#menuNecklineGrid').addEventListener('click',e=>{const b=e.target.closest('[data-neckline]');if(b)openPhoto(necklines[Number(b.dataset.neckline)])});
function renderJerseys(){$('#jerseyGrid').innerHTML=menuJerseys.map((j,i)=>`<button class="menu-jersey-card" data-jersey="${i}" aria-label="មើល ${escapeHTML(j.name)}">${photo(j)}<span>${escapeHTML(j.name)} <b aria-hidden="true">↗</b></span></button>`).join('')}
$('#jerseyGrid').addEventListener('click',e=>{const b=e.target.closest('[data-jersey]');if(b)openPhoto(menuJerseys[Number(b.dataset.jersey)])});
let syncing=false;
async function syncJerseys(){if(syncing||document.hidden)return;syncing=true;try{const base='https://romastro9.github.io/soriya-sport/';const r=await fetch(new URL('jersey-manifest.json',base),{cache:'no-store'});if(!r.ok)throw Error('Gallery unavailable');const data=await r.json();if(!Array.isArray(data.items))throw Error('Invalid gallery');menuJerseys=data.items.filter(x=>typeof x.name==='string'&&typeof x.image==='string'&&/^assets\/(?:drive|jersey)-[a-zA-Z0-9_-]+\.(png|jpg|webp)$/.test(x.image)).map(x=>({...x,image:new URL(x.image,base).href}));renderJerseys();$('#menuSync').textContent=menuJerseys.length?'✓ ស្នាដៃអាវកីឡាថ្មីៗ':'មិនទាន់មានរូបអាវក្នុងអាល់ប៊ុម'}catch{$('#menuSync').textContent='កំពុងបង្ហាញស្នាដៃអាវកីឡាដែលមាន។'}finally{syncing=false}}
$('#menuToggle').onclick=()=>{const open=$('#menuToggle').getAttribute('aria-expanded')!=='true';$('#menuToggle').setAttribute('aria-expanded',String(open));$('header').classList.toggle('menu-open',open)};
$('header nav').addEventListener('click',e=>{if(e.target.closest('a')){$('header').classList.remove('menu-open');$('#menuToggle').setAttribute('aria-expanded','false')}});
renderFabrics();renderJerseys();syncJerseys();setInterval(syncJerseys,60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncJerseys()});
