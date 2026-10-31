import { useState } from 'react'
import { LockKeyhole } from 'lucide-react'
import { requireSupabase } from '../lib/supabase'

export function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    const { error: authError } = await requireSupabase().auth.signInWithPassword({ email, password })
    if (authError) setError('Giriş bilgileri doğrulanamadı.')
    setBusy(false)
  }

  return (
    <main className="grid min-h-screen place-items-center bg-gradient-to-br from-ayda-950 via-ayda-700 to-blue-500 p-5">
      <form className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl" onSubmit={submit}>
        <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-ayda-100 text-ayda-700"><LockKeyhole /></div>
        <p className="text-sm font-bold uppercase tracking-[.2em] text-ayda-600">AYDA</p>
        <h1 className="mt-1 text-2xl font-bold">Hoca Paneli</h1>
        <p className="mt-2 text-sm text-slate-500">Yalnızca yetkili kurum kullanıcıları giriş yapabilir.</p>
        <label className="mt-6 block"><span className="label">E-posta</span><input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="mt-4 block"><span className="label">Şifre</span><input className="field" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <button className="btn-primary mt-5 w-full" disabled={busy}>{busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}</button>
      </form>
    </main>
  )
}
