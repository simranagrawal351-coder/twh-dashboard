import { shiftDate } from './calendar.ts';
import type { AccountEvent } from './calendar.ts';
export type SyncMode='workspace'|'google'|'two-way';
export function reconcileDate(workspace:string,external:string,baseline:string|null,mode:SyncMode){
 if(workspace===external)return 'equal';
 if(!baseline)return 'conflict';
 const w=workspace!==baseline,g=external!==baseline;
 if(w&&g)return 'conflict';
 if(mode==='workspace')return g?'conflict':'push';
 if(mode==='google')return w?'conflict':'pull';
 return g?'pull':'push';
}
export function googlePayload(event:AccountEvent,origin:string){
 const r=event.record;const context=[['Campaign',r.campaignName],['Objective',r.objective],['Brief',r.notes],['Location',r.location],['Owner',r.owner],['Talent',r.talent],['Photographer',r.photographer],['Videographer',r.videographer],['Stylist',r.stylist],['Producer',r.producer],['Deliverables',r.deliverables],['Call sheet',r.callSheetUrl],['Files',r.url],['Contact',r.contact]].filter(([,v])=>v).map(([k,v])=>k+': '+v).join('\n');
 return {summary:event.title+(event.field==='date'?'':' — '+event.label),description:context+'\n\nWorkspace: '+origin+'/?record='+encodeURIComponent(event.recordId),location:String(r.location||''),start:event.time?{dateTime:event.date+'T'+event.time+':00+05:30',timeZone:'Asia/Kolkata'}:{date:event.date},end:event.time?{dateTime:new Date(new Date(event.date+'T'+event.time+':00+05:30').valueOf()+3600000).toISOString(),timeZone:'Asia/Kolkata'}:{date:shiftDate(event.date,1)},extendedProperties:{private:{workspaceId:event.recordId,dateField:event.field}}};
}
