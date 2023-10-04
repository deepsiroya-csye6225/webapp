
const {Assignment, Account, AccAssignment} = require('./models');
const bcrypt = require('bcrypt');

async function auth(req, res, next) {
  
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ message: 'Authentication header missing or invalid' });
    }

    // Extract and decode the Base64 credentials
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    try {
    // Find the account by email
    const account = await Account.findOne({ where: { email: email }, });

    if (!account) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Verify the password
    const passwordMatch = await bcrypt.compare(password, account.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Authentication failed' });
    }

    // Attach the authenticated user to the request object
    req.user = account;

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

module.exports = auth;
