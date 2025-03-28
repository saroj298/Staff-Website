const createStudentsTable = `
  CREATE TABLE IF NOT EXISTS Students (
    studentID INT PRIMARY KEY AUTO_INCREMENT,
    firstName VARCHAR(100),
    surname VARCHAR(100),
    password VARCHAR(255),
    subjectsInterested JSON,
    eventsSignedUpFor JSON
  );
`;

module.exports = createStudentsTable;
