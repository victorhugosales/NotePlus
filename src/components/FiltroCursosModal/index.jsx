import { Modal, TextInput, ScrollArea, UnstyledButton, Text, Center, Loader } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import classes from '../FiltroCascataModal/FiltroCascataModal.module.css';

// Modal de lista flat: todos os cursos distintos cadastrados, sem cascata
// de estado. A busca dentro do modal é local (a lista inteira já veio do
// backend) — evita bater na API a cada tecla.
export const FiltroCursosModal = ({ opened, onClose, ano, onSelecionar }) => {
  const [cursos, setCursos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');

  useEffect(() => {
    if (!opened) return;
    setFiltroTexto('');

    const carregarCursos = async () => {
      setLoading(true);
      try {
        const response = await api.get('/cursos-disponiveis', { params: { ano } });
        setCursos(response.data);
      } catch (error) {
        console.error('Erro ao buscar cursos disponíveis', error);
      } finally {
        setLoading(false);
      }
    };
    carregarCursos();
  }, [opened, ano]);

  const cursosFiltrados = useMemo(() => {
    if (!filtroTexto) return cursos;
    const termo = filtroTexto.toLowerCase();
    return cursos.filter((curso) => curso.toLowerCase().includes(termo));
  }, [cursos, filtroTexto]);

  const handleSelecionar = (curso) => {
    onSelecionar(curso);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Cursos"
      size="md"
      centered
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      <TextInput
        placeholder="Filtrar cursos..."
        leftSection={<IconSearch size={16} />}
        value={filtroTexto}
        onChange={(e) => setFiltroTexto(e.currentTarget.value)}
        mb="sm"
        autoFocus
      />

      {loading ? (
        <Center py="lg"><Loader color="brand" size="sm" /></Center>
      ) : (
        <ScrollArea.Autosize mah={400}>
          {cursosFiltrados.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">Nenhum curso encontrado.</Text>
          ) : (
            cursosFiltrados.map((curso) => (
              <UnstyledButton
                key={curso}
                className={classes.itemLista}
                onClick={() => handleSelecionar(curso)}
              >
                <Text size="sm">{curso}</Text>
              </UnstyledButton>
            ))
          )}
        </ScrollArea.Autosize>
      )}
    </Modal>
  );
};
