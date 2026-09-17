export type Media = {kind:'image'|'video'|'iframe'|'file';src:string;provider:string};
export const uploadPath=/^\/api\/uploads\/[a-f0-9-]{36}$/;
export function safeMediaUrl(value:unknown):string{
 const s=String(value||'').trim();if(uploadPath.test(s))return s;
 try{const u=new URL(s);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password?u.href:''}catch{return ''}
}
export function mediaFor(value:unknown,mime=''):Media{
 const src=safeMediaUrl(value);if(!src)return {kind:'file',src:'',provider:'File'};
 if(mime.startsWith('image/')&&!mime.includes('svg'))return {kind:'image',src,provider:'Image'};
 if(mime.startsWith('video/'))return {kind:'video',src,provider:'Video'};
 if(uploadPath.test(src))return {kind:'file',src,provider:'Uploaded file'};
 const u=new URL(src),host=u.hostname.toLowerCase().replace(/^www\./,''),parts=u.pathname.split('/').filter(Boolean);
 let id='';
 if(host==='youtu.be')id=parts[0]||'';
 if(['youtube.com','m.youtube.com','youtube-nocookie.com'].includes(host))id=u.searchParams.get('v')||(['embed','shorts','live'].includes(parts[0])?parts[1]:'')||'';
 if(/^[\w-]{11}$/.test(id))return {kind:'iframe',src:`https://www.youtube-nocookie.com/embed/${id}`,provider:'YouTube'};
 if(['vimeo.com','player.vimeo.com'].includes(host)){
  const vi=parts.find(p=>/^\d+$/.test(p));const hash=u.searchParams.get('h')||(vi?parts[parts.indexOf(vi)+1]:'');
  if(vi)return {kind:'iframe',src:`https://player.vimeo.com/video/${vi}${hash&&/^[a-zA-Z0-9]+$/.test(hash)?'?h='+hash:''}`,provider:'Vimeo'};
 }
 if(host==='drive.google.com'){
  const di=parts[0]==='file'&&parts[1]==='d'?parts[2]:u.searchParams.get('id');
  if(di&&/^[\w-]+$/.test(di))return {kind:'iframe',src:`https://drive.google.com/file/d/${di}/preview`,provider:'Google Drive'};
 }
 if(['instagram.com','m.instagram.com'].includes(host)&&['p','reel','reels','tv'].includes(parts[0])&&/^[\w-]+$/.test(parts[1]||''))return {kind:'iframe',src:`https://www.instagram.com/${parts[0]==='reels'?'reel':parts[0]}/${parts[1]}/embed/`,provider:'Instagram'};
 if(/\.(png|jpe?g|webp|gif|avif)$/i.test(u.pathname))return {kind:'image',src,provider:'Image'};
 if(/\.(mp4|webm|mov)$/i.test(u.pathname))return {kind:'video',src,provider:'Video'};
 return {kind:'file',src,provider:host};
}
export function suggestedLabel(url:string,notes='',fallback='Saved reference'){
 if(notes.trim())return notes.trim().split('\n')[0].slice(0,100);
 try{const u=new URL(url);const name=decodeURIComponent(u.pathname.split('/').filter(Boolean).pop()||'');return name&&name.length<70?name.replace(/[-_]/g,' '):u.hostname.replace(/^www\./,'')}catch{return fallback}
}
export const researchCategories=['Market','Audience','Competitors','Trends','Reference bank'];
export const researchCategory=(r:Record<string,unknown>)=>researchCategories.includes(String(r.category))?String(r.category):'Competitors';
