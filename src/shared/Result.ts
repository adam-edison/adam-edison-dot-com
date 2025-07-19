export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export const Result = {
  success: <T = void>(data?: T): Result<T, never> => ({ success: true, data: data as T }),
  failure: <E>(error: E): Result<never, E> => ({ success: false, error })
};
