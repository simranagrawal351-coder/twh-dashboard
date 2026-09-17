import test from 'node:test';
import assert from 'node:assert/strict';
import { seed } from '../app/server/seed.ts';
import { attentionRecords, attentionKind, areaFor, enrichRecord } from '../app/workflow.ts';

test('the brief has six distinct open actions, with three inputs waiting on TWH',()=>{
 const items=attentionRecords(seed.map(enrichRecord));
 assert.equal(items.length,6);
 assert.equal(items.filter(r=>attentionKind(r)==='Inputs').length,3);
 assert.equal(items.filter(r=>attentionKind(r)==='Decisions').length,2);
 assert.equal(items.filter(r=>attentionKind(r)==='Actions').length,1);
});
test('Overview surfaces reviews and blockers from their owning workstreams',()=>{
 const records=[{id:'creative',section:'content',status:'Client review'},{id:'shoot',section:'production',status:'Blocked'}];
 const items=attentionRecords(records);
 assert.equal(items[0].id,'shoot');
 assert.equal(attentionKind(items[0]),'Blockers');
 assert.equal(areaFor(items[1]),'Content Calendar');
});
test('resolved decisions and archived work leave the queue; private notes never enter it',()=>{
 const records=[{id:'done',section:'decision',status:'Approved'},{id:'archive',section:'task',status:'Archived'},{id:'personal',section:'private',status:'Blocked'}];
 assert.deepEqual(attentionRecords(records),[]);
});
test('a linked decision replaces its requirement without duplicate counts',()=>{
 const task={id:'input',section:'task',status:'Awaiting input'};
 const decision={id:'choice',section:'decision',status:'Awaiting approval',relatedTask:'input'};
 assert.deepEqual(attentionRecords([task,decision]).map(r=>r.id),['choice']);
 assert.deepEqual(attentionRecords([task,{...decision,status:'Approved'}]),[]);
 assert.deepEqual(attentionRecords([task,{...decision,status:'Archived'}]).map(r=>r.id),['input']);
});
test('existing saved fields take priority over workstream defaults',()=>{
 const record=enrichRecord({id:'task-assets',section:'task',area:'Production',kind:'Action'});
 assert.equal(record.area,'Production');
 assert.equal(record.kind,'Action');
 assert.equal(areaFor(enrichRecord({id:'task-assets',section:'task'})),'Assets');
});
