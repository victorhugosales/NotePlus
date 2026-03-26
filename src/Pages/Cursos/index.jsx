import {
  Button,
  Container,
  Group,
  Text,
  SimpleGrid,
  Autocomplete,
  Box,
  Loader,
  Center
} from '@mantine/core';
import classes from '../Cursos/Cursos.module.css';
import { useState, useEffect } from 'react';
import { CardCurso } from '../../components/Card';
import api from '../../services/api'

export const Cursos = () => {

  const [pesquisa, setPesquisa] = useState(sessionStorage.getItem('lastSearch') || '');
  const [resultados, setResultados] = useState(JSON.parse(sessionStorage.getItem('lastResults')) || []);
  const [sugestoes, setSugestoes] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const buscarSugestoes = async () => {
      if (pesquisa.length < 1) {
        setSugestoes([]);
        return;
      }
      try {
        const response = await api.get('/sugestoes', { params: { curso: pesquisa } });
        setSugestoes(response.data);
      } catch (error) {
        console.error("Erro ao buscar sugestões", error);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      buscarSugestoes();
    }, 200);

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
        params: {
          curso: pesquisa.trim().toUpperCase()
        }
      });

      const mapaAgrupado = {};

      response.data.forEach(item => {
        const chave = `${item.curso}-${item.sigla_universidade}`;

        if (!mapaAgrupado[chave]) {
          mapaAgrupado[chave] = { ...item };
        } else {
          mapaAgrupado[chave].vagas += item.vagas;
        }
      });

      // Transformamos o objeto de volta para um Array para o Estado
      const resultadosSomados = Object.values(mapaAgrupado);

      setResultados(resultadosSomados);
      sessionStorage.setItem('lastResults', JSON.stringify(resultadosSomados));
      sessionStorage.setItem('lastSearch', pesquisa);
      setResultados(resultadosSomados);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPesquisa('');
    setResultados([]);
    setSugestoes([]);
    sessionStorage.removeItem('lastSearch');
    sessionStorage.removeItem('lastResults');
  };

  return (
    <Container className={classes.mainContainer}>
      <Group className={classes.Header} mt={20}>
        <Box>
          <Text fw={700} size="24px" style={{ lineHeight: 1 }}>Cursos</Text>
          <Text c="dimmed" size="sm" mt={5}>Acompanhe as notas de corte do curso que você deseja</Text>
        </Box>

        {/* HEADER DE PESQUISA */}
        <Group justify='space-between' gap={25}>
          <Autocomplete
            placeholder="Digite o curso (ex: Medicina)"
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

        {/* Resultados em Cards */}
        {loading ? (
          <Center mt={50}><Loader color="blue" /></Center>
        ) : (
          <SimpleGrid cols={3} spacing="lg">
            {resultados.length > 0 ? (
              resultados.map((item) => (
                <CardCurso
                  key={item.id_projeto}
                  dados={item}
                />
              ))
            ) : (
              <Text c="dimmed" ta="center" style={{ gridColumn: '1 / span 3' }}>
                {pesquisa ? 'Nenhum curso encontrado para essa busca.' : 'Pesquise um curso para ver as notas de corte.'}
              </Text>
            )}
          </SimpleGrid>
        )}
      </Group>
    </Container>
  );
}
