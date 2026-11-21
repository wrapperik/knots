import { Navigate, Route, Routes } from 'react-router'

import { AppLayout } from '@/components/app-layout'
import { RequireAuth, RequireGuest } from '@/components/auth/route-guards'
import { HomePage } from '@/pages/home-page'
import { LoginPage } from '@/pages/login-page'
import { SignupPage } from '@/pages/signup-page'

// Every page in the app and who may see it.
function App() {
  return (
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
        </Route>
      </Route>

      {/* Any other address goes home, which sends visitors to the login page. */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
