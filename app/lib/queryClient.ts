import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getApiBaseUrl, buildApiUrl } from "./api-config";

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
  // Use centralized API config (no hardcoded URLs)
  const fullUrl = url.startsWith('http') ? url : buildApiUrl(url);
  
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

// Use centralized API config (no hardcoded URLs)
const EXPRESS_API_URL = getApiBaseUrl();

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
