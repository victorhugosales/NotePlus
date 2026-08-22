// Efeitos sonoros da interface (clique, retrair sidebar, ligar/desligar
// recursos). Sintetizamos um "blip" curto via Web Audio API em vez de usar
// arquivos de áudio — mais leve e sem depender de assets externos.
//
// Respeita a preferência "Efeitos sonoros" do usuário (Perfil > Configurações),
// guardada no localStorage pra funcionar mesmo sem login e sem precisar
// esperar o perfil carregar da API.
const CHAVE_PREFERENCIA = '@NotePlus:efeitosSonoros';

export function efeitosSonorosAtivos() {
    const valor = localStorage.getItem(CHAVE_PREFERENCIA);
    return valor === null ? true : valor === 'true'; // padrão: ligado
}

export function definirEfeitosSonoros(ativo) {
    localStorage.setItem(CHAVE_PREFERENCIA, String(ativo));
}

let audioContext;

function getAudioContext() {
    if (!audioContext) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        audioContext = new AudioContextClass();
    }
    return audioContext;
}

// Toca um "blip" curto e discreto. frequencia/duracao dão variações leves
// pra diferenciar ações (clique padrão vs. ligar/desligar um recurso).
function tocarBlip(frequencia = 440, duracaoMs = 60, volume = 0.05) {
    if (!efeitosSonorosAtivos()) return;

    try {
        const ctx = getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') ctx.resume();

        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = frequencia;

        const agora = ctx.currentTime;
        gain.gain.setValueAtTime(volume, agora);
        gain.gain.exponentialRampToValueAtTime(0.001, agora + duracaoMs / 1000);

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(agora);
        oscillator.stop(agora + duracaoMs / 1000);
    } catch {
        // Ambiente sem suporte a Web Audio (ex.: alguns navegadores em modo
        // privado bloqueiam antes da primeira interação) — falha em silêncio.
    }
}

export const tocarClique = () => tocarBlip(520, 50, 0.05);
export const tocarToggleLigado = () => tocarBlip(660, 70, 0.06);
export const tocarToggleDesligado = () => tocarBlip(340, 70, 0.06);
