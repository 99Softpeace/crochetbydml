// theme.js
document.addEventListener("DOMContentLoaded", () => {
  function applyTheme(saved) {
    if (saved === "dark") {
      document.body.classList.add("dark-mode");
      if (themeToggle) themeToggle.textContent = "☀️";
    } else {
      document.body.classList.remove("dark-mode");
      if (themeToggle) themeToggle.textContent = "🌙";
    }
    document.dispatchEvent(new Event("theme-changed"));
  }

  const saved = localStorage.getItem("theme") || "light";
  let themeToggle = null;
  applyTheme(saved);

  // Function to hook up the toggle button once navbar exists
  function initToggle() {
    themeToggle = document.getElementById("theme-toggle");
    if (themeToggle && !themeToggle.dataset.bound) {
      themeToggle.dataset.bound = "true"; // prevent duplicate listeners
      themeToggle.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-mode");
        localStorage.setItem("theme", isDark ? "dark" : "light");
        themeToggle.textContent = isDark ? "☀️" : "🌙";
        document.dispatchEvent(new Event("theme-changed"));
      });
      applyTheme(localStorage.getItem("theme"));
    }
  }

  // Run once in case navbar already exists
  initToggle();

  // Run again when navbar is injected
  document.addEventListener("navbar-loaded", initToggle);
});
