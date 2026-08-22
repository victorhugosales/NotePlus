import {
  Button,
  PasswordInput,
  TextInput,
  Text,
  Divider,
} from '@mantine/core';
import { IconArrowRight, IconBrandGoogle } from '@tabler/icons-react';
import { AuthLayout } from '../../components/AuthLayout';
import { AuthTabs } from '../../components/AuthTabs';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import api from '../../services/api';

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

    const emailRegex = /@gmail\.com$|@outlook\.com$/;
    if (!emailRegex.test(email.toLowerCase())) {
      novoErros.email = 'Use um e-mail @gmail.com ou @outlook.com';
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
      localStorage.setItem('@NotePlus:token', response.data.token);
      localStorage.setItem('@NotePlus:user', JSON.stringify(response.data.user));

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

      <Button
        fullWidth
        variant="default"
        radius="md"
        size="md"
        leftSection={<IconBrandGoogle size={18} />}
        onClick={() => notifications.show({
          title: 'Em breve',
          message: 'Cadastro com Google ainda não está disponível.',
          color: 'blue',
        })}
      >
        Continuar com Google
      </Button>
    </AuthLayout>
  );
};
