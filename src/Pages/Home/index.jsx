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
  Collapse,
  useMantineColorScheme
} from '@mantine/core';
import {
  IconBook2, IconChartBar, IconBuildingBank, IconMapPin, IconPalette, IconStar,
  IconFilter, IconChevronDown, IconChevronUp,
} from '@tabler/icons-react';
import classes from '../Home/home.module.css';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CardCurso } from '../../components/Card';
import { GrupoEstado } from '../../components/GrupoEstado';
import api from '../../services/api';
import { useDisclosure } from '@mantine/hooks';
import { useFavoritos } from '../../hooks/useFavoritos';
import { useAnosDisponiveis } from '../../hooks/useAnosDisponiveis';
import { getToken, getUsuario } from '../../utils/authStorage';
import { LoginRequiredModal } from '../../components/LoginRequiredModal';
import { NotificacoesButton } from '../../components/NotificacoesButton';
import { estadosMap, opcoesEstado } from '../../utils/estados';
import { FiltroCascataModal } from '../../components/FiltroCascataModal';
import { FiltroCursosModal } from '../../components/FiltroCursosModal';

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
  const [filtrosOpened, { toggle: toggleFiltros }] = useDisclosure(false);
  const [municipioModalOpened, { open: openMunicipioModal, close: closeMunicipioModal }] = useDisclosure(false);
  const [instituicaoModalOpened, { open: openInstituicaoModal, close: closeInstituicaoModal }] = useDisclosure(false);
  const [cursoModalOpened, { open: openCursoModal, close: closeCursoModal }] = useDisclosure(false);
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

  // Turno entra na chave: matutino e vespertino do mesmo curso têm vagas e
  // nota de corte próprias, não podem ser somados juntos. Compartilhado
  // entre a busca por termo e os 3 filtros em cascata (município,
  // instituição, curso) — todos consomem /pesquisar e precisam do mesmo
  // agrupamento antes de renderizar em CardCurso.
  const agruparResultados = (dados) => {
    const mapaAgrupado = {};
    dados.forEach(item => {
      const chave = `${item.codigo_curso}-${item.sigla_universidade}-${item.turno || ''}`;

      if (!mapaAgrupado[chave]) {
        mapaAgrupado[chave] = { ...item, vagas: Number(item.vagas) };
      } else {
        mapaAgrupado[chave].vagas += Number(item.vagas);
      }
    });
    return Object.values(mapaAgrupado);
  };

  // Chama /pesquisar, agrupa e persiste o resultado — usado tanto pela
  // busca por termo quanto pelos 3 filtros em cascata, que só variam nos
  // parâmetros enviados e no texto/estado exibidos depois.
  const executarPesquisa = async (params, { termoExibicao, estadoExibicao = '' }) => {
    setLoading(true);
    try {
      const response = await api.get('/pesquisar', { params });
      const final = agruparResultados(response.data);

      setResultados(final);
      setPesquisa(termoExibicao);
      setEstado(estadoExibicao);
      sessionStorage.setItem('home_lastResults', JSON.stringify(final));
      sessionStorage.setItem('home_lastSearch', termoExibicao);
      sessionStorage.setItem('home_lastEstado', estadoExibicao);
      sessionStorage.setItem('home_lastAno', ano);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  //Input de pesquisa
  const handleSearch = async (termoManual) => {
    const termoFinal = (typeof termoManual === 'string' ? termoManual : pesquisa).trim();
    if (!termoFinal) return;

    await executarPesquisa(
      { curso: termoFinal.toUpperCase(), global: true, ano, ...(estado && { uf: estado }) },
      { termoExibicao: termoFinal, estadoExibicao: estado }
    );
  };

  // Filtro "Municípios": escolheu o estado e depois o município no modal —
  // resultado são os cursos oferecidos naquele município.
  const handleSelecionarMunicipio = (municipio, uf) => {
    executarPesquisa(
      { cidade: municipio, uf, ano },
      { termoExibicao: municipio, estadoExibicao: uf }
    );
  };

  // Filtro "Instituições": mesma mecânica, mas o passo final é a
  // instituição escolhida dentro do estado.
  const handleSelecionarInstituicao = (instituicao, uf) => {
    executarPesquisa(
      { universidade: instituicao, uf, ano },
      { termoExibicao: instituicao, estadoExibicao: uf }
    );
  };

  // Filtro "Cursos": lista flat, sem cascata de estado — resultado é o
  // mesmo formato da Pesquisa Geral (agrupado por todos os estados).
  const handleSelecionarCurso = (curso) => {
    executarPesquisa(
      { curso, global: true, ano },
      { termoExibicao: curso }
    );
  };

  const dadosAgrupados = agruparPorEstado(resultados);

  // Alterna claro/escuro e, se o usuário estiver logado, salva a escolha no
  // perfil (coluna "tema" em app_configuracoes) pra manter em outros acessos.
  const handleMudarTema = async () => {
    const novoTema = colorScheme === 'dark' ? 'light' : 'dark';
    setColorScheme(novoTema);

    const userData = getUsuario();
    if (!userData?.id) return;

    try {
      await api.put(`/usuario/${userData.id}`, { configuracoes: { tema: novoTema } });
    } catch (error) {
      console.error('Erro ao salvar tema', error);
    }
  };

  const handleAbrirFavoritados = () => {
    if (!getToken()) {
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

      <FiltroCascataModal
        opened={municipioModalOpened}
        onClose={closeMunicipioModal}
        titulo="Municípios"
        tipo="municipio"
        ano={ano}
        onSelecionar={handleSelecionarMunicipio}
      />

      <FiltroCascataModal
        opened={instituicaoModalOpened}
        onClose={closeInstituicaoModal}
        titulo="Instituições"
        tipo="instituicao"
        ano={ano}
        onSelecionar={handleSelecionarInstituicao}
      />

      <FiltroCursosModal
        opened={cursoModalOpened}
        onClose={closeCursoModal}
        ano={ano}
        onSelecionar={handleSelecionarCurso}
      />

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

        <Box mt={12}>
          <Button
            variant="subtle"
            size="sm"
            leftSection={<IconFilter size={16} />}
            rightSection={filtrosOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
            onClick={toggleFiltros}
          >
            Filtros
          </Button>
          <Collapse in={filtrosOpened}>
            <Group mt="sm">
              <Button variant="outline" leftSection={<IconMapPin size={16} />} onClick={openMunicipioModal}>
                Municípios
              </Button>
              <Button variant="outline" leftSection={<IconBuildingBank size={16} />} onClick={openInstituicaoModal}>
                Instituições
              </Button>
              <Button variant="outline" leftSection={<IconBook2 size={16} />} onClick={openCursoModal}>
                Cursos
              </Button>
            </Group>
          </Collapse>
        </Box>
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
                  <GrupoEstado key={sigla} sigla={sigla} nomeEstado={estadosMap[sigla]}>
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
                  </GrupoEstado>
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