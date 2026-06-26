const KeyPickupApi = {
  async getCurrentClasses(period = "") {
    const params = new URLSearchParams();

    if (period) params.set("period", period);

    const response = await fetch(`/api/key-pickup/current?${params.toString()}`);

    if (!response.ok) {
      throw new Error("Não foi possível carregar as aulas do período.");
    }

    return response.json();
  },

  async confirm(scheduleId) {
    const response = await fetch(`/api/key-pickup/${scheduleId}/confirm`, {
      method: "POST",
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Não foi possível registrar a retirada.");
    }

    return data;
  },
};
