import { useNavigate } from 'react-router';

export function useBackNavigation(fallbackPath: string) {
  const navigate = useNavigate();

  return () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(fallbackPath);
  };
}
