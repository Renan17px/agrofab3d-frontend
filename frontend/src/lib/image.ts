// RNF-002 — Compressão de imagens no próprio navegador antes do envio:
// converte para WebP e reduz até no máximo ~500 KB, preservando a legibilidade dos detalhes.

const MAX_BYTES = 500 * 1024
const MAX_SIDE = 1600

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Não foi possível ler a imagem.'))
    }
    img.src = url
  })
}

const dataUrlBytes = (d: string) => Math.ceil(((d.length - d.indexOf(',') - 1) * 3) / 4)

export async function compressImage(file: File): Promise<{ dataUrl: string; bytes: number; original: number }> {
  if (!file.type.startsWith('image/')) throw new Error('Envie apenas arquivos de imagem.')
  const img = await loadImage(file)
  let scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height))
  let quality = 0.82
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  let out = ''
  for (let i = 0; i < 8; i++) {
    canvas.width = Math.round(img.width * scale)
    canvas.height = Math.round(img.height * scale)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    out = canvas.toDataURL('image/webp', quality)
    // Safari antigo não gera WebP: cai para JPEG
    if (!out.startsWith('data:image/webp')) out = canvas.toDataURL('image/jpeg', quality)
    if (dataUrlBytes(out) <= MAX_BYTES) break
    if (quality > 0.55) quality -= 0.1
    else scale *= 0.8
  }
  return { dataUrl: out, bytes: dataUrlBytes(out), original: file.size }
}

export const kb = (bytes: number) => `${Math.round(bytes / 1024)} KB`
