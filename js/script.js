
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";

import {
    getFirestore,
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";

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

// ELEMENTOS
const modal = document.getElementById("modal");
const openModal = document.getElementById("openModal");
const closeModal = document.getElementById("closeModal");

const form = document.getElementById("confirmationForm");
const successMessage = document.getElementById("successMessage");

// ABRIR MODAL
openModal.addEventListener("click", () => {
    modal.classList.add("active");
});

// FECHAR MODAL
closeModal.addEventListener("click", () => {
    modal.classList.remove("active");
});

// FECHAR AO CLICAR FORA
modal.addEventListener("click", (event) => {
    if (event.target === modal) {
        modal.classList.remove("active");
    }
});

// FECHAR COM ESC
document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
        modal.classList.remove("active");
    }
});

// NORMALIZAR WHATSAPP
function formatarTelefone(valor) {
    let numero = valor.replace(/\D/g, "");

    if (numero.startsWith("55") && numero.length > 11) {
        numero = numero.substring(2);
    }

    if (numero.length !== 10 && numero.length !== 11) {
        throw new Error("Confira o número de WhatsApp informado.");
    }

    return "55" + numero;
}

// CONFIRMAR PRESENÇA
form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const botao = form.querySelector(".submit-button");
    const nome = document.getElementById("name").value.trim();

    let telefone;

    try {
        telefone = formatarTelefone(
            document.getElementById("phone").value
        );
    } catch (error) {
        alert(error.message);
        return;
    }

    if (nome.length < 2) {
        alert("Digite seu nome completo.");
        return;
    }

    botao.disabled = true;
    botao.textContent = "REGISTRANDO...";

    try {
        // O próprio número é o ID do documento.
        // Uma segunda tentativa será bloqueada pelas regras do Firestore.
        await setDoc(doc(db, "confirmacoes", telefone), {
            nome: nome,
            whatsapp: telefone,
            createdAt: serverTimestamp()
        });

        form.style.display = "none";
        document.querySelector(".modal > p").style.display = "none";

        successMessage.textContent =
            "Presença confirmada com sucesso! Obrigado por fazer parte desse momento especial.";

        successMessage.style.display = "block";

    } catch (error) {
        console.error("Erro ao confirmar:", error);

        if (error.code === "permission-denied") {
            alert("Este WhatsApp já confirmou presença ou não foi possível registrar. Confira os dados e tente novamente.");
        } else {
            alert("Não foi possível registrar sua presença. Tente novamente.");
        }

        botao.disabled = false;
        botao.textContent = "CONFIRMAR MINHA PRESENÇA →";
    }
});
