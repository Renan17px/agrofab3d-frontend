import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Link, type LinkProps } from 'react-router-dom'
import { CheckCircle2, Info, Star, X, XCircle } from 'lucide-react'

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')

// ---------- Botões ----------
type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'sun' | 'onDark'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-campo-700 text-white hover:bg-campo-800 focus-visible:ring-campo-500 shadow-sm',
  secondary: 'bg-campo-100 text-campo-900 hover:bg-campo-200 focus-visible:ring-campo-500',
  outline: 'border border-stone-300 bg-white text-stone-800 hover:bg-stone-50 focus-visible:ring-campo-500',
  ghost: 'text-stone-700 hover:bg-stone-100 focus-visible:ring-campo-500',
  danger: 'bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-500',
  sun: 'bg-sol-400 text-stone-900 hover:bg-sol-300 focus-visible:ring-sol-500 shadow-sm',
  onDark: 'border border-white/50 bg-transparent text-white hover:bg-white/10 focus-visible:ring-white',
}
const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm gap-1.5',
  md: 'h-11 px-4 text-[15px] gap-2',
  lg: 'h-12 px-6 text-base gap-2',
}
const btnBase =
  'inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap'

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }>(
  ({ variant = 'primary', size = 'md', className, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cx(btnBase, variants[variant], sizes[size], className)} {...props} />
  ),
)
Button.displayName = 'Button'

export function LinkButton({ variant = 'primary', size = 'md', className, ...props }: LinkProps & { variant?: Variant; size?: Size }) {
  return <Link className={cx(btnBase, variants[variant], sizes[size], className)} {...props} />
}

// ---------- Superfícies ----------
export function Card({ className, children, ...rest }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cx('rounded-2xl border border-stone-200 bg-white shadow-sm', className)} {...rest}>
      {children}
    </div>
  )
}

type Tone = 'green' | 'amber' | 'red' | 'gray' | 'blue' | 'earth'
const tones: Record<Tone, string> = {
  green: 'bg-campo-100 text-campo-800 ring-campo-200',
  amber: 'bg-amber-100 text-amber-900 ring-amber-200',
  red: 'bg-red-100 text-red-800 ring-red-200',
  gray: 'bg-stone-100 text-stone-700 ring-stone-200',
  blue: 'bg-sky-100 text-sky-900 ring-sky-200',
  earth: 'bg-terra-100 text-terra-800 ring-terra-200',
}
export function Badge({ tone = 'gray', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset', tones[tone], className)}>{children}</span>
}

// ---------- Formulários ----------
export function Field({ label, hint, error, required, children, htmlFor }: { label: string; hint?: string; error?: string; required?: boolean; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-stone-800">
        {label} {required && <span className="text-red-700" aria-hidden>*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-stone-600">{hint}</p>}
      {error && <p className="text-xs font-medium text-red-700">{error}</p>}
    </div>
  )
}

const inputBase =
  'w-full rounded-xl border border-stone-300 bg-white px-3.5 text-[15px] text-stone-900 placeholder:text-stone-500 focus:border-campo-600 focus:outline-none focus:ring-2 focus:ring-campo-200 disabled:bg-stone-100'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className, ...p }, ref) => (
  <input ref={ref} className={cx(inputBase, 'h-11', className)} {...p} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...p }, ref) => (
  <textarea ref={ref} className={cx(inputBase, 'min-h-[110px] py-2.5', className)} {...p} />
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className, children, ...p }, ref) => (
  <select ref={ref} className={cx(inputBase, 'h-11 pr-8', className)} {...p}>
    {children}
  </select>
))
Select.displayName = 'Select'

export function Checkbox({ label, checked, onChange, description }: { label: ReactNode; checked: boolean; onChange: (v: boolean) => void; description?: string }) {
  const id = useId()
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start gap-3">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded border-stone-400 accent-campo-700" />
      <span className="text-sm text-stone-800">
        {label}
        {description && <span className="block text-xs text-stone-600">{description}</span>}
      </span>
    </label>
  )
}

/** Grupo de "chips" selecionáveis (múltipla escolha) */
export function ChipGroup<T extends string>({ options, value, onChange, single }: { options: { id: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; single?: boolean }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const on = value.includes(o.id)
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(single ? [o.id] : on ? value.filter((v) => v !== o.id) : [...value, o.id])}
            className={cx(
              'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-campo-500',
              on ? 'border-campo-700 bg-campo-700 text-white' : 'border-stone-300 bg-white text-stone-800 hover:border-campo-500',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------- Modal ----------
export function Modal({ open, onClose, title, children, footer, size = 'md' }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; size?: 'md' | 'lg' }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-stone-900/50" onClick={onClose} />
      <div className={cx('relative flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl', size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-lg')}>
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <h2 className="text-lg font-bold text-stone-900">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-stone-600 hover:bg-stone-100" aria-label="Fechar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-stone-200 px-5 py-3">{footer}</div>}
      </div>
    </div>
  )
}

// ---------- Diversos ----------
export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-12 text-center">
      {icon && <div className="mb-3 text-campo-600">{icon}</div>}
      <h3 className="text-base font-bold text-stone-900">{title}</h3>
      {children && <div className="mt-1 max-w-md text-sm text-stone-600">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function Stars({ value, size = 16, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={cx('inline-flex items-center', className)} aria-label={`${value.toFixed(1)} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? 'fill-sol-400 text-sol-500' : 'fill-stone-200 text-stone-300'} aria-hidden />
      ))}
    </span>
  )
}

export function StarInput({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm font-semibold text-stone-800">{label}</span>
      <div className="flex" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} estrela${i > 1 ? 's' : ''}`} onClick={() => onChange(i)} className="p-1">
            <Star className={cx('h-7 w-7', i <= value ? 'fill-sol-400 text-sol-500' : 'fill-stone-100 text-stone-400')} />
          </button>
        ))}
      </div>
    </div>
  )
}

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto border-b border-stone-200 px-1" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          aria-selected={value === t.id}
          onClick={() => onChange(t.id)}
          className={cx(
            '-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors',
            value === t.id ? 'border-campo-700 text-campo-800' : 'border-transparent text-stone-600 hover:text-stone-900',
          )}
        >
          {t.label}
          {t.count != null && <span className="ml-1.5 rounded-full bg-stone-100 px-1.5 py-0.5 text-xs text-stone-700">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function PageHeader({ title, subtitle, actions, back }: { title: string; subtitle?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="mb-6">
      {back}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-stone-600">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function Avatar({ name, color = '#245933', size = 40 }: { name: string; color?: string; size?: number }) {
  const ini = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-xl font-bold text-white" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }} aria-hidden>
      {ini}
    </span>
  )
}

export function Stat({ label, value, icon, hint }: { label: string; value: ReactNode; icon?: ReactNode; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-stone-600">{label}</span>
        {icon && <span className="text-campo-600">{icon}</span>}
      </div>
      <div className="mt-1 text-2xl font-extrabold text-stone-900">{value}</div>
      {hint && <div className="text-xs text-stone-600">{hint}</div>}
    </Card>
  )
}

export function Alert({ tone = 'info', title, children, action }: { tone?: 'info' | 'warn' | 'error' | 'success'; title?: string; children?: ReactNode; action?: ReactNode }) {
  const styles = {
    info: 'border-sky-200 bg-sky-50 text-sky-950',
    warn: 'border-amber-300 bg-amber-50 text-amber-950',
    error: 'border-red-200 bg-red-50 text-red-950',
    success: 'border-campo-200 bg-campo-50 text-campo-950',
  }[tone]
  return (
    <div className={cx('flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between', styles)} role={tone === 'error' ? 'alert' : 'status'}>
      <div className="text-sm">
        {title && <div className="font-bold">{title}</div>}
        {children}
      </div>
      {action}
    </div>
  )
}

// ---------- Toasts ----------
type ToastT = { id: number; text: string; tone: 'success' | 'error' | 'info' }
const ToastCtx = createContext<(text: string, tone?: ToastT['tone']) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastT[]>([])
  const push = useCallback((text: string, tone: ToastT['tone'] = 'success') => {
    const id = Date.now() + Math.random()
    setItems((s) => [...s, { id, text, tone }])
    setTimeout(() => setItems((s) => s.filter((t) => t.id !== id)), 4200)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className="pointer-events-auto flex max-w-md items-start gap-2 rounded-xl bg-stone-900 px-4 py-3 text-sm text-white shadow-lg">
            {t.tone === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-campo-300" />}
            {t.tone === 'error' && <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />}
            {t.tone === 'info' && <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
