import type { Entry } from './data';
export type AccountEvent={id:string;recordId:string;field:string;date:string;label:string;title:string;section:string;owner:string;campaign:string;status:string;platform:string;format:string;time:string;record:Entry};
export const dateLabels:Record<string,string>={shootDate:'Shoot',publishDate:'Publish',date:'Date',deadline:'Deadline',prepDate:'Preparation',editDate:'Editing',reviewDate:'Review',approvalDate:'Approval',revisionDate:'Revision',deliveryDate:'Delivery',startDate:'Start',renewalDate:'Renewal',callSheetDate:'Call sheet',bookingDate:'Booking'};
export const validDate=(s:unknown)=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(new Date(s+'T12:00:00Z').valueOf())&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export function shiftDate(s:string,days:number){const d=new Date(s+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10)}
export function dateDifference(a:string,b:string){return Math.round((new Date(a+'T12:00:00Z').valueOf()-new Date(b+'T12:00:00Z').valueOf())/86400000)}
export function eventsFor(records:Entry[]):AccountEvent[]{
 const sections=['script','meeting','content','production','campaign','launch','strategy','task','decision','event','service'];
 return records.filter(r=>!['Archived','Deleted'].includes(r.status)&&(sections.includes(r.section)||r.calendarInclude==='yes')).flatMap(r=>Object.entries(dateLabels).filter(([key])=>validDate(r[key])).map(([field,baseLabel])=>{
  const label=field==='date'?(r.section==='content'?'Publish':r.section==='production'?String(r.eventType||'Shoot'):r.section==='campaign'?'Launch':r.section==='event'?String(r.eventType||'Event'):baseLabel):baseLabel;
  return {id:r.id+'--'+field,recordId:r.id,field,date:String(r[field]),label,title:r.title,section:r.section,owner:String(r.owner||''),campaign:String(r.campaign||''),status:r.status,platform:String(r.channel||''),format:String(r.format||''),time:field==='date'?String(r.time||''):'',record:r};
 })).sort((a,b)=>a.date.localeCompare(b.date)||a.time.localeCompare(b.time)||a.title.localeCompare(b.title));
}
export function affectedEvents(event:AccountEvent,newDate:string,records:Entry[]){
 const days=dateDifference(newDate,event.date);if(!days)return [];
 return eventsFor(records).filter(e=>e.id!==event.id&&e.date>=event.date&&(e.record.dependsOn===event.recordId||e.record.production===event.recordId||(e.recordId===event.recordId&&e.field!==event.field))).map(e=>({...e,proposedDate:shiftDate(e.date,days)}));
}
export function calendarWarnings(records:Entry[]){
 const active=records.filter(r=>!['Archived','Deleted','Cancelled'].includes(r.status));const result:{id:string;record:Entry;message:string}[]=[];
 for(const r of active){
  const source=active.find(s=>s.id===(r.production||r.dependsOn));
  const shoot=r.section==='production'?r:source;
  if(shoot&&validDate(shoot.date))for(const key of (r.id===shoot.id?['editDate','reviewDate','approvalDate','revisionDate','deliveryDate']:['date','editDate','reviewDate','approvalDate','revisionDate','deliveryDate']))if(validDate(r[key])&&String(r[key])<String(shoot.date))result.push({id:r.id+'--'+key,record:r,message:(key==='date'?'Publish':dateLabels[key])+' on '+r[key]+' comes before '+shoot.title+' on '+shoot.date+'.'});
  if(r.section==='content'&&validDate(r.date))for(const key of ['reviewDate','approvalDate'])if(validDate(r[key])&&String(r[key])>String(r.date))result.push({id:r.id+'--'+key,record:r,message:dateLabels[key]+' on '+r[key]+' falls after publishing on '+r.date+'.'});
 }
 return result;
}
