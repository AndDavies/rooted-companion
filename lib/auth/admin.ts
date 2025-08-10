import type { User } from '@supabase/supabase-js'

export function isUserAdmin(user: Pick<User, 'user_metadata' | 'app_metadata'> | null): boolean {
  if (!user) return false
  const top = typeof user.user_metadata?.role === 'string'
    ? user.user_metadata.role.toLowerCase()
    : ''
  const appRoleValue = (user.app_metadata as { role?: unknown } | undefined)?.role
  const app = typeof appRoleValue === 'string' ? appRoleValue.toLowerCase() : ''
  return top === 'admin' || app === 'admin'
}


