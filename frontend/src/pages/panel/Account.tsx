import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, KeyRound, ShieldAlert, UserRound } from 'lucide-react'
import { useStore } from '@/data/store'
import { UFS } from '@/data/constants'
import { dateTimeBR, maskPhone } from '@/lib/format'
import { Alert, Button, Card, Field, Input, Modal, PageHeader, Select, useToast } from '@/components/ui'

export default function Account() {
  const { db, user, actions } = useStore()
  const toast = useToast()
  const nav = useNavigate()
  const [f, setF] = useState({ nome: user!.nome, email: user!.email, telefone: user!.telefone ?? '', cidade: user!.cidade ?? '', uf: user!.uf ?? '' })
  const [pw, setPw] = useState({ atual: '', nova: '', conf: '' })
  const [del, setDel] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    if (f.nome.trim().length < 3) return toast('Informe seu nome.', 'error')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return toast('E-mail inválido.', 'error')
    const r = actions.updateProfile(f)
    if (!r.ok) return toast(r.error, 'error')
    toast('Dados atualizados.')
  }

  const changePw = (e: React.FormEvent) => {
    e.preventDefault()
    if (pw.nova.length < 8) return toast('A nova senha deve ter ao menos 8 caracteres.', 'error')
    if (pw.nova !== pw.conf) return toast('As senhas não conferem.', 'error')
    const r = actions.changePassword(pw.atual, pw.nova)
    if (!r.ok) return toast(r.error, 'error')
    setPw({ atual: '', nova: '', conf: '' })
    toast('Senha alterada.')
  }

  // LGPD: portabilidade, exporta os dados do titular
  const exportData = () => {
    const { senha: _senha, ...dados } = user!
    const payload = {
      usuario: dados,
      empresa: db.companies.find((c) => c.ownerId === user!.id) ?? null,
      dores: db.pains.filter((p) => p.produtorId === user!.id),
      orcamentos: db.quotes.filter((q) => q.produtorId === user!.id),
      avaliacoes: db.reviews.filter((r) => r.produtorId === user!.id),
      exportadoEm: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'meus-dados-agrofab3d.json'
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <>
      <PageHeader title="Minha conta" subtitle="Dados pessoais, segurança e privacidade." />
      <div className="space-y-6">
        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-stone-900"><UserRound className="h-5 w-5 text-campo-700" /> Dados pessoais</h2>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Field label="Nome" htmlFor="a-nome"><Input id="a-nome" value={f.nome} onChange={(e) => setF({ ...f, nome: e.target.value })} /></Field>
            <Field label="E-mail" htmlFor="a-email"><Input id="a-email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
            <Field label="Telefone / WhatsApp" htmlFor="a-tel"><Input id="a-tel" type="tel" value={f.telefone} onChange={(e) => setF({ ...f, telefone: maskPhone(e.target.value) })} /></Field>
            <div className="grid grid-cols-[1fr_90px] gap-3">
              <Field label="Cidade" htmlFor="a-cid"><Input id="a-cid" value={f.cidade} onChange={(e) => setF({ ...f, cidade: e.target.value })} /></Field>
              <Field label="UF" htmlFor="a-uf"><Select id="a-uf" value={f.uf} onChange={(e) => setF({ ...f, uf: e.target.value })}><option value="">-</option>{UFS.map((u) => <option key={u}>{u}</option>)}</Select></Field>
            </div>
            <div className="sm:col-span-2 flex justify-end"><Button type="submit">Salvar</Button></div>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-stone-900"><KeyRound className="h-5 w-5 text-campo-700" /> Alterar senha</h2>
          <form onSubmit={changePw} className="grid gap-4 sm:grid-cols-3" noValidate>
            <Field label="Senha atual" htmlFor="pw-a"><Input id="pw-a" type="password" autoComplete="current-password" value={pw.atual} onChange={(e) => setPw({ ...pw, atual: e.target.value })} /></Field>
            <Field label="Nova senha" htmlFor="pw-n"><Input id="pw-n" type="password" autoComplete="new-password" value={pw.nova} onChange={(e) => setPw({ ...pw, nova: e.target.value })} /></Field>
            <Field label="Confirmar" htmlFor="pw-c"><Input id="pw-c" type="password" autoComplete="new-password" value={pw.conf} onChange={(e) => setPw({ ...pw, conf: e.target.value })} /></Field>
            <div className="sm:col-span-3 flex justify-end"><Button type="submit" variant="outline">Alterar senha</Button></div>
          </form>
        </Card>

        <Card className="p-5">
          <h2 className="mb-2 flex items-center gap-2 font-bold text-stone-900"><ShieldAlert className="h-5 w-5 text-campo-700" /> Privacidade (LGPD)</h2>
          <p className="text-sm text-stone-700">Termos de uso aceitos em <strong>{dateTimeBR(user!.termosAceitosEm)}</strong>.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={exportData}><Download className="h-4 w-4" /> Baixar meus dados</Button>
            <Button variant="danger" onClick={() => setDel(true)}>Excluir minha conta</Button>
          </div>
        </Card>
        <Card className="border-dashed bg-stone-50 p-5">
          <h2 className="font-bold text-stone-900">Protótipo</h2>
          <p className="mt-1 text-sm text-stone-700">Todos os dados desta demonstração ficam salvos apenas no seu navegador. Você pode restaurar os dados de exemplo a qualquer momento.</p>
          <Button variant="ghost" className="mt-3" onClick={() => { actions.resetDemo(); nav('/'); toast('Dados de demonstração restaurados.', 'info') }}>Restaurar dados de demonstração</Button>
        </Card>
      </div>

      <Modal
        open={del}
        onClose={() => setDel(false)}
        title="Excluir conta"
        footer={<><Button variant="outline" onClick={() => setDel(false)}>Cancelar</Button><Button variant="danger" disabled={confirmText !== 'EXCLUIR'} onClick={() => { actions.deleteAccount(); nav('/'); toast('Sua conta foi excluída e seus dados anonimizados.', 'info') }}>Excluir definitivamente</Button></>}
      >
        <div className="space-y-4">
          <Alert tone="error">Seus dados pessoais serão anonimizados, suas dores ativas serão encerradas{user!.tipo === 'empresa' ? ' e as peças da sua empresa serão desativadas' : ''}. Esta ação não pode ser desfeita.</Alert>
          <Field label='Digite "EXCLUIR" para confirmar' htmlFor="del-conf"><Input id="del-conf" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} /></Field>
        </div>
      </Modal>
    </>
  )
}
