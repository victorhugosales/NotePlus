import {
    Stack,
    Group,
    Text,
    Box,
    Card,
    Modal,
    Button
} from '@mantine/core';
import classes from './CardDetails.module.css';
import { useDisclosure } from '@mantine/hooks';

// Margem (em pontos) considerada "nota bem próxima do corte" na Análise Inteligente.
const MARGEM_PROXIMO = 15;

// Recebemos "dados" como prop. analiseAtiva/notaUsuario vêm da tela de Detalhes
// quando o usuário liga a Análise Inteligente com uma nota do ENEM cadastrada.
export const CardDetails = ({ dados, analiseAtiva, notaUsuario }) => {
    const [opened, { open, close }] = useDisclosure(false);
    if (!dados) return null;

    let status = null; // 'acima' | 'proximo' | 'abaixo'
    let diff = null;
    if (analiseAtiva && notaUsuario !== null && notaUsuario !== undefined) {
        diff = Number(notaUsuario) - Number(dados.nota_corte);
        if (diff < 0) status = 'abaixo';
        else if (diff < MARGEM_PROXIMO) status = 'proximo';
        else status = 'acima';
    }

    const STATUS_CONFIG = {
        acima: { color: '#2f9e44', glow: 'rgba(47, 158, 68, 0.5)', texto: 'Sua nota está acima do corte' },
        proximo: { color: '#f08c00', glow: 'rgba(240, 140, 0, 0.5)', texto: 'Sua nota está próxima do corte' },
        abaixo: { color: '#e03131', glow: 'rgba(224, 49, 49, 0.5)', texto: 'Sua nota está abaixo do corte' },
    };
    const cfg = status ? STATUS_CONFIG[status] : null;

    return (
        <>
            {/* Botão para visualizar detalhes da cota */}
            <Modal
                opened={opened}
                onClose={close}
                title={`Entender Modalidade: ${dados.modalidade}`}
                centered
                overlayProps={{
                    backgroundOpacity: 0.55,
                    blur: 3,
                }}
            >
                <Text size="sm">
                    {dados.descricao_cota}
                </Text>
            </Modal>

            <Card
                shadow="sm"
                padding={0}
                style={{
                    marginTop: 20,
                    ...(cfg && {
                        border: `2px solid ${cfg.color}`,
                        boxShadow: `0 0 14px ${cfg.glow}`,
                    }),
                }}
                withBorder
            >
                <Box bg="#3D4474" p="sm" w={'100%'}>
                    <Group justify="center">
                        <Text align="center" c="white" fw={700} size="lg" >
                            COTA {dados.modalidade}
                        </Text>
                    </Group>
                </Box>

                <Stack p="md" gap="xs">
                    <Button
                        variant="subtle"
                        color="blue"
                        size="compact-xs"
                        onClick={open}/* Abre o modal ao clicar  */
                        fullWidth
                    >
                        Entender Modalidade
                    </Button>

                    <Group justify="space-between" mt="sm">
                        <Box>
                            <Text c="dimmed" size="md">Vagas</Text>
                            <Text size="lg" fw={700} c="#3D4474">{dados.vagas}</Text>
                        </Box>
                        <Box>
                            <Text c="dimmed" size="md">Inscritos</Text>
                            <Text size="lg" fw={700} c="#3D4474">{dados.inscritos}</Text>
                        </Box>
                    </Group>

                    <Box mt="sm" className={classes.Resultado} display="flex" style={{ alignItems: 'baseline', gap: '5px' }}>
                        <Text c="dimmed" size="lg">Corte:</Text>
                        <Text size="xl" fw={700} c="#3D4474">{dados.nota_corte}</Text>
                    </Box>

                    {cfg && (
                        <Text size="xs" fw={700} ta="center" style={{ color: cfg.color }}>
                            {cfg.texto} ({diff >= 0 ? '+' : ''}{diff.toFixed(2)})
                        </Text>
                    )}
                </Stack>
            </Card>
        </>
    );
};