import { useEffect, useState } from 'react'
import type { GoogleMapType } from './basemaps'

interface SessionResponse {
  session?: string
  error?: { message?: string }
}

/**
 * Creates a Google Map Tiles API session. Google's terms only allow its tiles through
 * its own APIs; the 2D Tiles endpoint is the supported way to use them in Leaflet.
 */
export async function createGoogleSession(apiKey: string, mapType: GoogleMapType): Promise<string> {
  const response = await fetch(`https://tile.googleapis.com/v1/createSession?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mapType, language: navigator.language, region: 'US' }),
  })
  const body = (await response.json().catch(() => ({}))) as SessionResponse
  if (!response.ok || !body.session) {
    throw new Error(body.error?.message ?? `Google rejected the request (${response.status})`)
  }
  return body.session
}

export function googleTileUrl(apiKey: string, session: string): string {
  return `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${encodeURIComponent(session)}&key=${encodeURIComponent(apiKey)}`
}

export type GoogleTiles = { status: 'loading' } | { status: 'ready'; url: string } | { status: 'error'; message: string }

export function useGoogleTiles(apiKey: string | undefined, mapType: GoogleMapType | undefined): GoogleTiles | undefined {
  const [state, setState] = useState<GoogleTiles>()
  useEffect(() => {
    if (!apiKey || !mapType) {
      setState(undefined)
      return
    }
    let cancelled = false
    setState({ status: 'loading' })
    createGoogleSession(apiKey, mapType).then(
      (session) => !cancelled && setState({ status: 'ready', url: googleTileUrl(apiKey, session) }),
      (e: unknown) => !cancelled && setState({ status: 'error', message: e instanceof Error ? e.message : String(e) }),
    )
    return () => {
      cancelled = true
    }
  }, [apiKey, mapType])
  return state
}
