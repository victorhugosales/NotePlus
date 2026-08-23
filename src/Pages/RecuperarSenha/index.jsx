import { Button, TextInput, Text, Stack } from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { AuthLayout } from '../../components/AuthLayout';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import api from '../../services/api';

export const RecuperarSenha = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleEnviar = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await api.post('/recuperar-senha', { email });
      setEnviado(true);
    } catch (error) {
      const mensagem = error.response?.data?.error || 'Erro ao solicitar redefinição de senha.';
      notifications.show({ title: 'Não foi possível continuar', message: mensagem, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  if (enviado) {
    return (
      <AuthLayout
        eyebrow="Recuperação de senha"
        title="Verifique seu e-mail."
        subtitle="Se existir uma conta com esse e-mail, enviamos um link para você redefinir sua senha. O link é válido por 1 hora."
      >
        <Text size="sm" c="dimmed" ta="center">
          Não recebeu? Confira a caixa de spam ou tente novamente em alguns minutos.
        </Text>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Recuperação de senha"
      title="Esqueceu sua senha?"
      subtitle="Informe o e-mail da sua conta e enviaremos um link para você criar uma nova senha."
    >
      <form onSubmit={handleEnviar}>
        <Stack gap="md">
          <TextInput
            label="E-mail"
            placeholder="voce@email.com"
            required
            value={email}
            onChange={(event) => setEmail(event.currentTarget.value)}
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
            Enviar link de redefinição
          </Button>
        </Stack>
      </form>
    </AuthLayout>
  );
};
