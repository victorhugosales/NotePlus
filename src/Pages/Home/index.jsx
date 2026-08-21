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
  Modal
} from '@mantine/core';
import classes from '../Home/home.module.css';
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { CardCurso } from '../../components/Card';
import api from '../../services/api';
import { useDisclosure } from '@mantine/hooks';

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
  const [resultados, setResultados] = useState(JSON.parse(sessionStorage.getItem('home_lastResults')) || []);
  const [sugestoes, setSugestoes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingStats, setLoadingStats] = useState(true)
  const location = useLocation();

  const [opened, { open, close }] = useDisclosure(false);

  //organização dos Dados da DashBoard
  const [stats, setStats] = useState({
    totalCursos: 0,
    totalFaculdades: 0,
    mediaCursos: 0,
    totalEstados: 0
  });

  //Carrega os dados da DashBoard
  useEffect(() => {
    const carregarStats = async () => {
      try {
        const response = await api.get('/stats');
        setStats(response.data);
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
          ...(estado && { uf: estado })
        }
      });

      const mapaAgrupado = {};
      response.data.forEach(item => {
        const chave = `${item.codigo_curso}-${item.sigla_universidade}`;

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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const dadosAgrupados = agruparPorEstado(resultados);

  //Limpeza do input de pesquisa
  const handleClear = () => {
    setPesquisa('');
    setResultados([]);
    setSugestoes([]);
    sessionStorage.removeItem('home_lastSearch');
    sessionStorage.removeItem('home_lastResults');
  };

  return (
    <Container className={classes.mainContainer}>
      <Modal
        opened={opened}
        onClose={close}
        title={`Função indisponível`}
        centered
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}
      >
        <Text size="sm">
          Em breve
        </Text>
      </Modal>
      
      <Box className={classes.header} justify='space-between' display='flex' align='center' mt={20}>
        <Text className={classes.logo} fw={700} >Visão Geral</Text>
        <Group className={classes.btnsHeader}>
          <Button className={classes.headerButton} variant="outline" onClick={open}>Mudar Tema</Button>
          <Button className={classes.headerButton} variant="outline" onClick={open}>Notificações</Button>
        </Group>
      </Box>

      <Paper className={classes.dashboard} shadow="sm" p="md">
        <Group className={classes.card} position="apart">
          <Text size='xl' fw={500}>{stats.totalCursos}</Text>
          <Text >Cursos Disponíveis</Text>
        </Group>

        <Group className={classes.card} position="apart">
          <Text size='xl' fw={500}>{stats.mediaCursos}</Text>
          <Text >Cursos por Faculdade</Text>
        </Group>

        <Group className={classes.card} position="apart">
          <Text size='xl' fw={500}>{stats.totalFaculdades}</Text>
          <Text >Faculdades Públicas</Text>
        </Group>

        <Group className={classes.card} position="apart">
          <Text size='xl' fw={500}>{stats.totalEstados}</Text>
          <Text >Total de Estados cadastrados</Text>
        </Group>
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
          <Button size="md" onClick={() => handleSearch()}>Pesquisar</Button>
        </Group>
      </Box>

      {/* Resultados em cards */}
      {/* {loading ? (
        <Center mt={50}><Loader color="blue" /></Center>
      ) : (
        <Box mt={30}>
          {Object.keys(dadosAgrupados).length > 0 ? (
            Object.entries(dadosAgrupados).map(([sigla, itens]) => (
              <Box key={sigla} mb={50}>
                <Group mb="lg" gap="xs">
                  <Box bg="blue.7" px={8} py={2} style={{ borderRadius: 4 }}>
                    <Text c="white" fw={800}>{sigla}</Text>
                  </Box>
                  <Text fw={700} size="xl">- {estadosMap[sigla] || 'ESTADO'}</Text>
                </Group>

                <SimpleGrid cols={3} spacing="lg">
                  {itens.map((item) => (
                    <CardCurso key={item.id_projeto} dados={item} />
                  ))}
                </SimpleGrid>
              </Box>
            ))
          ) : (
            pesquisa && <Text ta="center" c="dimmed" mt={50}>Nenhum resultado encontrado.</Text>
          )}
        </Box>
      )} */}

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

                  <SimpleGrid cols={{ base: 2, sm: 2, lg: 3 }} spacing="lg">
                    {itens.map((item) => (
                      <CardCurso key={item.id_projeto} dados={item} />
                    ))}
                  </SimpleGrid>
                </Box>
              );
            })
        ) : (
          pesquisa && <Text ta="center" c="dimmed" mt={50}>Nenhum resultado encontrado.</Text>
        )}
      </Box>
    </Container>
  );
};