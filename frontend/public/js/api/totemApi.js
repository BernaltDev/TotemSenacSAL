const TotemApi = {
  async getData(date = "") {
    const params = new URLSearchParams();

    if (date) params.set("date", date);

    return fetch(`/api/totem/data?${params.toString()}`).then((response) => response.json());
  },
};
