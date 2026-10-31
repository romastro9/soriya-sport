/* Shared, local-only fabric color preview. Never implies stock availability. */
window.FabricColors=(()=>{
  'use strict';
  const palette=[
    {id:'white',name:'ស',hex:'#f5f5f5'}, {id:'black',name:'ខ្មៅ',hex:'#24272d'},
    {id:'navy',name:'ទឹកប៊ិច',hex:'#153252'}, {id:'blue',name:'ខៀវ',hex:'#2372d9'},
    {id:'red',name:'ក្រហម',hex:'#c92c3e'}, {id:'green',name:'បៃតង',hex:'#27834b'},
    {id:'yellow',name:'លឿង',hex:'#efd044'}, {id:'teal',name:'បៃតងទឹកសមុទ្រ',hex:'#167d85'},
    {id:'orange',name:'ទឹកក្រូច',hex:'#ed7c33'}, {id:'purple',name:'ស្វាយ',hex:'#8055b0'},
    {id:'pink',name:'ផ្កាឈូក',hex:'#e990b0'}, {id:'maroon',name:'ក្រហមចាស់',hex:'#792a40'}
  ];
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const choices=new Map(),renders=new Map(),sources=new Map();
  let items=[],active=null,opener=null,dialog=null,revision=0;
  const chosen=name=>palette.find(p=>p.id===choices.get(name))||palette[0];
  function image(item,className=''){
    const color=chosen(item.name),src=renders.get(item.image+'|'+color.id)||item.image;
    const alt=items.some(f=>f.name===item.name)?item.name+' — '+color.name:item.name;
    return `<img class="${escape(className)}" data-fabric-preview="${escape(item.name)}" src="${escape(src)}" alt="${escape(alt)}" loading="lazy">`;
  }
  function button(item){return item.image?`<button type="button" class="fabric-color-button" data-fabric-color-open="${escape(item.name)}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-3.7 1.6 1.6 0 0 1 1-2.8h2a4 4 0 0 0 4-4C21 6 17 3 12 3Z"/><circle cx="7" cy="10" r=".7"/><circle cx="10" cy="6.8" r=".7"/><circle cx="15" cy="7" r=".7"/><circle cx="17.6" cy="10.5" r=".7"/></svg><span>ជ្រើសពណ៌</span><span class="fabric-card-color" style="--swatch:${chosen(item.name).hex}" aria-hidden="true"></span></button>`:''}
  function loadSource(item){
    if(!sources.has(item.image))sources.set(item.image,new Promise((resolve,reject)=>{
      const img=new Image();img.onload=()=>{
        const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;
        const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
        const pixels=ctx.getImageData(0,0,c.width,c.height),hist=new Uint32Array(256),gray=new Uint8Array(c.width*c.height);
        for(let i=0,j=0;i<pixels.data.length;i+=4,j++){const l=Math.round(.2126*pixels.data[i]+.7152*pixels.data[i+1]+.0722*pixels.data[i+2]);gray[j]=l;hist[l]++;}
        let sum=0,white=245;for(let l=0;l<256;l++){sum+=hist[l];if(sum>=gray.length*.9){white=Math.max(200,l);break;}}
        resolve({gray,white,width:c.width,height:c.height});
      };img.onerror=()=>{sources.delete(item.image);reject(Error('Image unavailable'))};img.src=item.image;
    }));
    return sources.get(item.image);
  }
  async function tinted(item,color){
    const key=item.image+'|'+color.id;if(renders.has(key))return renders.get(key);
    if(color.id==='white')return item.image;
    const {gray,white,width,height}=await loadSource(item),c=document.createElement('canvas');c.width=width;c.height=height;
    const ctx=c.getContext('2d'),out=ctx.createImageData(width,height),rgb=color.hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));
    for(let j=0,i=0;j<gray.length;j++,i+=4){const shade=Math.min(1.1,gray[j]/white),highlight=Math.max(0,shade-1)*115;
      for(let k=0;k<3;k++)out.data[i+k]=Math.min(255,rgb[k]*Math.min(1,shade)+highlight);out.data[i+3]=255;
    }
    ctx.putImageData(out,0,0);
    const blob=await new Promise(resolve=>c.toBlob(resolve,'image/webp',.9));if(!blob)throw Error('Cannot create preview');
    const url=URL.createObjectURL(blob);renders.set(key,url);return url;
  }
  function syncControls(){
    if(!active)return;const color=chosen(active.name);
    dialog.querySelectorAll('[data-fabric-swatch]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.fabricSwatch===color.id)));
    dialog.querySelector('[data-color-name]').textContent=color.name;
    dialog.querySelector('[data-color-dot]').style.background=color.hex;
    dialog.querySelector('[data-color-contact]').href='https://t.me/soriyasport?text='+encodeURIComponent(`សួស្តី SORIYA SPORT! ខ្ញុំចាប់អារម្មណ៍សាច់ក្រណាត់ ${active.name} ពណ៌${color.name}។ សូមជួយបញ្ជាក់ពណ៌ផលិត។`);
  }
  async function select(colorId){
    const item=active,color=palette.find(p=>p.id===colorId);if(!item||!color)return;
    const current=++revision;choices.set(item.name,color.id);syncControls();dialog.querySelector('[data-color-error]').textContent='';
    try{
      const src=await tinted(item,color);if(current!==revision||active!==item)return;
      document.querySelectorAll('[data-fabric-preview]').forEach(img=>{if(img.dataset.fabricPreview===item.name){img.src=src;img.alt=item.name+' — '+color.name;}});
      document.querySelectorAll('[data-fabric-color-open]').forEach(b=>{if(b.dataset.fabricColorOpen===item.name)b.querySelector('.fabric-card-color')?.style.setProperty('--swatch',color.hex);});
      document.dispatchEvent(new CustomEvent('fabriccolorchange',{detail:{name:item.name,color:color.name}}));
    }catch{
      if(current!==revision)return;choices.set(item.name,'white');syncControls();
      document.querySelectorAll('[data-fabric-preview]').forEach(img=>{if(img.dataset.fabricPreview===item.name){img.src=item.image;img.alt=item.name+' — ស';}});
      dialog.querySelector('[data-color-error]').textContent='មិនអាចបង្ហាញពណ៌នេះបានទេ។ សូមព្យាយាមម្តងទៀត។';
    }
  }
  function open(name,trigger){
    const item=items.find(f=>f.name===name&&f.image);if(!item)return;active=item;opener=trigger;revision++;
    dialog.innerHTML=`<button type="button" class="fabric-color-close" aria-label="បិទជម្រើសពណ៌">×</button><div class="fabric-color-layout"><figure class="fabric-color-figure">${image(item,'fabric-color-large')}<figcaption><span data-color-dot></span>ពណ៌មើលជាមុន៖ <strong data-color-name></strong></figcaption></figure><section class="fabric-color-options"><div class="eyebrow">FABRIC / COLOR PREVIEW</div><h2 id="fabricColorTitle">${escape(item.name)}</h2><p class="fabric-color-intro">ជ្រើសពណ៌ដែលពេញចិត្ត។<br>រូបក្រណាត់នឹងប្តូរពណ៌ភ្លាមៗ។</p><div class="fabric-swatches" role="group" aria-label="ជ្រើសពណ៌សាច់ក្រណាត់">${palette.map(p=>`<button type="button" data-fabric-swatch="${p.id}" aria-pressed="false" aria-label="ពណ៌${p.name}"><span class="fabric-swatch-disc" style="--swatch:${p.hex}"><span aria-hidden="true">✓</span></span><span>${p.name}</span></button>`).join('')}</div><p class="fabric-color-note">ពណ៌នេះជារូបមើលជាមុន។ សូមបញ្ជាក់ពណ៌ផលិតជាមួយហាង។</p><p class="fabric-color-error" data-color-error role="status"></p><div class="fabric-color-actions"><button type="button" class="fabric-color-reset">↺ ពណ៌ដើម</button><a class="button" data-color-contact target="_blank" rel="noopener">ទាក់ទងហាង ↗</a></div></section></div>`;
    syncControls();dialog.showModal();document.documentElement.classList.add('fabric-color-open');
    dialog.querySelector(`[data-fabric-swatch="${chosen(name).id}"]`).focus({preventScroll:true});
    dialog.querySelector('.fabric-color-close').onclick=()=>dialog.close();
    dialog.querySelector('.fabric-color-reset').onclick=()=>select('white');
  }
  function configure(fabrics){
    items=fabrics;if(dialog)return;
    dialog=document.createElement('dialog');dialog.id='fabricColorDialog';dialog.className='fabric-color-dialog';dialog.setAttribute('aria-labelledby','fabricColorTitle');document.body.append(dialog);
    dialog.addEventListener('close',()=>{revision++;active=null;document.documentElement.classList.remove('fabric-color-open');opener?.focus({preventScroll:true});});
    dialog.addEventListener('click',e=>{const swatch=e.target.closest('[data-fabric-swatch]');if(swatch)select(swatch.dataset.fabricSwatch);if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
    document.addEventListener('click',e=>{const b=e.target.closest('[data-fabric-color-open]');if(b)open(b.dataset.fabricColorOpen,b);});
  }
  return {configure,image,button,colorName:name=>chosen(name).name};
})();
