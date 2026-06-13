import { useEffect, useState } from 'react';

export function useBandSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log('Connecting to Band Socket:', url);
    setIsConnected(true);
    return () => {
      console.log('Disconnecting from Band Socket:', url);
      setIsConnected(false);
    };
  }, [url]);

  return { isConnected };
}
