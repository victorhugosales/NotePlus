import {
  Button,
  Container,
  Group,
  Text,
  Box,
  Autocomplete,
  Select,
  Loader,
  Center,
  Collapse,
} from '@mantine/core';
import { IconFilter, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import classes from '../Faculdades/Faculdades.module.css';
import { CardCurso } from '../../components/Card'
import { GrupoEstado } from '../../components/GrupoEstado'
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api'
import { estadosMap, opcoesEstado } from '../../utils/estados';
import { useAvisoBuscaVazia } from '../../hooks/useAvisoBuscaVazia';

export const Faculdades = () => {
  const [pesquisa, setPesquisa] = useState(sessionStorage.getItem('faculdades_lastSearch') || '');
  const [estado, setEstado] = useState(sessionStorage.getItem('faculdades_lastEstado') || '');
  const [categoria, setCategoria] = useState(sessionStorage.getItem('faculdades_lastCategoria') || '');
  const [resultados, setResultados] = useState(JSON.parse(sessionStorage.getItem('faculdades_lastResults')) || []);
  const [sugestoes, setSugestoes] = useState([]);
  const [opcoesCategoria, setOpcoesCategoria] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtrosOpened, { toggle: toggleFiltros }] = useDisclosure(false);
  const { buscaErro, avisarBuscaVazia } = useAvisoBuscaVazia();

  // true quando o texto atual veio de uma sugestão clicada no autocomplete
  // (sigla ou nome exatos), não de digitação livre. Nesse caso a busca usa
  // igualdade exata em vez de ILIKE parcial — sem isso, "UFC" trazia junto
  // UFCA, UFCAT, UFCG, UFCSPA mesmo já tendo escolhido a instituição certa
  // na lista. selecionouSugestaoRef existe porque o Autocomplete do Mantine
  // dispara onChange logo depois de onOptionSubmit com o mesmo valor — sem
  // o ref, esse onChange reseta buscaExata pra false na mesma seleção.
  const [buscaExata, setBuscaExata] = useState(false);
  const selecionouSugestaoRef = useRef(false);

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

  // Opções do filtro de Categoria — poucos valores distintos, carrega uma
  // vez só (cacheado no backend por 30min).
  useEffect(() => {
    api.get('/categorias-disponiveis').then((res) => {
      setOpcoesCategoria(res.data.map((c) => ({ value: c, label: c })));
    }).catch((error) => console.error("Erro ao buscar categorias disponíveis", error));
  }, []);

  useEffect(() => {
    const path = location.pathname;
    // Se saí da página de faculdades e NÃO fui para detalhes, limpa o cache
    if (path !== '/faculdades' && !path.includes('/detalhes')) {
      sessionStorage.removeItem('faculdades_lastSearch');
      sessionStorage.removeItem('faculdades_lastResults');
    }
  }, [location.pathname]);

  const handleSearch = async () => {
    if (!pesquisa.trim()) {
      avisarBuscaVazia('Digite uma instituição para pesquisar.');
      return;
    }
    setLoading(true);

    try {
      const response = await api.get('/pesquisar', {
        params: {
          universidade: pesquisa.trim().toUpperCase(),
          ...(estado && { uf: estado }),
          ...(categoria && { categoria }),
          ...(buscaExata && { exato: true }),
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

      sessionStorage.setItem('faculdades_lastResults', JSON.stringify(final));
      sessionStorage.setItem('faculdades_lastSearch', pesquisa);
      sessionStorage.setItem('faculdades_lastEstado', estado);
      sessionStorage.setItem('faculdades_lastCategoria', categoria);
    } catch (error) { console.error(error); } finally { setLoading(false); }
  };

  const dadosAgrupados = agruparPorEstado(resultados);

  const handleClear = () => {
    setPesquisa('');
    setBuscaExata(false);
    setResultados([]);
    setSugestoes([]);
    sessionStorage.removeItem('faculdades_lastSearch');
    sessionStorage.removeItem('faculdades_lastResults');
  };

  return (
    <Container className={classes.mainContainer} fluid>
      <Box className={classes.header} mt={20}>
        <Text fw={700} size="24px" style={{ lineHeight: 1 }}>Faculdades</Text>
        <Text c="dimmed" size="sm" mt={5}>Acompanhe as Faculdades que você deseja ingressar.</Text>
      </Box>

      {/* HEADER DE PESQUISA */}
      <Group className={classes.searchBar} gap={25} mt="lg">
        <Autocomplete
          placeholder="Digite a faculdade (ex: UFC ou Universidade)"
          className={buscaErro ? classes.buscaErro : classes.searchInput}
          size="md"
          flex={1}
          miw={220}
          data={sugestoes}
          value={pesquisa}
          onChange={(value) => {
            setPesquisa(value);
            if (selecionouSugestaoRef.current) {
              selecionouSugestaoRef.current = false;
            } else {
              setBuscaExata(false);
            }
          }}
          onOptionSubmit={() => {
            selecionouSugestaoRef.current = true;
            setBuscaExata(true);
          }}
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
              w={220}
              placeholder="Todas as categorias"
              data={opcoesCategoria}
              value={categoria || null}
              onChange={(value) => setCategoria(value || '')}
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
                    <CardCurso key={item.id_projeto} dados={item} />
                  ))}
                </Box>
              </GrupoEstado>
            );
          })
        ) : (
          <Text c="dimmed" ta="center" mt={50}>
            {pesquisa ? 'Nenhuma instituição encontrada.' : 'Pesquise uma instituição para ver os cursos oferecidos.'}
          </Text>
        )}
      </Box>
    </Container>
  );
}
