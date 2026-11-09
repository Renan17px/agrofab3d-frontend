import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Clock, ExternalLink, FileText, GitBranch, Info, MapPin, Ruler, Scale, Thermometer, Wrench, Factory, Cpu, Sprout } from 'lucide-react'
import { useStore } from '@/data/store'
import { ORIGINS, categoryLabel, MATERIALS } from '@/data/constants'
import { companyRating, publicParts } from '@/lib/selectors'
import { dateBR, priceLabel } from '@/lib/format'
import { ContactBox, MaterialChip, PartCard, PartImage, ReportButton, SpecRow, VerifiedBadge } from '@/components/domain'
import { Alert, Avatar, Badge, Button, Card, EmptyState, Field, Input, LinkButton, Modal, Stars, Textarea, cx, useToast } from '@/components/ui'
import { Container } from '@/components/Layout'

export default function PartDetail() {
  const { id } = useParams()
  const { db, user, actions } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const part = db.parts.find((p) => p.id === id)
  const company = part && db.companies.find((c) => c.id === part.companyId)
  const [img, setImg] = useState(0)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [qtd, setQtd] = useState(1)
  const [msg, setMsg] = useState('')
  const viewed = useRef(false)

  useEffect(() => {
    if (part && !viewed.current) {
      viewed.current = true
      actions.viewPart(part.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [part?.id])

  const isOwner = user?.companyId && user.companyId === part?.companyId
  const visible = part && company && ((part.ativo && part.moderacao === 'publicado' && company.status === 'aprovada') || isOwner || user?.tipo === 'admin')

  if (!part || !company || !visible)
    return (
      <Container>
        <EmptyState title="Peça não encontrada" action={<LinkButton to="/catalogo">Voltar ao catálogo</LinkButton>}>
          Ela pode ter sido desativada pela empresa ou removida.
        </EmptyState>
      </Container>
    )

  const rating = companyRating(db, company.id)
  const current = part.versoes[part.versoes.length - 1]!
  const origem = ORIGINS.find((o) => o.id === part.origem.tipo)!
  const material = MATERIALS.find((m) => m.id === part.material)
  const dorOrigem = part.dorOrigemId ? db.pains.find((d) => d.id === part.dorOrigemId) : null
  const related = publicParts(db).filter((p) => p.id !== part.id && p.categoria === part.categoria).slice(0, 4)
  const imgs = part.imagens

  const askQuote = () => {
    if (!user) return nav(`/entrar?voltar=/catalogo/${part.id}`)
    if (user.tipo !== 'produtor') return toast('Apenas produtores podem solicitar orçamento.', 'info')
    setQuoteOpen(true)
  }
  const sendQuote = () => {
    if (qtd < 1) return toast('Informe a quantidade.', 'error')
    const r = actions.requestQuote(part.id, qtd, msg)
    if (!r.ok) return toast(r.error, 'error')
    setQuoteOpen(false)
    toast('Pedido de orçamento enviado! A empresa foi notificada.')
    nav('/painel/orcamentos')
  }

  return (
    <Container>
      <Link to="/catalogo" className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-campo-700 hover:underline">
        <ArrowLeft className="h-4 w-4" /> Voltar ao catálogo
      </Link>

      {(!part.ativo || part.moderacao !== 'publicado') && (
        <div className="mb-4">
          <Alert tone="warn" title={part.moderacao === 'removido' ? 'Removida pela moderação' : 'Peça desativada'}>Esta peça não aparece para os produtores no catálogo.</Alert>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          {/* Galeria */}
          <div>
            <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {imgs.length ? <img src={imgs[img]} alt={part.nome} className="aspect-[16/10] w-full object-contain bg-stone-50" /> : <PartImage part={part} color={company.cor} className="aspect-[16/10] w-full" />}
            </div>
            {imgs.length > 1 && (
              <div className="mt-2 flex gap-2 overflow-x-auto">
                {imgs.map((src, i) => (
                  <button key={i} onClick={() => setImg(i)} className={cx('h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2', i === img ? 'border-campo-600' : 'border-transparent')} aria-label={`Foto ${i + 1}`}>
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">{categoryLabel(part.categoria)}</Badge>
              <Badge tone="earth"><GitBranch className="h-3 w-3" /> Versão atual: {current.versao}</Badge>
              {part.origem.tipo !== 'proprio' && <Badge tone="blue">Modelo: {origem.label}</Badge>}
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">{part.nome}</h1>
            <p className="mt-3 text-stone-700">{part.descricao}</p>
          </div>

          {dorOrigem && (
            <Alert tone="success" title="Nasceu de uma dor do campo">
              Esta solução foi desenvolvida para resolver a necessidade “{dorOrigem.titulo}” e depois entrou no catálogo para ajudar outros produtores.
            </Alert>
          )}

          <Card className="p-5">
            <h2 className="mb-2 text-lg font-bold text-stone-900">Especificações técnicas</h2>
            <dl className="divide-y divide-stone-100">
              <SpecRow label="Material" icon={<Sprout className="h-4 w-4" />}><MaterialChip id={part.material} /></SpecRow>
              <SpecRow label="Dimensões" icon={<Ruler className="h-4 w-4" />}>{part.dimensoes}</SpecRow>
              <SpecRow label="Equipamento compatível" icon={<Wrench className="h-4 w-4" />}>{part.equipamento}</SpecRow>
              <SpecRow label="Fabricante" icon={<Factory className="h-4 w-4" />}>{part.fabricante}</SpecRow>
              <SpecRow label="Modelo" icon={<Cpu className="h-4 w-4" />}>{part.modelo}</SpecRow>
              <SpecRow label="Aplicação" icon={<Info className="h-4 w-4" />}>{part.aplicacao}</SpecRow>
              {part.temperatura && <SpecRow label="Temperatura de uso" icon={<Thermometer className="h-4 w-4" />}>{part.temperatura}</SpecRow>}
              <SpecRow label="Prazo estimado de fabricação" icon={<Clock className="h-4 w-4" />}>{part.prazoDias} dias</SpecRow>
            </dl>
            {material && (
              <p className="mt-3 rounded-xl bg-terra-50 p-3 text-sm text-terra-900">
                <strong>Sobre o {material.nome}:</strong> {material.resumo} Indicado para: {material.indicado.toLowerCase()}
              </p>
            )}
          </Card>

          <Card className="p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-stone-900"><GitBranch className="h-5 w-5 text-terra-700" /> Histórico de versões</h2>
            <ol className="relative ml-2 border-l-2 border-stone-200">
              {[...part.versoes].reverse().map((v, i) => (
                <li key={v.versao} className="mb-4 ml-5 last:mb-0">
                  <span className={cx('absolute -left-[9px] mt-1 h-4 w-4 rounded-full border-2 border-white', i === 0 ? 'bg-campo-600' : 'bg-stone-300')} />
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-stone-900">{v.versao}</span>
                    {i === 0 && <Badge tone="green">Atual</Badge>}
                    <span className="text-xs text-stone-600">{dateBR(v.data)}</span>
                  </div>
                  <p className="text-sm text-stone-700">{v.descricao}</p>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-5">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-bold text-stone-900"><Scale className="h-5 w-5 text-sky-700" /> Origem e licença do modelo</h2>
            {part.origem.tipo === 'proprio' ? (
              <p className="text-sm text-stone-700">Modelo de autoria própria de <strong>{company.nome}</strong>.</p>
            ) : (
              <dl className="divide-y divide-stone-100">
                <SpecRow label="Plataforma de origem">{origem.label}</SpecRow>
                {part.origem.autor && <SpecRow label="Autor original">{part.origem.autor}</SpecRow>}
                <SpecRow label="Licença"><Badge tone="blue">{part.origem.licenca}</Badge></SpecRow>
                {part.origem.condicoes && <SpecRow label="Condições de uso">{part.origem.condicoes}</SpecRow>}
                {part.origem.url && (
                  <SpecRow label="Link da fonte">
                    <a href={part.origem.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-campo-700 hover:underline">Ver modelo original <ExternalLink className="h-3.5 w-3.5" /></a>
                  </SpecRow>
                )}
              </dl>
            )}
          </Card>

          <div className="flex items-center justify-between text-sm text-stone-600">
            <span>{part.visualizacoes} visualizações</span>
            <ReportButton alvoTipo="peca" alvoId={part.id} />
          </div>
        </div>

        {/* Lateral */}
        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <Card className="p-5">
            <div className="text-sm text-stone-600">{part.preco == null ? 'Preço' : 'A partir de'}</div>
            <div className={cx('text-3xl font-extrabold', part.preco == null ? 'text-terra-700' : 'text-stone-900')}>{priceLabel(part.preco)}</div>
            <div className="mt-1 flex items-center gap-1.5 text-sm text-stone-700"><Clock className="h-4 w-4" /> Fabricação em ~{part.prazoDias} dias · {current.versao}</div>
            {isOwner ? (
              <LinkButton to={`/painel/pecas/${part.id}`} className="mt-4 w-full">Editar minha peça</LinkButton>
            ) : (
              <Button size="lg" className="mt-4 w-full" onClick={askQuote} disabled={!part.ativo}>
                <FileText className="h-5 w-5" /> Solicitar orçamento
              </Button>
            )}
            <p className="mt-3 text-xs text-stone-600">Gratuito para produtores. A negociação e a fabricação são feitas diretamente com a empresa.</p>
          </Card>

          <Card className="p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-stone-600">Empresa responsável</div>
            <Link to={`/empresas/${company.id}`} className="mt-2 flex items-center gap-3 hover:opacity-90">
              <Avatar name={company.nome} color={company.cor} size={44} />
              <div className="min-w-0">
                <div className="truncate font-bold text-stone-900">{company.nome}</div>
                <div className="flex items-center gap-1 text-sm text-stone-600"><MapPin className="h-3.5 w-3.5" />{company.cidade}/{company.uf}</div>
              </div>
            </Link>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {company.verificada && <VerifiedBadge small />}
              <span className="inline-flex items-center gap-1 text-sm">
                <Stars value={rating.geral} size={14} /> <span className="text-stone-700">{rating.total ? rating.geral.toFixed(1) : '-'} ({rating.total})</span>
              </span>
            </div>
            <div className="mt-4 border-t border-stone-100 pt-4">
              <ContactBox company={company} assunto={part.nome} />
            </div>
          </Card>
          <p className="px-1 text-xs text-stone-600">
            O AgroFab3D intermedeia o contato. A fabricação, o dimensionamento e a aplicação da peça são de responsabilidade da empresa fabricante. <Link to="/termos" className="underline">Termos de uso</Link>
          </p>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-xl font-extrabold text-stone-900">Outras soluções em {categoryLabel(part.categoria)}</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((p) => <PartCard key={p.id} part={p} />)}
          </div>
        </section>
      )}

      <Modal
        open={quoteOpen}
        onClose={() => setQuoteOpen(false)}
        title="Solicitar orçamento"
        footer={
          <>
            <Button variant="outline" onClick={() => setQuoteOpen(false)}>Cancelar</Button>
            <Button onClick={sendQuote}>Enviar pedido</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-stone-50 p-3">
            <PartImage part={part} color={company.cor} className="h-14 w-14 shrink-0 rounded-lg" />
            <div>
              <div className="font-bold text-stone-900">{part.nome}</div>
              <div className="text-sm text-stone-600">{company.nome} · {current.versao}</div>
            </div>
          </div>
          <Field label="Quantidade" required htmlFor="q-qtd">
            <Input id="q-qtd" type="number" min={1} inputMode="numeric" value={qtd} onChange={(e) => setQtd(Number(e.target.value))} />
          </Field>
          <Field label="Mensagem para a empresa" hint="Informe o modelo da sua máquina, medidas ou dúvidas de compatibilidade." htmlFor="q-msg">
            <Textarea id="q-msg" value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Ex.: Serve para a barra de 30 m do meu pulverizador?" />
          </Field>
        </div>
      </Modal>
    </Container>
  )
}
