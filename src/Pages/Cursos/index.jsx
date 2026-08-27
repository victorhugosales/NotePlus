import {
  Button,
  Container,
  Group,
  Text,
  Autocomplete,
  Select,
  Box,
  Loader,
  Center,
  Collapse,
} from '@mantine/core';
import { IconFilter, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import classes from '../Cursos/Cursos.module.css';
import { useState, useEffect } from 'react';
import { useDisclosure } from '@mantine/hooks';
import { CardCurso } from '../../components/Card';
import { GrupoEstado } from '../../components/GrupoEstado';
import api from '../../services/api'
import { useFavoritos } from '../../hooks/useFavoritos';
import { LoginRequiredModal } from '../../components/LoginRequiredModal';
import { estadosMap, opcoesEstado } from '../../utils/estados';
import { useAvisoBuscaVazia } from '../../hooks/useAvisoBuscaVazia';

export const Cursos = () => {

  const [pesquisa, setPesquisa] = useState(sessionStorage.getItem('cursos_lastSearch') || '');
  const [estado, setEstado] = useState(sessionStorage.getItem('cursos_lastEstado') || '');
  const [turno, setTurno] = useState(sessionStorage.getItem('cursos_lastTurno') || '');
  const [grau, setGrau] = useState(sessionStorage.getItem('cursos_lastGrau') || '');
  const [resultados, setResultados] = useState(JSON.parse(sessionStorage.getItem('cursos_lastResults')) || []);
  const [sugestoes, setSugestoes] = useState([]);
  const [opcoesTurno, setOpcoesTurno] = useState([]);
  const [opcoesGrau, setOpcoesGrau] = useState([]);
  const [loading, setLoading] = useState(false);

  const [loginModalOpened, { open: openLoginModal, close: closeLoginModal }] = useDisclosure(false);
  const [filtrosOpened, { toggle: toggleFiltros }] = useDisclosure(false);
  const { isFavorito, toggleFavorito } = useFavoritos({ onNaoAutenticado: openLoginModal });
  const { buscaErro, avisarBuscaVazia } = useAvisoBuscaVazia();

  // Mesmo agrupamento por estado usado na Home e em Faculdades — evita uma
  // lista única gigante quando a busca (ou a ausência de filtro de estado)
  // traz cursos espalhados pelo Brasil inteiro.
  const agruparPorEstado = (dados) => {
    return dados.reduce((acc, item) => {
      const uf = item.uf_campus || 'Outros';
      if (!acc[uf]) acc[uf] = [];
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

  // Opções dos filtros de Turno e Grau — poucos valores distintos, carrega
  // uma vez só (cacheado no backend por 30min, não precisa refazer a cada
  // busca).
  useEffect(() => {
    api.get('/turnos-disponiveis').then((res) => {
      setOpcoesTurno(res.data.map((t) => ({ value: t, label: t })));
    }).catch((error) => console.error("Erro ao buscar turnos disponíveis", error));

    api.get('/graus-disponiveis').then((res) => {
      setOpcoesGrau(res.data.map((g) => ({ value: g, label: g })));
    }).catch((error) => console.error("Erro ao buscar graus disponíveis", error));
  }, []);

  useEffect(() => {
    const path = location.pathname;
    // Se saí da página de cursos e NÃO fui para detalhes, limpa o cache
    if (path !== '/cursos' && !path.includes('/detalhes')) {
      sessionStorage.removeItem('cursos_lastSearch');
      sessionStorage.removeItem('cursos_lastResults');
    }
  }, [location.pathname]);

  const handleSearch = async () => {

    if (!pesquisa.trim()) {
      avisarBuscaVazia('Digite um curso para pesquisar.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/pesquisar', {
        params: {
          curso: pesquisa.trim().toUpperCase(),
          ...(estado && { uf: estado }),
          ...(turno && { turno }),
          ...(grau && { grau }),
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
      sessionStorage.setItem('cursos_lastResults', JSON.stringify(resultadosSomados));
      sessionStorage.setItem('cursos_lastSearch', pesquisa);
      sessionStorage.setItem('cursos_lastEstado', estado);
      sessionStorage.setItem('cursos_lastTurno', turno);
      sessionStorage.setItem('cursos_lastGrau', grau);

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
    sessionStorage.removeItem('cursos_lastSearch');
    sessionStorage.removeItem('cursos_lastResults');
  };

  const dadosAgrupados = agruparPorEstado(resultados);

  return (
    <Container className={classes.mainContainer} fluid>
      <LoginRequiredModal
        opened={loginModalOpened}
        onClose={closeLoginModal}
        title="Favoritar curso"
        message="Esse recurso só está disponível para usuários da plataforma. Entre ou cadastre-se para favoritar cursos."
      />

      <Box className={classes.header} mt={20}>
        <Text fw={700} size="24px" style={{ lineHeight: 1 }}>Cursos</Text>
        <Text c="dimmed" size="sm" mt={5}>Acompanhe as notas de corte do curso que você deseja</Text>
      </Box>

      {/* HEADER DE PESQUISA */}
      <Group className={classes.searchBar} gap={25} mt="lg">
        <Autocomplete
          placeholder="Digite o curso (ex: Medicina)"
          className={buscaErro ? classes.buscaErro : classes.searchInput}
          size="md"
          flex={1}
          miw={220}
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
          <Group mt="sm" gap={25}>
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

            <Select
              size="md"
              w={180}
              placeholder="Todos os turnos"
              data={opcoesTurno}
              value={turno || null}
              onChange={(value) => setTurno(value || '')}
              clearable
            />

            <Select
              size="md"
              w={200}
              placeholder="Todos os graus"
              data={opcoesGrau}
              value={grau || null}
              onChange={(value) => setGrau(value || '')}
              clearable
            />
          </Group>
        </Collapse>
      </Box>

      {/* Resultados em Cards, agrupados por estado */}
      <Box mt={30}>
        {loading ? (
          <Center mt={50}><Loader color="blue" /></Center>
        ) : Object.keys(dadosAgrupados).length > 0 ? (
          Object.keys(dadosAgrupados).sort().map((sigla) => {
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
          <Text c="dimmed" ta="center" mt={50}>
            {pesquisa ? 'Nenhum curso encontrado para essa busca.' : 'Pesquise um curso para ver as notas de corte.'}
          </Text>
        )}
      </Box>
    </Container>
  );
}
