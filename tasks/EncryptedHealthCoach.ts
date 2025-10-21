import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:address", "Prints the EncryptedHealthCoach address").setAction(async (_taskArguments: TaskArguments, hre) => {
  const { deployments } = hre;

  const deployment = await deployments.get("EncryptedHealthCoach");

  console.log(`EncryptedHealthCoach address is ${deployment.address}`);
});

task("task:submit-health", "Encrypt and submit sample health metrics")
  .addOptionalParam("address", "Optionally target a deployed contract address")
  .addParam("height", "Height in centimeters")
  .addParam("weight", "Weight in kilograms")
  .addParam("age", "Age in years")
  .addParam("gender", "Gender code (1 male, 2 female)")
  .addParam("systolic", "Systolic blood pressure")
  .addParam("diastolic", "Diastolic blood pressure")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedHealthCoach");

    console.log(`EncryptedHealthCoach: ${deployment.address}`);

    const signers = await ethers.getSigners();
    const caller = signers[0];
    const contract = await ethers.getContractAt("EncryptedHealthCoach", deployment.address);

    const buffer = await fhevm
      .createEncryptedInput(deployment.address, caller.address)
      .add32(parseInt(taskArguments.height))
      .add32(parseInt(taskArguments.weight))
      .add32(parseInt(taskArguments.age))
      .add32(parseInt(taskArguments.gender))
      .add32(parseInt(taskArguments.systolic))
      .add32(parseInt(taskArguments.diastolic))
      .encrypt();

    const tx = await contract
      .connect(caller)
      .submitHealthData(
        buffer.handles[0],
        buffer.handles[1],
        buffer.handles[2],
        buffer.handles[3],
        buffer.handles[4],
        buffer.handles[5],
        buffer.inputProof,
      );

    console.log(`Wait for tx:${tx.hash}...`);
    const receipt = await tx.wait();
    console.log(`tx status: ${receipt?.status}`);
  });

task("task:decrypt-health", "Decrypt stored health metrics")
  .addOptionalParam("address", "Optionally target a deployed contract address")
  .addOptionalParam("user", "User address to decrypt data for")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;

    await fhevm.initializeCLIApi();

    const deployment = taskArguments.address
      ? { address: taskArguments.address }
      : await deployments.get("EncryptedHealthCoach");

    const signers = await ethers.getSigners();
    const targetSigner = taskArguments.user
      ? await ethers.getSigner(taskArguments.user)
      : signers[0];

    const contract = await ethers.getContractAt("EncryptedHealthCoach", deployment.address);

    const [height, weight, age, gender, systolic, diastolic] = await contract.getEncryptedHealthData(
      targetSigner.address,
    );

    const decryptedHeight = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      height,
      deployment.address,
      targetSigner,
    );
    const decryptedWeight = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      weight,
      deployment.address,
      targetSigner,
    );
    const decryptedAge = await fhevm.userDecryptEuint(FhevmType.euint32, age, deployment.address, targetSigner);
    const decryptedGender = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      gender,
      deployment.address,
      targetSigner,
    );
    const decryptedSystolic = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      systolic,
      deployment.address,
      targetSigner,
    );
    const decryptedDiastolic = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      diastolic,
      deployment.address,
      targetSigner,
    );

    console.log(`Decrypted metrics for ${targetSigner.address}`);
    console.log(`Height   : ${decryptedHeight} cm`);
    console.log(`Weight   : ${decryptedWeight} kg`);
    console.log(`Age      : ${decryptedAge} years`);
    console.log(`Gender   : ${decryptedGender}`);
    console.log(`Systolic : ${decryptedSystolic} mmHg`);
    console.log(`Diastolic: ${decryptedDiastolic} mmHg`);
  });
