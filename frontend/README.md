# AgroFab3D — Frontend

Interface web do **AgroFab3D**, a plataforma que conecta produtores rurais a empresas de impressão 3D.
Construída a partir dos documentos deste repositório (README, Regras de Negócio, Requisitos Funcionais e
Não Funcionais, Casos de Uso e Feedback dos Empresários).

> **Somente frontend.** Não existe backend: todos os dados são fictícios e ficam salvos no `localStorage`
> do navegador. A camada de dados está isolada em `src/data/store.tsx` para ser trocada por chamadas a uma API.

## Como rodar

Requer Node.js 18 ou superior.

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

```bash
npm run build      # gera dist/ (type-check + build de produção)
npm run preview    # serve o build em http://localhost:4173
```

## Contas de demonstração

Senha de todas: `agro123` (também há botões de acesso rápido na tela **Entrar**).

| Perfil | E-mail |
|---|---|
| Produtor rural | `produtor@agrofab3d.com` |
| Empresa aprovada e verificada (plano Profissional) | `empresa@agrofab3d.com` |
| Empresa com cadastro pendente | `pendente@agrofab3d.com` |
| Administrador | `admin@agrofab3d.com` |

Em **Minha conta → Restaurar dados de demonstração** a base volta ao estado inicial.

## Stack

- React 18 + TypeScript + Vite
- React Router (code-splitting por rota)
- Tailwind CSS (paleta própria com contraste WCAG AA)
- lucide-react (ícones)
- PWA simples (manifest + service worker do "app shell")

## Telas

**Públicas:** Início, Como funciona, Catálogo técnico (busca + filtros), Detalhe da peça, Empresas,
Perfil da empresa, Guia de materiais, Planos, Selo de verificação, Termos de uso, Privacidade, Entrar, Cadastro
e o fluxo **Tenho uma dor**.

**Produtor:** Resumo, Minhas dores (com propostas recebidas, aceitar/recusar, contato e avaliação),
Meus orçamentos, Minha conta.

**Empresa:** Resumo com estatísticas, Perfil da empresa, Minhas peças (cadastro, edição, versões, origem/licença,
ativar/desativar), Oportunidades (dores ordenadas por compatibilidade), Detalhe da oportunidade (interesse +
proposta técnica), Minhas propostas, Pedidos de orçamento, Plano.

**Administrador:** Visão geral, Empresas (análise, aprovar/rejeitar/bloquear, selo verificado), Usuários
(bloquear/desbloquear), Moderação (denúncias, peças, dores), Planos, Histórico de versões e auditoria.

## Rastreabilidade com a documentação

| Documento | Onde está no frontend |
|---|---|
| RF-001/002 · RN-001 — Cadastro e login por tipo de usuário | `pages/Auth.tsx`, `data/store.tsx` (`register`, `login`) |
| RF-003 — Gerenciar perfil | `pages/panel/Account.tsx` |
| RF-004/005 · RN-002/007 — Perfil da empresa | `pages/panel/Company.tsx` (`CompanyProfileForm`), `pages/public/Companies.tsx` |
| RF-006/007 · RN-018/019 — Análise de empresas e selo | `pages/panel/Admin.tsx` (`AdminCompanies`), `pages/public/Info.tsx` (`VerifiedSeal`) |
| RF-010..016 · RN-003/004/014/015/016 — Peças, versões, origem e licença | `pages/panel/Company.tsx` (`PartForm`, `MyParts`), `pages/public/PartDetail.tsx` |
| RF-020..024 · RN-008..013 — Dores, interesse, proposta e contato | `pages/PainWizard.tsx`, `pages/panel/Producer.tsx`, `pages/panel/Company.tsx` (`OpportunityDetail`) |
| RF-030/031/032 · RN-005/006 — Busca por problema e filtros | `pages/public/Catalog.tsx`, `lib/search.ts` |
| RF-040..044 — Administração, moderação, denúncias, categorias | `pages/panel/Admin.tsx`, `components/domain.tsx` (`ReportButton`), `data/constants.ts` |
| RN-017 — Avaliação (qualidade, prazo, atendimento) | `components/domain.tsx` (`ReviewModal`, `RatingSummary`) |
| RN-020/021 — Produtor gratuito, planos para empresas | `pages/public/Info.tsx` (`Plans`), `pages/panel/Company.tsx` (`CompanyPlan`), limites em `data/store.tsx` |
| RN-022/023 — Dor vira produto do catálogo | "Cadastrar no catálogo" em `OpportunityDetail` → `PartForm?dor=` |
| Feedback Empresário 1 — correspondência automática por segmento | `lib/match.ts`; notificação automática ao publicar uma dor |
| Feedback Empresário 2 — viabilidade técnica e escolha de material | Guia de materiais, sugestão de material por condição de uso, campo "viabilidade" na proposta |
| RNF-002 — Imagens otimizadas (WebP ≤ 500 KB) | `lib/image.ts`, `ImageUploader` |
| RNF-004 — Mobile-first / PWA / leve | Layout responsivo com barra inferior no celular, `public/sw.js`, code-splitting |
| RNF-006 — LGPD | Consentimento no cadastro, política de privacidade, exportar dados, excluir/anonimizar conta |
| RNF-007 — Licença visível no catálogo | Bloco "Origem e licença do modelo" na peça; obrigatório para modelos externos |
| RNF-008 — "Tenho uma dor" em até 4 etapas | `PainWizard` (4 etapas, pode começar sem login, rascunho automático) |
| RNF-009/012 — Versões imutáveis e auditoria | `addVersion` só acrescenta; `AdminHistory` |
| RNF-015 — Contraste WCAG AA | Paleta `campo`/`terra` em `tailwind.config.js` |
| RNF-016 — Aceite dos termos de responsabilidade | Checkbox obrigatório no cadastro, data do aceite registrada |

Requisitos que dependem do servidor (RNF-001, 003, 005, 010, 011, 013, 014) estão sinalizados na interface
como simulação. Quando houver backend, eles devem ser implementados lá.

## Estrutura

```
src/
├── App.tsx               # rotas
├── types.ts              # modelo de domínio
├── data/
│   ├── constants.ts      # categorias, materiais, planos, licenças…
│   ├── seed.ts           # dados fictícios de demonstração
│   └── store.tsx         # "API" simulada (localStorage) — trocar por HTTP no futuro
├── lib/                  # busca, correspondência, formatação, compressão de imagem
├── components/           # UI base, componentes de domínio e layouts
└── pages/                # páginas públicas, autenticação, painel (produtor, empresa, admin)
```
