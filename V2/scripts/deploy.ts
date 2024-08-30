import { ethers, upgrades } from "hardhat";

async function main() {
    const Multitoken = await ethers.getContractFactory("Multitoken");
    const contract = await upgrades.deployProxy(Multitoken);

    await contract.waitForDeployment();

    console.log(`Proxy deployed at ${contract.target}`);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});