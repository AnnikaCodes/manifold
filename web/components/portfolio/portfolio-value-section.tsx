import { formatMoney } from 'common/util/format'
import { last } from 'lodash'
import { memo, useRef, useState } from 'react'
import { usePortfolioHistory } from 'web/hooks/use-portfolio-history'
import { Period } from 'web/lib/firebase/users'
import { Col } from '../layout/col'
import { Row } from '../layout/row'
import { PortfolioValueGraph } from './portfolio-value-graph'

export const PortfolioValueSection = memo(
  function PortfolioValueSection(props: { userId: string }) {
    const { userId } = props

    const [portfolioPeriod, setPortfolioPeriod] = useState<Period>('weekly')
    const portfolioHistory = usePortfolioHistory(userId, portfolioPeriod)

    // Remember the last defined portfolio history.
    const portfolioRef = useRef(portfolioHistory)
    if (portfolioHistory) portfolioRef.current = portfolioHistory
    const currPortfolioHistory = portfolioRef.current

    const lastPortfolioMetrics = last(currPortfolioHistory)
    if (!currPortfolioHistory || !lastPortfolioMetrics) {
      return <></>
    }

    const { balance, investmentValue } = lastPortfolioMetrics
    const totalValue = balance + investmentValue

    return (
      <>
        <Row className="gap-8">
          <Col className="flex-1 justify-center">
            <div className="text-sm text-gray-500">Portfolio value</div>
            <div className="text-lg">{formatMoney(totalValue)}</div>
          </Col>
          <select
            className="select select-bordered self-start"
            value={portfolioPeriod}
            onChange={(e) => {
              setPortfolioPeriod(e.target.value as Period)
            }}
          >
            <option value="allTime">All time</option>
            <option value="weekly">Last 7d</option>
            <option value="daily">Last 24h</option>
          </select>
        </Row>
        <PortfolioValueGraph
          portfolioHistory={currPortfolioHistory}
          includeTime={portfolioPeriod == 'daily'}
        />
      </>
    )
  }
)
