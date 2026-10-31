import { Banknote, BookOpenCheck, LayoutDashboard, LogOut, Users } from 'lucide-react'
import type { ReactNode } from 'react'
import { requireSupabase } from '../lib/supabase'

export type PageName = 'panel' | 'entries' | 'teachers' | 'payments'
const nav = [
  { id: 'panel' as const, label: 'Panel', icon: LayoutDashboard },
  { id: 'entries' as const, label: 'Ders Girişi', icon: BookOpenCheck },
  { id: 'teachers' as const, label: 'Hocalar', icon: Users },
  { id: 'payments' as const, label: 'Ödemeler', icon: Banknote },
]

export function Layout({ page, setPage, children }: { page: PageName; setPage: (page: PageName) => void; children: ReactNode }) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden min-h-screen bg-ayda-950 p-5 text-white lg:block">
        <div className="mb-8 px-2"><p className="text-xs font-bold tracking-[.22em] text-blue-300">AYDA</p><p className="mt-1 text-lg font-bold">Hoca Paneli</p></div>
        <nav className="space-y-2">{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setPage(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold ${page === id ? 'bg-white text-ayda-950' : 'text-blue-100 hover:bg-white/10'}`}><Icon size={19} />{label}</button>)}</nav>
        <button onClick={() => requireSupabase().auth.signOut()} className="mt-10 flex items-center gap-2 px-3 text-sm text-blue-200 hover:text-white"><LogOut size={17} /> Çıkış yap</button>
      </aside>
      <div className="pb-24 lg:pb-0">
        <header className="border-b border-slate-200 bg-white px-5 py-4 lg:px-8"><p className="font-bold text-ayda-950 lg:hidden">AYDA | Hoca Paneli</p><p className="hidden text-sm text-slate-500 lg:block">Öğretmen hakediş ve ödeme yönetimi</p></header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white px-1 py-2 shadow-2xl lg:hidden">{nav.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setPage(id)} className={`flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold ${page === id ? 'text-ayda-600' : 'text-slate-500'}`}><Icon size={20} />{label}</button>)}</nav>
    </div>
  )
}
