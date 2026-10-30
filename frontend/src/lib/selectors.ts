import type { DB } from '@/types'

export function companyRating(db: DB, companyId: string) {
  const rs = db.reviews.filter((r) => r.companyId === companyId)
  if (rs.length === 0) return { total: 0, qualidade: 0, prazo: 0, atendimento: 0, geral: 0 }
  const avg = (k: 'qualidade' | 'prazo' | 'atendimento') => rs.reduce((s, r) => s + r[k], 0) / rs.length
  const qualidade = avg('qualidade')
  const prazo = avg('prazo')
  const atendimento = avg('atendimento')
  return { total: rs.length, qualidade, prazo, atendimento, geral: (qualidade + prazo + atendimento) / 3 }
}

export const publicParts = (db: DB) =>
  db.parts.filter((p) => {
    if (!p.ativo || p.moderacao !== 'publicado') return false
    const c = db.companies.find((x) => x.id === p.companyId)
    return c?.status === 'aprovada'
  })

export const publicCompanies = (db: DB) => db.companies.filter((c) => c.status === 'aprovada')

export const userName = (db: DB, id: string) => db.users.find((u) => u.id === id)?.nome ?? 'Usuário'
