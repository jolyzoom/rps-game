let provider, signer, gameContract;

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });

            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();

            const contractAddress = "0x58cD08170fA198b85d9eafcCF6aF94F729b2434d";
            const abi = [
                {
                    "inputs": [],
                    "stateMutability": "nonpayable",
                    "type": "constructor"
                },
                {
                    "anonymous": false,
                    "inputs": [
                        {
                            "indexed": true,
                            "internalType": "address",
                            "name": "player",
                            "type": "address"
                        },
                        {
                            "indexed": false,
                            "internalType": "string",
                            "name": "result",
                            "type": "string"
                        }
                    ],
                    "name": "GameResult",
                    "type": "event"
                },
                {
                    "inputs": [
                        {
                            "internalType": "enum RockPaperScissors.Choice",
                            "name": "playerChoice",
                            "type": "uint8"
                        }
                    ],
                    "name": "play",
                    "outputs": [],
                    "stateMutability": "payable",
                    "type": "function"
                },
                {
                    "inputs": [
                        {
                            "internalType": "uint256",
                            "name": "_minimumBet",
                            "type": "uint256"
                        }
                    ],
                    "name": "setMinimumBet",
                    "outputs": [],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "stateMutability": "payable",
                    "type": "receive"
                },
                {
                    "inputs": [],
                    "name": "getRandomChoice",
                    "outputs": [
                        {
                            "internalType": "enum RockPaperScissors.Choice",
                            "name": "",
                            "type": "uint8"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "minimumBet",
                    "outputs": [
                        {
                            "internalType": "uint256",
                            "name": "",
                            "type": "uint256"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "owner",
                    "outputs": [
                        {
                            "internalType": "address",
                            "name": "",
                            "type": "address"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                },
                {
                    "inputs": [],
                    "name": "randomChoice",
                    "outputs": [
                        {
                            "internalType": "enum RockPaperScissors.Choice",
                            "name": "",
                            "type": "uint8"
                        }
                    ],
                    "stateMutability": "view",
                    "type": "function"
                }
            ];

            gameContract = new ethers.Contract(contractAddress, abi, signer);

            document.getElementById("gameControls").style.display = "block";
            await updateBalances();
        } catch (error) {
            console.error("User denied access to MetaMask");
            document.getElementById("metamaskErrorMessage").innerText = "Metamask access denied.";
        }
    } else {
        alert('Metamask needs to be installed!');
    }
}

async function updateBalances() {
    if (provider && signer) {
        const playerAddress = await signer.getAddress();
        const playerBalance = await provider.getBalance(playerAddress);
        const contractBalance = await provider.getBalance(gameContract.address);

        document.getElementById("playerBalance").innerText = ethers.utils.formatEther(playerBalance) + " ETH";
        document.getElementById("contractBalance").innerText = ethers.utils.formatEther(contractBalance) + " ETH";
    }
}

async function playGame() {
    try {
        const choice = document.getElementById("choice").value;
        const betAmount = document.getElementById("betAmount").value;

        const parsedBetAmount = parseFloat(betAmount);

        if (isNaN(parsedBetAmount) || parsedBetAmount <= 0) {
            document.getElementById("result").innerText = "Invalid bet amount.";
        } else {
            const betInWei = ethers.utils.parseEther(parsedBetAmount.toString());

            const tx = await gameContract.play(choice, {
                value: betInWei,
            });

            const receipt = await tx.wait();

            const parsedLogs = receipt.logs.map(log => {
                try {
                    return gameContract.interface.parseLog(log);
                } catch (error) {
                    return null;
                }
            }).filter(parsedLog => parsedLog !== null);

            for (let parsedLog of parsedLogs) {
                if (parsedLog.name === "GameResult") {
                    document.getElementById("result").innerText = parsedLog.args.result;
                    await updateBalances();
                }
            }
        }
    } catch (error) {
        console.error("Error:", error);
        document.getElementById("result").innerText = "Error: " + error.message;
    }
}
