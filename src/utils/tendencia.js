// Regressão linear por mínimos quadrados (OLS) sobre (ano, nota) — "IA
// clássica" simples o bastante pra rodar no cliente sem custo. Usa o ano
// real como eixo X (não a posição no array) pra lidar corretamente com
// edições sem dado válido no meio da série.
export function calcularTendencia(pontos) {
    if (!pontos || pontos.length < 2) return null;

    const n = pontos.length;
    const mediaAno = pontos.reduce((soma, p) => soma + p.ano, 0) / n;
    const mediaNota = pontos.reduce((soma, p) => soma + p.nota, 0) / n;

    let numerador = 0;
    let denominador = 0;
    pontos.forEach(({ ano, nota }) => {
        const dx = ano - mediaAno;
        numerador += dx * (nota - mediaNota);
        denominador += dx * dx;
    });

    // Todos os pontos no mesmo ano (não deveria acontecer, cada ano aparece
    // uma vez na série) — sem variação em X não dá pra estimar inclinação.
    if (denominador === 0) return null;

    const inclinacao = numerador / denominador;
    const intercepto = mediaNota - inclinacao * mediaAno;

    const ultimoAno = Math.max(...pontos.map((p) => p.ano));
    const anoPrevisto = ultimoAno + 1;
    const previsao = Math.round((inclinacao * anoPrevisto + intercepto) * 100) / 100;

    let somaResidualQuadrado = 0;
    let somaTotalQuadrado = 0;
    pontos.forEach(({ ano, nota }) => {
        const previstoNoAno = inclinacao * ano + intercepto;
        somaResidualQuadrado += (nota - previstoNoAno) ** 2;
        somaTotalQuadrado += (nota - mediaNota) ** 2;
    });
    const r2 = somaTotalQuadrado === 0 ? 1 : 1 - somaResidualQuadrado / somaTotalQuadrado;

    const LIMIAR_ESTAVEL = 0.5;
    const direcao = inclinacao > LIMIAR_ESTAVEL ? 'alta' : inclinacao < -LIMIAR_ESTAVEL ? 'queda' : 'estavel';

    return {
        anoPrevisto,
        previsao,
        inclinacao,
        direcao,
        r2,
        // Com só 2 pontos a reta passa exatamente por eles (r2 = 1 sempre),
        // o que não significa confiança real — é só uma reta entre 2
        // números. Sinaliza isso à parte pra UI poder avisar o usuário.
        confiancaBaixa: n < 3,
    };
}
