import '@mantine/core/styles.css';
import { MantineProvider, useMantineColorScheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { useEffect } from 'react';
import './App.css'
import { AppRoutes } from './AppRoutes';
import api from './services/api';

// Aplica o tema salvo no perfil do usuário logado assim que o app carrega.
// Sem login, o Mantine já mantém o último tema escolhido via localStorage
// sozinho (comportamento padrão do MantineProvider).
const ThemeSync = () => {
  const { setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    const token = localStorage.getItem('@NotePlus:token');
    const storedUser = localStorage.getItem('@NotePlus:user');
    const userData = storedUser ? JSON.parse(storedUser) : null;

    if (!token || !userData?.id) return;

    api.get(`/usuario/${userData.id}`)
      .then((response) => {
        const tema = response.data?.configuracoes?.tema;
        if (tema === 'light' || tema === 'dark') setColorScheme(tema);
      })
      .catch((error) => console.error('Erro ao sincronizar tema do usuário', error));
  }, [setColorScheme]);

  return null;
};

export const App = () => {
  return (
    <MantineProvider defaultColorScheme="light">
      <ModalsProvider>
        <ThemeSync />
        <AppRoutes />
      </ModalsProvider>
    </MantineProvider>
  );
};
