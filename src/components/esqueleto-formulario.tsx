/** Prévia animada do formulário enquanto o documento é lido e montado. */
export function EsqueletoFormulario({ titulo = "Montando seu formulário…" }: { titulo?: string }) {
  return (
    <div
      aria-label={titulo}
      aria-busy="true"
      className="animate-fade-in rounded-2xl border border-border/70 bg-card p-5 shadow-sm sm:p-6"
    >
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{titulo}</p>
      <div className="skeleton-shimmer mt-4 h-4 w-1/2 rounded-md bg-muted" />
      <div className="mx-auto mt-3 h-px w-16 bg-border" />
      {[0, 1].map((s) => (
        <div key={s} className="mt-6 space-y-3" style={{ animationDelay: `${s * 120}ms` }}>
          <div className="skeleton-shimmer h-3 w-32 rounded-md bg-muted" />
          {[0, 1, 2].map((f) => (
            <div key={f} className="flex items-center gap-3">
              <div
                className="skeleton-shimmer h-3 shrink-0 rounded-md bg-muted"
                style={{ width: `${88 + ((s + f) % 3) * 28}px` }}
              />
              <div className="skeleton-shimmer h-3 flex-1 rounded-md bg-muted/70" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
