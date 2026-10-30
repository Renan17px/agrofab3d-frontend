import { Suspense, useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  Building2,
  ClipboardList,
  CreditCard,
  FileClock,
  Gauge,
  Home,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Search,
  Send,
  ShieldCheck,
  Siren,
  User as UserIcon,
  Users,
  X,
  Lightbulb,
} from 'lucide-react'
import { useStore } from '@/data/store'
import { timeAgo } from '@/lib/format'
import { Logo } from './domain'
import { Avatar, Button, LinkButton, cx } from './ui'

const NAV = [
  { to: '/catalogo', label: 'Catálogo técnico' },
  { to: '/empresas', label: 'Empresas' },
  { to: '/guia-materiais', label: 'Guia de materiais' },
  { to: '/planos', label: 'Para empresas' },
]

function Notifications() {
  const { db, user, actions } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const nav = useNavigate()
  useEffect(() => {
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])
  if (!user) return null
  const items = db.notifications.filter((n) => n.userId === user.id)
  const unread = items.filter((n) => !n.lida).length
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="relative rounded-xl p-2.5 text-stone-700 hover:bg-stone-100" aria-label={`Notificações${unread ? ` (${unread} não lidas)` : ''}`}>
        <Bell className="h-5 w-5" />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-700 px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,360px)] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <span className="font-bold text-stone-900">Notificações</span>
            {unread > 0 && (
              <button className="text-sm font-semibold text-campo-700 hover:underline" onClick={() => actions.markAllRead()}>
                Marcar todas como lidas
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-6 text-center text-sm text-stone-600">Nenhuma notificação.</li>}
            {items.slice(0, 20).map((n) => (
              <li key={n.id}>
                <button
                  onClick={() => {
                    actions.markRead(n.id)
                    setOpen(false)
                    if (n.link) nav(n.link)
                  }}
                  className={cx('flex w-full gap-3 px-4 py-3 text-left text-sm hover:bg-stone-50', !n.lida && 'bg-campo-50')}
                >
                  <span className={cx('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.lida ? 'bg-transparent' : 'bg-campo-600')} />
                  <span>
                    <span className="text-stone-800">{n.texto}</span>
                    <span className="block text-xs text-stone-600">{timeAgo(n.criadoEm)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function Header() {
  const { user, actions } = useStore()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const nav = useNavigate()
  const loc = useLocation()
  useEffect(() => {
    setOpen(false)
  }, [loc.pathname])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    nav(`/catalogo?q=${encodeURIComponent(q)}`)
    setQ('')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
        <Link to="/" aria-label="AgroFab3D — início" className="shrink-0">
          <Logo />
        </Link>
        <nav className="ml-4 hidden items-center gap-1 lg:flex" aria-label="Principal">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => cx('rounded-lg px-3 py-2 text-sm font-semibold', isActive ? 'text-campo-800 bg-campo-50' : 'text-stone-700 hover:text-stone-900')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <form onSubmit={submit} className="ml-auto hidden max-w-xs flex-1 md:block" role="search">
          <label className="relative block">
            <span className="sr-only">Buscar soluções</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ex.: suporte para pulverizador" className="h-10 w-full rounded-xl border border-stone-300 bg-stone-50 pl-9 pr-3 text-sm focus:border-campo-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-campo-200" />
          </label>
        </form>
        <div className="ml-auto flex items-center gap-1 md:ml-2">
          {(!user || user.tipo === 'produtor') && (
            <LinkButton to="/tenho-uma-dor" variant="sun" size="sm" className="hidden sm:inline-flex">
              <Siren className="h-4 w-4" /> Tenho uma dor
            </LinkButton>
          )}
          {user ? (
            <>
              <Notifications />
              <Link to="/painel" className="hidden items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-stone-100 sm:flex" aria-label="Meu painel">
                <Avatar name={user.nome} size={32} color={user.tipo === 'admin' ? '#5f321f' : user.tipo === 'empresa' ? '#a95f28' : '#245933'} />
                <span className="hidden max-w-[120px] truncate text-sm font-semibold text-stone-800 xl:block">{user.nome.split(' ')[0]}</span>
              </Link>
            </>
          ) : (
            <div className="hidden items-center gap-1 sm:flex">
              <LinkButton to="/entrar" variant="ghost" size="sm">Entrar</LinkButton>
              <LinkButton to="/cadastro" variant="primary" size="sm">Criar conta</LinkButton>
            </div>
          )}
          <button className="rounded-xl p-2.5 text-stone-700 hover:bg-stone-100 lg:hidden" onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <div className="border-t border-stone-200 bg-white px-4 pb-4 pt-2 lg:hidden">
          <form onSubmit={submit} className="mb-2 md:hidden" role="search">
            <label className="relative block">
              <span className="sr-only">Buscar soluções</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar soluções" className="h-11 w-full rounded-xl border border-stone-300 bg-stone-50 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-campo-200" />
            </label>
          </form>
          <nav className="grid" aria-label="Menu móvel">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className="rounded-lg px-2 py-3 font-semibold text-stone-800 hover:bg-stone-50">
                {n.label}
              </NavLink>
            ))}
            {user ? (
              <>
                <NavLink to="/painel" className="rounded-lg px-2 py-3 font-semibold text-stone-800 hover:bg-stone-50">Meu painel</NavLink>
                <button onClick={() => { actions.logout(); nav('/') }} className="rounded-lg px-2 py-3 text-left font-semibold text-red-700 hover:bg-red-50">Sair</button>
              </>
            ) : (
              <div className="mt-2 grid grid-cols-2 gap-2">
                <LinkButton to="/entrar" variant="outline">Entrar</LinkButton>
                <LinkButton to="/cadastro">Criar conta</LinkButton>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

function Footer() {
  return (
    <footer className="mt-16 bg-campo-950 pb-24 text-campo-100 lg:pb-0">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-3 text-sm text-campo-200">Problemas reais do campo. Soluções reais em fabricação.</p>
          <p className="mt-3 text-xs text-campo-300">O AgroFab3D conecta produtores e empresas. A fabricação é de responsabilidade exclusiva das empresas cadastradas.</p>
        </div>
        <div>
          <h3 className="font-bold text-white">Produtor rural</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/catalogo">Buscar soluções</Link></li>
            <li><Link className="hover:text-white" to="/tenho-uma-dor">Tenho uma dor</Link></li>
            <li><Link className="hover:text-white" to="/empresas">Encontrar empresas</Link></li>
            <li><Link className="hover:text-white" to="/guia-materiais">Guia de materiais</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-white">Empresas de impressão 3D</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/cadastro?tipo=empresa">Cadastrar empresa</Link></li>
            <li><Link className="hover:text-white" to="/planos">Planos</Link></li>
            <li><Link className="hover:text-white" to="/selo-verificado">Selo de verificação</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-white">Institucional</h3>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link className="hover:text-white" to="/como-funciona">Como funciona</Link></li>
            <li><Link className="hover:text-white" to="/termos">Termos de uso</Link></li>
            <li><Link className="hover:text-white" to="/privacidade">Política de privacidade (LGPD)</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-campo-900 py-4 text-center text-xs text-campo-300">© {new Date().getFullYear()} AgroFab3D — Protótipo de interface (dados fictícios)</div>
    </footer>
  )
}

function MobileTabBar() {
  const { user } = useStore()
  const items = [
    { to: '/', label: 'Início', icon: Home, end: true },
    { to: '/catalogo', label: 'Catálogo', icon: LayoutGrid },
    ...(user?.tipo === 'empresa'
      ? [{ to: '/painel/oportunidades', label: 'Oportunidades', icon: Lightbulb, end: false }]
      : user?.tipo === 'admin'
        ? [{ to: '/admin/moderacao', label: 'Moderação', icon: ShieldCheck, end: false }]
        : [{ to: '/tenho-uma-dor', label: 'Tenho uma dor', icon: Siren, end: false }]),
    { to: '/empresas', label: 'Empresas', icon: Building2 },
    { to: user ? '/painel' : '/entrar', label: user ? 'Painel' : 'Entrar', icon: UserIcon },
  ]
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden" aria-label="Navegação inferior">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={label} to={to} end={end} className={({ isActive }) => cx('flex flex-col items-center gap-0.5 px-0.5 py-2 text-center text-[11px] font-semibold leading-tight', isActive ? 'text-campo-800' : 'text-stone-600')}>
          <Icon className="h-5 w-5" aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function PageLoading() {
  return (
    <div className="flex justify-center py-24" role="status" aria-label="Carregando">
      <span className="h-8 w-8 animate-spin rounded-full border-4 border-campo-200 border-t-campo-700" />
    </div>
  )
}

export function SiteLayout() {
  const loc = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [loc.pathname])
  return (
    <div className="flex min-h-screen flex-col">
      <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2">
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" className="flex-1">
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
      <MobileTabBar />
    </div>
  )
}

// ---------- Painel (área logada) ----------
type Item = { to: string; label: string; icon: typeof Home; end?: boolean }

const MENUS: Record<string, Item[]> = {
  produtor: [
    { to: '/painel', label: 'Resumo', icon: Gauge, end: true },
    { to: '/painel/dores', label: 'Minhas dores', icon: Siren },
    { to: '/painel/orcamentos', label: 'Meus orçamentos', icon: ClipboardList },
    { to: '/painel/conta', label: 'Minha conta', icon: UserIcon },
  ],
  empresa: [
    { to: '/painel', label: 'Resumo', icon: Gauge, end: true },
    { to: '/painel/empresa', label: 'Perfil da empresa', icon: Building2 },
    { to: '/painel/pecas', label: 'Minhas peças', icon: Package },
    { to: '/painel/oportunidades', label: 'Oportunidades', icon: Lightbulb },
    { to: '/painel/propostas', label: 'Minhas propostas', icon: Send },
    { to: '/painel/orcamentos', label: 'Orçamentos', icon: ClipboardList },
    { to: '/painel/plano', label: 'Plano', icon: CreditCard },
    { to: '/painel/conta', label: 'Minha conta', icon: UserIcon },
  ],
  admin: [
    { to: '/admin', label: 'Visão geral', icon: Gauge, end: true },
    { to: '/admin/empresas', label: 'Empresas', icon: Building2 },
    { to: '/admin/usuarios', label: 'Usuários', icon: Users },
    { to: '/admin/moderacao', label: 'Moderação', icon: ShieldCheck },
    { to: '/admin/planos', label: 'Planos', icon: CreditCard },
    { to: '/admin/historico', label: 'Histórico e auditoria', icon: FileClock },
    { to: '/painel/conta', label: 'Minha conta', icon: UserIcon },
  ],
}

export function PanelLayout() {
  const { user, actions } = useStore()
  const nav = useNavigate()
  if (!user) return null
  const items = MENUS[user.tipo]!
  const roleLabel = { produtor: 'Produtor rural', empresa: 'Empresa de impressão 3D', admin: 'Administrador' }[user.tipo]
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:flex lg:gap-8 lg:py-10">
      <aside className="lg:w-60 lg:shrink-0">
        <div className="mb-4 hidden items-center gap-3 lg:flex">
          <Avatar name={user.nome} size={44} color={user.tipo === 'admin' ? '#5f321f' : user.tipo === 'empresa' ? '#a95f28' : '#245933'} />
          <div className="min-w-0">
            <div className="truncate font-bold text-stone-900">{user.nome}</div>
            <div className="text-xs text-stone-600">{roleLabel}</div>
          </div>
        </div>
        <nav className="-mx-4 mb-6 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:px-0" aria-label="Menu do painel">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cx('flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold', isActive ? 'bg-campo-700 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50 lg:bg-transparent lg:ring-0')
              }
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </NavLink>
          ))}
          <Button variant="ghost" size="sm" className="hidden justify-start text-red-700 lg:mt-4 lg:flex" onClick={() => { actions.logout(); nav('/') }}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </nav>
      </aside>
      <section className="min-w-0 flex-1">
        <Suspense fallback={<PageLoading />}>
          <Outlet />
        </Suspense>
      </section>
    </div>
  )
}

export function Container({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('mx-auto max-w-7xl px-4 py-8 lg:py-12', className)}>{children}</div>
}

export function Prose({ children }: { children: React.ReactNode }) {
  return <div className="prose-agro max-w-3xl space-y-4 text-stone-800">{children}</div>
}

