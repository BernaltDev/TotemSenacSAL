const ApiClient = (() => {
  const tokenKey = "totem_escolar_token";

  function getToken() {
    return localStorage.getItem(tokenKey);
  }

  function setToken(token) {
    localStorage.setItem(tokenKey, token);
  }

  function clearToken() {
    localStorage.removeItem(tokenKey);
  }

  function getHeaders(extraHeaders = {}) {
    const headers = {
      ...extraHeaders,
    };

    const token = getToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  }

  async function request(url, options = {}) {
    const isFormData = options.body instanceof FormData;

    const response = await fetch(url, {
      ...options,
      headers: getHeaders({
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...(options.headers || {}),
      }),
    });

    const contentType = response.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      const message = typeof data === "object" && data.message
        ? data.message
        : "Erro ao processar a solicitação.";

      throw new Error(message);
    }

    return data;
  }

  return {
    getToken,
    setToken,
    clearToken,
    request,
  };
})();
