import { useState } from 'react'
import { Pencil, Trash2, X } from 'lucide-react'
import { inputClass } from '../constants'
import { useApp } from '../context/AppContext'
import { ConfirmDialog } from './ConfirmDialog'

interface ResumeManagerProps {
  open: boolean
  onClose: () => void
}

export function ResumeManager({ open, onClose }: ResumeManagerProps) {
  const { resumes, addResume, renameResume, removeResume, notify } = useApp()
  const [name, setName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (!open) return null

  const pendingDelete = resumes.find((resume) => resume.id === deleteId)

  const onAdd = async () => {
    if (!name.trim()) return
    try {
      await addResume(name)
      setName('')
      notify('success', 'Resume name added.')
    } catch (error) {
      console.error(error)
      notify('error', 'Unable to add resume name.')
    }
  }

  const onRename = async () => {
    if (!editingId || !editingName.trim()) return
    try {
      await renameResume(editingId, editingName)
      setEditingId(null)
      notify('success', 'Resume name updated.')
    } catch (error) {
      console.error(error)
      notify('error', 'Unable to rename resume.')
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-zinc-950/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Resume names</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-sm text-zinc-500">Labels only — resume files are not uploaded.</p>

        <div className="mt-4 flex gap-2">
          <input
            className={inputClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="QA_Lead_Resume_v1"
          />
          <button
            type="button"
            onClick={() => void onAdd()}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium whitespace-nowrap text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add
          </button>
        </div>

        <ul className="mt-4 max-h-72 space-y-2 overflow-y-auto">
          {resumes.length === 0 ? <li className="text-sm text-zinc-500">No resume names yet.</li> : null}
          {resumes.map((resume) => (
            <li key={resume.id} className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800">
              {editingId === resume.id ? (
                <>
                  <input className={inputClass} value={editingName} onChange={(event) => setEditingName(event.target.value)} />
                  <button type="button" className="text-sm font-medium" onClick={() => void onRename()}>
                    Save
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 truncate text-sm">{resume.name}</span>
                  <button
                    type="button"
                    className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    onClick={() => {
                      setEditingId(resume.id)
                      setEditingName(resume.name)
                    }}
                    aria-label={`Rename ${resume.name}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded p-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950"
                    onClick={() => setDeleteId(resume.id)}
                    aria-label={`Delete ${resume.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete resume name?"
        message={
          pendingDelete
            ? `Delete “${pendingDelete.name}”? Existing jobs will keep the old label if they already used it.`
            : ''
        }
        confirmLabel="Confirm delete"
        danger
        onCancel={() => setDeleteId(null)}
        onConfirm={() => {
          if (!pendingDelete) return
          void removeResume(pendingDelete.id)
            .then(() => notify('success', 'Resume name deleted.'))
            .catch((error) => {
              console.error(error)
              notify('error', 'Unable to delete resume name.')
            })
            .finally(() => setDeleteId(null))
        }}
      />
    </div>
  )
}
