import { env } from 'cloudflare:workers';
import { access,canWrite } from '../../server/access';
import { writeRecord } from '../../server/records';
import { json,sameOrigin,failure } from '../../server/http';
import type { Entry } from '../../data';
export const dynamic='force-dynamic';
const maxBytes=25*1024*1024;
function fileType(b:Uint8Array){const ascii=(a:number,z:number)=>new TextDecoder().decode(b.slice(a,z));if(b[0]===0x89&&ascii(1,4)==='PNG')return 'image/png';if(b[0]===255&&b[1]===216&&b[2]===255)return 'image/jpeg';if(ascii(0,3)==='GIF')return 'image/gif';if(ascii(0,4)==='RIFF'&&ascii(8,12)==='WEBP')return 'image/webp';if(ascii(4,8)==='ftyp')return 'video/mp4';if(b[0]===0x1a&&b[1]===0x45&&b[2]===0xdf&&b[3]===0xa3)return 'video/webm';if(ascii(0,5)==='%PDF-')return 'application/pdf';if(ascii(0,4)==='wOF2')return 'font/woff2';return '';}
export async function POST(req:Request){let key='';try{
 const a=await access();if(!a)return json({error:'Sign in to upload.'},401);if(!sameOrigin(req))return json({error:'Request origin not allowed.'},403);
 if(!canWrite(a,{id:'new',title:'Upload',version:0,section:'asset',status:'In progress'}))return json({error:'You do not have permission to upload assets.'},403);
 if(!env.BUCKET)return json({error:'Upload storage is not available yet.'},503);
 if(Number(req.headers.get('content-length'))>maxBytes)return json({error:'Keep each upload under 25 MB. Use a video or Drive link for larger files.'},413);
 const reader=req.body?.getReader();if(!reader)return json({error:'Choose a file first.'},400);let size=0;const parts:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>maxBytes){await reader.cancel();return json({error:'Keep each upload under 25 MB. Larger videos can be added by link.'},413)}parts.push(value)}
 if(!size)return json({error:'This file is empty.'},400);const bytes=new Uint8Array(size);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length}
 const mime=fileType(bytes);if(!mime)return json({error:'Use JPG, PNG, GIF, WebP, MP4, WebM, PDF or WOFF2 files.'},415);
 const id=crypto.randomUUID();key='assets/'+id;
 let name='Uploaded asset';try{name=decodeURIComponent(req.headers.get('x-file-name')||name).replace(/[\r\n]/g,' ').slice(0,180)}catch{return json({error:'The filename is not valid.'},400)}
 await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:mime}});
 const record:Entry={id,section:'asset',title:name,status:'In progress',version:0,storageKey:key,fileName:name,mimeType:mime,fileSize:size,assetUrl:'/api/uploads/'+id,format:mime.startsWith('image/')?'Image':mime.startsWith('video/')?'Video':mime==='font/woff2'?'Font':'PDF',owner:a.name,visibility:'agency',provenance:'Uploaded to workspace'};
 return json({record:await writeRecord(a,record,undefined,'Uploaded')});
 }catch(e){if(key&&env.BUCKET)await env.BUCKET.delete(key).catch(()=>{});return failure(e)}}
