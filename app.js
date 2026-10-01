/* =========================================================
   OPD LIVE
   Patient Application Logic
   ========================================================= */

"use strict";

document.addEventListener("DOMContentLoaded", () => {

  /* =======================================================
     CONFIGURATION
     ======================================================= */

  const API_BASE_URL = "/api";

  /*
    Production mein backend isi API structure par connect hoga.

    Example:
    POST /api/auth/login
    POST /api/auth/register
    GET  /api/doctors/live
    GET  /api/patient/opd
  */

  /* =======================================================
     APPLICATION STATE
     ======================================================= */

  const state = {
    currentUser: null,
    isLoggedIn: false,
    doctors: [],
    hospitals: [],
    currentSearch: "",
    selectedDoctor: null
  };


  /* =======================================================
     DEMO DATA
     -------------------------------------------------------
     Ye temporary frontend data hai.
     Production backend connect hone ke baad API data use hoga.
     ======================================================= */

  const demoDoctors = [
    {
      id: "DOC001",
      name: "Dr. Sharma",
      specialization: "General Physician",
      hospital: "OPB Hospital",
      available: true,
      currentToken: "A-21",
      currentNumber: 21,
      waiting: 3,
      status: "Consulting",
      estimatedWait: "15 min"
    },

    {
      id: "DOC002",
      name: "Dr. Priya",
      specialization: "Gynecologist",
      hospital: "OPB Hospital",
      available: true,
      currentToken: "G-12",
      currentNumber: 12,
      waiting: 5,
      status: "Available",
      estimatedWait: "25 min"
    },

    {
      id: "DOC003",
      name: "Dr. Verma",
      specialization: "Cardiologist",
      hospital: "OPB Hospital",
      available: false,
      currentToken: "C-08",
      currentNumber: 8,
      waiting: 0,
      status: "Not Available",
      estimatedWait: "-"
    },

    {
      id: "DOC004",
      name: "Dr. Singh",
      specialization: "Pediatrician",
      hospital: "OPB Hospital",
      available: true,
      currentToken: "P-18",
      currentNumber: 18,
      waiting: 2,
      status: "Consulting",
      estimatedWait: "10 min"
    }
  ];


  const demoHospitals = [
    {
      id: "HOS001",
      name: "OPB Hospital",
      address: "Healthcare Centre",
      doctors: 4,
      active: true
    }
  ];


  /* =======================================================
     ELEMENT HELPERS
     ======================================================= */

  const $ = (id) => document.getElementById(id);


  function showElement(element) {
    if (!element) return;
    element.classList.remove("hidden");
  }


  function hideElement(element) {
    if (!element) return;
    element.classList.add("hidden");
  }


  function setText(element, value) {
    if (!element) return;
    element.textContent = value;
  }


  /* =======================================================
     TOAST
     ======================================================= */

  function showToast(message, type = "info") {

    const container = $("toastContainer");

    if (!container) return;

    const toast = document.createElement("div");

    toast.className = `toast toast-${type}`;

    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("hide");

      setTimeout(() => {
        toast.remove();
      }, 300);

    }, 3000);
  }


  /* =======================================================
     MODALS
     ======================================================= */

  function openLoginModal() {

    const modal = $("loginModal");

    if (!modal) return;

    showElement(modal);

    switchAuthTab("login");
  }


  function closeLoginModal() {

    const modal = $("loginModal");

    if (!modal) return;

    hideElement(modal);
  }


  function openAppModal(title, content) {

    const modal = $("appModal");
    const titleElement = $("appModalTitle");
    const contentElement = $("appModalContent");

    if (!modal) return;

    setText(titleElement, title);

    if (contentElement) {
      contentElement.innerHTML = content;
    }

    showElement(modal);
  }


  function closeAppModal() {

    const modal = $("appModal");

    if (!modal) return;

    hideElement(modal);
  }


  /* =======================================================
     AUTH TABS
     ======================================================= */

  function switchAuthTab(tab) {

    const loginTab = $("loginTab");
    const registerTab = $("registerTab");

    const loginForm = $("loginForm");
    const registerForm = $("registerForm");

    const loginError = $("loginError");
    const registerError = $("registerError");

    if (tab === "login") {

      loginTab?.classList.add("active");
      registerTab?.classList.remove("active");

      showElement(loginForm);
      hideElement(registerForm);

      hideElement(loginError);
      hideElement(registerError);

    } else {

      loginTab?.classList.remove("active");
      registerTab?.classList.add("active");

      hideElement(loginForm);
      showElement(registerForm);

      hideElement(loginError);
      hideElement(registerError);
    }
  }


  /* =======================================================
     AUTH STATE
     ======================================================= */

  function loadSavedSession() {

    try {

      const savedUser =
        localStorage.getItem("opd_live_patient");

      if (!savedUser) {
        state.currentUser = null;
        state.isLoggedIn = false;
        return;
      }

      const user = JSON.parse(savedUser);

      if (user && user.id) {

        state.currentUser = user;
        state.isLoggedIn = true;

      }

    } catch (error) {

      console.error(
        "Session load error:",
        error
      );

      state.currentUser = null;
      state.isLoggedIn = false;
    }
  }


  function saveSession(user) {

    state.currentUser = user;
    state.isLoggedIn = true;

    localStorage.setItem(
      "opd_live_patient",
      JSON.stringify(user)
    );
  }


  function logout() {

    localStorage.removeItem(
      "opd_live_patient"
    );

    state.currentUser = null;
    state.isLoggedIn = false;

    updateAuthUI();

    showToast(
      "You have been logged out.",
      "success"
    );
  }


  /* =======================================================
     AUTH UI
     ======================================================= */

  function updateAuthUI() {

    const myOpdCard = $("myOpdCard");
    const loginRequired = $("loginRequired");

    if (state.isLoggedIn) {

      showElement(myOpdCard);
      hideElement(loginRequired);

    } else {

      hideElement(myOpdCard);
      showElement(loginRequired);
    }

    updateProfileButton();
  }


  function updateProfileButton() {

    const profileButton = $("profileButton");

    if (!profileButton) return;

    if (state.isLoggedIn) {

      profileButton.textContent = "👤";

      profileButton.setAttribute(
        "aria-label",
        "Patient Profile"
      );

    } else {

      profileButton.textContent = "👤";

      profileButton.setAttribute(
        "aria-label",
        "Login"
      );
    }
  }
  /* =======================================================
     PROFILE / LOGIN BUTTON
     ======================================================= */

  const profileButton = $("profileButton");

  if (profileButton) {

    profileButton.addEventListener("click", () => {

      if (state.isLoggedIn) {

        openAppModal(
          "Patient Profile",
          `
            <div class="profile-content">
              <h3>${state.currentUser?.name || "Patient"}</h3>
              <p>${state.currentUser?.email || ""}</p>
            </div>
          `
        );

      } else {

        openLoginModal();

      }

    });

  }

  /* =======================================================
     LOGIN
     ======================================================= */

  async function handleLogin(event) {

    event.preventDefault();

    const emailInput = $("loginEmail");
    const passwordInput = $("loginPassword");
    const errorElement = $("loginError");

    const email =
      emailInput?.value.trim() || "";

    const password =
      passwordInput?.value || "";

    if (!email || !password) {

      setText(
        errorElement,
        "Please enter your Patient ID/email and password."
      );

      showElement(errorElement);

      return;
    }


    /*
      Production API connection point.

      Backend ready hone ke baad yahan:

      fetch(`${API_BASE_URL}/auth/login`, {...})

      use hoga.
    */

    try {

  const { data, error } =
    await window.supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

  if (error) {
    throw error;
  }

  const authUser = data.user;

  const user = {
    id: authUser.id,
    name:
      authUser.user_metadata?.full_name ||
      authUser.email?.split("@")[0] ||
      "Patient",
    email: authUser.email || email,
    patientId: authUser.id
  };

  saveSession(user);

  closeLoginModal();

  updateAuthUI();

  updateMyOpd();

  showToast(
    "Login successful.",
    "success"
  );

  if (passwordInput) {
    passwordInput.value = "";
  }

} catch (error) {

  console.error(
    "Login error:",
    error
  );

  setText(
    errorElement,
    error.message ||
      "Unable to login. Please check your email and password."
  );

  showElement(errorElement);
    }


  /* =======================================================
     REGISTER
     ======================================================= */

  async function handleRegister(event) {

    event.preventDefault();

    const nameInput = $("registerName");
    const emailInput = $("registerEmail");
    const passwordInput = $("registerPassword");

    const errorElement = $("registerError");

    const name =
      nameInput?.value.trim() || "";

    const email =
      emailInput?.value.trim() || "";

    const password =
      passwordInput?.value || "";


    if (!name || !email || !password) {

      setText(
        errorElement,
        "Please fill all registration fields."
      );

      showElement(errorElement);

      return;
    }


    if (password.length < 6) {

      setText(
        errorElement,
        "Password must contain at least 6 characters."
      );

      showElement(errorElement);

      return;
    }


    try {

      /*
        Temporary patient profile for frontend testing.

        Production registration will be sent to:
        POST /api/auth/register
      */

      const user = {
        id: `PAT-${Date.now()}`,
        name: name,
        email: email,
        patientId: `PAT-${Date.now()}`
      };

      saveSession(user);

      closeLoginModal();

      updateAuthUI();

      updateMyOpd();

      showToast(
        "Patient account created successfully.",
        "success"
      );

      if (nameInput) nameInput.value = "";
      if (emailInput) emailInput.value = "";
      if (passwordInput) passwordInput.value = "";

    } catch (error) {

      console.error(
        "Registration error:",
        error
      );

      setText(
        errorElement,
        "Registration failed. Please try again."
      );

      showElement(errorElement);
    }
  }


  /* =======================================================
     LIVE DOCTOR DATA
     ======================================================= */

  function loadDoctors() {

    state.doctors = [...demoDoctors];

    renderDoctors();

    updateDoctorCount();
  }


  function renderDoctors() {

    const doctorList = $("doctorList");

    if (!doctorList) return;

    const search =
      state.currentSearch.toLowerCase().trim();


    let doctors = state.doctors;


    if (search) {

      doctors = doctors.filter((doctor) => {

        const text = [
          doctor.name,
          doctor.specialization,
          doctor.hospital,
          doctor.status
        ]
          .join(" ")
          .toLowerCase();

        return text.includes(search);
      });
    }


    if (doctors.length === 0) {

      doctorList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h4>No doctors found</h4>
          <p>Try another hospital, doctor or speciality.</p>
        </div>
      `;

      return;
    }


    doctorList.innerHTML = doctors
      .map(createDoctorCard)
      .join("");
  }


  function createDoctorCard(doctor) {

    const availabilityClass =
      doctor.available
        ? "available"
        : "not-available";


    const availabilityText =
      doctor.available
        ? "Available"
        : "Not Available";


    return `
      <article
        class="doctor-card"
        data-doctor-id="${escapeHTML(doctor.id)}"
      >

        <div class="doctor-card-header">

          <div class="doctor-avatar">
            👨‍⚕️
          </div>

          <div class="doctor-main">

            <h4>
              ${escapeHTML(doctor.name)}
            </h4>

            <p>
              ${escapeHTML(doctor.specialization)}
            </p>

            <span class="doctor-hospital">
              🏥 ${escapeHTML(doctor.hospital)}
            </span>

          </div>

          <span class="availability ${availabilityClass}">
            ${availabilityText}
          </span>

        </div>


        <div class="queue-info">

          <div class="queue-item">

            <span class="queue-label">
              Current OPD
            </span>

            <strong>
              ${escapeHTML(doctor.currentToken)}
            </strong>

          </div>


          <div class="queue-item">

            <span class="queue-label">
              Patients waiting
            </span>

            <strong>
              ${doctor.waiting}
            </strong>

          </div>


          <div class="queue-item">

            <span class="queue-label">
              Est. wait
            </span>

            <strong>
              ${escapeHTML(doctor.estimatedWait)}
            </strong>

          </div>

        </div>


        <div class="doctor-card-footer">

          <span class="doctor-status">
            ${escapeHTML(doctor.status)}
          </span>

          <button
            class="btn btn-primary doctor-details-button"
            type="button"
            data-doctor-id="${escapeHTML(doctor.id)}"
          >
            View OPD
          </button>

        </div>

      </article>
    `;
  }


  /* =======================================================
     DOCTOR DETAILS
     ======================================================= */

  function showDoctorDetails(doctorId) {

    const doctor =
      state.doctors.find(
        item => item.id === doctorId
      );

    if (!doctor) return;

    state.selectedDoctor = doctor;


    openAppModal(
      doctor.name,
      `
        <div class="doctor-detail">

          <div class="doctor-detail-avatar">
            👨‍⚕️
          </div>

          <h3>
            ${escapeHTML(doctor.name)}
          </h3>

          <p>
            ${escapeHTML(doctor.specialization)}
          </p>

          <p>
            🏥 ${escapeHTML(doctor.hospital)}
          </p>

          <hr>

          <div class="info-row">
            <span>Availability</span>
            <strong>
              ${escapeHTML(
                doctor.available
                  ? "Available"
                  : "Not Available"
              )}
            </strong>
          </div>

          <div class="info-row">
            <span>Current OPD</span>
            <strong>
              ${escapeHTML(doctor.currentToken)}
            </strong>
          </div>

          <div class="info-row">
            <span>Patients waiting</span>
            <strong>
              ${doctor.waiting}
            </strong>
          </div>

          <div class="info-row">
            <span>Estimated wait</span>
            <strong>
              ${escapeHTML(doctor.estimatedWait)}
            </strong>
          </div>

          <button
            class="btn btn-primary full-width"
            id="joinOpdButton"
            type="button"
          >
            ${state.isLoggedIn
              ? "Join OPD"
              : "Login to Join OPD"}
          </button>

        </div>
      `
    );


    setTimeout(() => {

      const joinButton =
        $("joinOpdButton");

      joinButton?.addEventListener(
        "click",
        () => {

          if (!state.isLoggedIn) {

            closeAppModal();
            openLoginModal();

            showToast(
              "Login is required to join an OPD.",
              "info"
            );

            return;
          }


          joinOpd(doctor);
        }
      );

    }, 0);
  }


  /* =======================================================
     JOIN OPD
     ======================================================= */

  function joinOpd(doctor) {

    if (!state.isLoggedIn) {

      closeAppModal();
      openLoginModal();

      return;
    }


    /*
      Production:
      POST /api/opd/join
    */

    const tokenNumber =
      doctor.currentNumber +
      doctor.waiting +
      1;


    const tokenPrefix =
      doctor.id === "DOC001"
        ? "A"
        : doctor.id === "DOC002"
          ? "G"
          : doctor.id === "DOC003"
            ? "C"
            : "P";


    const token =
      `${tokenPrefix}-${tokenNumber}`;


    const opdData = {

      token: token,

      doctorId: doctor.id,

      doctorName: doctor.name,

      hospital: doctor.hospital,

      ahead: doctor.waiting

    };


    localStorage.setItem(
      "opd_live_my_opd",
      JSON.stringify(opdData)
    );


    closeAppModal();

    updateMyOpd();

    showToast(
      `Your OPD number is ${token}.`,
      "success"
    );


    scrollToSection(
      $("myOpdSection")
    );
  }


  /* =======================================================
     MY OPD
     ======================================================= */

  function updateMyOpd() {

    const numberElement =
      $("myOpdNumber");

    const aheadElement =
      $("myOpdAhead");

    const doctorElement =
      $("myOpdDoctor");


    if (!state.isLoggedIn) {

      hideElement(
        $("myOpdCard")
      );

      showElement(
        $("loginRequired")
      );

      return;
    }


    showElement(
      $("myOpdCard")
    );

    hideElement(
      $("loginRequired")
    );


    let opdData = null;

    try {

      const saved =
        localStorage.getItem(
          "opd_live_my_opd"
        );

      if (saved) {
        opdData = JSON.parse(saved);
      }

    } catch (error) {

      console.error(
        "OPD data error:",
        error
      );
    }


    if (!opdData) {

      setText(
        numberElement,
        "—"
      );

      setText(
        aheadElement,
        "No active OPD"
      );

      setText(
        doctorElement,
        "Join an OPD to start tracking."
      );

      return;
    }


    setText(
      numberElement,
      opdData.token
    );

    setText(
      aheadElement,
      `${opdData.ahead} patients ahead`
    );

    setText(
      doctorElement,
      `${opdData.doctorName} • ${opdData.hospital}`
    );
  }


  /* =======================================================
     HOSPITALS
     ======================================================= */

  function loadHospitals() {

    state.hospitals =
      [...demoHospitals];

    renderHospitals();
  }


  function renderHospitals() {

    const hospitalList =
      $("hospitalList");

    if (!hospitalList) return;


    hospitalList.innerHTML =
      state.hospitals
        .map(hospital => {

          return `
            <div class="hospital-card">

              <div class="hospital-header">

                <div class="hospital-icon">
                  🏥
                </div>

                <div>

                  <h4>
                    ${escapeHTML(hospital.name)}
                  </h4>

                  <div class="hospital-address">
                    ${escapeHTML(hospital.address)}
                  </div>

                </div>

              </div>

              <div class="hospital-footer">

                <span>
                  ${hospital.doctors} Doctors
                </span>

                <span class="text-primary">
                  ${hospital.active
                    ? "OPD Active"
                    : "Closed"}
                </span>

              </div>

            </div>
          `;

        })
        .join("");
  }


  /* =======================================================
     OPD INFORMATION
     ======================================================= */

  function updateDoctorCount() {

    const count =
      $("doctorCount");

    if (!count) return;

    setText(
      count,
      state.doctors.length
    );
  }


  /* =======================================================
     SEARCH
     ======================================================= */

  function handleSearch(event) {

    state.currentSearch =
      event.target.value || "";

    renderDoctors();

    if (
      state.currentSearch.trim()
    ) {

      scrollToSection(
        $("liveSection")
      );
    }
  }


  /* =======================================================
     EXPLORE ACTIONS
     ======================================================= */

  function openHospitalView() {

    scrollToSection(
      $("hospitalSection")
    );

    showToast(
      "Hospital information opened.",
      "info"
    );
  }


  function openSpecialisationView() {

    openAppModal(
      "Specialisation",
      `
        <div class="specialisation-list">

          <button
            class="specialisation-option"
            data-specialisation="Cardiologist"
          >
            ❤️ Cardiologist
          </button>

          <button
            class="specialisation-option"
            data-specialisation="Gynecologist"
          >
            🩺 Gynecologist
          </button>

          <button
            class="specialisation-option"
            data-specialisation="Pediatrician"
          >
            👶 Pediatrician
          </button>

          <button
            class="specialisation-option"
            data-specialisation="Dermatologist"
          >
            🧴 Dermatologist
          </button>

          <button
            class="specialisation-option"
            data-specialisation="Orthopedic"
          >
            🦴 Orthopedic
          </button>

          <button
            class="specialisation-option"
            data-specialisation="Neurologist"
          >
            🧠 Neurologist
          </button>

          <button
            class="specialisation-option"
            data-specialisation="General Physician"
          >
            👨‍⚕️ General Physician
          </button>

        </div>
      `
    );


    setTimeout(() => {

      document
        .querySelectorAll(
          ".specialisation-option"
        )
        .forEach(button => {

          button.addEventListener(
            "click",
            () => {

              const value =
                button.dataset.specialisation;

              state.currentSearch =
                value;

              const searchInput =
                $("searchInput");

              if (searchInput) {
                searchInput.value =
                  value;
              }

              closeAppModal();

              renderDoctors();

              scrollToSection(
                $("liveSection")
              );
            }
          );

        });

    }, 0);
  }


  function openDoctorView() {

    scrollToSection(
      $("liveSection")
    );

    showToast(
      "Live doctors opened.",
      "info"
    );
  }


  function openEmergencyView() {

    scrollToSection(
      $("emergencySection")
    );

    showToast(
      "Emergency information opened.",
      "info"
    );
  }


  function openMyOpdView() {

    if (!state.isLoggedIn) {

      openLoginModal();

      showToast(
        "Login with your patient ID to access My OPD.",
        "info"
      );

      return;
    }

    scrollToSection(
      $("myOpdSection")
    );

    updateMyOpd();
  }


  /* =======================================================
     EMERGENCY
     ======================================================= */

  function handleEmergency() {

    openAppModal(
      "Emergency Help",
      `
        <div class="emergency-modal">

          <div class="emergency-big-icon">
            🚨
          </div>

          <h3>
            Medical Emergency
          </h3>

          <p>
            If you have a serious or life-threatening
            medical emergency, contact your nearest
            emergency service or hospital immediately.
          </p>

          <div class="emergency-actions">

            <a
              class="btn btn-danger full-width"
              href="tel:112"
            >
              Call Emergency — 112
            </a>

          </div>

        </div>
      `
    );
  }


  /* =======================================================
     NOTIFICATIONS
     ======================================================= */

  function showNotifications() {

    openAppModal(
      "Notifications",
      `
        <div class="notification-list">

          <div class="notification-item">
            <strong>OPD LIVE</strong>
            <p>
              Live OPD tracking is available.
            </p>
          </div>

          <div class="notification-item">
            <strong>Queue Updates</strong>
            <p>
              Your OPD status will appear here.
            </p>
          </div>

        </div>
      `
    );
  }


  /* =======================================================
     PROFILE
     ======================================================= */

  function showProfile() {

    if (!state.isLoggedIn) {

      openLoginModal();

      return;
    }


    const user =
      state.currentUser;


    openAppModal(
      "Patient Profile",
      `
        <div class="profile-view">

          <div class="profile-avatar">
            👤
          </div>

          <h3>
            ${escapeHTML(
              user.name || "Patient"
            )}
          </h3>

          <p>
            Patient ID:
            ${escapeHTML(
              user.patientId || user.id
            )}
          </p>

          <p>
            ${escapeHTML(
              user.email || ""
            )}
          </p>

          <button
            class="btn btn-primary full-width"
            id="logoutButton"
            type="button"
          >
            Logout
          </button>

        </div>
      `
    );


    setTimeout(() => {

      $("logoutButton")
        ?.addEventListener(
          "click",
          () => {

            closeAppModal();
            logout();

          }
        );

    }, 0);
  }


  /* =======================================================
     BOTTOM NAVIGATION
     ======================================================= */

  function setActiveNav(activeId) {

    document
      .querySelectorAll(
        ".nav-item"
      )
      .forEach(item => {

        item.classList.remove(
          "active"
        );

      });


    const active =
      $(activeId);

    active?.classList.add(
      "active"
    );
  }


  function setupNavigation() {

    $("navHome")
      ?.addEventListener(
        "click",
        () => {

          setActiveNav(
            "navHome"
          );

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }
      );


    $("navLive")
      ?.addEventListener(
        "click",
        () => {

          setActiveNav(
            "navLive"
          );

          scrollToSection(
            $("liveSection")
          );

        }
      );


    $("navMyOpd")
      ?.addEventListener(
        "click",
        () => {

          setActiveNav(
            "navMyOpd"
          );

          openMyOpdView();

        }
      );


    $("navProfile")
      ?.addEventListener(
        "click",
        () => {

          setActiveNav(
            "navProfile"
          );

          showProfile();

        }
      );
  }


  /* =======================================================
     SCROLL
     ======================================================= */

  function scrollToSection(element) {

    if (!element) return;

    element.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }


  /* =======================================================
     EVENT LISTENERS
     ======================================================= */

  function setupEventListeners() {

    $("searchInput")
      ?.addEventListener(
        "input",
        handleSearch
      );


    $("hospitalOption")
      ?.addEventListener(
        "click",
        openHospitalView
      );


    $("specialisationOption")
      ?.addEventListener(
        "click",
        openSpecialisationView
      );


    $("doctorOption")
      ?.addEventListener(
        "click",
        openDoctorView
      );


    $("emergencyOption")
      ?.addEventListener(
        "click",
        openEmergencyView
      );


    $("myOpdOption")
      ?.addEventListener(
        "click",
        openMyOpdView
      );


    $("viewAllDoctors")
      ?.addEventListener(
        "click",
        openDoctorView
      );


    $("notificationButton")
      ?.addEventListener(
        "click",
        showNotifications
      );


    $("profileButton")
      ?.addEventListener(
        "click",
        showProfile
      );


    $("loginRequiredButton")
      ?.addEventListener(
        "click",
        openLoginModal
      );


    $("closeLoginModal")
      ?.addEventListener(
        "click",
        closeLoginModal
      );


    $("closeAppModal")
      ?.addEventListener(
        "click",
        closeAppModal
      );


    $("loginTab")
      ?.addEventListener(
        "click",
        () => switchAuthTab("login")
      );


    $("registerTab")
      ?.addEventListener(
        "click",
        () => switchAuthTab("register")
      );


    $("loginForm")
      ?.addEventListener(
        "submit",
        handleLogin
      );


    $("registerForm")
      ?.addEventListener(
        "submit",
        handleRegister
      );


    $("emergencyButton")
      ?.addEventListener(
        "click",
        handleEmergency
      );


    $("doctorList")
      ?.addEventListener(
        "click",
        (event) => {

          const button =
            event.target.closest(
              ".doctor-details-button"
            );

          if (!button) return;

          const doctorId =
            button.dataset.doctorId;

          showDoctorDetails(
            doctorId
          );
        }
      );


    /* Close modal when clicking outside */

    $("loginModal")
      ?.addEventListener(
        "click",
        (event) => {

          if (
            event.target ===
            $("loginModal")
          ) {
            closeLoginModal();
          }

        }
      );


    $("appModal")
      ?.addEventListener(
        "click",
        (event) => {

          if (
            event.target ===
            $("appModal")
          ) {
            closeAppModal();
          }

        }
      );


    /* Escape key */

    document.addEventListener(
      "keydown",
      (event) => {

        if (event.key !== "Escape") {
          return;
        }

        closeLoginModal();
        closeAppModal();

      }
    );
  }


  /* =======================================================
     SECURITY HELPER
     ======================================================= */

  function escapeHTML(value) {

    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }


  /* =======================================================
     INITIALIZE APPLICATION
     ======================================================= */

  function init() {

    console.log(
      "OPD LIVE Patient App starting..."
    );


    loadSavedSession();

    loadDoctors();

    loadHospitals();

    updateAuthUI();

    updateMyOpd();

    setupEventListeners();


    console.log(
      "OPD LIVE Patient App ready."
    );
  }


  /* =======================================================
     START
     ======================================================= */

  init();

});
