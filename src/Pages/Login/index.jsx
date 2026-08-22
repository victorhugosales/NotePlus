import {
  Button,
  PasswordInput,
  TextInput,
  Group,
  Anchor,
  Checkbox,
  Divider,
} from '@mantine/core';
import { IconArrowRight, IconBrandGoogle } from '@tabler/icons-react';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthTabs } from '../../components/AuthTabs';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react'
import { notifications } from '@mantine/notifications';
import api from '../../services/api';

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleEntrar = async () => {
    if (!email || !senha) {
      notifications.show({
        title: 'Campos obrigatórios',
        message: 'Preencha e-mail e senha para continuar.',
        color: 'red',
      });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/login', { email, senha });

      localStorage.setItem('@NotePlus:token', response.data.token);
      localStorage.setItem('@NotePlus:user', JSON.stringify(response.data.user));

      navigate('/');
    } catch (err) {
      const mensagem = err.response?.data?.error || "Erro ao tentar logar.";
      notifications.show({
        title: 'Não foi possível entrar',
        message: mensagem,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  // Recursos que ainda não existem no backend (login social, recuperação
  // de senha) — mostram um aviso em vez de fingir que funcionam.
  const avisarEmBreve = (mensagem) => {
    notifications.show({ title: 'Em breve', message: mensagem, color: 'blue' });
  };

  return (
    <AuthLayout
      eyebrow="Área do candidato"
      title="Bem-vindo de volta."
      subtitle="Entre para acompanhar as notas de corte do SISU e comparar suas chances por curso e instituição."
    >
      <AuthTabs value="entrar" />

      <TextInput
        label="E-mail"
        placeholder="voce@email.com"
        required
        value={email}
        onChange={(event) => setEmail(event.currentTarget.value)}
        onKeyDown={(event) => event.key === 'Enter' && handleEntrar()}
      />
      <PasswordInput
        label="Senha"
        placeholder="Sua senha"
        required
        mt="md"
        value={senha}
        onChange={(event) => setSenha(event.currentTarget.value)}
        onKeyDown={(event) => event.key === 'Enter' && handleEntrar()}
      />

      <Group justify="space-between" mt="md">
        <Checkbox label="Lembrar de mim" size="xs" />
        <Anchor
          size="xs"
          c="dimmed"
          underline="never"
          onClick={() => avisarEmBreve('A recuperação de senha ainda não está disponível.')}
        >
          Esqueci a senha
        </Anchor>
      </Group>

      <Button
        fullWidth
        mt="xl"
        radius="md"
        size="md"
        rightSection={<IconArrowRight size={18} />}
        onClick={handleEntrar}
        loading={loading}
      >
        Entrar
      </Button>

      <Divider label="ou continue com" labelPosition="center" my="lg" />

      <Button
        fullWidth
        variant="default"
        radius="md"
        size="md"
        leftSection={<IconBrandGoogle size={18} />}
        onClick={() => avisarEmBreve('Login com Google ainda não está disponível.')}
      >
        Entrar com Google
      </Button>
    </AuthLayout>
  );
};
