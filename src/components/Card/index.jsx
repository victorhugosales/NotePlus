import {
    Button,
    Stack,
    Group,
    Anchor,
    Text,
    Box,
    Card,
} from '@mantine/core';
import { NavLink } from 'react-router-dom';
import classes from './Card.module.css'

export const CardCurso = ({ dados }) => {
    if (!dados) return null;
    return (
        <Card
            padding={0} // Garante que não haja espaço entre a borda do card e o Box azul
            className={classes.cardContainer}
            withBorder
        >
            {/* Cabeçalho que encosta nas bordas */}
            <Box className={classes.headerBox}>
                <Text className={classes.cursoNome}>
                    {dados.curso}
                </Text>
            </Box>

            {/* Conteúdo que TEM respiro (padding) */}
            <Stack className={classes.contentStack} gap={0}>
                <Text className={classes.universidadeNome}>
                    {dados.sigla_universidade} - {dados.nome_universidade}
                </Text>

                <Text className={classes.detalhesTexto}>
                    {dados.campus} {dados.cidade}
                </Text>

                <Text className={classes.grauTexto}>
                    {dados.grau}
                </Text>

                <Box mt={5}>
                    <Text className={classes.vagasLabel}>Vagas</Text>
                    <Text className={classes.vagasNumero}>{dados.vagas}</Text>
                </Box>

                <Anchor
                    component={NavLink}
                    to={`/Detalhes?curso=${encodeURIComponent(dados.curso)}&uni=${encodeURIComponent(dados.sigla_universidade)}&codigo=${dados.codigo_curso}`}
                    underline="none"
                    style={{ marginTop: 'auto' }}
                >
                    <Button
                        fullWidth
                        variant="light"
                        radius="md"
                        size="xs"
                        mt={10}
                        styles={{
                            root: { height: '30px', fontSize: '10px' }
                        }}
                    >
                        Ver Curso
                    </Button>
                </Anchor>
            </Stack>
        </Card>
    );
};