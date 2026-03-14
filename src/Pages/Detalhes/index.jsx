import {
    Button,
    Container,
    Group,
    Text,
    Box,
    Paper,
    NativeSelect,
    SimpleGrid,
    Stack
} from '@mantine/core';
import classes from '../Detalhes/Detalhes.module.css'
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { CardDetails } from '../../components/CardDetails'

export const Detalhes = () => {
    const location = useLocation();
    const [notas, setNotas] = useState([]);
    const [infoCurso, setInfoCurso] = useState(null);
    const [ano, setAno] = useState('2025');
    const queryParams = new URLSearchParams(location.search);
    const cursoNome = queryParams.get('curso');
    const uniSigla = queryParams.get('uni');
    const cursoCodigo = queryParams.get('codigo');

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

    const navigate = useNavigate();

    return (
        <Container className={classes.maincontainer}>
            {/* Aqui é o HEADER */}
            <Box className={classes.header} mt={30}>
                <Group justify="space-between" align="flex-start">
                    <Stack gap={0}>
                        <Button onClick={() => navigate(-1)} w={100} mb="md">Voltar</Button>
                        <Text size="xl" fw={700}>{cursoNome || "Carregando..."}</Text>
                        <Text size="md">Veja as notas de corte para cada modalidade.</Text>
                    </Stack>

                    {/* O SELECT DE ANO */}
                    <NativeSelect w={150}
                        label="Edição do SISU"
                        description="Selecione o ano base"
                        value={ano}
                        onChange={(event) => setAno(event.currentTarget.value)}
                        data={[
                            { label: '2025 (Atual)', value: '2025' },
                            { label: '2024 (Em breve)', value: '2024', disabled: true },
                            { label: '2023 (Em breve)', value: '2023', disabled: true },
                        ]}
                    />
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

                <SimpleGrid cols={4} spacing="md" breakpoints={[{ maxWidth: 'sm', cols: 1 }]}>
                    {notas.map((nota) => (
                        <CardDetails key={nota.id_projeto} dados={nota} />
                    ))}
                </SimpleGrid>
                {notas.length === 0 && (
                    <Text ta="center" mt="xl" c="dimmed">Nenhuma nota encontrada para o ano {ano}.</Text>
                )}
            </Box>
        </Container>
    );
}