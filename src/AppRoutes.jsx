import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Notifications } from '@mantine/notifications';

// Layout e Paginas
import { MainLayout } from './layout/index';
import { Login } from './Pages/Login';
import { Cadastro } from './Pages/Cadastro';
import { RecuperarSenha } from './Pages/RecuperarSenha';
import { RedefinirSenha } from './Pages/RedefinirSenha';
import { Home } from './Pages/Home';
import { Cursos } from './Pages/Cursos';
import { Faculdades } from './Pages/Faculdades';
import { Detalhes } from './Pages/Detalhes';
import { Perfil } from './Pages/Perfil'

import { Navigate, Outlet } from 'react-router-dom';

// Protege apenas a rota /perfil: sem token, manda para o Cadastro
// (não para o Login, conforme o fluxo: quem quer se cadastrar cai direto no Perfil).
export const RequireAuth = () => {
  const isAuthenticated = localStorage.getItem('@NotePlus:token');

  return isAuthenticated ? <Outlet /> : <Navigate to="/cadastro" replace />;
};

export const AppRoutes = () => {
  return (
    <>
      <Notifications />
      <BrowserRouter>
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
          </Route>

        </Routes>
      </BrowserRouter>
    </>
  );
};
