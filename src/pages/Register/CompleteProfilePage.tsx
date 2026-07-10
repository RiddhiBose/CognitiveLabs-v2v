import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useProfile } from '../../contexts/ProfileContext';
import { ProfileService } from '../../services/profile';
import { ErrorMessage } from '../../components/common';
import { ROUTES, APP_NAME } from '../../constants';
import type { ProfileStep1, ProfileStep2, ProfileStep3, ProfileStep4, ProfileStep5 } from '../../types';

import Step1Personal from './steps/Step1Personal';
import Step2Academic from './steps/Step2Academic';
import Step3Occupation from './steps/Step3Occupation';
import Step4Background from './steps/Step4Background';
import Step5Bio from './steps/Step5Bio';

const TOTAL_STEPS = 5;

export default function CompleteProfilePage() {
  const { user } = useAuth();
  const { refreshProfile } = useProfile();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Accumulated form data across all steps
  const [step1Data, setStep1Data] = useState<ProfileStep1 | null>(null);
  const [step2Data, setStep2Data] = useState<ProfileStep2 | null>(null);
  const [step3Data, setStep3Data] = useState<ProfileStep3 | null>(null);
  const [step4Data, setStep4Data] = useState<ProfileStep4 | null>(null);

  const handleStep1Complete = (data: ProfileStep1) => {
    setStep1Data(data);
    setCurrentStep(2);
  };

  const handleStep2Complete = (data: ProfileStep2) => {
    setStep2Data(data);
    setCurrentStep(3);
  };

  const handleStep3Complete = (data: ProfileStep3) => {
    setStep3Data(data);
    setCurrentStep(4);
  };

  const handleStep4Complete = (data: ProfileStep4) => {
    setStep4Data(data);
    setCurrentStep(5);
  };

  const handleStep5Complete = async (data: ProfileStep5) => {
    if (!user) return;
    setError(null);
    setSubmitting(true);

    const profilePayload = {
      ...step1Data,
      ...step2Data,
      ...step3Data,
      ...step4Data,
      ...data,
    };

    // Check if profile exists already
    const exists = await ProfileService.profileExists(user.id);
    let result;

    if (exists) {
      result = await ProfileService.updateProfile(user.id, {
        ...profilePayload,
        is_profile_complete: true,
      });
    } else {
      result = await ProfileService.createProfile(user.id, user.email ?? '', profilePayload);
      if (!result.error) {
        await ProfileService.markProfileComplete(user.id);
      }
    }

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    await refreshProfile();
    navigate(ROUTES.DASHBOARD, { replace: true });
  };

  const goBack = () => {
    if (currentStep > 1) setCurrentStep((s) => s - 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-lg px-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-primary">{APP_NAME}</h1>
          <h2 className="mt-2 text-2xl font-bold text-gray-800">Complete Your Profile</h2>
          <p className="mt-1 text-sm text-gray-500">
            Help us personalize your experience. Step {currentStep} of {TOTAL_STEPS}.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-2 w-full rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
          />
        </div>

        <ErrorMessage message={error} className="mb-4" />

        {/* Step containers */}
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {currentStep === 1 && (
            <Step1Personal
              initialData={step1Data}
              onComplete={handleStep1Complete}
            />
          )}
          {currentStep === 2 && (
            <Step2Academic
              initialData={step2Data}
              onComplete={handleStep2Complete}
              onBack={goBack}
            />
          )}
          {currentStep === 3 && (
            <Step3Occupation
              initialData={step3Data}
              onComplete={handleStep3Complete}
              onBack={goBack}
            />
          )}
          {currentStep === 4 && (
            <Step4Background
              initialData={step4Data}
              onComplete={handleStep4Complete}
              onBack={goBack}
            />
          )}
          {currentStep === 5 && (
            <Step5Bio
              onComplete={handleStep5Complete}
              onBack={goBack}
              submitting={submitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
