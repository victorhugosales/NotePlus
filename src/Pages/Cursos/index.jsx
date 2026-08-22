import {
  Button,
  Container,
  Group,
  Text,
  Autocomplete,
  Select,
  Box,
  Loader,
  Center
} from '@mantine/core';
import classes from '../Cursos/Cursos.module.css';
import { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { CardCurso } from '../../components/Card';
import api from '../../services/api'
import { useFavoritos } from '../../hooks/useFavoritos';
import { LoginRequiredModal } from '../../components/LoginRequiredModal';

const estadosMap = {
  'AC': 'ACRE', 'AL': 'ALAGOAS', 'AM': 'AMAZONAS', 'AP': 'AMAPÁ', 'BA': 'BAHIA',
  'CE': 'CEARÁ', 'DF': 'DISTRITO FEDERAL', 'ES': 'ESPÍRITO SANTO', 'GO': 'GOIÁS',
  'MA': 'MARANHÃO', 'MG': 'MINAS GERAIS', 'MS': 'MATO GROSSO DO SUL', 'MT': 'MATO GROSSO',
  'PA': 'PARÁ', 'PB': 'PARAÍBA', 'PE': 'PERNAMBUCO', 'PI': 'PIAUÍ', 'PR': 'PARANÁ',
  'RJ': 'RIO DE JANEIRO', 'RN': 'RIO GRANDE DO NORTE', 'RO': 'RONDÔNIA', 'RR': 'RORAIMA',
  'RS': 'RIO GRANDE DO SUL', 'SC': 'SANTA CATARINA', 'SE': 'SERGIPE', 'SP': 'SÃO PAULO',
  'TO': 'TOCANTINS'
};

// Opções do filtro de Estado, já em ordem alfabética (Object.entries segue a
// ordem de inserção do objeto acima, que já está A-Z).
const opcoesEstado = Object.entries(estadosMap).map(([sigla, nome]) => ({
  value: sigla,
  label: `${sigla} - ${nome}`
}));

export const Cursos = () => {

  const [pesquisa, setPesquisa] = useState(sessionStorage.getItem('lastSearch') || '');
  const [estado, setEstado] = useState(sessionStorage.getItem('lastEstado') || '');
  const [resultados, setResultados] = useState(JSON.parse(sessionStorage.getItem('lastResults')) || []);
  const [sugestoes, setSugestoes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [loginModalOpened, { open: openLoginModal, close: closeLoginModal }] = useDisclosure(false);
  const { isFavorito, toggleFavorito } = useFavoritos({ onNaoAutenticado: openLoginModal });

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
          curso: pesquisa.trim().toUpperCase(),
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

      // Transformamos o objeto de volta para um Array para o Estado
      const resultadosSomados = Object.values(mapaAgrupado);

      setResultados(resultadosSomados);
      sessionStorage.setItem('lastResults', JSON.stringify(resultadosSomados));
      sessionStorage.setItem('lastSearch', pesquisa);
      sessionStorage.setItem('lastEstado', estado);

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
    <Container className={classes.mainContainer} fluid>
      <LoginRequiredModal
        opened={loginModalOpened}
        onClose={closeLoginModal}
        title="Favoritar curso"
        message="Esse recurso só está disponível para usuários da plataforma. Entre ou cadastre-se para favoritar cursos."
      />

      <Group className={classes.Header} mt={20}>
        <Box>
          <Text fw={700} size="24px" style={{ lineHeight: 1 }}>Cursos</Text>
          <Text c="dimmed" size="sm" mt={5}>Acompanhe as notas de corte do curso que você deseja</Text>
        </Box>

        {/* HEADER DE PESQUISA */}
        <Group gap={25}>
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

          <Select
            size="md"
            w={220}
            placeholder="Todos os estados"
            data={opcoesEstado}
            value={estado || null}
            onChange={(value) => setEstado(value || '')}
            searchable
            clearable
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
          <Box className={classes.resultsGrid}>
            {resultados.length > 0 ? (
              resultados.map((item) => (
                <CardCurso
                  key={item.id_projeto}
                  dados={item}
                  isFavorito={isFavorito(item)}
                  onToggleFavorito={toggleFavorito}
                />
              ))
            ) : (
              <Text c="dimmed" ta="center" style={{ gridColumn: '1 / -1' }}>
                {pesquisa ? 'Nenhum curso encontrado para essa busca.' : 'Pesquise um curso para ver as notas de corte.'}
              </Text>
            )}
          </Box>
        )}
      </Group>
    </Container>
  );
}
