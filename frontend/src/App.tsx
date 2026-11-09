import { lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { SiteLayout, PanelLayout } from '@/components/Layout'
import { RequireAuth } from '@/components/domain'
import Home from '@/pages/public/Home'

// Code-splitting por rota (RNF-004): o produtor no celular baixa só o que vai usar.
const HowItWorks = lazy(() => import('@/pages/public/HowItWorks'))
const Catalog = lazy(() => import('@/pages/public/Catalog'))
const PartDetail = lazy(() => import('@/pages/public/PartDetail'))
const Companies = lazy(() => import('@/pages/public/Companies').then((m) => ({ default: m.Companies })))
const CompanyProfile = lazy(() => import('@/pages/public/Companies').then((m) => ({ default: m.CompanyProfile })))
const info = () => import('@/pages/public/Info')
const MaterialGuide = lazy(() => info().then((m) => ({ default: m.MaterialGuide })))
const NotFound = lazy(() => info().then((m) => ({ default: m.NotFound })))
const Plans = lazy(() => info().then((m) => ({ default: m.Plans })))
const Privacy = lazy(() => info().then((m) => ({ default: m.Privacy })))
const Terms = lazy(() => info().then((m) => ({ default: m.Terms })))
const VerifiedSeal = lazy(() => info().then((m) => ({ default: m.VerifiedSeal })))
const auth = () => import('@/pages/Auth')
const Login = lazy(() => auth().then((m) => ({ default: m.Login })))
const Register = lazy(() => auth().then((m) => ({ default: m.Register })))
const PainWizard = lazy(() => import('@/pages/PainWizard'))
const panel = () => import('@/pages/panel')
const PanelHome = lazy(() => panel().then((m) => ({ default: m.PanelHome })))
const QuotesPage = lazy(() => panel().then((m) => ({ default: m.QuotesPage })))
const producer = () => import('@/pages/panel/Producer')
const MyPains = lazy(() => producer().then((m) => ({ default: m.MyPains })))
const ProducerPainDetail = lazy(() => producer().then((m) => ({ default: m.ProducerPainDetail })))
const company = () => import('@/pages/panel/Company')
const CompanyPlan = lazy(() => company().then((m) => ({ default: m.CompanyPlan })))
const CompanyProfileForm = lazy(() => company().then((m) => ({ default: m.CompanyProfileForm })))
const MyParts = lazy(() => company().then((m) => ({ default: m.MyParts })))
const MyProposals = lazy(() => company().then((m) => ({ default: m.MyProposals })))
const OpportunityDetail = lazy(() => company().then((m) => ({ default: m.OpportunityDetail })))
const Opportunities = lazy(() => company().then((m) => ({ default: m.Opportunities })))
const PartForm = lazy(() => company().then((m) => ({ default: m.PartForm })))
const admin = () => import('@/pages/panel/Admin')
const AdminCompanies = lazy(() => admin().then((m) => ({ default: m.AdminCompanies })))
const AdminHistory = lazy(() => admin().then((m) => ({ default: m.AdminHistory })))
const AdminHome = lazy(() => admin().then((m) => ({ default: m.AdminHome })))
const AdminModeration = lazy(() => admin().then((m) => ({ default: m.AdminModeration })))
const AdminPlans = lazy(() => admin().then((m) => ({ default: m.AdminPlans })))
const AdminUsers = lazy(() => admin().then((m) => ({ default: m.AdminUsers })))
const Account = lazy(() => import('@/pages/panel/Account'))

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        {/* Público */}
        <Route index element={<Home />} />
        <Route path="como-funciona" element={<HowItWorks />} />
        <Route path="catalogo" element={<Catalog />} />
        <Route path="catalogo/:id" element={<PartDetail />} />
        <Route path="empresas" element={<Companies />} />
        <Route path="empresas/:id" element={<CompanyProfile />} />
        <Route path="planos" element={<Plans />} />
        <Route path="guia-materiais" element={<MaterialGuide />} />
        <Route path="selo-verificado" element={<VerifiedSeal />} />
        <Route path="termos" element={<Terms />} />
        <Route path="privacidade" element={<Privacy />} />
        <Route path="entrar" element={<Login />} />
        <Route path="cadastro" element={<Register />} />
        {/* "Tenho uma dor" pode ser iniciado sem login, o login é pedido só na publicação */}
        <Route path="tenho-uma-dor" element={<PainWizard />} />

        {/* Área logada */}
        <Route element={<RequireAuth><PanelLayout /></RequireAuth>}>
          <Route path="painel" element={<PanelHome />} />
          <Route path="painel/conta" element={<Account />} />
          <Route path="painel/orcamentos" element={<RequireAuth roles={['produtor', 'empresa']}><QuotesPage /></RequireAuth>} />
          {/* Produtor */}
          <Route path="painel/dores" element={<RequireAuth roles={['produtor']}><MyPains /></RequireAuth>} />
          <Route path="painel/dores/:id" element={<RequireAuth roles={['produtor']}><ProducerPainDetail /></RequireAuth>} />
          <Route path="painel/dores/:id/editar" element={<RequireAuth roles={['produtor']}><PainWizard /></RequireAuth>} />
          {/* Empresa */}
          <Route path="painel/empresa" element={<RequireAuth roles={['empresa']}><CompanyProfileForm /></RequireAuth>} />
          <Route path="painel/pecas" element={<RequireAuth roles={['empresa']}><MyParts /></RequireAuth>} />
          <Route path="painel/pecas/nova" element={<RequireAuth roles={['empresa']}><PartForm /></RequireAuth>} />
          <Route path="painel/pecas/:id" element={<RequireAuth roles={['empresa']}><PartForm /></RequireAuth>} />
          <Route path="painel/oportunidades" element={<RequireAuth roles={['empresa']}><Opportunities /></RequireAuth>} />
          <Route path="painel/oportunidades/:id" element={<RequireAuth roles={['empresa']}><OpportunityDetail /></RequireAuth>} />
          <Route path="painel/propostas" element={<RequireAuth roles={['empresa']}><MyProposals /></RequireAuth>} />
          <Route path="painel/plano" element={<RequireAuth roles={['empresa']}><CompanyPlan /></RequireAuth>} />
          {/* Administrador */}
          <Route path="admin" element={<RequireAuth roles={['admin']}><AdminHome /></RequireAuth>} />
          <Route path="admin/empresas" element={<RequireAuth roles={['admin']}><AdminCompanies /></RequireAuth>} />
          <Route path="admin/usuarios" element={<RequireAuth roles={['admin']}><AdminUsers /></RequireAuth>} />
          <Route path="admin/moderacao" element={<RequireAuth roles={['admin']}><AdminModeration /></RequireAuth>} />
          <Route path="admin/planos" element={<RequireAuth roles={['admin']}><AdminPlans /></RequireAuth>} />
          <Route path="admin/historico" element={<RequireAuth roles={['admin']}><AdminHistory /></RequireAuth>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
