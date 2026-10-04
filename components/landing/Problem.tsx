export function Problem() {
  return (
    <section aria-labelledby="problem-heading" className="l-wrap py-24 lg:py-36">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
        <h2 id="problem-heading" className="l-h2 text-fg lg:col-span-7 lg:text-[clamp(2.25rem,1.2rem+2.4vw,3.25rem)]">
          Competitor research is screenshots in a spreadsheet.
        </h2>
        <div className="lg:col-span-4 lg:col-start-9 lg:pt-3">
          <p className="l-copy text-[1.0625rem] leading-[1.6]">
            Someone searches each rival, saves a few ads, skims YouTube, and pastes it into a deck. A week later nobody remembers where a
            number came from, and nobody can check it.
          </p>
          <p className="mt-5 text-[1.0625rem] font-medium leading-[1.6] text-fg">
            Drishti keeps the trail: what was found, where, and when.
          </p>
        </div>
      </div>
    </section>
  );
}
