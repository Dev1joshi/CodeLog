// Load Chart.js
const script = document.createElement("script");
script.src = "https://cdn.jsdelivr.net/npm/chart.js";
document.head.appendChild(script);

// === AUTH LOGIC ===
let isLogin = true;
const authSection = document.getElementById("authSection");
const appSection = document.getElementById("appSection");
const authTitle = document.getElementById("authTitle");
const toggleAuth = document.getElementById("toggleAuth");
const authUsername = document.getElementById("authUsername");
const authPassword = document.getElementById("authPassword");
const authName = document.getElementById("authName");
const authBtn = document.getElementById("authActionBtn");
const authError = document.getElementById("authError");
const welcomeText = document.getElementById("welcomeText");

let currentUser = null;

function loadUsers() {
  return JSON.parse(localStorage.getItem("users")) || {};
}

function saveUsers(users) {
  localStorage.setItem("users", JSON.stringify(users));
}

authBtn.addEventListener("click", () => {
  const username = authUsername.value.trim();
  const password = authPassword.value;
  const name = authName ? authName.value.trim() : "";

  if (!username || !password || (!isLogin && !name)) {
    authError.textContent = "Please fill all fields";
    return;
  }

  const users = loadUsers();

  if (isLogin) {
    if (users[username] && users[username].password === password) {
      authError.textContent = "";
      currentUser = username;
      localStorage.setItem("currentUser", currentUser);
      loadDashboard();
    } else {
      authError.textContent = "Invalid credentials";
    }
  } else {
    if (users[username]) {
      authError.textContent = "User already exists";
    } else {
      users[username] = { password, name, logs: [], questions: [], suggestions: [] };
      saveUsers(users);
      authError.textContent = "Account created. You can log in now.";
      toggleLogin();
    }
  }
});

toggleAuth.addEventListener("click", toggleLogin);

function toggleLogin() {
  isLogin = !isLogin;
  authTitle.textContent = isLogin ? "Login to CodeLog" : "Create Your CodeLog Account";
  authBtn.textContent = isLogin ? "Login" : "Sign Up";
  toggleAuth.textContent = isLogin ? "Don't have an account? Sign up" : "Already have an account? Login";
  if (authName) authName.parentElement.style.display = isLogin ? "none" : "block";
  authError.textContent = "";
}

function loadDashboard() {
  authSection.style.display = "none";
  appSection.style.display = "block";
  const users = loadUsers();
  welcomeText.textContent = `Welcome, ${users[currentUser].name || currentUser}!`;
  updatePlatformStats();
  updateQuestions();
  initChart();
  updateAISuggestions();
}

function logout() {
  localStorage.removeItem("currentUser");
  location.reload();
}

// === DAILY LOG ===
document.getElementById("saveLog").addEventListener("click", () => {
  const users = loadUsers();
  const log = document.getElementById("dailyLog").value.trim();
  if (log) {
    users[currentUser].logs.push({ text: log, date: new Date().toLocaleDateString() });
    saveUsers(users);
    alert("Saved today's log!");
    document.getElementById("dailyLog").value = "";
    updateAISuggestions();
  }
});

// === QUESTION LOGGING ===
const platform = document.getElementById("platformSelect");
const topic = document.getElementById("topicSelect");
const qInput = document.getElementById("questionNumber");
const qBox = document.getElementById("questionScrollBox");

function updateQuestions() {
  const users = loadUsers();
  const list = users[currentUser].questions || [];
  qBox.innerHTML = "";
  list.forEach((entry, i) => {
    const div = document.createElement("div");
    div.className = "log-item";
    div.innerHTML = `${entry.platform} - ${entry.topic} - Q${entry.number} <button onclick="removeQuestion(${i})">✖</button>`;
    qBox.appendChild(div);
  });
}

document.getElementById("logQuestion").addEventListener("click", () => {
  const users = loadUsers();
  const val = qInput.value.trim();
  if (!val) return alert("Enter question number");
  users[currentUser].questions.push({
    platform: platform.value,
    topic: topic.value,
    number: val,
    date: new Date().toISOString().split("T")[0]
  });
  saveUsers(users);
  qInput.value = "";
  updateQuestions();
  updatePlatformStats();
});

function removeQuestion(index) {
  const users = loadUsers();
  users[currentUser].questions.splice(index, 1);
  saveUsers(users);
  updateQuestions();
  updatePlatformStats();
}

function toggleScroll() {
  qBox.style.display = qBox.style.display === "none" ? "block" : "none";
}

// === PLATFORM STATS ===
function updatePlatformStats() {
  const stats = {};
  const users = loadUsers();
  (users[currentUser].questions || []).forEach(q => {
    stats[q.platform] = (stats[q.platform] || 0) + 1;
  });
  const ul = document.getElementById("platformStats");
  ul.innerHTML = "";
  for (let key in stats) {
    const li = document.createElement("li");
    li.textContent = `${key}: ${stats[key]} questions`;
    ul.appendChild(li);
  }
}

// === CHART ===
let chart;
function initChart() {
  const ctx = document.getElementById("growthChart").getContext("2d");
  const users = loadUsers();
  const today = new Date().toISOString().split("T")[0];

  const dataMap = {};
  (users[currentUser].questions || []).forEach(q => {
    dataMap[q.date] = (dataMap[q.date] || 0) + 1;
  });

  const labels = Object.keys(dataMap).sort();
  const data = labels.map(l => dataMap[l]);

  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Questions Solved",
        data,
        borderColor: "#4CAF50",
        fill: false
      }]
    }
  });
}

// === AI SUGGESTION ENGINE ===
function updateAISuggestions() {
  const aiBox = document.getElementById("aiSuggestionBox");
  const users = loadUsers();
  const logs = users[currentUser].logs.map(l => l.text.toLowerCase());
  let suggestion = "Focus on consistent problem-solving each day.";

  if (logs.some(l => l.includes("array"))) {
    suggestion = "Try exploring String or Sliding Window problems next.";
  } else if (logs.some(l => l.includes("linked list"))) {
    suggestion = "How about tackling Stack and Queue based problems now?";
  } else if (logs.some(l => l.includes("graph"))) {
    suggestion = "You might want to learn Dynamic Programming or Trees next.";
  } else if (logs.some(l => l.includes("dp"))) {
    suggestion = "Great! Maybe now challenge yourself with advanced Graph problems.";
  }

  aiBox.textContent = suggestion;
}

// === AUTO LOGIN ===
window.onload = () => {
  const saved = localStorage.getItem("currentUser");
  if (saved) {
    currentUser = saved;
    loadDashboard();
  }
};
