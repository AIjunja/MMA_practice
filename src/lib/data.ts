import rawFacilities from '../data/facilities.json'
import rawFacilityPhotos from '../data/facility-photos.json'
import rawGyeonggiMap from '../data/gyeonggi-map.json'
import type { Category, Facility, FacilityPhoto, GyeonggiRegionShape } from '../types'

export const facilities = rawFacilities as Facility[]
export const facilityPhotos = rawFacilityPhotos as FacilityPhoto[]
export const mapRegions = rawGyeonggiMap as GyeonggiRegionShape[]

export const CATEGORIES: Category[] = ['교육', '문화', '숙박&관광', '의료', '주차', '체육', '기타']

const COUNTY_NAMES = new Set(['가평', '양평', '연천'])

export function displayRegion(region: string): string {
  return `${region}${COUNTY_NAMES.has(region) ? '군' : '시'}`
}

export const regions = [...new Set(facilities.map((item) => item.locationRegion).filter((value): value is string => Boolean(value)))]
  .sort((a, b) => a.localeCompare(b, 'ko'))

const facilityPhotoByName = new Map(
  facilityPhotos.flatMap((photo) => photo.facilityNames.map((name) => [name, photo] as const)),
)

export function photoFor(facility: Pick<Facility, 'name'>): FacilityPhoto | null {
  return facilityPhotoByName.get(facility.name) ?? null
}

export function facilitiesFor(region: string, category?: Category): Facility[] {
  return facilities
    .filter((item) => item.locationRegion === region && (!category || item.category === category))
    .sort((a, b) => a.name.localeCompare(b.name, 'ko'))
}

export function countFor(region: string, category: Category): number {
  return facilitiesFor(region, category).length
}

export function searchFacilities(items: Facility[], query: string): Facility[] {
  const normalizedQuery = query.trim().toLocaleLowerCase('ko')
  if (!normalizedQuery) return items
  return items.filter((item) =>
    [item.name, item.benefit, item.eligibility]
      .filter(Boolean)
      .join(' ')
      .toLocaleLowerCase('ko')
      .includes(normalizedQuery),
  )
}
