"use client";

import { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "../../src/components/ProtectedRoute";
import UserFilters from "../../src/components/UserFilters";
import UserTable from "../../src/components/UserTable";
import Pagination from "../../src/components/Pagination";
import { searchUsers } from "../../src/api/administration/usersApi";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Controls
  const [searchBy, setSearchBy] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [sortType, setSortType] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    let ignore = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const data = await searchUsers(
          searchBy,
          searchValue,
          page,
          sortType,
          sortOrder
        );
        if (!ignore) {
          const list = data?.users || data?.content || data?.items || [];
          const pages = data?.totalPages || data?.pages || 1;
          setUsers(Array.isArray(list) ? list : []);
          setTotalPages(pages > 0 ? pages : 1);
        }
      } catch (e) {
        if (!ignore) setError("Failed to fetch users.");
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [searchBy, searchValue, page, sortType, sortOrder]);

  const handleFilterChange = ({ field, value }) => {
    if (field === "searchBy") setSearchBy(value);
    if (field === "searchValue") setSearchValue(value);
    if (field === "sortType") setSortType(value);
    if (field === "sortOrder") setSortOrder(value);
  };

  const handleSearch = () => {
    setPage(1);
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <h1 className="mb-4 text-2xl font-semibold text-neutral-100">Users</h1>
        {error && (
          <div className="mb-4 rounded-md border border-red-800/60 bg-red-900/20 px-3 py-2 text-sm text-red-300">
            {error}
          </div>
        )}
        <UserFilters
          searchBy={searchBy}
          searchValue={searchValue}
          sortType={sortType}
          sortOrder={sortOrder}
          onChange={handleFilterChange}
          onSearch={handleSearch}
        />
        <UserTable users={users} loading={loading} />
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>
    </ProtectedRoute>
  );
}
