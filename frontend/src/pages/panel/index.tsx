import { Navigate } from 'react-router-dom'
import { useStore } from '@/data/store'
import { ProducerHome, ProducerQuotes } from './Producer'
import { CompanyHome, CompanyQuotes } from './Company'

/** /painel — resumo de acordo com o tipo de usuário (RN-001) */
export function PanelHome() {
  const { user } = useStore()
  if (user?.tipo === 'admin') return <Navigate to="/admin" replace />
  return user?.tipo === 'empresa' ? <CompanyHome /> : <ProducerHome />
}

export function QuotesPage() {
  const { user } = useStore()
  return user?.tipo === 'empresa' ? <CompanyQuotes /> : <ProducerQuotes />
}
