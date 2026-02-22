export default function ProjectsListLoading() {
  return (
    <section className="max-w-5xl mx-auto px-6 lg:px-8 py-16 sm:py-20">
      <div className="animate-pulse">
        <div className="h-3 w-40 bg-muted rounded mb-5" />
        <div className="h-11 w-full bg-muted rounded-xl mb-6" />
        <div className="space-y-4">
          <div className="h-36 bg-muted rounded-xl" />
          <div className="h-36 bg-muted rounded-xl" />
        </div>
      </div>
    </section>
  );
}
