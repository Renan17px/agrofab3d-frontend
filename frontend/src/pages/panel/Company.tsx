import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Eye,
  EyeOff,
  GitBranch,
  Lightbulb,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  Plus,
  Send,
  Star,
  Trash2,
} from 'lucide-react'
import type { CategoryId, MaterialId, ModelOriginType, PlanId, Proposal } from '@/types'
import { useStore, type CompanyInput, type PartInput } from '@/data/store'
import { CATEGORIES, CONDITIONS, LICENSES, MATERIALS, ORIGINS, SERVICES, TECHNOLOGIES, UFS, VIABILIDADE_LABEL, categoryLabel, suggestMaterials } from '@/data/constants'
import { matchLabel, matchReasons, matchScore } from '@/lib/match'
import { companyRating, userName } from '@/lib/selectors'
import { normalize } from '@/lib/search'
import { dateBR, maskCnpj, maskPhone, priceLabel, timeAgo } from '@/lib/format'
import { CompanyStatusBadge, ImageUploader, InterestStatusBadge, MaterialChip, PainCard, PainStatusBadge, PartImage, QuoteStatusBadge, VerifiedBadge } from '@/components/domain'
import { Alert, Badge, Button, Card, Checkbox, ChipGroup, EmptyState, Field, Input, LinkButton, Modal, PageHeader, Select, Stat, Textarea, cx, useToast } from '@/components/ui'

function useCompanyGuard() {
  const { company } = useStore()
  if (!company)
    return (
      <EmptyState title="Complete o perfil da sua empresa" action={<LinkButton to="/painel/empresa">Cadastrar empresa</LinkButton>}>
        Para publicar peças e encontrar oportunidades, primeiro cadastre os dados da empresa.
      </EmptyState>
    )
  return null
}

function StatusBanner() {
  const { company } = useStore()
  if (!company || company.status === 'aprovada') return null
  const msg = {
    pendente: ['warn', 'Cadastro em análise', 'Nossa equipe está verificando os dados da sua empresa. Enquanto isso, você pode completar o perfil, mas ainda não pode publicar peças nem demonstrar interesse em dores.'],
    rejeitada: ['error', 'Cadastro rejeitado', `Revise os dados e entre em contato com o suporte. ${company.motivoStatus ?? ''}`],
    bloqueada: ['error', 'Empresa bloqueada', `As funcionalidades restritas estão suspensas. ${company.motivoStatus ?? ''}`],
  }[company.status] as ['warn' | 'error', string, string]
  return (
    <div className="mb-6">
      <Alert tone={msg[0]} title={msg[1]}>{msg[2]}</Alert>
    </div>
  )
}

// ================= Resumo =================
export function CompanyHome() {
  const { db, company, user } = useStore()
  const guard = useCompanyGuard()
  if (guard) return <><PageHeader title={`Olá, ${user!.nome.split(' ')[0]}!`} />{guard}</>
  const c = company!
  const parts = db.parts.filter((p) => p.companyId === c.id)
  const views = parts.reduce((s, p) => s + p.visualizacoes, 0)
  const quotesNew = db.quotes.filter((q) => q.companyId === c.id && q.status === 'nova')
  const myInterests = db.interests.filter((i) => i.companyId === c.id)
  const r = companyRating(db, c.id)
  const plan = db.plans.find((p) => p.id === c.plano)!
  const opps = db.pains
    .filter((p) => p.status === 'aberta' && !myInterests.some((i) => i.painId === p.id))
    .map((p) => ({ p, s: matchScore(c, p) }))
    .filter((x) => x.s >= 50)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)

  return (
    <>
      <PageHeader
        title={c.nome}
        subtitle={<span className="flex flex-wrap items-center gap-2"><CompanyStatusBadge status={c.status} />{c.verificada && <VerifiedBadge small />}<Badge tone="earth">Plano {plan.nome}</Badge></span>}
        actions={<><LinkButton to={`/empresas/${c.id}`} variant="outline">Ver perfil público</LinkButton><LinkButton to="/painel/pecas/nova"><Plus className="h-4 w-4" /> Nova peça</LinkButton></>}
      />
      <StatusBanner />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Peças ativas" value={parts.filter((p) => p.ativo).length} icon={<Package className="h-5 w-5" />} hint={plan.limitePecas ? `de ${plan.limitePecas} no plano` : 'ilimitadas'} />
        <Stat label="Visualizações" value={plan.estatisticas === 'nenhuma' ? '-' : views} icon={<Eye className="h-5 w-5" />} hint={plan.estatisticas === 'nenhuma' ? 'Disponível no Profissional' : 'total do catálogo'} />
        <Stat label="Orçamentos novos" value={quotesNew.length} icon={<ClipboardList className="h-5 w-5" />} />
        <Stat label="Avaliação" value={r.total ? r.geral.toFixed(1) : '-'} icon={<Star className="h-5 w-5" />} hint={`${r.total} avaliações`} />
      </div>

      {quotesNew.length > 0 && (
        <div className="mt-6"><Alert tone="info" title={`${quotesNew.length} pedido(s) de orçamento aguardando resposta`} action={<LinkButton size="sm" to="/painel/orcamentos">Responder</LinkButton>}>Responda rápido: o prazo é um dos critérios mais valorizados pelos produtores.</Alert></div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-stone-900">Oportunidades compatíveis</h2><Link to="/painel/oportunidades" className="text-sm font-semibold text-campo-700 hover:underline">Ver todas</Link></div>
          <div className="space-y-3">
            {opps.map(({ p, s }) => (
              <PainCard key={p.id} pain={p} to={`/painel/oportunidades/${p.id}`} footer={<CompatBadge score={s} />} />
            ))}
            {opps.length === 0 && <EmptyState icon={<Lightbulb className="h-10 w-10" />} title="Nenhuma oportunidade nova no seu segmento">Amplie seus segmentos no perfil para receber mais oportunidades.</EmptyState>}
          </div>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-bold text-stone-900">Peças mais vistas</h2>
          {plan.estatisticas === 'nenhuma' ? (
            <Card className="p-5 text-sm text-stone-700">
              <BarChart3 className="mb-2 h-8 w-8 text-campo-600" />
              Estatísticas de visualização estão disponíveis a partir do plano Profissional.
              <LinkButton to="/painel/plano" size="sm" variant="secondary" className="mt-3">Ver planos</LinkButton>
            </Card>
          ) : (
            <Card className="divide-y divide-stone-100">
              {[...parts].sort((a, b) => b.visualizacoes - a.visualizacoes).slice(0, 5).map((p) => {
                const max = Math.max(...parts.map((x) => x.visualizacoes), 1)
                return (
                  <div key={p.id} className="p-3">
                    <div className="flex justify-between text-sm"><span className="truncate font-medium text-stone-900">{p.nome}</span><span className="text-stone-700">{p.visualizacoes}</span></div>
                    <div className="mt-1.5 h-2 rounded-full bg-stone-100"><div className="h-full rounded-full bg-campo-600" style={{ width: `${(p.visualizacoes / max) * 100}%` }} /></div>
                  </div>
                )
              })}
              {parts.length === 0 && <div className="p-5 text-sm text-stone-600">Nenhuma peça ainda.</div>}
            </Card>
          )}
        </section>
      </div>
    </>
  )
}

function CompatBadge({ score }: { score: number }) {
  const m = matchLabel(score)
  return <Badge tone={m.tone === 'alta' ? 'green' : m.tone === 'media' ? 'blue' : 'gray'}><Lightbulb className="h-3 w-3" /> {m.label} · {score}%</Badge>
}

// ================= Perfil da empresa (RF-004) =================
export function CompanyProfileForm() {
  const { company, user, actions } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [f, setF] = useState<CompanyInput>(() =>
    company
      ? { nome: company.nome, cnpj: company.cnpj, descricao: company.descricao, cidade: company.cidade, uf: company.uf, servicos: company.servicos, materiais: company.materiais, tecnologias: company.tecnologias, segmentos: company.segmentos, experiencia: company.experiencia, contato: { ...company.contato } }
      : { nome: '', cnpj: '', descricao: '', cidade: user?.cidade ?? '', uf: user?.uf ?? '', servicos: [], materiais: [], tecnologias: [], segmentos: [], experiencia: '', contato: { telefone: user?.telefone, email: user?.email } },
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof CompanyInput>(k: K, v: CompanyInput[K]) => setF((s) => ({ ...s, [k]: v }))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.nome.trim().length < 2) er.nome = 'Informe o nome da empresa.'
    if (f.cnpj.replace(/\D/g, '').length !== 14) er.cnpj = 'CNPJ deve ter 14 dígitos.'
    if (f.descricao.trim().length < 20) er.descricao = 'Descreva a empresa (mín. 20 caracteres).'
    if (!f.cidade || !f.uf) er.local = 'Informe cidade e UF.'
    if (f.segmentos.length === 0) er.segmentos = 'Escolha ao menos um segmento de atuação.'
    if (f.materiais.length === 0) er.materiais = 'Escolha ao menos um material.'
    setErrors(er)
    if (Object.keys(er).length) return toast('Revise os campos destacados.', 'error')
    const r = actions.saveCompany(f)
    if (!r.ok) return toast(r.error, 'error')
    toast(company ? 'Perfil atualizado.' : 'Empresa cadastrada! Seu perfil foi enviado para análise.')
    if (!company) nav('/painel')
  }

  return (
    <form onSubmit={save} noValidate>
      <PageHeader title={company ? 'Perfil da empresa' : 'Cadastrar empresa'} subtitle="Essas informações aparecem no seu perfil público e ajudam o sistema a indicar sua empresa para as dores certas." actions={company && <LinkButton to={`/empresas/${company.id}`} variant="outline">Ver perfil público</LinkButton>} />
      <StatusBanner />
      {company && (
        <Card className="mb-6 flex flex-wrap items-center gap-3 p-4 text-sm">
          <span className="text-stone-600">Status:</span> <CompanyStatusBadge status={company.status} />
          <span className="ml-2 text-stone-600">Verificação:</span> {company.verificada ? <VerifiedBadge small /> : <Badge tone="gray">Não verificada</Badge>}
          {company.verificada && <span className="text-xs text-stone-600">Alterar o CNPJ remove o selo até nova verificação.</span>}
        </Card>
      )}
      <div className="space-y-6">
        <Card className="space-y-4 p-5">
          <h2 className="font-bold text-stone-900">Dados da empresa</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome da empresa" required error={errors.nome} htmlFor="c-nome"><Input id="c-nome" value={f.nome} onChange={(e) => set('nome', e.target.value)} /></Field>
            <Field label="CNPJ" required error={errors.cnpj} htmlFor="c-cnpj" hint="Usado na verificação da empresa"><Input id="c-cnpj" inputMode="numeric" value={f.cnpj} onChange={(e) => set('cnpj', maskCnpj(e.target.value))} placeholder="00.000.000/0000-00" /></Field>
          </div>
          <Field label="Descrição" required error={errors.descricao} htmlFor="c-desc"><Textarea id="c-desc" value={f.descricao} onChange={(e) => set('descricao', e.target.value)} placeholder="O que vocês fazem, para quem e qual o diferencial" /></Field>
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <Field label="Cidade" required error={errors.local} htmlFor="c-cid"><Input id="c-cid" value={f.cidade} onChange={(e) => set('cidade', e.target.value)} /></Field>
            <Field label="UF" required htmlFor="c-uf"><Select id="c-uf" value={f.uf} onChange={(e) => set('uf', e.target.value)}><option value="">-</option>{UFS.map((u) => <option key={u}>{u}</option>)}</Select></Field>
          </div>
          <Field label="Experiência" htmlFor="c-exp"><Input id="c-exp" value={f.experiencia} onChange={(e) => set('experiencia', e.target.value)} placeholder="Ex.: 5 anos com impressão 3D, 2 no agro" /></Field>
        </Card>

        <Card className="space-y-5 p-5">
          <div>
            <h2 className="font-bold text-stone-900">Capacidade produtiva</h2>
            <p className="text-sm text-stone-600">Usamos seus segmentos e materiais para avisar você automaticamente sobre dores compatíveis.</p>
          </div>
          <Field label="Segmentos de atuação" required error={errors.segmentos}>
            <ChipGroup options={CATEGORIES.map((c) => ({ id: c.id, label: c.label }))} value={f.segmentos} onChange={(v) => set('segmentos', v as CategoryId[])} />
          </Field>
          <Field label="Materiais disponíveis" required error={errors.materiais}>
            <ChipGroup options={MATERIALS.map((m) => ({ id: m.id, label: m.nome }))} value={f.materiais} onChange={(v) => set('materiais', v as MaterialId[])} />
          </Field>
          <Field label="Tecnologias">
            <ChipGroup options={TECHNOLOGIES.map((t) => ({ id: t, label: t }))} value={f.tecnologias} onChange={(v) => set('tecnologias', v)} />
          </Field>
          <Field label="Serviços oferecidos">
            <ChipGroup options={SERVICES.map((t) => ({ id: t, label: t }))} value={f.servicos} onChange={(v) => set('servicos', v)} />
          </Field>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="font-bold text-stone-900">Formas de contato</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Telefone" htmlFor="c-tel"><Input id="c-tel" type="tel" value={f.contato.telefone ?? ''} onChange={(e) => set('contato', { ...f.contato, telefone: maskPhone(e.target.value) })} /></Field>
            <Field label="WhatsApp (com DDI e DDD)" htmlFor="c-wa" hint="Ex.: 5543999990000"><Input id="c-wa" inputMode="numeric" value={f.contato.whatsapp ?? ''} onChange={(e) => set('contato', { ...f.contato, whatsapp: e.target.value.replace(/\D/g, '') })} /></Field>
            <Field label="E-mail comercial" htmlFor="c-email"><Input id="c-email" type="email" value={f.contato.email ?? ''} onChange={(e) => set('contato', { ...f.contato, email: e.target.value })} /></Field>
            <Field label="Site" htmlFor="c-site"><Input id="c-site" type="url" value={f.contato.site ?? ''} onChange={(e) => set('contato', { ...f.contato, site: e.target.value })} placeholder="https://" /></Field>
          </div>
        </Card>
        <div className="flex justify-end"><Button type="submit" size="lg">{company ? 'Salvar alterações' : 'Enviar para análise'}</Button></div>
      </div>
    </form>
  )
}

// ================= Peças (RF-010..RF-016) =================
export function MyParts() {
  const { db, company, actions } = useStore()
  const toast = useToast()
  const [del, setDel] = useState<string | null>(null)
  const guard = useCompanyGuard()
  if (guard) return guard
  const plan = db.plans.find((p) => p.id === company!.plano)!
  const parts = db.parts.filter((p) => p.companyId === company!.id)
  const used = parts.filter((p) => p.moderacao !== 'removido').length
  return (
    <>
      <PageHeader title="Minhas peças" subtitle="Soluções que sua empresa oferece no catálogo técnico." actions={<LinkButton to="/painel/pecas/nova" className={company!.status !== 'aprovada' ? 'pointer-events-none opacity-50' : ''}><Plus className="h-4 w-4" /> Nova peça</LinkButton>} />
      <StatusBanner />
      <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
        <span className="text-stone-700">Uso do plano <strong>{plan.nome}</strong>: {used} de {plan.limitePecas ?? '∞'} peças</span>
        {plan.limitePecas && <div className="h-2 w-40 rounded-full bg-stone-100"><div className={cx('h-full rounded-full', used >= plan.limitePecas ? 'bg-red-600' : 'bg-campo-600')} style={{ width: `${Math.min(100, (used / plan.limitePecas) * 100)}%` }} /></div>}
      </Card>
      {parts.length === 0 ? (
        <EmptyState icon={<Package className="h-10 w-10" />} title="Nenhuma peça cadastrada" action={company!.status === 'aprovada' ? <LinkButton to="/painel/pecas/nova">Cadastrar primeira peça</LinkButton> : undefined} />
      ) : (
        <Card className="divide-y divide-stone-100">
          {parts.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <PartImage part={p} color={company!.cor} className="h-16 w-full shrink-0 rounded-lg sm:w-20" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link to={`/catalogo/${p.id}`} className="font-bold text-stone-900 hover:underline">{p.nome}</Link>
                  <Badge tone="earth">{p.versoes.at(-1)?.versao}</Badge>
                  {p.moderacao === 'removido' ? <Badge tone="red">Removida pela moderação</Badge> : p.ativo ? <Badge tone="green">Ativa</Badge> : <Badge>Inativa</Badge>}
                  {p.origem.tipo !== 'proprio' && <Badge tone="blue">{p.origem.licenca}</Badge>}
                </div>
                <div className="mt-0.5 text-sm text-stone-600">{categoryLabel(p.categoria)} · {p.material} · {priceLabel(p.preco)} · <Eye className="inline h-3.5 w-3.5" /> {p.visualizacoes}</div>
              </div>
              <div className="flex gap-1">
                <LinkButton to={`/painel/pecas/${p.id}`} variant="outline" size="sm"><Pencil className="h-4 w-4" /> Editar</LinkButton>
                {p.moderacao !== 'removido' && (
                  <Button variant="ghost" size="sm" onClick={() => { actions.setPartActive(p.id, !p.ativo); toast(p.ativo ? 'Peça desativada.' : 'Peça reativada.') }} aria-label={p.ativo ? 'Desativar' : 'Ativar'}>
                    {p.ativo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                )}
                <Button variant="ghost" size="sm" className="text-red-700" onClick={() => setDel(p.id)} aria-label="Excluir"><Trash2 className="h-4 w-4" /></Button>
              </div>
            </div>
          ))}
        </Card>
      )}
      <Modal open={!!del} onClose={() => setDel(null)} title="Excluir peça?" footer={<><Button variant="outline" onClick={() => setDel(null)}>Cancelar</Button><Button variant="danger" onClick={() => { actions.deletePart(del!); setDel(null); toast('Peça excluída.') }}>Excluir</Button></>}>
        <p className="text-sm text-stone-700">A peça e seu histórico de versões serão removidos do catálogo. Se quiser apenas ocultá-la temporariamente, prefira <strong>desativar</strong>.</p>
      </Modal>
    </>
  )
}

export function PartForm() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { db, company, user, actions } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const existing = id ? db.parts.find((p) => p.id === id && p.companyId === company?.id) : undefined
  const dor = params.get('dor') ? db.pains.find((d) => d.id === params.get('dor')) : undefined
  const proposta = dor && db.interests.find((i) => i.painId === dor.id && i.companyId === company?.id)?.proposta

  const [f, setF] = useState<PartInput>(() =>
    existing
      ? (({ id: _1, companyId: _2, versoes: _3, ativo: _4, moderacao: _5, visualizacoes: _6, criadoEm: _7, ...rest }) => rest)(existing)
      : {
          nome: dor?.titulo ?? '',
          descricao: dor ? `${proposta?.solucao ?? ''}\n\nSolução desenvolvida originalmente para: ${dor.descricao}`.trim() : '',
          categoria: dor?.categoria ?? 'maquinas',
          aplicacao: '',
          material: (proposta?.material || suggestMaterials(dor?.condicoes ?? [])[0] || 'PETG') as MaterialId,
          dimensoes: '',
          equipamento: dor?.maquina ?? '',
          fabricante: dor?.fabricante ?? '',
          modelo: dor?.modelo ?? '',
          temperatura: '',
          prazoDias: proposta?.prazoDias ?? 5,
          preco: null,
          imagens: dor?.imagens ?? [],
          origem: { tipo: 'proprio' },
          dorOrigemId: dor?.id,
          versaoInicial: dor ? 'Versão desenvolvida sob demanda' : 'Primeiro modelo',
        },
  )
  const [sobOrcamento, setSobOrcamento] = useState(f.preco == null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [verOpen, setVerOpen] = useState(false)
  const [verDesc, setVerDesc] = useState('')
  const [verFile, setVerFile] = useState('')
  const set = <K extends keyof PartInput>(k: K, v: PartInput[K]) => setF((s) => ({ ...s, [k]: v }))

  const guard = useCompanyGuard()
  if (guard) return guard
  if (id && !existing) return <EmptyState title="Peça não encontrada" action={<LinkButton to="/painel/pecas">Minhas peças</LinkButton>} />
  if (!existing && company!.status !== 'aprovada') return <><StatusBanner /><EmptyState title="Sua empresa ainda não está habilitada para publicar peças" action={<LinkButton to="/painel">Voltar</LinkButton>} /></>

  const externo = f.origem.tipo !== 'proprio'
  const ncWarning = externo && /NC/.test(f.origem.licenca ?? '')

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.nome.trim().length < 3) er.nome = 'Informe o nome da peça.'
    if (f.descricao.trim().length < 10) er.descricao = 'Descreva a peça.'
    if (!f.aplicacao.trim()) er.aplicacao = 'Informe a aplicação.'
    if (!f.dimensoes.trim()) er.dimensoes = 'Informe as dimensões.'
    if (!f.equipamento.trim()) er.equipamento = 'Informe o equipamento compatível.'
    if (!sobOrcamento && (!f.preco || f.preco <= 0)) er.preco = 'Informe o preço ou marque “sob orçamento”.'
    if (externo && !f.origem.url) er.url = 'Link de origem obrigatório para modelos externos.'
    if (externo && !f.origem.licenca) er.licenca = 'Informe a licença do modelo.'
    setErrors(er)
    if (Object.keys(er).length) return toast('Revise os campos destacados.', 'error')
    const r = actions.savePart({ ...f, preco: sobOrcamento ? null : f.preco }, existing?.id)
    if (!r.ok) return toast(r.error, 'error')
    toast(existing ? 'Peça atualizada.' : 'Peça publicada no catálogo!')
    nav('/painel/pecas')
  }

  const addVersion = () => {
    if (verDesc.trim().length < 3) return toast('Descreva o que mudou nesta versão.', 'error')
    const r = actions.addVersion(existing!.id, verDesc, verFile || undefined)
    if (!r.ok) return toast(r.error, 'error')
    toast(`${r.value.versao} registrada. As versões anteriores foram mantidas no histórico.`)
    setVerOpen(false)
    setVerDesc('')
    setVerFile('')
  }

  return (
    <form onSubmit={save} noValidate>
      <Link to="/painel/pecas" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-campo-700 hover:underline"><ArrowLeft className="h-4 w-4" /> Minhas peças</Link>
      <PageHeader title={existing ? `Editar: ${existing.nome}` : 'Cadastrar peça'} subtitle="Quanto mais completa a ficha técnica, mais fácil para o produtor saber se a peça atende à necessidade dele." />
      {dor && <div className="mb-6"><Alert tone="success" title="Transformando uma dor em produto do catálogo">Esta peça será vinculada à dor “{dor.titulo}”, ajudando outros produtores com o mesmo problema.</Alert></div>}

      <div className="space-y-6">
        <Card className="space-y-4 p-5">
          <h2 className="font-bold text-stone-900">Informações básicas</h2>
          <Field label="Nome da peça" required error={errors.nome} htmlFor="p-nome"><Input id="p-nome" value={f.nome} onChange={(e) => set('nome', e.target.value)} placeholder="Ex.: Suporte para sensor de pulverizador" /></Field>
          <Field label="Descrição" required error={errors.descricao} htmlFor="p-desc" hint="Use palavras que o produtor usaria para descrever o problema."><Textarea id="p-desc" value={f.descricao} onChange={(e) => set('descricao', e.target.value)} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Categoria" required htmlFor="p-cat"><Select id="p-cat" value={f.categoria} onChange={(e) => set('categoria', e.target.value as CategoryId)}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</Select></Field>
            <Field label="Aplicação" required error={errors.aplicacao} htmlFor="p-apl"><Input id="p-apl" value={f.aplicacao} onChange={(e) => set('aplicacao', e.target.value)} placeholder="Ex.: Ambiente externo, barra de pulverização" /></Field>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="font-bold text-stone-900">Especificações técnicas</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Material" required htmlFor="p-mat" hint={MATERIALS.find((m) => m.id === f.material)?.indicado}>
              <Select id="p-mat" value={f.material} onChange={(e) => set('material', e.target.value as MaterialId)}>{MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.nome}, até ~{m.tempMax} °C</option>)}</Select>
            </Field>
            <Field label="Dimensões" required error={errors.dimensoes} htmlFor="p-dim"><Input id="p-dim" value={f.dimensoes} onChange={(e) => set('dimensoes', e.target.value)} placeholder="Ex.: 120 × 45 × 38 mm" /></Field>
            <Field label="Equipamento compatível" required error={errors.equipamento} htmlFor="p-eq"><Input id="p-eq" value={f.equipamento} onChange={(e) => set('equipamento', e.target.value)} placeholder="Ex.: Pulverizador autopropelido" /></Field>
            <Field label="Fabricante do equipamento" htmlFor="p-fab"><Input id="p-fab" value={f.fabricante} onChange={(e) => set('fabricante', e.target.value)} placeholder="Ex.: Diversos" /></Field>
            <Field label="Modelo(s) compatível(is)" htmlFor="p-mod"><Input id="p-mod" value={f.modelo} onChange={(e) => set('modelo', e.target.value)} /></Field>
            <Field label="Temperatura de utilização" htmlFor="p-temp"><Input id="p-temp" value={f.temperatura ?? ''} onChange={(e) => set('temperatura', e.target.value)} placeholder="Ex.: -10 °C a 85 °C" /></Field>
            <Field label="Prazo estimado de fabricação (dias)" required htmlFor="p-prazo"><Input id="p-prazo" type="number" min={1} value={f.prazoDias} onChange={(e) => set('prazoDias', Number(e.target.value))} /></Field>
            <Field label="Preço (R$)" error={errors.preco} htmlFor="p-preco">
              <Input id="p-preco" type="number" min={0} step="0.01" disabled={sobOrcamento} value={sobOrcamento ? '' : f.preco ?? ''} onChange={(e) => set('preco', e.target.value ? Number(e.target.value) : null)} />
              <div className="pt-2"><Checkbox label="Sob orçamento (sem preço fixo)" checked={sobOrcamento} onChange={setSobOrcamento} /></div>
            </Field>
          </div>
        </Card>

        <Card className="space-y-4 p-5">
          <h2 className="font-bold text-stone-900">Fotos</h2>
          <ImageUploader value={f.imagens} onChange={(v) => set('imagens', v)} />
        </Card>

        <Card className="space-y-4 p-5">
          <div>
            <h2 className="font-bold text-stone-900">Origem e licença do modelo 3D</h2>
            <p className="text-sm text-stone-600">Obrigatório para modelos de terceiros: registre a fonte e respeite a licença do autor.</p>
          </div>
          <Field label="Origem do modelo">
            <ChipGroup single options={ORIGINS.map((o) => ({ id: o.id, label: o.label }))} value={[f.origem.tipo]} onChange={(v) => set('origem', { ...f.origem, tipo: v[0] as ModelOriginType })} />
          </Field>
          {externo && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Link do modelo original" required error={errors.url} htmlFor="o-url"><Input id="o-url" type="url" value={f.origem.url ?? ''} onChange={(e) => set('origem', { ...f.origem, url: e.target.value })} placeholder="https://" /></Field>
              <Field label="Autor original" htmlFor="o-autor"><Input id="o-autor" value={f.origem.autor ?? ''} onChange={(e) => set('origem', { ...f.origem, autor: e.target.value })} /></Field>
              <Field label="Licença" required error={errors.licenca} htmlFor="o-lic"><Select id="o-lic" value={f.origem.licenca ?? ''} onChange={(e) => set('origem', { ...f.origem, licenca: e.target.value })}><option value="">Selecione</option>{LICENSES.map((l) => <option key={l}>{l}</option>)}</Select></Field>
              <Field label="Condições de uso" htmlFor="o-cond"><Input id="o-cond" value={f.origem.condicoes ?? ''} onChange={(e) => set('origem', { ...f.origem, condicoes: e.target.value })} placeholder="Ex.: Uso comercial com atribuição" /></Field>
            </div>
          )}
          {ncWarning && <Alert tone="warn" title="Atenção à licença não comercial">Licenças “NC” geralmente proíbem a venda da peça. Confirme se você tem autorização do autor antes de cobrar por ela.</Alert>}
        </Card>

        {existing ? (
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-bold text-stone-900"><GitBranch className="h-5 w-5 text-terra-700" /> Versões</h2>
              <Button variant="secondary" size="sm" onClick={() => setVerOpen(true)}><Plus className="h-4 w-4" /> Nova versão</Button>
            </div>
            <p className="mb-3 text-sm text-stone-600">Alterações técnicas relevantes geram uma nova versão. As versões anteriores nunca são sobrescritas.</p>
            <ol className="divide-y divide-stone-100 rounded-xl border border-stone-200">
              {[...existing.versoes].reverse().map((v, i) => (
                <li key={v.versao} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                  <Badge tone={i === 0 ? 'green' : 'gray'}>{v.versao}{i === 0 && ' · atual'}</Badge>
                  <span className="flex-1 text-stone-800">{v.descricao}</span>
                  {v.arquivoModelo && <span className="text-xs text-stone-600">{v.arquivoModelo}</span>}
                  <span className="text-xs text-stone-600">{dateBR(v.data)}{v.autorId && ` · ${userName(db, v.autorId)}`}</span>
                </li>
              ))}
            </ol>
          </Card>
        ) : (
          <Card className="p-5">
            <Field label="Descrição da versão inicial (V1)" htmlFor="p-v1"><Input id="p-v1" value={f.versaoInicial ?? ''} onChange={(e) => set('versaoInicial', e.target.value)} /></Field>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <LinkButton to="/painel/pecas" variant="outline">Cancelar</LinkButton>
          <Button type="submit" size="lg">{existing ? 'Salvar alterações' : 'Publicar no catálogo'}</Button>
        </div>
      </div>

      <Modal open={verOpen} onClose={() => setVerOpen(false)} title={`Registrar ${existing ? `V${existing.versoes.length + 1}` : ''}`} footer={<><Button variant="outline" onClick={() => setVerOpen(false)}>Cancelar</Button><Button onClick={addVersion}>Registrar versão</Button></>}>
        <div className="space-y-4">
          <Field label="O que mudou?" required htmlFor="v-desc"><Textarea id="v-desc" value={verDesc} onChange={(e) => setVerDesc(e.target.value)} placeholder="Ex.: Novo encaixe + estrutura reforçada" /></Field>
          <Field label="Arquivo do modelo (opcional)" hint="Formatos .STL, .OBJ ou .STEP. No backend, o arquivo passa por antivírus antes de ser armazenado." htmlFor="v-file">
            <input id="v-file" type="file" accept=".stl,.obj,.step,.stp,.3mf" onChange={(e) => setVerFile(e.target.files?.[0]?.name ?? '')} className="block w-full text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-campo-100 file:px-3 file:py-2 file:font-semibold file:text-campo-900" />
          </Field>
          <p className="text-xs text-stone-600">Registrado por {user?.nome} em {dateBR(new Date().toISOString())}.</p>
        </div>
      </Modal>
    </form>
  )
}

// ================= Oportunidades (RF-022, RF-023) =================
export function Opportunities() {
  const { db, company } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('')
  const [uf, setUf] = useState('')
  const [onlyMatch, setOnlyMatch] = useState(false)
  const [sort, setSort] = useState<'compat' | 'recentes'>('compat')
  const guard = useCompanyGuard()
  const list = useMemo(() => {
    if (!company) return []
    const nq = normalize(q)
    return db.pains
      .filter((p) => p.status === 'aberta' || p.status === 'em_negociacao')
      .map((p) => ({ p, s: matchScore(company, p) }))
      .filter(({ p }) => !nq || normalize(`${p.titulo} ${p.descricao} ${p.maquina}`).includes(nq))
      .filter(({ p }) => !cat || p.categoria === cat)
      .filter(({ p }) => !uf || p.uf === uf)
      .filter(({ s }) => !onlyMatch || s >= 50)
      .sort((a, b) => (sort === 'compat' ? b.s - a.s || b.p.criadoEm.localeCompare(a.p.criadoEm) : b.p.criadoEm.localeCompare(a.p.criadoEm)))
  }, [db, company, q, cat, uf, onlyMatch, sort])
  if (guard) return guard

  return (
    <>
      <PageHeader title="Oportunidades" subtitle="Dores publicadas por produtores. Ordenadas pela compatibilidade com seus segmentos, materiais e região." />
      <StatusBanner />
      <div className="mb-4 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_190px_120px_170px]">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por palavra-chave" aria-label="Buscar" />
        <Select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Categoria"><option value="">Todas as categorias</option>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</Select>
        <Select value={uf} onChange={(e) => setUf(e.target.value)} aria-label="UF"><option value="">Todas UF</option>{UFS.map((u) => <option key={u}>{u}</option>)}</Select>
        <Select value={sort} onChange={(e) => setSort(e.target.value as 'compat')} aria-label="Ordenar"><option value="compat">Mais compatíveis</option><option value="recentes">Mais recentes</option></Select>
        <div className="sm:col-span-2 lg:col-span-4"><Checkbox label="Mostrar apenas dores compatíveis com meu perfil" checked={onlyMatch} onChange={setOnlyMatch} /></div>
      </div>
      <div className="space-y-3">
        {list.map(({ p, s }) => {
          const mine = db.interests.find((i) => i.painId === p.id && i.companyId === company!.id)
          return <PainCard key={p.id} pain={p} to={`/painel/oportunidades/${p.id}`} footer={<div className="flex flex-wrap gap-2"><CompatBadge score={s} />{mine && <InterestStatusBadge status={mine.status} />}</div>} />
        })}
        {list.length === 0 && <EmptyState icon={<Lightbulb className="h-10 w-10" />} title="Nenhuma oportunidade com esses filtros" />}
      </div>
    </>
  )
}

const emptyProposal = (): Proposal => ({ solucao: '', material: '', prazoDias: null, preco: null, infoTecnica: '', observacoes: '', viabilidade: 'total' })

export function OpportunityDetail() {
  const { id } = useParams()
  const { db, company, actions } = useStore()
  const toast = useToast()
  const pain = db.pains.find((p) => p.id === id)
  const mine = pain && company ? db.interests.find((i) => i.painId === pain.id && i.companyId === company.id) : undefined
  const [mensagem, setMensagem] = useState(mine?.mensagem ?? '')
  const [withProposal, setWithProposal] = useState(!!mine?.proposta || !mine)
  const [p, setP] = useState<Proposal>(mine?.proposta ?? emptyProposal())
  const guard = useCompanyGuard()
  if (guard) return guard
  if (!pain || pain.status === 'removida') return <EmptyState title="Oportunidade não encontrada" action={<LinkButton to="/painel/oportunidades">Voltar</LinkButton>} />

  const c = company!
  const score = matchScore(c, pain)
  const reasons = matchReasons(c, pain)
  const sugeridos = suggestMaterials(pain.condicoes)
  const produtor = db.users.find((u) => u.id === pain.produtorId)
  const ativa = pain.status === 'aberta' || pain.status === 'em_negociacao'
  const total = db.interests.filter((i) => i.painId === pain.id).length
  const plan = db.plans.find((x) => x.id === c.plano)!
  const month = new Date().toISOString().slice(0, 7)
  const usedMonth = db.interests.filter((i) => i.companyId === c.id && i.criadoEm.startsWith(month)).length
  const alreadyProduct = db.parts.some((x) => x.dorOrigemId === pain.id && x.companyId === c.id)

  const send = () => {
    if (mensagem.trim().length < 5) return toast('Escreva uma mensagem para o produtor.', 'error')
    if (withProposal && p.solucao.trim().length < 10) return toast('Descreva a solução proposta.', 'error')
    const r = actions.sendInterest(pain.id, mensagem, withProposal ? p : undefined)
    if (!r.ok) return toast(r.error, 'error')
    toast(withProposal ? 'Proposta enviada ao produtor!' : 'Interesse registrado. O produtor foi avisado.')
  }

  return (
    <>
      <Link to="/painel/oportunidades" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-campo-700 hover:underline"><ArrowLeft className="h-4 w-4" /> Oportunidades</Link>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <PainStatusBadge status={pain.status} />
              <Badge tone="earth">{categoryLabel(pain.categoria)}</Badge>
              <CompatBadge score={score} />
              <span className="text-xs text-stone-600">{timeAgo(pain.criadoEm)} · {total} empresa(s) interessada(s)</span>
            </div>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">{pain.titulo}</h1>
            <p className="mt-2 whitespace-pre-line text-stone-800">{pain.descricao}</p>
            {pain.imagens.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto">{pain.imagens.map((src, i) => <img key={i} src={src} alt={`Foto ${i + 1}`} className="h-28 w-28 shrink-0 rounded-xl object-cover" />)}</div>}
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-stone-600">Máquina / equipamento</dt><dd className="font-medium text-stone-900">{[pain.maquina, pain.fabricante, pain.modelo].filter(Boolean).join(' · ') || '-'}</dd></div>
              <div><dt className="text-stone-600">Quantidade</dt><dd className="font-medium text-stone-900">{pain.quantidade} un.</dd></div>
              <div><dt className="text-stone-600">Localização</dt><dd className="flex items-center gap-1 font-medium text-stone-900"><MapPin className="h-4 w-4" />{pain.cidade}/{pain.uf}</dd></div>
              <div><dt className="text-stone-600">Prazo desejado</dt><dd className="font-medium text-stone-900">{pain.prazoDesejado ? dateBR(pain.prazoDesejado + 'T12:00:00') : 'Não informado'}</dd></div>
              {pain.condicoes.length > 0 && <div className="sm:col-span-2"><dt className="text-stone-600">Condições de uso</dt><dd className="mt-1 flex flex-wrap gap-1.5">{pain.condicoes.map((x) => <Badge key={x}>{CONDITIONS.find((y) => y.id === x)?.label}</Badge>)}</dd></div>}
              {pain.outrasInfos && <div className="sm:col-span-2"><dt className="text-stone-600">Outras informações</dt><dd className="text-stone-900">{pain.outrasInfos}</dd></div>}
            </dl>
          </Card>

          {mine?.status === 'aceita' ? (
            <Card className="border-campo-300 p-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-campo-900"><CheckCircle2 className="h-5 w-5" /> O produtor escolheu sua empresa!</h2>
              <p className="mt-1 text-sm text-stone-700">Entre em contato para combinar detalhes, protótipo e entrega.</p>
              <div className="mt-4 grid gap-2 text-sm">
                <div className="font-semibold text-stone-900">{produtor?.nome}</div>
                {produtor?.telefone && <a href={`tel:${produtor.telefone.replace(/\D/g, '')}`} className="flex items-center gap-2 text-campo-800 hover:underline"><Phone className="h-4 w-4" />{produtor.telefone}</a>}
                {produtor?.email && <a href={`mailto:${produtor.email}`} className="flex items-center gap-2 text-campo-800 hover:underline"><Mail className="h-4 w-4" />{produtor.email}</a>}
              </div>
              {!alreadyProduct && (
                <div className="mt-5 rounded-xl bg-stone-50 p-4">
                  <div className="font-semibold text-stone-900">Essa solução pode ajudar outros produtores?</div>
                  <p className="text-sm text-stone-700">Depois de validada, transforme-a em um produto do catálogo.</p>
                  <LinkButton to={`/painel/pecas/nova?dor=${pain.id}`} size="sm" variant="secondary" className="mt-3"><Package className="h-4 w-4" /> Cadastrar no catálogo</LinkButton>
                </div>
              )}
            </Card>
          ) : !ativa ? (
            <Alert tone="info" title="Esta dor não está mais recebendo interesses">O produtor encerrou ou resolveu esta necessidade.</Alert>
          ) : c.status !== 'aprovada' ? (
            <StatusBanner />
          ) : (
            <Card className="space-y-4 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-stone-900">{mine ? 'Atualizar sua resposta' : 'Demonstrar interesse'}</h2>
                {mine && <InterestStatusBadge status={mine.status} />}
              </div>
              {mine?.status === 'recusada' && <Alert tone="warn">O produtor recusou a proposta anterior. Você pode enviar uma nova proposta.</Alert>}
              <Field label="Mensagem para o produtor" required htmlFor="i-msg"><Textarea id="i-msg" value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Ex.: Nós conseguimos desenvolver essa peça! Já atendemos problemas parecidos." /></Field>
              <Checkbox label="Incluir proposta técnica (solução, material, prazo e preço)" checked={withProposal} onChange={setWithProposal} />
              {withProposal && (
                <div className="space-y-4 rounded-xl bg-stone-50 p-4">
                  <Field label="Solução proposta" required htmlFor="i-sol"><Textarea id="i-sol" value={p.solucao} onChange={(e) => setP({ ...p, solucao: e.target.value })} placeholder="Como pretende resolver o problema" /></Field>
                  <Field label="Viabilidade em impressão 3D" hint="Algumas aplicações exigem usinagem ou componentes metálicos.">
                    <div className="grid gap-2">
                      {(Object.keys(VIABILIDADE_LABEL) as Proposal['viabilidade'][]).map((v) => (
                        <label key={v} className={cx('flex cursor-pointer items-center gap-3 rounded-xl border bg-white p-3 text-sm', p.viabilidade === v ? 'border-campo-600 ring-1 ring-campo-600' : 'border-stone-200')}>
                          <input type="radio" name="viab" checked={p.viabilidade === v} onChange={() => setP({ ...p, viabilidade: v })} className="accent-campo-700" />
                          {VIABILIDADE_LABEL[v]}
                        </label>
                      ))}
                    </div>
                  </Field>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field label="Material" htmlFor="i-mat">
                      <Select id="i-mat" value={p.material} onChange={(e) => setP({ ...p, material: e.target.value as MaterialId })}>
                        <option value="">A definir</option>
                        {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.nome}{sugeridos.includes(m.id) ? ' ★ indicado' : ''}</option>)}
                      </Select>
                    </Field>
                    <Field label="Prazo (dias)" htmlFor="i-prazo"><Input id="i-prazo" type="number" min={1} value={p.prazoDias ?? ''} onChange={(e) => setP({ ...p, prazoDias: e.target.value ? Number(e.target.value) : null })} /></Field>
                    <Field label="Preço aprox. (R$)" hint="Vazio = após análise" htmlFor="i-preco"><Input id="i-preco" type="number" min={0} value={p.preco ?? ''} onChange={(e) => setP({ ...p, preco: e.target.value ? Number(e.target.value) : null })} /></Field>
                  </div>
                  {p.material && sugeridos.length > 0 && !sugeridos.includes(p.material as MaterialId) && (
                    <Alert tone="warn">Pelas condições informadas pelo produtor, os materiais mais indicados seriam {sugeridos.join(', ')}. Explique sua escolha nas informações técnicas.</Alert>
                  )}
                  <Field label="Informações técnicas" htmlFor="i-tec"><Textarea id="i-tec" value={p.infoTecnica} onChange={(e) => setP({ ...p, infoTecnica: e.target.value })} rows={3} /></Field>
                  <Field label="Observações importantes" htmlFor="i-obs"><Textarea id="i-obs" value={p.observacoes} onChange={(e) => setP({ ...p, observacoes: e.target.value })} rows={2} /></Field>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs text-stone-600">{plan.limiteInteressesMes != null ? `Interesses usados este mês: ${usedMonth}/${plan.limiteInteressesMes} (plano ${plan.nome})` : `Interesses ilimitados (plano ${plan.nome})`}</span>
                <Button onClick={send}><Send className="h-4 w-4" /> {mine ? 'Atualizar' : withProposal ? 'Enviar proposta' : 'Demonstrar interesse'}</Button>
              </div>
            </Card>
          )}
        </div>
        <aside className="space-y-4">
          <Card className="p-5">
            <h2 className="font-bold text-stone-900">Por que é compatível?</h2>
            <div className="mt-2"><CompatBadge score={score} /></div>
            <ul className="mt-3 space-y-1.5 text-sm text-stone-700">
              {reasons.map((r) => <li key={r} className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-campo-600" />{r}</li>)}
              {reasons.length === 0 && <li className="flex gap-2"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />Fora dos seus segmentos cadastrados.</li>}
            </ul>
          </Card>
          {sugeridos.length > 0 && (
            <Card className="p-5">
              <h2 className="font-bold text-stone-900">Materiais indicados</h2>
              <p className="text-xs text-stone-600">Com base nas condições de uso informadas.</p>
              <div className="mt-2 flex flex-wrap gap-1.5">{sugeridos.map((m) => <MaterialChip key={m} id={m} />)}</div>
            </Card>
          )}
          <Card className="p-5 text-sm text-stone-700">
            <h2 className="mb-1 font-bold text-stone-900">Privacidade do produtor</h2>
            O contato do produtor é liberado somente quando ele aceita conversar com sua empresa. Publicado por {produtor?.nome.split(' ')[0]}, {pain.cidade}/{pain.uf}.
          </Card>
        </aside>
      </div>
    </>
  )
}

export function MyProposals() {
  const { db, company } = useStore()
  const guard = useCompanyGuard()
  if (guard) return guard
  const list = db.interests.filter((i) => i.companyId === company!.id).sort((a, b) => b.atualizadoEm.localeCompare(a.atualizadoEm))
  return (
    <>
      <PageHeader title="Minhas propostas" subtitle="Interesses e propostas enviados para dores dos produtores." />
      {list.length === 0 ? (
        <EmptyState icon={<Send className="h-10 w-10" />} title="Você ainda não enviou propostas" action={<LinkButton to="/painel/oportunidades">Ver oportunidades</LinkButton>} />
      ) : (
        <Card className="divide-y divide-stone-100">
          {list.map((i) => {
            const pain = db.pains.find((p) => p.id === i.painId)!
            return (
              <Link key={i.id} to={`/painel/oportunidades/${pain.id}`} className="flex flex-col gap-2 p-4 hover:bg-stone-50 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-stone-900">{pain.titulo}</div>
                  <div className="text-sm text-stone-600">{pain.cidade}/{pain.uf} · {i.proposta ? `${i.proposta.material || 'material a definir'} · ${priceLabel(i.proposta.preco)}` : 'Somente interesse'} · {timeAgo(i.atualizadoEm)}</div>
                </div>
                <div className="flex gap-2"><PainStatusBadge status={pain.status} /><InterestStatusBadge status={i.status} /></div>
              </Link>
            )
          })}
        </Card>
      )}
    </>
  )
}

export function CompanyQuotes() {
  const { db, company, actions } = useStore()
  const toast = useToast()
  const [resp, setResp] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [preco, setPreco] = useState('')
  const [prazo, setPrazo] = useState('')
  const guard = useCompanyGuard()
  if (guard) return guard
  const quotes = db.quotes.filter((q) => q.companyId === company!.id)
  const open = (id: string) => {
    const q = db.quotes.find((x) => x.id === id)!
    const part = db.parts.find((p) => p.id === q.partId)
    setResp(id)
    setTexto(q.resposta?.texto ?? '')
    setPreco(q.resposta?.preco?.toString() ?? (part?.preco ? String(part.preco * q.quantidade) : ''))
    setPrazo(q.resposta?.prazoDias?.toString() ?? String(part?.prazoDias ?? ''))
  }
  const send = () => {
    if (texto.trim().length < 3) return toast('Escreva uma resposta.', 'error')
    actions.respondQuote(resp!, texto, preco ? Number(preco) : null, prazo ? Number(prazo) : null)
    toast('Resposta enviada ao produtor.')
    setResp(null)
  }
  return (
    <>
      <PageHeader title="Pedidos de orçamento" subtitle="Produtores interessados nas peças do seu catálogo." />
      {quotes.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-10 w-10" />} title="Nenhum pedido de orçamento ainda" />
      ) : (
        <div className="space-y-3">
          {quotes.map((q) => {
            const part = db.parts.find((p) => p.id === q.partId)
            const prod = db.users.find((u) => u.id === q.produtorId)
            return (
              <Card key={q.id} className="p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                  {part && <PartImage part={part} color={company!.cor} className="h-16 w-full shrink-0 rounded-lg sm:w-20" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><QuoteStatusBadge status={q.status} /><span className="text-xs text-stone-600">{timeAgo(q.criadoEm)}</span></div>
                    <div className="mt-1 font-bold text-stone-900">{part?.nome} · {q.quantidade} un.</div>
                    <div className="text-sm text-stone-600">{prod?.nome}, {prod?.cidade}/{prod?.uf}</div>
                    {q.mensagem && <p className="mt-1 text-sm text-stone-800">“{q.mensagem}”</p>}
                    {q.resposta && <p className="mt-2 rounded-lg bg-stone-50 p-2 text-sm text-stone-700"><strong>Sua resposta:</strong> {q.resposta.texto} · {priceLabel(q.resposta.preco)}{q.resposta.prazoDias ? ` · ${q.resposta.prazoDias} dias` : ''}</p>}
                    {/* O contato do produtor é liberado porque ele próprio iniciou o pedido de orçamento */}
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      {prod?.telefone && <a href={`tel:${prod.telefone.replace(/\D/g, '')}`} className="flex items-center gap-1 text-campo-800 hover:underline"><Phone className="h-4 w-4" />{prod.telefone}</a>}
                      {prod?.email && <a href={`mailto:${prod.email}`} className="flex items-center gap-1 text-campo-800 hover:underline"><Mail className="h-4 w-4" />{prod.email}</a>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {(q.status === 'nova' || q.status === 'respondida') && <Button size="sm" variant={q.status === 'nova' ? 'primary' : 'outline'} onClick={() => open(q.id)}>{q.status === 'nova' ? 'Responder' : 'Editar resposta'}</Button>}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      <Modal open={!!resp} onClose={() => setResp(null)} title="Responder orçamento" footer={<><Button variant="outline" onClick={() => setResp(null)}>Cancelar</Button><Button onClick={send}>Enviar resposta</Button></>}>
        <div className="space-y-4">
          <Field label="Resposta" required htmlFor="qr-txt"><Textarea id="qr-txt" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Confirme a compatibilidade, condições e forma de entrega" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor total (R$)" htmlFor="qr-preco" hint="Vazio = a combinar"><Input id="qr-preco" type="number" min={0} value={preco} onChange={(e) => setPreco(e.target.value)} /></Field>
            <Field label="Prazo (dias)" htmlFor="qr-prazo"><Input id="qr-prazo" type="number" min={1} value={prazo} onChange={(e) => setPrazo(e.target.value)} /></Field>
          </div>
        </div>
      </Modal>
    </>
  )
}

export function CompanyPlan() {
  const { db, company, actions } = useStore()
  const toast = useToast()
  const [choose, setChoose] = useState<PlanId | null>(null)
  const guard = useCompanyGuard()
  if (guard) return guard
  const c = company!
  const plan = db.plans.find((p) => p.id === c.plano)!
  const parts = db.parts.filter((p) => p.companyId === c.id && p.moderacao !== 'removido').length
  const month = new Date().toISOString().slice(0, 7)
  const used = db.interests.filter((i) => i.companyId === c.id && i.criadoEm.startsWith(month)).length
  const meter = (v: number, max: number | null) => (
    <div className="mt-2 h-2.5 rounded-full bg-stone-100"><div className={cx('h-full rounded-full', max && v >= max ? 'bg-red-600' : 'bg-campo-600')} style={{ width: max ? `${Math.min(100, (v / max) * 100)}%` : '8%' }} /></div>
  )
  return (
    <>
      <PageHeader title="Plano da empresa" subtitle="Escolha os recursos que fazem sentido para o momento do seu negócio." />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5"><div className="text-sm text-stone-600">Peças cadastradas</div><div className="text-2xl font-extrabold text-stone-900">{parts} / {plan.limitePecas ?? '∞'}</div>{meter(parts, plan.limitePecas)}</Card>
        <Card className="p-5"><div className="text-sm text-stone-600">Interesses neste mês</div><div className="text-2xl font-extrabold text-stone-900">{used} / {plan.limiteInteressesMes ?? '∞'}</div>{meter(used, plan.limiteInteressesMes)}</Card>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {db.plans.map((p) => (
          <Card key={p.id} className={cx('flex flex-col p-5', p.id === c.plano && 'ring-2 ring-campo-600')}>
            <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold text-stone-900">{p.nome}</h2>{p.id === c.plano && <Badge tone="green">Atual</Badge>}</div>
            <div className="mt-1 text-xl font-bold text-stone-900">{p.preco}</div>
            <ul className="mt-4 flex-1 space-y-2 text-sm">{p.recursos.map((r) => <li key={r} className="flex gap-2 text-stone-800"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-campo-600" />{r}</li>)}</ul>
            <Button className="mt-5 w-full" variant={p.id === c.plano ? 'outline' : 'primary'} disabled={p.id === c.plano} onClick={() => setChoose(p.id)}>{p.id === c.plano ? 'Plano atual' : 'Mudar para este plano'}</Button>
          </Card>
        ))}
      </div>
      <Modal open={!!choose} onClose={() => setChoose(null)} title="Confirmar mudança de plano" footer={<><Button variant="outline" onClick={() => setChoose(null)}>Cancelar</Button><Button onClick={() => { actions.changePlan(choose!); toast('Plano alterado (simulação).'); setChoose(null) }}>Confirmar</Button></>}>
        <p className="text-sm text-stone-700">No protótipo a mudança é imediata e sem cobrança. Pagamentos estão previstos para uma evolução futura da plataforma.</p>
        {choose && <p className="mt-3 text-sm text-stone-900">Novo plano: <strong>{db.plans.find((p) => p.id === choose)?.nome}</strong></p>}
      </Modal>
    </>
  )
}
