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
import { ImportarNotas } from './Pages/Admin/ImportarNotas';

import { Navigate, Outlet } from 'react-router-dom';
import { getToken, getUsuario } from './utils/authStorage';

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
      </BrowserRouter>
    </>
  );
};
