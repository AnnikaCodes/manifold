import { BellIcon } from '@heroicons/react/outline'
import clsx from 'clsx'
import { Row } from 'web/components/layout/row'
import { useEffect, useState } from 'react'
import { usePrivateUser } from 'web/hooks/use-user'
import { useRouter } from 'next/router'
import { useUnseenGroupedNotification } from 'web/hooks/use-notifications'
import { NOTIFICATIONS_PER_PAGE } from 'web/pages/notifications'
import { PrivateUser } from 'common/user'

export default function NotificationsIcon(props: { className?: string }) {
  const privateUser = usePrivateUser()

  return (
    <Row className={clsx('justify-center')}>
      <div className={'relative'}>
        {privateUser && <UnseenNotificationsBubble privateUser={privateUser} />}
        <BellIcon className={clsx(props.className)} />
      </div>
    </Row>
  )
}
function UnseenNotificationsBubble(props: { privateUser: PrivateUser }) {
  const router = useRouter()
  const { privateUser } = props
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    if (router.pathname.endsWith('notifications')) return setSeen(true)
    else setSeen(false)
  }, [router.pathname])

  const notifications = useUnseenGroupedNotification(privateUser)
  if (!notifications || notifications.length === 0 || seen) {
    return <div />
  }

  return (
    <div className="-mt-0.75 absolute ml-3.5 min-w-[15px] rounded-full bg-indigo-500 p-[2px] text-center text-[10px] leading-3 text-white lg:-mt-1 lg:ml-2">
      {notifications.length > NOTIFICATIONS_PER_PAGE
        ? `${NOTIFICATIONS_PER_PAGE}+`
        : notifications.length}
    </div>
  )
}
