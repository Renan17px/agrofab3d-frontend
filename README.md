# 🌱 AgroFab3D — Frontend

> **Conectando problemas reais do campo a empresas capazes de desenvolver e fabricar soluções com impressão 3D.**

Este repositório contém o **frontend** (protótipo navegável) do AgroFab3D, um marketplace B2B que aproxima **produtores rurais** e **empresas de impressão 3D**. A interface foi construída a partir da documentação do projeto: regras de negócio, requisitos funcionais e não funcionais, casos de uso e feedback de empresários do setor. Esses documentos estão na raiz do repositório, em PDF.

> ⚠️ **Somente frontend.** Não há backend: os dados são fictícios e ficam salvos no navegador (`localStorage`). A camada de dados está isolada em `frontend/src/data/store.tsx` para ser substituída por uma API.

---

## 🚀 Como rodar

Requer **Node.js 18+**.

```bash
cd frontend
npm install
npm run dev
```

Acesse **http://localhost:5173**.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos + build de produção em `dist/` |
| `npm run preview` | Serve o build em http://localhost:4173 |

### 🔑 Contas de demonstração

Senha de todas: **`agro123`**. A tela **Entrar** também tem botões de acesso rápido.

| Perfil | E-mail |
|---|---|
| 🚜 Produtor rural | `produtor@agrofab3d.com` |
| 🖨️ Empresa aprovada e verificada | `empresa@agrofab3d.com` |
| ⏳ Empresa com cadastro pendente | `pendente@agrofab3d.com` |
| 🛡️ Administrador | `admin@agrofab3d.com` |

Para voltar aos dados iniciais: **Minha conta → Restaurar dados de demonstração**.

---

## 💡 A ideia em uma frase

> 🚜 **O produtor apresenta o problema.** 🖨️ **A empresa apresenta a solução.** 🌱 **A plataforma faz a conexão.**

A plataforma tem dois fluxos principais:

```text
JÁ EXISTE UMA SOLUÇÃO                     AINDA NÃO EXISTE — "PEDIR UMA SOLUÇÃO"
Produtor pesquisa no catálogo             Produtor publica o problema
        ↓                                         ↓
Compara ficha técnica e avaliações        Empresas compatíveis são avisadas
        ↓                                         ↓
Solicita orçamento                        Empresas enviam propostas
        ↓                                         ↓
Empresa fabrica e entrega                 Produtor escolhe e conversa
        ↓                                         ↓
Produtor avalia a empresa                 Solução pode virar produto do catálogo
```

---

## ✨ Funcionalidades

### 🌐 Área pública

- **Página inicial:** busca em destaque, como funciona, categorias, peças mais procuradas, empresas verificadas e chamada para empresas.
- **Catálogo técnico com busca por problema:** o produtor escreve do seu jeito ("proteção para sensor que pega chuva") e não precisa do nome técnico nem do código da peça. A busca reconhece sinônimos do vocabulário do campo.
- **Filtros:** categoria, tipo de equipamento, fabricante/modelo, material, estado da empresa, preço máximo, apenas empresas verificadas e apenas peças com preço definido. Ordenação por relevância, avaliação, preço, prazo ou novidade.
- **Página da peça:**
  - fotos e ficha técnica completa (material, dimensões, equipamento compatível, fabricante, modelo, temperatura de uso e prazo);
  - **histórico de versões** (V1 → V2 → V3);
  - **origem e licença do modelo 3D** (Printables, Thingiverse, MakerWorld ou modelo próprio);
  - pedido de orçamento e contato por WhatsApp, telefone ou e-mail.
- **Empresas e perfil empresarial:** serviços, materiais, tecnologias, segmentos de atuação, experiência, peças cadastradas e avaliações.
- **Guia de materiais:** PLA, PETG, ABS, ASA, Nylon, TPU, PC e resina. Mostra resistência ao sol, ao calor, mecânica e a produtos químicos, além de quando usar e quando evitar cada um.
- **Páginas institucionais:** como funciona, planos, significado do selo de empresa verificada, termos de uso e política de privacidade (LGPD).

### 🩹 "Pedir uma solução"

- Publicação de uma necessidade em **até 4 etapas**: problema, fotos/vídeos, detalhes e revisão.
- Dá para **começar sem login**. O rascunho fica salvo e a conta é pedida só na hora de publicar.
- Nenhum campo técnico é obrigatório: o produtor informa o que souber.
- Ao marcar as condições de uso (sol, chuva, calor, impacto, vibração…), o sistema **sugere os materiais mais indicados**.
- Fotos são **otimizadas no próprio celular** (convertidas para WebP, até 500 KB), pensando em internet lenta no campo.

### 🚜 Painel do produtor

- Resumo com dores abertas, propostas para avaliar e orçamentos.
- **Minhas dores:** propostas recebidas, comparadas por material, prazo, preço e viabilidade técnica.
- **Aceitar ou recusar propostas.** Ao aceitar, o contato é liberado para os dois lados; antes disso, o telefone do produtor fica protegido.
- Sugestão de **empresas compatíveis** com a dor.
- Marcar a dor como resolvida ou encerrada.
- **Meus orçamentos:** acompanhar respostas, aceitar e confirmar o recebimento.
- **Avaliação da empresa** em três critérios separados: qualidade, prazo e atendimento.

### 🖨️ Painel da empresa

- Resumo com peças ativas, visualizações, orçamentos novos, avaliação e oportunidades compatíveis.
- **Perfil da empresa:** dados, CNPJ, segmentos de atuação, materiais, tecnologias, serviços e contatos.
- **Minhas peças:** cadastrar, editar, ativar/desativar e excluir.
  - Nova versão técnica (V2, V3…) **sem apagar as anteriores**.
  - Origem e licença **obrigatórias** para modelos de terceiros, com alerta para licenças não comerciais.
- **Oportunidades:** dores dos produtores ordenadas por **compatibilidade** (segmento, material e região), com o motivo de cada indicação.
- **Demonstrar interesse e enviar proposta:** solução, material, prazo, preço aproximado, informações técnicas e **viabilidade em impressão 3D**. A viabilidade indica se a peça é totalmente imprimível, se precisa de componentes metálicos ou se exige outro processo, como usinagem.
- **Transformar uma dor resolvida em produto do catálogo**, para ajudar outros produtores com o mesmo problema.
- **Pedidos de orçamento:** responder com valor e prazo.
- **Plano:** uso dos limites e troca entre Gratuito, Profissional e Empresarial (simulada).

### 🛡️ Painel do administrador

- Visão geral: usuários, empresas, peças, dores, funil da plataforma e atividade recente.
- **Análise de empresas:** consulta de CNPJ (simulada), aprovar, rejeitar, bloquear e **conceder ou remover o selo de empresa verificada**.
- **Usuários:** busca, bloqueio e desbloqueio, com registro da data de aceite dos termos.
- **Moderação:** denúncias, remoção e restauração de peças e dores.
- **Planos de assinatura:** editar limites, preço exibido e recursos.
- **Histórico e auditoria:** versões de todas as peças e registro de ações críticas.

### 🔔 Recursos gerais

- Notificações internas: nova proposta, dor compatível, orçamento respondido, mudança de status…
- Denúncia de conteúdo por qualquer usuário logado.
- **LGPD:** consentimento no cadastro, download dos próprios dados e exclusão/anonimização da conta.
- Aceite obrigatório dos termos, deixando claro que a fabricação é responsabilidade da empresa.

---

## 📱 Pensado para o campo

- **Mobile-first:** barra de navegação inferior no celular e layout testado em telas de 360 px.
- **PWA:** pode ser instalado no celular e mantém o app em cache para conexões instáveis.
- **Leve:** código dividido por página (o produtor baixa só o que usa) e imagens comprimidas.
- **Legível sob o sol:** paleta com contraste WCAG AA.

---

## 🛠️ Tecnologias

React 18 · TypeScript · Vite · React Router · Tailwind CSS · lucide-react

## 📁 Estrutura

```text
├── *.pdf                     # Documentação do projeto (regras, requisitos, casos de uso, feedback)
└── frontend/
    ├── public/               # Ícone, manifest e service worker (PWA)
    └── src/
        ├── App.tsx           # Rotas
        ├── types.ts          # Modelo de domínio
        ├── data/             # Constantes, dados de demonstração e "API" simulada
        ├── lib/              # Busca, compatibilidade, formatação, compressão de imagens
        ├── components/       # UI base, componentes do domínio e layouts
        └── pages/            # Páginas públicas, autenticação e painéis
```

A relação entre cada requisito e o código que o implementa está em [`frontend/README.md`](frontend/README.md).

---

## 🔮 Próximos passos

- Backend com API REST, autenticação real e banco de dados.
- Consulta automática de CNPJ, antivírus nos uploads e upload real de vídeos e modelos 3D.
- Pagamento dos planos.
- Evoluções previstas na documentação: chat interno, frete, recomendações por IA e identificação de peças por foto.

---

## 🌱 AgroFab3D

**Problemas reais do campo. Soluções reais em fabricação.**
