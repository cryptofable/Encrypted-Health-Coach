import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";
import { deployments, ethers, fhevm } from "hardhat";
import { EncryptedHealthCoach } from "../types";

type Signers = {
  alice: HardhatEthersSigner;
};

describe("EncryptedHealthCoachSepolia", function () {
  let signers: Signers;
  let healthContract: EncryptedHealthCoach;
  let healthContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const deployment = await deployments.get("EncryptedHealthCoach");
      healthContractAddress = deployment.address;
      healthContract = await ethers.getContractAt("EncryptedHealthCoach", deployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("submits and decrypts health metrics", async function () {
    steps = 12;

    this.timeout(4 * 40000);

    progress("Encrypting sample metrics...");
    const encryptedMetrics = await fhevm
      .createEncryptedInput(healthContractAddress, signers.alice.address)
      .add32(182)
      .add32(78)
      .add32(34)
      .add32(1)
      .add32(122)
      .add32(82)
      .encrypt();

    progress("Submitting encrypted metrics...");
    const tx = await healthContract
      .connect(signers.alice)
      .submitHealthData(
        encryptedMetrics.handles[0],
        encryptedMetrics.handles[1],
        encryptedMetrics.handles[2],
        encryptedMetrics.handles[3],
        encryptedMetrics.handles[4],
        encryptedMetrics.handles[5],
        encryptedMetrics.inputProof,
      );
    await tx.wait();

    progress("Fetching encrypted data...");
    const [height, weight, age, gender, systolic, diastolic] = await healthContract.getEncryptedHealthData(
      signers.alice.address,
    );

    expect(height).to.not.eq(ethers.ZeroHash);

    progress("Decrypting height...");
    const clearHeight = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      height,
      healthContractAddress,
      signers.alice,
    );

    progress("Decrypting weight...");
    const clearWeight = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      weight,
      healthContractAddress,
      signers.alice,
    );

    progress("Decrypting other metrics...");
    const clearAge = await fhevm.userDecryptEuint(FhevmType.euint32, age, healthContractAddress, signers.alice);
    const clearGender = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      gender,
      healthContractAddress,
      signers.alice,
    );
    const clearSystolic = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      systolic,
      healthContractAddress,
      signers.alice,
    );
    const clearDiastolic = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      diastolic,
      healthContractAddress,
      signers.alice,
    );

    progress("Verifying decrypted values...");
    expect(clearHeight).to.eq(182);
    expect(clearWeight).to.eq(78);
    expect(clearAge).to.eq(34);
    expect(clearGender).to.eq(1);
    expect(clearSystolic).to.eq(122);
    expect(clearDiastolic).to.eq(82);
  });
});
