import { describe, expect, it } from 'vitest'
import { app } from './i18n-app'
import { core } from './i18n-core'
import { makeT, translate } from './i18n'

const rows = [...core, ...app]

describe('translations', () => {
  it('defines every key in both languages', () => {
    for (const [key, fr, en] of rows) {
      expect(key.length, key).toBeGreaterThan(0)
      expect(fr.length, `${key} fr`).toBeGreaterThan(0)
      expect(en.length, `${key} en`).toBeGreaterThan(0)
    }
  })

  it('has no duplicate keys', () => {
    const keys = rows.map(([key]) => key)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('translates and interpolates variables', () => {
    expect(translate('fr', 'common.search')).toBe('Rechercher')
    expect(translate('en', 'common.search')).toBe('Search')
    expect(translate('en', 'search.results', { count: 12 })).toContain('12')
  })

  it('falls back to the key when missing', () => {
    expect(translate('fr', 'missing.key')).toBe('missing.key')
    expect(makeT('en')('missing.key')).toBe('missing.key')
  })
})
