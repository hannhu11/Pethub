export function formatPetDisplayId(petId: string) {
  const sanitized = petId.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const suffix = sanitized.slice(-8).padStart(8, '0');
  return `PET-${suffix.slice(0, 4)}-${suffix.slice(4)}`;
}

export function getPublicPetCardUrl(petId: string) {
  if (typeof window === 'undefined') {
    return `/c/${petId}`;
  }

  return `${window.location.origin}/c/${petId}`;
}
