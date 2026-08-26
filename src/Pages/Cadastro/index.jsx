import {
  Button,
  PasswordInput,
  TextInput,
  Text,
  Divider,
  Box,
  Center,
} from '@mantine/core';
import { IconArrowRight } from '@tabler/icons-react';
import { GoogleLogin } from '@react-oauth/google';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthTabs } from '../../components/AuthTabs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import api from '../../services/api';
import { salvarSessao } from '../../utils/authStorage';

export const Cadastro = () => {
  const navigate = useNavigate();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const [erros, setErros] = useState({ email: '', senha: '', nome: '' });
  const [loading, setLoading] = useState(false);

  const validar = () => {
    let novoErros = { email: '', senha: '', nome: '' };
    let isValid = true;

    if (nome.trim().length < 3) {
      novoErros.nome = 'Digite seu nome completo';
      isValid = false;
    }

    // Antes só aceitava @gmail.com/@outlook.com — restrição artificial que
    // barrava gente com e-mail institucional, @hotmail, @yahoo etc. Agora
    // valida só o formato (algo@algo.algo), sem lista de domínios permitidos.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      novoErros.email = 'Digite um e-mail válido';
      isValid = false;
    }

    const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;
    if (!senhaRegex.test(senha)) {
      novoErros.senha = 'Mínimo 8 caracteres, com pelo menos 1 letra e 1 número';
      isValid = false;
    }

    setErros(novoErros);
    return isValid;
  };

  const handleCriarConta = async (e) => {
    e.preventDefault();

    if (!validar()) return;
    setLoading(true);

    try {
      const response = await api.post('/usuarios', { nome, email, senha });

      // Cadastro já vem com token + user (login automático), igual ao /login
      salvarSessao(response.data.token, response.data.user, true);

      navigate('/perfil');
    } catch (error) {
      const mensagemErro = error.response?.data?.error || 'Erro ao cadastrar';
      notifications.show({
        title: 'Não foi possível criar a conta',
        message: mensagemErro,
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

      salvarSessao(response.data.token, response.data.user, true);

      navigate('/perfil');
    } catch (error) {
      const mensagemErro = error.response?.data?.error || 'Erro ao continuar com o Google.';
      notifications.show({ title: 'Não foi possível criar a conta', message: mensagemErro, color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Novo por aqui"
      title="Crie sua conta."
      subtitle="Salve cursos favoritos, receba alertas de mudança na nota de corte e monte sua lista de opções para o SISU."
    >
      <AuthTabs value="criar" />

      <form onSubmit={handleCriarConta}>
        <TextInput
          label="Nome completo"
          placeholder="Seu nome"
          required
          value={nome}
          onChange={(e) => setNome(e.currentTarget.value)}
          error={erros.nome}
        />
        <TextInput
          label="E-mail"
          placeholder="exemplo@email.com"
          required
          mt="md"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          error={erros.email}
        />
        <PasswordInput
          label="Senha"
          description="mín. 8 caracteres, letras e números"
          placeholder="Crie uma senha"
          required
          mt="md"
          value={senha}
          onChange={(e) => setSenha(e.currentTarget.value)}
          error={erros.senha}
        />

        <Button
          fullWidth
          mt="lg"
          radius="md"
          size="md"
          type="submit"
          rightSection={<IconArrowRight size={18} />}
          loading={loading}
        >
          Criar conta
        </Button>
      </form>

      <Divider label="ou continue com" labelPosition="center" my="lg" />

      <Center>
        <Box style={{ width: '100%', maxWidth: 380 }}>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => notifications.show({
              title: 'Não foi possível criar a conta',
              message: 'Erro ao continuar com o Google.',
              color: 'red',
            })}
            theme="outline"
            size="large"
            shape="pill"
            text="signup_with"
            width="380"
          />
        </Box>
      </Center>
    </AuthLayout>
  );
};
