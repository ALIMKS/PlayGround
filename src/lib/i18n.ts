import { core } from './i18n-core'
import { app } from './i18n-app'
import type { Lang } from './types'

export const LANGUAGES: { code: Lang; label: string; short: string }[] = [
  { code: 'fr', label: 'Français', short: 'FR' },
  { code: 'en', label: 'English', short: 'EN' },
]

type Entry = { fr: string; en: string }

const rows = [...core, ...app] as readonly (readonly [string, string, string])[]

const dictionary: Record<string, Entry> = Object.fromEntries(
  rows.map(([key, fr, en]) => [key, { fr, en }]),
)

export type TKey = (typeof rows)[number][0]

export function translate(
  lang: Lang,
  key: TKey | string,
  vars?: Record<string, string | number>,
): string {
  const entry = dictionary[key]
  let value = entry ? entry[lang] ?? entry.fr : key
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.split(`{${name}}`).join(String(replacement))
    }
  }
  return value
}

export function makeT(lang: Lang) {
  return (key: TKey | string, vars?: Record<string, string | number>) =>
    translate(lang, key, vars)
}
