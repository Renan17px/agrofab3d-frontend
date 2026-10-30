import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Camera, Check, ClipboardCheck, Film, Lightbulb, Settings2, Siren, X } from 'lucide-react'
import type { CategoryId, Condition } from '@/types'
import { useStore, type PainInput } from '@/data/store'
import { CATEGORIES, CONDITIONS, MATERIALS, UFS, categoryLabel, suggestMaterials } from '@/data/constants'
import { dateBR } from '@/lib/format'
import { ImageUploader, MaterialChip } from '@/components/domain'
import { Alert, Button, Card, ChipGroup, EmptyState, Field, Input, LinkButton, Select, Textarea, cx, useToast } from '@/components/ui'
import { Container } from '@/components/Layout'

const DRAFT_KEY = 'agrofab3d:dor-rascunho'
const STEPS = [
  { t: 'O problema', icon: Siren },
  { t: 'Fotos e vídeos', icon: Camera },
  { t: 'Detalhes', icon: Settings2 },
  { t: 'Revisar', icon: ClipboardCheck },
]

const empty = (cidade = '', uf = ''): PainInput => ({
  titulo: '',
  descricao: '',
  categoria: 'maquinas',
  imagens: [],
  videos: [],
  maquina: '',
  fabricante: '',
  modelo: '',
  quantidade: 1,
  cidade,
  uf,
  prazoDesejado: '',
  condicoes: [],
  outrasInfos: '',
})

export default function PainWizard() {
  const { id } = useParams()
  const { db, user, actions } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const editing = id ? db.pains.find((p) => p.id === id && p.produtorId === user?.id) : undefined

  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [f, setF] = useState<PainInput>(() => {
    if (editing) {
      const { id: _i, produtorId: _p, status: _s, criadoEm: _c, atualizadoEm: _a, ...rest } = editing
      return rest
    }
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY)
      if (raw) return JSON.parse(raw) as PainInput
    } catch {
      /* noop */
    }
    return { ...empty(user?.cidade, user?.uf), titulo: params.get('titulo') ?? '' }
  })

  // Rascunho automático: permite começar sem login e continuar após entrar (RNF-008)
  useEffect(() => {
    if (editing) return
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(f))
    } catch {
      /* noop */
    }
  }, [f, editing])

  if (user && user.tipo !== 'produtor')
    return (
      <Container>
        <EmptyState icon={<Siren className="h-10 w-10" />} title="Funcionalidade para produtores" action={user.tipo === 'empresa' ? <LinkButton to="/painel/oportunidades">Ver oportunidades</LinkButton> : undefined}>
          “Tenho uma dor” é usada por produtores rurais para publicar necessidades. Como empresa, você encontra essas dores em Oportunidades.
        </EmptyState>
      </Container>
    )
  if (id && !editing)
    return (
      <Container>
        <EmptyState title="Dor não encontrada" action={<LinkButton to="/painel/dores">Minhas dores</LinkButton>} />
      </Container>
    )
  if (editing && editing.status !== 'aberta')
    return (
      <Container>
        <EmptyState title="Esta dor não pode mais ser editada" action={<LinkButton to={`/painel/dores/${editing.id}`}>Voltar</LinkButton>}>
          Somente dores com status “Aberta” podem ser alteradas.
        </EmptyState>
      </Container>
    )

  const set = <K extends keyof PainInput>(k: K, v: PainInput[K]) => setF((s) => ({ ...s, [k]: v }))
  const sugeridos = suggestMaterials(f.condicoes)

  const validate = (s: number) => {
    const er: Record<string, string> = {}
    if (s === 0) {
      if (f.titulo.trim().length < 5) er.titulo = 'Escreva um título curto (mín. 5 letras).'
      if (f.descricao.trim().length < 15) er.descricao = 'Conte um pouco mais sobre o problema (mín. 15 letras).'
    }
    if (s === 2 && f.quantidade < 1) er.quantidade = 'Quantidade mínima: 1.'
    setErrors(er)
    return Object.keys(er).length === 0
  }

  const next = () => validate(step) && setStep((s) => Math.min(3, s + 1))

  const publish = () => {
    if (!validate(0)) return setStep(0)
    if (!user) {
      toast('Entre ou crie sua conta gratuita para publicar. Seu rascunho foi salvo.', 'info')
      return nav('/entrar?voltar=/tenho-uma-dor')
    }
    if (editing) {
      const r = actions.updatePain(editing.id, f)
      if (!r.ok) return toast(r.error, 'error')
      toast('Dor atualizada.')
      return nav(`/painel/dores/${editing.id}`)
    }
    const r = actions.createPain(f)
    if (!r.ok) return toast(r.error, 'error')
    sessionStorage.removeItem(DRAFT_KEY)
    toast('Dor publicada! Empresas compatíveis foram avisadas.')
    nav(`/painel/dores/${r.value.id}`)
  }

  return (
    <Container className="max-w-3xl">
      <div className="mb-6">
        <span className="inline-flex items-center gap-2 rounded-full bg-sol-300/30 px-3 py-1 text-sm font-bold text-stone-900">
          <Siren className="h-4 w-4" /> {editing ? 'Editar dor' : 'Tenho uma dor'}
        </span>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">{editing ? 'Atualize sua necessidade' : 'Conte qual é o seu problema'}</h1>
        <p className="mt-1 text-stone-600">Não precisa de conhecimento técnico nem de arquivo 3D. Preencha o que souber — as empresas ajudam com o resto.</p>
      </div>

      {/* Etapas */}
      <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Etapas">
        {STEPS.map(({ t, icon: Icon }, i) => (
          <li key={t}>
            <button
              type="button"
              onClick={() => (i < step || validate(step)) && setStep(i)}
              className={cx('flex w-full flex-col items-center gap-1 rounded-xl p-2 text-center text-xs font-semibold sm:flex-row sm:text-sm', i === step ? 'bg-campo-700 text-white' : i < step ? 'bg-campo-100 text-campo-900' : 'bg-stone-100 text-stone-600')}
              aria-current={i === step ? 'step' : undefined}
            >
              {i < step ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
              <span>{i + 1}. {t}</span>
            </button>
          </li>
        ))}
      </ol>

      <Card className="p-5 sm:p-6">
        {step === 0 && (
          <div className="space-y-5">
            <Field label="Resuma o problema em uma frase" required error={errors.titulo} htmlFor="d-titulo">
              <Input id="d-titulo" value={f.titulo} onChange={(e) => set('titulo', e.target.value)} placeholder="Ex.: Preciso proteger o sensor do pulverizador da chuva" maxLength={120} />
            </Field>
            <Field label="Explique o que está acontecendo" required error={errors.descricao} hint="Onde fica a peça? O que quebrou? Já tentou alguma solução?" htmlFor="d-desc">
              <Textarea id="d-desc" value={f.descricao} onChange={(e) => set('descricao', e.target.value)} rows={5} placeholder="Ex.: O sensor de altura fica exposto e já queimou duas vezes este ano por causa de água e poeira…" />
            </Field>
            <Field label="Onde isso se aplica?">
              <ChipGroup single options={CATEGORIES.map((c) => ({ id: c.id, label: c.label }))} value={[f.categoria]} onChange={(v) => set('categoria', v[0] as CategoryId)} />
            </Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <Field label="Fotos" hint="Fotografe a peça quebrada, o local onde ela fica e, se possível, com uma régua ao lado.">
              <ImageUploader value={f.imagens} onChange={(v) => set('imagens', v)} label="Tirar ou enviar foto" />
            </Field>
            <Field label="Vídeos curtos (opcional)" hint="Mostre a máquina funcionando ou o problema acontecendo. No protótipo, apenas o nome do arquivo é registrado.">
              <div className="space-y-2">
                {f.videos.map((v, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-stone-50 px-3 py-2 text-sm">
                    <span className="flex items-center gap-2 truncate"><Film className="h-4 w-4 text-stone-600" />{v}</span>
                    <button type="button" onClick={() => set('videos', f.videos.filter((_, j) => j !== i))} aria-label={`Remover ${v}`} className="text-red-700"><X className="h-4 w-4" /></button>
                  </div>
                ))}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50">
                  <Film className="h-4 w-4" /> Adicionar vídeo
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) set('videos', [...f.videos, file.name]); e.target.value = '' }} />
                </label>
              </div>
            </Field>
            <p className="text-sm text-stone-600">Sem fotos? Tudo bem, você pode pular esta etapa.</p>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Máquina / equipamento" htmlFor="d-maq">
                <Input id="d-maq" value={f.maquina} onChange={(e) => set('maquina', e.target.value)} placeholder="Ex.: Pulverizador" />
              </Field>
              <Field label="Fabricante" htmlFor="d-fab">
                <Input id="d-fab" value={f.fabricante} onChange={(e) => set('fabricante', e.target.value)} placeholder="Se souber" />
              </Field>
              <Field label="Modelo / ano" htmlFor="d-mod">
                <Input id="d-mod" value={f.modelo} onChange={(e) => set('modelo', e.target.value)} placeholder="Se souber" />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Quantidade" required error={errors.quantidade} htmlFor="d-qtd">
                <Input id="d-qtd" type="number" min={1} inputMode="numeric" value={f.quantidade} onChange={(e) => set('quantidade', Number(e.target.value))} />
              </Field>
              <Field label="Prazo desejado" htmlFor="d-prazo">
                <Input id="d-prazo" type="date" value={f.prazoDesejado} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set('prazoDesejado', e.target.value)} />
              </Field>
              <div className="grid grid-cols-[1fr_80px] gap-2">
                <Field label="Cidade" htmlFor="d-cid">
                  <Input id="d-cid" value={f.cidade} onChange={(e) => set('cidade', e.target.value)} />
                </Field>
                <Field label="UF" htmlFor="d-uf">
                  <Select id="d-uf" value={f.uf} onChange={(e) => set('uf', e.target.value)}>
                    <option value="">—</option>
                    {UFS.map((u) => <option key={u}>{u}</option>)}
                  </Select>
                </Field>
              </div>
            </div>
            <Field label="Como a peça é usada?" hint="Isso ajuda a escolher o material certo.">
              <ChipGroup options={CONDITIONS.map((c) => ({ id: c.id, label: c.label }))} value={f.condicoes} onChange={(v) => set('condicoes', v as Condition[])} />
            </Field>
            {sugeridos.length > 0 && (
              <div className="rounded-xl bg-terra-50 p-4 ring-1 ring-terra-200">
                <div className="flex items-center gap-2 text-sm font-bold text-terra-900"><Lightbulb className="h-4 w-4" /> Materiais mais indicados para essas condições</div>
                <div className="mt-2 flex flex-wrap gap-1.5">{sugeridos.map((m) => <MaterialChip key={m} id={m} />)}</div>
                <p className="mt-2 text-xs text-terra-900">{MATERIALS.find((m) => m.id === sugeridos[0])?.indicado} A empresa confirmará a escolha na proposta.</p>
              </div>
            )}
            <Field label="Outras informações" htmlFor="d-outras">
              <Textarea id="d-outras" value={f.outrasInfos} onChange={(e) => set('outrasInfos', e.target.value)} rows={3} placeholder="Medidas, peça de referência disponível, horários para contato…" />
            </Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-stone-900">Confira antes de publicar</h2>
            <dl className="divide-y divide-stone-100 rounded-xl border border-stone-200">
              {[
                ['Título', f.titulo],
                ['Descrição', f.descricao],
                ['Aplicação', categoryLabel(f.categoria)],
                ['Fotos / vídeos', `${f.imagens.length} foto(s), ${f.videos.length} vídeo(s)`],
                ['Máquina', [f.maquina, f.fabricante, f.modelo].filter(Boolean).join(' · ') || '—'],
                ['Quantidade', `${f.quantidade} unidade(s)`],
                ['Local', f.cidade || f.uf ? `${f.cidade}${f.uf ? '/' + f.uf : ''}` : '—'],
                ['Prazo desejado', f.prazoDesejado ? dateBR(f.prazoDesejado + 'T12:00:00') : 'Sem prazo definido'],
                ['Condições de uso', f.condicoes.map((c) => CONDITIONS.find((x) => x.id === c)?.label).join(', ') || '—'],
              ].map(([k, v]) => (
                <div key={k} className="grid gap-1 px-4 py-2.5 text-sm sm:grid-cols-[160px_1fr]">
                  <dt className="text-stone-600">{k}</dt>
                  <dd className="whitespace-pre-line text-stone-900">{v}</dd>
                </div>
              ))}
            </dl>
            {f.imagens.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">{f.imagens.map((src, i) => <img key={i} src={src} alt="" className="h-20 w-20 shrink-0 rounded-lg object-cover" />)}</div>
            )}
            <Alert tone="info">
              Sua dor ficará visível para empresas cadastradas. Seu telefone só é liberado para a empresa que você escolher. <Link to="/privacidade" className="underline">Privacidade</Link>
            </Alert>
            {!user && <Alert tone="warn">Para publicar, você precisará entrar ou criar uma conta gratuita. O rascunho fica salvo.</Alert>}
          </div>
        )}

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-stone-100 pt-5">
          {step > 0 ? (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)}><ArrowLeft className="h-4 w-4" /> Voltar</Button>
          ) : (
            <span />
          )}
          {step < 3 ? (
            <Button onClick={next}>Continuar <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button variant="sun" size="lg" onClick={publish}>{editing ? 'Salvar alterações' : user ? 'Publicar minha dor' : 'Entrar e publicar'}</Button>
          )}
        </div>
      </Card>
    </Container>
  )
}
