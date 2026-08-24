import { useState, useEffect } from 'react';
import api from '../services/api';

const CACHE_KEY = 'cache_anos_disponiveis';

// Edições do SISU com dados no banco — vem de /anos-disponiveis em vez de
// lista fixa no código, então uma importação nova (ou uma edição antiga
// reimportada) aparece nos seletores de ano sem precisar editar nenhuma
// tela. Mesmo padrão stale-while-revalidate usado pros stats da Home:
// começa com o último valor visto (sessionStorage) pra não piscar vazio
// enquanto a requisição carrega.
export function useAnosDisponiveis() {
  const [anos, setAnos] = useState(() => {
    const cache = sessionStorage.getItem(CACHE_KEY);
    if (!cache) return [];
    try {
      const dados = JSON.parse(cache);
      return Array.isArray(dados) ? dados : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    api.get('/anos-disponiveis')
      .then((response) => {
        const dados = Array.isArray(response.data) ? response.data : [];
        setAnos(dados);
        sessionStorage.setItem(CACHE_KEY, JSON.stringify(dados));
      })
      .catch((error) => console.error('Erro ao buscar anos disponíveis', error));
  }, []);

  // Select do Mantine espera { label, value } com value em string.
  const opcoes = anos.map((ano, i) => ({
    label: i === 0 ? `${ano} (Atual)` : String(ano),
    value: String(ano),
  }));

  return { anos, opcoes };
}
