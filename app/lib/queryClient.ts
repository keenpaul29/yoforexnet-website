import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const EXPRESS_URL = typeof window !== 'undefined'
    ? (window as any).__EXPRESS_URL__ || process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000'
    : process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000';
  
  const fullUrl = url.startsWith('http') ? url : `${EXPRESS_URL}${url}`;
  
  const res = await fetch(fullUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  baseUrl?: string;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, baseUrl }) =>
  async ({ queryKey }) => {
    const url = baseUrl 
      ? `${baseUrl}${queryKey.join("/")}`
      : queryKey.join("/");
    
    const res = await fetch(url as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Get Express API URL from environment or use default
const EXPRESS_API_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000')
  : (process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:5000');

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw", baseUrl: EXPRESS_API_URL }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
