'use client';

export default function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  if (totalPages <= 1) return null;
  const nums = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex flex-wrap justify-center items-center gap-1 mt-10">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1.5 text-[13px] border border-gray-200 text-gray-600 hover:border-navy-900 disabled:opacity-30 disabled:hover:border-gray-200"
      >
        ‹
      </button>
      {nums.map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`px-3 py-1.5 text-[13px] border transition-colors ${
            n === page ? 'bg-navy-900 text-white border-navy-900' : 'border-gray-200 text-gray-600 hover:border-navy-900'
          }`}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page === totalPages}
        className="px-3 py-1.5 text-[13px] border border-gray-200 text-gray-600 hover:border-navy-900 disabled:opacity-30 disabled:hover:border-gray-200"
      >
        ›
      </button>
    </div>
  );
}
