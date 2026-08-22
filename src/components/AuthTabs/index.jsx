import { SegmentedControl } from '@mantine/core';
import { useNavigate } from 'react-router-dom';

// Alterna entre /login e /cadastro. Mantidas como rotas separadas (o
// resto do app já linka pra elas assim), só a UI que fica com cara de
// abas dentro do mesmo cartão.
export const AuthTabs = ({ value }) => {
    const navigate = useNavigate();

    return (
        <SegmentedControl
            fullWidth
            radius="xl"
            color="brand"
            value={value}
            onChange={(novoValor) => navigate(novoValor === 'entrar' ? '/login' : '/cadastro')}
            data={[
                { label: 'Entrar', value: 'entrar' },
                { label: 'Criar conta', value: 'criar' },
            ]}
            mb="xl"
        />
    );
};
