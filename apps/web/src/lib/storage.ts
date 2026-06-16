import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export const FOTOS_BUCKET = 'acolhidos'

/**
 * Faz upload da foto do acolhido e retorna o PATH interno do Storage
 * (não uma URL). O path é o que deve ser salvo na coluna foto_url.
 */
export async function uploadFoto(tenantId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()
  const path = `${tenantId}/fotos/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(FOTOS_BUCKET).upload(path, file, { upsert: true })
  if (error) throw error
  return path
}

/**
 * Gera uma URL assinada e temporária para exibir uma foto de bucket privado.
 * Aceita tanto o novo formato (path do Storage) quanto URLs públicas completas
 * de registros antigos (extrai o path e assina), mantendo compatibilidade.
 */
export async function getFotoUrl(pathOrUrl: string | null | undefined): Promise<string | null> {
  if (!pathOrUrl) return null
  let path = pathOrUrl
  if (path.startsWith('http')) {
    const marker = `/object/public/${FOTOS_BUCKET}/`
    const i = path.indexOf(marker)
    if (i === -1) return path // URL externa que não é do nosso bucket — devolve como está
    path = path.slice(i + marker.length)
  }
  const { data, error } = await supabase.storage.from(FOTOS_BUCKET).createSignedUrl(path, 3600)
  if (error) return null
  return data?.signedUrl ?? null
}

/** Hook que resolve o path/URL de uma foto em uma URL assinada exibível. */
export function useFotoUrl(pathOrUrl: string | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let ativo = true
    getFotoUrl(pathOrUrl).then(u => { if (ativo) setUrl(u) })
    return () => { ativo = false }
  }, [pathOrUrl])
  return url
}
