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
  ActionIcon,
  Tooltip,
  UnstyledButton,
  CloseButton,
  useMantineColorScheme
} from '@mantine/core';
import {
  IconBook2, IconChartBar, IconBuildingBank, IconMapPin, IconPalette, IconStar,
  IconFilter, IconChevronDown, IconChevronUp,
  IconFlame, IconTrophy, IconArmchair, IconDoorEnter,
} from '@tabler/icons-react';
import classes from '../Home/home.module.css';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CardCurso } from '../../components/Card';
import { GrupoEstado } from '../../components/GrupoEstado';
import api from '../../services/api';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useFavoritos } from '../../hooks/useFavoritos';
import { useAnosDisponiveis } from '../../hooks/useAnosDisponiveis';
import { getToken, getUsuario } from '../../utils/authStorage';
import { LoginRequiredModal } from '../../components/LoginRequiredModal';
import { NotificacoesButton } from '../../components/NotificacoesButton';
import { estadosMap, opcoesEstado } from '../../utils/estados';
import { FiltroCascataModal } from '../../components/FiltroCascataModal';
import { FiltroCursosModal } from '../../components/FiltroCursosModal';
import { useAvisoBuscaVazia } from '../../hooks/useAvisoBuscaVazia';

export const Home = () => {
  const [pesquisa, setPesquisa] = useState(sessionStorage.getItem('home_lastSearch') || '');
  // Guarda qual filtro em cascata (Municípios/Instituições) preencheu o
  // texto da busca, e com quê. Município/instituição usam parâmetros
  // diferentes (cidade/universidade) do que o botão "Pesquisar" (curso) —
  // sem isso, reaproveitar o texto que apareceu no input pra buscar de
  // novo tentava buscar o nome do município como se fosse curso e não
  // achava nada. Some assim que o usuário edita o texto manualmente.
  const [filtroAtivo, setFiltroAtivo] = useState(null);
  const [estado, setEstado] = useState(sessionStorage.getItem('home_lastEstado') || '');
  const [ano, setAno] = useState(sessionStorage.getItem('home_lastAno') || '');
  const [resultados, setResultados] = useState(JSON.parse(sessionStorage.getItem('home_lastResults')) || []);
  const [sugestoes, setSugestoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true)
  const { buscaErro, avisarBuscaVazia } = useAvisoBuscaVazia();
  const location = useLocation();

  const { colorScheme, setColorScheme } = useMantineColorScheme();
  // Ícones em vez de botões com texto e o dashboard retrátil são coisa só
  // do mobile — no desktop o header e o painel de estatísticas continuam
  // exatamente como sempre foram.
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [loginModalOpened, { open: openLoginModal, close: closeLoginModal }] = useDisclosure(false);
  const [favoritosModalOpened, { open: openFavoritosModal, close: closeFavoritosModal }] = useDisclosure(false);
  const [filtrosOpened, { toggle: toggleFiltros }] = useDisclosure(false);
  // Categorias começam abertas (é o conteúdo principal da Home vazia) mas
  // podem ser retraídas — mesma mecânica do botão "Filtros" mais abaixo.
  const [categoriasOpened, { toggle: toggleCategorias }] = useDisclosure(true);
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
  //enquanto isso acontece). Restrito à edição atual do SISU (`ano`) — sem
  //isso, os números somavam todas as edições importadas juntas.
  useEffect(() => {
    if (!ano) return;

    const carregarStats = async () => {
      try {
        const response = await api.get('/stats', { params: { ano } });
        setStats(response.data);
        sessionStorage.setItem('home_lastStats', JSON.stringify(response.data));
      } catch (error) {
        console.error("Erro ao carregar dashboard", error);
      } finally {
        setLoadingStats(false);
      }
    };

    carregarStats();
  }, [ano]);

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
    if (!termoFinal) {
      avisarBuscaVazia('Digite um curso ou instituição superior — ou use nossos filtros personalizados na aba "Filtros".');
      return;
    }

    // Texto ainda é o que veio de um filtro de Município/Instituição/
    // Destaque (não editado à mão): repete a mesma busca, com os
    // parâmetros certos, em vez de tratar o texto como se fosse curso.
    if (filtroAtivo && filtroAtivo.termo === termoFinal) {
      await executarPesquisa(
        { ...filtroAtivo.params, ano },
        { termoExibicao: termoFinal, estadoExibicao: filtroAtivo.params.uf || '' }
      );
      return;
    }

    await executarPesquisa(
      { curso: termoFinal.toUpperCase(), global: true, ano, ...(estado && { uf: estado }) },
      { termoExibicao: termoFinal, estadoExibicao: estado }
    );
  };

  // Digitar por cima do que veio de um filtro invalida o "modo" especial —
  // volta a ser uma busca de texto normal.
  const handlePesquisaChange = (valor) => {
    setPesquisa(valor);
    setFiltroAtivo(null);
  };

  // Filtro "Municípios": escolheu o estado e depois o município no modal —
  // resultado são os cursos oferecidos naquele município.
  const handleSelecionarMunicipio = (municipio, uf) => {
    setFiltroAtivo({ termo: municipio, params: { cidade: municipio, uf } });
    executarPesquisa(
      { cidade: municipio, uf, ano },
      { termoExibicao: municipio, estadoExibicao: uf }
    );
  };

  // Filtro "Instituições": mesma mecânica, mas o passo final é a
  // instituição escolhida dentro do estado.
  const handleSelecionarInstituicao = (instituicao, uf) => {
    setFiltroAtivo({ termo: instituicao, params: { universidade: instituicao, uf } });
    executarPesquisa(
      { universidade: instituicao, uf, ano },
      { termoExibicao: instituicao, estadoExibicao: uf }
    );
  };

  // Cards de "Destaque" (Maiores/Menores Notas, Mais Ofertados, Mais
  // Procurados) — só no desktop. Sem termo de busca de verdade: o back
  // devolve uma lista pronta a partir do parâmetro `destaque`. "Mais
  // Procurados" ignora o Estado selecionado (o ranking de favoritos não é
  // segmentado por UF).
  const handleSelecionarDestaque = (destaque, label) => {
    const uf = destaque === 'mais-procurados' ? undefined : (estado || undefined);
    setFiltroAtivo({ termo: label, params: { destaque, uf } });
    executarPesquisa(
      { destaque, uf, ano },
      { termoExibicao: label, estadoExibicao: uf || '' }
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

  // Estado "vazio" da busca: nada digitado e nenhum resultado carregado —
  // é quando os atalhos de categoria fazem sentido aparecer.
  const mostrarCategorias = !pesquisa && resultados.length === 0;

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
    setFiltroAtivo(null);
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

      {/* "Dashboard" + ícones ficam só no desktop — no mobile os ícones
          se juntam à linha do título "Pesquisa Geral" logo abaixo. */}
      {!isMobile && (
        <Box className={classes.header} display='flex' mt={20}>
          <Group gap="xs">
            <Text className={classes.logo} fw={700}>Dashboard</Text>
            {loadingStats && <Loader size="xs" color="brand" />}
          </Group>
          <Group className={classes.btnsHeader} gap="xs">
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
      )}

      {/* Painel de estatísticas: só no desktop — no mobile ele ocupava
          espaço logo na abertura do app sem ser o foco principal (a busca
          é), então fica oculto ali. */}
      {!isMobile && (
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
      )}

      {/* SEARCHINPUT — no mobile segue o mesmo padrão texto → busca →
          filtros de Cursos/Faculdades (título à esquerda, bold, 24px, com
          subtítulo), e os ícones de tema/favoritos/notificações se juntam
          à linha do título em vez de ficarem soltos lá em cima. */}
      <Box mt={20}>
        {isMobile ? (
          <>
            <Group justify="space-between" align="center" wrap="nowrap">
              <Text fw={700} size="24px" style={{ lineHeight: 1 }}>Pesquisa Geral</Text>
              <Group gap="xs" wrap="nowrap">
                <Tooltip label="Mudar tema" withArrow>
                  <ActionIcon variant="outline" color="gray" size="lg" onClick={handleMudarTema} aria-label="Mudar tema">
                    <IconPalette size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Favoritados" withArrow>
                  <ActionIcon variant="outline" color="gray" size="lg" onClick={handleAbrirFavoritados} aria-label="Favoritados">
                    <IconStar size={18} />
                  </ActionIcon>
                </Tooltip>
                <NotificacoesButton onNaoAutenticado={openLoginModal} iconOnly />
              </Group>
            </Group>
            <Text c="dimmed" size="sm" mt={5}>
              Pesquise cursos e faculdades pela nota de corte do SISU.
            </Text>
          </>
        ) : (
          <Text mb={20} ta="center" size='xl' fw={500}>Pesquisa Geral</Text>
        )}
        <Group justify='space-between' mt={isMobile ? 'lg' : undefined}>
          <Autocomplete
            className={buscaErro ? classes.buscaErro : undefined}
            size='md'
            flex={1}
            placeholder="Digite o nome do curso (ex: Ciência da...)"
            value={pesquisa}
            onChange={handlePesquisaChange}
            data={sugestoes}
            filter={({ options }) => options}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            nothingFoundMessage="Nenhum curso sugerido"

            rightSectionPointerEvents="all"
            rightSection={
              pesquisa && (
                <CloseButton
                  onClick={handleClear}
                  aria-label="Limpar pesquisa"
                  title="Limpar pesquisa"
                />
              )
            }
          />
          {!isMobile && (
            <>
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
            </>
          )}
          <Button size="md" onClick={() => handleSearch()}>Pesquisar</Button>
        </Group>

        {/* Atalhos de "Pesquisa por Categoria": só aparecem no estado vazio
            (ninguém pesquisou nada ainda, ou acabou de limpar a busca) — o
            objetivo é dar o que fazer pra quem chega na Home pela primeira
            vez e vê só um campo de texto em branco. Reaproveitam os mesmos
            modais já usados pelo botão "Filtros" logo abaixo. */}
        {mostrarCategorias && (
          <Box mt="xl">
            <UnstyledButton onClick={toggleCategorias} style={{ display: 'block', width: '100%' }}>
              <Group justify="space-between" wrap="nowrap">
                <Text fw={700} size="lg">Pesquise por Categoria</Text>
                {categoriasOpened ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
              </Group>
            </UnstyledButton>
            <Text c="dimmed" size="sm" mb="md">Escolha uma opção para visualizar as notas de corte</Text>
            <Collapse in={categoriasOpened}>
              <Box className={classes.categoryGrid}>
                <UnstyledButton className={classes.categoryCard} onClick={openCursoModal}>
                  <Box className={`${classes.statIconBadge} ${classes.categoryIconBadge} ${classes.statIconBadgeBlue}`}>
                    <IconBook2 size={26} stroke={1.5} />
                  </Box>
                  <Text fw={600} className={classes.categoryLabel}>Por Curso</Text>
                </UnstyledButton>
                {/* No mobile, os 7 cards já disputam espaço em pares — esse
                    fica de fora ali (Faculdades também dá pra achar pela
                    busca geral); no desktop continua aparecendo normal. */}
                {!isMobile && (
                  <UnstyledButton className={classes.categoryCard} onClick={openInstituicaoModal}>
                    <Box className={`${classes.statIconBadge} ${classes.categoryIconBadge} ${classes.statIconBadgeGreen}`}>
                      <IconBuildingBank size={26} stroke={1.5} />
                    </Box>
                    <Text fw={600} className={classes.categoryLabel}>Por Faculdade</Text>
                  </UnstyledButton>
                )}
                <UnstyledButton className={classes.categoryCard} onClick={openMunicipioModal}>
                  <Box className={`${classes.statIconBadge} ${classes.categoryIconBadge} ${classes.statIconBadgePurple}`}>
                    <IconMapPin size={26} stroke={1.5} />
                  </Box>
                  <Text fw={600} className={classes.categoryLabel}>Por Município</Text>
                </UnstyledButton>

                {/* Rankings prontos (sem modal, sem termo de busca) — agora
                    aparecem em todo tamanho de tela; no mobile os cards ficam
                    menores (ver .categoryCard em home.module.css) pra caber
                    os 6 sem precisar rolar demais. */}
                <UnstyledButton className={classes.categoryCard} onClick={() => handleSelecionarDestaque('mais-procurados', 'Mais Procurados')}>
                  <Box className={`${classes.statIconBadge} ${classes.categoryIconBadge} ${classes.statIconBadgeGold}`}>
                    <IconFlame size={26} stroke={1.5} />
                  </Box>
                  <Text fw={600} className={classes.categoryLabel}>Mais Procurados</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.categoryCard} onClick={() => handleSelecionarDestaque('maiores-notas', 'Maiores Notas de Corte')}>
                  <Box className={`${classes.statIconBadge} ${classes.categoryIconBadge} ${classes.statIconBadgeBlue}`}>
                    <IconTrophy size={26} stroke={1.5} />
                  </Box>
                  <Text fw={600} className={classes.categoryLabel}>Maiores Notas de Corte</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.categoryCard} onClick={() => handleSelecionarDestaque('mais-ofertados', 'Mais Ofertados')}>
                  <Box className={`${classes.statIconBadge} ${classes.categoryIconBadge} ${classes.statIconBadgeGreen}`}>
                    <IconArmchair size={26} stroke={1.5} />
                  </Box>
                  <Text fw={600} className={classes.categoryLabel}>Mais Ofertados</Text>
                </UnstyledButton>
                <UnstyledButton className={classes.categoryCard} onClick={() => handleSelecionarDestaque('menores-notas', 'Mais Possibilidades')}>
                  <Box className={`${classes.statIconBadge} ${classes.categoryIconBadge} ${classes.statIconBadgePurple}`}>
                    <IconDoorEnter size={26} stroke={1.5} />
                  </Box>
                  <Text fw={600} className={classes.categoryLabel}>Mais Possibilidades</Text>
                </UnstyledButton>
              </Box>
            </Collapse>
          </Box>
        )}

        {/* No desktop, Estado/Ano já ficam à mostra na barra de busca e
            Municípios/Instituições/Cursos viraram os cards de categoria
            acima — o botão "Filtros" ficava duplicando os mesmos filtros,
            então só sobra no mobile (onde Estado/Ano não cabem na barra). */}
        {isMobile && (
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
              <Group mt="sm" grow className={classes.filtrosEstadoAno}>
                <Select
                  size='md'
                  placeholder="Todos os estados"
                  data={opcoesEstado}
                  value={estado || null}
                  onChange={(value) => setEstado(value || '')}
                  searchable
                  clearable
                />
                <Select
                  size='md'
                  data={opcoesAno}
                  value={ano}
                  onChange={(value) => setAno(value || opcoesAno[0]?.value || '')}
                  allowDeselect={false}
                />
              </Group>
            </Collapse>
          </Box>
        )}
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