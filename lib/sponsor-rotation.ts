/** Embaralha IDs para rotação justa (todos aparecem antes de reembaralhar). */
export function shuffleSponsorIds(ids: string[], avoidFirstId?: string | null): string[] {
  const arr = [...ids];
  if (arr.length <= 1) return arr;

  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  if (avoidFirstId && arr[0] === avoidFirstId) {
    const swap = arr.length > 1 ? 1 : 0;
    [arr[0], arr[swap]] = [arr[swap], arr[0]];
  }

  return arr;
}

export function createSponsorRotationBag(ids: string[]): string[] {
  return shuffleSponsorIds(ids);
}

export function advanceSponsorRotation(
  bag: string[],
  index: number,
  allIds: string[]
): { bag: string[]; index: number; currentId: string | null } {
  if (!allIds.length) return { bag: [], index: 0, currentId: null };
  if (!bag.length) {
    const nextBag = createSponsorRotationBag(allIds);
    return { bag: nextBag, index: 0, currentId: nextBag[0] ?? null };
  }

  let nextIndex = index + 1;
  let nextBag = bag;

  if (nextIndex >= bag.length) {
    const lastId = bag[bag.length - 1];
    nextBag = shuffleSponsorIds(allIds, lastId);
    nextIndex = 0;
  }

  return {
    bag: nextBag,
    index: nextIndex,
    currentId: nextBag[nextIndex] ?? null,
  };
}
