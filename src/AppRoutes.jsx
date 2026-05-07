import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

// Layout e Paginas
import { MainLayout } from './layout/index';
import { Login } from './Pages/Login';
import { Cadastro } from './Pages/Cadastro';
import { Home } from './Pages/Home';
import { Cursos } from './Pages/Cursos';
import { Faculdades } from './Pages/Faculdades';
import { Detalhes } from './Pages/Detalhes';
import { Perfil } from './Pages/Perfil'

import { Navigate, Outlet } from 'react-router-dom';
export const PrivateRoute = () => {
  const isAuthenticated = localStorage.getItem('@NotePlus:token');

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
};

export const AppRoutes = () => {
  return (
    <MantineProvider>
      <Notifications />
      <BrowserRouter>
        <Routes>
          <Route element={<PrivateRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
          </Route>

          <Route element={<MainLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/cursos" element={<Cursos />} />
            <Route path="/faculdades" element={<Faculdades />} />
            <Route path="/detalhes" element={<Detalhes />} />
            <Route path='/perfil' element={<Perfil />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
};