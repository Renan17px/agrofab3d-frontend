import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Building2, Handshake, Lightbulb, Search, Siren, Sprout, Tractor, Printer, Repeat } from 'lucide-react'
import { useStore } from '@/data/store'
import { CATEGORIES } from '@/data/constants'
import { publicCompanies, publicParts } from '@/lib/selectors'
import { CompanyCard, PartCard, PartIllustration } from '@/components/domain'
import { LinkButton, Card } from '@/components/ui'

const EXEMPLOS = ['suporte para pulverizador', 'engrenagem plantadeira', 'mangueira irrigação', 'proteção sensor chuva']

export default function Home() {
  const { db, user } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const parts = publicParts(db)
  const companies = publicCompanies(db)
  const destaque = [...parts].sort((a, b) => b.visualizacoes - a.visualizacoes).slice(0, 4)
  const topCompanies = companies.filter((c) => c.verificada).slice(0, 3)
  const doresAbertas = db.pains.filter((p) => p.status === 'aberta').length

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-campo-900 text-white">
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }} />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 lg:grid-cols-[1.2fr_1fr] lg:py-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold text-campo-100 ring-1 ring-white/20">
              <Sprout className="h-4 w-4" aria-hidden /> Impressão 3D para o agronegócio
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl">
              A peça quebrou ou não existe mais?
              <span className="block text-sol-300">Alguém pode fabricar para você.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-campo-100">
              O AgroFab3D conecta produtores rurais a empresas de impressão 3D capazes de desenvolver e fabricar soluções sob medida, rápido, perto de você e sem precisar saber o nome técnico da peça.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                nav(`/catalogo?q=${encodeURIComponent(q)}`)
              }}
              className="mt-8 flex max-w-xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-xl sm:flex-row"
              role="search"
            >
              <label className="relative flex-1">
                <span className="sr-only">Descreva o que você precisa</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-500" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Descreva o problema. Ex.: suporte para pulverizador" className="h-12 w-full rounded-xl pl-10 pr-3 text-stone-900 placeholder:text-stone-500 focus:outline-none" />
              </label>
              <button className="h-12 rounded-xl bg-campo-700 px-6 font-bold text-white hover:bg-campo-800">Buscar solução</button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2 text-sm">
              <span className="text-campo-200">Experimente:</span>
              {EXEMPLOS.map((e) => (
                <Link key={e} to={`/catalogo?q=${encodeURIComponent(e)}`} className="rounded-full bg-white/10 px-3 py-0.5 text-campo-50 hover:bg-white/20">
                  {e}
                </Link>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton to="/tenho-uma-dor" variant="sun" size="lg">
                <Siren className="h-5 w-5" /> Não encontrou? Tenho uma dor
              </LinkButton>
              {!user && (
                <Link to="/cadastro?tipo=empresa" className="font-semibold text-campo-100 underline-offset-4 hover:underline">
                  Sou empresa de impressão 3D →
                </Link>
              )}
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-4">
              {destaque.slice(0, 4).map((p, i) => (
                <Link key={p.id} to={`/catalogo/${p.id}`} className={`overflow-hidden rounded-2xl bg-white shadow-xl transition-transform hover:-translate-y-1 ${i % 2 ? 'translate-y-8' : ''}`}>
                  <PartIllustration categoria={p.categoria} className="aspect-[4/3] w-full" />
                  <div className="p-3">
                    <div className="line-clamp-1 text-sm font-bold text-stone-900">{p.nome}</div>
                    <div className="text-xs text-stone-600">{p.material} · {p.versoes.at(-1)?.versao}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">Como funciona</h2>
          <p className="mt-2 text-lg text-stone-600">O produtor apresenta o problema. A empresa apresenta a solução. A plataforma faz a conexão.</p>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-campo-100 p-2.5 text-campo-800"><Search className="h-6 w-6" aria-hidden /></span>
              <h3 className="text-xl font-bold text-stone-900">Já existe uma solução</h3>
            </div>
            <ol className="mt-5 space-y-4">
              {['Pesquise pelo problema, do seu jeito', 'Compare fotos, medidas, material, versão e avaliações', 'Solicite um orçamento direto para a empresa', 'Receba a peça e avalie o serviço'].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-campo-700 text-sm font-bold text-white">{i + 1}</span>
                  <span className="pt-0.5 text-stone-800">{t}</span>
                </li>
              ))}
            </ol>
            <LinkButton to="/catalogo" variant="secondary" className="mt-6">Explorar o catálogo <ArrowRight className="h-4 w-4" /></LinkButton>
          </Card>
          <Card className="border-sol-300 bg-sol-300/10 p-6">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-sol-400 p-2.5 text-stone-900"><Siren className="h-6 w-6" aria-hidden /></span>
              <h3 className="text-xl font-bold text-stone-900">Ainda não existe, “Tenho uma dor”</h3>
            </div>
            <ol className="mt-5 space-y-4">
              {['Conte o problema com fotos, sem precisar de termos técnicos', 'Empresas compatíveis são avisadas automaticamente', 'Receba propostas com material, prazo e preço', 'Escolha, converse e resolva o problema'].map((t, i) => (
                <li key={t} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-sol-300">{i + 1}</span>
                  <span className="pt-0.5 text-stone-800">{t}</span>
                </li>
              ))}
            </ol>
            <LinkButton to="/tenho-uma-dor" variant="sun" className="mt-6">Publicar minha dor <ArrowRight className="h-4 w-4" /></LinkButton>
          </Card>
        </div>
      </section>

      {/* Categorias */}
      <section className="bg-campo-50 py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">Soluções por aplicação</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {CATEGORIES.filter((c) => c.id !== 'outros').map((c) => (
              <Link key={c.id} to={`/catalogo?categoria=${c.id}`} className="group flex flex-col items-start gap-2 rounded-2xl border border-campo-100 bg-white p-3 hover:border-campo-400 hover:shadow-sm sm:flex-row sm:items-center sm:gap-3">
                <PartIllustration categoria={c.id} className="h-12 w-12 shrink-0 rounded-xl" />
                <div className="min-w-0">
                  <div className="font-bold text-stone-900 [overflow-wrap:anywhere]">{c.label}</div>
                  <div className="text-xs text-stone-600">{parts.filter((p) => p.categoria === c.id).length} soluções</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Destaques */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">Mais procuradas</h2>
          <Link to="/catalogo" className="shrink-0 font-semibold text-campo-700 hover:underline">Ver catálogo →</Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {destaque.map((p) => <PartCard key={p.id} part={p} />)}
        </div>
      </section>

      {/* Ciclo */}
      <section className="bg-stone-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex items-center gap-3">
            <Repeat className="h-7 w-7 text-sol-300" aria-hidden />
            <h2 className="text-3xl font-extrabold tracking-tight">Uma dor pode virar solução para muitos</h2>
          </div>
          <p className="mt-2 max-w-2xl text-stone-300">Cada problema resolvido pode entrar no catálogo e ajudar outros produtores com a mesma necessidade.</p>
          <ol className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Tractor, 'Produtor publica o problema'],
              [Lightbulb, 'Empresa encontra a oportunidade'],
              [Printer, 'Protótipo, teste e versão final'],
              [Handshake, 'Solução entra no catálogo'],
            ].map(([Icon, t], i) => {
              const I = Icon as typeof Tractor
              return (
                <li key={t as string} className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10">
                  <I className="h-7 w-7 text-sol-300" aria-hidden />
                  <div className="mt-3 text-sm font-semibold text-stone-400">Passo {i + 1}</div>
                  <div className="font-bold">{t as string}</div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>

      {/* Empresas */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight text-stone-900">Empresas verificadas</h2>
            <p className="mt-1 flex items-center gap-1.5 text-stone-600">
              <BadgeCheck className="h-4 w-4 text-sky-700" aria-hidden /> CNPJ e dados cadastrais conferidos pela plataforma.
            </p>
          </div>
          <Link to="/empresas" className="shrink-0 font-semibold text-campo-700 hover:underline">Todas →</Link>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {topCompanies.map((c) => <CompanyCard key={c.id} company={c} />)}
        </div>
      </section>

      {/* CTA empresas */}
      <section className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col items-start gap-6 rounded-3xl bg-terra-700 p-8 text-white md:flex-row md:items-center md:justify-between md:p-12">
          <div className="max-w-2xl">
            <Building2 className="h-8 w-8 text-terra-200" aria-hidden />
            <h2 className="mt-3 text-2xl font-extrabold sm:text-3xl">Tem impressora 3D e quer atender o agro?</h2>
            <p className="mt-2 text-terra-100">Mostre o que você fabrica, receba pedidos de orçamento e encontre {doresAbertas} problemas reais esperando por uma solução agora.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <LinkButton to="/cadastro?tipo=empresa" variant="sun" size="lg">Cadastrar empresa</LinkButton>
            <LinkButton to="/planos" variant="onDark" size="lg">Ver planos</LinkButton>
          </div>
        </div>
      </section>
    </>
  )
}
