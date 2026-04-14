import { z } from 'zod'

import {
  appStateSchemaVersion,
  managedEnvKeys,
  managedKeyLabels,
  managedSecretKeys,
  type AppState,
  type ManagedEnv,
  type ManagedEnvKey,
  type ManagedSecretKey,
  type Profile,
  type ProfileInput,
} from './profiles'

const managedEnvShape = Object.fromEntries(
  managedEnvKeys.map((key) => [key, z.string().optional()])
) as Record<ManagedEnvKey, z.ZodOptional<z.ZodString>>

const managedEnvBaseSchema = z.object(managedEnvShape)

export const managedEnvSchema = managedEnvBaseSchema.superRefine((env, ctx) => {
  if (!hasCredential(env)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ANTHROPIC_API_KEY'],
      message: 'Provide an API key or auth token.',
    })
  }

  if (hasBothCredentials(env)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ANTHROPIC_AUTH_TOKEN'],
      message: 'Cannot set both API key and auth token.',
    })
  }

  if (env.ANTHROPIC_BASE_URL && !isValidUrl(env.ANTHROPIC_BASE_URL)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['ANTHROPIC_BASE_URL'],
      message: 'Base URL must be a valid URL.',
    })
  }

  if (
    env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE?.trim() &&
    !isValidIntegerInRange(env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE.trim(), 1, 100)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CLAUDE_AUTOCOMPACT_PCT_OVERRIDE'],
      message: 'Must be an integer between 1 and 100.',
    })
  }

  if (
    env.CLAUDE_CODE_AUTO_COMPACT_WINDOW?.trim() &&
    !isValidIntegerInRange(env.CLAUDE_CODE_AUTO_COMPACT_WINDOW.trim(), 1)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CLAUDE_CODE_AUTO_COMPACT_WINDOW'],
      message: 'Must be a positive integer.',
    })
  }

  if (
    env.CLAUDE_CODE_MAX_OUTPUT_TOKENS?.trim() &&
    !isValidIntegerInRange(env.CLAUDE_CODE_MAX_OUTPUT_TOKENS.trim(), 1)
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['CLAUDE_CODE_MAX_OUTPUT_TOKENS'],
      message: 'Must be a positive integer.',
    })
  }
})

export const profileInputSchema = z.object({
  name: z.string().min(1, 'Profile name is required.'),
  env: managedEnvSchema,
})

export const profileSchema = profileInputSchema.extend({
  id: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const appStateSchema = z
  .object({
    schemaVersion: z.literal(appStateSchemaVersion),
    activeProfileId: z.string().nullable(),
    profiles: z.array(profileSchema),
  })
  .superRefine((state, ctx) => {
    if (
      state.activeProfileId &&
      !state.profiles.some((profile) => profile.id === state.activeProfileId)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['activeProfileId'],
        message: 'Active profile must exist in the profile list.',
      })
    }
  })

export function isValidUrl(value: string): boolean {
  return z.url().safeParse(value).success
}

export function isValidIntegerInRange(
  value: string,
  min: number,
  max?: number
): boolean {
  const num = Number(value)

  return Number.isInteger(num) && num >= min && (max === undefined || num <= max)
}

export function hasCredential(env: ManagedEnv): boolean {
  return Boolean(env.ANTHROPIC_API_KEY || env.ANTHROPIC_AUTH_TOKEN)
}

export function hasBothCredentials(env: ManagedEnv): boolean {
  return Boolean(
    env.ANTHROPIC_API_KEY?.trim() && env.ANTHROPIC_AUTH_TOKEN?.trim()
  )
}

export function normalizeOptionalString(
  value: string | null | undefined
): string | undefined {
  const trimmed = value?.trim()

  return trimmed ? trimmed : undefined
}

export function normalizeManagedEnv(
  env: Partial<Record<ManagedEnvKey, string | null | undefined>>
): ManagedEnv {
  const normalizedEntries = managedEnvKeys.flatMap((key) => {
    const value = normalizeOptionalString(env[key])

    return value ? ([[key, value]] as const) : []
  })

  return Object.fromEntries(normalizedEntries) as ManagedEnv
}

export function sanitizeManagedEnvForImport(
  env: Partial<Record<ManagedEnvKey, string | null | undefined>>
): ManagedEnv {
  const normalized = normalizeManagedEnv(env)

  if (
    normalized.ANTHROPIC_BASE_URL &&
    !isValidUrl(normalized.ANTHROPIC_BASE_URL)
  ) {
    delete normalized.ANTHROPIC_BASE_URL
  }

  if (
    normalized.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE &&
    !isValidIntegerInRange(normalized.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE, 1, 100)
  ) {
    delete normalized.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE
  }

  if (
    normalized.CLAUDE_CODE_AUTO_COMPACT_WINDOW &&
    !isValidIntegerInRange(normalized.CLAUDE_CODE_AUTO_COMPACT_WINDOW, 1)
  ) {
    delete normalized.CLAUDE_CODE_AUTO_COMPACT_WINDOW
  }

  if (
    normalized.CLAUDE_CODE_MAX_OUTPUT_TOKENS &&
    !isValidIntegerInRange(normalized.CLAUDE_CODE_MAX_OUTPUT_TOKENS, 1)
  ) {
    delete normalized.CLAUDE_CODE_MAX_OUTPUT_TOKENS
  }

  return normalized
}

export function normalizeProfileInput(input: ProfileInput): ProfileInput {
  return {
    name: input.name.trim(),
    env: normalizeManagedEnv(input.env),
  }
}

export function validateProfileInput(input: ProfileInput): ProfileInput {
  return profileInputSchema.parse(normalizeProfileInput(input))
}

export function validateProfile(profile: Profile): Profile {
  return profileSchema.parse({
    ...profile,
    name: profile.name.trim(),
    env: normalizeManagedEnv(profile.env),
  })
}

export function validateAppState(state: AppState): AppState {
  return appStateSchema.parse(state)
}

export function maskSecret(
  value: string | undefined,
  key: ManagedSecretKey
): string {
  if (!value) {
    return 'Not set'
  }

  if (value.length <= 8) {
    return `${key.toLowerCase()} configured`
  }

  return `${value.slice(0, 4)}••••${value.slice(-4)}`
}

export function isSecretKey(key: ManagedEnvKey): key is ManagedSecretKey {
  return managedSecretKeys.includes(key as ManagedSecretKey)
}

export function summarizeManagedEnv(env: ManagedEnv): string[] {
  return managedEnvKeys
    .filter((key) => env[key])
    .map((key) =>
      isSecretKey(key)
        ? `${managedKeyLabels[key]}: ${maskSecret(env[key], key)}`
        : `${managedKeyLabels[key]}: ${env[key]}`
    )
}

export function diffManagedEnv(
  current: ManagedEnv,
  next: ManagedEnv
): {
  added: ManagedEnvKey[]
  removed: ManagedEnvKey[]
  updated: ManagedEnvKey[]
} {
  return managedEnvKeys.reduce(
    (diff, key) => {
      const currentValue = current[key]
      const nextValue = next[key]

      if (!currentValue && nextValue) {
        diff.added.push(key)
      } else if (currentValue && !nextValue) {
        diff.removed.push(key)
      } else if (currentValue && nextValue && currentValue !== nextValue) {
        diff.updated.push(key)
      }

      return diff
    },
    {
      added: [] as ManagedEnvKey[],
      removed: [] as ManagedEnvKey[],
      updated: [] as ManagedEnvKey[],
    }
  )
}
