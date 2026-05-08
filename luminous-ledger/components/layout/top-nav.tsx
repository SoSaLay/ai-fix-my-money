'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { supabaseConfigured, createClient } from '@/lib/supabase/client'

interface TopNavProps {
  title: string
}

export function TopNav({ title }: TopNavProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSignOut = async () => {
    try {
      if (supabaseConfigured) {
        const supabase = createClient()
        await supabase.auth.signOut()
      }
    } catch {
      // ignore sign-out errors
    }
    router.push('/login')
  }

  return (
    <header className="flex items-center justify-between px-8 py-5">
      {/* Page title */}
      <h1 className="text-headline-lg text-on-surface">{title}</h1>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* User avatar + dropdown */}
        <div ref={menuRef} className="relative">
          <div
            className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-label-md font-semibold text-on-surface-variant cursor-pointer hover:bg-surface-container-high transition-colors duration-150"
            role="button"
            tabIndex={0}
            aria-label="User menu"
            onClick={() => setShowMenu(m => !m)}
            onKeyDown={e => e.key === 'Enter' && setShowMenu(m => !m)}
          >
            U
          </div>

          {showMenu && (
            <div
              className="absolute right-0 top-full mt-2 z-50 bg-surface-container-lowest rounded-xl shadow-lg border border-surface-container-high overflow-hidden"
              style={{ minWidth: 160 }}
            >
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-label-md text-on-surface hover:bg-surface-container transition-colors text-left"
              >
                <LogOut size={15} className="text-on-surface-variant" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
