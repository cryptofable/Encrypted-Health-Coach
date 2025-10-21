# Encrypted Health Coach

Encrypted Health Coach is a privacy-first decentralised application that lets individuals encrypt their personal health metrics, store them on-chain through Zama’s Fully Homomorphic Encryption (FHE) stack, and decrypt them locally to receive personalised wellbeing insights. The project combines an FHE-enabled Solidity contract, automation scripts, and a polished React/Vite interface to demonstrate how sensitive healthcare information can be managed securely without compromising usability.

---

## Why This Project Matters

- **Healthcare data deserves zero trust**: Traditional Web2 health applications ask users to trust centralised databases. By encrypting data client-side and storing it on-chain, users retain ownership while benefiting from blockchain transparency.
- **FHE unlocks actionable analytics**: Zama’s FHE tools allow ciphertexts to be processed without leaking plaintext. Users can submit encrypted metrics, keep them confidential, and still decrypt them on demand for analysis.
- **Bridging research and real UX**: The repository showcases an end-to-end workflow—from encryption buffers and ACL enforcement to React components that turn decrypted numbers into meaningful advice—surpassing simple demos or static dashboards.

---

## Key Advantages

- **End-to-end encryption workflow**: Uses `@zama-fhe/relayer-sdk` to encrypt metrics before they ever reach the blockchain and to decrypt them securely with signed EIP-712 requests.
- **User-controlled lifecycle**: Only the owner can update or decrypt their metrics; the contract enforces ACL checks for both the user and dApp contract.
- **Health insights on demand**: Local BMI and blood pressure calculations provide actionable feedback once the data is decrypted, ensuring analytics never leave the user’s device.
- **Production-ready scaffolding**: Includes Hardhat deployment scripts, relayer-aware tasks, and a Vite front end with RainbowKit + viem configuration aimed directly at Sepolia.
- **Strict compliance with privacy constraints**: No mock data, no local storage, no tailwind, and no environment variables in the front end—aligning with stringent security requirements.

---

## What Problems We Solve

1. **Secure storage of personal health metrics**: Height, weight, age, gender, and blood pressure readings are encrypted client-side and stored as ciphertext handles on-chain.
2. **Controlled decryption**: Users can decrypt their own data inside the browser after signing a typed data request; unauthorised parties have no access.
3. **Privacy-preserving analytics**: The front end performs local computations (BMI, hypertension classification) once values are decrypted, avoiding any central processing.
4. **Developer ergonomics for FHE**: Hardhat tasks automate ciphertext creation, submission, and decryption through the FHEVM plugin, lowering the barrier for contributors.
5. **Transparent yet private UX**: Users interact with familiar Web3 tooling (wallet connection, on-chain confirmation) while maintaining confidentiality through FHE.

---

## Technology Stack

- **Smart Contracts**: Solidity (`contracts/EncryptedHealthCoach.sol`) compiled with Hardhat, using Zama’s `@fhevm/solidity` libraries and Sepolia network configuration.
- **Blockchain Tooling**: Hardhat Deploy, `hardhat-vars` for secret management, Sepolia RPC via Infura, and the FHEVM Hardhat plugin for encryption helpers.
- **Frontend**: React + Vite + TypeScript with viem for read operations, ethers v6 for writes, RainbowKit for wallet UX, React Query for data caching, and CSS modules for styling.
- **Encryption SDK**: `@zama-fhe/relayer-sdk` bundle for encryption buffers, EIP-712 signing, and user decryption.
- **Testing & Tasks**: Hardhat test suite, CLI tasks (`task:submit-health`, `task:decrypt-health`) for scripted workflows, and hardhat-gas-reporter / solidity-coverage integrations.

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│            Frontend (Vite)          │
│  • HealthSubmission forms           │
│  • HealthAnalysis decrypts & views  │
│  • RainbowKit + wagmi connection    │
│  • Relayer SDK handles encryption   │
└───────────────────┬─────────────────┘
                    │
        Encrypted handles + ACL proof
                    │
┌───────────────────▼─────────────────┐
│   EncryptedHealthCoach.sol (FHE)    │
│  • Stores euint32 ciphertexts       │
│  • `submitHealthData` via FHE.from  │
│  • ACL permissions with FHE.allow   │
│  • `getEncryptedHealthData` view    │
└───────────────────┬─────────────────┘
                    │
          Decrypt request + proof
                    │
┌───────────────────▼─────────────────┐
│     Zama Relayer & KMS Services     │
│  • Validates signed decrypt intent  │
│  • Re-encrypts for user key pair    │
│  • Returns decrypted bigint payload │
└─────────────────────────────────────┘
```

---

## Detailed Components

### Smart Contract (`contracts/EncryptedHealthCoach.sol`)
- Stores six encrypted `euint32` values plus a timestamp per user.
- Uses `FHE.fromExternal` to import encrypted inputs verified by the relayer.
- Grants ACL permissions with `FHE.allowThis` and `FHE.allow` so both the contract and the user can request decryption.
- Emits `HealthDataUpdated` on every update for indexing or notification workflows.
- Provides `hasHealthRecord` and `getEncryptedHealthData` for read operations.

### Hardhat Configuration & Scripts
- `hardhat.config.ts` expects secrets through `hardhat vars`:
  - `PRIVATE_KEY` (deployer wallet, never mnemonic-based)
  - `INFURA_API_KEY`
  - Optional `ETHERSCAN_API_KEY`
- `deploy/deploy.ts` deploys the contract using `hardhat-deploy`.
- Custom tasks:
  - `task:address`: prints the most recent deployment.
  - `task:submit-health`: exercises encryption and submission via the CLI.
  - `task:decrypt-health`: decrypts stored metrics using the plugin’s helper.

### Frontend (`frontend/`)
- **HealthSubmission**: Validates metric ranges, encrypts them with Zama’s relayer SDK, and sends the transaction through ethers.
- **HealthAnalysis**: Reads ciphertext handles with viem, orchestrates an EIP-712 signed decrypt request, converts returned bigints, and calculates BMI/blood pressure advice.
- **Header & Navigation**: RainbowKit wallet connection, tab navigation between submission and analysis.
- **Styles**: Plain CSS (no Tailwind) scoped per component.
- **Configuration**:
  - `src/config/contracts.ts` holds the Sepolia contract address and ABI copied verbatim from `deployments/sepolia/EncryptedHealthCoach.json`.
  - `src/config/wagmi.ts` uses RainbowKit `getDefaultConfig`; set `projectId` from WalletConnect Cloud before production use.

---

## Getting Started

### Prerequisites
- Node.js ≥ 20
- npm (project uses lockfile to pin dependencies)
- A funded Sepolia account for deployment
- WalletConnect Cloud project ID for the frontend (replace `YOUR_PROJECT_ID`)

### Backend / Contract Setup
1. Install dependencies (root):
   ```bash
   npm install
   ```
2. Configure secrets using Hardhat Vars:
   ```bash
   npx hardhat vars set PRIVATE_KEY
   npx hardhat vars set INFURA_API_KEY
   # Optional:
   npx hardhat vars set ETHERSCAN_API_KEY
   ```
   The private key is used for both local Anvil deployments and Sepolia. No mnemonic support is present.
3. Compile & Test:
   ```bash
   npm run compile
   npm run test
   ```
4. Local FHEVM development (requires FHE-compatible node):
   ```bash
   npx hardhat node
   npx hardhat deploy --network anvil
   ```
5. Deploy to Sepolia:
   ```bash
   npx hardhat deploy --network sepolia
   ```
   The deployment artifacts (ABI, address) are automatically written to `deployments/sepolia`.

### Useful Hardhat Tasks
```bash
# Print deployed address
npx hardhat task:address --network sepolia

# Submit sample encrypted metrics
npx hardhat task:submit-health --network sepolia \
  --height 172 --weight 68 --age 32 --gender 1 --systolic 118 --diastolic 76

# Decrypt stored metrics for verification
npx hardhat task:decrypt-health --network sepolia
```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Update configuration:
   - Replace `YOUR_PROJECT_ID` in `src/config/wagmi.ts` with your WalletConnect ID.
   - Ensure `src/config/contracts.ts` matches the ABI and address in `../deployments/sepolia/EncryptedHealthCoach.json`.
3. Run the app:
   ```bash
   npm run dev
   ```
   Connect with a Sepolia-funded wallet, submit metrics, wait for confirmation, then decrypt them in the **Analyze Health** tab.

---

## Project Structure

```
.
├── contracts/                 # Solidity sources (EncryptedHealthCoach)
├── deploy/                    # hardhat-deploy scripts
├── deployments/               # Generated deployment artifacts (abi, address)
├── docs/                      # Zama relayer and LLM documentation
├── frontend/                  # React + Vite application
│   ├── src/components/        # UI components and containers
│   ├── src/config/            # ABI, addresses, wagmi configuration
│   ├── src/hooks/             # Zama instance + ethers signer hooks
│   └── src/styles/            # CSS modules (no Tailwind)
├── tasks/                     # Custom Hardhat tasks integrating FHEVM plugin
├── test/                      # Solidity test suites
├── hardhat.config.ts          # Network + compiler + plugin config
└── README.md                  # You are here
```

---

## Security & Compliance Notes

- Client-side encryption ensures plaintext metrics never leave the browser.
- On-chain ACL (`FHE.allow`) restricts decryption to the originating wallet and the contract itself.
- Frontend avoids `localStorage`, external environment variables, and Tailwind to comply with security guidelines.
- Deployment relies on a direct private key; mnemonics are intentionally unsupported.
- ABI synchronisation is mandatory: always copy from `deployments/sepolia/EncryptedHealthCoach.json` to the frontend config after redeployment.

---

## Troubleshooting

- **`EncryptedHealthCoach` ABI mismatch**: Re-copy the ABI and address from `deployments/sepolia` into `frontend/src/config/contracts.ts`, restart Vite.
- **`contract.submitHealthData is not a function`**: Indicates the ABI still references an older contract; confirm the deployment artifact.
- **`Decryption failed: ...`**: Ensure the user has submitted data and signed the typed data prompt. Check wallet signature support for EIP-712 and confirm ACL permissions were set by the contract (they are configured in `submitHealthData`).
- **Hardhat `PRIVATE_KEY` missing**: Run `npx hardhat vars list` to confirm values. Hardhat will not read `.env`; use `hardhat vars`.
- **RainbowKit connection issues**: Replace `YOUR_PROJECT_ID` with a valid WalletConnect Cloud project ID and ensure Sepolia is enabled in your wallet.

---

## Future Roadmap

- **Expanded metrics**: Support additional health indicators (resting heart rate, glucose levels) once on-chain storage costs are optimised.
- **Physician sharing model**: Introduce delegated decryption permissions so users can grant temporary read access to healthcare providers.
- **Automated health insights**: Add off-chain or zk-enabled analytics pipelines that leverage decrypted data without exposing it publicly.
- **Mobile-friendly UX**: Refine layout and interactions for smaller screens while keeping security requirements intact.
- **Multi-chain readiness**: Generalise configuration for future FHE-enabled L2s beyond Sepolia, including mainnet-ready deployments.
- **Notification service**: Integrate push notifications or email alerts when new health submissions are recorded.

---

## Contributing

Contributions are welcome. Please fork the repository, create focused branches, and submit pull requests. Follow the existing code style, keep all comments in English, and do not modify `.gitignore`, package manifests, or hooks without prior discussion.

---

## License

Distributed under the BSD-3-Clause-Clear License. See [LICENSE](LICENSE) for full terms.

---

For questions about Zama’s FHE stack, visit the [official documentation](https://docs.zama.ai). For application-specific inquiries or roadmap suggestions, please open an issue or reach out to the maintainers.
