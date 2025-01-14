import { useEffect, useState } from 'react'
import { Contract } from 'common/contract'
import {
  Bet,
  listenForBets,
  listenForRecentBets,
  listenForUnfilledBets,
  withoutAnteBets,
} from 'web/lib/firebase/bets'
import { LimitBet } from 'common/bet'

export const useBets = (
  contractId: string,
  options?: { filterChallenges: boolean; filterRedemptions: boolean }
) => {
  const [bets, setBets] = useState<Bet[] | undefined>()
  const filterChallenges = !!options?.filterChallenges
  const filterRedemptions = !!options?.filterRedemptions
  useEffect(() => {
    if (contractId)
      return listenForBets(contractId, (bets) => {
        if (filterChallenges || filterRedemptions)
          setBets(
            bets.filter(
              (bet) =>
                (filterChallenges ? !bet.challengeSlug : true) &&
                (filterRedemptions ? !bet.isRedemption : true)
            )
          )
        else setBets(bets)
      })
  }, [contractId, filterChallenges, filterRedemptions])

  return bets
}

export const useBetsWithoutAntes = (contract: Contract, initialBets: Bet[]) => {
  const [bets, setBets] = useState<Bet[]>(
    withoutAnteBets(contract, initialBets)
  )

  useEffect(() => {
    return listenForBets(contract.id, (bets) => {
      setBets(withoutAnteBets(contract, bets))
    })
  }, [contract])

  return bets
}

export const useRecentBets = () => {
  const [recentBets, setRecentBets] = useState<Bet[] | undefined>()
  useEffect(() => listenForRecentBets(setRecentBets), [])
  return recentBets
}

export const useUnfilledBets = (contractId: string) => {
  const [unfilledBets, setUnfilledBets] = useState<LimitBet[] | undefined>()
  useEffect(
    () => listenForUnfilledBets(contractId, setUnfilledBets),
    [contractId]
  )
  return unfilledBets
}
