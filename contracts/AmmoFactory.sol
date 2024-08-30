// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/presets/ERC20PresetMinterPauser.sol";

contract MintableTokenFactory {
    address[] public deployedTokens;
    address public admin;

    event TokenDeployed(address indexed tokenAddress, string name, string symbol, address admin);
    constructor(address _admin) {
        admin = _admin;
    }

    modifier onlyAdmin() {
        require(msg.sender == initialAdmin, "msg.sender may only be admin");
        _;
    }

    function deployToken(string memory name, string memory symbol) external onlyAdmin {
        ERC20PresetMinterPauser token = new ERC20PresetMinterPauser(name, symbol);
        token.grantRole(token.DEFAULT_ADMIN_ROLE(), msg.sender);
        token.revokeRole(token.DEFAULT_ADMIN_ROLE(), address(this));
        deployedTokens.push(address(token));
        emit TokenDeployed(address(token), name, symbol, msg.sender);
    }

    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }
}