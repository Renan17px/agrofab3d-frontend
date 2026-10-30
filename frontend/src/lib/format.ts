export const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const priceLabel = (v: number | null) => (v == null ? 'Sob orçamento' : brl(v))

export const dateBR = (iso: string) => new Date(iso).toLocaleDateString('pt-BR')

export const dateTimeBR = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export function timeAgo(iso: string): string {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'agora'
  const m = s / 60
  if (m < 60) return `há ${Math.floor(m)} min`
  const h = m / 60
  if (h < 24) return `há ${Math.floor(h)} h`
  const d = h / 24
  if (d < 30) return `há ${Math.floor(d)} ${Math.floor(d) === 1 ? 'dia' : 'dias'}`
  const mo = d / 30
  if (mo < 12) return `há ${Math.floor(mo)} ${Math.floor(mo) === 1 ? 'mês' : 'meses'}`
  return `há ${Math.floor(mo / 12)} ano(s)`
}

export function maskCnpj(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  return d
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
}

export function maskPhone(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 10) return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
  return d.replace(/^(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

export const initials = (nome: string) =>
  nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

export const whatsappLink = (num: string, msg: string) => `https://wa.me/${num.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`
