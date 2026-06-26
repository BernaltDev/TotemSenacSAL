const loginForm = document.querySelector("#loginForm");
const loginFeedback = document.querySelector("#loginFeedback");

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  loginFeedback.textContent = "Validando acesso...";

  const formData = new FormData(loginForm);
  const email = formData.get("email");
  const password = formData.get("password");

  try {
    const result = await AuthApi.login(email, password);

    ApiClient.setToken(result.token);
    window.location.href = "/dashboard.html";
  } catch (error) {
    loginFeedback.textContent = error.message;
  }
});
