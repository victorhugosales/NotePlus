import {
  Button,
  Container,
  Paper,
  Autocomplete,
  Select,
  Group,
  Text,
  Box,
  SimpleGrid,
  Loader,
  Center,
  Modal,
  useMantineColorScheme
} from '@mantine/core';
import { IconBook2, IconChartBar, IconBuildingBank, IconMapPin, IconPalette, IconStar } from '@tabler/icons-react';
import classes from '../Home/home.module.css';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CardCurso } from '../../components/Card';
import api from '../../services/api';
import { useDisclosure } from '@mantine/hooks';
import { useFavoritos } from '../../hooks/useFavoritos';
import { useAnosDisponiveis } from '../../hooks/useAnosDisponiveis';
import { LoginRequiredModal } from '../../components/LoginRequiredModal';
import { NotificacoesButton } from '../../components/NotificacoesButton';

const estadosMap = {
  'AC': 'ACRE', 'AL': 'ALAGOAS', 'AM': 'AMAZONAS', 'AP': 'AMAPÁ', 'BA': 'BAHIA',
  'CE': 'CEARÁ', 'DF': 'DISTRITO FEDERAL', 'ES': 'ESPÍRITO SANTO', 'GO': 'GOIÁS',
  'MA': 'MARANHÃO', 'MG': 'MINAS GERAIS', 'MS': 'MATO GROSSO DO SUL', 'MT': 'MATO GROSSO',
  'PA': 'PARÁ', 'PB': 'PARAÍBA', 'PE': 'PERNAMBUCO', 'PI': 'PIAUÍ', 'PR': 'PARANÁ',
  'RJ': 'RIO DE JANEIRO', 'RN': 'RIO GRANDE DO NORTE', 'RO': 'RONDÔNIA', 'RR': 'RORAIMA',
  'RS': 'RIO GRANDE DO SUL', 'SC': 'SANTA CATARINA', 'SE': 'SERGIPE', 'SP': 'SÃO PAULO',
  'TO': 'TOCANTINS'
};

// Opções do filtro de Estado: "CE - CEARÁ", etc. Vazio = todos os estados.
const opcoesEstado = Object.entries(estadosMap).map(([sigla, nome]) => ({
  value: sigla,
  label: `${sigla} - ${nome}`
}));

export const Home = () => {
  const [pesquisa, setPesquisa] = useState(sessionStorage.getItem('home_lastSearch') || '');
  const [estado, setEstado] = useState(sessionStorage.getItem('home_lastEstado') || '');
  const [ano, setAno] = useState(sessionStorage.getItem('home_lastAno') || '');
  const [resultados, setResultados] = useState(JSON.parse(sessionStorage.getItem('home_lastResults')) || []);
  const [sugestoes, setSugestoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true)
  const location = useLocation();

  const { colorScheme, setColorScheme } = useMantineColorScheme();
  const [loginModalOpened, { open: openLoginModal, close: closeLoginModal }] = useDisclosure(false);
  const [favoritosModalOpened, { open: openFavoritosModal, close: closeFavoritosModal }] = useDisclosure(false);
  const { favoritos, isFavorito, toggleFavorito } = useFavoritos({ onNaoAutenticado: openLoginModal });
  const { opcoes: opcoesAno } = useAnosDisponiveis();

  // Sem ano salvo de uma busca anterior, usa a edição mais recente assim
  // que a lista de anos disponíveis chega — nada fica fixo no código, então
  // uma edição nova vira o padrão automaticamente.
  useEffect(() => {
    if (!ano && opcoesAno.length > 0) setAno(opcoesAno[0].value);
  }, [ano, opcoesAno]);

  //organização dos Dados da DashBoard. Começa com o último valor visto
  //(sessionStorage) em vez de zerado — sem isso, toda vez que a Home
  //remonta (ex.: voltando de outra página) os números piscavam pra 0 e só
  //depois voltavam a aparecer, mesmo o backend já tendo isso em cache.
  const [stats, setStats] = useState(() => {
    const cache = sessionStorage.getItem('home_lastStats');
    return cache ? JSON.parse(cache) : {
      totalCursos: 0,
      totalFaculdades: 0,
      mediaCursos: 0,
      totalEstados: 0
    };
  });

  //Carrega os dados da DashBoard (sempre busca de novo em segundo plano
  //pra manter atualizado, mas a tela já mostra o último valor conhecido
  //enquanto isso acontece).
  useEffect(() => {
    const carregarStats = async () => {
      try {
        const response = await api.get('/stats');
        setStats(response.data);
        sessionStorage.setItem('home_lastStats', JSON.stringify(response.data));
      } catch (error) {
        console.error("Erro ao carregar dashboard", error);
      } finally {
        setLoadingStats(false);
      }
    };

    carregarStats();
  }, []);

  //Agrupa os resultados por Estado
  const agruparPorEstado = (dados) => {
    return dados.reduce((acc, item) => {
      const uf = item.uf_campus || 'Outros';
      if (!acc[uf]) acc[uf] = [];
      acc[uf].push(item);
      return acc;
    }, {});
  };

  useEffect(() => {
    if (location.pathname !== '/' && !location.pathname.includes('/detalhes')) {
      sessionStorage.removeItem('home_lastSearch');
      sessionStorage.removeItem('home_lastResults');
    }
  }, [location.pathname]);

  //Sugestões de pesquisa no input
  useEffect(() => {
    const buscarSugestoes = async () => {
      if (pesquisa.length < 1) {
        setSugestoes([]);
        return;
      }
      try {
        // Busca global: tenta curso e universidade
        const [resCurso, resUni] = await Promise.all([
          api.get('/sugestoes', { params: { curso: pesquisa } }),
          api.get('/sugestoes', { params: { universidade: pesquisa } })
        ]);
        const unificado = [...new Set([...resCurso.data, ...resUni.data])];
        setSugestoes(unificado);
      } catch (error) {
        console.error("Erro ao buscar sugestões", error);
      }
    };

    //ajuste de delay
    const delayDebounceFn = setTimeout(() => buscarSugestoes(), 0);
    return () => clearTimeout(delayDebounceFn);
  }, [pesquisa]);

  //Input de pesquisa
  const handleSearch = async (termoManual) => {
    const termoFinal = (typeof termoManual === 'string' ? termoManual : pesquisa).trim();
    if (!termoFinal) return;

    setLoading(true);
    try {
      const response = await api.get('/pesquisar', {
        params: {
          curso: termoFinal.toUpperCase(),
          global: true,
          ano,
          ...(estado && { uf: estado })
        }
      });

      const mapaAgrupado = {};
      response.data.forEach(item => {
        // Turno entra na chave: matutino e vespertino do mesmo curso têm
        // vagas e nota de corte próprias, não podem ser somados juntos.
        const chave = `${item.codigo_curso}-${item.sigla_universidade}-${item.turno || ''}`;

        if (!mapaAgrupado[chave]) {
          mapaAgrupado[chave] = { ...item, vagas: Number(item.vagas) };
        } else {
          mapaAgrupado[chave].vagas += Number(item.vagas);
        }
      });

      const final = Object.values(mapaAgrupado);
      setResultados(final);
      sessionStorage.setItem('home_lastResults', JSON.stringify(final));
      sessionStorage.setItem('home_lastSearch', termoFinal);
      sessionStorage.setItem('home_lastEstado', estado);
      sessionStorage.setItem('home_lastAno', ano);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const dadosAgrupados = agruparPorEstado(resultados);

  // Alterna claro/escuro e, se o usuário estiver logado, salva a escolha no
  // perfil (coluna "tema" em app_configuracoes) pra manter em outros acessos.
  const handleMudarTema = async () => {
    const novoTema = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(novoTema);

    const storedUser = localStorage.getItem('@NotePlus:user');
    const userData = storedUser ? JSON.parse(storedUser) : null;
    if (!userData?.id) return;

    try {
      await api.put(`/usuario/${userData.id}`, { configuracoes: { tema: novoTema } });
    } catch (error) {
      console.error('Erro ao salvar tema', error);
    }
  };

  const handleAbrirFavoritados = () => {
    if (!localStorage.getItem('@NotePlus:token')) {
      openLoginModal();
      return;
    }
    openFavoritosModal();
  };

  //Limpeza do input de pesquisa
  const handleClear = () => {
    setPesquisa('');
    setResultados([]);
    setSugestoes([]);
    sessionStorage.removeItem('home_lastSearch');
    sessionStorage.removeItem('home_lastResults');
  };

  return (
    <Container className={classes.mainContainer} fluid>
      <LoginRequiredModal
        opened={loginModalOpened}
        onClose={closeLoginModal}
        title="Favoritos e notificações"
        message="Esse recurso só está disponível para usuários da plataforma. Entre ou cadastre-se para favoritar cursos e receber notificações."
      />

      <Modal
        opened={favoritosModalOpened}
        onClose={closeFavoritosModal}
        title="Cursos favoritados"
        size="lg"
        centered
        overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
      >
        {favoritos.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            Você ainda não favoritou nenhum curso. Clique na estrela de um curso pra guardá-lo aqui.
          </Text>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            {favoritos.map((item) => (
              <CardCurso
                key={item.id}
                dados={item}
                isFavorito
                onToggleFavorito={toggleFavorito}
              />
            ))}
          </SimpleGrid>
        )}
      </Modal>

      <Box className={classes.header} justify='space-between' display='flex' align='center' mt={20}>
        <Group gap="xs">
          <Text className={classes.logo} fw={700}>Visão Geral</Text>
          {loadingStats && <Loader size="xs" color="brand" />}
        </Group>
        <Group className={classes.btnsHeader}>
          <Button
            className={classes.headerButton}
            variant="outline"
            leftSection={<IconPalette size={16} />}
            onClick={handleMudarTema}
          >
            Mudar Tema
          </Button>
          <Button
            className={classes.headerButton}
            variant="outline"
            leftSection={<IconStar size={16} />}
            onClick={handleAbrirFavoritados}
          >
            Favoritados
          </Button>
          <NotificacoesButton onNaoAutenticado={openLoginModal} className={classes.headerButton} />
        </Group>
      </Box>

      <Paper className={classes.dashboard} shadow="sm" p="md">
        <Box className={`${classes.statCard} ${classes.statCardBlue}`}>
          <Box className={`${classes.statIconBadge} ${classes.statIconBadgeBlue}`}>
            <IconBook2 size={22} stroke={1.5} />
          </Box>
          <Box>
            <Text className={classes.statNumber}>{stats.totalCursos}</Text>
            <Text className={classes.statLabel}>Cursos Disponíveis</Text>
          </Box>
        </Box>

        <Box className={`${classes.statCard} ${classes.statCardGreen}`}>
          <Box className={`${classes.statIconBadge} ${classes.statIconBadgeGreen}`}>
            <IconChartBar size={22} stroke={1.5} />
          </Box>
          <Box>
            <Text className={classes.statNumber}>{stats.mediaCursos}</Text>
            <Text className={classes.statLabel}>Cursos por Faculdade</Text>
          </Box>
        </Box>

        <Box className={`${classes.statCard} ${classes.statCardPurple}`}>
          <Box className={`${classes.statIconBadge} ${classes.statIconBadgePurple}`}>
            <IconBuildingBank size={22} stroke={1.5} />
          </Box>
          <Box>
            <Text className={classes.statNumber}>{stats.totalFaculdades}</Text>
            <Text className={classes.statLabel}>Faculdades Públicas</Text>
          </Box>
        </Box>

        <Box className={`${classes.statCard} ${classes.statCardGold}`}>
          <Box className={`${classes.statIconBadge} ${classes.statIconBadgeGold}`}>
            <IconMapPin size={22} stroke={1.5} />
          </Box>
          <Box>
            <Text className={classes.statNumber}>{stats.totalEstados}</Text>
            <Text className={classes.statLabel}>Estados Cadastrados</Text>
          </Box>
        </Box>
      </Paper>

      {/* SEARCHINPUT */}
      <Box mt={20}>
        <Text mb={20} align="center" size='xl' fw={500}>Pesquisa Geral</Text>
        <Group justify='space-between'>
          <Autocomplete
            size='md'
            flex={1}
            placeholder="Digite o nome do curso (ex: Ciência da...)"
            value={pesquisa}
            onChange={setPesquisa}
            data={sugestoes}
            filter={({ options }) => options}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            nothingFoundMessage="Nenhum curso sugerido"

            rightSectionPointerEvents="all"
            rightSection={
              pesquisa && (
                <Text
                  style={{ cursor: 'pointer', opacity: 0.5 }}
                  onClick={handleClear}
                  size="xs"
                  fw={700}
                >
                  X
                </Text>
              )
            }
          />
          <Select
            size='md'
            w={220}
            placeholder="Todos os estados"
            data={opcoesEstado}
            value={estado || null}
            onChange={(value) => setEstado(value || '')}
            searchable
            clearable
          />
          <Select
            size='md'
            w={140}
            data={opcoesAno}
            value={ano}
            onChange={(value) => setAno(value || opcoesAno[0]?.value || '')}
            allowDeselect={false}
          />
          <Button size="md" onClick={() => handleSearch()}>Pesquisar</Button>
        </Group>
      </Box>

      {/* Resultados em cards */}
      {loading ? (
        <Center mt={50}><Loader color="brand" /></Center>
      ) : (
        <Box mt={30}>
          {Object.keys(dadosAgrupados).length > 0 ? (
            // 1. Pegamos as siglas (chaves)
            Object.keys(dadosAgrupados)
              // 2. Ordenamos de A a Z
              .sort()
              // 3. Mapeamos as siglas ordenadas para renderizar
              .map((sigla) => {
                const itens = dadosAgrupados[sigla];
                return (
                  <Box key={sigla} mb={50}>
                    <Group mb="lg" gap="xs">
                      <Box bg="blue.7" px={8} py={2} style={{ borderRadius: 4 }}>
                        <Text c="white" fw={800}>{sigla}</Text>
                      </Box>
                      <Text fw={700} size="xl">- {estadosMap[sigla] || 'ESTADO'}</Text>
                    </Group>

                    <Box className={classes.resultsGrid}>
                      {itens.map((item) => (
                        <CardCurso
                          key={item.id_projeto}
                          dados={item}
                          isFavorito={isFavorito(item)}
                          onToggleFavorito={toggleFavorito}
                        />
                      ))}
                    </Box>
                  </Box>
                );
              })
          ) : (
            pesquisa && <Text ta="center" c="dimmed" mt={50}>Nenhum resultado encontrado.</Text>
          )}
        </Box>
      )}
    </Container>
  );
};