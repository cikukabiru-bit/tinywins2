import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'

export type Theme = 'sunset' | 'peach' | 'teal' | 'plum' | 'dark' | 'device'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => Promise<void>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth()
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('tinywins_theme') as Theme) || 'sunset'
  })

  // Function to apply theme to document root
  const applyTheme = (targetTheme: Theme) => {
    let resolved: string = targetTheme
    if (targetTheme === 'device') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'sunset'
    }
    document.documentElement.setAttribute('data-theme', resolved)
  }

  // Effect to apply theme whenever it changes
  useEffect(() => {
    applyTheme(theme)
    localStorage.setItem('tinywins_theme', theme)

    // Listen to device preference change if 'device' theme is active
    if (theme === 'device') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => {
        applyTheme('device')
      }
      mediaQuery.addEventListener('change', listener)
      return () => mediaQuery.removeEventListener('change', listener)
    }
  }, [theme])

  // Sync with database profile on auth user load
  useEffect(() => {
    if (!user) return

    const syncThemeFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('theme')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!error && data?.theme) {
          const dbTheme = data.theme as Theme
          setThemeState(currentTheme => currentTheme !== dbTheme ? dbTheme : currentTheme)
        }
      } catch (err) {
        console.error('Failed to sync theme from database:', err)
      }
    }

    syncThemeFromDb()
  }, [user])

  // Setter function that updates state, localStorage, and DB
  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('tinywins_theme', newTheme)
    applyTheme(newTheme)

    if (user) {
      try {
        await supabase
          .from('profiles')
          .update({
            theme: newTheme,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
      } catch (err) {
        // Fail silently so theme change still works locally if DB connection fails
        console.error('Failed to save theme preference to user profile:', err)
      }
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
