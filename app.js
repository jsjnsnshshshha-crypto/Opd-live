/*
====================================================
OPD LIVE
Application Core
====================================================

This file is the foundation for:
- Patient App
- Doctor App
- Receptionist App
- Admin Panel
- Shared application state
- Authentication foundation
- OPD queue foundation
- Notifications foundation
- Future production API connection
*/

"use strict";


/* ==================================================
   APPLICATION CONFIGURATION
================================================== */

const OPD_CONFIG = {

    appName: "OPD LIVE",

    version: "1.0.0",

    environment: "development",

    maxActiveOPD: 4,

    defaultStartingOPD: 1,

    queueWarningNumbers: 5,

    storageKeys: {

        data: "opdLiveData",

        user: "opdLiveUser",

        session: "opdLiveSession"

    }

};


/* ==================================================
   STORAGE SERVICE
================================================== */

const OPDStorage = {

    get(key, fallback = null) {

        try {

            const value =
                localStorage.getItem(key);

            if (value === null) {
                return fallback;
            }

            return JSON.parse(value);

        } catch (error) {

            console.error(
                "OPD LIVE Storage Read Error:",
                error
            );

            return fallback;
        }

    },


    set(key, value) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                "OPD LIVE Storage Write Error:",
                error
            );

            return false;
        }

    },


    remove(key) {

        try {

            localStorage.removeItem(key);

            return true;

        } catch (error) {

            console.error(
                "OPD LIVE Storage Remove Error:",
                error
            );

            return false;
        }

    }

};


/* ==================================================
   ID GENERATOR
================================================== */

const OPDId = {

    create(prefix = "ID") {

        return (
            prefix +
            "_" +
            Date.now() +
            "_" +
            Math.random()
                .toString(36)
                .substring(2, 8)
                .toUpperCase()
        );

    }

};


/* ==================================================
   VALIDATION
================================================== */

const OPDValidation = {

    required(value) {

        return (
            value !== undefined &&
            value !== null &&
            String(value).trim() !== ""
        );

    },


    mobile(value) {

        return /^[0-9]{10}$/.test(
            String(value).replace(/\s/g, "")
        );

    },


    email(value) {

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(String(value));

    },


    password(value) {

        return (
            typeof value === "string" &&
            value.length >= 6
        );

    },


    age(value) {

        const age = Number(value);

        return (
            Number.isInteger(age) &&
            age >= 0 &&
            age <= 120
        );

    }

};


/* ==================================================
   OPD QUEUE SERVICE
================================================== */

const OPDQueue = {

    getPatientsAhead(
        patientNumber,
        currentNumber
    ) {

        return Math.max(
            0,
            Number(patientNumber) -
            Number(currentNumber)
        );

    },


    canMoveBack(
        currentNumber,
        startingNumber =
            OPD_CONFIG.defaultStartingOPD
    ) {

        return (
            Number(currentNumber) >
            Number(startingNumber)
        );

    },


    nextNumber(currentNumber) {

        return Number(currentNumber) + 1;

    },


    previousNumber(currentNumber) {

        return Math.max(
            OPD_CONFIG.defaultStartingOPD,
            Number(currentNumber) - 1
        );

    },


    approximateWaitingTime(
        patientsAhead,
        averageMinutesPerPatient = null
    ) {

        if (
            averageMinutesPerPatient === null ||
            !Number.isFinite(
                Number(averageMinutesPerPatient)
            )
        ) {

            return null;

        }

        const minutes =
            Number(patientsAhead) *
            Number(averageMinutesPerPatient);

        if (minutes <= 0) {
            return "Your number is approaching.";
        }

        const low =
            Math.max(5, Math.round(minutes * 0.8));

        const high =
            Math.max(
                low + 5,
                Math.round(minutes * 1.2)
            );

        return `${low}-${high} minutes approximately`;

    }

};


/* ==================================================
   USER / ROLE SERVICE
================================================== */

const OPDRoles = {

    PATIENT: "patient",

    DOCTOR: "doctor",

    RECEPTIONIST: "receptionist",

    HOSPITAL: "hospital",

    ADMIN: "admin",

    FOUNDER: "founder"

};


const OPDAuth = {

    getCurrentUser() {

        return OPDStorage.get(
            OPD_CONFIG.storageKeys.user,
            null
        );

    },


    isLoggedIn() {

        return !!this.getCurrentUser();

    },


    role() {

        const user =
            this.getCurrentUser();

        return user ? user.role : null;

    },


    isPatient() {

        return (
            this.role() ===
            OPDRoles.PATIENT
        );

    },


    isDoctor() {

        return (
            this.role() ===
            OPDRoles.DOCTOR
        );

    },


    isReceptionist() {

        return (
            this.role() ===
            OPDRoles.RECEPTIONIST
        );

    },


    isAdmin() {

        return (
            this.role() === OPDRoles.ADMIN ||
            this.role() === OPDRoles.FOUNDER
        );

    },


    logout() {

        OPDStorage.remove(
            OPD_CONFIG.storageKeys.user
        );

        OPDStorage.remove(
            OPD_CONFIG.storageKeys.session
        );

        window.dispatchEvent(
            new CustomEvent(
                "opd:logout"
            )
        );

    }

};


/* ==================================================
   PATIENT OPD LIMIT
================================================== */

const OPDPatient = {

    getActiveOPDs(user) {

        if (
            !user ||
            !Array.isArray(user.activeOPDs)
        ) {

            return [];

        }

        return user.activeOPDs.filter(
            opd =>
                opd &&
                opd.status === "active"
        );

    },


    canJoinAnotherOPD(
        user,
        limit = OPD_CONFIG.maxActiveOPD
    ) {

        const active =
            this.getActiveOPDs(user);

        return active.length < limit;

    },


    hasDoctorOPD(
        user,
        doctorId
    ) {

        const active =
            this.getActiveOPDs(user);

        return active.some(
            opd =>
                opd.doctorId === doctorId
        );

    }

};


/* ==================================================
   NOTIFICATION SERVICE
================================================== */

const OPDNotifications = {

    create({

        userId,

        type = "system",

        title = "OPD LIVE",

        message

    }) {

        return {

            id:
                OPDId.create("NOTIFY"),

            userId,

            type,

            title,

            message,

            read: false,

            createdAt:
                new Date().toISOString()

        };

    },


    queueMessage(
        patientNumber,
        currentNumber
    ) {

        const ahead =
            OPDQueue.getPatientsAhead(
                patientNumber,
                currentNumber
            );

        return {

            ahead,

            message:
                `Your OPD number is ${patientNumber}. ` +
                `Current OPD number is ${currentNumber}. ` +
                `There are approximately ${ahead} patients ahead of you.`

        };

    },


    approachingMessage(
        patientNumber,
        currentNumber
    ) {

        return {

            message:
                `Your OPD number ${patientNumber} ` +
                `is approaching. ` +
                `Current OPD number is ${currentNumber}. ` +
                `Please reach the hospital/clinic in time.`

        };

    }

};


/* ==================================================
   REALTIME EVENT BUS
==================================================

This provides the frontend event layer.

Later it will be connected to the real
production realtime backend.
*/

const OPDRealtime = {

    events: {},


    on(eventName, callback) {

        if (!this.events[eventName]) {

            this.events[eventName] = [];

        }

        this.events[eventName].push(callback);

    },


    emit(eventName, data) {

        const listeners =
            this.events[eventName] || [];

        listeners.forEach(
            callback => {

                try {

                    callback(data);

                } catch (error) {

                    console.error(
                        "OPD LIVE Event Error:",
                        error
                    );

                }

            }
        );

    },


    off(eventName, callback) {

        if (!this.events[eventName]) {
            return;
        }

        this.events[eventName] =
            this.events[eventName]
                .filter(
                    item =>
                        item !== callback
                );

    }

};


/* ==================================================
   SHARED APPLICATION STATE
================================================== */

const OPDState = {

    currentUser: null,

    currentRole: null,

    selectedDoctor: null,

    selectedHospital: null,

    loading: false,

    initialized: false,


    initialize() {

        this.currentUser =
            OPDAuth.getCurrentUser();

        this.currentRole =
            this.currentUser
                ? this.currentUser.role
                : null;

        this.initialized = true;

        OPDRealtime.emit(
            "state:initialized",
            this
        );

    },


    refreshUser() {

        this.currentUser =
            OPDAuth.getCurrentUser();

        this.currentRole =
            this.currentUser
                ? this.currentUser.role
                : null;

    }

};


/* ==================================================
   API SERVICE PLACEHOLDER
==================================================

IMPORTANT:

The application will NOT use this as the final
production backend.

This is intentionally separated so later we can
connect:

Frontend
   ↓
Secure API
   ↓
Production Backend
   ↓
Production Database
   ↓
Realtime service

without rewriting the whole application.
*/

const OPDApi = {

    baseURL: "",

    async request(
        endpoint,
        options = {}
    ) {

        if (!this.baseURL) {

            throw new Error(
                "Production API is not connected yet."
            );

        }

        const response =
            await fetch(
                this.baseURL + endpoint,
                {

                    method:
                        options.method || "GET",

                    headers: {

                        "Content-Type":
                            "application/json",

                        ...(options.headers || {})

                    },

                    body:
                        options.body
                            ? JSON.stringify(
                                options.body
                              )
                            : undefined

                }
            );

        if (!response.ok) {

            throw new Error(
                `API Error: ${response.status}`
            );

        }

        return response.json();

    }

};


/* ==================================================
   SECURITY HELPERS
================================================== */

const OPDSecurity = {

    escapeHTML(value) {

        if (value === null ||
            value === undefined) {

            return "";

        }

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    },


    sanitizeText(value) {

        return String(value || "")
            .trim()
            .replace(
                /[<>]/g,
                ""
            );

    }

};


/* ==================================================
   APP HELPERS
================================================== */

const OPDApp = {

    version() {

        return OPD_CONFIG.version;

    },


    isDevelopment() {

        return (
            OPD_CONFIG.environment ===
            "development"
        );

    },


    log(message, data = null) {

        if (
            OPD_CONFIG.environment ===
            "development"
        ) {

            if (data !== null) {

                console.log(
                    "[OPD LIVE]",
                    message,
                    data
                );

            } else {

                console.log(
                    "[OPD LIVE]",
                    message
                );

            }

        }

    }

};


/* ==================================================
   APPLICATION START
================================================== */

document.addEventListener(
    "DOMContentLoaded",
    () => {

        OPDState.initialize();

        OPDApp.log(
            "Application core loaded."
        );

        OPDApp.log(
            "Version:",
            OPD_CONFIG.version
        );

    }
);


/* ==================================================
   CROSS-TAB DATA REFRESH
================================================== */

window.addEventListener(
    "storage",
    event => {

        if (
            event.key ===
            OPD_CONFIG.storageKeys.user
        ) {

            OPDState.refreshUser();

            OPDRealtime.emit(
                "user:changed",
                OPDState.currentUser
            );

        }

    }
);


/* ==================================================
   GLOBAL ACCESS
================================================== */

window.OPDLive = {

    config: OPD_CONFIG,

    storage: OPDStorage,

    id: OPDId,

    validation: OPDValidation,

    queue: OPDQueue,

    roles: OPDRoles,

    auth: OPDAuth,

    patient: OPDPatient,

    notifications: OPDNotifications,

    realtime: OPDRealtime,

    state: OPDState,

    api: OPDApi,

    security: OPDSecurity,

    app: OPDApp

};


console.log(
    "OPD LIVE application core ready."
);
