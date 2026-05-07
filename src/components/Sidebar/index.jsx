import {
  Button,
  Container,
  Stack,
  Anchor,
  Text,
  Card,
  Group
} from '@mantine/core';
import { IconHome, IconBook, IconSchool, IconLogout, IconUser } from '@tabler/icons-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import classes from './Sidebar.module.css';

export const Sidebar = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('@NotePlus:token');
    setIsLoggedIn(!!token); // Transforma em booleano (true se houver token, false se não)
  }, []);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('@NotePlus:token');
    setIsLoggedIn(!!token);
  };

  const handleLogout = () => {
    // 1. Limpa TUDO do storage (token e dados do usuário)
    localStorage.removeItem('@NotePlus:token');
    localStorage.removeItem('@NotePlus:user');

    // 2. ATUALIZA O ESTADO NA HORA para o Sidebar reagir
    setIsLoggedIn(false);

    // 3. Manda o cara pro login
    navigate('/login');

    // Opcional: força um refresh se sua rota não for protegida automaticamente
    // window.location.reload(); 
  };

  return (
    <Container
      className={classes.painel}
      p={0}
      m={0}
      h={'100vh'}
      style={{
        position: 'fixed',
        left: 160,
        top: 0,
        width: '300px',
        zIndex: 100
      }}
    >

      <Card h={'100vh'} shadow="sm" padding="lg" radius="md" withBorder>
        <Stack justify="flex-start" p="12px" h="100%">

          {/* LOGO */}
          <Text align="center" className={classes.logo}>NotePlus+</Text>

          {/* LINKS */}
          <Stack gap="sm">
            <Anchor
              component={NavLink}
              to="/"
              className={classes.link}
              underline="never"
            >
              <Group gap="xs">
                <IconHome size={20} stroke={1.5} />
                <Text>Menu</Text>
              </Group>
            </Anchor>

            <Anchor
              component={NavLink}
              to="/cursos"
              className={classes.link}
              underline="never"
            >
              <Group gap="xs">
                <IconBook size={20} stroke={1.5} />
                <Text>Cursos</Text>
              </Group>
            </Anchor>

            <Anchor
              component={NavLink}
              to="/faculdades"
              className={classes.link}
              underline="never"
            >
              <Group gap="xs">
                <IconSchool size={20} stroke={1.5} />
                <Text>Faculdades</Text>
              </Group>
            </Anchor>



            {/* {isLoggedIn && (
              <>
                <Anchor component={NavLink} to="/perfil" className={classes.link} underline="never">
                  <Group gap="xs">
                    <IconUser size={20} stroke={1.5} />
                    <Text>Perfil</Text>
                  </Group>
                </Anchor>

                <Anchor
                  className={classes.link}
                  c="red"
                  underline='never'
                  onClick={handleLogout}
                  style={{ cursor: 'pointer' }}
                >
                  <Group gap="xs">
                    <IconLogout size={20} stroke={1.5} />
                    <Text>Sair</Text>
                  </Group>
                </Anchor>
              </>
            )}

            
            {!isLoggedIn && (
              <Anchor component={NavLink} to="/login" className={classes.link} underline="never">
                <Group gap="xs">
                  <IconUser size={20} stroke={1.5} />
                  <Text>Entrar</Text>
                </Group>
              </Anchor>
            )} */}

          </Stack>

          {/* Propaganda */}
          <Stack mt="auto" className={classes.propaganda} gap="md">
            <Stack gap={0} align="center">
              <Text
                size="lg"
                fw={700}
                ta="center"
                className={classes.propagandaTitle}
              >
                Versão Completa
              </Text>
            </Stack>

            <Text size="xs" ta="center" c="dimmed" lh={1.4}>
              Acesso à estatistícas, previsões, comparações, perfil, notificações e muito mais
            </Text>

            <Button
              fullWidth
              className={classes.propagandaBtn}
              radius="md"
              size="md"
            >
              Criar Conta
            </Button>
          </Stack>

        </Stack>
      </Card>

    </Container>
  );
};
