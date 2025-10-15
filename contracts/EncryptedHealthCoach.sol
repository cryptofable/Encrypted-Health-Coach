// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Encrypted Health Coach
/// @notice Stores encrypted personal health metrics using Zama FHE
contract EncryptedHealthCoach is SepoliaConfig {
    struct HealthRecord {
        euint32 heightCm;
        euint32 weightKg;
        euint32 ageYears;
        euint32 genderCode;
        euint32 systolicPressure;
        euint32 diastolicPressure;
        uint64 updatedAt;
    }

    mapping(address user => HealthRecord) private healthRecords;
    mapping(address user => bool) private recordExists;

    event HealthDataUpdated(address indexed user, uint64 indexed updatedAt);

    /// @notice Store or update encrypted health metrics for the caller
    /// @param heightCm encrypted height in centimeters
    /// @param weightKg encrypted weight in kilograms
    /// @param ageYears encrypted age in years
    /// @param genderCode encrypted gender code (1: male, 2: female)
    /// @param systolicPressure encrypted systolic blood pressure
    /// @param diastolicPressure encrypted diastolic blood pressure
    /// @param inputProof proof returned by the relayer encryption buffer
    function submitHealthData(
        externalEuint32 heightCm,
        externalEuint32 weightKg,
        externalEuint32 ageYears,
        externalEuint32 genderCode,
        externalEuint32 systolicPressure,
        externalEuint32 diastolicPressure,
        bytes calldata inputProof
    ) external {
        HealthRecord storage record = healthRecords[msg.sender];

        record.heightCm = FHE.fromExternal(heightCm, inputProof);
        record.weightKg = FHE.fromExternal(weightKg, inputProof);
        record.ageYears = FHE.fromExternal(ageYears, inputProof);
        record.genderCode = FHE.fromExternal(genderCode, inputProof);
        record.systolicPressure = FHE.fromExternal(systolicPressure, inputProof);
        record.diastolicPressure = FHE.fromExternal(diastolicPressure, inputProof);
        record.updatedAt = uint64(block.timestamp);

        recordExists[msg.sender] = true;

        FHE.allowThis(record.heightCm);
        FHE.allow(record.heightCm, msg.sender);

        FHE.allowThis(record.weightKg);
        FHE.allow(record.weightKg, msg.sender);

        FHE.allowThis(record.ageYears);
        FHE.allow(record.ageYears, msg.sender);

        FHE.allowThis(record.genderCode);
        FHE.allow(record.genderCode, msg.sender);

        FHE.allowThis(record.systolicPressure);
        FHE.allow(record.systolicPressure, msg.sender);

        FHE.allowThis(record.diastolicPressure);
        FHE.allow(record.diastolicPressure, msg.sender);

        emit HealthDataUpdated(msg.sender, record.updatedAt);
    }

    /// @notice Check whether a user has an encrypted health record
    function hasHealthRecord(address user) external view returns (bool) {
        return recordExists[user];
    }

    /// @notice Get encrypted health metrics for a user
    function getEncryptedHealthData(address user)
        external
        view
        returns (
            euint32,
            euint32,
            euint32,
            euint32,
            euint32,
            euint32,
            uint64
        )
    {
        HealthRecord storage record = healthRecords[user];
        return (
            record.heightCm,
            record.weightKg,
            record.ageYears,
            record.genderCode,
            record.systolicPressure,
            record.diastolicPressure,
            record.updatedAt
        );
    }
}
