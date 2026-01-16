# Next.js User Management Portal - Copilot Instructions

## Project Overview

This is a **Next.js 14+ App Router** user management portal with a modern, sleek design. The application features authentication and user management capabilities, built without TypeScript to match your existing React project's architecture.

## Architecture Pattern

### Next.js App Router Structure

- Uses **App Router** (not Pages Router) with the `app/` directory
- **Server Components** by default for optimal performance
- **Client Components** (marked with `'use client'`) only when needed for interactivity
- API routes in `app/api/` directory for backend endpoints

### Page Organization

```
app/
├── (auth)/
│   └── login/
│       └── page.js          # Login page
├── (dashboard)/
│   ├── layout.js            # Dashboard layout wrapper
│   └── users/
│       └── page.js          # Users management page
├── api/
│   └── [...routes]/         # API route handlers
└── layout.js                # Root layout
```

## API Integration

### Authentication & Token Management

- **Token Storage**: Use `sessionStorage` (client-side only, session-scoped)
- **Base URL**: Configure via environment variable `NEXT_PUBLIC_API_URI`
- **Auth Pattern**: All API calls include `Authorization: Bearer ${sessionStorage.getItem("token")}`

### API Call Pattern (Match Existing React Project)

**Example: Search Users**

```javascript
// lib/api/users.js
export async function searchUsers(
  searchBy,
  searchValue,
  page,
  sortType,
  sortOrder
) {
  const headers = new Headers();
  headers.append("Authorization", `Bearer ${sessionStorage.getItem("token")}`);

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URI}/admin/users/search-users?` +
      new URLSearchParams({
        searchBy: searchBy,
        searchValue: searchValue,
        page: page,
        sortType: sortType,
        sortOrder: sortOrder,
      }),
    { headers: headers }
  );

  if (response.ok) {
    const data = await response.json();
    return data;
  }
  return null;
}
```

### API Organization

Centralize all API functions in `lib/api/`:

- `lib/api/auth.js` - Login, logout, session validation
- `lib/api/users.js` - User CRUD operations (searchUsers, addUser, updateUser, deleteUser)
- Never use fetch() directly in components - always create API functions

## Input Validation

### Custom Validators (Port from React Project)

Create `lib/utils/validation.js` with:

- `validateInputText()` - Remove dangerous characters, convert to uppercase
- `validateInputTextNoUpperCase()` - Remove dangerous characters, preserve case
- Prevent XSS and SQL injection patterns

**Usage in Server Actions:**

```javascript
"use server";

import { validateInputText } from "@/lib/utils/validation";

export async function createUser(formData) {
  const email = validateInputTextNoUpperCase(formData.get("email"));
  const name = validateInputText(formData.get("name"));

  // Validate → Call API → Return errors or success
  if (!email || !email.includes("@")) {
    return { errors: [{ name: "email", message: "Invalid email address" }] };
  }

  // API call here
}
```

## Data Fetching & Mutations

### Server Actions (Replaces React Router Actions)

```javascript
// app/(dashboard)/users/actions.js
"use server";

export async function updateUser(formData) {
  // 1. Extract & validate form data
  // 2. Call API function
  // 3. Return { errors: [...] } or { success: true }
}
```

### Client-Side Data Fetching

Use React hooks in Client Components:

```javascript
"use client";

import { useEffect, useState } from "react";
import { searchUsers } from "@/lib/api/users";

export default function UsersTable() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    async function loadUsers() {
      const data = await searchUsers("", "", 1, "createdAt", "desc");
      if (data) setUsers(data.users);
    }
    loadUsers();
  }, []);

  // Render table
}
```

## UI/UX Design Patterns

### Modern Design System

- **Styling**: Tailwind CSS (primary choice for modern, sleek design)
- **Component Library**: shadcn/ui components (optional, for consistent UI)
- **Icons**: Lucide React icons
- **Color Scheme**: Dark mode support with `next-themes`

### Layout Structure

```javascript
// app/(dashboard)/layout.js
export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header />
        {children}
      </main>
    </div>
  );
}
```

### Toast Notifications (Replaces ServerMessageToast)

Use `react-hot-toast` or `sonner`:

```javascript
"use client";

import { toast } from "sonner";

function handleSubmit() {
  toast.success("User created successfully");
  toast.error("Failed to create user");
}
```

## Form Handling

### Server Actions with Forms

```javascript
// app/(dashboard)/users/page.js
"use client";

import { useFormState } from "react-dom";
import { createUser } from "./actions";

export default function UsersPage() {
  const [state, formAction] = useFormState(createUser, null);

  return (
    <form action={formAction}>
      <input name="email" />
      {state?.errors?.find((e) => e.name === "email")?.message}
      <button type="submit">Create User</button>
    </form>
  );
}
```

## Error Handling Pattern

### Consistent Error Format

All server actions and API functions return:

```javascript
// Success
{ success: true, data: {...} }

// Validation/API errors
{ errors: [{ name: 'fieldName', message: 'User-friendly message' }] }
```

### Display Errors in Components

```javascript
{
  state?.errors?.map((error) => (
    <div key={error.name} className="text-red-500 text-sm">
      {error.message}
    </div>
  ));
}
```

## Environment Configuration

### .env.local

```env
NEXT_PUBLIC_API_URI=http://localhost:8080/api
```

## Development Workflow

### Commands

- `npm run dev` - Development server (port 3000)
- `npm run build` - Production build
- `npm run start` - Start production server
- `npm run lint` - ESLint validation

### File Organization Rules

1. Server Components in `app/` directory (default)
2. Client Components must have `'use client'` directive
3. API functions in `lib/api/[domain].js`
4. Utilities in `lib/utils/`
5. Shared components in `components/`
6. Server actions in `app/[route]/actions.js`

## Key Dependencies

```json
{
  "next": "^14.0.0",
  "react": "^18.0.0",
  "tailwindcss": "^3.0.0",
  "lucide-react": "latest",
  "sonner": "latest",
  "next-themes": "latest"
}
```

## Security Checklist

- ✅ Validate all inputs with `validateInputText()` before API calls
- ✅ Store tokens in sessionStorage (never localStorage for sensitive data)
- ✅ Use Server Actions for mutations to prevent CSRF
- ✅ Sanitize user input to prevent XSS
- ✅ Always check authentication before protected operations

## When Adding New Features

1. Create API function in `lib/api/[domain].js` matching existing pattern
2. Add server action in `app/[route]/actions.js` if mutation needed
3. Create page component in `app/[route]/page.js`
4. Validate inputs in server action before API call
5. Display errors using error state pattern
6. Add toast notifications for user feedback

---

**Design Philosophy**: Maintain API compatibility with existing React project while leveraging Next.js App Router features for better performance and developer experience. Keep the same authentication flow, validation patterns, and error handling structure.
