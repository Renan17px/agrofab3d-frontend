import { useRef, useState, type ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import {
  BadgeCheck,
  Box,
  Clock,
  Droplets,
  Eye,
  Flag,
  Globe,
  ImagePlus,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Tag,
  Trash2,
} from 'lucide-react'
import type { CategoryId, Company, CompanyStatus, InterestStatus, Pain, PainStatus, Part, QuoteStatus, Report, UserRole } from '@/types'
import { categoryLabel, COMPANY_STATUS_LABEL, INTEREST_STATUS_LABEL, MATERIALS, PAIN_STATUS_LABEL, QUOTE_STATUS_LABEL, REPORT_REASONS } from '@/data/constants'
import { useStore } from '@/data/store'
import { companyRating, userName } from '@/lib/selectors'
import { priceLabel, timeAgo, whatsappLink } from '@/lib/format'
import { compressImage, kb } from '@/lib/image'
import { Avatar, Badge, Button, Card, Field, Modal, Select, StarInput, Stars, Textarea, cx, useToast } from './ui'

// ---------- Marca ----------
export function Logo({ light, size = 44, withName }: { light?: boolean; size?: number; withName?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cx('inline-flex items-center justify-center', light && 'rounded-xl bg-white p-1.5')}>
        <img src="/logo-192.png" alt={withName ? '' : 'AgroFab3D'} width={size} height={size} style={{ width: size, height: size }} />
      </span>
      {withName && (
        <span className={cx('text-xl font-extrabold tracking-tight', light ? 'text-white' : 'text-campo-900')}>
          AgroFab<span className={light ? 'text-sol-300' : 'text-campo-600'}>3D</span>
        </span>
      )}
    </span>
  )
}

// ---------- Ilustração por categoria (substitui fotos quando a peça não tem imagem) ----------
const ICON_PATHS: Record<CategoryId, ReactNode> = {
  maquinas: (
    <g>
      <circle cx="38" cy="66" r="14" />
      <circle cx="82" cy="70" r="9" />
      <path d="M24 56V38h26l8 18h30v10" />
      <path d="M50 38V26h-14" />
    </g>
  ),
  irrigacao: (
    <g>
      <path d="M60 22c10 14 16 23 16 32a16 16 0 0 1-32 0c0-9 6-18 16-32z" />
      <path d="M26 82h68M34 82v-8M86 82v-8" />
    </g>
  ),
  pecuaria: (
    <g>
      <path d="M30 40h60v24a8 8 0 0 1-8 8H38a8 8 0 0 1-8-8z" />
      <path d="M24 40h72M42 72v12M78 72v12" />
    </g>
  ),
  agricultura: (
    <g>
      <path d="M60 84V40" />
      <path d="M60 52c-12 0-18-8-18-18 12 0 18 8 18 18zM60 46c12 0 18-8 18-18-12 0-18 8-18 18z" />
      <path d="M36 84h48" />
    </g>
  ),
  sensores: (
    <g>
      <rect x="44" y="36" width="32" height="40" rx="6" />
      <path d="M32 46a28 28 0 0 0 0 20M88 46a28 28 0 0 1 0 20M24 40a40 40 0 0 0 0 32M96 40a40 40 0 0 1 0 32" />
      <circle cx="60" cy="56" r="6" />
    </g>
  ),
  automacao: (
    <g>
      <rect x="34" y="34" width="52" height="44" rx="6" />
      <path d="M46 34V24M60 34V24M74 34V24M46 88V78M60 88V78M74 88V78" />
      <rect x="48" y="46" width="24" height="20" rx="3" />
    </g>
  ),
  ferramentas: (
    <g>
      <path d="M78 26a14 14 0 0 0-16 20L30 78l8 8 32-32a14 14 0 0 0 20-16l-8 8-8-2-2-8z" />
    </g>
  ),
  armazenamento: (
    <g>
      <path d="M40 84V40a20 12 0 0 1 40 0v44z" />
      <path d="M40 54h40M40 68h40M34 84h52" />
    </g>
  ),
  outros: (
    <g>
      <path d="M60 24 88 40v32L60 88 32 72V40z" />
      <path d="M60 56v32M60 56 32 40M60 56l28-16" />
    </g>
  ),
}

export function PartIllustration({ categoria, color = '#2c703d', className }: { categoria: CategoryId; color?: string; className?: string }) {
  return (
    <div
      className={cx('flex items-center justify-center overflow-hidden', className)}
      style={{
        backgroundColor: `${color}14`,
        backgroundImage: `linear-gradient(${color}12 1px, transparent 1px), linear-gradient(90deg, ${color}12 1px, transparent 1px)`,
        backgroundSize: '14px 14px',
      }}
      role="img"
      aria-label={`Ilustração: ${categoryLabel(categoria)}`}
    >
      <svg viewBox="16 14 88 82" className="h-[70%] max-h-56 w-[70%]" aria-hidden>
        <g fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
          {ICON_PATHS[categoria]}
        </g>
      </svg>
    </div>
  )
}

export function PartImage({ part, color, className }: { part: Pick<Part, 'imagens' | 'categoria' | 'nome'>; color?: string; className?: string }) {
  if (part.imagens[0]) return <img src={part.imagens[0]} alt={part.nome} loading="lazy" className={cx('object-cover', className)} />
  return <PartIllustration categoria={part.categoria} color={color} className={className} />
}

// ---------- Selo de verificação (RN-018 / RN-019) ----------
export function VerifiedBadge({ small }: { small?: boolean }) {
  return (
    <Link
      to="/selo-verificado"
      title="Informações cadastrais verificadas pela plataforma. Não representa garantia sobre o serviço."
      className={cx('inline-flex items-center gap-1 rounded-full bg-sky-100 font-semibold text-sky-900 ring-1 ring-inset ring-sky-200 hover:bg-sky-200', small ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs')}
    >
      <BadgeCheck className={small ? 'h-3.5 w-3.5' : 'h-4 w-4'} aria-hidden />
      Empresa verificada
    </Link>
  )
}

// ---------- Status ----------
export function PainStatusBadge({ status }: { status: PainStatus }) {
  const tone = { aberta: 'green', em_negociacao: 'amber', resolvida: 'blue', encerrada: 'gray', removida: 'red' } as const
  return <Badge tone={tone[status]}>{PAIN_STATUS_LABEL[status]}</Badge>
}
export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const tone = { pendente: 'amber', aprovada: 'green', rejeitada: 'red', bloqueada: 'red' } as const
  return <Badge tone={tone[status]}>{COMPANY_STATUS_LABEL[status]}</Badge>
}
export function QuoteStatusBadge({ status }: { status: QuoteStatus }) {
  const tone = { nova: 'amber', respondida: 'blue', aceita: 'green', concluida: 'gray', cancelada: 'red' } as const
  return <Badge tone={tone[status]}>{QUOTE_STATUS_LABEL[status]}</Badge>
}
export function InterestStatusBadge({ status }: { status: InterestStatus }) {
  const tone = { interesse: 'gray', proposta: 'blue', aceita: 'green', recusada: 'red' } as const
  return <Badge tone={tone[status]}>{INTEREST_STATUS_LABEL[status]}</Badge>
}

// ---------- Cards ----------
export function PartCard({ part }: { part: Part }) {
  const { db } = useStore()
  const c = db.companies.find((x) => x.id === part.companyId)
  const current = part.versoes[part.versoes.length - 1]
  return (
    <Link to={`/catalogo/${part.id}`} className="group block focus:outline-none focus-visible:ring-2 focus-visible:ring-campo-500 rounded-2xl">
      <Card className="flex h-full flex-col overflow-hidden transition-shadow group-hover:shadow-md">
        <div className="relative aspect-[4/3] overflow-hidden">
          <PartImage part={part} color={c?.cor} className="h-full w-full transition-transform group-hover:scale-[1.02]" />
          <div className="absolute left-2 top-2 flex gap-1.5">
            <Badge tone="gray" className="bg-white/95">{part.material}</Badge>
            {current && <Badge tone="earth" className="bg-white/95">{current.versao}</Badge>}
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-campo-700">{categoryLabel(part.categoria)}</span>
          <h3 className="mt-0.5 line-clamp-2 font-bold text-stone-900">{part.nome}</h3>
          <p className="mt-1 line-clamp-1 text-sm text-stone-600">{part.equipamento}</p>
          <div className="mt-auto pt-3">
            <div className="flex items-center justify-between gap-2">
              <span className={cx('font-extrabold', part.preco == null ? 'text-terra-700 text-sm' : 'text-stone-900')}>{priceLabel(part.preco)}</span>
              <span className="inline-flex items-center gap-1 text-xs text-stone-600">
                <Clock className="h-3.5 w-3.5" aria-hidden /> {part.prazoDias} dias
              </span>
            </div>
            {c && (
              <div className="mt-2 flex items-center gap-1.5 border-t border-stone-100 pt-2 text-xs text-stone-700">
                <span className="truncate font-medium">{c.nome}</span>
                {c.verificada && <BadgeCheck className="h-4 w-4 shrink-0 text-sky-700" aria-label="Empresa verificada" />}
                <span className="ml-auto shrink-0 text-stone-600">{c.cidade}/{c.uf}</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

export function CompanyCard({ company }: { company: Company }) {
  const { db } = useStore()
  const r = companyRating(db, company.id)
  const nParts = db.parts.filter((p) => p.companyId === company.id && p.ativo && p.moderacao === 'publicado').length
  return (
    <Link to={`/empresas/${company.id}`} className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-campo-500">
      <Card className="h-full p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start gap-3">
          <Avatar name={company.nome} color={company.cor} size={48} />
          <div className="min-w-0">
            <h3 className="truncate font-bold text-stone-900">{company.nome}</h3>
            <p className="flex items-center gap-1 text-sm text-stone-600">
              <MapPin className="h-3.5 w-3.5" aria-hidden /> {company.cidade}/{company.uf}
            </p>
            {company.verificada && <div className="mt-1"><VerifiedBadge small /></div>}
          </div>
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-stone-700">{company.descricao}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {company.segmentos.slice(0, 3).map((s) => (
            <Badge key={s} tone="green">{categoryLabel(s)}</Badge>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3 text-sm">
          <span className="flex items-center gap-1.5">
            <Stars value={r.geral} size={14} />
            <span className="text-stone-700">{r.total ? r.geral.toFixed(1) : '-'}</span>
            <span className="text-stone-600">({r.total})</span>
          </span>
          <span className="text-stone-700">{nParts} peças</span>
        </div>
      </Card>
    </Link>
  )
}

export function PainCard({ pain, to, footer }: { pain: Pain; to: string; footer?: ReactNode }) {
  const { db } = useStore()
  const n = db.interests.filter((i) => i.painId === pain.id).length
  return (
    <Card className="flex flex-col p-4 sm:flex-row sm:gap-4">
      <Link to={to} className="mb-3 block h-28 w-full shrink-0 overflow-hidden rounded-xl sm:mb-0 sm:h-24 sm:w-32">
        {pain.imagens[0] ? <img src={pain.imagens[0]} alt="" className="h-full w-full object-cover" /> : <PartIllustration categoria={pain.categoria} color="#a95f28" className="h-full w-full" />}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <PainStatusBadge status={pain.status} />
          <span className="text-xs font-semibold uppercase tracking-wide text-terra-700">{categoryLabel(pain.categoria)}</span>
          <span className="text-xs text-stone-600">{timeAgo(pain.criadoEm)}</span>
        </div>
        <Link to={to} className="mt-1 block font-bold text-stone-900 hover:text-campo-800">
          {pain.titulo}
        </Link>
        <p className="mt-0.5 line-clamp-2 text-sm text-stone-700">{pain.descricao}</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-600">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{pain.cidade}/{pain.uf}</span>
          <span className="inline-flex items-center gap-1"><Box className="h-3.5 w-3.5" aria-hidden />{pain.quantidade} un.</span>
          <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" aria-hidden />{n} {n === 1 ? 'empresa interessada' : 'empresas interessadas'}</span>
        </div>
        {footer && <div className="mt-3">{footer}</div>}
      </div>
    </Card>
  )
}

// ---------- Contato (RF-024) ----------
export function ContactBox({ company, assunto }: { company: Company; assunto: string }) {
  const msg = `Olá, ${company.nome}! Vi vocês no AgroFab3D sobre: ${assunto}`
  return (
    <div className="space-y-2">
      {company.contato.whatsapp && (
        <a href={whatsappLink(company.contato.whatsapp, msg)} target="_blank" rel="noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#1f7a47] px-4 font-semibold text-white hover:bg-[#186338]">
          <MessageCircle className="h-5 w-5" aria-hidden /> Conversar no WhatsApp
        </a>
      )}
      <div className="grid gap-1 text-sm text-stone-700">
        {company.contato.telefone && (
          <a href={`tel:${company.contato.telefone.replace(/\D/g, '')}`} className="flex items-center gap-2 hover:text-campo-800"><Phone className="h-4 w-4" aria-hidden />{company.contato.telefone}</a>
        )}
        {company.contato.email && (
          <a href={`mailto:${company.contato.email}?subject=${encodeURIComponent('AgroFab3D: ' + assunto)}`} className="flex items-center gap-2 hover:text-campo-800"><Mail className="h-4 w-4" aria-hidden />{company.contato.email}</a>
        )}
        {company.contato.site && (
          <a href={company.contato.site} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-campo-800"><Globe className="h-4 w-4" aria-hidden />{company.contato.site.replace(/^https?:\/\//, '')}</a>
        )}
      </div>
    </div>
  )
}

// ---------- Upload de imagens com compressão (RNF-002) ----------
export function ImageUploader({ value, onChange, max = 6, label = 'Adicionar fotos' }: { value: string[]; onChange: (v: string[]) => void; max?: number; label?: string }) {
  const ref = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [info, setInfo] = useState<string>('')
  const toast = useToast()

  const onFiles = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    const out = [...value]
    let saved = 0
    for (const f of Array.from(files).slice(0, max - value.length)) {
      try {
        const r = await compressImage(f)
        out.push(r.dataUrl)
        saved += r.original - r.bytes
        setInfo(`Última imagem otimizada: ${kb(r.original)} → ${kb(r.bytes)}`)
      } catch (e) {
        toast((e as Error).message, 'error')
      }
    }
    onChange(out)
    setBusy(false)
    if (saved > 0) toast(`Imagens otimizadas para conexões lentas (−${kb(saved)})`, 'info')
    if (ref.current) ref.current.value = ''
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {value.map((src, i) => (
          <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-stone-200">
            <img src={src} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-lg bg-white/90 p-1 text-red-700 shadow" aria-label={`Remover foto ${i + 1}`}>
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {value.length < max && (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={busy}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-stone-300 bg-stone-50 text-sm font-medium text-stone-700 hover:border-campo-500 hover:text-campo-800"
          >
            <ImagePlus className="h-6 w-6" aria-hidden />
            {busy ? 'Otimizando…' : label}
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      <p className="mt-1.5 text-xs text-stone-600">{info || `Até ${max} fotos. Convertidas automaticamente para WebP (máx. 500 KB cada).`}</p>
    </div>
  )
}

// ---------- Denúncia (RF-043) ----------
export function ReportButton({ alvoTipo, alvoId }: { alvoTipo: Report['alvoTipo']; alvoId: string }) {
  const { user, actions } = useStore()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [motivo, setMotivo] = useState(REPORT_REASONS[0]!)
  const [descricao, setDescricao] = useState('')
  const submit = () => {
    const r = actions.createReport({ alvoTipo, alvoId, motivo, descricao })
    if (!r.ok) return toast(r.error, 'error')
    toast('Denúncia enviada. Nossa equipe vai analisar.')
    setOpen(false)
    setDescricao('')
  }
  return (
    <>
      <button onClick={() => (user ? setOpen(true) : toast('Entre na sua conta para denunciar.', 'info'))} className="inline-flex items-center gap-1.5 text-sm text-stone-600 hover:text-red-700">
        <Flag className="h-4 w-4" aria-hidden /> Denunciar
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Denunciar conteúdo"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button variant="danger" onClick={submit}>Enviar denúncia</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Motivo" htmlFor="rep-motivo">
            <Select id="rep-motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
              {REPORT_REASONS.map((r) => <option key={r}>{r}</option>)}
            </Select>
          </Field>
          <Field label="Detalhes (opcional)" htmlFor="rep-desc">
            <Textarea id="rep-desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Explique o que está errado" />
          </Field>
        </div>
      </Modal>
    </>
  )
}

// ---------- Avaliação (RN-017) ----------
export function ReviewModal({ open, onClose, companyId, referencia }: { open: boolean; onClose: () => void; companyId: string; referencia: { tipo: 'orcamento' | 'dor'; id: string } }) {
  const { db, actions } = useStore()
  const toast = useToast()
  const [q, setQ] = useState(0)
  const [p, setP] = useState(0)
  const [a, setA] = useState(0)
  const [comentario, setComentario] = useState('')
  const c = db.companies.find((x) => x.id === companyId)
  const submit = () => {
    if (!q || !p || !a) return toast('Dê uma nota para qualidade, prazo e atendimento.', 'error')
    const r = actions.createReview({ companyId, referencia, qualidade: q, prazo: p, atendimento: a, comentario })
    if (!r.ok) return toast(r.error, 'error')
    toast('Obrigado pela avaliação!')
    onClose()
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Avaliar ${c?.nome ?? 'empresa'}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={submit}>Enviar avaliação</Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-stone-600">Cada critério é avaliado separadamente. O prazo é importante porque máquina parada é prejuízo no campo.</p>
        <StarInput label="Qualidade da peça" value={q} onChange={setQ} />
        <StarInput label="Cumprimento do prazo" value={p} onChange={setP} />
        <StarInput label="Atendimento" value={a} onChange={setA} />
        <Field label="Comentário" htmlFor="rev-com">
          <Textarea id="rev-com" value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Conte como foi a experiência" />
        </Field>
      </div>
    </Modal>
  )
}

export function ReviewList({ companyId }: { companyId: string }) {
  const { db } = useStore()
  const rs = db.reviews.filter((r) => r.companyId === companyId)
  if (!rs.length) return <p className="text-sm text-stone-600">Esta empresa ainda não recebeu avaliações.</p>
  return (
    <ul className="divide-y divide-stone-100">
      {rs.map((r) => (
        <li key={r.id} className="py-4">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-stone-900">{userName(db, r.produtorId)}</span>
            <span className="text-xs text-stone-600">{timeAgo(r.criadoEm)}</span>
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-700">
            <span className="inline-flex items-center gap-1">Qualidade <Stars value={r.qualidade} size={12} /></span>
            <span className="inline-flex items-center gap-1">Prazo <Stars value={r.prazo} size={12} /></span>
            <span className="inline-flex items-center gap-1">Atendimento <Stars value={r.atendimento} size={12} /></span>
          </div>
          {r.comentario && <p className="mt-1.5 text-sm text-stone-700">{r.comentario}</p>}
        </li>
      ))}
    </ul>
  )
}

export function RatingSummary({ companyId }: { companyId: string }) {
  const { db } = useStore()
  const r = companyRating(db, companyId)
  const rows: [string, number][] = [
    ['Qualidade', r.qualidade],
    ['Prazo', r.prazo],
    ['Atendimento', r.atendimento],
  ]
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="text-center sm:w-32">
        <div className="text-4xl font-extrabold text-stone-900">{r.total ? r.geral.toFixed(1) : '-'}</div>
        <Stars value={r.geral} />
        <div className="text-xs text-stone-600">{r.total} avaliações</div>
      </div>
      <div className="flex-1 space-y-2">
        {rows.map(([l, v]) => (
          <div key={l} className="flex items-center gap-3 text-sm">
            <span className="w-24 text-stone-700">{l}</span>
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-stone-100">
              <div className="h-full rounded-full bg-sol-400" style={{ width: `${(v / 5) * 100}%` }} />
            </div>
            <span className="w-8 text-right font-semibold text-stone-900">{v ? v.toFixed(1) : '-'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------- Guia rápido de material ----------
export function MaterialChip({ id }: { id: string }) {
  const m = MATERIALS.find((x) => x.id === id)
  return (
    <Link to="/guia-materiais" title={m?.resumo} className="inline-flex items-center gap-1 rounded-full bg-terra-50 px-2.5 py-0.5 text-xs font-semibold text-terra-800 ring-1 ring-inset ring-terra-200 hover:bg-terra-100">
      <Droplets className="h-3 w-3" aria-hidden /> {m?.nome ?? id}
    </Link>
  )
}

export function Meter({ value, max = 3 }: { value: number; max?: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} de ${max}`}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={cx('h-2 w-5 rounded-full', i < value ? 'bg-campo-600' : 'bg-stone-200')} />
      ))}
    </span>
  )
}

export function SpecRow({ label, children, icon }: { label: string; children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="flex items-center gap-2 text-stone-600">{icon}{label}</dt>
      <dd className="text-right font-medium text-stone-900">{children}</dd>
    </div>
  )
}

export function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((i) => (
        <span key={i} className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-sm text-stone-800">
          <Tag className="h-3 w-3 text-stone-500" aria-hidden />
          {i}
        </span>
      ))}
    </div>
  )
}

// ---------- Proteção de rotas ----------
export function RequireAuth({ roles, children }: { roles?: UserRole[]; children: ReactNode }) {
  const { user } = useStore()
  const loc = useLocation()
  if (!user) return <Navigate to={`/entrar?voltar=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  if (roles && !roles.includes(user.tipo)) return <Navigate to="/painel" replace />
  return <>{children}</>
}
