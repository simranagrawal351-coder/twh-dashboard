import { getChatGPTUser } from '../../chatgpt-auth';
import { recordsDb } from '../../../db/records';
import { seed, sections, statuses } from '../../data';
import { enrichRecord, areas } from '../../workflow';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function GET(){
 const user=await getChatGPTUser();if(!user)return json({error:'Please sign in to use this private workspace.'},401);
 try {const result=await recordsDb().prepare("SELECT id,payload,version,updated_at FROM records WHERE json_extract(payload,'$.section') != 'private' OR updated_by = ?").bind(user.userId).all<{id:string;payload:string;version:number;updated_at:string}>();
 const merged=new Map(seed.map(r=>[r.id,r]));for(const r of result.results)merged.set(r.id,{...JSON.parse(r.payload),version:r.version,updatedAt:r.updated_at});return json({records:[...merged.values()].map(enrichRecord)});
 }catch(e){console.error('TWH records load failed',e);return json({error:'Saved records are unavailable. Your brief is shown below; retry before making changes.'},503);}
}
export async function PUT(req:Request){
 const user=await getChatGPTUser();if(!user)return json({error:'Please sign in before saving.'},401);
 const origin=req.headers.get('origin');if(origin&&origin!==new URL(req.url).origin)return json({error:'Request origin not allowed.'},403);
 try{const raw=await req.text();if(raw.length>75000)return json({error:'This record is too large.'},413);const entry=JSON.parse(raw);
 if(!entry||typeof entry!=='object'||!sections.includes(entry.section)||!statuses.includes(entry.status)||typeof entry.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(entry.id)||typeof entry.title!=='string'||!entry.title.trim()||entry.title.length>200||!Number.isInteger(entry.version)||entry.version<0)return json({error:'Please check the title and record fields.'},400);
 if(Object.values(entry).some(v=>!['string','number'].includes(typeof v))||Object.keys(entry).length>60)return json({error:'Invalid record fields.'},400);
 if(entry.area&&!areas.includes(entry.area))return json({error:'Choose an existing workstream.'},400);
 if(entry.kind&&!['Input','Action','Decision'].includes(entry.kind))return json({error:'Choose an input, action or decision.'},400);
 for(const key of ['url','referenceUrl','assetUrl','liveUrl'])if(entry[key]){try{const url=new URL(entry[key]);if(!['https:','http:'].includes(url.protocol))throw 0;}catch{return json({error:'Links must start with https:// or http://.'},400);}}
 for(const key of ['fee','budget','design','subscriptions','people','overhead','contingency','actual','spend','reach','engagements','enquiries','sales'])if(entry[key]!==undefined&&entry[key]!==''&&(!Number.isFinite(Number(entry[key]))||Number(entry[key])<0))return json({error:'Amounts and metrics must be zero or greater.'},400);
 for(const key of ['date','deadline'])if(entry[key]){const value=String(entry[key]);const date=new Date(value+'T12:00:00Z');if(!/^\d{4}-\d{2}-\d{2}$/.test(value)||Number.isNaN(date.valueOf())||date.toISOString().slice(0,10)!==value)return json({error:'Enter a valid calendar date.'},400);}
 if(entry.status==='Scheduled'&&entry.section==='content'&&!entry.date)return json({error:'Add a publishing date before scheduling.'},400);
 if(entry.status==='Published'&&entry.section==='content'&&!entry.liveUrl)return json({error:'Add the live post link before marking published.'},400);
 const timestamp=new Date().toISOString();const previous=entry.version;const updated={...entry,title:entry.title.trim(),version:previous+1,updatedAt:timestamp};const db=recordsDb();
 const existing=await db.prepare('SELECT payload,updated_by FROM records WHERE id = ?').bind(entry.id).first<{payload:string;updated_by:string}>();const original=existing?JSON.parse(existing.payload):seed.find(r=>r.id===entry.id);
 if(original?.section==='private'&&existing?.updated_by!==user.userId)return json({error:'Record not found.'},404);
 if(original&&original.section!==entry.section)return json({error:'Record type cannot be changed.'},400);
 const result=previous===0?await db.prepare('INSERT OR IGNORE INTO records(id,payload,version,updated_at,updated_by) VALUES(?,?,?,?,?)').bind(entry.id,JSON.stringify(updated),1,timestamp,user.userId).run():await db.prepare('UPDATE records SET payload=?,version=?,updated_at=?,updated_by=? WHERE id=? AND version=?').bind(JSON.stringify(updated),previous+1,timestamp,user.userId,entry.id,previous).run();
 if(result.meta.changes!==1)return json({error:'This record changed in another window. Close this panel, refresh the workspace, then apply your changes again.'},409);
 return json({record:updated});
 }catch(e){console.error('TWH record save failed',e);return json({error:'Could not save. Your edits are still here; please try again.'},503);}
}
