export function initTheme() {
    const themeToggle = document.getElementById("themeToggle");
    if (!themeToggle) return;

    // Load saved theme
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        themeToggle.checked = true;
    } else {
        document.body.classList.remove("dark");
        themeToggle.checked = false;
    }

    // Theme toggle handler
    themeToggle.addEventListener("change", () => {
        const isDark = themeToggle.checked;
        document.body.classList.toggle("dark", isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    });
}