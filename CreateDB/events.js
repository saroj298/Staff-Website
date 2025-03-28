const createEventsTable = `
  CREATE TABLE IF NOT EXISTS Events (
    eventID INT PRIMARY KEY AUTO_INCREMENT,
    eventName VARCHAR(255),
    detailsShort TEXT,
    detailsLong TEXT,
    staffAssignedEmail VARCHAR(255),
    noOfStudentsSignedUp INT DEFAULT 0,
    spaces INT,
    subjectsRelevant JSON,
    FOREIGN KEY (staffAssignedEmail) REFERENCES Staff(email) ON DELETE SET NULL
  );
`;

module.exports = createEventsTable;
