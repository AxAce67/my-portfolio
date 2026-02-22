export default function ProjectDetailLoading() {
  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
      <div className="max-w-3xl mx-auto animate-pulse">
        <div className="h-3 w-36 bg-muted rounded" />
        <div className="mt-7 h-12 w-3/4 bg-muted rounded" />
        <div className="mt-4 h-5 w-full bg-muted rounded" />
        <div className="mt-2 h-5 w-5/6 bg-muted rounded" />
        <div className="mt-6 h-3 w-48 bg-muted rounded" />
      </div>
      <div className="max-w-3xl mx-auto mt-10 h-64 bg-muted rounded-2xl animate-pulse" />
      <div className="max-w-3xl mx-auto mt-8 space-y-3 animate-pulse">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-11/12 bg-muted rounded" />
        <div className="h-4 w-10/12 bg-muted rounded" />
      </div>
    </section>
  );
}
