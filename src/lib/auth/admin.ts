import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin?next=/admin')
  }

  // Local dev: insert your auth user id into public.admin_users to unlock admin pages.
  // Restricted to specific email
  const allowedEmails = ['k.myungjun@nexsupply.net']
  if (user.email && allowedEmails.includes(user.email)) {
    return user
  }

  const { data: adminRow } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!adminRow) {
    redirect('/app/reports')
  }

  return user
}
