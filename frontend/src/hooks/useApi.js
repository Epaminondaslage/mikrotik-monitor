// =============================================================================
// Mikrotik Monitor — frontend/src/hooks/useApi.js
// Descrição: Hook genérico para busca de dados da API com polling automático.
//            Gerencia loading, error e refetch com intervalo configurável.
// =============================================================================

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Hook de fetch com polling automático.
 *
 * @param {Function} fetcher - função assíncrona que retorna dados
 * @param {any[]} deps - dependências que disparam re-fetch
 * @param {number} interval - intervalo de polling em ms (0 = sem polling)
 */
export function useApi(fetcher, deps = [], interval = 0) {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);
  const isMounted = useRef(true);

  const fetch_ = useCallback(async () => {
    try {
      const result = await fetcher();
      if (isMounted.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) setError(err.message);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    isMounted.current = true;
    setLoading(true);
    fetch_();

    let timer;
    if (interval > 0) {
      timer = setInterval(fetch_, interval);
    }

    return () => {
      isMounted.current = false;
      clearInterval(timer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetch_]);

  return { data, loading, error, refetch: fetch_ };
}
