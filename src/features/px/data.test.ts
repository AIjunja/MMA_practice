import { describe, expect, it } from 'vitest'
import { filterPxStores, pxDataset, pxRegions, pxStoreById, pxStores, pxStoresForRegion } from './data'

describe('PX data', () => {
  it('loads every official Gyeonggi off-base mart record', () => {
    expect(pxDataset.metadata.officialReferenceDate).toBe('2026-04-28')
    expect(pxDataset.metadata.gyeonggiStoreCount).toBe(49)
    expect(pxStores).toHaveLength(49)
  })

  it('builds only regions that have PX stores with their counts', () => {
    expect(pxRegions).toHaveLength(18)
    expect(pxRegions.find((item) => item.region === '고양')).toEqual({ region: '고양', count: 5 })
    expect(pxRegions.find((item) => item.region === '포천')).toEqual({ region: '포천', count: 6 })
  })

  it('searches store name, official name, region and address', () => {
    expect(filterPxStores(pxStores, '서해', '')).toHaveLength(1)
    expect(filterPxStores(pxStores, '만안구', '')[0]?.name).toBe('박달')
    expect(filterPxStores(pxStores, '양평', '')).toHaveLength(4)
  })

  it('combines the region filter with the search term', () => {
    expect(filterPxStores(pxStores, '푸르미', '포천').map((item) => item.name)).toEqual(['포천푸르미'])
    expect(filterPxStores(pxStores, '푸르미', '연천').map((item) => item.name)).toEqual(['전곡푸르미'])
  })

  it('supports region lists and stable detail lookup', () => {
    expect(pxStoresForRegion('평택')).toHaveLength(2)
    const store = pxStores.find((item) => item.name === '(해)서해')
    expect(store && pxStoreById(store.id)).toEqual(store)
    expect(pxStoreById('missing-store')).toBeNull()
  })

  it('keeps every marker inside the fixed SVG viewport and all required links secure', () => {
    expect(pxStores.every((item) => item.svgX !== null && item.svgX >= 0 && item.svgX <= 800)).toBe(true)
    expect(pxStores.every((item) => item.svgY !== null && item.svgY >= 0 && item.svgY <= 944)).toBe(true)
    expect(pxStores.every((item) => item.naverMapUrl.startsWith('https://'))).toBe(true)
    expect(pxStores.every((item) => /^https:\/\/map\.naver\.com\/p\/entry\/place\/\d+$/.test(item.naverMapUrl))).toBe(true)
    expect(new Set(pxStores.map((item) => item.naverPlaceId)).size).toBe(49)
    expect(pxStores.every((item) => item.welfarePortalUrl === 'https://www.welfare.mil.kr')).toBe(true)
  })

  it('keeps the verified PX search aliases used to resolve Naver places', () => {
    expect(pxStores.find((item) => item.name === '박달')?.naverMapQuery).toBe('국군복지단 박달마트 안양')
    expect(pxStores.find((item) => item.name === '선봉')?.naverMapQuery).toBe('국군복지단 선봉영외마트')
    expect(pxStores.every((item) => item.naverMapVerified)).toBe(true)
  })

  it('presents compact official time ranges with a readable separator', () => {
    expect(pxStores.find((item) => item.name === '맹호')?.hours.weekday).toBe('10:00~19:20')
    expect(pxStores.find((item) => item.name === '신산')?.hours.weekday).toBe('10:00~19:30')
  })
})
