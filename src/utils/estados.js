export const estadosMap = {
  'AC': 'ACRE', 'AL': 'ALAGOAS', 'AM': 'AMAZONAS', 'AP': 'AMAPÁ', 'BA': 'BAHIA',
  'CE': 'CEARÁ', 'DF': 'DISTRITO FEDERAL', 'ES': 'ESPÍRITO SANTO', 'GO': 'GOIÁS',
  'MA': 'MARANHÃO', 'MG': 'MINAS GERAIS', 'MS': 'MATO GROSSO DO SUL', 'MT': 'MATO GROSSO',
  'PA': 'PARÁ', 'PB': 'PARAÍBA', 'PE': 'PERNAMBUCO', 'PI': 'PIAUÍ', 'PR': 'PARANÁ',
  'RJ': 'RIO DE JANEIRO', 'RN': 'RIO GRANDE DO NORTE', 'RO': 'RONDÔNIA', 'RR': 'RORAIMA',
  'RS': 'RIO GRANDE DO SUL', 'SC': 'SANTA CATARINA', 'SE': 'SERGIPE', 'SP': 'SÃO PAULO',
  'TO': 'TOCANTINS'
};

// Opções do filtro de Estado: "CE - CEARÁ", etc. Vazio = todos os estados.
export const opcoesEstado = Object.entries(estadosMap).map(([sigla, nome]) => ({
  value: sigla,
  label: `${sigla} - ${nome}`
}));
