// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Uncomment this line to use console.log
// import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract Multitoken is ERC1155, ERC1155Burnable {
    uint public constant NFT_0 = 0;
    uint public constant NFT_1 = 1;
    uint public constant NFT_2 = 2;

    uint public tokenPrice = 0.01 ether;

    uint[] public currentSupply = [50, 50, 50];

    string public constant BASE_URL =
        "https://gateway.pinata.cloud/ipfs/QmTSewcb5SpTRdGK8rdWWdsFLWSAMcEB3YcNdBhDp3MiSf/";

    address payable public immutable owner;

    constructor() ERC1155(BASE_URL) {
        owner = payable(msg.sender);
    }

    function mint(uint256 id) external payable {
        require(id < 3, "This token does not exists");
        require(msg.value >= tokenPrice, "Insufficient Payment");
        require(currentSupply[id] > 0, "Max supply reached");
        _mint(msg.sender, id, 1, "");
        currentSupply[id]--;
    }

    function uri(uint id) public pure override returns (string memory) {
        require(id < 3, "This token does not exists");
        return string.concat(BASE_URL, Strings.toString(id), ".json");
    }

    function withdraw() external {
        require(msg.sender == owner, "You do not have permission");

        uint256 amount = address(this).balance;
        (bool success, ) = owner.call{value: amount}("");
        require(success == true, "Failed Withdraw");
    }
}
