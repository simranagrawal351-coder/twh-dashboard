import { getChatGPTUser } from '../chatgpt-auth';
import { recordsDb } from '../../db/records';
import type { Entry } from '../data';
// The verified owner of this existing, owner-private Site. Never sent to the browser as a credential.
const ownerEmail='simranagrawal351@gmail.com';
import { type Access } from '../permissions';
export { canRead,canWrite,visibleRecord,clientSections,type Access } from '../permissions';
export async function access():Promise<Access|null>{
 const user=await getChatGPTUser();if(!user)return null;
 if(user.email.toLowerCase()===ownerEmail||(import.meta.env.DEV&&user.userId==='local_seedy'))return {userId:user.userId,email:user.email,name:user.displayName,role:'admin',areas:['*']};
 const member=await recordsDb().prepare('SELECT role,areas,name FROM members WHERE email=?').bind(user.email.toLowerCase()).first<{role:string;areas:string;name:string}>();
 return {userId:user.userId,email:user.email,name:user.displayName,role:member?.role==='agency'?'agency':'client',areas:member?JSON.parse(member.areas):[]};
}
