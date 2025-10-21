import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedHealthCoach = await deploy("EncryptedHealthCoach", {
    from: deployer,
    log: true,
  });

  console.log(`EncryptedHealthCoach contract: `, deployedHealthCoach.address);
};
export default func;
func.id = "deploy_encryptedHealthCoach"; // id required to prevent reexecution
func.tags = ["EncryptedHealthCoach"];
