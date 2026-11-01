import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowUpRight, ArrowDownRight, X, MoveUpRight } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
export function Panel({
  title,
  eyebrow,
  subtitle,
  action,
  children,
  className = '',
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-head">
        <div>
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h3>{title}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
export function Kpi({
  label,
  value,
  unit,
  change,
  positive = true,
  spark,
  caption,
}: {
  label: string;
  value: string;
  unit?: string;
  change?: string;
  positive?: boolean;
  spark?: number[];
  caption?: string;
}) {
  return (
    <article className="kpi">
      <div className="kpi-label">
        {label}
        <MoveUpRight size={14} />
      </div>
      <div className="kpi-value">
        {value}
        <small>{unit}</small>
      </div>
      <div className="kpi-bottom">
        <span className={positive ? 'up' : 'down'}>
          {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {change}
        </span>
        <span>{caption || '前年同期比'}</span>
      </div>
      {spark && (
        <div className="spark" aria-hidden="true">
          <ResponsiveContainer width="100%" height={38}>
            <LineChart data={spark.map((v) => ({ v }))}>
              <Line
                dataKey="v"
                stroke="var(--accent)"
                strokeWidth={1.6}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </article>
  );
}
export function Modal({
  title,
  onClose,
  children,
  wide = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const bodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') {
        const list = ref.current?.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex="0"]',
        );
        if (list?.length) {
          const first = list[0],
            last = list[list.length - 1];
          if (
            e.shiftKey &&
            (document.activeElement === first || document.activeElement === ref.current)
          ) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => {
      document.body.style.overflow = bodyOverflow;
      document.removeEventListener('keydown', handler);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? 'wide' : ''}`}
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="閉じる">
            <X size={20} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}
export function Tip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ name?: string; value?: number | string; color?: string }>;
  label?: string | number;
}) {
  return active && payload?.length ? (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((p, i) => (
        <p key={i}>
          <i style={{ background: p.color }} />
          {p.name}
          <b>
            {typeof p.value === 'number'
              ? new Intl.NumberFormat('ja-JP', { maximumFractionDigits: 1 }).format(p.value)
              : p.value}
          </b>
        </p>
      ))}
    </div>
  ) : null;
}
export const chartColors = ['var(--accent)', '#95b8b0', '#c9b88c', '#96a4bd'];
export function download(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
