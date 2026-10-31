import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { Layout, type PageName } from './components/Layout'
import { LoginScreen } from './components/LoginScreen'
import { SetupScreen } from './components/SetupScreen'
import { currentMonth } from './components/MonthPicker'
import { isSupabaseConfigured, requireSupabase } from './lib/supabase'
import { usePanelData } from './hooks/usePanelData'
import { DashboardPage } from './pages/DashboardPage'
import { WorkEntriesPage } from './pages/WorkEntriesPage'
import { TeachersPage } from './pages/TeachersPage'
import { PaymentsPage } from './pages/PaymentsPage'

function AuthenticatedApp() {
  const [page, setPage] = useState<PageName>('panel')
  const [month, setMonth] = useState(currentMonth())
  const data = usePanelData(month)
  return <Layout page={page} setPage={setPage}>{data.error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{data.error}</div>}{page === 'panel' && <DashboardPage month={month} setMonth={setMonth} summaries={data.summaries} loading={data.loading} />}{page === 'entries' && <WorkEntriesPage month={month} setMonth={setMonth} teachers={data.teachers} entries={data.entries} reload={data.reload} />}{page === 'teachers' && <TeachersPage teachers={data.teachers} summaries={data.summaries} reload={data.reload} />}{page === 'payments' && <PaymentsPage month={month} setMonth={setMonth} summaries={data.summaries} payments={data.payments} reload={data.reload} />}</Layout>
}

export default function App() {
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  useEffect(() => {
    if (!isSupabaseConfigured) { setSession(null); return }
    const client = requireSupabase()
    void client.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession))
    return () => data.subscription.unsubscribe()
  }, [])
  if (!isSupabaseConfigured) return <SetupScreen />
  if (session === undefined) return <div className="grid min-h-screen place-items-center text-slate-500">Oturum kontrol ediliyor…</div>
  if (!session) return <LoginScreen />
  return <AuthenticatedApp />
}
