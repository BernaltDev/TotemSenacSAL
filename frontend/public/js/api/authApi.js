const AuthApi = {
  async login(email, password) {
    return ApiClient.request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  async me() {
    return ApiClient.request("/api/auth/me");
  },

  async logout() {
    return ApiClient.request("/api/auth/logout", {
      method: "POST",
    });
  },
};
