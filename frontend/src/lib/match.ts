import type { Company, Pain } from '@/types'
import { suggestMaterials } from '@/data/constants'

/**
 * Correspondência automática entre dor e empresa — sugestão do feedback empresarial:
 * cada empresa informa seus segmentos e o sistema identifica as empresas compatíveis.
 * Retorna uma pontuação de 0 a 100.
 */
export function matchScore(company: Company, pain: Pain): number {
  let score = 0
  if (company.segmentos.includes(pain.categoria)) score += 50
  const sugeridos = suggestMaterials(pain.condicoes)
  if (sugeridos.length === 0 || sugeridos.some((m) => company.materiais.includes(m))) score += 20
  if (company.uf === pain.uf) score += 20
  if (company.verificada) score += 10
  return score
}

export function matchReasons(company: Company, pain: Pain): string[] {
  const r: string[] = []
  if (company.segmentos.includes(pain.categoria)) r.push('Atua neste segmento')
  const sugeridos = suggestMaterials(pain.condicoes)
  const mats = sugeridos.filter((m) => company.materiais.includes(m))
  if (mats.length) r.push(`Trabalha com ${mats.join(', ')}`)
  if (company.uf === pain.uf) r.push(`Mesma região (${pain.uf})`)
  if (company.verificada) r.push('Empresa verificada')
  return r
}

export function matchLabel(score: number): { label: string; tone: 'alta' | 'media' | 'baixa' } {
  if (score >= 70) return { label: 'Alta compatibilidade', tone: 'alta' }
  if (score >= 50) return { label: 'Compatível', tone: 'media' }
  return { label: 'Fora do seu segmento', tone: 'baixa' }
}
