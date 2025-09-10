export const Table = ({ children }: { children: React.ReactNode }) => (
  <table className="table">{children}</table>
);

export const THead = ({ children }: { children: React.ReactNode }) => (
  <thead><tr>{children}</tr></thead>
);

export const Th = ({ children }: { children: React.ReactNode }) => (
  <th>{children}</th>
);

export const TBody = ({ children }: { children: React.ReactNode }) => (
  <tbody>{children}</tbody>
);

export const Tr = ({ children }: { children: React.ReactNode }) => (
  <tr>{children}</tr>
);

export const Td = ({ children }: { children: React.ReactNode }) => (
  <td>{children}</td>
);