import { useMemo, useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';

import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import '../styles/HealthAnalysis.css';

type DecryptedMetrics = {
  height: number;
  weight: number;
  age: number;
  gender: number;
  systolic: number;
  diastolic: number;
  updatedAt: number;
};

type HealthInsights = {
  bmi: number;
  bmiCategory: string;
  bmiAdvice: string;
  pressureCategory: string;
  pressureAdvice: string;
};

const genderLabel: Record<number, string> = {
  1: 'Male',
  2: 'Female',
};

type EncryptedHealthTuple = readonly [string, string, string, string, string, string, bigint];

export function HealthAnalysis() {
  const { address } = useAccount();
  const { instance } = useZamaInstance();
  const signer = useEthersSigner();

  const [metrics, setMetrics] = useState<DecryptedMetrics | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isDecrypting, setIsDecrypting] = useState(false);

  const { data: hasRecordData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'hasHealthRecord',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address),
    },
  });

  const hasRecord = Boolean(hasRecordData);

  const encryptedResult = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEncryptedHealthData',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address) && hasRecord,
    },
  });

  const encryptedData = encryptedResult.data as EncryptedHealthTuple | undefined;

  const updatedAt = useMemo(() => {
    if (!encryptedData) {
      return 0;
    }

    const timestamp = Number(encryptedData[6]);
    return Number.isFinite(timestamp) ? timestamp : 0;
  }, [encryptedData]);

  const insights: HealthInsights | null = useMemo(() => {
    if (!metrics) {
      return null;
    }

    const heightMeters = metrics.height > 0 ? metrics.height / 100 : 0;
    const bmi = heightMeters > 0 ? metrics.weight / (heightMeters * heightMeters) : 0;

    let bmiCategory = 'Healthy';
    let bmiAdvice = 'Maintain your current lifestyle with balanced nutrition and regular activity.';

    if (bmi < 18.5) {
      bmiCategory = 'Underweight';
      bmiAdvice = 'Consider increasing calorie intake with nutrient-dense foods and strength training.';
    } else if (bmi >= 25 && bmi < 30) {
      bmiCategory = 'Overweight';
      bmiAdvice = 'Introduce consistent physical activity and focus on whole foods for steady progress.';
    } else if (bmi >= 30) {
      bmiCategory = 'Obesity';
      bmiAdvice = 'Work with a healthcare professional to develop a targeted nutrition and exercise plan.';
    }

    let pressureCategory = 'Normal';
    let pressureAdvice = 'Great job! Maintain healthy habits and regular check-ups.';

    if (metrics.systolic >= 180 || metrics.diastolic >= 120) {
      pressureCategory = 'Hypertensive Crisis';
      pressureAdvice = 'Seek medical attention immediately and monitor readings closely.';
    } else if (metrics.systolic >= 140 || metrics.diastolic >= 90) {
      pressureCategory = 'Stage 2 Hypertension';
      pressureAdvice = 'Consult your doctor for medication review and adhere to a low-sodium diet.';
    } else if (metrics.systolic >= 130 || metrics.diastolic >= 80) {
      pressureCategory = 'Stage 1 Hypertension';
      pressureAdvice = 'Increase aerobic activity, manage stress, and follow your care plan.';
    } else if (metrics.systolic >= 120 && metrics.diastolic < 80) {
      pressureCategory = 'Elevated';
      pressureAdvice = 'Monitor regularly and consider moderating sodium and caffeine intake.';
    }

    return {
      bmi,
      bmiCategory,
      bmiAdvice,
      pressureCategory,
      pressureAdvice,
    };
  }, [metrics]);

  const handleDecrypt = async () => {
    setErrorMessage('');

    if (!instance || !address || !encryptedData) {
      setErrorMessage('Missing prerequisites for decryption.');
      return;
    }

    try {
      setIsDecrypting(true);
      const keypair = instance.generateKeypair();

      const handleContractPairs = Array.from(encryptedData)
        .slice(0, 6)
        .map(handle => ({
          handle,
          contractAddress: CONTRACT_ADDRESS,
        }));

      const startTimestamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = '7';
      const contractAddresses = [CONTRACT_ADDRESS];

      const eip712 = instance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimestamp,
        durationDays
      );

      const resolvedSigner = await signer;
      if (!resolvedSigner) {
        throw new Error('Wallet signer is not available.');
      }

      const signature = await resolvedSigner.signTypedData(
        eip712.domain,
        {
          UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
        },
        eip712.message
      );

      const result = await instance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace('0x', ''),
        contractAddresses,
        address,
        startTimestamp,
        durationDays
      );

      if (!result || typeof result !== 'object') {
        throw new Error('Unexpected decryption response format.');
      }

      const decryptedValues = handleContractPairs.map(({ handle }) => {
        const rawValue = (result as Record<string, unknown>)[handle];
        if (rawValue === undefined || rawValue === null) {
          throw new Error('Missing decrypted value for a ciphertext handle.');
        }
        if (typeof rawValue === 'bigint') {
          return rawValue;
        }
        if (typeof rawValue === 'number') {
          return BigInt(rawValue);
        }
        if (typeof rawValue === 'string') {
          return BigInt(rawValue);
        }
        throw new Error('Unsupported decrypted value type.');
      });

      const [height, weight, age, gender, systolic, diastolic] = decryptedValues.map(value => Number(value));

      setMetrics({
        height,
        weight,
        age,
        gender,
        systolic,
        diastolic,
        updatedAt,
      });
    } catch (decryptError) {
      const message = decryptError instanceof Error ? decryptError.message : 'Unknown error';
      setErrorMessage(`Decryption failed: ${message}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  const formattedUpdatedAt = useMemo(() => {
    if (!updatedAt) {
      return 'Not available';
    }
    return new Date(updatedAt * 1000).toLocaleString();
  }, [updatedAt]);

  return (
    <section className="analysis-card">
      <header className="analysis-header">
        <div>
          <h2 className="analysis-title">Personal Health Analysis</h2>
          <p className="analysis-subtitle">
            Decrypt your metrics with Zama FHE to unlock personalized recommendations generated locally in your browser.
          </p>
        </div>
        <div className="timestamp">
          <span className="timestamp-label">Last updated</span>
          <span className="timestamp-value">{formattedUpdatedAt}</span>
        </div>
      </header>

      {!address ? (
        <div className="analysis-placeholder">
          <p>Please connect your wallet to access encrypted health insights.</p>
        </div>
      ) : !hasRecord ? (
        <div className="analysis-placeholder">
          <p>No health metrics found. Submit your data first to receive tailored insights.</p>
        </div>
      ) : (
        <>
          <div className="overview-grid">
            <div className="overview-item">
              <span className="overview-label">Height</span>
              <span className="overview-value">{metrics ? `${metrics.height} cm` : 'Encrypted'}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Weight</span>
              <span className="overview-value">{metrics ? `${metrics.weight} kg` : 'Encrypted'}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Age</span>
              <span className="overview-value">{metrics ? `${metrics.age}` : 'Encrypted'}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Gender</span>
              <span className="overview-value">
                {metrics ? genderLabel[metrics.gender] ?? 'Other' : 'Encrypted'}
              </span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Systolic</span>
              <span className="overview-value">{metrics ? `${metrics.systolic} mmHg` : 'Encrypted'}</span>
            </div>
            <div className="overview-item">
              <span className="overview-label">Diastolic</span>
              <span className="overview-value">{metrics ? `${metrics.diastolic} mmHg` : 'Encrypted'}</span>
            </div>
          </div>

          {errorMessage && <p className="info-banner error">{errorMessage}</p>}

          {!metrics ? (
            <div className="decrypt-action">
              <p className="decrypt-description">
                Your measurements stay private until you approve decryption. Zama re-encrypts the data for your device
                only.
              </p>
              <button className="decrypt-button" onClick={handleDecrypt} disabled={isDecrypting}>
                {isDecrypting ? 'Decrypting...' : 'Decrypt My Metrics'}
              </button>
            </div>
          ) : (
            <div className="insight-grid">
              <div className="insight-card">
                <span className="insight-label">Body Mass Index</span>
                <div className="insight-value">{insights ? insights.bmi.toFixed(1) : '--'}</div>
                <span className="insight-category">{insights?.bmiCategory}</span>
                <p className="insight-advice">{insights?.bmiAdvice}</p>
              </div>
              <div className="insight-card">
                <span className="insight-label">Blood Pressure</span>
                <div className="insight-value">
                  {metrics.systolic}/{metrics.diastolic}
                </div>
                <span className="insight-category">{insights?.pressureCategory}</span>
                <p className="insight-advice">{insights?.pressureAdvice}</p>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
