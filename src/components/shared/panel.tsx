import type { ReactNode } from "react";

interface PanelProps {
  title?: string;
  description?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Panel({
  title,
  description,
  badge,
  actions,
  children,
  className = "",
}: PanelProps) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-card ${className}`}
    >
      {(title || description || badge || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <div>
            {title && (
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
                {badge}
              </div>
            )}
            {description && (
              <p className="mt-1 text-sm text-zinc-500">{description}</p>
            )}
          </div>
          {actions}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
