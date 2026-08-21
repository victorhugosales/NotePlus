import {
    Button,
    Stack,
    Group,
    Anchor,
    Text,
    Box,
    Card,
    ActionIcon,
} from '@mantine/core';
import { IconStar, IconStarFilled } from '@tabler/icons-react';
import { NavLink } from 'react-router-dom';
import classes from './Card.module.css'

// isFavorito/onToggleFavorito são opcionais: a estrela só aparece quando a
// página que renderiza o card controla o estado de favoritos (Home, Cursos).
export const CardCurso = ({ dados, isFavorito, onToggleFavorito }) => {
    if (!dados) return null;
    return (
        <Card
            padding={0} // Garante que não haja espaço entre a borda do card e o Box azul
            className={classes.cardContainer}
            withBorder
        >
            {/* Cabeçalho que encosta nas bordas */}
            <Box className={classes.headerBox} style={{ position: 'relative' }}>
                <Text className={classes.cursoNome}>
                    {dados.curso}
                </Text>

                {onToggleFavorito && (
                    <ActionIcon
                        variant="transparent"
                        size="sm"
                        style={{ position: 'absolute', top: 6, right: 6 }}
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onToggleFavorito(dados);
                        }}
                        aria-label={isFavorito ? 'Remover dos favoritos' : 'Favoritar curso'}
                        title={isFavorito ? 'Remover dos favoritos' : 'Favoritar curso'}
                    >
                        {isFavorito ? (
                            <IconStarFilled size={18} color="#fab005" />
                        ) : (
                            <IconStar size={18} color="white" />
                        )}
                    </ActionIcon>
                )}
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
                    <Text className={classes.vagasNumero}>{dados.vagas ?? '—'}</Text>
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