const createSubjectsTable = `
  CREATE TABLE IF NOT EXISTS Subjects (
    subjectCode VARCHAR(50) PRIMARY KEY,
    subjectName VARCHAR(255),
    studentsInterested JSON,
    teachersInterested JSON
  );
`;

module.exports = createSubjectsTable;
