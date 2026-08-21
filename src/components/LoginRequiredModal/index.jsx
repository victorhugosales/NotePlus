import { Modal, Text, Group, Button } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

// Modal reutilizado sempre que um recurso exige login (favoritar, ver
// notificações, Análise Inteligente, etc). Mantém o mesmo texto/atalhos em
// todos os pontos de entrada em vez de duplicar o modal em cada página.
export const LoginRequiredModal = ({ opened, onClose, title = 'Entre na sua conta', message }) => {
    const navigate = useNavigate();

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title={title}
            centered
            overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
        >
            <Text size="sm" mb="md">
                {message || 'Esse recurso só está disponível para usuários da plataforma. Entre ou cadastre-se para continuar.'}
            </Text>
            <Group>
                <Button onClick={() => navigate('/login')}>Entrar</Button>
                <Button variant="outline" onClick={() => navigate('/cadastro')}>Cadastrar-se</Button>
            </Group>
        </Modal>
    );
};
