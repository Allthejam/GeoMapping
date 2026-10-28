
'use client';

import { useState, useEffect } from 'react';
import { 
  Query, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData
} from 'firebase/firestore';
import { errorEmitter } from '../error-emitter';
import { FirestorePermissionError } from '../errors';

export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!query) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      query,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id,
        }));
        setData(items);
        setLoading(false);
      },
      async (err) => {
        // Robust extraction of collection path for technical error reporting.
        const queryInternal = query as any;
        let pathStr = 'Collection Group';
        
        try {
          if (queryInternal._query?.collectionGroup) {
            pathStr = queryInternal._query.collectionGroup;
          } else if (queryInternal.path) {
            pathStr = queryInternal.path;
          } else if (queryInternal._query?.path?.segments) {
            pathStr = queryInternal._query.path.segments.join('/');
          }
        } catch (e) {
          pathStr = 'measurements'; 
        }
        
        const permissionError = new FirestorePermissionError({
          path: pathStr,
          operation: 'list',
        });
        
        errorEmitter.emit('permission-error', permissionError);
        
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [query]);

  return { data, loading, error };
}
