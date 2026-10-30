import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type {
  Company,
  CompanyStatus,
  DB,
  Interest,
  InterestStatus,
  Pain,
  PainStatus,
  Part,
  PartVersion,
  PlanDef,
  PlanId,
  Proposal,
  QuoteRequest,
  QuoteStatus,
  Report,
  Review,
  User,
  UserRole,
  UserStatus,
} from '@/types'
import { createSeed } from './seed'
import { categoryLabel } from './constants'
import { matchScore } from '@/lib/match'

/**
 * Camada de dados SIMULADA (somente frontend).
 *
 * Toda a "persistência" fica no localStorage do navegador. Cada ação aqui corresponde a um
 * endpoint que o backend deverá expor no futuro (RNF-010 — arquitetura desacoplada via API).
 * Para integrar com o backend real, basta substituir o corpo destas ações por chamadas HTTP.
 */

const DB_KEY = 'agrofab3d:db'
const SESSION_KEY = 'agrofab3d:session'
const DB_VERSION = 1

const uid = (p: string) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
const now = () => new Date().toISOString()

function loadDb(): DB {
  try {
    const raw = localStorage.getItem(DB_KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as DB
      if (parsed.versao === DB_VERSION) return parsed
    }
  } catch {
    /* ignora — recria a base de demonstração */
  }
  return createSeed()
}

function loadSession(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY)
  } catch {
    return null
  }
}

export type Result<T = void> = { ok: true; value: T } | { ok: false; error: string }
const ok = <T,>(value: T): Result<T> => ({ ok: true, value })
const fail = (error: string): Result<never> => ({ ok: false, error })

export type RegisterInput = {
  nome: string
  email: string
  senha: string
  tipo: Exclude<UserRole, 'admin'>
  telefone?: string
  cidade?: string
  uf?: string
}

export type CompanyInput = Omit<Company, 'id' | 'ownerId' | 'status' | 'verificada' | 'verificadaEm' | 'plano' | 'criadoEm' | 'cor' | 'motivoStatus'>

export type PartInput = Omit<Part, 'id' | 'companyId' | 'versoes' | 'ativo' | 'moderacao' | 'visualizacoes' | 'criadoEm'> & {
  versaoInicial?: string
}

export type PainInput = Omit<Pain, 'id' | 'produtorId' | 'status' | 'criadoEm' | 'atualizadoEm'>

function useStoreValue() {
  const [db, setDb] = useState<DB>(loadDb)
  const [sessionId, setSessionId] = useState<string | null>(loadSession)
  const dbRef = useRef(db)
  dbRef.current = db

  useEffect(() => {
    try {
      localStorage.setItem(DB_KEY, JSON.stringify(db))
    } catch {
      /* quota excedida (ex.: muitas imagens) — mantém em memória */
    }
  }, [db])

  useEffect(() => {
    try {
      if (sessionId) localStorage.setItem(SESSION_KEY, sessionId)
      else localStorage.removeItem(SESSION_KEY)
    } catch {
      /* noop */
    }
  }, [sessionId])

  const mutate = useCallback((fn: (d: DB) => void) => {
    const draft = structuredClone(dbRef.current)
    fn(draft)
    dbRef.current = draft
    setDb(draft)
  }, [])

  const user = useMemo(() => {
    const u = db.users.find((x) => x.id === sessionId)
    return u && u.status === 'ativo' ? u : null
  }, [db.users, sessionId])

  const company = useMemo(() => (user?.companyId ? db.companies.find((c) => c.id === user.companyId) ?? null : null), [db.companies, user])

  const notify = (d: DB, userId: string, texto: string, link?: string) => {
    d.notifications.unshift({ id: uid('n'), userId, texto, link, lida: false, criadoEm: now() })
  }
  const audit = (d: DB, acao: string, alvo: string, detalhe: string) => {
    d.audit.unshift({ id: uid('a'), userId: sessionId ?? 'sistema', acao, alvo, detalhe, data: now() })
  }

  const actions = {
    // ---------- Autenticação (RF-001, RF-002) ----------
    login(email: string, senha: string): Result<User> {
      const u = dbRef.current.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase())
      if (!u) return fail('Conta não encontrada para este e-mail.')
      if (u.senha !== senha) return fail('E-mail ou senha inválidos.')
      if (u.status === 'bloqueado') return fail('Esta conta está bloqueada. Entre em contato com o suporte.')
      setSessionId(u.id)
      return ok(u)
    },
    logout() {
      setSessionId(null)
    },
    register(input: RegisterInput): Result<User> {
      const email = input.email.trim().toLowerCase()
      if (dbRef.current.users.some((x) => x.email.toLowerCase() === email)) return fail('Este e-mail já está cadastrado.')
      const u: User = {
        id: uid('u'),
        nome: input.nome.trim(),
        email,
        senha: input.senha,
        tipo: input.tipo,
        status: 'ativo',
        telefone: input.telefone,
        cidade: input.cidade,
        uf: input.uf,
        criadoEm: now(),
        termosAceitosEm: now(), // RNF-016 — no backend real: + IP
      }
      mutate((d) => {
        d.users.push(u)
      })
      setSessionId(u.id)
      return ok(u)
    },
    updateProfile(patch: Partial<Pick<User, 'nome' | 'telefone' | 'cidade' | 'uf' | 'email'>>): Result {
      if (!user) return fail('Sessão expirada.')
      if (patch.email && dbRef.current.users.some((x) => x.id !== user.id && x.email.toLowerCase() === patch.email!.toLowerCase()))
        return fail('Este e-mail já está em uso.')
      mutate((d) => {
        Object.assign(d.users.find((x) => x.id === user.id)!, patch)
        audit(d, 'Perfil atualizado', user.id, Object.keys(patch).join(', '))
      })
      return ok(undefined)
    },
    changePassword(atual: string, nova: string): Result {
      if (!user) return fail('Sessão expirada.')
      if (user.senha !== atual) return fail('Senha atual incorreta.')
      mutate((d) => {
        d.users.find((x) => x.id === user.id)!.senha = nova
      })
      return ok(undefined)
    },
    // LGPD (RNF-006): anonimiza a conta e encerra a sessão
    deleteAccount() {
      if (!user) return
      mutate((d) => {
        const u = d.users.find((x) => x.id === user.id)!
        u.nome = 'Usuário removido'
        u.email = `removido-${u.id}@anonimo.invalid`
        u.telefone = undefined
        u.cidade = undefined
        u.status = 'bloqueado'
        d.pains.filter((p) => p.produtorId === u.id && (p.status === 'aberta' || p.status === 'em_negociacao')).forEach((p) => (p.status = 'encerrada'))
        if (u.companyId) {
          const c = d.companies.find((x) => x.id === u.companyId)
          if (c) c.status = 'bloqueada'
          d.parts.filter((p) => p.companyId === u.companyId).forEach((p) => (p.ativo = false))
        }
        audit(d, 'Conta anonimizada (LGPD)', u.id, 'Solicitado pelo titular')
      })
      setSessionId(null)
    },

    // ---------- Empresa (RF-004..RF-007) ----------
    saveCompany(input: CompanyInput): Result<Company> {
      if (!user || user.tipo !== 'empresa') return fail('Apenas contas de empresa podem cadastrar um perfil empresarial.')
      const cnpjDigits = input.cnpj.replace(/\D/g, '')
      if (cnpjDigits.length !== 14) return fail('CNPJ deve ter 14 dígitos.')
      const existing = company
      if (dbRef.current.companies.some((c) => c.id !== existing?.id && c.cnpj.replace(/\D/g, '') === cnpjDigits))
        return fail('Já existe uma empresa cadastrada com este CNPJ.')
      let saved!: Company
      mutate((d) => {
        if (existing) {
          const c = d.companies.find((x) => x.id === existing.id)!
          const cnpjChanged = c.cnpj.replace(/\D/g, '') !== cnpjDigits
          Object.assign(c, input)
          // RN-018: selo pode ser removido se as informações verificadas deixarem de ser válidas
          if (cnpjChanged && c.verificada) {
            c.verificada = false
            c.status = 'pendente'
            c.motivoStatus = 'CNPJ alterado — nova verificação necessária.'
          }
          saved = c
          audit(d, 'Perfil empresarial atualizado', c.id, cnpjChanged ? 'CNPJ alterado' : 'Dados atualizados')
        } else {
          const c: Company = {
            ...input,
            id: uid('c'),
            ownerId: user.id,
            status: 'pendente',
            verificada: false,
            plano: 'gratuito',
            criadoEm: now(),
            cor: ['#2c703d', '#a95f28', '#1f472b', '#5f321f', '#245933'][d.companies.length % 5],
          }
          d.companies.push(c)
          d.users.find((x) => x.id === user.id)!.companyId = c.id
          d.users.filter((x) => x.tipo === 'admin').forEach((a) => notify(d, a.id, `Nova empresa aguardando análise: ${c.nome}`, '/admin/empresas'))
          saved = c
          audit(d, 'Empresa cadastrada', c.id, c.nome)
        }
      })
      return ok(saved)
    },
    setCompanyStatus(id: string, status: CompanyStatus, motivo?: string) {
      mutate((d) => {
        const c = d.companies.find((x) => x.id === id)!
        c.status = status
        c.motivoStatus = motivo
        if (status !== 'aprovada') c.verificada = false
        notify(d, c.ownerId, `O status da sua empresa foi alterado para "${status}".${motivo ? ` Motivo: ${motivo}` : ''}`, '/painel/empresa')
        audit(d, `Empresa ${status}`, id, motivo ?? '')
      })
    },
    setVerified(id: string, verificada: boolean) {
      mutate((d) => {
        const c = d.companies.find((x) => x.id === id)!
        c.verificada = verificada
        c.verificadaEm = verificada ? now() : undefined
        notify(d, c.ownerId, verificada ? 'Parabéns! Sua empresa recebeu o selo de Empresa Verificada.' : 'O selo de Empresa Verificada foi removido.', '/painel/empresa')
        audit(d, verificada ? 'Selo concedido' : 'Selo removido', id, c.nome)
      })
    },
    changePlan(plano: PlanId): Result {
      if (!company) return fail('Cadastre sua empresa primeiro.')
      mutate((d) => {
        d.companies.find((x) => x.id === company.id)!.plano = plano
        audit(d, 'Plano alterado', company.id, plano)
      })
      return ok(undefined)
    },

    // ---------- Catálogo (RF-010..RF-016) ----------
    savePart(input: PartInput, id?: string): Result<Part> {
      if (!company) return fail('Cadastre sua empresa primeiro.')
      if (company.status !== 'aprovada') return fail('Sua empresa ainda não está habilitada para publicar peças.')
      if (input.origem.tipo !== 'proprio' && (!input.origem.url || !input.origem.licenca))
        return fail('Para modelos externos, informe o link de origem e a licença (RNF-007).')
      if (!id) {
        const plan = dbRef.current.plans.find((p) => p.id === company.plano)
        const count = dbRef.current.parts.filter((p) => p.companyId === company.id && p.moderacao !== 'removido').length
        if (plan?.limitePecas != null && count >= plan.limitePecas)
          return fail(`Seu plano ${plan.nome} permite até ${plan.limitePecas} peças. Faça upgrade para cadastrar mais.`)
      }
      let saved!: Part
      mutate((d) => {
        const { versaoInicial, ...data } = input
        if (id) {
          const p = d.parts.find((x) => x.id === id && x.companyId === company.id)!
          const origemMudou = JSON.stringify(p.origem) !== JSON.stringify(data.origem)
          Object.assign(p, data)
          saved = p
          audit(d, 'Peça editada', p.id, p.nome)
          if (origemMudou) audit(d, 'Licença registrada', p.id, `${data.origem.tipo} — ${data.origem.licenca ?? 'própria'}`)
        } else {
          const p: Part = {
            ...data,
            id: uid('p'),
            companyId: company.id,
            versoes: [{ versao: 'V1', descricao: versaoInicial || 'Primeiro modelo', data: now(), autorId: user?.id }],
            ativo: true,
            moderacao: 'publicado',
            visualizacoes: 0,
            criadoEm: now(),
          }
          d.parts.unshift(p)
          saved = p
          audit(d, 'Peça cadastrada', p.id, p.nome)
          if (p.origem.tipo !== 'proprio') audit(d, 'Licença registrada', p.id, `${p.origem.tipo} — ${p.origem.licenca}`)
        }
      })
      return ok(saved)
    },
    // RN-016 / RNF-009 — nova versão é adicionada, nunca sobrescreve as anteriores
    addVersion(partId: string, descricao: string, arquivoModelo?: string): Result<PartVersion> {
      const p = dbRef.current.parts.find((x) => x.id === partId)
      if (!p || p.companyId !== company?.id) return fail('Peça não encontrada.')
      const n = p.versoes.length + 1
      const v: PartVersion = { versao: `V${n}`, descricao, data: now(), arquivoModelo, autorId: user?.id }
      mutate((d) => {
        d.parts.find((x) => x.id === partId)!.versoes.push(v)
        audit(d, 'Nova versão', partId, `${v.versao} — ${descricao}`)
      })
      return ok(v)
    },
    setPartActive(partId: string, ativo: boolean) {
      mutate((d) => {
        d.parts.find((x) => x.id === partId)!.ativo = ativo
        audit(d, ativo ? 'Peça reativada' : 'Peça desativada', partId, '')
      })
    },
    deletePart(partId: string) {
      mutate((d) => {
        d.parts = d.parts.filter((x) => x.id !== partId)
        audit(d, 'Peça excluída', partId, '')
      })
    },
    viewPart(partId: string) {
      mutate((d) => {
        const p = d.parts.find((x) => x.id === partId)
        if (p) p.visualizacoes += 1
      })
    },
    moderatePart(partId: string, moderacao: Part['moderacao']) {
      mutate((d) => {
        const p = d.parts.find((x) => x.id === partId)!
        p.moderacao = moderacao
        const owner = d.companies.find((c) => c.id === p.companyId)
        if (owner) notify(d, owner.ownerId, `A peça "${p.nome}" foi ${moderacao === 'removido' ? 'removida pela moderação' : 'republicada'}.`, '/painel/pecas')
        audit(d, moderacao === 'removido' ? 'Peça removida (moderação)' : 'Peça republicada', partId, p.nome)
      })
    },

    // ---------- Dores (RF-020..RF-024) ----------
    createPain(input: PainInput): Result<Pain> {
      if (!user || user.tipo !== 'produtor') return fail('Entre como produtor para publicar uma dor.')
      if (!input.titulo.trim() || !input.descricao.trim()) return fail('Título e descrição são obrigatórios.')
      const p: Pain = { ...input, id: uid('d'), produtorId: user.id, status: 'aberta', criadoEm: now(), atualizadoEm: now() }
      mutate((d) => {
        d.pains.unshift(p)
        // Correspondência automática (feedback empresarial): avisa empresas compatíveis
        d.companies
          .filter((c) => c.status === 'aprovada' && matchScore(c, p) >= 50)
          .forEach((c) => notify(d, c.ownerId, `Nova dor compatível com seus segmentos (${categoryLabel(p.categoria)}): "${p.titulo}"`, `/painel/oportunidades/${p.id}`))
      })
      return ok(p)
    },
    updatePain(id: string, input: PainInput): Result {
      const p = dbRef.current.pains.find((x) => x.id === id)
      if (!p || p.produtorId !== user?.id) return fail('Dor não encontrada.')
      if (p.status !== 'aberta') return fail('Só é possível editar dores com status "Aberta".')
      mutate((d) => {
        Object.assign(d.pains.find((x) => x.id === id)!, input, { atualizadoEm: now() })
      })
      return ok(undefined)
    },
    setPainStatus(id: string, status: PainStatus) {
      mutate((d) => {
        const p = d.pains.find((x) => x.id === id)!
        p.status = status
        p.atualizadoEm = now()
        if (status === 'removida') {
          notify(d, p.produtorId, `Sua dor "${p.titulo}" foi removida pela moderação.`, '/painel/dores')
          audit(d, 'Dor removida (moderação)', id, p.titulo)
        }
      })
    },

    // ---------- Interesse e proposta (RN-011, RN-012) ----------
    sendInterest(painId: string, mensagem: string, proposta?: Proposal): Result<Interest> {
      if (!company) return fail('Cadastre sua empresa primeiro.')
      if (company.status !== 'aprovada') return fail('Sua empresa precisa estar aprovada para demonstrar interesse.')
      const pain = dbRef.current.pains.find((x) => x.id === painId)
      if (!pain || (pain.status !== 'aberta' && pain.status !== 'em_negociacao')) return fail('Esta dor não está mais recebendo interesses.')
      const existing = dbRef.current.interests.find((x) => x.painId === painId && x.companyId === company.id)
      if (!existing) {
        const plan = dbRef.current.plans.find((p) => p.id === company.plano)
        const month = new Date().toISOString().slice(0, 7)
        const used = dbRef.current.interests.filter((x) => x.companyId === company.id && x.criadoEm.startsWith(month)).length
        if (plan?.limiteInteressesMes != null && used >= plan.limiteInteressesMes)
          return fail(`Você atingiu o limite de ${plan.limiteInteressesMes} interesses/mês do plano ${plan.nome}.`)
      }
      let saved!: Interest
      mutate((d) => {
        if (existing) {
          const i = d.interests.find((x) => x.id === existing.id)!
          i.mensagem = mensagem || i.mensagem
          if (proposta) {
            i.proposta = proposta
            if (i.status === 'interesse' || i.status === 'recusada') i.status = 'proposta'
          }
          i.atualizadoEm = now()
          saved = i
        } else {
          const i: Interest = { id: uid('i'), painId, companyId: company.id, mensagem, proposta, status: proposta ? 'proposta' : 'interesse', criadoEm: now(), atualizadoEm: now() }
          d.interests.push(i)
          saved = i
        }
        notify(d, pain.produtorId, `${company.nome} ${proposta ? 'enviou uma proposta' : 'demonstrou interesse'} em "${pain.titulo}"`, `/painel/dores/${painId}`)
      })
      return ok(saved)
    },
    setInterestStatus(id: string, status: InterestStatus) {
      mutate((d) => {
        const i = d.interests.find((x) => x.id === id)!
        i.status = status
        i.atualizadoEm = now()
        const pain = d.pains.find((x) => x.id === i.painId)!
        const c = d.companies.find((x) => x.id === i.companyId)!
        if (status === 'aceita') {
          if (pain.status === 'aberta') pain.status = 'em_negociacao'
          notify(d, c.ownerId, `O produtor aceitou conversar sobre "${pain.titulo}". O contato dele já está disponível.`, `/painel/oportunidades/${pain.id}`)
        } else if (status === 'recusada') {
          notify(d, c.ownerId, `Sua proposta para "${pain.titulo}" não foi escolhida desta vez.`, `/painel/oportunidades/${pain.id}`)
        }
      })
    },

    // ---------- Orçamentos (caso de uso "Solicitar orçamento") ----------
    requestQuote(partId: string, quantidade: number, mensagem: string): Result<QuoteRequest> {
      if (!user || user.tipo !== 'produtor') return fail('Entre como produtor para solicitar orçamento.')
      const part = dbRef.current.parts.find((x) => x.id === partId)
      if (!part) return fail('Peça não encontrada.')
      const q: QuoteRequest = { id: uid('q'), partId, companyId: part.companyId, produtorId: user.id, quantidade, mensagem, status: 'nova', criadoEm: now() }
      mutate((d) => {
        d.quotes.unshift(q)
        const c = d.companies.find((x) => x.id === part.companyId)
        if (c) notify(d, c.ownerId, `Novo pedido de orçamento para "${part.nome}" (${quantidade} un.)`, '/painel/orcamentos')
      })
      return ok(q)
    },
    respondQuote(id: string, texto: string, preco: number | null, prazoDias: number | null) {
      mutate((d) => {
        const q = d.quotes.find((x) => x.id === id)!
        q.resposta = { texto, preco, prazoDias, data: now() }
        q.status = 'respondida'
        const part = d.parts.find((x) => x.id === q.partId)
        notify(d, q.produtorId, `Seu orçamento para "${part?.nome}" foi respondido.`, '/painel/orcamentos')
      })
    },
    setQuoteStatus(id: string, status: QuoteStatus) {
      mutate((d) => {
        const q = d.quotes.find((x) => x.id === id)!
        q.status = status
        const part = d.parts.find((x) => x.id === q.partId)
        const c = d.companies.find((x) => x.id === q.companyId)
        if (status === 'aceita' && c) notify(d, c.ownerId, `Orçamento aceito para "${part?.nome}". Combine a entrega com o produtor.`, '/painel/orcamentos')
        if (status === 'concluida') notify(d, q.produtorId, `Serviço concluído: "${part?.nome}". Que tal avaliar a empresa?`, '/painel/orcamentos')
      })
    },

    // ---------- Avaliações (RN-017) ----------
    createReview(input: Omit<Review, 'id' | 'produtorId' | 'criadoEm'>): Result {
      if (!user || user.tipo !== 'produtor') return fail('Apenas produtores podem avaliar empresas.')
      if (dbRef.current.reviews.some((r) => r.produtorId === user.id && r.referencia.id === input.referencia.id))
        return fail('Você já avaliou este serviço.')
      mutate((d) => {
        d.reviews.unshift({ ...input, id: uid('r'), produtorId: user.id, criadoEm: now() })
        const c = d.companies.find((x) => x.id === input.companyId)
        if (c) notify(d, c.ownerId, `Você recebeu uma nova avaliação de ${user.nome}.`, `/empresas/${c.id}`)
      })
      return ok(undefined)
    },

    // ---------- Denúncias e moderação (RF-041, RF-043) ----------
    createReport(input: Pick<Report, 'alvoTipo' | 'alvoId' | 'motivo' | 'descricao'>): Result {
      if (!user) return fail('Entre na sua conta para denunciar.')
      mutate((d) => {
        d.reports.unshift({ ...input, id: uid('rep'), autorId: user.id, status: 'aberta', criadoEm: now() })
        d.users.filter((x) => x.tipo === 'admin').forEach((a) => notify(d, a.id, `Nova denúncia: ${input.motivo}`, '/admin/moderacao'))
      })
      return ok(undefined)
    },
    setReportStatus(id: string, status: Report['status']) {
      mutate((d) => {
        d.reports.find((x) => x.id === id)!.status = status
      })
    },

    // ---------- Administração (RF-040, RF-042) ----------
    setUserStatus(id: string, status: UserStatus) {
      mutate((d) => {
        d.users.find((x) => x.id === id)!.status = status
        audit(d, status === 'bloqueado' ? 'Usuário bloqueado' : 'Usuário desbloqueado', id, '')
      })
    },
    updatePlan(id: PlanId, patch: Partial<PlanDef>) {
      mutate((d) => {
        Object.assign(d.plans.find((x) => x.id === id)!, patch)
        audit(d, 'Plano atualizado', id, Object.keys(patch).join(', '))
      })
    },

    // ---------- Notificações ----------
    markRead(id: string) {
      mutate((d) => {
        const n = d.notifications.find((x) => x.id === id)
        if (n) n.lida = true
      })
    },
    markAllRead() {
      if (!user) return
      mutate((d) => d.notifications.filter((n) => n.userId === user.id).forEach((n) => (n.lida = true)))
    },

    resetDemo() {
      const fresh = createSeed()
      dbRef.current = fresh
      setDb(fresh)
      setSessionId(null)
    },
  }

  return { db, user, company, actions }
}

type Store = ReturnType<typeof useStoreValue>
const StoreContext = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore deve ser usado dentro de <StoreProvider>')
  return ctx
}
