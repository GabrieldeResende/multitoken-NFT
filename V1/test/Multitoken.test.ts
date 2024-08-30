import {
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre, { ethers } from "hardhat";

describe("Multitoken", function () {
  async function deployFixture() {

    const [owner, otherAccount] = await hre.ethers.getSigners();

    const Multitoken = await hre.ethers.getContractFactory("Multitoken");
    const contract = await Multitoken.deploy();

    return { contract, owner, otherAccount };
  }

  it("Should mint", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await contract.mint(0, { value: ethers.parseEther("0.01") })

    const balance = await contract.balanceOf(owner.address, 0)
    const supply = await contract.currentSupply(0)

    expect(balance).to.equal(1, "Cannot mint");
    expect(supply).to.equal(49, "Cannot mint");
  });

  it("Should NOT mint(exists)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await expect(contract.mint(3, { value: ethers.parseEther("0.01") })).to.rejectedWith("This token does not exists");
  });

  it("Should NOT mint(payable)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await expect(contract.mint(0, { value: ethers.parseEther("0.001") })).to.rejectedWith("Insufficient Payment");
  });

  it("Should NOT mint(supply)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    for (let i = 0; i < 50; i++) {
      await contract.mint(0, { value: ethers.parseEther("0.01") })
    }

    await expect(contract.mint(0, { value: ethers.parseEther("0.01") })).to.rejectedWith("Max supply reached");
  });

  it("Should burn", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await contract.mint(0, { value: ethers.parseEther("0.01") })

    await contract.burn(owner.address, 0, 1)

    const balance = await contract.balanceOf(owner.address, 0)
    const supply = await contract.currentSupply(0)

    expect(balance).to.equal(0, "Cannot burn");
    expect(supply).to.equal(49, "Cannot burn");
  });

  it("Should burn (approved)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await contract.mint(0, { value: ethers.parseEther("0.01") })
    await contract.setApprovalForAll(otherAccount.address, true)
    const approved = await contract.isApprovedForAll(owner.address, otherAccount.address)

    const instance = contract.connect(otherAccount)
    await instance.burn(owner.address, 0, 1)

    const balance = await contract.balanceOf(owner.address, 0)
    const supply = await contract.currentSupply(0)

    expect(balance).to.equal(0, "Cannot burn (approved)");
    expect(supply).to.equal(49, "Cannot burn (approved)");
    expect(approved).to.equal(true, "Cannot burn (approved)");
  });

  it("Should NOT burn(balance)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await expect(contract.burn(owner.address, 0, 1)).to.be.revertedWithCustomError(contract, "ERC1155InsufficientBalance");
  });

  it("Should NOT burn(permission)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await contract.mint(0, { value: ethers.parseEther("0.01") })
    const instance = contract.connect(otherAccount)

    await expect(instance.burn(owner.address, 0, 1)).to.be.revertedWithCustomError(contract, "ERC1155MissingApprovalForAll");
  });

  it("Should safe transfer from", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await contract.mint(0, { value: ethers.parseEther("0.01") })
    await contract.safeTransferFrom(owner.address, otherAccount.address, 0, 1, "0x00000000")

    const balances = await contract.balanceOfBatch([owner.address, otherAccount], [0, 0])
    const supply = await contract.currentSupply(0)

    expect(balances[0]).to.equal(0, "Cannot safe transfer");
    expect(balances[1]).to.equal(1, "Cannot safe transfer");
    expect(supply).to.equal(49, "Cannot safe transfer");
  });

  it("Should emit transfer from", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await contract.mint(0, { value: ethers.parseEther("0.01") })

    await expect(contract.safeTransferFrom(owner.address, otherAccount.address, 0, 1, "0x00000000")).to.emit(contract, "TransferSingle").withArgs(owner.address, owner.address, otherAccount.address, 0, 1)
  });

  it("Should NOT safe transfer from (balance)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await expect(contract.safeTransferFrom(owner.address, otherAccount.address, 0, 1, "0x00000000")).to.be.revertedWithCustomError(contract, "ERC1155InsufficientBalance");
  });

  it("Should NOT safe transfer from (exists)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await expect(contract.safeTransferFrom(owner.address, otherAccount.address, 10, 1, "0x00000000")).to.be.revertedWithCustomError(contract, "ERC1155InsufficientBalance");
  });

  it("Should NOT safe transfer from (permission)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await contract.mint(0, { value: ethers.parseEther("0.01") })

    const instance = contract.connect(otherAccount)

    await expect(instance.safeTransferFrom(owner.address, otherAccount.address, 10, 1, "0x00000000")).to.be.revertedWithCustomError(contract, "ERC1155MissingApprovalForAll");
  });

  it("Should NOT safeBatchTransferFrom (array mismatch)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await contract.mint(0, { value: ethers.parseEther("0.01") })
    await contract.mint(1, { value: ethers.parseEther("0.01") })


    await expect(contract.safeBatchTransferFrom(owner.address, otherAccount.address, [0, 1], [1], "0x00000000")).to.be.revertedWithCustomError(contract, "ERC1155InvalidArrayLength");
  });

  it("Should NOT safeBatchTransferFrom (permission)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await contract.mint(0, { value: ethers.parseEther("0.01") })
    await contract.mint(1, { value: ethers.parseEther("0.01") })

    const instance = contract.connect(otherAccount)


    await expect(instance.safeBatchTransferFrom(owner.address, otherAccount.address, [0, 1], [1, 1], "0x00000000")).to.be.revertedWithCustomError(contract, "ERC1155MissingApprovalForAll");
  });

  it("Should supports interface", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    const support = await contract.supportsInterface("0xd9b67a26")

    expect(support).to.equal(true, "does not support interface ERC-1155");
  });


  it("Should withdraw", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    const instance = contract.connect(otherAccount)
    await instance.mint(0, { value: ethers.parseEther("0.01") })

    const contractBalanceBefore = await ethers.provider.getBalance(contract)
    const ownerBalanceBefore = await ethers.provider.getBalance(owner)

    await contract.withdraw()

    const contractBalanceAfter = await ethers.provider.getBalance(contract)
    const ownerBalanceAfter = await ethers.provider.getBalance(owner)

    expect(contractBalanceBefore).to.equal(ethers.parseEther("0.01"), "Cannot withdraw");
    expect(contractBalanceAfter).to.equal(0, "Cannot withdraw");
    expect(ownerBalanceAfter).to.greaterThan(ownerBalanceBefore, "Cannot withdraw");
  });

  it("Should NOT withdraw (permission)", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    const instance = contract.connect(otherAccount)

    await expect(instance.withdraw()).to.be.revertedWith("You do not have permission");
  });

  it("Should has uri metadata", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await contract.mint(0, { value: ethers.parseEther("0.01") })

    const uri = await contract.uri(0)

    expect(uri).to.equal("https://gateway.pinata.cloud/ipfs/QmTSewcb5SpTRdGK8rdWWdsFLWSAMcEB3YcNdBhDp3MiSf/0.json", "does not have uri");
  });

  it("Should NOT has uri metadata", async function () {
    const { contract, owner, otherAccount } = await loadFixture(deployFixture);

    await expect(contract.uri(10)).to.be.revertedWith("This token does not exists");
  });
});
