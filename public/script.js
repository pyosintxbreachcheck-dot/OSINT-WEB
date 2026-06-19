const API_BASE = "/api";

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) return showToast("Email and Password required", 'error');

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.msg || "Invalid credentials");

        localStorage.setItem('osintx_token', data.token);
        localStorage.setItem('osintx_user', JSON.stringify(data.user));

        showToast("Login Successful!", 'success');

        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');

    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function signup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    if (password !== confirm) return showToast("Passwords do not match", 'error');

    try {
        const res = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.msg || "Signup failed");

        showToast("Account created! Please login", 'success');
        switchToLogin();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function switchToSignup() {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.add('active');
}

function switchToLogin() {
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
}

document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('osintx_token')) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
    }
});
