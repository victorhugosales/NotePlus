import {
  Button,
  PasswordInput,
  TextInput,
  Group,
  Anchor,
  Checkbox,
  Divider,
  Box,
  Center,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthTabs } from '../../components/AuthTabs';
import { useNavigate, Link } from 'react-router-dom';
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

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    try {
      const response = await api.post('/login/google', { credential: credentialResponse.credential });

      localStorage.setItem('@NotePlus:token', response.data.token);
      localStorage.setItem('@NotePlus:user', JSON.stringify(response.data.user));

      navigate('/');
    } catch (err) {
      const mensagem = err.response?.data?.error || 'Erro ao entrar com o Google.';
      notifications.show({ title: 'Não foi possível entrar', message: mensagem, color: 'red' });
    } finally {
      setLoading(false);
    }
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
          component={Link}
          to="/recuperar-senha"
          size="xs"
          c="dimmed"
          underline="never"
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

      <Center>
        <Box style={{ width: '100%', maxWidth: 380 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => notifications.show({
              title: 'Não foi possível entrar',
              message: 'Erro ao entrar com o Google.',
              color: 'red',
            })}
            theme="outline"
            size="large"
            shape="pill"
            text="signin_with"
            width="380"
          />
        </Box>
      </Center>
    </AuthLayout>
  );
};
