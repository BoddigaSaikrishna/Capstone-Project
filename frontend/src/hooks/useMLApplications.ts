import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { MLApplication, Status } from '@/types';

interface DBMLApp {
  id: string;
  name: string;
  description: string | null;
  model_type: string | null;
  framework: string | null;
  version: string | null;
  accuracy: number | null;
  endpoint: string | null;
  status: string | null;
  last_trained: string | null;
  repository: string | null;
  created_at: string;
}

function fromDB(row: DBMLApp): MLApplication {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    modelType: row.model_type ?? '',
    framework: row.framework ?? '',
    version: row.version ?? '',
    accuracy: row.accuracy ?? 0,
    endpoint: row.endpoint ?? '',
    status: (row.status as Status) ?? 'pending',
    lastTrained: row.last_trained ?? new Date().toISOString(),
    repository: row.repository ?? '',
    createdAt: row.created_at,
  };
}

function toDB(app: Omit<MLApplication, 'id' | 'createdAt'>): Record<string, unknown> {
  return {
    name: app.name,
    description: app.description,
    model_type: app.modelType,
    framework: app.framework,
    version: app.version,
    accuracy: app.accuracy,
    endpoint: app.endpoint,
    status: app.status,
    last_trained: app.lastTrained,
    repository: app.repository,
  };
}

function loadLocalApps(): MLApplication[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('mldevops_ml_applications');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalApps(apps: MLApplication[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('mldevops_ml_applications', JSON.stringify(apps));
  } catch {
    // ignore
  }
}

export function useMLApplications() {
  const [apps, setApps] = useState<MLApplication[]>(() => loadLocalApps());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        setApps(loadLocalApps());
        return;
      }

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Supabase network timeout')), 2500)
      );

      const fetchPromise = supabase
        .from('ml_applications')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = (await Promise.race([fetchPromise, timeoutPromise])) as any;

      if (error || !data || data.length === 0) {
        setApps(loadLocalApps());
        return;
      }

      const parsed = data.map(fromDB);
      setApps(parsed);
      saveLocalApps(parsed);
    } catch {
      setApps(loadLocalApps());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  const addApp = useCallback(async (app: Omit<MLApplication, 'id' | 'createdAt'>) => {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        const newApp: MLApplication = {
          ...app,
          id: `ml_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        setApps((prev) => {
          const updated = [newApp, ...prev];
          saveLocalApps(updated);
          return updated;
        });
        return newApp;
      }
      const { data, error } = await supabase
        .from('ml_applications')
        .insert(toDB(app))
        .select('*')
        .maybeSingle();

      if (error || !data) {
        const newApp: MLApplication = {
          ...app,
          id: `ml_${Date.now()}`,
          createdAt: new Date().toISOString(),
        };
        setApps((prev) => {
          const updated = [newApp, ...prev];
          saveLocalApps(updated);
          return updated;
        });
        return newApp;
      }
      const newApp = fromDB(data as DBMLApp);
      setApps((prev) => {
        const updated = [newApp, ...prev];
        saveLocalApps(updated);
        return updated;
      });
      return newApp;
    } catch {
      const newApp: MLApplication = {
        ...app,
        id: `ml_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setApps((prev) => {
        const updated = [newApp, ...prev];
        saveLocalApps(updated);
        return updated;
      });
      return newApp;
    }
  }, []);

  const deleteApp = useCallback(async (id: string) => {
    try {
      if (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL !== 'https://placeholder.supabase.co') {
        await supabase.from('ml_applications').delete().eq('id', id);
      }
    } catch {
      // ignore
    }
    setApps((prev) => {
      const updated = prev.filter((a) => a.id !== id);
      saveLocalApps(updated);
      return updated;
    });
    return true;
  }, []);

  const updateApp = useCallback((id: string, updates: Partial<MLApplication>) => {
    setApps((prev) => {
      const updated = prev.map((a) => (a.id === id ? { ...a, ...updates } : a));
      saveLocalApps(updated);
      return updated;
    });
  }, []);

  return { apps, loading, error, addApp, deleteApp, updateApp, refetch: fetchApps };
}
