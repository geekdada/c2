import { Chip } from '@heroui/react'
import type { ReactNode } from 'react'

import { ConfirmationModal } from '@/components/layout/ConfirmationModal'
import { diffManagedEnv } from '@/shared/schema'
import {
  type ManagedEnv,
  type ManagedEnvKey,
  type Profile,
} from '@/shared/profiles'

type SwitchProfileModalProps = {
  isOpen: boolean
  profile: Profile | null
  currentManagedEnv: ManagedEnv
  isBusy?: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

function renderKeyList(
  title: string,
  keys: ManagedEnvKey[],
  color: 'accent' | 'warning' | 'danger'
): ReactNode {
  if (keys.length === 0) {
    return null
  }

  return (
    <section className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface-muted)] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--app-text-subtle)]">
          {title}
        </p>
        <span className="text-xs text-[var(--app-text-subtle)]">
          {keys.length}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {keys.map((key) => (
          <Chip key={key} color={color} size="sm" variant="soft">
            <Chip.Label className="font-mono text-[11px] tracking-[0.02em]">
              {key}
            </Chip.Label>
          </Chip>
        ))}
      </div>
    </section>
  )
}

export function SwitchProfileModal({
  isOpen,
  profile,
  currentManagedEnv,
  isBusy = false,
  onClose,
  onConfirm,
}: SwitchProfileModalProps) {
  if (!profile) {
    return null
  }

  const diff = diffManagedEnv(currentManagedEnv, profile.env)

  return (
    <ConfirmationModal
      cancelLabel="Keep current profile"
      confirmLabel="Switch profile"
      description="Only the managed Anthropic keys will change."
      details={
        <div className="space-y-4">
          <div className="grid gap-3">
            {renderKeyList('Will add', diff.added, 'accent')}
            {renderKeyList('Will update', diff.updated, 'warning')}
            {renderKeyList('Will remove', diff.removed, 'danger')}
          </div>
        </div>
      }
      isBusy={isBusy}
      isOpen={isOpen}
      panelClassName="max-w-xl"
      title={`Activate ${profile.name}?`}
      onClose={onClose}
      onConfirm={onConfirm}
    />
  )
}
