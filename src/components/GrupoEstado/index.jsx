import { Box, Group, Text, ActionIcon, Collapse } from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useState } from 'react';

// Cabeçalho "SISU" (sigla + nome do estado) com opção de retrair os
// resultados daquele estado — mesmo padrão de toggle usado na Sidebar
// (chevron que vira o card pra baixo/cima), só que por seção em vez da
// página inteira. Usado em Home e Faculdades, as duas telas que agrupam
// resultado por estado.
export const GrupoEstado = ({ sigla, nomeEstado, children }) => {
  const [aberto, setAberto] = useState(true);

  return (
    <Box mb={50}>
      <Group
        mb="lg"
        gap="xs"
        onClick={() => setAberto((atual) => !atual)}
        style={{ cursor: 'pointer' }}
      >
        <Box bg="blue.7" px={8} py={2} style={{ borderRadius: 4 }}>
          <Text c="white" fw={800}>{sigla}</Text>
        </Box>
        <Text fw={700} size="xl">- {nomeEstado || 'ESTADO'}</Text>
        {!aberto && <Text size="sm" c="dimmed">(clique para expandir)</Text>}
        <ActionIcon
          variant="subtle"
          color="gray"
          ml="auto"
          aria-label={aberto ? 'Retrair resultados' : 'Expandir resultados'}
          title={aberto ? 'Retrair' : 'Expandir'}
        >
          {aberto ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
        </ActionIcon>
      </Group>

      <Collapse in={aberto}>
        {children}
      </Collapse>
    </Box>
  );
};
