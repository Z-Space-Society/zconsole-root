/**
 * User model - Database operations for meetup users
 */

import { eq, desc, sql } from 'drizzle-orm'
import type { Database } from '../client.js'
import { users, type User } from '../schema.js'

// Re-export types
export type { User }

/**
 * Get all users ordered by check-in time (most recent first)
 */
export async function getAllUsers(db: Database): Promise<User[]> {
  return await db
    .select()
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(1000)
}

/**
 * Get user by DID
 */
export async function getUserByDID(db: Database, did: string): Promise<User | undefined> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.did, did))
    .limit(1)

  return user
}

/**
 * Delete user by DID
 */
export async function deleteUserByDID(db: Database, did: string): Promise<void> {
  await db
    .delete(users)
    .where(eq(users.did, did))
}

/**
 * Upsert user profile (name and socials), preserves avatar on update
 */
export async function addOrUpdateUser(
  db: Database,
  did: string,
  name: string,
  socials: Array<{ platform: string; handle: string }>
): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({
      did,
      name,
      socials: socials.map((social) => `${social.platform}:${social.handle}`).join(';'),
    })
    .onConflictDoUpdate({
      target: users.did,
      set: {
        name: sql`excluded.name`,
        socials: sql`excluded.socials`,
      },
    })
    .returning()

  return user
}

/**
 * Upsert user avatar, preserves name and socials on update
 */
export async function addOrUpdateUserAvatar(db: Database, did: string, avatar: string): Promise<User> {
  const [user] = await db
    .insert(users)
    .values({
      did,
      avatar,
    })
    .onConflictDoUpdate({
      target: users.did,
      set: {
        avatar: sql`excluded.avatar`,
      },
    })
    .returning()

  return user
}

/**
 * Clear all users (useful for testing or resetting)
 */
export async function deleteAllUsers(db: Database): Promise<void> {
  await db.delete(users)
  console.log('✅ All users deleted')
}

/**
 * Check if a user is an admin by DID
 */
export async function isUserAdmin(db: Database, did: string): Promise<boolean> {
  const user = await getUserByDID(db, did)
  return user?.isAdmin ?? false
}

/**
 * Set (or clear) a user's admin flag.
 *
 * When granting, this upserts so an operator can promote a DID that has not used the
 * app yet (e.g. pasting a DID into the "add admin" field). When revoking, it only
 * updates an existing row — there's no point inserting a non-admin placeholder.
 */
export async function setUserAdmin(db: Database, did: string, isAdmin: boolean): Promise<void> {
  if (isAdmin) {
    await db
      .insert(users)
      .values({ did, isAdmin: true })
      .onConflictDoUpdate({ target: users.did, set: { isAdmin: true } })
  } else {
    await db.update(users).set({ isAdmin: false }).where(eq(users.did, did))
  }
}

/**
 * Block (or unblock) a user.
 *
 * `blocked` is NOT part of the shared starter schema, so this runs as raw SQL rather
 * than through the typed model — that keeps the rest of the model (list/grant/revoke/
 * remove) working against child tables that don't have the column. It throws if the
 * target app's `users` table has no `blocked` column; the caller surfaces that error.
 */
export async function setUserBlocked(db: Database, did: string, blocked: boolean): Promise<void> {
  await db.run(sql`UPDATE users SET blocked = ${blocked ? 1 : 0} WHERE did = ${did}`)
}

/**
 * Delete all non-admin users (for resetting events)
 */
export async function deleteNonAdminUsers(db: Database): Promise<void> {
  await db.delete(users).where(eq(users.isAdmin, false))
  console.log('✅ Non-admin users deleted')
}
