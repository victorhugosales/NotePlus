import {
    Button,
    Container,
    Group,
    Text,
    Box,
    Paper,
    NativeSelect,
    SimpleGrid,
    Stack,
    Switch,
    Modal
} from '@mantine/core';
import classes from '../Detalhes/Detalhes.module.css'
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { CardDetails } from '../../components/CardDetails'
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';

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

    return (
        <Container className={classes.maincontainer}>
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

                <SimpleGrid cols={4} spacing="md" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
                    {notasOrdenadas.map((nota) => (
                        <CardDetails
                            key={nota.id_projeto}
                            dados={nota}
                            analiseAtiva={analiseAtiva}
                            notaUsuario={perfilUsuario?.nota_enem}
                        />
                    ))}
                </SimpleGrid>
                {notas.length === 0 && (
                    <Text ta="center" mt="xl" c="dimmed">Nenhuma nota encontrada para o ano {ano}.</Text>
                )}
            </Box>
        </Container>
    );
}