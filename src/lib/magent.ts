import { URLSearchParams } from 'url'

export const getTorrentHashFromMagnet = (magnet: string): string => {
  const urlParams = new URLSearchParams(magnet)
  return urlParams.get('magnet:?xt') || undefined
}
