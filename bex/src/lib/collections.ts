export { COLLECTIONS } from '../types';

export function docPath(collection: string, id: string) {
  return `${collection}/${id}`;
}
