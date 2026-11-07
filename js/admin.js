
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import {
    getFirestore,
    collection,
    onSnapshot,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

import {
    getAuth,
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";

// FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyD6_Wis_nMAAZj9UUJUso_YeKI-5J2aMWs",
    authDomain: "formatura-matheus.firebaseapp.com",
    projectId: "formatura-matheus",
    storageBucket: "formatura-matheus.firebasestorage.app",
    messagingSenderId: "198120423427",
    appId: "1:198120423427:web:14e2b28ed337b771b48e36"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ELEMENTOS
const loginSection = document.getElementById("loginSection");
const dashboard = document.getElementById("dashboard");
const loginForm = document.getElementById("loginForm");
const loginError = document.getElementById("loginError");
const logoutButton = document.getElementById("logoutButton");
const guestList = document.getElementById("guestList");
const totalConfirmed = document.getElementById("totalConfirmed");
const listStatus = document.getElementById("listStatus");
const refreshButton = document.getElementById("refreshButton");

const ADMIN_EMAIL = "mths.s.correia@gmail.com";

let unsubscribeConfirmations = null;

// LOGIN
loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    loginError.textContent = "";

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginError.textContent = "E-mail ou senha incorretos.";
        console.error(error);
    }
});

// ESTADO DE AUTENTICAÇÃO
onAuthStateChanged(auth, (user) => {
    if (unsubscribeConfirmations) {
        unsubscribeConfirmations();
        unsubscribeConfirmations = null;
    }

    if (user && user.email === ADMIN_EMAIL) {
        loginSection.classList.add("hidden");
        dashboard.classList.remove("hidden");
        logoutButton.classList.remove("hidden");
        carregarConfirmacoes();
    } else {
        dashboard.classList.add("hidden");
        logoutButton.classList.add("hidden");
        loginSection.classList.remove("hidden");

        if (user) {
            signOut(auth);
            loginError.textContent = "Esta conta não tem acesso administrativo.";
        }
    }
});

// CARREGAR CONFIRMAÇÕES EM TEMPO REAL
function carregarConfirmacoes() {
    listStatus.textContent = "Aguardando dados...";

    unsubscribeConfirmations = onSnapshot(
        collection(db, "confirmacoes"),
        (snapshot) => {
            const convidados = snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data()
            }));

            convidados.sort((a, b) => {
                const dataA = a.createdAt?.toMillis?.() || 0;
                const dataB = b.createdAt?.toMillis?.() || 0;
                return dataB - dataA;
            });

            totalConfirmed.textContent = convidados.length;
            guestList.replaceChildren();

            if (convidados.length === 0) {
                const row = document.createElement("tr");
                const cell = document.createElement("td");

                cell.colSpan = 4;
                cell.textContent = "Nenhuma confirmação recebida ainda.";
                row.appendChild(cell);
                guestList.appendChild(row);
            }

            convidados.forEach((convidado) => {
                const row = document.createElement("tr");

                const nameCell = document.createElement("td");
                nameCell.textContent = convidado.nome || "Sem nome";

                const phoneCell = document.createElement("td");
                phoneCell.textContent = convidado.whatsapp || convidado.id;

                const dateCell = document.createElement("td");

                if (convidado.createdAt?.toDate) {
                    dateCell.textContent = convidado.createdAt
                        .toDate()
                        .toLocaleString("pt-BR");
                } else {
                    dateCell.textContent = "Aguardando...";
                }

                const actionCell = document.createElement("td");
                const deleteButton = document.createElement("button");

                deleteButton.textContent = "Excluir";
                deleteButton.className = "delete-button";

                deleteButton.addEventListener("click", async () => {
                    const confirmar = confirm(
                        `Deseja excluir a confirmação de ${convidado.nome}?`
                    );

                    if (!confirmar) return;

                    try {
                        await deleteDoc(
                            doc(db, "confirmacoes", convidado.id)
                        );
                    } catch (error) {
                        alert("Não foi possível excluir a confirmação.");
                        console.error(error);
                    }
                });

                actionCell.appendChild(deleteButton);

                row.append(
                    nameCell,
                    phoneCell,
                    dateCell,
                    actionCell
                );

                guestList.appendChild(row);
            });

            listStatus.textContent =
                "Lista atualizada automaticamente.";
        },
        (error) => {
            console.error(error);
            listStatus.textContent =
                "Erro ao carregar confirmações. Verifique as regras do Firestore.";
        }
    );
}

// ATUALIZAR MANUALMENTE
refreshButton.addEventListener("click", () => {
    listStatus.textContent = "A lista é atualizada automaticamente.";
});

// SAIR
logoutButton.addEventListener("click", async () => {
    await signOut(auth);
});
