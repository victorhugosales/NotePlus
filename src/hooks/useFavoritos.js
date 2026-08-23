import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { notifications } from '@mantine/notifications';

// Mesma chave usada nos dois lados (favorito salvo x item de uma busca) pra
// saber se um card já está favoritado.
const chave = (item) => `${item.codigo_curso}-${item.sigla_universidade}`;

const CACHE_KEY = 'cache_favoritos';

// Centraliza carregar/favoritar/desfavoritar cursos. Usado em toda página
// que lista cursos em CardCurso (Home, Cursos) pra manter a estrela e a
// lista de favoritos em sincronia sem duplicar essa lógica em cada uma.
//
// Começa com o último valor visto (sessionStorage) em vez de vazio: como
// Home/Cursos remontam a cada navegação, sem isso as estrelas "piscavam"
// desmarcadas por um instante toda vez que a página recarregava.
export function useFavoritos({ onNaoAutenticado } = {}) {
    const [favoritos, setFavoritos] = useState(() => {
        const cache = sessionStorage.getItem(CACHE_KEY);
        if (!cache) return [];
        try {
            const dados = JSON.parse(cache);
            return Array.isArray(dados) ? dados : [];
        } catch {
            return [];
        }
    });
    const [loading, setLoading] = useState(false);

    const carregarFavoritos = useCallback(async () => {
        if (!localStorage.getItem('@NotePlus:token')) {
            setFavoritos([]);
            sessionStorage.removeItem(CACHE_KEY);
            return;
        }
        setLoading(true);
        try {
            const response = await api.get('/favoritos');
            const dados = Array.isArray(response.data) ? response.data : [];
            setFavoritos(dados);
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(dados));
        } catch (error) {
            console.error('Erro ao carregar favoritos', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { carregarFavoritos(); }, [carregarFavoritos]);

    const favoritosSet = new Set(favoritos.map(chave));
    const isFavorito = (item) => favoritosSet.has(chave(item));

    const toggleFavorito = async (item) => {
        if (!localStorage.getItem('@NotePlus:token')) {
            onNaoAutenticado?.();
            return;
        }

        const existente = favoritos.find((f) => chave(f) === chave(item));

        try {
            let novaLista;
            if (existente) {
                await api.delete(`/favoritos/${existente.id}`);
                novaLista = favoritos.filter((f) => f.id !== existente.id);
            } else {
                const response = await api.post('/favoritos', {
                    codigo_curso: item.codigo_curso,
                    sigla_universidade: item.sigla_universidade,
                    curso: item.curso,
                    nome_universidade: item.nome_universidade,
                    uf_campus: item.uf_campus,
                    campus: item.campus,
                    grau: item.grau,
                });
                novaLista = [response.data, ...favoritos];
            }
            setFavoritos(novaLista);
            sessionStorage.setItem(CACHE_KEY, JSON.stringify(novaLista));
        } catch {
            notifications.show({
                title: 'Erro',
                message: 'Não foi possível atualizar seus favoritos.',
                color: 'red',
            });
        }
    };

    return { favoritos, isFavorito, toggleFavorito, loading, recarregarFavoritos: carregarFavoritos };
}
