const API_BASE = "/api";

let currentUser = null;
let token = null;

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.style.borderLeftColor = type === 'error' ? '#ef4444' : '#22c55e';
    toast.style.display = 'block';
    setTimeout(() => toast.style.display = 'none', 3000);
}

async function signup() {
    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;

    if (!name || !email || !password || password !== confirm) return showToast("All fields are required", 'error');

    try {
        const res = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg);
        showToast("Signup successful! Login now");
        switchToLogin();
    } catch (e) { showToast(e.message, 'error'); }
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
        if (!res.ok) throw new Error(data.msg);

        token = data.token;
        currentUser = data.user;

        localStorage.setItem('osintx_token', token);
        localStorage.setItem('osintx_user', JSON.stringify(currentUser));

        showToast("Login Successful!");
        initApp();
    } catch (e) { showToast(e.message, 'error'); }
}

function initApp() {
    token = localStorage.getItem('osintx_token');
    const userData = localStorage.getItem('osintx_user');
    if (token && userData) {
        currentUser = JSON.parse(userData);
        document.getElementById('auth-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');
        document.getElementById('user-name').textContent = currentUser.name;
        document.getElementById('plan-badge').textContent = currentUser.plan.toUpperCase();
        navigate('search');
    }
}

async function analyzeNumber() {
    const number = document.getElementById('phone-input').value.trim();
    if (!/^\d{10}$/.test(number)) return showToast("Enter valid 10 digit number", 'error');

    try {
        const res = await fetch(`${API_BASE}/search?number=${number}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok) {
            if (res.status === 429) document.getElementById('limit-modal').classList.remove('hidden');
            else showToast(data.msg || "Failed", 'error');
            return;
        }

        renderResults(number, data);
    } catch (err) {
        showToast("Server Error", 'error');
    }
}

function renderResults(number, apiData) {
    const container = document.getElementById('results-container');
    container.classList.remove('hidden');

    const result = apiData.data?.results?.[0] || {};

    document.getElementById('result-number').textContent = `+91 ${number}`;

    const riskEl = document.getElementById('risk-score');
    const risk = result.NAME ? "low" : "medium";
    riskEl.textContent = risk.toUpperCase() + " RISK";
    riskEl.className = `risk-badge ${risk}`;

    document.querySelector('.results-grid').innerHTML = `
        <div class="glass-card info-card">
            <h4>Personal Info</h4>
            <p><strong>Name:</strong> ${result.NAME || 'N/A'}</p>
            <p><strong>F/H Name:</strong> ${result.fname || 'N/A'}</p>
        </div>
        <div class="glass-card info-card">
            <h4>Address</h4>
            <p>${result.ADDRESS ? result.ADDRESS.replace(/!/g, '<br>') : 'N/A'}</p>
        </div>
        <div class="glass-card info-card">
            <h4>Network Info</h4>
            <p><strong>Circle:</strong> ${result.circle || 'N/A'}</p>
        </div>
    `;

    document.getElementById('ai-summary').innerHTML = `This number belongs to <strong>${result.NAME || 'Unknown'}</strong>.`;
}

function clearResults() {
    document.getElementById('results-container').classList.add('hidden');
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
    document.getElementById(`${page}-section`).classList.add('active');
}

function logout() {
    localStorage.clear();
    location.reload();
}

function closeModal() {
    document.getElementById('limit-modal').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', initApp);
