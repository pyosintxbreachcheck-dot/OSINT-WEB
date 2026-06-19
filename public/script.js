const API_BASE = "/api";

let currentUser = null;
let token = null;

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.textContent = msg;
        toast.style.borderLeftColor = type === 'error' ? '#ef4444' : '#22c55e';
        toast.style.display = 'block';
        setTimeout(() => toast.style.display = 'none', 3000);
    }
}

async function signup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    if (!name || !email || !password || password !== confirm) {
        return showToast("All fields are required", 'error');
    }

    try {
        const res = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || "Signup failed");
        showToast("Signup successful! Please login", 'success');
        switchToLogin();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.msg || "Login failed");

        token = data.token;
        currentUser = data.user;

        localStorage.setItem('osintx_token', token);
        localStorage.setItem('osintx_user', JSON.stringify(currentUser));

        showToast("Login Successful!", 'success');

        // 🔥 Important Fix
        setTimeout(() => {
            initApp();
        }, 600);

    } catch (e) {
        showToast(e.message, 'error');
    }
}

function initApp() {
    token = localStorage.getItem('osintx_token');
    const userData = localStorage.getItem('osintx_user');

    if (token && userData) {
        currentUser = JSON.parse(userData);

        // Hide auth screen
        const authScreen = document.getElementById('auth-screen');
        if (authScreen) authScreen.classList.add('hidden');

        // Show main app
        const mainApp = document.getElementById('main-app');
        if (mainApp) mainApp.classList.remove('hidden');

        // Update user info
        const userNameEl = document.getElementById('user-name');
        const planBadgeEl = document.getElementById('plan-badge');

        if (userNameEl) userNameEl.textContent = currentUser.name || "User";
        if (planBadgeEl) planBadgeEl.textContent = (currentUser.plan || "FREE").toUpperCase();

        navigate('search');   // Default open search page
        console.log("✅ Dashboard Loaded Successfully");
    } else {
        console.log("No token found");
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

// Other helper functions
function switchToSignup() {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.add('active');
}

function switchToLogin() {
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
}

function navigate(page) {
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    const target = document.getElementById(page + '-section');
    if (target) target.classList.add('active');
}

async function analyzeNumber() { /* ... same as before ... */ }
function renderResults(number, apiData) { /* ... same as before ... */ }
function clearResults() {
    document.getElementById('results-container').classList.add('hidden');
}
function closeModal() {
    document.getElementById('limit-modal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
