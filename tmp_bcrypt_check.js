const bcrypt = require('bcrypt');
const password = process.argv[2];
const hash = process.argv[3];

bcrypt.compare(password, hash)
  .then(res => console.log('MATCH_RESULT:', res))
  .catch(err => console.error('BCRYPT_ERROR:', err));
