export const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export const sameOrigin=(req:Request)=>!req.headers.get('origin')||req.headers.get('origin')===new URL(req.url).origin;
export function failure(e:unknown){if(e instanceof Error&&e.message==='CONFLICT')return json({error:'Someone changed this record. Refresh and review the latest version before saving.'},409);console.error('Workspace operation failed',e);return json({error:'That did not save. Your changes are still here; please try again.'},503)}
