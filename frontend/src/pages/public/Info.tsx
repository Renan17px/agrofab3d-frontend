import { Link } from 'react-router-dom'
import { BadgeCheck, Check, CircleSlash, ShieldCheck, Sun, Thermometer, Dumbbell, Waves, FlaskConical } from 'lucide-react'
import { useStore } from '@/data/store'
import { CONDITIONS, MATERIALS } from '@/data/constants'
import { Meter } from '@/components/domain'
import { Badge, Card, LinkButton, PageHeader, cx } from '@/components/ui'
import { Container } from '@/components/Layout'

export function Plans() {
  const { db, user, company } = useStore()
  return (
    <Container>
      <PageHeader title="Planos para empresas" subtitle="Produtores usam o AgroFab3D gratuitamente. Empresas escolhem o plano conforme o momento do negócio." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {db.plans.map((p) => {
          const current = company?.plano === p.id
          return (
            <Card key={p.id} className={cx('flex flex-col p-6', p.id === 'profissional' && 'ring-2 ring-campo-600')}>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-stone-900">{p.nome}</h2>
                {p.id === 'profissional' && <Badge tone="green">Mais escolhido</Badge>}
                {current && <Badge tone="blue">Seu plano</Badge>}
              </div>
              <p className="mt-1 text-sm text-stone-600">{p.descricao}</p>
              <div className="mt-4 text-3xl font-extrabold text-stone-900">{p.preco}</div>
              {p.preco === 'A definir' && <div className="text-xs text-stone-600">Valores em validação com empresas parceiras</div>}
              <ul className="mt-6 flex-1 space-y-2.5">
                {p.recursos.map((r) => (
                  <li key={r} className="flex gap-2 text-sm text-stone-800"><Check className="mt-0.5 h-4 w-4 shrink-0 text-campo-700" />{r}</li>
                ))}
              </ul>
              <div className="mt-6">
                {user?.tipo === 'empresa' ? (
                  <LinkButton to="/painel/plano" variant={current ? 'outline' : 'primary'} className="w-full">{current ? 'Gerenciar plano' : 'Escolher este plano'}</LinkButton>
                ) : (
                  <LinkButton to="/cadastro?tipo=empresa" variant={p.id === 'profissional' ? 'primary' : 'outline'} className="w-full">Começar agora</LinkButton>
                )}
              </div>
            </Card>
          )
        })}
      </div>
      <Card className="mt-8 p-6">
        <h2 className="text-lg font-bold text-stone-900">Para produtores rurais: sempre gratuito</h2>
        <p className="mt-1 text-stone-700">Pesquisar soluções, publicar dores, encontrar empresas e solicitar contato não têm custo.</p>
        <LinkButton to="/cadastro?tipo=produtor" variant="secondary" className="mt-4">Criar conta de produtor</LinkButton>
      </Card>
    </Container>
  )
}

const ICONS = { uv: Sun, tempMax: Thermometer, resistencia: Dumbbell, flexibilidade: Waves, quimicos: FlaskConical }

export function MaterialGuide() {
  return (
    <Container>
      <PageHeader
        title="Guia de materiais"
        subtitle="Cada material de impressão 3D tem características diferentes. Escolher certo evita que a peça deforme no sol, quebre com vibração ou não aguente o calor do motor."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {MATERIALS.map((m) => (
          <Card key={m.id} className="flex flex-col p-5">
            <h2 className="text-xl font-extrabold text-terra-800">{m.nome}</h2>
            <p className="mt-1 text-sm text-stone-700">{m.resumo}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-stone-700"><ICONS.tempMax className="h-4 w-4" />Temp. máx.</dt><dd className="font-bold text-stone-900">~{m.tempMax} °C</dd></div>
              <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-stone-700"><ICONS.uv className="h-4 w-4" />Sol (UV)</dt><dd><Meter value={m.uv} /></dd></div>
              <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-stone-700"><ICONS.resistencia className="h-4 w-4" />Resistência</dt><dd><Meter value={m.resistencia} /></dd></div>
              <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-stone-700"><ICONS.flexibilidade className="h-4 w-4" />Flexibilidade</dt><dd><Meter value={m.flexibilidade} /></dd></div>
              <div className="flex items-center justify-between"><dt className="flex items-center gap-1.5 text-stone-700"><ICONS.quimicos className="h-4 w-4" />Químicos</dt><dd><Meter value={m.quimicos} /></dd></div>
            </dl>
            <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-sm">
              <p className="flex gap-2 text-stone-800"><Check className="mt-0.5 h-4 w-4 shrink-0 text-campo-700" />{m.indicado}</p>
              <p className="flex gap-2 text-stone-800"><CircleSlash className="mt-0.5 h-4 w-4 shrink-0 text-red-700" />{m.evitar}</p>
            </div>
          </Card>
        ))}
      </div>
      <Card className="mt-8 p-6">
        <h2 className="text-lg font-bold text-stone-900">Qual material para cada condição?</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead><tr className="border-b border-stone-200 text-stone-600"><th className="py-2 pr-4 font-semibold">Condição de uso</th><th className="py-2 font-semibold">Materiais recomendados</th></tr></thead>
            <tbody>
              {CONDITIONS.map((c) => (
                <tr key={c.id} className="border-b border-stone-100">
                  <td className="py-2.5 pr-4 text-stone-800">{c.label}</td>
                  <td className="py-2.5"><div className="flex flex-wrap gap-1.5">{c.materiais.map((m) => <Badge key={m} tone="earth">{m}</Badge>)}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-stone-600">
          Atenção: nem toda peça pode ser feita só com impressão 3D. Peças sob alta carga mecânica ou temperatura podem precisar de usinagem ou componentes metálicos. As empresas indicam a viabilidade técnica em cada proposta.
        </p>
      </Card>
    </Container>
  )
}

export function VerifiedSeal() {
  return (
    <Container>
      <PageHeader title="Selo de Empresa Verificada" subtitle="Entenda o que o selo significa, e o que ele não significa." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900"><BadgeCheck className="h-6 w-6 text-sky-700" /> O que verificamos</h2>
          <ul className="mt-4 space-y-2.5 text-stone-800">
            {['CNPJ ativo e compatível com a atividade', 'Dados cadastrais (razão social, endereço)', 'Localização informada no perfil', 'Outras informações solicitadas pela administração'].map((t) => (
              <li key={t} className="flex gap-2"><Check className="mt-0.5 h-5 w-5 shrink-0 text-campo-700" />{t}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-stone-600">A consulta de dados públicos é feita pelo servidor da plataforma, sem expor credenciais. O selo pode ser removido se as informações deixarem de ser válidas.</p>
        </Card>
        <Card className="border-amber-300 p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-stone-900"><ShieldCheck className="h-6 w-6 text-amber-700" /> O selo NÃO garante</h2>
          <ul className="mt-4 space-y-2.5 text-stone-800">
            {['A qualidade da solução', 'O cumprimento de prazo', 'A execução do serviço', 'O resultado da fabricação', 'A relação comercial entre as partes'].map((t) => (
              <li key={t} className="flex gap-2"><CircleSlash className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />{t}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-stone-600">Para avaliar a qualidade do serviço, consulte as avaliações de outros produtores no perfil da empresa.</p>
        </Card>
      </div>
    </Container>
  )
}

export function Terms() {
  return (
    <Container>
      <PageHeader title="Termos de uso" subtitle="Versão de demonstração, texto ilustrativo para o protótipo." />
      <Card className="max-w-3xl space-y-5 p-6 text-stone-800">
        <section>
          <h2 className="font-bold text-stone-900">1. Papel da plataforma</h2>
          <p className="mt-1 text-sm">O AgroFab3D é uma plataforma de intermediação que conecta produtores rurais a empresas de impressão 3D. Seu papel é encontrar, conectar, facilitar e organizar. A plataforma não possui estoque e não fabrica peças.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900">2. Responsabilidade técnica</h2>
          <p className="mt-1 text-sm">A fabricação, o dimensionamento, a escolha do material e a aplicação física das peças são de responsabilidade direta entre a empresa fabricante e o produtor contratante. A plataforma não se responsabiliza por falhas de fabricação.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900">3. Selo de verificação</h2>
          <p className="mt-1 text-sm">O selo de Empresa Verificada indica apenas que determinadas informações cadastrais foram verificadas. Ele não representa garantia sobre qualidade, prazo, execução ou resultado. <Link className="underline" to="/selo-verificado">Saiba mais</Link>.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900">4. Modelos de terceiros e licenças</h2>
          <p className="mt-1 text-sm">Empresas que utilizarem modelos de plataformas externas (Printables, Thingiverse, MakerWorld e outras) devem registrar a origem, o autor e a licença, respeitando as condições de uso definidas pelo autor.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900">5. Conteúdo e moderação</h2>
          <p className="mt-1 text-sm">Conteúdos que violem estes termos podem ser denunciados por qualquer usuário e removidos pela administração. Contas podem ser bloqueadas em caso de violações.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900">6. Aceite</h2>
          <p className="mt-1 text-sm">O aceite destes termos é registrado com data, hora e endereço IP no momento do cadastro.</p>
        </section>
      </Card>
    </Container>
  )
}

export function Privacy() {
  return (
    <Container>
      <PageHeader title="Política de privacidade" subtitle="Como tratamos seus dados, em conformidade com a LGPD (Lei nº 13.709/2018)." />
      <Card className="max-w-3xl space-y-5 p-6 text-stone-800">
        <section>
          <h2 className="font-bold text-stone-900">Dados coletados</h2>
          <p className="mt-1 text-sm">Nome, e-mail, telefone, localização (cidade/UF), dados empresariais (CNPJ, serviços) e conteúdos publicados (dores, peças, fotos).</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900">Finalidade</h2>
          <p className="mt-1 text-sm">Conectar produtores e empresas, exibir perfis públicos, permitir contato e manter a segurança da plataforma.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900">Compartilhamento</h2>
          <p className="mt-1 text-sm">O contato do produtor só é liberado para a empresa quando o próprio produtor aceita conversar com ela ou solicita um orçamento.</p>
        </section>
        <section>
          <h2 className="font-bold text-stone-900">Seus direitos</h2>
          <p className="mt-1 text-sm">Você pode acessar, corrigir e solicitar a exclusão/anonimização dos seus dados a qualquer momento em <Link className="underline" to="/painel/conta">Minha conta</Link>.</p>
        </section>
      </Card>
    </Container>
  )
}

export function NotFound() {
  return (
    <Container>
      <div className="py-16 text-center">
        <div className="text-6xl font-extrabold text-campo-700">404</div>
        <h1 className="mt-2 text-2xl font-bold text-stone-900">Página não encontrada</h1>
        <p className="mt-1 text-stone-600">O endereço pode ter mudado ou não existe.</p>
        <LinkButton to="/" className="mt-6">Voltar ao início</LinkButton>
      </div>
    </Container>
  )
}
