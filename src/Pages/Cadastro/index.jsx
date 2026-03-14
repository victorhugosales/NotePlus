import {
  Button,
  Container,
  Paper,
  PasswordInput,
  TextInput,
  Group,
  Anchor,
  Text,
} from '@mantine/core';
import classes from './Cadastro.module.css';
import { NavLink } from "react-router-dom";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import api from './../../services/api';

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

    if (senha.length < 6) {
      novoErros.senha = 'A senha deve ter no mínimo 6 caracteres';
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
    const response = await api.post('/usuarios', { 
      nome, 
      email, 
      senha 
    });

    alert('Conta criada com sucesso!');
    navigate('/login');
  } catch (error) {
    const mensagemErro = error.response?.data?.error || 'Erro ao cadastrar';
    alert('Erro: ' + mensagemErro);
  } finally {
    setLoading(false);
  }
};
  return (
    <Container size={420} my={80} justify='center'>
      <Group justify='center'>
        <Text className={classes.logo}>NotePlus+</Text>
      </Group>

      <form onSubmit={handleCriarConta}>
        <Paper withBorder shadow='md' p={22} mt={30} radius='sm'>
          <TextInput
            label='Nome'
            placeholder='Seu nome'
            required
            value={nome}
            onChange={(e) => setNome(e.currentTarget.value)}
            error={erros.nome}
          />
          <TextInput
            label='Email'
            placeholder='exemplo@gmail.com'
            required
            mt='md'
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            error={erros.email} 
          />
          <PasswordInput
            label='Senha'
            placeholder='No mínimo 6 caracteres'
            required
            mt='md'
            value={senha}
            onChange={(e) => setSenha(e.currentTarget.value)}
            error={erros.senha}
          />

          <Group>
            <Text className={classes.Politic}>Ao continuar, você concorda com os Termos de Serviço e a Política de Privacidade da Note Plus.</Text>
          </Group>

          <Button 
            className={classes.criar} 
            fullWidth 
            type="submit" 
            loading={loading}
          >
            Criar Conta
          </Button>

          <Group className={classes.groupForgotPassword}>
            <Text className={classes.forgotPassword}>Já possui conta?</Text>
            <Anchor className={classes.forgotPassword} href='#' component={NavLink} to="/Login">
              Entre
            </Anchor>
          </Group>
        </Paper>
      </form>
    </Container>
  );
};