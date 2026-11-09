import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Search, SlidersHorizontal, Siren, X } from 'lucide-react'
import { useStore } from '@/data/store'
import { CATEGORIES, MATERIALS, UFS, categoryLabel } from '@/data/constants'
import { publicParts, companyRating } from '@/lib/selectors'
import { searchParts } from '@/lib/search'
import { PartCard } from '@/components/domain'
import { Button, Checkbox, EmptyState, Field, Input, LinkButton, Modal, Select } from '@/components/ui'
import { Container } from '@/components/Layout'

type Sort = 'relevancia' | 'populares' | 'preco' | 'prazo' | 'recentes' | 'avaliacao'

export default function Catalog() {
  const { db } = useStore()
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const q = params.get('q') ?? ''
  const [draft, setDraft] = useState(q)

  const get = (k: string) => params.get(k) ?? ''
  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    setParams(p, { replace: true })
  }

  const all = publicParts(db)
  const equipamentos = useMemo(() => [...new Set(all.map((p) => p.equipamento))].sort(), [all])
  const fabricantes = useMemo(() => [...new Set(all.map((p) => p.fabricante))].sort(), [all])
  const sort = (get('ordem') || (q ? 'relevancia' : 'populares')) as Sort

  const results = useMemo(() => {
    let r = searchParts(all, db.companies, q)
    const f = {
      categoria: get('categoria'),
      material: get('material'),
      equipamento: get('equipamento'),
      fabricante: get('fabricante'),
      uf: get('uf'),
      precoMax: Number(get('precoMax')) || 0,
      verificada: get('verificada') === '1',
      precoFixo: get('precoFixo') === '1',
    }
    r = r.filter(({ part: p }) => {
      const c = db.companies.find((x) => x.id === p.companyId)!
      if (f.categoria && p.categoria !== f.categoria) return false
      if (f.material && p.material !== f.material) return false
      if (f.equipamento && p.equipamento !== f.equipamento) return false
      if (f.fabricante && p.fabricante !== f.fabricante) return false
      if (f.uf && c.uf !== f.uf) return false
      if (f.verificada && !c.verificada) return false
      if (f.precoFixo && p.preco == null) return false
      if (f.precoMax && (p.preco == null || p.preco > f.precoMax)) return false
      return true
    })
    const planBoost = (cid: string) => {
      const plano = db.companies.find((c) => c.id === cid)?.plano
      return plano === 'empresarial' ? 2 : plano === 'profissional' ? 1 : 0
    }
    const sorters: Record<Sort, (a: (typeof r)[0], b: (typeof r)[0]) => number> = {
      relevancia: (a, b) => b.score - a.score || planBoost(b.part.companyId) - planBoost(a.part.companyId),
      populares: (a, b) => planBoost(b.part.companyId) - planBoost(a.part.companyId) || b.part.visualizacoes - a.part.visualizacoes,
      preco: (a, b) => (a.part.preco ?? Infinity) - (b.part.preco ?? Infinity),
      prazo: (a, b) => a.part.prazoDias - b.part.prazoDias,
      recentes: (a, b) => b.part.criadoEm.localeCompare(a.part.criadoEm),
      avaliacao: (a, b) => companyRating(db, b.part.companyId).geral - companyRating(db, a.part.companyId).geral,
    }
    return r.sort(sorters[sort]).map((x) => x.part)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, params])

  const activeFilters = ['categoria', 'material', 'equipamento', 'fabricante', 'uf', 'precoMax', 'verificada', 'precoFixo'].filter((k) => params.get(k))

  const filters = (
    <div className="space-y-4">
      <Field label="Aplicação / categoria" htmlFor="f-cat">
        <Select id="f-cat" value={get('categoria')} onChange={(e) => set('categoria', e.target.value)}>
          <option value="">Todas</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </Select>
      </Field>
      <Field label="Tipo de equipamento" htmlFor="f-eq">
        <Select id="f-eq" value={get('equipamento')} onChange={(e) => set('equipamento', e.target.value)}>
          <option value="">Todos</option>
          {equipamentos.map((e) => <option key={e}>{e}</option>)}
        </Select>
      </Field>
      <Field label="Fabricante / modelo" htmlFor="f-fab">
        <Select id="f-fab" value={get('fabricante')} onChange={(e) => set('fabricante', e.target.value)}>
          <option value="">Todos</option>
          {fabricantes.map((e) => <option key={e}>{e}</option>)}
        </Select>
      </Field>
      <Field label="Material" htmlFor="f-mat">
        <Select id="f-mat" value={get('material')} onChange={(e) => set('material', e.target.value)}>
          <option value="">Todos</option>
          {MATERIALS.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
        </Select>
      </Field>
      <Field label="Localização da empresa" htmlFor="f-uf">
        <Select id="f-uf" value={get('uf')} onChange={(e) => set('uf', e.target.value)}>
          <option value="">Todo o Brasil</option>
          {UFS.map((u) => <option key={u}>{u}</option>)}
        </Select>
      </Field>
      <Field label="Preço máximo (R$)" htmlFor="f-preco">
        <Input id="f-preco" type="number" min={0} inputMode="numeric" value={get('precoMax')} onChange={(e) => set('precoMax', e.target.value)} placeholder="Sem limite" />
      </Field>
      <Checkbox label="Somente empresas verificadas" checked={get('verificada') === '1'} onChange={(v) => set('verificada', v ? '1' : '')} />
      <Checkbox label="Somente com preço definido" checked={get('precoFixo') === '1'} onChange={(v) => set('precoFixo', v ? '1' : '')} />
      {activeFilters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const p = new URLSearchParams()
            if (q) p.set('q', q)
            setParams(p, { replace: true })
          }}
        >
          <X className="h-4 w-4" /> Limpar filtros
        </Button>
      )}
    </div>
  )

  return (
    <Container>
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">Catálogo técnico</h1>
        <p className="mt-1 text-stone-600">Descreva o problema com suas palavras, não precisa saber o nome técnico ou o código da peça.</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          set('q', draft.trim())
        }}
        className="mb-6 flex gap-2"
        role="search"
      >
        <label className="relative flex-1">
          <span className="sr-only">Buscar</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
          <Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ex.: proteção para sensor que pega chuva" className="h-12 pl-11" />
        </label>
        <Button type="submit" size="lg">Buscar</Button>
      </form>

      <div className="lg:flex lg:gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-stone-600">Filtros</h2>
          {filters}
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-700" aria-live="polite">
              <strong>{results.length}</strong> {results.length === 1 ? 'solução encontrada' : 'soluções encontradas'}
              {q && <> para “<strong>{q}</strong>”</>}
              {get('categoria') && <> em <strong>{categoryLabel(get('categoria') as never)}</strong></>}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFiltersOpen(true)}>
                <SlidersHorizontal className="h-4 w-4" /> Filtros {activeFilters.length > 0 && `(${activeFilters.length})`}
              </Button>
              <label className="sr-only" htmlFor="ordem">Ordenar por</label>
              <Select id="ordem" value={sort} onChange={(e) => set('ordem', e.target.value)} className="h-9 w-auto text-sm">
                {q && <option value="relevancia">Mais relevantes</option>}
                <option value="populares">Destaques</option>
                <option value="avaliacao">Melhor avaliadas</option>
                <option value="preco">Menor preço</option>
                <option value="prazo">Menor prazo</option>
                <option value="recentes">Mais recentes</option>
              </Select>
            </div>
          </div>

          {results.length === 0 ? (
            <EmptyState
              icon={<Siren className="h-10 w-10" />}
              title="Nenhuma solução encontrada"
              action={<LinkButton to={`/tenho-uma-dor${q ? `?titulo=${encodeURIComponent(q)}` : ''}`} variant="sun">Publicar como “Tenho uma dor”</LinkButton>}
            >
              Não tem problema! Publique sua necessidade e deixe que as empresas de impressão 3D tragam a solução até você.
            </EmptyState>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {results.map((p) => <PartCard key={p.id} part={p} />)}
              </div>
              <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-sol-300/15 p-6 text-center ring-1 ring-sol-300 sm:flex-row sm:justify-between sm:text-left">
                <p className="text-stone-800"><strong>Não achou exatamente o que precisa?</strong> Publique sua dor e receba propostas sob medida.</p>
                <LinkButton to={`/tenho-uma-dor${q ? `?titulo=${encodeURIComponent(q)}` : ''}`} variant="sun">Tenho uma dor</LinkButton>
              </div>
            </>
          )}
        </div>
      </div>

      <Modal open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtros" footer={<Button onClick={() => setFiltersOpen(false)}>Ver {results.length} resultados</Button>}>
        {filters}
      </Modal>
    </Container>
  )
}
