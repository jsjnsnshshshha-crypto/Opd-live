/* =========================================================
   OPD LIVE — Main Application Logic
   Patient App — Frontend Logic
   ========================================================= */

"use strict";

/* =========================================================
   APPLICATION STATE
   ========================================================= */

const OPDLive = {
    currentUser: null,
    loggedIn: false,
    authMode: "login",

    doctors: [
        {
            id: 1,
            name: "Dr. Sharma",
            speciality: "General Physician",
            hospital: "OPB Hospital",
            available: true,
            currentOPD: 24,
            waiting: 5
        },
        {
            id: 2,
            name: "Dr. Priya",
            speciality: "Gynecologist",
            hospital: "City Care Hospital",
            available: true,
            currentOPD: 12,
            waiting: 3
        },
        {
            id: 3,
            name: "Dr. Verma",
            speciality: "Cardiologist",
            hospital: "OPB Hospital",
            available: false,
            currentOPD: 18,
            waiting: 0
        }
    ],

    patientOPD: {
        number: "A-24",
        ahead: 5,
        doctor: "Dr. Sharma",
        hospital: "OPB Hospital"
    }
};


/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}


/* =========================================================
   STORAGE
   ========================================================= */

function loadUser() {
    try {
        const savedUser = localStorage.getItem("opd_live_user");

        if (savedUser) {
            OPDLive.currentUser = JSON.parse(savedUser);
            OPDLive.loggedIn = true;
        }
    } catch (error) {
        console.error("Unable to load user:", error);
    }
}

function saveUser(user) {
    OPDLive.currentUser = user;
    OPDLive.loggedIn = true;

    localStorage.setItem(
        "opd_live_user",
        JSON.stringify(user)
    );
}

function logoutUser() {
    OPDLive.currentUser = null;
    OPDLive.loggedIn = false;

    localStorage.removeItem("opd_live_user");

    showToast("Logged out successfully");

    updateLoginUI();
}


/* =========================================================
   TOAST
   ========================================================= */

function showToast(message) {
    let container = $(".toast-container");

    if (!container) {
        container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = "0";

        setTimeout(() => {
            toast.remove();
        }, 250);
    }, 2500);
}


/* =========================================================
   MODAL
   ========================================================= */

function openModal(content) {
    let overlay = $(".modal-overlay");

    if (!overlay) {
        overlay = document.createElement("div");
        overlay.className = "modal-overlay";

        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>${content.title || "OPD LIVE"}</h3>

                <button
                    class="close-button"
                    type="button"
                    aria-label="Close"
                    data-close-modal
                >
                    ×
                </button>
            </div>

            ${content.body || ""}
        </div>
    `;

    overlay.classList.add("show");

    overlay.addEventListener("click", function handler(event) {
        if (
            event.target === overlay ||
            event.target.closest("[data-close-modal]")
        ) {
            closeModal();
            overlay.removeEventListener("click", handler);
        }
    });
}

function closeModal() {
    const overlay = $(".modal-overlay");

    if (overlay) {
        overlay.classList.remove("show");
    }
}


/* =========================================================
   LOGIN MODAL
   ========================================================= */

function openLogin() {
    OPDLive.authMode = "login";

    openAuthModal();
}

function openRegister() {
    OPDLive.authMode = "register";

    openAuthModal();
}

function openAuthModal() {
    const isLogin = OPDLive.authMode === "login";

    openModal({
        title: isLogin ? "Login to OPD LIVE" : "Create Account",

        body: `
            <div class="auth-tabs">
                <button
                    type="button"
                    class="auth-tab ${isLogin ? "active" : ""}"
                    data-auth-tab="login"
                >
                    Login
                </button>

                <button
                    type="button"
                    class="auth-tab ${!isLogin ? "active" : ""}"
                    data-auth-tab="register"
                >
                    Register
                </button>
            </div>

            <form id="authForm">

                ${
                    !isLogin
                        ? `
                    <div class="form-group">
                        <label>Full Name</label>
                        <input
                            id="authName"
                            type="text"
                            placeholder="Enter your name"
                            required
                        >
                    </div>
                    `
                        : ""
                }

                <div class="form-group">
                    <label>Mobile / Email</label>
                    <input
                        id="authContact"
                        type="text"
                        placeholder="Enter mobile number or email"
                        required
                    >
                </div>

                <div class="form-group">
                    <label>Password</label>
                    <input
                        id="authPassword"
                        type="password"
                        placeholder="Enter password"
                        required
                    >
                </div>

                <button
                    type="submit"
                    class="btn btn-primary"
                >
                    ${isLogin ? "Login" : "Create Account"}
                </button>

            </form>
        `
    });
}


/* =========================================================
   AUTH SUBMIT
   ========================================================= */

function handleAuthSubmit(event) {
    event.preventDefault();

    const contact = $("#authContact");
    const password = $("#authPassword");

    if (!contact || !password) {
        return;
    }

    if (!contact.value.trim() || !password.value.trim()) {
        showToast("Please fill all required fields");
        return;
    }

    let name = "OPD LIVE Patient";

    const nameInput = $("#authName");

    if (nameInput && nameInput.value.trim()) {
        name = nameInput.value.trim();
    }

    const user = {
        id: Date.now(),
        name: name,
        contact: contact.value.trim()
    };

    saveUser(user);

    closeModal();

    updateLoginUI();

    showToast(
        OPDLive.authMode === "login"
            ? "Login successful"
            : "Account created successfully"
    );
}


/* =========================================================
   LOGIN REQUIRED
   ========================================================= */

function requireLogin() {
    if (OPDLive.loggedIn) {
        return true;
    }

    openLogin();

    showToast("Please login to use My OPD");

    return false;
}


/* =========================================================
   LOGIN UI
   ========================================================= */

function updateLoginUI() {
    const loginButtons = $$(
        "[data-login], .login-button, #loginButton"
    );

    loginButtons.forEach(button => {
        if (OPDLive.loggedIn) {
            button.textContent = "Profile";
        } else {
            button.textContent = "Login";
        }
    });

    const userElements = $$("[data-user-name]");

    userElements.forEach(element => {
        element.textContent =
            OPDLive.currentUser?.name || "Patient";
    });
}


/* =========================================================
   DOCTOR SEARCH
   ========================================================= */

function searchDoctors(value) {
    const query = value.toLowerCase().trim();

    const cards = $$(".doctor-card");

    cards.forEach(card => {
        const text = card.textContent.toLowerCase();

        card.style.display =
            !query || text.includes(query)
                ? ""
                : "none";
    });
}


/* =========================================================
   DOCTOR DETAILS
   ========================================================= */

function showDoctorDetails(doctorId) {
    const doctor = OPDLive.doctors.find(
        item => item.id === Number(doctorId)
    );

    if (!doctor) {
        return;
    }

    openModal({
        title: doctor.name,

        body: `
            <div class="info-card">

                <div class="info-row">
                    <span>Specialisation</span>
                    <span>${doctor.speciality}</span>
                </div>

                <div class="info-row">
                    <span>Hospital</span>
                    <span>${doctor.hospital}</span>
                </div>

                <div class="info-row">
                    <span>Status</span>
                    <span>
                        ${
                            doctor.available
                                ? "Available"
                                : "Not Available"
                        }
                    </span>
                </div>

                <div class="info-row">
                    <span>Current OPD</span>
                    <span>${doctor.currentOPD}</span>
                </div>

                ${
                    doctor.available
                        ? `
                    <button
                        class="btn btn-primary mt-15"
                        data-book-doctor="${doctor.id}"
                    >
                        Join OPD
                    </button>
                    `
                        : `
                    <button
                        class="btn btn-secondary mt-15"
                        disabled
                    >
                        Currently Unavailable
                    </button>
                    `
                }

            </div>
        `
    });
}


/* =========================================================
   JOIN OPD
   ========================================================= */

function joinOPD(doctorId) {
    if (!requireLogin()) {
        return;
    }

    const doctor = OPDLive.doctors.find(
        item => item.id === Number(doctorId)
    );

    if (!doctor) {
        return;
    }

    if (!doctor.available) {
        showToast("This doctor is currently unavailable");
        return;
    }

    OPDLive.patientOPD = {
        number: "A-" + (doctor.currentOPD + 1),
        ahead: doctor.waiting,
        doctor: doctor.name,
        hospital: doctor.hospital
    };

    showToast(
        `OPD token ${OPDLive.patientOPD.number} generated`
    );

    updateMyOPD();
}


/* =========================================================
   MY OPD
   ========================================================= */

function updateMyOPD() {
    const numberElements = $$(
        "[data-my-opd-number], .my-opd-number"
    );

    numberElements.forEach(element => {
        element.textContent =
            OPDLive.patientOPD.number;
    });

    const aheadElements = $$(
        "[data-my-opd-ahead], .ahead-text"
    );

    aheadElements.forEach(element => {
        element.textContent =
            `${OPDLive.patientOPD.ahead} patients ahead`;
    });

    const doctorElements = $$(
        "[data-my-opd-doctor]"
    );

    doctorElements.forEach(element => {
        element.textContent =
            `${OPDLive.patientOPD.doctor} • ${OPDLive.patientOPD.hospital}`;
    });
}


/* =========================================================
   MY OPD ACTION
   ========================================================= */

function openMyOPD() {
    if (!requireLogin()) {
        return;
    }

    openModal({
        title: "My OPD",

        body: `
            <div class="my-opd-card">

                <div class="small">
                    Your OPD Number
                </div>

                <div class="my-opd-number">
                    ${OPDLive.patientOPD.number}
                </div>

                <div class="ahead-text">
                    ${OPDLive.patientOPD.ahead}
                    patients ahead
                </div>

                <div class="mt-15">
                    ${OPDLive.patientOPD.doctor}
                    <br>
                    ${OPDLive.patientOPD.hospital}
                </div>

            </div>

            <button
                class="btn btn-primary mt-15"
                data-refresh-opd
            >
                Refresh OPD Status
            </button>
        `
    });
}


/* =========================================================
   EXPLORE ACTIONS
   ========================================================= */

function handleExploreAction(action) {

    switch (action) {

        case "hospital":
            showToast("Hospital search opened");
            break;

        case "specialisation":
        case "speciality":
            showToast("Specialisation search opened");
            break;

        case "doctor":
            showToast("Doctor search opened");
            break;

        case "emergency":
            openEmergency();
            break;

        case "my-opd":
            openMyOPD();
            break;

        default:
            break;
    }
}


/* =========================================================
   EMERGENCY
   ========================================================= */

function openEmergency() {
    openModal({
        title: "Emergency",

        body: `
            <div class="emergency-card">

                <div class="emergency-title">
                    🚨 Emergency Assistance
                </div>

                <p class="emergency-text">
                    If this is a medical emergency,
                    contact your nearest emergency
                    service or hospital immediately.
                </p>

                <button
                    class="btn btn-danger mt-15"
                    data-emergency-call
                >
                    Call Emergency
                </button>

            </div>
        `
    });
}


/* =========================================================
   NAVIGATION
   ========================================================= */

function handleNavigation(target) {

    if (!target) {
        return;
    }

    const element = document.getElementById(target);

    if (element) {
        element.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}


/* =========================================================
   EVENT DELEGATION
   ========================================================= */

document.addEventListener("click", function(event) {

    const authTab =
        event.target.closest("[data-auth-tab]");

    if (authTab) {

        OPDLive.authMode =
            authTab.dataset.authTab;

        openAuthModal();

        return;
    }


    const loginButton =
        event.target.closest(
            "[data-login], .login-button, #loginButton"
        );

    if (loginButton) {

        if (OPDLive.loggedIn) {

            openModal({
                title: "My Profile",

                body: `
                    <div class="info-card">

                        <div class="info-row">
                            <span>Name</span>
                            <span>
                                ${
                                    OPDLive.currentUser?.name ||
                                    "Patient"
                                }
                            </span>
                        </div>

                        <div class="info-row">
                            <span>Contact</span>
                            <span>
                                ${
                                    OPDLive.currentUser?.contact ||
                                    "-"
                                }
                            </span>
                        </div>

                    </div>

                    <button
                        class="btn btn-danger mt-15"
                        data-logout
                    >
                        Logout
                    </button>
                `
            });

        } else {
            openLogin();
        }

        return;
    }


    const logout =
        event.target.closest("[data-logout]");

    if (logout) {
        logoutUser();
        closeModal();
        return;
    }


    const myOPD =
        event.target.closest(
            "[data-my-opd], .my-opd"
        );

    if (myOPD) {
        openMyOPD();
        return;
    }


    const explore =
        event.target.closest("[data-explore]");

    if (explore) {
        handleExploreAction(
            explore.dataset.explore
        );
        return;
    }


    const doctor =
        event.target.closest("[data-doctor-id]");

    if (doctor) {
        showDoctorDetails(
            doctor.dataset.doctorId
        );
        return;
    }


    const join =
        event.target.closest("[data-book-doctor]");

    if (join) {
        joinOPD(
            join.dataset.bookDoctor
        );
        return;
    }


    const emergency =
        event.target.closest("[data-emergency]");

    if (emergency) {
        openEmergency();
        return;
    }


    const emergencyCall =
        event.target.closest("[data-emergency-call]");

    if (emergencyCall) {
        showToast(
            "Please use your phone's emergency service"
        );
        return;
    }


    const refresh =
        event.target.closest("[data-refresh-opd]");

    if (refresh) {
        showToast("OPD status refreshed");
        closeModal();
        return;
    }


    const navigation =
        event.target.closest("[data-nav]");

    if (navigation) {
        handleNavigation(
            navigation.dataset.nav
        );
    }

});


/* =========================================================
   SEARCH EVENT
   ========================================================= */

document.addEventListener("input", function(event) {

    if (
        event.target.matches(
            ".search-box input, #searchInput, [data-search]"
        )
    ) {
        searchDoctors(event.target.value);
    }

});


/* =========================================================
   FORM EVENTS
   ========================================================= */

document.addEventListener("submit", function(event) {

    if (event.target.id === "authForm") {
        handleAuthSubmit(event);
    }

});


/* =========================================================
   KEYBOARD SUPPORT
   ========================================================= */

document.addEventListener("keydown", function(event) {

    if (event.key === "Escape") {
        closeModal();
    }

});


/* =========================================================
   INITIALIZATION
   ========================================================= */

function initializeApp() {

    loadUser();

    updateLoginUI();

    updateMyOPD();

    console.log(
        "OPD LIVE application initialized successfully."
    );
}


if (
    document.readyState === "loading"
) {
    document.addEventListener(
        "DOMContentLoaded",
        initializeApp
    );
} else {
    initializeApp();
}


/* =========================================================
   OPD LIVE — END
   ========================================================= */
