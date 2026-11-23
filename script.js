
const API_BASE = "https://women-safety-emergency-alert-system.onrender.com";
let userToken = sessionStorage.getItem("userToken");
let adminToken = sessionStorage.getItem("adminToken");

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function apiRequest(endpoint, method = "GET", body = null, token = userToken) {
    const headers = {};

    if (body !== null) {
        headers["Content-Type"] = "application/json";
    }

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(API_BASE + endpoint, {
        method,
        headers,
        body: body !== null ? JSON.stringify(body) : null
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.message || "Something went wrong.");
    }

    return result;
}

function showSection(sectionId) {
    if (!["home", "register", "login", "adminLogin"].includes(sectionId)) {
        if (!userToken && !adminToken) {
            showSection("login");
            return;
        }
    }

    document.querySelectorAll(".section").forEach(section => {
        section.classList.add("hidden");
    });

    const selectedSection = document.getElementById(sectionId);

    if (selectedSection) {
        selectedSection.classList.remove("hidden");
    }

    if (sectionId === "dashboard") {
        loadProfile();
    }

    if (sectionId === "contacts") {
        loadContacts();
    }

    if (sectionId === "history") {
        loadHistory();
    }

    if (sectionId === "profile") {
        loadProfile();
    }

    if (sectionId === "adminDashboard") {
        loadAdminDashboard();
    }
}

// USER REGISTRATION

document.getElementById("registerForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const message = document.getElementById("registerMessage");
    message.textContent = "Registering...";

    try {
        const result = await apiRequest("/api/register", "POST", {
            name: document.getElementById("regName").value.trim(),
            email: document.getElementById("regEmail").value.trim(),
            phone: document.getElementById("regPhone").value.trim(),
            password: document.getElementById("regPassword").value
        }, null);

        message.textContent = result.message;
        this.reset();

    } catch (error) {
        message.textContent = error.message;
    }
});

// USER LOGIN

document.getElementById("loginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const message = document.getElementById("loginMessage");
    message.textContent = "Logging in...";

    try {
        const result = await apiRequest("/api/login", "POST", {
            email: document.getElementById("loginEmail").value.trim(),
            password: document.getElementById("loginPassword").value
        }, null);

        userToken = result.token;
        sessionStorage.setItem("userToken", userToken);

        document.getElementById("welcomeMessage").textContent =
            "Welcome, " + result.user.name + "!";

        this.reset();
        showSection("dashboard");

    } catch (error) {
        message.textContent = error.message;
    }
});

// ADD EMERGENCY CONTACT

document.getElementById("contactForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const message = document.getElementById("contactMessage");

    try {
        const result = await apiRequest("/api/contacts", "POST", {
            contact_name: document.getElementById("contactName").value.trim(),
            contact_number: document.getElementById("contactNumber").value.trim()
        });

        message.textContent = result.message;
        this.reset();
        loadContacts();

    } catch (error) {
        message.textContent = error.message;
    }
});

// LOAD EMERGENCY CONTACTS

async function loadContacts() {
    const container = document.getElementById("contactsList");
    container.textContent = "Loading contacts...";

    try {
        const result = await apiRequest("/api/contacts");

        container.innerHTML = "";

        if (result.contacts.length === 0) {
            container.textContent = "No emergency contacts added yet.";
            return;
        }

        result.contacts.forEach(contact => {
            const card = document.createElement("div");
            card.className = "item-card";

            card.innerHTML = `
                <h3>${escapeHTML(contact.contact_name)}</h3>
                <p>${escapeHTML(contact.contact_number)}</p>
                <button onclick="deleteContact(${Number(contact.id)})">
                    Delete Contact
                </button>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        container.textContent = error.message;
    }
}

// DELETE CONTACT

async function deleteContact(contactId) {
    if (!confirm("Are you sure you want to delete this contact?")) {
        return;
    }

    try {
        const result = await apiRequest(
            `/api/contacts/${contactId}`,
            "DELETE"
        );

        alert(result.message);
        loadContacts();

    } catch (error) {
        alert(error.message);
    }
}

// SOS DEMO

async function recordSOS() {
    const message = document.getElementById("sosMessage");
    message.textContent = "Saving demo record...";

    try {
        const result = await apiRequest("/api/record-sos", "POST");
        message.textContent = result.message;

    } catch (error) {
        message.textContent = error.message;
    }
}

// SOS HISTORY

async function loadHistory() {
    const container = document.getElementById("historyList");
    container.textContent = "Loading history...";

    try {
        const result = await apiRequest("/api/sos-history");

        container.innerHTML = "";

        if (result.history.length === 0) {
            container.textContent = "No SOS demo history available.";
            return;
        }

        result.history.forEach(record => {
            const card = document.createElement("div");
            card.className = "item-card";

            card.innerHTML = `
                <p>${escapeHTML(record.alert_message)}</p>
                <small>${escapeHTML(record.created_at || "")}</small>
            `;

            container.appendChild(card);
        });

    } catch (error) {
        container.textContent = error.message;
    }
}

// LOAD PROFILE

async function loadProfile() {
    try {
        const result = await apiRequest("/api/profile");
        const user = result.user;

        document.getElementById("profileName").value = user.name || "";
        document.getElementById("profileEmail").value = user.email || "";
        document.getElementById("profilePhone").value = user.phone || "";

    } catch (error) {
        console.error(error.message);
    }
}

// UPDATE PROFILE

document.getElementById("profileForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const message = document.getElementById("profileMessage");

    try {
        const result = await apiRequest("/api/profile", "PUT", {
            name: document.getElementById("profileName").value.trim(),
            phone: document.getElementById("profilePhone").value.trim()
        });

        message.textContent = "Profile updated successfully!";
        document.getElementById("welcomeMessage").textContent =
            "Welcome, " + result.user.name + "!";

    } catch (error) {
        message.textContent = error.message;
    }
});

// SUBMIT FEEDBACK

document.getElementById("feedbackForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const message = document.getElementById("feedbackMessage");

    try {
        const result = await apiRequest("/api/feedback", "POST", {
            feedback_text: document.getElementById("feedbackText").value.trim()
        });

        message.textContent = result.message;
        this.reset();

    } catch (error) {
        message.textContent = error.message;
    }
});

// USER LOGOUT

function logout() {
    userToken = null;
    sessionStorage.removeItem("userToken");
    showSection("home");
}

// ADMIN LOGIN

document.getElementById("adminLoginForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const message = document.getElementById("adminLoginMessage");
    message.textContent = "Checking admin details...";

    try {
        const result = await apiRequest("/api/admin/login", "POST", {
            username: document.getElementById("adminUsername").value.trim(),
            password: document.getElementById("adminPassword").value
        }, null);

        adminToken = result.token;
        sessionStorage.setItem("adminToken", adminToken);

        this.reset();
        showSection("adminDashboard");

    } catch (error) {
        message.textContent = error.message;
    }
});

// ADMIN DASHBOARD

async function loadAdminDashboard() {
    const usersContainer = document.getElementById("adminUsers");
    usersContainer.textContent = "Loading dashboard...";

    try {
        const result = await apiRequest(
            "/api/admin/dashboard",
            "GET",
            null,
            adminToken
        );

        document.getElementById("totalUsers").textContent =
            result.total_users;

        usersContainer.innerHTML = "";

        result.users.forEach(user => {
            const card = document.createElement("div");
            card.className = "item-card";

            card.innerHTML = `
                <h4>${escapeHTML(user.name)}</h4>
                <p>${escapeHTML(user.email)}</p>
                <p>${escapeHTML(user.phone)}</p>
            `;

            usersContainer.appendChild(card);
        });

        const feedbackContainer = document.getElementById("adminFeedback");
        feedbackContainer.innerHTML = "";

        result.feedbacks.forEach(item => {
            const card = document.createElement("div");
            card.className = "item-card";

            card.innerHTML = `
                <h4>${escapeHTML(item.name)}</h4>
                <p>${escapeHTML(item.feedback_text)}</p>
                <small>${escapeHTML(item.created_at || "")}</small>
            `;

            feedbackContainer.appendChild(card);
        });

        const sosContainer = document.getElementById("adminSOS");
        sosContainer.innerHTML = "";

        result.sos_records.forEach(item => {
            const card = document.createElement("div");
            card.className = "item-card";

            card.innerHTML = `
                <h4>${escapeHTML(item.name)}</h4>
                <p>${escapeHTML(item.alert_message)}</p>
                <small>${escapeHTML(item.created_at || "")}</small>
            `;

            sosContainer.appendChild(card);
        });

    } catch (error) {
        usersContainer.textContent = error.message;
    }
}

// ADMIN LOGOUT

function adminLogout() {
    adminToken = null;
    sessionStorage.removeItem("adminToken");
    showSection("home");
}

// INITIAL PAGE

if (userToken) {
    showSection("dashboard");
} else if (adminToken) {
    showSection("adminDashboard");
} else {
    showSection("home");
}
