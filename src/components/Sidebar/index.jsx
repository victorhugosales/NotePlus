import {
  Button,
  Container,
  Stack,
  Anchor,
  Text,
  Card,
  Group,
  ActionIcon,
  UnstyledButton,
  Tooltip
} from '@mantine/core';
import { IconHome, IconBook, IconSchool, IconLogout, IconUser, IconChevronLeft, IconChevronRight, IconUpload, IconMessageCircle } from '@tabler/icons-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useMediaQuery } from '@mantine/hooks';
import classes from './Sidebar.module.css';
import { tocarClique } from '../../utils/sons';
import { getToken, getUsuario, limparSessao } from '../../utils/authStorage';

const LINKS = [
  { to: '/', icon: IconHome, label: 'Menu' },
  { to: '/cursos', icon: IconBook, label: 'Cursos' },
  { to: '/faculdades', icon: IconSchool, label: 'Faculdades' },
  { to: '/perfil', icon: IconUser, label: 'Perfil' },
  { to: '/feedback', icon: IconMessageCircle, label: 'Feedback' },
];

// collapsed/onToggleCollapse vêm do MainLayout: o conteúdo da página
// precisa saber a largura atual da sidebar pra ajustar sua margem, então o
// estado mora um nível acima em vez de só aqui dentro.
export const Sidebar = ({ collapsed, onToggleCollapse }) => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  // No mobile a sidebar vira barra inferior só com ícones — trata como
  // "sempre retraída" ali, independente do collapsed do desktop (que é
  // outro estado, persistido no localStorage e não deve valer aqui).
  const isMobile = useMediaQuery('(max-width: 768px)');
  const collapsedVisual = isMobile ? true : collapsed;

  useEffect(() => {
    const token = getToken();
    setIsLoggedIn(!!token); // Transforma em booleano (true se houver token, false se não)

    const usuario = getUsuario();
    setIsAdmin(!!usuario?.is_admin);
  }, []);

  const links = isAdmin ? [...LINKS, { to: '/admin/importar-notas', icon: IconUpload, label: 'Admin' }] : LINKS;

  const handleLogout = () => {
    // 1. Limpa TUDO do storage (token e dados do usuário)
    limparSessao();

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

          <Group className={classes.topBar} justify={collapsedVisual ? 'center' : 'space-between'} wrap="nowrap">
            {/* Espaçador invisível do mesmo tamanho do botão de retrair, do
                outro lado — com justify="space-between" e as duas pontas do
                mesmo tamanho, a logo no meio fica de verdade centralizada
                na barra, não só "colada à esquerda com o resto sobrando". */}
            {!collapsedVisual && (
              <ActionIcon variant="subtle" style={{ visibility: 'hidden' }} aria-hidden="true" tabIndex={-1}>
                <IconChevronLeft size={18} />
              </ActionIcon>
            )}
            {!collapsedVisual && (
              <UnstyledButton
                onClick={() => { tocarClique(); navigate('/'); }}
                className={classes.logo}
                aria-label="Ir para a Home"
              >
                NotePlus
              </UnstyledButton>
            )}
            <ActionIcon
              variant="subtle"
              color="gray.4"
              onClick={() => { tocarClique(); onToggleCollapse(); }}
              aria-label={collapsedVisual ? 'Expandir menu' : 'Retrair menu'}
              title={collapsedVisual ? 'Expandir menu' : 'Retrair menu'}
            >
              {collapsedVisual ? <IconChevronRight size={18} /> : <IconChevronLeft size={18} />}
            </ActionIcon>
          </Group>

          {/* LINKS - Virarão linha no mobile */}
          <Stack className={classes.linksStack} gap="sm">
            {links.map((item) => (
              <Tooltip key={item.to} label={item.label} position="right" disabled={!collapsedVisual} withinPortal>
                <Anchor component={NavLink} to={item.to} className={classes.link} underline="never">
                  <Group gap="xs" className={classes.linkGroup} justify={collapsedVisual ? 'center' : 'flex-start'} wrap="nowrap">
                    <item.icon size={22} stroke={1.5} />
                    {!collapsedVisual && <Text size="sm">{item.label}</Text>}
                  </Group>
                </Anchor>
              </Tooltip>
            ))}
          </Stack>

          {isLoggedIn ? (
            <Stack mt="auto" gap="sm" className={classes.logoutStack}>
              <Tooltip label="Sair" position="right" disabled={!collapsedVisual} withinPortal>
                <Button
                  fullWidth
                  variant="light"
                  color="red"
                  radius="md"
                  size="sm"
                  className={classes.logoutBtn}
                  px={collapsedVisual ? 0 : undefined}
                  leftSection={!collapsedVisual ? <IconLogout size={18} stroke={1.5} /> : undefined}
                  onClick={handleLogout}
                >
                  {collapsedVisual ? <IconLogout size={18} stroke={1.5} /> : 'Sair'}
                </Button>
              </Tooltip>
            </Stack>
          ) : (
            !collapsedVisual && (
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
