import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const records = sqliteTable('records', {
 id: text('id').primaryKey(),
 payload: text('payload').notNull(),
 version: integer('version').notNull().default(1),
 updatedAt: text('updated_at').notNull(),
 updatedBy: text('updated_by').notNull(),
});
export const activity = sqliteTable('activity', {
 id: text('id').primaryKey(), recordId:text('record_id').notNull(),
 section:text('section').notNull(), action:text('action').notNull(),
 actor:text('actor').notNull(), actorId:text('actor_id').notNull(),
 before:text('before_json'), after:text('after_json'), at:text('at').notNull(),
});
export const members=sqliteTable('members',{
 email:text('email').primaryKey(),role:text('role').notNull(),areas:text('areas').notNull(),name:text('name').notNull(),
});
export const settings=sqliteTable('settings',{
 id:text('id').primaryKey(),value:text('value').notNull(),updatedAt:text('updated_at').notNull(),
});
export const calendarLinks=sqliteTable('calendar_links',{
 id:text('id').primaryKey(),recordId:text('record_id').notNull(),dateField:text('date_field').notNull(),
 externalId:text('external_id'),externalUrl:text('external_url'),mode:text('mode').notNull().default('workspace'),
 syncedValue:text('synced_value'),externalValue:text('external_value'),etag:text('etag'),
 status:text('status').notNull().default('Not synced'),error:text('error'),syncedAt:text('synced_at'),
});
