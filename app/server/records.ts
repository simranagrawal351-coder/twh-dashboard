import { recordsDb } from '../../db/records';
import { seed } from './seed';
import { enrichRecord } from '../workflow';
import { visibleRecord,canRead,type Access } from './access';
import type { Entry } from '../data';
export async function allRecords(){
 const rows=await recordsDb().prepare('SELECT id,payload,version,updated_at,updated_by FROM records').all<{id:string;payload:string;version:number;updated_at:string;updated_by:string}>();
 const merged=new Map(seed.map(r=>[r.id,{...r}]));for(const r of rows.results){const payload=JSON.parse(r.payload);merged.set(r.id,{...payload,version:r.version,updatedAt:r.updated_at,...(payload.section==='private'?{privateOwner:r.updated_by}:{})});}
 return [...merged.values()].map(enrichRecord);
}
export async function recordsFor(a:Access){const records=await allRecords();return records.map(r=>{if(r.section==='comment'){const parent=records.find(p=>p.id===r.related);return parent&&canRead(a,parent)&&(a.role!=='client'||r.visibility==='client')?r:null;}return visibleRecord(a,r);}).filter((r):r is Entry=>!!r&&(a.role!=='client'||!['Archived','Deleted'].includes(r.status)));}
export async function getRecord(id:string){const row=await recordsDb().prepare('SELECT payload,version,updated_at,updated_by FROM records WHERE id=?').bind(id).first<{payload:string;version:number;updated_at:string;updated_by:string}>();if(!row)return seed.find(r=>r.id===id);const r=JSON.parse(row.payload);return enrichRecord({...r,version:row.version,updatedAt:row.updated_at,...(r.section==='private'?{privateOwner:row.updated_by}:{})}) as Entry;}
export async function writeRecord(a:Access,entry:Entry,original?:Entry,action?:string){
 const db=recordsDb(),at=new Date().toISOString(),version=entry.version+1;
 const record={...entry,version,createdAt:original?.createdAt||at,updatedAt:at,...(entry.section==='private'?{privateOwner:a.userId}:{})};
 const payload=JSON.stringify(record),operation=action||(entry.status==='Deleted'?'Removed':original?.status==='Deleted'?'Restored':entry.status==='Archived'?'Archived':original?.status==='Archived'?'Restored':original?'Updated':'Added');
 const mutation=entry.version===0?db.prepare('INSERT OR IGNORE INTO records(id,payload,version,updated_at,updated_by) VALUES(?,?,?,?,?)').bind(entry.id,payload,version,at,a.userId):db.prepare('UPDATE records SET payload=?,version=?,updated_at=?,updated_by=? WHERE id=? AND version=?').bind(payload,version,at,a.userId,entry.id,entry.version);
 const audit=db.prepare('INSERT INTO activity(id,record_id,section,action,actor,actor_id,before_json,after_json,at) SELECT ?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=? AND version=? AND updated_at=?)').bind(crypto.randomUUID(),entry.id,entry.section,operation,a.name,a.userId,original?JSON.stringify(original):null,payload,at,entry.id,version,at);
 const results=await db.batch([mutation,audit]);if(results[0].meta.changes!==1)throw new Error('CONFLICT');return record;
}
