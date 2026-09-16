/* =====================================================
   STUDYFLOW
   SCRIPT PRINCIPAL
===================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";

import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";


/* =====================================================
   FIREBASE
===================================================== */

const firebaseConfig = {
    apiKey: "AIzaSyCZT5mqAe_51jGQEf8c32pZG2KPkHad6Ew",
    authDomain: "syudyflow.firebaseapp.com",
    projectId: "syudyflow",
    storageBucket: "syudyflow.firebasestorage.app",
    messagingSenderId: "8547044265",
    appId: "1:8547044265:web:ff16de0c1d64eea57452b8",
    measurementId: "G-32LRCSB3H1"
};

const firebaseApp = initializeApp(firebaseConfig);

const auth = getAuth(firebaseApp);

const googleProvider =
    new GoogleAuthProvider();


/* =====================================================
   ESTADO GLOBAL
===================================================== */

let currentUser = null;

let authMode = "login";

let tasks = [];

let events = [];

let currentFilter = "all";

let currentCalendarDate = new Date();

let selectedDate = new Date();

let editingTaskId = null;

let editingEventId = null;


/* =====================================================
   FUNÇÕES AUXILIARES
===================================================== */

const $ = id =>
    document.getElementById(id);


function safeAddEventListener(
    element,
    event,
    callback
) {

    if (!element) {
        return;
    }

    element.addEventListener(
        event,
        callback
    );
}


function escapeHTML(text) {

    const div =
        document.createElement("div");

    div.textContent =
        text ?? "";

    return div.innerHTML;
}


function capitalize(text) {

    if (!text) {
        return "";
    }

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );
}


function dateToString(date) {

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


function createDateString(
    year,
    month,
    day
) {

    return dateToString(
        new Date(
            year,
            month,
            day
        )
    );
}


function formatDate(dateString) {

    if (!dateString) {
        return "Sem prazo";
    }

    const date =
        new Date(
            `${dateString}T00:00:00`
        );

    return date.toLocaleDateString(
        "pt-BR"
    );
}


function isToday(dateString) {

    return (
        dateString ===
        dateToString(
            new Date()
        )
    );
}


function isSameDate(
    date1,
    date2
) {

    return date1 === date2;
}


/* =====================================================
   ELEMENTOS
===================================================== */

const authScreen =
    $("authScreen");

const authForm =
    $("authForm");

const authName =
    $("authName");

const authNameContainer =
    $("authNameContainer");

const authEmail =
    $("authEmail");

const authPassword =
    $("authPassword");

const emailSubmit =
    $("emailSubmit");

const googleLogin =
    $("googleLogin");

const toggleAuthMode =
    $("toggleAuthMode");

const authModeText =
    $("authModeText");

const authMessage =
    $("authMessage");


/* =====================================================
   MENSAGEM DE AUTENTICAÇÃO
===================================================== */

function showAuthMessage(message) {

    if (authMessage) {
        authMessage.textContent =
            message;
    }
}


/* =====================================================
   BOTÃO DE LOGIN
===================================================== */

function updateAuthButton() {

    if (
        !authEmail ||
        !authPassword ||
        !emailSubmit
    ) {
        return;
    }

    const email =
        authEmail.value.trim();

    const password =
        authPassword.value;

    const name =
        authName
            ? authName.value.trim()
            : "";


    if (authMode === "login") {

        emailSubmit.disabled =
            !email ||
            password.length === 0;

        return;
    }


    emailSubmit.disabled =
        !name ||
        !email ||
        password.length < 6;
}


/* =====================================================
   ALTERAR LOGIN / CADASTRO
===================================================== */

function updateAuthMode() {

    const register =
        authMode === "register";


    if (authNameContainer) {

        authNameContainer.style.display =
            register
                ? "block"
                : "none";
    }


    if (emailSubmit) {

        emailSubmit.textContent =
            register
                ? "Criar conta"
                : "Entrar";
    }


    if (authModeText) {

        authModeText.textContent =
            register
                ? "Já possui uma conta?"
                : "Não possui uma conta?";
    }


    if (toggleAuthMode) {

        toggleAuthMode.textContent =
            register
                ? "Entrar"
                : "Criar conta";
    }


    showAuthMessage("");

    updateAuthButton();
}


/* =====================================================
   AUTENTICAÇÃO POR E-MAIL
===================================================== */

safeAddEventListener(
    authEmail,
    "input",
    updateAuthButton
);

safeAddEventListener(
    authPassword,
    "input",
    updateAuthButton
);

safeAddEventListener(
    authName,
    "input",
    updateAuthButton
);


safeAddEventListener(
    toggleAuthMode,
    "click",
    () => {

        authMode =
            authMode === "login"
                ? "register"
                : "login";

        updateAuthMode();
    }
);


/* =====================================================
   LOGIN / CADASTRO
===================================================== */

safeAddEventListener(
    authForm,
    "submit",
    async event => {

        event.preventDefault();


        const email =
            authEmail.value.trim();

        const password =
            authPassword.value;

        const name =
            authName
                ? authName.value.trim()
                : "";


        if (!email || !password) {
            return;
        }


        emailSubmit.disabled =
            true;

        showAuthMessage("");


        try {

            if (authMode === "login") {

                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

                return;
            }


            if (!name) {

                showAuthMessage(
                    "Digite seu nome."
                );

                return;
            }


            if (password.length < 6) {

                showAuthMessage(
                    "A senha precisa ter pelo menos 6 caracteres."
                );

                return;
            }


            const credential =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            await updateProfile(
                credential.user,
                {
                    displayName: name
                }
            );


            await credential.user.reload();


        } catch (error) {

            console.error(
                "Erro de autenticação:",
                error
            );


            switch (error.code) {

                case "auth/user-not-found":

                    showAuthMessage(
                        "Usuário não encontrado."
                    );

                    break;


                case "auth/invalid-credential":

                    showAuthMessage(
                        "Usuário não encontrado ou senha incorreta."
                    );

                    break;


                case "auth/wrong-password":

                    showAuthMessage(
                        "Senha incorreta."
                    );

                    break;


                case "auth/email-already-in-use":

                    showAuthMessage(
                        "Esse e-mail já possui uma conta."
                    );

                    break;


                case "auth/invalid-email":

                    showAuthMessage(
                        "Digite um e-mail válido."
                    );

                    break;


                case "auth/weak-password":

                    showAuthMessage(
                        "A senha precisa ter pelo menos 6 caracteres."
                    );

                    break;


                default:

                    showAuthMessage(
                        "Não foi possível acessar a conta."
                    );
            }


        } finally {

            updateAuthButton();
        }
    }
);


/* =====================================================
   GOOGLE
===================================================== */

async function loginWithGoogle() {

    showAuthMessage(
        "Abrindo login do Google..."
    );


    try {

        await signInWithPopup(
            auth,
            googleProvider
        );

    } catch (error) {

        console.error(
            "Erro no Google:",
            error
        );


        if (
            error.code ===
            "auth/popup-closed-by-user"
        ) {

            showAuthMessage(
                "A janela de login foi fechada."
            );

        } else if (
            error.code ===
            "auth/popup-blocked"
        ) {

            showAuthMessage(
                "O navegador bloqueou a janela de login."
            );

        } else {

            showAuthMessage(
                "Não foi possível entrar com o Google."
            );
        }
    }
}


safeAddEventListener(
    googleLogin,
    "click",
    loginWithGoogle
);


/* =====================================================
   PERFIL
===================================================== */

function updateProfileInitial(name) {

    const initial =
        name
            ?.trim()
            .charAt(0)
            .toUpperCase() || "S";


    const profileInitial =
        $("profileInitial");

    const headerInitial =
        $("headerProfileInitial");


    if (profileInitial) {

        profileInitial.textContent =
            initial;
    }


    if (headerInitial) {

        headerInitial.textContent =
            initial;
    }
}


function loadUserProfile(user) {

    if (!user) {
        return;
    }


    const name =
        user.displayName ||
        "Estudante";

    const email =
        user.email ||
        "Conta StudyFlow";


    const profileName =
        $("profileName");

    const profileEmail =
        $("profileEmail");

    const welcomeName =
        $("welcomeName");


    if (profileName) {

        profileName.textContent =
            name;
    }


    if (profileEmail) {

        profileEmail.textContent =
            email;
    }


    if (welcomeName) {

        welcomeName.textContent =
            name;
    }


    updateProfileInitial(name);
}


/* =====================================================
   DADOS
===================================================== */

function getTasksKey() {

    return currentUser
        ? `studyflow_tasks_${currentUser.uid}`
        : null;
}


function getEventsKey() {

    return currentUser
        ? `studyflow_events_${currentUser.uid}`
        : null;
}


function saveTasks() {

    const key =
        getTasksKey();

    if (!key) {
        return;
    }

    localStorage.setItem(
        key,
        JSON.stringify(tasks)
    );
}


function saveEvents() {

    const key =
        getEventsKey();

    if (!key) {
        return;
    }

    localStorage.setItem(
        key,
        JSON.stringify(events)
    );
}


function loadUserData(user) {

    if (!user) {
        tasks = [];
        events = [];
        return;
    }


    const storedTasks =
        localStorage.getItem(
            `studyflow_tasks_${user.uid}`
        );

    const storedEvents =
        localStorage.getItem(
            `studyflow_events_${user.uid}`
        );


    try {

        tasks =
            storedTasks
                ? JSON.parse(storedTasks)
                : [];

        events =
            storedEvents
                ? JSON.parse(storedEvents)
                : [];


        if (!Array.isArray(tasks)) {
            tasks = [];
        }

        if (!Array.isArray(events)) {
            events = [];
        }

    } catch (error) {

        console.error(
            "Erro ao carregar dados:",
            error
        );

        tasks = [];
        events = [];
    }
}


/* =====================================================
   NAVEGAÇÃO
===================================================== */

function showScreen(screenName) {

    document
        .querySelectorAll(".screen")
        .forEach(screen => {

            screen.classList.toggle(
                "active",
                screen.id === screenName
            );
        });


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.screen ===
                screenName
            );
        });


    if (screenName === "calendar") {

        renderCalendar();
        renderSelectedDay();
    }


    if (screenName === "progress") {

        updateStats();
        updateStudyTotals();
    }

    if (screenName === "subjects") {
    updateSubjects();
    }
}


document
    .querySelectorAll(
        ".nav-item[data-screen], [data-screen]"
    )
    .forEach(button => {

        safeAddEventListener(
            button,
            "click",
            () => {

                const screen =
                    button.dataset.screen;

                if (screen) {
                    showScreen(screen);
                }
            }
        );
    });


/* =====================================================
   DATA
===================================================== */

function updateDate() {

    const element =
        $("currentDate");

    if (!element) {
        return;
    }


    element.textContent =
        new Date().toLocaleDateString(
            "pt-BR",
            {
                weekday: "long",
                day: "numeric",
                month: "long"
            }
        );
}


/* =====================================================
   TAREFAS
===================================================== */

function getPriorityLabel(priority) {

    if (priority === "high") {
        return "alta";
    }

    if (priority === "low") {
        return "baixa";
    }

    return "normal";
}


function createTaskElement(
    task,
    compact = false
) {

    const element =
        document.createElement("div");


    element.className =
        "task";


    if (task.completed) {
        element.classList.add("completed");
    }


    element.innerHTML = `
        <span
            class="priority-dot priority-${task.priority}"
            title="Prioridade ${getPriorityLabel(task.priority)}"
        ></span>

        <button
            class="task-check"
            type="button"
            title="${task.completed ? "Desmarcar tarefa" : "Concluir tarefa"}"
        >
            ${task.completed ? "✓" : ""}
        </button>

        <div class="task-info">

            <h3>
                ${escapeHTML(task.title)}
            </h3>

            <p>
                ${escapeHTML(task.subject)}
                ${
                    task.date
                        ? ` • ${formatDate(task.date)}`
                        : ""
                }
            </p>

        </div>

        ${
            compact
                ? ""
                : `
                    <div class="task-actions">

                        <button
                            class="edit-task"
                            type="button"
                            title="Editar tarefa"
                        >
                            ✎
                        </button>

                        <button
                            class="delete-task"
                            type="button"
                            title="Excluir tarefa"
                        >
                            ×
                        </button>

                    </div>
                `
        }
    `;


    safeAddEventListener(
        element.querySelector(".task-check"),
        "click",
        () => toggleTask(task.id)
    );


    if (!compact) {

        safeAddEventListener(
            element.querySelector(".edit-task"),
            "click",
            () => editTask(task.id)
        );


        safeAddEventListener(
            element.querySelector(".delete-task"),
            "click",
            () => deleteTask(task.id)
        );
    }


    return element;
}


function renderTasks() {

    const taskList =
        $("taskList");

    const homeTaskList =
        $("homeTaskList");

    const emptyTasks =
        $("emptyTasks");


    if (!taskList || !homeTaskList) {
        return;
    }


    taskList.innerHTML = "";
    homeTaskList.innerHTML = "";


    let filtered =
        [...tasks];


    if (currentFilter === "pending") {

        filtered =
            tasks.filter(
                task => !task.completed
            );
    }


    if (currentFilter === "completed") {

        filtered =
            tasks.filter(
                task => task.completed
            );
    }


    if (emptyTasks) {

        emptyTasks.style.display =
            filtered.length === 0
                ? "block"
                : "none";
    }


    filtered.forEach(task => {

        taskList.appendChild(
            createTaskElement(task)
        );
    });


    tasks
        .filter(task => !task.completed)
        .slice(0, 4)
        .forEach(task => {

            homeTaskList.appendChild(
                createTaskElement(
                    task,
                    true
                )
            );
        });


    updateStats();
    renderCalendar();
    renderSelectedDay();
    updateNextEvent();
    updateSubjects();
}

function updateSubjects() {

    const subjectCards = document.querySelectorAll(".subject-card");

    subjectCards.forEach(card => {

        const subject = card.dataset.subject;

        if (!subject) return;

        const subjectTasks = tasks.filter(task => {
            return task.subject === subject;
        });

        const pendingTasks = subjectTasks.filter(task => {
            return !task.completed;
        });

        const completedTasks = subjectTasks.filter(task => {
            return task.completed;
        });

        const pendingElement = card.querySelector(".subject-pending");
        const completedElement = card.querySelector(".subject-completed");

        if (pendingElement) {
            pendingElement.textContent =
                `${pendingTasks.length} ${pendingTasks.length === 1 ? "tarefa pendente" : "tarefas pendentes"}`;
        }

        if (completedElement) {
            completedElement.textContent =
                `${completedTasks.length} ${completedTasks.length === 1 ? "concluída" : "concluídas"}`;
        }

    });

}

function toggleTask(id) {

    tasks =
        tasks.map(task => {

            if (task.id === id) {

                return {
                    ...task,
                    completed:
                        !task.completed
                };
            }

            return task;
        });


    saveTasks();
    renderTasks();
}


function deleteTask(id) {

    if (
        !confirm(
            "Deseja realmente excluir esta tarefa?"
        )
    ) {
        return;
    }


    tasks =
        tasks.filter(
            task => task.id !== id
        );


    saveTasks();
    renderTasks();
}


function editTask(id) {

    const task =
        tasks.find(
            item => item.id === id
        );


    if (!task) {
        return;
    }


    editingTaskId = id;


    const title =
        $("taskTitle");

    const subject =
        $("taskSubject");

    const date =
        $("taskDate");

    const priority =
        $("taskPriority");


    if (title) title.value = task.title;
    if (subject) subject.value = task.subject;
    if (date) date.value = task.date || "";
    if (priority) priority.value = task.priority;


    const modalTitle =
        $("taskModalTitle");

    const submit =
        $("taskSubmitButton");


    if (modalTitle) {
        modalTitle.textContent =
            "Editar tarefa";
    }


    if (submit) {
        submit.textContent =
            "Salvar alterações";
    }


    $("taskModal")?.classList.add(
        "active"
    );
}


/* =====================================================
   MODAL DE TAREFA
===================================================== */

safeAddEventListener(
    $("openTaskModal"),
    "click",
    () => {

        editingTaskId = null;

        $("taskForm")?.reset();

        $("taskModalTitle").textContent =
            "Nova tarefa";

        $("taskSubmitButton").textContent =
            "Criar tarefa";

        $("taskModal")?.classList.add(
            "active"
        );
    }
);


safeAddEventListener(
    $("closeTaskModal"),
    "click",
    () => {

        $("taskModal")?.classList.remove(
            "active"
        );

        editingTaskId = null;

        $("taskForm")?.reset();

        $("taskModalTitle").textContent =
            "Nova tarefa";

        $("taskSubmitButton").textContent =
            "Criar tarefa";
    }
);


safeAddEventListener(
    $("taskForm"),
    "submit",
    event => {

        event.preventDefault();


        const title =
            $("taskTitle")?.value.trim();

        const subject =
            $("taskSubject")?.value;

        const date =
            $("taskDate")?.value;

        const priority =
            $("taskPriority")?.value;


        if (!title) {
            return;
        }


        if (editingTaskId !== null) {

            tasks =
                tasks.map(task => {

                    if (
                        task.id ===
                        editingTaskId
                    ) {

                        return {
                            ...task,
                            title,
                            subject,
                            date,
                            priority
                        };
                    }

                    return task;
                });

        } else {

            tasks.push({
                id: Date.now(),
                title,
                subject,
                date,
                priority,
                completed: false
            });
        }


        saveTasks();
        renderTasks();


        $("taskForm")?.reset();
        $("taskModal")?.classList.remove(
            "active"
        );


        editingTaskId = null;


        $("taskModalTitle").textContent =
            "Nova tarefa";

        $("taskSubmitButton").textContent =
            "Criar tarefa";
    }
);


/* =====================================================
   FILTROS
===================================================== */

document
    .querySelectorAll(".filter")
    .forEach(button => {

        safeAddEventListener(
            button,
            "click",
            () => {

                document
                    .querySelectorAll(".filter")
                    .forEach(
                        item =>
                            item.classList.remove(
                                "active"
                            )
                    );


                button.classList.add(
                    "active"
                );


                currentFilter =
                    button.dataset.filter;


                renderTasks();
            }
        );
    });


/* =====================================================
   ESTATÍSTICAS
===================================================== */

function updateStats() {

    const completed =
        tasks.filter(
            task => task.completed
        ).length;


    const pending =
        tasks.filter(
            task => !task.completed
        ).length;


    const total =
        tasks.length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                completed / total * 100
            );


    const values = {
        completedCount: completed,
        pendingCount: pending,
        dailyPercentage: `${percentage}%`,
        progressCompleted: completed,
        progressPending: pending,
        progressTotal: `${percentage}%`,
        largeProgressText:
            `${completed} de ${total} tarefas concluídas`
    };


    Object.entries(values)
        .forEach(
            ([id, value]) => {

                const element =
                    $(id);

                if (element) {
                    element.textContent =
                        value;
                }
            }
        );


    const bar =
        $("largeProgressBar");

    if (bar) {
        bar.style.width =
            `${percentage}%`;
    }


    const circle =
        document.querySelector(
            ".progress-circle"
        );


    if (circle) {

        circle.style.background =
            `conic-gradient(
                var(--primary)
                ${percentage * 3.6}deg,
                var(--primary-light)
                ${percentage * 3.6}deg
            )`;
    }


    const description =
        $("progressDescription");


    if (!description) {
        return;
    }


    if (total === 0) {

        description.textContent =
            "Você ainda não possui tarefas.";

    } else if (percentage === 100) {

        description.textContent =
            "Todas as tarefas foram concluídas!";

    } else {

        description.textContent =
            `${pending} tarefa(s) ainda precisam de atenção.`;
    }
}


/* =====================================================
   CALENDÁRIO
===================================================== */

function renderCalendar() {

    const grid =
        $("calendarGrid");

    const monthTitle =
        $("calendarMonth");


    if (!grid || !monthTitle) {
        return;
    }


    grid.innerHTML = "";


    const year =
        currentCalendarDate.getFullYear();

    const month =
        currentCalendarDate.getMonth();


    monthTitle.textContent =
        capitalize(
            currentCalendarDate.toLocaleDateString(
                "pt-BR",
                {
                    month: "long",
                    year: "numeric"
                }
            )
        );


    const firstDay =
        new Date(
            year,
            month,
            1
        ).getDay();


    const daysInMonth =
        new Date(
            year,
            month + 1,
            0
        ).getDate();


    for (
        let i = 0;
        i < firstDay;
        i++
    ) {

        grid.appendChild(
            document.createElement("div")
        );
    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const cell =
            document.createElement("div");


        cell.className =
            "calendar-day";


        const dateString =
            createDateString(
                year,
                month,
                day
            );


        if (isToday(dateString)) {

            cell.classList.add(
                "today"
            );
        }


        if (
            isSameDate(
                dateString,
                dateToString(selectedDate)
            )
        ) {

            cell.classList.add(
                "selected"
            );
        }


        cell.innerHTML = `
            <div class="day-number">
                ${day}
            </div>

            <div class="calendar-items"></div>
        `;


        const items =
            cell.querySelector(
                ".calendar-items"
            );


        tasks
            .filter(
                task =>
                    task.date === dateString &&
                    !task.completed
            )
            .forEach(task => {

                const item =
                    document.createElement("div");

                item.className =
                    "calendar-item calendar-task";

                item.textContent =
                    task.title;

                items.appendChild(item);
            });


        events
            .filter(
                event =>
                    event.date === dateString
            )
            .forEach(event => {

                const item =
                    document.createElement("div");

                item.className =
                    "calendar-item calendar-event";

                item.textContent =
                    event.title;

                items.appendChild(item);
            });


        cell.addEventListener(
            "click",
            () => {

                selectedDate =
                    new Date(
                        year,
                        month,
                        day
                    );

                renderCalendar();
                renderSelectedDay();
            }
        );


        grid.appendChild(cell);
    }
}


safeAddEventListener(
    $("previousMonth"),
    "click",
    () => {

        currentCalendarDate.setMonth(
            currentCalendarDate.getMonth() - 1
        );

        renderCalendar();
    }
);


safeAddEventListener(
    $("nextMonth"),
    "click",
    () => {

        currentCalendarDate.setMonth(
            currentCalendarDate.getMonth() + 1
        );

        renderCalendar();
    }
);


/* =====================================================
   DIA SELECIONADO
===================================================== */

function renderSelectedDay() {

    const container =
        $("selectedDayContent");

    const title =
        $("selectedDateTitle");


    if (!container || !title) {
        return;
    }


    const dateString =
        dateToString(selectedDate);


    title.textContent =
        selectedDate.toLocaleDateString(
            "pt-BR",
            {
                day: "numeric",
                month: "long",
                year: "numeric"
            }
        );


    container.innerHTML = "";


    const dayTasks =
        tasks.filter(
            task =>
                task.date === dateString &&
                !task.completed
        );


    const dayEvents =
        events.filter(
            event =>
                event.date === dateString
        );


    if (
        dayTasks.length === 0 &&
        dayEvents.length === 0
    ) {

        container.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">
                    ○
                </div>

                <h3>
                    Nada agendado
                </h3>

                <p>
                    Não há tarefas ou eventos neste dia.
                </p>

            </div>
        `;

        return;
    }


    dayEvents.forEach(event => {

        const element =
            document.createElement("div");


        element.className =
            "day-event";


        element.innerHTML = `
            <div class="day-event-content">

                <strong>
                    📌 ${escapeHTML(event.title)}
                </strong>

                <p>
                    ${escapeHTML(
                        event.description ||
                        "Sem descrição."
                    )}
                </p>

            </div>

            <div class="day-event-actions">

                <button
                    class="edit-event"
                    type="button"
                >
                    ✎
                </button>

                <button
                    class="delete-event"
                    type="button"
                >
                    ×
                </button>

            </div>
        `;


        safeAddEventListener(
            element.querySelector(
                ".edit-event"
            ),
            "click",
            () => editEvent(event.id)
        );


        safeAddEventListener(
            element.querySelector(
                ".delete-event"
            ),
            "click",
            () => deleteEvent(event.id)
        );


        container.appendChild(element);
    });


    dayTasks.forEach(task => {

        const element =
            document.createElement("div");


        element.className =
            "day-event";


        element.innerHTML = `
            <div class="day-event-content">

                <strong>
                    ✓ ${escapeHTML(task.title)}
                </strong>

                <p>
                    ${escapeHTML(task.subject)}
                    • Prioridade:
                    ${getPriorityLabel(task.priority)}
                </p>

            </div>

            <div class="day-event-actions">

                <button
                    class="edit-task-day"
                    type="button"
                >
                    ✎
                </button>

                <button
                    class="complete-task-day"
                    type="button"
                >
                    ✓
                </button>

            </div>
        `;


        safeAddEventListener(
            element.querySelector(
                ".edit-task-day"
            ),
            "click",
            () => editTask(task.id)
        );


        safeAddEventListener(
            element.querySelector(
                ".complete-task-day"
            ),
            "click",
            () => toggleTask(task.id)
        );


        container.appendChild(element);
    });
}


/* =====================================================
   EVENTOS
===================================================== */

safeAddEventListener(
    $("openEventModal"),
    "click",
    () => {

        editingEventId = null;

        $("eventForm")?.reset();

        $("eventModalTitle").textContent =
            "Novo evento";

        $("eventSubmitButton").textContent =
            "Criar evento";

        $("eventModal")?.classList.add(
            "active"
        );
    }
);


safeAddEventListener(
    $("closeEventModal"),
    "click",
    () => {

        $("eventModal")?.classList.remove(
            "active"
        );

        editingEventId = null;

        $("eventForm")?.reset();

        $("eventModalTitle").textContent =
            "Novo evento";

        $("eventSubmitButton").textContent =
            "Criar evento";
    }
);


function editEvent(id) {

    const event =
        events.find(
            item => item.id === id
        );


    if (!event) {
        return;
    }


    editingEventId = id;


    $("eventTitle").value =
        event.title;

    $("eventDescription").value =
        event.description || "";

    $("eventDate").value =
        event.date;


    $("eventModalTitle").textContent =
        "Editar evento";

    $("eventSubmitButton").textContent =
        "Salvar alterações";


    $("eventModal")?.classList.add(
        "active"
    );
}


function deleteEvent(id) {

    if (
        !confirm(
            "Deseja realmente excluir este evento?"
        )
    ) {
        return;
    }


    events =
        events.filter(
            event => event.id !== id
        );


    saveEvents();

    renderCalendar();
    renderSelectedDay();
    updateNextEvent();
}


safeAddEventListener(
    $("eventForm"),
    "submit",
    event => {

        event.preventDefault();


        const title =
            $("eventTitle")?.value.trim();

        const description =
            $("eventDescription")?.value.trim();

        const date =
            $("eventDate")?.value;


        if (!title || !date) {
            return;
        }


        if (editingEventId !== null) {

            events =
                events.map(event => {

                    if (
                        event.id ===
                        editingEventId
                    ) {

                        return {
                            ...event,
                            title,
                            description,
                            date
                        };
                    }

                    return event;
                });

        } else {

            events.push({
                id: Date.now(),
                title,
                description,
                date
            });
        }


        saveEvents();


        $("eventForm")?.reset();

        $("eventModal")?.classList.remove(
            "active"
        );


        editingEventId = null;


        $("eventModalTitle").textContent =
            "Novo evento";

        $("eventSubmitButton").textContent =
            "Criar evento";


        renderCalendar();
        renderSelectedDay();
        updateNextEvent();
    }
);


/* =====================================================
   PRÓXIMO EVENTO
===================================================== */

function updateNextEvent() {

    const container =
        $("nextEvent");


    if (!container) {
        return;
    }


    const today =
        dateToString(new Date());


    const upcomingEvents =
        events
            .filter(
                event =>
                    event.date >= today
            )
            .sort(
                (a, b) =>
                    a.date.localeCompare(
                        b.date
                    )
            );


    const upcomingTasks =
        tasks
            .filter(
                task =>
                    !task.completed &&
                    task.date &&
                    task.date >= today
            )
            .sort(
                (a, b) =>
                    a.date.localeCompare(
                        b.date
                    )
            );


    if (
        !upcomingEvents.length &&
        !upcomingTasks.length
    ) {

        container.innerHTML = `
            <div class="empty-icon">
                ○
            </div>

            <h3>
                Nada agendado
            </h3>

            <p>
                Sua agenda está tranquila.
            </p>
        `;

        return;
    }


    const event =
        upcomingEvents[0];

    const task =
        upcomingTasks[0];


    let item;


    if (
        !task ||
        (
            event &&
            event.date < task.date
        )
    ) {

        item = {
            title: event.title,
            date: event.date,
            type: "Evento"
        };

    } else {

        item = {
            title: task.title,
            date: task.date,
            type: "Tarefa"
        };
    }


    container.innerHTML = `
        <div class="empty-icon">
            ${item.type === "Evento" ? "📌" : "✓"}
        </div>

        <h3>
            ${escapeHTML(item.title)}
        </h3>

        <p>
            ${item.type}
            • ${formatDate(item.date)}
        </p>
    `;
}


/* =====================================================
   CRONÔMETRO DE FOCO
===================================================== */

const focusSetup =
    $("focusSetup");

const focusTimer =
    $("focusTimer");

const focusComplete =
    $("focusComplete");

const focusTime =
    $("focusTime");

const focusStatus =
    $("focusStatus");

const startFocus =
    $("startFocus");

const pauseFocus =
    $("pauseFocus");

const stopFocus =
    $("stopFocus");

const newFocus =
    $("newFocus");

const focusCustomMinutes =
    $("focusCustomMinutes");

const todayStudyTime =
    $("todayStudyTime");

const todayStudySessions =
    $("todayStudySessions");

const focusCompleteMessage =
    $("focusCompleteMessage");

const focusPresets =
    document.querySelectorAll(
        ".focus-preset"
    );


let focusSelectedMinutes = 25;

let focusTotalSeconds =
    25 * 60;

let focusRemainingSeconds =
    25 * 60;

let focusInterval = null;

let focusRunning = false;

let focusPaused = false;


/* =====================================================
   ARMAZENAMENTO DO FOCO
===================================================== */

function getStudyStorageKey() {

    return currentUser
        ? `studyflow_focus_${currentUser.uid}`
        : "studyflow_focus_guest";
}


function getTodayKey() {

    return dateToString(
        new Date()
    );
}


function getTodayStudyData() {

    const key =
        getStudyStorageKey();


    let data = {};


    try {

        data =
            JSON.parse(
                localStorage.getItem(key)
            ) || {};

    } catch {

        data = {};
    }


    const today =
        getTodayKey();


    if (!data[today]) {

        data[today] = {
            seconds: 0,
            sessions: 0
        };
    }


    return {
        all: data,
        today: data[today]
    };
}


function saveStudyData(data) {

    localStorage.setItem(
        getStudyStorageKey(),
        JSON.stringify(data)
    );
}


/* =====================================================
   TOTAL ESTUDADO
===================================================== */

function updateStudyTotals() {

    const data =
        getTodayStudyData();


    const totalSeconds =
        data.today.seconds;


    const hours =
        Math.floor(
            totalSeconds / 3600
        );


    const minutes =
        Math.floor(
            (totalSeconds % 3600) / 60
        );


    const formatted =
        `${hours}h ${String(minutes).padStart(2, "0")}min`;


    if (todayStudyTime) {

        todayStudyTime.textContent =
            formatted;
    }


    if (todayStudySessions) {

        todayStudySessions.textContent =
            data.today.sessions;
    }


    const homeStudyTime =
        $("homeStudyTime");


    if (homeStudyTime) {

        homeStudyTime.textContent =
            formatted;
    }
}


/* =====================================================
   DISPLAY DO CRONÔMETRO
===================================================== */

function formatFocusTime(seconds) {

    seconds =
        Math.max(
            0,
            Math.floor(seconds)
        );


    const minutes =
        Math.floor(
            seconds / 60
        );


    const remaining =
        seconds % 60;


    return (
        String(minutes).padStart(2, "0") +
        ":" +
        String(remaining).padStart(2, "0")
    );
}


function updateFocusDisplay() {

    if (focusTime) {

        focusTime.textContent =
            formatFocusTime(
                focusRemainingSeconds
            );
    }


    const progress =
        focusTotalSeconds > 0
            ? 1 -
              (
                  focusRemainingSeconds /
                  focusTotalSeconds
              )
            : 0;


    const degrees =
        progress * 360;


    const circle =
        document.querySelector(
            ".focus-timer-circle"
        );


    if (circle) {

        circle.style.background =
            `conic-gradient(
                var(--primary) ${degrees}deg,
                var(--primary-light) ${degrees}deg
            )`;
    }
}


/* =====================================================
   PRESETS
===================================================== */

focusPresets.forEach(
    button => {

        safeAddEventListener(
            button,
            "click",
            () => {

                focusPresets.forEach(
                    item =>
                        item.classList.remove(
                            "active"
                        )
                );


                button.classList.add(
                    "active"
                );


                focusSelectedMinutes =
                    Number(
                        button.dataset.minutes
                    );


                if (focusCustomMinutes) {

                    focusCustomMinutes.value =
                        "";
                }


                focusTotalSeconds =
                    focusSelectedMinutes *
                    60;


                focusRemainingSeconds =
                    focusTotalSeconds;


                updateFocusDisplay();
            }
        );
    }
);


/* =====================================================
   TEMPO PERSONALIZADO
===================================================== */

safeAddEventListener(
    focusCustomMinutes,
    "input",
    () => {

        const custom =
            Number(
                focusCustomMinutes.value
            );


        if (
            custom > 0 &&
            custom <= 600
        ) {

            focusPresets.forEach(
                item =>
                    item.classList.remove(
                        "active"
                    )
            );


            focusSelectedMinutes =
                custom;

            focusTotalSeconds =
                custom * 60;

            focusRemainingSeconds =
                focusTotalSeconds;


            updateFocusDisplay();
        }
    }
);


/* =====================================================
   INICIAR SESSÃO
===================================================== */

function startFocusSession() {

    if (
        focusSelectedMinutes <= 0 ||
        focusRunning
    ) {
        return;
    }


    clearInterval(
        focusInterval
    );


    focusTotalSeconds =
        focusSelectedMinutes * 60;


    focusRemainingSeconds =
        focusTotalSeconds;


    focusRunning = true;

    focusPaused = false;


    if (focusSetup) {
        focusSetup.style.display =
            "none";
    }


    if (focusComplete) {
        focusComplete.style.display =
            "none";
    }


    if (focusTimer) {
        focusTimer.style.display =
            "block";
    }


    if (pauseFocus) {
        pauseFocus.textContent =
            "Pausar";
    }


    if (focusStatus) {
        focusStatus.textContent =
            "Em foco";
    }


    updateFocusDisplay();


    focusInterval =
        setInterval(
            updateFocusSession,
            250
        );
}


/* =====================================================
   ATUALIZAR SESSÃO
===================================================== */

function updateFocusSession() {

    if (
        !focusRunning ||
        focusPaused
    ) {
        return;
    }


    focusRemainingSeconds -=
        0.25;


    if (
        focusRemainingSeconds <= 0
    ) {

        focusRemainingSeconds =
            0;


        updateFocusDisplay();

        finishFocusSession();

        return;
    }


    updateFocusDisplay();
}


/* =====================================================
   PAUSAR / CONTINUAR
===================================================== */

safeAddEventListener(
    pauseFocus,
    "click",
    () => {

        if (!focusRunning) {
            return;
        }


        focusPaused =
            !focusPaused;


        if (focusPaused) {

            if (focusStatus) {
                focusStatus.textContent =
                    "Pausado";
            }

            pauseFocus.textContent =
                "Continuar";

        } else {

            if (focusStatus) {
                focusStatus.textContent =
                    "Em foco";
            }

            pauseFocus.textContent =
                "Pausar";
        }
    }
);


/* =====================================================
   REGISTRAR TEMPO
===================================================== */

function registerStudyTime(
    seconds,
    completed
) {

    const {
        all,
        today
    } =
        getTodayStudyData();


    today.seconds +=
        Math.max(
            0,
            Math.floor(seconds)
        );


    if (completed) {

        today.sessions += 1;
    }


    all[getTodayKey()] =
        today;


    saveStudyData(all);

    updateStudyTotals();
}


/* =====================================================
   ENCERRAR SESSÃO
===================================================== */

safeAddEventListener(
    stopFocus,
    "click",
    () => {

        if (!focusRunning) {
            return;
        }


        const elapsed =
            focusTotalSeconds -
            focusRemainingSeconds;


        if (elapsed > 0) {

            registerStudyTime(
                elapsed,
                false
            );
        }


        clearInterval(
            focusInterval
        );


        focusRunning = false;

        focusPaused = false;


        if (focusSetup) {
            focusSetup.style.display =
                "block";
        }


        if (focusTimer) {
            focusTimer.style.display =
                "none";
        }


        updateStudyTotals();
    }
);


/* =====================================================
   CONCLUIR SESSÃO
===================================================== */

function finishFocusSession() {

    clearInterval(
        focusInterval
    );


    focusRunning = false;

    focusPaused = false;


    registerStudyTime(
        focusTotalSeconds,
        true
    );


    if (focusTimer) {
        focusTimer.style.display =
            "none";
    }


    if (focusSetup) {
        focusSetup.style.display =
            "none";
    }


    if (focusComplete) {
        focusComplete.style.display =
            "block";
    }


    if (focusCompleteMessage) {

        focusCompleteMessage.textContent =
            `Você terminou ${focusSelectedMinutes} minutos de foco. Seu esforço de hoje já conta para o seu progresso. Parabéns pela dedicação!`;
    }
}


/* =====================================================
   NOVA SESSÃO
===================================================== */

safeAddEventListener(
    newFocus,
    "click",
    () => {

        if (focusComplete) {
            focusComplete.style.display =
                "none";
        }


        if (focusSetup) {
            focusSetup.style.display =
                "block";
        }


        focusRemainingSeconds =
            focusTotalSeconds;


        updateFocusDisplay();
    }
);


safeAddEventListener(
    startFocus,
    "click",
    startFocusSession
);


/* =====================================================
   TEMAS
===================================================== */

document
    .querySelectorAll(
        ".theme-option"
    )
    .forEach(button => {

        safeAddEventListener(
            button,
            "click",
            () => {

                const theme =
                    button.dataset.theme;


                document.body.dataset.theme =
                    theme;


                localStorage.setItem(
                    "studyflow_theme",
                    theme
                );


                updateActiveTheme();
            }
        );
    });


function loadTheme() {

    const saved =
        localStorage.getItem(
            "studyflow_theme"
        );


    if (saved) {

        document.body.dataset.theme =
            saved;
    }


    updateActiveTheme();
}


function updateActiveTheme() {

    const current =
        document.body.dataset.theme ||
        "light";


    document
        .querySelectorAll(
            ".theme-option"
        )
        .forEach(button => {

            button.classList.toggle(
                "active",
                button.dataset.theme ===
                current
            );
        });
}


/* =====================================================
   FOTO DE PERFIL
===================================================== */

function getUserPhotoKey() {

    return currentUser
        ? `studyflow_profile_photo_${currentUser.uid}`
        : null;
}


function loadProfilePhoto() {

    const key =
        getUserPhotoKey();


    const photo =
        key
            ? localStorage.getItem(key)
            : null;


    const profileImage =
        $("profileImage");

    const profileInitial =
        $("profileInitial");

    const headerImage =
        $("headerProfileImage");

    const headerInitial =
        $("headerProfileInitial");


    if (
        !profileImage ||
        !profileInitial ||
        !headerImage ||
        !headerInitial
    ) {
        return;
    }


    if (photo) {

        profileImage.src =
            photo;

        profileImage.style.display =
            "block";

        profileInitial.style.display =
            "none";


        headerImage.src =
            photo;

        headerImage.style.display =
            "block";

        headerInitial.style.display =
            "none";

    } else {

        profileImage.removeAttribute(
            "src"
        );

        profileImage.style.display =
            "none";

        profileInitial.style.display =
            "flex";


        headerImage.removeAttribute(
            "src"
        );

        headerImage.style.display =
            "none";

        headerInitial.style.display =
            "flex";
    }
}


safeAddEventListener(
    $("profilePhotoInput"),
    "change",
    event => {

        if (!currentUser) {
            return;
        }


        const file =
            event.target.files?.[0];


        if (!file) {
            return;
        }


        if (
            !file.type.startsWith(
                "image/"
            )
        ) {

            alert(
                "Escolha uma imagem válida."
            );

            return;
        }


        const reader =
            new FileReader();


        reader.onload =
            () => {

                const key =
                    getUserPhotoKey();


                if (!key) {
                    return;
                }


                localStorage.setItem(
                    key,
                    reader.result
                );


                loadProfilePhoto();
            };


        reader.readAsDataURL(file);
    }
);


safeAddEventListener(
    $("removeProfilePhoto"),
    "click",
    () => {

        const key =
            getUserPhotoKey();


        if (key) {

            localStorage.removeItem(
                key
            );
        }


        const input =
            $("profilePhotoInput");


        if (input) {
            input.value = "";
        }


        loadProfilePhoto();
    }
);


/* =====================================================
   ALTERAR NOME
===================================================== */

safeAddEventListener(
    $("editProfileName"),
    "click",
    async () => {

        if (!currentUser) {
            return;
        }


        const newName =
            prompt(
                "Digite seu novo nome:",
                currentUser.displayName || ""
            );


        if (
            !newName ||
            !newName.trim()
        ) {
            return;
        }


        try {

            await updateProfile(
                currentUser,
                {
                    displayName:
                        newName.trim()
                }
            );


            await currentUser.reload();


            loadUserProfile(
                currentUser
            );

        } catch (error) {

            console.error(
                "Erro ao alterar nome:",
                error
            );


            alert(
                "Não foi possível alterar o nome."
            );
        }
    }
);


/* =====================================================
   LOGOUT
===================================================== */

safeAddEventListener(
    $("logoutButton"),
    "click",
    async () => {

        try {

            await signOut(auth);

        } catch (error) {

            console.error(
                "Erro ao sair:",
                error
            );


            alert(
                "Não foi possível sair da conta."
            );
        }
    }
);


/* =====================================================
   SPOTIFY
===================================================== */

function getPlaylistKey() {

    return currentUser
        ? `studyflow_playlist_${currentUser.uid}`
        : null;
}


function extractSpotifyPlaylistId(url) {

    try {

        const parsed =
            new URL(url);


        if (
            parsed.hostname !==
            "open.spotify.com"
        ) {
            return null;
        }


        const parts =
            parsed.pathname.split("/");


        const index =
            parts.indexOf(
                "playlist"
            );


        if (
            index === -1 ||
            !parts[index + 1]
        ) {
            return null;
        }


        const id =
            parts[index + 1];


        return /^[A-Za-z0-9]{22}$/.test(id)
            ? id
            : null;

    } catch {

        return null;
    }
}


function loadPlaylist() {

    const container =
        $("playlistContainer");


    if (!container) {
        return;
    }


    const key =
        getPlaylistKey();


    const playlistId =
        key
            ? localStorage.getItem(key)
            : null;


    if (!playlistId) {

        container.innerHTML =
            "";

        return;
    }


    const iframe =
        document.createElement(
            "iframe"
        );


    iframe.src =
        `https://open.spotify.com/embed/playlist/${playlistId}`;


    iframe.allow =
        "autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture";


    iframe.loading =
        "lazy";


    container.replaceChildren(
        iframe
    );
}


safeAddEventListener(
    $("addPlaylist"),
    "click",
    () => {

        if (!currentUser) {
            return;
        }


        const input =
            $("playlistUrl");


        const url =
            input?.value.trim();


        if (!url) {

            alert(
                "Cole o link de uma playlist."
            );

            return;
        }


        const playlistId =
            extractSpotifyPlaylistId(
                url
            );


        if (!playlistId) {

            alert(
                "Esse link não parece ser uma playlist válida do Spotify."
            );

            return;
        }


        const key =
            getPlaylistKey();


        if (!key) {
            return;
        }


        localStorage.setItem(
            key,
            playlistId
        );


        input.value =
            "";


        loadPlaylist();
    }
);


/* =====================================================
   MODAIS
===================================================== */

document
    .querySelectorAll(".modal")
    .forEach(modal => {

        safeAddEventListener(
            modal,
            "click",
            event => {

                if (
                    event.target ===
                    modal
                ) {

                    modal.classList.remove(
                        "active"
                    );

                    editingTaskId = null;
                    editingEventId = null;
                }
            }
        );
    });


/* =====================================================
   ESTADO DE AUTENTICAÇÃO
===================================================== */

onAuthStateChanged(
    auth,
    user => {

        currentUser =
            user;


        if (user) {

            authScreen.style.display =
                "none";


            loadUserData(user);
            loadUserProfile(user);
            loadProfilePhoto();
            loadPlaylist();


            renderTasks();
            renderCalendar();
            renderSelectedDay();
            updateNextEvent();


            updateStudyTotals();

        } else {

            authScreen.style.display =
                "flex";


            tasks = [];
            events = [];


            renderTasks();
            renderCalendar();
            renderSelectedDay();
            updateNextEvent();


            updateStudyTotals();
        }
    }
);


/* =====================================================
   INICIALIZAÇÃO
===================================================== */

updateDate();

loadTheme();

updateFocusDisplay();

updateStudyTotals();


/* =====================================================
   SPLASH SCREEN
===================================================== */

window.addEventListener(
    "load",
    () => {

        const splash =
            $("splashScreen");


        if (!splash) {
            return;
        }


        setTimeout(
            () => {

                splash.classList.add(
                    "hide"
                );

            },
            1800
        );
    }
);
