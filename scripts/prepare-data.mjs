import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import ExcelJS from 'exceljs'

const ROOT = process.cwd()
const INPUT = path.join(ROOT, 'data/source/facilities-2026-04-30.xlsx')
const OUTPUT = path.join(ROOT, 'src/data/facilities.json')
const QUALITY_OUTPUT = path.join(ROOT, 'data/quality-report.json')
const NAVER_MAPPING = path.join(ROOT, 'data/naver-map/facility-link-verification.json')
const DATA_DATE = '2026-04-30'

const REGION_NAMES = [
  '가평', '고양', '과천', '광명', '광주', '구리', '군포', '김포', '남양주',
  '동두천', '부천', '성남', '수원', '시흥', '안산', '안성', '안양', '양주',
  '양평', '여주', '연천', '오산', '용인', '의왕', '의정부', '이천', '파주',
  '평택', '포천', '하남', '화성',
]

const COUNTY_NAMES = new Set(['가평', '양평', '연천'])
const EMPTY_MARKERS = new Set(['', '-', '#VALUE!', '없음', '해당없음', 'N/A'])

function cleanText(value) {
  return String(value ?? '')
    .normalize('NFC')
    .replace(/[\u00a0\u2007\u202f\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function cellText(cell) {
  const value = cell.value
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value.richText)) return value.richText.map((part) => part.text ?? '').join('')
  if (typeof value.hyperlink === 'string') return value.text ?? value.hyperlink
  if ('formula' in value || 'sharedFormula' in value) {
    const result = value.result
    if (result && typeof result === 'object' && 'error' in result) return result.error
    return result ?? ''
  }
  if ('error' in value) return value.error
  return cell.text ?? ''
}

function nullable(value) {
  const cleaned = cleanText(value)
  return EMPTY_MARKERS.has(cleaned.toUpperCase()) ? null : cleaned
}

function displayRegion(region) {
  if (!region || region === '경기도') return region
  return `${region}${COUNTY_NAMES.has(region) ? '군' : '시'}`
}

function normalizeCategory(category) {
  return category === '숙박·관광' ? '숙박&관광' : category
}

function validUrl(value) {
  const cleaned = nullable(value)
  if (!cleaned) return null
  try {
    const url = new URL(cleaned)
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

function normalizePhone(value) {
  const display = nullable(value)
  if (!display || !/\d/.test(display)) return { display: null, tel: null }
  const normalizedDisplay = display.replace(/(\d)\.(?=\d)/g, '$1-')
  const tel = normalizedDisplay.replace(/[^0-9+]/g, '')
  return { display: normalizedDisplay, tel: tel || null }
}

function physicalRegionFromAddress(address) {
  if (!address) return null
  return REGION_NAMES.find((region) => address.includes(displayRegion(region))) ?? null
}

function needsCategoryReview(category, name) {
  return (
    (category === '기타' && /주차장|주차료|주차요금/.test(name)) ||
    (category === '기타' && /체육시설|체육관|수영장/.test(name)) ||
    (category === '기타' && /보건소|병원|의원|의료원/.test(name)) ||
    (category === '기타' && /박물관|미술관|문화예술회관/.test(name)) ||
    (category === '숙박&관광' && /주차장|주차료|주차요금/.test(name)) ||
    (category === '체육' && /부설주차장/.test(name))
  )
}

function classifyRecord(name, address) {
  if (address) return 'facility'
  if (/수강료|사용료|주관.?행사|입장료|주차요금|공연$/.test(name)) return 'benefit_policy'
  if (/공영주차장|체육시설|주민자치센터|공원시설|장사시설|보건소 및|시 운영/.test(name)) return 'facility_group'
  return 'facility_unlocated'
}

function stableId(parts) {
  return crypto.createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16)
}

const workbook = new ExcelJS.Workbook()
const [naverMappingRaw] = await Promise.all([
  fs.readFile(NAVER_MAPPING, 'utf8'),
  workbook.xlsx.readFile(INPUT),
])
const naverMapping = JSON.parse(naverMappingRaw)
const naverBySourceRow = new Map(naverMapping.rows.map((row) => [row.sourceRow, row]))
const worksheet = workbook.getWorksheet('경기도 관내 전체')
if (!worksheet) throw new Error('경기도 관내 전체 시트를 찾지 못했습니다.')

const headers = []
for (let column = 1; column <= 12; column += 1) {
  headers.push(cleanText(cellText(worksheet.getRow(1).getCell(column))))
}

const facilities = []
for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
  const row = worksheet.getRow(rowNumber)
  const source = Object.fromEntries(headers.map((header, index) => [header, cleanText(cellText(row.getCell(index + 1)))]))
  if (!source['시설명']) continue

  const jurisdictionRaw = source['지역']
  const categoryRaw = source['업종']
  const category = normalizeCategory(categoryRaw)
  const name = source['시설명']
  const address = nullable(source['주소'])
  const physicalRegion = physicalRegionFromAddress(address)
  const locationRegion = jurisdictionRaw === '경기도' ? physicalRegion : jurisdictionRaw
  const phone = normalizePhone(source['연락처'])
  const homepageUrl = validUrl(source['홈페이지 URL'])
  const benefit = nullable(source['감면 내용'])
  const note = nullable(source['비고'])
  const categoryReview = needsCategoryReview(category, name)
  const regionMismatch = Boolean(
    jurisdictionRaw !== '경기도' && physicalRegion && physicalRegion !== jurisdictionRaw,
  )
  const recordType = classifyRecord(name, address)
  const naverMatch = naverBySourceRow.get(rowNumber)
  const fallbackNaverQuery = address ? `${name} ${physicalRegion ?? jurisdictionRaw}`.replace(/\s+/g, ' ').trim() : null
  const naverMapQuery = naverMatch?.query ?? fallbackNaverQuery
  const naverMapUrl = address
    ? naverMatch?.naverMapUrl ?? `https://map.naver.com/p/search/${encodeURIComponent(naverMapQuery)}`
    : null

  const qualityFlags = []
  if (!benefit) qualityFlags.push('missing_benefit')
  if (!address) qualityFlags.push('missing_address')
  if (!phone.tel) qualityFlags.push('missing_phone')
  if (!homepageUrl) qualityFlags.push('missing_homepage')
  if (categoryReview) qualityFlags.push('category_review')
  if (regionMismatch) qualityFlags.push('region_address_mismatch')
  if (recordType !== 'facility') qualityFlags.push('aggregate_or_unlocated_record')

  facilities.push({
    id: stableId([jurisdictionRaw, name, address ?? '', benefit ?? '']),
    sourceRow: rowNumber,
    sourceSerial: Number(source['연번']) || null,
    dataDate: DATA_DATE,
    jurisdictionRaw,
    jurisdictionDisplay: displayRegion(jurisdictionRaw),
    locationRegion,
    locationRegionDisplay: displayRegion(locationRegion),
    provinceManaged: jurisdictionRaw === '경기도',
    categoryRaw,
    category,
    name,
    eligibility: nullable(source['우대 대상']),
    benefit,
    benefitType: source['면제/할인'] === '면제' ? 'exemption' : 'discount',
    institutionType: nullable(source['기관구분']),
    note,
    homepageUrl,
    address,
    phoneDisplay: phone.display,
    phoneTel: phone.tel,
    naverMapQuery,
    naverMapUrl,
    naverPlaceId: naverMatch?.naverPlaceId ?? null,
    naverMapVerified: naverMatch?.verified ?? false,
    naverMapVerificationStatus: naverMatch?.verificationStatus ?? (address ? 'not_browser_verified' : 'not_applicable_no_address'),
    recordType,
    geocodeStatus: address ? 'ready_for_geocoding' : 'missing_address',
    latitude: null,
    longitude: null,
    categoryReview,
    regionMismatch,
    qualityFlags,
  })
}

const count = (predicate) => facilities.filter(predicate).length
const qualityReport = {
  dataDate: DATA_DATE,
  sourceFile: path.basename(INPUT),
  generatedAt: new Date().toISOString(),
  total: facilities.length,
  categories: Object.fromEntries(
    [...new Set(facilities.map((item) => item.category))]
      .sort((a, b) => a.localeCompare(b, 'ko'))
      .map((category) => [category, count((item) => item.category === category)]),
  ),
  regions: [...new Set(facilities.map((item) => item.locationRegion).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ko')),
  missingAddress: count((item) => !item.address),
  missingPhone: count((item) => !item.phoneTel),
  missingHomepage: count((item) => !item.homepageUrl),
  missingBenefit: count((item) => !item.benefit),
  categoryReview: count((item) => item.categoryReview),
  regionMismatch: count((item) => item.regionMismatch),
  recordTypes: Object.fromEntries(
    ['facility', 'facility_group', 'benefit_policy', 'facility_unlocated']
      .map((type) => [type, count((item) => item.recordType === type)]),
  ),
  naverMap: {
    locatable: count((item) => Boolean(item.address)),
    verified: count((item) => item.naverMapVerified),
    exactPlaceLinks: count((item) => Boolean(item.naverPlaceId)),
    missingLinks: count((item) => Boolean(item.address) && !item.naverMapUrl),
  },
  reviewRows: facilities
    .filter((item) => item.categoryReview || item.regionMismatch || !item.benefit)
    .map(({ sourceRow, name, jurisdictionRaw, categoryRaw, qualityFlags }) => ({
      sourceRow,
      name,
      jurisdictionRaw,
      categoryRaw,
      qualityFlags,
    })),
}

await fs.mkdir(path.dirname(OUTPUT), { recursive: true })
await fs.writeFile(OUTPUT, `${JSON.stringify(facilities, null, 2)}\n`, 'utf8')
await fs.writeFile(QUALITY_OUTPUT, `${JSON.stringify(qualityReport, null, 2)}\n`, 'utf8')

console.log(`Prepared ${facilities.length} records from ${path.basename(INPUT)}`)
console.log(`Wrote ${path.relative(ROOT, OUTPUT)} and ${path.relative(ROOT, QUALITY_OUTPUT)}`)
