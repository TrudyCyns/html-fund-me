import { ethers } from "./ethers-5.1.esm.min.js";
import { abi, contractAddress } from "./constants.js";

const connectButton = document.getElementById("connectButton");
const fundButton = document.getElementById("fundButton");
const balanceButton = document.getElementById("balanceButton");
const withdrawButton = document.getElementById("withdrawButton");

connectButton.onclick = connect;
fundButton.onclick = fund;
balanceButton.onclick = getBalance;
withdrawButton.onclick = withdraw;

// Wrap in async function to avoid pop up on page load (only pop up when button is clicked)
async function connect() {
  if (typeof window.ethereum !== "undefined") {
    // Connected to MetaMask
    await window.ethereum.request({ method: "eth_requestAccounts" });
    // Update button when connected
    connectButton.innerHTML = "Connected!";
  } else {
    connectButton.innerHTML = "Please install MetaMask";
  }
}

// Fund
async function fund() {
  const ethAmount = document.getElementById("ethAmount").value;
  console.log(`Funding with ${ethAmount} ETH`);
  if (typeof window.ethereum !== "undefined") {
    // To send funds we need a provider (connection to blockchain) and a signer (to sign transactions => wallet/someone with gas), contract to interact with (ABI, address)
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    // Make Transaction
    try {
      const txResponse = await contract.fund({
        value: ethers.utils.parseEther(ethAmount.toString()),
      });
      // After the tx is done - listen for mining* or event
      // Listen for tx to finish with await. It kicks off a listener but does not wait for it to finish.
      // Use an event loop so that we check for the listener to fininsh listening before we move on.
      await listenForTxMine(txResponse, provider);
      console.log("Done!");
    } catch (error) {
      console.error(error);
    }
  }
}

function listenForTxMine(txResponse, provider) {
  console.log(`Mining ${txResponse.hash}...`);
  // Listen for tx to finish using ethers methods - Get the listener to return a promise. Only resolve when the tx is done.
  return new Promise((resolve, reject) => {
    provider.once(txResponse.hash, (txReceipt) => {
      console.log(`Completed with ${txReceipt.confirmations} confirmations`);
      resolve();
    });
  });
}

async function getBalance() {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const balance = await provider.getBalance(contractAddress);

    console.log(`Balance: ${ethers.utils.formatEther(balance)}`);
  }
}

async function withdraw() {
  console.log("Withdrawing...");
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const contract = new ethers.Contract(contractAddress, abi, signer);

    try {
      const txResponse = await contract.withdraw();
      await listenForTxMine(txResponse, provider);
      console.log("Done!");
    } catch (error) {
      console.error(error);
    }
  } else {
    withdrawButton.innerHTML = "Please install MetaMask";
  }
}
