import { getStore } from '@netlify/blobs';
import { timingSafeEqual, createHash } from 'node:crypto';
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
const validText=(x,max)=>typeof x==='string'&&x.length<=max;
function validate(d){
 if(!d||!validText(d.promo,500)||!validText(d.email,200))return false;
 if(d.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email))return false;
 for(const key of ['classes','videos']){
  if(!Array.isArray(d[key])||d[key].length>50)return false;
  for(const x of d[key]){
   if(!validText(x.title,150)||!x.title.trim()||!validText(x.description,3000)||typeof x.visible!=='boolean'||!(x.price===''||(typeof x.price==='number'&&Number.isFinite(x.price)&&x.price>=0)))return false;
   if(key==='classes'&&!validText(x.duration,300))return false;
   if(key==='videos'){if(!validText(x.url,2000))return false;if(x.url){try{if(new URL(x.url).protocol!=='https:')return false}catch{return false}}}
  }
 }
 return Array.isArray(d.photos)&&d.photos.length<=20&&d.photos.every(x=>validText(x.caption,300)&&validText(x.url,1500000)&&/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(x.url));
}
export default async request=>{
 try{
  const store=getStore({name:'bess-beauty-demo',consistency:'strong'});
  if(request.method==='GET')return json({content:await store.get('published',{type:'json'})});
  if(request.method!=='PUT')return json({error:'Method not allowed'},405);
  const secret=process.env.ADMIN_PASSWORD;
  if(!secret||secret.length<16)return json({error:'Configure ADMIN_PASSWORD with at least 16 characters in this Netlify site’s environment settings.'},503);
  const supplied=request.headers.get('X-Admin-Password')||'';
  const digest=x=>createHash('sha256').update(x).digest();
  if(!timingSafeEqual(digest(secret),digest(supplied)))return json({error:'Incorrect admin password.'},401);
  const raw=await request.text();
  if(Buffer.byteLength(raw)>4000000)return json({error:'Content is too large. Remove or resize gallery photos; limit 4 MB total.'},413);
  let content;try{content=JSON.parse(raw)}catch{return json({error:'Invalid JSON.'},400)}
  if(!validate(content))return json({error:'Check content fields, prices, photo sizes, and HTTPS video URLs.'},400);
  await store.setJSON('published',content);
  return json({ok:true});
 }catch{return json({error:'Content storage is unavailable. Try again later.'},503)}
};
