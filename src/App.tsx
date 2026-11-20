import { useEffect, useState } from 'react'

import { AppSidebar } from '@/components/app-sidebar'
import { NewMeetingPanel } from '@/components/new-meeting-panel'
import { RecentMeetings } from '@/components/recent-meetings'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { getRecentMeetings, type Meeting } from '@/lib/meetings'

function App() {
  // Null while the meetings are loading.
  const [meetings, setMeetings] = useState<Meeting[] | null>(null)

  useEffect(() => {
    // Ignores the result if the page unmounts before the request finishes.
    let ignore = false
    getRecentMeetings().then((result) => {
      if (!ignore) setMeetings(result)
    })
    return () => {
      ignore = true
    }
  }, [])

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 items-center gap-2 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg">Meetings</h1>
        </header>

        {meetings === null ? null : meetings.length > 0 ? (
          // Two columns from the lg breakpoint. On smaller screens the upload
          // moves above the list, as it is the main action.
          <main className="grid flex-1 grid-cols-1 content-start gap-10 p-6 lg:grid-cols-2 lg:p-10">
            <RecentMeetings meetings={meetings} />
            <div className="order-first lg:order-none">
              <NewMeetingPanel align="start" />
            </div>
          </main>
        ) : (
          <main className="flex flex-1 items-center justify-center p-6">
            <div className="w-full max-w-xl">
              <NewMeetingPanel align="center" />
            </div>
          </main>
        )}
      </SidebarInset>
    </SidebarProvider>
  )
}

export default App
