import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const MultitokenModule = buildModule("MultitokenModule", (m) => {

  const multitoken = m.contract("Multitoken");

  return { multitoken };
});

export default MultitokenModule;
