const techTags = [
  {
    name: "React",
    bgClass: "bg-violet-100",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
      </svg>
    ),
  },
  {
    name: "Node.js",
    bgClass: "bg-green-100",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#22c55e">
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
  },
  {
    name: "Design",
    bgClass: "bg-orange-100",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l2 4 4 .5-3 3.5 1 4-3.5-2-3.5 2-1-4-3-3.5 4-.5z" />
      </svg>
    ),
  },
  {
    name: "Python",
    bgClass: "bg-amber-100",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2c-2 0-4 2-4 4v2h8V6c0-2-2-4-4-4z" />
        <path d="M4 8v10c0 2 2 4 4 4h8c2 0 4-2 4-4V8H4z" />
      </svg>
    ),
  },
  {
    name: "Flutter",
    bgClass: "bg-gray-100",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
      </svg>
    ),
  },
];

export default function Hero() {
  return (
    <section className="flex flex-col items-center px-6 md:px-12 lg:px-24">
      <h1 className="max-w-3xl text-center text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl">
        Find your perfect side{" "}
        <span className="text-[#2563EB]">project partner</span>
      </h1>
      <p className="mt-6 max-w-2xl text-center text-lg text-gray-500">
        Connect with developers and designers who share your passion. Build,
        learn, and grow together on projects that matter.
      </p>
      <div className="mt-10 flex w-full max-w-2xl items-center gap-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-1 items-center gap-2 px-4 py-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Search projects by tech stack, role, or keyword..."
            className="flex-1 bg-transparent text-gray-900 placeholder:text-gray-400 focus:outline-none"
          />
        </div>
        <button
          type="button"
          className="rounded-r-xl bg-[#2563EB] px-6 py-3 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
        >
          Search
        </button>
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {techTags.map((tag) => (
          <button
            key={tag.name}
            type="button"
            className={`flex items-center gap-2 rounded-full ${tag.bgClass} px-4 py-2 text-sm font-medium text-gray-800 transition-colors hover:opacity-90`}
          >
            {tag.icon}
            {tag.name}
          </button>
        ))}
      </div>
    </section>
  );
}
