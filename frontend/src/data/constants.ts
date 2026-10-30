import type { CategoryId, Condition, MaterialId, ModelOriginType, PlanDef } from '@/types'

export const CATEGORIES: { id: CategoryId; label: string; descricao: string }[] = [
  { id: 'maquinas', label: 'Máquinas agrícolas', descricao: 'Tratores, colheitadeiras, plantadeiras, pulverizadores' },
  { id: 'irrigacao', label: 'Irrigação', descricao: 'Conexões, suportes, bicos e acessórios' },
  { id: 'pecuaria', label: 'Pecuária', descricao: 'Bebedouros, cochos, cercas e manejo' },
  { id: 'agricultura', label: 'Agricultura', descricao: 'Plantio, colheita e manejo de culturas' },
  { id: 'sensores', label: 'Sensores', descricao: 'Proteções, suportes e caixas para sensores' },
  { id: 'automacao', label: 'Automação', descricao: 'Gabinetes, suportes para placas e atuadores' },
  { id: 'ferramentas', label: 'Ferramentas', descricao: 'Gabaritos, cabos, adaptadores e utilidades' },
  { id: 'armazenamento', label: 'Armazenamento', descricao: 'Silos, galpões e organização' },
  { id: 'outros', label: 'Outros', descricao: 'Demais aplicações no campo' },
]

export const categoryLabel = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)?.label ?? id

// Guia de materiais — atende ao feedback do Empresário 2 sobre a escolha adequada do material.
export interface MaterialInfo {
  id: MaterialId
  nome: string
  resumo: string
  tempMax: number // °C aproximada de uso contínuo
  uv: 1 | 2 | 3 // resistência ao sol
  resistencia: 1 | 2 | 3 // resistência mecânica
  flexibilidade: 1 | 2 | 3
  quimicos: 1 | 2 | 3
  indicado: string
  evitar: string
}

export const MATERIALS: MaterialInfo[] = [
  {
    id: 'PLA',
    nome: 'PLA',
    resumo: 'Fácil de imprimir, ótimo para protótipos e gabaritos.',
    tempMax: 50,
    uv: 1,
    resistencia: 2,
    flexibilidade: 1,
    quimicos: 1,
    indicado: 'Protótipos, testes de encaixe, peças de uso interno.',
    evitar: 'Sol direto, cabine de máquina e locais quentes — deforma com calor.',
  },
  {
    id: 'PETG',
    nome: 'PETG',
    resumo: 'Boa resistência química e à umidade, levemente flexível.',
    tempMax: 70,
    uv: 2,
    resistencia: 2,
    flexibilidade: 2,
    quimicos: 3,
    indicado: 'Irrigação, contato com água e fertilizantes, caixas de proteção.',
    evitar: 'Exposição prolongada a temperaturas acima de 70 °C.',
  },
  {
    id: 'ABS',
    nome: 'ABS',
    resumo: 'Resiste ao calor e a impactos, bom para peças internas de máquinas.',
    tempMax: 90,
    uv: 1,
    resistencia: 2,
    flexibilidade: 2,
    quimicos: 2,
    indicado: 'Peças próximas ao motor, painéis e carcaças internas.',
    evitar: 'Sol direto por longos períodos (amarelece e fica frágil).',
  },
  {
    id: 'ASA',
    nome: 'ASA',
    resumo: 'Parecido com o ABS, mas com alta resistência aos raios UV.',
    tempMax: 90,
    uv: 3,
    resistencia: 2,
    flexibilidade: 2,
    quimicos: 2,
    indicado: 'Peças externas: proteções de sensores, suportes expostos ao tempo.',
    evitar: 'Esforços mecânicos muito altos e contínuos.',
  },
  {
    id: 'Nylon',
    nome: 'Nylon (PA)',
    resumo: 'Muito resistente ao desgaste e a esforços repetitivos.',
    tempMax: 100,
    uv: 2,
    resistencia: 3,
    flexibilidade: 2,
    quimicos: 3,
    indicado: 'Engrenagens, buchas, polias e peças de atrito.',
    evitar: 'Ambientes muito úmidos sem tratamento (absorve água).',
  },
  {
    id: 'TPU',
    nome: 'TPU (flexível)',
    resumo: 'Material emborrachado, absorve impactos e vibração.',
    tempMax: 80,
    uv: 2,
    resistencia: 2,
    flexibilidade: 3,
    quimicos: 2,
    indicado: 'Vedações, protetores, amortecedores, capas.',
    evitar: 'Peças que precisam ser rígidas ou estruturais.',
  },
  {
    id: 'PC',
    nome: 'Policarbonato (PC)',
    resumo: 'Altíssima resistência a impactos e temperatura.',
    tempMax: 115,
    uv: 2,
    resistencia: 3,
    flexibilidade: 1,
    quimicos: 2,
    indicado: 'Peças estruturais, proteções transparentes, ambientes quentes.',
    evitar: 'Projetos simples — é mais caro e difícil de imprimir.',
  },
  {
    id: 'Resina',
    nome: 'Resina (SLA)',
    resumo: 'Alto nível de detalhe e acabamento liso.',
    tempMax: 60,
    uv: 1,
    resistencia: 1,
    flexibilidade: 1,
    quimicos: 2,
    indicado: 'Peças pequenas e detalhadas, moldes, conectores finos.',
    evitar: 'Uso externo e peças sujeitas a impacto.',
  },
]

export const CONDITIONS: { id: Condition; label: string; materiais: MaterialId[] }[] = [
  { id: 'sol', label: 'Fica exposta ao sol', materiais: ['ASA', 'PETG', 'PC'] },
  { id: 'chuva', label: 'Pega chuva ou umidade', materiais: ['PETG', 'ASA', 'TPU'] },
  { id: 'calor', label: 'Fica perto de motor / calor', materiais: ['ABS', 'ASA', 'PC', 'Nylon'] },
  { id: 'quimicos', label: 'Contato com defensivos ou adubos', materiais: ['PETG', 'Nylon'] },
  { id: 'impacto', label: 'Sofre impactos ou batidas', materiais: ['PC', 'Nylon', 'TPU'] },
  { id: 'vibracao', label: 'Trabalha com vibração / atrito', materiais: ['Nylon', 'TPU'] },
  { id: 'flexivel', label: 'Precisa ser flexível', materiais: ['TPU'] },
  { id: 'alimento', label: 'Contato com ração ou água de animais', materiais: ['PETG'] },
]

export function suggestMaterials(conds: Condition[]): MaterialId[] {
  if (conds.length === 0) return []
  const score = new Map<MaterialId, number>()
  for (const c of conds) {
    const def = CONDITIONS.find((d) => d.id === c)
    def?.materiais.forEach((m, i) => score.set(m, (score.get(m) ?? 0) + (3 - Math.min(i, 2))))
  }
  return [...score.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([m]) => m)
}

export const ORIGINS: { id: ModelOriginType; label: string }[] = [
  { id: 'proprio', label: 'Modelo próprio' },
  { id: 'printables', label: 'Printables' },
  { id: 'thingiverse', label: 'Thingiverse' },
  { id: 'makerworld', label: 'MakerWorld' },
  { id: 'outra', label: 'Outra fonte autorizada' },
]

export const LICENSES = [
  'CC BY 4.0',
  'CC BY-SA 4.0',
  'CC BY-NC 4.0',
  'CC BY-NC-SA 4.0',
  'CC0 (domínio público)',
  'GPL',
  'Licença comercial do autor',
  'Outra',
]

export const TECHNOLOGIES = ['FDM', 'SLA', 'SLS', 'MJF', 'Escaneamento 3D', 'Modelagem CAD']

export const SERVICES = [
  'Modelagem 3D sob medida',
  'Impressão de peças',
  'Engenharia reversa',
  'Prototipagem',
  'Produção em pequenos lotes',
  'Escaneamento 3D',
  'Pós-processamento',
]

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ',
  'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]

export const REPORT_REASONS = [
  'Informação falsa ou enganosa',
  'Violação de direitos autorais / licença',
  'Conteúdo ofensivo ou impróprio',
  'Spam ou propaganda',
  'Risco à segurança',
  'Outro',
]

export const DEFAULT_PLANS: PlanDef[] = [
  {
    id: 'gratuito',
    nome: 'Gratuito',
    descricao: 'Para começar a aparecer para produtores.',
    preco: 'R$ 0',
    limitePecas: 5,
    limiteInteressesMes: 3,
    destaque: false,
    estatisticas: 'nenhuma',
    equipe: false,
    recursos: ['Perfil básico', 'Até 5 peças no catálogo', 'Até 3 interesses em dores por mês'],
  },
  {
    id: 'profissional',
    nome: 'Profissional',
    descricao: 'Para empresas que querem crescer no agro.',
    preco: 'A definir',
    limitePecas: 40,
    limiteInteressesMes: 30,
    destaque: true,
    estatisticas: 'basicas',
    equipe: false,
    recursos: [
      'Perfil profissional completo',
      'Até 40 peças no catálogo',
      'Até 30 interesses por mês',
      'Maior exposição nas buscas',
      'Estatísticas de visualização',
    ],
  },
  {
    id: 'empresarial',
    nome: 'Empresarial',
    descricao: 'Para operações maiores e equipes.',
    preco: 'A definir',
    limitePecas: null,
    limiteInteressesMes: null,
    destaque: true,
    estatisticas: 'completas',
    equipe: true,
    recursos: [
      'Peças ilimitadas',
      'Interesses ilimitados',
      'Destaque máximo',
      'Estatísticas completas',
      'Ferramentas avançadas e recursos para equipes',
    ],
  },
]

export const PAIN_STATUS_LABEL: Record<string, string> = {
  aberta: 'Aberta',
  em_negociacao: 'Em negociação',
  resolvida: 'Resolvida',
  encerrada: 'Encerrada',
  removida: 'Removida',
}

export const COMPANY_STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  aprovada: 'Aprovada',
  rejeitada: 'Rejeitada',
  bloqueada: 'Bloqueada',
}

export const QUOTE_STATUS_LABEL: Record<string, string> = {
  nova: 'Nova',
  respondida: 'Respondida',
  aceita: 'Aceita',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

export const INTEREST_STATUS_LABEL: Record<string, string> = {
  interesse: 'Interesse',
  proposta: 'Proposta enviada',
  aceita: 'Aceita',
  recusada: 'Recusada',
}

export const VIABILIDADE_LABEL: Record<string, string> = {
  total: 'Totalmente viável em impressão 3D',
  parcial: 'Viável com componentes de outro processo (ex.: metal)',
  outro_processo: 'Exige outro processo (usinagem, CNC…)',
}
