// scripts/transfer.js

// Import necessary modules from Hardhat and SwisstronikJS
const hre = require("hardhat");
const { encryptDataField } = require("@swisstronik/utils");

// Helper function to convert wei to ether (human-readable format)
const formatEther = (amount) => {
  return (parseFloat(amount) / 1e18).toFixed(18); // Assuming 18 decimal places
};

// Function to send a shielded transaction using the provided signer, destination, data, and value
const sendShieldedTransaction = async (signer, destination, data, value) => {
  // Get the RPC link from the network configuration
  const rpcLink = hre.network.config.url;

  // Encrypt transaction data
  const [encryptedData] = await encryptDataField(rpcLink, data);

  // Construct and sign transaction with encrypted data
  return await signer.sendTransaction({
    from: signer.address,
    to: destination,
    data: encryptedData,
    value,
  });
};

async function main() {
  // Address of the deployed contract
  const contractAddress = "0xDDF7E17A2D5A1bF5169847EE900b4c44B7624199";

  // Get the signer (your account)
  const [signer] = await hre.ethers.getSigners();

  // Create a contract instance
  const contractFactory = await hre.ethers.getContractFactory("PERC20Sample");
  const contract = contractFactory.attach(contractAddress).connect(signer);

  // Send a shielded transaction to execute a transfer in the contract
  const functionName = "transfer";
  const functionArgs = ["0x16af037878a6cAce2Ea29d39A3757aC2F6F7aac1", "1000000000000000000"]; // 1 token with 18 decimal places
  
  const amountTransferred = formatEther(functionArgs[1]); // Converts to human-readable format (1 token)
  console.log(`Transferring ${amountTransferred} tokens to ${functionArgs[0]}...`);

  try {
    const transaction = await sendShieldedTransaction(signer, contractAddress, contract.interface.encodeFunctionData(functionName, functionArgs), 0);
    console.log(`Transaction submitted! Transaction hash: ${transaction.hash}`);
    await transaction.wait();

    console.log(`Transaction completed successfully! ${amountTransferred} tokens transferred to ${functionArgs[0]}.`);
    console.log(`Transaction hash: ${transaction.hash}`);

  } catch (error) {
    console.error(`Transaction failed! Could not transfer ${amountTransferred} tokens to ${functionArgs[0]}.`);
    console.error(`Transaction hash: ${error.transactionHash ? error.transactionHash : 'N/A'}`);
    console.error(error);
  }
}

// Using async/await pattern to handle errors properly
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
