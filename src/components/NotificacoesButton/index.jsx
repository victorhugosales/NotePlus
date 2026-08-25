import { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Stack, Text, Group, Box, Indicator, Loader, Center } from '@mantine/core';
import { IconBell } from '@tabler/icons-react';
import api from '../../services/api';
import { getToken } from '../../utils/authStorage';

const formatarData = (isoString) => {
    try {
        return new Date(isoString).toLocaleString('pt-BR', {
            day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        });
    } catch {
        return '';
    }
};

const CACHE_KEY = 'cache_notificacoes';

// Botão "Notificações" da Home: mostra um selo com a quantidade de não
// lidas e, ao clicar, abre a lista (curso em alta, curso parecido com um
// favorito, etc — geradas pelo backend a cada 12h para quem habilitou nas
// configurações).
//
// Começa com o último valor visto (sessionStorage): o botão fica em várias
// telas e remonta a cada navegação, sem isso o selo de não lidas sumia e
// reaparecia toda vez que a página recarregava.
export const NotificacoesButton = ({ onNaoAutenticado, className }) => {
    const [opened, setOpened] = useState(false);
    const [notificacoes, setNotificacoes] = useState(() => {
        const cache = sessionStorage.getItem(CACHE_KEY);
        return cache ? JSON.parse(cache) : [];
    });
    const [loading, setLoading] = useState(false);
    const naoLidas = notificacoes.filter((n) => !n.lida).length;

    const carregar = useCallback(async () => {
        if (!getToken()) return;
        setLoading(true);
        try {
            const response = await api.get('/notificacoes');
            setNotificacoes(response.data);
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(response.data));
        } catch (error) {
            console.error('Erro ao buscar notificações', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { carregar(); }, [carregar]);

    const handleAbrir = () => {
        if (!getToken()) {
            onNaoAutenticado?.();
            return;
        }
        setOpened(true);
        carregar();
    };

    const handleMarcarTodasLidas = async () => {
        try {
            await api.put('/notificacoes/lidas');
            const atualizadas = notificacoes.map((n) => ({ ...n, lida: true }));
            setNotificacoes(atualizadas);
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(atualizadas));
        } catch (error) {
            console.error('Erro ao marcar notificações como lidas', error);
        }
    };

    return (
        <>
            <Modal
                opened={opened}
                onClose={() => setOpened(false)}
                title="Notificações"
                centered
                overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
            >
                {loading ? (
                    <Center py="md"><Loader size="sm" /></Center>
                ) : notificacoes.length === 0 ? (
                    <Text size="sm" c="dimmed" ta="center" py="md">
                        Nenhuma notificação por enquanto.
                    </Text>
                ) : (
                    <Stack gap="xs">
                        {naoLidas > 0 && (
                            <Button size="xs" variant="subtle" onClick={handleMarcarTodasLidas} ml="auto">
                                Marcar todas como lidas
                            </Button>
                        )}
                        {notificacoes.map((n) => (
                            <Box
                                key={n.id}
                                p="sm"
                                style={{
                                    borderRadius: 8,
                                    border: '1px solid var(--mantine-color-gray-3)',
                                    backgroundColor: n.lida ? 'transparent' : 'var(--mantine-color-blue-0)',
                                }}
                            >
                                <Group justify="space-between" mb={2}>
                                    <Text size="sm" fw={700}>{n.titulo}</Text>
                                    <Text size="xs" c="dimmed">{formatarData(n.created_at)}</Text>
                                </Group>
                                <Text size="xs" c="dimmed">{n.mensagem}</Text>
                            </Box>
                        ))}
                    </Stack>
                )}
            </Modal>

            <Indicator disabled={naoLidas === 0} label={naoLidas} size={16} color="red" offset={4}>
                <Button className={className} variant="outline" leftSection={<IconBell size={16} />} onClick={handleAbrir}>
                    Notificações
                </Button>
            </Indicator>
        </>
    );
};
