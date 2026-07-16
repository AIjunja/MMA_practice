import rawPxDataset from '../../data/px-stores-gyeonggi.json'
import type { PxDataset, PxRegionCount, PxStore } from './types'

export const pxDataset = rawPxDataset as PxDataset
export const pxStores = pxDataset.stores

export const pxRegions: PxRegionCount[] = [...new Set(pxStores.map((store) => store.region))]
  .sort((left, right) => left.localeCompare(right, 'ko'))
  .map((region) => ({
    region,
    count: pxStores.filter((store) => store.region === region).length,
  }))

function normalized(value: string): string {
  return value.trim().toLocaleLowerCase('ko').replace(/\s+/g, '')
}

export function filterPxStores(items: PxStore[], query: string, region: string): PxStore[] {
  const normalizedQuery = normalized(query)
  return items.filter((store) => {
    if (region && store.region !== region) return false
    if (!normalizedQuery) return true
    return normalized([store.name, store.officialName, store.region, store.address].join(' ')).includes(normalizedQuery)
  })
}

export function pxStoresForRegion(region: string): PxStore[] {
  return filterPxStores(pxStores, '', region)
}

export function pxStoreById(id: string): PxStore | null {
  return pxStores.find((store) => store.id === id) ?? null
}
