import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Building2, CalendarDays, Cpu, Layers, MapPin, Search, Wrench } from 'lucide-react'
import { useStore } from '@/data/store'
import { CATEGORIES, UFS, categoryLabel } from '@/data/constants'
import { companyRating, publicCompanies } from '@/lib/selectors'
import { normalize } from '@/lib/search'
import { dateBR } from '@/lib/format'
import { CompanyCard, CompanyStatusBadge, ContactBox, MaterialChip, PartCard, RatingSummary, ReportButton, ReviewList, TagList, VerifiedBadge } from '@/components/domain'
import { Alert, Avatar, Badge, Card, Checkbox, EmptyState, Input, LinkButton, PageHeader, Select, Tabs } from '@/components/ui'
import { Container } from '@/components/Layout'

export function Companies() {
  const { db } = useStore()
  const [q, setQ] = useState('')
  const [seg, setSeg] = useState('')
  const [uf, setUf] = useState('')
  const [ver, setVer] = useState(false)
  const list = useMemo(() => {
    const nq = normalize(q)
    return publicCompanies(db)
      .filter((c) => !nq || normalize(`${c.nome} ${c.descricao} ${c.servicos.join(' ')} ${c.cidade}`).includes(nq))
      .filter((c) => !seg || c.segmentos.includes(seg as never))
      .filter((c) => !uf || c.uf === uf)
      .filter((c) => !ver || c.verificada)
      .sort((a, b) => Number(b.verificada) - Number(a.verificada) || companyRating(db, b.id).geral - companyRating(db, a.id).geral)
  }, [db, q, seg, uf, ver])

  return (
    <Container>
      <PageHeader title="Empresas de impressão 3D" subtitle="Encontre quem fabrica soluções para o seu tipo de problema, perto de você." />
      <div className="mb-6 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_220px_160px_auto] lg:items-center">
        <label className="relative">
          <span className="sr-only">Buscar empresa</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, serviço ou cidade" className="pl-9" />
        </label>
        <Select value={seg} onChange={(e) => setSeg(e.target.value)} aria-label="Segmento">
          <option value="">Todos os segmentos</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
        <Select value={uf} onChange={(e) => setUf(e.target.value)} aria-label="Estado">
          <option value="">Todos os estados</option>
          {UFS.map((u) => <option key={u}>{u}</option>)}
        </Select>
        <Checkbox label="Somente verificadas" checked={ver} onChange={setVer} />
      </div>
      {list.length === 0 ? (
        <EmptyState icon={<Building2 className="h-10 w-10" />} title="Nenhuma empresa encontrada">Tente remover alguns filtros.</EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => <CompanyCard key={c.id} company={c} />)}
        </div>
      )}
    </Container>
  )
}

export function CompanyProfile() {
  const { id } = useParams()
  const { db, user } = useStore()
  const [tab, setTab] = useState<'pecas' | 'avaliacoes' | 'sobre'>('pecas')
  const c = db.companies.find((x) => x.id === id)
  const isOwner = user?.companyId === c?.id
  if (!c || (c.status !== 'aprovada' && !isOwner && user?.tipo !== 'admin'))
    return (
      <Container>
        <EmptyState title="Empresa não encontrada" action={<LinkButton to="/empresas">Ver empresas</LinkButton>} />
      </Container>
    )
  const parts = db.parts.filter((p) => p.companyId === c.id && p.ativo && p.moderacao === 'publicado')
  const r = companyRating(db, c.id)

  return (
    <>
      <div className="h-28 sm:h-36" style={{ background: `linear-gradient(135deg, ${c.cor}, #0c2014)` }} />
      <Container className="!pt-0">
        <Link to="/empresas" className="sr-only">Voltar</Link>
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <div className="rounded-2xl bg-white p-1.5 shadow-md">
              <Avatar name={c.nome} color={c.cor} size={88} />
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">{c.nome}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-700">
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {c.cidade}/{c.uf}</span>
                {c.verificada && <VerifiedBadge />}
                {c.status !== 'aprovada' && <CompanyStatusBadge status={c.status} />}
              </div>
            </div>
          </div>
          {isOwner && <LinkButton to="/painel/empresa" variant="outline">Editar perfil</LinkButton>}
        </div>

        {c.status !== 'aprovada' && (
          <div className="mt-4"><Alert tone="warn" title="Perfil ainda não público">Este perfil só ficará visível para os produtores após a aprovação da plataforma.</Alert></div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <p className="text-stone-800">{c.descricao}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {c.segmentos.map((s) => <Badge key={s} tone="green">{categoryLabel(s)}</Badge>)}
            </div>
            <div className="mt-8">
              <Tabs
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: 'pecas', label: 'Peças', count: parts.length },
                  { id: 'avaliacoes', label: 'Avaliações', count: r.total },
                  { id: 'sobre', label: 'Capacidade produtiva' },
                ]}
              />
              <div className="pt-6">
                {tab === 'pecas' &&
                  (parts.length ? (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{parts.map((p) => <PartCard key={p.id} part={p} />)}</div>
                  ) : (
                    <EmptyState title="Nenhuma peça cadastrada ainda" />
                  ))}
                {tab === 'avaliacoes' && (
                  <Card className="p-5">
                    <RatingSummary companyId={c.id} />
                    <div className="mt-4 border-t border-stone-100"><ReviewList companyId={c.id} /></div>
                  </Card>
                )}
                {tab === 'sobre' && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Card className="p-5">
                      <h3 className="mb-3 flex items-center gap-2 font-bold text-stone-900"><Wrench className="h-4 w-4 text-campo-700" /> Serviços</h3>
                      <TagList items={c.servicos} />
                    </Card>
                    <Card className="p-5">
                      <h3 className="mb-3 flex items-center gap-2 font-bold text-stone-900"><Layers className="h-4 w-4 text-campo-700" /> Materiais</h3>
                      <div className="flex flex-wrap gap-1.5">{c.materiais.map((m) => <MaterialChip key={m} id={m} />)}</div>
                    </Card>
                    <Card className="p-5">
                      <h3 className="mb-3 flex items-center gap-2 font-bold text-stone-900"><Cpu className="h-4 w-4 text-campo-700" /> Tecnologias</h3>
                      <TagList items={c.tecnologias} />
                    </Card>
                    <Card className="p-5">
                      <h3 className="mb-3 flex items-center gap-2 font-bold text-stone-900"><CalendarDays className="h-4 w-4 text-campo-700" /> Experiência</h3>
                      <p className="text-sm text-stone-700">{c.experiencia}</p>
                      <p className="mt-2 text-xs text-stone-600">Na plataforma desde {dateBR(c.criadoEm)}</p>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
          <aside className="space-y-4">
            <Card className="p-5">
              <h2 className="mb-3 font-bold text-stone-900">Entrar em contato</h2>
              <ContactBox company={c} assunto="uma solução para minha propriedade" />
            </Card>
            <Card className="p-5">
              <RatingSummary companyId={c.id} />
            </Card>
            {c.verificada && (
              <p className="px-1 text-xs text-stone-600">
                O selo indica que CNPJ e dados cadastrais foram verificados em {c.verificadaEm ? dateBR(c.verificadaEm) : '-'}. <Link to="/selo-verificado" className="underline">Ele não garante qualidade, prazo ou resultado do serviço.</Link>
              </p>
            )}
            <div className="px-1"><ReportButton alvoTipo="empresa" alvoId={c.id} /></div>
          </aside>
        </div>
      </Container>
    </>
  )
}
