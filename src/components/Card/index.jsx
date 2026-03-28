import {
    Button,
    Stack,
    Group,
    Anchor,
    Text,
    Box,
    Card,
} from '@mantine/core';
import { NavLink } from 'react-router-dom';

export const CardCurso = ({ dados }) => {
    if (!dados) return null;
    return (
        <Card shadow="sm" padding={0} style={{ marginTop: 20 }} withBorder>
            <Box
                bg="#3D4474"
                p="sm"
                w={'100%'}
                style={{
                    height: '80px', // Altura fixa para o título não quebrar o layout
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Group justify="space-between">
                    <Text align="center" c="white" fw={700} size="md" >
                        {dados.curso}
                    </Text>
                </Group>
            </Box>

            <Stack p="sm" gap={0} style={{ flex: 1 }} justify="space-between">
                <Text fw={500}>
                    {dados.sigla_universidade} - {dados.nome_universidade}
                </Text>

                <Text fw={600} size="sm" c="#3D4474">
                        {dados.campus} {dados.cidade}  
                </Text>

                <Text c="dimmed">
                    {dados.grau}
                </Text>

                <Box mt="sm">
                    <Text c="dimmed" size="sm">
                        Total de vagas
                    </Text>

                    <Text size="xl" fw={700} c="#3D4474">
                        {dados.vagas}
                    </Text>
                </Box>


                <Anchor
                    component={NavLink}
                    to={`/Detalhes?curso=${encodeURIComponent(dados.curso)}&uni=${encodeURIComponent(dados.sigla_universidade)}&codigo=${dados.codigo_curso}`}
                >
                    <Button
                        w={'100%'}
                        variant="light"
                        radius="xl"
                        size="md"
                        mt="sm"
                        styles={{
                            root: {
                                boxShadow: "0px 4px 10px rgba(0,0,0,0.15)",
                                fontWeight: 600
                            }
                        }}
                    >
                        Ver Curso
                    </Button>
                </Anchor>
            </Stack>
        </Card>
    );
};