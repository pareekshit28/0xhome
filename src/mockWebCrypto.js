const crypto = require("crypto-browserify");

const webcrypto = {
  getRandomValues: function (buffer) {
    const bytes = crypto.randomBytes(buffer.length);
    buffer.set(bytes);
    return buffer;
  },
  // Add other methods as needed
};

module.exports = { webcrypto };
