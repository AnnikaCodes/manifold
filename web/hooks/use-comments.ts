import { useEffect, useState } from 'react'
import { Comment, ContractComment, GroupComment } from 'common/comment'
import {
  listenForCommentsOnContract,
  listenForCommentsOnGroup,
  listenForRecentComments,
} from 'web/lib/firebase/comments'

export const useComments = (contractId: string) => {
  const [comments, setComments] = useState<ContractComment[] | undefined>()

  useEffect(() => {
    if (contractId) return listenForCommentsOnContract(contractId, setComments)
  }, [contractId])

  return comments
}
export const useCommentsOnGroup = (groupId: string | undefined) => {
  const [comments, setComments] = useState<GroupComment[] | undefined>()

  useEffect(() => {
    if (groupId) return listenForCommentsOnGroup(groupId, setComments)
  }, [groupId])

  return comments
}

export const useRecentComments = () => {
  const [recentComments, setRecentComments] = useState<Comment[] | undefined>()
  useEffect(() => listenForRecentComments(setRecentComments), [])
  return recentComments
}
