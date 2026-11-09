import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Building2, Eye, EyeOff, ShieldCheck, Tractor } from 'lucide-react'
import { useStore } from '@/data/store'
import { DEMO_PASSWORD } from '@/data/seed'
import { UFS } from '@/data/constants'
import { maskPhone } from '@/lib/format'
import { Logo } from '@/components/domain'
import { Alert, Button, Card, Checkbox, Field, Input, Select, cx, useToast } from '@/components/ui'

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-10 sm:py-16">
      <div className="mb-6 text-center">
        <Logo size={72} />
        <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-stone-900">{title}</h1>
        <p className="mt-1 text-stone-600">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

const DEMO = [
  { email: 'produtor@agrofab3d.com', label: 'Produtor rural', icon: Tractor },
  { email: 'empresa@agrofab3d.com', label: 'Empresa aprovada', icon: Building2 },
  { email: 'pendente@agrofab3d.com', label: 'Empresa pendente', icon: Building2 },
  { email: 'admin@agrofab3d.com', label: 'Administrador', icon: ShieldCheck },
]

export function Login() {
  const { actions } = useStore()
  const nav = useNavigate()
  const [params] = useSearchParams()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const voltar = params.get('voltar')

  const doLogin = (e: string, s: string) => {
    const r = actions.login(e, s)
    if (!r.ok) return setError(r.error)
    nav(voltar || (r.value.tipo === 'admin' ? '/admin' : '/painel'), { replace: true })
  }

  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta AgroFab3D">
      <Card className="p-6">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!email || !senha) return setError('Informe e-mail e senha.')
            doLogin(email, senha)
          }}
          noValidate
        >
          {error && <Alert tone="error">{error}</Alert>}
          <Field label="E-mail" htmlFor="l-email">
            <Input id="l-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Senha" htmlFor="l-senha">
            <div className="relative">
              <Input id="l-senha" type={show ? 'text' : 'password'} autoComplete="current-password" value={senha} onChange={(e) => setSenha(e.target.value)} className="pr-11" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-stone-600 hover:bg-stone-100" aria-label={show ? 'Ocultar senha' : 'Mostrar senha'}>
                {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </Field>
          <Button type="submit" size="lg" className="w-full">Entrar</Button>
        </form>
        <p className="mt-4 text-center text-sm text-stone-700">
          Ainda não tem conta? <Link to={`/cadastro${voltar ? `?voltar=${encodeURIComponent(voltar)}` : ''}`} className="font-semibold text-campo-700 hover:underline">Cadastre-se grátis</Link>
        </p>
      </Card>

      <Card className="mt-4 border-dashed bg-stone-50 p-5">
        <h2 className="text-sm font-bold text-stone-900">Contas de demonstração</h2>
        <p className="text-xs text-stone-600">Protótipo sem backend. Senha de todas: <code className="rounded bg-white px-1">{DEMO_PASSWORD}</code></p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {DEMO.map(({ email: e, label, icon: Icon }) => (
            <button key={e} onClick={() => doLogin(e, DEMO_PASSWORD)} className="flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-left text-sm font-semibold text-stone-800 hover:border-campo-500">
              <Icon className="h-4 w-4 shrink-0 text-campo-700" /> {label}
            </button>
          ))}
        </div>
      </Card>
    </AuthShell>
  )
}

export function Register() {
  const { actions } = useStore()
  const nav = useNavigate()
  const toast = useToast()
  const [params] = useSearchParams()
  const [tipo, setTipo] = useState<'produtor' | 'empresa'>(params.get('tipo') === 'empresa' ? 'empresa' : 'produtor')
  const [f, setF] = useState({ nome: '', email: '', senha: '', senha2: '', telefone: '', cidade: '', uf: '' })
  const [termos, setTermos] = useState(false)
  const [lgpd, setLgpd] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const up = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF({ ...f, [k]: k === 'telefone' ? maskPhone(e.target.value) : e.target.value })

  const strength = [f.senha.length >= 8, /\d/.test(f.senha), /[A-Za-z]/.test(f.senha), /[^A-Za-z0-9]/.test(f.senha)].filter(Boolean).length

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const er: Record<string, string> = {}
    if (f.nome.trim().length < 3) er.nome = tipo === 'empresa' ? 'Informe o nome do responsável.' : 'Informe seu nome completo.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) er.email = 'E-mail inválido.'
    if (f.senha.length < 8 || strength < 3) er.senha = 'Use ao menos 8 caracteres com letras e números.'
    if (f.senha !== f.senha2) er.senha2 = 'As senhas não conferem.'
    if (!termos) er.termos = 'É necessário aceitar os termos de uso.'
    if (!lgpd) er.lgpd = 'É necessário consentir com o tratamento de dados.'
    setErrors(er)
    if (Object.keys(er).length) return
    const r = actions.register({ tipo, nome: f.nome, email: f.email, senha: f.senha, telefone: f.telefone, cidade: f.cidade, uf: f.uf })
    if (!r.ok) return setError(r.error)
    toast('Conta criada com sucesso!')
    nav(tipo === 'empresa' ? '/painel/empresa' : params.get('voltar') || '/painel', { replace: true })
  }

  return (
    <AuthShell title="Criar conta" subtitle="Gratuito para produtores rurais">
      <Card className="p-6">
        <div className="mb-5 grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de conta">
          {(
            [
              ['produtor', 'Sou produtor', 'Tenho problemas no campo', Tractor],
              ['empresa', 'Sou empresa', 'Fabrico com impressão 3D', Building2],
            ] as const
          ).map(([id, label, desc, Icon]) => (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={tipo === id}
              onClick={() => setTipo(id)}
              className={cx('rounded-xl border-2 p-3 text-left transition-colors', tipo === id ? 'border-campo-700 bg-campo-50' : 'border-stone-200 hover:border-stone-300')}
            >
              <Icon className={cx('h-6 w-6', tipo === id ? 'text-campo-700' : 'text-stone-500')} />
              <div className="mt-1 font-bold text-stone-900">{label}</div>
              <div className="text-xs text-stone-600">{desc}</div>
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-4" noValidate>
          {error && <Alert tone="error">{error}</Alert>}
          <Field label={tipo === 'empresa' ? 'Nome do responsável' : 'Nome completo'} required error={errors.nome} htmlFor="r-nome">
            <Input id="r-nome" autoComplete="name" value={f.nome} onChange={up('nome')} />
          </Field>
          <Field label="E-mail" required error={errors.email} htmlFor="r-email">
            <Input id="r-email" type="email" autoComplete="email" value={f.email} onChange={up('email')} />
          </Field>
          <Field label="Telefone / WhatsApp" htmlFor="r-tel">
            <Input id="r-tel" type="tel" inputMode="tel" autoComplete="tel" value={f.telefone} onChange={up('telefone')} placeholder="(00) 00000-0000" />
          </Field>
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <Field label="Cidade" htmlFor="r-cid">
              <Input id="r-cid" value={f.cidade} onChange={up('cidade')} />
            </Field>
            <Field label="UF" htmlFor="r-uf">
              <Select id="r-uf" value={f.uf} onChange={up('uf')}>
                <option value="">-</option>
                {UFS.map((u) => <option key={u}>{u}</option>)}
              </Select>
            </Field>
          </div>
          <Field label="Senha" required error={errors.senha} htmlFor="r-senha">
            <Input id="r-senha" type="password" autoComplete="new-password" value={f.senha} onChange={up('senha')} />
            <div className="mt-1.5 flex gap-1" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={cx('h-1.5 flex-1 rounded-full', i < strength ? (strength >= 3 ? 'bg-campo-600' : 'bg-amber-500') : 'bg-stone-200')} />
              ))}
            </div>
          </Field>
          <Field label="Confirmar senha" required error={errors.senha2} htmlFor="r-senha2">
            <Input id="r-senha2" type="password" autoComplete="new-password" value={f.senha2} onChange={up('senha2')} />
          </Field>
          <div className="space-y-3 rounded-xl bg-stone-50 p-3">
            <Checkbox
              checked={termos}
              onChange={setTermos}
              label={<>Li e aceito os <Link to="/termos" target="_blank" className="font-semibold underline">Termos de Uso</Link>, ciente de que a plataforma não é responsável pela fabricação das peças.</>}
            />
            {errors.termos && <p className="text-xs font-medium text-red-700">{errors.termos}</p>}
            <Checkbox
              checked={lgpd}
              onChange={setLgpd}
              label={<>Consinto com o tratamento dos meus dados conforme a <Link to="/privacidade" target="_blank" className="font-semibold underline">Política de Privacidade</Link> (LGPD).</>}
            />
            {errors.lgpd && <p className="text-xs font-medium text-red-700">{errors.lgpd}</p>}
          </div>
          <Button type="submit" size="lg" className="w-full">Criar conta</Button>
          {tipo === 'empresa' && <p className="text-center text-xs text-stone-600">Em seguida você preencherá o perfil da empresa (CNPJ, serviços, materiais). O cadastro passa por análise antes de publicar.</p>}
        </form>
        <p className="mt-4 text-center text-sm text-stone-700">
          Já tem conta? <Link to="/entrar" className="font-semibold text-campo-700 hover:underline">Entrar</Link>
        </p>
      </Card>
    </AuthShell>
  )
}
