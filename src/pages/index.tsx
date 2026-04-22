import { useEffect } from 'react';
// next
import { useRouter } from 'next/router';
// routes
import { PATH_AUTH } from '../routes/paths';

// ----------------------------------------------------------------------

export default function HomePage() {
  const { replace } = useRouter();

  useEffect(() => {
    replace(PATH_AUTH.login);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
