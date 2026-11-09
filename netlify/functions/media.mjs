import { getStore } from '@netlify/blobs';
import { timingSafeEqual, createHash, randomUUID } from 'node:crypto';
const CHUNK=3*1024*1024,MAX=15*1024*1024;
const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export default async request=>{
 try{
  const url=new URL(request.url),id=url.searchParams.get('id');
  const store=getStore({name:'bess-beauty-videos',consistency:'strong'});
  const validId=id&&/^[a-f0-9-]{36}$/.test(id);
  if(request.method==='GET'||request.method==='HEAD'){
   if(!validId)return json({error:'Video not found'},404);
   const published=await getStore({name:'bess-beauty-demo',consistency:'strong'}).get('published',{type:'json'});
   if(!published?.videos?.some(x=>x.visible&&x.mediaId===id))return json({error:'Video not published'},404);
   const meta=await store.get(`${id}/manifest`,{type:'json'});
   if(!meta?.ready)return json({error:'Video not found'},404);
   const headers={'Content-Type':meta.type,'Accept-Ranges':'bytes','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
   let start=0,end=meta.size-1,status=200;
   const range=request.headers.get('range');
   if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${meta.size}`}});
    if(!match[1]){const suffix=Number(match[2]);if(!suffix)return new Response(null,{status:416});start=Math.max(0,meta.size-suffix)}else{start=Number(match[1]);if(match[2])end=Math.min(Number(match[2]),end)}
    if(start>end||!Number.isSafeInteger(start)||!Number.isSafeInteger(end))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${meta.size}`}});
    status=206;headers['Content-Range']=`bytes ${start}-${end}/${meta.size}`;
   }
   headers['Content-Length']=String(end-start+1);
   if(request.method==='HEAD')return new Response(null,{status,headers});
   let index=Math.floor(start/CHUNK);const last=Math.floor(end/CHUNK);
   const stream=new ReadableStream({async pull(controller){try{const bytes=new Uint8Array(await store.get(`${id}/part/${index}`,{type:'arrayBuffer'}));const offset=index*CHUNK;controller.enqueue(bytes.subarray(Math.max(0,start-offset),Math.min(bytes.length,end-offset+1)));index++;if(index>last)controller.close()}catch(e){controller.error(e)}}});
   return new Response(stream,{status,headers});
  }
  if(!['POST','PUT'].includes(request.method))return json({error:'Method not allowed'},405);
  const password=process.env.ADMIN_PASSWORD;
  if(!password||password.length<16)return json({error:'Configure ADMIN_PASSWORD in Netlify before uploading.'},503);
  const hash=x=>createHash('sha256').update(x).digest();
  if(!timingSafeEqual(hash(password),hash(request.headers.get('X-Admin-Password')||'')))return json({error:'Incorrect admin password.'},401);
  if(request.method==='POST'&&!id){
   const data=await request.json();
   if(!Number.isInteger(data.size)||data.size<=0||data.size>MAX||!['video/mp4','video/webm'].includes(data.type))return json({error:'Choose an MP4 or WebM up to 15 MB.'},400);
   const uploadId=randomUUID();await store.setJSON(`${uploadId}/manifest`,{size:data.size,type:data.type,ready:false});return json({id:uploadId,chunkSize:CHUNK});
  }
  if(!validId)return json({error:'Invalid upload'},400);
  const meta=await store.get(`${id}/manifest`,{type:'json'});
  if(!meta||meta.ready)return json({error:'Upload is missing or already finalized.'},409);
  const count=Math.ceil(meta.size/CHUNK);
  if(request.method==='PUT'){
   const index=Number(url.searchParams.get('part'));
   if(!Number.isInteger(index)||index<0||index>=count)return json({error:'Invalid chunk'},400);
   const bytes=await request.arrayBuffer(),expected=Math.min(CHUNK,meta.size-index*CHUNK);
   if(bytes.byteLength!==expected)return json({error:'Incorrect chunk size'},400);
   // The first chunk must match the advertised container format.
   if(index===0){const b=new Uint8Array(bytes);const mp4=b.length>=12&&String.fromCharCode(...b.slice(4,8))==='ftyp';const webm=b.length>=4&&b[0]===0x1a&&b[1]===0x45&&b[2]===0xdf&&b[3]===0xa3;if(!(meta.type==='video/mp4'?mp4:webm))return json({error:'File does not match a supported MP4 or WebM container.'},400)}
   await store.set(`${id}/part/${index}`,bytes);return json({ok:true});
  }
  for(let i=0;i<count;i++)if(!await store.getMetadata(`${id}/part/${i}`))return json({error:'Upload is incomplete. Select the file to retry.'},400);
  await store.setJSON(`${id}/manifest`,{...meta,ready:true});return json({ok:true,id});
 }catch{return json({error:'Video service is unavailable. Please retry.'},503)}
};
