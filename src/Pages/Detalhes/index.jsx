import {
    Button,
    Container,
    Group,
    Text,
    Box,
    Paper,
    NativeSelect,
    Stack,
    Switch,
    Modal,
    SegmentedControl,
    Loader,
    Center
} from '@mantine/core';
import { BarChart, LineChart } from '@mantine/charts';
import classes from '../Detalhes/Detalhes.module.css'
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { CardDetails } from '../../components/CardDetails'
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

// Anos disponíveis pra comparação na Visão Avançada. Mesma lista de opções
// habilitadas do seletor de edição do SISU (2024/2023 ainda não têm dados).
const ANOS_COMPARACAO = ['2025', '2026'];

// Paleta pra colorir uma linha por modalidade no gráfico de evolução.
const CORES_LINHAS = ['#05AE76', '#4C6EF5', '#b8890a', '#E64980', '#5C5FE8', '#073636', '#03AD74', '#1098AD'];

export const Detalhes = () => {
    const location = useLocation();
    const [notas, setNotas] = useState([]);
    const [infoCurso, setInfoCurso] = useState(null);
    const [ano, setAno] = useState('2026');
    const queryParams = new URLSearchParams(location.search);
    const cursoNome = queryParams.get('curso');
    const uniSigla = queryParams.get('uni');
    const cursoCodigo = queryParams.get('codigo');

    // Análise Inteligente: compara a nota do ENEM do usuário logado com as
    // notas de corte de cada modalidade e prioriza as modalidades dele.
    const [perfilUsuario, setPerfilUsuario] = useState(null);
    const [analiseAtiva, setAnaliseAtiva] = useState(false);
    const [loginModalOpened, { open: openLoginModal, close: closeLoginModal }] = useDisclosure(false);

    // Visão Avançada: dashboard de gráficos (nota/vagas por modalidade e
    // evolução entre edições). Busca sob demanda, só quando o usuário troca
    // pra essa visão, e guarda em cache pra não repetir a chamada.
    const [visao, setVisao] = useState('simplificada');
    const [comparativoAnos, setComparativoAnos] = useState(null);
    const [carregandoComparativo, setCarregandoComparativo] = useState(false);

    useEffect(() => {
        const fetchDetalhes = async () => {
            try {
                const response = await api.get('/pesquisar', {
                    params: {
                        codigo: cursoCodigo,
                        curso: cursoNome,
                        universidade: uniSigla,
                        ano: ano
                    }
                });

                const dadosFiltrados = response.data.filter(nota =>
                    Number(nota.vagas) > 0 &&
                    Number(nota.nota_corte) > 0
                );
                setNotas(dadosFiltrados);

                if (dadosFiltrados.length > 0) {
                    setInfoCurso(dadosFiltrados[0]);
                }
            } catch (error) {
                console.error("Erro ao buscar detalhes", error);
            }
        };

        if (cursoCodigo || cursoNome) fetchDetalhes();
    }, [cursoCodigo, cursoNome, uniSigla, ano]);

    // Carrega o perfil completo (nota do ENEM + modalidades) do usuário logado.
    useEffect(() => {
        const token = localStorage.getItem('@NotePlus:token');
        const storedUser = localStorage.getItem('@NotePlus:user');
        const userData = storedUser ? JSON.parse(storedUser) : null;

        if (!token || !userData?.id) return;

        api.get(`/usuario/${userData.id}`)
            .then((response) => setPerfilUsuario(response.data))
            .catch((error) => console.error("Erro ao buscar perfil do usuário", error));
    }, []);

    // Busca as notas de todos os anos disponíveis pra montar o gráfico de
    // evolução — só na primeira vez que o usuário abre a Visão Avançada.
    useEffect(() => {
        if (visao !== 'avancada' || comparativoAnos || !(cursoCodigo || cursoNome)) return;

        const fetchComparativo = async () => {
            setCarregandoComparativo(true);
            try {
                const respostas = await Promise.all(
                    ANOS_COMPARACAO.map((anoRef) => api.get('/pesquisar', {
                        params: { codigo: cursoCodigo, curso: cursoNome, universidade: uniSigla, ano: anoRef }
                    }))
                );

                const porAno = {};
                ANOS_COMPARACAO.forEach((anoRef, i) => { porAno[anoRef] = respostas[i].data; });
                setComparativoAnos(porAno);
            } catch (error) {
                console.error("Erro ao buscar comparativo entre edições", error);
            } finally {
                setCarregandoComparativo(false);
            }
        };

        fetchComparativo();
    }, [visao, comparativoAnos, cursoCodigo, cursoNome, uniSigla]);

    const navigate = useNavigate();

    const handleToggleAnalise = () => {
        const token = localStorage.getItem('@NotePlus:token');
        if (!token) {
            openLoginModal();
            return;
        }
        if (perfilUsuario?.nota_enem === null || perfilUsuario?.nota_enem === undefined) {
            notifications.show({
                title: 'Complete seu perfil',
                message: 'Cadastre sua nota do ENEM em Perfil > Perfil de Candidato para usar a Análise Inteligente.',
                color: 'yellow',
            });
            return;
        }
        setAnaliseAtiva((atual) => !atual);
    };

    // Com a Análise Inteligente ligada, prioriza as modalidades escolhidas
    // pelo usuário nas configurações; as demais aparecem depois, no final.
    const notasOrdenadas = useMemo(() => {
        if (!analiseAtiva || !perfilUsuario?.modalidades?.length) return notas;

        const modalidadesUsuario = new Set(perfilUsuario.modalidades);
        return [...notas].sort((a, b) => {
            const prioridadeA = modalidadesUsuario.has(a.modalidade) ? 0 : 1;
            const prioridadeB = modalidadesUsuario.has(b.modalidade) ? 0 : 1;
            return prioridadeA - prioridadeB;
        });
    }, [notas, analiseAtiva, perfilUsuario]);

    // Gráficos de barra da edição atual: reaproveitam as notas já carregadas.
    const dadosNotaAtual = useMemo(() => (
        notas.map((n) => ({ modalidade: n.modalidade, nota_corte: Number(n.nota_corte) }))
    ), [notas]);

    const dadosVagasAtual = useMemo(() => (
        notas.map((n) => ({ modalidade: n.modalidade, vagas: Number(n.vagas) }))
    ), [notas]);

    // Gráfico de linha comparando a nota de corte de cada modalidade entre
    // as edições disponíveis (ex.: AC em 2025 x AC em 2026).
    const { dadosComparativo, modalidadesComparativo } = useMemo(() => {
        if (!comparativoAnos) return { dadosComparativo: [], modalidadesComparativo: [] };

        const modalidadesSet = new Set();
        ANOS_COMPARACAO.forEach((anoRef) => {
            (comparativoAnos[anoRef] || []).forEach((n) => {
                if (Number(n.vagas) > 0 && Number(n.nota_corte) > 0) modalidadesSet.add(n.modalidade);
            });
        });

        const linhas = ANOS_COMPARACAO.map((anoRef) => {
            const linha = { ano: anoRef };
            (comparativoAnos[anoRef] || []).forEach((n) => {
                if (Number(n.vagas) > 0 && Number(n.nota_corte) > 0) {
                    linha[n.modalidade] = Number(n.nota_corte);
                }
            });
            return linha;
        });

        return { dadosComparativo: linhas, modalidadesComparativo: [...modalidadesSet] };
    }, [comparativoAnos]);

    return (
        <Container className={classes.maincontainer} fluid>
            {/* Modal exibido quando um usuário deslogado tenta ligar a Análise Inteligente */}
            <Modal
                opened={loginModalOpened}
                onClose={closeLoginModal}
                title="Análise Inteligente"
                centered
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            >
                <Text size="sm" mb="md">
                    Esse recurso só está disponível para usuários da plataforma. Entre ou
                    cadastre-se para comparar sua nota do ENEM com as notas de corte de cada modalidade.
                </Text>
                <Group>
                    <Button onClick={() => navigate('/login')}>Entrar</Button>
                    <Button variant="outline" onClick={() => navigate('/cadastro')}>Cadastrar-se</Button>
                </Group>
            </Modal>

            {/* Aqui é o HEADER */}
            <Box className={classes.header} mt={30}>
                <Group justify="space-between" align="flex-start">
                    <Stack gap={0}>
                        <Button onClick={() => navigate(-1)} w={100} mb="md">Voltar</Button>
                        <Text size="xl" fw={700}>{cursoNome || "Carregando..."}</Text>
                        <Text size="md">Veja as notas de corte para cada modalidade.</Text>
                    </Stack>

                    <Group align="flex-end" gap="lg">
                        <SegmentedControl
                            value={visao}
                            onChange={setVisao}
                            color="brand"
                            data={[
                                { label: 'Visão Simplificada', value: 'simplificada' },
                                { label: 'Visão Avançada', value: 'avancada' },
                            ]}
                        />

                        <Switch
                            label="Análise Inteligente"
                            checked={analiseAtiva}
                            onChange={handleToggleAnalise}
                            color="orange"
                            size="md"
                        />

                        {/* O SELECT DE ANO */}
                        <NativeSelect w={150}
                            label="Edição do SISU"
                            description="Selecione o ano base"
                            value={ano}
                            onChange={(event) => setAno(event.currentTarget.value)}
                            data={[
                                { label: '2026 (Atual)', value: '2026' },
                                { label: '2025', value: '2025' },
                                { label: '2024 (Em breve)', value: '2024', disabled: true },
                                { label: '2023 (Em breve)', value: '2023', disabled: true },
                            ]}
                        />
                    </Group>
                </Group>
            </Box>

            {/* DASHBOARD do curso */}
            <Paper className={classes.dashboard} shadow="sm" p="md" mt={20} withBorder>
                <Stack>
                    <Group><Text fw={600}>Instituição:</Text><Text>{infoCurso?.nome_universidade || uniSigla}</Text></Group>
                    <Group><Text fw={600}>Campus:</Text><Text>{infoCurso?.campus} ({infoCurso?.cidade})</Text></Group>
                    <Group><Text fw={600}>Grau:</Text><Text>{infoCurso?.grau || 'Bacharelado'}</Text></Group>
                </Stack>
            </Paper>

            {visao === 'simplificada' ? (
                <Box mt={20}>
                    <Text size='xl' mb="md" fw={500}>Notas de Corte por Modalidade - SISU {ano}</Text>

                    {/* Guia rápido das cores da Análise Inteligente */}
                    {analiseAtiva && (
                        <Group gap="lg" mb="md">
                            <Group gap={6}>
                                <Box w={12} h={12} bg="#2f9e44" style={{ borderRadius: '50%' }} />
                                <Text size="xs" c="dimmed">Sua nota está acima do corte</Text>
                            </Group>
                            <Group gap={6}>
                                <Box w={12} h={12} bg="#f08c00" style={{ borderRadius: '50%' }} />
                                <Text size="xs" c="dimmed">Sua nota está próxima do corte</Text>
                            </Group>
                            <Group gap={6}>
                                <Box w={12} h={12} bg="#e03131" style={{ borderRadius: '50%' }} />
                                <Text size="xs" c="dimmed">Sua nota está abaixo do corte</Text>
                            </Group>
                        </Group>
                    )}

                    <Box className={classes.resultsGrid}>
                        {notasOrdenadas.map((nota) => (
                            <CardDetails
                                key={nota.id_projeto}
                                dados={nota}
                                analiseAtiva={analiseAtiva}
                                notaUsuario={perfilUsuario?.nota_enem}
                            />
                        ))}
                    </Box>
                    {notas.length === 0 && (
                        <Text ta="center" mt="xl" c="dimmed">Nenhuma nota encontrada para o ano {ano}.</Text>
                    )}
                </Box>
            ) : (
                <Box mt={20}>
                    <Text size='xl' mb="md" fw={500}>Análise Gráfica - {cursoNome}</Text>

                    {carregandoComparativo && !comparativoAnos ? (
                        <Center py="xl"><Loader color="brand" /></Center>
                    ) : (
                        <Stack gap="xl">
                            <Paper withBorder radius="md" p="lg">
                                <Text fw={600} mb="md">Nota de corte por modalidade — SISU {ano}</Text>
                                {dadosNotaAtual.length > 0 ? (
                                    <BarChart
                                        h={300}
                                        data={dadosNotaAtual}
                                        dataKey="modalidade"
                                        series={[{ name: 'nota_corte', color: 'brand.6', label: 'Nota de corte' }]}
                                        tickLine="y"
                                        withLegend
                                    />
                                ) : (
                                    <Text c="dimmed" size="sm">Sem dados para o ano {ano}.</Text>
                                )}
                            </Paper>

                            <Paper withBorder radius="md" p="lg">
                                <Text fw={600} mb="md">Vagas ofertadas por modalidade — SISU {ano}</Text>
                                {dadosVagasAtual.length > 0 ? (
                                    <BarChart
                                        h={300}
                                        data={dadosVagasAtual}
                                        dataKey="modalidade"
                                        series={[{ name: 'vagas', color: 'blue.6', label: 'Vagas' }]}
                                        tickLine="y"
                                        withLegend
                                    />
                                ) : (
                                    <Text c="dimmed" size="sm">Sem dados para o ano {ano}.</Text>
                                )}
                            </Paper>

                            <Paper withBorder radius="md" p="lg">
                                <Text fw={600} mb="md">
                                    Evolução da nota de corte: {ANOS_COMPARACAO.join(' → ')}
                                </Text>
                                {modalidadesComparativo.length > 0 ? (
                                    <LineChart
                                        h={320}
                                        data={dadosComparativo}
                                        dataKey="ano"
                                        series={modalidadesComparativo.map((m, i) => ({
                                            name: m,
                                            color: CORES_LINHAS[i % CORES_LINHAS.length],
                                        }))}
                                        curveType="linear"
                                        withLegend
                                        connectNulls={false}
                                    />
                                ) : (
                                    <Text c="dimmed" size="sm">
                                        Não há dados de {ANOS_COMPARACAO.join(' e ')} suficientes pra comparar esse curso ainda.
                                    </Text>
                                )}
                            </Paper>
                        </Stack>
                    )}
                </Box>
            )}
        </Container>
    );
}