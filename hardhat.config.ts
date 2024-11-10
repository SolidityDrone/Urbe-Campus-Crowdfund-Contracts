import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox-viem";
import * as dotenv from "dotenv";



import "@nomicfoundation/hardhat-verify";

dotenv.config();

const providerApiKey = process.env.PROVIDER_API_KEY;
const PRIVATE_KEY = process.env.PVK;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.27",
  networks: {
    hardhat: {
      forking: {
        url: `https://base-mainnet.infura.io/v3/${providerApiKey}`,
      },
    },
    baseSepolia: {
      url: "https://sepolia.base.org",
      accounts: [PRIVATE_KEY!],
      chainId: 84532,
    }
  },
  etherscan: {
    apiKey: {
      baseSepolia: ETHERSCAN_API_KEY!,
    },
  
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://base-sepolia.blockscout.com/api",
          browserURL: "https://base-sepolia.blockscout.com/",
        }
      }
    ]
  },
  sourcify: {
    enabled: false
  }
};

export default config;