import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck, Ban, Building2, CheckCircle2, FileClock, Flag, GitBranch, Loader2, Package, Search, Siren, Unlock, Users, XCircle } from 'lucide-react'
import type { CompanyStatus, PlanDef, PlanId, UserRole } from '@/types'
import { useStore } from '@/data/store'
import { categoryLabel } from '@/data/constants'
import { normalize } from '@/lib/search'
import { dateBR, dateTimeBR, timeAgo } from '@/lib/format'
import { userName } from '@/lib/selectors'
import { CompanyStatusBadge, PainStatusBadge, PartImage, TagList, VerifiedBadge } from '@/components/domain'
import { Alert, Avatar, Badge, Button, Card, EmptyState, Field, Input, LinkButton, Modal, PageHeader, Select, Stat, Tabs, Textarea, cx, useToast } from '@/components/ui'

export function AdminHome() {
  const { db } = useStore()
  const pend = db.companies.filter((c) => c.status === 'pendente')
  const reports = db.reports.filter((r) => r.status === 'aberta')
  const byCat = useMemo(() => {
    const m = new Map<string, number>()
    db.pains.forEach((p) => m.set(p.categoria, (m.get(p.categoria) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [db.pains])
  const max = Math.max(...byCat.map(([, n]) => n), 1)
  return (
    <>
      <PageHeader title="Administração" subtitle="Visão geral da plataforma AgroFab3D." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Usuários" value={db.users.length} icon={<Users className="h-5 w-5" />} hint={`${db.users.filter((u) => u.tipo === 'produtor').length} produtores`} />
        <Stat label="Empresas" value={db.companies.length} icon={<Building2 className="h-5 w-5" />} hint={`${db.companies.filter((c) => c.verificada).length} verificadas`} />
        <Stat label="Peças no catálogo" value={db.parts.filter((p) => p.ativo && p.moderacao === 'publicado').length} icon={<Package className="h-5 w-5" />} />
        <Stat label="Dores abertas" value={db.pains.filter((p) => p.status === 'aberta').length} icon={<Siren className="h-5 w-5" />} hint={`${db.pains.filter((p) => p.status === 'resolvida').length} resolvidas`} />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Alert tone={pend.length ? 'warn' : 'success'} title={`${pend.length} empresa(s) aguardando análise`} action={pend.length ? <LinkButton size="sm" to="/admin/empresas">Analisar</LinkButton> : undefined}>
          Verifique CNPJ e dados cadastrais antes de aprovar.
        </Alert>
        <Alert tone={reports.length ? 'error' : 'success'} title={`${reports.length} denúncia(s) em aberto`} action={reports.length ? <LinkButton size="sm" to="/admin/moderacao">Moderar</LinkButton> : undefined}>
          Conteúdos denunciados pelos usuários.
        </Alert>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-bold text-stone-900">Dores por categoria</h2>
          <div className="space-y-2">
            {byCat.map(([cat, n]) => (
              <div key={cat} className="flex items-center gap-3 text-sm">
                <span className="w-36 truncate text-stone-700">{categoryLabel(cat as never)}</span>
                <div className="h-2.5 flex-1 rounded-full bg-stone-100"><div className="h-full rounded-full bg-terra-500" style={{ width: `${(n / max) * 100}%` }} /></div>
                <span className="w-6 text-right font-semibold">{n}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 font-bold text-stone-900">Atividade recente</h2>
          <ul className="space-y-2 text-sm">
            {db.audit.slice(0, 6).map((a) => (
              <li key={a.id} className="flex justify-between gap-3"><span className="text-stone-800"><strong>{a.acao}</strong>, {a.detalhe}</span><span className="shrink-0 text-xs text-stone-600">{timeAgo(a.data)}</span></li>
            ))}
          </ul>
        </Card>
      </div>
      <Card className="mt-6 p-5">
        <h2 className="mb-3 font-bold text-stone-900">Funil da plataforma</h2>
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          {[
            ['Dores publicadas', db.pains.length],
            ['Com interesse', new Set(db.interests.map((i) => i.painId)).size],
            ['Em negociação/aceitas', db.interests.filter((i) => i.status === 'aceita').length],
            ['Viraram produto', db.parts.filter((p) => p.dorOrigemId).length],
          ].map(([l, n]) => (
            <div key={l as string} className="rounded-xl bg-campo-50 p-4"><div className="text-2xl font-extrabold text-campo-800">{n}</div><div className="text-xs text-stone-700">{l}</div></div>
          ))}
        </div>
      </Card>
    </>
  )
}

// ================= Empresas (RF-006, RF-007, RN-018) =================
export function AdminCompanies() {
  const { db, actions } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<CompanyStatus | 'todas'>('pendente')
  const [sel, setSel] = useState<string | null>(null)
  const [motivo, setMotivo] = useState('')
  const [checking, setChecking] = useState(false)
  const [checked, setChecked] = useState<null | { ok: boolean; texto: string }>(null)
  const list = db.companies.filter((c) => tab === 'todas' || c.status === tab)
  const c = sel ? db.companies.find((x) => x.id === sel) : undefined
  const owner = c && db.users.find((u) => u.id === c.ownerId)

  // RNF-005: no sistema real a consulta é feita pelo backend (chaves protegidas). Aqui é simulada.
  const consultarCnpj = () => {
    setChecking(true)
    setChecked(null)
    setTimeout(() => {
      const ok = c!.cnpj.replace(/\D/g, '').length === 14
      setChecking(false)
      setChecked(ok ? { ok, texto: `CNPJ ${c!.cnpj} ATIVO · Município ${c!.cidade}/${c!.uf} confere com o cadastro.` } : { ok, texto: 'CNPJ inválido ou não encontrado.' })
    }, 1200)
  }

  const change = (status: CompanyStatus) => {
    if ((status === 'rejeitada' || status === 'bloqueada') && motivo.trim().length < 5) return toast('Informe o motivo.', 'error')
    actions.setCompanyStatus(c!.id, status, motivo || undefined)
    toast(`Empresa ${status}.`)
    setSel(null)
    setMotivo('')
    setChecked(null)
  }

  return (
    <>
      <PageHeader title="Empresas" subtitle="Analise cadastros, altere status e conceda o selo de verificação." />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={(['pendente', 'aprovada', 'rejeitada', 'bloqueada', 'todas'] as const).map((s) => ({ id: s, label: s === 'todas' ? 'Todas' : s[0]!.toUpperCase() + s.slice(1) + 's', count: s === 'todas' ? db.companies.length : db.companies.filter((x) => x.status === s).length }))}
      />
      <div className="mt-4">
        {list.length === 0 ? (
          <EmptyState icon={<Building2 className="h-10 w-10" />} title="Nenhuma empresa neste status" />
        ) : (
          <Card className="divide-y divide-stone-100">
            {list.map((x) => (
              <div key={x.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <Avatar name={x.nome} color={x.cor} size={40} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2"><span className="font-bold text-stone-900">{x.nome}</span><CompanyStatusBadge status={x.status} />{x.verificada && <VerifiedBadge small />}</div>
                  <div className="text-sm text-stone-600">CNPJ {x.cnpj} · {x.cidade}/{x.uf} · cadastrada {timeAgo(x.criadoEm)}</div>
                </div>
                <Button size="sm" variant={x.status === 'pendente' ? 'primary' : 'outline'} onClick={() => { setSel(x.id); setChecked(null); setMotivo(x.motivoStatus ?? '') }}>{x.status === 'pendente' ? 'Analisar' : 'Gerenciar'}</Button>
              </div>
            ))}
          </Card>
        )}
      </div>

      <Modal open={!!c} onClose={() => setSel(null)} title={c ? `Analisar: ${c.nome}` : ''} size="lg">
        {c && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2"><CompanyStatusBadge status={c.status} />{c.verificada ? <VerifiedBadge small /> : <Badge>Sem selo</Badge>}<Badge tone="earth">Plano {c.plano}</Badge></div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-stone-600">CNPJ</dt><dd className="font-semibold text-stone-900">{c.cnpj}</dd></div>
              <div><dt className="text-stone-600">Localização</dt><dd className="font-semibold text-stone-900">{c.cidade}/{c.uf}</dd></div>
              <div><dt className="text-stone-600">Responsável</dt><dd className="font-semibold text-stone-900">{owner?.nome} · {owner?.email}</dd></div>
              <div><dt className="text-stone-600">Experiência</dt><dd className="text-stone-900">{c.experiencia || '-'}</dd></div>
              <div className="sm:col-span-2"><dt className="text-stone-600">Descrição</dt><dd className="text-stone-900">{c.descricao}</dd></div>
              <div className="sm:col-span-2"><dt className="mb-1 text-stone-600">Segmentos</dt><dd><TagList items={c.segmentos.map((s) => categoryLabel(s))} /></dd></div>
              <div className="sm:col-span-2"><dt className="mb-1 text-stone-600">Materiais e tecnologias</dt><dd><TagList items={[...c.materiais, ...c.tecnologias]} /></dd></div>
            </dl>
            <div className="rounded-xl border border-stone-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-stone-900">Consulta de dados públicos (CNPJ)</span>
                <Button size="sm" variant="secondary" onClick={consultarCnpj} disabled={checking}>{checking ? <><Loader2 className="h-4 w-4 animate-spin" /> Consultando…</> : 'Consultar'}</Button>
              </div>
              {checked && <p className={cx('mt-2 flex items-center gap-2 text-sm', checked.ok ? 'text-campo-800' : 'text-red-700')}>{checked.ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}{checked.texto}</p>}
              <p className="mt-2 text-xs text-stone-600">Simulação: no sistema real a consulta é feita pelo servidor, sem expor chaves de API ao navegador.</p>
            </div>
            <Field label="Motivo / observação" hint="Obrigatório para rejeitar ou bloquear. O responsável será notificado." htmlFor="adm-motivo">
              <Textarea id="adm-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} />
            </Field>
            <div className="flex flex-wrap gap-2 border-t border-stone-100 pt-4">
              {c.status !== 'aprovada' && <Button onClick={() => change('aprovada')}><CheckCircle2 className="h-4 w-4" /> Aprovar</Button>}
              {c.status === 'pendente' && <Button variant="outline" onClick={() => change('rejeitada')}><XCircle className="h-4 w-4" /> Rejeitar</Button>}
              {c.status !== 'bloqueada' && <Button variant="danger" onClick={() => change('bloqueada')}><Ban className="h-4 w-4" /> Bloquear</Button>}
              {c.status !== 'pendente' && <Button variant="ghost" onClick={() => change('pendente')}>Voltar para pendente</Button>}
              {c.status === 'aprovada' && (
                <Button
                  variant={c.verificada ? 'ghost' : 'secondary'}
                  className="ml-auto"
                  onClick={() => {
                    if (!c.verificada && !checked?.ok) return toast('Consulte o CNPJ antes de conceder o selo.', 'error')
                    actions.setVerified(c.id, !c.verificada)
                    toast(c.verificada ? 'Selo removido.' : 'Selo concedido.')
                  }}
                >
                  <BadgeCheck className="h-4 w-4" /> {c.verificada ? 'Remover selo' : 'Conceder selo verificado'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}

// ================= Usuários (RF-040) =================
export function AdminUsers() {
  const { db, user: me, actions } = useStore()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [tipo, setTipo] = useState<UserRole | ''>('')
  const list = db.users.filter((u) => (!tipo || u.tipo === tipo) && (!q || normalize(`${u.nome} ${u.email}`).includes(normalize(q))))
  const roleLabel = { produtor: 'Produtor', empresa: 'Empresa', admin: 'Admin' }
  return (
    <>
      <PageHeader title="Usuários" subtitle="Consulte, bloqueie ou desbloqueie contas." />
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_200px]">
        <label className="relative"><span className="sr-only">Buscar</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome ou e-mail" className="pl-9" /></label>
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as UserRole)} aria-label="Tipo"><option value="">Todos os tipos</option><option value="produtor">Produtores</option><option value="empresa">Empresas</option><option value="admin">Administradores</option></Select>
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-stone-200 bg-stone-50 text-stone-600">
            <tr><th className="px-4 py-3 font-semibold">Usuário</th><th className="px-4 py-3 font-semibold">Tipo</th><th className="px-4 py-3 font-semibold">Local</th><th className="px-4 py-3 font-semibold">Cadastro / termos</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {list.map((u) => (
              <tr key={u.id}>
                <td className="px-4 py-3"><div className="font-semibold text-stone-900">{u.nome}</div><div className="text-xs text-stone-600">{u.email}</div></td>
                <td className="px-4 py-3"><Badge tone={u.tipo === 'admin' ? 'earth' : u.tipo === 'empresa' ? 'blue' : 'green'}>{roleLabel[u.tipo]}</Badge></td>
                <td className="px-4 py-3 text-stone-700">{u.cidade ? `${u.cidade}/${u.uf}` : '-'}</td>
                <td className="px-4 py-3 text-xs text-stone-700">{dateBR(u.criadoEm)}<br />Termos aceitos: {dateTimeBR(u.termosAceitosEm)}</td>
                <td className="px-4 py-3">{u.status === 'ativo' ? <Badge tone="green">Ativo</Badge> : <Badge tone="red">Bloqueado</Badge>}</td>
                <td className="px-4 py-3 text-right">
                  {u.id !== me!.id && u.tipo !== 'admin' && (
                    u.status === 'ativo' ? (
                      <Button size="sm" variant="ghost" className="text-red-700" onClick={() => { actions.setUserStatus(u.id, 'bloqueado'); toast(`${u.nome} bloqueado.`) }}><Ban className="h-4 w-4" /> Bloquear</Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => { actions.setUserStatus(u.id, 'ativo'); toast(`${u.nome} desbloqueado.`) }}><Unlock className="h-4 w-4" /> Desbloquear</Button>
                    )
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  )
}

// ================= Moderação (RF-041, RF-043) =================
export function AdminModeration() {
  const { db, actions } = useStore()
  const toast = useToast()
  const [tab, setTab] = useState<'denuncias' | 'pecas' | 'dores'>('denuncias')
  const open = db.reports.filter((r) => r.status === 'aberta')
  const targetLink = (tipo: string, id: string) => (tipo === 'peca' ? `/catalogo/${id}` : tipo === 'empresa' ? `/empresas/${id}` : '#')
  const targetName = (tipo: string, id: string) =>
    tipo === 'peca' ? db.parts.find((p) => p.id === id)?.nome : tipo === 'dor' ? db.pains.find((p) => p.id === id)?.titulo : db.companies.find((c) => c.id === id)?.nome
  return (
    <>
      <PageHeader title="Moderação de conteúdo" subtitle="Analise denúncias, peças e dores publicadas." />
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'denuncias', label: 'Denúncias', count: open.length }, { id: 'pecas', label: 'Peças', count: db.parts.length }, { id: 'dores', label: 'Dores', count: db.pains.length }]} />
      <div className="mt-4">
        {tab === 'denuncias' &&
          (db.reports.length === 0 ? (
            <EmptyState icon={<Flag className="h-10 w-10" />} title="Nenhuma denúncia" />
          ) : (
            <div className="space-y-3">
              {db.reports.map((r) => (
                <Card key={r.id} className={cx('p-4', r.status !== 'aberta' && 'opacity-70')}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={r.status === 'aberta' ? 'red' : r.status === 'resolvida' ? 'green' : 'gray'}>{r.status}</Badge>
                        <Badge>{r.alvoTipo}</Badge>
                        <span className="text-xs text-stone-600">{timeAgo(r.criadoEm)} · por {userName(db, r.autorId)}</span>
                      </div>
                      <div className="mt-1 font-bold text-stone-900">{r.motivo}</div>
                      <Link to={targetLink(r.alvoTipo, r.alvoId)} className="text-sm text-campo-700 hover:underline">{targetName(r.alvoTipo, r.alvoId) ?? 'Conteúdo removido'}</Link>
                      {r.descricao && <p className="mt-1 text-sm text-stone-700">“{r.descricao}”</p>}
                    </div>
                    {r.status === 'aberta' && (
                      <div className="flex flex-wrap gap-2">
                        {r.alvoTipo === 'peca' && <Button size="sm" variant="danger" onClick={() => { actions.moderatePart(r.alvoId, 'removido'); actions.setReportStatus(r.id, 'resolvida'); toast('Peça removida e denúncia resolvida.') }}>Remover peça</Button>}
                        {r.alvoTipo === 'dor' && <Button size="sm" variant="danger" onClick={() => { actions.setPainStatus(r.alvoId, 'removida'); actions.setReportStatus(r.id, 'resolvida'); toast('Dor removida e denúncia resolvida.') }}>Remover dor</Button>}
                        {r.alvoTipo === 'empresa' && <LinkButton size="sm" variant="outline" to="/admin/empresas">Gerenciar empresa</LinkButton>}
                        <Button size="sm" variant="secondary" onClick={() => { actions.setReportStatus(r.id, 'resolvida'); toast('Denúncia marcada como resolvida.') }}>Resolvida</Button>
                        <Button size="sm" variant="ghost" onClick={() => { actions.setReportStatus(r.id, 'descartada'); toast('Denúncia descartada.', 'info') }}>Descartar</Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ))}
        {tab === 'pecas' && (
          <Card className="divide-y divide-stone-100">
            {db.parts.map((p) => {
              const c = db.companies.find((x) => x.id === p.companyId)
              return (
                <div key={p.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <PartImage part={p} color={c?.cor} className="h-12 w-16 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <Link to={`/catalogo/${p.id}`} className="font-semibold text-stone-900 hover:underline">{p.nome}</Link>
                    <div className="text-xs text-stone-600">{c?.nome} · {p.origem.tipo === 'proprio' ? 'Modelo próprio' : `${p.origem.tipo} · ${p.origem.licenca}`}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {p.moderacao === 'removido' ? <Badge tone="red">Removida</Badge> : p.ativo ? <Badge tone="green">Publicada</Badge> : <Badge>Inativa</Badge>}
                    {p.moderacao === 'publicado' ? (
                      <Button size="sm" variant="ghost" className="text-red-700" onClick={() => { actions.moderatePart(p.id, 'removido'); toast('Peça removida.') }}>Remover</Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => { actions.moderatePart(p.id, 'publicado'); toast('Peça republicada.') }}>Restaurar</Button>
                    )}
                  </div>
                </div>
              )
            })}
          </Card>
        )}
        {tab === 'dores' && (
          <Card className="divide-y divide-stone-100">
            {db.pains.map((p) => (
              <div key={p.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-stone-900">{p.titulo}</div>
                  <div className="text-xs text-stone-600">{userName(db, p.produtorId)} · {p.cidade}/{p.uf} · {timeAgo(p.criadoEm)}</div>
                </div>
                <div className="flex items-center gap-2">
                  <PainStatusBadge status={p.status} />
                  {p.status !== 'removida' && <Button size="sm" variant="ghost" className="text-red-700" onClick={() => { actions.setPainStatus(p.id, 'removida'); toast('Dor removida.') }}>Remover</Button>}
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </>
  )
}

// ================= Planos (caso de uso: Gerenciar planos de assinatura) =================
export function AdminPlans() {
  const { db, actions } = useStore()
  const toast = useToast()
  const [edit, setEdit] = useState<PlanDef | null>(null)
  return (
    <>
      <PageHeader title="Planos de assinatura" subtitle="Defina limites e recursos de cada plano empresarial." />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {db.plans.map((p) => (
          <Card key={p.id} className="flex flex-col p-5">
            <div className="flex items-center justify-between"><h2 className="text-lg font-extrabold text-stone-900">{p.nome}</h2><Badge>{db.companies.filter((c) => c.plano === p.id).length} empresas</Badge></div>
            <div className="mt-1 text-xl font-bold">{p.preco}</div>
            <dl className="mt-3 space-y-1 text-sm">
              <div className="flex justify-between"><dt className="text-stone-600">Limite de peças</dt><dd className="font-semibold">{p.limitePecas ?? 'Ilimitado'}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-600">Interesses/mês</dt><dd className="font-semibold">{p.limiteInteressesMes ?? 'Ilimitado'}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-600">Estatísticas</dt><dd className="font-semibold capitalize">{p.estatisticas}</dd></div>
              <div className="flex justify-between"><dt className="text-stone-600">Destaque</dt><dd className="font-semibold">{p.destaque ? 'Sim' : 'Não'}</dd></div>
            </dl>
            <Button variant="outline" className="mt-4" onClick={() => setEdit({ ...p, recursos: [...p.recursos] })}>Editar plano</Button>
          </Card>
        ))}
      </div>
      <Modal
        open={!!edit}
        onClose={() => setEdit(null)}
        title={`Editar plano ${edit?.nome ?? ''}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setEdit(null)}>Cancelar</Button>
            <Button onClick={() => { const { id, ...patch } = edit!; actions.updatePlan(id as PlanId, patch); toast('Plano atualizado.'); setEdit(null) }}>Salvar</Button>
          </>
        }
      >
        {edit && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nome" htmlFor="pl-nome"><Input id="pl-nome" value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} /></Field>
              <Field label="Preço exibido" htmlFor="pl-preco"><Input id="pl-preco" value={edit.preco} onChange={(e) => setEdit({ ...edit, preco: e.target.value })} /></Field>
              <Field label="Limite de peças" hint="Vazio = ilimitado" htmlFor="pl-lp"><Input id="pl-lp" type="number" min={0} value={edit.limitePecas ?? ''} onChange={(e) => setEdit({ ...edit, limitePecas: e.target.value ? Number(e.target.value) : null })} /></Field>
              <Field label="Interesses por mês" hint="Vazio = ilimitado" htmlFor="pl-li"><Input id="pl-li" type="number" min={0} value={edit.limiteInteressesMes ?? ''} onChange={(e) => setEdit({ ...edit, limiteInteressesMes: e.target.value ? Number(e.target.value) : null })} /></Field>
              <Field label="Estatísticas" htmlFor="pl-est"><Select id="pl-est" value={edit.estatisticas} onChange={(e) => setEdit({ ...edit, estatisticas: e.target.value as PlanDef['estatisticas'] })}><option value="nenhuma">Nenhuma</option><option value="basicas">Básicas</option><option value="completas">Completas</option></Select></Field>
              <Field label="Destaque nas buscas" htmlFor="pl-dest"><Select id="pl-dest" value={edit.destaque ? '1' : '0'} onChange={(e) => setEdit({ ...edit, destaque: e.target.value === '1' })}><option value="1">Sim</option><option value="0">Não</option></Select></Field>
            </div>
            <Field label="Recursos exibidos (um por linha)" htmlFor="pl-rec"><Textarea id="pl-rec" value={edit.recursos.join('\n')} onChange={(e) => setEdit({ ...edit, recursos: e.target.value.split('\n') })} rows={5} /></Field>
          </div>
        )}
      </Modal>
    </>
  )
}

// ================= Histórico de versões e auditoria (RN-016, RNF-012) =================
export function AdminHistory() {
  const { db } = useStore()
  const [tab, setTab] = useState<'versoes' | 'auditoria'>('versoes')
  const [q, setQ] = useState('')
  const versions = db.parts
    .flatMap((p) => p.versoes.map((v, i) => ({ p, v, atual: i === p.versoes.length - 1 })))
    .filter(({ p }) => !q || normalize(p.nome).includes(normalize(q)))
    .sort((a, b) => b.v.data.localeCompare(a.v.data))
  const audit = db.audit.filter((a) => !q || normalize(`${a.acao} ${a.detalhe}`).includes(normalize(q)))
  return (
    <>
      <PageHeader title="Histórico e auditoria" subtitle="Rastreabilidade de versões de peças, licenças e alterações cadastrais." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'versoes', label: 'Versões de peças', count: versions.length }, { id: 'auditoria', label: 'Log de auditoria', count: audit.length }]} />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrar…" className="sm:w-64" aria-label="Filtrar" />
      </div>
      {tab === 'versoes' ? (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-600"><tr><th className="px-4 py-3 font-semibold">Peça</th><th className="px-4 py-3 font-semibold">Versão</th><th className="px-4 py-3 font-semibold">Alterações</th><th className="px-4 py-3 font-semibold">Data</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {versions.map(({ p, v, atual }) => (
                <tr key={p.id + v.versao}>
                  <td className="px-4 py-3"><Link to={`/catalogo/${p.id}`} className="font-semibold text-stone-900 hover:underline">{p.nome}</Link><div className="text-xs text-stone-600">{db.companies.find((c) => c.id === p.companyId)?.nome}</div></td>
                  <td className="px-4 py-3"><Badge tone={atual ? 'green' : 'gray'}><GitBranch className="h-3 w-3" />{v.versao}{atual && ' · atual'}</Badge></td>
                  <td className="px-4 py-3 text-stone-800">{v.descricao}{v.arquivoModelo && <div className="text-xs text-stone-600">{v.arquivoModelo}</div>}</td>
                  <td className="px-4 py-3 text-stone-700">{dateBR(v.data)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-stone-200 bg-stone-50 text-stone-600"><tr><th className="px-4 py-3 font-semibold">Data/hora</th><th className="px-4 py-3 font-semibold">Usuário</th><th className="px-4 py-3 font-semibold">Ação</th><th className="px-4 py-3 font-semibold">Detalhe</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {audit.map((a) => (
                <tr key={a.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-stone-700"><FileClock className="mr-1 inline h-3.5 w-3.5" />{dateTimeBR(a.data)}</td>
                  <td className="px-4 py-3 text-stone-800">{userName(db, a.userId)}</td>
                  <td className="px-4 py-3 font-semibold text-stone-900">{a.acao}</td>
                  <td className="px-4 py-3 text-stone-700">{a.detalhe || '-'} <span className="text-xs text-stone-500">({a.alvo})</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}

