const API_BASE = "/api";

let currentUser = null;
let token = null;

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = msg;
    toast.style.borderLeftColor = type === 'error' ? '#ef4444' : '#22c55e';
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 3000);
}

async function signup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    if (!name || !email || !password || password !== confirm) 
        return showToast("All fields are required", 'error');

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
        if (!res.ok) throw new Error(data.msg || "Invalid credentials");

        token = data.token;
        currentUser = data.user;

        localStorage.setItem('osintx_token', token);
        localStorage.setItem('osintx_user', JSON.stringify(currentUser));

        showToast("Login Successful!", 'success');

        // Force refresh after login
        setTimeout(initApp, 800);

    } catch (e) {
        showToast(e.message, 'error');
    }
}

function initApp() {
    const savedToken = localStorage.getItem('osintx_token');
    const savedUser = localStorage.getItem('osintx_user');

    if (savedToken && savedUser) {
        token = savedToken;
        currentUser = JSON.parse(savedUser);

        // Hide Auth Screen
        document.getElementById('auth-screen').classList.add('hidden');
        // Show Main App
        document.getElementById('main-app').classList.remove('hidden');

        // Update UI
        document.getElementById('user-name').textContent = currentUser.name || "User";
        document.getElementById('plan-badge').textContent = (currentUser.plan || "FREE").toUpperCase();

        navigate('search');   // Go to search page
        console.log("✅ App Loaded Successfully on Render");
    }
}

function logout() {
    localStorage.clear();
    location.reload();
}

function switchToSignup() {
    document.getElementById('login-form').classList.remove('active');
    document.getElementById('signup-form').classList.add('active');
}

function switchToLogin() {
    document.getElementById('signup-form').classList.remove('active');
    document.getElementById('login-form').classList.add('active');
}

function navigate(page) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const section = document.getElementById(page + '-section');
    if (section) section.classList.add('active');
}

// Search Functions
async function analyzeNumber() {
    const number = document.getElementById('phone-input').value.trim();
    if (!/^\d{10}$/.test(number)) return showToast("10 digit number daalo", 'error');

    try {
        const res = await fetch(`${API_BASE}/search?number=${number}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) {
            if (res.status === 429) document.getElementById('limit-modal').classList.remove('hidden');
            else showToast(data.msg || "Search failed", 'error');
            return;
        }

        renderResults(number, data);
    } catch (err) {
        showToast("Server Error", 'error');
    }
}

function renderResults(number, apiData) {
    document.getElementById('results-container').classList.remove('hidden');
    const result = apiData.data?.results?.[0] || {};

    document.getElementById('result-number').textContent = `+91 ${number}`;

    const riskEl = document.getElementById('risk-score');
    const riskLevel = result.NAME ? "low" : "medium";
    riskEl.textContent = riskLevel.toUpperCase() + " RISK";
    riskEl.className = `risk-badge ${riskLevel}`;

    document.querySelector('.results-grid').innerHTML = `
        <div class="glass-card info-card">
            <h4>Personal Info</h4>
            <p><strong>Name:</strong> ${result.NAME || 'N/A'}</p>
            <p><strong>F/H:</strong> ${result.fname || 'N/A'}</p>
        </div>
        <div class="glass-card info-card">
            <h4>Address</h4>
            <p>${result.ADDRESS ? result.ADDRESS.replace(/!/g, '<br>') : 'N/A'}</p>
        </div>
    `;

    document.getElementById('ai-summary').innerHTML = `This number belongs to <strong>${result.NAME || 'Unknown'}</strong>.`;
}

function clearResults() {
    document.getElementById('results-container').classList.add('hidden');
}

function closeModal() {
    document.getElementById('limit-modal').classList.add('hidden');
}

// Initialize
document.addEventListener('DOMContentLoaded', initApp);
