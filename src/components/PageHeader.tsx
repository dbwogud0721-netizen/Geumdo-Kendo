interface PageHeaderProps {
  label: string;
  title: string;
  description?: string;
}

export default function PageHeader({ label, title, description }: PageHeaderProps) {
  return (
    <div className="bg-navy-900 pt-16">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gold-400">
          {label}
        </p>
        <h1 className="text-2xl font-bold text-white">{title}</h1>
        {description && (
          <p className="mt-3 text-sm text-gray-400">{description}</p>
        )}
      </div>
    </div>
  );
}