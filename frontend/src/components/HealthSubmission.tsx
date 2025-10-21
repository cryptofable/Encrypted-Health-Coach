import { useState } from 'react';
import { Contract } from 'ethers';
import { useAccount } from 'wagmi';

import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../config/contracts';
import { useEthersSigner } from '../hooks/useEthersSigner';
import { useZamaInstance } from '../hooks/useZamaInstance';
import '../styles/HealthSubmission.css';

type FieldName = 'height' | 'weight' | 'age' | 'gender' | 'systolic' | 'diastolic';

type FormState = Record<FieldName, string>;

const initialState: FormState = {
  height: '',
  weight: '',
  age: '',
  gender: '1',
  systolic: '',
  diastolic: '',
};

export function HealthSubmission() {
  const { address, isConnected } = useAccount();
  const { instance, isLoading: isZamaLoading, error } = useZamaInstance();
  const signerPromise = useEthersSigner();

  const [formData, setFormData] = useState<FormState>(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const updateField = (field: FieldName, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const resetStatus = () => {
    setStatusMessage('');
    setSuccessMessage('');
  };

  const validateInputs = (): number[] | null => {
    const height = parseInt(formData.height, 10);
    const weight = parseInt(formData.weight, 10);
    const age = parseInt(formData.age, 10);
    const gender = parseInt(formData.gender, 10);
    const systolic = parseInt(formData.systolic, 10);
    const diastolic = parseInt(formData.diastolic, 10);

    if ([height, weight, age, gender, systolic, diastolic].some(value => !Number.isFinite(value))) {
      setStatusMessage('All fields must be valid numbers.');
      return null;
    }

    if (height <= 0 || height > 280) {
      setStatusMessage('Height must be between 1 and 280 centimeters.');
      return null;
    }

    if (weight <= 0 || weight > 400) {
      setStatusMessage('Weight must be between 1 and 400 kilograms.');
      return null;
    }

    if (age <= 0 || age > 120) {
      setStatusMessage('Age must be between 1 and 120 years.');
      return null;
    }

    if (![1, 2].includes(gender)) {
      setStatusMessage('Gender must be 1 for male or 2 for female.');
      return null;
    }

    if (systolic < 60 || systolic > 250 || diastolic < 40 || diastolic > 200) {
      setStatusMessage('Blood pressure values look incorrect.');
      return null;
    }

    return [height, weight, age, gender, systolic, diastolic];
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    resetStatus();

    if (!isConnected) {
      setStatusMessage('Connect your wallet to save health metrics.');
      return;
    }

    if (!instance || !address || !signerPromise) {
      setStatusMessage('Encryption service or signer is not ready yet.');
      return;
    }

    const numericValues = validateInputs();
    if (!numericValues) {
      return;
    }

    try {
      setIsSubmitting(true);
      setStatusMessage('Encrypting metrics with Zama...');

      const signer = await signerPromise;

      const buffer = instance.createEncryptedInput(CONTRACT_ADDRESS, address);
      for (const value of numericValues) {
        buffer.add32(value);
      }

      const encryptedInput = await buffer.encrypt();

      const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      setStatusMessage('Submitting encrypted metrics to the blockchain...');
      const tx = await contract.submitHealthData(
        encryptedInput.handles[0],
        encryptedInput.handles[1],
        encryptedInput.handles[2],
        encryptedInput.handles[3],
        encryptedInput.handles[4],
        encryptedInput.handles[5],
        encryptedInput.inputProof
      );

      setStatusMessage('Waiting for transaction confirmation...');
      await tx.wait();

      setSuccessMessage('Health metrics encrypted and saved successfully.');
      setStatusMessage('');
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : 'Unknown error';
      setStatusMessage(`Submission failed: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="health-card">
      <div className="card-header">
        <h2 className="card-title">Encrypted Health Metrics</h2>
        <p className="card-description">
          Provide accurate measurements to keep your personal health coach up to date. All numbers are encrypted
          locally before they reach the blockchain.
        </p>
      </div>

      <form className="health-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="form-field">
            <span className="form-label">Height (cm)</span>
            <input
              className="form-input"
              type="number"
              min="100"
              max="250"
              step="1"
              value={formData.height}
              onChange={event => updateField('height', event.target.value)}
              placeholder="e.g. 172"
              required
            />
          </label>

          <label className="form-field">
            <span className="form-label">Weight (kg)</span>
            <input
              className="form-input"
              type="number"
              min="30"
              max="250"
              step="1"
              value={formData.weight}
              onChange={event => updateField('weight', event.target.value)}
              placeholder="e.g. 68"
              required
            />
          </label>

          <label className="form-field">
            <span className="form-label">Age (years)</span>
            <input
              className="form-input"
              type="number"
              min="1"
              max="120"
              value={formData.age}
              onChange={event => updateField('age', event.target.value)}
              placeholder="e.g. 32"
              required
            />
          </label>

          <label className="form-field">
            <span className="form-label">Gender</span>
            <select
              className="form-input"
              value={formData.gender}
              onChange={event => updateField('gender', event.target.value)}
              required
            >
              <option value="1">Male (1)</option>
              <option value="2">Female (2)</option>
            </select>
          </label>

          <label className="form-field">
            <span className="form-label">Systolic Blood Pressure (mmHg)</span>
            <input
              className="form-input"
              type="number"
              min="60"
              max="250"
              value={formData.systolic}
              onChange={event => updateField('systolic', event.target.value)}
              placeholder="e.g. 118"
              required
            />
          </label>

          <label className="form-field">
            <span className="form-label">Diastolic Blood Pressure (mmHg)</span>
            <input
              className="form-input"
              type="number"
              min="40"
              max="200"
              value={formData.diastolic}
              onChange={event => updateField('diastolic', event.target.value)}
              placeholder="e.g. 76"
              required
            />
          </label>
        </div>

        {error && <p className="info-banner error">{error}</p>}
        {statusMessage && <p className="info-banner status">{statusMessage}</p>}
        {successMessage && <p className="info-banner success">{successMessage}</p>}

        <div className="form-actions">
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting || isZamaLoading}
          >
            {isZamaLoading ? 'Initializing encryption...' : isSubmitting ? 'Saving metrics...' : 'Save Encrypted Metrics'}
          </button>
        </div>
      </form>
    </section>
  );
}
