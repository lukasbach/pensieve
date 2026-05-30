try {
  if (localStorage.getItem("dark") === "true") {
    document.documentElement.dataset.appearance = "dark";
  }
} catch {
  // ignore localStorage errors (e.g. in sandboxed environments)
}
