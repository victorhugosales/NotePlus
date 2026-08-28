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
            <Stack className={classes.contentStack} gap={4}>
                <Text className={classes.universidadeNome}>
                    {dados.sigla_universidade} - {dados.nome_universidade}
                </Text>

                <Text className={classes.detalhesTexto}>
                    {dados.campus} {dados.cidade}
                </Text>

                <Text className={classes.grauTexto}>
                    {dados.grau}{dados.turno ? ` · ${dados.turno}` : ''}
                </Text>

                <Group className={classes.vagasBox} justify="space-between" wrap="nowrap">
                    <Box>
                        <Text className={classes.vagasLabel}>Vagas</Text>
                        <Text className={classes.vagasNumero}>{dados.vagas ?? '—'}</Text>
                    </Box>

                    {/* nota_corte só vem preenchido nos cards de "Destaque"
                        (Maiores/Menores Notas, Mais Ofertados, Mais
                        Procurados) — nos demais o dado nem é buscado. */}
                    {dados.nota_corte > 0 && (
                        <Box ta="right">
                            <Text className={classes.vagasLabel}>Nota de corte</Text>
                            <Text className={classes.vagasNumero}>{Number(dados.nota_corte).toFixed(2)}</Text>
                        </Box>
                    )}
                </Group>

                <Anchor
                    component={NavLink}
                    to={`/Detalhes?curso=${encodeURIComponent(dados.curso)}&uni=${encodeURIComponent(dados.sigla_universidade)}&codigo=${dados.codigo_curso}${dados.turno ? `&turno=${encodeURIComponent(dados.turno)}` : ''}`}
                    underline="none"
                    style={{ marginTop: 'auto' }}
                >
                    <Button
                        fullWidth
                        variant="light"
                        radius="md"
                        size="sm"
                        mt={12}
                        styles={{
                            root: { height: '36px', fontSize: '13px', fontWeight: 600 }
                        }}
                    >
                        Ver Curso
                    </Button>
                </Anchor>
            </Stack>
        </Card>
    );
};