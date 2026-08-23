import { Button, PasswordInput, Text, Stack } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { AuthLayout } from '../../components/AuthLayout';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import api from '../../services/api';

export const RedefinirSenha = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const validar = () => {
    const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!senhaRegex.test(novaSenha)) {
      setErro('Mínimo 8 caracteres, com pelo menos 1 letra e 1 número');
      return false;
    }
    if (novaSenha !== confirmarSenha) {
      setErro('As senhas não coincidem');
      return false;
    }
    setErro('');
    return true;
  };

  const handleRedefinir = async (e) => {
    e.preventDefault();
    if (!validar()) return;

    setLoading(true);
    try {
      await api.post('/redefinir-senha', { token, novaSenha });
      notifications.show({
        title: 'Senha redefinida',
        message: 'Sua senha foi alterada com sucesso. Entre com a nova senha.',
        color: 'green',
      });
      navigate('/login');
    } catch (error) {
      const mensagem = error.response?.data?.error || 'Erro ao redefinir senha.';
      notifications.show({ title: 'Não foi possível redefinir sua senha', message: mensagem, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout
        eyebrow="Redefinir senha"
        title="Link inválido."
        subtitle="Esse link de redefinição de senha está incompleto ou expirou. Solicite um novo."
      >
        <Button fullWidth radius="md" size="md" onClick={() => navigate('/recuperar-senha')}>
          Solicitar novo link
        </Button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Redefinir senha"
      title="Crie uma nova senha."
      subtitle="Escolha uma nova senha para acessar sua conta."
    >
      <form onSubmit={handleRedefinir}>
        <Stack gap="md">
          <PasswordInput
            label="Nova senha"
            description="mín. 8 caracteres, letras e números"
            placeholder="Digite a nova senha"
            required
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.currentTarget.value)}
            error={erro}
          />
          <PasswordInput
            label="Confirmar nova senha"
            placeholder="Repita a nova senha"
            required
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.currentTarget.value)}
          />

          <Button
            fullWidth
            mt="xs"
            radius="md"
            size="md"
            type="submit"
            rightSection={<IconArrowRight size={18} />}
            loading={loading}
          >
            Redefinir senha
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
};
