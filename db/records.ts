import { env } from 'cloudflare:workers';
export function recordsDb(){if(!env.DB) throw new Error('Workspace storage unavailable');return env.DB;}
