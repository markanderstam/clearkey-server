'use strict';
const crypto = require('crypto');
const uuid = require('uuid-js');
const secret = 'my_secret';
const clearKeySystemId = '1077efec-c0b2-4d02-ace3-3c1e52e2fb4b';

// Create a content encryption key identifier (kid).
// The kid is calculated as a function of the contentId, keyPeriod and a secret.
function createContentKeyIdentifier(contentId, keyPeriod, track) {
    const hash = crypto.createHmac('md5', secret)
                       .update(contentId)
                       .update(keyPeriod.toString())
                       .update(track)
                       .digest('hex');
    return Buffer(hash ,'hex').toString('base64')
}

// Create a content encryption key.
// The key is calculated as a function of the kid and a secret.
function createContentKey(kid) {
    const hash = crypto.createHmac('md5', secret)
                       .update(kid)
                       .digest('hex');
    return Buffer(hash ,'hex').toString('base64')
}

// Create a Clear Key PSSH
// https://w3c.github.io/encrypted-media/format-registry/initdata/cenc.html
function createClearKeyPSSH(kids) {
    let len = 36 + 16 * kids.length;
    let pssh = new Buffer(len);
    pssh.writeUInt32BE(len, 0);                                         // length
    pssh.write('pssh', 4);                                              // 'pssh'
    pssh.writeUInt32BE(0x01000000, 8);                                  // version = 1, falgs = 0
    Buffer(uuid.fromURN(clearKeySystemId).toBytes()).copy(pssh, 12);    // SystemID
    pssh.writeUInt32BE(kids.length, 28);                                // KID_count
    for (let i in kids) {
        Buffer.from(kids[i], 'base64').copy(pssh, 32 + 16 * i);         // KID
    }
    pssh.writeUInt32BE(0x00000000, 32 + 16 * kids.length);              // Size of Data (0)
    return pssh.toString('base64');
}

// Get content key
exports.getContentKey = function (data) {
    // Check that all necessary parameters are available in the request
    if (data.contentId == undefined) {
        throw "expect 'contentId'";
    }
    if (data.cryptoPeriodIndex == undefined) {
        throw "expect 'cryptoPeriodIndex'";
    }
    if (data.cryptoPeriodCount == undefined) {
        throw "expect 'cryptoPeriodCount'";
    }
    if (data.tracks == undefined) {
        throw "expect 'tracks'";
    }

    // Check so that cryptoPeriodCount is not too high
    if (data.cryptoPeriodCount > 100) {
        throw "'cryptoPeriodCount' must be lower than, or equal to, 100";
    }

    let result = {
        'contentId': data.contentId,
        'cryptoPeriods': []
    };

    // Cycle through crypto periods
    for (let keyPeriod = data.cryptoPeriodIndex;
         keyPeriod < data.cryptoPeriodIndex + data.cryptoPeriodCount;
         ++keyPeriod) {

        let cryptoPeriod = {
            'cryptoPeriod': keyPeriod,
            'tracks': []
        };

        // Cycle through tracks
        for (let t in data.tracks) {
            let trackType = data.tracks[t]['type'];

            // Create kid and key
            let kid = createContentKeyIdentifier(data.contentId, keyPeriod, trackType);
            let key = createContentKey(kid);

            // Create PSSH containing a kid for the current key period.
            let pssh = createClearKeyPSSH([kid]);

            cryptoPeriod['tracks'].push(
                {
                    'type': trackType,
                    'kid': kid,
                    'key': key,
                    'pssh': [{
                        'systemId': clearKeySystemId,
                        'pssh': pssh
                    }]
                }
            );
        }

        result['cryptoPeriods'].push(cryptoPeriod);
    }

    return result;
};

// Get license
// Follows w3.org example: https://www.w3.org/TR/encrypted-media/
exports.getLicense = function(data) {
    let response = {'keys': []};
    for (let i in data.kids) {
        response['keys'].push({
            'kid': data.kids[i],
            'k': createContentKey(data.kids[i]),
            'kty': 'oct'
        });
    }
    return response;
}
