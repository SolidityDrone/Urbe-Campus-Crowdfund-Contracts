// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const CrowdfundingManager = buildModule("CrowdfundingManager", (m) => {
  // Define the address that needs to be passed to the constructor
  const targetAddress = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";

  const CrowdfundingManager = m.contract("CrowdfundingManager", [targetAddress]);

  return { CrowdfundingManager };
});

export default CrowdfundingManager;