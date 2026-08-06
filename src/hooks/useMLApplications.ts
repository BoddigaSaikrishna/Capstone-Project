import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { MLApplication, Status } from '@/types';
import { seedMLApplications } from '@/api/mockData';

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

export function useMLApplications() {
  const [apps, setApps] = useState<MLApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'https://placeholder.supabase.co') {
        setApps(seedMLApplications);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('ml_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setApps(seedMLApplications);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        // Seed the database with initial data
        const inserts = seedMLApplications.map(({ id, createdAt, ...app }) => toDB(app));
        const { data: seeded, error: seedError } = await supabase
          .from('ml_applications')
          .insert(inserts)
          .select('*');

        if (seedError || !seeded) {
          setApps(seedMLApplications);
        } else {
          setApps(seeded.map(fromDB));
        }
      } else {
        setApps(data.map(fromDB));
      }
    } catch {
      setApps(seedMLApplications);
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
        setApps((prev) => [newApp, ...prev]);
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
        setApps((prev) => [newApp, ...prev]);
        return newApp;
      }
      const newApp = fromDB(data as DBMLApp);
      setApps((prev) => [newApp, ...prev]);
      return newApp;
    } catch {
      const newApp: MLApplication = {
        ...app,
        id: `ml_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setApps((prev) => [newApp, ...prev]);
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
    setApps((prev) => prev.filter((a) => a.id !== id));
    return true;
  }, []);

  return { apps, loading, error, addApp, deleteApp, refetch: fetchApps };
}
