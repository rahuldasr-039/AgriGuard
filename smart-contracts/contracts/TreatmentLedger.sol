// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title TreatmentLedger
 * @dev Immutable on-chain ledger for antimicrobial treatment records (SIH25007)
 */
contract TreatmentLedger {
    struct TreatmentRecord {
        uint256 prescriptionId;
        uint256 date;
        bytes32 dataHash;
        address recordedBy;
        uint256 timestamp;
    }

    // tagId => array of treatment records
    mapping(string => TreatmentRecord[]) public animalTreatments;

    // Total treatment count for stats
    uint256 public totalTreatments;

    // Events
    event TreatmentLogged(
        string indexed tagId,
        uint256 prescriptionId,
        uint256 date,
        bytes32 dataHash,
        address recordedBy,
        uint256 timestamp
    );

    /**
     * @dev Log a treatment record on-chain
     * @param tagId Animal RFID/tag identifier
     * @param prescriptionId Off-chain prescription/treatment ID (from PostgreSQL)
     * @param date Date of administration (Unix timestamp)
     */
    function logTreatment(
        string calldata tagId,
        uint256 prescriptionId,
        uint256 date
    ) external {
        bytes32 dataHash = keccak256(
            abi.encodePacked(tagId, prescriptionId, date, msg.sender)
        );

        TreatmentRecord memory record = TreatmentRecord({
            prescriptionId: prescriptionId,
            date: date,
            dataHash: dataHash,
            recordedBy: msg.sender,
            timestamp: block.timestamp
        });

        animalTreatments[tagId].push(record);
        totalTreatments++;

        emit TreatmentLogged(
            tagId,
            prescriptionId,
            date,
            dataHash,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Get all treatment records for an animal
     * @param tagId Animal RFID/tag identifier
     * @return Array of TreatmentRecord structs
     */
    function getTreatments(string calldata tagId)
        external
        view
        returns (TreatmentRecord[] memory)
    {
        return animalTreatments[tagId];
    }

    /**
     * @dev Get total treatment count for a specific animal
     * @param tagId Animal RFID/tag identifier
     * @return count Number of treatments
     */
    function getTreatmentCount(string calldata tagId)
        external
        view
        returns (uint256)
    {
        return animalTreatments[tagId].length;
    }

    /**
     * @dev Verify a treatment record by hash
     * @param tagId Animal RFID/tag identifier
     * @param index Index in the animal's treatment array
     * @param prescriptionId The prescription ID to verify against
     * @param date The date to verify against
     * @return isValid Whether the hash matches
     */
    function verifyTreatment(
        string calldata tagId,
        uint256 index,
        uint256 prescriptionId,
        uint256 date
    ) external view returns (bool isValid) {
        require(index < animalTreatments[tagId].length, "Index out of bounds");
        TreatmentRecord memory record = animalTreatments[tagId][index];
        bytes32 expectedHash = keccak256(
            abi.encodePacked(tagId, prescriptionId, date, record.recordedBy)
        );
        return record.dataHash == expectedHash;
    }
}
