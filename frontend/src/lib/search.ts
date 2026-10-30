import type { Company, Part } from '@/types'
import { categoryLabel } from '@/data/constants'

// Busca por necessidade (RN-005): o produtor não precisa saber o nome técnico ou código da peça.

export const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')

const STOPWORDS = new Set(['de', 'da', 'do', 'das', 'dos', 'para', 'pra', 'com', 'que', 'um', 'uma', 'o', 'a', 'os', 'as', 'e', 'em', 'no', 'na', 'meu', 'minha', 'preciso', 'peca'])

// Sinônimos do vocabulário do campo
const SYNONYMS: Record<string, string[]> = {
  pulverizador: ['barra', 'pulverizacao', 'aplicador'],
  protecao: ['protetor', 'capa', 'carenagem', 'tampa', 'caixa'],
  suporte: ['fixador', 'apoio', 'base', 'braco'],
  mangueira: ['gotejamento', 'irrigacao', 'tubo'],
  engrenagem: ['roda dentada', 'pinhao'],
  quebrou: ['reposicao', 'substituicao'],
  trator: ['cabine', 'colheitadeira'],
  bebedouro: ['agua', 'gado', 'bovinos'],
  cerca: ['isolador', 'arame'],
  plantadeira: ['plantio', 'semeadora', 'sementes'],
  chuva: ['agua', 'umidade', 'vedacao'],
}

export function tokenize(q: string): string[] {
  return normalize(q)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
}

function expand(tokens: string[]): string[][] {
  return tokens.map((t) => {
    const stem = t.replace(/(es|s)$/, '')
    const syn = Object.entries(SYNONYMS).flatMap(([k, v]) => (k.startsWith(stem) || v.some((x) => x.startsWith(stem)) ? [k, ...v] : []))
    return [stem, ...syn]
  })
}

export function searchParts(parts: Part[], companies: Company[], q: string): { part: Part; score: number }[] {
  const tokens = tokenize(q)
  if (tokens.length === 0) return parts.map((part) => ({ part, score: 0 }))
  const groups = expand(tokens)
  return parts
    .map((part) => {
      const c = companies.find((x) => x.id === part.companyId)
      const fields: [string, number][] = [
        [part.nome, 5],
        [part.aplicacao, 3],
        [part.equipamento, 3],
        [categoryLabel(part.categoria), 2],
        [part.fabricante + ' ' + part.modelo, 2],
        [part.material, 2],
        [part.descricao, 1],
        [c?.nome ?? '', 1],
      ]
      const normFields = fields.map(([text, w]) => [normalize(text), w] as const)
      let score = 0
      let matched = 0
      for (const g of groups) {
        let best = 0
        for (const [n, w] of normFields) {
          g.forEach((alt, i) => {
            if (n.includes(alt)) best = Math.max(best, i === 0 ? w : w * 0.6)
          })
        }
        if (best > 0) matched++
        score += best
      }
      // exige que ao menos metade dos termos tenha casado
      if (matched < Math.ceil(groups.length / 2)) score = 0
      return { part, score }
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
}
