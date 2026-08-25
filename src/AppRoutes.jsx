import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Notifications } from '@mantine/notifications';
import { Center, Loader } from '@mantine/core';

// Layout: fica fora do lazy, é o shell que aparece em toda navegação.
import { MainLayout } from './layout/index';

// Páginas: cada uma vira um chunk separado, carregado só quando a rota é
// acessada, em vez de tudo ir no bundle inicial.
const Login = lazy(() => import('./Pages/Login').then(m => ({ default: m.Login })));
const Cadastro = lazy(() => import('./Pages/Cadastro').then(m => ({ default: m.Cadastro })));
const RecuperarSenha = lazy(() => import('./Pages/RecuperarSenha').then(m => ({ default: m.RecuperarSenha })));
const RedefinirSenha = lazy(() => import('./Pages/RedefinirSenha').then(m => ({ default: m.RedefinirSenha })));
const Home = lazy(() => import('./Pages/Home').then(m => ({ default: m.Home })));
const Cursos = lazy(() => import('./Pages/Cursos').then(m => ({ default: m.Cursos })));
const Faculdades = lazy(() => import('./Pages/Faculdades').then(m => ({ default: m.Faculdades })));
const Detalhes = lazy(() => import('./Pages/Detalhes').then(m => ({ default: m.Detalhes })));
const Perfil = lazy(() => import('./Pages/Perfil').then(m => ({ default: m.Perfil })));
const ImportarNotas = lazy(() => import('./Pages/Admin/ImportarNotas').then(m => ({ default: m.ImportarNotas })));

import { Navigate, Outlet } from 'react-router-dom';
import { getToken, getUsuario } from './utils/authStorage';

const FallbackCarregando = () => (
  <Center style={{ height: '100vh' }}>
    <Loader />
  </Center>
);

// Protege apenas a rota /perfil: sem token, manda para o Cadastro
// (não para o Login, conforme o fluxo: quem quer se cadastrar cai direto no Perfil).
export const RequireAuth = () => {
  const isAuthenticated = getToken();

  return isAuthenticated ? <Outlet /> : <Navigate to="/cadastro" replace />;
};

// Área do admin: além de autenticado, o usuário salvo precisa ter is_admin
// — o backend confere de novo em cada request (é a autorização de verdade),
// isso aqui só evita que um usuário comum veja a tela existir.
export const RequireAdmin = () => {
  const isAuthenticated = getToken();
  const usuario = getUsuario();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!usuario?.is_admin) return <Navigate to="/" replace />;
  return <Outlet />;
};

export const AppRoutes = () => {
  return (
    <>
      <Notifications />
      <BrowserRouter>
        <Suspense fallback={<FallbackCarregando />}>
          <Routes>
            {/* Rotas públicas, sem sidebar */}
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/redefinir-senha" element={<RedefinirSenha />} />

            <Route element={<MainLayout />}>
              {/* Home e páginas de pesquisa: livres, sem exigir login */}
              <Route path="/" element={<Home />} />
              <Route path="/cursos" element={<Cursos />} />
              <Route path="/faculdades" element={<Faculdades />} />
              <Route path="/detalhes" element={<Detalhes />} />

              {/* Perfil: exige estar autenticado */}
              <Route element={<RequireAuth />}>
                <Route path='/perfil' element={<Perfil />} />
              </Route>

              {/* Admin: exige estar autenticado E is_admin */}
              <Route element={<RequireAdmin />}>
                <Route path='/admin/importar-notas' element={<ImportarNotas />} />
              </Route>
            </Route>

          </Routes>
        </Suspense>
      </BrowserRouter>
    </>
  );
};
