import { Navigate, Route, Routes } from 'react-router'

import { AppLayout } from '@/components/app-layout'
import { RequireAuth, RequireGuest } from '@/components/auth/route-guards'
import { HomePage } from '@/pages/home-page'
import { LoginPage } from '@/pages/login-page'
import { SignupPage } from '@/pages/signup-page'
import { MeetingView } from '@/pages/meeting-view'
import { Toaster } from '@/components/ui/sonner'

// Every page in the app and who may see it.
function App() {
  return (
    <>
    <Routes>
      {/* Only for visitors who are not logged in. */}
      <Route element={<RequireGuest />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>

      {/* Only for logged-in users, inside the sidebar layout. */}
      <Route element={<RequireAuth />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          {/* A fixed path wins over :meetingId, so "new" is never read as a meeting id.
              The upload area lives on the homepage, so this goes there. */}
          <Route path="/meetings/new" element={<Navigate to="/" replace />} />
          <Route path="/meetings/:meetingId" element={<MeetingView />} />
        </Route>
      </Route>

      {/* Any other address goes home, which sends visitors to the login page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    {/* Shows toasts from any page. Outside <Routes>, so it stays while pages change. */}
    <Toaster position="bottom-right" />
</>
  )
}

export default App
