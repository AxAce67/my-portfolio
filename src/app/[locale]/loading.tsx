export default function LocaleLoading() {
  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
      <div className="animate-pulse space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="h-10 w-36 rounded-full bg-muted/80" />
          <div className="h-8 w-24 rounded-full bg-muted/70" />
        </div>
        <div className="h-6 w-28 rounded-full bg-muted/70" />
        <div className="space-y-4">
          <div className="h-24 rounded-3xl bg-muted/70" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-40 rounded-2xl bg-muted/70" />
            <div className="h-40 rounded-2xl bg-muted/60" />
          </div>
          <div className="h-52 rounded-[2rem] bg-muted/55" />
        </div>
      </div>
    </section>
  );
}
