// This setup uses Hardhat Ignition to manage smart contract deployments.
// Learn more about it at https://hardhat.org/ignition

import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { parseEther } from "viem";

const CrowdfundingManager = buildModule("CrowdfundingManager", (m) => {

  const CrowdfundingManager = m.contract("CrowdfundingManager");

  return { CrowdfundingManager };
});

export default CrowdfundingManager;
