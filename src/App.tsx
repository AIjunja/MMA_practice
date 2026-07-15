import * as ToggleGroup from '@radix-ui/react-toggle-group'
import {
  BedDouble,
  BookOpen,
  Building2,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Database,
  Dumbbell,
  ExternalLink,
  Home,
  Info,
  Landmark,
  List,
  Map,
  MapPin,
  MapPinned,
  Phone,
  Search,
  Shapes,
  ShieldCheck,
  SquareParking,
  Stethoscope,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Button } from './components/Button'
import { CATEGORIES, countFor, displayRegion, facilitiesFor, mapRegions, photoFor, searchFacilities } from './lib/data'
import type { Category, Facility } from './types'

type Screen = 'region' | 'category' | 'facilities' | 'detail'
type RegionView = 'map' | 'list'

const CATEGORY_META = {
  교육: { icon: BookOpen, description: '학원·평생학습·교육시설' },
  문화: { icon: Landmark, description: '박물관·공연·문화시설' },
  '숙박&관광': { icon: BedDouble, description: '숙박·휴양림·관광시설' },
  의료: { icon: Stethoscope, description: '병원·보건소·건강검진' },
  주차: { icon: SquareParking, description: '공영·부설주차장' },
  체육: { icon: Dumbbell, description: '체육관·수영장·운동시설' },
  기타: { icon: Shapes, description: '그 밖의 예우시설과 혜택' },
} satisfies Record<Category, { icon: typeof BookOpen; description: string }>

const RECORD_TYPE_COPY: Record<Facility['recordType'], string> = {
  facility: '개별 시설',
  facility_group: '여러 시설을 묶은 안내',
  benefit_policy: '지역 공통 혜택',
  facility_unlocated: '주소 확인이 필요한 시설',
}

function App() {
  const [screen, setScreen] = useState<Screen>('region')
  const [regionView, setRegionView] = useState<RegionView>('map')
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null)
  const [query, setQuery] = useState('')
  const headingRef = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
    const timer = window.setTimeout(() => headingRef.current?.focus({ preventScroll: true }), 100)
    return () => window.clearTimeout(timer)
  }, [screen])

  const facilityResults = useMemo(() => {
    if (!selectedRegion || !selectedCategory) return []
    return searchFacilities(facilitiesFor(selectedRegion, selectedCategory), query)
  }, [selectedRegion, selectedCategory, query])
  const selectedPhoto = selectedFacility ? photoFor(selectedFacility) : null

  const chooseRegion = (region: string) => {
    setSelectedRegion(region)
    setSelectedCategory(null)
    setSelectedFacility(null)
    setQuery('')
    setScreen('category')
  }

  const chooseCategory = (category: Category) => {
    setSelectedCategory(category)
    setSelectedFacility(null)
    setQuery('')
    setScreen('facilities')
  }

  const openFacility = (facility: Facility) => {
    setSelectedFacility(facility)
    setScreen('detail')
  }

  const goHome = () => {
    setScreen('region')
    setRegionView('map')
    setSelectedRegion(null)
    setSelectedCategory(null)
    setSelectedFacility(null)
    setQuery('')
  }

  const goBack = () => {
    if (screen === 'detail') setScreen('facilities')
    if (screen === 'facilities') setScreen('category')
    if (screen === 'category') setScreen('region')
  }

  const step = screen === 'region' ? 1 : screen === 'category' ? 2 : 3

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">본문으로 바로가기</a>

      <header className="site-header">
        <button className="brand" type="button" onClick={goHome} aria-label="병역명문가 혜택찾기 처음으로">
          <span className="brand__mark"><ShieldCheck aria-hidden="true" /></span>
          <span>
            <strong>병역명문가 혜택찾기</strong>
            <small>경기도 예우시설 안내</small>
          </span>
        </button>
        <span className="data-date"><Database aria-hidden="true" /> 2026.04.30 기준</span>
      </header>

      <main id="main-content" className="main-content">
        <div className="progress-wrap" aria-label={`3단계 중 ${step}단계`}>
          <div className="progress-label"><span>혜택 찾기</span><strong>{step} / 3</strong></div>
          <div className="progress-track"><span style={{ width: `${(step / 3) * 100}%` }} /></div>
        </div>

        {screen !== 'region' && (
          <button className="back-button" type="button" onClick={goBack}>
            <ChevronLeft aria-hidden="true" /> 이전으로
          </button>
        )}

        {screen === 'region' && (
          <section className="screen screen--region" aria-labelledby="region-title">
            <div className="hero-copy">
              <span className="eyebrow">지역부터 천천히 골라보세요</span>
              <h1 id="region-title" ref={headingRef} tabIndex={-1}>어느 지역의 혜택을<br />찾으세요?</h1>
              <p>지도나 지역 이름을 누르면, 이용할 수 있는 업종을 바로 보여드려요.</p>
            </div>

            <div className="region-toolbar">
              <ToggleGroup.Root
                className="view-toggle"
                type="single"
                value={regionView}
                onValueChange={(value) => value && setRegionView(value as RegionView)}
                aria-label="지역 선택 방식"
              >
                <ToggleGroup.Item value="map" aria-label="지도에서 선택"><Map aria-hidden="true" /> 지도에서 선택</ToggleGroup.Item>
                <ToggleGroup.Item value="list" aria-label="지역 이름으로 선택"><List aria-hidden="true" /> 지역 이름으로 선택</ToggleGroup.Item>
              </ToggleGroup.Root>
              <span className="region-count">자료 등록 {mapRegions.filter((region) => facilitiesFor(region.region).length > 0).length} / {mapRegions.length}개 시군</span>
            </div>

            <div className="region-selector" data-view={regionView}>
              <div className="map-panel" aria-label="경기도 31개 시군 행정경계 지도">
                <div className="map-caption">
                  <MapPinned aria-hidden="true" />
                  <span>경기도 31개 시군 지도<small>실제 행정경계를 누르면 해당 지역의 혜택을 볼 수 있어요.</small></span>
                  <a href="https://github.com/statgarten/maps" target="_blank" rel="noreferrer">경계 출처 <ExternalLink aria-hidden="true" /></a>
                </div>
                <div className="gyeonggi-map">
                  <svg viewBox="-10 -10 820 964" role="img" aria-labelledby="gyeonggi-map-title gyeonggi-map-desc">
                    <title id="gyeonggi-map-title">경기도 시군 선택 지도</title>
                    <desc id="gyeonggi-map-desc">통계청 SGIS 행정경계를 바탕으로 만든 경기도 31개 시군 지도입니다. 색이 진한 지역은 혜택 자료가 등록되어 있습니다.</desc>
                    {mapRegions.map((shape) => {
                      const count = facilitiesFor(shape.region).length
                      const hasData = count > 0
                      return (
                        <g
                          key={shape.region}
                          className={`map-region ${hasData ? 'map-region--ready' : 'map-region--empty'}`}
                          role={hasData ? 'button' : 'img'}
                          tabIndex={hasData ? 0 : -1}
                          aria-label={hasData ? `${shape.displayName}, 등록 시설 ${count}곳 선택` : `${shape.displayName}, 등록 자료 없음`}
                          onClick={() => hasData && chooseRegion(shape.region)}
                          onKeyDown={(event) => {
                            if (hasData && (event.key === 'Enter' || event.key === ' ')) {
                              event.preventDefault()
                              chooseRegion(shape.region)
                            }
                          }}
                        >
                          <title>{shape.displayName} · {hasData ? `${count}곳` : '자료 없음'}</title>
                          {shape.paths.map((path, index) => <path d={path} key={`${shape.region}-${index}`} />)}
                          <text x={shape.label[0]} y={shape.label[1]}>{shape.region}</text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
                <div className="map-legend" aria-label="지도 범례">
                  <span><i className="map-legend__ready" />혜택 자료 있음</span>
                  <span><i className="map-legend__empty" />자료 없음</span>
                  <small>행정경계 기준 2020 · 혜택 데이터 기준 2026.04.30</small>
                </div>
              </div>

              <div className="region-list-panel">
                <div className="region-list-heading"><strong>지역 이름으로 찾기</strong><span>가나다순</span></div>
                <div className="region-grid">
                  {mapRegions.map(({ region }) => {
                    const count = facilitiesFor(region).length
                    return (
                    <button key={region} type="button" onClick={() => chooseRegion(region)} disabled={count === 0}>
                      <span>{displayRegion(region)}</span>
                      <small>{count > 0 ? `${count}곳` : '자료 없음'}</small>
                      <ChevronRight aria-hidden="true" />
                    </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <aside className="coming-soon" aria-label="준비 중인 기능">
              <span className="coming-soon__icon"><MapPin aria-hidden="true" /></span>
              <div><strong>가까운 군마트도 찾을 수 있게 준비하고 있어요</strong><p>현재 위치를 기준으로 PX와 군마트를 안내하는 기능은 다음 단계에서 제공할 예정입니다.</p></div>
              <span className="status-chip">준비 중</span>
            </aside>
          </section>
        )}

        {screen === 'category' && selectedRegion && (
          <section className="screen" aria-labelledby="category-title">
            <div className="screen-heading">
              <span className="eyebrow"><MapPin aria-hidden="true" /> {displayRegion(selectedRegion)}</span>
              <h1 id="category-title" ref={headingRef} tabIndex={-1}>어떤 시설을 찾으세요?</h1>
              <p>업종을 하나 골라주세요. 등록된 시설 수를 함께 확인할 수 있어요.</p>
            </div>

            <div className="category-grid">
              {CATEGORIES.map((category, index) => {
                const meta = CATEGORY_META[category]
                const Icon = meta.icon
                const count = countFor(selectedRegion, category)
                return (
                  <button
                    key={category}
                    type="button"
                    className="category-card"
                    style={{ '--delay': `${index * 35}ms` } as CSSProperties}
                    onClick={() => chooseCategory(category)}
                    disabled={count === 0}
                  >
                    <span className="category-card__number">0{index + 1}</span>
                    <span className="category-card__icon"><Icon aria-hidden="true" /></span>
                    <span className="category-card__copy"><strong>{category}</strong><small>{meta.description}</small></span>
                    <span className="category-card__count">{count}곳</span>
                    <ChevronRight className="category-card__arrow" aria-hidden="true" />
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {screen === 'facilities' && selectedRegion && selectedCategory && (
          <section className="screen" aria-labelledby="facilities-title">
            <nav className="breadcrumb" aria-label="선택 경로">
              <button type="button" onClick={() => setScreen('region')}>{displayRegion(selectedRegion)}</button>
              <ChevronRight aria-hidden="true" />
              <button type="button" onClick={() => setScreen('category')}>{selectedCategory}</button>
            </nav>
            <div className="screen-heading screen-heading--compact">
              <span className="eyebrow">등록된 혜택을 확인해 보세요</span>
              <h1 id="facilities-title" ref={headingRef} tabIndex={-1}>{displayRegion(selectedRegion)} {selectedCategory} 시설이에요</h1>
              <p>시설을 누르면 우대 대상, 비고와 연결 가능한 정보를 볼 수 있어요.</p>
            </div>

            <div className="search-bar">
              <Search aria-hidden="true" />
              <label className="sr-only" htmlFor="facility-search">시설 이름 또는 감면 내용으로 찾기</label>
              <input
                id="facility-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="시설 이름 또는 감면 내용으로 찾기"
              />
              {query && <button type="button" onClick={() => setQuery('')} aria-label="검색어 지우기"><X aria-hidden="true" /></button>}
            </div>

            <div className="result-summary" aria-live="polite">
              <strong>{facilityResults.length}곳</strong>
              <span>시설 정보는 이용 전에 한 번 더 확인해 주세요.</span>
            </div>

            {facilityResults.length > 0 ? (
              <div className="facility-list">
                {facilityResults.map((facility) => {
                  const photo = photoFor(facility)
                  const FacilityIcon = CATEGORY_META[facility.category].icon
                  return (
                    <article className="facility-row" key={facility.id}>
                      <button type="button" onClick={() => openFacility(facility)} aria-label={`${facility.name} 상세정보 보기`}>
                        <span className={`facility-row__visual ${photo ? 'facility-row__visual--photo' : ''}`}>
                          {photo
                            ? <img src={photo.imageUrl} alt="" loading="lazy" decoding="async" style={{ objectPosition: photo.objectPosition }} />
                            : <FacilityIcon aria-hidden="true" />}
                        </span>
                        <span className="facility-row__body">
                          <span className="facility-row__meta">
                            <span className={`benefit-badge benefit-badge--${facility.benefitType}`}>
                              {facility.benefitType === 'exemption' ? '면제' : '할인'}
                            </span>
                            {facility.provinceManaged && <span className="province-badge">경기도 운영</span>}
                            {facility.address && <span className="location-ready"><MapPin aria-hidden="true" /> 위치 정보 있음</span>}
                            {photo && <span className="photo-ready"><Camera aria-hidden="true" /> 시설 사진</span>}
                          </span>
                          <strong>{facility.name}</strong>
                          <p>{facility.benefit ?? '감면 내용 확인이 필요해요.'}</p>
                        </span>
                        <ChevronRight aria-hidden="true" />
                      </button>
                    </article>
                  )
                })}
              </div>
            ) : (
              <div className="empty-state">
                <Search aria-hidden="true" />
                <h2>찾는 시설이 없어요</h2>
                <p>시설 이름을 확인하거나 다른 업종을 선택해 보세요.</p>
                <Button variant="secondary" onClick={() => setScreen('category')}>다른 업종 보기</Button>
              </div>
            )}
          </section>
        )}

        {screen === 'detail' && selectedFacility && selectedRegion && selectedCategory && (
          <section className="screen detail-screen" aria-labelledby="detail-title">
            <nav className="breadcrumb" aria-label="선택 경로">
              <button type="button" onClick={() => setScreen('region')}>{displayRegion(selectedRegion)}</button>
              <ChevronRight aria-hidden="true" />
              <button type="button" onClick={() => setScreen('category')}>{selectedCategory}</button>
              <ChevronRight aria-hidden="true" />
              <button type="button" onClick={() => setScreen('facilities')}>시설 목록</button>
            </nav>

            <div className="detail-layout">
              {selectedPhoto ? (
                <figure className="detail-photo">
                  <img src={selectedPhoto.imageUrl} alt={selectedPhoto.alt} style={{ objectPosition: selectedPhoto.objectPosition }} />
                  <figcaption>
                    <span>사진 {selectedPhoto.author}</span>
                    <span><a href={selectedPhoto.sourceUrl} target="_blank" rel="noreferrer">원본 보기</a><i>·</i><a href={selectedPhoto.licenseUrl} target="_blank" rel="noreferrer">{selectedPhoto.license}</a></span>
                  </figcaption>
                </figure>
              ) : (
                <div className="detail-visual">
                  <span className="detail-visual__index">{String(CATEGORIES.indexOf(selectedFacility.category) + 1).padStart(2, '0')}</span>
                  {(() => { const Icon = CATEGORY_META[selectedFacility.category].icon; return <Icon aria-hidden="true" /> })()}
                  <span>{selectedFacility.category}</span>
                  <small>{selectedFacility.locationRegionDisplay}</small>
                </div>
              )}

              <div className="detail-content">
                <div className="detail-title-wrap">
                  <span className="eyebrow"><MapPin aria-hidden="true" /> {selectedFacility.locationRegionDisplay} · {selectedFacility.category}</span>
                  <h1 id="detail-title" ref={headingRef} tabIndex={-1}>{selectedFacility.name}</h1>
                  <div className="detail-badges">
                    <span className={`benefit-badge benefit-badge--${selectedFacility.benefitType}`}>
                      {selectedFacility.benefitType === 'exemption' ? '면제 혜택' : '할인 혜택'}
                    </span>
                    <span className="record-badge">{RECORD_TYPE_COPY[selectedFacility.recordType]}</span>
                  </div>
                </div>

                {selectedFacility.recordType !== 'facility' && (
                  <div className="info-callout"><Info aria-hidden="true" /><p>이 항목은 여러 시설이나 지역 공통 혜택을 묶은 안내일 수 있어요. 방문 전에 적용 시설을 확인해 주세요.</p></div>
                )}

                <dl className="detail-list">
                  <div><dt>우대 대상</dt><dd>{selectedFacility.eligibility ?? '확인 필요'}</dd></div>
                  <div><dt>감면 내용</dt><dd className="detail-list__benefit">{selectedFacility.benefit ?? '감면 내용 확인이 필요해요.'}</dd></div>
                  {selectedFacility.note && <div><dt>비고</dt><dd>{selectedFacility.note}</dd></div>}
                  {selectedFacility.address && <div><dt>주소</dt><dd>{selectedFacility.address}</dd></div>}
                  {selectedFacility.phoneDisplay && <div><dt>연락처</dt><dd>{selectedFacility.phoneDisplay}</dd></div>}
                </dl>

                <div className="detail-actions">
                  {selectedFacility.phoneTel && (
                    <a className="action-link action-link--primary" href={`tel:${selectedFacility.phoneTel}`}><Phone aria-hidden="true" /><span>전화하기</span></a>
                  )}
                  {selectedFacility.homepageUrl && (
                    <a className="action-link" href={selectedFacility.homepageUrl} target="_blank" rel="noreferrer"><ExternalLink aria-hidden="true" /><span>홈페이지 보기</span></a>
                  )}
                  {selectedFacility.address && (
                    <a className="action-link" href={`https://map.naver.com/p/search/${encodeURIComponent(selectedFacility.address)}`} target="_blank" rel="noreferrer"><MapPinned aria-hidden="true" /><span>지도에서 위치 보기</span></a>
                  )}
                </div>

                {!selectedFacility.phoneTel && !selectedFacility.homepageUrl && !selectedFacility.address && (
                  <div className="no-actions"><Info aria-hidden="true" /><p>연결 가능한 주소, 연락처와 홈페이지 정보가 아직 없어요.</p></div>
                )}

                <div className="trust-note"><CheckCircle2 aria-hidden="true" /><p><strong>이용 전에 확인해 주세요</strong><span>혜택과 운영 정보는 변경될 수 있습니다. 시설 또는 담당 기관에 적용 여부를 확인해 주세요.</span></p></div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="site-footer">
        <span><Building2 aria-hidden="true" /> 병역명문가 예우시설 안내</span>
        <button type="button" onClick={goHome}><Home aria-hidden="true" /> 처음으로</button>
      </footer>
    </div>
  )
}

export default App
