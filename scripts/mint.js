// Import necessary modules from Hardhat and SwisstronikJS
const hre = require("hardhat");
const { encryptDataField } = require("@swisstronik/utils");

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

// Custom function to format token amount from smallest unit to human-readable format
const formatTokenAmount = (amount, decimals) => {
  const divisor = 10 ** decimals;
  return (amount / divisor).toFixed(decimals);
};

async function main() {
  // Replace this with your actual deployed contract address
  const perc20Address = "0xDDF7E17A2D5A1bF5169847EE900b4c44B7624199";

  // Get the signer (the account initiating the mint)
  const [signer] = await hre.ethers.getSigners();

  // Attach to the deployed PERC20Sample contract
  const perc20Contract = await hre.ethers.getContractAt("PERC20Sample", perc20Address);

  // Print ABI to check available methods
  console.log('Contract ABI:', perc20Contract.interface.format('json'));

  // Define the function to be called and its arguments
  const functionName = "mint";
  const recipientAddress = "0xfE84358f3A41e17a4861876502689cdBDbb6cfAD"; // Replace with actual recipient
  const mintAmount = "100000000000000000000"; // 100 tokens with 18 decimal places

  // Convert amount to human-readable format (assuming 18 decimals)
  const decimals = 18;
  const amountMinted = formatTokenAmount(mintAmount, decimals);

  console.log(`Minting ${amountMinted} tokens...`);

  try {
    // Prepare the transaction data by encoding the mint function and its arguments
    const transactionData = perc20Contract.interface.encodeFunctionData(functionName, [recipientAddress, mintAmount]);

    // Send the shielded transaction to mint tokens
    const transaction = await sendShieldedTransaction(signer, perc20Address, transactionData, 0);

    console.log(`Transaction submitted! Transaction hash: ${transaction.hash}`);
    await transaction.wait();

    console.log(`Transaction completed successfully! ${amountMinted} tokens minted to ${recipientAddress}.`);
    console.log(`Transaction hash: ${transaction.hash}`);
  } catch (error) {
    console.error(`Transaction failed! Could not mint ${amountMinted} tokens.`);
    console.error(`Transaction hash: ${error.transactionHash ? error.transactionHash : 'N/A'}`);
    console.error(error);
  }
}

// Using async/await pattern to handle errors properly
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
