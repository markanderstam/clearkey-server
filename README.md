# ClearKey Server
ClearKey server that can be used to test DRM functionality in a SYE installation.

Requests are passed to the server using HTTP POST. Requests and responses are JSON objects.

The server support rotation of the encryption keys. Default key period is 60 seconds.

## Install
    npm install

## Start server
Start the ClearKey server on port 8000

    node index.js

# API
There are two public APIs in the server: get\_content\_key() and get_license().

## Get Content Key
This API is typically used by the SYE Ingress in order to get encryption keys for a channel.

It is possible to request keys for one or many crypto periods (two in the example below).

It is possible to request keys for one or many track types (two in the example below).

get\_content\_key is guaranteed to always return the same kid and key for a specific combination of contentId, cryptoPeriod and track type.

### Request

```
{
    "contentId": "svt1",
    "cryptoPeriodIndex": 424214,
    "cryptoPeriodCount": 2,
    "tracks": [{
        "type": "SD"
    }, {
        "type": "4K"
    }]
}
```

### Response

```
{
    "contentId": "svt1",
    "cryptoPeriods": [{
        "cryptoPeriod": 424214,
        "tracks": [{
            "type": "SD",
            "kid": "MTIzNDU2NzgxMjM0NTY3OAo",
            "key": "YmNkNjM4NTA5MTI3ODM3Ngo",
            "pssh": [{
                "systemId": "1077efec-c0b2-4d02-ace3-3c1e52e2fb4b",
                "pssh": "aDM0aDM0MjNrMDAyODVtb"
            },
            {
                "systemId": "edef8ba979d64acea3c827dcd51d21ed",
                "pssh": "nZzMyNDM0MmRmYWRm"
            }]
        },
        {
            "type": "4K",
            "kid": "MTIzNDU2NzgxMjM0NTY3OAo",
            "key": "YmNkNjM4NTA5MTI3ODM3Ngo",
            "pssh": [{
                "systemId": "1077efec-c0b2-4d02-ace3-3c1e52e2fb4b",
                "pssh": "aDM0aDM0MjNrMDAyODVtb"
            },
            {
                "systemId": "edef8ba979d64acea3c827dcd51d21ed",
                "pssh": "nZzMyNDM0MmRmYWRm"
            }]
        }]
    },
    {
        "cryptoPeriod": 424215,
        "tracks": [{
            "type": "SD",
            "kid": "MTIzNDU2NzgxMjM0NTY3OAo",
            "key": "YmNkNjM4NTA5MTI3ODM3Ngo",
            "pssh": [{
                "systemId": "1077efec-c0b2-4d02-ace3-3c1e52e2fb4b",
                "pssh": "aDM0aDM0MjNrMDAyODVtb"
            },
            {
                "systemId": "edef8ba979d64acea3c827dcd51d21ed",
                "pssh": "nZzMyNDM0MmRmYWRm"
            }]
        },
        {
            "type": "SD",
            "kid": "MTIzNDU2NzgxMjM0NTY3OAo",
            "key": "YmNkNjM4NTA5MTI3ODM3Ngo",
            "pssh": [{
                "systemId": "1077efec-c0b2-4d02-ace3-3c1e52e2fb4b",
                "pssh": "aDM0aDM0MjNrMDAyODVtb"
            },
            {
                "systemId": "edef8ba979d64acea3c827dcd51d21ed",
                "pssh": "nZzMyNDM0MmRmYWRm"
            }]
        }]
    }]
}
```

### cURL example

    curl -i -d '{"contentId":"svt1","cryptoPeriodIndex":10,"cryptoPeriodCount":2,"tracks":[{"type": "SD"},{"type":"4K"}]}' -H "Content-Type: application/json" http://localhost:8000/get_content_key

## Get License 
This API is typically used by a CDM within a client application and follow w3.org example: https://www.w3.org/TR/encrypted-media/

### Request

```
{
    "kids": [
        "NTdhNzlhZmM0NmEyMzcxMA==",
        "MjEwNzhiN2EwNjYxZTE4Yg=="
    ]
}
```

### Response

```
{
    "keys": [{
        "kid": "NTdhNzlhZmM0NmEyMzcxMA==",
        "k": "ZDBlMzE3OWFhN2QyMTg5Yg==",
        "kty": "oct"
    }, {
        "kid": "MjEwNzhiN2EwNjYxZTE4Yg==",
        "k": "M2VhNDc3M2Q3M2IxY2NiYg==",
        "kty": "oct"
    }]
}
```

### cURL example

    curl -i -d '{"kids": ["NTdhNzlhZmM0NmEyMzcxMA==", "MjEwNzhiN2EwNjYxZTE4Yg=="]}' -H "Content-Type: application/json" http://localhost:8000/get_license

