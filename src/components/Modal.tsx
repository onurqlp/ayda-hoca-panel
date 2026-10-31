import { X } from 'lucide-react'
import type { ReactNode } from 'react'

export function Modal({ title, children, onClose, wide = false }: {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="dialog" aria-modal="true">
      <div className={`max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-2xl sm:rounded-3xl sm:p-6 ${wide ? 'sm:max-w-4xl' : 'sm:max-w-xl'}`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-slate-950">{title}</h2>
          <button className="rounded-xl p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Kapat"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}
