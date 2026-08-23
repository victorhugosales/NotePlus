import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';
import { MantineProvider, useMantineColorScheme, createTheme } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { useEffect } from 'react';
import './App.css'
import { AppRoutes } from './AppRoutes';
import api from './services/api';
import { definirEfeitosSonoros } from './utils/sons';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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

// Aplica as preferências salvas no perfil do usuário logado assim que o
// app carrega (tema e efeitos sonoros). Sem login, cada uma já tem um
// padrão razoável guardado no localStorage (Mantine cuida do tema sozinho;
// efeitos sonoros usa src/utils/sons.js).
const ThemeSync = () => {
  const { setColorScheme } = useMantineColorScheme();

  useEffect(() => {
    const token = localStorage.getItem('@NotePlus:token');
    const storedUser = localStorage.getItem('@NotePlus:user');
    const userData = storedUser ? JSON.parse(storedUser) : null;

    if (!token || !userData?.id) return;

    api.get(`/usuario/${userData.id}`)
      .then((response) => {
        const configuracoes = response.data?.configuracoes;
        const tema = configuracoes?.tema;
        if (tema === 'light' || tema === 'dark') setColorScheme(tema);

        if (typeof configuracoes?.efeitos_sonoros === 'boolean') {
          definirEfeitosSonoros(configuracoes.efeitos_sonoros);
        }
      })
      .catch((error) => console.error('Erro ao sincronizar preferências do usuário', error));
  }, [setColorScheme]);

  return null;
};

export const App = () => {
  const conteudo = (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <ModalsProvider>
        <ThemeSync />
        <AppRoutes />
      </ModalsProvider>
    </MantineProvider>
  );

  // Sem VITE_GOOGLE_CLIENT_ID configurado (ex.: alguém ainda não preencheu
  // o .env local), o app continua funcionando normalmente — só o botão de
  // login com Google não vai inicializar.
  if (!GOOGLE_CLIENT_ID) return conteudo;

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {conteudo}
    </GoogleOAuthProvider>
  );
};
