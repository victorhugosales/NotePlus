import { Container, Card, Stack, Title, Text, Button, ThemeIcon } from '@mantine/core';
import { IconMessageCircle, IconExternalLink } from '@tabler/icons-react';
import classes from './Feedback.module.css';
import { tocarClique } from '../../utils/sons';

const LINK_FORMULARIO = 'https://forms.gle/MQMemZMmkViqf5Xe7';

export const Feedback = () => {
  return (
    <Container className={classes.mainContainer} fluid>
      <Card className={classes.card} shadow="sm" radius="md" p="xl" withBorder>
        <Stack gap="md" align="center">
          <ThemeIcon size={56} radius="xl" variant="light">
            <IconMessageCircle size={30} stroke={1.5} />
          </ThemeIcon>

          <Title order={2}>Sua opinião importa</Title>

          <Text c="dimmed" size="sm">
            O NotePlus ainda está em fase de testes, e sua opinião ajuda a definir
            os próximos passos da plataforma. Responda um formulário rápido com
            algumas informações e o que você achou até aqui — leva só alguns
            minutinhos.
          </Text>

          <Button
            component="a"
            href={LINK_FORMULARIO}
            target="_blank"
            rel="noopener noreferrer"
            radius="md"
            size="md"
            rightSection={<IconExternalLink size={18} stroke={1.5} />}
            onClick={tocarClique}
          >
            Participar do formulário
          </Button>
        </Stack>
      </Card>
    </Container>
  );
};
