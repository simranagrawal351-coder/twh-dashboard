import { access,canRead } from '../../server/access';
import { recordsFor } from '../../server/records';
import { recordsDb } from '../../../db/records';
import { json,failure } from '../../server/http';
import type { Entry } from '../../data';
export const dynamic='force-dynamic';
export async function GET(req:Request){try{
 const a=await access();if(!a)return json({error:'Sign in first.'},401);const id=new URL(req.url).searchParams.get('record');
 const rows=await (id?recordsDb().prepare('SELECT * FROM activity WHERE record_id=? ORDER BY at DESC LIMIT 60').bind(id):recordsDb().prepare('SELECT * FROM activity ORDER BY at DESC LIMIT 100')).all<Record<string,string>>();
 const visible=new Map((await recordsFor(a)).map(r=>[r.id,r]));
 const activity=[];for(const row of rows.results){const original=JSON.parse(row.after_json) as Entry;const current=visible.get(row.record_id);if(!current||(current.section==='private'||current.section==='comment'&&visible.get(String(current.related))?.section==='private')&&!id||a.role==='client'&&original.visibility!=='client')continue;const before=row.before_json?JSON.parse(row.before_json):{};const changes=Object.keys(original).filter(k=>!['version','updatedAt','createdAt'].includes(k)&&before[k]!==original[k]);activity.push({id:row.id,recordId:row.record_id,title:original.title,section:row.section,action:row.action,actor:row.actor,at:row.at,fields:a.role==='client'?changes.filter(k=>!['budget','actual','reference','internalNotes','privateOwner'].includes(k)):changes});}
 return json({activity});
 }catch(e){return failure(e)}}
