const createStaffTable = `
  CREATE TABLE IF NOT EXISTS Staff (
    email VARCHAR(255) PRIMARY KEY,
    firstName VARCHAR(100),
    surname VARCHAR(100),
    password VARCHAR(255),
    accessLevel ENUM('admin', 'teacher', 'staff'),
    subjects JSON
  );
`;

module.exports = createStaffTable;
