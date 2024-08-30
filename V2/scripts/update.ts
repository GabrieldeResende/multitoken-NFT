import { ethers, upgrades } from "hardhat";

async function main() {
    const Multitoken = await ethers.getContractFactory("Multitoken");
    const contract = await upgrades.upgradeProxy("0x238F035660534F3D2411Cd5C5636d9d721eb3019", Multitoken);

    await contract.waitForDeployment();
    const address = await contract.getAddress();

    console.log(
        `Contract updated at ${address}`
    );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});