import { recordsDb } from '../../db/records';
export const accountDefault={leadName:'Simran',leadEmail:'simranagrawal351@gmail.com',mode:'workspace',calendarId:'primary',deleteExternal:false};
export async function getSetting<T>(id:string,fallback:T):Promise<T>{const row=await recordsDb().prepare('SELECT value FROM settings WHERE id=?').bind(id).first<{value:string}>();return row?JSON.parse(row.value):fallback;}
export async function putSetting(id:string,value:unknown){await recordsDb().prepare('INSERT INTO settings(id,value,updated_at) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at').bind(id,JSON.stringify(value),new Date().toISOString()).run();}
