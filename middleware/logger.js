const AuditLog = require('../models/AuditLog');

const logActivity = async (userId, action, details, req = null) => {
  try {
    let ipAddress = '';
    if (req) {
      ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    }
    await AuditLog.create({
      userId,
      action,
      details,
      ipAddress
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
};

module.exports = { logActivity };
