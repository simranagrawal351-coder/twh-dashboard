import { sections,statuses,type Entry } from '../../data';
import { areas } from '../../workflow';
import { access,canWrite,canRead } from '../../server/access';
import { recordsFor,getRecord,writeRecord } from '../../server/records';
import { json,sameOrigin,failure } from '../../server/http';
import { dateLabels,validDate } from '../../calendar';
import { safeMediaUrl } from '../../media';
import { syncRecord } from '../../server/google';
export const dynamic='force-dynamic';
export async function GET(){try{const a=await access();if(!a)return json({error:'Sign in to open this workspace.'},401);return json({records:await recordsFor(a),access:{role:a.role,name:a.name,email:a.email,areas:a.areas}})}catch(e){return failure(e)}}
export async function PUT(req:Request){
 try{
  const a=await access();if(!a)return json({error:'Sign in before saving.'},401);if(!sameOrigin(req))return json({error:'Request origin not allowed.'},403);
  const raw=await req.text();if(raw.length>75000)return json({error:'This record is too large.'},413);
  let entry:Entry;try{entry=JSON.parse(raw)}catch{return json({error:'The record is not valid.'},400)}
  if(!entry||typeof entry!=='object'||!sections.includes(entry.section as typeof sections[number])||!statuses.includes(entry.status)||typeof entry.id!=='string'||!/^[-a-zA-Z0-9_]{1,100}$/.test(entry.id)||typeof entry.title!=='string'||!entry.title.trim()||entry.title.length>200||!Number.isInteger(entry.version)||entry.version<0)return json({error:'Please check the record fields.'},400);
  if(Object.values(entry).some(v=>!['string','number'].includes(typeof v))||Object.keys(entry).length>100)return json({error:'Invalid record fields.'},400);
  const original=await getRecord(entry.id);
  if(entry.section==='comment')return json({error:'Use the feedback action to add comments.'},400);
  if(entry.calendarMode&&!['workspace','google','two-way'].includes(String(entry.calendarMode)))return json({error:'Choose an existing calendar source mode.'},400);
  if(entry.visibility&&!['agency','client'].includes(String(entry.visibility)))return json({error:'Choose agency or client visibility.'},400);
  if(!canWrite(a,original||entry))return json({error:'You do not have permission to change this item.'},403);
  for(const key of ['campaign','production','vendor','service','content','strategy','relatedTask','parent','previousVersion','dependsOn','supersedes','scriptRecord','asset','sourceRecord','related']){if(entry[key]&&entry[key]!==original?.[key]){const linked=await getRecord(String(entry[key]));if(!linked||['Archived','Deleted'].includes(linked.status)||!canRead(a,linked))return json({error:'Choose a linked record you can access.'},400);}}
  if(original&&original.section!==entry.section)return json({error:'Record type cannot be changed.'},400);
  for(const field of ['storageKey','mimeType','fileName','fileSize','privateOwner'])if(entry[field]!==undefined&&entry[field]!==original?.[field])return json({error:'Uploaded file and ownership details cannot be changed here.'},400);
  if(entry.area&&!areas.includes(String(entry.area)))return json({error:'Choose an existing workstream.'},400);
  if(entry.kind&&!['Input','Action','Decision'].includes(String(entry.kind)))return json({error:'Choose an input, action or decision.'},400);
  for(const key of ['url','referenceUrl','assetUrl','liveUrl','logoUrl','headingFontUrl','bodyFontUrl','callSheetUrl'])if(entry[key]&&!safeMediaUrl(entry[key]))return json({error:'Use a valid https:// link or an uploaded workspace file.'},400);
  for(const key of ['fee','budget','design','subscriptions','people','overhead','contingency','actual','spend','reach','engagements','enquiries','sales','quantity'])if(entry[key]!==undefined&&entry[key]!==''&&(!Number.isFinite(Number(entry[key]))||Number(entry[key])<0))return json({error:'Amounts and quantities must be zero or greater.'},400);
  for(const key of Object.keys(dateLabels))if(entry[key]&&!validDate(entry[key]))return json({error:'Enter a valid calendar date.'},400);
  if(entry.time&&!/^([01]\d|2[0-3]):[0-5]\d$/.test(String(entry.time)))return json({error:'Enter a valid time.'},400);
  if(entry.palette){try{const colors=JSON.parse(String(entry.palette));if(!Array.isArray(colors)||colors.length>20||colors.some(c=>typeof c.hex!=='string'||!/^#[0-9a-f]{6}$/i.test(c.hex)||typeof c.name!=='string'))throw 0}catch{return json({error:'Use six-digit hex colours, such as #112233.'},400)}}
  if(entry.status==='Scheduled'&&entry.section==='content'&&!entry.date)return json({error:'Add a publishing date before scheduling.'},400);
  if(entry.status==='Published'&&entry.section==='content'&&!entry.liveUrl)return json({error:'Add the live post link before marking published.'},400);
  const record=await writeRecord(a,{...entry,title:entry.title.trim()},original);let syncWarning='';try{await syncRecord(record,a,new URL(req.url).origin)}catch{syncWarning='The work was saved. Calendar sync needs a retry.'}return json({record:await getRecord(record.id),syncWarning});
 }catch(e){return failure(e)}
}
