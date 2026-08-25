import { Modal, TextInput, ScrollArea, UnstyledButton, Text, Center, Loader, ActionIcon, Group, Box } from '@mantine/core';
import { IconArrowLeft, IconSearch } from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { estadosMap } from '../../utils/estados';
import classes from './FiltroCascataModal.module.css';

const ENDPOINT_POR_TIPO = {
  municipio: '/municipios-disponiveis',
  instituicao: '/instituicoes-disponiveis',
};

// Modal de duas etapas: escolhe a sigla do estado, depois escolhe um item
// (município ou instituição) dentre os cadastrados naquele estado. Usado
// pelos filtros "Municípios" e "Instituições" da Home — mesma mecânica,
// só muda o endpoint consultado na 2ª etapa.
export const FiltroCascataModal = ({ opened, onClose, titulo, tipo, ano, onSelecionar }) => {
  const [etapa, setEtapa] = useState('estado');
  const [estados, setEstados] = useState([]);
  const [ufSelecionada, setUfSelecionada] = useState(null);
  const [itens, setItens] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filtroTexto, setFiltroTexto] = useState('');

  // Reseta o modal toda vez que ele reabre, pra não começar já na etapa do
  // estado escolhido da última vez.
  useEffect(() => {
    if (!opened) return;
    setEtapa('estado');
    setUfSelecionada(null);
    setItens([]);
    setFiltroTexto('');

    const carregarEstados = async () => {
      setLoading(true);
      try {
        const response = await api.get('/estados-disponiveis', { params: { ano } });
        setEstados(response.data);
      } catch (error) {
        console.error('Erro ao buscar estados disponíveis', error);
      } finally {
        setLoading(false);
      }
    };
    carregarEstados();
  }, [opened, ano]);

  const handleSelecionarEstado = async (uf) => {
    setUfSelecionada(uf);
    setEtapa('item');
    setFiltroTexto('');
    setLoading(true);
    try {
      const response = await api.get(ENDPOINT_POR_TIPO[tipo], { params: { uf, ano } });
      setItens(response.data);
    } catch (error) {
      console.error(`Erro ao buscar ${tipo} disponíveis`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoltar = () => {
    setEtapa('estado');
    setUfSelecionada(null);
    setItens([]);
    setFiltroTexto('');
  };

  const handleSelecionarItem = (item) => {
    // Pra instituição, o item é {nome, sigla}; a busca em /pesquisar usa o
    // nome. Município já é uma string simples.
    onSelecionar(tipo === 'instituicao' ? item.nome : item, ufSelecionada);
    onClose();
  };

  const itensFiltrados = useMemo(() => {
    if (!filtroTexto) return itens;
    const termo = filtroTexto.toLowerCase();
    return itens.filter((item) => {
      const texto = tipo === 'instituicao' ? `${item.sigla} ${item.nome}` : item;
      return texto.toLowerCase().includes(termo);
    });
  }, [itens, filtroTexto, tipo]);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={etapa === 'estado' ? titulo : `${titulo} — ${ufSelecionada}`}
      size="md"
      centered
      overlayProps={{ backgroundOpacity: 0.55, blur: 3 }}
    >
      {etapa === 'item' && (
        <Group mb="sm">
          <ActionIcon variant="subtle" color="gray" onClick={handleVoltar} aria-label="Voltar para a lista de estados">
            <IconArrowLeft size={18} />
          </ActionIcon>
          <Text size="sm" c="dimmed">Voltar</Text>
        </Group>
      )}

      {etapa === 'item' && (
        <TextInput
          placeholder={tipo === 'municipio' ? 'Filtrar municípios...' : 'Filtrar instituições...'}
          leftSection={<IconSearch size={16} />}
          value={filtroTexto}
          onChange={(e) => setFiltroTexto(e.currentTarget.value)}
          mb="sm"
        />
      )}

      {loading ? (
        <Center py="lg"><Loader color="brand" size="sm" /></Center>
      ) : (
        <ScrollArea.Autosize mah={400}>
          {etapa === 'estado' ? (
            estados.length === 0 ? (
              <Text size="sm" c="dimmed" ta="center" py="md">Nenhum estado com dados cadastrados.</Text>
            ) : (
              <Box className={classes.grid}>
                {estados.map((sigla) => (
                  <UnstyledButton
                    key={sigla}
                    className={classes.item}
                    onClick={() => handleSelecionarEstado(sigla)}
                  >
                    <Text fw={700}>{sigla}</Text>
                    <Text size="xs" c="dimmed">{estadosMap[sigla] || ''}</Text>
                  </UnstyledButton>
                ))}
              </Box>
            )
          ) : itensFiltrados.length === 0 ? (
            <Text size="sm" c="dimmed" ta="center" py="md">
              {tipo === 'municipio' ? 'Nenhum município encontrado.' : 'Nenhuma instituição encontrada.'}
            </Text>
          ) : (
            itensFiltrados.map((item) => {
              const chave = tipo === 'instituicao' ? `${item.sigla}-${item.nome}` : item;
              const rotulo = tipo === 'instituicao' ? `${item.sigla} - ${item.nome}` : item;
              return (
                <UnstyledButton
                  key={chave}
                  className={classes.itemLista}
                  onClick={() => handleSelecionarItem(item)}
                >
                  <Text size="sm">{rotulo}</Text>
                </UnstyledButton>
              );
            })
          )}
        </ScrollArea.Autosize>
      )}
    </Modal>
  );
};
