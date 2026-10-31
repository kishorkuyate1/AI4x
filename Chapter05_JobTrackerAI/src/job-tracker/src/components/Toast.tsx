import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'
import { useApp } from '../context/AppContext'

const ICONS = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
}

export function Toast() {
  const { toasts, dismissToast } = useApp()

  if (toasts.length === 0) return null

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = ICONS[toast.type]
        const tone =
          toast.type === 'error'
            ? 'border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100'
            : toast.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100'
              : 'border-zinc-200 bg-white text-zinc-800 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100'
        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-3 py-2 shadow-lg ${tone}`}
            role="status"
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="flex-1 text-sm">{toast.text}</p>
            <button
              type="button"
              className="rounded-md p-1 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => dismissToast(toast.id)}
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
