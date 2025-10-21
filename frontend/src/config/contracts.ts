// EncryptedHealthCoach contract deployed on Sepolia
export const CONTRACT_ADDRESS = '0x3228292F08dc1501afC977bc7Ce3F895C22063d2';

// Generated ABI from deployments/sepolia/EncryptedHealthCoach.json
export const CONTRACT_ABI = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "uint64",
        "name": "updatedAt",
        "type": "uint64"
      }
    ],
    "name": "HealthDataUpdated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getEncryptedHealthData",
    "outputs": [
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      },
      {
        "internalType": "euint32",
        "name": "",
        "type": "bytes32"
      },
      {
        "internalType": "uint64",
        "name": "",
        "type": "uint64"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "hasHealthRecord",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "protocolId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "externalEuint32",
        "name": "heightCm",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "weightKg",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "ageYears",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "genderCode",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "systolicPressure",
        "type": "bytes32"
      },
      {
        "internalType": "externalEuint32",
        "name": "diastolicPressure",
        "type": "bytes32"
      },
      {
        "internalType": "bytes",
        "name": "inputProof",
        "type": "bytes"
      }
    ],
    "name": "submitHealthData",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;
