const createStaffAccountCreationTokensTable = `
  CREATE TABLE IF NOT EXISTS StaffAccountCreationTokens (
    email VARCHAR(255),
    token VARCHAR(255),
    PRIMARY KEY (email, token),
    FOREIGN KEY (email) REFERENCES Staff(email) ON DELETE CASCADE
  );
`;

module.exports = createStaffAccountCreationTokensTable;
