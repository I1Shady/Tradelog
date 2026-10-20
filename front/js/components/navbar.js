export function initNavbar() {
    const loginButton = document.getElementById("loginButton");
    if (loginButton) {
        loginButton.addEventListener("click", () => {
            window.location.href = "./login.html";
        });

        loginButton.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                window.location.href = "./login.html";
            }
        });
    }

    const homeButton = document.getElementById("homeButton");
    if (homeButton) {
        homeButton.addEventListener("click", (e) => {
            e.preventDefault();
            window.location.href = "./index.html";
        });
    }

    const openJournal = document.getElementById("openJournal");
    if (openJournal) {
        openJournal.addEventListener("click", () => {
            window.location.href = "./journal.html";
        });
    }
}