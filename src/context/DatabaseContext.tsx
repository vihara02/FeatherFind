import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDatabase } from '../db/database';

interface DatabaseContextType {
  isReady: boolean;
  error: Error | null;
  refreshTrigger: number;
  triggerRefresh: () => void;
}

const DatabaseContext = createContext<DatabaseContextType>({
  isReady: false,
  error: null,
  refreshTrigger: 0,
  triggerRefresh: () => {},
});

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    getDatabase()
      .then(() => setIsReady(true))
      .catch(err => {
        console.error('Database initialization error:', err);
        setError(err);
      });
  }, []);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DatabaseContext.Provider value={{ isReady, error, refreshTrigger, triggerRefresh }}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = () => useContext(DatabaseContext);
