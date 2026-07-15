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
  recordType: RecordType
  geocodeStatus: 'ready_for_geocoding' | 'missing_address'
  latitude: number | null
  longitude: number | null
  categoryReview: boolean
  regionMismatch: boolean
  qualityFlags: string[]
}
