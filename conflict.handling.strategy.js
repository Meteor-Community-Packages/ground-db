// This function is the basis newst data wins - meassured on the updatedAt
// the date is the sync server time stamp
GroundDB.prototype.winner = function(a, b) {
  if (a === b) return null;
  if (typeof a === 'undefined') return 1;
  if (typeof b === 'undefined') return 0;
  // If the dates are equal
  if (a.updatedAt === b.updatedAt) return null;
  // If one is missing updatedAt
  if (typeof a.updatedAt === 'undefined') return 1;
  if (typeof b.updatedAt === 'undefined') return 0;
  // If one is newer than the other
  if (a.updatedAt > b.updatedAt) return 0;
  if (a.updatedAt < b.updatedAt) return 1;
  // Else assume that they are equal
  return null;
};
