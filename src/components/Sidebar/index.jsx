import {
  Button,
  Container,
  Stack,
  Anchor,
  Text,
  Card,
  Group,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import { IconHome, IconBook, IconSchool, IconLogout, IconUser, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import classes from './Sidebar.module.css';

const LINKS = [
  { to: '/', icon: IconHome, label: 'Menu' },
  { to: '/cursos', icon: IconBook, label: 'Cursos' },
  { to: '/faculdades', icon: IconSchool, label: 'Faculdades' },
  { to: '/perfil', icon: IconUser, label: 'Perfil' },
];

// collapsed/onToggleCollapse vêm do MainLayout: o conteúdo da página
// precisa saber a largura atual da sidebar pra ajustar sua margem, então o
// estado mora um nível acima em vez de só aqui dentro.
export const Sidebar = ({ collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('@NotePlus:token');
    setIsLoggedIn(!!token); // Transforma em booleano (true se houver token, false se não)
  }, []);

  const handleLogout = () => {
    // 1. Limpa TUDO do storage (token e dados do usuário)
    localStorage.removeItem('@NotePlus:token');
    localStorage.removeItem('@NotePlus:user');

    // 2. ATUALIZA O ESTADO NA HORA para o Sidebar reagir
    setIsLoggedIn(false);

    // 3. Volta pra Home (não faz sentido mandar pra cadastro/login ao sair)
    navigate('/');
  };

  return (
    <Container
      className={`${classes.painel} ${collapsed ? classes.painelCollapsed : ''}`}
      p={0}
      m={0}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        zIndex: 100
      }}
    >
      <Card className={classes.sidebarCard} h={'100vh'} shadow="sm" radius={0} withBorder>
        <Stack className={classes.stackContainer} justify="flex-start" p="12px" h="100%">

          <Group className={classes.topBar} justify={collapsed ? 'center' : 'space-between'} wrap="nowrap">
            {!collapsed && <Text className={classes.logo}>NotePlus+</Text>}
            <ActionIcon
              variant="subtle"
              color="gray.4"
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expandir menu' : 'Retrair menu'}
              title={collapsed ? 'Expandir menu' : 'Retrair menu'}
            >
              {collapsed ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
            </ActionIcon>
          </Group>

          {/* LINKS - Virarão linha no mobile */}
          <Stack className={classes.linksStack} gap="sm">
            {LINKS.map((item) => (
              <Tooltip key={item.to} label={item.label} position="right" disabled={!collapsed} withinPortal>
                <Anchor component={NavLink} to={item.to} className={classes.link} underline="never">
                  <Group gap="xs" className={classes.linkGroup} justify={collapsed ? 'center' : 'flex-start'} wrap="nowrap">
                    <item.icon size={22} stroke={1.5} />
                    {!collapsed && <Text size="sm">{item.label}</Text>}
                  </Group>
                </Anchor>
              </Tooltip>
            ))}
          </Stack>

          {isLoggedIn ? (
            <Stack mt="auto" gap="sm">
              <Tooltip label="Sair" position="right" disabled={!collapsed} withinPortal>
                <Button
                  fullWidth
                  variant="light"
                  color="red"
                  radius="md"
                  size="sm"
                  className={classes.logoutBtn}
                  px={collapsed ? 0 : undefined}
                  leftSection={!collapsed ? <IconLogout size={18} stroke={1.5} /> : undefined}
                  onClick={handleLogout}
                >
                  {collapsed ? <IconLogout size={18} stroke={1.5} /> : 'Sair'}
                </Button>
              </Tooltip>
            </Stack>
          ) : (
            !collapsed && (
              /* PROPAGANDA - Sumirá no mobile via CSS */
              <Stack mt="auto" className={classes.propaganda} gap="md">
                <Text size="md" fw={700} ta="center" className={classes.propagandaTitle}>
                  Versão Completa
                </Text>
                <Text size="xs" ta="center" c="dimmed" lh={1.4}>
                  Acesso à estatistícas e muito mais
                </Text>
                <Button
                  fullWidth
                  className={classes.propagandaBtn}
                  radius="md"
                  size="sm"
                  onClick={() => navigate('/cadastro')}
                >
                  Criar Conta
                </Button>
                <Anchor
                  component="button"
                  type="button"
                  ta="center"
                  size="xs"
                  underline="never"
                  onClick={() => navigate('/login')}
                >
                  ou Entrar na Conta
                </Anchor>
              </Stack>
            )
          )}

        </Stack>
      </Card>
    </Container>
  );
};
