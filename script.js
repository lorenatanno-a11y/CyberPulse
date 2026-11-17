// =========================================================
// 1. CONFIGURAÇÃO DO CANVAS E ELEMENTOS
// =========================================================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const spanPontos = document.getElementById("pontos");
const spanVidas = document.getElementById("vidas");
const btnReiniciar = document.getElementById("btnReiniciar");

// =========================================================
// 2. PARÂMETROS DO JOGO (FÁCIL DE PERSONALIZAR!)
// =========================================================
const GRAVIDADE = 0.55;
const FORCA_PULO = -11.5;
const VELOCIDADE_JOGADOR = 5.5;
const VIDAS_INICIAIS = 3;
const MAX_PULOS = 2; // Permite Pulo Duplo!

let pontos = 0;
let vidas = VIDAS_INICIAIS;
let estadoJogo = "jogando"; // "jogando", "vitoria", "derrota"
let anguloPortal = 0; // Para animar o portal girando

// Personagem Cyber-Runner
const jogador = {
    x: 40,
    y: 300,
    largura: 28,
    altura: 38,
    vx: 0,
    vy: 0,
    pulosRestantes: MAX_PULOS,
    direcao: 1, // 1 = direita, -1 = esquerda
    cor: "#00f3ff"
};

const teclas = {
    esquerda: false,
    direita: false
};

// =========================================================
// 3. CENÁRIO, PLATAFORMAS MÓVEIS, CRISTAIS E DRONES
// =========================================================
let plataformas = [];
let cristais = [];
let drones = [];
let portalFinal = {};
let estrelas = [];

// Cria estrelas decorativas no fundo
for (let i = 0; i < 45; i++) {
    estrelas.push({
        x: Math.random() * canvas.width,
        y: Math.random() * 350,
        tamanho: Math.random() * 2 + 1
    });
}

function iniciarFase() {
    pontos = 0;
    vidas = VIDAS_INICIAIS;
    estadoJogo = "jogando";
    resetarPosicaoJogador();
    atualizarPlacar();

    // Plataformas (algumas têm velocidade vx para se moverem!)
    plataformas = [
        { x: 0, y: 415, largura: 260, altura: 35, vx: 0, minX: 0, maxX: 0 },     // Chão inicial
        { x: 340, y: 415, largura: 460, altura: 35, vx: 0, minX: 0, maxX: 0 },   // Chão direito (com abismo no meio!)
        { x: 160, y: 310, largura: 120, altura: 16, vx: 0, minX: 0, maxX: 0 },   // Plataforma fixa 1
        { x: 340, y: 240, largura: 120, altura: 16, vx: 2, minX: 300, maxX: 520 }, // PLATAFORMA MÓVEL!
        { x: 600, y: 170, largura: 130, altura: 16, vx: 0, minX: 0, maxX: 0 },   // Plataforma fixa 2
        { x: 380, y: 105, largura: 130, altura: 16, vx: 0, minX: 0, maxX: 0 }    // Plataforma do Portal
    ];

    // Cristais de Energia (substituem as moedas)
    cristais = [
        { x: 220, y: 275, tamanho: 10, coletado: false },
        { x: 430, y: 375, tamanho: 10, coletado: false },
        { x: 665, y: 135, tamanho: 10, coletado: false },
        { x: 730, y: 375, tamanho: 10, coletado: false },
        { x: 295, y: 220, tamanho: 10, coletado: false }
    ];

    // Drones de Segurança (Inimigos)
    drones = [
        { x: 450, y: 375, largura: 32, altura: 22, vx: 2.5, limiteEsq: 360, limiteDir: 760 },
        { x: 600, y: 135, largura: 32, altura: 22, vx: 1.5, limiteEsq: 600, limiteDir: 700 }
    ];

    // Portal de Teletransporte (Objetivo Final)
    portalFinal = {
        x: 425,
        y: 50,
        largura: 36,
        altura: 50
    };
}

function resetarPosicaoJogador() {
    jogador.x = 40;
    jogador.y = 300;
    jogador.vx = 0;
    jogador.vy = 0;
    jogador.pulosRestantes = MAX_PULOS;
}

function atualizarPlacar() {
    spanPontos.textContent = pontos;
    spanVidas.textContent = vidas;
}

// =========================================================
// 4. CONTROLES DO TECLADO
// =========================================================
window.addEventListener("keydown", (evento) => {
    const tecla = evento.key.toLowerCase();

    if (tecla === "arrowleft" || tecla === "a") {
        teclas.esquerda = true;
        jogador.direcao = -1;
    }
    if (tecla === "arrowright" || tecla === "d") {
        teclas.direita = true;
        jogador.direcao = 1;
    }

    // Pulo Duplo: funciona se ainda tiver pulos restantes
    if ((tecla === " " || tecla === "arrowup" || tecla === "w") && !evento.repeat && estadoJogo === "jogando") {
        if (jogador.pulosRestantes > 0) {
            jogador.vy = FORCA_PULO;
            jogador.pulosRestantes--;
        }
    }
});

window.addEventListener("keyup", (evento) => {
    const tecla = evento.key.toLowerCase();

    if (tecla === "arrowleft" || tecla === "a") teclas.esquerda = false;
    if (tecla === "arrowright" || tecla === "d") teclas.direita = false;
});

btnReiniciar.addEventListener("click", iniciarFase);

// =========================================================
// 5. FÍSICA, PLATAFORMAS MÓVEIS E COLISÕES
// =========================================================
function colidiu(a, b) {
    return (
        a.x < b.x + b.largura &&
        a.x + a.largura > b.x &&
        a.y < b.y + b.altura &&
        a.y + a.altura > b.y
    );
}

function atualizar() {
    if (estadoJogo !== "jogando") return;

    anguloPortal += 0.08;

    // Atualiza plataformas móveis
    for (let plat of plataformas) {
        if (plat.vx !== 0) {
            plat.x += plat.vx;
            if (plat.x <= plat.minX || plat.x + plat.largura >= plat.maxX) {
                plat.vx *= -1;
            }
        }
    }

    // Movimento horizontal do jogador
    if (teclas.esquerda) {
        jogador.vx = -VELOCIDADE_JOGADOR;
    } else if (teclas.direita) {
        jogador.vx = VELOCIDADE_JOGADOR;
    } else {
        jogador.vx = 0;
    }

    jogador.x += jogador.vx;

    // Limites laterais da tela
    if (jogador.x < 0) jogador.x = 0;
    if (jogador.x + jogador.largura > canvas.width) jogador.x = canvas.width - jogador.largura;

    // Gravidade
    jogador.vy += GRAVIDADE;
    jogador.y += jogador.vy;

    // Colisão com plataformas
    for (let plat of plataformas) {
        if (
            jogador.vy >= 0 &&
            jogador.x + jogador.largura > plat.x &&
            jogador.x < plat.x + plat.largura &&
            jogador.y + jogador.altura >= plat.y &&
            jogador.y + jogador.altura - jogador.vy <= plat.y + 8
        ) {
            jogador.y = plat.y - jogador.altura;
            jogador.vy = 0;
            jogador.pulosRestantes = MAX_PULOS; // Recarrega o pulo duplo!
            jogador.x += plat.vx; // Carrega o jogador junto se a plataforma for móvel!
        }
    }

    // Se cair no abismo (fundo da tela), perde 1 escudo
    if (jogador.y > canvas.height) {
        perderEscudo();
    }

    // Coleta de Cristais
    for (let cristal of cristais) {
        if (!cristal.coletado) {
            const areaCristal = {
                x: cristal.x - cristal.tamanho,
                y: cristal.y - cristal.tamanho,
                largura: cristal.tamanho * 2,
                altura: cristal.tamanho * 2
            };

            if (colidiu(jogador, areaCristal)) {
                cristal.coletado = true;
                pontos += 25;
                atualizarPlacar();
            }
        }
    }

    // Movimento e colisão com Drones
    for (let drone of drones) {
        drone.x += drone.vx;
        if (drone.x <= drone.limiteEsq || drone.x + drone.largura >= drone.limiteDir) {
            drone.vx *= -1;
        }

        if (colidiu(jogador, drone)) {
            perderEscudo();
        }
    }

    // Chegada no Portal (Vitória)
    if (colidiu(jogador, portalFinal)) {
        estadoJogo = "vitoria";
    }
}

function perderEscudo() {
    vidas--;
    atualizarPlacar();
    if (vidas <= 0) {
        estadoJogo = "derrota";
    } else {
        resetarPosicaoJogador();
    }
}

// =========================================================
// 6. GRÁFICOS NEON NO CANVAS
// =========================================================
function desenhar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Estrelas no fundo
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    for (let est of estrelas) {
        ctx.fillRect(est.x, est.y, est.tamanho, est.tamanho);
    }

    // 2. Plataformas Futuristas
    for (let plat of plataformas) {
        ctx.fillStyle = "#192a56";
        ctx.fillRect(plat.x, plat.y, plat.largura, plat.altura);

        // Linha neon brilhante no topo (rosa se for móvel, ciano se for fixa)
        ctx.fillStyle = plat.vx !== 0 ? "#ff007f" : "#00f3ff";
        ctx.fillRect(plat.x, plat.y, plat.largura, 4);
    }

    // 3. Cristais de Energia (formato de losango)
    for (let cristal of cristais) {
        if (!cristal.coletado) {
            ctx.save();
            ctx.translate(cristal.x, cristal.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = "#ffea00";
            ctx.fillRect(-cristal.tamanho / 1.5, -cristal.tamanho / 1.5, cristal.tamanho * 1.3, cristal.tamanho * 1.3);
            ctx.restore();
        }
    }

    // 4. Drones Inimigos
    for (let drone of drones) {
        ctx.fillStyle = "#2f3542";
        ctx.fillRect(drone.x, drone.y, drone.largura, drone.altura);
        
        // Luz vermelha central do drone
        ctx.fillStyle = "#ff3f34";
        ctx.fillRect(drone.x + 6, drone.y + 7, drone.largura - 12, 6);
    }

    // 5. Portal de Teletransporte Giratório
    ctx.save();
    ctx.translate(portalFinal.x + portalFinal.largura / 2, portalFinal.y + portalFinal.altura / 2);
    ctx.rotate(anguloPortal);
    ctx.strokeStyle = "#0be881";
    ctx.lineWidth = 4;
    ctx.strokeRect(-16, -16, 32, 32);
    ctx.rotate(-anguloPortal * 2);
    ctx.strokeStyle = "#00f3ff";
    ctx.strokeRect(-10, -10, 20, 20);
    ctx.restore();

    // 6. Personagem Cyber-Runner
    ctx.fillStyle = jogador.cor;
    ctx.fillRect(jogador.x, jogador.y, jogador.largura, jogador.altura);

    // Visor futurista (muda de lado conforme o jogador anda)
    ctx.fillStyle = "#090a0f";
    const visorX = jogador.direcao === 1 ? jogador.x + 12 : jogador.x + 2;
    ctx.fillRect(visorX, jogador.y + 7, 14, 7);

    // Efeito de propulsão se usou o Pulo Duplo no ar
    if (jogador.pulosRestantes === 0 && jogador.vy < 0) {
        ctx.fillStyle = "#ff007f";
        ctx.fillRect(jogador.x + 6, jogador.y + jogador.altura, 16, 8);
    }

    // 7. Telas de Vitória ou Derrota
    if (estadoJogo === "vitoria" || estadoJogo === "derrota") {
        ctx.fillStyle = "rgba(9, 10, 15, 0.85)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = estadoJogo === "vitoria" ? "#0be881" : "#ff007f";
        ctx.font = "bold 40px 'Courier New', monospace";
        ctx.textAlign = "center";

        const mensagem = estadoJogo === "vitoria" ? "SETOR CONCLUÍDO!" : "FALHA NO SISTEMA!";
        ctx.fillText(mensagem, canvas.width / 2, canvas.height / 2 - 20);

        ctx.fillStyle = "#ffffff";
        ctx.font = "20px 'Courier New', monospace";
        ctx.fillText(`Energia Coletada: ${pontos}`, canvas.width / 2, canvas.height / 2 + 25);

        ctx.fillStyle = "#00f3ff";
        ctx.font = "15px 'Courier New', monospace";
        ctx.fillText("Clique em 'Reiniciar Sistema' para tentar novamente", canvas.width / 2, canvas.height / 2 + 65);
    }
}

// =========================================================
// 7. LOOP PRINCIPAL
// =========================================================
function loopPrincipal() {
    atualizar();
    desenhar();
    requestAnimationFrame(loopPrincipal);
}

iniciarFase();
loopPrincipal();
