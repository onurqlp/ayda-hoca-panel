import { useState } from 'react'
import { AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { Layout, type PageName } from './components/Layout'
import { SetupScreen } from './components/SetupScreen'
import { defaultPaymentMonth, paymentMonthForWorkMonth, workMonthForPaymentMonth } from './lib/dates'
import { isAppsScriptHost } from './lib/appsScript'
import { usePanelData } from './hooks/usePanelData'
import { DashboardPage } from './pages/DashboardPage'
import { WorkEntriesPage } from './pages/WorkEntriesPage'
import { TeachersPage } from './pages/TeachersPage'
import { PaymentsPage } from './pages/PaymentsPage'

function AuthenticatedApp() {
  const [page, setPage] = useState<PageName>('panel')
  const [paymentMonth, setPaymentMonth] = useState(defaultPaymentMonth())
  const workMonth = workMonthForPaymentMonth(paymentMonth)
  const setWorkMonth = (value: string) => setPaymentMonth(paymentMonthForWorkMonth(value))
  const [editEntryId, setEditEntryId] = useState<string | null>(null)
  function openEntryEditor(id: string) {
    setEditEntryId(id)
    setPage('entries')
  }
  const data = usePanelData(paymentMonth)
  return <Layout page={page} setPage={setPage}>
    <div role="status" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
      <span className={data.error ? 'flex items-center gap-2 text-red-700' : 'flex items-center gap-2 text-slate-600'}>
        {data.error ? <AlertCircle size={17} /> : <CheckCircle2 size={17} className={data.loading ? 'text-slate-400' : 'text-emerald-600'} />}
        {data.loading ? 'Google Sheets verileri yenileniyor...' : data.error
          ? 'Veriler güncellenemedi; hatayı kontrol edin.'
          : data.lastUpdatedAt
            ? `Google Sheets'ten güncellendi · ${new Date(data.lastUpdatedAt).toLocaleTimeString('tr-TR', { timeZone: 'Europe/Istanbul', hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
            : 'Henüz güncel veri alınamadı.'}
      </span>
      <button type="button" className="btn-secondary" disabled={data.loading} onClick={() => { void data.reload().catch(() => {}) }}>
        <RefreshCw size={16} className={data.loading ? 'animate-spin' : ''} /> Verileri Yenile
      </button>
    </div>
    {data.error && <div className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{data.error}</div>}{page === 'panel' && <DashboardPage month={paymentMonth} setMonth={setPaymentMonth} summaries={data.summaries} teachers={data.teachers} loading={data.loading} goTo={setPage} onEditEntry={openEntryEditor} />}{page === 'entries' && <WorkEntriesPage month={workMonth} setMonth={setWorkMonth} teachers={data.teachers} entries={data.entries} reload={data.reload} editEntryId={editEntryId} onEditEntryHandled={() => setEditEntryId(null)} />}{page === 'teachers' && <TeachersPage teachers={data.teachers} summaries={data.summaries} reload={data.reload} />}{page === 'payments' && <PaymentsPage month={paymentMonth} setMonth={setPaymentMonth} summaries={data.summaries} payments={data.payments} reload={data.reload} />}</Layout>
}

export default function App() {
  if (!isAppsScriptHost()) return <SetupScreen />
  return <AuthenticatedApp />
}
