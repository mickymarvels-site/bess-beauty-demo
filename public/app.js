const $ = s => document.querySelector(s);
const initial = {promo:'',email:'',classes:[{title:'Knotless & Box Braids',price:150,duration:'2 days · 1 hr 30 min per day',description:'Learn the techniques behind knotless and traditional box braids.',visible:true},{title:'Cornrows & Stitch Braids',price:200,duration:'2 days · 1 hr 30 min per day',description:'Build your skills in cornrows and stitch braiding techniques.',visible:true},{title:'Complete Braiding Masterclass',price:300,duration:'3 days · 1 hr 30 min per day',description:'Explore knotless, box braids and stitch braids in one comprehensive class.',visible:true}],videos:[{title:'The Knotless Class',price:60,description:'Hair preparation, extension quantities for different hair densities, braid sizes, and effective use of braiding gel.',url:'',visible:true},{title:'Cornrows, Stitch Braids & Feed-ins',price:'',description:'Hair preparation, gel application, molding and sectioning, estimating hair for a design, and two stitch braiding techniques.',url:'',visible:true}],photos:[]};
const clone=x=>JSON.parse(JSON.stringify(x));
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const safeUrl=(url,image=false)=>{try{const u=new URL(url);return u.protocol==='https:'?u.href:''}catch{return image&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(url)?url:''}};
let live=clone(initial), draft,remote=false,uploadInProgress=false;
const price=x=>x===''||x==null?'Price to be confirmed':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(x);

let cart=[];
try{const stored=JSON.parse(localStorage.getItem('bess-cart-v1'));if(Array.isArray(stored))cart=stored.filter(x=>x&&['classes','videos'].includes(x.kind)&&typeof x.title==='string'&&Number.isInteger(x.quantity)&&x.quantity>0&&x.quantity<=10).slice(0,100)}catch{}
function purchasable(x){return x&&x.visible&&typeof x.price==='number'&&Number.isFinite(x.price)&&x.price>=0}
function purchaseActions(x,kind,label){return `<div class="purchase-actions"><a class="text-link" href="#contact">${label}</a><button class="button buy-button" data-buy="${kind}" data-title="${esc(x.title)}" ${purchasable(x)?'':'disabled'} aria-label="${esc(purchasable(x)?'Add '+x.title+' to cart':'Price pending for '+x.title)}">${purchasable(x)?'Buy ↗':'Price pending'}</button></div>`}
function cartProduct(row){return live[row.kind]?.find(x=>x.title===row.title&&purchasable(x))}
function saveCart(){try{localStorage.setItem('bess-cart-v1',JSON.stringify(cart))}catch{$('#cart-status').textContent='Your cart works for this visit, but could not be saved in this browser.'}}
function renderCart(){
 // Resolve against published content so removed/hidden items cannot remain purchasable.
 cart=cart.filter(row=>cartProduct(row));saveCart();
 $('#cart-count').textContent=cart.reduce((n,x)=>n+x.quantity,0);
 $('#cart-summary').hidden=!cart.length;
 $('#cart-items').innerHTML=cart.length?cart.map((row,i)=>{const x=cartProduct(row);return `<article class="cart-row"><div><p class="eyebrow">${row.kind==='classes'?'LIVE CLASS':'VIDEO LESSON'}</p><h3>${esc(x.title)}</h3><p>${price(x.price)} each</p></div><div class="cart-row-controls"><label>Quantity for ${esc(x.title)}<select data-cart-quantity="${i}" aria-label="Quantity for ${esc(x.title)}">${Array.from({length:10},(_,n)=>`<option value="${n+1}" ${row.quantity===n+1?'selected':''}>${n+1}</option>`).join('')}</select></label><strong>${price(x.price*row.quantity)}</strong><button data-cart-remove="${i}" aria-label="Remove ${esc(x.title)} from cart">Remove</button></div></article>`}).join(''):'<div class="cart-empty"><h3>A little room for possibility.</h3><p>Your cart is empty. Choose a class or video lesson to get started.</p><a class="button" href="#classes">Explore classes ↗</a></div>';
 const cents=cart.reduce((n,row)=>n+Math.round(cartProduct(row).price*100)*row.quantity,0);
 $('#cart-total').textContent=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(cents/100);
}
$('#customer').addEventListener('click',e=>{
 const buy=e.target.closest('[data-buy]');
 if(buy){const row={kind:buy.dataset.buy,title:buy.dataset.title,quantity:1};if(!cartProduct(row))return;const existing=cart.find(x=>x.kind===row.kind&&x.title===row.title);if(existing&&existing.quantity>=10){$('#cart-status').textContent='Maximum 10 of each item in this demo.'}else{if(existing)existing.quantity++;else cart.push(row);$('#cart-status').textContent=row.title+' added to your cart.'}renderCart();location.hash='cart';return}
 const remove=e.target.closest('[data-cart-remove]');if(remove){const index=Number(remove.dataset.cartRemove);const title=cart[index]?.title;cart.splice(index,1);renderCart();$('#cart-status').textContent=title+' removed from your cart.';$('#clear-cart').focus()}
});
$('#cart-items').addEventListener('change',e=>{if(!e.target.matches('[data-cart-quantity]'))return;const index=Number(e.target.dataset.cartQuantity),quantity=Number(e.target.value);if(cart[index]&&Number.isInteger(quantity)&&quantity>=1&&quantity<=10){cart[index].quantity=quantity;renderCart();const replacement=$(`[data-cart-quantity="${index}"]`);replacement?.focus();$('#cart-status').textContent='Cart total updated.'}});
$('#clear-cart').onclick=()=>{cart=[];renderCart();$('#cart-status').textContent='Your cart has been cleared.'};
$('#checkout-demo').onclick=()=>{$('#cart-status').textContent='This is a checkout preview. No order has been placed and no payment has been taken. Contact Bess to discuss your selection.'};

function mediaUrl(x){return /^[a-f0-9-]{36}$/.test(x.mediaId||'')?'/.netlify/functions/media?id='+x.mediaId:''}
function videoPlayer(x){const src=mediaUrl(x)||(safeUrl(x.url)&&/\.(mp4|webm)(\?|$)/i.test(x.url)?safeUrl(x.url):'');return src?`<video class="lesson-player" controls playsinline preload="metadata" aria-label="${esc(x.title)} public preview" src="${esc(src)}"></video>`:'<div class="video-icon" aria-hidden="true">▷</div>'}
function render(){
 $('#promotion').hidden=!live.promo;$('#promotion').textContent=live.promo;
 $('#class-list').innerHTML=live.classes.filter(x=>x.visible).map((x,i)=>`<article class="card"><span class="number">CLASS / 0${i+1}</span><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p><p>${esc(x.duration)}</p><div class="price">${price(x.price)}</div>${purchaseActions(x,'classes','Inquire about this class ↗')}</article>`).join('');
 $('#video-list').innerHTML=live.videos.filter(x=>x.visible).map(x=>`<article class="video-card">${videoPlayer(x)}<p class="eyebrow">PRE-RECORDED VIDEO LESSON</p><h3>${esc(x.title)}</h3><p>${esc(x.description)}</p><div class="price">${price(x.price)}</div>${!mediaUrl(x)&&safeUrl(x.url)?`<a class="text-link" href="${esc(safeUrl(x.url))}" target="_blank" rel="noopener noreferrer">Watch public sample ↗</a>`:(mediaUrl(x)?'<p class="fine">Public video preview · Press play above</p>':'<p class="fine">Preview coming soon</p>')}${purchaseActions(x,'videos','Inquire about this lesson ↗')}</article>`).join('');
 $('#gallery-list').innerHTML=live.photos.length?live.photos.map(x=>`<figure><img src="${esc(safeUrl(x.url,true))}" alt="${esc(x.caption)}" loading="lazy"><figcaption>${esc(x.caption)}</figcaption></figure>`).join(''):[['The knotless edit','Room for the salon’s own knotless braid photos.'],['Clean lines. Beautiful detail.','Room for cornrows and stitch braid photos.'],['Your next signature look','Upload original salon photos in the admin studio.']].map(x=>`<div class="placeholder"><b>${x[0]}</b><p>${x[1]}</p></div>`).join('');
 const email=live.email&&/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(live.email)?live.email:'';
 renderCart();
 $('#contact-link').hidden=!email;$('#contact-link').href='mailto:'+email;$('#contact-note').textContent=email?'Tell us about the style or class you’re interested in. Contact Bess to discuss availability.':'Appointment and class inquiries will open when salon contact details are added.';
}
function saveDraft(){try{localStorage.setItem('bess-draft-v1',JSON.stringify(draft));$('#status').textContent='Draft saved · not published'}catch{$('#status').textContent='Browser storage is full. Remove a photo or export your draft.'}}
function editors(){
 $('#promo').value=draft.promo;$('#email').value=draft.email;
 for(const [key,target] of [['classes','#class-editor'],['videos','#video-editor']]){
 $(target).innerHTML=draft[key].map((x,i)=>`<div class="edit-item" data-kind="${key}" data-index="${i}"><div class="edit-grid"><label>Title<input data-field="title" value="${esc(x.title)}" maxlength="150"></label><label>Price in USD (blank = unconfirmed)<input data-field="price" type="number" min="0" step="1" value="${esc(x.price)}"></label></div><label>Description<textarea data-field="description" maxlength="3000">${esc(x.description)}</textarea></label>${key==='classes'?`<label>Schedule<input data-field="duration" value="${esc(x.duration)}"></label>`:`<label>Upload video preview (MP4 / WebM, up to 15 MB)<input data-video-upload="${i}" type="file" accept="video/mp4,video/webm" ${uploadInProgress?'disabled':''}></label>${x.mediaId?`<p class="fine">Attached: ${esc(x.filename||'Uploaded video')}. Plays on the customer page after publishing.</p><button data-clear-video="${i}">Remove uploaded video</button>`:''}<label>Public sample video URL (HTTPS)<input data-field="url" type="url" value="${esc(x.url)}"></label>`}<label class="check"><input data-field="visible" type="checkbox" ${x.visible?'checked':''}>Show to customers after publishing</label><button data-remove="${key}" data-index="${i}">Remove ${key==='classes'?'class':'video'}</button></div>`).join('');
 }
 $('#photo-editor').innerHTML=draft.photos.map((x,i)=>`<div class="edit-item" data-kind="photos" data-index="${i}"><img src="${esc(safeUrl(x.url,true))}" alt="Photo preview"><label>Photo description<input data-field="caption" value="${esc(x.caption)}" maxlength="300"></label><button data-remove="photos" data-index="${i}">Remove photo</button></div>`).join('');
}
$('#admin').addEventListener('input',e=>{const el=e.target;if(el.id==='promo'||el.id==='email')draft[el.id]=el.value;else if(el.dataset.field){const row=el.closest('[data-kind]');draft[row.dataset.kind][Number(row.dataset.index)][el.dataset.field]=el.type==='checkbox'?el.checked:el.type==='number'?(el.value===''?'':Number(el.value)):el.value}else return;saveDraft()});
$('#admin').addEventListener('click',e=>{if(uploadInProgress)return;const clear=e.target.closest('[data-clear-video]');if(clear){const x=draft.videos[Number(clear.dataset.clearVideo)];delete x.mediaId;delete x.filename;saveDraft();editors();return}const b=e.target.closest('[data-remove]');if(!b)return;draft[b.dataset.remove].splice(Number(b.dataset.index),1);saveDraft();editors()});
$('#add-class').onclick=()=>{draft.classes.push({title:'New class',price:'',description:'',duration:'',visible:false});saveDraft();editors()};
$('#add-video').onclick=()=>{draft.videos.push({title:'New video lesson',price:'',description:'',url:'',visible:false});saveDraft();editors()};
$('#video-editor').addEventListener('change',async e=>{
 const input=e.target;if(!input.matches('[data-video-upload]'))return;
 const file=input.files[0];if(!file)return;
 const item=draft.videos[Number(input.dataset.videoUpload)],publishWasDisabled=$('#publish').disabled;
 try{
  if(uploadInProgress)throw Error('Wait for the current upload to finish.');
  if(!remote)throw Error('Video uploads are available on the Netlify demo.');
  if(!['video/mp4','video/webm'].includes(file.type)||!file.size||file.size>15*1024*1024)throw Error('Choose an MP4 or WebM up to 15 MB. For longer videos, use a hosted sample URL.');
  const password=$('#password').value;if(!password)throw Error('Enter your admin password above before uploading.');
  uploadInProgress=true;$('#publish').disabled=true;$('#discard').disabled=true;input.disabled=true;
  const headers={'X-Admin-Password':password};
  async function send(url,options){const r=await fetch(url,options);const body=await r.json().catch(()=>({error:'Upload failed. Please retry.'}));if(!r.ok)throw Error(body.error||'Upload failed.');return body}
  $('#status').textContent='Preparing upload…';
  const created=await send('/.netlify/functions/media',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({size:file.size,type:file.type})});
  for(let offset=0,part=0;offset<file.size;offset+=created.chunkSize,part++){
   await send('/.netlify/functions/media?id='+created.id+'&part='+part,{method:'PUT',headers:{...headers,'Content-Type':'application/octet-stream'},body:file.slice(offset,offset+created.chunkSize)});
   $('#status').textContent='Uploading video · '+Math.min(100,Math.round((offset+created.chunkSize)/file.size*100))+'%';
  }
  await send('/.netlify/functions/media?id='+created.id,{method:'POST',headers});
  item.mediaId=created.id;item.filename=file.name.slice(0,300);saveDraft();
  $('#status').textContent='Video uploaded to your draft. Publish changes to show it to customers.';
 }catch(error){$('#status').textContent=error.message}finally{uploadInProgress=false;$('#publish').disabled=publishWasDisabled;$('#discard').disabled=false;editors()}
});
$('#photo').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>1024*1024||!['image/jpeg','image/png','image/webp'].includes(f.type)){ $('#status').textContent='Choose a JPEG, PNG, or WebP under 1 MB.';return}const reader=new FileReader();reader.onload=()=>{draft.photos.push({url:reader.result,caption:'Add a description of this hairstyle'});saveDraft();editors()};reader.readAsDataURL(f);e.target.value=''};
function validate(d){if(d.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))throw Error('Enter a valid contact email.');for(const x of [...d.classes,...d.videos]){if(!x.title.trim())throw Error('Every class and video needs a title.');if(x.price!==''&&(!Number.isFinite(x.price)||x.price<0))throw Error('Prices must be zero or greater.')}for(const x of d.videos)if(x.url&&!safeUrl(x.url))throw Error('Video samples need a valid HTTPS URL.');}
$('#publish').onclick=async()=>{if(uploadInProgress)return;const button=$('#publish');button.disabled=true;try{validate(draft);if(remote){const r=await fetch('/.netlify/functions/content',{method:'PUT',headers:{'Content-Type':'application/json','X-Admin-Password':$('#password').value},body:JSON.stringify(draft)});if(!r.ok){const body=await r.json();throw Error(body.error||'Publish failed.')} }else localStorage.setItem('bess-published-v1',JSON.stringify(draft));live=clone(draft);render();$('#status').textContent=remote?'Published. Customers now see this content.':'Published to this browser’s demo only.'}catch(e){$('#status').textContent=e.message}finally{button.disabled=false}};
$('#discard').onclick=()=>{if(uploadInProgress)return;draft=clone(live);saveDraft();editors();$('#status').textContent='Draft restored from published content.'};
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify(draft,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='bess-beauty-content.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
function route(){const admin=location.hash==='#admin';$('#admin').hidden=!admin;$('#customer').hidden=admin;if(admin)editors()}
async function init(){try{const r=await fetch('/.netlify/functions/content',{cache:'no-store'});if(r.ok&&r.headers.get('content-type')?.includes('application/json')){const data=await r.json();live=data.content||clone(initial);remote=true}else if(r.status!==404||!['localhost','127.0.0.1'].includes(location.hostname))throw Error('Content service unavailable')}catch(e){if(location.hostname!=='localhost'&&location.hostname!=='127.0.0.1'){ $('#mode').textContent='Shared content is unavailable. Publishing is disabled; refresh to retry.';$('#publish').disabled=true;draft=clone(initial);render();route();return}}
 if(!remote){try{live=JSON.parse(localStorage.getItem('bess-published-v1'))||clone(initial)}catch{live=clone(initial)}}
 try{draft=JSON.parse(localStorage.getItem('bess-draft-v1'))||clone(live)}catch{draft=clone(live)}
 $('#mode').textContent=remote?'Shared demo: edit a draft, then publish with the admin password. Only published content appears on the customer website.':'Local demo: edits and publishing are saved in this browser only. Netlify enables shared updates and password-protected publishing.';$('#password-label').hidden=!remote;render();route();}
window.addEventListener('hashchange',route);init();
