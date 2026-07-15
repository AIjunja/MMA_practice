import { describe, expect, it } from 'vitest'
import { CATEGORIES, facilities, facilitiesFor, regions, searchFacilities } from './data'

describe('facility data', () => {
  it('loads all source records', () => {
    expect(facilities).toHaveLength(441)
  })

  it('uses exactly the seven approved categories', () => {
    expect(new Set(facilities.map((item) => item.category))).toEqual(new Set(CATEGORIES))
    expect(CATEGORIES).toHaveLength(7)
  })

  it('normalizes the lodging category label', () => {
    expect(facilities.some((item) => item.category === '숙박&관광')).toBe(true)
    expect(facilities.some((item) => item.category === '숙박·관광' as never)).toBe(false)
  })

  it('maps province-managed facilities to their physical region', () => {
    const provinceManaged = facilities.filter((item) => item.provinceManaged)
    expect(provinceManaged).toHaveLength(5)
    expect(provinceManaged.every((item) => item.locationRegion)).toBe(true)
  })

  it('filters by region and category and searches benefit text', () => {
    expect(regions.length).toBeGreaterThan(20)
    const suwonSports = facilitiesFor('수원', '체육')
    expect(suwonSports.length).toBeGreaterThan(0)
    expect(searchFacilities(suwonSports, '50%').length).toBeGreaterThan(0)
  })

  it('does not create actions from unavailable source values', () => {
    const missingAddress = facilities.find((item) => item.sourceRow === 31)
    expect(missingAddress?.address).toBeNull()
    expect(missingAddress?.homepageUrl).toBeNull()
    expect(missingAddress?.phoneTel).toBeNull()
  })
})
