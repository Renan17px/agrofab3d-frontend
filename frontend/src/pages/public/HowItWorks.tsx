import { ArrowDown, CheckCircle2, Factory, FileSearch, Handshake, Layers, Lightbulb, Siren, Tractor } from 'lucide-react'
import { Container } from '@/components/Layout'
import { Card, LinkButton, PageHeader } from '@/components/ui'

function Flow({ steps }: { steps: { icon: typeof Tractor; t: string; d: string }[] }) {
  return (
    <ol className="space-y-2">
      {steps.map(({ icon: Icon, t, d }, i) => (
        <li key={t}>
          <div className="flex items-start gap-3 rounded-xl bg-stone-50 p-3">
            <span className="rounded-lg bg-white p-2 text-campo-700 ring-1 ring-stone-200"><Icon className="h-5 w-5" aria-hidden /></span>
            <div>
              <div className="font-bold text-stone-900">{t}</div>
              <div className="text-sm text-stone-600">{d}</div>
            </div>
          </div>
          {i < steps.length - 1 && <ArrowDown className="mx-auto my-1 h-4 w-4 text-stone-400" aria-hidden />}
        </li>
      ))}
    </ol>
  )
}

export default function HowItWorks() {
  return (
    <Container>
      <PageHeader title="Como funciona o AgroFab3D" subtitle="Um marketplace B2B que conecta quem tem o problema a quem tem a capacidade de resolvê-lo." />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold text-stone-900">Fluxo 1, Peça já existe no catálogo</h2>
          <Flow
            steps={[
              { icon: FileSearch, t: 'Produtor pesquisa', d: 'Busca pelo problema, sem precisar do código da peça.' },
              { icon: Layers, t: 'Analisa a ficha técnica', d: 'Material, dimensões, compatibilidade, versão e avaliações.' },
              { icon: Handshake, t: 'Solicita orçamento', d: 'A empresa recebe o pedido e responde com preço e prazo.' },
              { icon: Factory, t: 'Empresa fabrica', d: 'A fabricação é de responsabilidade da empresa.' },
              { icon: CheckCircle2, t: 'Produtor avalia', d: 'Qualidade, prazo e atendimento, separadamente.' },
            ]}
          />
        </Card>
        <Card className="p-6">
          <h2 className="mb-4 text-xl font-bold text-stone-900">Fluxo 2, “Pedir uma solução”</h2>
          <Flow
            steps={[
              { icon: Siren, t: 'Produtor publica a dor', d: 'Fotos, máquina, quantidade, local e prazo, o que souber.' },
              { icon: Lightbulb, t: 'Empresas compatíveis são avisadas', d: 'Correspondência por segmento, material e região.' },
              { icon: Handshake, t: 'Empresas enviam propostas', d: 'Solução, material, prazo, preço e viabilidade técnica.' },
              { icon: Tractor, t: 'Produtor escolhe e conversa', d: 'O contato é liberado para a empresa escolhida.' },
              { icon: Layers, t: 'Pode virar produto', d: 'Soluções úteis para outros entram no catálogo.' },
            ]}
          />
        </Card>
      </div>
      <Card className="mt-6 p-6">
        <h2 className="text-xl font-bold text-stone-900">O papel da plataforma</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {['Encontrar', 'Conectar', 'Facilitar', 'Organizar'].map((t) => (
            <div key={t} className="rounded-xl bg-campo-50 p-4 text-center font-extrabold text-campo-800">{t}</div>
          ))}
        </div>
        <p className="mt-4 text-sm text-stone-700">
          O AgroFab3D não possui estoque nem fabrica peças. A fabricação, o dimensionamento e a aplicação física das soluções são de responsabilidade direta entre a empresa fabricante e o produtor contratante.
        </p>
      </Card>
      <div className="mt-8 flex flex-wrap gap-3">
        <LinkButton to="/catalogo">Explorar o catálogo</LinkButton>
        <LinkButton to="/tenho-uma-dor" variant="sun">Pedir uma solução</LinkButton>
      </div>
    </Container>
  )
}
