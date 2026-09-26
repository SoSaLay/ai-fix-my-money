'use client'

import { createContext, useContext, type ReactNode } from 'react'

/**
 * True inside the "What can I unlock?" preview, where every tool is shown open
 * with an example person's figures. Section gates step aside for it.
 */
const PreviewContext = createContext(false)

export function PreviewProvider({ children }: { children: ReactNode }) {
  return <PreviewContext.Provider value>{children}</PreviewContext.Provider>
}

export function usePreview(): boolean {
  return useContext(PreviewContext)
}
