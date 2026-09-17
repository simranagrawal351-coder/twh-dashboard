import type { Entry } from './data';

export const areas = ['Brand & Business','Research','Strategy','Launch','Content Calendar','Production','Assets','Team & Vendors','Scope & Budget','Decisions','Files','Reporting'];
export const completeStatuses = ['Approved','Done','Published','Delivered','Brief confirmed','Reference','Archived'];
export const areaFor = (r:Entry):string => String(r.area || ({brand:'Brand & Business',research:'Research',strategy:'Strategy',launch:'Launch',content:'Content Calendar',production:'Production',asset:'Assets',team:'Team & Vendors',vendor:'Team & Vendors',service:'Scope & Budget',budget:'Scope & Budget',decision:'Decisions',file:'Files',report:'Reporting'} as Record<string,string>)[r.section] || 'Launch');
export const attentionKind = (r:Entry):string => r.status==='Blocked'?'Blockers':r.section==='decision'||r.kind==='Decision'||['Internal review','Client review','Changes requested','Awaiting approval'].includes(r.status)?'Decisions':r.kind==='Input'||r.status==='Awaiting input'?'Inputs':'Actions';
export function attentionRecords(records:Entry[]){
 const visible=records.filter(r=>r.section!=='private'&&r.status!=='Archived');
 // A requirement can link to its decision without counting the same work twice.
 const linkedTasks=new Set(visible.filter(r=>r.section==='decision'&&r.relatedTask).map(r=>r.relatedTask));
 return visible.filter(r=>!completeStatuses.includes(r.status)&&!linkedTasks.has(r.id)&&(r.section==='task'||r.section==='decision'||r.status==='Blocked'||['Internal review','Client review','Changes requested','Awaiting approval'].includes(r.status))).sort((a,b)=>Number(b.status==='Blocked')-Number(a.status==='Blocked')||String(a.deadline||a.date||'9999').localeCompare(String(b.deadline||b.date||'9999')));
}
export function enrichRecord(r:Entry):Entry {
 const defaults:Record<string,Record<string,string>>={
  'task-skus':{area:'Production',kind:'Input'},'task-dates':{area:'Launch',kind:'Input'},'task-assets':{area:'Assets',kind:'Input'},
  'task-scope':{area:'Scope & Budget',kind:'Decision'},'task-shooter':{area:'Production',kind:'Action'},'task-calendar':{area:'Content Calendar',kind:'Decision'},
  'decision-priority':{area:'Strategy'},'decision-calendar':{area:'Content Calendar',relatedTask:'task-calendar'},'decision-commercial':{area:'Scope & Budget',relatedTask:'task-scope'},
 };
 return {...defaults[r.id],...r};
}
