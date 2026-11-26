import { Outlet } from 'react-router'

import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'

// The frame around every logged-in page: the sidebar, plus the current page
// rendered where <Outlet /> is.
export function AppLayout() {
  const { session } = useAuth()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {/* Keyed by the user, so switching accounts starts the page afresh and
            it loads the new user's data instead of showing the last user's. */}
        <Outlet key={session?.user.id} />
      </SidebarInset>
    </SidebarProvider>
  )
}
