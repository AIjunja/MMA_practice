import { describe, expect, it } from 'vitest'
import { CATEGORIES, facilities, facilitiesFor, mapRegions, photoFor, regions, searchFacilities } from './data'

describe('facility data', () => {
  it('loads all source records', () => {
    expect(facilities).toHaveLength(440)
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
    expect(provinceManaged).toHaveLength(4)
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
    expect(missingAddress?.naverMapQuery).toBeNull()
    expect(missingAddress?.naverMapUrl).toBeNull()
  })

  it('uses facility-name-first Naver Map links instead of full road-address queries', () => {
    const locatable = facilities.filter((item) => item.address)
    expect(locatable.length).toBe(257)
    expect(locatable.every((item) => item.naverMapQuery && item.naverMapUrl)).toBe(true)
    expect(locatable.every((item) => !decodeURIComponent(item.naverMapUrl ?? '').includes(item.address ?? ''))).toBe(true)

    const museum = facilities.find((item) => item.name === '과천시 추사박물관')
    expect(museum?.naverMapQuery).toBe('과천시 추사박물관 과천')
    expect(museum?.naverMapVerificationStatus).toMatch(/^verified_/)
  })

  it('renders all 31 Gyeonggi municipalities from real boundary paths', () => {
    expect(mapRegions).toHaveLength(31)
    expect(mapRegions.every((region) => region.paths.length > 0)).toBe(true)
    expect(mapRegions.find((region) => region.region === '부천')).toBeDefined()
  })

  it('maps licensed photos only to matching facility names', () => {
    const hwaseong = facilities.find((facility) => facility.name === '수원화성')
    const unrelated = facilities.find((facility) => facility.name === '에이치엠에스 피트니스')

    expect(hwaseong && photoFor(hwaseong)?.license).toBe('CC BY-SA 4.0')
    expect(unrelated && photoFor(unrelated)).toBeNull()
  })
})
