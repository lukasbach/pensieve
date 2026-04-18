try {
  if (localStorage.getItem("dark") === "true") {
    document.documentElement.dataset.appearance = "dark";
  }
} catch {}
