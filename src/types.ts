export type Category = '교육' | '문화' | '숙박&관광' | '의료' | '주차' | '체육' | '기타'

export type RecordType = 'facility' | 'facility_group' | 'benefit_policy' | 'facility_unlocated'

export interface Facility {
  id: string
  sourceRow: number
  sourceSerial: number | null
  dataDate: string
  jurisdictionRaw: string
  jurisdictionDisplay: string
  locationRegion: string | null
  locationRegionDisplay: string | null
  provinceManaged: boolean
  categoryRaw: string
  category: Category
  name: string
  eligibility: string | null
  benefit: string | null
  benefitType: 'exemption' | 'discount'
  institutionType: string | null
  note: string | null
  homepageUrl: string | null
  address: string | null
  phoneDisplay: string | null
  phoneTel: string | null
  naverMapQuery: string | null
  naverMapUrl: string | null
  naverPlaceId: string | null
  naverMapVerified: boolean
  naverMapVerificationStatus: string
  recordType: RecordType
  geocodeStatus: 'ready_for_geocoding' | 'missing_address'
  latitude: number | null
  longitude: number | null
  categoryReview: boolean
  regionMismatch: boolean
  qualityFlags: string[]
}

export interface GyeonggiRegionShape {
  region: string
  displayName: string
  paths: string[]
  label: [number, number]
}

export interface FacilityPhoto {
  id: string
  facilityNames: string[]
  imageUrl: string
  sourceUrl: string
  author: string
  license: string
  licenseUrl: string
  alt: string
  objectPosition: string
}
