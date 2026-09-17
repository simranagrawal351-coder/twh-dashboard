import type { Entry } from './data';
export const clientSections=['script','meeting','brand','brandkit','research','strategy','campaign','launch','content','production','asset','service','decision','file','report','team','event'];
export type Access={userId:string;email:string;name:string;role:'admin'|'agency'|'client';areas:string[]};
export function canRead(a:Access,r:Entry){
 if(a.role==='admin')return r.section!=='private'||!r.privateOwner||r.privateOwner===a.userId;
 if(!a.areas.includes('*')&&!a.areas.includes(r.section))return false;
 if(a.role==='client'&&!clientSections.includes(r.section))return false;
 if(r.section==='private')return r.privateOwner===a.userId;
 if(a.role==='agency')return true;
 return clientSections.includes(r.section)&&r.visibility==='client';
}
export function canWrite(a:Access,r:Entry){if(a.role==='agency'&&r.section==='private'&&r.version===0&&!r.privateOwner)return a.areas.includes('private')||a.areas.includes('*');return a.role!=='client'&&canRead(a,r)}
export function visibleRecord(a:Access,r:Entry):Entry|null{
 if(!canRead(a,r))return null;
 if(a.role!=='client')return r;
 const copy={...r};for(const key of ['budget','actual','cost','vendorCost','margin','people','overhead','contingency','subscriptions','design','capacity','privateOwner','internalNotes','reference','storageKey','calendarDelete'])delete copy[key];
 if(r.section==='vendor')delete copy.fee;
 return copy;
}
