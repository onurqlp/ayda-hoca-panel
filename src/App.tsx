import { useState } from 'react'
import { Layout, type PageName } from './components/Layout'
import { SetupScreen } from './components/SetupScreen'
import { currentMonth } from './components/MonthPicker'
import { isAppsScriptHost } from './lib/appsScript'
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
  if (!isAppsScriptHost()) return <SetupScreen />
  return <AuthenticatedApp />
}
