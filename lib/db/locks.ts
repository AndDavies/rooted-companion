import { createClientForActions } from '@/utils/supabase/server';

// Avoid BigInt literals for broader TS target compatibility
function hashKey(input: string): bigint {
  // FNV-1a 64-bit implemented with JS BigInt without numeric literals
  let h = BigInt('14695981039346656037'); // 0xcbf29ce484222325
  const p = BigInt('1099511628211'); // 0x100000001b3
  const mask = (BigInt(1) << BigInt(64)) - BigInt(1);
  for (let i = 0; i < input.length; i++) {
    h = h ^ BigInt(input.charCodeAt(i));
    h = (h * p) & mask;
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


