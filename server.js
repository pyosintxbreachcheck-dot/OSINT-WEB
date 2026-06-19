const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.log("MongoDB Error:", err));

const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    plan: { type: String, default: 'free' },
    searchesToday: { type: Number, default: 0 },
    lastResetDate: { type: String, default: () => new Date().toDateString() }
});

const User = mongoose.model('User', userSchema);

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ msg: 'No token' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (e) {
        res.status(401).json({ msg: 'Invalid token' });
    }
};

app.post('/api/signup', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ msg: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        user = new User({ name, email, password: hashed });
        await user.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { name: user.name, email: user.email, plan: user.plan } });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        const today = new Date().toDateString();
        if (user.lastResetDate !== today) {
            user.searchesToday = 0;
            user.lastResetDate = today;
            await user.save();
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { name: user.name, email: user.email, plan: user.plan } });
    } catch (err) {
        res.status(500).json({ msg: 'Server error' });
    }
});

app.get('/api/search', auth, async (req, res) => {
    const { number } = req.query;
    const user = await User.findById(req.user.id);

    if (user.plan === 'free' && user.searchesToday >= 5) {
        return res.status(429).json({ msg: 'Daily limit reached' });
    }

    try {
        const apiRes = await fetch(`${process.env.EXTERNAL_API_URL}?type=mobile&term=${number}`);
        const data = await apiRes.json();

        user.searchesToday += 1;
        await user.save();

        res.json({ success: true, data: data });
    } catch (e) {
        res.status(500).json({ msg: 'External API Error' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
