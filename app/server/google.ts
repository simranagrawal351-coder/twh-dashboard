import { env } from 'cloudflare:workers';
import { recordsDb } from '../../db/records';
import { getSetting,putSetting,accountDefault } from './settings';
import { getRecord,writeRecord,allRecords } from './records';
import { eventsFor,validDate } from '../calendar';
import { googlePayload,reconcileDate,type SyncMode } from '../calendar-sync';
import type { Entry } from '../data';
import type { Access } from './access';
const secrets=()=>env as unknown as Record<string,string>;
export const configured=()=>!!(secrets().GOOGLE_CLIENT_ID&&secrets().GOOGLE_CLIENT_SECRET&&secrets().INTEGRATION_SECRET?.length>=32);
const b64=(b:Uint8Array)=>btoa(String.fromCharCode(...b));
const unb64=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function key(){return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',new TextEncoder().encode(secrets().INTEGRATION_SECRET)),{name:'AES-GCM'},false,['encrypt','decrypt']);}
export async function seal(value:unknown){const iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(),new TextEncoder().encode(JSON.stringify(value)));return b64(iv)+'.'+b64(new Uint8Array(cipher));}
async function unseal<T>(s:string):Promise<T>{const [iv,data]=s.split('.');return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(iv)},await key(),unb64(data))));}
type Tokens={access_token:string;refresh_token:string;expires_at:number;email:string};
export async function connection(){return configured()&&!!await getSetting('google-tokens','');}
export async function storeTokens(tokens:Tokens){await putSetting('google-tokens',await seal(tokens));}
export async function token(){const encrypted=await getSetting('google-tokens','');if(!configured()||!encrypted)throw new Error('Calendar connection required');const t=await unseal<Tokens>(encrypted);if(t.expires_at>Date.now()+60000)return t.access_token;const res=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:secrets().GOOGLE_CLIENT_ID,client_secret:secrets().GOOGLE_CLIENT_SECRET,refresh_token:t.refresh_token,grant_type:'refresh_token'})});if(!res.ok)throw new Error('Reconnect Google Calendar');const d=await res.json() as {access_token:string;expires_in:number};await storeTokens({...t,access_token:d.access_token,expires_at:Date.now()+d.expires_in*1000});return d.access_token;}
export async function googleFetch(path:string,init:RequestInit={}){return fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events'+path,{...init,headers:{Authorization:'Bearer '+await token(),'Content-Type':'application/json',...init.headers}});}
export type CalendarLink={id:string;record_id:string;date_field:string;external_id:string|null;external_url:string|null;mode:SyncMode;synced_value:string|null;external_value:string|null;etag:string|null;status:string;error:string|null;synced_at:string|null};
async function linkFor(id:string){return recordsDb().prepare('SELECT * FROM calendar_links WHERE id=?').bind(id).first<CalendarLink>();}
async function saveLink(l:CalendarLink){await recordsDb().prepare('INSERT INTO calendar_links(id,record_id,date_field,external_id,external_url,mode,synced_value,external_value,etag,status,error,synced_at) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET external_id=excluded.external_id,external_url=excluded.external_url,mode=excluded.mode,synced_value=excluded.synced_value,external_value=excluded.external_value,etag=excluded.etag,status=excluded.status,error=excluded.error,synced_at=excluded.synced_at').bind(l.id,l.record_id,l.date_field,l.external_id,l.external_url,l.mode,l.synced_value,l.external_value,l.etag,l.status,l.error,l.synced_at).run();}
const stableId=async(s:string)=>'twh'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s)))).map(n=>n.toString(16).padStart(2,'0')).join('');
async function performSyncRecord(record:Entry,a:Access,origin:string,resolution?:{field:string;choice:'workspace'|'google'}){
 const relatedRecords=await allRecords();const campaign=relatedRecords.find(r=>r.id===record.campaign);record={...record,campaignName:campaign?.title||''};
 const settings=await getSetting('account',accountDefault);const connected=await connection();
 const existing=(await recordsDb().prepare('SELECT * FROM calendar_links WHERE record_id=?').bind(record.id).all<CalendarLink>()).results;
 const events=eventsFor([{...record,status:record.status==='Deleted'||record.status==='Archived'?'Cancelled':record.status}]);
 if(record.calendarSync!=='yes'&&!existing.length)return;
 const fields=String(record.calendarFields||'').split(',').filter(Boolean);
 for(const l of existing.filter(l=>fields.length&&!fields.includes(l.date_field))){l.status='Sync paused';await saveLink(l);}
 for(const event of events.filter(e=>!fields.length||fields.includes(e.field))){
  const old=await linkFor(event.id);const l:CalendarLink=old||{id:event.id,record_id:record.id,date_field:event.field,external_id:null,external_url:null,mode:settings.mode as SyncMode,synced_value:null,external_value:null,etag:null,status:'Not synced',error:null,synced_at:null};l.mode=(record.calendarMode||settings.mode) as SyncMode;
  if(record.calendarSync!=='yes'&&record.status!=='Deleted'){l.status='Sync paused';await saveLink(l);continue;}
  if(!connected){l.status='Calendar connection required';await saveLink(l);continue;}
  try{
   const current=await getRecord(record.id);if(!current||current.version!==record.version){l.status='Not synced';await saveLink(l);continue;}
   if(record.status==='Deleted'||record.status==='Archived'||record.status==='Cancelled'){
    const remove=record.status==='Cancelled'||(record.calendarDelete==='keep'?false:record.calendarDelete==='remove'||settings.deleteExternal);
    if(l.external_id&&remove){const res=await googleFetch('/'+l.external_id,{method:'DELETE',headers:l.etag?{'If-Match':l.etag}:{}});if(res.status===412)throw new Error('Calendar changed. Refresh before removing it.');if(!res.ok&&res.status!==404&&res.status!==410)throw new Error('Google could not remove this event');l.status='Removed from Google Calendar';}else l.status='Kept in Google Calendar';await saveLink(l);continue;
   }
   let id=l.external_id||await stableId(origin+'|'+event.id);const read=await googleFetch('/'+id);let remote=read.ok?await read.json() as {id:string;htmlLink:string;etag:string;status:string;start:{date?:string;dateTime?:string}}:null;
   if(!read.ok&&read.status!==404&&read.status!==410)throw new Error('Google Calendar could not be read');
   if(remote?.status==='cancelled'||(!remote&&l.external_id&&l.synced_value)){
    if(resolution?.field===event.field&&resolution.choice==='google'){record=await writeRecord(a,{...record,...(event.field==='date'?{status:'Cancelled'}:{[event.field]:''})},record,'Cancelled from Google Calendar');l.status='Removed from Google Calendar';l.external_value='Removed';await saveLink(l);continue;}
    if(resolution?.field===event.field&&resolution.choice==='workspace'){id='twh'+crypto.randomUUID().replace(/-/g,'');remote=null;l.external_id=id;l.synced_value=null;l.status='Not synced';await saveLink(l);}else{l.status='Conflict';l.error='The connected Google event was removed. Resolve before recreating.';l.external_value='Removed';await saveLink(l);continue;}
   }
   if(remote){const external=remote.start.date||(remote.start.dateTime?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(remote.start.dateTime)):'');const externalTime=remote.start.dateTime?new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(remote.start.dateTime)):'';const externalStamp=external+(externalTime?'T'+externalTime:'');const workspaceStamp=event.date+(event.time?'T'+event.time:'');l.external_value=externalStamp;l.etag=remote.etag;
    const action=resolution?.field===event.field?resolution.choice==='google'?'pull':'push':reconcileDate(workspaceStamp,externalStamp,l.synced_value,l.mode);
    if(action==='conflict'){l.status='Conflict';l.error='This date changed in two places, or outside its configured source of truth.';await saveLink(l);continue;}
    if(action==='pull'){if(!validDate(external))throw new Error('Google date cannot be read');record=await writeRecord(a,{...record,[event.field]:external,...(event.field==='date'?{time:externalTime}:{})},record,'Date updated from Google Calendar');l.synced_value=externalStamp;l.status='Synced to Google Calendar';l.error=null;l.synced_at=new Date().toISOString();await saveLink(l);continue;}
   }
   const payload=googlePayload(event,origin);const res=await googleFetch(remote?'/'+id:'',{method:remote?'PATCH':'POST',headers:remote?{'If-Match':remote.etag}:{},body:JSON.stringify(remote?payload:{...payload,id})});
   if(res.status===409||res.status===412){l.status='Conflict';l.error='Google Calendar changed during sync. Refresh and resolve.';await saveLink(l);continue;}if(!res.ok)throw new Error('Google Calendar update failed ('+res.status+')');
   const saved=await res.json() as {id:string;htmlLink:string;etag:string};Object.assign(l,{external_id:saved.id,external_url:saved.htmlLink,etag:saved.etag,synced_value:event.date+(event.time?'T'+event.time:''),external_value:event.date+(event.time?'T'+event.time:''),status:'Synced to Google Calendar',error:null,synced_at:new Date().toISOString()});await saveLink(l);
  }catch(e){l.status='Sync issue';l.error=(e as Error).message;await saveLink(l);}
 }
 // A cleared date is retained externally until a deliberate removal is selected.
 for(const l of existing.filter(l=>!events.some(e=>e.id===l.id))){l.status='Date removed in workspace';l.error='The Google event is retained. Restore a date to reconnect it.';await saveLink(l);}
}

export async function syncRecord(record:Entry,a:Access,origin:string,resolution?:{field:string;choice:'workspace'|'google'}){
 if(record.calendarSync!=='yes'&&!await recordsDb().prepare('SELECT id FROM calendar_links WHERE record_id=? LIMIT 1').bind(record.id).first())return;
 const id='sync-lock:'+record.id,token=crypto.randomUUID(),now=new Date().toISOString();
 const lock=await recordsDb().prepare('INSERT INTO settings(id,value,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at WHERE settings.updated_at<?').bind(id,JSON.stringify(token),now,new Date(Date.now()-120000).toISOString()).run();if(!lock.meta.changes)return;
 try{await performSyncRecord(record,a,origin,resolution);const latest=await getRecord(record.id);if(latest&&latest.version!==record.version)await performSyncRecord(latest,a,origin);}finally{await recordsDb().prepare('DELETE FROM settings WHERE id=? AND value=?').bind(id,JSON.stringify(token)).run();}
}
