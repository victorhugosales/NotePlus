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
    PasswordInput,
    NumberInput,
    useMantineColorScheme
} from '@mantine/core';
import {
    IconChevronRight,
    IconTrophy,
    IconPlus,
    IconSun,
    IconMoon
} from '@tabler/icons-react';
import classes from '../Perfil/Perfil.module.css'
import { useState, useEffect } from 'react';
import api from '../../services/api'
import { modals } from '@mantine/modals'
import { notifications } from '@mantine/notifications'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// Modalidades de concorrência (Lei de Cotas, 12.711/2012). Mesma lista
// validada no backend — mantém as duas em sincronia se for editar.
const MODALIDADES = [
    { value: 'AC', label: 'AC — Ampla Concorrência' },
    { value: 'LB_EP', label: 'LB_EP — Baixa renda, Escola Pública' },
    { value: 'LI_EP', label: 'LI_EP — Renda livre, Escola Pública' },
    { value: 'LB_PPI', label: 'LB_PPI — Baixa renda, Pretos/Pardos/Indígenas' },
    { value: 'LI_PPI', label: 'LI_PPI — Renda livre, Pretos/Pardos/Indígenas' },
    { value: 'LB_PCD', label: 'LB_PCD — Baixa renda, Pessoa com Deficiência' },
    { value: 'LI_PCD', label: 'LI_PCD — Renda livre, Pessoa com Deficiência' },
    { value: 'LB_Q', label: 'LB_Q — Baixa renda, Quilombola' },
    { value: 'LI_Q', label: 'LI_Q — Renda livre, Quilombola' },
];

export const Perfil = () => {
    const { setColorScheme } = useMantineColorScheme();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editingName, setEditingName] = useState(false);
    const [newName, setNewName] = useState('');

    const [editingField, setEditingField] = useState(null); // 'nome', 'email', 'senha', 'nota_enem', 'modalidades' ou null
    const [tempValue, setTempValue] = useState('');
    const [tempPassword, setTempPassword] = useState('');
    const [tempNotaEnem, setTempNotaEnem] = useState('');
    const [tempModalidades, setTempModalidades] = useState([]);

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
        if (editingField === 'nome' && tempValue.trim().length < 3) {
            notifications.show({ title: 'Nome inválido', message: 'Digite seu nome completo.', color: 'red' });
            return;
        }
        if (editingField === 'email' && !EMAIL_REGEX.test(tempValue)) {
            notifications.show({ title: 'E-mail inválido', message: 'Digite um e-mail válido.', color: 'red' });
            return;
        }
        if (editingField === 'senha' && !SENHA_REGEX.test(tempPassword)) {
            notifications.show({
                title: 'Senha inválida',
                message: 'Mínimo 8 caracteres, com pelo menos 1 letra e 1 número.',
                color: 'red',
            });
            return;
        }
        if (editingField === 'nota_enem' && tempNotaEnem !== '' && tempNotaEnem !== null) {
            const nota = Number(tempNotaEnem);
            if (!Number.isFinite(nota) || nota < 0 || nota > 1000) {
                notifications.show({ title: 'Nota inválida', message: 'Digite uma nota entre 0 e 1000.', color: 'red' });
                return;
            }
        }

        try {
            const dataToUpdate = {};

            if (editingField === 'nome') dataToUpdate.nome = tempValue;
            if (editingField === 'email') dataToUpdate.email = tempValue;
            if (editingField === 'senha') dataToUpdate.senha = tempPassword;
            if (editingField === 'nota_enem') {
                dataToUpdate.nota_enem = tempNotaEnem === '' ? null : Number(tempNotaEnem);
            }
            if (editingField === 'modalidades') dataToUpdate.modalidades = tempModalidades;

            await api.put(`/usuario/${user.id}`, dataToUpdate);

            // Atualiza o estado local para refletir a mudança (exceto senha por segurança)
            if (editingField !== 'senha') {
                setUser({ ...user, ...dataToUpdate });
            }

            setEditingField(null);
            setTempPassword('');
            notifications.show({ title: 'Sucesso', message: 'Atualizado com sucesso!', color: 'teal' });
        } catch (err) {
            notifications.show({
                title: 'Erro ao salvar',
                message: err.response?.data?.error || 'Erro ao salvar alterações.',
                color: 'red',
            });
        }
    };

    const handleMudarTema = async (tema) => {
        setColorScheme(tema);
        setUser({ ...user, configuracoes: { ...user.configuracoes, tema } });
        try {
            await api.put(`/usuario/${user.id}`, { configuracoes: { tema } });
        } catch {
            notifications.show({ title: 'Erro ao salvar', message: 'Erro ao salvar o tema.', color: 'red' });
        }
    };

    const handleSaveName = async () => {
        try {
            const response = await api.put(`/usuario/${user.id}`, { nome: newName });
            setUser({ ...user, nome: newName });
            setEditingName(false);
        } catch (err) {
            notifications.show({ title: 'Erro ao salvar', message: 'Erro ao salvar.', color: 'red' });
        }
    };

    const handleDeleteAccount = async () => {
        try {
            await api.delete(`/usuario/${user.id}`);

            // Limpa os dados do navegador
            localStorage.removeItem('@NotePlus:user');
            localStorage.removeItem('@NotePlus:token');

            notifications.show({
                title: 'Conta excluída',
                message: 'Sua conta foi excluída permanentemente.',
                color: 'teal',
            });
            // Redireciona de forma bruta para limpar estados; pequeno atraso pro toast aparecer
            setTimeout(() => { window.location.href = '/cadastro'; }, 1200);
        } catch (err) {
            notifications.show({
                title: 'Erro ao excluir',
                message: err.response?.data?.error || 'Erro ao deletar conta.',
                color: 'red',
            });
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
        <Container className={classes.mainContainer} fluid>
            <Stack mt={20}>
                {/* HEADER */}
                <Text fw={700} size="24px">Perfil</Text>

                {/* Conteúdo em si num teto de leitura confortável; a página em
                    volta (fundo, título) usa toda a largura, igual à Home. */}
                <Tabs defaultValue="perfil" variant="outline" maw={900} classNames={{
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
                                        <TextInput required value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
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
                                        <TextInput required type="email" value={tempValue} onChange={(e) => setTempValue(e.target.value)} />
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
                                        <PasswordInput
                                            required
                                            placeholder="Mínimo 8 caracteres, letras e números"
                                            value={tempPassword}
                                            onChange={(e) => setTempPassword(e.target.value)}
                                        />
                                        <Group gap="xs">
                                            <Button size="compact-xs" color="orange" onClick={handleUpdate}>Alterar Senha</Button>
                                            <Button size="compact-xs" variant="subtle" color="gray" onClick={() => setEditingField(null)}>Cancelar</Button>
                                        </Group>
                                    </Stack>
                                </DetailItem>
                            </Box>

                            <Box mt="md">
                                <Text fw={700} size="lg" mb="lg">Perfil de Candidato</Text>

                                {/* EDIÇÃO DA NOTA DO ENEM */}
                                <DetailItem
                                    label="Nota do ENEM"
                                    value={user.nota_enem != null ? user.nota_enem : 'Não informada'}
                                    isEditing={editingField === 'nota_enem'}
                                    onEdit={() => { setEditingField('nota_enem'); setTempNotaEnem(user.nota_enem ?? ''); }}
                                >
                                    <Stack gap="xs">
                                        <NumberInput
                                            placeholder="Ex: 756.30"
                                            min={0}
                                            max={1000}
                                            decimalScale={2}
                                            value={tempNotaEnem}
                                            onChange={setTempNotaEnem}
                                        />
                                        <Group gap="xs">
                                            <Button size="compact-xs" color="orange" onClick={handleUpdate}>Salvar</Button>
                                            <Button size="compact-xs" variant="subtle" color="gray" onClick={() => setEditingField(null)}>Cancelar</Button>
                                        </Group>
                                    </Stack>
                                </DetailItem>

                                {/* EDIÇÃO DAS MODALIDADES DE CONCORRÊNCIA */}
                                <DetailItem
                                    label="Modalidades que você concorre"
                                    value={user.modalidades?.length > 0 ? user.modalidades.join(', ') : 'Nenhuma selecionada'}
                                    isEditing={editingField === 'modalidades'}
                                    onEdit={() => { setEditingField('modalidades'); setTempModalidades(user.modalidades || []); }}
                                >
                                    <Stack gap="xs">
                                        <Checkbox.Group value={tempModalidades} onChange={setTempModalidades}>
                                            <Stack gap="xs">
                                                {MODALIDADES.map((m) => (
                                                    <Checkbox key={m.value} value={m.value} label={m.label} color="orange" />
                                                ))}
                                            </Stack>
                                        </Checkbox.Group>
                                        <Group gap="xs">
                                            <Button size="compact-xs" color="orange" onClick={handleUpdate}>Salvar</Button>
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
                                <SimpleGrid cols={2} spacing="md">
                                    <UnstyledButton
                                        className={`${classes.appearanceBtn} ${user.configuracoes?.tema === 'light' ? classes.activeAppearance : ''}`}
                                        onClick={() => handleMudarTema('light')}
                                    >
                                        <Group gap="xs">
                                            <IconSun size={18} color="#fab005" />
                                            <Text size="sm" fw={500}>Claro</Text>
                                        </Group>
                                    </UnstyledButton>
                                    <UnstyledButton
                                        className={`${classes.appearanceBtn} ${user.configuracoes?.tema === 'dark' ? classes.activeAppearance : ''}`}
                                        onClick={() => handleMudarTema('dark')}
                                    >
                                        <Group gap="xs">
                                            <IconMoon size={18} />
                                            <Text size="sm" fw={500}>Escuro</Text>
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
    <Box mb="lg" py={4}>
        <Divider mb="md" opacity={0.5} />
        <Group justify="space-between" align="flex-start">
            <Box style={{ flex: 1 }}>
                <Text size="xs" fw={700}>{label}</Text>
                {isEditing ? children : <Text size="sm" c="dimmed" mt={4}>{value}</Text>}
            </Box>

            {!isEditing && (
                <Anchor component="button" size="xs" fw={700} underline="never" onClick={onEdit}>
                    Editar
                </Anchor>
            )}
        </Group>
    </Box>
);