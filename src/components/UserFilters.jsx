"use client";

export default function UserFilters({
  searchBy,
  searchValue,
  sortType,
  sortOrder,
  onChange,
  onSearch,
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-4">
      <div className="flex items-center gap-2">
        <div>
          <label className="block text-sm text-neutral-400">Search by</label>
          <select
            className="h-10 rounded-md border border-neutral-700 bg-neutral-900/60 px-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700"
            value={searchBy}
            onChange={(e) =>
              onChange({ field: "searchBy", value: e.target.value })
            }
          >
            <option value="">Any</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Query</label>
          <input
            className="h-10 w-64 rounded-md border border-neutral-700 bg-neutral-900/60 px-3 text-sm text-neutral-100 placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-700"
            placeholder="Search value"
            value={searchValue}
            onChange={(e) =>
              onChange({ field: "searchValue", value: e.target.value })
            }
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div>
          <label className="block text-sm text-neutral-400">Sort</label>
          <select
            className="h-10 rounded-md border border-neutral-700 bg-neutral-900/60 px-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700"
            value={sortType}
            onChange={(e) =>
              onChange({ field: "sortType", value: e.target.value })
            }
          >
            <option value="createdAt">Created</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
          </select>
        </div>
        <div>
          <label className="block text-sm text-neutral-400">Order</label>
          <select
            className="h-10 rounded-md border border-neutral-700 bg-neutral-900/60 px-3 text-sm text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-700"
            value={sortOrder}
            onChange={(e) =>
              onChange({ field: "sortOrder", value: e.target.value })
            }
          >
            <option value="desc">Desc</option>
            <option value="asc">Asc</option>
          </select>
        </div>
        <button
          onClick={onSearch}
          className="h-10 rounded-md bg-neutral-100 px-4 text-sm font-medium text-neutral-900 hover:bg-white/90"
        >
          Search
        </button>
      </div>
    </div>
  );
}
