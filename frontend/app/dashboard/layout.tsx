'use client'

import { usePathname } from 'next/navigation'
import AIChatFloatingButton from '@/components/AIChatFloatingButton'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Don't show AI Chat Assistant floating button on SmartBill page
  // (SmartBill has its own dedicated chatbot)
  const isSmartBillPage = pathname === '/dashboard/bills'
  
  return (
    <>
      {children}
      {!isSmartBillPage && <AIChatFloatingButton />}
    </>
  )
}

