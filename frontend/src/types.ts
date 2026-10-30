// Modelo de domínio do AgroFab3D (derivado das Regras de Negócio RN-001..RN-024
// e dos Requisitos Funcionais RF-001..RF-044).

export type UserRole = 'produtor' | 'empresa' | 'admin' // RN-001
export type UserStatus = 'ativo' | 'bloqueado' // RF-040

export interface User {
  id: string
  nome: string
  email: string
  senha: string // apenas para a simulação local — o backend real nunca expõe isso
  tipo: UserRole
  status: UserStatus
  telefone?: string
  cidade?: string
  uf?: string
  criadoEm: string
  termosAceitosEm: string // RNF-016
  companyId?: string
}

export type CategoryId =
  | 'maquinas'
  | 'irrigacao'
  | 'pecuaria'
  | 'agricultura'
  | 'sensores'
  | 'automacao'
  | 'ferramentas'
  | 'armazenamento'
  | 'outros' // RF-044

export type MaterialId = 'PLA' | 'PETG' | 'ABS' | 'ASA' | 'Nylon' | 'TPU' | 'PC' | 'Resina'

export type CompanyStatus = 'pendente' | 'aprovada' | 'rejeitada' | 'bloqueada' // RF-007
export type PlanId = 'gratuito' | 'profissional' | 'empresarial' // RN-021

export interface Company {
  id: string
  ownerId: string
  nome: string
  cnpj: string
  descricao: string
  cidade: string
  uf: string
  servicos: string[]
  materiais: MaterialId[]
  tecnologias: string[]
  segmentos: CategoryId[] // sugestão do feedback empresarial (LUV Impressões)
  experiencia: string
  contato: { telefone?: string; whatsapp?: string; email?: string; site?: string }
  status: CompanyStatus
  verificada: boolean // RN-018
  verificadaEm?: string
  motivoStatus?: string
  plano: PlanId
  criadoEm: string
  cor: string
}

export type ModelOriginType = 'proprio' | 'printables' | 'thingiverse' | 'makerworld' | 'outra' // RN-015

export interface ModelOrigin {
  tipo: ModelOriginType
  autor?: string
  url?: string
  licenca?: string // RF-016
  condicoes?: string
}

export interface PartVersion {
  versao: string // V1, V2, V3…
  descricao: string
  data: string
  arquivoModelo?: string
  autorId?: string
}

export interface Part {
  id: string
  companyId: string
  nome: string
  descricao: string
  categoria: CategoryId
  aplicacao: string
  material: MaterialId
  dimensoes: string
  equipamento: string
  fabricante: string
  modelo: string
  temperatura?: string
  prazoDias: number
  preco: number | null // null = sob orçamento (RN-003)
  imagens: string[]
  versoes: PartVersion[] // RN-016 — nunca sobrescritas
  origem: ModelOrigin
  ativo: boolean // RF-012
  moderacao: 'publicado' | 'removido' // RF-041
  dorOrigemId?: string // RN-022
  visualizacoes: number
  criadoEm: string
}

export type PainStatus = 'aberta' | 'em_negociacao' | 'resolvida' | 'encerrada' | 'removida'

export type Condition = 'sol' | 'chuva' | 'calor' | 'quimicos' | 'impacto' | 'vibracao' | 'flexivel' | 'alimento'

export interface Pain {
  id: string
  produtorId: string
  titulo: string
  descricao: string
  categoria: CategoryId
  imagens: string[]
  videos: string[]
  maquina: string
  fabricante: string
  modelo: string
  quantidade: number
  cidade: string
  uf: string
  prazoDesejado?: string
  condicoes: Condition[]
  outrasInfos?: string
  status: PainStatus
  criadoEm: string
  atualizadoEm: string
}

export interface Proposal {
  solucao: string
  material: MaterialId | ''
  prazoDias: number | null
  preco: number | null
  infoTecnica: string
  observacoes: string
  viabilidade: 'total' | 'parcial' | 'outro_processo'
}

export type InterestStatus = 'interesse' | 'proposta' | 'aceita' | 'recusada'

export interface Interest {
  id: string
  painId: string
  companyId: string
  mensagem: string
  proposta?: Proposal
  status: InterestStatus
  criadoEm: string
  atualizadoEm: string
}

export type QuoteStatus = 'nova' | 'respondida' | 'aceita' | 'concluida' | 'cancelada'

export interface QuoteRequest {
  id: string
  partId: string
  companyId: string
  produtorId: string
  quantidade: number
  mensagem: string
  resposta?: { texto: string; preco: number | null; prazoDias: number | null; data: string }
  status: QuoteStatus
  criadoEm: string
}

export interface Review {
  id: string
  companyId: string
  produtorId: string
  referencia: { tipo: 'orcamento' | 'dor'; id: string }
  qualidade: number
  prazo: number
  atendimento: number
  comentario: string
  criadoEm: string
}

export interface Report {
  id: string
  alvoTipo: 'peca' | 'dor' | 'empresa'
  alvoId: string
  motivo: string
  descricao: string
  autorId: string
  status: 'aberta' | 'resolvida' | 'descartada'
  criadoEm: string
}

export interface Notification {
  id: string
  userId: string
  texto: string
  link?: string
  lida: boolean
  criadoEm: string
}

export interface AuditEntry {
  id: string
  userId: string
  acao: string
  alvo: string
  detalhe: string
  data: string
}

export interface PlanDef {
  id: PlanId
  nome: string
  descricao: string
  preco: string
  limitePecas: number | null // null = ilimitado
  limiteInteressesMes: number | null
  destaque: boolean
  estatisticas: 'nenhuma' | 'basicas' | 'completas'
  equipe: boolean
  recursos: string[]
}

export interface DB {
  versao: number
  users: User[]
  companies: Company[]
  parts: Part[]
  pains: Pain[]
  interests: Interest[]
  quotes: QuoteRequest[]
  reviews: Review[]
  reports: Report[]
  notifications: Notification[]
  audit: AuditEntry[]
  plans: PlanDef[]
}
