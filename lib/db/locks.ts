import { createClientForActions } from '@/utils/supabase/server';

function hashKey(input: string): bigint {
  let h = 0xcbf29ce484222325n;
  const p = 0x100000001b3n;
  for (let i = 0; i < input.length; i++) {
    h ^= BigInt(input.charCodeAt(i));
    h = (h * p) & 0xFFFFFFFFFFFFFFFFn;
  }
  return h;
}

export async function tryAcquireUserDayLock(userId: string, ymd: string): Promise<boolean> {
  const supabase = await createClientForActions();
  const key = hashKey(`suggestion:${userId}:${ymd}`).toString();
  const { data, error } = await supabase.rpc('pg_try_advisory_lock_bigint', { key });
  if (error) return false;
  return Boolean(data);
}

export async function releaseUserDayLock(userId: string, ymd: string): Promise<void> {
  try {
    const supabase = await createClientForActions();
    const key = hashKey(`suggestion:${userId}:${ymd}`).toString();
    await supabase.rpc('pg_advisory_unlock_bigint', { key });
  } catch {
    // ignore unlock errors
  }
}


