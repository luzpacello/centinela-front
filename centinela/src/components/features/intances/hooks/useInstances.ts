import { useEffect, useState } from 'react';
import { fetchInstanceInventory, type InventoryInstance } from '../services/instanceService';

export function useInstances() {
  const [instances, setInstances] = useState<InventoryInstance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reloadCount, setReloadCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    fetchInstanceInventory(controller.signal)
      .then((inventory) => {
        if (!controller.signal.aborted) setInstances(inventory);
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setErrorMessage(error instanceof Error ? error.message : 'No se pudieron cargar las instancias.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [reloadCount]);

  function reloadInventory() {
    setIsLoading(true);
    setErrorMessage(null);
    setReloadCount((previousCount) => previousCount + 1);
  }

  return { instances, isLoading, errorMessage, reloadInventory };
}
