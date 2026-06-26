const DashboardApi = {
  async getSchedules(date, period = "") {
    const params = new URLSearchParams();

    if (date) params.set("date", date);
    if (period) params.set("period", period);

    return ApiClient.request(`/api/schedules?${params.toString()}`);
  },

  async importSpreadsheet(formData) {
    return ApiClient.request("/api/schedules/import", {
      method: "POST",
      body: formData,
    });
  },

  async updateSchedule(id, payload) {
    return ApiClient.request(`/api/schedules/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteSchedule(id) {
    return ApiClient.request(`/api/schedules/${id}`, {
      method: "DELETE",
    });
  },

  async resetStatuses(date) {
    return ApiClient.request("/api/schedules/actions/reset-statuses", {
      method: "POST",
      body: JSON.stringify({ date }),
    });
  },

  async getContent(type) {
    return ApiClient.request(`/api/content/${type}`);
  },

  async createContent(type, payload) {
    return ApiClient.request(`/api/content/${type}`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateContent(type, id, payload) {
    return ApiClient.request(`/api/content/${type}/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteContent(type, id) {
    return ApiClient.request(`/api/content/${type}/${id}`, {
      method: "DELETE",
    });
  },

  async getMedia() {
    return ApiClient.request("/api/media");
  },

  async createMedia(formData) {
    return ApiClient.request("/api/media", {
      method: "POST",
      body: formData,
    });
  },

  async updateMedia(id, payload) {
    return ApiClient.request(`/api/media/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteMedia(id) {
    return ApiClient.request(`/api/media/${id}`, {
      method: "DELETE",
    });
  },

  async getSettings() {
    return ApiClient.request("/api/settings");
  },

  async updateSettings(payload) {
    return ApiClient.request("/api/settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async uploadSchoolMap(formData) {
    return ApiClient.request("/api/settings/school-map", {
      method: "POST",
      body: formData,
    });
  },

  async getTeacherQrCode() {
    return ApiClient.request("/api/settings/teacher-qr");
  },
};
