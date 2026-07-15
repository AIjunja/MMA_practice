import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourcePath = path.join(root, 'data/source/gyeonggi-sigungu-2020.svg')
const outputPath = path.join(root, 'src/data/gyeonggi-map.json')

const svg = await fs.readFile(sourcePath, 'utf8')
const pathPattern = /<path d="([^"]+)"[^>]*id="([^"]+)"\/>/g
const grouped = new Map()

function regionFromId(id) {
  return id.split(' ')[0].replace(/[시군]$/, '')
}

function geometryFromPath(d) {
  const values = [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map(([value]) => Number(value))
  const points = []

  for (let index = 0; index < values.length; index += 2) {
    points.push([values[index], values[index + 1]])
  }

  let twiceArea = 0
  let centroidX = 0
  let centroidY = 0

  for (let index = 0; index < points.length; index += 1) {
    const [x1, y1] = points[index]
    const [x2, y2] = points[(index + 1) % points.length]
    const cross = x1 * y2 - x2 * y1
    twiceArea += cross
    centroidX += (x1 + x2) * cross
    centroidY += (y1 + y2) * cross
  }

  const area = Math.abs(twiceArea / 2)
  const divisor = 3 * twiceArea
  const centroid = Math.abs(divisor) > Number.EPSILON
    ? [centroidX / divisor, centroidY / divisor]
    : [
        points.reduce((sum, [x]) => sum + x, 0) / points.length,
        points.reduce((sum, [, y]) => sum + y, 0) / points.length,
      ]

  return { area, centroid }
}

for (const match of svg.matchAll(pathPattern)) {
  const [, d, id] = match
  const region = regionFromId(id)
  const geometry = geometryFromPath(d)
  const entry = grouped.get(region) ?? { region, displayName: id.split(' ')[0], paths: [], geometries: [] }
  entry.paths.push(d)
  entry.geometries.push(geometry)
  grouped.set(region, entry)
}

const labelOverrides = {
  광명: [271, 573],
  구리: [414, 468],
  군포: [312, 625],
  과천: [346, 578],
  안양: [320, 593],
  의왕: [360, 628],
  하남: [470, 535],
}

const regions = [...grouped.values()]
  .map((entry) => {
    const totalArea = entry.geometries.reduce((sum, geometry) => sum + geometry.area, 0)
    const label = entry.geometries.reduce(
      (result, geometry) => [
        result[0] + geometry.centroid[0] * geometry.area / totalArea,
        result[1] + geometry.centroid[1] * geometry.area / totalArea,
      ],
      [0, 0],
    )

    return {
      region: entry.region,
      displayName: entry.displayName,
      paths: entry.paths,
      label: (labelOverrides[entry.region] ?? label).map((value) => Number(value.toFixed(2))),
    }
  })
  .sort((a, b) => a.region.localeCompare(b.region, 'ko'))

if (regions.length !== 31) {
  throw new Error(`Expected 31 Gyeonggi regions, received ${regions.length}`)
}

await fs.writeFile(outputPath, `${JSON.stringify(regions, null, 2)}\n`, 'utf8')
console.log(`Prepared ${regions.length} Gyeonggi region shapes at ${path.relative(root, outputPath)}`)
