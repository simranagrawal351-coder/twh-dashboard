import { env } from 'cloudflare:workers';
import { access,canRead } from '../../../server/access';
import { getRecord,recordsFor } from '../../../server/records';
import { json,failure } from '../../../server/http';
export const dynamic='force-dynamic';
export async function GET(req:Request,{params}:{params:Promise<{id:string}>}){try{
 const a=await access();if(!a)return json({error:'Sign in to view this file.'},401);const {id}=await params;const record=await getRecord(id);
 const shared=record&&!canRead(a,record)&&(await recordsFor(a)).some(r=>!['Deleted','Archived'].includes(r.status)&&['assetUrl','logoUrl','headingFontUrl','bodyFontUrl','url'].some(k=>r[k]===record.assetUrl));
 if(!record||record.section!=='asset'||record.status==='Deleted'||!record.storageKey||(!canRead(a,record)&&!shared))return json({error:'File not found.'},404);
 if(!env.BUCKET)return json({error:'File storage is unavailable.'},503);const key=String(record.storageKey),head=await env.BUCKET.head(key);if(!head)return json({error:'File not found.'},404);
 let offset=0,length=head.size,status=200;const range=req.headers.get('range');
 if(range){const match=/^bytes=(\d*)-(\d*)$/.exec(range);if(!match||(!match[1]&&!match[2]))return new Response(null,{status:416,headers:{'Content-Range':`bytes */${head.size}`}});
  if(!match[1]){length=Math.min(Number(match[2]),head.size);offset=head.size-length}else{offset=Number(match[1]);const end=match[2]?Math.min(Number(match[2]),head.size-1):head.size-1;length=end-offset+1}
  if(offset<0||offset>=head.size||length<=0)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${head.size}`}});status=206;
 }
 const object=await env.BUCKET.get(key,range?{range:{offset,length}}:{});if(!object)return json({error:'File not found.'},404);
 const headers=new Headers({'Content-Type':String(record.mimeType),'Content-Length':String(length),'Accept-Ranges':'bytes','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':`inline; filename*=UTF-8''${encodeURIComponent(String(record.fileName||record.title))}`});
 if(status===206)headers.set('Content-Range',`bytes ${offset}-${offset+length-1}/${head.size}`);
 return new Response(object.body,{status,headers});
 }catch(e){return failure(e)}}
