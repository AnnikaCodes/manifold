import { DatumValue } from '@nivo/core'
import { ResponsiveLine, SliceTooltipProps } from '@nivo/line'
import { BasicTooltip } from '@nivo/tooltip'
import dayjs from 'dayjs'
import { memo } from 'react'
import { Bet } from 'common/bet'
import { getInitialProbability } from 'common/calculate'
import { BinaryContract, PseudoNumericContract } from 'common/contract'
import { useWindowSize } from 'web/hooks/use-window-size'
import { formatLargeNumber } from 'common/util/format'

export const ContractProbGraph = memo(function ContractProbGraph(props: {
  contract: BinaryContract | PseudoNumericContract
  bets: Bet[]
  height?: number
}) {
  const { contract, height } = props
  const { resolutionTime, closeTime, outcomeType } = contract
  const now = Date.now()
  const isBinary = outcomeType === 'BINARY'
  const isLogScale = outcomeType === 'PSEUDO_NUMERIC' && contract.isLogScale

  const bets = props.bets.filter((bet) => !bet.isAnte && !bet.isRedemption)

  const startProb = getInitialProbability(contract)

  const times = [contract.createdTime, ...bets.map((bet) => bet.createdTime)]

  const f: (p: number) => number = isBinary
    ? (p) => p
    : isLogScale
    ? (p) => p * Math.log10(contract.max - contract.min + 1)
    : (p) => p * (contract.max - contract.min) + contract.min

  const probs = [startProb, ...bets.map((bet) => bet.probAfter)].map(f)

  const isClosed = !!closeTime && now > closeTime
  const latestTime = dayjs(
    resolutionTime && isClosed
      ? Math.min(resolutionTime, closeTime)
      : isClosed
      ? closeTime
      : resolutionTime ?? now
  )

  // Add a fake datapoint so the line continues to the right
  times.push(latestTime.valueOf())
  probs.push(probs[probs.length - 1])

  const quartiles = [0, 25, 50, 75, 100]

  const yTickValues = isBinary
    ? quartiles
    : quartiles.map((x) => x / 100).map(f)

  const { width } = useWindowSize()

  const numXTickValues = !width || width < 800 ? 2 : 5
  const startDate = dayjs(times[0])
  const endDate = startDate.add(1, 'hour').isAfter(latestTime)
    ? latestTime.add(1, 'hours')
    : latestTime
  const includeMinute = endDate.diff(startDate, 'hours') < 2

  // Minimum number of points for the graph to have. For smooth tooltip movement
  // If we aren't actually loading any data yet, skip adding extra points to let page load faster
  // This fn runs again once DOM is finished loading
  const totalPoints = width && bets.length ? (width > 800 ? 300 : 50) : 1

  const timeStep: number = latestTime.diff(startDate, 'ms') / totalPoints

  const points: { x: Date; y: number }[] = []
  const s = isBinary ? 100 : 1

  for (let i = 0; i < times.length - 1; i++) {
    const p = probs[i]
    const d0 = times[i]
    const d1 = times[i + 1]
    const msDiff = d1 - d0
    const numPoints = Math.floor(msDiff / timeStep)
    points.push({ x: new Date(times[i]), y: s * p })
    if (numPoints > 1) {
      const thisTimeStep: number = msDiff / numPoints
      for (let n = 1; n < numPoints; n++) {
        points.push({ x: new Date(d0 + thisTimeStep * n), y: s * p })
      }
    }
  }

  const data = [
    { id: 'Yes', data: points, color: isBinary ? '#11b981' : '#5fa5f9' },
  ]

  const multiYear = !startDate.isSame(latestTime, 'year')
  const lessThanAWeek = startDate.add(8, 'day').isAfter(latestTime)

  const formatter = isBinary
    ? formatPercent
    : isLogScale
    ? (x: DatumValue) =>
        formatLargeNumber(10 ** +x.valueOf() + contract.min - 1)
    : (x: DatumValue) => formatLargeNumber(+x.valueOf())

  return (
    <div
      className="w-full overflow-visible"
      style={{ height: height ?? (!width || width >= 800 ? 350 : 250) }}
    >
      <ResponsiveLine
        data={data}
        yScale={
          isBinary
            ? { min: 0, max: 100, type: 'linear' }
            : isLogScale
            ? {
                min: 0,
                max: Math.log10(contract.max - contract.min + 1),
                type: 'linear',
              }
            : { min: contract.min, max: contract.max, type: 'linear' }
        }
        yFormat={formatter}
        gridYValues={yTickValues}
        axisLeft={{
          tickValues: yTickValues,
          format: formatter,
        }}
        xScale={{
          type: 'time',
          min: startDate.toDate(),
          max: endDate.toDate(),
        }}
        xFormat={(d) =>
          formatTime(now, +d.valueOf(), multiYear, lessThanAWeek, lessThanAWeek)
        }
        axisBottom={{
          tickValues: numXTickValues,
          format: (time) =>
            formatTime(now, +time, multiYear, lessThanAWeek, includeMinute),
        }}
        colors={{ datum: 'color' }}
        curve="stepAfter"
        enablePoints={false}
        pointBorderWidth={1}
        pointBorderColor="#fff"
        enableSlices="x"
        enableGridX={!!width && width >= 800}
        enableArea
        areaBaselineValue={isBinary || isLogScale ? 0 : contract.min}
        margin={{ top: 20, right: 20, bottom: 25, left: 40 }}
        animate={false}
        sliceTooltip={SliceTooltip}
      />
    </div>
  )
})

const SliceTooltip = ({ slice }: SliceTooltipProps) => {
  return (
    <BasicTooltip
      id={slice.points.map((point) => [
        <span key="date">
          <strong>{point.data[`yFormatted`]}</strong> {point.data['xFormatted']}
        </span>,
      ])}
    />
  )
}

function formatPercent(y: DatumValue) {
  return `${Math.round(+y.toString())}%`
}

function formatTime(
  now: number,
  time: number,
  includeYear: boolean,
  includeHour: boolean,
  includeMinute: boolean
) {
  const d = dayjs(time)
  if (d.add(1, 'minute').isAfter(now) && d.subtract(1, 'minute').isBefore(now))
    return 'Now'

  let format: string
  if (d.isSame(now, 'day')) {
    format = '[Today]'
  } else if (d.add(1, 'day').isSame(now, 'day')) {
    format = '[Yesterday]'
  } else {
    format = 'MMM D'
  }

  if (includeMinute) {
    format += ', h:mma'
  } else if (includeHour) {
    format += ', ha'
  } else if (includeYear) {
    format += ', YYYY'
  }

  return d.format(format)
}
