import { Box, Text, Button } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { NavLink, useNavigate } from 'react-router-dom';
import classes from './AuthLayout.module.css';

// Casca visual compartilhada por Login e Cadastro: painel branco com o
// formulário à esquerda, painel escuro decorativo à direita (some no
// mobile). eyebrow/title/subtitle mudam por página; o resto do formulário
// vem via children.
export const AuthLayout = ({ eyebrow, title, subtitle, children }) => {
    const navigate = useNavigate();

    return (
        <Box className={classes.wrapper}>
            <Box className={classes.formSide}>
                <Box className={classes.formInner}>
                    <Text component={NavLink} to="/" className={classes.logo} underline="never">
                        NotePlus<span className={classes.logoPlus}>+</span>
                    </Text>

                    <Text className={classes.eyebrow}>{eyebrow}</Text>
                    <Text className={classes.title}>{title}</Text>
                    <Text className={classes.subtitle}>{subtitle}</Text>

                    {children}

                    {/* Deixa claro que dá pra usar o site sem criar conta — a
                        Home e as buscas são livres, só o Perfil exige login. */}
                    <Button
                        variant="subtle"
                        color="gray"
                        size="xs"
                        fullWidth
                        mt="lg"
                        leftSection={<IconArrowLeft size={14} />}
                        onClick={() => navigate('/')}
                    >
                        Talvez depois
                    </Button>

                    <Box className={classes.footerLinks}>
                        <Text component="span" className={classes.footerLink}>Termos de uso</Text>
                        <Text component="span" className={classes.footerDot}>·</Text>
                        <Text component="span" className={classes.footerLink}>Política de privacidade</Text>
                        <Text component="span" className={classes.footerDot}>·</Text>
                        <Text component="span" className={classes.footerLink}>Ajuda</Text>
                    </Box>
                </Box>
            </Box>

            <Box className={classes.decorSide} aria-hidden="true">
                <Box className={classes.decorGlowTop} />
                <Box className={classes.decorGlowBottom} />
            </Box>
        </Box>
    );
};
