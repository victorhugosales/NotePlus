import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import { MantineProvider, useMantineColorScheme, createTheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { useEffect } from 'react';
import './App.css'
import { AppRoutes } from './AppRoutes';
import api from './services/api';

// Paleta de marca do NotePlus+: verde como cor primária, com tons pastel
// (definidos em cada tela, ex. cards de estatística) usados como fundo de
// destaque ao redor dele. Rampa criada à mão a partir de #05AE76.
const theme = createTheme({
  primaryColor: 'brand',
  primaryShade: 6,
  colors: {
    brand: [
      '#E7F6EE', // 0
      '#C3ECD7', // 1
      '#9FE2C0', // 2
      '#7AD8A9', // 3
      '#56CE92', // 4
      '#03AD74', // 5
      '#05AE76', // 6 - tom principal
      '#049160', // 7
      '#03744B', // 8
      '#025636', // 9
    ],
  },
});

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
    <MantineProvider theme={theme} defaultColorScheme="light">
      <ModalsProvider>
        <ThemeSync />
        <AppRoutes />
      </ModalsProvider>
    </MantineProvider>
  );
};
