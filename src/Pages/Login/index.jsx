import {
  Button,
  Container,
  Paper,
  PasswordInput,
  TextInput,
  Image,
  Group,
  Anchor,
  Text,
} from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import classes from './login.module.css';
import goo from '../../assets/img01.png'
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from 'react'
import { notifications } from '@mantine/notifications';
import api from '../../services/api'; // Importe sua configuração do axios

export const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 1. Estados para capturar o que o usuário digita
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleEntrar = async () => {
    // Validação básica
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
      // 2. Fazendo a chamada real para o Back
      const response = await api.post('/login', { email, senha });

      // 3. Salvando os dados que o seu AuthController retorna
      // (token e o objeto user com id, nome, etc)
      localStorage.setItem('@NotePlus:token', response.data.token);
      localStorage.setItem('@NotePlus:user', JSON.stringify(response.data.user));

      // 4. Se deu tudo certo, vai para o Perfil (único lugar que exige login)
      navigate('/perfil');
    } catch (err) {
      // Pega a mensagem de erro vinda do backend (ex: "E-mail ou senha inválidos")
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

  return (
    <Container size={420} my={80} justify='center'>
      <Anchor component={NavLink} to="/" underline="never" c="dimmed">
        <Group gap={4} align="center">
          <IconArrowLeft size={16} stroke={1.5} />
          <Text size="sm">Voltar</Text>
        </Group>
      </Anchor>

      <Group justify='center'>
        <Text className={classes.logo}>NotePlus+</Text>
      </Group>

      <Paper withBorder shadow='md' p={22} mt={30} radius='sm'>
        <TextInput
          label='Email'
          placeholder='Digite seu email'
          required
          mt='md'
          radius='sm'
          // 5. Conectando o input ao estado
          value={email}
          onChange={(event) => setEmail(event.currentTarget.value)}
        />
        <PasswordInput
          label='Senha'
          placeholder='6 ou mais caracteres'
          required
          mt='md'
          radius='sm'
          // 6. Conectando o input ao estado
          value={senha}
          onChange={(event) => setSenha(event.currentTarget.value)}
        />

        <Button
          className={classes.entrar}
          onClick={handleEntrar} // Chama a função que criamos acima
          loading={loading}
          fullWidth
          mt="xl"
        >
          Entrar
        </Button>

        <Group className={classes.groupForgotPassword}>
          <Text className={classes.forgotPassword}>Não tem uma conta?</Text>
          <Anchor className={classes.forgotPassword} underline='never' component={NavLink} to="/Cadastro">
            Crie uma aqui
          </Anchor>
        </Group>
      </Paper>
    </Container>
  );
};