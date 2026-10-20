import { initTheme } from "./theme.js";
import { initNavbar } from "./components/navbar.js";

document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    initNavbar();
    initLogin();
});

function initLogin() {
    const password = document.getElementById("password");
    const passwordToggle = document.getElementById("passwordToggle");
    const loginForm = document.getElementById("loginForm");
    const googleLogin = document.getElementById("googleLogin");

    // Password visibility toggle
    if (passwordToggle && password) {
        passwordToggle.addEventListener("click", () => {
            const isPassword = password.type === "password";
            password.type = isPassword ? "text" : "password";
            passwordToggle.setAttribute(
                "aria-label",
                isPassword ? "Hide password" : "Show password"
            );
        });
    }

    // Login form submission
    if (loginForm) {
        loginForm.addEventListener("submit", (event) => {
            event.preventDefault();

            const email = document.getElementById("email").value.trim();
            const passwordValue = password.value.trim();

            // Validation
            if (!email || !passwordValue) {
                alert("Please fill in all fields");
                return;
            }

            if (!email.includes("@") || !email.includes(".")) {
                alert("Please enter a valid email");
                return;
            }

            if (passwordValue.length < 6) {
                alert("Password must be at least 6 characters");
                return;
            }

            console.log("Login attempt:", { email, password: passwordValue });

            // TODO: Connect to backend
        });
    }

    // Google login
    if (googleLogin) {
        googleLogin.addEventListener("click", () => {
            console.log("Google login clicked");
            // TODO: Implement Google OAuth
        });
    }
}