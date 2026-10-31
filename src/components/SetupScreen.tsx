import { Database, ExternalLink } from 'lucide-react'

export function SetupScreen() {
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <section className="card w-full max-w-lg p-7 text-center">
        <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-ayda-100 text-ayda-700"><Database /></div>
        <p className="mb-2 text-sm font-bold uppercase tracking-[.18em] text-ayda-600">AYDA</p>
        <h1 className="text-2xl font-bold">Hoca Paneli kuruluma hazır</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Bu derleme yalnızca Google Apps Script Web App adresinden çalışır.</p>
        <div className="my-6 space-y-2 rounded-2xl bg-slate-50 p-4 text-left font-mono text-xs text-slate-700">
          <p>1. Google Sheet → Uzantılar → Apps Script</p>
          <p>2. Code.gs ve Index.html dosyalarını ekle</p>
          <p>3. setup() çalıştır, ardından Web uygulaması olarak dağıt</p>
        </div>
        <p className="mb-5 text-xs leading-5 text-slate-500">Kurulumdan sonra verilen Web App bağlantısını açın. Supabase veya Vercel gerekmez.</p>
        <a className="btn-primary w-full" href="https://docs.google.com/spreadsheets/d/1pgSX6ffuXmBn9mmMjXEcPa1n_O3Vt6XWOJrm99QDRKI/edit" target="_blank" rel="noreferrer">Google Sheet'i aç <ExternalLink size={16} /></a>
      </section>
    </main>
  )
}
