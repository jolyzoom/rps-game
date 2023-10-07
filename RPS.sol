// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract RockPaperScissors {
    enum Choice {
        Rock,
        Paper,
        Scissors
    }

    address public owner;
    Choice public randomChoice;
    uint256 public minimumBet = 300000 wei;

    event GameResult(address indexed player, string result);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    modifier validBet() {
        require(msg.value >= minimumBet, "Minimum bet could not be met");
        _;
    }

    modifier enoughBalance() {
        require(address(this).balance >= 2 * minimumBet, "Not enough money in the contract");
        _;
    }

    function setMinimumBet(uint256 _minimumBet) external onlyOwner {
        minimumBet = _minimumBet;
    }

    function getRandomChoice() public view returns (Choice) {
        bytes32 randomHash = keccak256(abi.encodePacked(blockhash(block.number - 1), address(this)));
        uint256 random = uint256(randomHash) % 3;

        return Choice(random);
    }

    function play(Choice playerChoice) external payable validBet enoughBalance {
        randomChoice = getRandomChoice();

        if (playerChoice == randomChoice) {
            payable(msg.sender).transfer(msg.value);
            emit GameResult(msg.sender, "Tie!");
        } else if (
            (playerChoice == Choice.Rock && randomChoice == Choice.Scissors) ||
            (playerChoice == Choice.Paper && randomChoice == Choice.Rock) ||
            (playerChoice == Choice.Scissors && randomChoice == Choice.Paper)
        ) {
            payable(msg.sender).transfer(2 * msg.value);
            emit GameResult(msg.sender, "Player wins!");
        } else {
            emit GameResult(msg.sender, "Player Loses!");
        }
    }

    receive() external payable {}
}
