import test from 'node:test';
import assert from 'node:assert/strict';
import { eventsFor,affectedEvents,shiftDate,validDate,calendarWarnings } from '../app/calendar.ts';
import { reconcileDate,googlePayload } from '../app/calendar-sync.ts';
import { canRead,canWrite,visibleRecord } from '../app/permissions.ts';
import { mediaFor,safeMediaUrl } from '../app/media.ts';
const shoot={id:'shoot',section:'production',title:'TWH Furniture Shoot',date:'2026-09-22',reviewDate:'2026-09-24',status:'Planning',version:1,campaign:'campaign',owner:'Simran'};
const content={id:'reel',section:'content',title:'Reel 01',date:'2026-09-28',approvalDate:'2026-09-27',production:'shoot',status:'Idea',version:1};
test('shoot date is one stable event across contextual calendars and after rescheduling',()=>{
 const before=eventsFor([shoot,content]);assert.equal(before.filter(e=>e.section==='production'&&e.field==='date')[0].date,'2026-09-22');
 const after=eventsFor([{...shoot,date:'2026-09-25'},content]);assert.equal(after.find(e=>e.id==='shoot--date').date,'2026-09-25');assert.equal(after.find(e=>e.id==='reel--date').date,'2026-09-28');
 assert.equal(after.find(e=>e.id==='shoot--date').campaign,'campaign');
});
test('moving a shoot identifies dependencies without changing them',()=>{
 const records=[shoot,content,{...content,id:'before',date:'2026-09-20',approvalDate:''},{...content,id:'deleted',status:'Deleted'}];const original=structuredClone(records);
 const impact=affectedEvents(eventsFor(records).find(e=>e.id==='shoot--date'),'2026-09-25',records);
 assert.deepEqual(impact.map(e=>[e.id,e.proposedDate]),[['shoot--reviewDate','2026-09-27'],['reel--approvalDate','2026-09-30'],['reel--date','2026-10-01']]);assert.deepEqual(records,original);
});
test('date validation and month rollover are real calendar operations',()=>{
 assert.equal(validDate('2026-02-29'),false);assert.equal(validDate('2028-02-29'),true);assert.equal(shiftDate('2026-12-31',1),'2027-01-01');
});
test('sync detects competing date edits and obeys the chosen source',()=>{
 assert.equal(reconcileDate('25','24','22','two-way'),'conflict');assert.equal(reconcileDate('25','22','22','two-way'),'push');assert.equal(reconcileDate('22','24','22','two-way'),'pull');assert.equal(reconcileDate('22','24','22','workspace'),'conflict');assert.equal(reconcileDate('25','22','22','google'),'conflict');assert.equal(reconcileDate('25','25','22','workspace'),'equal');assert.equal(reconcileDate('25','24',null,'two-way'),'conflict');
});
test('Google events carry workspace context without internal financial fields',()=>{
 const event=eventsFor([{...shoot,budget:10000,actual:9000,location:'Gurgaon',campaignName:'Retail launch',callSheetUrl:'https://example.com/callsheet'}])[0];const payload=googlePayload(event,'https://workspace.example');
 assert.equal(payload.start.date,'2026-09-22');assert.equal(payload.end.date,'2026-09-23');assert.match(payload.description,/Campaign: Retail launch/);assert.match(payload.description,/record=shoot/);assert.doesNotMatch(payload.description,/10000|9000/);
});
const client={role:'client',areas:['content','service','budget','private','brand'],userId:'client',email:'client@example.com',name:'Client'};
test('client access requires explicit sharing and never grants internal sections',()=>{
 assert.equal(canRead(client,shoot),false);assert.equal(canRead(client,{...content,visibility:'agency'}),false);assert.equal(canRead(client,{...content,visibility:'client'}),true);assert.equal(canWrite(client,{...content,visibility:'client'}),false);assert.equal(canRead(client,{section:'budget',visibility:'client'}),false);assert.equal(canRead(client,{section:'private',privateOwner:'agency',visibility:'client'}),false);
 const exposed=visibleRecord(client,{...content,visibility:'client',budget:500,actual:400,internalNotes:'private',storageKey:'secret',notes:'Client brief'});assert.equal(exposed.notes,'Client brief');for(const f of ['budget','actual','internalNotes','storageKey'])assert.equal(exposed[f],undefined);
});
test('agency permissions and personal ownership are enforced',()=>{
 const agency={...client,role:'agency',areas:['content','private']};assert.equal(canRead(agency,content),true);assert.equal(canRead(agency,shoot),false);assert.equal(canWrite(agency,{id:'new',title:'Private',section:'private',status:'Proposed',version:0}),true);assert.equal(canRead(client,{section:'private',privateOwner:client.userId,visibility:'client'}),false);assert.equal(canRead({...agency,role:'admin'}, {section:'private',privateOwner:'someone-else'}),false);
});
test('media embeds are provider-specific and reject executable URLs',()=>{
 assert.equal(safeMediaUrl('javascript:alert(1)'), '');assert.equal(mediaFor('https://youtu.be/dQw4w9WgXcQ').kind,'iframe');assert.equal(mediaFor('https://example.com/watch').kind,'file');assert.equal(mediaFor('https://drive.google.com/file/d/test-id/view').src,'https://drive.google.com/file/d/test-id/preview');
});

test('kept dates surface ordering conflicts after a shoot is moved',()=>{const warnings=calendarWarnings([{...shoot,date:'2026-09-25'},content]);assert.equal(warnings.length,1);assert.equal(warnings[0].id,'shoot--reviewDate');assert.match(warnings[0].message,/comes before/);});
