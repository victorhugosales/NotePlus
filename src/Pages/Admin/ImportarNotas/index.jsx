import {
  Title,
  Text,
  Card,
  Stack,
  Group,
  FileInput,
  NumberInput,
  Button,
  Alert,
  Table,
  Badge,
  Checkbox,
  Divider,
} from '@mantine/core';
import { IconUpload, IconAlertTriangle, IconCheck } from '@tabler/icons-react';
import { useState } from 'react';
import { notifications } from '@mantine/notifications';
import api from '../../../services/api';

const anoAtual = new Date().getFullYear();

export const ImportarNotas = () => {
  const [arquivo, setArquivo] = useState(null);
  const [ano, setAno] = useState(anoAtual);
  const [analisando, setAnalisando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [relatorio, setRelatorio] = useState(null);
  const [substituir, setSubstituir] = useState(false);
  const [resultado, setResultado] = useState(null);

  const handleAnalisar = async () => {
    if (!arquivo || !ano) {
      notifications.show({ title: 'Campos obrigatórios', message: 'Selecione o arquivo e informe o ano.', color: 'red' });
      return;
    }

    setAnalisando(true);
    setRelatorio(null);
    setResultado(null);
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('ano', ano);

      const response = await api.post('/admin/importacoes/analisar', formData);
      setRelatorio(response.data);
      setSubstituir(false);
    } catch (error) {
      const mensagem = error.response?.data?.error || 'Erro ao analisar a planilha.';
      notifications.show({ title: 'Não foi possível analisar', message: mensagem, color: 'red' });
    } finally {
      setAnalisando(false);
    }
  };

  const handleConfirmar = async () => {
    if (!arquivo || !relatorio) return;

    setConfirmando(true);
    try {
      const formData = new FormData();
      formData.append('arquivo', arquivo);
      formData.append('ano', ano);
      formData.append('substituir', substituir);

      const response = await api.post('/admin/importacoes/confirmar', formData);
      setResultado(response.data);
      setRelatorio(null);
      notifications.show({ title: 'Importação concluída', message: response.data.message, color: 'green' });
    } catch (error) {
      const mensagem = error.response?.data?.error || 'Erro ao confirmar a importação.';
      notifications.show({ title: 'Não foi possível importar', message: mensagem, color: 'red' });
    } finally {
      setConfirmando(false);
    }
  };

  return (
    <Stack p="xl" maw={900}>
      <div>
        <Title order={2}>Importar planilha de notas de corte</Title>
        <Text c="dimmed" size="sm" mt={4}>
          Envie o arquivo .xlsx do SISU/INEP, revise o relatório de validação e confirme a importação.
        </Text>
      </div>

      <Card withBorder radius="md" p="lg">
        <Stack gap="md">
          <Group grow align="flex-end">
            <FileInput
              label="Planilha (.xlsx)"
              placeholder="Selecione o arquivo"
              accept=".xlsx"
              leftSection={<IconUpload size={16} />}
              value={arquivo}
              onChange={setArquivo}
            />
            <NumberInput
              label="Ano"
              value={ano}
              onChange={setAno}
              min={2010}
              max={anoAtual + 1}
              clampBehavior="strict"
            />
          </Group>

          <Button onClick={handleAnalisar} loading={analisando} w={200}>
            Analisar planilha
          </Button>
        </Stack>
      </Card>

      {relatorio && (
        <Card withBorder radius="md" p="lg">
          <Stack gap="md">
            <Title order={4}>Relatório da análise</Title>

            <Group gap="lg">
              <Badge size="lg" color="gray">Total: {relatorio.totalLinhas}</Badge>
              <Badge size="lg" color="green">Válidas: {relatorio.totalValidas}</Badge>
              <Badge size="lg" color="red">Com erro: {relatorio.totalComErro}</Badge>
            </Group>

            {relatorio.anoJaTemDados && (
              <Alert icon={<IconAlertTriangle size={18} />} color="yellow" title={`O ano ${ano} já tem dados cadastrados`}>
                Já existem {relatorio.totalLinhasExistentes} linhas para esse ano no banco. Marque a opção abaixo
                para apagá-las e substituir pelas novas — sem marcar, a confirmação será recusada.
              </Alert>
            )}

            {relatorio.erros.length > 0 && (
              <>
                <Divider label={`Linhas com erro (mostrando até 100 de ${relatorio.totalComErro})`} labelPosition="left" />
                <Table.ScrollContainer minWidth={400} mah={300}>
                  <Table striped highlightOnHover>
                    <Table.Thead>
                      <Table.Tr>
                        <Table.Th>Linha</Table.Th>
                        <Table.Th>Erros</Table.Th>
                      </Table.Tr>
                    </Table.Thead>
                    <Table.Tbody>
                      {relatorio.erros.map((item) => (
                        <Table.Tr key={item.linha}>
                          <Table.Td>{item.linha}</Table.Td>
                          <Table.Td>{item.erros.join('; ')}</Table.Td>
                        </Table.Tr>
                      ))}
                    </Table.Tbody>
                  </Table>
                </Table.ScrollContainer>
              </>
            )}

            {relatorio.anoJaTemDados && (
              <Checkbox
                label={`Substituir os dados existentes de ${ano}`}
                checked={substituir}
                onChange={(e) => setSubstituir(e.currentTarget.checked)}
              />
            )}

            <Button
              onClick={handleConfirmar}
              loading={confirmando}
              disabled={relatorio.totalValidas === 0 || (relatorio.anoJaTemDados && !substituir)}
              color="green"
              miw={260}
              w="fit-content"
            >
              Confirmar importação ({relatorio.totalValidas} linhas)
            </Button>
          </Stack>
        </Card>
      )}

      {resultado && (
        <Alert icon={<IconCheck size={18} />} color="green" title="Importação concluída">
          {resultado.totalImportadas} linhas importadas para o ano {ano}
          {resultado.totalComErro > 0 && ` (${resultado.totalComErro} linhas ignoradas por erro de validação)`}.
        </Alert>
      )}
    </Stack>
  );
};
