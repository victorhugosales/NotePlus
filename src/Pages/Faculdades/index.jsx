import {
  Button,
  Container,
  Group,
  Text,
  SimpleGrid,
  Box,
  Autocomplete,
  Loader,
  Center,
} from '@mantine/core';
import classes from '../Faculdades/Faculdades.module.css';
import { CardCurso } from '../../components/Card'
import { useState, useEffect } from 'react';
import api from '../../services/api'
const estadosMap = {
  'AC': 'ACRE',
  'AL': 'ALAGOAS',
  'AM': 'AMAZONAS',
  'AP': 'AMAPÁ',
  'BA': 'BAHIA',
  'CE': 'CEARÁ',
  'DF': 'DISTRITO FEDERAL',
  'ES': 'ESPÍRITO SANTO',
  'GO': 'GOIÁS',
  'MA': 'MARANHÃO',
  'MG': 'MINAS GERAIS',
  'MS': 'MATO GROSSO DO SUL',
  'MT': 'MATO GROSSO',
  'PA': 'PARÁ',
  'PB': 'PARAÍBA',
  'PE': 'PERNAMBUCO',
  'PI': 'PIAUÍ',
  'PR': 'PARANÁ',
  'RJ': 'RIO DE JANEIRO',
  'RN': 'RIO GRANDE DO NORTE',
  'RO': 'RONDÔNIA',
  'RR': 'RORAIMA',
  'RS': 'RIO GRANDE DO SUL',
  'SC': 'SANTA CATARINA',
  'SE': 'SERGIPE',
  'SP': 'SÃO PAULO',
  'TO': 'TOCANTINS'
};

export const Faculdades = () => {
  const [pesquisa, setPesquisa] = useState(sessionStorage.getItem('lastSearch') || '');
  const [resultados, setResultados] = useState(JSON.parse(sessionStorage.getItem('lastResults')) || []);
  const [sugestoes, setSugestoes] = useState([]);
  const [loading, setLoading] = useState(false);

  const agruparPorEstado = (dados) => {
    return dados.reduce((acc, item) => {
      const uf = item.uf_campus || 'Outros';
      if (!acc[uf]) {
        acc[uf] = [];
      }

      acc[uf].push(item);
      return acc;
    }, {});
  };

  useEffect(() => {
    const buscarSugestoes = async () => {
      if (pesquisa.length < 1) {
        setSugestoes([]);
        return;
      }
      try {
        const response = await api.get('/sugestoes', {
          params: { universidade: pesquisa }
        });

        // Transformamos em Set para remover duplicatas e filtramos valores vazios
        const formatadas = [...new Set(response.data.map(item =>
          typeof item === 'string' ? item : (item.sigla_universidade || item.nome_universidade)
        ))].filter(Boolean);

        setSugestoes(formatadas);
      } catch (error) {
        console.error("Erro ao buscar sugestões", error);
      }
    };

    const delayDebounceFn = setTimeout(() => buscarSugestoes(), 300);
    return () => clearTimeout(delayDebounceFn);
  }, [pesquisa]);

  useEffect(() => {
    const path = location.pathname;
    // Se saí da página de cursos e NÃO fui para detalhes, limpa o cache
    if (path !== '/cursos' && !path.includes('/detalhes')) {
      sessionStorage.removeItem('lastSearch');
      sessionStorage.removeItem('lastResults');
    }
  }, [location.pathname]);

  const handleSearch = async () => {
    if (!pesquisa.trim()) return;
    setLoading(true);

    try {
      const response = await api.get('/pesquisar', {
        params: { universidade: pesquisa.trim().toUpperCase() }
      });

      const mapaAgrupado = {};
      response.data.forEach(item => {
        const chave = `${item.codigo_curso}-${item.sigla_universidade}`;
        
        if (!mapaAgrupado[chave]) mapaAgrupado[chave] = { ...item };
        else mapaAgrupado[chave].vagas += item.vagas;
      });

      const final = Object.values(mapaAgrupado);
      setResultados(final);
      
      sessionStorage.setItem('lastResults_Facul', JSON.stringify(final));
      sessionStorage.setItem('lastSearch_Facul', pesquisa);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const dadosAgrupados = agruparPorEstado(resultados);

  const handleClear = () => {
    setPesquisa('');
    setResultados([]);
    setSugestoes([]);
    sessionStorage.removeItem('lastSearch');
    sessionStorage.removeItem('lastResults');
  };

  return (
    <Container className={classes.mainContainer}>
      <Group mt={20}>
        {/* Headder */}
        <Box>
          <Text fw={700} size="24px" style={{ lineHeight: 1 }}>Faculdades</Text>
          <Text c="dimmed" size="sm" mt={5}>Acompanhe as Faculdades que você deseja ingressar.</Text>
        </Box>
        {/* Pesquisa */}
        <Group gap={25}>
          <Autocomplete
            placeholder="Digite a faculdade (ex: UFC ou Universidade)"
            className={classes.searchInput}
            size="md"
            w={700}
            data={sugestoes}
            value={pesquisa}
            onChange={setPesquisa}
            filter={({ options }) => options}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}

            // Botão de limpar (X) dentro do input
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
          <Button
            className={classes.searchButton}
            onClick={handleSearch}
            loading={loading}
          >Pesquisar</Button>
          <Button variant="outline" color="gray">Filtros</Button>
        </Group>
        {/* Resultados */}
        <Box mt={30} w="100%">
          {loading ? (
            <Center><Loader /></Center>
          ) : (
            <Box>
              {Object.keys(dadosAgrupados).length > 0 ? (
                Object.entries(dadosAgrupados).map(([sigla, itens]) => (
                  <Box key={sigla} mb={50}>
                    {/* Cabeçalho do Estado Estilo SISU */}
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
                <Text ta="center" c="dimmed" mt={50}>Nenhuma instituição encontrada.</Text>
              )}
            </Box>
          )}
        </Box>
      </Group>
    </Container>
  );
}
