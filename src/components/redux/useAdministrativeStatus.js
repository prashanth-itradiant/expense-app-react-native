import { API_URL } from '@env';
import axios from 'axios';
import { useEffect, useState } from 'react';

export function useAdministrativeStatus() {
  const [isAdministrative, setIsAdministrative] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAdmin = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/admin/is-administrative`, {
          withCredentials: true,
        });

        if (mounted) {
          setIsAdministrative(Boolean(data?.data?.isAdministrative));
        }
      } catch {
        if (mounted) {
          setIsAdministrative(false);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, []);

  return { isAdministrative, loading };
}
