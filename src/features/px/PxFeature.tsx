import {
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Info,
  MapPin,
  MapPinned,
  Phone,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingBasket,
  X,
} from 'lucide-react'
import { useMemo, useState, type KeyboardEvent, type RefObject } from 'react'
import { Button } from '../../components/Button'
import { displayRegion, mapRegions } from '../../lib/data'
import { filterPxStores, pxDataset, pxRegions, pxStores } from './data'
import type { PxStore } from './types'

interface PxFinderProps {
  headingRef: RefObject<HTMLHeadingElement | null>
  onOpenStore: (store: PxStore) => void
}

interface PxDetailProps {
  headingRef: RefObject<HTMLHeadingElement | null>
  store: PxStore
}

function activateWithKeyboard(event: KeyboardEvent<SVGGElement>, action: () => void) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    action()
  }
}

function availableLunchHours(store: PxStore) {
  return [
    ['평일', store.lunchHours.weekday],
    ['토요일', store.lunchHours.saturday],
    ['일요일', store.lunchHours.sunday],
  ].filter((item): item is [string, string] => Boolean(item[1]))
}

export function PxFinder({ headingRef, onOpenStore }: PxFinderProps) {
  const [query, setQuery] = useState('')
  const [selectedRegion, setSelectedRegion] = useState('')
  const results = useMemo(
    () => filterPxStores(pxStores, query, selectedRegion),
    [query, selectedRegion],
  )
  const visibleIds = useMemo(() => new Set(results.map((store) => store.id)), [results])

  const resetFilters = () => {
    setQuery('')
    setSelectedRegion('')
  }

  return (
    <section className="screen px-finder" aria-labelledby="px-title">
      <div className="px-hero">
        <span className="eyebrow"><ShoppingBasket aria-hidden="true" /> 경기도 영외마트 49곳</span>
        <h1 id="px-title" ref={headingRef} tabIndex={-1}>경기도 군마트<br />찾기</h1>
        <p>가까운 영외마트의 위치와 운영시간을 확인해 보세요.</p>
      </div>

      <div className="px-filter-panel" aria-label="군마트 검색과 지역 선택">
        <div className="px-search-field">
          <label htmlFor="px-search">군마트 검색</label>
          <div className="px-search-control">
            <Search aria-hidden="true" />
            <input
              id="px-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="지역이나 군마트 이름 검색"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="PX 검색어 지우기">
                <X aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        <div className="px-region-field">
          <label htmlFor="px-region">지역 선택</label>
          <select id="px-region" value={selectedRegion} onChange={(event) => setSelectedRegion(event.target.value)}>
            <option value="">경기도 전체 {pxStores.length}곳</option>
            {pxRegions.map(({ region, count }) => (
              <option value={region} key={region}>{displayRegion(region)} {count}곳</option>
            ))}
          </select>
        </div>

        {(query || selectedRegion) && (
          <button className="px-reset" type="button" onClick={resetFilters}>
            <RotateCcw aria-hidden="true" /> 조건 초기화
          </button>
        )}
      </div>

      <div className="px-result-heading" aria-live="polite">
        <div>
          <strong>{selectedRegion ? displayRegion(selectedRegion) : '경기도'} {results.length}곳</strong>
          <span>지도의 점이나 아래 매장을 누르면 상세정보를 볼 수 있어요.</span>
        </div>
        <span className="px-result-heading__date"><Database aria-hidden="true" /> {pxDataset.metadata.officialReferenceDate.replaceAll('-', '.')} 기준</span>
      </div>

      <div className="px-map-card">
        <div className="px-map-card__heading">
          <MapPinned aria-hidden="true" />
          <div><strong>경기도 PX 위치</strong><span>행정경계를 단순화한 도식 지도예요. 점을 눌러 매장을 선택해 주세요.</span></div>
        </div>
        <div className="px-map-wrap">
          <svg viewBox="-10 -10 820 964" role="img" aria-labelledby="px-map-title px-map-desc">
            <title id="px-map-title">경기도 군마트 위치 지도</title>
            <desc id="px-map-desc">경기도 31개 시군 경계와 검색 결과에 포함된 영외마트 위치를 점으로 표시한 지도입니다.</desc>
            {mapRegions.map((shape) => {
              const regionCount = pxRegions.find((item) => item.region === shape.region)?.count ?? 0
              const isSelected = selectedRegion === shape.region
              return (
                <g
                  key={shape.region}
                  className={`px-map-region ${regionCount ? 'px-map-region--ready' : ''} ${isSelected ? 'px-map-region--selected' : ''}`}
                  role={regionCount ? 'button' : 'img'}
                  tabIndex={regionCount ? 0 : -1}
                  aria-label={regionCount ? `${shape.displayName} 군마트 ${regionCount}곳 필터링` : `${shape.displayName} 등록 매장 없음`}
                  onClick={() => regionCount && setSelectedRegion(shape.region)}
                  onKeyDown={(event) => regionCount && activateWithKeyboard(event, () => setSelectedRegion(shape.region))}
                >
                  <title>{shape.displayName} · {regionCount ? `${regionCount}곳` : '등록 매장 없음'}</title>
                  {shape.paths.map((path, index) => <path d={path} key={`${shape.region}-${index}`} />)}
                  <text x={shape.label[0]} y={shape.label[1]}>{shape.region}</text>
                </g>
              )
            })}
            <g className="px-markers" aria-label="PX 매장 마커">
              {pxStores.filter((store) => visibleIds.has(store.id) && store.svgX !== null && store.svgY !== null).map((store) => (
                <g
                  className="px-marker"
                  key={store.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${store.name} 군마트 상세정보 보기`}
                  transform={`translate(${store.svgX} ${store.svgY})`}
                  onClick={() => onOpenStore(store)}
                  onKeyDown={(event) => activateWithKeyboard(event, () => onOpenStore(store))}
                >
                  <title>{store.name} · {store.region}</title>
                  <circle className="px-marker__halo" r="13" />
                  <circle className="px-marker__dot" r="7" />
                </g>
              ))}
            </g>
          </svg>
        </div>
        <div className="px-map-legend">
          <span><i className="px-map-legend__region" />PX 있는 시군</span>
          <span><i className="px-map-legend__marker" />영외마트</span>
          <small>지도는 지역별 위치를 직관적으로 보기 위한 도식입니다.</small>
        </div>
      </div>

      {results.length > 0 ? (
        <div className="px-store-list" aria-label="검색된 군마트 목록">
          {results.map((store) => (
            <article className="px-store-card" key={store.id}>
              <button type="button" onClick={() => onOpenStore(store)} aria-label={`${store.name} 상세정보 보기`}>
                <span className="px-store-card__icon"><ShoppingBasket aria-hidden="true" /></span>
                <span className="px-store-card__body">
                  <span className="px-store-card__meta"><MapPin aria-hidden="true" /> {displayRegion(store.region)}</span>
                  <strong>{store.name}</strong>
                  <span className="px-store-card__address">{store.address}</span>
                  <span className="px-store-card__hours"><Clock3 aria-hidden="true" /> 평일 {store.hours.weekday}</span>
                </span>
                <span className="px-store-card__action">상세보기 <ExternalLink aria-hidden="true" />
                </span>
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state px-empty-state">
          <Search aria-hidden="true" />
          <h2>검색 결과가 없어요</h2>
          <p>지역명이나 군마트 이름을 다시 확인해 주세요.</p>
          <Button variant="secondary" onClick={resetFilters}>조건 초기화</Button>
        </div>
      )}

      <aside className="px-notice" aria-labelledby="px-notice-title">
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong id="px-notice-title">방문 전에 확인해 주세요</strong>
          <p>군마트는 이용 자격 확인이 필요해요. 대상자별 준비 서류가 다를 수 있으니 방문 전 국군복지포털에서 확인해 주세요.</p>
          <p>운영시간은 바뀔 수 있어요. 방문 전 매장 또는 국군복지포털에서 다시 확인해 주세요.</p>
        </div>
        <a href="https://www.welfare.mil.kr" target="_blank" rel="noopener noreferrer">이용 자격 확인 <ExternalLink aria-hidden="true" />
        </a>
      </aside>

      <div className="px-source-note">
        <Database aria-hidden="true" />
        <span>데이터 기준일 2026. 4. 28. · 출처 국방부 국군복지단</span>
        <a href={pxDataset.metadata.officialDataUrl} target="_blank" rel="noopener noreferrer">공식 데이터 보기 <ExternalLink aria-hidden="true" /></a>
      </div>
    </section>
  )
}

export function PxDetail({ headingRef, store }: PxDetailProps) {
  const lunchHours = availableLunchHours(store)

  return (
    <section className="screen px-detail" aria-labelledby="px-detail-title">
      <div className="px-detail-layout">
        <div className="px-detail-visual" aria-hidden="true">
          <span className="px-detail-visual__region">{displayRegion(store.region)}</span>
          <ShoppingBasket />
          <strong>PX</strong>
          <span>국군복지단 영외마트</span>
          <MapPin className="px-detail-visual__pin" />
        </div>

        <div className="px-detail-content">
          <div className="px-detail-title">
            <span className="eyebrow"><MapPin aria-hidden="true" /> {displayRegion(store.region)} · 영외마트</span>
            <h1 id="px-detail-title" ref={headingRef} tabIndex={-1}>{store.name}</h1>
            <p>{store.address}</p>
          </div>

          <dl className="px-detail-list">
            <div><dt>주소</dt><dd>{store.address}</dd></div>
            <div>
              <dt>영업시간</dt>
              <dd className="px-hours-grid">
                <span><small>평일</small><strong>{store.hours.weekday}</strong></span>
                <span><small>토요일</small><strong>{store.hours.saturday}</strong></span>
                <span><small>일요일</small><strong>{store.hours.sunday}</strong></span>
              </dd>
            </div>
            {lunchHours.length > 0 && (
              <div>
                <dt>점심시간</dt>
                <dd className="px-lunch-hours">
                  {lunchHours.map(([day, hours]) => <span key={day}>{day} {hours}</span>)}
                </dd>
              </div>
            )}
            {store.note && <div><dt>비고</dt><dd>{store.note}</dd></div>}
            {store.phone && <div><dt>연락처</dt><dd>{store.phone}</dd></div>}
          </dl>

          <div className="px-detail-actions">
            <a className="action-link action-link--primary" href={store.naverMapUrl} target="_blank" rel="noopener noreferrer">
              <MapPinned aria-hidden="true" /> <span>네이버지도에서 보기</span>
            </a>
            <a className="action-link" href={store.welfarePortalUrl} target="_blank" rel="noopener noreferrer">
              <ShieldCheck aria-hidden="true" /> <span>국군복지포털에서 이용 자격 확인</span>
            </a>
            {store.phone && (
              <a className="action-link" href={`tel:${store.phone.replace(/\s/g, '')}`}>
                <Phone aria-hidden="true" /> <span>매장에 전화하기</span>
              </a>
            )}
          </div>

          <div className="px-detail-warning">
            <Info aria-hidden="true" />
            <p><strong>운영정보를 다시 확인해 주세요</strong><span>재물조사, 임시 휴점, 신분별 분리 운영으로 시간이 바뀔 수 있어요. 방문 전 매장이나 국군복지포털에서 확인해 주세요.</span></p>
          </div>

          <div className="px-detail-source">
            <CheckCircle2 aria-hidden="true" />
            <p><strong>국방부 공식 운영 현황 기준</strong><span>2026. 4. 28. · 좌표는 도식 지도 표시용 후보값이며 정밀 길찾기에 사용하지 않아요.</span></p>
          </div>
        </div>
      </div>
    </section>
  )
}
