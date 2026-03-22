type SearchBarProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export default function SearchBar({ value, onChange, placeholder = "Search…" }: SearchBarProps) {
  return (
    <div className="relative">
      {/* Search icon */}
      <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-zinc-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>
      </div>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-zinc-800 bg-zinc-900 py-3.5 pl-11 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700/50"
      />
    </div>
  )
}
