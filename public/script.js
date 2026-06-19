const API_BASE = "/api";

let currentUser = null;
let token = null;

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.borderLeftColor = type === 'error' ? '#ef4444' : '#22c55e';
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

async function login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();

    if (!email || !password) {
        return showToast("Email aur Password dono daalo", 'error');
    }

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.msg || "Invalid email or password");
        }

        token = data.token;
        currentUser = data.user;

        localStorage.setItem('osintx_token', token);
        localStorage.setItem('osintx_user', JSON.stringify(currentUser));

        showToast("Login Successful!", 'success');
        setTimeout(() => {
            document.getElementById('auth-screen').classList.add('hidden');
            document.getElementById('main-app').classList.remove('hidden');
            document.getElementById('user-name').textContent = currentUser.name || "User";
            document.getElementById('plan-badge').textContent = (currentUser.plan || "FREE").toUpperCase();
            navigate('search');
        }, 600);

    } catch (e) {
        showToast(e.message, 'error');
    }
}

async function signup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value.trim();
    const confirm = document.getElementById('signup-confirm').value.trim();

    if (!name || !email || !password || password !== confirm) {
        return showToast("Sab fields sahi bharo", 'error');
    }

    try {
        const res = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();

        if (!res.ok) throw new Error(data.msg || "Signup failed");

        showToast("Account created! Now login", 'success');
        switchToLogin();
    } catch (e) {
        showToast(e.message, 'error');
    }
}

// Other functions (initApp, navigate, analyzeNumber, etc.)
function switchToSignup() {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.add('active');
}

function switchToLogin() {
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
}

function initApp() {
    const savedToken = localStorage.getItem('osintx_token');
    const savedUser = localStorage.getItem('osintx_user');

    if (savedToken && savedUser) {
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        const user = JSON.parse(savedUser);
        document.getElementById('user-name').textContent = user.name || "User";
        document.getElementById('plan-badge').textContent = (user.plan || "FREE").toUpperCase();
        navigate('search');
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

document.addEventListener('DOMContentLoaded', initApp);
