import { useEffect, useRef, useState } from 'react';
import { notifications } from '@mantine/notifications';

// Feedback quando o usuário aperta "Pesquisar" com o campo de texto vazio —
// sem isso o sistema não fazia nada e parecia travado (relato de um usuário
// que tentou pesquisar assim, na Home). `buscaErro` liga por meio segundo
// pra disparar o tremor + aura vermelha no input (classe CSS própria de
// cada página, ver home/Cursos/Faculdades.module.css). Usado em Home,
// Cursos e Faculdades.
export function useAvisoBuscaVazia() {
  const [buscaErro, setBuscaErro] = useState(false);
  const timeoutRef = useRef(null);

  useEffect(() => () => clearTimeout(timeoutRef.current), []);

  const avisarBuscaVazia = (mensagem) => {
    notifications.show({
      title: 'Campo de busca vazio',
      message: mensagem,
      color: 'yellow',
    });

    clearTimeout(timeoutRef.current);
    setBuscaErro(false);
    // Força o "reflow" pra reiniciar a animação CSS mesmo se o usuário
    // clicar em "Pesquisar" vazio de novo antes do timeout anterior zerar.
    requestAnimationFrame(() => setBuscaErro(true));
    timeoutRef.current = setTimeout(() => setBuscaErro(false), 500);
  };

  return { buscaErro, avisarBuscaVazia };
}
