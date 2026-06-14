// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title LastLogin
/// @notice Guardian-gated digital-estate executor. While the owner is alive they
///         prove life and anchor a tamper-proof hash of their vault on-chain. After
///         a 2-of-3 guardian confirmation, escrowed ETH is split to beneficiaries
///         and the estate is permanently marked EXECUTING.
contract LastLogin {
    enum State { ACTIVE, EXECUTING }

    struct Beneficiary { address wallet; uint256 bps; } // bps out of 10_000

    address public owner;
    State public state = State.ACTIVE;

    address[] public guardians;            // exactly 3
    uint256 public constant THRESHOLD = 2; // 2-of-3
    mapping(address => bool) public hasConfirmed;
    uint256 public confirmations;

    Beneficiary[] public beneficiaries;

    /// @notice keccak256 of the user's encrypted vault snapshot. Proves to the
    ///         family that the vault they receive is exactly what the owner left.
    bytes32 public vaultHash;
    /// @notice last time the owner proved they were alive (dead-man's switch signal)
    uint256 public lastSeen;

    event ProofOfLife(uint256 timestamp);
    event VaultHashUpdated(bytes32 vaultHash, uint256 timestamp);
    event GuardianConfirmed(address indexed guardian, uint256 total, uint256 timestamp);
    event Executed(uint256 totalDistributed, uint256 timestamp);
    event Funded(address indexed from, uint256 amount);

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }
    modifier whileActive() { require(state == State.ACTIVE, "estate executing"); _; }

    modifier onlyGuardian() {
        bool ok;
        for (uint256 i; i < guardians.length; i++) if (guardians[i] == msg.sender) { ok = true; break; }
        require(ok, "not a guardian");
        _;
    }

    constructor(address[] memory _guardians, Beneficiary[] memory _beneficiaries) payable {
        require(_guardians.length == 3, "need 3 guardians");
        owner = msg.sender;
        guardians = _guardians;
        uint256 totalBps;
        for (uint256 i; i < _beneficiaries.length; i++) {
            beneficiaries.push(_beneficiaries[i]);
            totalBps += _beneficiaries[i].bps;
        }
        require(totalBps == 10_000, "bps must sum to 10000");
        lastSeen = block.timestamp;
        if (msg.value > 0) emit Funded(msg.sender, msg.value);
    }

    // ---- while alive ----

    function proveLife() external onlyOwner whileActive {
        lastSeen = block.timestamp;
        emit ProofOfLife(block.timestamp);
    }

    function setVaultHash(bytes32 _hash) external onlyOwner whileActive {
        vaultHash = _hash;
        emit VaultHashUpdated(_hash, block.timestamp);
    }

    /// @notice days since the owner last proved life - guardians/UI use this as a soft signal
    function daysInactive() external view returns (uint256) {
        return (block.timestamp - lastSeen) / 1 days;
    }

    function fund() external payable whileActive { emit Funded(msg.sender, msg.value); }

    // ---- the trigger ----

    function confirmDeath() external onlyGuardian whileActive {
        require(!hasConfirmed[msg.sender], "already confirmed");
        hasConfirmed[msg.sender] = true;
        confirmations++;
        emit GuardianConfirmed(msg.sender, confirmations, block.timestamp);
        if (confirmations >= THRESHOLD) _execute();
    }

    function _execute() internal {
        state = State.EXECUTING;
        uint256 bal = address(this).balance;
        uint256 distributed;
        for (uint256 i; i < beneficiaries.length; i++) {
            uint256 share = (bal * beneficiaries[i].bps) / 10_000;
            if (share > 0) {
                (bool sent, ) = beneficiaries[i].wallet.call{value: share}("");
                require(sent, "transfer failed");
                distributed += share;
            }
        }
        emit Executed(distributed, block.timestamp);
    }

    // ---- views ----

    function getState() external view returns (State) { return state; }
    function guardianCount() external view returns (uint256) { return guardians.length; }
    function beneficiaryCount() external view returns (uint256) { return beneficiaries.length; }

    receive() external payable { emit Funded(msg.sender, msg.value); }
}
