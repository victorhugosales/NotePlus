const TOKEN_KEY = '@NotePlus:token';
const USER_KEY = '@NotePlus:user';

// Sessão fica em localStorage (sobrevive a fechar o navegador) quando o
// usuário marca "Lembrar de mim", ou em sessionStorage (some ao fechar a
// aba/navegador) quando não marca. Getters checam os dois storages porque
// não sabem de antemão onde a sessão atual foi salva.
export function salvarSessao(token, user, lembrar) {
  const destino = lembrar ? localStorage : sessionStorage;
  const outro = lembrar ? sessionStorage : localStorage;

  outro.removeItem(TOKEN_KEY);
  outro.removeItem(USER_KEY);
  destino.setItem(TOKEN_KEY, token);
  destino.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
}

export function getUsuario() {
  const bruto = localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto);
  } catch {
    return null;
  }
}

export function limparSessao() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}
