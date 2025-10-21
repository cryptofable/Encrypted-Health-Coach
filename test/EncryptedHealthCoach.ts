import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { EncryptedHealthCoach, EncryptedHealthCoach__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("EncryptedHealthCoach")) as EncryptedHealthCoach__factory;
  const contract = (await factory.deploy()) as EncryptedHealthCoach;
  const address = await contract.getAddress();

  return { contract, address };
}

describe("EncryptedHealthCoach", function () {
  let signers: Signers;
  let contract: EncryptedHealthCoach;
  let contractAddress: string;

  before(async function () {
    const [deployer, alice] = await ethers.getSigners();
    signers = { deployer, alice };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This hardhat test suite cannot run on Sepolia Testnet");
      this.skip();
    }

    ({ contract, address: contractAddress } = await deployFixture());
  });

  it("should start with no record", async function () {
    const exists = await contract.hasHealthRecord(signers.alice.address);
    expect(exists).to.eq(false);

    const [, , , , , , updatedAt] = await contract.getEncryptedHealthData(signers.alice.address);
    expect(updatedAt).to.eq(0);
  });

  it("stores and decrypts health metrics", async function () {
    const buffer = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(180)
      .add32(75)
      .add32(30)
      .add32(1)
      .add32(120)
      .add32(80)
      .encrypt();

    const tx = await contract
      .connect(signers.alice)
      .submitHealthData(
        buffer.handles[0],
        buffer.handles[1],
        buffer.handles[2],
        buffer.handles[3],
        buffer.handles[4],
        buffer.handles[5],
        buffer.inputProof,
      );
    await tx.wait();

    const existsAfter = await contract.hasHealthRecord(signers.alice.address);
    expect(existsAfter).to.eq(true);

    const [height, weight, age, gender, systolic, diastolic, updatedAt] = await contract.getEncryptedHealthData(
      signers.alice.address,
    );

    expect(updatedAt).to.gt(0);

    const decryptedHeight = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      height,
      contractAddress,
      signers.alice,
    );
    const decryptedWeight = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      weight,
      contractAddress,
      signers.alice,
    );
    const decryptedAge = await fhevm.userDecryptEuint(FhevmType.euint32, age, contractAddress, signers.alice);
    const decryptedGender = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      gender,
      contractAddress,
      signers.alice,
    );
    const decryptedSystolic = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      systolic,
      contractAddress,
      signers.alice,
    );
    const decryptedDiastolic = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      diastolic,
      contractAddress,
      signers.alice,
    );

    expect(decryptedHeight).to.eq(180);
    expect(decryptedWeight).to.eq(75);
    expect(decryptedAge).to.eq(30);
    expect(decryptedGender).to.eq(1);
    expect(decryptedSystolic).to.eq(120);
    expect(decryptedDiastolic).to.eq(80);
  });

  it("overwrites previous metrics on update", async function () {
    const first = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(170)
      .add32(70)
      .add32(28)
      .add32(2)
      .add32(110)
      .add32(70)
      .encrypt();

    await contract
      .connect(signers.alice)
      .submitHealthData(
        first.handles[0],
        first.handles[1],
        first.handles[2],
        first.handles[3],
        first.handles[4],
        first.handles[5],
        first.inputProof,
      );

    const second = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(175)
      .add32(68)
      .add32(29)
      .add32(2)
      .add32(115)
      .add32(72)
      .encrypt();

    await contract
      .connect(signers.alice)
      .submitHealthData(
        second.handles[0],
        second.handles[1],
        second.handles[2],
        second.handles[3],
        second.handles[4],
        second.handles[5],
        second.inputProof,
      );

    const [height] = await contract.getEncryptedHealthData(signers.alice.address);
    const decryptedHeight = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      height,
      contractAddress,
      signers.alice,
    );

    expect(decryptedHeight).to.eq(175);
  });
});
