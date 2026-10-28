export function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 sm:px-5 py-5 border-b border-rule">
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h2 className="text-[15px] font-extrabold">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

export const fieldClass =
  'w-full bg-paper border border-rule rounded-[2px] px-3 py-2 text-[15px] text-ink placeholder:text-ink-3 hover:border-ink-3 focus:border-water focus:outline-none focus:ring-1 focus:ring-water';
