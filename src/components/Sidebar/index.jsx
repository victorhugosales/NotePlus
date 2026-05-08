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
      style={{
        position: 'fixed',
        left: '200px', // Ajustado para não ficar tão longe da borda no desktop
        top: 0,
        zIndex: 100
      }}
    >
      <Card className={classes.sidebarCard} h={'100vh'} shadow="sm" radius="md" withBorder>
        <Stack className={classes.stackContainer} justify="flex-start" p="12px" h="100%">

          {/* LOGO - Sumirá no mobile via CSS */}
          <Text align="center" className={classes.logo}>NotePlus+</Text>

          {/* LINKS - Virarão linha no mobile */}
          <Stack className={classes.linksStack} gap="sm">
            <Anchor component={NavLink} to="/" className={classes.link} underline="never">
              <Group gap="xs" className={classes.linkGroup}>
                <IconHome size={22} stroke={1.5} />
                <Text size="sm">Menu</Text>
              </Group>
            </Anchor>

            <Anchor component={NavLink} to="/cursos" className={classes.link} underline="never">
              <Group gap="xs" className={classes.linkGroup}>
                <IconBook size={22} stroke={1.5} />
                <Text size="sm">Cursos</Text>
              </Group>
            </Anchor>

            <Anchor component={NavLink} to="/faculdades" className={classes.link} underline="never">
              <Group gap="xs" className={classes.linkGroup}>
                <IconSchool size={22} stroke={1.5} />
                <Text size="sm">Faculdades</Text>
              </Group>
            </Anchor>
          </Stack>

          {/* PROPAGANDA - Sumirá no mobile via CSS */}
          <Stack mt="auto" className={classes.propaganda} gap="md">
            <Text size="md" fw={700} ta="center" className={classes.propagandaTitle}>
              Versão Completa
            </Text>
            <Text size="xs" ta="center" c="dimmed" lh={1.4}>
              Acesso à estatistícas e muito mais
            </Text>
            <Button fullWidth className={classes.propagandaBtn} radius="md" size="sm">
              Criar Conta
            </Button>
          </Stack>

        </Stack>
      </Card>
    </Container>
  );
};
