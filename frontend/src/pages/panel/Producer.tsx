import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Box, CalendarClock, CheckCircle2, ClipboardList, Film, Lightbulb, MapPin, MessageSquare, Pencil, Search, Siren, Star, XCircle } from 'lucide-react'
import type { PainStatus } from '@/types'
import { useStore } from '@/data/store'
import { CONDITIONS, VIABILIDADE_LABEL, categoryLabel, suggestMaterials } from '@/data/constants'
import { matchReasons, matchScore } from '@/lib/match'
import { companyRating } from '@/lib/selectors'
import { dateBR, priceLabel, timeAgo } from '@/lib/format'
import { ContactBox, InterestStatusBadge, MaterialChip, PainCard, PainStatusBadge, PartImage, QuoteStatusBadge, ReviewModal, VerifiedBadge } from '@/components/domain'
import { Alert, Avatar, Badge, Button, Card, EmptyState, LinkButton, Modal, PageHeader, Stars, Stat, Tabs, useToast } from '@/components/ui'

export function ProducerHome() {
  const { db, user } = useStore()
  const pains = db.pains.filter((p) => p.produtorId === user!.id && p.status !== 'removida')
  const quotes = db.quotes.filter((q) => q.produtorId === user!.id)
  const propostas = db.interests.filter((i) => pains.some((p) => p.id === i.painId) && i.status === 'proposta')
  return (
    <>
      <PageHeader title={`Olá, ${user!.nome.split(' ')[0]}!`} subtitle="Acompanhe suas dores, propostas e orçamentos." actions={<LinkButton to="/tenho-uma-dor" variant="sun"><Siren className="h-4 w-4" /> Nova dor</LinkButton>} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Dores abertas" value={pains.filter((p) => p.status === 'aberta' || p.status === 'em_negociacao').length} icon={<Siren className="h-5 w-5" />} />
        <Stat label="Propostas para avaliar" value={propostas.length} icon={<Lightbulb className="h-5 w-5" />} />
        <Stat label="Orçamentos" value={quotes.length} icon={<ClipboardList className="h-5 w-5" />} hint={`${quotes.filter((q) => q.status === 'respondida').length} respondidos`} />
        <Stat label="Problemas resolvidos" value={pains.filter((p) => p.status === 'resolvida').length + quotes.filter((q) => q.status === 'concluida').length} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>
      {propostas.length > 0 && (
        <div className="mt-6">
          <Alert tone="success" title={`Você tem ${propostas.length} proposta(s) aguardando sua resposta`} action={<LinkButton to={`/painel/dores/${propostas[0]!.painId}`} size="sm">Ver propostas</LinkButton>}>
            Compare material, prazo e preço antes de escolher.
          </Alert>
        </div>
      )}
      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-stone-900">Minhas dores recentes</h2><Link to="/painel/dores" className="text-sm font-semibold text-campo-700 hover:underline">Ver todas</Link></div>
          <div className="space-y-3">
            {pains.slice(0, 3).map((p) => <PainCard key={p.id} pain={p} to={`/painel/dores/${p.id}`} />)}
            {pains.length === 0 && <EmptyState title="Nenhuma dor publicada" action={<LinkButton to="/tenho-uma-dor" variant="sun">Pedir uma solução</LinkButton>} />}
          </div>
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-bold text-stone-900">Orçamentos recentes</h2><Link to="/painel/orcamentos" className="text-sm font-semibold text-campo-700 hover:underline">Ver todos</Link></div>
          <Card className="divide-y divide-stone-100">
            {quotes.slice(0, 4).map((q) => {
              const part = db.parts.find((p) => p.id === q.partId)
              return (
                <Link key={q.id} to="/painel/orcamentos" className="flex items-center gap-3 p-4 hover:bg-stone-50">
                  {part && <PartImage part={part} className="h-12 w-12 shrink-0 rounded-lg" />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-stone-900">{part?.nome}</div>
                    <div className="text-xs text-stone-600">{q.quantidade} un. · {timeAgo(q.criadoEm)}</div>
                  </div>
                  <QuoteStatusBadge status={q.status} />
                </Link>
              )
            })}
            {quotes.length === 0 && (
              <div className="p-6 text-center text-sm text-stone-600">
                Nenhum orçamento ainda. <Link to="/catalogo" className="font-semibold text-campo-700 underline">Explorar catálogo</Link>
              </div>
            )}
          </Card>
        </section>
      </div>
    </>
  )
}

export function MyPains() {
  const { db, user } = useStore()
  const [tab, setTab] = useState<'ativas' | PainStatus | 'todas'>('ativas')
  const all = db.pains.filter((p) => p.produtorId === user!.id)
  const list = all.filter((p) => (tab === 'todas' ? true : tab === 'ativas' ? p.status === 'aberta' || p.status === 'em_negociacao' : p.status === tab))
  return (
    <>
      <PageHeader title="Minhas dores" subtitle="Necessidades que você publicou para as empresas." actions={<LinkButton to="/tenho-uma-dor" variant="sun"><Siren className="h-4 w-4" /> Nova dor</LinkButton>} />
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'ativas', label: 'Ativas', count: all.filter((p) => p.status === 'aberta' || p.status === 'em_negociacao').length },
          { id: 'resolvida', label: 'Resolvidas', count: all.filter((p) => p.status === 'resolvida').length },
          { id: 'encerrada', label: 'Encerradas', count: all.filter((p) => p.status === 'encerrada' || p.status === 'removida').length },
          { id: 'todas', label: 'Todas', count: all.length },
        ]}
      />
      <div className="mt-4 space-y-3">
        {list.map((p) => <PainCard key={p.id} pain={p} to={`/painel/dores/${p.id}`} />)}
        {list.length === 0 && <EmptyState icon={<Siren className="h-10 w-10" />} title="Nada por aqui" />}
      </div>
    </>
  )
}

export function ProducerPainDetail() {
  const { id } = useParams()
  const { db, user, actions } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [confirm, setConfirm] = useState<null | 'encerrar' | 'resolver'>(null)
  const [review, setReview] = useState<string | null>(null)
  const pain = db.pains.find((p) => p.id === id && p.produtorId === user!.id)
  if (!pain) return <EmptyState title="Dor não encontrada" action={<LinkButton to="/painel/dores">Minhas dores</LinkButton>} />

  const interests = db.interests.filter((i) => i.painId === pain.id).sort((a, b) => Number(!!b.proposta) - Number(!!a.proposta))
  const compat = db.companies
    .filter((c) => c.status === 'aprovada' && !interests.some((i) => i.companyId === c.id))
    .map((c) => ({ c, s: matchScore(c, pain) }))
    .filter((x) => x.s >= 50)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
  const ativa = pain.status === 'aberta' || pain.status === 'em_negociacao'
  const sugeridos = suggestMaterials(pain.condicoes)

  return (
    <>
      <Link to="/painel/dores" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-campo-700 hover:underline"><ArrowLeft className="h-4 w-4" /> Minhas dores</Link>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <PainStatusBadge status={pain.status} />
          <Badge tone="earth">{categoryLabel(pain.categoria)}</Badge>
          <span className="text-xs text-stone-600">Publicada {timeAgo(pain.criadoEm)}</span>
        </div>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-stone-900">{pain.titulo}</h1>
        <p className="mt-2 whitespace-pre-line text-stone-800">{pain.descricao}</p>
        {pain.imagens.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto">{pain.imagens.map((src, i) => <img key={i} src={src} alt={`Foto ${i + 1}`} className="h-28 w-28 shrink-0 rounded-xl object-cover" />)}</div>}
        {pain.videos.length > 0 && <div className="mt-2 flex flex-wrap gap-2">{pain.videos.map((v) => <Badge key={v}><Film className="h-3 w-3" />{v}</Badge>)}</div>}
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="text-stone-600">Máquina</dt><dd className="font-medium text-stone-900">{[pain.maquina, pain.fabricante, pain.modelo].filter(Boolean).join(' · ') || '-'}</dd></div>
          <div><dt className="text-stone-600">Quantidade</dt><dd className="font-medium text-stone-900">{pain.quantidade} un.</dd></div>
          <div><dt className="text-stone-600">Local</dt><dd className="font-medium text-stone-900">{pain.cidade}/{pain.uf}</dd></div>
          <div><dt className="text-stone-600">Prazo desejado</dt><dd className="font-medium text-stone-900">{pain.prazoDesejado ? dateBR(pain.prazoDesejado + 'T12:00:00') : '-'}</dd></div>
        </dl>
        {pain.condicoes.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5 text-sm">
            <span className="text-stone-600">Condições:</span>
            {pain.condicoes.map((c) => <Badge key={c}>{CONDITIONS.find((x) => x.id === c)?.label}</Badge>)}
            {sugeridos.length > 0 && <><span className="ml-2 text-stone-600">Materiais indicados:</span>{sugeridos.map((m) => <MaterialChip key={m} id={m} />)}</>}
          </div>
        )}
        {ativa && (
          <div className="mt-5 flex flex-wrap gap-2 border-t border-stone-100 pt-4">
            {pain.status === 'aberta' && <LinkButton to={`/painel/dores/${pain.id}/editar`} variant="outline" size="sm"><Pencil className="h-4 w-4" /> Editar</LinkButton>}
            <Button variant="secondary" size="sm" onClick={() => setConfirm('resolver')}><CheckCircle2 className="h-4 w-4" /> Marcar como resolvida</Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirm('encerrar')}><XCircle className="h-4 w-4" /> Encerrar (não preciso mais)</Button>
          </div>
        )}
        {pain.status === 'removida' && <div className="mt-4"><Alert tone="error">Esta dor foi removida pela moderação por violar as políticas da plataforma.</Alert></div>}
      </Card>

      <h2 className="mb-3 mt-8 text-lg font-bold text-stone-900">Empresas interessadas ({interests.length})</h2>
      {interests.length === 0 ? (
        <EmptyState icon={<Lightbulb className="h-10 w-10" />} title="Aguardando empresas">As empresas compatíveis já foram avisadas. Você receberá uma notificação quando alguém demonstrar interesse.</EmptyState>
      ) : (
        <div className="space-y-4">
          {interests.map((i) => {
            const c = db.companies.find((x) => x.id === i.companyId)!
            const r = companyRating(db, c.id)
            const reviewed = db.reviews.some((rv) => rv.produtorId === user!.id && rv.referencia.id === pain.id && rv.companyId === c.id)
            return (
              <Card key={i.id} className={i.status === 'aceita' ? 'ring-2 ring-campo-500' : ''}>
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                  <Link to={`/empresas/${c.id}`} className="flex items-center gap-3 sm:w-56 sm:shrink-0">
                    <Avatar name={c.nome} color={c.cor} size={44} />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-stone-900">{c.nome}</div>
                      <div className="flex items-center gap-1 text-xs text-stone-600"><MapPin className="h-3 w-3" />{c.cidade}/{c.uf}</div>
                      <div className="flex items-center gap-1 text-xs"><Stars value={r.geral} size={12} /> {r.total ? r.geral.toFixed(1) : '-'}</div>
                    </div>
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <InterestStatusBadge status={i.status} />
                      {c.verificada && <VerifiedBadge small />}
                      <span className="text-xs text-stone-600">{timeAgo(i.atualizadoEm)}</span>
                    </div>
                    <p className="mt-2 flex gap-2 text-sm text-stone-800"><MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />“{i.mensagem}”</p>
                    {i.proposta && (
                      <div className="mt-3 rounded-xl bg-stone-50 p-4">
                        <div className="text-xs font-bold uppercase tracking-wide text-stone-600">Proposta</div>
                        <p className="mt-1 text-sm text-stone-900">{i.proposta.solucao}</p>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                          <div><dt className="text-stone-600">Material</dt><dd>{i.proposta.material ? <MaterialChip id={i.proposta.material} /> : '-'}</dd></div>
                          <div><dt className="text-stone-600">Prazo</dt><dd className="font-semibold text-stone-900">{i.proposta.prazoDias ? `${i.proposta.prazoDias} dias` : 'A definir'}</dd></div>
                          <div><dt className="text-stone-600">Preço aprox.</dt><dd className="font-semibold text-stone-900">{priceLabel(i.proposta.preco)}</dd></div>
                          <div><dt className="text-stone-600">Viabilidade</dt><dd className="text-xs font-medium text-stone-900">{VIABILIDADE_LABEL[i.proposta.viabilidade]}</dd></div>
                        </dl>
                        {i.proposta.infoTecnica && <p className="mt-3 text-sm text-stone-700"><strong>Informações técnicas:</strong> {i.proposta.infoTecnica}</p>}
                        {i.proposta.observacoes && <p className="mt-1 text-sm text-stone-700"><strong>Observações:</strong> {i.proposta.observacoes}</p>}
                      </div>
                    )}
                    {i.status === 'aceita' && (
                      <div className="mt-4 grid gap-4 rounded-xl border border-campo-200 bg-campo-50 p-4 sm:grid-cols-2">
                        <div className="text-sm text-campo-950">
                          <strong>Você escolheu conversar com esta empresa.</strong> Seu contato foi liberado para ela. Combinem detalhes, protótipo e entrega diretamente.
                        </div>
                        <ContactBox company={c} assunto={pain.titulo} />
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {ativa && (i.status === 'interesse' || i.status === 'proposta') && (
                        <>
                          <Button size="sm" onClick={() => { actions.setInterestStatus(i.id, 'aceita'); toast(`Contato liberado para ${c.nome}.`) }}>
                            <CheckCircle2 className="h-4 w-4" /> Aceitar e conversar
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => { actions.setInterestStatus(i.id, 'recusada'); toast('Proposta recusada.', 'info') }}>Recusar</Button>
                        </>
                      )}
                      {i.status === 'aceita' && pain.status === 'resolvida' && !reviewed && (
                        <Button size="sm" variant="sun" onClick={() => setReview(c.id)}><Star className="h-4 w-4" /> Avaliar empresa</Button>
                      )}
                      {reviewed && <Badge tone="green"><Star className="h-3 w-3" /> Avaliação enviada</Badge>}
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {ativa && compat.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-1 text-lg font-bold text-stone-900">Empresas compatíveis com sua dor</h2>
          <p className="mb-3 text-sm text-stone-600">Sugestões automáticas por segmento, material e região. Elas já foram avisadas, você também pode chamá-las diretamente.</p>
          <div className="grid gap-3 md:grid-cols-3">
            {compat.map(({ c }) => (
              <Card key={c.id} className="p-4">
                <Link to={`/empresas/${c.id}`} className="flex items-center gap-3">
                  <Avatar name={c.nome} color={c.cor} size={36} />
                  <div className="min-w-0"><div className="truncate font-bold text-stone-900">{c.nome}</div><div className="text-xs text-stone-600">{c.cidade}/{c.uf}</div></div>
                </Link>
                <ul className="mt-3 space-y-1 text-xs text-stone-700">{matchReasons(c, pain).map((r) => <li key={r} className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-campo-600" />{r}</li>)}</ul>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title={confirm === 'resolver' ? 'Marcar como resolvida?' : 'Encerrar esta dor?'}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirm(null)}>Cancelar</Button>
            <Button
              variant={confirm === 'resolver' ? 'primary' : 'danger'}
              onClick={() => {
                actions.setPainStatus(pain.id, confirm === 'resolver' ? 'resolvida' : 'encerrada')
                toast(confirm === 'resolver' ? 'Que ótimo! Problema resolvido.' : 'Dor encerrada.')
                setConfirm(null)
                if (confirm === 'encerrar') nav('/painel/dores')
              }}
            >
              Confirmar
            </Button>
          </>
        }
      >
        <p className="text-sm text-stone-700">
          {confirm === 'resolver'
            ? 'A dor deixará de receber novos interesses. Depois você poderá avaliar a empresa que resolveu seu problema.'
            : 'A dor deixará de receber interesses e propostas. Essa ação não pode ser desfeita.'}
        </p>
      </Modal>
      {review && <ReviewModal open onClose={() => setReview(null)} companyId={review} referencia={{ tipo: 'dor', id: pain.id }} />}
    </>
  )
}

export function ProducerQuotes() {
  const { db, user, actions } = useStore()
  const toast = useToast()
  const [review, setReview] = useState<{ companyId: string; id: string } | null>(null)
  const quotes = db.quotes.filter((q) => q.produtorId === user!.id)
  return (
    <>
      <PageHeader title="Meus orçamentos" subtitle="Pedidos de orçamento enviados para peças do catálogo." actions={<LinkButton to="/catalogo" variant="outline"><Search className="h-4 w-4" /> Buscar peças</LinkButton>} />
      {quotes.length === 0 ? (
        <EmptyState icon={<ClipboardList className="h-10 w-10" />} title="Nenhum orçamento solicitado" action={<LinkButton to="/catalogo">Explorar catálogo</LinkButton>} />
      ) : (
        <div className="space-y-4">
          {quotes.map((q) => {
            const part = db.parts.find((p) => p.id === q.partId)
            const c = db.companies.find((x) => x.id === q.companyId)!
            const reviewed = db.reviews.some((r) => r.produtorId === user!.id && r.referencia.id === q.id)
            return (
              <Card key={q.id} className="p-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  {part && <Link to={`/catalogo/${part.id}`}><PartImage part={part} color={c.cor} className="h-20 w-full shrink-0 rounded-xl sm:w-24" /></Link>}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <QuoteStatusBadge status={q.status} />
                      <span className="text-xs text-stone-600">Solicitado {timeAgo(q.criadoEm)}</span>
                    </div>
                    <Link to={part ? `/catalogo/${part.id}` : '#'} className="mt-1 block font-bold text-stone-900 hover:text-campo-800">{part?.nome ?? 'Peça removida'}</Link>
                    <div className="text-sm text-stone-600"><Link to={`/empresas/${c.id}`} className="hover:underline">{c.nome}</Link> · <Box className="inline h-3.5 w-3.5" /> {q.quantidade} un.</div>
                    {q.mensagem && <p className="mt-2 text-sm text-stone-700">Você: “{q.mensagem}”</p>}
                    {q.resposta && (
                      <div className="mt-3 rounded-xl bg-campo-50 p-4 text-sm ring-1 ring-campo-100">
                        <div className="font-semibold text-campo-900">Resposta da empresa · {timeAgo(q.resposta.data)}</div>
                        <p className="mt-1 text-stone-800">{q.resposta.texto}</p>
                        <div className="mt-2 flex flex-wrap gap-4 text-stone-800">
                          <span><strong>Total:</strong> {priceLabel(q.resposta.preco)}</span>
                          {q.resposta.prazoDias && <span className="inline-flex items-center gap-1"><CalendarClock className="h-4 w-4" /> {q.resposta.prazoDias} dias</span>}
                        </div>
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      {q.status === 'respondida' && (
                        <>
                          <Button size="sm" onClick={() => { actions.setQuoteStatus(q.id, 'aceita'); toast('Orçamento aceito! Combine a entrega com a empresa.') }}>Aceitar orçamento</Button>
                          <Button size="sm" variant="ghost" onClick={() => actions.setQuoteStatus(q.id, 'cancelada')}>Recusar</Button>
                        </>
                      )}
                      {q.status === 'nova' && <Button size="sm" variant="ghost" onClick={() => actions.setQuoteStatus(q.id, 'cancelada')}>Cancelar pedido</Button>}
                      {q.status === 'aceita' && <Button size="sm" variant="secondary" onClick={() => { actions.setQuoteStatus(q.id, 'concluida'); toast('Serviço marcado como concluído.') }}><CheckCircle2 className="h-4 w-4" /> Recebi a peça</Button>}
                      {q.status === 'concluida' && !reviewed && <Button size="sm" variant="sun" onClick={() => setReview({ companyId: c.id, id: q.id })}><Star className="h-4 w-4" /> Avaliar empresa</Button>}
                      {reviewed && <Badge tone="green"><Star className="h-3 w-3" /> Avaliado</Badge>}
                    </div>
                  </div>
                  {(q.status === 'aceita' || q.status === 'respondida') && (
                    <div className="sm:w-60 sm:shrink-0"><ContactBox company={c} assunto={part?.nome ?? 'orçamento'} /></div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {review && <ReviewModal open onClose={() => setReview(null)} companyId={review.companyId} referencia={{ tipo: 'orcamento', id: review.id }} />}
    </>
  )
}
