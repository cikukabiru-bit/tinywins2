import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { name, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Logout failed', error)
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-sunset-start via-sunset-mid to-sunset-end font-sans relative overflow-hidden">
      {/* Background ambient glowing effect */}
      <div className="absolute w-[300px] h-[300px] bg-sunset-end/20 rounded-full blur-3xl -translate-y-12 select-none pointer-events-none"></div>

      <div className="relative max-w-sm w-full bg-cream-light rounded-3xl border border-cream-dark/40 p-8 md:p-10 shadow-2xl shadow-plum-main/10 text-center z-10">
        <span className="inline-block text-[10px] tracking-[0.25em] uppercase text-plum-light/50 font-semibold mb-3">
          Dashboard
        </span>

        <h1 className="font-serif text-3xl md:text-4xl font-normal text-plum-dark italic leading-tight mb-4">
          {name ? `Welcome back, ${name}` : "You're in."}
        </h1>

        <p className="font-sans text-base text-plum-light leading-relaxed mb-8 max-w-[240px] mx-auto">
          You're in. Today dashboard coming soon.
        </p>

        <button
          onClick={handleLogout}
          className="w-full border border-plum-main/20 hover:border-plum-main/40 text-plum-main py-3 px-5 rounded-2xl font-medium tracking-wide transition-all duration-200 bg-cream-light/30 hover:bg-cream-light/60 text-sm cursor-pointer"
        >
          Log out
        </button>

        <div className="mt-8 pt-6 border-t border-plum-main/10 flex flex-col items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-sunset-end opacity-60"></span>
        </div>
      </div>
    </main>
  )
}
