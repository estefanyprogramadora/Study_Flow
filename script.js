/* =====================================================
   STUDYFLOW
   AUTENTICAÇÃO + FIREBASE
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
const googleProvider = new GoogleAuthProvider();

let currentUser = null;
let authMode = "login";


/* =====================================================
   ELEMENTOS DA AUTENTICAÇÃO
===================================================== */

const authScreen = document.getElementById("authScreen");
const authForm = document.getElementById("authForm");

const authName = document.getElementById("authName");
const authNameContainer = document.getElementById("authNameContainer");

const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

const emailSubmit = document.getElementById("emailSubmit");

const googleLogin = document.getElementById("googleLogin");

const toggleAuthMode = document.getElementById("toggleAuthMode");
const authModeText = document.getElementById("authModeText");

const authMessage = document.getElementById("authMessage");


/* =====================================================
   MENSAGEM
===================================================== */

function showAuthMessage(message) {
    if (authMessage) {
        authMessage.textContent = message;
    }
}


/* =====================================================
   BOTÃO ENTRAR / CRIAR CONTA
===================================================== */

function updateAuthButton() {

    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    const name = authName.value.trim();

    if (authMode === "login") {

        emailSubmit.disabled = !(email && password);

    } else {

        emailSubmit.disabled = !(
            name &&
            email &&
            password.length >= 6
        );
    }
}


/* =====================================================
   MODO LOGIN / CADASTRO
===================================================== */

function updateAuthMode() {

    const register = authMode === "register";

    authNameContainer.style.display = register
        ? "block"
        : "none";

    emailSubmit.textContent = register
        ? "Criar conta"
        : "Entrar";

    authModeText.textContent = register
        ? "Já possui uma conta?"
        : "Não possui uma conta?";

    toggleAuthMode.textContent = register
        ? "Entrar"
        : "Criar conta";

    showAuthMessage("");

    updateAuthButton();
}


/* =====================================================
   CAMPOS
===================================================== */

authEmail.addEventListener(
    "input",
    updateAuthButton
);

authPassword.addEventListener(
    "input",
    updateAuthButton
);

authName.addEventListener(
    "input",
    updateAuthButton
);


/* =====================================================
   ALTERAR ENTRE LOGIN E CADASTRO
===================================================== */

toggleAuthMode.addEventListener("click", () => {

    authMode =
        authMode === "login"
            ? "register"
            : "login";

    updateAuthMode();
});

/* =====================================================
   LOGIN / CADASTRO COM E-MAIL
===================================================== */

authForm.addEventListener("submit", async event => {

    event.preventDefault();

    const email = authEmail.value.trim();
    const password = authPassword.value;
    const name = authName.value.trim();

    if (!email || !password) {
        return;
    }

    emailSubmit.disabled = true;
    showAuthMessage("");

    try {

        /* =========================================
           LOGIN
        ========================================= */

        if (authMode === "login") {

            const credential =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            currentUser = credential.user;

            /* Fecha a tela de login */
            if (authScreen) {
                authScreen.style.display = "none";
            }

            /* Carrega os dados do usuário */
            loadUserData(currentUser);
            loadUserProfile(currentUser);
            loadProfilePhoto();
            loadPlaylist();

            renderTasks();
            renderCalendar();
            renderSelectedDay();
            updateNextEvent();

            return;
        }


        /* =========================================
           CADASTRO
        ========================================= */

        if (!name) {

            showAuthMessage(
                "Digite seu nome."
            );

            emailSubmit.disabled = false;
            return;
        }


        if (password.length < 6) {

            showAuthMessage(
                "A senha precisa ter pelo menos 6 caracteres."
            );

            emailSubmit.disabled = false;
            return;
        }


        const credential =
            await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );


        /* Salva o nome */
        await updateProfile(
            credential.user,
            {
                displayName: name
            }
        );


        /* Define o usuário atual */
        currentUser = credential.user;


        /* =========================================
           ENTRAR AUTOMATICAMENTE NO APP
        ========================================= */

        if (authScreen) {
            authScreen.style.display = "none";
        }


        const splashScreen =
            document.getElementById("splashScreen");

        if (splashScreen) {
            splashScreen.classList.add("hide");
        }


        /* Carrega o perfil */
        loadUserProfile(currentUser);


        /* Carrega os dados */
        loadUserData(currentUser);
        loadProfilePhoto();
        loadPlaylist();

        renderTasks();
        renderCalendar();
        renderSelectedDay();
        updateNextEvent();


        showAuthMessage("");

    } catch (error) {

        console.error(
            "Erro de autenticação:",
            error
        );


        if (
            error.code ===
            "auth/user-not-found"
        ) {

            showAuthMessage(
                "Usuário não encontrado."
            );

        } else if (
            error.code ===
            "auth/invalid-credential"
        ) {

            showAuthMessage(
                "Usuário não encontrado ou senha incorreta."
            );

        } else if (
            error.code ===
            "auth/wrong-password"
        ) {

            showAuthMessage(
                "Senha incorreta."
            );

        } else if (
            error.code ===
            "auth/email-already-in-use"
        ) {

            showAuthMessage(
                "Esse e-mail já possui uma conta."
            );

        } else if (
            error.code ===
            "auth/invalid-email"
        ) {

            showAuthMessage(
                "Digite um e-mail válido."
            );

        } else if (
            error.code ===
            "auth/weak-password"
        ) {

            showAuthMessage(
                "A senha precisa ter pelo menos 6 caracteres."
            );

        } else {

            showAuthMessage(
                "Não foi possível acessar a conta."
            );
        }

    } finally {

        updateAuthButton();

    }
});

/* =====================================================
   LOGIN COM GOOGLE
===================================================== */

async function loginWithGoogle() {

    try {

        showAuthMessage(
            "Abrindo login do Google..."
        );

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


googleLogin.addEventListener(
    "click",
    loginWithGoogle
);


/* =====================================================
   ESTADO DA AUTENTICAÇÃO
===================================================== */

onAuthStateChanged(
    auth,
    user => {

        currentUser = user;

        if (user) {

            if (authScreen) {
                authScreen.style.display = "none";
            }

            loadUserData(user);
            loadUserProfile(user);
            loadProfilePhoto();
            loadPlaylist();

            renderTasks();
            renderCalendar();
            renderSelectedDay();
            updateNextEvent();

        } else {

            if (authScreen) {
                authScreen.style.display = "flex";
            }

            tasks = [];
            events = [];

            renderTasks();
            renderCalendar();
            renderSelectedDay();
            updateNextEvent();
        }
    }
);


/* =====================================================
   PERFIL
===================================================== */

function loadUserProfile(user) {

    const name =
        user.displayName ||
        "Estudante";

    const email =
        user.email ||
        "Conta StudyFlow";

    const profileName =
        document.getElementById(
            "profileName"
        );

    const profileEmail =
        document.getElementById(
            "profileEmail"
        );

    const welcomeName =
        document.getElementById(
            "welcomeName"
        );


    if (profileName) {
        profileName.textContent = name;
    }

    if (profileEmail) {
        profileEmail.textContent = email;
    }

    if (welcomeName) {
        welcomeName.textContent = name;
    }

    updateProfileInitial(name);
}


/* =====================================================
   INICIAL DO PERFIL
===================================================== */

function updateProfileInitial(name) {

    const initial =
        name
            .trim()
            .charAt(0)
            .toUpperCase() || "S";


    const profileInitial =
        document.getElementById(
            "profileInitial"
        );

    const headerInitial =
        document.getElementById(
            "headerProfileInitial"
        );


    if (profileInitial) {
        profileInitial.textContent =
            initial;
    }

    if (headerInitial) {
        headerInitial.textContent =
            initial;
    }
}


/* =====================================================
   EDITAR NOME
===================================================== */

const editProfileName =
    document.getElementById(
        "editProfileName"
    );

if (editProfileName) {

    editProfileName.addEventListener(
        "click",
        async () => {

            if (!currentUser) {
                return;
            }


            const newName = prompt(
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
}


/* =====================================================
   LOGOUT
===================================================== */

const logoutButton =
    document.getElementById(
        "logoutButton"
    );

if (logoutButton) {

    logoutButton.addEventListener(
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
}


/* =====================================================
   DATA + ALL OTHER APP CODE
===================================================== */

/* =====================================================
   DADOS
===================================================== */

let tasks = [];

let events = [];

let currentFilter = "all";

let currentCalendarDate =
    new Date();

let selectedDate =
    new Date();

let editingTaskId = null;

let editingEventId = null;


/* =====================================================
   ELEMENTOS DO APLICATIVO
===================================================== */

const taskModal =
    document.getElementById(
        "taskModal"
    );


const eventModal =
    document.getElementById(
        "eventModal"
    );


const taskForm =
    document.getElementById(
        "taskForm"
    );


const eventForm =
    document.getElementById(
        "eventForm"
    );


const taskList =
    document.getElementById(
        "taskList"
    );


const homeTaskList =
    document.getElementById(
        "homeTaskList"
    );


const emptyTasks =
    document.getElementById(
        "emptyTasks"
    );


/* =====================================================
   SALVAR TAREFAS
===================================================== */

function saveTasks() {

    if (!currentUser) {
        return;
    }


    localStorage.setItem(
        `studyflow_tasks_${currentUser.uid}`,
        JSON.stringify(tasks)
    );

}


/* =====================================================
   SALVAR EVENTOS
===================================================== */

function saveEvents() {

    if (!currentUser) {
        return;
    }


    localStorage.setItem(
        `studyflow_events_${currentUser.uid}`,
        JSON.stringify(events)
    );

}


/* =====================================================
   CARREGAR DADOS DO USUÁRIO
===================================================== */

function loadUserData(
    user
) {

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
                ? JSON.parse(
                    storedTasks
                )
                : [];


        events =
            storedEvents
                ? JSON.parse(
                    storedEvents
                )
                : [];

    }

    catch (error) {

        console.error(
            "Não foi possível carregar os dados da conta:",
            error
        );


        tasks = [];

        events = [];

    }

}


/* =====================================================
   NAVEGAÇÃO
===================================================== */

document
    .querySelectorAll(
        ".nav-item, [data-screen]"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    if (
                        button.dataset.screen
                    ) {

                        showScreen(
                            button.dataset.screen
                        );

                    }

                }
            );

        }
    );


function showScreen(
    screenName
) {

    document
        .querySelectorAll(
            ".screen"
        )
        .forEach(
            screen => {

                screen.classList.remove(
                    "active"
                );

            }
        );


    document
        .querySelectorAll(
            ".nav-item"
        )
        .forEach(
            button => {

                button.classList.remove(
                    "active"
                );

            }
        );


    const selectedScreen =
        document.getElementById(
            screenName
        );


    if (selectedScreen) {

        selectedScreen.classList.add(
            "active"
        );

    }


    document
        .querySelectorAll(
            `.nav-item[data-screen="${screenName}"]`
        )
        .forEach(
            button => {

                button.classList.add(
                    "active"
                );

            }
        );


    if (
        screenName ===
        "calendar"
    ) {

        renderCalendar();

        renderSelectedDay();

    }

}


/* =====================================================
   DATA ATUAL
===================================================== */

function updateDate() {

    const element =
        document.getElementById(
            "currentDate"
        );


    if (!element) {
        return;
    }


    const today =
        new Date();


    element.textContent =
        today.toLocaleDateString(
            "pt-BR",
            {
                weekday:
                    "long",

                day:
                    "numeric",

                month:
                    "long"
            }
        );

}


/* =====================================================
   TAREFAS
===================================================== */

function renderTasks() {

    if (!taskList || !homeTaskList) {
        return;
    }


    taskList.innerHTML = "";

    homeTaskList.innerHTML = "";


    let filtered =
        tasks;


    if (
        currentFilter ===
        "pending"
    ) {

        filtered =
            tasks.filter(
                task =>
                    !task.completed
            );

    }


    if (
        currentFilter ===
        "completed"
    ) {

        filtered =
            tasks.filter(
                task =>
                    task.completed
            );

    }


    if (
        emptyTasks
    ) {

        emptyTasks.style.display =
            filtered.length === 0
                ? "block"
                : "none";

    }


    filtered.forEach(
        task => {

            taskList.appendChild(
                createTaskElement(
                    task
                )
            );

        }
    );


    tasks
        .filter(
            task =>
                !task.completed
        )
        .slice(
            0,
            4
        )
        .forEach(
            task => {

                homeTaskList.appendChild(
                    createTaskElement(
                        task,
                        true
                    )
                );

            }
        );


    updateStats();

    renderCalendar();

    renderSelectedDay();

    updateNextEvent();

}


/* =====================================================
   ELEMENTO DE TAREFA
===================================================== */

function createTaskElement(
    task,
    compact = false
) {

    const element =
        document.createElement(
            "div"
        );


    element.className =
        "task";


    if (
        task.completed
    ) {

        element.classList.add(
            "completed"
        );

    }


    const priorityClass =
        `priority-${task.priority}`;


    const priorityLabel =
        getPriorityLabel(
            task.priority
        );


    element.innerHTML = `

        <span
            class="priority-dot ${priorityClass}"
            title="Prioridade ${priorityLabel}"
        ></span>

        <button
            class="task-check"
            type="button"
            data-id="${task.id}"
            title="${
                task.completed
                    ? "Desmarcar tarefa"
                    : "Concluir tarefa"
            }"
        >
            ${task.completed ? "✓" : ""}
        </button>

        <div class="task-info">

            <h3>
                ${escapeHTML(
                    task.title
                )}
            </h3>

            <p>
                ${escapeHTML(
                    task.subject
                )}

                ${
                    task.date
                        ? " • " +
                          formatDate(
                              task.date
                          )
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
                            data-id="${task.id}"
                            title="Editar tarefa"
                        >
                            ✎
                        </button>

                        <button
                            class="delete-task"
                            type="button"
                            data-id="${task.id}"
                            title="Excluir tarefa"
                        >
                            ×
                        </button>

                    </div>
                `
        }

    `;


    element
        .querySelector(
            ".task-check"
        )
        .addEventListener(
            "click",
            () => {

                toggleTask(
                    task.id
                );

            }
        );


    if (!compact) {

        element
            .querySelector(
                ".edit-task"
            )
            .addEventListener(
                "click",
                () => {

                    editTask(
                        task.id
                    );

                }
            );


        element
            .querySelector(
                ".delete-task"
            )
            .addEventListener(
                "click",
                () => {

                    deleteTask(
                        task.id
                    );

                }
            );

    }


    return element;

}


/* =====================================================
   PRIORIDADE
===================================================== */

function getPriorityLabel(
    priority
) {

    if (
        priority ===
        "high"
    ) {

        return "alta";

    }


    if (
        priority ===
        "low"
    ) {

        return "baixa";

    }


    return "normal";

}


/* =====================================================
   CONCLUIR TAREFA
===================================================== */

function toggleTask(
    id
) {

    tasks =
        tasks.map(
            task => {

                if (
                    task.id ===
                    id
                ) {

                    return {
                        ...task,
                        completed:
                            !task.completed
                    };

                }


                return task;

            }
        );


    saveTasks();

    renderTasks();

}


/* =====================================================
   EXCLUIR TAREFA
===================================================== */

function deleteTask(
    id
) {

    const confirmed =
        confirm(
            "Deseja realmente excluir esta tarefa?"
        );


    if (!confirmed) {
        return;
    }


    tasks =
        tasks.filter(
            task =>
                task.id !==
                id
        );


    saveTasks();

    renderTasks();

}


/* =====================================================
   EDITAR TAREFA
===================================================== */

function editTask(
    id
) {

    const task =
        tasks.find(
            task =>
                task.id ===
                id
        );


    if (!task) {
        return;
    }


    editingTaskId =
        id;


    document.getElementById(
        "taskTitle"
    ).value =
        task.title;


    document.getElementById(
        "taskSubject"
    ).value =
        task.subject;


    document.getElementById(
        "taskDate"
    ).value =
        task.date ||
        "";


    document.getElementById(
        "taskPriority"
    ).value =
        task.priority;


    document.getElementById(
        "taskModalTitle"
    ).textContent =
        "Editar tarefa";


    document.getElementById(
        "taskSubmitButton"
    ).textContent =
        "Salvar alterações";


    taskModal.classList.add(
        "active"
    );

}


/* =====================================================
   MODAL DE TAREFA
===================================================== */

document
    .getElementById(
        "openTaskModal"
    )
    .addEventListener(
        "click",
        () => {

            editingTaskId =
                null;


            taskForm.reset();


            document.getElementById(
                "taskModalTitle"
            ).textContent =
                "Nova tarefa";


            document.getElementById(
                "taskSubmitButton"
            ).textContent =
                "Criar tarefa";


            taskModal.classList.add(
                "active"
            );

        }
    );


document
    .getElementById(
        "closeTaskModal"
    )
    .addEventListener(
        "click",
        () => {

            taskModal.classList.remove(
                "active"
            );


            editingTaskId =
                null;


            taskForm.reset();


            document.getElementById(
                "taskModalTitle"
            ).textContent =
                "Nova tarefa";


            document.getElementById(
                "taskSubmitButton"
            ).textContent =
                "Criar tarefa";

        }
    );


/* =====================================================
   CRIAR / EDITAR TAREFA
===================================================== */

taskForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const title =
            document
                .getElementById(
                    "taskTitle"
                )
                .value
                .trim();


        const subject =
            document
                .getElementById(
                    "taskSubject"
                )
                .value;


        const date =
            document
                .getElementById(
                    "taskDate"
                )
                .value;


        const priority =
            document
                .getElementById(
                    "taskPriority"
                )
                .value;


        if (
            editingTaskId !== null
        ) {

            tasks =
                tasks.map(
                    task => {

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

                    }
                );

        }

        else {

            const newTask = {

                id:
                    Date.now(),

                title,

                subject,

                date,

                priority,

                completed:
                    false

            };


            tasks.push(
                newTask
            );

        }


        saveTasks();

        renderTasks();


        taskForm.reset();

        taskModal.classList.remove(
            "active"
        );


        editingTaskId =
            null;


        document.getElementById(
            "taskModalTitle"
        ).textContent =
            "Nova tarefa";


        document.getElementById(
            "taskSubmitButton"
        ).textContent =
            "Criar tarefa";

    }
);


/* =====================================================
   FILTROS
===================================================== */

document
    .querySelectorAll(
        ".filter"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                () => {

                    document
                        .querySelectorAll(
                            ".filter"
                        )
                        .forEach(
                            item => {

                                item.classList.remove(
                                    "active"
                                );

                            }
                        );


                    button.classList.add(
                        "active"
                    );


                    currentFilter =
                        button.dataset.filter;


                    renderTasks();

                }
            );

        }
    );


/* =====================================================
   ESTATÍSTICAS
===================================================== */

function updateStats() {

    const completed =
        tasks.filter(
            task =>
                task.completed
        ).length;


    const pending =
        tasks.filter(
            task =>
                !task.completed
        ).length;


    const total =
        tasks.length;


    const percentage =
        total === 0
            ? 0
            : Math.round(
                (
                    completed /
                    total
                ) *
                100
            );


    const completedCount =
        document.getElementById(
            "completedCount"
        );


    const pendingCount =
        document.getElementById(
            "pendingCount"
        );


    const dailyPercentage =
        document.getElementById(
            "dailyPercentage"
        );


    const progressCompleted =
        document.getElementById(
            "progressCompleted"
        );


    const progressPending =
        document.getElementById(
            "progressPending"
        );


    const progressTotal =
        document.getElementById(
            "progressTotal"
        );


    const largeProgressText =
        document.getElementById(
            "largeProgressText"
        );


    const largeProgressBar =
        document.getElementById(
            "largeProgressBar"
        );


    const description =
        document.getElementById(
            "progressDescription"
        );


    if (completedCount) {
        completedCount.textContent =
            completed;
    }


    if (pendingCount) {
        pendingCount.textContent =
            pending;
    }


    if (dailyPercentage) {
        dailyPercentage.textContent =
            `${percentage}%`;
    }


    if (progressCompleted) {
        progressCompleted.textContent =
            completed;
    }


    if (progressPending) {
        progressPending.textContent =
            pending;
    }


    if (progressTotal) {
        progressTotal.textContent =
            `${percentage}%`;
    }


    if (largeProgressText) {

        largeProgressText.textContent =
            `${completed} de ${total} tarefas concluídas`;

    }


    if (largeProgressBar) {

        largeProgressBar.style.width =
            `${percentage}%`;

    }


    const circle =
        document.querySelector(
            ".progress-circle"
        );


    if (circle) {

        circle.style.background =
            `
                conic-gradient(
                    var(--primary)
                    ${percentage * 3.6}deg,

                    var(--primary-light)
                    ${percentage * 3.6}deg
                )
            `;

    }


    if (description) {

        if (
            total === 0
        ) {

            description.textContent =
                "Você ainda não possui tarefas.";

        }

        else if (
            percentage === 100
        ) {

            description.textContent =
                "Todas as tarefas foram concluídas!";

        }

        else {

            description.textContent =
                `${pending} tarefa(s) ainda precisam de atenção.`;

        }

    }

}


/* =====================================================
   CALENDÁRIO
===================================================== */

function renderCalendar() {

    const grid =
        document.getElementById(
            "calendarGrid"
        );


    const monthTitle =
        document.getElementById(
            "calendarMonth"
        );


    if (
        !grid ||
        !monthTitle
    ) {

        return;

    }


    grid.innerHTML =
        "";


    const year =
        currentCalendarDate
            .getFullYear();


    const month =
        currentCalendarDate
            .getMonth();


    const monthName =
        currentCalendarDate
            .toLocaleDateString(
                "pt-BR",
                {
                    month:
                        "long",

                    year:
                        "numeric"
                }
            );


    monthTitle.textContent =
        capitalize(
            monthName
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

        const empty =
            document.createElement(
                "div"
            );


        grid.appendChild(
            empty
        );

    }


    for (
        let day = 1;
        day <= daysInMonth;
        day++
    ) {

        const cell =
            document.createElement(
                "div"
            );


        cell.className =
            "calendar-day";


        const dateString =
            createDateString(
                year,
                month,
                day
            );


        if (
            isToday(
                dateString
            )
        ) {

            cell.classList.add(
                "today"
            );

        }


        if (
            isSameDate(
                dateString,
                dateToString(
                    selectedDate
                )
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


        const itemsContainer =
            cell.querySelector(
                ".calendar-items"
            );


        /* TAREFAS PENDENTES */

        tasks
            .filter(
                task =>
                    task.date ===
                        dateString &&
                    !task.completed
            )
            .forEach(
                task => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "calendar-item calendar-task";


                    item.textContent =
                        task.title;


                    itemsContainer.appendChild(
                        item
                    );

                }
            );


        /* EVENTOS */

        events
            .filter(
                event =>
                    event.date ===
                    dateString
            )
            .forEach(
                event => {

                    const item =
                        document.createElement(
                            "div"
                        );


                    item.className =
                        "calendar-item calendar-event";


                    item.textContent =
                        event.title;


                    itemsContainer.appendChild(
                        item
                    );

                }
            );


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


        grid.appendChild(
            cell
        );

    }

}


/* =====================================================
   NAVEGAÇÃO DO CALENDÁRIO
===================================================== */

document
    .getElementById(
        "previousMonth"
    )
    .addEventListener(
        "click",
        () => {

            currentCalendarDate.setMonth(
                currentCalendarDate.getMonth() -
                1
            );


            renderCalendar();

        }
    );


document
    .getElementById(
        "nextMonth"
    )
    .addEventListener(
        "click",
        () => {

            currentCalendarDate.setMonth(
                currentCalendarDate.getMonth() +
                1
            );


            renderCalendar();

        }
    );


/* =====================================================
   DIA SELECIONADO
===================================================== */

function renderSelectedDay() {

    const container =
        document.getElementById(
            "selectedDayContent"
        );


    const title =
        document.getElementById(
            "selectedDateTitle"
        );


    if (
        !container ||
        !title
    ) {

        return;

    }


    const dateString =
        dateToString(
            selectedDate
        );


    title.textContent =
        selectedDate.toLocaleDateString(
            "pt-BR",
            {
                day:
                    "numeric",

                month:
                    "long",

                year:
                    "numeric"
            }
        );


    container.innerHTML =
        "";


    const dayTasks =
        tasks.filter(
            task =>
                task.date ===
                    dateString &&
                !task.completed
        );


    const dayEvents =
        events.filter(
            event =>
                event.date ===
                dateString
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


    /* EVENTOS */

    dayEvents.forEach(
        event => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "day-event";


            element.innerHTML = `

                <div class="day-event-content">

                    <strong>
                        📌 ${escapeHTML(
                            event.title
                        )}
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
                        data-id="${event.id}"
                        title="Editar evento"
                    >
                        ✎
                    </button>

                    <button
                        class="delete-event"
                        type="button"
                        data-id="${event.id}"
                        title="Excluir evento"
                    >
                        ×
                    </button>

                </div>

            `;


            element
                .querySelector(
                    ".edit-event"
                )
                .addEventListener(
                    "click",
                    () => {

                        editEvent(
                            event.id
                        );

                    }
                );


            element
                .querySelector(
                    ".delete-event"
                )
                .addEventListener(
                    "click",
                    () => {

                        deleteEvent(
                            event.id
                        );

                    }
                );


            container.appendChild(
                element
            );

        }
    );


    /* TAREFAS */

    dayTasks.forEach(
        task => {

            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "day-event";


            element.innerHTML = `

                <div class="day-event-content">

                    <strong>
                        ✓ ${escapeHTML(
                            task.title
                        )}
                    </strong>

                    <p>
                        ${escapeHTML(
                            task.subject
                        )}
                        • Prioridade:
                        ${getPriorityLabel(
                            task.priority
                        )}
                    </p>

                </div>

                <div class="day-event-actions">

                    <button
                        class="edit-task-day"
                        type="button"
                        data-id="${task.id}"
                        title="Editar tarefa"
                    >
                        ✎
                    </button>

                    <button
                        class="complete-task-day"
                        type="button"
                        data-id="${task.id}"
                        title="Concluir tarefa"
                    >
                        ✓
                    </button>

                </div>

            `;


            element
                .querySelector(
                    ".edit-task-day"
                )
                .addEventListener(
                    "click",
                    () => {

                        editTask(
                            task.id
                        );

                    }
                );


            element
                .querySelector(
                    ".complete-task-day"
                )
                .addEventListener(
                    "click",
                    () => {

                        toggleTask(
                            task.id
                        );

                    }
                );


            container.appendChild(
                element
            );

        }
    );

}


/* =====================================================
   EVENTOS
===================================================== */

document
    .getElementById(
        "openEventModal"
    )
    .addEventListener(
        "click",
        () => {

            editingEventId =
                null;


            eventForm.reset();


            document.getElementById(
                "eventModalTitle"
            ).textContent =
                "Novo evento";


            document.getElementById(
                "eventSubmitButton"
            ).textContent =
                "Criar evento";


            eventModal.classList.add(
                "active"
            );

        }
    );


document
    .getElementById(
        "closeEventModal"
    )
    .addEventListener(
        "click",
        () => {

            eventModal.classList.remove(
                "active"
            );


            editingEventId =
                null;


            eventForm.reset();


            document.getElementById(
                "eventModalTitle"
            ).textContent =
                "Novo evento";


            document.getElementById(
                "eventSubmitButton"
            ).textContent =
                "Criar evento";

        }
    );


/* =====================================================
   EDITAR EVENTO
===================================================== */

function editEvent(
    id
) {

    const event =
        events.find(
            event =>
                event.id ===
                id
        );


    if (!event) {
        return;
    }


    editingEventId =
        id;


    document.getElementById(
        "eventTitle"
    ).value =
        event.title;


    document.getElementById(
        "eventDescription"
    ).value =
        event.description ||
        "";


    document.getElementById(
        "eventDate"
    ).value =
        event.date;


    document.getElementById(
        "eventModalTitle"
    ).textContent =
        "Editar evento";


    document.getElementById(
        "eventSubmitButton"
    ).textContent =
        "Salvar alterações";


    eventModal.classList.add(
        "active"
    );

}


/* =====================================================
   EXCLUIR EVENTO
===================================================== */

function deleteEvent(
    id
) {

    const confirmed =
        confirm(
            "Deseja realmente excluir este evento?"
        );


    if (!confirmed) {
        return;
    }


    events =
        events.filter(
            event =>
                event.id !==
                id
        );


    saveEvents();

    renderCalendar();

    renderSelectedDay();

    updateNextEvent();

}


/* =====================================================
   CRIAR / EDITAR EVENTO
===================================================== */

eventForm.addEventListener(
    "submit",
    event => {

        event.preventDefault();


        const title =
            document
                .getElementById(
                    "eventTitle"
                )
                .value
                .trim();


        const description =
            document
                .getElementById(
                    "eventDescription"
                )
                .value
                .trim();


        const date =
            document
                .getElementById(
                    "eventDate"
                )
                .value;


        if (
            editingEventId !== null
        ) {

            events =
                events.map(
                    event => {

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

                    }
                );

        }

        else {

            const newEvent = {

                id:
                    Date.now(),

                title,

                description,

                date

            };


            events.push(
                newEvent
            );

        }


        saveEvents();


        eventForm.reset();


        eventModal.classList.remove(
            "active"
        );


        editingEventId =
            null;


        document.getElementById(
            "eventModalTitle"
        ).textContent =
            "Novo evento";


        document.getElementById(
            "eventSubmitButton"
        ).textContent =
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
        document.getElementById(
            "nextEvent"
        );


    if (!container) {
        return;
    }


    const today =
        dateToString(
            new Date()
        );


    const upcomingEvents =
        events
            .filter(
                event =>
                    event.date >=
                    today
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
                    task.date >=
                    today
            )
            .sort(
                (a, b) =>
                    a.date.localeCompare(
                        b.date
                    )
            );


    if (
        upcomingEvents.length === 0 &&
        upcomingTasks.length === 0
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


    const nextEvent =
        upcomingEvents[0];


    const nextTask =
        upcomingTasks[0];


    let item;


    if (
        !nextTask ||
        (
            nextEvent &&
            nextEvent.date <
            nextTask.date
        )
    ) {

        item = {

            title:
                nextEvent.title,

            date:
                nextEvent.date,

            type:
                "Evento"

        };

    }

    else {

        item = {

            title:
                nextTask.title,

            date:
                nextTask.date,

            type:
                "Tarefa"

        };

    }


    container.innerHTML = `

        <div class="empty-icon">
            ${
                item.type === "Evento"
                    ? "📌"
                    : "✓"
            }
        </div>

        <h3>
            ${escapeHTML(
                item.title
            )}
        </h3>

        <p>
            ${item.type}
            • ${formatDate(
                item.date
            )}
        </p>

    `;

}


/* =====================================================
   TEMAS
===================================================== */

document
    .querySelectorAll(
        ".theme-option"
    )
    .forEach(
        button => {

            button.addEventListener(
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

        }
    );


function loadTheme() {

    const savedTheme =
        localStorage.getItem(
            "studyflow_theme"
        );


    if (savedTheme) {

        document.body.dataset.theme =
            savedTheme;

    }


    updateActiveTheme();

}


function updateActiveTheme() {

    const currentTheme =
        document.body.dataset.theme ||
        "light";


    document
        .querySelectorAll(
            ".theme-option"
        )
        .forEach(
            button => {

                button.classList.toggle(
                    "active",
                    button.dataset.theme ===
                    currentTheme
                );

            }
        );

}


/* =====================================================
   FOTO DE PERFIL
===================================================== */

function getUserPhotoKey() {

    if (!currentUser) {
        return null;
    }


    return `studyflow_profile_photo_${currentUser.uid}`;

}


const profilePhotoInput =
    document.getElementById(
        "profilePhotoInput"
    );


if (profilePhotoInput) {

    profilePhotoInput.addEventListener(
        "change",
        event => {

            if (!currentUser) {
                return;
            }


            const file =
                event.target.files[0];


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


            reader.readAsDataURL(
                file
            );

        }
    );

}


function loadProfilePhoto() {

    const key =
        getUserPhotoKey();


    const photo =
        key
            ? localStorage.getItem(
                key
            )
            : null;


    const profileImage =
        document.getElementById(
            "profileImage"
        );


    const profileInitial =
        document.getElementById(
            "profileInitial"
        );


    const headerImage =
        document.getElementById(
            "headerProfileImage"
        );


    const headerInitial =
        document.getElementById(
            "headerProfileInitial"
        );


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

    }

    else {

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


document
    .getElementById(
        "removeProfilePhoto"
    )
    .addEventListener(
        "click",
        () => {

            const key =
                getUserPhotoKey();


            if (key) {

                localStorage.removeItem(
                    key
                );

            }


            if (profilePhotoInput) {

                profilePhotoInput.value =
                    "";

            }


            loadProfilePhoto();

        }
    );


/* =====================================================
   MÚSICA / SPOTIFY
===================================================== */

function getPlaylistKey() {

    if (!currentUser) {
        return null;
    }


    return `studyflow_playlist_${currentUser.uid}`;

}


document
    .getElementById(
        "addPlaylist"
    )
    .addEventListener(
        "click",
        () => {

            if (!currentUser) {
                return;
            }


            const input =
                document.getElementById(
                    "playlistUrl"
                );


            const url =
                input.value.trim();


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


function extractSpotifyPlaylistId(
    url
) {

    try {

        const parsed =
            new URL(
                url
            );


        if (
            parsed.hostname !==
            "open.spotify.com"
        ) {

            return null;

        }


        const parts =
            parsed.pathname.split(
                "/"
            );


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


        const playlistId =
            parts[index + 1];


        if (
            !/^[A-Za-z0-9]{22}$/.test(
                playlistId
            )
        ) {

            return null;

        }


        return playlistId;

    }

    catch {

        return null;

    }

}


function loadPlaylist() {

    const container =
        document.getElementById(
            "playlistContainer"
        );


    if (!container) {
        return;
    }


    const key =
        getPlaylistKey();


    const playlistId =
        key
            ? localStorage.getItem(
                key
            )
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


/* =====================================================
   UTILIDADES
===================================================== */

function formatDate(
    dateString
) {

    if (!dateString) {

        return "Sem prazo";

    }


    const date =
        new Date(
            dateString +
            "T00:00:00"
        );


    return date.toLocaleDateString(
        "pt-BR"
    );

}


function dateToString(
    date
) {

    const year =
        date.getFullYear();


    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            "0"
        );


    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            "0"
        );


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


function isToday(
    dateString
) {

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


function capitalize(
    text
) {

    return (
        text.charAt(0).toUpperCase() +
        text.slice(1)
    );

}


function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        text;


    return div.innerHTML;

}


/* =====================================================
   FECHAR MODAIS CLICANDO FORA
===================================================== */

document
    .querySelectorAll(
        ".modal"
    )
    .forEach(
        modal => {

            modal.addEventListener(
                "click",
                event => {

                    if (
                        event.target ===
                        modal
                    ) {

                        modal.classList.remove(
                            "active"
                        );


                        editingTaskId =
                            null;


                        editingEventId =
                            null;

                    }

                }
            );

        }
    );


/* =====================================================
   INICIALIZAÇÃO
===================================================== */

updateDate();

loadTheme();


/* =====================================================
   TELA DE ABERTURA
===================================================== */

window.addEventListener(
    "load",
    () => {

        const splashScreen =
            document.getElementById(
                "splashScreen"
            );


        if (!splashScreen) {
            return;
        }


        setTimeout(
            () => {

                splashScreen.classList.add(
                    "hide"
                );

            },
            1800
        );

    }
);
