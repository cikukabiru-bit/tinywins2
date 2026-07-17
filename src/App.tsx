import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Onboarding from './pages/Onboarding'
import HabitScore from './pages/HabitScore'
import HabitsList from './pages/HabitsList'
import NewHabit from './pages/NewHabit'
import EditHabit from './pages/EditHabit'
import Timeline from './pages/Timeline'
import Coach from './pages/Coach'
import Goals from './pages/Goals'
import NewGoal from './pages/NewGoal'
import EditGoal from './pages/EditGoal'
import Library from './pages/Library'
import NewLibraryItem from './pages/NewLibraryItem'
import EditLibraryItem from './pages/EditLibraryItem'
import Inspiration from './pages/Inspiration'
import NewInspiration from './pages/NewInspiration'
import EditInspiration from './pages/EditInspiration'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/today"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            }
          />
          <Route
            path="/habit-score"
            element={
              <ProtectedRoute>
                <HabitScore />
              </ProtectedRoute>
            }
          />
          <Route
            path="/habits"
            element={
              <ProtectedRoute>
                <HabitsList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/habits/new"
            element={
              <ProtectedRoute>
                <NewHabit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/habits/:id/edit"
            element={
              <ProtectedRoute>
                <EditHabit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/timeline"
            element={
              <ProtectedRoute>
                <Timeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/coach"
            element={
              <ProtectedRoute>
                <Coach />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals"
            element={
              <ProtectedRoute>
                <Goals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals/new"
            element={
              <ProtectedRoute>
                <NewGoal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/goals/:id/edit"
            element={
              <ProtectedRoute>
                <EditGoal />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library"
            element={
              <ProtectedRoute>
                <Library />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library/new"
            element={
              <ProtectedRoute>
                <NewLibraryItem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library/:id/edit"
            element={
              <ProtectedRoute>
                <EditLibraryItem />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library/inspiration"
            element={
              <ProtectedRoute>
                <Inspiration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library/inspiration/new"
            element={
              <ProtectedRoute>
                <NewInspiration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/library/inspiration/:id/edit"
            element={
              <ProtectedRoute>
                <EditInspiration />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
