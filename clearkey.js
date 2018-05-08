const crypto = require('crypto');
const uuid = require('uuid-js');
const secret = 'my_secret';
const keyRotationIntervalSeconds = 60;
const clearKeySystemId = '1077efec-c0b2-4d02-ace3-3c1e52e2fb4b';

// Create a content encryption key identifier (kid).
// The kid is calculated as a function of the contentId, keyPeriod and a secret.
function createContentKeyIdentifier(contentId, keyPeriod) {
    const hash = crypto.createHmac('sha256', secret)
                       .update(contentId)
                       .update(keyPeriod.toString())
                       .digest('hex');
    return Buffer.from(hash.substring(0, 16)).toString('base64')
}

// Create a content encryption key.
// The key is calculated as a function of the kid and a secret.
function createContentKey(kid) {
    const hash = crypto.createHmac('sha256', secret)
                       .update(kid)
                       .digest('hex');
    return Buffer.from(hash.substring(0, 16)).toString('base64')
}

// Create a Clear Key PSSH
// https://w3c.github.io/encrypted-media/format-registry/initdata/cenc.html
function createClearKeyPSSH(kids) {
    var len = 36 + 16 * kids.length;
    var pssh = new Buffer(len);
    pssh.writeUInt32BE(len, 0);                                         // length
    pssh.write('pssh', 4);                                              // 'pssh'
    pssh.writeUInt32BE(0x01000000, 8);                                  // version = 1, falgs = 0
    Buffer(uuid.fromURN(clearKeySystemId).toBytes()).copy(pssh, 12);    // SystemID
    pssh.writeUInt32BE(kids.length, 28);                                // KID_count
    for (var i in kids) {
        Buffer.from(kids[i], 'base64').copy(pssh, 32 + 16 * i);         // KID
    }
    pssh.writeUInt32BE(0x00000000, 32 + 16 * kids.length);              // Size of Data (0)
    return pssh.toString('base64');
}

// Get content key
exports.getContentKey = function (data) {
    // Encryption key is rotated every keyRotationIntervalSeconds sec.
    // Calculate expiery of the key so that the next request will be in the middle
    // of the next key period to increase probability that a new key is fetched in
    // a subsequent request.
    const secondsSinceEpoc = Math.floor(new Date() / 1000);
    const keyPeriod = Math.floor(secondsSinceEpoc / keyRotationIntervalSeconds);
    const ttlSeconds = (keyPeriod + 1.5) * keyRotationIntervalSeconds - secondsSinceEpoc;

    // Create kid and key
    var kid = createContentKeyIdentifier(data.contentId, keyPeriod);
    var key = createContentKey(kid);

    // Create PSSH containing a kid for the previous, current and next key period.
    // This can be used by the client to pre-fetch licenses for nearby periods.
    var pssh = createClearKeyPSSH([createContentKeyIdentifier(data.contentId, keyPeriod - 1),
                                   createContentKeyIdentifier(data.contentId, keyPeriod),
                                   createContentKeyIdentifier(data.contentId, keyPeriod + 1)]);

    // Return result
    return {
        'contentId': data.contentId,
        'ttlSeconds': ttlSeconds,
        'kid': kid,
        'key': key,
        'drm': [
            {
                'systemID': clearKeySystemId,
                'pssh': pssh
            }
        ]
    };
};

// Get license
// Follows w3.org example: https://www.w3.org/TR/encrypted-media/
exports.getLicense = function(data) {
    response = {'keys': []}
    for (var i in data.kids) {
        response['keys'].push({
            'kid': data.kids[i],
            'k': createContentKey(data.kids[i]),
            'kty': 'oct'
        });
    }
    return response
}
