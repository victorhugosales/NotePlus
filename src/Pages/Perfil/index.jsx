import {
    Button,
    Container,
    Group,
    Anchor,
    Text,
    Box,
    Tabs,
    Stack,
    Avatar,
    Divider,
    UnstyledButton,
    Checkbox,
    Switch,
    Select,
    SimpleGrid,
    Loader,
    Center,
    TextInput,
    PasswordInput
} from '@mantine/core';
import {
    IconChevronRight,
    IconTrophy,
    IconPlus,
    IconSun,
    IconMoon,
    IconDeviceDesktop
} from '@tabler/icons-react';
import classes from '../Perfil/Perfil.module.css'
import { useState, useEffect } from 'react';
import api from '../../services/api'
import { modals } from '@mantine/modals'

export const Perfil = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState('');

    const [editingField, setEditingField] = useState(null); // 'nome', 'email', 'senha' ou null
    const [tempValue, setTempValue] = useState('');
    const [tempPassword, setTempPassword] = useState('');

    useEffect(() => {
        const storedUser = localStorage.getItem('@NotePlus:user');
        const userData = storedUser ? JSON.parse(storedUser) : null;

        if (!userData || !userData.id) {
            console.error("Usuário não logado");
            setLoading(false);
            return;
        }

        let isMounted = true;

        api.get(`/usuario/${userData.id}`)
            .then((response) => {
                if (isMounted) {
                    setUser(response.data);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (isMounted) {
                    console.error("Erro ao carregar perfil:", err);
                    setLoading(false);
                }
            });

        return () => { isMounted = false };
    }, []);

    const handleUpdate = async () => {
        try {
            const dataToUpdate = {};

            if (editingField === 'nome') dataToUpdate.nome = tempValue;
            if (editingField === 'email') dataToUpdate.email = tempValue;
            if (editingField === 'senha') dataToUpdate.senha = tempPassword;

            await api.put(`/usuario/${user.id}`, dataToUpdate);

            // Atualiza o estado local para refletir a mudança (exceto senha por segurança)
            if (editingField !== 'senha') {
                setUser({ ...user, ...dataToUpdate });
            }

            setEditingField(null);
            setTempPassword('');
            alert("Atualizado com sucesso!");
        } catch (err) {
            alert(err.response?.data?.error || "Erro ao salvar alterações.");
        }
    };

    const handleSaveName = async () => {
        try {
            const response = await api.put(`/usuario/${user.id}`, { nome: newName });
            setUser({ ...user, nome: newName });
            setEditingName(false);
        } catch (err) {
            alert("Erro ao salvar.");
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await api.delete(`/usuario/${user.id}`);

            // Limpa os dados do navegador
            localStorage.removeItem('@NotePlus:user');
            localStorage.removeItem('@NotePlus:token');

            alert("Sua conta foi excluída permanentemente.");
            window.location.href = '/cadastro'; // Redireciona de forma bruta para limpar estados
        } catch (err) {
            alert(err.response?.data?.error || "Erro ao deletar conta.");
        }
    };

    // Função que abre o aviso de confirmação
    const openDeleteConfirmModal = () =>
        modals.openConfirmModal({
            title: 'Excluir conta permanentemente',
            centered: true,
            children: (
                <Text size="sm">
                    Tem certeza que deseja deletar sua conta? Essa ação é irreversível e você perderá
                    todas as suas preferências e histórico de buscas.
                </Text>
            ),
            labels: { confirm: 'Deletar conta', cancel: 'Cancelar' },
            confirmProps: { color: 'red' },
            onConfirm: handleDeleteAccount,
        });


    const ConfigRow = ({ label, children }) => (
        <Group justify="space-between" py="xs">
            <Text size="sm" c="dimmed">{label}</Text>
            {children}
        </Group>
    );

    if (loading) {
        return (
            <Center style={{ height: '100vh' }}>
                <Loader color="orange" size="xl" type="dots" />
            </Center>
        );
    }

    if (!user) {
        return (
            <Center style={{ height: '100vh' }}>
                <Text>Usuário não encontrado ou erro no servidor.</Text>
            </Center>
        );
    }

    return (
        <Container className={classes.mainContainer} fluid w={960}>
            <Stack mt={20}>
                {/* HEADER */}
                <Text fw={700} size="24px">Perfil</Text>

                <Tabs defaultValue="perfil" variant="outline" classNames={{
                    root: classes.tabsRoot,
                    list: classes.tabsList,
                    tab: classes.tab,
                }}>
                    <Tabs.List>
                        <Tabs.Tab value="perfil">Perfil</Tabs.Tab>
                        <Tabs.Tab value="configuracoes">Configurações</Tabs.Tab>
                    </Tabs.List>

                    {/* --- CONTEÚDO DA ABA PERFIL --- */}
                    <Tabs.Panel value="perfil" pt="xl">
                        <Stack gap="xl">
                            <Group>
                                <Avatar
                                    size={80}
                                    radius="xl"
                                    src={user.avatar_url}
                                    alt="Foto de perfil"
                                    className={classes.avatarBorder}
                                />
                                <Box>
                                    <Text fw={700} size="xl">{user.nome}</Text>
                                    <Text c="dimmed" size="sm">{user.email}</Text>
                                </Box>
                            </Group>

                            <UnstyledButton className={classes.statsBar}>
                                <Group justify="space-between">
                                    <Group>
                                        <IconTrophy size={20} color="#fab005" />
                                        <Text size="sm" fw={600}>Buscas ({user.buscas_realizadas} / {user.limite_buscas})</Text>
                                    </Group>
                                    <IconChevronRight size={18} c="dimmed" />
                                </Group>
                            </UnstyledButton>

                            <Box mt="md">
                                <Text fw={700} size="lg" mb="lg">Detalhes</Text>
                                {/* EDIÇÃO DE NOME */}
                                <DetailItem
                                    label="Nome"
                                    value={user.nome}
                                    isEditing={editingField === 'nome'}
                                    onEdit={() => { setEditingField('nome'); setTempValue(user.nome); }}
                                >
                                    <Stack gap="xs">
                                        <TextInput value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
                                        <Group gap="xs">
                                            <Button size="compact-xs" color="orange" onClick={handleUpdate}>Salvar</Button>
                                            <Button size="compact-xs" variant="subtle" color="gray" onClick={() => setEditingField(null)}>Cancelar</Button>
                                        </Group>
                                    </Stack>
                                </DetailItem>

                                {/* EDIÇÃO DE EMAIL */}
                                <DetailItem
                                    label="Email"
                                    value={user.email}
                                    isEditing={editingField === 'email'}
                                    onEdit={() => { setEditingField('email'); setTempValue(user.email); }}
                                >
                                    <Stack gap="xs">
                                        <TextInput value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
                                        <Group gap="xs">
                                            <Button size="compact-xs" color="orange" onClick={handleUpdate}>Salvar</Button>
                                            <Button size="compact-xs" variant="subtle" color="gray" onClick={() => setEditingField(null)}>Cancelar</Button>
                                        </Group>
                                    </Stack>
                                </DetailItem>

                                {/* EDIÇÃO DE SENHA */}
                                <DetailItem
                                    label="Senha"
                                    value="••••••••••••"
                                    isEditing={editingField === 'senha'}
                                    onEdit={() => { setEditingField('senha'); setTempPassword(''); }}
                                >
                                    <Stack gap="xs">
                                        <PasswordInput placeholder="Nova senha" value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} />
                                        <Group gap="xs">
                                            <Button size="compact-xs" color="orange" onClick={handleUpdate}>Alterar Senha</Button>
                                            <Button size="compact-xs" variant="subtle" color="gray" onClick={() => setEditingField(null)}>Cancelar</Button>
                                        </Group>
                                    </Stack>
                                </DetailItem>
                            </Box>

                            <Box mt="md">
                                <Group justify="space-between" mb="lg">
                                    <Box>
                                        <Text fw={700} size="lg">Preferências</Text>
                                        <Text size="xs" c="dimmed">Você pode adicionar preferências de curso</Text>
                                    </Box>
                                    <Button
                                        variant="default"
                                        size="xs"
                                        leftSection={<IconPlus size={14} />}
                                        radius="md"
                                    >
                                        Adicionar Cursos
                                    </Button>
                                </Group>
                                <DetailItem label="Nome" value="Análise e Desenvolvimento de Sistemas" />
                            </Box>

                            <Box>
                                <Button
                                    variant="subtle"
                                    color="red"
                                    size="xs"
                                    onClick={openDeleteConfirmModal} // Chama o modal de aviso
                                >
                                    Deletar conta
                                </Button>
                            </Box>
                        </Stack>
                    </Tabs.Panel>

                    {/* --- CONTEÚDO DA ABA CONFIGURAÇÕES --- */}
                    <Tabs.Panel value="configuracoes" pt="xl">
                        <Stack gap="xl">
                            {/* NOTIFICAÇÕES */}
                            <Box>
                                <Text fw={700} size="lg" mb="xs">Notificações</Text>
                                <Group justify="space-between" mb="sm" className={classes.line}>
                                    <Text size="xs" fw={600}>Geral</Text>
                                </Group>
                                <Stack gap="xs">
                                    <ConfigRow label="Lembretes de novos cursos">
                                        <Checkbox color="orange" defaultChecked={user.configuracoes?.notif_cursos} />
                                    </ConfigRow>
                                    <ConfigRow label="Notificar atualizações">
                                        <Checkbox color="orange" defaultChecked={user.configuracoes?.notif_atualizacoes} />
                                    </ConfigRow>
                                    <ConfigRow label="Novas mensagens">
                                        <Checkbox color="orange" defaultChecked={user.configuracoes?.notif_mensagens} />
                                    </ConfigRow>
                                </Stack>
                            </Box>

                            {/* PREFERÊNCIAS */}
                            <Box>
                                <Text fw={700} size="lg" mb="xs">Preferências</Text>
                                <Group justify="space-between" mb="sm" className={classes.line}>
                                    <Text size="xs" fw={600}>Experiência</Text>
                                </Group>
                                <Stack gap="xs">
                                    <ConfigRow label="Efeitos sonoros">
                                        <Switch
                                            color="orange"
                                            defaultChecked={user.configuracoes?.efeitos_sonoros}
                                            size="sm"
                                            onChange={async (event) => {
                                                const checked = event.currentTarget.checked;
                                                try {
                                                    // Supondo que sua API trate o objeto de configurações
                                                    await api.put(`/usuario/${user.id}`, {
                                                        configuracoes: { ...user.configuracoes, efeitos_sonoros: checked }
                                                    });
                                                } catch (err) {
                                                    console.error("Erro ao salvar config:", err);
                                                }
                                            }}
                                        />
                                    </ConfigRow>
                                    <ConfigRow label="Animações">
                                        <Switch color="orange" defaultChecked={user.configuracoes?.animacoes} size="sm" />
                                    </ConfigRow>
                                </Stack>
                            </Box>

                            {/* APARÊNCIA */}
                            <Box>
                                <Text fw={700} size="lg" mb="md">Aparência</Text>
                                <SimpleGrid cols={3} spacing="md">
                                    <UnstyledButton className={`${classes.appearanceBtn} ${user.configuracoes?.tema === 'light' ? classes.activeAppearance : ''}`}>
                                        <Group gap="xs">
                                            <IconSun size={18} color="#fab005" />
                                            <Text size="sm" fw={500}>Claro</Text>
                                        </Group>
                                    </UnstyledButton>
                                    <UnstyledButton className={`${classes.appearanceBtn} ${user.configuracoes?.tema === 'dark' ? classes.activeAppearance : ''}`}>
                                        <Group gap="xs">
                                            <IconMoon size={18} />
                                            <Text size="sm" fw={500}>Escuro</Text>
                                        </Group>
                                    </UnstyledButton>
                                    <UnstyledButton className={`${classes.appearanceBtn} ${user.configuracoes?.tema === 'system' ? classes.activeAppearance : ''}`}>
                                        <Group gap="xs">
                                            <IconDeviceDesktop size={18} />
                                            <Text size="sm" fw={500}>Sistema</Text>
                                        </Group>
                                    </UnstyledButton>
                                </SimpleGrid>
                            </Box>

                            <Box>
                                <Text fw={700} size="lg" mb="md">Idioma</Text>
                                <Select
                                    placeholder="Selecione o idioma"
                                    defaultValue={user.configuracoes?.idioma || "pt"}
                                    data={[{ value: 'pt', label: 'Português' }, { value: 'en', label: 'English' }]}
                                    radius="md"
                                />
                            </Box>
                        </Stack>
                    </Tabs.Panel>
                </Tabs>
            </Stack>
        </Container>
    );
}
const DetailItem = ({ label, value, onEdit, isEditing, children }) => (
    <Box mb="md">
        <Divider mb="sm" opacity={0.5} />
        <Group justify="space-between" align="flex-start">
            <Box style={{ flex: 1 }}>
                <Text size="xs" fw={700}>{label}</Text>
                {isEditing ? children : <Text size="sm" c="dimmed">{value}</Text>}
            </Box>

            {!isEditing && (
                <Anchor component="button" size="xs" fw={700} underline="never" onClick={onEdit}>
                    Editar
                </Anchor>
            )}
        </Group>
    </Box>
);