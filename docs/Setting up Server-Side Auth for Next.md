# **Supabase Server‑Side Authentication in Next.js**

## **Pre‑Answer Analysis**

The request aims to produce a **step‑by‑step document** explaining how to set up server‑side authentication in a Next.js application using Supabase. The description asks for code snippets and includes a link to the Supabase documentation. The Supabase guide covers both **App Router** and **Pages Router** strategies. It assumes you have a Next.js project and a Supabase project with authentication enabled. If the project uses email confirmation, there is an extra step to customise the confirmation URL. The guide also assumes that the application uses **React Server Components** (available in Next.js ≥ 13). No version was provided, so it’s reasonable to assume the current Next.js/App Router approach.

Potential ambiguities include whether the user is using the App Router or the older Pages Router (the guide supports both), whether they need social logins or custom user tables, and whether email confirmation is enabled. These details influence the middleware and route handlers. For clarity, the instructions below follow the **App Router** approach, which Supabase currently recommends. If you need the Pages Router or additional auth flows (OAuth, magic links, etc.), consult the relevant Supabase guides.

## **1 Install Supabase packages**

Supabase server‑side authentication relies on two packages:

* `@supabase/supabase-js` – the core JavaScript client.

* `@supabase/ssr` – a helper that configures Supabase clients to work with cookies during server‑side rendering.

Install both packages via your package manager. For example using npm:

bash

CopyEdit

`npm install @supabase/supabase-js @supabase/ssr`

The `@supabase/ssr` package is necessary because normal Supabase clients do not automatically store sessions in cookies. The Supabase documentation notes that both the browser and server clients must be configured correctly[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=Next,both%20in%20the%20same%20application) and the Supalaunch guide also illustrates this installation step[supalaunch.com](https://supalaunch.com/blog/nextjs-middleware-supabase-auth#:~:text=Let%27s%20create%20utility%20functions%20for,both).

## **2 Configure environment variables**

Next.js exposes environment variables prefixed with `NEXT_PUBLIC_` to both the server and client. Create a `.env.local` file in your project root and add your project credentials:

env

CopyEdit

`NEXT_PUBLIC_SUPABASE_URL=<your_supabase_project_url>`

`NEXT_PUBLIC_SUPABASE_ANON_KEY=<your_supabase_anon_key>`

The guide stresses that these variables need to be set so that the helper functions can connect to your Supabase instance[supalaunch.com](https://supalaunch.com/blog/nextjs-middleware-supabase-auth#:~:text=Let%27s%20create%20utility%20functions%20for,both). You can find your project URL and anon key in the Supabase dashboard under *Project Settings → API*.

## **3 Create Supabase client utilities**

Supabase requires two different clients: one for client‑side code running in the browser and another for server‑side code (server components, route handlers and middleware).

### **3.1 Browser client (`utils/supabase/client.ts`)**

Create a file `utils/supabase/client.ts` and export a function that returns a browser client. The Supabase SSR helper provides `createBrowserClient`, which automatically stores and retrieves the user session from the browser’s cookies. A minimal utility function looks like this:

ts

CopyEdit

`// utils/supabase/client.ts`

`import { createBrowserClient } from '@supabase/ssr'`

`export function createClient() {`

  `return createBrowserClient(`

    `process.env.NEXT_PUBLIC_SUPABASE_URL!,`

    `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!`

  `)`

`}`

This example mirrors the snippet in Supabase’s guide[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=6) and in the Supalaunch article[supalaunch.com](https://supalaunch.com/blog/nextjs-middleware-supabase-auth#:~:text=Let%27s%20create%20utility%20functions%20for,both). The `!` after each environment variable tells TypeScript that the variables are defined. If you prefer stronger type safety, replace the `!` with runtime checks.

### **3.2 Server client (`utils/supabase/server.ts`)**

Server components and API routes cannot read or set cookies by default. The `createServerClient` helper in `@supabase/ssr` allows you to pass cookie handlers so that Supabase can persist sessions server‑side. Below is a typical implementation using Next.js `cookies` from `next/headers`:

ts

CopyEdit

`// utils/supabase/server.ts`

`import { cookies } from 'next/headers'`

`import { createServerClient, type CookieOptions } from '@supabase/ssr'`

`export function createClient() {`

  `const cookieStore = cookies()`

  `return createServerClient(`

    `process.env.NEXT_PUBLIC_SUPABASE_URL!,`

    `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,`

    `{`

      `cookies: {`

        `get(name: string) {`

          `return cookieStore.get(name)?.value`

        `},`

        `set(name: string, value: string, options: CookieOptions) {`

          `cookieStore.set({ name, value, ...options })`

        `},`

        `remove(name: string, options: CookieOptions) {`

          `// Delete by setting an empty value`

          `cookieStore.set({ name, value: '', ...options })`

        `},`

      `},`

    `}`

  `)`

`}`

This pattern follows the examples in community guides[supalaunch.com](https://supalaunch.com/blog/nextjs-middleware-supabase-auth#:~:text=Let%27s%20create%20utility%20functions%20for,both). It ensures that the Supabase client can read an existing session from cookies and persist any refreshed sessions back into cookies. The `CookieOptions` type allows you to set `httpOnly`, `secure`, `sameSite` and `maxAge` options when writing cookies.

## **4 Create middleware to refresh sessions**

Server components cannot write cookies, so you need middleware to refresh expired authentication tokens and store them. The middleware runs on every request that might need Supabase access and ensures that both server components and the browser have valid tokens. Supabase’s guide emphasises that the middleware should call `supabase.auth.getUser()` rather than `getSession()`, because `getUser()` always revalidates the token[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=Be%20careful%20when%20protecting%20pages,can%20be%20spoofed%20by%20anyone).

Create a `middleware.ts` file (or `src/middleware.ts` if you use a `src` folder) with the following implementation:

ts

CopyEdit

`// middleware.ts`

`import { NextResponse } from 'next/server'`

`import type { NextRequest } from 'next/server'`

`import { createClient } from '@/utils/supabase/middleware' // adjust path accordingly`

`export async function middleware(request: NextRequest) {`

  `try {`

    `const response = NextResponse.next()`

    `// Initialise Supabase client for middleware`

    `const supabase = createClient()`

    `// Refresh the session; getSession() may return null if tokens expired`

    `const { data: { session }, error } = await supabase.auth.getSession()`

    `// Define protected routes (customise as needed)`

    `const protectedRoutes = ['/private', '/dashboard']`

    `const isProtectedRoute = protectedRoutes.some(route =>`

      `request.nextUrl.pathname.startsWith(route)`

    `)`

    `// If accessing a protected route without a session, redirect to login`

    `if (isProtectedRoute && !session) {`

      `return NextResponse.redirect(new URL('/login', request.url))`

    `}`

    `return response`

  `} catch (e) {`

    `// On error, allow request to continue`

    `return NextResponse.next()`

  `}`

`}`

`// Configure which routes run through this middleware`

`export const config = {`

  `matcher: [`

    `// Match all request paths except static files and images`

    `'/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',`

  `],`

`}`

This example is adapted from the Supalaunch guide[supalaunch.com](https://supalaunch.com/blog/nextjs-middleware-supabase-auth#:~:text=import%20,from%20%27%40%2Futils%2Fsupabase%2Fmiddleware), which highlights how the middleware refreshes sessions and protects routes. Adjust `protectedRoutes` to fit your application. Avoid performing heavy logic in middleware; its primary purpose is to refresh tokens and enforce access control.

**Why use `getUser()` in protected pages?** Middleware may still rely on stale cookies (because cookies can be spoofed). For sensitive operations, call `supabase.auth.getUser()` in your server components to fetch the verified user from Supabase’s auth server[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=Be%20careful%20when%20protecting%20pages,can%20be%20spoofed%20by%20anyone). Never trust `supabase.auth.getSession()` alone for server‑side security[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=Never%20trust%20,to%20revalidate%20the%20Auth%20token).

## **5 Add login and signup pages**

Next.js Server Actions allow you to run form submissions on the server. A simple login page uses a form that calls server actions for login and signup. Supabase’s guide provides a minimal example[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=Create%20a%20login%20page%20for,call%20the%20Supabase%20signup%20function):

ts

CopyEdit

`// app/login/page.tsx`

`import { login, signup } from './actions'`

`export default function LoginPage() {`

  `return (`

    `<form>`

      `<label htmlFor="email">Email:</label>`

      `<input id="email" name="email" type="email" required />`

      `<label htmlFor="password">Password:</label>`

      `<input id="password" name="password" type="password" required />`

      `<button formAction={login}>Log in</button>`

      `<button formAction={signup}>Sign up</button>`

    `</form>`

  `)`

`}`

The `login` and `signup` functions live in `app/login/actions.ts`. They use the server client created in `utils/supabase/server.ts` to call Supabase auth APIs. For example:

ts

CopyEdit

`// app/login/actions.ts`

`'use server'`

`import { createClient } from '@/utils/supabase/server'`

`import { redirect } from 'next/navigation'`

`export async function login(formData: FormData) {`

  `const supabase = await createClient()`

  `const email = formData.get('email') as string`

  `const password = formData.get('password') as string`

  `const { error } = await supabase.auth.signInWithPassword({ email, password })`

  `if (!error) redirect('/private')`

  `// handle error (e.g., show error message)`

`}`

`export async function signup(formData: FormData) {`

  `const supabase = await createClient()`

  `const email = formData.get('email') as string`

  `const password = formData.get('password') as string`

  `const { error } = await supabase.auth.signUp({ email, password })`

  `if (!error) redirect('/private')`

  `// handle error`

`}`

Note that calling `cookies()` before `supabase.auth` opts out of Next.js caching[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=Note%20that%20,only%20to%20their%20own%20data), ensuring authenticated responses are not inadvertently cached. Always set `use server` in Server Action files.

## **6 Change the email confirmation path (optional)**

By default, Supabase’s email confirmation link points to `auth/v1/verify`, which may not integrate with server‑side flows. If email confirmation is enabled, customise the *Confirm signup* email template in the Supabase dashboard so that the link redirects to your Next.js route handler. The Supabase guide instructs changing `{{ .ConfirmationURL }}` to a custom URL[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=Change%20the%20Auth%20confirmation%20path):

bash

CopyEdit

`{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email`

This ensures the browser returns to your application after the user clicks the confirmation link. The `token_hash` and `type` query parameters are required to verify the OTP on your server.

## **7 Create a route handler for auth confirmation**

When the user clicks the confirmation link, your application needs to exchange the token for a session. Create a route handler at `app/auth/confirm/route.ts` (Next.js App Router) that uses the server client to verify the OTP:

ts

CopyEdit

`// app/auth/confirm/route.ts`

`import { type EmailOtpType } from '@supabase/supabase-js'`

`import { type NextRequest } from 'next/server'`

`import { createClient } from '@/utils/supabase/server'`

`import { redirect } from 'next/navigation'`

`export async function GET(request: NextRequest) {`

  `const { searchParams } = new URL(request.url)`

  `const token_hash = searchParams.get('token_hash')`

  `const type = searchParams.get('type') as EmailOtpType | null`

  `const next = searchParams.get('next') ?? '/'`

  `if (token_hash && type) {`

    `const supabase = await createClient()`

    `const { error } = await supabase.auth.verifyOtp({ type, token_hash })`

    `if (!error) {`

      `// redirect user to specified redirect URL or root of app`

      `redirect(next)`

    `}`

  `}`

  `// redirect the user to an error page with some instructions`

  `redirect('/error')`

`}`

This code follows the pattern from the Supabase guide[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=25). After successful verification, it redirects the user to the `next` query parameter or your default page. You can customise the error handling to show a friendly message on failure.

## **8 Protect server‑side pages and access user information**

With middleware running, server components can trust that cookies contain a valid access token; however, they should still verify the session on the server. To protect a page, call `supabase.auth.getUser()` inside the server component and redirect unauthenticated users. Supabase emphasises that `getUser()` always revalidates the token and therefore is safe to trust[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=Be%20careful%20when%20protecting%20pages,can%20be%20spoofed%20by%20anyone). Here is a minimal private page:

ts

CopyEdit

`// app/private/page.tsx`

`import { redirect } from 'next/navigation'`

`import { createClient } from '@/utils/supabase/server'`

`export default async function PrivatePage() {`

  `const supabase = await createClient()`

  `const { data, error } = await supabase.auth.getUser()`

  `if (error || !data?.user) {`

    `redirect('/login')`

  `}`

  `return <p>Hello {data.user.email}</p>`

`}`

This matches the example in the guide[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=import%20,p). Because `getUser()` revalidates the session, it will redirect users whose tokens have expired or been revoked.

## **9 Security considerations and best practices**

Supabase and community guides outline several important security practices:

1. **Always verify sessions server‑side.** Never rely solely on client‑side state to decide whether a user is authenticated[supalaunch.com](https://supalaunch.com/blog/nextjs-middleware-supabase-auth#:~:text=Important%20Security%20Considerations). Using `supabase.auth.getUser()` in server components ensures the session is validated against Supabase’s auth server[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=Be%20careful%20when%20protecting%20pages,can%20be%20spoofed%20by%20anyone).

2. **Prefer `getUser()` over `getSession()`** for security. `getSession()` reads the session from cookies and may be spoofed; `getUser()` sends a request to Supabase to validate the token[supalaunch.com](https://supalaunch.com/blog/nextjs-middleware-supabase-auth#:~:text=2.%20Use%20,getSession).

3. **Handle token refresh in middleware.** Middleware should call `getSession()` or `getUser()` and update cookies when necessary[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=Since%20Server%20Components%20can%27t%20write,Auth%20tokens%20and%20store%20them). Without this, server components cannot write cookies and expired tokens will remain until the user refreshes manually.

4. **Secure cookie handling.** When setting cookies in middleware, use `httpOnly`, `secure`, `sameSite`, and `maxAge` options to mitigate cross‑site attacks[supalaunch.com](https://supalaunch.com/blog/nextjs-middleware-supabase-auth#:~:text=4,cookies%20for%20storing%20session%20data).

5. **Route‑level access control.** Maintain a list of protected routes and redirect unauthenticated users to the login page. This logic may live in middleware or in individual route handlers[supalaunch.com](https://supalaunch.com/blog/nextjs-middleware-supabase-auth#:~:text=const%20protectedRoutes%20%3D%20,request.nextUrl.pathname.startsWith%28route%29).

6. **Test thoroughly.** Supalaunch suggests testing scenarios such as accessing protected routes without authentication, logging in, session persistence, token refresh, and logout[supalaunch.com](https://supalaunch.com/blog/nextjs-middleware-supabase-auth#:~:text=Testing%20the%20Authentication%20Flow).

## **Pros and cons of server‑side authentication with Supabase**

| Aspect | Pros | Cons |
| ----- | ----- | ----- |
| **Performance and SEO** | Server‑side rendering reduces time to first byte and improves search engine optimisation, since pages are pre‑rendered on the server. | Extra server load; slower page transitions compared with client‑side rendering. |
| **Security** | Sessions are validated on the server, reducing the risk of token spoofing. Using `getUser()` ensures tokens are revalidated[supabase.com](https://supabase.com/docs/guides/auth/server-side/nextjs#:~:text=Be%20careful%20when%20protecting%20pages,can%20be%20spoofed%20by%20anyone). | Requires careful handling of cookies and environment variables; misconfiguration can expose tokens. |
| **User experience** | Middleware can redirect users based on auth status before rendering the page, producing smoother navigation[supalaunch.com](https://supalaunch.com/blog/nextjs-middleware-supabase-auth#:~:text=const%20protectedRoutes%20%3D%20,request.nextUrl.pathname.startsWith%28route%29). | Complexity increases with more routes and custom flows (e.g., social logins). Middleware runs on every matched request, so heavy logic can slow responses. |
| **Scalability** | Supabase scales automatically; server components can be deployed on edge functions (Vercel/Netlify) for low latency. | SSR may require edge runtime support; not all hosting providers support server middleware. |
| **Development complexity** | Single source of truth for auth; easier to protect pages and API routes. | Requires understanding of Next.js Server Components, Server Actions, and middleware; beginners may find the setup complex. |

## **Conclusion**

Setting up Supabase server‑side authentication in Next.js involves installing the correct packages, configuring environment variables, creating browser and server clients, adding middleware to refresh sessions, and protecting routes on the server. While the initial setup adds complexity, the resulting architecture provides secure, scalable and performant authentication. Always verify sessions on the server and handle cookies securely. With this foundation, you can extend your auth system to support OAuth providers, multi‑factor authentication and custom roles.

