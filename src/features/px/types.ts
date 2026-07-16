export interface PxHours {
  weekday: string
  saturday: string
  sunday: string
}

export interface PxStore {
  id: string
  name: string
  officialName: string
  region: string
  address: string
  phone: string
  hours: PxHours
  lunchHours: PxHours
  note: string
  lat: number | null
  lng: number | null
  svgX: number | null
  svgY: number | null
  markerPositionStatus: string
  coordinateSource: string | null
  coordinateMatchStatus: string
  coordinateAddressScore: number | null
  naverMapUrl: string
  naverMapLinkType: string
  welfarePortalUrl: string
  welfareLinkType: string
}

export interface PxMetadata {
  title: string
  generatedAt: string
  officialReferenceDate: string
  officialRowCountNationwide: number
  gyeonggiStoreCount: number
  officialDataUrl: string
  officialSheetUrl: string
  officialFields: string[]
  coordinateNotice: string
  naverLinkNotice: string
  operatingHoursNotice: string
  licenseNotice: string
}

export interface PxDataset {
  metadata: PxMetadata
  stores: PxStore[]
}

export interface PxRegionCount {
  region: string
  count: number
}
