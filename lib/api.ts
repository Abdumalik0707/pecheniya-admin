/**
 * Wrapper around fetch that redirects to /login when the server
 * returns 401 (expired or missing JWT cookie).
 */
export async function apiFetch(
  url: string,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(url, init);
  if (res.status === 401) {
    // Token expired or missing — force re-login
    localStorage.removeItem("pecheniya_admin");
    window.location.href = "/login";
    // Return a never-resolving promise so the caller doesn't continue
    return new Promise(() => {});
  }
  return res;
}
