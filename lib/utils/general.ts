export const parseStringify = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value));

export const generateId = () => {
  return crypto.randomUUID();
};
